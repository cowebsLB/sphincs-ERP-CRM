# Changelog

This changelog tracks the product release line for SPHINCS ERP + CRM.

Package versions such as `0.1.0` are kept separate from product release versions.
The product release line for the beta program uses `Beta V<major>.<minor>.<patch>`.

## Current Release

- `Beta V1.16.45` - current active beta snapshot as of 2026-03-27

## Beta V1.16.45 - 2026-03-27

### Added

- Automatic movement-ledger posting for status-transition flows:
  - `PATCH /api/v1/distribution/receipts/:receiptId/receive` now auto-posts `PURCHASE_RECEIPT` movement rows when transitioning `DRAFT -> RECEIVED` with received quantities.
  - `PATCH /api/v1/distribution/adjustments/:adjustmentId/apply` now auto-posts `ADJUSTMENT_INCREASE` / `ADJUSTMENT_DECREASE` movement rows on `APPROVED -> APPLIED`.
  - `PATCH /api/v1/distribution/dispatches/:dispatchId/dispatch` now auto-posts `DISPATCH_ISSUE` movement rows on `PACKED -> DISPATCHED`.
- Unit coverage for receipt/adjustment/dispatch transition auto-post behavior.

### Changed

- Lifecycle transition actions now emit movement ledger records and stock sync updates consistently, matching create-flow auto-post behavior.
- System fallback version updated to `Beta V1.16.45`.

## Beta V1.16.44 - 2026-03-27

### Added

- Automatic return-completion movement posting for stock return workflows:
  - `POST /api/v1/distribution/returns` now auto-posts completion movements when created in `COMPLETED` status.
  - `PATCH /api/v1/distribution/returns/:returnId/complete` now auto-posts completion movements on `INSPECTED -> COMPLETED`.
- Return completion movement mapping:
  - `RETURN_IN` for restockable quantities.
  - `DAMAGED_WRITE_OFF` for damaged quantities.
- Unit coverage for return completion auto-post behavior on create and transition paths.

### Changed

- Return completion workflows now write movement ledger history and stock snapshot updates automatically, keeping return processing consistent with transfer/receipt/dispatch/adjustment integrations.
- System fallback version updated to `Beta V1.16.44`.

## Beta V1.16.43 - 2026-03-27

### Added

- Automatic transfer movement-ledger posting for transfer workflows:
  - `POST /api/v1/distribution/transfers` now auto-posts `TRANSFER_OUT` movements when created in `DISPATCHED`, `PARTIAL`, or `COMPLETED` status using `quantity_sent`.
  - `POST /api/v1/distribution/transfers` now auto-posts `TRANSFER_IN` movements when created in `PARTIAL` or `COMPLETED` status using `quantity_received`.
  - `PATCH /api/v1/distribution/transfers/:transferId/*` transition flows now auto-post:
    - `TRANSFER_OUT` on transition to `DISPATCHED`
    - `TRANSFER_IN` on first receive transition from `DISPATCHED` to `PARTIAL`/`COMPLETED`
- Unit coverage for transfer movement auto-post behavior on create and transition paths.

### Changed

- Transfer operational flows now write movement ledger entries and stock snapshots automatically instead of relying on manual movement posting.
- System fallback version updated to `Beta V1.16.43`.

## Beta V1.16.42 - 2026-03-27

### Added

- Automatic movement-ledger posting from operational create flows:
  - `POST /api/v1/distribution/receipts` now auto-posts `PURCHASE_RECEIPT` movements for received quantities.
  - `POST /api/v1/distribution/adjustments` now auto-posts `ADJUSTMENT_INCREASE`/`ADJUSTMENT_DECREASE` movements when created in `APPLIED` status.
  - `POST /api/v1/distribution/dispatches` now auto-posts `DISPATCH_ISSUE` movements when created in `DISPATCHED` or `DELIVERED` status.
- Unit coverage for auto-posted movement behavior on receipt/adjustment/dispatch create paths.

### Changed

- Workflow-originated stock activity now writes movement ledger records and stock snapshots together via existing movement-to-stock sync behavior.
- System fallback version updated to `Beta V1.16.42`.

## Beta V1.16.41 - 2026-03-22

### Added

- `GET /api/v1/distribution/movements` now accepts `branchId` as an explicit filter query parameter.
- Unit coverage for branch-filtered movement listing behavior.

### Changed

- Movement list filtering now supports direct branch-centric queries while preserving user branch scope enforcement.
- System fallback version updated to `Beta V1.16.41`.

## Beta V1.16.40 - 2026-03-22

### Changed

- Inventory movement creation now auto-syncs inventory stock snapshots so movement log and current stock records stay connected.
- Movement-driven stock sync behavior includes:
  - branch resolution by movement context (`branch_id`, `source_branch_id`, `destination_branch_id`)
  - on-hand and available quantity deltas for inbound/outbound movement types
  - damaged quantity deltas for `DAMAGED_WRITE_OFF`
  - create-or-update behavior for missing/existing `inventory_stocks` rows
  - `last_movement_at` updates from movement occurrence time
- Unit coverage updated to assert stock snapshot sync on movement creation.
- System fallback version updated to `Beta V1.16.40`.

## Beta V1.16.39 - 2026-03-22

### Added

- Distribution report endpoint:
  - `GET /api/v1/distribution/reports/branch-stock-summary`
- Branch stock summary report includes:
  - aggregated branch-level stock totals (on-hand, available, in-transit, incoming, damaged)
  - branch-level low-stock and out-of-stock counts
  - item row counts per branch
  - global summary totals across included branches
- Unit coverage for branch-level stock summary aggregation output.

### Changed

- Branch stock visibility is now available as a dedicated report endpoint in addition to dashboard widgets.
- System fallback version updated to `Beta V1.16.39`.

## Beta V1.16.38 - 2026-03-22

### Added

- Transfer lifecycle cancellation endpoint:
  - `PATCH /api/v1/distribution/transfers/:transferId/cancel`
- Dispatch lifecycle cancellation endpoint:
  - `PATCH /api/v1/distribution/dispatches/:dispatchId/cancel`
