# Implementation Worklog - 2026-03-21

## Task: DB Temporal Status Invariants (V1.16.56)

Date: 2026-03-27

### Scope

- Added migration:
  - `20260327_distribution_temporal_status_invariants`
- Added DB temporal constraints binding required dates to progressed statuses in receipts, transfers, adjustments, dispatches, and returns.
- Updated create flows to auto-assign required lifecycle dates when status implies progressed state and the input omits date values.
- Added unit coverage for status-driven timestamp autofill behavior.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `138/138` tests).
- `pnpm build` passed at workspace level.

### Notes

- This enforces lifecycle time completeness at DB layer while keeping API create flows compatible through deterministic date defaults.

## Task: DB Status Domain Guardrails (V1.16.55)

Date: 2026-03-27

### Scope

- Added migration:
  - `20260327_distribution_status_guardrails`
- Introduced DB check constraints for status/type domains in:
  - `inventory_movements`
  - `stock_alerts`
  - `warehouse_locations`
  - `inventory_lots`
  - `dispatch_pick_jobs`
  - `dispatch_pack_jobs`
- Constraints are added as `NOT VALID` for rollout safety while enforcing new writes.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `134/134` tests).
- `pnpm build` passed at workspace level.

### Notes

- This reduces backend status/type drift risk by moving allowed-domain enforcement to the DB layer.

## Task: Distribution Reporting Indexes (V1.16.54)

Date: 2026-03-27

### Scope

- Added migration:
  - `20260327_distribution_reporting_indexes`
- Introduced targeted indexes for high-frequency distribution filters/sorts:
  - inventory movements (org + deleted + occurred_at, org + reference)
  - inventory stock snapshots (org + branch + item + deleted)
  - status/timeline listings on receipts, transfers, dispatches, adjustments, and returns

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `134/134` tests).
- `pnpm build` passed at workspace level.

### Notes

- This improves backend list/report performance as data volume grows and reduces planner variance on common operational queries.

## Task: DB Line Quantity Invariants (V1.16.53)

Date: 2026-03-27

### Scope

- Added migration:
  - `20260327_distribution_line_quantity_invariants`
- Introduced DB check constraints for line-level workflow math in:
  - `goods_receipt_lines`
  - `stock_transfer_lines`
  - `stock_adjustment_lines`
  - `stock_dispatch_lines`
  - `stock_return_lines`
- Constraints are added as `NOT VALID` for safe rollout with immediate protection on new writes.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `134/134` tests).
- `pnpm build` passed at workspace level.

### Notes

- This pushes key distribution quantity invariants into the database layer and reduces risk from non-service write paths.

## Task: DB Quantity Guardrails (V1.16.52)

Date: 2026-03-27

### Scope

- Added migration:
  - `20260327_inventory_quantity_guardrails`
- Introduced DB check constraints for quantity integrity on:
  - `inventory_stocks`
  - `inventory_lot_balances`
- Guardrails include non-negative quantity checks and on-hand consistency (`reserved`/`available` cannot exceed `on_hand`).
- Constraints are added as `NOT VALID` for safer rollout while enforcing new writes.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `134/134` tests).
- `pnpm build` passed at workspace level.

### Notes

- This hardens backend data integrity by moving critical quantity invariants into the database layer.

## Task: DB-Enforced Movement Idempotency (V1.16.51)

Date: 2026-03-27

### Scope

- Added DB migration:
  - `20260327_inventory_movement_system_idempotency_index`
- Migration introduces a partial unique index for active referenced system movements to enforce idempotency under concurrency.
- Updated service flow to handle unique-constraint race outcomes gracefully by resolving to duplicate-skip audit behavior instead of failing.
- Added unit coverage for unique-constraint race fallback.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `134/134` tests).
- `pnpm build` passed at workspace level.

### Notes

- This strengthens backend consistency by combining app-layer duplicate checks with database-layer uniqueness guarantees.

## Task: Atomic System Movement Posting (V1.16.50)

