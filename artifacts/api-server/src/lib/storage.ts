/**
 * Local-disk storage for uploaded product images (replaces the Replit/GCS object storage).
 * Files live in artifacts/api-server/uploads/ (override with UPLOADS_DIR) and keep the
 * same public URL shape as before: /api/uploads/<filename>, so existing DB rows still work.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../env";

const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export async function ensureUploadsDir(): Promise<void> {
  await fs.mkdir(env.uploadsDir, { recursive: true });
}

/** Returns an absolute path inside the uploads dir, or null if the name is unsafe. */
export function uploadPath(filename: string): string | null {
  if (!SAFE_NAME.test(filename) || filename.includes("..")) return null;
  const full = path.join(env.uploadsDir, filename);
  return full.startsWith(env.uploadsDir + path.sep) ? full : null;
}

export async function saveUpload(filename: string, data: Buffer): Promise<void> {
  const full = uploadPath(filename);
  if (!full) throw new Error("Unsafe upload filename");
  await ensureUploadsDir();
  await fs.writeFile(full, data);
}