- Transition action support for:
  - transfer `CANCEL` action mapped to `CANCELLED`
  - dispatch `CANCEL` action mapped to `CANCELLED`
- Unit coverage for:
  - transfer cancellation from `REQUESTED`
  - dispatch cancellation from `DRAFT`

### Changed

- Distribution transition APIs now expose cancellation actions already represented in status models.
- System fallback version updated to `Beta V1.16.38`.

## Beta V1.16.37 - 2026-03-22

### Added

- Goods receipt lifecycle endpoints:
  - `PATCH /api/v1/distribution/receipts/:receiptId/receive`
  - `PATCH /api/v1/distribution/receipts/:receiptId/close`
  - `PATCH /api/v1/distribution/receipts/:receiptId/cancel`
- Receipt transition service workflow with:
  - transition action parsing and status guardrails
  - branch-scope validation for receipt ownership
  - automatic receive metadata assignment (`received_date`, `received_by`) on receive transition
  - audit events (`DISTRIBUTION_RECEIPT_TRANSITION`)
- Unit coverage for:
  - successful receipt transition to `RECEIVED`
  - invalid terminal-state transition rejection

### Changed

- Distribution receipts now support controlled operational lifecycle transitions after creation.
- System fallback version updated to `Beta V1.16.37`.

## Beta V1.16.36 - 2026-03-22

### Added

- Distribution inventory stock record endpoints:
  - `GET /api/v1/distribution/inventory-stocks`
  - `POST /api/v1/distribution/inventory-stocks`
  - `PATCH /api/v1/distribution/inventory-stocks/:stockId`
- Inventory stock service support for:
  - branch/item scoped stock listing
  - create-or-update stock snapshot writes (per organization + branch + item)
  - direct stock snapshot updates by stock ID
  - quantity consistency guardrails (`reserved <= on_hand`, `available <= on_hand`)
  - audit log events for inventory stock create/update actions
- Unit coverage for inventory stock listing, creation, and update flows.

### Changed

- Distribution now exposes first-class inventory stock record APIs instead of relying only on report internals.
- System fallback version updated to `Beta V1.16.36`.

## Beta V1.16.35 - 2026-03-22

### Added

- Distribution report endpoint:
  - `GET /api/v1/distribution/reports/shortages`
- Shortages report output includes:
  - branch + item context from active reorder rules
  - current on-hand and available quantity snapshots
  - computed shortage quantity and suggested reorder quantity
  - filtered rows containing only restock-required items
- Unit coverage for shortage summary and per-row quantity calculations.

### Changed

- Distribution reporting now surfaces direct restocking action data from reorder thresholds.
- System fallback version updated to `Beta V1.16.35`.

## Beta V1.16.34 - 2026-03-22

### Added

- Reservation lifecycle endpoints:
  - `PATCH /api/v1/distribution/reservations/:reservationId/release`
  - `PATCH /api/v1/distribution/reservations/:reservationId/fulfill`
  - `PATCH /api/v1/distribution/reservations/:reservationId/cancel`
- Reservation transition behavior with:
  - status transition guardrails
  - branch-scope validation
  - audit log events (`DISTRIBUTION_RESERVATION_TRANSITION`)
- Unit coverage for reservation transition success and terminal-state rejection behavior.

### Changed

- Distribution reservations now have explicit operational lifecycle controls beyond create/list.
- System fallback version updated to `Beta V1.16.34`.

## Beta V1.16.33 - 2026-03-22

### Added

- Distribution report endpoint:
  - `GET /api/v1/distribution/reports/inactive-stock`
- Inactive-stock report includes:
  - inactive items that still have positive on-hand quantity
  - branch/item stock breakdown rows
  - summary totals for affected quantity and branches
- Unit coverage for inactive-stock summary output.

### Changed

- Distribution reporting now explicitly surfaces inactive-inventory cleanup risk.
- System fallback version updated to `Beta V1.16.33`.

## Beta V1.16.32 - 2026-03-22

### Added

- Distribution report endpoint:
  - `GET /api/v1/distribution/reports/branch-sla`
- Branch SLA report includes:
  - receipt on-time and overdue-open metrics by branch
  - transfer on-time and overdue-open metrics by branch
  - dispatch on-time and overdue-open metrics by branch
  - global SLA summary percentages
- Configurable SLA window:
  - `slaDays`
- Unit coverage for branch SLA summary and overdue behavior.

### Changed

- Distribution analytics now includes per-branch SLA health for inbound, transfer, and dispatch pipelines.
- System fallback version updated to `Beta V1.16.32`.

## Beta V1.16.31 - 2026-03-22

### Added

- Distribution report endpoint:
  - `GET /api/v1/distribution/reports/operations-exceptions`
- Operations exceptions report includes:
  - overdue receipt count
  - overdue transfer count
  - overdue dispatch count
  - negative stock risk count
  - exception detail lists per category
- Configurable overdue thresholds:
  - `receiptOverdueDays`
  - `transferOverdueDays`
  - `dispatchOverdueDays`
- Unit coverage for operations exception summary aggregation.

### Changed

- Distribution reporting now includes consolidated exception monitoring for day-to-day operational triage.
- System fallback version updated to `Beta V1.16.31`.

## Beta V1.16.30 - 2026-03-22

### Added

- Distribution report endpoint:
  - `GET /api/v1/distribution/reports/supplier-fulfillment`
- Supplier fulfillment report includes:
  - per-supplier receipt counts
  - ordered/received/rejected/remaining quantity totals
  - supplier-level fulfillment rate percentages
  - consolidated summary totals
- Unit coverage for supplier fulfillment aggregation and ranking.

### Changed

- Distribution reporting surface now includes supplier fulfillment accuracy analytics.
- System fallback version updated to `Beta V1.16.30`.

## Beta V1.16.29 - 2026-03-22

### Added

- Distribution report endpoints:
  - `GET /api/v1/distribution/reports/stock-valuation`
  - `GET /api/v1/distribution/reports/fast-slow-movers`
- Stock valuation report includes:
  - per-item valuation using on-hand quantity and cost price
  - branch valuation totals
  - overall valuation summary
- Fast/slow mover report includes:
  - item-level movement aggregation
  - fast movers ranking
  - slow movers ranking
  - minimum movement threshold support
