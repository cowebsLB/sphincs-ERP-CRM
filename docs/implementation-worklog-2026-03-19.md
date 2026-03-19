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

### 11) Navigation + login backflow polish

Requested updates completed:

1. Removed home-page backend note text:
   - removed `Requires a reachable backend API at VITE_API_BASE_URL.` from landing hero
   - file:
     - `apps/web-home/index.html`

2. Added header navigation in ERP and CRM UIs:
   - topbar nav links added:
     - Home
     - ERP
     - CRM
   - auth/login cards also include compact nav links
   - files:
     - `apps/erp-web/src/app.tsx`
     - `apps/crm-web/src/app.tsx`
     - `packages/ui-core/src/ui.css`

3. Added explicit back-to-home action on login:
   - `Back to home` button/link added in ERP and CRM login views

Validation:

- `pnpm --filter @sphincs/erp-web test` passed
- `pnpm --filter @sphincs/crm-web test` passed

### 12) Beta V2 planning document draft

Added planning document:

- `docs/beta-v2-plan.md`

Contents include:

- V2 purpose/objectives
- scoped work themes
- deliverables and suggested milestones
- non-goals
- risks/mitigations
- exit criteria

### 13) Beta V1 issue hotfix: create-flow 500s in CRM/ERP forms

Issue observed from live beta reports:

- CRM create flows (`contacts/leads/opportunities`) and ERP purchase-order create could return `500`
- root cause was form + payload mismatch:
  - shared frontend form treated all fields as required (including optional `*_id` and `status`)
  - users entered non-UUID placeholders in ID fields
  - empty/invalid enum strings reached Prisma and exploded as server errors

Fix implemented:

1. Frontend optional field support in shared form renderer:
   - `packages/ui-core/src/resource-manager.tsx`
   - `createFields` / `editFields` now support `required?: boolean`
   - validation skips fields explicitly marked optional

2. CRM and ERP form field config updates:
   - `apps/crm-web/src/app.tsx`
     - `contact_id`, `lead_id`, and `status` set optional where appropriate
   - `apps/erp-web/src/app.tsx`
     - `supplier_id` and `status` in purchase orders set optional

3. Backend guardrails to prevent 500 on bad create payloads:
   - `apps/core-api/src/crm/leads/leads.service.ts`
   - `apps/core-api/src/crm/opportunities/opportunities.service.ts`
   - `apps/core-api/src/erp/purchasing/purchasing.service.ts`
   - added normalization + validation for:
     - optional UUID fields (`*_id`)
     - enum status values
   - invalid values now return explicit `400 Bad Request` instead of unhandled `500`
   - empty status now falls back to safe defaults:
     - lead: `NEW`
     - opportunity: `OPEN`
     - purchase order: `DRAFT`

Validation:

- `pnpm --filter @sphincs/core-api test` passed
- `pnpm --filter @sphincs/crm-web build` passed
- `pnpm --filter @sphincs/erp-web build` passed

### 14) ERP purchase-order supplier picker UX upgrade

Problem:

- purchase-order create/edit used raw `supplier_id` input
- testers had to know or paste internal UUID values
- this was valid technically, but poor beta UX

Implemented:

- replaced raw supplier ID entry in ERP purchase orders with a supplier picker flow
- purchase-order form now loads the signed-in user's visible suppliers
- added:
  - styled supplier dropdown
  - `Browse suppliers` modal/popup with supplier cards
  - supplier name shown in purchase-order table instead of raw UUID
- frontend still submits `supplier_id` to the backend, but selection is now done by supplier name in UI

Files:

- `apps/erp-web/src/app.tsx`
- `packages/ui-core/src/ui.css`

Validation:

- `pnpm --filter @sphincs/erp-web build` passed

### 15) CRM relation pickers for leads and opportunities

Problem:

- lead create/edit used raw `contact_id`
- opportunity create/edit used raw `lead_id`
- testers had to work with internal UUIDs instead of readable names

Implemented:

