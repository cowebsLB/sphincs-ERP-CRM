-- DB-level temporal invariants tied to workflow status progression.
-- Added as NOT VALID to allow safe rollout while enforcing new writes.

ALTER TABLE goods_receipts
  ADD CONSTRAINT ck_goods_receipts_received_date_required
    CHECK (
      status NOT IN ('RECEIVED', 'CLOSED')
      OR received_date IS NOT NULL
    ) NOT VALID;

ALTER TABLE stock_transfers
  ADD CONSTRAINT ck_stock_transfers_dispatched_date_required
    CHECK (
      status NOT IN ('DISPATCHED', 'PARTIAL', 'COMPLETED')
      OR dispatched_date IS NOT NULL
    ) NOT VALID,
  ADD CONSTRAINT ck_stock_transfers_received_date_required
    CHECK (
      status NOT IN ('PARTIAL', 'COMPLETED')
      OR received_date IS NOT NULL
    ) NOT VALID;

ALTER TABLE stock_adjustments
  ADD CONSTRAINT ck_stock_adjustments_applied_at_required
    CHECK (
      status <> 'APPLIED'
      OR applied_at IS NOT NULL
    ) NOT VALID;

ALTER TABLE stock_dispatches
  ADD CONSTRAINT ck_stock_dispatches_dispatch_date_required
    CHECK (
      status NOT IN ('DISPATCHED', 'DELIVERED', 'RETURNED')
      OR dispatch_date IS NOT NULL
    ) NOT VALID;

ALTER TABLE stock_returns
  ADD CONSTRAINT ck_stock_returns_processed_date_required
    CHECK (
      status NOT IN ('RECEIVED', 'INSPECTED', 'COMPLETED')
      OR processed_date IS NOT NULL
    ) NOT VALID;