- Unit coverage for both reporting methods.

### Changed

- Distribution reporting surface now includes valuation and mover-velocity analytics.
- System fallback version updated to `Beta V1.16.29`.

## Beta V1.16.28 - 2026-03-22

### Added

- Distribution report endpoints:
  - `GET /api/v1/distribution/reports/receipts`
  - `GET /api/v1/distribution/reports/stock-loss`
- Receipt fulfillment report includes:
  - ordered/received/rejected/remaining quantity totals
  - fill-rate metrics
  - status grouping
- Stock-loss report includes:
  - damaged return losses
  - decrease adjustment losses
  - aggregate lost quantity summaries by source
- Unit coverage for both new report flows.

### Changed

- Distribution reporting surface now includes stock-on-hand, movements, transfers, adjustments, receipts, and stock-loss slices.
- System fallback version updated to `Beta V1.16.28`.

## Beta V1.16.27 - 2026-03-22

### Added

- Warehouse location lifecycle endpoints:
  - `PATCH /api/v1/distribution/warehouse-locations/:locationId/activate`
  - `PATCH /api/v1/distribution/warehouse-locations/:locationId/deactivate`
- Lot lifecycle endpoints:
  - `PATCH /api/v1/distribution/lots/:lotId/activate`
  - `PATCH /api/v1/distribution/lots/:lotId/hold`
  - `PATCH /api/v1/distribution/lots/:lotId/exhaust`
  - `PATCH /api/v1/distribution/lots/:lotId/close`
- Audit events for new lifecycle and workflow actions:
  - warehouse location transitions
  - lot transitions
  - dispatch pick job transitions
  - dispatch pack job transitions

### Changed

- Lifecycle transitions now enforce status/action validation for lots and warehouse locations.
- Lot transitions to `EXHAUSTED`/`CLOSED` now force `quantity_available = 0`.
- System fallback version updated to `Beta V1.16.27`.

## Beta V1.16.26 - 2026-03-22

### Changed

- Connected warehouse-location relations into existing operational distribution APIs:
  - movements now support `source_location_id` / `destination_location_id`
  - receipts now support `receiving_location_id`
  - transfers now support `source_location_id` / `destination_location_id`
  - dispatches now support `dispatch_location_id`
  - returns now support `source_location_id` / `destination_location_id`
- Added branch-consistency validations between branch and location fields in create flows.
- Extended include payloads for list/create responses to return location context where applicable.
- Extended unit tests to assert location linkage in movement/receipt/transfer/dispatch/return creation flows.
- System fallback version updated to `Beta V1.16.26`.

## Beta V1.16.25 - 2026-03-22

### Added

- Distribution lots and lot-balance APIs:
  - `GET /api/v1/distribution/lots`
  - `POST /api/v1/distribution/lots`
  - `GET /api/v1/distribution/lot-balances`
  - `POST /api/v1/distribution/lot-balances`
- Distribution dispatch pick/pack workflow APIs:
  - `GET /api/v1/distribution/dispatches/:dispatchId/pick-jobs`
  - `POST /api/v1/distribution/dispatches/:dispatchId/pick-jobs`
  - `PATCH /api/v1/distribution/pick-jobs/:pickJobId/start`
  - `PATCH /api/v1/distribution/pick-jobs/:pickJobId/complete`
  - `PATCH /api/v1/distribution/pick-jobs/:pickJobId/cancel`
  - `GET /api/v1/distribution/dispatches/:dispatchId/pack-jobs`
  - `POST /api/v1/distribution/dispatches/:dispatchId/pack-jobs`
  - `PATCH /api/v1/distribution/pack-jobs/:packJobId/start`
  - `PATCH /api/v1/distribution/pack-jobs/:packJobId/complete`
  - `PATCH /api/v1/distribution/pack-jobs/:packJobId/cancel`
- Additional distribution unit coverage for lots, lot balances, and dispatch pick/pack flows.

### Changed

- Distribution service now includes validation helpers for inventory-lot and dispatch scope enforcement.
- System fallback version updated to `Beta V1.16.25`.

## Beta V1.16.24 - 2026-03-22

### Added

- Warehouse location APIs for the distribution module:
  - `GET /api/v1/distribution/warehouse-locations`
  - `POST /api/v1/distribution/warehouse-locations`
- Warehouse location API capabilities:
  - branch-scoped listing with optional `isActive` and `parentLocationId` filters
  - branch-safe parent/child location validation on create
  - branch-level unique location code enforcement
- Unit tests for warehouse location list/create validation flows.

### Changed

- Distribution service now includes warehouse-location scope validation helper logic.
- System fallback version updated to `Beta V1.16.24`.

## Beta V1.16.23 - 2026-03-22

### Added

- Distribution phase-2 logistics and traceability tables:
  - `warehouse_locations`
  - `inventory_lots`
  - `inventory_lot_balances`
  - `dispatch_pick_jobs`
  - `dispatch_pick_lines`
  - `dispatch_pack_jobs`
  - `dispatch_pack_lines`
- New migration:
  - `20260322_distribution_phase2_logistics_tables`

### Changed

- Linked operational distribution tables to warehouse location references:
  - `inventory_movements`
  - `goods_receipts`
  - `stock_transfers`
  - `stock_dispatches`
  - `stock_returns`
- Extended Prisma schema relations across organization, branch, item, dispatch, and supplier models for phase-2 distribution workflows.
- System fallback version updated to `Beta V1.16.23`.

## Beta V1.16.22 - 2026-03-21

### Added

- Distribution adjustment variance report API:
  - `GET /api/v1/distribution/reports/adjustments`
- Report filters:
  - `status`, `adjustmentType`, `branchId`, `from`, `to`, `includeDeleted`
- Report payload now includes:
  - per-adjustment variance metrics (`variance_total`, `increase_total`, `decrease_total`)
  - aggregate summary with status grouping

### Changed

- Distribution reporting surface now includes stock, movement, transfer, and adjustment report endpoints.
- System fallback version updated to `Beta V1.16.22`.

## Beta V1.16.21 - 2026-03-21

### Added

