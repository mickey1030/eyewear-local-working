import { gzip } from "node:zlib";
import { promisify } from "node:util";
import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const gzipAsync = promisify(gzip);

interface Entry {
  json: Buffer;
  gz: Buffer;
  etag: string;
  expiresAt: number;
}

/**
 * In-memory cache for a read-heavy JSON endpoint.
 *  - the query runs at most once per `ttlMs` (concurrent requests share one query)
 *  - the JSON is serialized + gzipped once per refresh, not once per request
 *  - ETag support: browsers that already have the data get a tiny 304 instead of the full body
 *  - if the database fails but we still hold an older copy, that copy is served instead of an error
 * Call invalidate() after any write so admins see their changes immediately.
 */
export function createJsonCache(loader: () => Promise<unknown>, ttlMs = 60_000) {
  let entry: Entry | null = null;
  let inflight: Promise<Entry> | null = null;

  async function refresh(): Promise<Entry> {
    const data = await loader();
    const json = Buffer.from(JSON.stringify(data));
    const gz = await gzipAsync(json);
    const etag = `"${crypto.createHash("sha1").update(json).digest("base64url")}"`;
    return { json, gz, etag, expiresAt: Date.now() + ttlMs };
  }

  async function get(): Promise<Entry> {
    if (entry && entry.expiresAt > Date.now()) return entry;
    if (!inflight) {
      inflight = refresh()
        .then((e) => (entry = e))
        .finally(() => {
          inflight = null;
        });
    }
    try {
      return await inflight;
    } catch (err) {
      if (entry) return entry; // serve stale copy rather than failing the page
      throw err;
    }
  }

  function invalidate() {
    if (entry) entry.expiresAt = 0;
  }

  function handler() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const e = await get();
        res.setHeader("ETag", e.etag);
        res.setHeader("Cache-Control", "no-cache"); // always revalidate; 304 keeps it cheap
        res.setHeader("Vary", "Accept-Encoding");
        if (req.headers["if-none-match"] === e.etag) {
          res.status(304).end();
          return;
        }
        res.type("application/json");
        if (/\bgzip\b/.test(String(req.headers["accept-encoding"] ?? ""))) {
          res.setHeader("Content-Encoding", "gzip");
          res.send(e.gz);
        } else {
          res.send(e.json);
        }
      } catch (err) {
        next(err);
      }
    };
  }

  return { handler, invalidate };
}
