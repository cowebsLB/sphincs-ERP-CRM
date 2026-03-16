# Testing Strategy

- Unit tests:
  - RBAC and scope guards
  - Status transitions
  - Soft-delete + restore behavior
  - Audit writer and request logging
- Integration tests:
  - Versioned routes
  - Scoped CRUD
  - Soft-delete filtering defaults
- E2E tests:
  - ERP and CRM core flows
  - Audit trace checks
  - Health and system info endpoint checks

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
