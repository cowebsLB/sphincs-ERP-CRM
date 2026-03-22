# Distribution Dashboard API (V1)

Date: 2026-03-21

## Endpoint

- `GET /api/v1/distribution/dashboard`
- `GET /api/v1/distribution/movements`
- `POST /api/v1/distribution/movements`
- `GET /api/v1/distribution/receipts`
- `POST /api/v1/distribution/receipts`
- `GET /api/v1/distribution/transfers`
- `POST /api/v1/distribution/transfers`
- `PATCH /api/v1/distribution/transfers/:transferId/request`
- `PATCH /api/v1/distribution/transfers/:transferId/approve`
- `PATCH /api/v1/distribution/transfers/:transferId/dispatch`
- `PATCH /api/v1/distribution/transfers/:transferId/receive`
- `GET /api/v1/distribution/adjustments`
- `POST /api/v1/distribution/adjustments`
- `PATCH /api/v1/distribution/adjustments/:adjustmentId/submit`
- `PATCH /api/v1/distribution/adjustments/:adjustmentId/approve`
- `PATCH /api/v1/distribution/adjustments/:adjustmentId/apply`
- `PATCH /api/v1/distribution/adjustments/:adjustmentId/reverse`
- `GET /api/v1/distribution/dispatches`
- `POST /api/v1/distribution/dispatches`
- `PATCH /api/v1/distribution/dispatches/:dispatchId/ready`
- `PATCH /api/v1/distribution/dispatches/:dispatchId/pack`
- `PATCH /api/v1/distribution/dispatches/:dispatchId/dispatch`
- `PATCH /api/v1/distribution/dispatches/:dispatchId/deliver`
- `PATCH /api/v1/distribution/dispatches/:dispatchId/fail`
- `PATCH /api/v1/distribution/dispatches/:dispatchId/return`
- `GET /api/v1/distribution/returns`
- `POST /api/v1/distribution/returns`
- `PATCH /api/v1/distribution/returns/:returnId/receive`
- `PATCH /api/v1/distribution/returns/:returnId/inspect`
- `PATCH /api/v1/distribution/returns/:returnId/complete`
- `PATCH /api/v1/distribution/returns/:returnId/cancel`
- `GET /api/v1/distribution/warehouse-locations`
- `POST /api/v1/distribution/warehouse-locations`
- `PATCH /api/v1/distribution/warehouse-locations/:locationId/activate`
- `PATCH /api/v1/distribution/warehouse-locations/:locationId/deactivate`
- `GET /api/v1/distribution/lots`
- `POST /api/v1/distribution/lots`
- `PATCH /api/v1/distribution/lots/:lotId/activate`
- `PATCH /api/v1/distribution/lots/:lotId/hold`
- `PATCH /api/v1/distribution/lots/:lotId/exhaust`
- `PATCH /api/v1/distribution/lots/:lotId/close`
- `GET /api/v1/distribution/lot-balances`
- `POST /api/v1/distribution/lot-balances`
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
- `GET /api/v1/distribution/reservations`
- `POST /api/v1/distribution/reservations`
- `GET /api/v1/distribution/reorder-rules`
- `POST /api/v1/distribution/reorder-rules`
- `GET /api/v1/distribution/restocking-suggestions`
- `GET /api/v1/distribution/alerts`
- `PATCH /api/v1/distribution/alerts/:alertId/resolve`
- `GET /api/v1/distribution/reports/stock-on-hand`
- `GET /api/v1/distribution/reports/movements`
- `GET /api/v1/distribution/reports/transfers`
- `GET /api/v1/distribution/reports/adjustments`

## Purpose

Provides the first unified distribution overview payload for operational triage ("what is on fire today?").

## Access

Role-gated via `@Roles(...)` on controller:

- `Admin`
- `ERP Manager`
- `Staff`
- `Warehouse Staff`
- `Branch Manager`
- `Read-Only Auditor`

Branch-scoped users automatically receive branch-scoped aggregates.

As of `Beta V1.16.16`, roles are enforced at method level:

- Read endpoints: allow read-only auditors.
- Write endpoints (`POST`/most `PATCH`): exclude read-only auditors.
- Approval-sensitive endpoints (for example transfer/adjustment approvals): restricted to elevated operational roles.

As of `Beta V1.16.17`, transition operations also write audit events (`audit_logs`) for improved traceability.

