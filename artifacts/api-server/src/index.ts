// MUST stay the first import: loads .env and validates DATABASE_URL / SESSION_SECRET
// before any module that reads process.env (e.g. @workspace/db) is evaluated.
import { env } from "./env";
import { pool } from "@workspace/db";
import app from "./app";
import { logger } from "./lib/logger";
import { ensureUploadsDir } from "./lib/storage";

async function main() {
  await ensureUploadsDir();

  if (!env.adminPassword) {
    logger.warn("ADMIN_PASSWORD is not set - admin login is disabled until you add it to .env");
  }

  const server = env.host
    ? app.listen(env.port, env.host)
    : app.listen(env.port);

  server.on("listening", () => {
    logger.info(
      { port: env.port, env: env.nodeEnv, envFiles: env.envFiles },
      `Server listening on http://localhost:${env.port}`,
    );
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`Port ${env.port} is already in use. Stop the other process or change PORT in .env`);
    } else {
      logger.error({ err }, "Server error");
    }
    process.exit(1);
  });

  // Fail loudly (but don't crash) if the database is unreachable at boot.
  pool
    .query("select 1")
    .then(() => logger.info("Database connection OK"))
    .catch((err: Error) =>
      logger.error(
        { err: err.message },
        "Database connection FAILED - check DATABASE_URL (Neon URL needs ?sslmode=require)",
      ),
    );

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
