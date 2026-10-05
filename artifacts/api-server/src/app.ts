import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "./env";
import router from "./routes";
import adminRouter from "./routes/admin";
import uploadRouter from "./routes/upload";
import seoRouter from "./routes/seo";
import ordersRouter from "./routes/orders";
import exportRouter from "./routes/export";
import { logger } from "./lib/logger";
import { uploadPath, r2PublicFileUrl } from "./lib/storage";

const app: Express = express();
if (env.trustProxy) app.set("trust proxy", true);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// In dev the Vite proxy makes everything same-origin, so CORS is only needed if you call the
// API from another origin. Set CORS_ORIGINS=http://localhost:5173,https://shop.example.com
// to allow specific origins; in production nothing cross-origin is allowed by default.
app.use(
  cors({
    origin: env.corsOrigins.length ? env.corsOrigins : !env.isProduction,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.sessionSecret));

// Serve uploaded images from local disk (/api/uploads/:filename) — same URL shape the
// database image_url values already use.
app.get("/api/uploads/:filename", (req: Request, res: Response) => {
  const full = uploadPath(String(req.params.filename));
  if (!full) {
    res.status(400).json({ error: "Invalid file name" });
    return;
  }
  // R2 mode: images live in the bucket, so send the browser there.
  const r2Url = r2PublicFileUrl(String(req.params.filename));
  if (r2Url) {
    res.redirect(302, r2Url);
    return;
  }
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.sendFile(full, (err) => {
    if (err && !res.headersSent) {
      res.removeHeader("Cache-Control");
      res.status(404).json({ error: "Image not found" });
    }
  });
});

app.get("/api", (_req, res) => res.json({ status: "ok" }));
app.use(adminRouter);
app.use(seoRouter);
app.use("/api", uploadRouter);
app.use("/api", ordersRouter);
app.use("/api", exportRouter);
app.use("/api", router);

// Unknown /api routes -> JSON 404 (instead of Express' HTML page)
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Central error handler (Express 5 forwards rejected async handlers here too)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, url: req.url }, "Unhandled request error");
  if (res.headersSent) return;
  const status =
    typeof (err as { status?: unknown })?.status === "number"
      ? (err as { status: number }).status
      : 500;
  res.status(status).json({ error: status >= 500 ? "Internal server error" : (err as Error).message });
});

export default app;
