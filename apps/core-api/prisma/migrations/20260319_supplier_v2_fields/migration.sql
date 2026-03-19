CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLACKLISTED');

ALTER TABLE "suppliers"
ADD COLUMN "supplier_code" TEXT,
ADD COLUMN "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "mobile" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "address_line_1" TEXT,
ADD COLUMN "address_line_2" TEXT,
ADD COLUMN "postal_code" TEXT,
ADD COLUMN "payment_terms" TEXT,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN "tax_id" TEXT,
ADD COLUMN "vat_number" TEXT,
ADD COLUMN "credit_limit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "contact_name" TEXT,
ADD COLUMN "contact_email" TEXT,
ADD COLUMN "contact_phone" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "rating" INTEGER,
ADD COLUMN "preferred_supplier" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "idx_suppliers_status" ON "suppliers"("status");
CREATE UNIQUE INDEX "uq_suppliers_org_supplier_code"
ON "suppliers"("organization_id", "supplier_code");
