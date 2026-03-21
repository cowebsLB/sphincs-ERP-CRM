-- Distribution DB foundation (DB-first pivot)

CREATE TYPE "DistributionMovementType" AS ENUM (
  'PURCHASE_RECEIPT',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'ADJUSTMENT_INCREASE',
  'ADJUSTMENT_DECREASE',
  'DISPATCH_ISSUE',
  'RETURN_IN',
  'RETURN_OUT',
  'DAMAGED_WRITE_OFF',
  'STOCK_CORRECTION'
);

CREATE TYPE "GoodsReceiptStatus" AS ENUM ('DRAFT', 'PARTIAL', 'RECEIVED', 'CLOSED', 'CANCELLED');
CREATE TYPE "StockTransferStatus" AS ENUM ('DRAFT', 'REQUESTED', 'APPROVED', 'DISPATCHED', 'PARTIAL', 'COMPLETED', 'CANCELLED');
CREATE TYPE "DispatchStatus" AS ENUM ('DRAFT', 'READY', 'PACKED', 'DISPATCHED', 'DELIVERED', 'FAILED', 'RETURNED', 'CANCELLED');
CREATE TYPE "StockAdjustmentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'APPLIED', 'REVERSED');
CREATE TYPE "StockAdjustmentType" AS ENUM ('INCREASE', 'DECREASE');
CREATE TYPE "StockReturnType" AS ENUM ('SUPPLIER_RETURN', 'CUSTOMER_RETURN', 'INTERNAL_RETURN', 'TRANSFER_RETURN');
CREATE TYPE "StockReturnStatus" AS ENUM ('DRAFT', 'RECEIVED', 'INSPECTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "InventoryReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'EXPIRED', 'FULFILLED', 'CANCELLED');
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE "inventory_stocks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "item_id" UUID NOT NULL,
  "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
  "reserved_quantity" INTEGER NOT NULL DEFAULT 0,
  "available_quantity" INTEGER NOT NULL DEFAULT 0,
  "in_transit_quantity" INTEGER NOT NULL DEFAULT 0,
  "incoming_quantity" INTEGER NOT NULL DEFAULT 0,
  "damaged_quantity" INTEGER NOT NULL DEFAULT 0,
  "stock_valuation" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "last_movement_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "inventory_stocks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_movements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "branch_id" UUID,
  "item_id" UUID NOT NULL,
  "movement_type" "DistributionMovementType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unit" TEXT NOT NULL DEFAULT 'piece',
  "source_branch_id" UUID,
  "destination_branch_id" UUID,
  "reference_type" TEXT,
  "reference_id" UUID,
  "status" TEXT NOT NULL DEFAULT 'POSTED',
  "notes" TEXT,
  "cost_impact" DECIMAL(12,2),
  "performed_by" UUID,
  "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "goods_receipts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "supplier_id" UUID,
  "purchase_order_id" UUID,
  "receipt_number" TEXT NOT NULL,
  "status" "GoodsReceiptStatus" NOT NULL DEFAULT 'DRAFT',
  "received_date" TIMESTAMPTZ(6),
  "received_by" UUID,
  "notes" TEXT,
  "attachments" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "goods_receipt_lines" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "goods_receipt_id" UUID NOT NULL,
  "item_id" UUID NOT NULL,
  "ordered_qty" INTEGER NOT NULL DEFAULT 0,
  "received_qty" INTEGER NOT NULL DEFAULT 0,
  "remaining_qty" INTEGER NOT NULL DEFAULT 0,
  "rejected_qty" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "goods_receipt_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_transfers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "transfer_number" TEXT NOT NULL,
  "source_branch_id" UUID NOT NULL,
  "destination_branch_id" UUID NOT NULL,
  "status" "StockTransferStatus" NOT NULL DEFAULT 'DRAFT',
  "requested_by" UUID,
  "approved_by" UUID,
  "created_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dispatched_date" TIMESTAMPTZ(6),
  "received_date" TIMESTAMPTZ(6),
  "status_history" JSONB,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_transfer_lines" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "stock_transfer_id" UUID NOT NULL,
  "item_id" UUID NOT NULL,
  "quantity_requested" INTEGER NOT NULL DEFAULT 0,
  "quantity_sent" INTEGER NOT NULL DEFAULT 0,
  "quantity_received" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_transfer_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_adjustments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "adjustment_number" TEXT NOT NULL,
  "status" "StockAdjustmentStatus" NOT NULL DEFAULT 'DRAFT',
  "adjustment_type" "StockAdjustmentType" NOT NULL,
  "reason" TEXT NOT NULL,
  "approved_by" UUID,
  "created_by_user" UUID,
  "applied_at" TIMESTAMPTZ(6),
  "notes" TEXT,
  "supporting_file" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_adjustment_lines" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "stock_adjustment_id" UUID NOT NULL,
  "item_id" UUID NOT NULL,
  "previous_qty" INTEGER NOT NULL DEFAULT 0,
  "adjusted_qty" INTEGER NOT NULL DEFAULT 0,
  "variance" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_adjustment_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_dispatches" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "dispatch_number" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "status" "DispatchStatus" NOT NULL DEFAULT 'DRAFT',
  "dispatch_date" TIMESTAMPTZ(6),
  "packed_by" UUID,
  "dispatched_by" UUID,
  "carrier_info" TEXT,
  "tracking_info" TEXT,
  "proof_of_dispatch" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "stock_dispatches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_dispatch_lines" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "stock_dispatch_id" UUID NOT NULL,
  "item_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_dispatch_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_returns" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "return_number" TEXT NOT NULL,
  "return_type" "StockReturnType" NOT NULL,
  "status" "StockReturnStatus" NOT NULL DEFAULT 'DRAFT',
  "linked_source_type" TEXT,
  "linked_source_id" UUID,
  "source_branch_id" UUID,
  "destination_branch_id" UUID,
  "reason" TEXT,
  "condition_notes" TEXT,
  "restock" BOOLEAN NOT NULL DEFAULT true,
  "damaged" BOOLEAN NOT NULL DEFAULT false,
  "processed_by" UUID,
  "processed_date" TIMESTAMPTZ(6),
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "stock_returns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_return_lines" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "stock_return_id" UUID NOT NULL,
  "item_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "condition" TEXT,
  "restock" BOOLEAN NOT NULL DEFAULT true,
  "damaged" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_return_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_reservations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "item_id" UUID NOT NULL,
  "reserved_quantity" INTEGER NOT NULL DEFAULT 0,
  "reference_type" TEXT,
  "reference_id" UUID,
  "reserved_by" UUID,
  "reserved_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ(6),
  "status" "InventoryReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reorder_rules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "branch_id" UUID NOT NULL,
  "item_id" UUID NOT NULL,
  "preferred_supplier_id" UUID,
  "minimum_stock" INTEGER NOT NULL DEFAULT 0,
  "reorder_level" INTEGER NOT NULL DEFAULT 0,
  "reorder_quantity" INTEGER NOT NULL DEFAULT 0,
  "lead_time_days" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "reorder_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_alerts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "branch_id" UUID,
  "item_id" UUID,
  "alert_type" TEXT NOT NULL,
  "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "metadata" JSONB,
  "detected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "stock_alerts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_inventory_stocks_org_branch_item" ON "inventory_stocks"("organization_id", "branch_id", "item_id");
CREATE UNIQUE INDEX "uq_goods_receipts_org_number" ON "goods_receipts"("organization_id", "receipt_number");
CREATE UNIQUE INDEX "uq_stock_transfers_org_number" ON "stock_transfers"("organization_id", "transfer_number");
CREATE UNIQUE INDEX "uq_stock_adjustments_org_number" ON "stock_adjustments"("organization_id", "adjustment_number");
CREATE UNIQUE INDEX "uq_stock_dispatches_org_number" ON "stock_dispatches"("organization_id", "dispatch_number");
CREATE UNIQUE INDEX "uq_stock_returns_org_number" ON "stock_returns"("organization_id", "return_number");
CREATE UNIQUE INDEX "uq_reorder_rules_org_branch_item" ON "reorder_rules"("organization_id", "branch_id", "item_id");

CREATE INDEX "idx_inventory_stocks_org" ON "inventory_stocks"("organization_id");
CREATE INDEX "idx_inventory_stocks_branch" ON "inventory_stocks"("branch_id");
CREATE INDEX "idx_inventory_stocks_item" ON "inventory_stocks"("item_id");
CREATE INDEX "idx_inventory_stocks_deleted_at" ON "inventory_stocks"("deleted_at");

CREATE INDEX "idx_inventory_movements_org" ON "inventory_movements"("organization_id");
CREATE INDEX "idx_inventory_movements_branch" ON "inventory_movements"("branch_id");
CREATE INDEX "idx_inventory_movements_item" ON "inventory_movements"("item_id");
CREATE INDEX "idx_inventory_movements_type" ON "inventory_movements"("movement_type");
CREATE INDEX "idx_inventory_movements_occurred_at" ON "inventory_movements"("occurred_at");
CREATE INDEX "idx_inventory_movements_deleted_at" ON "inventory_movements"("deleted_at");

CREATE INDEX "idx_goods_receipts_org" ON "goods_receipts"("organization_id");
CREATE INDEX "idx_goods_receipts_branch" ON "goods_receipts"("branch_id");
CREATE INDEX "idx_goods_receipts_supplier" ON "goods_receipts"("supplier_id");
CREATE INDEX "idx_goods_receipts_po" ON "goods_receipts"("purchase_order_id");
CREATE INDEX "idx_goods_receipts_status" ON "goods_receipts"("status");
CREATE INDEX "idx_goods_receipts_deleted_at" ON "goods_receipts"("deleted_at");
CREATE INDEX "idx_goods_receipt_lines_receipt" ON "goods_receipt_lines"("goods_receipt_id");
CREATE INDEX "idx_goods_receipt_lines_item" ON "goods_receipt_lines"("item_id");

CREATE INDEX "idx_stock_transfers_org" ON "stock_transfers"("organization_id");
CREATE INDEX "idx_stock_transfers_source_branch" ON "stock_transfers"("source_branch_id");
CREATE INDEX "idx_stock_transfers_destination_branch" ON "stock_transfers"("destination_branch_id");
CREATE INDEX "idx_stock_transfers_status" ON "stock_transfers"("status");
CREATE INDEX "idx_stock_transfers_deleted_at" ON "stock_transfers"("deleted_at");
CREATE INDEX "idx_stock_transfer_lines_transfer" ON "stock_transfer_lines"("stock_transfer_id");
CREATE INDEX "idx_stock_transfer_lines_item" ON "stock_transfer_lines"("item_id");

CREATE INDEX "idx_stock_adjustments_org" ON "stock_adjustments"("organization_id");
CREATE INDEX "idx_stock_adjustments_branch" ON "stock_adjustments"("branch_id");
CREATE INDEX "idx_stock_adjustments_status" ON "stock_adjustments"("status");
CREATE INDEX "idx_stock_adjustments_deleted_at" ON "stock_adjustments"("deleted_at");
CREATE INDEX "idx_stock_adjustment_lines_adjustment" ON "stock_adjustment_lines"("stock_adjustment_id");
CREATE INDEX "idx_stock_adjustment_lines_item" ON "stock_adjustment_lines"("item_id");

CREATE INDEX "idx_stock_dispatches_org" ON "stock_dispatches"("organization_id");
CREATE INDEX "idx_stock_dispatches_branch" ON "stock_dispatches"("branch_id");
CREATE INDEX "idx_stock_dispatches_status" ON "stock_dispatches"("status");
CREATE INDEX "idx_stock_dispatches_deleted_at" ON "stock_dispatches"("deleted_at");
CREATE INDEX "idx_stock_dispatch_lines_dispatch" ON "stock_dispatch_lines"("stock_dispatch_id");
CREATE INDEX "idx_stock_dispatch_lines_item" ON "stock_dispatch_lines"("item_id");

CREATE INDEX "idx_stock_returns_org" ON "stock_returns"("organization_id");
CREATE INDEX "idx_stock_returns_source_branch" ON "stock_returns"("source_branch_id");
CREATE INDEX "idx_stock_returns_destination_branch" ON "stock_returns"("destination_branch_id");
CREATE INDEX "idx_stock_returns_status" ON "stock_returns"("status");
CREATE INDEX "idx_stock_returns_deleted_at" ON "stock_returns"("deleted_at");
CREATE INDEX "idx_stock_return_lines_return" ON "stock_return_lines"("stock_return_id");
CREATE INDEX "idx_stock_return_lines_item" ON "stock_return_lines"("item_id");

CREATE INDEX "idx_inventory_reservations_org" ON "inventory_reservations"("organization_id");
CREATE INDEX "idx_inventory_reservations_branch" ON "inventory_reservations"("branch_id");
CREATE INDEX "idx_inventory_reservations_item" ON "inventory_reservations"("item_id");
CREATE INDEX "idx_inventory_reservations_status" ON "inventory_reservations"("status");
CREATE INDEX "idx_inventory_reservations_deleted_at" ON "inventory_reservations"("deleted_at");

CREATE INDEX "idx_reorder_rules_org" ON "reorder_rules"("organization_id");
CREATE INDEX "idx_reorder_rules_branch" ON "reorder_rules"("branch_id");
CREATE INDEX "idx_reorder_rules_item" ON "reorder_rules"("item_id");
CREATE INDEX "idx_reorder_rules_supplier" ON "reorder_rules"("preferred_supplier_id");
CREATE INDEX "idx_reorder_rules_deleted_at" ON "reorder_rules"("deleted_at");

CREATE INDEX "idx_stock_alerts_org" ON "stock_alerts"("organization_id");
CREATE INDEX "idx_stock_alerts_branch" ON "stock_alerts"("branch_id");
CREATE INDEX "idx_stock_alerts_item" ON "stock_alerts"("item_id");
CREATE INDEX "idx_stock_alerts_severity" ON "stock_alerts"("severity");
CREATE INDEX "idx_stock_alerts_status" ON "stock_alerts"("status");
CREATE INDEX "idx_stock_alerts_deleted_at" ON "stock_alerts"("deleted_at");

ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_source_branch_id_fkey" FOREIGN KEY ("source_branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_destination_branch_id_fkey" FOREIGN KEY ("destination_branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_goods_receipt_id_fkey" FOREIGN KEY ("goods_receipt_id") REFERENCES "goods_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_source_branch_id_fkey" FOREIGN KEY ("source_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_destination_branch_id_fkey" FOREIGN KEY ("destination_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_transfer_lines" ADD CONSTRAINT "stock_transfer_lines_stock_transfer_id_fkey" FOREIGN KEY ("stock_transfer_id") REFERENCES "stock_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_transfer_lines" ADD CONSTRAINT "stock_transfer_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_stock_adjustment_id_fkey" FOREIGN KEY ("stock_adjustment_id") REFERENCES "stock_adjustments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_dispatches" ADD CONSTRAINT "stock_dispatches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_dispatches" ADD CONSTRAINT "stock_dispatches_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_dispatch_lines" ADD CONSTRAINT "stock_dispatch_lines_stock_dispatch_id_fkey" FOREIGN KEY ("stock_dispatch_id") REFERENCES "stock_dispatches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_dispatch_lines" ADD CONSTRAINT "stock_dispatch_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_returns" ADD CONSTRAINT "stock_returns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_returns" ADD CONSTRAINT "stock_returns_source_branch_id_fkey" FOREIGN KEY ("source_branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_returns" ADD CONSTRAINT "stock_returns_destination_branch_id_fkey" FOREIGN KEY ("destination_branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_return_lines" ADD CONSTRAINT "stock_return_lines_stock_return_id_fkey" FOREIGN KEY ("stock_return_id") REFERENCES "stock_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_return_lines" ADD CONSTRAINT "stock_return_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reorder_rules" ADD CONSTRAINT "reorder_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reorder_rules" ADD CONSTRAINT "reorder_rules_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reorder_rules" ADD CONSTRAINT "reorder_rules_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reorder_rules" ADD CONSTRAINT "reorder_rules_preferred_supplier_id_fkey" FOREIGN KEY ("preferred_supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