- Distribution transfer performance report API:
  - `GET /api/v1/distribution/reports/transfers`
- Report filters:
  - `status`, `sourceBranchId`, `destinationBranchId`, `from`, `to`, `includeDeleted`
- Report payload now includes:
  - per-transfer fulfillment metrics (`quantity_requested_total`, `quantity_sent_total`, `quantity_received_total`, `fill_rate_pct`)
  - aggregate summary with status grouping

### Changed

- Distribution reports now cover stock-on-hand, movement history, and transfer performance slices.
- System fallback version updated to `Beta V1.16.21`.

## Beta V1.16.20 - 2026-03-21

### Added

- Distribution movement report API:
  - `GET /api/v1/distribution/reports/movements`
- Report filters:
  - `movementType`, `branchId`, `itemId`, `from`, `to`, `includeDeleted`
- Report payload now includes:
  - movement rows with branch/item context
  - aggregate summary (`total_movements`, `total_quantity`, `by_type`)

### Changed

- Distribution reporting surface now includes both stock-on-hand and movement history outputs.
- System fallback version updated to `Beta V1.16.20`.

## Beta V1.16.19 - 2026-03-21

### Added

- Distribution report API:
  - `GET /api/v1/distribution/reports/stock-on-hand`
- Report filters:
  - `branchId`, `itemId`, `lowOnly`, `outOnly`, `includeDeleted`
- Report payload now includes:
  - row-level stock visibility (`quantity_on_hand`, `available_quantity`, `low_stock`, `out_of_stock`)
  - aggregate summary totals

### Changed

- Distribution service now provides dedicated stock-on-hand reporting separate from dashboard and operational APIs.
- System fallback version updated to `Beta V1.16.19`.

## Beta V1.16.18 - 2026-03-21

### Added

- Alerts & exceptions APIs:
  - `GET /api/v1/distribution/alerts`
  - `PATCH /api/v1/distribution/alerts/:alertId/resolve`
- Alert list filtering support:
  - `status`, `severity`, `branchId`, `includeDeleted`
- Scoped alert resolution flow with audit event:
  - marks alert as `RESOLVED`
  - stamps `resolved_at`
  - writes `DISTRIBUTION_ALERT_RESOLVED` to `audit_logs`

### Changed

- Distribution service now exposes operational alert inbox behavior beyond dashboard snapshots.
- System fallback version updated to `Beta V1.16.18`.

## Beta V1.16.17 - 2026-03-21

### Added

- Distribution transition audit logging for high-risk workflows:
  - transfer lifecycle transitions
  - dispatch lifecycle transitions
  - return lifecycle transitions
  - adjustment lifecycle transitions
- Audit events are written to `audit_logs` with:
  - actor (`user_id`)
  - organization scope
  - entity type/id
  - transition metadata (`action`, `from_status`, `to_status`)

### Changed

- Distribution service now records explicit audit events after successful transition mutations to strengthen traceability.
- System fallback version updated to `Beta V1.16.17`.

## Beta V1.16.16 - 2026-03-21

### Added

- Method-level RBAC enforcement for distribution controller endpoints:
  - read-only access preserved for view endpoints
  - write-only access enforced for create/transition endpoints
  - approval-only access enforced for sensitive approve/apply/reverse actions

### Changed

- Distribution endpoint roles are now explicitly declared per route to prevent read-only roles from mutating operational data.
- High-risk actions (for example transfer/adjustment approvals) now require elevated roles (`Admin`, `ERP Manager`, `Branch Manager`).
- System fallback version updated to `Beta V1.16.16`.

## Beta V1.16.15 - 2026-03-21

### Added

- Adjustment lifecycle action APIs:
  - `PATCH /api/v1/distribution/adjustments/:adjustmentId/submit`
  - `PATCH /api/v1/distribution/adjustments/:adjustmentId/approve`
  - `PATCH /api/v1/distribution/adjustments/:adjustmentId/apply`
  - `PATCH /api/v1/distribution/adjustments/:adjustmentId/reverse`
- Adjustment status transition guardrails:
  - `DRAFT -> SUBMITTED|REVERSED`
  - `SUBMITTED -> APPROVED|REVERSED`
  - `APPROVED -> APPLIED|REVERSED`
  - `APPLIED -> REVERSED`

### Changed

- Distribution service now enforces action-driven adjustment approvals/apply/reverse operations with branch-scope checks.
- Adjustment lifecycle transitions now stamp operational metadata (`approved_by`, `applied_at`) where applicable.
- System fallback version updated to `Beta V1.16.15`.

## Beta V1.16.14 - 2026-03-21

### Added

- Restocking suggestion API:
  - `GET /api/v1/distribution/restocking-suggestions`
- Suggestion filters:
  - `branchId`, `includeInactive`, `includeZero`, `includeDeleted`
- Derived suggestion fields per branch/item rule:
  - current stock
  - shortage to reorder level
  - suggested order quantity
  - restock-needed indicator

### Changed

- Distribution service now derives replenishment suggestions by combining reorder rules with live inventory stock snapshots.
- System fallback version updated to `Beta V1.16.14`.

## Beta V1.16.13 - 2026-03-21

### Added

- Reorder rule APIs:
  - `GET /api/v1/distribution/reorder-rules`
  - `POST /api/v1/distribution/reorder-rules`
- Reorder rule list filtering support:
  - `branchId`, `itemId`, `isActive`, `includeDeleted`
- Reorder rule create validation:
  - required `item_id`
  - non-negative stock/lead-time fields
  - positive `reorder_quantity`
  - supplier/branch/item scope checks

### Changed

- Distribution service now supports branch-scoped reorder rule reads/writes through the unified distribution API.
- System fallback version updated to `Beta V1.16.13`.

## Beta V1.16.12 - 2026-03-21

### Added

- Reservation APIs:
  - `GET /api/v1/distribution/reservations`
  - `POST /api/v1/distribution/reservations`
- Reservation list filtering support:
  - `status`, `branchId`, `itemId`, `includeDeleted`
- Reservation create validation:
  - required `item_id`
  - positive `reserved_quantity`
  - reservation status enum checks
  - organization/branch/item scope checks

### Changed

