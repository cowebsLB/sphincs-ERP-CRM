-- Performance indexes for distribution operational/reporting query patterns.

CREATE INDEX IF NOT EXISTS idx_inventory_movements_org_deleted_occurred_desc
  ON inventory_movements (organization_id, deleted_at, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_org_reference_active
  ON inventory_movements (organization_id, reference_type, reference_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_stocks_org_branch_item_deleted
  ON inventory_stocks (organization_id, branch_id, item_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_goods_receipts_org_status_deleted_created
  ON goods_receipts (organization_id, status, deleted_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_transfers_org_status_deleted_created
  ON stock_transfers (organization_id, status, deleted_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_dispatches_org_status_deleted_created
  ON stock_dispatches (organization_id, status, deleted_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_adjustments_org_status_deleted_created
  ON stock_adjustments (organization_id, status, deleted_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_returns_org_status_deleted_created
  ON stock_returns (organization_id, status, deleted_at, created_at DESC);