Date: 2026-03-27

### Scope

- Refactored system movement helper to execute in a single transaction unit.
- Wrapped duplicate detection, movement write/skip audit event, and stock sync operations inside transactional execution.
- Added transaction fallback behavior for test/mock environments where `$transaction` is unavailable.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `133/133` tests).
- `pnpm build` passed at workspace level.

### Notes

- This reduces partial-write risk and improves consistency between movement ledger, audit logs, and stock snapshots.

## Task: Duplicate-Skip Audit Visibility (V1.16.49)

Date: 2026-03-27

### Scope

- Added explicit audit logging when system movement auto-posting skips a duplicate movement.
- Duplicate suppression now emits `DISTRIBUTION_SYSTEM_MOVEMENT_SKIPPED_DUPLICATE` with movement/reference metadata.
- Added unit coverage for duplicate-skip audit emission.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `133/133` tests).
- `pnpm build` passed at workspace level.

### Notes

- This improves operational diagnostics by making idempotency-driven skips visible in the audit stream.

## Task: System Movement Audit Trail (V1.16.48)

Date: 2026-03-27

### Scope

- Added explicit audit logging for system-generated movement auto-post operations.
- Auto-post helper now writes `DISTRIBUTION_SYSTEM_MOVEMENT_POSTED` events with movement + reference metadata.
- Added unit coverage to validate audit event emission in helper-backed movement posting.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `133/133` tests).
- `pnpm build` passed at workspace level.

### Notes

- This improves operational traceability by providing direct audit entries for every automated movement post, independent of parent transition events.

## Task: Movement Auto-Post Idempotency Guard (V1.16.47)

Date: 2026-03-27

### Scope

- Added duplicate-suppression logic for system-generated movement posting helper.
- Auto-post integration now checks for existing movement rows by organization/reference/movement type/item/quantity before creating a new movement record.
- Added unit coverage for duplicate-suppression behavior in transition-driven movement posting.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `133/133` tests).
- `pnpm build` passed at workspace level.

### Notes

- This hardens movement integration reliability for retry/re-entrant workflows and reduces duplicate ledger row risk.

## Task: Dispatch Return Movement Auto-Posting (V1.16.46)

Date: 2026-03-27

### Scope

- Added movement auto-post support for dispatch return transitions.
- Integrated transition behavior so dispatch status transition to `RETURNED` from `DISPATCHED`/`DELIVERED` posts `RETURN_IN` movements for line quantities.
- Added unit coverage for dispatch return transition auto-post behavior.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `132/132` tests).
- `pnpm build` passed at workspace level.

### Notes

- This closes the dispatch reversal movement gap and keeps outbound-return scenarios synchronized with movement ledger and inventory stock snapshots.

## Task: Transition Flow Movement Auto-Posting (V1.16.45)

Date: 2026-03-27

### Scope

- Added movement auto-post behavior to stock-impacting lifecycle transition actions.
- Integrated transition-time movement posting for:
  - goods receipt transition `DRAFT -> RECEIVED` (`PURCHASE_RECEIPT`)
  - stock adjustment transition `APPROVED -> APPLIED` (`ADJUSTMENT_INCREASE` / `ADJUSTMENT_DECREASE`)
  - stock dispatch transition `PACKED -> DISPATCHED` (`DISPATCH_ISSUE`)
- Added transition guards to prevent broad duplicate posting by only emitting movement entries on first stock-impacting status edges.
- Added unit coverage for receipt/adjustment/dispatch transition auto-post behavior.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `131/131` tests).
- `pnpm build` passed at workspace level.

### Notes

- This aligns transition actions with create-flow integrations so movement ledger and inventory stock snapshots remain synchronized across both workflow entry modes.

## Task: Return Completion Movement Auto-Posting (V1.16.44)

Date: 2026-03-27

### Scope

- Added return completion movement auto-posting support with deterministic movement mapping.
- Introduced return completion movement helper for reusable posting behavior across create and transition flows.
- Wired movement auto-post behavior for:
  - return create when status is `COMPLETED`
  - return transition when moving from `INSPECTED` to `COMPLETED`
