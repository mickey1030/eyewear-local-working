import { pgTable, serial, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id:              serial("id").primaryKey(),
  orderNumber:     text("order_number").notNull(),
  customerName:    text("customer_name").notNull(),
  customerPhone:   text("customer_phone").notNull(),
  customerEmail:   text("customer_email"),
  customerAddress: text("customer_address").notNull(),
  status:          text("status").notNull().default("pending"),
  subtotal:        numeric("subtotal",  { precision: 10, scale: 2 }).notNull(),
  discount:        numeric("discount",  { precision: 10, scale: 2 }).notNull().default("0"),
  delivery:        numeric("delivery",  { precision: 10, scale: 2 }).notNull().default("75"),
  total:           numeric("total",     { precision: 10, scale: 2 }).notNull(),
  promoCode:       text("promo_code"),
  lensChoice:      text("lens_choice"),
  lensType:        text("lens_type"),
  notes:           text("notes"),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItemsTable = pgTable("order_items", {
  id:              serial("id").primaryKey(),
  orderId:         integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  productName:     text("product_name").notNull(),
  productNameAr:   text("product_name_ar"),
  productCode:     integer("product_code"),
  productImageUrl: text("product_image_url"),
  quantity:        integer("quantity").notNull().default(1),
  price:           numeric("price", { precision: 10, scale: 2 }).notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });

export type InsertOrder     = z.infer<typeof insertOrderSchema>;
export type Order           = typeof ordersTable.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem       = typeof orderItemsTable.$inferSelect;
