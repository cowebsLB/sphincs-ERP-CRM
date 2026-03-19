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

### 7) Quick production backend final sweep run

Executed live verification against:

- `https://sphincs-erp-crm-1.onrender.com`

Validated endpoints:

- `GET /health` -> `200`
- `GET /api/v1/system/info` -> `200`
- `POST /api/v1/auth/signup` -> `201`
- `POST /api/v1/auth/login` -> `201`
- `GET /api/v1/auth/me` -> `200`
- `POST /api/v1/auth/refresh` -> `201`
- `GET /api/v1/erp/items` -> `200`
- `GET /api/v1/crm/contacts` -> `200`
- `POST /api/v1/auth/rate-limit/reset` -> `201`
- `POST /api/v1/bugs/report` -> `201`

Auth hardening checks:

- invalid login returns `401`
- rate limiter returns `429`
- `Retry-After` header present (`900`)

### 8) User hard-delete FK constraint fix

Issue observed:

- deleting a user row failed due to FK references from `refresh_tokens`
- `user_roles` relation would also block hard delete in many cases

Fix implemented:

- updated Prisma relations to cascade on user deletion:
  - `RefreshToken.user` -> `onDelete: Cascade`
  - `UserRole.user` -> `onDelete: Cascade`
- added migration:
  - `apps/core-api/prisma/migrations/20260319_user_delete_cascade/migration.sql`
  - updates:
    - `refresh_tokens_user_id_fkey` -> `ON DELETE CASCADE`
    - `user_roles_user_id_fkey` -> `ON DELETE CASCADE`

Validation:

- `pnpm --filter @sphincs/core-api test` passed

### 9) Frontend role-denied recovery UX fix

Issue observed:

- when a user role was removed while session tokens still existed, ERP/CRM could show
  `Your account does not have ... access.` with no visible escape path

Fix implemented:

- added `Switch account` action to role-denied states in both apps:
  - `apps/crm-web/src/app.tsx`
  - `apps/erp-web/src/app.tsx`
- action behavior:
  - clears local session state/storage
  - navigates user back to `/login`

Validation:

- `pnpm --filter @sphincs/crm-web test` passed
- `pnpm --filter @sphincs/erp-web test` passed

### 10) Landing/logo + unified login styling pass

Requested updates completed:

1. Landing now uses repo branding asset logo:
   - `apps/web-home/index.html` now references:
     - `./assets/branding/apple-touch-icon.png`
   - Pages workflow now copies branding assets into published artifact:
     - `.github/workflows/deploy-pages.yml`

2. Landing + app UI palette aligned to provided theme tokens:
   - core/background/surface/border/text/accent/status colors applied in shared UI CSS
   - file updated:
     - `packages/ui-core/src/ui.css`

3. Unified login experience for ERP and CRM:
   - both apps now use shared session key:
     - `sphincs.session`
   - legacy keys are still read/migrated:
     - `sphincs.erp.session`
     - `sphincs.crm.session`
   - login screens updated to common styled `Sign in once for ERP + CRM` UX
   - files updated:
     - `apps/erp-web/src/app.tsx`
     - `apps/crm-web/src/app.tsx`

Validation:

- `pnpm --filter @sphincs/erp-web test` passed
- `pnpm --filter @sphincs/crm-web test` passed

## Outcome

- Beta V1 functional scope items for signup and data privacy-by-default are now implemented and test-covered.
