-- DB-level quantity guardrails for inventory stock snapshots and lot balances.
-- Added as NOT VALID to avoid breaking rollout on legacy rows while enforcing all new writes.

ALTER TABLE inventory_stocks
  ADD CONSTRAINT ck_inventory_stocks_non_negative
    CHECK (
      quantity_on_hand >= 0
      AND reserved_quantity >= 0
      AND available_quantity >= 0
      AND in_transit_quantity >= 0
      AND incoming_quantity >= 0
      AND damaged_quantity >= 0
    ) NOT VALID,
  ADD CONSTRAINT ck_inventory_stocks_consistency
    CHECK (
      reserved_quantity <= quantity_on_hand
      AND available_quantity <= quantity_on_hand
    ) NOT VALID;

ALTER TABLE inventory_lot_balances
  ADD CONSTRAINT ck_inventory_lot_balances_non_negative
    CHECK (
      quantity_on_hand >= 0
      AND reserved_quantity >= 0
      AND available_quantity >= 0
      AND damaged_quantity >= 0
      AND in_transit_quantity >= 0
    ) NOT VALID,
  ADD CONSTRAINT ck_inventory_lot_balances_consistency
    CHECK (
      reserved_quantity <= quantity_on_hand
      AND available_quantity <= quantity_on_hand
    ) NOT VALID;
