# Migration notes (Replit -> local Windows)

## Removed
`.replit`, `.replitignore`, `.agents/`, `.config/`, `scripts/post-merge.sh`, `artifacts/*/.replit-artifact/`,
`artifacts/ashraf-monir-mobile` (empty Expo stub), `artifacts/mockup-sandbox` (Replit design-canvas tool), `replit.md`,
all `@replit/*` Vite plugins, Replit object-storage sidecar (`gcsClient.ts`), `@google-cloud/storage`, `google-auth-library`,
`mime-types`, `esbuild-plugin-pino`, `thread-stream`, committed `*.tsbuildinfo` / `lib/*/dist`.

## Windows / tooling fixes
* `preinstall` used `sh -c 'rm ...'` -> replaced by `scripts/require-pnpm.mjs` (pure Node).
* `api-server` `dev` used `export NODE_ENV=...` -> `cross-env` + `tsx watch`; `start` also uses `cross-env`.
* `pnpm-workspace.yaml` overrides **deleted the win32 binaries** of esbuild, rollup, lightningcss and tailwind-oxide.
  Removed; esbuild is still pinned to one version (0.28.1) so tsx / drizzle-kit / vite / build.mjs always agree.
  `pnpm-lock.yaml` was regenerated and now contains the win32 packages.
* `drizzle.config.ts` used `__dirname` (undefined in ESM) and threw without `DATABASE_URL`; now loads `.env` and uses relative paths.
* `.gitattributes` added (LF everywhere) and `.env` is git-ignored.

## Env / startup
* New `src/env.ts` (first import of `src/index.ts`): loads `<root>/.env`, validates `DATABASE_URL` + `SESSION_SECRET` with readable errors.
  `PORT` defaults to 8080 instead of throwing. `index.ts` calls `app.listen(PORT)`, reports DB connectivity, handles EADDRINUSE and SIGINT/SIGTERM.
* Vite no longer requires `PORT` / `BASE_PATH`; uses `WEB_PORT` (5173) and a `/api` proxy. `VITE_SITE_ORIGIN` replaces the hard-coded `replit.app` SEO origin.

## Bugs fixed
* `products_code_seq` was never created by `drizzle-kit push` -> inserting a product failed on a fresh DB. Added an idempotent first migration (`lib/db/drizzle/0000_init.sql`).
* Uploads/serving used Replit-only GCS -> local disk (`uploads/`), with filename sanitising (path traversal) and extension whitelist.
* `pg` Pool had no `error` handler: Neon dropping an idle socket crashed Node. Added handler + keep-alive/timeouts.
* `GET /api/orders/track` loaded every order and item into memory -> SQL filters; admin order list only loads items for listed orders.
* Order creation accepted NaN amounts (500 from Postgres) -> 400 validation.
* Admin login: constant-time compare, disabled when `ADMIN_PASSWORD` is unset; cookie options reused for logout; optional `COOKIE_SECURE`.
* CORS no longer reflects any origin in production; JSON 404 for unknown `/api/*`; central JSON error handler.
* pino worker transport replaced by in-process pino-pretty (reliable on Windows/tsx).

## Verified here (Linux, Node 22, PostgreSQL 16)
`pnpm typecheck`, `pnpm db:migrate`, dev server (tsx), esbuild bundle + start, storefront build with prerender (42 routes),
Vite proxy, admin login, product create, upload, orders create/track, XLSX export, sitemap. Not run on real Windows or Neon.
