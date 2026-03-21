# Implementation Worklog - 2026-03-21

## Task: Distribution Movement History Report API (V1.16.20)

Date: 2026-03-21

### Scope

- Added reporting endpoint:
  - `GET /api/v1/distribution/reports/movements`
- Added report filters:
  - `movementType`
  - `branchId`
  - `itemId`
  - `from`
  - `to`
  - `includeDeleted`
- Added report output shape with:
  - movement rows including branch/item context
  - aggregate summary totals and by-type grouping
- Added unit test coverage for summary generation and movement type filtering.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `92/92` tests).
- `pnpm build` passed at workspace level.

### Notes

- This extends the reporting surface for operations teams that need trace-level movement analysis beyond dashboard cards.

## Task: Distribution Stock-On-Hand Report API (V1.16.19)

Date: 2026-03-21

### Scope

- Added reporting endpoint:
  - `GET /api/v1/distribution/reports/stock-on-hand`
- Added report filters:
  - `branchId`
  - `itemId`
  - `lowOnly`
  - `outOnly`
  - `includeDeleted`
- Added report output shape with:
  - row-level stock metrics
  - low/out-of-stock flags
  - aggregate summary totals
- Added unit test coverage for report summary generation and low-stock filtering behavior.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `91/91` tests).
- `pnpm build` passed at workspace level.

### Notes

- This introduces a dedicated reporting surface and keeps dashboard payloads focused on triage summaries.

## Task: Distribution Alerts Inbox + Resolve APIs (V1.16.18)

Date: 2026-03-21

### Scope

- Added alert operations endpoints:
  - `GET /api/v1/distribution/alerts`
  - `PATCH /api/v1/distribution/alerts/:alertId/resolve`
- Added filter support for alert listing:
  - `status`
  - `severity`
  - `branchId`
  - `includeDeleted`
- Added scoped alert resolution behavior:
  - updates status to `RESOLVED`
  - stamps resolution metadata
  - writes audit event (`DISTRIBUTION_ALERT_RESOLVED`)
- Added unit tests for alert listing and alert resolution behavior.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `90/90` tests).
- `pnpm build` passed at workspace level.

### Notes

- This extends alerts from dashboard-only visibility to operational handling and closure APIs.

## Task: Distribution Transition Audit Trail Events (V1.16.17)

Date: 2026-03-21

### Scope

- Added audit event persistence in distribution transition workflows:
  - transfer transitions
  - dispatch transitions
  - return transitions
  - adjustment transitions
- Added service-level helper for consistent audit writes to `audit_logs`.
- Included transition metadata in audit payload:
  - action
  - previous status
  - next status
- Extended distribution service tests to assert audit event write behavior.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `88/88` tests).
- `pnpm build` passed at workspace level.

### Notes

- Audit records are written only after successful transitions, ensuring logs reflect committed state changes.

## Task: Distribution Method-Level RBAC Hardening (V1.16.16)

Date: 2026-03-21

### Scope

- Added explicit method-level `@Roles(...)` declarations across distribution endpoints.
- Split role access by operation category:
  - read routes allow read-only auditor access
  - write routes require operational roles
  - approval-sensitive routes require elevated approval roles
- Preserved existing service behavior while tightening endpoint authorization boundaries.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `88/88` tests).
- `pnpm build` passed at workspace level.

### Notes

- This task addresses permission granularity without schema changes and reduces risk of accidental data mutation by read-only roles.

## Task: Distribution Adjustment Lifecycle Actions (V1.16.15)

Date: 2026-03-21

### Scope

- Added adjustment transition endpoints:
  - `PATCH /api/v1/distribution/adjustments/:adjustmentId/submit`
  - `PATCH /api/v1/distribution/adjustments/:adjustmentId/approve`
  - `PATCH /api/v1/distribution/adjustments/:adjustmentId/apply`
  - `PATCH /api/v1/distribution/adjustments/:adjustmentId/reverse`
