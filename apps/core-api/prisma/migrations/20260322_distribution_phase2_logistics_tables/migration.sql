-- Distribution phase 2 logistics tables and relational links

ALTER TABLE inventory_movements
  ADD COLUMN IF NOT EXISTS source_location_id uuid,
  ADD COLUMN IF NOT EXISTS destination_location_id uuid;

ALTER TABLE goods_receipts
  ADD COLUMN IF NOT EXISTS receiving_location_id uuid;

ALTER TABLE stock_transfers
  ADD COLUMN IF NOT EXISTS source_location_id uuid,
  ADD COLUMN IF NOT EXISTS destination_location_id uuid;

ALTER TABLE stock_dispatches
  ADD COLUMN IF NOT EXISTS dispatch_location_id uuid;

ALTER TABLE stock_returns
  ADD COLUMN IF NOT EXISTS source_location_id uuid,
  ADD COLUMN IF NOT EXISTS destination_location_id uuid;

CREATE TABLE IF NOT EXISTS warehouse_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  parent_location_id uuid NULL,
  code text NOT NULL,
  name text NOT NULL,
  location_type text NOT NULL DEFAULT 'GENERAL',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  CONSTRAINT fk_warehouse_locations_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_warehouse_locations_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_warehouse_locations_parent FOREIGN KEY (parent_location_id) REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  CONSTRAINT uq_warehouse_locations_org_branch_code UNIQUE (organization_id, branch_id, code)
);

CREATE TABLE IF NOT EXISTS inventory_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  item_id uuid NOT NULL,
  supplier_id uuid NULL,
  goods_receipt_id uuid NULL,
  batch_number text NULL,
  serial_number text NULL,
  manufacture_date date NULL,
  expiry_date date NULL,
  quantity_received integer NOT NULL DEFAULT 0,
  quantity_available integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ACTIVE',
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  CONSTRAINT fk_inventory_lots_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_inventory_lots_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_inventory_lots_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_inventory_lots_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  CONSTRAINT fk_inventory_lots_receipt FOREIGN KEY (goods_receipt_id) REFERENCES goods_receipts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory_lot_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  item_id uuid NOT NULL,
  lot_id uuid NOT NULL,
  location_id uuid NULL,
  quantity_on_hand integer NOT NULL DEFAULT 0,
  reserved_quantity integer NOT NULL DEFAULT 0,
  available_quantity integer NOT NULL DEFAULT 0,
  damaged_quantity integer NOT NULL DEFAULT 0,
  in_transit_quantity integer NOT NULL DEFAULT 0,
  last_movement_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  CONSTRAINT fk_inventory_lot_balances_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_inventory_lot_balances_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_inventory_lot_balances_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_inventory_lot_balances_lot FOREIGN KEY (lot_id) REFERENCES inventory_lots(id) ON DELETE CASCADE,
  CONSTRAINT fk_inventory_lot_balances_location FOREIGN KEY (location_id) REFERENCES warehouse_locations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS dispatch_pick_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  stock_dispatch_id uuid NOT NULL,
  pick_number text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT',
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  picked_by uuid NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  CONSTRAINT fk_dispatch_pick_jobs_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_dispatch_pick_jobs_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_dispatch_pick_jobs_dispatch FOREIGN KEY (stock_dispatch_id) REFERENCES stock_dispatches(id) ON DELETE CASCADE,
  CONSTRAINT uq_dispatch_pick_jobs_org_number UNIQUE (organization_id, pick_number)
);

CREATE TABLE IF NOT EXISTS dispatch_pick_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_pick_job_id uuid NOT NULL,
  stock_dispatch_line_id uuid NOT NULL,
  item_id uuid NOT NULL,
  requested_qty integer NOT NULL DEFAULT 0,
  picked_qty integer NOT NULL DEFAULT 0,
  failed_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_dispatch_pick_lines_job FOREIGN KEY (dispatch_pick_job_id) REFERENCES dispatch_pick_jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_dispatch_pick_lines_dispatch_line FOREIGN KEY (stock_dispatch_line_id) REFERENCES stock_dispatch_lines(id) ON DELETE CASCADE,
  CONSTRAINT fk_dispatch_pick_lines_item FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS dispatch_pack_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  stock_dispatch_id uuid NOT NULL,
  pack_number text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT',
  started_at timestamptz NULL,
  completed_at timestamptz NULL,
  packed_by uuid NULL,
  carrier_info text NULL,
  tracking_info text NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  CONSTRAINT fk_dispatch_pack_jobs_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_dispatch_pack_jobs_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_dispatch_pack_jobs_dispatch FOREIGN KEY (stock_dispatch_id) REFERENCES stock_dispatches(id) ON DELETE CASCADE,
  CONSTRAINT uq_dispatch_pack_jobs_org_number UNIQUE (organization_id, pack_number)
);

