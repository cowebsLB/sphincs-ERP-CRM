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

1. Add `/distribution/adjustments`, `/dispatches`, `/returns` APIs.

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