- Implemented return completion movement mapping:
  - `RETURN_IN` for restockable line quantities
  - `DAMAGED_WRITE_OFF` for damaged line quantities
- Added unit coverage for return completion movement auto-post behavior on create and transition paths.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `130/130` tests).
- `pnpm build` passed at workspace level.

### Notes

- This closes return-side ledger consistency for completion workflows and extends the distribution auto-post integration set.

## Task: Transfer Movement Auto-Posting (V1.16.43)

Date: 2026-03-27

### Scope

- Integrated transfer workflow movement auto-posting into both create and transition service paths.
- Added auto-post behavior for transfer create:
  - `TRANSFER_OUT` entries from `quantity_sent` when transfer starts in `DISPATCHED`, `PARTIAL`, or `COMPLETED`.
  - `TRANSFER_IN` entries from `quantity_received` when transfer starts in `PARTIAL` or `COMPLETED`.
- Added auto-post behavior for transfer transitions:
  - `TRANSFER_OUT` on transition to `DISPATCHED`.
  - `TRANSFER_IN` on first receive transition from `DISPATCHED` to `PARTIAL`/`COMPLETED` (guarded to avoid duplicate inbound posting on later transitions).
- Added unit coverage for transfer auto-post behavior on create and transition flows.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `129/129` tests).
- `pnpm build` passed at workspace level.

### Notes

- This closes another core movement-history gap by ensuring transfer operations produce deterministic ledger entries and stock snapshot synchronization.

## Task: Workflow Auto-Posting to Movement Ledger (V1.16.42)

Date: 2026-03-27

### Scope

- Integrated movement-ledger auto-posting into distribution create workflows that represent stock-impacting operations.
- Added internal system movement writer to create movement rows and apply inventory stock sync consistently.
- Wired auto-post behavior for:
  - goods receipt create (`PURCHASE_RECEIPT`) based on per-line `received_qty`
  - stock adjustment create in `APPLIED` status (`ADJUSTMENT_INCREASE` / `ADJUSTMENT_DECREASE`) based on line variance
  - stock dispatch create in `DISPATCHED`/`DELIVERED` status (`DISPATCH_ISSUE`) based on line quantity
- Added unit coverage validating auto-posted movement behavior for receipt/adjustment/dispatch create flows.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `127/127` tests).
- `pnpm build` passed at workspace level.

### Notes

- This extends movement-to-stock consistency from manual movement posting to core operational workflow entry points.

## Task: Movement Branch Filter Support (V1.16.41)

Date: 2026-03-22

### Scope

- Added `branchId` filter support to `GET /api/v1/distribution/movements`.
- Extended movement list service filtering to:
  - validate requested branch scope
  - apply branch-level movement filtering against `branch_id`, `source_branch_id`, and `destination_branch_id`
  - preserve user scope enforcement behavior
- Added unit coverage for explicit branch-filtered movement listing.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `125/125` tests).
- `pnpm build` passed at workspace level.

### Notes

- This improves movement-log usability for branch operations by enabling direct branch-targeted queries.

## Task: Movement-to-Stock Auto Sync (V1.16.40)

Date: 2026-03-22

### Scope

- Extended `createMovement` flow to automatically update `inventory_stocks` after posting movement records.
- Added movement stock-sync logic for:
  - target branch resolution based on movement type and branch fields
  - stock deltas for inbound/outbound movement types
  - damaged quantity increment behavior for `DAMAGED_WRITE_OFF`
  - create-or-update inventory stock snapshot behavior
  - `last_movement_at` synchronization from movement timestamp
- Added unit assertion coverage that movement creation updates inventory stock snapshot rows.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `124/124` tests).
- `pnpm build` passed at workspace level.

### Notes

- This connects inventory movement logs to current stock records directly, reducing drift between transaction history and branch stock state.

