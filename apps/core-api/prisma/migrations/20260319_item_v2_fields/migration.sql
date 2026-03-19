CREATE TYPE "ItemStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

UPDATE "items"
SET "sku" = CONCAT('ITEM-', UPPER(SUBSTRING(REPLACE("id"::text, '-', '') FROM 1 FOR 12)))
WHERE "sku" IS NULL OR BTRIM("sku") = '';

ALTER TABLE "items"
ALTER COLUMN "sku" SET NOT NULL,
ADD COLUMN "description" TEXT,
ADD COLUMN "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "cost_price" DECIMAL(12, 2) NOT NULL DEFAULT 0,
ADD COLUMN "selling_price" DECIMAL(12, 2) NOT NULL DEFAULT 0,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN "track_inventory" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "reorder_level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "max_stock_level" INTEGER,
ADD COLUMN "unit_of_measure" TEXT NOT NULL DEFAULT 'piece',
ADD COLUMN "category_id" TEXT,
ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "brand" TEXT,
ADD COLUMN "barcode" TEXT,
ADD COLUMN "is_service" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "tax_rate" DECIMAL(5, 2) NOT NULL DEFAULT 0,
ADD COLUMN "discountable" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "idx_items_status" ON "items"("status");
CREATE INDEX "idx_items_category" ON "items"("category_id");
CREATE UNIQUE INDEX "uq_items_org_sku" ON "items"("organization_id", "sku");
