-- Hand-edited so it is safe on BOTH a brand-new Neon database and one that already has these tables:
--  * products.code uses a sequence that drizzle-kit does not model, so it is created here first
--    (starts at 1000, matching the original Replit database).
--  * every statement is idempotent (IF NOT EXISTS / duplicate_object guard).
CREATE SEQUENCE IF NOT EXISTS "products_code_seq" START WITH 1000 INCREMENT BY 1;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" integer DEFAULT nextval('products_code_seq'),
	"name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"image_url" text,
	"image_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"color" text,
	"brand" text,
	"variant" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"product_name_ar" text,
	"product_code" integer,
	"product_image_url" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text,
	"customer_address" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"delivery" numeric(10, 2) DEFAULT '75' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"promo_code" text,
	"lens_choice" text,
	"lens_type" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;