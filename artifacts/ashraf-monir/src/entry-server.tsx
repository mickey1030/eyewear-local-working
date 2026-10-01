import { renderToString } from "react-dom/server";
import App from "./App";
import { renderHeadTagsToString, type SeoHeadProps } from "./lib/seo-head";
import {
  ALL_PRODUCTS,
  CATEGORY_SUBCATEGORIES,
  type ProductCategory,
} from "@workspace/catalog";

export interface RenderResult {
  html: string;
  head: string;
}

/** Renders a single URL (e.g. `/category/sun` or `/ar/product/sun-women-1`) to a markup string plus its `<head>` tags. */
export function render(url: string): RenderResult {
  const seoBox: { current?: SeoHeadProps } = {};
  const html = renderToString(<App ssrUrl={url} seoBox={seoBox} />);
  return { html, head: seoBox.current ? renderHeadTagsToString(seoBox.current) : "" };
}

/**
 * Language-neutral routes (no `/ar` prefix) that should be prerendered at
 * build time. The build script also generates an `/ar/...` counterpart for
 * every entry so each locale has its own crawlable, indexable URL.
 */
export function getStaticRoutes(): string[] {
  const routes = new Set<string>(["/"]);

  for (const [category, subcategories] of Object.entries(CATEGORY_SUBCATEGORIES)) {
    routes.add(`/category/${category}`);
    for (const sub of subcategories) {
      routes.add(`/category/${category}/${sub.toLowerCase()}`);
    }
  }

  for (const product of ALL_PRODUCTS) {
    routes.add(`/product/${product.id}`);
  }

  return Array.from(routes);
}

export type { ProductCategory };