- replaced CRM lead relation entry with a contact picker flow
- replaced CRM opportunity relation entry with a lead picker flow
- both screens now use dedicated relation-aware pages with:
  - styled dropdowns
  - browse modals/popups
  - readable labels in tables instead of raw UUIDs
- lead labels in opportunities are enriched from visible lead/contact data so users can identify the right relationship quickly

Files:

- `apps/crm-web/src/app.tsx`

Validation:

- `pnpm --filter @sphincs/crm-web build` passed

### 16) Product changelog and beta versioning baseline

Problem:

- the repo had package versions and `Beta V1` references, but no formal product release line
- there was no single place to answer:
  - what version are we on now
  - what changed in this beta snapshot
  - how should future updates be versioned until `Beta V2.0.0`

Implemented:

- added root changelog:
  - `CHANGELOG.md`
- added versioning policy:
  - `docs/versioning.md`
- established current product release as:
  - `Beta V1.6.0`
- documented release progression:
  - `Beta V1.0.0` baseline
  - `Beta V1.5.0` usability/platform pass
  - `Beta V1.6.0` relation-picker UX pass
- updated docs navigation to include versioning and changelog references
- updated runtime/system metadata fallback and frontend bug-report metadata to use:
  - `Beta V1.6.0`

Files:

- `CHANGELOG.md`
- `docs/versioning.md`
- `docs/index.md`
- `index.md`
- `apps/core-api/src/system/system.controller.ts`
- `apps/erp-web/src/app.tsx`
- `apps/crm-web/src/app.tsx`

Validation:

- `pnpm --filter @sphincs/core-api test` passed
- `pnpm --filter @sphincs/erp-web build` passed
- `pnpm --filter @sphincs/crm-web build` passed

### 17) Beta V2 execution checklist established

Problem:

- `docs/beta-v2-plan.md` defined direction, but not an execution-grade finish line
- there was no concrete Beta V2 checklist tying ERP UX rebuilds, access/session work, QA, and release operations into one completion gate

Implemented:

- added:
  - `docs/beta-v2-checklist.md`
- checklist now defines:
  - access and identity tasks
  - ERP UX rebuild tasks for items, suppliers, and purchase orders
  - CRM consistency tasks
  - data/safety requirements
  - backend/data-shape requirements
  - quality/observability tasks
  - beta operations and release discipline
  - hard-stop completion criteria for `Beta V2.0.0`
- updated `docs/beta-v2-plan.md` so it now points to the execution checklist
- updated docs navigation:
  - `docs/index.md`
  - `index.md`

Files:

- `docs/beta-v2-checklist.md`
- `docs/beta-v2-plan.md`
- `docs/index.md`
- `index.md`

### 18) Beta V2 start: ERP items rebuild

Problem:

- the ERP `Items` module was still a thin generic resource screen
- backend item data shape only supported:
  - `name`
  - `sku`
- the UX did not match the Beta V2 item architecture:
  - essentials first
  - progressive disclosure
  - inventory/service-aware behavior

Implemented:

1. Expanded item backend schema and migration:
   - added item status enum
   - added pricing, inventory, classification, and advanced item fields
   - made `sku` required
   - added org-scoped SKU uniqueness
   - added item expansion migration:
     - `apps/core-api/prisma/migrations/20260319_item_v2_fields/migration.sql`

2. Rebuilt item service behavior:
   - added validation and normalization for:
     - required strings
     - status
     - currency
     - booleans
     - numeric fields
     - tags
   - added service/inventory-aware normalization:
     - services disable inventory logic
     - non-tracked inventory suppresses stock controls

3. Replaced the ERP generic item form with a dedicated item manager UI:
   - table view remains on the page
   - create/edit now use a progressive modal flow
   - sections:
     - Essentials
     - Pricing
     - Inventory
     - Classification
     - Advanced
   - default visible fields:
     - `name`
     - `sku`
     - `status`
     - `selling_price`
     - `category`
     - `track_inventory`
     - `quantity_on_hand`
   - conditional behavior:
     - `is_service = true` disables inventory controls
     - `track_inventory = false` hides stock fields

