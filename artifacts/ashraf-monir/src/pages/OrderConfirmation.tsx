import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Package, User, Phone, Mail, MapPin, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface OrderData {
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  items: { name: string; nameAr: string; quantity: number; price: number }[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  promoCode?: string;
  orderType: string;
  lensType?: string;
}

export default function OrderConfirmation() {
  const { t, lang } = useLanguage();
  const [order, setOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("am_last_order");
      if (raw) setOrder(JSON.parse(raw));
    } catch {
      setOrder(null);
    }
  }, []);

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 gap-6">
        <h2 className="text-2xl font-serif">{t("order.noData")}</h2>
        <Button asChild><Link href="/">{t("cat.returnHome")}</Link></Button>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-20 animate-in fade-in zoom-in-95 duration-500">
      <div className="container mx-auto px-4 md:px-6 max-w-2xl">

        {/* Order number + status */}
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2 text-sm font-mono tracking-widest text-primary">
            <Package className="h-4 w-4" />
            {t("order.number")}: {order.orderNumber}
          </div>

          <div className="h-20 w-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-3xl md:text-4xl font-serif font-bold">{t("checkout.success.title")}</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {t("order.thankYou")}
          </p>
        </div>

        {/* Customer details */}
        <div className="rounded-2xl border border-white/10 bg-secondary/20 p-6 space-y-4 mb-6">
          <h2 className="font-serif font-semibold text-lg mb-2">{t("order.yourDetails")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">{t("checkout.name")}</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">{t("checkout.phone")}</p>
                <p className="font-medium">{order.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">{t("checkout.email")}</p>
                <p className="font-medium">{order.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">{t("checkout.address")}</p>
                <p className="font-medium">{order.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order items */}
        <div className="rounded-2xl border border-white/10 bg-secondary/20 p-6 space-y-4 mb-6">
          <h2 className="font-serif font-semibold text-lg mb-2">{t("order.items")}</h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{lang === "ar" ? item.nameAr : item.name}</span>
                  {item.quantity > 1 && (
                    <span className="text-muted-foreground">×{item.quantity}</span>
                  )}
                </div>
                <span className="font-medium">{item.price * item.quantity} EGP</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-white/10 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{t("checkout.itemPrice")}</span>
              <span>{order.subtotal} EGP</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>{t("promo.discount")} ({order.promoCode})</span>
                <span>−{order.discount} EGP</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>{t("checkout.delivery")}</span>
              <span>{order.deliveryFee === 0 ? t("checkout.freeShipping") : `${order.deliveryFee} EGP`}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-white/10">
              <span>{t("checkout.total")}</span>
              <span className="text-primary">{order.total} EGP</span>
            </div>
          </div>
        </div>

        <Button asChild size="lg" className="w-full h-12">
          <Link href="/">{t("checkout.success.return")}</Link>
        </Button>
      </div>
    </div>
  );
}
