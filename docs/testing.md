# Testing Strategy

- Unit tests:
  - RBAC and scope guards
  - Status transitions
  - Soft-delete + restore behavior
  - Audit writer and request logging
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
    - `GET /api/v1/auth/me`
    - `GET /api/v1/erp/items`

## Frontend Test Baseline (2026-03-16)

Added Vitest + React Testing Library setup for both frontend apps:

- `apps/erp-web`
- `apps/crm-web`

Current coverage per app:

- Login screen render
- Successful login and transition to app shell
- Role-block message for unauthorized role access

Run commands:

- Workspace: `pnpm -r --if-present test`
- Per app:
  - `pnpm --filter @sphincs/erp-web test`
  - `pnpm --filter @sphincs/crm-web test`

Backend smoke e2e command:

- `pnpm --filter @sphincs/core-api test:e2e`

## Auth Login Latency Guardrail (2026-03-18)

Added a login response-time assertion in backend e2e smoke:

- file: `apps/core-api/test/auth-items.e2e-spec.ts`
- assertion: login request duration must be `< 1200ms` in CI smoke context

Purpose:

- catches significant auth-path performance regressions early in CI
- keeps login latency visible as part of deployment quality gates