4. Added backend unit coverage:
   - `apps/core-api/src/erp/items/items.service.spec.ts`

5. Advanced versioning/changelog state:
   - bumped product release to:
     - `Beta V1.7.0`
   - updated:
     - `CHANGELOG.md`
     - `docs/versioning.md`
     - runtime version metadata
     - bug-report version metadata
     - docs current-version references

Files:

- `apps/core-api/prisma/schema.prisma`
- `apps/core-api/prisma/migrations/20260319_item_v2_fields/migration.sql`
- `apps/core-api/src/erp/items/items.service.ts`
- `apps/core-api/src/erp/items/items.service.spec.ts`
- `apps/erp-web/src/app.tsx`
- `packages/ui-core/src/ui.css`
- `docs/database-schema.md`
- `docs/beta-v2-checklist.md`
- `CHANGELOG.md`
- `docs/versioning.md`
- `apps/core-api/src/system/system.controller.ts`
- `apps/crm-web/src/app.tsx`
- `index.md`

Validation:

- `pnpm --filter @sphincs/core-api prisma:generate` passed
- `pnpm --filter @sphincs/core-api test` passed
- `pnpm --filter @sphincs/erp-web build` passed
- `pnpm --filter @sphincs/crm-web build` passed

### 19) Production auth guard hotfix for expired JWT handling

Problem observed in Render logs:

- protected ERP routes such as `/api/v1/erp/items` and `/api/v1/erp/suppliers` were returning `500`
- root cause was not the route logic itself
- expired access tokens were throwing raw `TokenExpiredError` inside `RolesGuard`
- the global exception filter treated that uncaught JWT error as an unhandled server exception

Impact:

- expired tokens produced `500` instead of `401`
- this prevented the frontend from relying on normal unauthorized/refresh handling behavior

Implemented:

- updated:
  - `apps/core-api/src/common/guards/roles.guard.ts`
- JWT verification is now wrapped and translated into:
  - `UnauthorizedException("Invalid or expired bearer token")`
- added guard unit coverage:
  - `apps/core-api/src/common/guards/roles.guard.spec.ts`
- bumped product release to:
  - `Beta V1.7.1`

Files:

- `apps/core-api/src/common/guards/roles.guard.ts`
- `apps/core-api/src/common/guards/roles.guard.spec.ts`
- `CHANGELOG.md`
- `docs/versioning.md`
- `apps/core-api/src/system/system.controller.ts`
- `apps/erp-web/src/app.tsx`
- `apps/crm-web/src/app.tsx`
- `index.md`

Validation:

- `pnpm --filter @sphincs/core-api test` passed

### 20) Modal overflow fix for long ERP/CRM dialogs

Problem observed:

- long modals, especially the ERP item create/edit dialog, could extend beyond the viewport
- lower sections and action buttons became unreachable because the modal container itself was not scrollable

Implemented:

- updated shared modal CSS in:
  - `packages/ui-core/src/ui.css`
- added viewport-safe modal behavior:
  - modal backdrop can scroll vertically
  - modal card now has max height
  - modal card now scrolls internally when content exceeds viewport height
- this fixes:
  - ERP item create/edit modal
  - bug report dialogs
  - supplier/lead/contact picker dialogs
  - other long shared modals using the same base classes
- bumped product release to:
  - `Beta V1.7.2`

Files:

- `packages/ui-core/src/ui.css`
- `CHANGELOG.md`
- `docs/versioning.md`
- `apps/core-api/src/system/system.controller.ts`
- `apps/erp-web/src/app.tsx`
- `apps/crm-web/src/app.tsx`
- `index.md`

Validation:

- `pnpm --filter @sphincs/erp-web build` passed
- `pnpm --filter @sphincs/crm-web build` passed

## Outcome

- Beta V1 functional scope items for signup and data privacy-by-default are now implemented and test-covered.

### 21) ERP item SKU guidance and saved-state preview polish

