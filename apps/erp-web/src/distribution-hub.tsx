import React from "react";
import { DataTable } from "@sphincs/ui-core";
import { confirmDestructiveAction } from "./confirm";

const MOVEMENT_TYPES = [
  "PURCHASE_RECEIPT",
  "TRANSFER_OUT",
  "TRANSFER_IN",
  "ADJUSTMENT_INCREASE",
  "ADJUSTMENT_DECREASE",
  "DISPATCH_ISSUE",
  "RETURN_IN",
  "RETURN_OUT",
  "DAMAGED_WRITE_OFF",
  "STOCK_CORRECTION"
] as const;

type DistTab = "overview" | "stocks" | "movements" | "transfers" | "receipts" | "dispatches" | "adjustments";

export type DistributionHubProps = {
  fetchApi: <T>(path: string, init?: RequestInit) => Promise<T>;
  notify: (type: "success" | "error", message: string) => void;
  canWrite: boolean;
  canApprove: boolean;
  userBranchId: string | null | undefined;
};

type DashboardMetric = { label: string; value: number };
type DashboardPayload = {
  metrics: DashboardMetric[];
  branch_stock_summary: Array<{
    branch_id: string;
    branch_name: string;
    stock_on_hand: number;
    low_stock_items: number;
    in_transit_quantity: number;
    incoming_quantity: number;
  }>;
  recent_inventory_activity: Array<Record<string, unknown>>;
  alerts_and_exceptions: Array<{
    id: string;
    alert_type?: string;
    severity?: string;
    title?: string;
    message?: string;
    detected_at?: string;
    branch?: { name?: string };
    item?: { name?: string; sku?: string };
  }>;
  generated_at: string;
};

type ItemOption = { id: string; name?: string | null; sku?: string | null };
type BranchOption = { id: string; name?: string | null };