- Distribution service now supports branch-scoped reservation reads and writes through unified distribution APIs.
- System fallback version updated to `Beta V1.16.12`.

## Beta V1.16.11 - 2026-03-21

### Added

- Return lifecycle action APIs:
  - `PATCH /api/v1/distribution/returns/:returnId/receive`
  - `PATCH /api/v1/distribution/returns/:returnId/inspect`
  - `PATCH /api/v1/distribution/returns/:returnId/complete`
  - `PATCH /api/v1/distribution/returns/:returnId/cancel`
- Return transition guardrails:
  - `DRAFT -> RECEIVED|CANCELLED`
  - `RECEIVED -> INSPECTED|CANCELLED`
  - `INSPECTED -> COMPLETED|CANCELLED`

### Changed

- Distribution service now enforces action-based return transition validation with branch-scope checks.
- Return transitions now auto-stamp processing metadata (`processed_by`, `processed_date`) when applicable.
- System fallback version updated to `Beta V1.16.11`.

## Beta V1.16.10 - 2026-03-21

### Added

- Dispatch lifecycle action APIs:
  - `PATCH /api/v1/distribution/dispatches/:dispatchId/ready`
  - `PATCH /api/v1/distribution/dispatches/:dispatchId/pack`
  - `PATCH /api/v1/distribution/dispatches/:dispatchId/dispatch`
  - `PATCH /api/v1/distribution/dispatches/:dispatchId/deliver`
  - `PATCH /api/v1/distribution/dispatches/:dispatchId/fail`
  - `PATCH /api/v1/distribution/dispatches/:dispatchId/return`
- Dispatch status transition guardrails:
  - `DRAFT -> READY`
  - `READY -> PACKED|FAILED`
  - `PACKED -> DISPATCHED|FAILED`
  - `DISPATCHED -> DELIVERED|FAILED|RETURNED`
  - `DELIVERED -> RETURNED`

### Changed

- Distribution service now enforces action-based dispatch transition validation and scoped branch checks before status updates.
- Dispatch transitions now auto-stamp operation metadata (`packed_by`, `dispatched_by`, `dispatch_date`) when applicable.
- System fallback version updated to `Beta V1.16.10`.

## Beta V1.16.9 - 2026-03-21

### Added

- Transfer lifecycle action APIs:
  - `PATCH /api/v1/distribution/transfers/:transferId/request`
  - `PATCH /api/v1/distribution/transfers/:transferId/approve`
  - `PATCH /api/v1/distribution/transfers/:transferId/dispatch`
  - `PATCH /api/v1/distribution/transfers/:transferId/receive`
- Transition guardrails for transfer workflow states:
  - `DRAFT -> REQUESTED`
  - `REQUESTED -> APPROVED`
  - `APPROVED -> DISPATCHED`
  - `DISPATCHED -> PARTIAL|COMPLETED`
  - `PARTIAL -> COMPLETED`
- Status-history append behavior on each transfer transition for stronger auditability.

### Changed

- Distribution service now enforces action-based transfer transition validation and branch scope checks before status mutation.
- Transfer transition actions now auto-stamp actor/time metadata (`requested_by`, `approved_by`, `dispatched_date`, `received_date`) based on the target state.
- System fallback version updated to `Beta V1.16.9`.

## Beta V1.16.8 - 2026-03-21

### Added

- Distribution return APIs:
  - `GET /api/v1/distribution/returns`
  - `POST /api/v1/distribution/returns`
- Return create validation:
  - return type + status enum checks
  - positive line quantities
  - line-level `restock`/`damaged` flags
  - organization/branch/item scope checks
- Return list filtering support:
  - `status`, `returnType`, `sourceBranchId`, `destinationBranchId`, `includeDeleted`

### Changed

- Distribution controller/service now include returns workflows in addition to dashboard, movements, receipts, transfers, adjustments, and dispatches.
- System fallback version updated to `Beta V1.16.8`.

## Beta V1.16.7 - 2026-03-21

### Added

- Distribution dispatch APIs:
  - `GET /api/v1/distribution/dispatches`
  - `POST /api/v1/distribution/dispatches`
- Dispatch create validation:
  - required destination + line items
  - positive line quantities
  - status enum validation
  - organization/branch/item scope checks
- Dispatch list filtering support:
  - `status`, `branchId`, `includeDeleted`

### Changed

- Distribution controller/service now include dispatch workflows in addition to dashboard, movements, receipts, transfers, and adjustments.
- System fallback version updated to `Beta V1.16.7`.

## Beta V1.16.6 - 2026-03-21

### Added

- Distribution adjustment APIs:
  - `GET /api/v1/distribution/adjustments`
  - `POST /api/v1/distribution/adjustments`
- Adjustment validation support:
  - `adjustment_type` + `status` enum checks
  - line-level variance consistency (`variance = adjusted_qty - previous_qty`)
  - directional validation by adjustment type (`INCREASE` / `DECREASE`)
  - organization/branch/item scope checks
- Adjustment list filtering:
  - `status`, `adjustmentType`, `branchId`, `includeDeleted`

### Changed

- Distribution controller/service now include adjustment workflows on top of dashboard, movements, receipts, and transfers.
- System fallback version updated to `Beta V1.16.6`.

## Beta V1.16.5 - 2026-03-21

### Added

- Distribution transfer APIs:
  - `GET /api/v1/distribution/transfers`
  - `POST /api/v1/distribution/transfers`
- Transfer create validation with lifecycle-safe constraints:
  - source and destination branches must differ
  - line quantity rules (`requested >= sent >= received`)
  - organization + branch + item scope validation
- Transfer list filtering support:
  - `status`, `sourceBranchId`, `destinationBranchId`, `includeDeleted`

### Changed

- Distribution controller/service now include transfer workflows in addition to dashboard, movements, and receipts.
- System fallback version updated to `Beta V1.16.5`.

## Beta V1.16.4 - 2026-03-21

### Added

- Distribution receipt APIs:
  - `GET /api/v1/distribution/receipts`
  - `POST /api/v1/distribution/receipts`
