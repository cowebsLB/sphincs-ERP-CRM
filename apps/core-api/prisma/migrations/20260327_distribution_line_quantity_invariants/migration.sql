-- DB-level line-item quantity invariants for distribution workflows.
-- Added as NOT VALID to keep rollout safe with legacy rows while enforcing new writes.

ALTER TABLE goods_receipt_lines
  ADD CONSTRAINT ck_goods_receipt_lines_qty_non_negative
    CHECK (
      ordered_qty >= 0
      AND received_qty >= 0
      AND rejected_qty >= 0
      AND remaining_qty >= 0
    ) NOT VALID,
  ADD CONSTRAINT ck_goods_receipt_lines_qty_consistency
    CHECK (
      received_qty + rejected_qty <= ordered_qty
      AND remaining_qty <= ordered_qty
    ) NOT VALID;

ALTER TABLE stock_transfer_lines
  ADD CONSTRAINT ck_stock_transfer_lines_qty_non_negative
    CHECK (
      quantity_requested >= 1
      AND quantity_sent >= 0
      AND quantity_received >= 0
    ) NOT VALID,
  ADD CONSTRAINT ck_stock_transfer_lines_qty_consistency
    CHECK (
      quantity_sent <= quantity_requested
      AND quantity_received <= quantity_sent
    ) NOT VALID;

ALTER TABLE stock_adjustment_lines
  ADD CONSTRAINT ck_stock_adjustment_lines_qty_non_negative
    CHECK (
      previous_qty >= 0
      AND adjusted_qty >= 0
    ) NOT VALID,
  ADD CONSTRAINT ck_stock_adjustment_lines_variance_consistency
    CHECK (
      variance = adjusted_qty - previous_qty
    ) NOT VALID;

ALTER TABLE stock_dispatch_lines
  ADD CONSTRAINT ck_stock_dispatch_lines_qty_positive
    CHECK (quantity >= 1) NOT VALID;

ALTER TABLE stock_return_lines
  ADD CONSTRAINT ck_stock_return_lines_qty_positive
    CHECK (quantity >= 1) NOT VALID;
