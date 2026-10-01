import { useState, FormEvent } from "react";
import { Link } from "wouter";
import {
  Package, Search, CheckCircle2, Truck, Clock, XCircle,
  ShoppingBag, ChevronRight, ArrowLeft, RotateCcw, ImageIcon,
  Mail, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

interface TrackedItem {
  productName: string;
  productNameAr: string | null;
  productCode: number | null;
  productImageUrl: string | null;
  quantity: number;
  price: string;
}

interface TrackedOrder {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  subtotal: string;
  discount: string;
  delivery: string;
  total: string;
  items: TrackedItem[];
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_STEPS: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

const STATUS_META: Record<OrderStatus, {
  labelEn: string; labelAr: string;
  descEn: string;  descAr: string;
  icon: React.ReactNode; color: string;
}> = {
  pending:    { labelEn: "Pending",    labelAr: "في الانتظار",    descEn: "Order received — awaiting confirmation.",           descAr: "تم استلام الطلب — في انتظار التأكيد.",              icon: <Clock className="h-4 w-4" />,        color: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10" },
  confirmed:  { labelEn: "Confirmed",  labelAr: "مؤكد",           descEn: "Your order has been confirmed.",                    descAr: "تم تأكيد طلبك.",                                    icon: <CheckCircle2 className="h-4 w-4" />, color: "text-blue-400 border-blue-400/40 bg-blue-400/10"     },
  processing: { labelEn: "Processing", labelAr: "جاري التجهيز",   descEn: "Your frames are being prepared.",                   descAr: "جاري تجهيز إطاراتك.",                               icon: <Package className="h-4 w-4" />,      color: "text-purple-400 border-purple-400/40 bg-purple-400/10"},
  shipped:    { labelEn: "Shipped",    labelAr: "تم الشحن",       descEn: "Your order is on its way to you.",                  descAr: "طلبك في الطريق إليك.",                              icon: <Truck className="h-4 w-4" />,        color: "text-orange-400 border-orange-400/40 bg-orange-400/10"},
  delivered:  { labelEn: "Delivered",  labelAr: "تم التسليم",     descEn: "Your order has been delivered. Enjoy!",             descAr: "تم تسليم طلبك. استمتع!",                            icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-400 border-green-400/40 bg-green-400/10"  },
  cancelled:  { labelEn: "Cancelled",  labelAr: "ملغي",           descEn: "This order has been cancelled.",                    descAr: "تم إلغاء هذا الطلب.",                               icon: <XCircle className="h-4 w-4" />,      color: "text-red-400 border-red-400/40 bg-red-400/10"        },
};

// ─── Progress stepper ─────────────────────────────────────────────────────────
function StatusStepper({ status, lang }: { status: OrderStatus; lang: "en" | "ar" }) {
  if (status === "cancelled") {
    const meta = STATUS_META.cancelled;
    return (
      <div className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold", meta.color)}>
        {meta.icon}
        {lang === "ar" ? meta.labelAr : meta.labelEn}
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(status);

  return (
    <div className="w-full">
      {/* Mobile: badge only */}
      <div className="flex justify-center md:hidden mb-4">
        <div className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold", STATUS_META[status].color)}>
          {STATUS_META[status].icon}
          {lang === "ar" ? STATUS_META[status].labelAr : STATUS_META[status].labelEn}
        </div>
      </div>

      {/* Desktop: full stepper */}
      <div className="hidden md:flex items-center justify-between w-full">
        {STATUS_STEPS.map((step, idx) => {
          const meta    = STATUS_META[step];
          const done    = idx <= currentIdx;
          const current = idx === currentIdx;
          const isLast  = idx === STATUS_STEPS.length - 1;
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className={cn(
                  "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all",
                  done
                    ? current
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-primary/60 bg-primary/20 text-primary"
                    : "border-white/15 bg-white/5 text-muted-foreground/40"
                )}>
                  {meta.icon}
                </div>
                <span className={cn("text-[11px] font-medium text-center leading-tight", done ? "text-foreground" : "text-muted-foreground/40")}>
                  {lang === "ar" ? meta.labelAr : meta.labelEn}
                </span>
              </div>
              {!isLast && (
                <div className={cn("h-[2px] flex-1 mx-1 rounded-full -mt-5 transition-all", idx < currentIdx ? "bg-primary/50" : "bg-white/10")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Single order card ────────────────────────────────────────────────────────
function OrderCard({ order, lang }: { order: TrackedOrder; lang: "en" | "ar" }) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[order.status];
  const date = new Date(order.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric", month: "long", day: "numeric",
  });
  const hasDiscount = Number(order.discount) > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-secondary/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="font-mono text-sm font-bold text-primary tracking-wider">{order.orderNumber}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {order.items.length} {lang === "ar" ? "منتج" : order.items.length === 1 ? "item" : "items"} ·{" "}
            <span className="text-foreground font-semibold">{Number(order.total).toLocaleString()} EGP</span>
          </p>
        </div>
        <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shrink-0", meta.color)}>
          {meta.icon}
          {lang === "ar" ? meta.labelAr : meta.labelEn}
        </div>
      </div>

      {/* Status description */}
      <div className="px-5 pb-4">
        <p className="text-xs text-muted-foreground italic">
          {lang === "ar" ? meta.descAr : meta.descEn}
        </p>
      </div>

      {/* Progress stepper */}
      <div className="px-5 pb-5">
        <StatusStepper status={order.status} lang={lang} />
      </div>

      {/* Toggle items */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 border-t border-white/10 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
      >
        <span className="flex items-center gap-1.5">
          <ShoppingBag className="h-3.5 w-3.5" />
          {lang === "ar" ? "عرض المنتجات" : "View items"}
        </span>
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-200", expanded ? "rotate-90" : "")} />
      </button>

      {/* Items */}
      {expanded && (
        <div className="border-t border-white/10 divide-y divide-white/5 animate-in fade-in duration-200">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <div className="h-11 w-11 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                {item.productImageUrl
                  ? <img src={item.productImageUrl} alt={item.productName} className="h-full w-full object-cover" loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  : <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground/30" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {lang === "ar" && item.productNameAr ? item.productNameAr : item.productName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.productCode && (
                    <span className="text-[10px] font-mono text-muted-foreground bg-white/8 border border-white/10 px-1.5 py-0.5 rounded">
                      #{item.productCode}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                </div>
              </div>
              <span className="text-sm font-semibold text-foreground shrink-0">
                {(Number(item.price) * item.quantity).toLocaleString()} EGP
              </span>
            </div>
          ))}

          {/* Mini totals */}
          <div className="px-5 py-4 space-y-1.5 bg-white/3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{lang === "ar" ? "سعر المنتجات" : "Items"}</span>
              <span>{Number(order.subtotal).toLocaleString()} EGP</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between text-xs text-green-400">
                <span>{lang === "ar" ? "خصم" : "Discount"}</span>
                <span>−{Number(order.discount).toLocaleString()} EGP</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{lang === "ar" ? "التوصيل" : "Delivery"}</span>
              <span>{Number(order.delivery) === 0 ? (lang === "ar" ? "مجاني" : "Free") : `${Number(order.delivery).toLocaleString()} EGP`}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-white/10">
              <span>{lang === "ar" ? "الإجمالي" : "Total"}</span>
              <span className="text-primary">{Number(order.total).toLocaleString()} EGP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TrackOrder() {
  const { lang, t } = useLanguage();

  const [lookupMode,  setLookupMode]  = useState<"email" | "phone">("email");
  const [email,       setEmail]       = useState("");
  const [phone,       setPhone]       = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [results,     setResults]     = useState<TrackedOrder[] | null>(null);

  const isAr = lang === "ar";

  const canSubmit = lookupMode === "email" ? email.trim().length > 0 : phone.trim().length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const params = new URLSearchParams();
      if (lookupMode === "email") {
        params.set("email", email.trim());
      } else {
        params.set("phone", phone.trim());
      }
      if (orderNumber.trim()) params.set("orderNumber", orderNumber.trim());

      const res = await fetch(`/api/orders/track?${params}`, { credentials: "include" });

      if (res.status === 404) {
        setError(lookupMode === "phone"
          ? t("track.notFoundPhone")
          : t("track.notFound")
        );
        return;
      }
      if (!res.ok) throw new Error("server error");

      const data: TrackedOrder[] = await res.json();
      setResults(data);
    } catch {
      setError(t("track.error"));
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResults(null);
    setError(null);
    setEmail("");
    setPhone("");
    setOrderNumber("");
  }

  function handleModeChange(mode: "email" | "phone") {
    setLookupMode(mode);
    setError(null);
    setResults(null);
  }

  return (
    <div className="min-h-[70vh] py-14 md:py-20 px-4 md:px-6 max-w-2xl mx-auto">
      {/* Back */}
      <Button variant="ghost" asChild className="mb-8 -ms-4 text-muted-foreground hover:text-primary">
        <Link href="/"><ArrowLeft className="me-2 h-4 w-4" /> {isAr ? "الرئيسية" : "Home"}</Link>
      </Button>

      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <Package className="h-8 w-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
          {t("track.title")}
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          {t("track.subtitle")}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-secondary/30 p-6 space-y-4 mb-8">

        {/* Toggle: Email / Phone */}
        <div className="flex rounded-xl bg-background/50 border border-white/10 p-1 gap-1">
          <button
            type="button"
            onClick={() => handleModeChange("email")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all",
              lookupMode === "email"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Mail className="h-4 w-4" />
            {t("track.byEmail")}
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("phone")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all",
              lookupMode === "phone"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Phone className="h-4 w-4" />
            {t("track.byPhone")}
          </button>
        </div>

        {/* Email or Phone input */}
        {lookupMode === "email" ? (
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("track.email")}
              <span className="text-red-400 ms-0.5">*</span>
            </label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="bg-background/60 border-white/20 focus-visible:ring-primary placeholder:text-muted-foreground/50"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("track.phone")}
              <span className="text-red-400 ms-0.5">*</span>
            </label>
            <Input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("track.phone.placeholder")}
              className="bg-background/60 border-white/20 focus-visible:ring-primary placeholder:text-muted-foreground/50"
              dir="ltr"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">
            {t("track.orderNum")}
          </label>
          <Input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            placeholder={isAr ? "مثال: AM-X1Y2Z3" : "e.g. AM-X1Y2Z3"}
            className="bg-background/60 border-white/20 focus-visible:ring-primary placeholder:text-muted-foreground/50 font-mono tracking-wide"
          />
          <p className="text-xs text-muted-foreground/60 mt-1">
            {t("track.orderNumHint")}
          </p>
        </div>

        <Button type="submit" disabled={loading || !canSubmit} className="w-full gap-2 h-11">
          {loading
            ? <><RotateCcw className="h-4 w-4 animate-spin" /> {t("track.searching")}</>
            : <><Search className="h-4 w-4" /> {t("track.submit")}</>}
        </Button>
      </form>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-5 py-4 text-sm text-red-300 text-center animate-in fade-in">
          {error}
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">
              {results.length === 1
                ? (isAr ? "تم العثور على طلب واحد" : "1 order found")
                : (isAr ? `تم العثور على ${results.length} طلبات` : `${results.length} orders found`)}
            </p>
            <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2">
              {isAr ? "بحث جديد" : "New search"}
            </button>
          </div>
          {results.map((order) => (
            <OrderCard key={order.id} order={order} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