- Receipt create validation and partial-receipt support:
  - line-level ordered/received/rejected/remaining quantity rules
  - auto-derived status (`DRAFT`, `PARTIAL`, `RECEIVED`) when status is not provided
  - organization/branch/item/supplier/purchase-order scope checks
- Receipt list filtering support:
  - `status`, `supplierId`, `branchId`, `includeDeleted`

### Changed

- Distribution controller/service now include receipts in addition to dashboard and movement APIs.
- System fallback version updated to `Beta V1.16.4`.

## Beta V1.16.3 - 2026-03-21

### Added

- Distribution movement APIs:
  - `GET /api/v1/distribution/movements`
  - `POST /api/v1/distribution/movements`
- Movement creation validation for:
  - movement type enum
  - UUID integrity
  - quantity rules
  - organization/branch/item scope safety
- Movement list filtering support:
  - `movementType`, `itemId`, `status`, `from`, `to`, `includeDeleted`

### Changed

- Distribution service now contains movement create/list logic in addition to dashboard aggregates.
- Distribution controller now exposes dashboard + movement routes from a unified module.
- System fallback version updated to `Beta V1.16.3`.

## Beta V1.16.2 - 2026-03-21

### Fixed

- Updated Render core-api build script to auto-resolve the previously failed migration record before deploy:
  - `prisma migrate resolve --rolled-back 20260321_distribution_db_foundation`
- Added resolve attempt for both `DIRECT_URL` and `DATABASE_URL` migration paths in `scripts/render-build-core-api.sh`.
- Prevents `P3009` lock condition from blocking subsequent `prisma migrate deploy` runs after the prior failed attempt.

## Beta V1.16.1 - 2026-03-21

### Added

- New distribution dashboard backend module:
  - `GET /api/v1/distribution/dashboard`
- New NestJS module wiring for distribution domain:
  - `DistributionModule`
  - `DistributionController`
  - `DistributionService`
- New service test coverage for dashboard metric aggregation and scope enforcement:
  - `src/erp/distribution/distribution.service.spec.ts`

### Changed

- `AppModule` now includes `DistributionModule`.
- System fallback version updated to `Beta V1.16.1`.

### Fixed

- Removed UTF-8 BOM from `20260321_distribution_db_foundation/migration.sql` to prevent Postgres syntax error (`P3018`, code `42601`) during `prisma migrate deploy` on Render.

### Notes

- This release is the first API layer above the Distribution DB foundation (`Beta V1.16.0`).

## Beta V1.16.0 - 2026-03-21

### Added

- Distribution database foundation in Prisma with new inventory operations tables:
  - `inventory_stocks`
  - `inventory_movements`
  - `goods_receipts` + `goods_receipt_lines`
  - `stock_transfers` + `stock_transfer_lines`
  - `stock_adjustments` + `stock_adjustment_lines`
  - `stock_dispatches` + `stock_dispatch_lines`
  - `stock_returns` + `stock_return_lines`
  - `inventory_reservations`
  - `reorder_rules`
  - `stock_alerts`
- New distribution status and workflow enums for movement, receiving, transfer, dispatch, adjustment, return, reservation, and alert severity.
- Migration scaffold for DB-first rollout:
  - `apps/core-api/prisma/migrations/20260321_distribution_db_foundation/migration.sql`

### Changed

- Extended core entity relations (`Organization`, `Branch`, `Item`, `Supplier`, `PurchaseOrder`) to include distribution data graph links.
- Updated system fallback version to `Beta V1.16.0` to reflect the new DB milestone.

## Beta V1.15.0 - 2026-03-21

### Added

- New premium landing page experience in `apps/web-home/index.html` with:
  - glassmorphic transparent sticky navbar
  - immersive hero with prominent platform logo and replaceable background layer
  - smooth snap-scroll section locking
  - alternating zig-zag section layout for feature storytelling
  - responsive auth actions (Login vs Dashboard + profile dropdown)

### Changed

- Landing visual direction upgraded for cleaner hierarchy, stronger first impression, and guided section-by-section narrative flow.
- System fallback version updated to `Beta V1.15.0` for consistent runtime reporting.

## Beta V1.14.0 - 2026-03-21

### Added

- Lead conversion workflow endpoint:
  - `POST /api/v1/crm/leads/:id/convert-to-opportunity`
- Transactional conversion behavior from CRM lead to CRM opportunity (`CONVERTED` + `OPEN`).
- Business-level audit events for:
  - lead conversion (`CRM_LEAD_CONVERTED_TO_OPPORTUNITY`)
  - opportunity to ERP purchase-order handoff (`CRM_OPPORTUNITY_HANDOFF_TO_ERP_PO`)
- Additional e2e coverage for lead conversion path.

### Changed

- Beta V3 workflow docs/checklist updated for transition safety and cross-module audit progress.
- System fallback version updated to `Beta V1.14.0` for consistent runtime reporting.

## Beta V1.13.1 - 2026-03-21

### Changed

- Synced version surfaces to `Beta V1.13.0` for consistency between docs, API fallback response, and backend env templates.
- Updated `/system/info` fallback version in backend to avoid stale default reporting.

## Beta V1.13.0 - 2026-03-21

### Added

- First Beta V3 CRM-to-ERP operational handoff endpoint:
  - `POST /api/v1/crm/opportunities/:id/handoff/purchase-order`
- New e2e coverage validating CRM opportunity handoff creates ERP draft purchase orders.
- New documentation for handoff rules and payload contract.

### Changed

- Opportunity service now supports `WON`-gated handoff to ERP purchasing and creates draft PO payloads through the existing purchasing service.
- Opportunities module now imports ERP purchasing module to support the cross-module handoff path.

## Beta V1.12.2 - 2026-03-21

### Fixed

- Resolved CI e2e regression in `test_core_api` where purchase-order create flow returned `500` due to missing mocked Prisma delegates.
- Added `supplier.findFirst` and `item.findFirst` support in the core-api e2e Prisma mock so relation-scope validations execute correctly in CI.

## Beta V1.12.1 - 2026-03-21

### Added

- Automated tenant/branch safety coverage for relation-linking flows in:
  - ERP purchasing
  - CRM leads
  - CRM opportunities
