export const SITE_NAME = "Ashraf Monir";

/**
 * Canonical/OG URLs need an absolute origin. In dev/prod this app is always
 * served from the same host as the rest of the workspace (no separate
 * custom domain configured), so we resolve it at request/render time
 * whenever possible and fall back to this default only when no request
 * context is available (e.g. during the SSG build).
 */
// Set VITE_SITE_ORIGIN (e.g. https://www.your-domain.com) in the root .env before
// running `pnpm build` so canonical/OG URLs and the prerendered pages use your real domain.
export const DEFAULT_SITE_ORIGIN: string =
  (import.meta.env?.VITE_SITE_ORIGIN as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:5173";

export function absoluteUrl(origin: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin.replace(/\/$/, "")}${normalizedPath}`;
}

/** Strips a leading `/ar` locale prefix, returning the language-neutral path (always starting with `/`). */
export function stripLangPrefix(pathname: string): string {
  if (pathname === "/ar") return "/";
  if (pathname.startsWith("/ar/")) return pathname.slice(3) || "/";
  return pathname || "/";
}

export function withLangPrefix(pathname: string, lang: "en" | "ar"): string {
  const neutral = stripLangPrefix(pathname);
  if (lang === "en") return neutral;
  return neutral === "/" ? "/ar" : `/ar${neutral}`;
}

export function isArabicPath(pathname: string): boolean {
  return pathname === "/ar" || pathname.startsWith("/ar/");
}