## Task: Branch Stock Summary Report (V1.16.39)

Date: 2026-03-22

### Scope

- Added reporting endpoint:
  - `GET /api/v1/distribution/reports/branch-stock-summary`
- Added branch-level summary aggregation over inventory stock records with:
  - total quantity on hand
  - total available quantity
  - total in-transit quantity
  - total incoming quantity
  - total damaged quantity
  - low-stock and out-of-stock item counts
  - item-row count per branch
- Added summary totals across all included branches.
- Added unit coverage for branch-stock summary calculations and grouped output.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `124/124` tests).
- `pnpm build` passed at workspace level.

### Notes

- This exposes branch stock summary as a first-class reporting route, reducing dependence on dashboard-only aggregates.

## Task: Transfer + Dispatch Cancellation Transitions (V1.16.38)

Date: 2026-03-22

### Scope

- Added cancellation endpoints:
  - `PATCH /api/v1/distribution/transfers/:transferId/cancel`
  - `PATCH /api/v1/distribution/dispatches/:dispatchId/cancel`
- Extended transition action parsers to include:
  - transfer `CANCEL`
  - dispatch `CANCEL`
- Mapped cancel actions to `CANCELLED` target statuses in service transition logic.
- Added unit coverage for:
  - transfer cancellation from `REQUESTED`
  - dispatch cancellation from `DRAFT`

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `123/123` tests).
- `pnpm build` passed at workspace level.

### Notes

- This exposes lifecycle cancellation operations that were already allowed by status transition rules, closing controller/action parity gaps.

## Task: Goods Receipt Lifecycle Transitions (V1.16.37)

Date: 2026-03-22

### Scope

- Added goods receipt transition endpoints:
  - `PATCH /api/v1/distribution/receipts/:receiptId/receive`
  - `PATCH /api/v1/distribution/receipts/:receiptId/close`
  - `PATCH /api/v1/distribution/receipts/:receiptId/cancel`
- Added receipt transition service logic with:
  - transition action parser (`RECEIVE`, `CLOSE`, `CANCEL`)
  - status transition guardrails for `DRAFT`, `PARTIAL`, `RECEIVED`, `CLOSED`, `CANCELLED`
  - branch-scope validation per targeted receipt
  - receive transition metadata handling (`received_date`, `received_by`)
  - audit logging (`DISTRIBUTION_RECEIPT_TRANSITION`)
- Added unit coverage for:
  - successful receive transition
  - invalid transition rejection from `CLOSED`

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `121/121` tests).
- `pnpm build` passed at workspace level.

### Notes

- This closes the receipt status lifecycle gap so receiving operations can progress from draft/partial to terminal states with explicit controls.

## Task: Distribution Inventory Stock Records APIs (V1.16.36)

Date: 2026-03-22

### Scope

- Added inventory stock endpoints:
  - `GET /api/v1/distribution/inventory-stocks`
  - `POST /api/v1/distribution/inventory-stocks`
  - `PATCH /api/v1/distribution/inventory-stocks/:stockId`
- Added service logic for:
  - organization + branch + item scoped inventory stock listing
  - create flow with branch/item scope checks and stock consistency validation
  - update-by-id flow with branch scope checks and quantity guardrails
  - audit events on inventory stock create/update operations
- Added unit coverage for:
  - inventory stock list filter behavior
  - inventory stock create snapshot behavior
  - inventory stock update-by-id behavior

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `119/119` tests).
- `pnpm build` passed at workspace level.

### Notes

- This closes the direct Inventory Stock Records API gap and makes stock-by-branch data available as first-class distribution resources.

## Task: Distribution Shortages Report (V1.16.35)

Date: 2026-03-22

### Scope

- Added reporting endpoint:
  - `GET /api/v1/distribution/reports/shortages`
- Added shortages report computation based on active reorder rules and current stock snapshots.
- Added row-level outputs for:
  - branch/item/supplier context
  - reorder level and reorder quantity
  - current on-hand and available quantities
  - calculated shortage quantity
  - suggested reorder quantity