As of `Beta V1.16.18`, alert resolution is treated as an approval-sensitive action role.
As of `Beta V1.16.23`, the distribution data model includes warehouse location and lot/pick-pack foundations for phase-2 logistics workflows.

## Response Shape

Returns:

- `metrics[]`
  - `total_stock_on_hand`
  - `low_stock_items`
  - `out_of_stock_items`
  - `incoming_stock`
  - `pending_receipts`
  - `pending_transfers`
  - `pending_dispatches`
  - `damaged_returned_stock`
- `branch_stock_summary[]`
- `recent_inventory_activity[]`
- `alerts_and_exceptions[]`
- `generated_at`

## Data Sources

Aggregates are computed from distribution foundation tables:

- `inventory_stocks`
- `goods_receipts`
- `stock_transfers`
- `stock_dispatches`
- `stock_returns` / `stock_return_lines`
- `inventory_movements`
- `stock_alerts`
- `branches`

Phase-2 logistics foundations now available in schema:

- `warehouse_locations`
- `inventory_lots`
- `inventory_lot_balances`
- `dispatch_pick_jobs`
- `dispatch_pick_lines`
- `dispatch_pack_jobs`
- `dispatch_pack_lines`

## Current Behavior Notes

- Low-stock logic currently requires:
  - `track_inventory = true`
  - `quantity_on_hand > 0`
  - `quantity_on_hand <= reorder_level`
  - `reorder_level > 0`
- Out-of-stock is tracked separately where `quantity_on_hand <= 0`.

## Warehouse Location API Notes (V1.16.24)

### `GET /api/v1/distribution/warehouse-locations`

Supported query parameters:

- `branchId`
- `parentLocationId`
- `isActive`
- `includeDeleted`

Behavior:

- branch-scoped users are automatically restricted to their own branch.
- `parentLocationId` is validated within organization scope.

### `POST /api/v1/distribution/warehouse-locations`

Required:

- `branch_id` (or branch-scoped user default)
- `code`
- `name`

Optional:

- `parent_location_id`
- `location_type` (defaults to `GENERAL`)
- `is_active` (defaults to `true`)

Validation includes:

- parent location must belong to the same branch
- branch-level unique `code` enforcement

Lifecycle:

- `PATCH /warehouse-locations/:locationId/activate`
- `PATCH /warehouse-locations/:locationId/deactivate`

## Lot API Notes (V1.16.25)

### `GET /api/v1/distribution/lots`

Supported query parameters:

- `branchId`
- `itemId`
- `supplierId`
- `status`
- `includeDeleted`

### `POST /api/v1/distribution/lots`

Required:

- `branch_id` (or branch-scoped user default)
- `item_id`

Optional:

- `supplier_id`
- `goods_receipt_id` (same-branch validation)
- `batch_number`
- `serial_number`
- `manufacture_date`
- `expiry_date`
- `quantity_received`
- `quantity_available`
- `status`
- `notes`

Validation includes:

- `quantity_available <= quantity_received`
- organization and branch scope checks for related entities

Lifecycle:

- `PATCH /lots/:lotId/activate`
- `PATCH /lots/:lotId/hold`
- `PATCH /lots/:lotId/exhaust`
- `PATCH /lots/:lotId/close`

## Lot Balance API Notes (V1.16.25)

### `GET /api/v1/distribution/lot-balances`

Supported query parameters:

- `branchId`
- `itemId`
- `lotId`
- `locationId`
- `includeDeleted`

### `POST /api/v1/distribution/lot-balances`

Required:

- `branch_id` (or branch-scoped user default)
- `item_id`
- `lot_id`

Optional:

- `location_id`
- `quantity_on_hand`
- `reserved_quantity`
- `available_quantity`
- `damaged_quantity`
- `in_transit_quantity`
- `last_movement_at`

Validation includes:

- lot and location must belong to the same branch as the balance record
- `item_id` must match the referenced lot item

## Pick/Pack API Notes (V1.16.25)

- Pick jobs:
  - `GET/POST /api/v1/distribution/dispatches/:dispatchId/pick-jobs`
  - `PATCH /api/v1/distribution/pick-jobs/:pickJobId/start|complete|cancel`
- Pack jobs:
  - `GET/POST /api/v1/distribution/dispatches/:dispatchId/pack-jobs`
  - `PATCH /api/v1/distribution/pack-jobs/:packJobId/start|complete|cancel`

