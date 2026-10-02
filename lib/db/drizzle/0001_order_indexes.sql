-- Idempotent: safe whether or not the indexes already exist.
-- NOTE: the unique index fails if your database already contains two orders with the same
-- order_number; in that case rename the duplicates first (see README troubleshooting).
CREATE INDEX IF NOT EXISTS "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_order_number_key" ON "orders" USING btree ("order_number");
