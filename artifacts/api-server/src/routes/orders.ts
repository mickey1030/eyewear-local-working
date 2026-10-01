import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable } from "@workspace/db";
import { eq, desc, inArray, sql } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

const VALID_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
type ValidStatus = typeof VALID_STATUSES[number];

// ─── Public: create order (called from checkout) ──────────────────────────────
router.post("/orders", async (req, res, next) => {
  try {
    const b = req.body as {
      orderNumber: string;
      customerName: string;
      phone: string;
      email?: string;
      address: string;
      subtotal: number;
      discount: number;
      deliveryFee: number;
      total: number;
      promoCode?: string;
      lensChoice?: string;
      lensType?: string;
      items: Array<{ name: string; nameAr?: string; quantity: number; price: number; productCode?: number; productImageUrl?: string }>;
    };

    if (!b.orderNumber || !b.customerName || !b.phone || !b.address) {
      res.status(400).json({ error: "Missing required order fields" });
      return;
    }

    const nums = [b.subtotal, b.discount, b.deliveryFee, b.total].filter((n) => n !== undefined);
    const itemsValid =
      b.items === undefined ||
      (Array.isArray(b.items) &&
        b.items.every((i) => i && typeof i.name === "string" && Number.isFinite(Number(i.price)) && Number.isInteger(Number(i.quantity)) && Number(i.quantity) > 0));
    if (!nums.every((n) => Number.isFinite(Number(n))) || !itemsValid) {
      res.status(400).json({ error: "Invalid amounts or items" });
      return;
    }

    const [order] = await db.insert(ordersTable).values({
      orderNumber:     b.orderNumber,
      customerName:    b.customerName,
      customerPhone:   b.phone,
      customerEmail:   b.email ?? null,
      customerAddress: b.address,
      subtotal:        String(b.subtotal ?? 0),
      discount:        String(b.discount ?? 0),
      delivery:        String(b.deliveryFee ?? 75),
      total:           String(b.total ?? 0),
      promoCode:       b.promoCode ?? null,
      lensChoice:      b.lensChoice ?? null,
      lensType:        b.lensType ?? null,
    }).returning();

    if (b.items?.length) {
      await db.insert(orderItemsTable).values(
        b.items.map((item) => ({
          orderId:         order.id,
          productName:     item.name,
          productNameAr:   item.nameAr ?? null,
          productCode:     item.productCode ?? null,
          productImageUrl: item.productImageUrl ?? null,
          quantity:        item.quantity,
          price:           String(item.price),
        }))
      );
    }

    res.status(201).json({ id: order.id, orderNumber: order.orderNumber });
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
