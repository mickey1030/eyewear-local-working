// Single source of truth for pricing rules. Used by BOTH the storefront (to show totals)
// and the API (to recompute them server-side, so a customer can't tamper with prices).

export const DELIVERY_FEE = 75;
export const FREE_SHIPPING_THRESHOLD = 2000;

export type PromoRule = { type: "percent" | "fixed"; value: number };

export const PROMO_CODES: Record<string, PromoRule> = {
  SAVE10: { type: "percent", value: 10 },
  MONIR20: { type: "percent", value: 20 },
  WELCOME: { type: "fixed", value: 100 },
};

export function findPromo(code: string | null | undefined): { code: string; rule: PromoRule } | null {
  const c = (code ?? "").trim().toUpperCase();
  const rule = PROMO_CODES[c];
  return rule ? { code: c, rule } : null;
}

export function computeTotals(subtotal: number, promoCode?: string | null) {
  const promo = findPromo(promoCode);
  const discount = promo
    ? promo.rule.type === "percent"
      ? Math.round((subtotal * promo.rule.value) / 100)
      : Math.min(promo.rule.value, subtotal)
    : 0;
  const discounted = subtotal - discount;
  const deliveryFee = subtotal <= 0 ? 0 : discounted >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_FEE;
  return { promoCode: promo?.code ?? null, subtotal, discount, deliveryFee, total: discounted + deliveryFee };
}
