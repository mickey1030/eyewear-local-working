import { Router, type Request } from "express";
import { db, productsTable } from "@workspace/db";
import { ALL_PRODUCTS, CATEGORY_SUBCATEGORIES, BRAND_TO_CATEGORY } from "@workspace/catalog";

const seoRouter: Router = Router();

function getBaseUrl(req: Request): string {
  // Prefer an explicit public origin (set SITE_ORIGIN in .env) so the Host header can't poison the sitemap.
  const configured = process.env.SITE_ORIGIN?.trim().replace(/\/$/, "");
  if (configured) return configured;
  const host = req.get("host") ?? "localhost";
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  const protocol = isLocal ? req.protocol : "https";
  return `${protocol}://${host}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

seoRouter.get("/sitemap.xml", async (req, res, next) => {
  try {
    const base = getBaseUrl(req);
    const paths: string[] = ["/"];

    for (const [category, subcategories] of Object.entries(CATEGORY_SUBCATEGORIES)) {
      paths.push(`/category/${category}`);
      for (const sub of subcategories) {
        paths.push(`/category/${category}/${sub.toLowerCase()}`);
      }
    }

    for (const product of ALL_PRODUCTS) {
      paths.push(`/product/${product.id}`);
    }

    const dbProducts = await db.select().from(productsTable);
    for (const product of dbProducts) {
      if (product.brand && BRAND_TO_CATEGORY[product.brand]) {
        paths.push(`/product/db-${product.id}`);
      }
    }

    // Every route also has a dedicated, prerendered Arabic variant under
    // `/ar/...` (see artifacts/ashraf-monir/scripts/prerender.mjs), so list
    // both language URLs with hreflang alternates for correct indexing.
    const urlEntries = paths.map((p) => {
      const enPath = p;
      const arPath = p === "/" ? "/ar" : `/ar${p}`;
      return { enPath, arPath };
    });

    const urlXml = urlEntries
      .flatMap(({ enPath, arPath }) => [
        `  <url>\n` +
          `    <loc>${escapeXml(`${base}${enPath}`)}</loc>\n` +
          `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(`${base}${enPath}`)}" />\n` +
          `    <xhtml:link rel="alternate" hreflang="ar" href="${escapeXml(`${base}${arPath}`)}" />\n` +
          `  </url>`,
        `  <url>\n` +
          `    <loc>${escapeXml(`${base}${arPath}`)}</loc>\n` +
          `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(`${base}${enPath}`)}" />\n` +
          `    <xhtml:link rel="alternate" hreflang="ar" href="${escapeXml(`${base}${arPath}`)}" />\n` +
          `  </url>`,
      ])
      .join("\n");

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
      urlXml +
      `\n</urlset>\n`;

    res.type("application/xml").send(xml);
  } catch (err) {
    next(err);
  }
});

seoRouter.get("/robots.txt", (req, res) => {
  const base = getBaseUrl(req);
  res
    .type("text/plain")
    .send(`User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
});

export default seoRouter;
