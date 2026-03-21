# Distribution Dashboard API (V1)

Date: 2026-03-21

## Endpoint

- `GET /api/v1/distribution/dashboard`

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

1. Add `/distribution/movements` create/list endpoints (ledger writer + query).
2. Add `/distribution/receipts` workflow APIs.
3. Add `/distribution/transfers` workflow APIs.
4. Add `/distribution/adjustments`, `/dispatches`, `/returns` APIs.
