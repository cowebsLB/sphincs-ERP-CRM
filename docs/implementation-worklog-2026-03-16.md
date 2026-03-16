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