- Added summary totals for:
  - shortage rows
  - total shortage quantity
  - total suggested reorder quantity
- Added unit coverage for shortage report calculation behavior.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `116/116` tests).
- `pnpm build` passed at workspace level.

### Notes

- This adds a direct replenishment-focused operations view so teams can action restock requirements immediately.

## Task: Distribution Reservation Lifecycle Actions (V1.16.34)

Date: 2026-03-22

### Scope

- Added reservation lifecycle endpoints:
  - release
  - fulfill
  - cancel
- Added service transition logic with:
  - allowed transition validation
  - terminal state rejection
  - branch scope enforcement
- Added audit events for reservation status changes.
- Added unit coverage for:
  - successful release transition
  - invalid transition rejection from terminal state

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `115/115` tests).
- `pnpm build` passed at workspace level.

### Notes

- This closes reservation workflows by enabling explicit release/fulfill/cancel operations and auditability.

## Task: Distribution Inactive Stock Exceptions Report (V1.16.33)

Date: 2026-03-22

### Scope

- Added reporting endpoint:
  - `GET /api/v1/distribution/reports/inactive-stock`
- Added inactive-stock reporting to surface items with:
  - `item.status = INACTIVE`
  - `quantity_on_hand > 0`
- Added row outputs with branch/item stock context and movement timestamps.
- Added summary totals for:
  - affected rows
  - total quantity on hand
  - affected branches
- Added unit coverage for inactive-stock summary and row shape validation.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `113/113` tests).
- `pnpm build` passed at workspace level.

### Notes

- This report addresses inventory cleanup governance by surfacing inactive catalog items still carrying stock.

## Task: Distribution Branch SLA Report (V1.16.32)

Date: 2026-03-22

### Scope

- Added reporting endpoint:
  - `GET /api/v1/distribution/reports/branch-sla`
- Added branch-level SLA metrics for:
  - receipts
  - transfers
  - dispatches
- Added per-branch output fields for:
  - totals
  - on-time counts
  - overdue-open counts
  - on-time rate percentages
- Added summary-level SLA percentages aggregated across all included branches.
- Added configurable SLA window support (`slaDays`).
- Added unit coverage for branch SLA calculations and overdue detection behavior.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `112/112` tests).
- `pnpm build` passed at workspace level.

### Notes

- This report introduces branch health visibility for operations performance monitoring and SLA-oriented management.

## Task: Distribution Operations Exceptions Report (V1.16.31)

Date: 2026-03-22

### Scope

- Added reporting endpoint:
  - `GET /api/v1/distribution/reports/operations-exceptions`
- Added exception monitoring output for:
  - overdue receipts
  - overdue transfers
  - overdue dispatches
  - negative stock risks
- Added configurable overdue thresholds:
  - `receiptOverdueDays`
  - `transferOverdueDays`
  - `dispatchOverdueDays`
- Added summary payload with per-category counts and total exceptions.
- Added unit coverage for exception summary calculations.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `111/111` tests).
- `pnpm build` passed at workspace level.

### Notes

- This report provides a dedicated “what needs attention now” operations lens beyond standard KPI reports.

## Task: Distribution Supplier Fulfillment Report (V1.16.30)

Date: 2026-03-22

### Scope

- Added reporting endpoint:
  - `GET /api/v1/distribution/reports/supplier-fulfillment`
- Added supplier-level fulfillment aggregation based on goods receipts and line quantities.
- Added report outputs for:
  - receipt count by supplier
  - ordered/received/rejected/remaining quantity totals
  - supplier fulfillment rate percentage
  - consolidated summary totals
- Added unit coverage for supplier fulfillment summaries and ranking behavior.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `110/110` tests).
- `pnpm build` passed at workspace level.

### Notes

- This closes another key reporting gap by exposing supplier fulfillment accuracy as a first-class distribution metric.

## Task: Distribution Valuation + Mover Velocity Reports (V1.16.29)