- Added service-level adjustment transition engine with:
  - action parsing
  - allowed-transition validation
  - branch scope validation
  - approval/apply metadata stamping
- Added unit tests for:
  - valid submit transition
  - valid apply transition
  - invalid transition rejection

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `88/88` tests).
- `pnpm build` passed at workspace level.

### Notes

- Adjustment approval and application flows are now action-driven and guarded against status-skipping transitions.

## Task: Distribution Restocking Suggestions API (V1.16.14)

Date: 2026-03-21

### Scope

- Added restocking suggestion endpoint:
  - `GET /api/v1/distribution/restocking-suggestions`
- Added derived suggestion service logic that combines:
  - reorder rules
  - current inventory stock levels
- Added filters for:
  - `branchId`
  - `includeInactive`
  - `includeZero`
  - `includeDeleted`
- Added unit tests for:
  - below-threshold suggestion generation
  - optional inclusion of zero-need suggestions

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `85/85` tests).
- `pnpm build` passed at workspace level.

### Notes

- Suggestions are read-only and computed dynamically, enabling replenishment planning without additional persistence tables.

## Task: Distribution Reorder Rule APIs (V1.16.13)

Date: 2026-03-21

### Scope

- Added reorder rule endpoints:
  - `GET /api/v1/distribution/reorder-rules`
  - `POST /api/v1/distribution/reorder-rules`
- Added reorder rule service logic for:
  - branch/item/activity filtering
  - scoped reorder rule creation with supplier linkage validation
  - non-negative/positive numeric guardrails for rule fields
- Added unit tests for:
  - reorder rule create success
  - reorder rule list filtering
  - invalid reorder quantity rejection

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `83/83` tests).
- `pnpm build` passed at workspace level.

### Notes

- Reorder policy management is now exposed through the same distribution API surface as reservations and stock operations.

## Task: Distribution Reservation APIs (V1.16.12)

Date: 2026-03-21

### Scope

- Added reservation endpoints:
  - `GET /api/v1/distribution/reservations`
  - `POST /api/v1/distribution/reservations`
- Added reservation service logic for:
  - branch-scoped listing
  - status/branch/item filtering
  - reservation creation with scope and enum validation
- Added unit tests for:
  - reservation create success
  - reservation list filtering
  - non-positive quantity rejection

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `80/80` tests).
- `pnpm build` passed at workspace level.

### Notes

- Reservation records now flow through the same distribution controller/service surface as other stock operations.

## Task: Distribution Return Lifecycle Actions (V1.16.11)

Date: 2026-03-21

### Scope

- Added return status transition action endpoints:
  - `PATCH /api/v1/distribution/returns/:returnId/receive`
  - `PATCH /api/v1/distribution/returns/:returnId/inspect`
  - `PATCH /api/v1/distribution/returns/:returnId/complete`
  - `PATCH /api/v1/distribution/returns/:returnId/cancel`
- Added service-level return transition engine with:
  - action parsing
  - allowed-transition validation
  - branch scope enforcement
  - processing metadata stamping for operational traceability
- Added unit test coverage for:
  - valid transition to `RECEIVED`
  - valid transition to `COMPLETED`
  - invalid transition rejection

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `77/77` tests).
- `pnpm build` passed at workspace level.

### Notes

- Return workflow status progression is now explicitly action-driven and guarded against invalid state jumps.

## Task: Distribution Dispatch Lifecycle Actions (V1.16.10)

Date: 2026-03-21

### Scope

- Added dispatch status transition action endpoints:
  - `PATCH /api/v1/distribution/dispatches/:dispatchId/ready`
  - `PATCH /api/v1/distribution/dispatches/:dispatchId/pack`
  - `PATCH /api/v1/distribution/dispatches/:dispatchId/dispatch`
  - `PATCH /api/v1/distribution/dispatches/:dispatchId/deliver`
  - `PATCH /api/v1/distribution/dispatches/:dispatchId/fail`
  - `PATCH /api/v1/distribution/dispatches/:dispatchId/return`
