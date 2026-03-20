# Testing Strategy

- Unit tests:
  - RBAC and scope guards
  - Status transitions
  - Soft-delete + restore behavior
  - Audit writer and request logging
  - Input normalization/validation for optional UUID and enum fields in create/update services
  - Auth hardening:
    - login rate-limiter behavior
    - refresh-token reuse detection and revocation
- Integration tests:
  - Versioned routes
  - Scoped CRUD
  - Soft-delete filtering defaults
- E2E tests:
  - ERP and CRM core flows
  - Audit trace checks
  - Health and system info endpoint checks
  - Backend auth + ERP smoke:
    - `POST /api/v1/auth/login`
    - `POST /api/v1/auth/signup`
    - `GET /api/v1/auth/me`
    - `GET /api/v1/erp/items`
    - `POST /api/v1/bugs/report`

## Frontend Test Baseline (2026-03-16)

Added Vitest + React Testing Library setup for both frontend apps:

- `apps/erp-web`
- `apps/crm-web`

Current coverage per app:

- Login screen render
- Successful login and transition to app shell
- Role-block message for unauthorized role access
- Shared-session reuse across ERP and CRM using the common `sphincs.session` storage key
- Forced session-expiry recovery that clears stored session state and returns the user to login
- Startup role-sync that updates stored session permissions before app access is granted

Run commands:

- Workspace: `pnpm -r --if-present test`
- Per app:
  - `pnpm --filter @sphincs/erp-web test`
  - `pnpm --filter @sphincs/crm-web test`

Backend smoke e2e command:

- `pnpm --filter @sphincs/core-api test:e2e`

Current backend e2e smoke assertions:

- login flow
- signup flow
- `/auth/me`
- ERP items fetch
- bug-report submission
- refresh-session invalidation after admin role changes

## Auth Login Latency Guardrail (2026-03-18)

Added a login response-time assertion in backend e2e smoke:

- file: `apps/core-api/test/auth-items.e2e-spec.ts`
- assertion: login request duration must be `< 1200ms` in CI smoke context

Purpose:

- catches significant auth-path performance regressions early in CI
- keeps login latency visible as part of deployment quality gates

## Beta V1 Hotfix Regression Checks (2026-03-19)

Added/confirmed checks after create-flow 500 reports:

- `pnpm --filter @sphincs/core-api test`
  - verifies lead and purchase-order service behavior remains green
- manual payload regression expectations:
  - empty status in create payload defaults correctly (no 500)
  - invalid `*_id` UUID input returns `400` instead of `500`
  - invalid enum status returns `400` instead of `500`

## Beta V2 Quality Additions (2026-03-20)

Added frontend regression coverage for shared-session and forced re-login behavior:

- `apps/erp-web/src/app.test.tsx`
- `apps/crm-web/src/app.test.tsx`

Verified commands:

- `pnpm --filter @sphincs/erp-web test`
- `pnpm --filter @sphincs/crm-web test`
- `pnpm --filter @sphincs/core-api test:e2e`

## Production Smoke Checks

Use this repeatable post-deploy smoke sequence for Beta V2:

1. Open the landing page and confirm:
   - home loads
   - ERP link opens
   - CRM link opens
2. Sign in once and confirm the same session works in:
   - ERP
   - CRM
3. Confirm `/health` returns `200`.
4. Confirm `/api/v1/system/info` returns the expected product version.
5. Open ERP and check:
   - Items list loads
   - Suppliers list loads
   - Purchase Orders page loads
6. Open CRM and check:
   - Contacts list loads
   - Leads list loads
   - Opportunities list loads
7. Submit one bug-report test from the UI and confirm an issue is created.
8. Soft-delete and restore one non-critical test record and confirm both paths work.
9. Log out, then sign back in to confirm session recovery still behaves cleanly.
