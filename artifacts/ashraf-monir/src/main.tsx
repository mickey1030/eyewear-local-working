import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootEl = document.getElementById("root")!;

// Prerendered pages stamp the root with the exact pathname they were
// generated for. When the current URL matches, hydrate the existing markup
// instead of throwing it away; otherwise (e.g. the generic SPA fallback
// shell, or a mismatched deep link) fall back to a full client render.
const ssrPath = rootEl.dataset.ssrPath;

if (ssrPath && ssrPath === window.location.pathname) {
  hydrateRoot(rootEl, <App />);
} else {
  rootEl.innerHTML = "";
  createRoot(rootEl).render(<App />);
}
