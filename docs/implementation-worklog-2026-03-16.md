# Implementation Worklog (2026-03-16)

## Context

This document records the full greenfield implementation of Rebuild Plan V1.4 for:

- Monorepo with `pnpm workspaces`
- Separate apps: ERP (`apps/erp-web`) and CRM (`apps/crm-web`)
- Shared backend: NestJS API (`apps/core-api`)
- Shared packages for contracts/client/UI primitives
- Documentation governance with `docs/index.md` as canonical docs entry

## What Was Implemented

### 1) Repository and workspace foundation

- Root workspace and scripts:
  - `pnpm-workspace.yaml`
  - root `package.json` with recursive `dev/build/test/lint`
- Root `.gitignore`
- Minimal root `README.md` with:
  - purpose
  - quick start
  - docs link
  - top-level structure

### 2) Documentation governance

- Added and organized docs under `docs/`
- Created canonical docs entry point: `docs/index.md`
- Added domain docs:
  - architecture overview
  - backend module boundaries
  - DB schema standards
  - API conventions
  - setup and testing strategy

### 3) Shared packages

- `packages/shared-types`:
  - `pagination.ts`
  - `filters.ts`
  - `api-response.ts`
- `packages/api-client`: typed fetch wrapper skeleton
- `packages/ui-core`: shared UI constants placeholder

### 4) Frontend apps

- `apps/erp-web` (React + Vite)
- `apps/crm-web` (React + Vite)
- Both apps compile and build independently

### 5) Backend app and module boundaries

Implemented `apps/core-api` with requested modular structure:

- `core/`: `auth`, `users`, `roles`, `organizations`, `branches`
- `erp/`: `items`, `purchasing`, `suppliers`
- `crm/`: `contacts`, `leads`, `opportunities`
- `audit/`
- `health/`
- `logging/`
- `system/`

Also implemented:

- Global API prefix `/api/v1` (with `/health` excluded)
- Request validation pipe
- Role metadata decorator and global role guard
- Request logging middleware
- Audit interceptor and audit service/controller
- Health endpoint and system info endpoint

### 6) Data model contract (Prisma)

Added `apps/core-api/prisma/schema.prisma` with:

- UUID IDs (`gen_random_uuid()`)
- `TIMESTAMPTZ` timestamps
- `deleted_at` soft delete field
- `created_by` and `updated_by`
- Organization-aware modeling (`organization_id`, `branch_id` where relevant)
- Workflow status enums:
  - leads
  - opportunities
  - purchase_orders
- Index strategy:
  - `organization_id`, `branch_id`, `status`, `deleted_at`, `created_at`
  - explicit status indexes
  - composite scoped list indexes

## API Surface Delivered

- Core auth:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `GET /api/v1/auth/me`
- ERP:
  - `GET/POST/PATCH /api/v1/erp/items`
  - `GET/POST/PATCH /api/v1/erp/purchase-orders`
  - `GET/POST/PATCH /api/v1/erp/suppliers`
- CRM:
  - `GET/POST/PATCH /api/v1/crm/contacts`
  - `GET/POST/PATCH /api/v1/crm/leads`
  - `GET/POST/PATCH /api/v1/crm/opportunities`
- Ops:
  - `GET /health`
  - `GET /api/v1/system/info`
  - `GET /api/v1/audit/logs`

## What Went Wrong, How It Was Fixed, and Why

### Issue A: `pnpm install` timed out on first run

- Symptom:
  - Initial install command exceeded default timeout.
- Root cause:
  - Fresh workspace dependency resolution + package extraction took longer than the initial timeout.
- Fix:
  - Re-ran `pnpm install` with a longer timeout.
- Why this fix:
  - No functional repo issue; it was command-runtime related.

### Issue B: Frontend build failed due to external PostCSS config discovery

- Symptom:
  - Vite build in both web apps failed with:
    - loading PostCSS plugin failed
    - missing `tailwindcss`
  - Error referenced a parent-level config outside the repo.
- Root cause:
  - Vite auto-discovered a global/parent PostCSS config file (`C:\Users\COWebs.lb\postcss.config.js`) unrelated to this project.
- Fix:
  - Added explicit local Vite CSS PostCSS config with empty plugin list in both app `vite.config.ts`.
- Why this fix:
  - Forces deterministic, repo-local behavior and prevents host-environment leakage.

### Issue C: Backend build failed because Prisma client type was unavailable

- Symptom:
  - `PrismaClient` import/type methods (`$connect`, `$on`) failed during `nest build`.
- Root cause:
  - Prisma client generation scripts were blocked by package manager build-script policy in this environment, so generated client typings were unavailable at compile time.
- Fix:
  - Switched `PrismaService` to scaffold-safe mode (Nest injectable without hard compile dependency on generated Prisma client methods).
- Why this fix:
  - Keeps scaffold build passing immediately while preserving schema and migration contract for next step (DB wiring).

### Issue D: Nest/TypeScript controller return-type declaration errors (TS4053)

- Symptom:
  - Controllers reported exported method return types referencing non-exported internal record interfaces.