Problem observed:

- the rebuilt ERP items flow still made SKU behavior feel invisible even though auto-generation logic was already being introduced
- users also had no quick way to inspect a saved item without going straight into edit mode

Implemented:

- completed the hybrid SKU UX in:
  - `apps/erp-web/src/app.tsx`
- SKU now:
  - auto-generates from the item name by default
  - remains fully editable
  - shows helper copy explaining the behavior
  - shows live duplicate/available feedback against the signed-in user's current items
- added saved-state item preview:
  - clicking an item row now opens a read-only preview modal
  - preview groups item details into essentials, pricing, inventory, classification, and record info
  - preview includes a direct `Edit item` action for a smooth handoff into edit mode
- updated shared table styling in:
  - `packages/ui-core/src/ui.css`
  - `packages/ui-core/src/data-table.tsx`
- bumped product release to:
  - `Beta V1.7.3`

Files:

- `apps/erp-web/src/app.tsx`
- `packages/ui-core/src/data-table.tsx`
- `packages/ui-core/src/ui.css`
- `CHANGELOG.md`
- `docs/versioning.md`
- `apps/core-api/src/system/system.controller.ts`
- `apps/crm-web/src/app.tsx`
- `index.md`

Validation:

- `pnpm --filter @sphincs/erp-web build` passed
- `pnpm --filter @sphincs/crm-web build` passed

### 22) Beta V2 supplier profile rebuild

Problem observed:

- suppliers were still stored and edited as a thin contact stub with only `name`, `email`, and `phone`
- that shape was too weak for connected ERP behavior because purchase orders and future vendor-linked flows need richer supplier identity, financial, address, and contact-person context
- the frontend was still using the old generic resource manager flow, which made supplier records feel isolated instead of operational

Implemented:

- expanded the supplier backend model in:
  - `apps/core-api/prisma/schema.prisma`
- added supplier Beta V2 migration:
  - `apps/core-api/prisma/migrations/20260319_supplier_v2_fields/migration.sql`
- supplier records now support:
  - identity fields such as `supplier_code` and `status`
  - address fields
  - financial fields including `payment_terms`, `currency`, `tax_id`, `vat_number`, `credit_limit`, and `balance`
  - contact-person fields
  - internal fields such as `notes`, `rating`, and `preferred_supplier`
- rebuilt supplier service validation and normalization in:
  - `apps/core-api/src/erp/suppliers/suppliers.service.ts`
- added supplier unit coverage in:
  - `apps/core-api/src/erp/suppliers/suppliers.service.spec.ts`
- replaced the old generic ERP suppliers page with a structured supplier profile flow in:
  - `apps/erp-web/src/app.tsx`
- the new supplier UI now includes:
  - essential fields first
  - grouped `Address`, `Financial`, `Contact Person`, and `Advanced / Internal` sections
  - read-only balance presentation
  - saved-state preview on row click
  - edit flow connected directly from preview
- enriched purchase-order supplier picker metadata so purchasing sees better supplier context
- updated Beta V2 checklist progress and schema docs
- bumped product release to:
  - `Beta V1.8.0`

Files:

- `apps/core-api/prisma/schema.prisma`
- `apps/core-api/prisma/migrations/20260319_supplier_v2_fields/migration.sql`
- `apps/core-api/src/erp/suppliers/suppliers.service.ts`
- `apps/core-api/src/erp/suppliers/suppliers.service.spec.ts`
- `apps/erp-web/src/app.tsx`
- `packages/ui-core/src/ui.css`
- `docs/database-schema.md`
- `docs/beta-v2-checklist.md`
- `CHANGELOG.md`
- `docs/versioning.md`
- `apps/core-api/src/system/system.controller.ts`
- `apps/crm-web/src/app.tsx`
- `index.md`

Validation:

- `pnpm --filter @sphincs/core-api prisma:generate` passed
- `pnpm --filter @sphincs/core-api test` passed
- `pnpm --filter @sphincs/erp-web build` passed
