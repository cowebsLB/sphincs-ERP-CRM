# Database Schema Standards

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

## Migration Baseline

- Initial migration: `apps/core-api/prisma/migrations/20260316_init/migration.sql`
- Item expansion migration: `apps/core-api/prisma/migrations/20260319_item_v2_fields/migration.sql`
- Migration lock: `apps/core-api/prisma/migrations/migration_lock.toml`
