/**
 * Environment loading + validation.
 *
 * IMPORTANT: this must be the FIRST import of the entry point (see src/index.ts),
 * because `@workspace/db` reads DATABASE_URL at import time.
 *
 * Load order (first value wins, real process env always wins over files):
 *   1. artifacts/api-server/.env   (optional, per-service overrides)
 *   2. <repo root>/.env            (recommended single place for secrets)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Works for both src/env.ts (tsx) and dist/index.mjs (esbuild bundle): both live
// exactly one directory below the api-server package directory.
const here = path.dirname(fileURLToPath(import.meta.url));
export const API_DIR = path.resolve(here, "..");
export const REPO_ROOT = path.resolve(API_DIR, "..", "..");

const loaded: string[] = [];
for (const file of [path.join(API_DIR, ".env"), path.join(REPO_ROOT, ".env")]) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file, quiet: true }); // never overrides an already-set variable
    loaded.push(file);
  }
}

const problems: string[] = [];

function required(name: string, hint: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    problems.push(`  - ${name} is missing. ${hint}`);
    return "";
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? "development";

const databaseUrl = required(
  "DATABASE_URL",
  "Example: postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/DBNAME?sslmode=require",
);
if (databaseUrl && !/^postgres(ql)?:\/\//i.test(databaseUrl)) {
  problems.push(
    '  - DATABASE_URL must start with "postgresql://" (remove any surrounding quotes or the "psql " prefix copied from the Neon dashboard).',
  );
}

const sessionSecret = required(
  "SESSION_SECRET",
  'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
);

if (problems.length > 0) {
  const where = loaded.length
    ? `Loaded: ${loaded.join(", ")}`
    : `No .env file found. Create ${path.join(REPO_ROOT, ".env")} (copy .env.example).`;
  // eslint-disable-next-line no-console
  console.error(`\nInvalid environment configuration:\n${problems.join("\n")}\n\n${where}\n`);
  process.exit(1);
}

const rawPort = process.env.PORT?.trim() || "8080";
const port = Number(rawPort);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  // eslint-disable-next-line no-console
  console.error(`\nInvalid PORT value: "${rawPort}" (expected 1-65535)\n`);
  process.exit(1);
}

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port,
  host: process.env.HOST?.trim() || undefined,
  databaseUrl,
  sessionSecret,
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  corsOrigins: (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  trustProxy: process.env.TRUST_PROXY === "true",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  uploadsDir: path.resolve(API_DIR, process.env.UPLOADS_DIR?.trim() || "uploads"),
  envFiles: loaded,
};
