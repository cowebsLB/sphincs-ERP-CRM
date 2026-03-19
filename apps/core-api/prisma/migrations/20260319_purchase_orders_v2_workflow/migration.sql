ALTER TYPE "PurchaseOrderStatus" RENAME TO "PurchaseOrderStatus_old";
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'RECEIVED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

ALTER TABLE "purchase_orders"
ADD COLUMN "po_number" TEXT,
ADD COLUMN "order_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "expected_delivery_date" TIMESTAMPTZ(6),
ADD COLUMN "payment_terms" TEXT,
ADD COLUMN "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "total_tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "total_discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "grand_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN "notes" TEXT,
ADD COLUMN "shipping_address" TEXT,
ADD COLUMN "shipping_method" TEXT,
ADD COLUMN "tracking_number" TEXT,
ADD COLUMN "approved_by" UUID,
ADD COLUMN "approved_at" TIMESTAMPTZ(6);

WITH numbered_orders AS (
  SELECT
    "id",
    'PO-' || TO_CHAR(COALESCE("created_at", CURRENT_TIMESTAMP), 'YYYYMMDD') || '-' ||
      LPAD(ROW_NUMBER() OVER (ORDER BY "created_at", "id")::TEXT, 4, '0') AS generated_po_number
  FROM "purchase_orders"
)
UPDATE "purchase_orders" AS po
SET "po_number" = numbered_orders.generated_po_number
FROM numbered_orders
WHERE po."id" = numbered_orders."id";

ALTER TABLE "purchase_orders"
ALTER COLUMN "po_number" SET NOT NULL;

ALTER TABLE "purchase_orders"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "purchase_orders"
ALTER COLUMN "status" TYPE "PurchaseOrderStatus"
USING (
  CASE
    WHEN "status"::TEXT = 'SENT' THEN 'SUBMITTED'::"PurchaseOrderStatus"
    WHEN "status"::TEXT = 'PARTIALLY_RECEIVED' THEN 'APPROVED'::"PurchaseOrderStatus"
    ELSE "status"::TEXT::"PurchaseOrderStatus"
  END
);

ALTER TABLE "purchase_orders"
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

DROP TYPE "PurchaseOrderStatus_old";

CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

CREATE TABLE "purchase_order_line_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "purchase_order_id" UUID NOT NULL,
  "item_id" UUID,
  "description" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "line_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "received_quantity" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "purchase_order_line_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_po_line_items_po" ON "purchase_order_line_items"("purchase_order_id");
CREATE INDEX "idx_po_line_items_item" ON "purchase_order_line_items"("item_id");

ALTER TABLE "purchase_order_line_items"
ADD CONSTRAINT "purchase_order_line_items_purchase_order_id_fkey"
FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
