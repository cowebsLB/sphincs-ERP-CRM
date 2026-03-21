# CRM To ERP Handoff (Beta V3)

Date: 2026-03-21

## First Supported Handoff

Opportunity -> Purchase Order (ERP)

Endpoint:

`POST /api/v1/crm/opportunities/:id/handoff/purchase-order`

## Handoff Rules

- The opportunity must exist in the caller's organization scope.
- The opportunity must belong to the caller's accessible records (same user-level scope currently used by CRM flows).
- The opportunity must be in `WON` status before handoff is allowed.
- Relation scope checks in purchasing flow still apply:
  - `supplier_id` must belong to the same organization
  - if caller is branch-scoped, relation records must match caller branch when relation record is branch-bound

## Payload Contract

Supported optional fields:

- `supplier_id`
- `line_items`
- `payment_terms`
- `expected_delivery_date`
- `shipping_address`
- `shipping_method`
- `tracking_number`
- `notes`

If `line_items` is omitted, the system creates a default manual placeholder line:

- `description`: `CRM opportunity <id> handoff`
- `quantity`: `1`
- `unit_cost`: `0`
- `tax_rate`: `0`
- `discount`: `0`

## Output

- Creates an ERP purchase order in `DRAFT` with `UNPAID` payment status.
- Handoff context is injected into purchase-order notes (`CRM handoff from opportunity ...`).

## Why This First

This gives CRM users a concrete downstream operational action at the "won" stage without requiring a full sales-order module first.
