-- DB-level pairwise reference guardrails for distribution entities.
-- Ensures type/id reference fields are present together or absent together.
-- Added as NOT VALID for safe rollout with legacy rows while enforcing new writes.

ALTER TABLE inventory_movements
  ADD CONSTRAINT ck_inventory_movements_reference_pair
    CHECK (
      (reference_type IS NULL AND reference_id IS NULL)
      OR (reference_type IS NOT NULL AND reference_id IS NOT NULL)
    ) NOT VALID;

ALTER TABLE stock_returns
  ADD CONSTRAINT ck_stock_returns_linked_source_pair
    CHECK (
      (linked_source_type IS NULL AND linked_source_id IS NULL)
      OR (linked_source_type IS NOT NULL AND linked_source_id IS NOT NULL)
    ) NOT VALID;
