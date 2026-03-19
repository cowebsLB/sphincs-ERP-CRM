# Implementation Worklog (2026-03-19)

## Context

This worklog captures Beta V1 closeout implementation completed on 2026-03-19.

## Completed Today

### 1) Self-service tester signup end-to-end

Implemented:

- backend endpoint: `POST /api/v1/auth/signup`
- frontend signup mode in ERP and CRM login screens
- API client `signup(...)` method
- signup response returns authenticated session payload (same shape as login)

Files:

- `apps/core-api/src/core/auth/auth.controller.ts`
- `apps/core-api/src/core/auth/auth.service.ts`
- `apps/core-api/src/core/auth/dto/signup.dto.ts`
- `packages/api-client/src/index.ts`
- `apps/erp-web/src/app.tsx`
- `apps/crm-web/src/app.tsx`

### 2) Private per-user data retention by default

Implemented ownership-scoped data access for ERP and CRM resource flows:

- controllers now pass authenticated user context into services
- list/read/write/restore scoped by:
  - `organization_id` from authenticated user
  - `created_by` bound to authenticated user
- request-body scope fields no longer control ownership boundaries

ERP files:

- `apps/core-api/src/erp/items/items.controller.ts`
- `apps/core-api/src/erp/items/items.service.ts`
- `apps/core-api/src/erp/suppliers/suppliers.controller.ts`
- `apps/core-api/src/erp/suppliers/suppliers.service.ts`
- `apps/core-api/src/erp/purchasing/purchasing.controller.ts`
- `apps/core-api/src/erp/purchasing/purchasing.service.ts`

CRM files:

- `apps/core-api/src/crm/contacts/contacts.controller.ts`
- `apps/core-api/src/crm/contacts/contacts.service.ts`
- `apps/core-api/src/crm/leads/leads.controller.ts`
- `apps/core-api/src/crm/leads/leads.service.ts`
- `apps/core-api/src/crm/opportunities/opportunities.controller.ts`
- `apps/core-api/src/crm/opportunities/opportunities.service.ts`

### 3) Beta role access alignment

Updated role gating so new signed-up testers can execute flows:

- enabled `Staff` role access on ERP/CRM resource controllers
- enabled `Staff` role access in frontend app-shell gating checks

### 4) Coverage and validation updates

Added and updated test coverage:

- signup coverage in backend e2e smoke suite
- auth/service unit tests updated for signup and user-scoped signatures
- frontend tests updated for role-gating behavior

Validation completed:

- `pnpm --filter @sphincs/core-api test`
- `pnpm --filter @sphincs/core-api test:e2e`
- `pnpm --filter @sphincs/erp-web test`
- `pnpm --filter @sphincs/crm-web test`

### 5) In-app bug reporting module with GitHub Issues delivery

Implemented:

- new backend endpoint: `POST /api/v1/bugs/report`
- backend payload validation for:
  - title
  - summary
  - steps
  - expected
  - actual
  - severity
  - module/route/app metadata
  - optional contact email and screenshot URL
- GitHub issue creation flow in backend service with structured issue body
- automatic issue labels:
  - defaults (`bug`, `beta-feedback`)
  - severity labels (`severity:*`)
  - app/module labels (`module:*`, `area:*`)
- ERP and CRM top-nav `Report Bug` modal forms
- auto-captured metadata from frontend:
  - app (`ERP` / `CRM`)
  - route
  - page URL
  - app version (`beta-v1`)
  - user agent

Environment configuration added:

- `GITHUB_ISSUES_TOKEN`
- `GITHUB_ISSUES_REPO`
- optional `GITHUB_ISSUES_LABELS`

### 6) Beta access ops closeout (checklist items 1 and 2)

Completed:

- finalized tester access list for Beta V1 wave 1:
  - `docs/beta-tester-access-list.md`
- finalized tester instruction note for onboarding and reporting:
  - `docs/beta-tester-instructions.md`
- updated checklist status in:
  - `docs/beta-v1-checklist.md`

## Outcome

- Beta V1 functional scope items for signup and data privacy-by-default are now implemented and test-covered.
