import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/data/products";
import { BRAND_TO_CATEGORY } from "@/data/products";

interface DbProduct {
  id: number;
  code: number | null;
  name: string;
  price: string;
  imageUrl: string | null;
  imageUrls: string[] | null;
  color: string | null;
  brand: string | null;
  variant: string | null;
}

const CATEGORY_FALLBACK: Record<string, string> = {
  italy:     "/cat-italy.png",
  china:     "/cat-china.png",
  sun:       "/cat-sun.png",
  children:  "/cat-children.png",
  "clip-on": "/cat-clip-on.png",
};

function mapDbProduct(db: DbProduct): Product | null {
  const brand    = db.brand ?? "";
  const category = BRAND_TO_CATEGORY[brand];
  if (!category) return null;

  const fallback = CATEGORY_FALLBACK[category] ?? "/cat-china.png";
  const gallery  = (db.imageUrls ?? []).filter((u) => typeof u === "string" && u.length > 0);
  if (gallery.length === 0 && db.imageUrl) gallery.push(db.imageUrl);
  const images   = gallery.length > 0 ? gallery : [fallback];
  const image    = images[0];

  return {
    id:             `db-${db.id}`,
    code:           db.code ?? undefined,
    name:           db.name,
    nameAr:         db.name,
    category,
    subcategory:    db.variant ?? "",
    price:          parseFloat(db.price) || 0,
    image,
    images,
    description:    db.name,
    descriptionAr:  db.name,
    specs: {
      frameType: db.variant ?? "—",
      material:  "—",
      lensWidth: "—",
      bridge:    "—",
      temple:    "—",
      color:     db.color ?? "—",
      gender:    "—",
    },
    type: brand === "Sun" ? "sun" : "medical",
  };
}

async function fetchDbProducts(): Promise<DbProduct[]> {
  try {
    const res = await fetch("/api/products", { credentials: "include" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export function useDbProducts() {
  return useQuery({
    queryKey: ["db-products-public"],
    queryFn:  fetchDbProducts,
    staleTime: 30_000,
    select: (data) =>
      data.map(mapDbProduct).filter((p): p is Product => p !== null),
  });
}
