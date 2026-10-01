import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set (add it to the repo-root .env file; see .env.example).",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  // Neon (serverless Postgres) closes idle connections and may suspend after inactivity.
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
  keepAlive: true,
});

// Without this listener an error on an idle client (e.g. Neon dropping the socket)
// is an unhandled 'error' event and crashes the whole Node process.
pool.on("error", (err) => {
  console.error("[db] idle client error:", err.message);
});
export const db = drizzle(pool, { schema });

export * from "./schema";