Behavior:

- Dispatch scope is validated before list/create operations.
- Job line items must map to dispatch lines within the same dispatch.
- Job transitions enforce `DRAFT -> IN_PROGRESS -> COMPLETED` with cancellation support.

## Location Linkage Notes (V1.16.26)

Operational endpoints now accept location fields tied to warehouse locations:

- Movement create:
  - `source_location_id`
  - `destination_location_id`
- Receipt create:
  - `receiving_location_id`
- Transfer create:
  - `source_location_id`
  - `destination_location_id`
- Dispatch create:
  - `dispatch_location_id`
- Return create:
  - `source_location_id`
  - `destination_location_id`

Validation rules:

- source/destination/receiving/dispatch location must belong to the same branch context as its related branch field.
- organization and branch scope checks are enforced before write operations.

## Next API Steps

1. Add warehouse-location CRUD and branch-level stock visibility APIs.
2. Add lot-level stock tracing endpoints and reporting.
3. Add pick/pack job APIs to support outbound operational execution.
4. Add advanced KPI/analytics rollups (supplier fulfillment, fast/slow movers, branch SLA metrics).

## Movement API Notes (V1.16.3)

### `POST /api/v1/distribution/movements`

Required fields:

- `movement_type`
- `item_id`
- `quantity`

Optional fields:

- `unit`
- `branch_id`
- `source_branch_id`
- `destination_branch_id`
- `reference_type`
- `reference_id`
- `status`
- `notes`
- `cost_impact`
- `occurred_at`

Validation includes UUID integrity, positive quantity, movement-type enum checks, and organization/branch scope validation.

### `GET /api/v1/distribution/movements`

Supported query parameters:

- `movementType`
- `itemId`
- `status`
- `from`
- `to`
- `includeDeleted`

## Receipt API Notes (V1.16.4)

### `POST /api/v1/distribution/receipts`

Required:

- `branch_id` (or branch-scoped user default)
- `line_items[]` with at least one line

Each line supports:

- `item_id`
- `ordered_qty`
- `received_qty`
- `rejected_qty`
- `remaining_qty` (optional, derived when omitted)
- `notes`

Optional header fields:

- `receipt_number`
- `status` (auto-derived if omitted)
- `supplier_id`
- `purchase_order_id`
- `received_date`
- `notes`
- `attachments`

Validation prevents invalid quantity math (for example `received_qty + rejected_qty > ordered_qty`).

### `GET /api/v1/distribution/receipts`

Supported query parameters:

- `status`
- `supplierId`
- `branchId`
- `includeDeleted`

## Transfer API Notes (V1.16.5)

### `POST /api/v1/distribution/transfers`

Required:

- `source_branch_id` (defaults to user branch for branch-scoped users)
- `destination_branch_id`
- `line_items[]`

Each transfer line supports:

- `item_id`
- `quantity_requested`
- `quantity_sent`
- `quantity_received`

Validation includes:

- source/destination branch cannot be identical
- `quantity_requested >= 1`
- `quantity_sent <= quantity_requested`
- `quantity_received <= quantity_sent`
- organization and branch scope checks for all linked entities

### `GET /api/v1/distribution/transfers`

Supported query parameters:

- `status`
- `sourceBranchId`
- `destinationBranchId`
- `includeDeleted`

## Transfer Lifecycle Actions (V1.16.9)

### Endpoints

- `PATCH /api/v1/distribution/transfers/:transferId/request`
- `PATCH /api/v1/distribution/transfers/:transferId/approve`
- `PATCH /api/v1/distribution/transfers/:transferId/dispatch`
- `PATCH /api/v1/distribution/transfers/:transferId/receive`

### Behavior

- Actions enforce strict status transitions:
  - `DRAFT -> REQUESTED`
  - `REQUESTED -> APPROVED`
  - `APPROVED -> DISPATCHED`
  - `DISPATCHED -> PARTIAL|COMPLETED`
  - `PARTIAL -> COMPLETED`
- Invalid transition attempts return `400 Bad Request`.
- Branch scope is enforced using transfer source/destination branch IDs.
- Each transition appends to `status_history` with actor/time metadata.

### Notes

- `receive` accepts optional `status` in `{ PARTIAL, COMPLETED }`; defaults to `COMPLETED` when omitted.

