import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Separate, minimal Vite config used only to bundle `src/entry-server.tsx`
// into a plain ESM module (dist/server/entry-server.js) that the plain-Node
// prerender script (scripts/prerender.mjs) can `import()` directly. This
// avoids requiring PORT/dev-only plugins that the client `vite.config.ts`
// needs, and keeps the SSR bundle free of client-only concerns (HMR,
// runtime error overlay, etc).
export default defineConfig({
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
    outDir: path.resolve(import.meta.dirname, "dist/server"),
    emptyOutDir: true,
    ssr: true,
    rollupOptions: {
      input: path.resolve(import.meta.dirname, "src/entry-server.tsx"),
      output: {
        entryFileNames: "entry-server.js",
        format: "es",
      },
    },
  },
});
