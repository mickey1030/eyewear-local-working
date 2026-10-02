import { Router } from "express";
import crypto from "node:crypto";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, productsTable } from "@workspace/db";
import { computeTotals } from "@workspace/catalog";
import { eq, desc, inArray, or, sql } from "drizzle-orm";
import { rateLimit } from "../lib/rateLimit";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

const VALID_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
type ValidStatus = typeof VALID_STATUSES[number];

// ─── Public: create order (called from checkout) ──────────────────────────────
// SECURITY: prices, discount, delivery and total are NEVER taken from the client. The server
// looks each product up in the database and recomputes everything with the shared pricing rules.
const orderLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, message: "Too many orders from this connection. Please try again later." });

const MAX_LINES = 50;
const MAX_QTY = 50;

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function newOrderNumber(): string {
  // 8 chars from an unambiguous alphabet (no 0/O/1/I) -> ~1 trillion combinations
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  return "AM-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

router.post("/orders", orderLimiter, async (req, res, next) => {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;

    const customerName = str(b.customerName, 120);
    const phone = str(b.phone, 40);
    const address = str(b.address, 500);
    const email = str(b.email, 200) || null;
    if (!customerName || !phone || !address) {
      res.status(400).json({ error: "Missing required order fields" });
      return;
    }

    const rawItems = Array.isArray(b.items) ? (b.items as Record<string, unknown>[]) : [];
    if (rawItems.length === 0 || rawItems.length > MAX_LINES) {
      res.status(400).json({ error: "Order must contain between 1 and 50 items" });
      return;
    }

    // Resolve every line to a real product (by id, or by code as a fallback)
    const ids: number[] = [];
    const codes: number[] = [];
    const lines = rawItems.map((raw) => {
      const quantity = Number(raw?.quantity);
      const productId = Number(raw?.productId);
      const productCode = Number(raw?.productCode);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) return null;
      if (Number.isInteger(productId) && productId > 0) ids.push(productId);
      else if (Number.isInteger(productCode) && productCode > 0) codes.push(productCode);
      else return null;
      return {
        quantity,
        productId: Number.isInteger(productId) && productId > 0 ? productId : null,
        productCode: Number.isInteger(productCode) && productCode > 0 ? productCode : null,
        nameAr: str(raw?.nameAr, 200) || null,
      };
    });
    if (lines.some((l) => l === null)) {
      res.status(400).json({ error: "Invalid items in order" });
      return;
    }

    const conditions = [];
    if (ids.length) conditions.push(inArray(productsTable.id, ids));
    if (codes.length) conditions.push(inArray(productsTable.code, codes));
    const products = await db.select().from(productsTable).where(or(...conditions));
    const byId = new Map(products.map((p) => [p.id, p]));
    const byCode = new Map(products.filter((p) => p.code != null).map((p) => [p.code as number, p]));

    const resolved: Array<{ product: (typeof products)[number]; quantity: number; nameAr: string | null }> = [];
    for (const l of lines as NonNullable<(typeof lines)[number]>[]) {
      const product = (l.productId && byId.get(l.productId)) || (l.productCode && byCode.get(l.productCode)) || null;
      if (!product) {
        res.status(400).json({ error: "One of the products in your cart is no longer available. Please refresh your cart." });
        return;
      }
      resolved.push({ product, quantity: l.quantity, nameAr: l.nameAr });
    }

    const subtotal = resolved.reduce((sum, r) => sum + Number(r.product.price) * r.quantity, 0);
    const totals = computeTotals(subtotal, str(b.promoCode, 40));

    // Insert order + items atomically; retry if the (random) order number ever collides.
    let created: { id: number; orderNumber: string } | null = null;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      const orderNumber = newOrderNumber();
      try {
        created = await db.transaction(async (tx) => {
          const [order] = await tx.insert(ordersTable).values({
            orderNumber,
            customerName,
            customerPhone: phone,
            customerEmail: email,
            customerAddress: address,
            subtotal: totals.subtotal.toFixed(2),
            discount: totals.discount.toFixed(2),
            delivery: totals.deliveryFee.toFixed(2),
            total: totals.total.toFixed(2),
            promoCode: totals.promoCode,
            lensChoice: str(b.lensChoice, 40) || null,
            lensType: str(b.lensType, 80) || null,
          }).returning();

          await tx.insert(orderItemsTable).values(
            resolved.map((r) => ({
              orderId: order.id,
              productName: r.product.name,
              productNameAr: r.nameAr,
              productCode: r.product.code,
              productImageUrl: r.product.imageUrl ?? r.product.imageUrls?.[0] ?? null,
              quantity: r.quantity,
              price: Number(r.product.price).toFixed(2),
            })),
          );
          return { id: order.id, orderNumber: order.orderNumber };
        });
      } catch (err) {
        const code = (err as { code?: string; cause?: { code?: string } })?.code ?? (err as { cause?: { code?: string } })?.cause?.code;
        if (code !== "23505") throw err; // only retry on unique-violation
      }
    }
    if (!created) {
      res.status(503).json({ error: "Could not allocate an order number, please try again" });
      return;
    }

    res.status(201).json({
      ...created,
      subtotal: totals.subtotal,
      discount: totals.discount,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      promoCode: totals.promoCode,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Public: track order by email or phone (+ optional order number) ────────
router.get("/orders/track", async (req, res, next) => {
  try {
    const email       = (req.query.email       as string | undefined)?.trim().toLowerCase();
    const phone       = (req.query.phone       as string | undefined)?.trim();
    const orderNumber = (req.query.orderNumber  as string | undefined)?.trim().toUpperCase();

    if (!email && !phone) {
      res.status(400).json({ error: "email or phone is required" });
      return;
    }

    // Normalise phone for comparison: strip spaces, dashes, parens, plus
    const queryPhone = phone ? phone.replace(/[\s\-().+]/g, "") : "";

    const identity = email
      ? sql`lower(${ordersTable.customerEmail}) = ${email}`
      : sql`regexp_replace(${ordersTable.customerPhone}, '[[:space:]().+-]', '', 'g') = ${queryPhone}`;
    const where = orderNumber
      ? sql`${identity} and upper(${ordersTable.orderNumber}) = ${orderNumber}`
      : identity;

    const matched = await db
      .select()
      .from(ordersTable)
      .where(where)
      .orderBy(desc(ordersTable.createdAt));

    if (matched.length === 0) {
      res.status(404).json({ error: "No orders found" });
      return;
    }

    const allItems = await db
      .select()
      .from(orderItemsTable)
      .where(inArray(orderItemsTable.orderId, matched.map((o) => o.id)));

    const result = matched.map((o) => ({
      id:           o.id,
      orderNumber:  o.orderNumber,
      status:       o.status,
      createdAt:    o.createdAt,
      subtotal:     o.subtotal,
      discount:     o.discount,
      delivery:     o.delivery,
      total:        o.total,
      items: allItems
        .filter((i) => i.orderId === o.id)
        .map((i) => ({
          productName:     i.productName,
          productNameAr:   i.productNameAr,
          productCode:     i.productCode,
          productImageUrl: i.productImageUrl,
          quantity:        i.quantity,
          price:           i.price,
        })),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── Admin: list all orders with items ───────────────────────────────────────
router.get("/admin/orders", requireAdmin, async (req, res, next) => {
  try {
    const orders   = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    const allItems = orders.length
      ? await db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, orders.map((o) => o.id)))
      : [];

    const result = orders.map((o) => ({
      ...o,
      items: allItems.filter((item) => item.orderId === o.id),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── Admin: update order status ───────────────────────────────────────────────
router.put("/admin/orders/:id/status", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const { status } = req.body as { status?: string };
    if (!status || !VALID_STATUSES.includes(status as ValidStatus)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const [updated] = await db
      .update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "Order not found" }); return; }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
