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

## Update: Backend Hardening Batch (2026-03-16)

Completed backend items:

1. CRM persistence conversion:
   - `contacts`, `leads`, `opportunities` moved from in-memory arrays to Prisma persistence.

2. Real auth:
   - login now verifies users against DB records.
   - password hashing/verification now uses `bcryptjs`.
   - legacy sha256 hashes are auto-upgraded to bcrypt on successful login.

3. Refresh token persistence and rotation:
   - added `refresh_tokens` model/table.
   - refresh flow validates active token hash in DB.
   - successful refresh revokes old token and issues a rotated refresh token.

4. Real RBAC:
   - removed header-trusted role checks.
   - `RolesGuard` now validates JWT bearer token and resolves roles from `user_roles` + `roles`.

5. Audit persistence:
   - audit writes now persist to `audit_logs` via Prisma.
   - list endpoint now queries DB-backed audit logs with filters.

6. Soft-delete restore policy:
   - added `POST :id/restore` for core/ERP/CRM resource controllers:
     - organizations, branches, users
     - items, suppliers, purchase-orders
     - contacts, leads, opportunities

7. API error envelope:
   - added a global exception filter returning normalized `{ success, error, meta }` response shape.

8. Seed and startup fixes:
   - seed now writes bcrypt password hashes.
   - `core-api` start path kept aligned to Nest output (`dist/src/main.js`).

### Migration additions

- Added migration:
  - `prisma/migrations/20260316_refresh_tokens/migration.sql`
- Applied locally and validated.

### Validation summary

- `prisma generate`: success
- `prisma migrate deploy`: success
- `prisma db seed`: success
- `pnpm -r --if-present build`: success
- `pnpm -r --if-present test`: success

### Known remaining backend tasks

- broaden integration/e2e coverage for auth + RBAC + audit + restore.
- run the same migration/seed/smoke procedure on Supabase environment.

## Update: Frontend Auth + CRUD Wiring (2026-03-16)

Completed initial frontend implementation for both apps:

1. ERP and CRM now have:
   - login page
   - localStorage-backed session persistence
   - protected routing
   - logout behavior

2. Token lifecycle:
   - both apps use `@sphincs/api-client`
   - bearer token is attached to protected requests
   - refresh token flow auto-runs on `401`
   - refreshed tokens are persisted in session state

3. Role-aware app access:
   - ERP app allows `Admin` and `ERP Manager`
   - CRM app allows `Admin` and `CRM Manager`

4. Module API wiring:
   - ERP:
     - items
     - suppliers
     - purchase-orders
   - CRM:
     - contacts
     - leads
     - opportunities

5. Module actions currently available in UI:
   - list
   - create
   - patch/edit
   - soft-delete
   - restore
   - include deleted toggle

### Validation

- workspace install/build/test succeeded after frontend changes.
- frontend bundles built successfully for both ERP and CRM apps.

### Notes

- current UI is intentionally functional-first and still needs a design pass.
- inline JSON patch prompt is a temporary editing mechanism and should be replaced with dedicated edit forms.

## Update: Frontend Polish Step (2026-03-16)

Completed:

1. Added shared UI primitives in `packages/ui-core`:
   - `DataTable` with search, sorting, and pagination.
   - `ResourceManager` with create/edit forms and row actions.

2. Integrated shared components into both ERP and CRM apps:
   - replaced ad-hoc list rendering with reusable table manager.
   - removed JSON prompt-based edit path.
   - added real edit form workflow for resource updates.

3. Packaging fix:
   - added explicit `exports` map in `@sphincs/ui-core` package to fix Vite resolution for workspace package imports.

Validation:

- workspace build: pass
- workspace tests: pass

## Update: Frontend Visual Pass (2026-03-16)

Completed:

1. Added shared styling system in `ui-core` (`ui.css`) with:
   - design tokens (color/spacing/radius/shadow)
   - form/button/table primitives
   - app shell layout styles
   - toast/feedback styles

2. Applied app-shell layout to ERP and CRM:
   - sidebar navigation
   - topbar actions
   - content pane structure

3. UX feedback improvements:
   - success/error toasts for CRUD actions
   - loading indicator and empty state handling in resource manager

4. Form UX improvements:
   - inline required-field validation for create/edit forms

Validation:

- workspace install/build/test all passing after visual pass.

## Update: Frontend Test Baseline (2026-03-16)

Completed:

1. Added test toolchain in both frontend apps:
   - `vitest`
   - `@testing-library/react`
   - `@testing-library/jest-dom`
   - `jsdom`

2. Added test configuration in both app `vite.config.ts` files:
   - `environment: "jsdom"`
   - setup file wiring

3. Added app entry split for testability:
   - `src/app.tsx` exports `RootApp`
   - `src/main.tsx` only mounts `RootApp`

4. Added initial tests for ERP and CRM:
   - login view render
   - successful login flow to authorized shell
   - unauthorized-role block rendering

Validation:

- `pnpm install`: pass
- `pnpm -r --if-present build`: pass
- `pnpm -r --if-present test`: pass
- ERP tests: pass
- CRM tests: pass

Notes:

- React Router future-flag warnings were emitted during tests but did not fail execution.
- Next frontend testing step is to add resource CRUD + refresh token/session behavior coverage.

## Update: GitHub Pages Deployment Fix (2026-03-17)

Issue observed:

- Visiting `https://cowebslb.github.io/sphincs-ERP-CRM` showed repository README content
  instead of deployed frontend apps.