Date: 2026-03-22

### Scope

- Added reporting endpoints:
  - `GET /api/v1/distribution/reports/stock-valuation`
  - `GET /api/v1/distribution/reports/fast-slow-movers`
- Added stock valuation report with:
  - per-item valuation rows (`quantity_on_hand * cost_price`)
  - branch-level valuation grouping
  - overall valuation totals
- Added fast/slow mover report with:
  - movement aggregation by item
  - ranked fast movers and slow movers
  - configurable minimum movement threshold (`minMovements`)
- Added unit coverage for valuation and mover report calculations.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `109/109` tests).
- `pnpm build` passed at workspace level.

### Notes

- This expands distribution analytics toward business-level monitoring (inventory value and movement velocity) beyond operational transaction reporting.

## Task: Distribution Receipts + Stock Loss Reports (V1.16.28)

Date: 2026-03-22

### Scope

- Added reporting endpoints:
  - `GET /api/v1/distribution/reports/receipts`
  - `GET /api/v1/distribution/reports/stock-loss`
- Added receipt fulfillment reporting with:
  - per-receipt ordered/received/rejected/remaining totals
  - fill-rate metrics
  - grouped status summary
- Added stock-loss reporting with consolidated rows from:
  - damaged return lines
  - decrease adjustment lines
- Added summary outputs for loss event count, lost quantity totals, and source grouping.
- Added unit coverage for both reporting methods.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `107/107` tests).
- `pnpm build` passed at workspace level.

### Notes

- This extends distribution reporting toward the full operational reporting set by covering inbound fulfillment and loss visibility.

## Task: Distribution Lifecycle Controls For Locations And Lots (V1.16.27)

Date: 2026-03-22

### Scope

- Added warehouse location lifecycle actions:
  - activate
  - deactivate
- Added lot lifecycle actions:
  - activate
  - hold
  - exhaust
  - close
- Added audit event writes for:
  - warehouse location transitions
  - lot transitions
  - pick-job transitions
  - pack-job transitions
- Added unit coverage for:
  - warehouse location transition behavior
  - lot transition behavior
  - pick-job transition audit behavior

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `105/105` tests).
- `pnpm build` passed at workspace level.

### Notes

- This completes lifecycle control on newly introduced phase-2 entities so operations can manage active/hold/exhausted states via API without direct DB changes.

## Task: Distribution Operational Location Linkage (V1.16.26)

Date: 2026-03-22

### Scope

- Wired location IDs into existing operational distribution create flows:
  - movements (`source_location_id`, `destination_location_id`)
  - receipts (`receiving_location_id`)
  - transfers (`source_location_id`, `destination_location_id`)
  - dispatches (`dispatch_location_id`)
  - returns (`source_location_id`, `destination_location_id`)
- Added branch/location consistency checks so location references cannot cross branch boundaries for the same operation.
- Expanded response includes to expose location context in list/create payloads for linked operations.
- Extended distribution unit tests to assert location field handling across movement, receipt, transfer, dispatch, and return create flows.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `102/102` tests).
- `pnpm build` passed at workspace level.

### Notes

- This task completes core table-to-flow linkage for the new warehouse location model across operational APIs.

## Task: Distribution Bulk Routing Expansion (Lots + Pick/Pack) (V1.16.25)

Date: 2026-03-22

### Scope

- Added lots APIs:
  - `GET /api/v1/distribution/lots`
  - `POST /api/v1/distribution/lots`
- Added lot-balance APIs:
  - `GET /api/v1/distribution/lot-balances`
  - `POST /api/v1/distribution/lot-balances`
- Added dispatch pick/pack workflow APIs:
  - `GET/POST /api/v1/distribution/dispatches/:dispatchId/pick-jobs`
  - `PATCH /api/v1/distribution/pick-jobs/:pickJobId/start|complete|cancel`
  - `GET/POST /api/v1/distribution/dispatches/:dispatchId/pack-jobs`
  - `PATCH /api/v1/distribution/pack-jobs/:packJobId/start|complete|cancel`