- Root cause:
  - Inferred method return types depended on private/internal interfaces in service files.
- Fix:
  - Added explicit `: unknown` return types on controller methods to decouple controller API signatures from internal service interface declarations.
- Why this fix:
  - Fast and stable compile fix for scaffolding stage; avoids leaking internal types while enabling later DTO formalization.

## Validation and Results

The following commands completed successfully after fixes:

- `pnpm install`
- `pnpm -r --if-present build`
- `pnpm -r --if-present test`

Backend tests currently cover:

- lead defaults and soft-delete filtering behavior
- purchase-order default status
- health endpoint response shape
- system info endpoint response shape

## Current State and Next Build Step

Current backend module services are scaffold-level (in-memory behavior) and API contract complete.

Next implementation step is to wire services to Prisma/Supabase persistence:

1. Generate and use Prisma client in CI/local setup
2. Add migrations and seed data (org, branch, roles, admin)
3. Replace in-memory services with DB-backed repository/service calls
4. Expand unit/integration/e2e coverage on real persistence paths

## Update: Milestone 1.1 Progress (Prisma Foundation)

Completed in follow-up work:

1. Re-enabled real Prisma client usage in `PrismaService` (`extends PrismaClient` with `$connect` and shutdown hooks).
2. Added `pnpm.onlyBuiltDependencies` in root `package.json` to permit Prisma/Nest build scripts during install/rebuild.
3. Added Prisma operational scripts in `apps/core-api/package.json`:
   - `prisma:generate`
   - `prisma:deploy`
   - `prisma:seed`
4. Added seed script at `apps/core-api/prisma/seed.ts`:
   - seeds one organization
   - one branch
   - base roles
   - admin user + admin role assignment
5. Created initial migration baseline:
   - `apps/core-api/prisma/migrations/20260316_init/migration.sql`
   - `apps/core-api/prisma/migrations/migration_lock.toml`
   - includes `CREATE EXTENSION IF NOT EXISTS pgcrypto;`

### Additional issue encountered and fix

- Symptom:
  - Prisma client types can fail to materialize when install-time build scripts are blocked.
- Fix:
  - Added `pnpm.onlyBuiltDependencies` allowlist and ran `pnpm rebuild` followed by `prisma generate`.
- Why:
  - Makes Prisma client generation reliable in local and CI-like environments without manual one-off workarounds.

### Local Postgres validation (2026-03-16)

Validation executed against local PostgreSQL 18:

1. Created DB: `sphincs_erp_crm`
2. Applied migration baseline and seed:
   - `prisma:generate`
   - `prisma:deploy`
   - `prisma:seed`
3. Verified table set exists, including `_prisma_migrations`
4. Verified seed counts:
   - organizations: 1
   - branches: 1
   - users: 1
   - roles: 4
   - user_roles: 1
5. Verified API runtime endpoints return `200`:
   - `/health`
   - `/api/v1/system/info`

### Additional runtime issues and fixes

- Issue:
  - `pnpm --filter @sphincs/core-api start` failed because script pointed to `dist/main.js`.
- Root cause:
  - Nest build emits entrypoint under `dist/src/main.js`.
- Fix:
  - Updated start script to `node dist/src/main.js`.
- Why:
  - Aligns runtime command with actual Nest build output.

- Issue:
  - `EADDRINUSE` encountered on port `3000` during repeated local starts.
- Root cause:
  - Existing process already bound to port 3000 from a previous run.
- Fix:
  - Reused running instance for endpoint validation and then cleared listener.
- Why:
  - Confirms runtime health without invalidating the validation run.

## Update: Service Persistence Wiring (2026-03-16)

Completed conversion from in-memory storage to Prisma-backed persistence for:

- `core/organizations`
- `core/branches`
- `core/users`
- `erp/items`
- `erp/suppliers`
- `erp/purchasing` (purchase orders)

### What changed

1. Services now inject `PrismaService` and execute real `findMany/create/update` operations.
2. Soft-delete filtering is preserved:
   - default reads exclude `deleted_at != null`
   - `includeDeleted` flow still supported in ERP services.
3. Controller `PATCH` signatures in core modules were corrected to pass route `:id` to update methods.
4. Purchasing unit test was updated to use mocked Prisma calls because service methods are now async DB-backed.

### Validation

- `pnpm -r --if-present build` passed
- `pnpm -r --if-present test` passed

### Remaining in persistence track

- CRM services (`contacts`, `leads`, `opportunities`) are still in-memory and should be converted next.
- Auth remains scaffolded and should be linked to real user/password verification against DB records.

### Runtime fix after Prisma service adoption

- Issue:
  - `core-api` failed to boot in watch mode with:
    - `Nest can't resolve dependencies of the UsersService (PrismaService)`
- Root cause:
  - `PrismaService` was not available in feature module DI context when services started injecting it.
- Fix:
  - Added global `PrismaModule` that provides/exports `PrismaService`.
  - Imported `PrismaModule` in `AppModule`.
- Result:
  - API boots successfully and responds on `http://localhost:3000/health`.
