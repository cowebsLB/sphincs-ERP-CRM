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
  - Composite indexes for scoped list queries

## Migration Baseline

- Initial migration: `apps/core-api/prisma/migrations/20260316_init/migration.sql`
- Migration lock: `apps/core-api/prisma/migrations/migration_lock.toml`