- Added service-level dispatch transition engine with:
  - action parsing
  - allowed-transition validation
  - branch scope enforcement
  - actor/timestamp stamping for dispatch workflow operations
- Added unit test coverage for:
  - valid transition to `READY`
  - valid transition to `DELIVERED`
  - invalid transition rejection

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `74/74` tests).
- `pnpm build` passed at workspace level.

### Notes

- Dispatch lifecycle enforcement now prevents invalid status jumps in operational flows.

## Task: Distribution Transfer Lifecycle Actions (V1.16.9)

Date: 2026-03-21

### Scope

- Added transfer status transition action endpoints:
  - `PATCH /api/v1/distribution/transfers/:transferId/request`
  - `PATCH /api/v1/distribution/transfers/:transferId/approve`
  - `PATCH /api/v1/distribution/transfers/:transferId/dispatch`
  - `PATCH /api/v1/distribution/transfers/:transferId/receive`
- Added service-level transition engine for transfer workflow:
  - action parsing
  - allowed-transition validation
  - branch scope enforcement
  - status-history append for audit traceability
- Added unit test coverage for:
  - valid request transition
  - valid receive transition to `COMPLETED`
  - invalid transition rejection

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `71/71` tests).
- `pnpm build` passed at workspace level.

### Notes

- Transition actions now auto-stamp actor/time fields (`requested_by`, `approved_by`, `dispatched_date`, `received_date`) when applicable.

## Task: Full Workspace Build Verification

Date: 2026-03-21

### Command

`pnpm build`

### Result

- Build completed successfully across workspace packages.
- `apps/core-api` built with Nest.
- `apps/erp-web` production build completed with Vite.
- `apps/crm-web` production build completed with Vite.
- Shared packages (`shared-types`, `ui-core`, `api-client`) build scripts completed successfully.

### Notes

- No source-code or runtime behavior changes were made in this task.
- This entry exists to keep a traceable task record aligned with the commit-per-task workflow.

## Task: Beta V3 Step 2 - Relational Backbone FK Implementation

Date: 2026-03-21

### Scope

- Added explicit Prisma relations for core ERP/CRM link columns and org/branch scoping columns.
- Added a new Prisma migration to clean optional orphan references and enforce foreign keys.

### Validation

- `pnpm --filter @sphincs/core-api exec prisma validate` passed.
- `pnpm --filter @sphincs/core-api test` passed (`10/10` suites, `33/33` tests).
- `pnpm build` passed at workspace level.

### Notes

- Migration includes pre-constraint cleanup for nullable relation fields (`supplier_id`, `item_id`, `contact_id`, `lead_id`) and nullable branch/org references where applicable.
- Migration includes required-organization integrity checks before adding non-null organization foreign keys.

## Task: Beta V3 Step 3 - Tenant And Branch Safety Coverage

Date: 2026-03-21

### Scope

- Added service-level relation scope guards in ERP purchasing, CRM leads, and CRM opportunities flows.
- Guard logic now rejects relation links that are outside the requester's organization or incompatible with the requester's branch scope.
- Added regression tests for both create and update relation-linking paths.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`11/11` suites, `44/44` tests).
- `pnpm build` passed at workspace level.

### Notes

- DB foreign keys guarantee existence; these guard checks enforce tenant and branch compatibility at the business-logic layer.

## Task: CI E2E Fix - Prisma Mock Relation Delegates

Date: 2026-03-21

### Scope

- Fixed `test_core_api` e2e failure caused by missing Prisma delegate methods in the e2e mock after adding relation-scope guards.
- Added `findFirst` implementations for mocked `supplier` and `item` delegates in `auth-items.e2e-spec.ts`.

### Validation

- `pnpm --filter @sphincs/core-api test:e2e` passed (`1/1` suite, `6/6` tests).
- `pnpm --filter @sphincs/core-api test` passed (`11/11` suites, `44/44` tests).
- `pnpm build` passed at workspace level.

