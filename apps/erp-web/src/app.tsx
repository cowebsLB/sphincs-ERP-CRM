import React from "react";
import { HashRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { ApiClient, type SessionState } from "@sphincs/api-client";
import { DataTable, ResourceManager } from "@sphincs/ui-core";
import "@sphincs/ui-core/ui.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";
const API_ROOT = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
const STORAGE_KEY = "sphincs.session";
const LEGACY_STORAGE_KEYS = ["sphincs.erp.session", "sphincs.crm.session"] as const;
const APP_RELEASE_VERSION = "Beta V1.7.1";
const client = new ApiClient(API_BASE_URL);

type RecordData = Record<string, unknown> & { id: string; deleted_at?: string | null };
type ItemRecord = RecordData & {
  name?: string | null;
  sku?: string | null;
  status?: string | null;
  selling_price?: string | number | null;
  cost_price?: string | number | null;
  currency?: string | null;
  track_inventory?: boolean | null;
  quantity_on_hand?: number | null;
  reorder_level?: number | null;
  max_stock_level?: number | null;
  unit_of_measure?: string | null;
  category_id?: string | null;
  tags?: string[] | null;
  brand?: string | null;
  description?: string | null;
  barcode?: string | null;
  is_service?: boolean | null;
  tax_rate?: string | number | null;
  discountable?: boolean | null;
};
type SupplierRecord = RecordData & {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};
type PurchaseOrderRecord = RecordData & {
  supplier_id?: string | null;
  supplier_name?: string;
  status?: string | null;
};
type SystemInfo = {
  version?: string;
  environment?: string;
  timestamp?: string;
};
type BugReportForm = {
  title: string;
  summary: string;
  steps: string;
  expected: string;
  actual: string;
  severity: "low" | "medium" | "high" | "critical";
  module: string;
  contactEmail: string;
  screenshotUrl: string;
};

type PurchaseOrderFormState = {
  supplier_id: string;
  status: string;
};

type ItemFormState = {
  name: string;
  sku: string;
  status: string;
  selling_price: string;
  category_id: string;
  track_inventory: boolean;
  quantity_on_hand: string;
  cost_price: string;
  currency: string;
  tax_rate: string;
  discountable: boolean;
  reorder_level: string;
  max_stock_level: string;
  unit_of_measure: string;
  barcode: string;
  tags: string;
  brand: string;
  description: string;
  is_service: boolean;
};

function SystemStatusCard() {
  const [healthOk, setHealthOk] = React.useState<boolean | null>(null);
  const [systemInfo, setSystemInfo] = React.useState<SystemInfo | null>(null);

  React.useEffect(() => {
    let active = true;
    async function run() {
      try {
        const health = await fetch(`${API_ROOT}/health`);
        if (active) {
          setHealthOk(health.ok);
        }
      } catch {
        if (active) {
          setHealthOk(false);
        }
      }

      try {
        const info = await fetch(`${API_BASE_URL}/system/info`);
        const data = (await info.json()) as SystemInfo;
        if (active) {
          setSystemInfo(data);
        }
      } catch {
        if (active) {
          setSystemInfo(null);
        }
      }
    }

    void run();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="ui-status-card">
      <strong>System Status</strong>
      <p className="ui-muted">
        API health: {healthOk === null ? "checking..." : healthOk ? "online" : "offline"}
      </p>
      <p className="ui-muted">
        Env: {systemInfo?.environment ?? "unknown"} · Version: {systemInfo?.version ?? "n/a"}
      </p>
    </section>
  );
}

function useSessionState() {
  const [session, setSession] = React.useState<SessionState | null>(() => {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean) ||
      null;
    return raw ? (JSON.parse(raw) as SessionState) : null;
  });

  const update = React.useCallback((next: SessionState | null) => {
    setSession(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      LEGACY_STORAGE_KEYS.forEach((key) => {
        if (key !== STORAGE_KEY) {
          localStorage.removeItem(key);
        }
      });
    } else {
      localStorage.removeItem(STORAGE_KEY);
      LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    }
  }, []);

  return { session, setSession: update };
}

function hasRole(session: SessionState | null, ...roles: string[]): boolean {
  return !!session && roles.some((role) => session.user.roles.includes(role));
}

async function withAuth<T>(
  session: SessionState,
  setSession: (next: SessionState | null) => void,
  path: string,
  init?: RequestInit
) {
  const result = await client.authorized<T>(path, session, init);
  if (
    result.tokens.accessToken !== session.accessToken ||
    result.tokens.refreshToken !== session.refreshToken
  ) {
    setSession({ ...session, ...result.tokens });
  }
  return result.data;
}

function LoginPage({ setSession }: { setSession: (next: SessionState | null) => void }) {
  const [email, setEmail] = React.useState("admin@sphincs.local");
  const [password, setPassword] = React.useState("ChangeMe123!");
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const tokens =
        mode === "signup"
          ? await client.signup(email, password)
          : await client.login(email, password);
      setSession({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: tokens.user
      });
      navigate("/items");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <header className="auth-header">
          <strong>SPHINCS</strong>
          <nav className="auth-nav">
            <a href="../">Home</a>
            <a href="../erp/">ERP</a>
            <a href="../crm/">CRM</a>
          </nav>
        </header>
        <p className="auth-eyebrow">SPHINCS Platform</p>
        <h1>{mode === "signup" ? "Create your account" : "Sign in once for ERP + CRM"}</h1>
        <p className="ui-muted">One session works across both modules in this beta.</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            <span>Email</span>
        <input
          className="ui-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
        />
          </label>
          <label>
            <span>Password</span>
        <input
          className="ui-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          autoComplete="current-password"
        />
          </label>
          <button className="ui-btn ui-btn-primary" disabled={busy} type="submit">
          {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>
        </form>
        {error && <p className="ui-error">{error}</p>}
        <p className="auth-switch">
          <a className="ui-btn ui-btn-secondary" href="../">
            Back to home
          </a>
          {mode === "signup" ? "Already have an account?" : "New tester?"}{" "}
          <button
            className="ui-btn ui-btn-secondary"
          type="button"
          onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setError(null);
          }}
        >
          {mode === "signup" ? "Sign in" : "Create account"}
        </button>
        </p>
      </section>
    </main>
  );
}