- New unit coverage for cross-tenant and cross-branch relation rejection on both create and update paths.

### Changed

- Purchasing service now validates `supplier_id` and `line_items[].item_id` against the caller's organization and branch scope before write operations.
- Leads service now validates `contact_id` relation scope before create/update.
- Opportunities service now validates `lead_id` relation scope before create/update.

## Beta V1.12.0 - 2026-03-21

### Added

- Beta V3 relational backbone migration scaffolding with DB-level foreign keys for:
  - `purchase_orders.supplier_id -> suppliers.id`
  - `purchase_order_line_items.item_id -> items.id`
  - `leads.contact_id -> contacts.id`
  - `opportunities.lead_id -> leads.id`
- Organization foreign keys across core ERP/CRM business tables and optional audit-log organization linkage.
- Branch foreign keys across branch-aware ERP/CRM business tables.

### Changed

- Prisma schema now declares explicit relations for V3 backbone entities (including organization and branch links) so application models match DB constraints.
- Migration flow now includes defensive pre-constraint cleanup and integrity checks before enforcing new non-null organization foreign keys.

## Beta V1.11.11 - 2026-03-20

### Fixed

- Prevented ERP/CRM session bootstrap loops that could keep users stuck on `Restoring session...`.
- Session bootstrap now runs once per signed-in user instead of re-triggering on every token update.

## Beta V1.11.10 - 2026-03-20

### Changed

- Removed login-page shortcut links to `Home`, `ERP`, and `CRM` in both ERP and CRM apps.
- Moved the login back button to the top-left of the page for faster, clearer navigation.
- Simplified login header layout to keep focus on authentication.

## Beta V1.11.9 - 2026-03-20

### Added

- Swipe gesture support for mobile navigation drawers in ERP and CRM:
  - edge swipe right opens the sidebar
  - swipe left closes it

### Changed

- Body scrolling is now locked while the mobile sidebar drawer is open.
- Mobile shell overflow behavior is tightened to reduce horizontal drift while swiping.

## Beta V1.11.8 - 2026-03-20

### Added

- Mobile navigation drawer with collapsible sidebar behavior in ERP and CRM.
- Animated hamburger icon that transitions to an `X` when the drawer is open.
- Mobile overlay click-to-close behavior for the sidebar drawer.

### Changed

- Sidebar links now close the drawer automatically on mobile after navigation.
- Topbar now includes a dedicated nav-toggle control for small screens.

## Beta V1.11.7 - 2026-03-20

### Changed

- Added a mobile-testable baseline responsive pass for ERP/CRM app shell and shared UI:
  - app shell now stacks on smaller screens
  - sidebar and topbar adapt cleanly for phone widths
  - table wrappers now support horizontal scrolling
  - modal/auth spacing improved for small viewports
- This is intentionally a baseline usability pass for testing, not a full mobile-perfect redesign.

## Beta V1.11.6 - 2026-03-20

### Added

- Added service-level scope tests proving user-level data isolation for item, supplier, and purchase-order list queries.
- Added Beta V2 closeout evidence block in the checklist with exact command/test references.
- Added Beta V2 closeout run summary in testing docs.

### Changed

- Marked the remaining Beta V2 hard-stop checklist items as complete after passing critical automated checks and confirming hard-delete remains restricted to soft-delete/restore operational flows in this beta.

## Beta V1.11.5 - 2026-03-20

### Added

- Added backend auth unit coverage for blocked-account login messaging.
- Added frontend regression checks for shared-session token refresh sync and logout cleanup in ERP and CRM.
- Added backend e2e coverage for upgraded ERP create flows (item, supplier, purchase-order) plus non-integer PO quantity rejection.

### Changed

- Auth service now returns a dedicated blocked-account message (`Your account is blocked. Contact an admin.`) instead of folding blocked status into generic disabled messaging.
- ERP and CRM now preserve specific backend account-state messages after session expiry/refresh failure instead of always showing a generic re-login notice.
- Beta V2 checklist status updated for completed access/session and quality coverage items.

## Beta V1.11.4 - 2026-03-20

### Changed

- CRM Leads relation picker now uses popup-only selection (removed inline contact dropdown).
- CRM Opportunities relation picker now uses popup-only selection (removed inline lead dropdown).
- Added quick `Clear` actions in both popup-driven pickers to reset selected relation cleanly.

## Beta V1.11.3 - 2026-03-20

### Fixed

- Purchase-order soft-delete patch path no longer fails by re-validating full line-item payloads.
- Purchase-order client validation now blocks non-integer quantity and received-quantity values before API submission.
- API client now extracts structured backend error messages so `400` responses show readable causes instead of raw JSON blobs.

## Beta V1.11.2 - 2026-03-20

### Fixed

- Purchase-order workflow now stacks earlier on desktop (`<=1760px`) to prevent editor/summary crowding.
- Purchase-order header fields now wrap sooner to avoid squeezed inputs on medium desktop widths.

## Beta V1.11.1 - 2026-03-20

### Fixed

- Purchase-order layout no longer causes cross-panel overlap on narrower desktop viewports.
- Purchase-order line-item grids now scroll inside their section instead of stretching the full page width.
- Workflow column sizing now degrades earlier on smaller desktop widths so the summary panel does not crowd or clip editor content.

## Beta V1.11.0 - 2026-03-20

### Added

- ERP now includes an admin-facing `Access` screen for listing users, assigning/removing roles, creating accounts, and managing access state from inside the app.
- Added backend role-management support on `/api/v1/users` so role changes and account status updates return normalized role-aware user records.
- Added backend coverage for user role assignment and session revocation plus e2e coverage for refresh-session invalidation after role changes.

### Changed

- Critical account changes now revoke active refresh sessions so role, password, and account-state changes force a clean access recovery path.
- ERP and CRM now sync `/auth/me` on startup so shared sessions pick up updated role state instead of relying only on stale client storage.
- Role-denied flows now refresh user context more cleanly and push the user toward a recoverable sign-in path when access changed.
- Disabled accounts now receive a clearer admin-contact message, and zero-role accounts now receive explicit no-platform-role messaging in ERP and CRM.

## Beta V1.10.2 - 2026-03-20

### Fixed