### Notes

- This is a test-harness compatibility fix; application runtime behavior is unchanged.

## Task: Beta V3 Step 4 - First CRM To ERP Handoff

Date: 2026-03-21

### Scope

- Added CRM endpoint for operational handoff:
  - `POST /api/v1/crm/opportunities/:id/handoff/purchase-order`
- Handoff enforces `WON`-only opportunity gating.
- Handoff creates ERP draft purchase orders through existing purchasing service path.
- Added service tests and e2e coverage for the new handoff flow.
- Added dedicated handoff documentation.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`11/11` suites, `46/46` tests).
- `pnpm --filter @sphincs/core-api test:e2e` passed (`1/1` suite, `7/7` tests).
- `pnpm build` passed at workspace level.

### Notes

- The first handoff is intentionally minimal and production-safe: opportunity -> draft purchase order.

## Task: Version Surface Sync To Beta V1.13.0

Date: 2026-03-21

### Scope

- Synced runtime/version surfaces so API status and docs align with current release line.

### Changes

- Updated system API fallback version in backend:
  - `apps/core-api/src/system/system.controller.ts`
- Updated local and example env version value:
  - `apps/core-api/.env`
  - `apps/core-api/.env.example`
- Updated root project overview version:
  - `index.md`

### Notes

- Production will show the updated value after deploy and environment refresh.

## Task: Beta V3 Lead Transition + Business Audit Events

Date: 2026-03-21

### Scope

- Added explicit lead-to-opportunity conversion endpoint:
  - `POST /api/v1/crm/leads/:id/convert-to-opportunity`
- Added transactional lead conversion flow:
  - lead status -> `CONVERTED`
  - new linked opportunity -> `OPEN`
- Added business audit records for:
  - lead conversion (`CRM_LEAD_CONVERTED_TO_OPPORTUNITY`)
  - opportunity handoff to ERP purchase order (`CRM_OPPORTUNITY_HANDOFF_TO_ERP_PO`)
- Added unit + e2e coverage for lead conversion path.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`11/11` suites, `48/48` tests).
- `pnpm --filter @sphincs/core-api test:e2e` passed (`1/1` suite, `8/8` tests).
- `pnpm build` passed at workspace level.

## Task: Landing Page UI/UX Redesign (Web Home)

Date: 2026-03-21

### Scope

- Rebuilt `apps/web-home/index.html` with a premium landing experience:
  - sticky glassmorphic navbar
  - hero-first immersive section with prominent logo
  - smooth snap-scroll section locking
  - alternating zig-zag storytelling sections
  - responsive desktop/tablet/mobile behavior
- Added auth-aware header actions:
  - logged-out state -> Login button
  - logged-in state -> Dashboard button + profile dropdown
- Added section reveal motion and polished transitions.

### Validation

- `pnpm build` passed at workspace level.

### Notes

- Hero background is implemented with a replaceable CSS variable so custom images can be dropped in later.

## Task: Landing Content Alignment To Official SPHINCS Expansion

Date: 2026-03-21

### Scope

- Updated landing storytelling content to match the official SPHINCS expansion:
  - `S` System
  - `P` Platform
  - `H` Hub
  - `I` Integration
  - `N` Network
  - `C` Cloud
  - `S` Suite

### Changes

- Expanded narrative blocks and copy to reflect full acronym meaning.
- Added missing N/C/S feature sections for complete sequence continuity.

### Validation

- `pnpm build` passed at workspace level.

## Task: Landing Visual Palette Revert To Existing Brand Scheme

Date: 2026-03-21

### Scope

- Restored the previously established dark-gold palette while preserving the redesigned layout and motion system.

### Changes

- Reverted landing theme tokens/colors to existing approved brand direction.
- Kept premium glassmorphism, section rhythm, and interaction patterns intact.

### Validation

- `pnpm build` passed at workspace level.

## Task: Landing Acronym Visibility And Section Label Refinement

Date: 2026-03-21

### Scope

