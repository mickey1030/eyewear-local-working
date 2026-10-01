import { useState } from "react";
import { Link, useSearch } from "wouter";
import { ArrowRight, SearchX, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useDbProducts } from "@/hooks/useDbProducts";
import type { Product } from "@/data/products";

/** Case-insensitive match across all searchable fields of a DB product. */
function matchesQuery(product: Product, q: string): boolean {
  if (!q) return false;
  const lq = q.toLowerCase();
  return (
    product.name.toLowerCase().includes(lq) ||
    product.nameAr.toLowerCase().includes(lq) ||
    product.category.toLowerCase().includes(lq) ||
    product.subcategory.toLowerCase().includes(lq) ||
    (product.specs.color ?? "").toLowerCase().includes(lq) ||
    (product.specs.material ?? "").toLowerCase().includes(lq) ||
    (product.specs.frameType ?? "").toLowerCase().includes(lq) ||
    String(product.code ?? "").includes(lq)
  );
}

export default function Search() {
  const searchString = useSearch();
  const query = new URLSearchParams(searchString).get("q") ?? "";
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const { data: allProducts = [], isLoading } = useDbProducts();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const results: Product[] = query.trim()
    ? allProducts.filter((p) => matchesQuery(p, query))
    : [];

  const handleAdd = (product: Product) => {
    addItem(product);
    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  return (
    <div className="py-12 md:py-20 animate-in fade-in duration-700">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-10">
          <p className="text-muted-foreground text-sm mb-2">{t("search.resultsFor")}</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">"{query}"</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {isLoading ? "…" : results.length} {t("search.resultsCount")}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-secondary/40 animate-pulse aspect-[4/3]" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
            <SearchX className="h-16 w-16 text-muted-foreground/40" />
            <h2 className="text-xl font-serif">{t("search.noResults")}</h2>
            <p className="text-muted-foreground max-w-xs text-sm">{t("search.noResultsDesc")}</p>
            <Button asChild>
              <Link href="/">{t("cat.returnHome")}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((product) => (
              <div key={product.id} data-testid={`search-card-${product.id}`} className="group flex flex-col">
                <Link href={`/product/${product.id}`}>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary border border-white/5 mb-4 cursor-pointer">
                    <img
                      src={product.image}
                      alt={lang === "ar" ? product.nameAr : product.name}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 end-3 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium border border-white/10">
                      {product.price} EGP
                    </div>
                  </div>
                </Link>
                <div className="flex-1 flex flex-col">
                  <Link href={`/product/${product.id}`}>
                    <h3 className="font-serif font-medium text-base mb-1 hover:text-primary transition-colors">
                      {lang === "ar" ? product.nameAr : product.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mb-3 capitalize">
                    {product.category} · {product.subcategory}
                  </p>
                  <div className="mt-auto flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 justify-between" asChild>
                      <Link href={`/product/${product.id}`}>
                        {t("product.view")} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant={addedIds.has(product.id) ? "default" : "outline"}
                      className="px-3"
                      onClick={() => handleAdd(product)}
                      data-testid={`btn-add-${product.id}`}
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
