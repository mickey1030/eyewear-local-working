import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Upload, FileImage, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const DELIVERY_FEE = 75;
const FREE_SHIPPING_THRESHOLD = 2000;

const LENS_IDS = ["blue_cut", "anti_reflection", "white", "blue_cut_grey", "grey", "brown", "blue_cut_brown"] as const;

export default function Cart() {
  const {
    items, removeItem, updateQuantity, subtotal, hasAnyMedical,
    lensChoice, selectedLensType, setLensChoice, setSelectedLensType,
  } = useCart();
  const { t, lang } = useLanguage();
  const [_, setLocation] = useLocation();

  const [rxFile, setRxFile] = useState<File | null>(null);
  const [lensError, setLensError] = useState(false);

  const deliveryFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : subtotal > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    if (hasAnyMedical && lensChoice === null) {
      setLensError(true);
      return;
    }
    setLensError(false);
    sessionStorage.setItem("am_lens_choice", lensChoice ?? "");
    sessionStorage.setItem("am_lens_type", selectedLensType ?? "");
    sessionStorage.setItem("am_rx_filename", rxFile?.name ?? "");
    setLocation("/order");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-8 animate-in fade-in duration-500">
        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-serif font-bold">{t("cart.empty")}</h2>
        <p className="text-muted-foreground text-center max-w-xs">{t("cart.emptyDesc")}</p>
        <Button asChild size="lg" className="px-8">
          <Link href="/">{t("cart.continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-20 animate-in fade-in duration-700">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-10">{t("cart.title")}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Items column */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                data-testid={`cart-item-${product.id}`}
                className="flex gap-4 p-4 rounded-2xl border border-white/10 bg-secondary/20 hover:bg-secondary/30 transition-colors"
              >
                <Link href={`/product/${product.id}`} className="shrink-0">
                  <div className="h-20 w-20 rounded-xl overflow-hidden bg-secondary">
                    <img src={product.image} alt={lang === "ar" ? product.nameAr : product.name} className="h-full w-full object-cover" />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${product.id}`}>
                    <h3 className="font-serif font-semibold truncate hover:text-primary transition-colors">
                      {lang === "ar" ? product.nameAr : product.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {product.category} · {product.subcategory}
                  </p>
                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-background/40 p-0.5">
                      <button
                        data-testid={`btn-minus-${product.id}`}
                        onClick={() => updateQuantity(product.id, -1)}
                        className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
                      <button
                        data-testid={`btn-plus-${product.id}`}
                        onClick={() => updateQuantity(product.id, 1)}
                        className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="font-bold text-primary text-sm">{product.price * quantity} EGP</span>
                    <button
                      data-testid={`btn-remove-${product.id}`}
                      onClick={() => removeItem(product.id)}
                      className="text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* ── Lens Options (Italy / China / Children items) ── */}
            {hasAnyMedical && (
              <div className="rounded-2xl border border-white/10 bg-secondary/20 p-5 space-y-4">
                <h3 className="font-serif font-semibold text-base">{t("cart.lensOption")}</h3>

                {/* Price note — always visible */}
                <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2.5 leading-relaxed">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{t("cart.lensNote")}</span>
                </div>

                {/* With / Without toggle */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setLensChoice("with"); setLensError(false); }}
                    className={cn(
                      "flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                      lensChoice === "with"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/10 bg-secondary/30 text-muted-foreground hover:border-white/30 hover:text-foreground"
                    )}
                  >
                    {t("cart.withLenses")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLensChoice("without");
                      setLensError(false);
                      setSelectedLensType(null);
                      setRxFile(null);
                    }}
                    className={cn(
                      "flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                      lensChoice === "without"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/10 bg-secondary/30 text-muted-foreground hover:border-white/30 hover:text-foreground"
                    )}
                  >
                    {t("cart.withoutLenses")}
                  </button>
                </div>
                {lensError && (
                  <p className="text-xs text-red-400">
                    {lang === "ar" ? "يرجى اختيار خيار العدسات للمتابعة." : "Please select a lens option to continue."}
                  </p>
                )}

                {/* Lens type + prescription — only when "with" */}
                {lensChoice === "with" && (
                  <div className="space-y-4 pt-1 border-t border-white/10">
                    {/* Lens type dropdown */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">
                        {t("cart.selectLensType")}
                      </label>
                      <select
                        value={selectedLensType ?? ""}
                        onChange={(e) => setSelectedLensType(e.target.value || null)}
                        className="w-full bg-background/60 border border-white/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">{t("cart.selectLensType")}</option>
                        {LENS_IDS.map((id) => (
                          <option key={id} value={id}>{t(`lens.${id}`)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Prescription upload */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">
                        {t("cart.uploadRx")}
                      </label>
                      <label className="block border-2 border-dashed border-white/20 rounded-xl p-6 text-center bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setRxFile(f);
                          }}
                        />
                        <div className="pointer-events-none flex flex-col items-center gap-2">
                          <div className="p-2.5 bg-background rounded-full">
                            {rxFile
                              ? <FileImage className="h-5 w-5 text-primary" />
                              : <Upload className="h-5 w-5 text-muted-foreground" />
                            }
                          </div>
                          <span className="text-sm font-medium">
                            {rxFile ? rxFile.name : t("checkout.uploadHint")}
                          </span>
                          <p className="text-xs text-muted-foreground">{t("checkout.uploadFormats")}</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary -ms-2">
              <Link href="/">{t("cart.continueShopping")}</Link>
            </Button>
          </div>

          {/* Summary column */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-secondary/20 p-6 space-y-4 sticky top-24">
              <h2 className="font-serif font-semibold text-lg">{t("checkout.summary")}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("checkout.itemPrice")}</span>
                  <span>{subtotal} EGP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("checkout.delivery")}</span>
                  {deliveryFee === 0 && subtotal > 0 ? (
                    <span className="text-primary font-semibold text-xs">{t("checkout.freeShipping")}</span>
                  ) : (
                    <span>{deliveryFee} EGP</span>
                  )}
                </div>
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-between font-bold">
                <span>{t("checkout.total")}</span>
                <span className="text-primary text-lg">{total} EGP</span>
              </div>
              <Button
                data-testid="btn-checkout"
                size="lg"
                className="w-full gap-2 h-12"
                onClick={handleCheckout}
              >
                {t("cart.checkout")} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
