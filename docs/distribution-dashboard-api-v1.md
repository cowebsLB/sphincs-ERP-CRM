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
- `GET /api/v1/distribution/reservations`
- `POST /api/v1/distribution/reservations`
- `GET /api/v1/distribution/reorder-rules`
- `POST /api/v1/distribution/reorder-rules`

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

## Current Behavior Notes

- Low-stock logic currently requires:
  - `track_inventory = true`
  - `quantity_on_hand > 0`
  - `quantity_on_hand <= reorder_level`
  - `reorder_level > 0`
- Out-of-stock is tracked separately where `quantity_on_hand <= 0`.

## Next API Steps

1. Add restocking recommendation APIs derived from reorder rules and live stock.

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
