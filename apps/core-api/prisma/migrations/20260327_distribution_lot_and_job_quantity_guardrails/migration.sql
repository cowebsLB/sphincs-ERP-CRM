-- DB-level guardrails for lot balances, movement quantities, and pick/pack line consistency.
-- Added as NOT VALID to allow safe rollout while enforcing new writes.

ALTER TABLE inventory_movements
  ADD CONSTRAINT ck_inventory_movements_quantity_positive
    CHECK (quantity >= 1) NOT VALID;

ALTER TABLE inventory_lots
  ADD CONSTRAINT ck_inventory_lots_quantity_non_negative
    CHECK (
      quantity_received >= 0
      AND quantity_available >= 0
    ) NOT VALID,
  ADD CONSTRAINT ck_inventory_lots_quantity_consistency
    CHECK (
      quantity_available <= quantity_received
    ) NOT VALID;

ALTER TABLE dispatch_pick_lines
  ADD CONSTRAINT ck_dispatch_pick_lines_quantity_non_negative
    CHECK (
      requested_qty >= 0
      AND picked_qty >= 0
    ) NOT VALID,
  ADD CONSTRAINT ck_dispatch_pick_lines_quantity_consistency
    CHECK (
      picked_qty <= requested_qty
    ) NOT VALID;

ALTER TABLE dispatch_pack_lines
  ADD CONSTRAINT ck_dispatch_pack_lines_quantity_non_negative
    CHECK (
      packed_qty >= 0
    ) NOT VALID;