- ERP and CRM login forms no longer preload the admin beta credentials for every visitor.
- Both login screens now start blank so testers must enter credentials intentionally instead of inheriting a default admin session hint.

## Beta V1.10.1 - 2026-03-20

### Fixed

- ERP and CRM destructive actions now require explicit confirmation before soft-delete or restore changes are applied.
- Purchase-order line removal now asks for confirmation before mutating the current draft.
- Frontend validation now catches common bad-input paths earlier across key ERP and CRM forms instead of deferring everything to API errors.

## Beta V1.10.0 - 2026-03-20

### Added

- CRM Contacts now use the same custom page pattern as Leads and Opportunities instead of falling back to the old generic resource screen.
- CRM contact and lead relation pickers now support in-modal searching for faster selection in larger tenant datasets.

### Changed

- CRM Contacts, Leads, and Opportunities now share the same page structure, lightweight create flow, inline edit flow, and table handling pattern.
- CRM empty states now explain the next useful action instead of leaving blank tables with no guidance.

## Beta V1.9.1 - 2026-03-20

### Fixed

- ERP and CRM now clear stale client sessions when refresh-token reuse or refresh-token expiry is detected.
- Reused/expired refresh tokens now force a clean sign-in recovery path instead of leaving the frontend stuck retrying invalid session state.

## Beta V1.9.0 - 2026-03-19

### Added

- Purchase orders now support a composite workflow data model with header fields, line items, computed totals, payment state, logistics, approval data, and receiving quantities.
- Added purchase-order line item modeling and backend tests for computed totals and receiving validation.

### Changed

- ERP purchase orders are now managed through a full workflow page instead of a thin header-only form.
- The purchase-order screen now separates:
  - header identity/timing
  - line-item grid editing
  - sticky summary and logistics sidebar
- Purchase-order statuses now align with the Beta V2 workflow stages:
  - `DRAFT`
  - `SUBMITTED`
  - `APPROVED`
  - `RECEIVED`
  - `CANCELLED`
- Partial delivery is now tracked at the line level through `received_quantity`.

## Beta V1.8.0 - 2026-03-19

### Added

- Beta V2 supplier profiles now support expanded identity, address, financial, contact-person, and internal fields on the backend.
- ERP Suppliers now have a structured create/edit flow with grouped sections and saved-state preview.
- Added supplier service tests covering defaults, financial/preferred flags, and invalid status rejection.

### Changed

- Supplier records are now rich business profiles that can support purchasing workflows instead of only basic contact stubs.
- Purchase-order supplier pickers now surface richer supplier metadata such as code and status.
- Supplier balance remains read-only in the profile flow so connected accounting values are not manually overwritten.

## Beta V1.7.3 - 2026-03-19

### Added

- ERP items now support click-to-preview so saved item details can be reviewed in a read-only modal before editing.

### Changed

- Item rows now feel interactive and open a structured saved-state preview instead of acting like static table output.
- The item SKU field is now hybrid by default: it auto-generates from the item name, stays editable, and shows live availability feedback.

## Beta V1.7.2 - 2026-03-19

### Fixed

- Long modals and popups now scroll correctly inside the viewport.
- The ERP item create/edit modal no longer traps lower sections and save actions off-screen.
- Shared modal styling now supports overflow safely for other long dialogs too.

## Beta V1.7.1 - 2026-03-19

### Fixed

- Expired access tokens on protected ERP/CRM routes now return proper `401 Unauthorized` responses instead of bubbling into `500` server errors.
- Roles guard now translates JWT verification failures into API-safe auth errors so the frontend refresh/login recovery flow can work correctly.
- Added guard test coverage for expired-token behavior.

## Beta V1.7.0 - 2026-03-19

### Added

- Beta V2 `Items` rebuild with a dedicated ERP item management screen.
- Progressive item modal flow with `Essentials`, `Pricing`, `Inventory`, `Classification`, and `Advanced` sections.
- Expanded item backend data shape for:
  - status
  - pricing
  - inventory
  - category
  - tags
  - brand
  - barcode
  - service behavior
  - tax and discount behavior
- Item service unit coverage for defaults, service-mode inventory behavior, and invalid status rejection.

### Changed

- ERP items now use a focused create/edit modal instead of the old generic resource form.
- Item create/edit behavior now adapts when inventory tracking is disabled or the item is marked as a service.
- Runtime app version metadata and bug-report version payloads now track `Beta V1.7.0`.

### Fixed

- Item input handling now validates and normalizes structured values instead of relying on a minimal free-form payload.

## Beta V1.6.0 - 2026-03-19

### Added

- CRM lead forms now use contact pickers instead of raw `contact_id` entry.
- CRM opportunity forms now use lead pickers instead of raw `lead_id` entry.
- ERP purchase-order forms now use supplier pickers instead of raw `supplier_id` entry.
- Dedicated browse modals were added for visible related records in ERP and CRM.
- Product-level versioning and changelog tracking were introduced for the beta program.

### Changed

- Purchase-order, lead, and opportunity tables now render readable relationship labels instead of internal UUIDs.
- Shared UI now supports cleaner relation-selection flows for Beta V1.
- Runtime app version metadata now aligns with the current beta release line.

### Fixed

- Invalid optional relation IDs and invalid status values no longer cause create-flow `500` errors.
- Bad relation/status payloads now return `400` responses with clearer validation messages.

## Beta V1.5.0 - 2026-03-19

### Added

- Unified ERP/CRM login session behavior.
- Landing page navigation/header improvements and branding alignment.
- In-app bug reporting wired to GitHub Issues.
- Better role-denied recovery with account switching.

### Changed

- Landing page, app shell, and login views were aligned to the dark gold beta palette.
- Header navigation was added across the platform.

### Fixed

- User deletion constraints were resolved with cascade behavior for token and role relations.

## Beta V1.0.0 - 2026-03-19

### Added

- Beta V1 baseline with:
  - ERP modules: items, suppliers, purchase orders
  - CRM modules: contacts, leads, opportunities
  - JWT auth, refresh flow, signup, role gating
  - user-scoped data isolation
  - soft delete and restore
  - deployable frontend and backend documentation

