# Implementation Worklog (2026-03-18)

## Context

This worklog captures production deployment stabilization and post-deploy fixes completed on 2026-03-18.

## Completed Today

### 1) Render + Supabase production bring-up

- Validated production backend deploy on Render:
  - `https://sphincs-erp-crm.onrender.com`
- Confirmed Prisma migration deploy and seed execution in production:
  - organization, branch, roles, admin user seeded
- Confirmed service startup and route registration.

### 2) Pages-to-API integration completion

- Confirmed frontend Pages app targets production API via:
  - `VITE_API_BASE_URL=https://sphincs-erp-crm.onrender.com/api/v1`
- Validated CORS preflight on production API for:
  - origin `https://cowebslb.github.io`

### 3) Login 500 diagnosis and fixes

Observed failures:

- `/api/v1/auth/login` returned `500` in production after deployment.
- Stack trace identified:
  - `TypeError: Cannot read properties of undefined (reading 'sign')`
  - origin: `AuthService.createAccessToken(...)`

Root causes addressed:

1. JWT secret resolution hardening:
   - access: `JWT_ACCESS_SECRET` -> `JWT_SECRET` -> `"change-me"`
   - refresh: `JWT_REFRESH_SECRET` -> `JWT_SECRET` -> `"change-me"`
   - trim-based fallback to avoid blank secret traps.

2. Refresh-token persistence hardening:
   - refresh tokens include random `jti`.
   - persistence retries once on Prisma unique conflict (`P2002`).

3. Runtime module import compatibility:
   - switched `jsonwebtoken` import to CommonJS-safe namespace import:
     - `import * as jwt from "jsonwebtoken"`

4. Error visibility:
   - global exception filter now logs stack traces for non-HTTP exceptions.

### 4) Production usability polish

- Request logger improved to resolve authenticated user ID from request context:
  - order: `req.user.id` -> `x-user-id` -> `anonymous`
- Frontend login fields updated with autocomplete attributes:
  - email: `autoComplete="email"`
  - password: `autoComplete="current-password"`

### 5) Documentation additions

- Added hosting documentation:
  - `docs/hosting.md`
- Updated deployment documentation with production troubleshooting and fixes.

### 6) Render auto-deploy stabilization (prisma binary availability)

Issue:

- Render auto deploy repeatedly failed with:
  - `sh: 1: prisma: not found`
  - even when manual clear-cache deploys could pass.

Root cause:

- cached production-pruned installs did not consistently expose build/deploy toolchain binaries.

Fix:

- moved deploy/build-critical packages from `devDependencies` to `dependencies` in `apps/core-api/package.json`:
  - `prisma`
  - `ts-node`
  - `@nestjs/cli`
  - `typescript`

Why:

- guarantees required binaries are present for migration/seed/build steps during Render auto deployments.

### 7) Backend e2e smoke coverage

Added a dedicated backend e2e smoke suite:

- config: `apps/core-api/jest.e2e.config.ts`
- test file: `apps/core-api/test/auth-items.e2e-spec.ts`
- script: `pnpm --filter @sphincs/core-api test:e2e`

Coverage includes:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me` with Bearer token
- `GET /api/v1/erp/items` with Bearer token

Implementation note:

- tests run against `AppModule` with overridden `PrismaService` mock for deterministic behavior
  and fast smoke validation.

### 8) GitHub pipeline deploy gate for backend checks

Updated Pages workflow to gate deployment on backend checks:

- workflow: `.github/workflows/deploy-pages.yml`
- new job: `test_core_api`
  - runs:
    - `pnpm --filter @sphincs/core-api test`
    - `pnpm --filter @sphincs/core-api test:e2e`
- `build` job now depends on `test_core_api`.

Why:

- prevents frontend Pages deployment when backend auth/ERP contract smoke fails.

### 9) Repository-managed Render build script

Added canonical backend deploy script:

- `scripts/render-build-core-api.sh`

Sequence performed by script:

1. remove potentially stale install paths
2. install core-api workspace deps with tooling
3. `prisma generate`
4. `prisma migrate deploy`
5. `prisma db seed`
6. `nest build`

Related package script:

- `apps/core-api/package.json`
  - `render:build`: `bash ../../scripts/render-build-core-api.sh`

Why:

- removes UI-level command drift
- makes Render deploy behavior reproducible and version-controlled

### 10) Frontend System Status card (ERP + CRM)

Added lightweight production status panels to both frontend apps:

- `apps/erp-web/src/app.tsx`
- `apps/crm-web/src/app.tsx`

Card behavior:

- checks backend `/health` endpoint
- fetches `/api/v1/system/info`
- displays health state + environment/version snapshot in app shell

Styling:

- shared styles added in `packages/ui-core/src/ui.css` (`.ui-status-card`)

Why:

- quick operational visibility for users and maintainers directly from the UI
- immediate confirmation that API and deployment metadata are reachable

### 11) Login latency optimization (single-round-trip sign-in)

Observed UX issue:

- login felt slow due to sequential API flow:
  - `POST /api/v1/auth/login`
  - then `GET /api/v1/auth/me`

Optimization implemented:

1. Backend login response now includes user payload directly:
   - file: `apps/core-api/src/core/auth/auth.service.ts`
2. API client login contract updated:
   - file: `packages/api-client/src/index.ts`
3. ERP and CRM login flows now hydrate session from login response without `/auth/me` follow-up:
   - `apps/erp-web/src/app.tsx`
   - `apps/crm-web/src/app.tsx`
4. Frontend tests updated for new login response shape:
   - `apps/erp-web/src/app.test.tsx`
   - `apps/crm-web/src/app.test.tsx`

Expected impact:

- faster perceived login on hosted environments by removing one network round trip from sign-in.

## Outcome

- Production backend deploy is operational.
- Frontend Pages integration with production API is configured.
- Primary login 500 root causes were identified and patched.
- Documentation now includes hosting strategy and deployment troubleshooting for this production phase.
