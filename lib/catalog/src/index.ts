export * from "./products";

import type { ProductCategory } from "./products";

export const CATEGORY_SUBCATEGORIES: Record<ProductCategory, readonly string[]> = {
  sun: ["Women", "Men"],
  china: ["Plastic", "Half-frame", "Frameless", "Metal"],
  italy: ["Plastic", "Half-frame", "Frameless", "Metal"],
  children: ["Silicon", "Plastic"],
  "clip-on": ["Sun", "Blue Cut", "Polarized"],
};

export const BRAND_TO_CATEGORY: Record<string, ProductCategory> = {
  Italy: "italy",
  China: "china",
  Sun: "sun",
  Children: "children",
  "Clip-On": "clip-on",
};