- Improved visibility of the full SPHINCS acronym on the page and aligned section labels to exact wording.

### Changes

- Added an acronym chip row to make all letters visible in the hero area.
- Corrected/standardized section labels:
  - `S | System`
  - `P | Platform`
  - `H | Hub`
  - `I | Integration`

### Validation

- `pnpm build` passed at workspace level.

## Task: Landing Scroll Feel Tuning (Snap Softening)

Date: 2026-03-21

### Scope

- Tuned scroll snapping behavior to feel smoother and less abrupt.

### Changes

- Softened section lock behavior and transition feel for more natural guided scrolling.

### Validation

- `pnpm build` passed at workspace level.

## Task: Hero Composition Shift From Logo-First To Text-First

Date: 2026-03-21

### Scope

- Replaced hero logo-first emphasis with a textual welcome-led composition.

### Changes

- Updated hero content hierarchy to prioritize message clarity over logo prominence.

### Validation

- `pnpm build` passed at workspace level.

## Task: Hero Brand Statement Update

Date: 2026-03-21

### Scope

- Updated hero headline to the final brand statement requested by product direction.

### Changes

- Set primary headline to:
  - `SPHINCS - Where Your Business Comes Together`
- Kept supporting expansion line for acronym context.

### Validation

- `pnpm build` passed at workspace level.

## Task: Landing Auth State Sync (Login -> Dashboard)

Date: 2026-03-21

### Scope

- Fixed landing header auth-state detection so logged-in users see `Dashboard` instead of `Login`.
- Synced landing auth checks with the shared session storage used by ERP/CRM apps.

### Changes

- Updated `apps/web-home/index.html` auth script to read session payload from:
  - `localStorage["sphincs.session"]`
  - legacy fallbacks: `sphincs.erp.session`, `sphincs.crm.session`
- Added safe JSON parsing and `accessToken` presence validation before considering session as authenticated.
- Updated logout behavior to clear shared session keys in addition to legacy token keys.

### Validation

- `pnpm build` passed at workspace level.

### Notes

- This resolves the mismatch where users were already authenticated in ERP/CRM but landing still rendered the logged-out action state.

## Task: Distribution DB-First Foundation

Date: 2026-03-21

### Scope

- Shifted implementation strategy to DB-first for unified distribution domain.
- Added core Prisma enums and models for stock, movement, receiving, transfer, adjustment, dispatch, return, reservation, reorder, and alerts.
- Added a dedicated SQL migration scaffold for deployment.

### Changes

- Extended Prisma schema:
  - new enums for consistent status systems and movement typing
  - new models:
    - `InventoryStock`
    - `InventoryMovement`
    - `GoodsReceipt`, `GoodsReceiptLine`
    - `StockTransfer`, `StockTransferLine`
    - `StockAdjustment`, `StockAdjustmentLine`
    - `StockDispatch`, `StockDispatchLine`
    - `StockReturn`, `StockReturnLine`
    - `InventoryReservation`
    - `ReorderRule`
    - `StockAlert`
- Extended core relations in:
  - `Organization`
  - `Branch`
  - `Item`
  - `Supplier`
  - `PurchaseOrder`
- Added migration:
  - `apps/core-api/prisma/migrations/20260321_distribution_db_foundation/migration.sql`
- Added design/implementation documentation:
  - `docs/distribution-db-foundation-v1.md`

### Validation

- `pnpm --filter @sphincs/core-api prisma:generate` passed.
- `pnpm --filter @sphincs/core-api exec prisma validate` passed.
- `pnpm build` passed at workspace level.

### Notes

- This task delivers the data backbone only; service/controller/API wiring for distribution workflows is the next phase.

## Task: Distribution Dashboard API V1

Date: 2026-03-21

### Scope

- Implemented the first backend API slice on top of the new distribution schema.
- Added a dashboard endpoint that aggregates operational metrics and branch/activity/alert summaries.

### Changes