function formatMetricLabel(label: string) {
  return label
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function branchLabel(b: { name?: string | null } | null | undefined) {
  return b?.name ?? "—";
}

function stop(e: React.MouseEvent) {
  e.stopPropagation();
}

export function DistributionHub({ fetchApi, notify, canWrite, canApprove, userBranchId }: DistributionHubProps) {
  const [tab, setTab] = React.useState<DistTab>("overview");
  const [search, setSearch] = React.useState("");

  const [dashboard, setDashboard] = React.useState<DashboardPayload | null>(null);
  const [dashLoading, setDashLoading] = React.useState(false);
  const [dashError, setDashError] = React.useState<string | null>(null);

  const [stocks, setStocks] = React.useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [stocksLoading, setStocksLoading] = React.useState(false);

  const [movements, setMovements] = React.useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [movementsLoading, setMovementsLoading] = React.useState(false);
  const [movementForm, setMovementForm] = React.useState({
    movement_type: "STOCK_CORRECTION" as (typeof MOVEMENT_TYPES)[number],
    item_id: "",
    quantity: "1",
    status: "DRAFT",
    branch_id: "",
    notes: ""
  });

  const [transfers, setTransfers] = React.useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [transfersLoading, setTransfersLoading] = React.useState(false);
  const [transferForm, setTransferForm] = React.useState({
    source_branch_id: "",
    destination_branch_id: "",
    item_id: "",
    quantity_requested: "1",
    notes: ""
  });

  const [receipts, setReceipts] = React.useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [receiptsLoading, setReceiptsLoading] = React.useState(false);

  const [dispatches, setDispatches] = React.useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [dispatchesLoading, setDispatchesLoading] = React.useState(false);

  const [adjustments, setAdjustments] = React.useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [adjustmentsLoading, setAdjustmentsLoading] = React.useState(false);

  const [items, setItems] = React.useState<ItemOption[]>([]);
  const [branches, setBranches] = React.useState<BranchOption[]>([]);

  const [stockEdit, setStockEdit] = React.useState<{
    id: string;
    quantity_on_hand: string;
    reserved_quantity: string;
    available_quantity: string;
    in_transit_quantity: string;
    incoming_quantity: string;
    damaged_quantity: string;
  } | null>(null);

  const loadDashboard = React.useCallback(async () => {
    setDashLoading(true);
    setDashError(null);
    try {
      const data = await fetchApi<DashboardPayload>("/distribution/dashboard");
      setDashboard(data);
    } catch (e) {
      setDashboard(null);
      setDashError(e instanceof Error ? e.message : "Failed to load distribution dashboard");
    } finally {
      setDashLoading(false);
    }
  }, [fetchApi]);

  const loadItemsAndBranches = React.useCallback(async () => {
    try {
      const [itemRows, branchRows] = await Promise.all([
        fetchApi<ItemOption[]>("/erp/items"),
        fetchApi<BranchOption[]>("/branches")
      ]);
      setItems(Array.isArray(itemRows) ? itemRows : []);
      setBranches(Array.isArray(branchRows) ? branchRows : []);
    } catch {
      setItems([]);
      setBranches([]);
    }
  }, [fetchApi]);

  React.useEffect(() => {
    void loadItemsAndBranches();
  }, [loadItemsAndBranches]);

  React.useEffect(() => {
    if (tab === "overview") {
      void loadDashboard();
    }
  }, [tab, loadDashboard]);

  React.useEffect(() => {
    if (tab === "stocks") {
      setStocksLoading(true);
      fetchApi<Array<Record<string, unknown> & { id: string }>>("/distribution/inventory-stocks")
        .then(setStocks)
        .catch(() => setStocks([]))
        .finally(() => setStocksLoading(false));
    }
  }, [tab, fetchApi]);

  React.useEffect(() => {
    if (tab === "movements") {
      setMovementsLoading(true);
      fetchApi<Array<Record<string, unknown> & { id: string }>>("/distribution/movements")
        .then(setMovements)
        .catch(() => setMovements([]))
        .finally(() => setMovementsLoading(false));
    }
  }, [tab, fetchApi]);

  React.useEffect(() => {
    if (tab === "transfers") {
      setTransfersLoading(true);
      fetchApi<Array<Record<string, unknown> & { id: string }>>("/distribution/transfers")
        .then(setTransfers)
        .catch(() => setTransfers([]))
        .finally(() => setTransfersLoading(false));
    }
  }, [tab, fetchApi]);

  React.useEffect(() => {
    if (tab === "receipts") {
      setReceiptsLoading(true);
      fetchApi<Array<Record<string, unknown> & { id: string }>>("/distribution/receipts")
        .then(setReceipts)
        .catch(() => setReceipts([]))
        .finally(() => setReceiptsLoading(false));
    }
  }, [tab, fetchApi]);

  React.useEffect(() => {
    if (tab === "dispatches") {
      setDispatchesLoading(true);
      fetchApi<Array<Record<string, unknown> & { id: string }>>("/distribution/dispatches")
        .then(setDispatches)
        .catch(() => setDispatches([]))
        .finally(() => setDispatchesLoading(false));
    }
  }, [tab, fetchApi]);

  React.useEffect(() => {
    if (tab === "adjustments") {
      setAdjustmentsLoading(true);
      fetchApi<Array<Record<string, unknown> & { id: string }>>("/distribution/adjustments")
        .then(setAdjustments)
        .catch(() => setAdjustments([]))
        .finally(() => setAdjustmentsLoading(false));
    }
  }, [tab, fetchApi]);

  async function submitMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) {
      return;
    }
    const qty = Number(movementForm.quantity);
    if (!movementForm.item_id || !Number.isFinite(qty) || qty < 1) {
      notify("error", "Choose an item and a quantity of at least 1.");
      return;
    }
    const branchId = movementForm.branch_id.trim() || userBranchId || undefined;
    try {
      await fetchApi("/distribution/movements", {
        method: "POST",
        body: JSON.stringify({
          movement_type: movementForm.movement_type,
          item_id: movementForm.item_id,
          quantity: qty,
          status: movementForm.status,
          branch_id: branchId,
          notes: movementForm.notes.trim() || undefined
        })
      });
      notify("success", "Movement recorded.");
      setMovementForm((f) => ({ ...f, quantity: "1", notes: "" }));
      setMovementsLoading(true);
      const next = await fetchApi<Array<Record<string, unknown> & { id: string }>>("/distribution/movements");
      setMovements(next);
      setMovementsLoading(false);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Movement failed");
    }
  }

  async function submitTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) {
      return;
    }
    if (!transferForm.source_branch_id || !transferForm.destination_branch_id) {
      notify("error", "Select both source and destination branches.");
      return;
    }
    if (transferForm.source_branch_id === transferForm.destination_branch_id) {
      notify("error", "Source and destination branches must differ.");
      return;
    }
    if (!transferForm.item_id) {
      notify("error", "Choose an item for the transfer line.");
      return;
    }
    const q = Number(transferForm.quantity_requested);
    if (!Number.isFinite(q) || q < 1) {
      notify("error", "Quantity requested must be at least 1.");
      return;
    }
    try {
      await fetchApi("/distribution/transfers", {
        method: "POST",
        body: JSON.stringify({
          source_branch_id: transferForm.source_branch_id,
          destination_branch_id: transferForm.destination_branch_id,
          notes: transferForm.notes.trim() || undefined,
          line_items: [
            {
              item_id: transferForm.item_id,
              quantity_requested: q,
              quantity_sent: q,
              quantity_received: q
            }
          ]
        })
      });
      notify("success", "Stock transfer created.");
      setTransfersLoading(true);
      const next = await fetchApi<Array<Record<string, unknown> & { id: string }>>("/distribution/transfers");
      setTransfers(next);
      setTransfersLoading(false);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Transfer create failed");
    }
  }

  async function patchTransfer(path: string) {
    try {
      await fetchApi(path, { method: "PATCH", body: JSON.stringify({}) });
      notify("success", "Transfer updated.");
      const next = await fetchApi<Array<Record<string, unknown> & { id: string }>>("/distribution/transfers");
      setTransfers(next);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Transfer action failed");
    }
  }

  async function receiveTransfer(id: string) {
    try {
      await fetchApi(`/distribution/transfers/${id}/receive`, {
        method: "PATCH",
        body: JSON.stringify({ status: "COMPLETED" })
      });
      notify("success", "Transfer marked received.");
      const next = await fetchApi<Array<Record<string, unknown> & { id: string }>>("/distribution/transfers");
      setTransfers(next);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Receive failed");
    }
  }

  async function patchDispatch(id: string, action: string) {
    const pathMap: Record<string, string> = {
      READY: `/distribution/dispatches/${id}/ready`,
      PACK: `/distribution/dispatches/${id}/pack`,
      DISPATCH: `/distribution/dispatches/${id}/dispatch`,
      DELIVER: `/distribution/dispatches/${id}/deliver`
    };
    const path = pathMap[action];
    if (!path) {
      return;
    }
    try {
      await fetchApi(path, { method: "PATCH", body: JSON.stringify({}) });
      notify("success", "Dispatch updated.");
      const next = await fetchApi<Array<Record<string, unknown> & { id: string }>>("/distribution/dispatches");
      setDispatches(next);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Dispatch action failed");
    }
  }

  async function patchAdjustment(id: string, segment: string) {
    try {
      await fetchApi(`/distribution/adjustments/${id}/${segment}`, {
        method: "PATCH",
        body: JSON.stringify({})
      });
      notify("success", "Adjustment updated.");
      const next = await fetchApi<Array<Record<string, unknown> & { id: string }>>("/distribution/adjustments");
      setAdjustments(next);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Adjustment action failed");
    }
  }

  async function saveStockEdit() {
    if (!stockEdit || !canWrite) {
      return;
    }
    try {
      await fetchApi(`/distribution/inventory-stocks/${stockEdit.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          quantity_on_hand: Number(stockEdit.quantity_on_hand),
          reserved_quantity: Number(stockEdit.reserved_quantity),
          available_quantity: Number(stockEdit.available_quantity),
          in_transit_quantity: Number(stockEdit.in_transit_quantity),
          incoming_quantity: Number(stockEdit.incoming_quantity),
          damaged_quantity: Number(stockEdit.damaged_quantity)
        })
      });
      notify("success", "Stock snapshot saved.");
      setStockEdit(null);
      const next = await fetchApi<Array<Record<string, unknown> & { id: string }>>("/distribution/inventory-stocks");
      setStocks(next);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Stock update failed");
    }
  }

  async function resolveAlert(alertId: string) {
    const confirmed = confirmDestructiveAction("Resolve this alert now?", { keyword: "RESOLVE" });
    if (!confirmed) {
      return;
    }
    try {
      await fetchApi(`/distribution/alerts/${alertId}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolution_note: "Resolved from ERP Distribution overview." })
      });
      notify("success", "Alert resolved.");
      void loadDashboard();
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Could not resolve alert");
    }
  }

  const stockRows = React.useMemo(() => {
    return stocks.map((row) => {
      const branch = row.branch as { name?: string } | undefined;
      const item = row.item as { name?: string; sku?: string } | undefined;
      return {
        id: row.id,
        branch: branch?.name ?? String(row.branch_id ?? ""),
        item: item?.name ?? String(row.item_id ?? ""),
        sku: item?.sku ?? "",
        quantity_on_hand: String(row.quantity_on_hand ?? ""),
        available_quantity: String(row.available_quantity ?? ""),
        reserved_quantity: String(row.reserved_quantity ?? ""),
        in_transit_quantity: String(row.in_transit_quantity ?? ""),
        incoming_quantity: String(row.incoming_quantity ?? ""),
        damaged_quantity: String(row.damaged_quantity ?? "")
      };
    });
  }, [stocks]);

  const movementRows = React.useMemo(() => {
    return movements.map((row) => {
      const item = row.item as { name?: string; sku?: string } | undefined;
      return {
        id: row.id,
        movement_type: String(row.movement_type ?? ""),
        quantity: String(row.quantity ?? ""),
        unit: String(row.unit ?? ""),
        status: String(row.status ?? ""),
        occurred_at: String(row.occurred_at ?? ""),
        item: item?.name ?? "",
        sku: item?.sku ?? ""
      };
    });
  }, [movements]);

  const transferRows = React.useMemo(() => {
    return transfers.map((row) => {
      const src = row.source_branch as { name?: string } | undefined;
      const dst = row.destination_branch as { name?: string } | undefined;
      const lines = row.line_items as Array<{ item?: { name?: string }; quantity_requested?: number }> | undefined;
      const lineSummary =
        lines?.map((l) => `${l.item?.name ?? "?"} (${l.quantity_requested ?? 0})`).join(", ") ?? "";
      return {
        id: row.id,
        transfer_number: String(row.transfer_number ?? ""),
        status: String(row.status ?? ""),
        source: src?.name ?? "",
        destination: dst?.name ?? "",
        lines: lineSummary
      };
    });
  }, [transfers]);

  const receiptRows = React.useMemo(() => {
    return receipts.map((row) => {
      const sup = row.supplier as { name?: string } | undefined;
      return {
        id: row.id,
        receipt_number: String(row.receipt_number ?? ""),
        status: String(row.status ?? ""),
        supplier: sup?.name ?? "",
        branch_id: String(row.branch_id ?? "")
      };
    });
  }, [receipts]);

  const dispatchRows = React.useMemo(() => {
    return dispatches.map((row) => {
      const br = row.branch as { name?: string } | undefined;
      const lines = row.line_items as Array<{ item?: { name?: string }; quantity?: number }> | undefined;
      const lineSummary = lines?.map((l) => `${l.item?.name ?? "?"} (${l.quantity ?? 0})`).join(", ") ?? "";
      return {
        id: row.id,
        dispatch_number: String(row.dispatch_number ?? ""),
        status: String(row.status ?? ""),
        destination: String(row.destination ?? ""),
        branch: br?.name ?? "",
        lines: lineSummary
      };
    });
  }, [dispatches]);

  const adjustmentRows = React.useMemo(() => {
    return adjustments.map((row) => {
      const br = row.branch as { name?: string } | undefined;
      return {
        id: row.id,
        adjustment_number: String(row.adjustment_number ?? ""),
        status: String(row.status ?? ""),
        adjustment_type: String(row.adjustment_type ?? ""),
        reason: String(row.reason ?? ""),
        branch: br?.name ?? ""
      };
    });
  }, [adjustments]);

  function renderTransferActions(row: Record<string, unknown> & { id: string }) {
    const status = String(row.status ?? "");
    const buttons: React.ReactNode[] = [];
    if (!canWrite && !canApprove) {
      return null;
    }
    if (status === "DRAFT" && canWrite) {
      buttons.push(
        <button key="req" className="ui-btn ui-btn-secondary" type="button" onClick={(e) => {
          stop(e);
          void patchTransfer(`/distribution/transfers/${row.id}/request`);
        }}>
          Request
        </button>
      );
    }
    if (status === "REQUESTED" && canApprove) {
      buttons.push(
        <button key="app" className="ui-btn ui-btn-secondary" type="button" onClick={(e) => {
          stop(e);
          void patchTransfer(`/distribution/transfers/${row.id}/approve`);
        }}>
          Approve
        </button>
      );
      buttons.push(
        <button key="can" className="ui-btn ui-btn-danger" type="button" onClick={(e) => {
          stop(e);
          const confirmed = confirmDestructiveAction("Cancel this transfer request?", { keyword: "CANCEL" });
          if (!confirmed) {
            return;
          }
          void patchTransfer(`/distribution/transfers/${row.id}/cancel`);
        }}>
          Cancel
        </button>
      );
    }
    if (status === "APPROVED" && canWrite) {
      buttons.push(
        <button key="dis" className="ui-btn ui-btn-secondary" type="button" onClick={(e) => {
          stop(e);
          void patchTransfer(`/distribution/transfers/${row.id}/dispatch`);
        }}>
          Dispatch
        </button>
      );
    }
    if (status === "DISPATCHED" && canWrite) {
      buttons.push(
        <button key="rec" className="ui-btn ui-btn-primary" type="button" onClick={(e) => {
          stop(e);
          void receiveTransfer(row.id);
        }}>
          Receive
        </button>
      );
    }
    if (status === "PARTIAL" && canWrite) {
      buttons.push(
        <button key="rec2" className="ui-btn ui-btn-primary" type="button" onClick={(e) => {
          stop(e);
          void receiveTransfer(row.id);
        }}>
          Complete
        </button>
      );
    }
    return <div className="distribution-inline-actions">{buttons}</div>;
  }

  function renderDispatchActions(row: Record<string, unknown> & { id: string }) {
    if (!canWrite) {
      return null;
    }
    const status = String(row.status ?? "");
    const buttons: React.ReactNode[] = [];
    if (status === "DRAFT") {
      buttons.push(
        <button key="r" className="ui-btn ui-btn-secondary" type="button" onClick={(e) => {
          stop(e);
          void patchDispatch(row.id, "READY");
        }}>
          Ready
        </button>
      );
    }
    if (status === "READY") {
      buttons.push(
        <button key="p" className="ui-btn ui-btn-secondary" type="button" onClick={(e) => {
          stop(e);
          void patchDispatch(row.id, "PACK");
        }}>
          Pack
        </button>
      );
    }
    if (status === "PACKED") {
      buttons.push(
        <button key="d" className="ui-btn ui-btn-secondary" type="button" onClick={(e) => {
          stop(e);
          void patchDispatch(row.id, "DISPATCH");
        }}>
          Dispatch
        </button>
      );
    }
    if (status === "DISPATCHED") {
      buttons.push(
        <button key="del" className="ui-btn ui-btn-primary" type="button" onClick={(e) => {
          stop(e);
          void patchDispatch(row.id, "DELIVER");
        }}>
          Deliver
        </button>
      );
    }
    return <div className="distribution-inline-actions">{buttons}</div>;
  }

  function renderAdjustmentActions(row: Record<string, unknown> & { id: string }) {
    const status = String(row.status ?? "");
    const buttons: React.ReactNode[] = [];
    if (status === "DRAFT" && canWrite) {
      buttons.push(
        <button key="sub" className="ui-btn ui-btn-secondary" type="button" onClick={(e) => {
          stop(e);
          void patchAdjustment(row.id, "submit");
        }}>
          Submit
        </button>
      );
    }
    if (status === "SUBMITTED" && canApprove) {
      buttons.push(
        <button key="app" className="ui-btn ui-btn-secondary" type="button" onClick={(e) => {
          stop(e);
          void patchAdjustment(row.id, "approve");
        }}>
          Approve
        </button>
      );
    }
    if (status === "APPROVED" && canApprove) {
      buttons.push(
        <button key="apl" className="ui-btn ui-btn-primary" type="button" onClick={(e) => {
          stop(e);
          void patchAdjustment(row.id, "apply");
        }}>
          Apply
        </button>
      );
    }
    return <div className="distribution-inline-actions">{buttons}</div>;
  }

  const tabs: { id: DistTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "stocks", label: "Branch stock" },
    { id: "movements", label: "Movements" },
    { id: "transfers", label: "Transfers" },
    { id: "receipts", label: "Receipts" },
    { id: "dispatches", label: "Dispatches" },
    { id: "adjustments", label: "Adjustments" }
  ];

  return (
    <section className="distribution-page">
      <section className="ui-card">
        <div className="distribution-page-header">
          <div>
            <h2 className="ui-title">Distribution</h2>
            <p className="ui-muted">
              Warehouse operations, stock positions, transfers, receipts, dispatches, and adjustments — backed by
              the distribution API (not purchase-order screens).
            </p>
          </div>
          <button className="ui-btn ui-btn-secondary" type="button" onClick={() => {
            if (tab === "overview") {
              void loadDashboard();
            } else {
              setTab("overview");
            }
          }}>
            Refresh overview
          </button>
        </div>
        <nav className="distribution-tabs" aria-label="Distribution sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`distribution-tab${tab === t.id ? " is-active" : ""}`}
              onClick={() => {
                setTab(t.id);
                setSearch("");
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </section>

      {tab === "overview" && (
        <>
          {dashError && (
            <section className="ui-card">
              <p className="ui-muted" style={{ color: "var(--ui-danger, #b42318)" }}>
                {dashError}
              </p>
            </section>
          )}
          {dashLoading && !dashboard && (
            <section className="ui-card">
              <div className="ui-loading">Loading distribution overview…</div>
            </section>
          )}
          {dashboard && (
            <>
              <section className="ui-card">
                <h3 className="ui-subtitle">Operational metrics</h3>
                <div className="distribution-metric-grid">
                  {dashboard.metrics.map((m) => (
                    <div key={m.label} className="distribution-metric-card">
                      <span className="distribution-metric-value">{m.value}</span>
                      <span className="distribution-metric-label">{formatMetricLabel(m.label)}</span>
                    </div>
                  ))}
                </div>
                <p className="ui-muted" style={{ marginTop: "12px" }}>
                  Generated {new Date(dashboard.generated_at).toLocaleString()}
                </p>
              </section>

              <section className="ui-card">
                <h3 className="ui-subtitle">Branch stock summary</h3>
                <div className="ui-table-wrap">
                  <table className="ui-table">
                    <thead>
                      <tr>
                        <th>Branch</th>
                        <th>On hand</th>
                        <th>Low-stock SKUs</th>
                        <th>In transit</th>
                        <th>Incoming</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.branch_stock_summary.map((b) => (
                        <tr key={b.branch_id}>
                          <td>{b.branch_name}</td>
                          <td>{b.stock_on_hand}</td>
                          <td>{b.low_stock_items}</td>
                          <td>{b.in_transit_quantity}</td>
                          <td>{b.incoming_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="distribution-mobile-cards">
                    {dashboard.branch_stock_summary.map((b) => (
                      <article key={`${b.branch_id}-mobile`} className="ui-table-mobile-card">
                        <div className="ui-table-mobile-row">
                          <span className="ui-table-mobile-label">Branch</span>
                          <span>{b.branch_name}</span>
                        </div>
                        <div className="ui-table-mobile-row">
                          <span className="ui-table-mobile-label">On hand</span>
                          <span>{b.stock_on_hand}</span>
                        </div>
                        <div className="ui-table-mobile-row">
                          <span className="ui-table-mobile-label">Low-stock SKUs</span>
                          <span>{b.low_stock_items}</span>
                        </div>
                        <div className="ui-table-mobile-row">
                          <span className="ui-table-mobile-label">In transit</span>
                          <span>{b.in_transit_quantity}</span>
                        </div>
                        <div className="ui-table-mobile-row">
                          <span className="ui-table-mobile-label">Incoming</span>
                          <span>{b.incoming_quantity}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>

              <section className="ui-card">
                <h3 className="ui-subtitle">Open alerts</h3>
                {dashboard.alerts_and_exceptions.length === 0 ? (
                  <p className="ui-muted">No open alerts.</p>
                ) : (
                  <ul className="distribution-alert-list">
                    {dashboard.alerts_and_exceptions.map((a) => (
                      <li key={a.id} className="distribution-alert-item">
                        <div>
                          <strong>{a.title ?? a.alert_type ?? "Alert"}</strong>
                          <span className="ui-muted"> · {a.severity ?? "n/a"}</span>
                          <p className="ui-muted">{a.message}</p>
                          <p className="ui-muted">
                            {branchLabel(a.branch)}
                            {a.item ? ` · ${a.item.name} (${a.item.sku})` : ""}
                          </p>
                        </div>
                        {canApprove && (
                          <button
                            className="ui-btn ui-btn-secondary"
                            type="button"
                            onClick={() => void resolveAlert(a.id)}
                          >
                            Resolve
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="ui-card">
                <h3 className="ui-subtitle">Recent inventory activity</h3>
                <div className="ui-table-wrap">
                  <table className="ui-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Qty</th>
                        <th>Status</th>
                        <th>Item</th>
                        <th>When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recent_inventory_activity.map((m) => {
                        const item = m.item as { name?: string } | undefined;
                        return (
                          <tr key={String(m.id)}>
                            <td>{String(m.movement_type ?? "")}</td>
                            <td>
                              {String(m.quantity ?? "")} {String(m.unit ?? "")}
                            </td>
                            <td>{String(m.status ?? "")}</td>
                            <td>{item?.name ?? "—"}</td>
                            <td>{m.occurred_at ? new Date(String(m.occurred_at)).toLocaleString() : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="distribution-mobile-cards">
                    {dashboard.recent_inventory_activity.map((m) => {
                      const item = m.item as { name?: string } | undefined;
                      return (
                        <article key={`${String(m.id)}-mobile`} className="ui-table-mobile-card">
                          <div className="ui-table-mobile-row">
                            <span className="ui-table-mobile-label">Type</span>
                            <span>{String(m.movement_type ?? "")}</span>
                          </div>
                          <div className="ui-table-mobile-row">
                            <span className="ui-table-mobile-label">Qty</span>
                            <span>
                              {String(m.quantity ?? "")} {String(m.unit ?? "")}
                            </span>
                          </div>
                          <div className="ui-table-mobile-row">
                            <span className="ui-table-mobile-label">Status</span>
                            <span>{String(m.status ?? "")}</span>
                          </div>
                          <div className="ui-table-mobile-row">
                            <span className="ui-table-mobile-label">Item</span>
                            <span>{item?.name ?? "—"}</span>
                          </div>
                          <div className="ui-table-mobile-row">
                            <span className="ui-table-mobile-label">When</span>
                            <span>{m.occurred_at ? new Date(String(m.occurred_at)).toLocaleString() : "—"}</span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>
            </>
          )}
        </>
      )}

      {tab === "stocks" && (
        <section className="ui-card">
          <h3 className="ui-subtitle">Inventory stock by branch</h3>
          {stocksLoading ? (
            <div className="ui-loading">Loading stocks…</div>
          ) : (
            <DataTable
              rows={stockRows}
              columns={[
                { key: "branch", label: "Branch", sortable: true },
                { key: "item", label: "Item", sortable: true },
                { key: "sku", label: "SKU", sortable: true },
                { key: "quantity_on_hand", label: "On hand", sortable: true },
                { key: "available_quantity", label: "Available", sortable: true },
                { key: "reserved_quantity", label: "Reserved", sortable: true },
                { key: "in_transit_quantity", label: "In transit", sortable: true },
                { key: "incoming_quantity", label: "Incoming", sortable: true },
                { key: "damaged_quantity", label: "Damaged", sortable: true }
              ]}
              searchText={search}
              onSearchTextChange={setSearch}
              mobileCardLayout
              renderActions={
                canWrite
                  ? (row) => (
                      <button
                        className="ui-btn ui-btn-secondary"
                        type="button"
                        onClick={(e) => {
                          stop(e);
                          const full = stocks.find((s) => s.id === row.id);
                          if (!full) {
                            return;
                          }
                          setStockEdit({
                            id: row.id,
                            quantity_on_hand: String(full.quantity_on_hand ?? "0"),
                            reserved_quantity: String(full.reserved_quantity ?? "0"),
                            available_quantity: String(full.available_quantity ?? "0"),
                            in_transit_quantity: String(full.in_transit_quantity ?? "0"),
                            incoming_quantity: String(full.incoming_quantity ?? "0"),
                            damaged_quantity: String(full.damaged_quantity ?? "0")
                          });
                        }}
                      >
                        Edit
                      </button>
                    )
                  : undefined
              }
            />
          )}
          {stockEdit && (
            <div className="distribution-stock-editor ui-card" style={{ marginTop: "16px" }}>
              <h4>Edit stock snapshot</h4>
              <div className="distribution-form-grid">
                <label>
                  <span className="ui-muted">On hand</span>
                  <input
                    className="ui-input"
                    value={stockEdit.quantity_on_hand}
                    onChange={(e) => setStockEdit({ ...stockEdit, quantity_on_hand: e.target.value })}
                  />
                </label>
                <label>
                  <span className="ui-muted">Reserved</span>
                  <input
                    className="ui-input"
                    value={stockEdit.reserved_quantity}
                    onChange={(e) => setStockEdit({ ...stockEdit, reserved_quantity: e.target.value })}
                  />
                </label>
                <label>
                  <span className="ui-muted">Available</span>
                  <input
                    className="ui-input"
                    value={stockEdit.available_quantity}
                    onChange={(e) => setStockEdit({ ...stockEdit, available_quantity: e.target.value })}
                  />
                </label>
                <label>
                  <span className="ui-muted">In transit</span>
                  <input
                    className="ui-input"
                    value={stockEdit.in_transit_quantity}
                    onChange={(e) => setStockEdit({ ...stockEdit, in_transit_quantity: e.target.value })}
                  />
                </label>
                <label>
                  <span className="ui-muted">Incoming</span>
                  <input
                    className="ui-input"
                    value={stockEdit.incoming_quantity}
                    onChange={(e) => setStockEdit({ ...stockEdit, incoming_quantity: e.target.value })}
                  />
                </label>
                <label>
                  <span className="ui-muted">Damaged</span>
                  <input
                    className="ui-input"
                    value={stockEdit.damaged_quantity}
                    onChange={(e) => setStockEdit({ ...stockEdit, damaged_quantity: e.target.value })}
                  />
                </label>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button className="ui-btn ui-btn-primary" type="button" onClick={() => void saveStockEdit()}>
                  Save
                </button>
                <button className="ui-btn ui-btn-secondary" type="button" onClick={() => setStockEdit(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "movements" && (
        <>
          {canWrite && (
            <section className="ui-card">
              <h3 className="ui-subtitle">Log a movement</h3>
              <form className="distribution-form-grid" onSubmit={submitMovement}>
                <label>
                  <span className="ui-muted">Movement type</span>
                  <select
                    className="ui-input"
                    value={movementForm.movement_type}
                    onChange={(e) =>
                      setMovementForm((f) => ({ ...f, movement_type: e.target.value as (typeof MOVEMENT_TYPES)[number] }))
                    }
                  >
                    {MOVEMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="ui-muted">Item</span>
                  <select
                    className="ui-input"
                    value={movementForm.item_id}
                    onChange={(e) => setMovementForm((f) => ({ ...f, item_id: e.target.value }))}
                    required
                  >
                    <option value="">Select item…</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name ?? it.id} {it.sku ? `(${it.sku})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="ui-muted">Quantity</span>
                  <input
                    className="ui-input"
                    type="number"
                    min={1}
                    value={movementForm.quantity}
                    onChange={(e) => setMovementForm((f) => ({ ...f, quantity: e.target.value }))}
                  />
                </label>
                <label>
                  <span className="ui-muted">Status</span>
                  <select
                    className="ui-input"
                    value={movementForm.status}
                    onChange={(e) => setMovementForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="POSTED">POSTED</option>
                  </select>
                </label>
                <label>
                  <span className="ui-muted">Branch (optional)</span>
                  <select
                    className="ui-input"
                    value={movementForm.branch_id}
                    onChange={(e) => setMovementForm((f) => ({ ...f, branch_id: e.target.value }))}
                  >
                    <option value="">Default (your branch / routing rules)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name ?? b.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ gridColumn: "1 / -1" }}>
                  <span className="ui-muted">Notes</span>
                  <input
                    className="ui-input"
                    value={movementForm.notes}
                    onChange={(e) => setMovementForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional context for auditors"
                  />
                </label>
                <div style={{ gridColumn: "1 / -1" }}>
                  <button className="ui-btn ui-btn-primary" type="submit">
                    Create movement
                  </button>
                </div>
              </form>
            </section>
          )}
          <section className="ui-card">
            <h3 className="ui-subtitle">Movement ledger (latest 100)</h3>
            {movementsLoading ? (
              <div className="ui-loading">Loading movements…</div>
            ) : (
              <DataTable
                rows={movementRows}
                columns={[
                  { key: "occurred_at", label: "Occurred", sortable: true },
                  { key: "movement_type", label: "Type", sortable: true },
                  { key: "quantity", label: "Qty", sortable: true },
                  { key: "unit", label: "Unit", sortable: true },
                  { key: "status", label: "Status", sortable: true },
                  { key: "item", label: "Item", sortable: true },
                  { key: "sku", label: "SKU", sortable: true }
                ]}
                searchText={search}
                onSearchTextChange={setSearch}
                mobileCardLayout
              />
            )}
          </section>
        </>
      )}

      {tab === "transfers" && (
        <>
          {canWrite && (
            <section className="ui-card">
              <h3 className="ui-subtitle">New stock transfer (single line)</h3>
              <p className="ui-muted" style={{ marginBottom: "8px" }}>
                Creates one line with requested, sent, and received quantities equal so Request → Approve → Dispatch →
                Receive can run end-to-end from this screen. Adjust quantities via the API when you need partial
                receipts.
              </p>
              <form className="distribution-form-grid" onSubmit={submitTransfer}>
                <label>
                  <span className="ui-muted">From branch</span>
                  <select
                    className="ui-input"
                    value={transferForm.source_branch_id}
                    onChange={(e) => setTransferForm((f) => ({ ...f, source_branch_id: e.target.value }))}
                    required
                  >
                    <option value="">Select…</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name ?? b.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="ui-muted">To branch</span>
                  <select
                    className="ui-input"
                    value={transferForm.destination_branch_id}
                    onChange={(e) => setTransferForm((f) => ({ ...f, destination_branch_id: e.target.value }))}
                    required
                  >
                    <option value="">Select…</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name ?? b.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="ui-muted">Item</span>
                  <select
                    className="ui-input"
                    value={transferForm.item_id}
                    onChange={(e) => setTransferForm((f) => ({ ...f, item_id: e.target.value }))}
                    required
                  >
                    <option value="">Select…</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name ?? it.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="ui-muted">Quantity requested</span>
                  <input
                    className="ui-input"
                    type="number"
                    min={1}
                    value={transferForm.quantity_requested}
                    onChange={(e) => setTransferForm((f) => ({ ...f, quantity_requested: e.target.value }))}
                  />
                </label>
                <label style={{ gridColumn: "1 / -1" }}>
                  <span className="ui-muted">Notes</span>
                  <input
                    className="ui-input"
                    value={transferForm.notes}
                    onChange={(e) => setTransferForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </label>
                <div style={{ gridColumn: "1 / -1" }}>
                  <button className="ui-btn ui-btn-primary" type="submit">
                    Create transfer
                  </button>
                </div>
              </form>
            </section>
          )}
          <section className="ui-card">
            <h3 className="ui-subtitle">Transfers</h3>
            {transfersLoading ? (
              <div className="ui-loading">Loading transfers…</div>
            ) : (
              <DataTable
                rows={transferRows}
                columns={[
                  { key: "transfer_number", label: "Number", sortable: true },
                  { key: "status", label: "Status", sortable: true },
                  { key: "source", label: "From", sortable: true },
                  { key: "destination", label: "To", sortable: true },
                  { key: "lines", label: "Lines", sortable: false }
                ]}
                searchText={search}
                onSearchTextChange={setSearch}
                mobileCardLayout
                renderActions={(row) => {
                  const full = transfers.find((t) => t.id === row.id);
                  return full ? renderTransferActions(full) : null;
                }}
              />
            )}
          </section>
        </>
      )}

      {tab === "receipts" && (
        <section className="ui-card">
          <h3 className="ui-subtitle">Goods receipts</h3>
          {receiptsLoading ? (
            <div className="ui-loading">Loading receipts…</div>
          ) : (
            <DataTable
              rows={receiptRows}
              columns={[
                { key: "receipt_number", label: "Receipt #", sortable: true },
                { key: "status", label: "Status", sortable: true },
                { key: "supplier", label: "Supplier", sortable: true },
                { key: "branch_id", label: "Branch ID", sortable: true }
              ]}
              searchText={search}
              onSearchTextChange={setSearch}
              mobileCardLayout
            />
          )}
          <p className="ui-muted" style={{ marginTop: "12px" }}>
            Create and receive flows are available via the API; this grid is for visibility and reconciliation.
          </p>
        </section>
      )}

      {tab === "dispatches" && (
        <section className="ui-card">
          <h3 className="ui-subtitle">Outbound dispatches</h3>
          {dispatchesLoading ? (
            <div className="ui-loading">Loading dispatches…</div>
          ) : (
            <DataTable
              rows={dispatchRows}
              columns={[
                { key: "dispatch_number", label: "Dispatch #", sortable: true },
                { key: "status", label: "Status", sortable: true },
                { key: "branch", label: "Branch", sortable: true },
                { key: "destination", label: "Destination", sortable: true },
                { key: "lines", label: "Lines", sortable: false }
              ]}
              searchText={search}
              onSearchTextChange={setSearch}
              mobileCardLayout
              renderActions={(row) => {
                const full = dispatches.find((d) => d.id === row.id);
                return full ? renderDispatchActions(full) : null;
              }}
            />
          )}
        </section>
      )}

      {tab === "adjustments" && (
        <section className="ui-card">
          <h3 className="ui-subtitle">Stock adjustments</h3>
          {adjustmentsLoading ? (
            <div className="ui-loading">Loading adjustments…</div>
          ) : (
            <DataTable
              rows={adjustmentRows}
              columns={[
                { key: "adjustment_number", label: "Number", sortable: true },
                { key: "status", label: "Status", sortable: true },
                { key: "adjustment_type", label: "Type", sortable: true },
                { key: "branch", label: "Branch", sortable: true },
                { key: "reason", label: "Reason", sortable: true }
              ]}
              searchText={search}
              onSearchTextChange={setSearch}
              mobileCardLayout
              renderActions={(row) => {
                const full = adjustments.find((a) => a.id === row.id);
                return full ? renderAdjustmentActions(full) : null;
              }}
            />
          )}
        </section>
      )}
    </section>
  );
}
