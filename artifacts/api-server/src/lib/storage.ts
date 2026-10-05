/**
 * Storage for uploaded product images.
 *
 * - If R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET are set, files are
 *   stored in Cloudflare R2 (persistent; this is what production on Render should use).
 * - Otherwise files go to the local disk folder (artifacts/api-server/uploads, or UPLOADS_DIR),
 *   which is fine for local development but is wiped on every Render deploy/restart.
 *
 * Either way the public URL stays /api/uploads/<filename>, so existing DB rows keep working.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../env";

const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export const r2Enabled = Boolean(
  env.r2.accountId && env.r2.accessKeyId && env.r2.secretAccessKey && env.r2.bucket,
);

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.r2.accessKeyId,
        secretAccessKey: env.r2.secretAccessKey,
      },
      maxAttempts: 4,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return client;
}

/** Public URL of an uploaded file in R2, or null when R2 isn't configured for public reads. */
export function r2PublicFileUrl(filename: string): string | null {
  if (!r2Enabled || !env.r2.publicUrl || !SAFE_NAME.test(filename)) return null;
  return `${env.r2.publicUrl}/${encodeURIComponent(filename)}`;
}

export async function ensureUploadsDir(): Promise<void> {
  if (r2Enabled) return;
  await fs.mkdir(env.uploadsDir, { recursive: true });
}

/** Returns an absolute path inside the uploads dir, or null if the name is unsafe. */
export function uploadPath(filename: string): string | null {
  if (!SAFE_NAME.test(filename) || filename.includes("..")) return null;
  const full = path.join(env.uploadsDir, filename);
  return full.startsWith(env.uploadsDir + path.sep) ? full : null;
}

export async function saveUpload(filename: string, data: Buffer): Promise<void> {
  if (!SAFE_NAME.test(filename) || filename.includes("..")) {
    throw new Error("Unsafe upload filename");
  }
  if (r2Enabled) {
    await getClient().send(
      new PutObjectCommand({
        Bucket: env.r2.bucket,
        Key: filename,
        Body: data,
        ContentType: CONTENT_TYPES[path.extname(filename).toLowerCase()] ?? "application/octet-stream",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return;
  }
  const full = uploadPath(filename);
  if (!full) throw new Error("Unsafe upload filename");
  await ensureUploadsDir();
  await fs.writeFile(full, data);
}
