import { Router } from "express";
import { db, productsTable, insertProductSchema } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.get("/products", async (req, res, next) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .orderBy(desc(productsTable.createdAt), desc(productsTable.id));
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.post("/products", requireAdmin, async (req, res, next) => {
  try {
    const parsed = insertProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const [product] = await db.insert(productsTable).values(parsed.data).returning();
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

router.put("/products/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    // Use partial schema so callers can update any subset of fields without wiping the rest
    const parsed = insertProductSchema.partial().safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
    // Strip undefined so Drizzle doesn't attempt to set columns we didn't receive
    const data = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));
    if (Object.keys(data).length === 0) { res.status(400).json({ error: "No fields to update" }); return; }
    const [updated] = await db.update(productsTable).set(data).where(eq(productsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/products/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
