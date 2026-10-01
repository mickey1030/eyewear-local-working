import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Truck, Sun, Tag, Check, ShoppingBag, Loader2, UserCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";

const DELIVERY_FEE = 75;
const FREE_SHIPPING_THRESHOLD = 2000;

const PROMO_CODES: Record<string, { type: "percent" | "fixed"; value: number }> = {
  "SAVE10":  { type: "percent", value: 10 },
  "MONIR20": { type: "percent", value: 20 },
  "WELCOME": { type: "fixed",   value: 100 },
};

function generateOrderNumber() {
  return "AM-" + Date.now().toString(36).toUpperCase().slice(-6);
}

// ─── Saved customer info (localStorage) ───────────────────────────────────────
const CUSTOMER_STORAGE_KEY = "am_customer_info";

interface SavedCustomer {
  customerName: string;
  phone: string;
  email: string;
  address: string;
}

function loadSavedCustomer(): SavedCustomer | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.customerName && parsed?.phone) return parsed as SavedCustomer;
    return null;
  } catch {
    return null;
  }
}

function saveCustomer(values: SavedCustomer) {
  try {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(values));
  } catch { /* quota error — silently skip */ }
}

// ─── Form schema ──────────────────────────────────────────────────────────────
const formSchema = z.object({
  customerName: z.string().min(2),
  phone:        z.string().min(5),
  email:        z.string().email(),
  address:      z.string().min(5),
});
type FormValues = z.infer<typeof formSchema>;

