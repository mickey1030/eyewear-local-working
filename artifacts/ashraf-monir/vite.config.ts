import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Single source of truth for local config: the `.env` file at the repo root
// (shared with the API server). Nothing here is Replit-specific any more.
const repoRoot = path.resolve(import.meta.dirname, "..", "..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, "");

  const port = Number(env.WEB_PORT ?? process.env.WEB_PORT ?? 5173);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid WEB_PORT value: "${env.WEB_PORT}"`);
  }

  const apiPort = Number(env.PORT ?? process.env.PORT ?? 8080);
  const apiTarget = env.API_URL || `http://localhost:${apiPort}`;

  const proxy = {
    "/api": { target: apiTarget, changeOrigin: true },
    "/sitemap.xml": { target: apiTarget, changeOrigin: true },
    "/robots.txt": { target: apiTarget, changeOrigin: true },
  };

  return {
    base: env.BASE_PATH || "/",
    envDir: repoRoot, // VITE_* variables are read from the repo-root .env too
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: "localhost",
      proxy,
      fs: { strict: true },
    },
    preview: {
      port,
      host: "localhost",
      proxy,
    },
  };
});
