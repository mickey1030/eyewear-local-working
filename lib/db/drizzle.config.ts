import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import path from "node:path";

// drizzle-kit is always launched through `pnpm --filter @workspace/db ...`, so the cwd is lib/db.
// Load the repo-root .env (single source of truth), then lib/db/.env as an optional override.
dotenv.config({ path: path.resolve(process.cwd(), "../../.env"), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Create <repo root>/.env (copy .env.example) with your Neon connection string.",
  );
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