## Adjustment API Notes (V1.16.6)

### `POST /api/v1/distribution/adjustments`

Required:

- `branch_id` (or branch-scoped user default)
- `adjustment_type` (`INCREASE` or `DECREASE`)
- `reason`
- `line_items[]`

Each adjustment line supports:

- `item_id`
- `previous_qty`
- `adjusted_qty`
- `variance`

Validation includes:

- `variance` must match `adjusted_qty - previous_qty`
- `INCREASE` lines cannot produce negative variance
- `DECREASE` lines cannot produce positive variance
- linked branch/item scope validation

### `GET /api/v1/distribution/adjustments`

Supported query parameters:

- `status`
- `adjustmentType`
- `branchId`
- `includeDeleted`

## Adjustment Lifecycle Actions (V1.16.15)

### Endpoints

- `PATCH /api/v1/distribution/adjustments/:adjustmentId/submit`
- `PATCH /api/v1/distribution/adjustments/:adjustmentId/approve`
- `PATCH /api/v1/distribution/adjustments/:adjustmentId/apply`
- `PATCH /api/v1/distribution/adjustments/:adjustmentId/reverse`

### Behavior

- Actions enforce strict status transitions:
  - `DRAFT -> SUBMITTED|REVERSED`
  - `SUBMITTED -> APPROVED|REVERSED`
  - `APPROVED -> APPLIED|REVERSED`
  - `APPLIED -> REVERSED`
- Invalid transition attempts return `400 Bad Request`.
- Branch scope is enforced against the adjustment branch.
- Lifecycle updates stamp `approved_by` and `applied_at` where relevant.

## Dispatch API Notes (V1.16.7)

### `POST /api/v1/distribution/dispatches`

Required:

- `branch_id` (or branch-scoped user default)
- `destination`
- `line_items[]`

Each dispatch line supports:

- `item_id`
- `quantity`

Validation includes positive line quantity checks, status enum checks, and branch/item scope validation.

### `GET /api/v1/distribution/dispatches`

Supported query parameters:

- `status`
- `branchId`
- `includeDeleted`

## Dispatch Lifecycle Actions (V1.16.10)

### Endpoints

- `PATCH /api/v1/distribution/dispatches/:dispatchId/ready`
- `PATCH /api/v1/distribution/dispatches/:dispatchId/pack`
- `PATCH /api/v1/distribution/dispatches/:dispatchId/dispatch`
- `PATCH /api/v1/distribution/dispatches/:dispatchId/deliver`
- `PATCH /api/v1/distribution/dispatches/:dispatchId/fail`
- `PATCH /api/v1/distribution/dispatches/:dispatchId/return`

### Behavior

- Actions enforce strict status transitions:
  - `DRAFT -> READY`
  - `READY -> PACKED|FAILED`
  - `PACKED -> DISPATCHED|FAILED`
  - `DISPATCHED -> DELIVERED|FAILED|RETURNED`
  - `DELIVERED -> RETURNED`
- Invalid transition attempts return `400 Bad Request`.
- Branch scope is enforced using the dispatch branch ID.
- Transition updates stamp relevant actor/time fields where applicable.

## Return API Notes (V1.16.8)

### `POST /api/v1/distribution/returns`

Required:

- `return_type`
- `line_items[]`

Optional:

- `status`
- `source_branch_id`
- `destination_branch_id`
- `linked_source_type`
- `linked_source_id`
- `reason`
- `condition_notes`
- `restock`
- `damaged`
- `processed_date`
- `notes`

Each return line supports:

- `item_id`
- `quantity`
- `condition`
- `restock`
- `damaged`

### `GET /api/v1/distribution/returns`

Supported query parameters:

- `status`
- `returnType`
- `sourceBranchId`
- `destinationBranchId`
- `includeDeleted`

## Return Lifecycle Actions (V1.16.11)

### Endpoints

- `PATCH /api/v1/distribution/returns/:returnId/receive`
- `PATCH /api/v1/distribution/returns/:returnId/inspect`
- `PATCH /api/v1/distribution/returns/:returnId/complete`
- `PATCH /api/v1/distribution/returns/:returnId/cancel`

### Behavior

- Actions enforce strict status transitions:
  - `DRAFT -> RECEIVED|CANCELLED`
  - `RECEIVED -> INSPECTED|CANCELLED`
  - `INSPECTED -> COMPLETED|CANCELLED`
