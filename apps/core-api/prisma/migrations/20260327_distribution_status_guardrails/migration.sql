-- DB-level status string guardrails for distribution entities that store status as text.
-- Added as NOT VALID for rollout safety with legacy data while enforcing new writes.

ALTER TABLE inventory_movements
  ADD CONSTRAINT ck_inventory_movements_status_posting
    CHECK (
      status IN ('DRAFT', 'POSTED', 'CANCELLED')
    ) NOT VALID;

ALTER TABLE stock_alerts
  ADD CONSTRAINT ck_stock_alerts_status_domain
    CHECK (
      status IN ('OPEN', 'RESOLVED', 'DISMISSED')
    ) NOT VALID;

ALTER TABLE warehouse_locations
  ADD CONSTRAINT ck_warehouse_locations_type_domain
    CHECK (
      location_type IN ('GENERAL', 'ZONE', 'AISLE', 'BIN', 'STAGING', 'DOCK')
    ) NOT VALID;

ALTER TABLE inventory_lots
  ADD CONSTRAINT ck_inventory_lots_status_domain
    CHECK (
      status IN ('ACTIVE', 'HOLD', 'EXHAUSTED', 'CLOSED')
    ) NOT VALID;

ALTER TABLE dispatch_pick_jobs
  ADD CONSTRAINT ck_dispatch_pick_jobs_status_domain
    CHECK (
      status IN ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    ) NOT VALID;

ALTER TABLE dispatch_pack_jobs
  ADD CONSTRAINT ck_dispatch_pack_jobs_status_domain
    CHECK (
      status IN ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    ) NOT VALID;
