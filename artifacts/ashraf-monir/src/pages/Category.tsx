import { useState } from "react";
import { useParams, Link } from "wouter";
import { SeoHead } from "@/lib/seo-head";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, ShoppingBag, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { getProductsByCategory } from "@/data/products";
import type { Product } from "@/data/products";
import { useDbProducts } from "@/hooks/useDbProducts";
import { DEFAULT_SITE_ORIGIN, absoluteUrl } from "@/lib/seo";

const CATEGORY_STRUCTURE = {
  sun:      { titleKey: "cat.sun.title",      descKey: "cat.sun.desc",      subcategories: ["Women", "Men"] },
  china:    { titleKey: "cat.china.title",    descKey: "cat.china.desc",    subcategories: ["Plastic", "Half-frame", "Frameless", "Metal"] },
  italy:    { titleKey: "cat.italy.title",    descKey: "cat.italy.desc",    subcategories: ["Plastic", "Half-frame", "Frameless", "Metal"] },
  children: { titleKey: "cat.children.title", descKey: "cat.children.desc", subcategories: ["Silicon", "Plastic"] },
  "clip-on": { titleKey: "cat.clipon.title",  descKey: "cat.clipon.desc",   subcategories: ["Sun", "Blue Cut", "Polarized"] },
} as const;

export default function Category() {
  const params = useParams<{ category: string; subcategory?: string }>();
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const categoryKey = params.category?.toLowerCase() as keyof typeof CATEGORY_STRUCTURE;
  const categoryInfo = CATEGORY_STRUCTURE[categoryKey];

  const { data: dbProducts = [] } = useDbProducts();

  if (!categoryInfo) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-2xl font-serif mb-4">{t("cat.notfound")}</h2>
        <Button asChild><Link href="/">{t("cat.returnHome")}</Link></Button>
      </div>
    );
  }

  const staticProducts = getProductsByCategory(categoryKey, params.subcategory);

  const dbForCategory = dbProducts.filter((p) => {
    if (p.category !== categoryKey) return false;
    if (params.subcategory) {
      return p.subcategory.toLowerCase() === params.subcategory.toLowerCase();
    }
    return true;
  });

  const products: Product[] = [...staticProducts, ...dbForCategory];

  const neutralPath = params.subcategory
    ? `/category/${categoryKey}/${params.subcategory.toLowerCase()}`
    : `/category/${categoryKey}`;
  const enUrl = absoluteUrl(DEFAULT_SITE_ORIGIN, neutralPath);
  const arUrl = absoluteUrl(DEFAULT_SITE_ORIGIN, `/ar${neutralPath}`);
  const canonical = lang === "ar" ? arUrl : enUrl;
  const pageTitle = `${t(categoryInfo.titleKey)} | Ashraf Monir`;
  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: lang === "ar" ? "الرئيسية" : "Home", item: absoluteUrl(DEFAULT_SITE_ORIGIN, "/") },
      {
        "@type": "ListItem",
        position: 2,
        name: t(categoryInfo.titleKey),
        item: absoluteUrl(DEFAULT_SITE_ORIGIN, `/category/${categoryKey}`),
      },
      ...(params.subcategory
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: params.subcategory,
              item: enUrl,
            },
          ]
        : []),
    ],
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbSchema,
      ...(products.length > 0
        ? [
            {
              "@type": "ItemList",
              name: t(categoryInfo.titleKey),
              itemListElement: products.map((product, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: absoluteUrl(DEFAULT_SITE_ORIGIN, `/product/${product.id}`),
                name: lang === "ar" ? product.nameAr : product.name,
              })),
            },
          ]
        : []),
    ],
  };

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
      <SeoHead
        title={pageTitle}
        description={t(categoryInfo.descKey)}
        canonical={canonical}
        hreflangs={[
          { hrefLang: "en", href: enUrl },
          { hrefLang: "ar", href: arUrl },
          { hrefLang: "x-default", href: enUrl },
        ]}
        og={{ title: pageTitle, description: t(categoryInfo.descKey), url: canonical }}
        jsonLd={structuredData}
      />
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="me-2 h-4 w-4" /> {t("cat.back")}
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 text-foreground">{t(categoryInfo.titleKey)}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">{t(categoryInfo.descKey)}</p>
        </div>

        {/* Subcategory tabs */}
        <div className="flex flex-wrap gap-2 mb-12 border-b border-white/10 pb-6">
          <Link
            href={`/category/${categoryKey}`}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
              !params.subcategory ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-white/20 hover:border-primary/50 hover:text-foreground"
            )}
          >
            {t("cat.all")}
          </Link>
          {categoryInfo.subcategories.map((sub) => (
            <Link
              key={sub}
              href={`/category/${categoryKey}/${sub.toLowerCase()}`}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                params.subcategory?.toLowerCase() === sub.toLowerCase()
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-white/20 hover:border-primary/50 hover:text-foreground"
              )}
            >
              {sub}
            </Link>
          ))}
        </div>

        {/* Product grid */}
        {products.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p>{t("search.noResults")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => {
              const isAdded = addedIds.has(product.id);
              return (
                <div key={product.id} data-testid={`card-product-${product.id}`} className="group flex flex-col">
                  <Link href={`/product/${product.id}`}>
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-secondary border border-white/5 mb-4 cursor-pointer">
                      <img
                        src={product.image}
                        alt={lang === "ar" ? product.nameAr : product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 end-3 bg-background/90 px-2.5 py-1 rounded-full text-xs font-semibold border border-white/20 text-foreground">
                        {product.price} EGP
                      </div>
                    </div>
                  </Link>
                  <div className="flex-1 flex flex-col">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-serif font-medium text-lg mb-1 hover:text-primary transition-colors">
                        {lang === "ar" ? product.nameAr : product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mb-1.5 capitalize">
                      {categoryKey} · {product.subcategory}
                    </p>
                    {product.code && (
                      <p className="text-xs text-muted-foreground/60 font-mono mb-4">#{product.code}</p>
                    )}
                    <div className="mt-auto flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 justify-between text-xs" asChild>
                        <Link href={`/product/${product.id}`}>
                          {t("cat.view")} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        data-testid={`btn-add-${product.id}`}
                        size="sm"
                        onClick={() => handleAdd(product)}
                        className={cn(
                          "gap-1.5 text-xs px-3 transition-all duration-200",
                          isAdded ? "bg-green-600 hover:bg-green-600 border-green-600" : ""
                        )}
                      >
                        {isAdded ? <Check className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                        {isAdded ? t("product.added") : t("cat.addToCart")}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
