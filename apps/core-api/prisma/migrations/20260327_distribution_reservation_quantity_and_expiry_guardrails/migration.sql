-- DB-level reservation quantity and temporal guardrails.
-- Added as NOT VALID for safe rollout with legacy rows while enforcing new writes.

ALTER TABLE inventory_reservations
  ADD CONSTRAINT ck_inventory_reservations_reserved_quantity_positive
    CHECK (reserved_quantity >= 1) NOT VALID,
  ADD CONSTRAINT ck_inventory_reservations_expiry_order
    CHECK (
      expires_at IS NULL
      OR expires_at >= reserved_date
    ) NOT VALID;