function ResourcePage({
  session,
  setSession,
  endpoint,
  title,
  fields,
  notify
}: {
  session: SessionState;
  setSession: (next: SessionState | null) => void;
  endpoint: string;
  title: string;
  fields: Array<{ key: string; label: string }>;
  notify: (type: "success" | "error", message: string) => void;
}) {
  const [rows, setRows] = React.useState<RecordData[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [includeDeleted, setIncludeDeleted] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const query = includeDeleted ? "?includeDeleted=true" : "";
    const data = await withAuth<RecordData[]>(session, setSession, `${endpoint}${query}`);
    setRows(data);
    setLoading(false);
  }, [endpoint, includeDeleted, session, setSession]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function createItem(form: Record<string, string>) {
    try {
      await withAuth(session, setSession, endpoint, {
        method: "POST",
        body: JSON.stringify(form)
      });
      notify("success", `${title}: record created`);
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Create failed");
    }
  }

  async function patchItem(id: string, payload: Record<string, unknown>) {
    try {
      await withAuth(session, setSession, `${endpoint}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      notify("success", `${title}: record updated`);
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Update failed");
    }
  }

  return (
    <ResourceManager<RecordData>
      title={title}
      rows={rows}
      loading={loading}
      includeDeleted={includeDeleted}
      onToggleIncludeDeleted={setIncludeDeleted}
      columns={fields.map((f) => ({ key: f.key as keyof RecordData, label: f.label, sortable: true }))}
      createFields={fields}
      editFields={fields}
      onCreate={createItem}
      onUpdate={(id, payload) => patchItem(id, payload)}
      onSoftDelete={(id) => patchItem(id, { deleted_at: new Date().toISOString() })}
      onRestore={async (id) => {
        try {
          await withAuth(session, setSession, `${endpoint}/${id}/restore`, {
            method: "POST",
            body: JSON.stringify({})
          });
          notify("success", `${title}: record restored`);
          await load();
        } catch (error) {
          notify("error", error instanceof Error ? error.message : "Restore failed");
        }
      }}
    />
  );
}

function createDefaultItemForm(): ItemFormState {
  return {
    name: "",
    sku: "",
    status: "ACTIVE",
    selling_price: "0",
    category_id: "",
    track_inventory: true,
    quantity_on_hand: "0",
    cost_price: "0",
    currency: "USD",
    tax_rate: "0",
    discountable: true,
    reorder_level: "0",
    max_stock_level: "",
    unit_of_measure: "piece",
    barcode: "",
    tags: "",
    brand: "",
    description: "",
    is_service: false
  };
}

function toItemFormState(item?: ItemRecord | null): ItemFormState {
  if (!item) {
    return createDefaultItemForm();
  }

  return {
    name: String(item.name ?? ""),
    sku: String(item.sku ?? ""),
    status: String(item.status ?? "ACTIVE"),
    selling_price: String(item.selling_price ?? "0"),
    category_id: String(item.category_id ?? ""),
    track_inventory: Boolean(item.track_inventory ?? true),
    quantity_on_hand: String(item.quantity_on_hand ?? "0"),
    cost_price: String(item.cost_price ?? "0"),
    currency: String(item.currency ?? "USD"),
    tax_rate: String(item.tax_rate ?? "0"),
    discountable: Boolean(item.discountable ?? true),
    reorder_level: String(item.reorder_level ?? "0"),
    max_stock_level: item.max_stock_level === null || item.max_stock_level === undefined ? "" : String(item.max_stock_level),
    unit_of_measure: String(item.unit_of_measure ?? "piece"),
    barcode: String(item.barcode ?? ""),
    tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
    brand: String(item.brand ?? ""),
    description: String(item.description ?? ""),
    is_service: Boolean(item.is_service ?? false)
  };
}

function buildItemPayload(form: ItemFormState) {
  return {
    name: form.name,
    sku: form.sku,
    status: form.status,
    selling_price: form.selling_price,
    category_id: form.category_id || undefined,
    track_inventory: form.is_service ? false : form.track_inventory,
    quantity_on_hand: form.is_service || !form.track_inventory ? 0 : form.quantity_on_hand,
    cost_price: form.cost_price,
    currency: form.currency,
    tax_rate: form.tax_rate,
    discountable: form.discountable,
    reorder_level: form.is_service || !form.track_inventory ? 0 : form.reorder_level,
    max_stock_level: form.is_service || !form.track_inventory ? null : form.max_stock_level || null,
    unit_of_measure: form.unit_of_measure,
    barcode: form.barcode || undefined,
    tags: form.tags,
    brand: form.brand || undefined,
    description: form.description || undefined,
    is_service: form.is_service
  };
}

function ItemsPage({
  session,
  setSession,
  notify
}: {
  session: SessionState;
  setSession: (next: SessionState | null) => void;
  notify: (type: "success" | "error", message: string) => void;
}) {
  const [rows, setRows] = React.useState<ItemRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [includeDeleted, setIncludeDeleted] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ItemRecord | null>(null);
  const [createForm, setCreateForm] = React.useState<ItemFormState>(createDefaultItemForm);
  const [editForm, setEditForm] = React.useState<ItemFormState>(createDefaultItemForm);
  const [createSections, setCreateSections] = React.useState({
    pricing: false,
    inventory: false,
    classification: false,
    advanced: false
  });
  const [editSections, setEditSections] = React.useState({
    pricing: true,
    inventory: false,
    classification: false,
    advanced: false
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = includeDeleted ? "?includeDeleted=true" : "";
      const data = await withAuth<ItemRecord[]>(session, setSession, `/erp/items${query}`);
      setRows(data);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [includeDeleted, notify, session, setSession]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function updateItemForm(target: "create" | "edit", patch: Partial<ItemFormState>) {
    const setForm = target === "create" ? setCreateForm : setEditForm;
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.is_service) {
        next.track_inventory = false;
        next.quantity_on_hand = "0";
        next.reorder_level = "0";
        next.max_stock_level = "";
      }
      return next;
    });
  }

  function toggleSection(target: "create" | "edit", section: "pricing" | "inventory" | "classification" | "advanced") {
    const setSections = target === "create" ? setCreateSections : setEditSections;
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function openEdit(item: ItemRecord) {
    setEditing(item);
    setEditForm(toItemFormState(item));
    setEditSections({
      pricing: true,
      inventory: false,
      classification: false,
      advanced: false
    });
  }

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    try {
      await withAuth(session, setSession, "/erp/items", {
        method: "POST",
        body: JSON.stringify(buildItemPayload(createForm))
      });
      notify("success", "Items: record created");
      setCreateOpen(false);
      setCreateForm(createDefaultItemForm());
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Create failed");
    }
  }

  async function updateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) {
      return;
    }
    try {
      await withAuth(session, setSession, `/erp/items/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify(buildItemPayload(editForm))
      });
      notify("success", "Items: record updated");
      setEditing(null);
      setEditForm(createDefaultItemForm());
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Update failed");
    }
  }

  async function patchItem(id: string, payload: Record<string, unknown>) {
    try {
      await withAuth(session, setSession, `/erp/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      notify("success", "Items: record updated");
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Update failed");
    }
  }

  function renderSectionToggle(
    target: "create" | "edit",
    section: "pricing" | "inventory" | "classification" | "advanced",
    label: string,
    open: boolean
  ) {
    return (
      <button
        className="item-section-toggle"
        type="button"
        onClick={() => toggleSection(target, section)}
      >
        <strong>{label}</strong>
        <span>{open ? "Hide" : "Show"}</span>
      </button>
    );
  }

  function renderItemForm(
    target: "create" | "edit",
    form: ItemFormState,
    sections: { pricing: boolean; inventory: boolean; classification: boolean; advanced: boolean }
  ) {
    const inventoryVisible = form.track_inventory && !form.is_service;

    return (
      <div className="item-modal-layout">
        <section className="item-form-block">
          <div className="item-form-header">
            <h3>Essentials</h3>
            <p className="ui-muted">The fields you need most of the time.</p>
          </div>
          <div className="item-form-grid">
            <label className="item-form-field">
              <span>Name</span>
              <input
                className="ui-input"
                value={form.name}
                onChange={(e) => updateItemForm(target, { name: e.target.value })}
                placeholder="Item name"
                required
              />
            </label>
            <label className="item-form-field">
              <span>SKU</span>
              <input
                className="ui-input"
                value={form.sku}
                onChange={(e) => updateItemForm(target, { sku: e.target.value.toUpperCase() })}
                placeholder="SKU"
                required
              />
            </label>
            <label className="item-form-field">
              <span>Status</span>
              <select
                className="ui-input"
                value={form.status}
                onChange={(e) => updateItemForm(target, { status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </label>
            <label className="item-form-field">
              <span>Selling Price</span>
              <input
                className="ui-input"
                type="number"
                min="0"
                step="0.01"
                value={form.selling_price}
                onChange={(e) => updateItemForm(target, { selling_price: e.target.value })}
              />
            </label>
            <label className="item-form-field">
              <span>Category</span>
              <input
                className="ui-input"
                value={form.category_id}
                onChange={(e) => updateItemForm(target, { category_id: e.target.value })}
                placeholder="Category"
              />
            </label>
            <label className="item-form-inline">
              <input
                type="checkbox"
                checked={form.track_inventory}
                disabled={form.is_service}
                onChange={(e) => updateItemForm(target, { track_inventory: e.target.checked })}
              />
              <span>Track inventory</span>
            </label>
            {inventoryVisible && (
              <label className="item-form-field">
                <span>Quantity On Hand</span>
                <input
                  className="ui-input"
                  type="number"
                  min="0"
                  step="1"
                  value={form.quantity_on_hand}
                  onChange={(e) => updateItemForm(target, { quantity_on_hand: e.target.value })}
                />
              </label>
            )}
          </div>
        </section>

        <section className="item-form-block">
          {renderSectionToggle(target, "pricing", "Pricing", sections.pricing)}
          {sections.pricing && (
            <div className="item-form-grid">
              <label className="item-form-field">
                <span>Cost Price</span>
                <input
                  className="ui-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost_price}
                  onChange={(e) => updateItemForm(target, { cost_price: e.target.value })}
                />
              </label>
              <label className="item-form-field">
                <span>Currency</span>
                <input
                  className="ui-input"
                  value={form.currency}
                  onChange={(e) => updateItemForm(target, { currency: e.target.value.toUpperCase() })}
                />
              </label>
              <label className="item-form-field">
                <span>Tax Rate</span>
                <input
                  className="ui-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.tax_rate}
                  onChange={(e) => updateItemForm(target, { tax_rate: e.target.value })}
                />
              </label>
              <label className="item-form-inline">
                <input
                  type="checkbox"
                  checked={form.discountable}
                  onChange={(e) => updateItemForm(target, { discountable: e.target.checked })}
                />
                <span>Discountable</span>
              </label>
            </div>
          )}
        </section>

        {inventoryVisible && (
          <section className="item-form-block">
            {renderSectionToggle(target, "inventory", "Inventory", sections.inventory)}
            {sections.inventory && (
              <div className="item-form-grid">
                <label className="item-form-field">
                  <span>Reorder Level</span>
                  <input
                    className="ui-input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.reorder_level}
                    onChange={(e) => updateItemForm(target, { reorder_level: e.target.value })}
                  />
                </label>
                <label className="item-form-field">
                  <span>Max Stock Level</span>
                  <input
                    className="ui-input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.max_stock_level}
                    onChange={(e) => updateItemForm(target, { max_stock_level: e.target.value })}
                  />
                </label>
                <label className="item-form-field">
                  <span>Unit Of Measure</span>
                  <select
                    className="ui-input"
                    value={form.unit_of_measure}
                    onChange={(e) => updateItemForm(target, { unit_of_measure: e.target.value })}
                  >
                    <option value="piece">piece</option>
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="box">box</option>
                    <option value="pack">pack</option>
                    <option value="unit">unit</option>
                  </select>
                </label>
                <label className="item-form-field">
                  <span>Barcode</span>
                  <input
                    className="ui-input"
                    value={form.barcode}
                    onChange={(e) => updateItemForm(target, { barcode: e.target.value })}
                  />
                </label>
              </div>
            )}
          </section>
        )}

        <section className="item-form-block">
          {renderSectionToggle(target, "classification", "Classification", sections.classification)}
          {sections.classification && (
            <div className="item-form-grid">
              <label className="item-form-field">
                <span>Tags</span>
                <input
                  className="ui-input"
                  value={form.tags}
                  onChange={(e) => updateItemForm(target, { tags: e.target.value })}
                  placeholder="tag1, tag2"
                />
              </label>
              <label className="item-form-field">
                <span>Brand</span>
                <input
                  className="ui-input"
                  value={form.brand}
                  onChange={(e) => updateItemForm(target, { brand: e.target.value })}
                />
              </label>
              <label className="item-form-field item-form-field-wide">
                <span>Description</span>
                <textarea
                  className="ui-input item-textarea"
                  value={form.description}
                  onChange={(e) => updateItemForm(target, { description: e.target.value })}
                  placeholder="Describe the item"
                />
              </label>
            </div>
          )}
        </section>

        <section className="item-form-block">
          {renderSectionToggle(target, "advanced", "Advanced", sections.advanced)}
          {sections.advanced && (
            <div className="item-form-grid">
              <label className="item-form-inline">
                <input
                  type="checkbox"
                  checked={form.is_service}
                  onChange={(e) => updateItemForm(target, { is_service: e.target.checked })}
                />
                <span>Is service</span>
              </label>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <section className="ui-card">
      <div className="items-header">
        <div>
          <h2 className="ui-title">Items</h2>
          <p className="ui-muted purchase-orders-copy">
            Essentials stay front and center. Pricing, inventory, classification, and advanced settings open only when needed.
          </p>
        </div>
        <div className="items-header-actions">
          <label className="ui-checkline">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
            />
            Include deleted
          </label>
          <button className="ui-btn ui-btn-primary" type="button" onClick={() => setCreateOpen(true)}>
            New item
          </button>
        </div>
      </div>

      {loading ? (
        <div className="ui-loading">Loading data...</div>
      ) : (
        <DataTable<ItemRecord>
          rows={rows}
          columns={[
            { key: "name", label: "Name", sortable: true },
            { key: "sku", label: "SKU", sortable: true },
            { key: "status", label: "Status", sortable: true },
            { key: "selling_price", label: "Sell Price", sortable: true },
            { key: "quantity_on_hand", label: "Qty", sortable: true },
            { key: "category_id", label: "Category", sortable: true }
          ]}
          searchText={search}
          onSearchTextChange={setSearch}
          renderActions={(row) => (
            <>
              <button className="ui-btn ui-btn-secondary" type="button" onClick={() => openEdit(row)}>
                Edit
              </button>
              {!row.deleted_at && (
                <button
                  className="ui-btn ui-btn-danger"
                  type="button"
                  onClick={() => patchItem(row.id, { deleted_at: new Date().toISOString() })}
                >
                  Soft Delete
                </button>
              )}
              {row.deleted_at && (
                <button
                  className="ui-btn ui-btn-primary"
                  type="button"
                  onClick={() =>
                    withAuth(session, setSession, `/erp/items/${row.id}/restore`, {
                      method: "POST",
                      body: JSON.stringify({})
                    })
                      .then(async () => {
                        notify("success", "Items: record restored");
                        await load();
                      })
                      .catch((error: unknown) => {
                        notify("error", error instanceof Error ? error.message : "Restore failed");
                      })
                  }
                >
                  Restore
                </button>
              )}
            </>
          )}
        />
      )}

      {createOpen && (
        <div className="ui-modal-backdrop" role="dialog" aria-modal="true">
          <form className="ui-modal-card item-modal-card" onSubmit={createItem}>
            <div className="item-modal-topbar">
              <div>
                <h3>Create Item</h3>
                <p className="ui-muted supplier-modal-copy">Start with essentials and open the rest only when you need them.</p>
              </div>
              <button className="ui-btn ui-btn-secondary" type="button" onClick={() => setCreateOpen(false)}>
                Close
              </button>
            </div>
            {renderItemForm("create", createForm, createSections)}
            <div className="purchase-order-actions">
              <button className="ui-btn ui-btn-primary" type="submit">
                Save item
              </button>
              <button className="ui-btn ui-btn-secondary" type="button" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {editing && (
        <div className="ui-modal-backdrop" role="dialog" aria-modal="true">
          <form className="ui-modal-card item-modal-card" onSubmit={updateItem}>
            <div className="item-modal-topbar">
              <div>
                <h3>Edit Item</h3>
                <p className="ui-muted supplier-modal-copy">Tune pricing, inventory, and metadata without burying the basics.</p>
              </div>
              <button className="ui-btn ui-btn-secondary" type="button" onClick={() => setEditing(null)}>
                Close
              </button>
            </div>
            {renderItemForm("edit", editForm, editSections)}
            <div className="purchase-order-actions">
              <button className="ui-btn ui-btn-primary" type="submit">
                Save changes
              </button>
              <button className="ui-btn ui-btn-secondary" type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function PurchaseOrdersPage({
  session,
  setSession,
  notify
}: {
  session: SessionState;
  setSession: (next: SessionState | null) => void;
  notify: (type: "success" | "error", message: string) => void;
}) {
  const [rows, setRows] = React.useState<PurchaseOrderRecord[]>([]);
  const [suppliers, setSuppliers] = React.useState<SupplierRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [includeDeleted, setIncludeDeleted] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [createForm, setCreateForm] = React.useState<PurchaseOrderFormState>({
    supplier_id: "",
    status: "DRAFT"
  });
  const [editing, setEditing] = React.useState<PurchaseOrderRecord | null>(null);
  const [editForm, setEditForm] = React.useState<PurchaseOrderFormState>({
    supplier_id: "",
    status: "DRAFT"
  });
  const [supplierPickerOpen, setSupplierPickerOpen] = React.useState<"create" | "edit" | null>(null);

  const supplierMap = React.useMemo(
    () =>
      new Map(
        suppliers.map((supplier) => [
          supplier.id,
          supplier.name?.trim() || supplier.email?.trim() || "Unnamed supplier"
        ])
      ),
    [suppliers]
  );

  const supplierOptions = React.useMemo(
    () =>
      suppliers.map((supplier) => ({
        id: supplier.id,
        name: supplier.name?.trim() || "Unnamed supplier",
        meta: [supplier.email, supplier.phone].filter(Boolean).join(" • ")
      })),
    [suppliers]
  );

  const rowsWithSupplierNames = React.useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        supplier_name: row.supplier_id ? supplierMap.get(String(row.supplier_id)) || "Unknown supplier" : "No supplier"
      })),
    [rows, supplierMap]
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = includeDeleted ? "?includeDeleted=true" : "";
      const [purchaseOrders, visibleSuppliers] = await Promise.all([
        withAuth<PurchaseOrderRecord[]>(session, setSession, `/erp/purchase-orders${query}`),
        withAuth<SupplierRecord[]>(session, setSession, "/erp/suppliers")
      ]);
      setRows(purchaseOrders);
      setSuppliers(visibleSuppliers);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  }, [includeDeleted, notify, session, setSession]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function updateForm(
    target: "create" | "edit",
    patch: Partial<PurchaseOrderFormState>
  ) {
    if (target === "create") {
      setCreateForm((prev) => ({ ...prev, ...patch }));
      return;
    }
    setEditForm((prev) => ({ ...prev, ...patch }));
  }

  function startEdit(row: PurchaseOrderRecord) {
    setEditing(row);
    setEditForm({
      supplier_id: row.supplier_id ? String(row.supplier_id) : "",
      status: row.status ? String(row.status) : "DRAFT"
    });
  }

  function getSupplierName(supplierId: string) {
    return supplierMap.get(supplierId) || "Unknown supplier";
  }

  function renderSupplierPicker(target: "create" | "edit") {
    const currentSupplierId = target === "create" ? createForm.supplier_id : editForm.supplier_id;

    return (
      <div className="supplier-picker">
        <div className="supplier-picker-row">
          <select
            className="ui-input"
            value={currentSupplierId}
            onChange={(e) => updateForm(target, { supplier_id: e.target.value })}
          >
            <option value="">No supplier selected</option>
            {supplierOptions.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          <button
            className="ui-btn ui-btn-secondary"
            type="button"
            onClick={() => setSupplierPickerOpen(target)}
          >
            Browse suppliers
          </button>
        </div>
        <p className="ui-muted supplier-picker-hint">
          {currentSupplierId
            ? `Selected: ${getSupplierName(currentSupplierId)}`
            : suppliers.length > 0
              ? "Pick a supplier by name instead of typing an internal ID."
              : "No suppliers available yet. Create one in Suppliers first."}
        </p>
      </div>
    );
  }

  async function createPurchaseOrder(e: React.FormEvent) {
    e.preventDefault();
    try {
      await withAuth(session, setSession, "/erp/purchase-orders", {
        method: "POST",
        body: JSON.stringify({
          supplier_id: createForm.supplier_id || undefined,
          status: createForm.status || undefined
        })
      });
      notify("success", "Purchase Orders: record created");
      setCreateForm({ supplier_id: "", status: "DRAFT" });
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Create failed");
    }
  }

  async function updatePurchaseOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) {
      return;
    }
    try {
      await withAuth(session, setSession, `/erp/purchase-orders/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          supplier_id: editForm.supplier_id || null,
          status: editForm.status || undefined
        })
      });
      notify("success", "Purchase Orders: record updated");
      setEditing(null);
      setEditForm({ supplier_id: "", status: "DRAFT" });
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Update failed");
    }
  }

  async function patchPurchaseOrder(id: string, payload: Record<string, unknown>) {
    try {
      await withAuth(session, setSession, `/erp/purchase-orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      notify("success", "Purchase Orders: record updated");
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Update failed");
    }
  }

  return (
    <section className="ui-card">
      <div className="purchase-orders-header">
        <div>
          <h2 className="ui-title">Purchase Orders</h2>
          <p className="ui-muted purchase-orders-copy">
            Choose a supplier by name. The app handles the internal supplier ID for you.
          </p>
        </div>
        <label className="ui-checkline">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
          />
          Include deleted
        </label>
      </div>

      <form className="ui-form purchase-order-form" onSubmit={createPurchaseOrder}>
        <div className="purchase-order-field">
          <span className="purchase-order-label">Supplier</span>
          {renderSupplierPicker("create")}
        </div>
        <label className="purchase-order-field">
          <span className="purchase-order-label">Status</span>
          <select
            className="ui-input"
            value={createForm.status}
            onChange={(e) => updateForm("create", { status: e.target.value })}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="SENT">SENT</option>
            <option value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </label>
        <button className="ui-btn ui-btn-primary purchase-order-submit" type="submit">
          Create
        </button>
      </form>

      {editing && (
        <form className="ui-form ui-form-edit purchase-order-form" onSubmit={updatePurchaseOrder}>
          <div className="purchase-order-field">
            <span className="purchase-order-label">Supplier</span>
            {renderSupplierPicker("edit")}
          </div>
          <label className="purchase-order-field">
            <span className="purchase-order-label">Status</span>
            <select
              className="ui-input"
              value={editForm.status}
              onChange={(e) => updateForm("edit", { status: e.target.value })}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="SENT">SENT</option>
              <option value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </label>
          <div className="purchase-order-actions">
            <button className="ui-btn ui-btn-primary" type="submit">
              Save
            </button>
            <button
              className="ui-btn ui-btn-secondary"
              type="button"
              onClick={() => {
                setEditing(null);
                setEditForm({ supplier_id: "", status: "DRAFT" });
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="ui-loading">Loading data...</div>
      ) : (
        <DataTable<PurchaseOrderRecord>
          rows={rowsWithSupplierNames}
          columns={[
            { key: "supplier_name", label: "Supplier", sortable: true },
            { key: "status", label: "Status", sortable: true },
            { key: "created_at", label: "Created At", sortable: true }
          ]}
          searchText={search}
          onSearchTextChange={setSearch}
          renderActions={(row) => (
            <>
              <button className="ui-btn ui-btn-secondary" type="button" onClick={() => startEdit(row)}>
                Edit
              </button>
              {!row.deleted_at && (
                <button
                  className="ui-btn ui-btn-danger"
                  type="button"
                  onClick={() => patchPurchaseOrder(row.id, { deleted_at: new Date().toISOString() })}
                >
                  Soft Delete
                </button>
              )}
              {row.deleted_at && (
                <button
                  className="ui-btn ui-btn-primary"
                  type="button"
                  onClick={() =>
                    withAuth(session, setSession, `/erp/purchase-orders/${row.id}/restore`, {
                      method: "POST",
                      body: JSON.stringify({})
                    })
                      .then(async () => {
                        notify("success", "Purchase Orders: record restored");
                        await load();
                      })
                      .catch((error: unknown) => {
                        notify("error", error instanceof Error ? error.message : "Restore failed");
                      })
                  }
                >
                  Restore
                </button>
              )}
            </>
          )}
        />
      )}

      {supplierPickerOpen && (
        <div className="ui-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ui-modal-card supplier-modal">
            <div className="supplier-modal-header">
              <div>
                <h3>Select Supplier</h3>
                <p className="ui-muted supplier-modal-copy">
                  Showing suppliers available to this signed-in user.
                </p>
              </div>
              <button
                className="ui-btn ui-btn-secondary"
                type="button"
                onClick={() => setSupplierPickerOpen(null)}
              >
                Close
              </button>
            </div>
            {supplierOptions.length === 0 ? (
              <p className="ui-empty">No suppliers found yet. Create one from the Suppliers page first.</p>
            ) : (
              <div className="supplier-grid">
                {supplierOptions.map((supplier) => (
                  <button
                    key={supplier.id}
                    className={`supplier-option${(
                      supplierPickerOpen === "create" ? createForm.supplier_id : editForm.supplier_id
                    ) === supplier.id
                      ? " supplier-option-active"
                      : ""}`}
                    type="button"
                    onClick={() => {
                      updateForm(supplierPickerOpen, { supplier_id: supplier.id });
                      setSupplierPickerOpen(null);
                    }}
                  >
                    <strong>{supplier.name}</strong>
                    <span>{supplier.meta || "No email or phone saved"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function ERPApp({
  session,
  setSession
}: {
  session: SessionState;
  setSession: (next: SessionState | null) => void;
}) {
  const navigate = useNavigate();
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showBugDialog, setShowBugDialog] = React.useState(false);
  const [bugBusy, setBugBusy] = React.useState(false);
  const [bugForm, setBugForm] = React.useState<BugReportForm>({
    title: "",
    summary: "",
    steps: "",
    expected: "",
    actual: "",
    severity: "medium",
    module: "general",
    contactEmail: "",
    screenshotUrl: ""
  });
  const notify = React.useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2600);
  }, []);

  if (!hasRole(session, "Admin", "ERP Manager", "Staff")) {
    return (
      <main style={{ padding: "24px" }}>
        <p>Your account does not have ERP access.</p>
        <button
          className="ui-btn ui-btn-secondary"
          type="button"
          onClick={() => {
            setSession(null);
            navigate("/login");
          }}
        >
          Switch account
        </button>
      </main>
    );
  }

  async function submitBugReport(e: React.FormEvent) {
    e.preventDefault();
    setBugBusy(true);
    try {
      const response = await withAuth<{ issueUrl: string; issueNumber: number }>(
        session,
        setSession,
        "/bugs/report",
        {
          method: "POST",
          body: JSON.stringify({
            title: bugForm.title,
            summary: bugForm.summary,
            steps: bugForm.steps
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
            expected: bugForm.expected,
            actual: bugForm.actual,
            severity: bugForm.severity,
            module: bugForm.module,
            contactEmail: bugForm.contactEmail || undefined,
            screenshotUrl: bugForm.screenshotUrl || undefined,
            sourceApp: "ERP",
            route: window.location.hash.replace(/^#/, "") || "/",
            pageUrl: window.location.href,
            appVersion: APP_RELEASE_VERSION,
            userAgent: navigator.userAgent
          })
        }
      );
      notify("success", `Bug submitted: issue #${response.issueNumber}`);
      setShowBugDialog(false);
      setBugForm({
        title: "",
        summary: "",
        steps: "",
        expected: "",
        actual: "",
        severity: "medium",
        module: "general",
        contactEmail: "",
        screenshotUrl: ""
      });
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Bug submission failed");
    } finally {
      setBugBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <h2>SPHINCS ERP</h2>
        <p className="ui-muted">{session.user.email}</p>
        <Link to="/items">Items</Link>
        <Link to="/suppliers">Suppliers</Link>
        <Link to="/purchase-orders">Purchase Orders</Link>
      </aside>
      <section className="app-main">
        <header className="app-topbar">
          <strong>ERP Operations</strong>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <nav className="app-topnav">
              <a href="../">Home</a>
              <a href="../erp/">ERP</a>
              <a href="../crm/">CRM</a>
            </nav>
            <button
              className="ui-btn ui-btn-secondary"
              type="button"
              onClick={() => setShowBugDialog(true)}
            >
              Report Bug
            </button>
            <button
              className="ui-btn ui-btn-secondary"
              type="button"
              onClick={() => {
                setSession(null);
                navigate("/login");
              }}
            >
              Logout
            </button>
          </div>
        </header>
        <SystemStatusCard />
        {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
        {showBugDialog && (
          <div className="ui-modal-backdrop" role="dialog" aria-modal="true">
            <form className="ui-modal-card" onSubmit={submitBugReport}>
              <h3>Report Bug</h3>
              <input
                className="ui-input"
                placeholder="Short title"
                value={bugForm.title}
                onChange={(e) => setBugForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
              <textarea
                className="ui-input"
                placeholder="Summary"
                value={bugForm.summary}
                onChange={(e) => setBugForm((prev) => ({ ...prev, summary: e.target.value }))}
                required
              />
              <textarea
                className="ui-input"
                placeholder="Steps to reproduce (one step per line)"
                value={bugForm.steps}
                onChange={(e) => setBugForm((prev) => ({ ...prev, steps: e.target.value }))}
                required
              />
              <textarea
                className="ui-input"
                placeholder="Expected result"
                value={bugForm.expected}
                onChange={(e) => setBugForm((prev) => ({ ...prev, expected: e.target.value }))}
                required
              />
              <textarea
                className="ui-input"
                placeholder="Actual result"
                value={bugForm.actual}
                onChange={(e) => setBugForm((prev) => ({ ...prev, actual: e.target.value }))}
                required
              />
              <select
                className="ui-input"
                value={bugForm.severity}
                onChange={(e) =>
                  setBugForm((prev) => ({
                    ...prev,
                    severity: e.target.value as BugReportForm["severity"]
                  }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <input
                className="ui-input"
                placeholder="Module/Page (e.g. suppliers)"
                value={bugForm.module}
                onChange={(e) => setBugForm((prev) => ({ ...prev, module: e.target.value }))}
                required
              />
              <input
                className="ui-input"
                placeholder="Contact email (optional)"
                value={bugForm.contactEmail}
                onChange={(e) => setBugForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
              />
              <input
                className="ui-input"
                placeholder="Screenshot URL (optional)"
                value={bugForm.screenshotUrl}
                onChange={(e) => setBugForm((prev) => ({ ...prev, screenshotUrl: e.target.value }))}
              />
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  className="ui-btn ui-btn-secondary"
                  type="button"
                  onClick={() => setShowBugDialog(false)}
                  disabled={bugBusy}
                >
                  Cancel
                </button>
                <button className="ui-btn ui-btn-primary" type="submit" disabled={bugBusy}>
                  {bugBusy ? "Submitting..." : "Submit bug"}
                </button>
              </div>
            </form>
          </div>
        )}
        <Routes>
          <Route
            path="/items"
            element={
              <ItemsPage
                session={session}
                setSession={setSession}
                notify={notify}
              />
            }
          />
          <Route
            path="/suppliers"
            element={
              <ResourcePage
                session={session}
                setSession={setSession}
                endpoint="/erp/suppliers"
                title="Suppliers"
                fields={[
                  { key: "name", label: "Name" },
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Phone" }
                ]}
                notify={notify}
              />
            }
          />
          <Route
            path="/purchase-orders"
            element={
              <PurchaseOrdersPage
                session={session}
                setSession={setSession}
                notify={notify}
              />
            }
          />
          <Route path="*" element={<Navigate to="/items" replace />} />
        </Routes>
      </section>
    </main>
  );
}

export function RootApp() {
  const { session, setSession } = useSessionState();
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={
            session ? <Navigate to="/items" replace /> : <LoginPage setSession={setSession} />
          }
        />
        <Route
          path="/*"
          element={
            session ? <ERPApp session={session} setSession={setSession} /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </HashRouter>
  );
}
