// One-off importer: loads a products CSV exported from the old Replit database into Neon.
//
// Usage (from the repo root, after `pnpm install` and `pnpm db:migrate`):
//   pnpm --filter @workspace/db run import:products -- "C:\path\to\products.csv"
//
// - Keeps the original id and code of every product (orders/links stay valid).
// - Safe to re-run: rows whose id already exists are skipped.
// - Everything runs in ONE transaction: either all rows are imported or none.
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env"), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });

const file = process.argv.slice(2).find((a) => a !== "--");
if (!file) {
  console.error('Usage: pnpm --filter @workspace/db run import:products -- "path\\to\\products.csv"');
  process.exit(1);
}
const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is not set. Check your repo-root .env file.");
  process.exit(1);
}

// Minimal RFC-4180 CSV parser (handles quoted fields, "" escapes, embedded commas/newlines).
function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const [header, ...data] = parseCsv(fs.readFileSync(file, "utf8"));
const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
for (const need of ["id", "name", "price", "image_url", "color", "brand", "variant", "image_urls", "code", "created_at"]) {
  if (!(need in idx)) { console.error(`CSV is missing the "${need}" column.`); process.exit(1); }
}
const get = (r, k) => {
  const v = r[idx[k]];
  return v === undefined || v === "" ? null : v;
};

const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 20000 });
await client.connect();
try {
  await client.query("BEGIN");
  let inserted = 0;
  for (const r of data) {
    // created_at in the export looks like "2026-09-07T00:20:35.629Z" (with literal quotes) — strip them.
    const created = (get(r, "created_at") ?? "").replace(/^"+|"+$/g, "") || null;
    const imageUrls = get(r, "image_urls") ?? "[]";
    JSON.parse(imageUrls); // fail early on malformed JSON
    const res = await client.query(
      `INSERT INTO products (id, code, name, price, image_url, image_urls, color, brand, variant, created_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,COALESCE($10::timestamptz, now()))
       ON CONFLICT (id) DO NOTHING`,
      [
        Number(get(r, "id")), get(r, "code") === null ? null : Number(get(r, "code")),
        get(r, "name"), get(r, "price"), get(r, "image_url"), imageUrls,
        get(r, "color"), get(r, "brand"), get(r, "variant"), created,
      ],
    );
    inserted += res.rowCount ?? 0;
  }
  // Move the sequences past the imported values so NEW products don't collide with old ids/codes.
  await client.query(`SELECT setval(pg_get_serial_sequence('products','id'), GREATEST((SELECT COALESCE(MAX(id),1) FROM products), 1))`);
  await client.query(`SELECT setval('products_code_seq', GREATEST((SELECT COALESCE(MAX(code),999) FROM products), 999))`);
  await client.query("COMMIT");
  const { rows } = await client.query("SELECT count(*)::int AS n FROM products");
  console.log(`Done. CSV rows: ${data.length}, newly inserted: ${inserted}, total in database now: ${rows[0].n}`);
} catch (e) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Import failed, nothing was changed:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