CREATE TABLE IF NOT EXISTS dispatch_pack_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_pack_job_id uuid NOT NULL,
  stock_dispatch_line_id uuid NOT NULL,
  item_id uuid NOT NULL,
  packed_qty integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_dispatch_pack_lines_job FOREIGN KEY (dispatch_pack_job_id) REFERENCES dispatch_pack_jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_dispatch_pack_lines_dispatch_line FOREIGN KEY (stock_dispatch_line_id) REFERENCES stock_dispatch_lines(id) ON DELETE CASCADE,
  CONSTRAINT fk_dispatch_pack_lines_item FOREIGN KEY (item_id) REFERENCES items(id)
);

ALTER TABLE inventory_movements
  ADD CONSTRAINT fk_inventory_movements_source_location FOREIGN KEY (source_location_id) REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_inventory_movements_destination_location FOREIGN KEY (destination_location_id) REFERENCES warehouse_locations(id) ON DELETE SET NULL;

ALTER TABLE goods_receipts
  ADD CONSTRAINT fk_goods_receipts_receiving_location FOREIGN KEY (receiving_location_id) REFERENCES warehouse_locations(id) ON DELETE SET NULL;

ALTER TABLE stock_transfers
  ADD CONSTRAINT fk_stock_transfers_source_location FOREIGN KEY (source_location_id) REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_stock_transfers_destination_location FOREIGN KEY (destination_location_id) REFERENCES warehouse_locations(id) ON DELETE SET NULL;

ALTER TABLE stock_dispatches
  ADD CONSTRAINT fk_stock_dispatches_location FOREIGN KEY (dispatch_location_id) REFERENCES warehouse_locations(id) ON DELETE SET NULL;

ALTER TABLE stock_returns
  ADD CONSTRAINT fk_stock_returns_source_location FOREIGN KEY (source_location_id) REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_stock_returns_destination_location FOREIGN KEY (destination_location_id) REFERENCES warehouse_locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_source_location ON inventory_movements(source_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_destination_location ON inventory_movements(destination_location_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_receiving_location ON goods_receipts(receiving_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_source_location ON stock_transfers(source_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_destination_location ON stock_transfers(destination_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_dispatches_location ON stock_dispatches(dispatch_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_returns_source_location ON stock_returns(source_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_returns_destination_location ON stock_returns(destination_location_id);

CREATE INDEX IF NOT EXISTS idx_warehouse_locations_org ON warehouse_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_branch ON warehouse_locations(branch_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_parent ON warehouse_locations(parent_location_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_deleted_at ON warehouse_locations(deleted_at);

CREATE INDEX IF NOT EXISTS idx_inventory_lots_org ON inventory_lots(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_branch ON inventory_lots(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_item ON inventory_lots(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_supplier ON inventory_lots(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_receipt ON inventory_lots(goods_receipt_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_batch ON inventory_lots(batch_number);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_serial ON inventory_lots(serial_number);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_deleted_at ON inventory_lots(deleted_at);

CREATE INDEX IF NOT EXISTS idx_inventory_lot_balances_org ON inventory_lot_balances(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lot_balances_branch ON inventory_lot_balances(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lot_balances_item ON inventory_lot_balances(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lot_balances_lot ON inventory_lot_balances(lot_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lot_balances_location ON inventory_lot_balances(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lot_balances_deleted_at ON inventory_lot_balances(deleted_at);

CREATE INDEX IF NOT EXISTS idx_dispatch_pick_jobs_org ON dispatch_pick_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_pick_jobs_branch ON dispatch_pick_jobs(branch_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_pick_jobs_dispatch ON dispatch_pick_jobs(stock_dispatch_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_pick_jobs_deleted_at ON dispatch_pick_jobs(deleted_at);

CREATE INDEX IF NOT EXISTS idx_dispatch_pick_lines_job ON dispatch_pick_lines(dispatch_pick_job_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_pick_lines_dispatch_line ON dispatch_pick_lines(stock_dispatch_line_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_pick_lines_item ON dispatch_pick_lines(item_id);

CREATE INDEX IF NOT EXISTS idx_dispatch_pack_jobs_org ON dispatch_pack_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_pack_jobs_branch ON dispatch_pack_jobs(branch_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_pack_jobs_dispatch ON dispatch_pack_jobs(stock_dispatch_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_pack_jobs_deleted_at ON dispatch_pack_jobs(deleted_at);

CREATE INDEX IF NOT EXISTS idx_dispatch_pack_lines_job ON dispatch_pack_lines(dispatch_pack_job_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_pack_lines_dispatch_line ON dispatch_pack_lines(stock_dispatch_line_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_pack_lines_item ON dispatch_pack_lines(item_id);
