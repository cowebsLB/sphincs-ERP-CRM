-- DB-level updated_at maintenance for distribution tables.
-- Ensures direct SQL updates keep timestamps coherent outside ORM-managed paths.

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_stocks_set_updated_at ON inventory_stocks;
CREATE TRIGGER trg_inventory_stocks_set_updated_at
BEFORE UPDATE ON inventory_stocks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_inventory_movements_set_updated_at ON inventory_movements;
CREATE TRIGGER trg_inventory_movements_set_updated_at
BEFORE UPDATE ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_goods_receipts_set_updated_at ON goods_receipts;
CREATE TRIGGER trg_goods_receipts_set_updated_at
BEFORE UPDATE ON goods_receipts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_goods_receipt_lines_set_updated_at ON goods_receipt_lines;
CREATE TRIGGER trg_goods_receipt_lines_set_updated_at
BEFORE UPDATE ON goods_receipt_lines
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_stock_transfers_set_updated_at ON stock_transfers;
CREATE TRIGGER trg_stock_transfers_set_updated_at
BEFORE UPDATE ON stock_transfers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_stock_transfer_lines_set_updated_at ON stock_transfer_lines;
CREATE TRIGGER trg_stock_transfer_lines_set_updated_at
BEFORE UPDATE ON stock_transfer_lines
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_stock_adjustments_set_updated_at ON stock_adjustments;
CREATE TRIGGER trg_stock_adjustments_set_updated_at
BEFORE UPDATE ON stock_adjustments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_stock_adjustment_lines_set_updated_at ON stock_adjustment_lines;
CREATE TRIGGER trg_stock_adjustment_lines_set_updated_at
BEFORE UPDATE ON stock_adjustment_lines
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_stock_dispatches_set_updated_at ON stock_dispatches;
CREATE TRIGGER trg_stock_dispatches_set_updated_at
BEFORE UPDATE ON stock_dispatches
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_stock_dispatch_lines_set_updated_at ON stock_dispatch_lines;
CREATE TRIGGER trg_stock_dispatch_lines_set_updated_at
BEFORE UPDATE ON stock_dispatch_lines
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_stock_returns_set_updated_at ON stock_returns;
CREATE TRIGGER trg_stock_returns_set_updated_at
BEFORE UPDATE ON stock_returns
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_stock_return_lines_set_updated_at ON stock_return_lines;
CREATE TRIGGER trg_stock_return_lines_set_updated_at
BEFORE UPDATE ON stock_return_lines
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_inventory_lots_set_updated_at ON inventory_lots;
CREATE TRIGGER trg_inventory_lots_set_updated_at
BEFORE UPDATE ON inventory_lots
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_inventory_lot_balances_set_updated_at ON inventory_lot_balances;
CREATE TRIGGER trg_inventory_lot_balances_set_updated_at
BEFORE UPDATE ON inventory_lot_balances
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_warehouse_locations_set_updated_at ON warehouse_locations;
CREATE TRIGGER trg_warehouse_locations_set_updated_at
BEFORE UPDATE ON warehouse_locations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_dispatch_pick_jobs_set_updated_at ON dispatch_pick_jobs;
CREATE TRIGGER trg_dispatch_pick_jobs_set_updated_at
BEFORE UPDATE ON dispatch_pick_jobs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_dispatch_pick_lines_set_updated_at ON dispatch_pick_lines;
CREATE TRIGGER trg_dispatch_pick_lines_set_updated_at
BEFORE UPDATE ON dispatch_pick_lines
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_dispatch_pack_jobs_set_updated_at ON dispatch_pack_jobs;
CREATE TRIGGER trg_dispatch_pack_jobs_set_updated_at
BEFORE UPDATE ON dispatch_pack_jobs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_dispatch_pack_lines_set_updated_at ON dispatch_pack_lines;
CREATE TRIGGER trg_dispatch_pack_lines_set_updated_at
BEFORE UPDATE ON dispatch_pack_lines
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_stock_alerts_set_updated_at ON stock_alerts;
CREATE TRIGGER trg_stock_alerts_set_updated_at
BEFORE UPDATE ON stock_alerts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
