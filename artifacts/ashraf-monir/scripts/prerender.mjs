// Static-site-generation (SSG) step run after the client + SSR builds.
//
// For each crawlable storefront route (home, category, subcategory, product
// — in both English and Arabic) this renders the real React markup to a
// string via `entry-server.js` and writes it as its own `index.html` under
// `dist/public/<route>/index.html`. The static file host serves that file
// directly for the matching path, so crawlers (and users) get full content
// and per-page metadata on the very first response — no client-side
// rendering required. Any route that isn't prerendered (cart, checkout,
// admin, order confirmation, unknown ids, etc.) keeps falling back to the
// plain `app-shell.html` SPA shell via the artifact's rewrite rule.
import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(root, "dist/public");
const serverEntry = path.join(root, "dist/server/entry-server.js");

const template = await readFile(path.join(publicDir, "index.html"), "utf-8");

// The client shell (no SSR content) used as the SPA fallback target for
// every route that isn't prerendered. Written before we start overwriting
// index.html with prerendered page content.
const shellHtml = template
  .replace("<!--ssr-head-->", "")
  .replace("<!--ssr-html-->", "");
await writeFile(path.join(publicDir, "app-shell.html"), shellHtml, "utf-8");

const { render, getStaticRoutes } = await import(serverEntry);

const defaultHeadBlockRe = /<!--default-head-start-->[\s\S]*?<!--default-head-end-->/;

function injectPage(routePath, html, head) {
  const isAr = routePath === "/ar" || routePath.startsWith("/ar/");
  const page = template
    .replace(defaultHeadBlockRe, "")
    .replace("<!--ssr-head-->", head)
    .replace("<!--ssr-html-->", html)
    .replace('<div id="root">', `<div id="root" data-ssr-path="${routePath}">`)
    .replace('<html lang="en">', `<html lang="${isAr ? "ar" : "en"}" dir="${isAr ? "rtl" : "ltr"}">`);
  return page;
}

async function writeRoute(routePath) {
  const { html, head } = render(routePath);
  const page = injectPage(routePath, html, head);

  if (routePath === "/") {
    await writeFile(path.join(publicDir, "index.html"), page, "utf-8");
    return;
  }

  const outDir = path.join(publicDir, routePath.replace(/^\//, ""));
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, "index.html"), page, "utf-8");
}

const neutralRoutes = getStaticRoutes();
const allRoutes = neutralRoutes.flatMap((route) => [
  route,
  route === "/" ? "/ar" : `/ar${route}`,
]);

console.log(`[prerender] generating ${allRoutes.length} static routes...`);
for (const route of allRoutes) {
  await writeRoute(route);
}
console.log(`[prerender] done.`);
