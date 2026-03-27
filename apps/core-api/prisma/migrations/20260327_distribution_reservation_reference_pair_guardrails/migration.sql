-- DB-level pairwise reference guardrail for inventory reservations.
-- Ensures reservation reference fields are present together or absent together.
-- Added as NOT VALID for safe rollout with legacy rows while enforcing new writes.

ALTER TABLE inventory_reservations
  ADD CONSTRAINT ck_inventory_reservations_reference_pair
    CHECK (
      (reference_type IS NULL AND reference_id IS NULL)
      OR (reference_type IS NOT NULL AND reference_id IS NOT NULL)
    ) NOT VALID;
