import { createContext, useContext, useEffect } from "react";

export interface HreflangLink {
  hrefLang: string;
  href: string;
}

export interface SeoHeadProps {
  title: string;
  description: string;
  canonical: string;
  hreflangs?: HreflangLink[];
  og?: { title?: string; description?: string; url?: string; locale?: string; type?: string; image?: string };
  twitter?: { title?: string; description?: string };
  jsonLd?: unknown;
}

export interface SeoHeadContextValue {
  set: (data: SeoHeadProps) => void;
}

/**
 * NOTE: we don't use react-helmet-async here. Under React 19, its <Helmet>
 * renders a componentDidMount-only dispatcher (no server-state emission),
 * so it never produces usable output from `renderToString`. This is a small
 * isomorphic replacement: SeoHead pushes its data synchronously during
 * render (used by entry-server.tsx to build the prerendered <head>), and
 * separately syncs the live DOM `<head>` on the client via an effect.
 */
export const SeoHeadContext = createContext<SeoHeadContextValue | null>(null);

interface HeadTag {
  tag: "meta" | "link" | "script";
  attrs: Record<string, string>;
  content?: string;
}

function buildTags(data: SeoHeadProps): HeadTag[] {
  const tags: HeadTag[] = [];
  tags.push({ tag: "meta", attrs: { name: "description", content: data.description } });
  tags.push({ tag: "link", attrs: { rel: "canonical", href: data.canonical } });
  for (const h of data.hreflangs ?? []) {
    tags.push({ tag: "link", attrs: { rel: "alternate", hreflang: h.hrefLang, href: h.href } });
  }
  if (data.og) {
    if (data.og.title) tags.push({ tag: "meta", attrs: { property: "og:title", content: data.og.title } });
    if (data.og.description)
      tags.push({ tag: "meta", attrs: { property: "og:description", content: data.og.description } });
    if (data.og.url) tags.push({ tag: "meta", attrs: { property: "og:url", content: data.og.url } });
    if (data.og.locale) tags.push({ tag: "meta", attrs: { property: "og:locale", content: data.og.locale } });
    if (data.og.image) tags.push({ tag: "meta", attrs: { property: "og:image", content: data.og.image } });
    tags.push({ tag: "meta", attrs: { property: "og:type", content: data.og.type ?? "website" } });
  }
  if (data.twitter) {
    tags.push({ tag: "meta", attrs: { name: "twitter:card", content: "summary_large_image" } });
    if (data.twitter.title) tags.push({ tag: "meta", attrs: { name: "twitter:title", content: data.twitter.title } });
    if (data.twitter.description)
      tags.push({ tag: "meta", attrs: { name: "twitter:description", content: data.twitter.description } });
  }
  if (data.jsonLd) {
    tags.push({ tag: "script", attrs: { type: "application/ld+json" }, content: JSON.stringify(data.jsonLd) });
  }
  return tags;
}

function escapeHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Builds the raw `<head>` markup string used by entry-server.tsx / scripts/prerender.mjs. */
export function renderHeadTagsToString(data: SeoHeadProps): string {
  const tags = buildTags(data);
  const titleTag = `<title>${escapeHtml(data.title)}</title>`;
  const rest = tags.map((t) => {
    const attrStr = Object.entries(t.attrs)
      .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
      .join(" ");
    if (t.tag === "script") {
      return `<script ${attrStr}>${t.content}</script>`;
    }
    return `<${t.tag} ${attrStr} />`;
  });
  return [titleTag, ...rest].join("\n    ");
}

function applyToDom(data: SeoHeadProps) {
  if (typeof document === "undefined") return;
  document.title = data.title;
  document.querySelectorAll('[data-seo-managed="true"]').forEach((el) => el.remove());
  for (const t of buildTags(data)) {
    const el = document.createElement(t.tag);
    for (const [k, v] of Object.entries(t.attrs)) {
      el.setAttribute(k, v);
    }
    if (t.content) el.textContent = t.content;
    el.setAttribute("data-seo-managed", "true");
    document.head.appendChild(el);
  }
}

/** Drop-in replacement for `<Helmet>`: renders nothing, but registers page metadata for SSR extraction + client DOM sync. */
export function SeoHead(props: SeoHeadProps) {
  const ctx = useContext(SeoHeadContext);
  if (typeof window === "undefined" && ctx) {
    ctx.set(props);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    applyToDom(props);
  }, [JSON.stringify(props)]);
  return null;
}
