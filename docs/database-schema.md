# Database Schema Standards

For the **long-term enterprise target** (107 tables, all domains), see [Database System Design (reference notes)](./database-system-design-reference.md), the [full text extraction](./SPHINCS-Database-System-Design.md), and [implementation roadmap](./implementation-roadmap.md).

- PostgreSQL (Supabase), UUID primary keys via `gen_random_uuid()`
- `pgcrypto` extension is enabled in initial migration for UUID generation
- All timestamps use `TIMESTAMPTZ`
- Soft deletes via `deleted_at`
- Traceability via `created_by` and `updated_by`
- Organization-aware modeling via `organization_id`
- Index strategy:
  - `organization_id`, `branch_id`, `status`, `deleted_at`, `created_at`
  - Status indexes for leads, opportunities, purchase_orders
  - Status and category indexes for items
  - Composite indexes for scoped list queries

## Beta V2 Item Expansion (2026-03-19)

The `items` model was expanded for the Beta V2 ERP rebuild.

Item fields now include:

- identity:
  - `name`
  - `sku`
  - `description`
  - `status`
- pricing:
  - `cost_price`
  - `selling_price`
  - `currency`
  - `tax_rate`
  - `discountable`
- inventory:
  - `track_inventory`
  - `quantity_on_hand`
  - `reorder_level`
  - `max_stock_level`
  - `unit_of_measure`
  - `barcode`
- classification:
  - `category_id`
  - `tags`
  - `brand`
- advanced:
  - `is_service`

Schema notes:

- `sku` is now required.
- Items are unique per org by `organization_id + sku`.
- Services disable inventory semantics at the application layer.
- Numeric pricing and tax fields use `DECIMAL`.

## Beta V2 Supplier Expansion (2026-03-19)

The `suppliers` model was expanded for the Beta V2 ERP rebuild so supplier records can act as connected purchasing profiles instead of basic contact stubs.

Supplier fields now include:

- identity:
  - `name`
  - `supplier_code`
  - `status`
  - `email`
  - `phone`
  - `mobile`
  - `website`
- address:
  - `country`
  - `city`
  - `address_line_1`
  - `address_line_2`
  - `postal_code`
- financial:
  - `payment_terms`
  - `currency`
  - `tax_id`
  - `vat_number`
  - `credit_limit`
  - `balance`
- contact person:
  - `contact_name`
  - `contact_email`
  - `contact_phone`
- internal:
  - `notes`
  - `rating`
  - `preferred_supplier`

Schema notes:

- `status` is now an enum: `ACTIVE | INACTIVE | BLACKLISTED`.
- `supplier_code` is unique per organization.
- `balance` remains system-owned/read-only in the current app flow.
- The richer supplier record feeds purchase-order supplier selection and future vendor-linked flows.

## Beta V2 Purchase Order Workflow Expansion (2026-03-19)

The `purchase_orders` model was expanded for the Beta V2 ERP workflow rebuild so purchase orders can behave like transactional records instead of thin headers.

Purchase order fields now include:

- header:
  - `po_number`
  - `supplier_id`
  - `status`
  - `order_date`
  - `expected_delivery_date`
  - `payment_terms`
- totals:
  - `subtotal`
  - `total_tax`
  - `total_discount`
  - `grand_total`
- logistics and payment:
  - `payment_status`
  - `notes`
  - `shipping_address`
  - `shipping_method`
  - `tracking_number`
- workflow metadata:
  - `approved_by`
  - `approved_at`

New line item model:

- `purchase_order_line_items`
  - `purchase_order_id`
  - `item_id`
  - `description`
  - `quantity`
  - `unit_cost`
  - `tax_rate`
  - `discount`
  - `line_total`
  - `received_quantity`

Schema notes:

- purchase-order statuses now align to:
  - `DRAFT`
  - `SUBMITTED`
  - `APPROVED`
  - `RECEIVED`
  - `CANCELLED`
- payment state is tracked separately via:
  - `UNPAID`
  - `PARTIAL`
  - `PAID`
- totals are computed in the application layer and stored on the order header.
- partial delivery is represented at the line level through `received_quantity`.

## Demo database seed (implemented Prisma models)

`pnpm --filter @sphincs/core-api prisma:seed` runs:

1. **Baseline** (`prisma/seed.ts`) — subscription plan, default org/branch, roles, admin user, baseline permissions, org setting `modules.beta.scope`.
2. **Demo graph** (`prisma/seed/demo-graph.ts`) — deterministic UUIDs and stable business keys (`SEED-*`) so re-runs **upsert** safely.

The demo graph populates **every Prisma-mapped domain table** except **`refresh_tokens`** (session data only; not seeded). It includes:

- second **branch**, **staff** user (`staff@sphincs.local`, same dev password as admin) with **Staff** role  
- **items** (stocked + service SKU), **suppliers**, **purchase order** + **lines**  
- **warehouse locations** (parent/child on main branch, dock on secondary)  
- **inventory stocks** (main + secondary branch), **inventory movements** (with valid `reference_type` / `reference_id` pairs where used)  
- **CRM**: contact → lead → opportunity  
- **goods receipt** + line, **inventory lot** + **lot balance** (timestamps satisfy DB temporal checks)  
- **stock transfer** + line (cross-branch, **COMPLETED** with ordered dispatch/receive dates)  
- **stock adjustment** + line (**APPLIED** with `applied_at` after `created_at`)  
- **stock dispatch** + line, **dispatch pick/pack jobs** + lines  
- **stock return** + line  
- **inventory reservation** (reference paired to dispatch), **reorder rule**, **stock alert**, **audit log** row  

Full blueprint (**107** logical tables) is **not** fully modeled in Prisma yet; see [Blueprint vs Prisma tables](./blueprint-vs-prisma-tables.md). This seed covers the **~40** `@@map` tables present in `schema.prisma` (minus refresh tokens).

## Migration Baseline

- Initial migration: `apps/core-api/prisma/migrations/20260316_init/migration.sql`
- Item expansion migration: `apps/core-api/prisma/migrations/20260319_item_v2_fields/migration.sql`
- Supplier expansion migration: `apps/core-api/prisma/migrations/20260319_supplier_v2_fields/migration.sql`
- Purchase-order workflow migration: `apps/core-api/prisma/migrations/20260319_purchase_orders_v2_workflow/migration.sql`
- Migration lock: `apps/core-api/prisma/migrations/migration_lock.toml`
