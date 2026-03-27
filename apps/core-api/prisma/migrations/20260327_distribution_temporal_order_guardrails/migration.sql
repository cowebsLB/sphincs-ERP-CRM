-- DB-level temporal ordering guardrails for distribution lifecycle timestamps.
-- Added as NOT VALID to preserve safe rollout with legacy rows while enforcing new writes.

ALTER TABLE goods_receipts
  ADD CONSTRAINT ck_goods_receipts_received_date_order
    CHECK (
      received_date IS NULL
      OR received_date >= created_at
    ) NOT VALID;

ALTER TABLE stock_transfers
  ADD CONSTRAINT ck_stock_transfers_dispatched_date_order
    CHECK (
      dispatched_date IS NULL
      OR dispatched_date >= created_at
    ) NOT VALID,
  ADD CONSTRAINT ck_stock_transfers_received_after_dispatch
    CHECK (
      received_date IS NULL
      OR dispatched_date IS NULL
      OR received_date >= dispatched_date
    ) NOT VALID;

ALTER TABLE stock_adjustments
  ADD CONSTRAINT ck_stock_adjustments_applied_at_order
    CHECK (
      applied_at IS NULL
      OR applied_at >= created_at
    ) NOT VALID;

ALTER TABLE stock_dispatches
  ADD CONSTRAINT ck_stock_dispatches_dispatch_date_order
    CHECK (
      dispatch_date IS NULL
      OR dispatch_date >= created_at
    ) NOT VALID;

ALTER TABLE stock_returns
  ADD CONSTRAINT ck_stock_returns_processed_date_order
    CHECK (
      processed_date IS NULL
      OR processed_date >= created_at
    ) NOT VALID;