- Added distribution module files:
  - `apps/core-api/src/erp/distribution/distribution.module.ts`
  - `apps/core-api/src/erp/distribution/distribution.controller.ts`
  - `apps/core-api/src/erp/distribution/distribution.service.ts`
  - `apps/core-api/src/erp/distribution/distribution.service.spec.ts`
- Registered `DistributionModule` in `AppModule`.
- Added endpoint:
  - `GET /api/v1/distribution/dashboard`
- Added API documentation:
  - `docs/distribution-dashboard-api-v1.md`

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `50/50` tests).
- `pnpm build` passed at workspace level.

### Notes

- Branch-scoped users receive branch-scoped dashboard aggregates.
- This is the first service layer above the DB foundation and unlocks receiving/transfer workflow APIs next.

## Task: Render Migration Deploy Hotfix (BOM Removal)

Date: 2026-03-21

### Scope

- Fixed production migration deploy failure on Render for `20260321_distribution_db_foundation`.

### Changes

- Re-encoded `apps/core-api/prisma/migrations/20260321_distribution_db_foundation/migration.sql` as UTF-8 without BOM.
- Root cause from deploy logs:
  - Postgres syntax error at first character (`\uFEFF`) caused by BOM header.

### Validation

- `pnpm --filter @sphincs/core-api exec prisma validate` passed.
- `pnpm --filter @sphincs/core-api prisma:generate` passed.

### Notes

- This is a deploy compatibility fix only; schema intent and SQL statements are unchanged.

## Task: Render Deploy Guard For Failed Migration State (P3009)

Date: 2026-03-21

### Scope

- Fixed recurring Render deploy failure caused by Prisma failed-migration lock state in target DB.

### Changes

- Updated `scripts/render-build-core-api.sh` to run:
  - `prisma migrate resolve --rolled-back 20260321_distribution_db_foundation`
  before `prisma migrate deploy`.
- Added resolve attempts for both migration paths:
  - `DIRECT_URL` execution path
  - `DATABASE_URL` fallback path
- Added non-fatal handling so resolve failures do not stop deploy if there is nothing to resolve.

### Validation

- Script logic reviewed for both URL modes and fallback flow.
- Local bash syntax execution could not be performed in this environment because `/bin/bash` is unavailable.

### Notes

- This unblocks deployments where the migration history table still marks `20260321_distribution_db_foundation` as failed from earlier attempts.

## Task: Distribution Movements API (Create + List)

Date: 2026-03-21

### Scope

- Implemented movement ledger APIs on top of the distribution module.
- Added endpoint support for creating and listing inventory movements with scope-aware validation.

### Changes

- Updated controller routes in:
  - `apps/core-api/src/erp/distribution/distribution.controller.ts`
- Added service methods in:
  - `apps/core-api/src/erp/distribution/distribution.service.ts`
  - `createMovement(...)`
  - `listMovements(...)`
- Added validation for:
  - required movement fields
  - enum movement types
  - UUID format checks
  - quantity constraints
  - organization + branch + item scope safety
- Expanded tests in:
  - `apps/core-api/src/erp/distribution/distribution.service.spec.ts`
- Updated API docs:
  - `docs/distribution-dashboard-api-v1.md`

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `53/53` tests).
- `pnpm build` passed at workspace level.

### Notes

- Movement endpoints are now ready for UI integration and for follow-up workflows (receipts/transfers/adjustments) to post ledger events.

## Task: Distribution Receipts API (Create + List)

Date: 2026-03-21

### Scope

- Implemented goods-receipt APIs in the distribution module with line-level validation and partial-receipt behavior.

### Changes

- Added controller routes:
  - `GET /api/v1/distribution/receipts`
  - `POST /api/v1/distribution/receipts`
- Added service methods:
  - `listReceipts(...)`
  - `createReceipt(...)`
- Added receipt domain validation for:
  - line item quantity constraints
  - valid status enum parsing
  - organization/branch/item/supplier/purchase-order scope
  - branch-aware access control