Root cause:

- GitHub Pages had no explicit built site artifact for this monorepo frontend setup.

Fix implemented:

1. Added Pages workflow: `.github/workflows/deploy-pages.yml`
   - builds ERP app with Pages base path `/sphincs-ERP-CRM/erp/`
   - builds CRM app with Pages base path `/sphincs-ERP-CRM/crm/`
   - assembles `_site` artifact with:
     - root landing page
     - `/erp/` app assets
     - `/crm/` app assets
2. Added static landing page:
   - `apps/web-home/index.html`
   - links users to ERP and CRM entry points
3. Added frontend base-path support:
   - `apps/erp-web/vite.config.ts` reads `VITE_PUBLIC_BASE`
   - `apps/crm-web/vite.config.ts` reads `VITE_PUBLIC_BASE`
4. Switched both frontend apps to `HashRouter` for static-hosting route stability.

Why this approach:

- Keeps the monorepo structure intact while deploying both apps from one Pages site.
- Prevents deep-link refresh failures common with static hosting and browser history routing.

## Update: GitHub Pages CI Follow-up Fix (2026-03-17)

Issue observed after initial workflow push:

- GitHub Actions failure:
  - `Multiple versions of pnpm specified`
- Runtime warning:
  - Node 20 JavaScript action runtime deprecation notice

Root cause:

- `pnpm/action-setup` pinned a version while root `package.json` already pins pnpm via
  `packageManager`, creating an explicit version conflict.

Fix implemented:

1. Removed explicit pnpm version from `.github/workflows/deploy-pages.yml`.
2. Updated workflow actions:
   - `actions/checkout@v5`
   - `actions/setup-node@v5`
3. Added workflow env:
   - `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`

Why this approach:

- Keeps one source of truth for pnpm version.
- Aligns workflow with GitHub's Node 24 runtime transition path.

## Update: GitHub Pages CI Lockfile Fix (2026-03-17)

Issue observed after CI follow-up push:

- GitHub Actions build failure:
  - `Dependencies lock file is not found ... Supported file patterns: pnpm-lock.yaml`

Root cause:

- `pnpm-lock.yaml` existed locally but was excluded from source control by `.gitignore`.

Fix implemented:

1. Removed `pnpm-lock.yaml` from `.gitignore`.
2. Added `pnpm-lock.yaml` to git and pushed to `main`.

Why this approach:

- CI install step intentionally uses `pnpm install --frozen-lockfile`, which requires
  a committed lockfile to ensure deterministic dependency resolution.

## Update: Render API Go-Live Wiring (2026-03-18)

Context:

- Backend deployed on Render and exposed at:
  - `https://sphincs-erp-crm.onrender.com`
- Frontend Pages landing and app routes were already live.

Final integration changes:

1. Enabled backend CORS in `apps/core-api/src/main.ts`.
   - Added `app.enableCors(...)`.
   - Added `CORS_ORIGINS` support with defaults:
     - `https://cowebslb.github.io`
     - `http://localhost:5173`
     - `http://localhost:5174`

2. Wired frontend API base URL into Pages workflow.
   - `.github/workflows/deploy-pages.yml` now injects:
     - `VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}`
   - Applied for both ERP and CRM frontend build steps.

Why:

- Without CORS allowlist, browser requests from Pages frontend to Render API are blocked.
- Without passing `VITE_API_BASE_URL` at Pages build time, frontend defaults to localhost API.

## Update: Render Login 500 Fix (2026-03-18)

Issue observed:

- `/api/v1/auth/login` returned HTTP 500 in production despite:
  - successful DB migration
  - successful seed
  - successful service startup

Root cause addressed:

- Auth/guard secret resolution relied primarily on `JWT_SECRET`.
- In production environments where split secrets are used (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)
  and legacy `JWT_SECRET` may be blank, token operations can fail at runtime.

Fix implemented:

1. `apps/core-api/src/core/auth/auth.service.ts`
   - access token secret resolution now:
     - `JWT_ACCESS_SECRET` -> `JWT_SECRET` -> `"change-me"`
   - refresh token secret resolution now:
     - `JWT_REFRESH_SECRET` -> `JWT_SECRET` -> `"change-me"`
   - all secret lookups use `.trim()` and logical fallback to avoid blank-value traps.

2. `apps/core-api/src/common/guards/roles.guard.ts`
   - token verification secret now:
     - `JWT_ACCESS_SECRET` -> `JWT_SECRET` -> `"change-me"`
   - includes `.trim()` fallback behavior.

Why:

- Aligns code with deployment env naming.
- Removes a common production footgun where empty string env values bypass nullish fallback.

## Update: Login Runtime Hardening + Error Visibility (2026-03-18)

Issue:

- Production login continued returning HTTP 500 after:
  - successful migrations
  - successful seed
  - confirmed non-empty JWT secret env vars

Hardening implemented:

1. `apps/core-api/src/core/auth/auth.service.ts`
   - refresh token payload now includes random `jti`.
   - introduced `persistRefreshToken(...)` helper.
   - on login/refresh, retries refresh-token insert once when Prisma returns `P2002` (unique conflict).

2. `apps/core-api/src/common/filters/http-exception.filter.ts`
   - logs non-HTTP unhandled exceptions with stack traces.
   - keeps response envelope unchanged for clients.

Why:

- Removes refresh-token collision edge cases as a source of 500 errors.
- Improves observability so future runtime failures are diagnosable directly from Render logs.
