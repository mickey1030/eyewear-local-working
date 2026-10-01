import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import path from "path";
import { requireAdmin } from "../middleware/requireAdmin";
import { saveUpload } from "../lib/storage";
import { logger } from "../lib/logger";

// Keep the file in memory, then write it to the local uploads folder (see lib/storage.ts).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

const router = Router();

router.post(
  "/upload",
  requireAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("image")(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        const message =
          err.code === "LIMIT_FILE_SIZE"
            ? "Image is too large. Maximum size is 10MB."
            : err.message;
        res.status(413).json({ error: message });
        return;
      }
      if (err instanceof Error) {
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    // Only trust a short alphanumeric extension; otherwise derive one from the MIME type.
    const rawExt = path.extname(req.file.originalname).toLowerCase();
    const mimeExt = "." + (req.file.mimetype.split("/")[1] ?? "img").replace(/[^a-z0-9]/gi, "").slice(0, 5);
    const ext = /^\.[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : mimeExt;
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    try {
      await saveUpload(filename, req.file.buffer);
      res.json({ url: `/api/uploads/${filename}` });
    } catch (err) {
      logger.error({ err }, "Upload failed");
      res.status(500).json({ error: "Failed to upload image" });
    }
  },
);

export default router;