- Added/expanded tests in:
  - `apps/core-api/src/erp/distribution/distribution.service.spec.ts`
- Updated distribution API documentation with receipt endpoint contracts.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `56/56` tests).
- `pnpm build` passed at workspace level.

### Notes

- Receipt status is auto-derived when not provided:
  - no received qty -> `DRAFT`
  - partial received -> `PARTIAL`
  - fully received -> `RECEIVED`

## Task: Distribution Transfers API (Create + List)

Date: 2026-03-21

### Scope

- Implemented transfer workflow APIs for inter-branch stock movement orchestration.

### Changes

- Added controller routes:
  - `GET /api/v1/distribution/transfers`
  - `POST /api/v1/distribution/transfers`
- Added service methods:
  - `listTransfers(...)`
  - `createTransfer(...)`
- Added transfer validation for:
  - source/destination branch integrity
  - transfer line quantity rules (`requested/sent/received`)
  - organization + branch + item scope safety
- Added/expanded tests in:
  - `apps/core-api/src/erp/distribution/distribution.service.spec.ts`
- Updated distribution API documentation for transfer endpoints and filters.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `59/59` tests).
- `pnpm build` passed at workspace level.

### Notes

- Transfer APIs now complete the first operational trilogy after dashboard:
  - movements
  - receipts
  - transfers

## Task: Distribution Adjustments API (Create + List)

Date: 2026-03-21

### Scope

- Implemented stock adjustment APIs for inventory correction workflows.

### Changes

- Added controller routes:
  - `GET /api/v1/distribution/adjustments`
  - `POST /api/v1/distribution/adjustments`
- Added service methods:
  - `listAdjustments(...)`
  - `createAdjustment(...)`
- Added adjustment validation for:
  - `adjustment_type` and `status` enums
  - line variance math consistency
  - directional variance rules by adjustment type
  - organization/branch/item scope safety
- Added/expanded unit tests in:
  - `apps/core-api/src/erp/distribution/distribution.service.spec.ts`
- Updated distribution API docs for adjustment endpoints.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `62/62` tests).
- `pnpm build` passed at workspace level.

### Notes

- Adjustment APIs now provide the correction path required for real-world stock mismatches between expected and counted quantities.

## Task: Distribution Dispatch API (Create + List)

Date: 2026-03-21

### Scope

- Implemented outbound dispatch APIs for stock issue workflows.

### Changes

- Added controller routes:
  - `GET /api/v1/distribution/dispatches`
  - `POST /api/v1/distribution/dispatches`
- Added service methods:
  - `listDispatches(...)`
  - `createDispatch(...)`
- Added dispatch validation for:
  - required destination and line items
  - positive dispatch line quantities
  - status enum checks
  - organization/branch/item scope safety
- Added/expanded tests in:
  - `apps/core-api/src/erp/distribution/distribution.service.spec.ts`
- Updated distribution API docs for dispatch endpoints.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `65/65` tests).
- `pnpm build` passed at workspace level.

### Notes

- Dispatch APIs complete the outbound processing foundation and prepare the path for returns integration.

## Task: Distribution Returns API (Create + List)

Date: 2026-03-21

### Scope

- Implemented returns APIs for inbound/outbound return handling in the distribution workflow.

### Changes

- Added controller routes:
  - `GET /api/v1/distribution/returns`
  - `POST /api/v1/distribution/returns`
- Added service methods:
  - `listReturns(...)`
  - `createReturn(...)`
- Added returns validation for:
  - required return type
  - positive line quantities
  - line-level `restock`/`damaged` handling
  - organization/branch/item scope safety
- Added/expanded tests in:
  - `apps/core-api/src/erp/distribution/distribution.service.spec.ts`
- Updated distribution API docs for returns endpoints.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `68/68` tests).
- `pnpm build` passed at workspace level.

### Notes

- Returns APIs complete the first end-to-end distribution operation set:
  - movements
  - receipts
  - transfers
  - adjustments
  - dispatches
  - returns