- Invalid transition attempts return `400 Bad Request`.
- Branch scope is enforced using source/destination branch scope checks.
- Processing fields are updated on lifecycle actions where applicable (`processed_by`, `processed_date`).

## Reservation API Notes (V1.16.12)

### `POST /api/v1/distribution/reservations`

Required:

- `item_id`
- `reserved_quantity` (must be at least `1`)

Optional:

- `branch_id` (defaults to branch-scoped user branch when available)
- `status` (`ACTIVE`, `RELEASED`, `EXPIRED`, `FULFILLED`, `CANCELLED`)
- `reference_type`
- `reference_id`
- `reserved_date`
- `expires_at`
- `notes`

Validation includes status enum checks, positive quantity checks, and organization/branch/item scope enforcement.

### `GET /api/v1/distribution/reservations`

Supported query parameters:

- `status`
- `branchId`
- `itemId`
- `includeDeleted`

## Reorder Rule API Notes (V1.16.13)

### `POST /api/v1/distribution/reorder-rules`

Required:

- `item_id`
- `reorder_quantity` (must be at least `1`)

Optional:

- `branch_id` (defaults to branch-scoped user branch when available)
- `preferred_supplier_id`
- `minimum_stock`
- `reorder_level`
- `lead_time_days`
- `is_active`

Validation includes non-negative numeric checks, positive reorder quantity enforcement, and organization/branch/item/supplier scope checks.

### `GET /api/v1/distribution/reorder-rules`

Supported query parameters:

- `branchId`
- `itemId`
- `isActive`
- `includeDeleted`

## Restocking Suggestions API Notes (V1.16.14)

### `GET /api/v1/distribution/restocking-suggestions`

Supported query parameters:

- `branchId`
- `includeInactive`
- `includeZero`
- `includeDeleted`

Behavior:

- Suggestions are derived by joining reorder rules with current `inventory_stocks` snapshots.
- For each rule, the API computes:
  - `current_stock`
  - `shortage_to_reorder_level`
  - `suggested_order_quantity`
  - `needs_restock`
- By default, rules that do not currently need restocking are excluded unless `includeZero=true`.

## Alerts API Notes (V1.16.18)

### `GET /api/v1/distribution/alerts`

Supported query parameters:

- `status`
- `severity`
- `branchId`
- `includeDeleted`

### `PATCH /api/v1/distribution/alerts/:alertId/resolve`

Optional body fields:

- `resolution_note`

Behavior:

- Resolves an open alert within scope by setting status to `RESOLVED`.
- Stamps resolution metadata and writes a corresponding audit event.

## Reports API Notes (V1.16.19)

### `GET /api/v1/distribution/reports/stock-on-hand`

Supported query parameters:

- `branchId`
- `itemId`
- `lowOnly`
- `outOnly`
- `includeDeleted`

Behavior:

- Returns report rows with item/branch stock visibility fields.
- Includes computed flags per row (`low_stock`, `out_of_stock`).
- Includes a `summary` block with total rows/quantities and low/out-of-stock counts.

### `GET /api/v1/distribution/reports/movements` (V1.16.20)

Supported query parameters:

- `movementType`
- `branchId`
- `itemId`
- `from`
- `to`
- `includeDeleted`

Behavior:

- Returns movement history rows sorted by newest occurrence first.
- Includes a `summary` block with:
  - total movement count
  - total moved quantity
  - grouped movement counts by movement type

### `GET /api/v1/distribution/reports/transfers` (V1.16.21)

Supported query parameters:

- `status`
- `sourceBranchId`
- `destinationBranchId`
- `from`
- `to`
- `includeDeleted`

Behavior:

- Returns transfer rows with source/destination branch context.
- Includes fulfillment metrics per transfer:
  - `quantity_requested_total`
  - `quantity_sent_total`
  - `quantity_received_total`
  - `fill_rate_pct`
- Includes a summary block with total quantities and grouped counts by status.

### `GET /api/v1/distribution/reports/adjustments` (V1.16.22)

Supported query parameters:

- `status`
- `adjustmentType`
- `branchId`
- `from`
- `to`
- `includeDeleted`

Behavior:

- Returns adjustment rows with branch context and per-adjustment variance breakdown.
- Includes a summary block with:
  - net variance total
  - increase total
  - decrease total
  - grouped adjustment counts by status
