export type ProductCategory = "sun" | "china" | "italy" | "children" | "clip-on";
export type ProductType = "sun" | "medical";

export interface ProductSpec {
  frameType: string;
  material: string;
  lensWidth: string;
  bridge: string;
  temple: string;
  color: string;
  gender: string;
}

export interface Product {
  id: string;
  code?: number;
  name: string;
  nameAr: string;
  category: ProductCategory;
  subcategory: string;
  price: number;
  image: string;
  images: string[];
  description: string;
  descriptionAr: string;
  specs: ProductSpec;
  type: ProductType;
}

export const ALL_PRODUCTS: Product[] = [];

export function getProductById(id: string): Product | undefined {
  return ALL_PRODUCTS.find((p) => p.id === id);
}

export function getProductsByCategory(category: string, subcategory?: string): Product[] {
  return ALL_PRODUCTS.filter((p) => {
    const catMatch = p.category === category.toLowerCase();
    const subMatch = !subcategory || p.subcategory.toLowerCase() === subcategory.toLowerCase();
    return catMatch && subMatch;
  });
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return ALL_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.nameAr.includes(q) ||
      p.category.includes(q) ||
      p.subcategory.toLowerCase().includes(q) ||
      p.specs.material.toLowerCase().includes(q) ||
      p.specs.frameType.toLowerCase().includes(q) ||
      p.specs.color.toLowerCase().includes(q)
  );
}