- Added service-level validation for:
  - dispatch scope
  - lot scope
  - dispatch-line to job-line integrity
  - branch-safe lot/location linkage
- Added unit tests for:
  - lot listing/creation
  - lot-balance creation
  - pick-job creation
  - pack-job transition

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `102/102` tests).
- `pnpm build` passed at workspace level.

### Notes

- This batch was delivered as one integrated routing pass on `main` to reduce repeated deployment wait cycles.

## Task: Distribution Warehouse Location APIs (V1.16.24)

Date: 2026-03-22

### Scope

- Added distribution warehouse location endpoints:
  - `GET /api/v1/distribution/warehouse-locations`
  - `POST /api/v1/distribution/warehouse-locations`
- Added service logic for warehouse-location workflows:
  - branch-scoped and organization-scoped location validation
  - parent location same-branch enforcement
  - branch-level code uniqueness guard
- Added unit tests for:
  - filtered warehouse-location listing
  - warehouse-location create with parent validation
  - cross-branch parent rejection behavior

### Validation

- `pnpm --filter @sphincs/core-api prisma:generate` passed.
- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `97/97` tests).
- `pnpm build` passed at workspace level.

### Notes

- This establishes the first API surface on top of the phase-2 warehouse location schema so location-aware receiving/dispatch flows can be added next.

## Task: Distribution Phase-2 Logistics DB Foundation (V1.16.23)

Date: 2026-03-22

### Scope

- Added migration `20260322_distribution_phase2_logistics_tables` to expand distribution storage for phase-2 logistics and traceability.
- Added new tables:
  - `warehouse_locations`
  - `inventory_lots`
  - `inventory_lot_balances`
  - `dispatch_pick_jobs`
  - `dispatch_pick_lines`
  - `dispatch_pack_jobs`
  - `dispatch_pack_lines`
- Extended existing operational tables with location linkage fields:
  - `inventory_movements`
  - `goods_receipts`
  - `stock_transfers`
  - `stock_dispatches`
  - `stock_returns`
- Updated Prisma schema relations to connect the new logistics entities with organization, branch, item, supplier, goods-receipt, and dispatch records.

### Validation

- `pnpm --filter @sphincs/core-api exec prisma validate --schema prisma/schema.prisma` passed.
- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `94/94` tests).
- `pnpm build` passed at workspace level.

### Notes

- This is a database-first slice and prepares phase-2 endpoints for warehouse locations, lots/serial tracking foundations, and pick/pack workflows.

## Task: Distribution Adjustment Variance Report API (V1.16.22)

Date: 2026-03-21

### Scope

- Added reporting endpoint:
  - `GET /api/v1/distribution/reports/adjustments`
- Added report filters:
  - `status`
  - `adjustmentType`
  - `branchId`
  - `from`
  - `to`
  - `includeDeleted`
- Added report output shape with:
  - per-adjustment variance metrics
  - aggregate totals and grouped status counts
- Added unit test coverage for variance summary and row-level metric calculations.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `94/94` tests).
- `pnpm build` passed at workspace level.

### Notes

- This completes the core operational reporting set for stock, movements, transfers, and adjustments.

## Task: Distribution Transfer Performance Report API (V1.16.21)

Date: 2026-03-21

### Scope

- Added reporting endpoint:
  - `GET /api/v1/distribution/reports/transfers`
- Added report filters:
  - `status`
  - `sourceBranchId`
  - `destinationBranchId`
  - `from`
  - `to`
  - `includeDeleted`
- Added report output shape with:
  - per-transfer fulfillment metrics
  - grouped status summary totals
- Added unit test coverage for transfer report summary and fill-rate calculations.

### Validation

- `pnpm --filter @sphincs/core-api test` passed (`12/12` suites, `93/93` tests).
- `pnpm build` passed at workspace level.

### Notes

- This provides a dedicated transfer-performance lens for branch logistics monitoring and KPI views.

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
