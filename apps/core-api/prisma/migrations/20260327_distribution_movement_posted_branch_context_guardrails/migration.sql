-- Refines movement branch-context guardrail to apply when status is POSTED.
-- Keeps non-posted movements (DRAFT/CANCELLED) loggable without mandatory stock-routing context.

ALTER TABLE inventory_movements
  DROP CONSTRAINT IF EXISTS ck_inventory_movements_branch_context_by_type;

ALTER TABLE inventory_movements
  ADD CONSTRAINT ck_inventory_movements_branch_context_by_type
    CHECK (
      status <> 'POSTED'
      OR (
        CASE
          WHEN movement_type IN ('TRANSFER_OUT', 'RETURN_OUT') THEN COALESCE(source_branch_id, branch_id) IS NOT NULL
          WHEN movement_type IN ('TRANSFER_IN', 'RETURN_IN') THEN COALESCE(destination_branch_id, branch_id) IS NOT NULL
          ELSE branch_id IS NOT NULL
        END
      )
    ) NOT VALID;
