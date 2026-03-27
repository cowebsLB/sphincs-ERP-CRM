-- Enforce idempotency for system-generated movement postings that carry references.
-- This complements service-level duplicate checks and protects against race conditions.

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_movements_system_idempotency_active
  ON inventory_movements (
    organization_id,
    reference_type,
    reference_id,
    movement_type,
    item_id,
    quantity
  )
  WHERE deleted_at IS NULL
    AND reference_type IS NOT NULL
    AND reference_id IS NOT NULL;
