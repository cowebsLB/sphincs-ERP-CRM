# Distribution Dashboard API (V1)

Date: 2026-03-21

## Endpoint

- `GET /api/v1/distribution/dashboard`
- `GET /api/v1/distribution/movements`
- `POST /api/v1/distribution/movements`

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

1. Add `/distribution/receipts` workflow APIs.
2. Add `/distribution/transfers` workflow APIs.
3. Add `/distribution/adjustments`, `/dispatches`, `/returns` APIs.

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