export default function Checkout() {
  const [_, setLocation] = useLocation();
  const { t, lang } = useLanguage();
  const { items, subtotal, clearCart, lensChoice, selectedLensType } = useCart();

  const [promoInput, setPromoInput]     = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: "percent" | "fixed"; value: number } | null>(null);
  const [promoError, setPromoError]     = useState(false);
  const [savedCustomer, setSavedCustomer] = useState<SavedCustomer | null>(null);
  const [autofilled, setAutofilled]       = useState(false);

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-8 animate-in fade-in duration-500">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-2xl font-serif">{t("checkout.emptyCart")}</h2>
        <Button asChild size="lg"><Link href="/cart">{t("checkout.goToCart")}</Link></Button>
      </div>
    );
  }

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    const promo = PROMO_CODES[code];
    if (promo) {
      setAppliedPromo({ code, ...promo });
      setPromoError(false);
    } else {
      setPromoError(true);
      setAppliedPromo(null);
    }
  };

  const discount          = appliedPromo
    ? appliedPromo.type === "percent"
      ? Math.round(subtotal * appliedPromo.value / 100)
      : Math.min(appliedPromo.value, subtotal)
    : 0;
  const discountedSubtotal = subtotal - discount;
  const deliveryFee        = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_FEE;
  const total              = discountedSubtotal + deliveryFee;

  // ── Load saved customer on mount ──
  const saved = loadSavedCustomer();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: saved?.customerName ?? "",
      phone:        saved?.phone        ?? "",
      email:        saved?.email        ?? "",
      address:      saved?.address      ?? "",
    },
  });

  // Show autofill banner if we pre-populated from storage
  useEffect(() => {
    if (saved?.customerName) {
      setSavedCustomer(saved);
      setAutofilled(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: FormValues) {
    const rxFilename = sessionStorage.getItem("am_rx_filename") ?? "";

    // Save customer info for next visit (keyed by browser only, no account needed)
    saveCustomer({
      customerName: values.customerName,
      phone:        values.phone,
      email:        values.email,
      address:      values.address,
    });

    const orderData = {
      orderNumber:  generateOrderNumber(),
      customerName: values.customerName,
      phone:        values.phone,
      email:        values.email,
      address:      values.address,
      items: items.map((i) => ({
        name:            i.product.name,
        nameAr:          i.product.nameAr,
        quantity:        i.quantity,
        price:           i.product.price,
        productCode:     i.product.code,
        productImageUrl: i.product.image,
      })),
      subtotal,
      deliveryFee,
      discount,
      total,
      promoCode:    appliedPromo?.code,
      lensChoice,
      lensType:     selectedLensType,
      rxFilename,
    };

    // Persist order to DB — checkout completes even if API is unavailable
    try {
      await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(orderData),
      });
    } catch { /* silent — sessionStorage fallback below still works */ }

    sessionStorage.setItem("am_last_order", JSON.stringify(orderData));
    clearCart();
    setLocation("/order-confirmation");
  }

  const clearSaved = () => {
    try { localStorage.removeItem(CUSTOMER_STORAGE_KEY); } catch { /* ignore */ }
    setSavedCustomer(null);
    setAutofilled(false);
    form.reset({ customerName: "", phone: "", email: "", address: "" });
  };

  return (
    <div className="py-12 md:py-20 max-w-3xl mx-auto px-4 md:px-6">
      <Button variant="ghost" asChild className="mb-8 -ms-4 text-muted-foreground hover:text-primary">
        <Link href="/cart"><ArrowLeft className="me-2 h-4 w-4" /> {t("checkout.back")}</Link>
      </Button>

      <div className="mb-10 pb-8 border-b border-white/10">
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">{t("checkout.title")}</h1>
        <p className="text-muted-foreground text-sm">{items.length} {lang === "ar" ? "منتج" : "item(s)"}</p>
      </div>

      {/* Order summary */}
      <div className="mb-10 rounded-2xl border border-white/10 bg-secondary p-6 space-y-4">
        <h2 className="font-serif font-semibold text-lg text-foreground">{t("checkout.summary")}</h2>
        <div className="space-y-2">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex justify-between text-sm">
              <span className="text-foreground/90 truncate max-w-[65%]">
                {lang === "ar" ? product.nameAr : product.name}
                {quantity > 1 && <span className="ms-1 text-xs opacity-60">×{quantity}</span>}
              </span>
              <span className="font-semibold shrink-0 text-foreground">{product.price * quantity} EGP</span>
            </div>
          ))}
        </div>

        {/* Lens choice summary */}
        {lensChoice && (
          <div className="pt-2 border-t border-white/10 text-sm flex justify-between text-foreground/70">
            <span>{t("cart.lensOption")}</span>
            <span className="text-foreground font-medium">
              {lensChoice === "with"
                ? (selectedLensType ? t(`lens.${selectedLensType}`) : t("cart.withLenses"))
                : t("cart.withoutLenses")}
            </span>
          </div>
        )}

        {/* Promo code */}
        <div className="pt-3 border-t border-white/10">
          <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
            <Tag className="h-3.5 w-3.5" /> {t("promo.label")}
          </label>
          {appliedPromo ? (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <Check className="h-4 w-4 shrink-0" />
              <span>{t("promo.applied")}: <span className="font-mono font-bold">{appliedPromo.code}</span></span>
              <button onClick={() => { setAppliedPromo(null); setPromoInput(""); }} className="ms-auto text-muted-foreground hover:text-red-400 text-xs underline">
                {lang === "ar" ? "إزالة" : "Remove"}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                data-testid="input-promo"
                value={promoInput}
                onChange={(e) => { setPromoInput(e.target.value); setPromoError(false); }}
                placeholder={t("promo.placeholder")}
                className="flex-1 bg-background border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 uppercase"
                onKeyDown={(e) => e.key === "Enter" && applyPromo()}
              />
              <Button type="button" size="sm" variant="outline" onClick={applyPromo} className="shrink-0 border-white/20 text-foreground">
                {t("promo.apply")}
              </Button>
            </div>
          )}
          {promoError && <p className="text-xs text-red-400 mt-1">{t("promo.invalid")}</p>}
        </div>

        {/* Totals */}
        <div className="pt-3 border-t border-white/10 space-y-2 text-sm">
          <div className="flex justify-between text-foreground/80">
            <span>{t("checkout.itemPrice")}</span><span>{subtotal} EGP</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-400">
              <span>{t("promo.discount")}</span><span>−{discount} EGP</span>
            </div>
          )}
          <div className="flex items-center justify-between text-foreground/80">
            <span className="flex items-center gap-1.5"><Truck className="h-4 w-4" /> {t("checkout.delivery")}</span>
            {deliveryFee === 0 ? (
              <span className="text-amber-400 font-semibold text-xs flex items-center gap-1">
                <Sun className="h-3.5 w-3.5" /> {t("checkout.freeShipping")}
              </span>
            ) : (
              <span>{deliveryFee} EGP</span>
            )}
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between font-bold">
            <span className="text-foreground">{t("checkout.total")}</span>
            <span className="text-amber-400 text-lg">{total} EGP</span>
          </div>
        </div>
      </div>

      {/* Returning-customer autofill banner */}
      {autofilled && savedCustomer && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
          <UserCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {lang === "ar" ? "مرحباً بعودتك،" : "Welcome back,"} {savedCustomer.customerName}!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === "ar"
                ? "تم تعبئة بياناتك تلقائياً. يمكنك تعديلها إذا تغيّرت."
                : "Your details were filled in automatically. Edit them if anything has changed."}
            </p>
          </div>
          <button
            type="button"
            onClick={clearSaved}
            className="text-xs text-muted-foreground hover:text-red-400 underline shrink-0 mt-0.5 transition-colors"
          >
            {lang === "ar" ? "مسح" : "Clear"}
          </button>
        </div>
      )}

      {/* Contact form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="customerName" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("checkout.name")}</FormLabel>
                <FormControl>
                  <Input data-testid="input-name" placeholder={t("checkout.name.placeholder")} {...field} className="bg-secondary/50 border-white/25 focus-visible:ring-primary placeholder:text-muted-foreground/70" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("checkout.phone")}</FormLabel>
                <FormControl>
                  <Input data-testid="input-phone" placeholder={t("checkout.phone.placeholder")} {...field} className="bg-secondary/50 border-white/25 focus-visible:ring-primary placeholder:text-muted-foreground/70" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("checkout.email")}</FormLabel>
              <FormControl>
                <Input data-testid="input-email" type="email" placeholder={t("checkout.email.placeholder")} {...field} className="bg-secondary/50 border-white/25 focus-visible:ring-primary placeholder:text-muted-foreground/70" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("checkout.address")}</FormLabel>
              <FormControl>
                <Textarea data-testid="input-address" placeholder={t("checkout.address.placeholder")} className="min-h-[100px] bg-secondary/50 border-white/25 focus-visible:ring-primary resize-none placeholder:text-muted-foreground/70" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="pt-8 border-t border-white/10">
            <Button data-testid="button-submit" type="submit" size="lg" disabled={form.formState.isSubmitting} className="w-full md:w-auto px-12 h-14 text-lg gap-2">
              {form.formState.isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
              {form.formState.isSubmitting ? (lang === "ar" ? "جارٍ التأكيد…" : "Placing order…") : t("checkout.submit")}
            </Button>
            <p className="text-xs text-muted-foreground mt-4 text-center md:text-start">{t("checkout.terms")}</p>
          </div>
        </form>
      </Form>
    </div>
  );
}
