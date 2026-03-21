# Distribution DB Foundation (V1)

Date: 2026-03-21

## Objective

Establish a DB-first foundation for the unified distribution direction so ERP/CRM UI refactors can safely build on top of traceable inventory workflows.

## Scope Implemented

The Prisma schema now includes first-class distribution models for:

- inventory stock snapshots by item and branch
- inventory movement ledger (traceability source of truth)
- goods receiving (headers + lines)
- stock transfers (headers + lines)
- stock adjustments (headers + lines)
- outbound dispatch (headers + lines)
- returns (headers + lines)
- reservation/allocation records
- reorder rules
- alerts/exceptions

## New Prisma Enums

- `DistributionMovementType`
- `GoodsReceiptStatus`
- `StockTransferStatus`
- `DispatchStatus`
- `StockAdjustmentStatus`
- `StockAdjustmentType`
- `StockReturnType`
- `StockReturnStatus`
- `InventoryReservationStatus`
- `AlertSeverity`

## New Prisma Models

- `InventoryStock`
- `InventoryMovement`
- `GoodsReceipt`
- `GoodsReceiptLine`
- `StockTransfer`
- `StockTransferLine`
- `StockAdjustment`
- `StockAdjustmentLine`
- `StockDispatch`
- `StockDispatchLine`
- `StockReturn`
- `StockReturnLine`
- `InventoryReservation`
- `ReorderRule`
- `StockAlert`

## Relation Wiring Added

Existing core models were extended with relation lists so the distribution graph is queryable from root entities:

- `Organization`
- `Branch`
- `Item`
- `Supplier`
- `PurchaseOrder`

## Migration

Created migration scaffold:

- `apps/core-api/prisma/migrations/20260321_distribution_db_foundation/migration.sql`

This migration creates all new enums, tables, indexes, and foreign keys required by the new distribution schema.

## Validation

- `pnpm --filter @sphincs/core-api prisma:generate` passed
- `pnpm --filter @sphincs/core-api exec prisma validate` passed
- `pnpm build` passed at workspace level

## Next Implementation Layer

After DB foundation, implement services/controllers in this order:

1. Distribution dashboard aggregates (`/distribution/dashboard`)
2. Inventory movement writer service (centralized movement posting)
3. Goods receiving + transfer workflows
4. Stock adjustments + dispatch + returns
5. Alerts and report query endpoints
