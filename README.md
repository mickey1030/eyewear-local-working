# Ashraf Monir storefront - local (Windows) setup

pnpm monorepo: React/Vite storefront + Express 5 API + Drizzle ORM on Neon PostgreSQL.

## Quick start (PowerShell or cmd, Node 20.11+ / 22 / 24)
```powershell
corepack enable                      # or: npm install -g pnpm
copy .env.example .env               # then edit .env (DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD)
pnpm install
pnpm db:migrate                      # creates tables + products_code_seq on Neon
pnpm dev                             # API only  -> http://localhost:8080
pnpm dev:all                         # API + storefront -> http://localhost:5173
```

Product images: copy your old `artifacts/api-server/uploads/` folder into the same place here
(files are served at `/api/uploads/<file>`; new admin uploads are written there too).

## Scripts (root)
| Command | What it does |
|---|---|
| `pnpm dev` | API with `tsx watch` (auto-restart) |
| `pnpm dev:web` | Vite storefront (proxies `/api`, `/sitemap.xml`, `/robots.txt` to the API) |
| `pnpm dev:all` | both, in parallel |
| `pnpm db:migrate` | apply `lib/db/drizzle/*.sql` to `DATABASE_URL` |
| `pnpm db:generate` | create a new migration after editing `lib/db/src/schema` |
| `pnpm db:push` | direct schema sync - **avoid**, it tries to drop `products_code_seq` |
| `pnpm build` / `pnpm start` | typecheck + build everything / run the built API |
| `pnpm typecheck` | `tsc` for libs, API and storefront |

## Troubleshooting
* **`Invalid environment configuration`** - `.env` is missing or incomplete; the message lists what.
* **Database connection FAILED** - Neon string must end in `?sslmode=require`; URL-encode odd password characters.
* **Port already in use** - change `PORT` (API) or `WEB_PORT` (Vite) in `.env`.
* **esbuild "Host version ... does not match binary version"** - delete `node_modules` and run `pnpm install` again (the workspace pins a single esbuild).
* **Migration 0001 fails on `orders_order_number_key`** - your database already has two orders with the same `order_number`. Rename the duplicates in Neon's SQL editor, then run `pnpm db:migrate` again.
* **Too many login attempts (429)** - wait 15 minutes or restart `pnpm dev`.
