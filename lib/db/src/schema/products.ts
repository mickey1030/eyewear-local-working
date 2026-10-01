import { pgTable, serial, integer, text, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  // Auto-assigned by products_code_seq (starts at 1000, increments by 1).
  // Never needs to be passed manually on insert.
  code: integer("code").default(sql`nextval('products_code_seq')`),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  imageUrls: jsonb("image_urls").$type<string[]>().default([]).notNull(),
  color: text("color"),
  brand: text("brand"),
  variant: text("variant"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable)
  .omit({ id: true, code: true, createdAt: true })   // assigned by the DB
  .extend({
    imageUrls: z.array(z.string()).optional(),
  });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
