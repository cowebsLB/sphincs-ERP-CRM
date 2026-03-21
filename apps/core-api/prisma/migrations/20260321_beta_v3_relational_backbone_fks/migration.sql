-- Beta V3 relational backbone FK enforcement
-- 1) Clean optional orphan references
UPDATE "purchase_orders" po
SET "supplier_id" = NULL
WHERE po."supplier_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "suppliers" s WHERE s."id" = po."supplier_id"
  );

UPDATE "purchase_order_line_items" li
SET "item_id" = NULL
WHERE li."item_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "items" i WHERE i."id" = li."item_id"
  );

UPDATE "leads" l
SET "contact_id" = NULL
WHERE l."contact_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "contacts" c WHERE c."id" = l."contact_id"
  );

UPDATE "opportunities" o
SET "lead_id" = NULL
WHERE o."lead_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "leads" l WHERE l."id" = o."lead_id"
  );

UPDATE "items" i
SET "branch_id" = NULL
WHERE i."branch_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "branches" b WHERE b."id" = i."branch_id"
  );

UPDATE "suppliers" s
SET "branch_id" = NULL
WHERE s."branch_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "branches" b WHERE b."id" = s."branch_id"
  );

UPDATE "purchase_orders" po
SET "branch_id" = NULL
WHERE po."branch_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "branches" b WHERE b."id" = po."branch_id"
  );

UPDATE "contacts" c
SET "branch_id" = NULL
WHERE c."branch_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "branches" b WHERE b."id" = c."branch_id"
  );

UPDATE "leads" l
SET "branch_id" = NULL
WHERE l."branch_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "branches" b WHERE b."id" = l."branch_id"
  );

UPDATE "opportunities" o
SET "branch_id" = NULL
WHERE o."branch_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "branches" b WHERE b."id" = o."branch_id"
  );

UPDATE "audit_logs" a
SET "organization_id" = NULL
WHERE a."organization_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "organizations" org WHERE org."id" = a."organization_id"
  );

-- 2) Validate required organization references before adding non-null FKs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "items" i
    LEFT JOIN "organizations" org ON org."id" = i."organization_id"
    WHERE org."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add items.organization_id FK: orphan organization references detected.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "suppliers" s
    LEFT JOIN "organizations" org ON org."id" = s."organization_id"
    WHERE org."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add suppliers.organization_id FK: orphan organization references detected.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "purchase_orders" po
    LEFT JOIN "organizations" org ON org."id" = po."organization_id"
    WHERE org."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add purchase_orders.organization_id FK: orphan organization references detected.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "contacts" c
    LEFT JOIN "organizations" org ON org."id" = c."organization_id"
    WHERE org."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add contacts.organization_id FK: orphan organization references detected.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "leads" l
    LEFT JOIN "organizations" org ON org."id" = l."organization_id"
    WHERE org."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add leads.organization_id FK: orphan organization references detected.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "opportunities" o
    LEFT JOIN "organizations" org ON org."id" = o."organization_id"
    WHERE org."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add opportunities.organization_id FK: orphan organization references detected.';
  END IF;
END
$$;

-- 3) Add relational backbone foreign keys
ALTER TABLE "purchase_orders"
ADD CONSTRAINT "purchase_orders_supplier_id_fkey"
FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "purchase_order_line_items"
ADD CONSTRAINT "purchase_order_line_items_item_id_fkey"
FOREIGN KEY ("item_id") REFERENCES "items"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leads"
ADD CONSTRAINT "leads_contact_id_fkey"
FOREIGN KEY ("contact_id") REFERENCES "contacts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "opportunities"
ADD CONSTRAINT "opportunities_lead_id_fkey"
FOREIGN KEY ("lead_id") REFERENCES "leads"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "items"
ADD CONSTRAINT "items_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "suppliers"
ADD CONSTRAINT "suppliers_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "purchase_orders"
ADD CONSTRAINT "purchase_orders_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "contacts"
ADD CONSTRAINT "contacts_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "leads"
ADD CONSTRAINT "leads_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "opportunities"
ADD CONSTRAINT "opportunities_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "items"
ADD CONSTRAINT "items_branch_id_fkey"
FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "suppliers"
ADD CONSTRAINT "suppliers_branch_id_fkey"
FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "purchase_orders"
ADD CONSTRAINT "purchase_orders_branch_id_fkey"
FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "contacts"
ADD CONSTRAINT "contacts_branch_id_fkey"
FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leads"
ADD CONSTRAINT "leads_branch_id_fkey"
FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "opportunities"
ADD CONSTRAINT "opportunities_branch_id_fkey"
FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
