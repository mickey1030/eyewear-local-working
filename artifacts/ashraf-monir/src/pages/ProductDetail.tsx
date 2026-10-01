import { useState } from "react";
import { useParams, Link } from "wouter";
import { SeoHead } from "@/lib/seo-head";
import { ArrowLeft, ShoppingBag, Check, Minus, Plus, Glasses } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { getProductById } from "@/data/products";
import { useDbProducts } from "@/hooks/useDbProducts";
import { cn } from "@/lib/utils";
import { DEFAULT_SITE_ORIGIN, absoluteUrl } from "@/lib/seo";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const { addItem } = useCart();

  const staticProduct = getProductById(id ?? "");
  const { data: dbProducts = [] } = useDbProducts();
  const dbProduct = id?.startsWith("db-") ? dbProducts.find((p) => p.id === id) : undefined;

  const product = staticProduct ?? dbProduct;

  const galleryImages = product?.images && product.images.length > 0 ? product.images : [];
  const hasGallery = galleryImages.length > 0;

  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-2xl font-serif mb-4">{t("product.notFound")}</h2>
        <Button asChild><Link href="/">{t("cat.returnHome")}</Link></Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const specRows = [
    { label: t("spec.frameType"), value: product.specs.frameType },
    { label: t("spec.material"),  value: product.specs.material },
    { label: t("spec.lensWidth"), value: product.specs.lensWidth },
    { label: t("spec.bridge"),    value: product.specs.bridge },
    { label: t("spec.temple"),    value: product.specs.temple },
    { label: t("spec.color"),     value: product.specs.color },
    ...(product.code ? [{ label: lang === "ar" ? "كود المنتج" : "Product Code", value: `#${product.code}` }] : []),
    { label: t("spec.gender"),    value: product.specs.gender },
  ].filter((r) => r.value && r.value !== "—");

  const neutralPath = `/product/${product.id}`;
  const enUrl = absoluteUrl(DEFAULT_SITE_ORIGIN, neutralPath);
  const arUrl = absoluteUrl(DEFAULT_SITE_ORIGIN, `/ar${neutralPath}`);
  const canonical = lang === "ar" ? arUrl : enUrl;
  const name = lang === "ar" ? product.nameAr : product.name;
  const description = lang === "ar" ? product.descriptionAr : product.description;
  const pageTitle = `${name} | Ashraf Monir`;
  const categoryUrl = absoluteUrl(DEFAULT_SITE_ORIGIN, `/category/${product.category}`);
  const productSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: lang === "ar" ? "الرئيسية" : "Home", item: absoluteUrl(DEFAULT_SITE_ORIGIN, "/") },
          { "@type": "ListItem", position: 2, name: product.category, item: categoryUrl },
          { "@type": "ListItem", position: 3, name, item: enUrl },
        ],
      },
      {
        "@type": "Product",
        name,
        description,
        image: product.images,
        sku: product.id,
        category: product.category,
        offers: {
          "@type": "Offer",
          priceCurrency: "EGP",
          price: product.price,
          availability: "https://schema.org/InStock",
          url: enUrl,
        },
      },
    ],
  };

  return (
    <div className="py-12 md:py-20 animate-in fade-in duration-700">
      <SeoHead
        title={pageTitle}
        description={description}
        canonical={canonical}
        hreflangs={[
          { hrefLang: "en", href: enUrl },
          { hrefLang: "ar", href: arUrl },
          { hrefLang: "x-default", href: enUrl },
        ]}
        og={{
          title: pageTitle,
          description,
          url: canonical,
          image: absoluteUrl(DEFAULT_SITE_ORIGIN, product.image),
          type: "product",
        }}
        jsonLd={productSchema}
      />
      <div className="container mx-auto px-4 md:px-6">
        <Link
          href={`/category/${product.category}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-10"
        >
          <ArrowLeft className="me-2 h-4 w-4" /> {t("cat.back")}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Gallery */}
          <div className="space-y-4">
            {hasGallery ? (
              <>
                <div className="aspect-square rounded-2xl overflow-hidden bg-secondary border border-white/5">
                  <img
                    src={galleryImages[activeImg]}
                    alt={lang === "ar" ? product.nameAr : product.name}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                </div>
                {galleryImages.length > 1 && (
                  <div className="grid grid-cols-3 gap-3">
                    {galleryImages.map((img, i) => (
                      <button
                        key={i}
                        data-testid={`btn-gallery-${i}`}
                        onClick={() => setActiveImg(i)}
                        className={cn(
                          "aspect-square rounded-xl overflow-hidden border-2 transition-all",
                          activeImg === i ? "border-primary" : "border-white/10 hover:border-white/30"
                        )}
                      >
                        <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square rounded-2xl overflow-hidden bg-secondary border border-white/5 flex flex-col items-center justify-center gap-4 text-muted-foreground/40">
                <Glasses className="h-20 w-20" />
                <p className="text-sm font-medium tracking-wide uppercase">{lang === "ar" ? "لا توجد صورة" : "No image available"}</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className="text-primary border-primary/30 capitalize">
                  {product.category} — {product.subcategory}
                </Badge>
                <Badge variant="outline" className="capitalize border-white/10 text-muted-foreground">
                  {product.type === "sun" ? t("checkout.sunglasses") : t("checkout.prescription")}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
                {lang === "ar" ? product.nameAr : product.name}
              </h1>
              <p className="text-muted-foreground leading-relaxed text-base">
                {lang === "ar" ? product.descriptionAr : product.description}
              </p>
            </div>

            <div className="text-3xl font-bold text-foreground">
              {product.price} <span className="text-lg font-medium text-amber-400">EGP</span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{t("product.quantity")}</span>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-secondary/30 p-1">
                <button
                  data-testid="btn-qty-minus"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold">{qty}</span>
                <button
                  data-testid="btn-qty-plus"
                  onClick={() => setQty((q) => q + 1)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Button
              data-testid="btn-add-to-cart"
              size="lg"
              onClick={handleAddToCart}
              className={cn(
                "h-14 text-base gap-3 transition-all duration-300",
                added ? "bg-green-600 hover:bg-green-600" : ""
              )}
            >
              {added ? (
                <><Check className="h-5 w-5" /> {t("product.added")}</>
              ) : (
                <><ShoppingBag className="h-5 w-5" /> {t("product.addToCart")}</>
              )}
            </Button>

            {/* Specs — only show rows with real values */}
            {specRows.length > 0 && (
              <div className="pt-6 border-t border-white/10">
                <h3 className="font-serif font-semibold text-lg mb-4">{t("product.specs")}</h3>
                <dl className="space-y-2">
                  {specRows.map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2 border-b border-white/5 text-sm">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
