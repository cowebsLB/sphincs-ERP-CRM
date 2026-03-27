-- DB-level movement branch-context guardrails for stock-impacting movement types.
-- Added as NOT VALID for safe rollout with legacy rows while enforcing new writes.

ALTER TABLE inventory_movements
  ADD CONSTRAINT ck_inventory_movements_branch_context_by_type
    CHECK (
      CASE
        WHEN movement_type IN ('TRANSFER_OUT', 'RETURN_OUT') THEN COALESCE(source_branch_id, branch_id) IS NOT NULL
        WHEN movement_type IN ('TRANSFER_IN', 'RETURN_IN') THEN COALESCE(destination_branch_id, branch_id) IS NOT NULL
        ELSE branch_id IS NOT NULL
      END
    ) NOT VALID,
  ADD CONSTRAINT ck_inventory_movements_distinct_direction_branches
    CHECK (
      source_branch_id IS NULL
      OR destination_branch_id IS NULL
      OR source_branch_id <> destination_branch_id
    ) NOT VALID;
