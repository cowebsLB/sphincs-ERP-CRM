import React from "react";
import { HashRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { ApiClient, AuthSessionExpiredError, type SessionState } from "@sphincs/api-client";
import { DataTable } from "@sphincs/ui-core";
import "@sphincs/ui-core/ui.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";
const API_ROOT = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
const STORAGE_KEY = "sphincs.session";
const LEGACY_STORAGE_KEYS = ["sphincs.erp.session", "sphincs.crm.session"] as const;
const APP_RELEASE_VERSION = "Beta V1.10.0";
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
  supplier_code?: string | null;
  status?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  country?: string | null;
  city?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  postal_code?: string | null;
  payment_terms?: string | null;
  currency?: string | null;
  tax_id?: string | null;
  vat_number?: string | null;
  credit_limit?: string | number | null;
  balance?: string | number | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  notes?: string | null;
  rating?: number | null;
  preferred_supplier?: boolean | null;
};
type PurchaseOrderRecord = RecordData & {
  po_number?: string | null;
  supplier_id?: string | null;
  supplier_name?: string;
  status?: string | null;
  order_date?: string | null;
  expected_delivery_date?: string | null;
  payment_terms?: string | null;
  subtotal?: number | string | null;
  total_tax?: number | string | null;
  total_discount?: number | string | null;
  grand_total?: number | string | null;
  payment_status?: string | null;
  notes?: string | null;
  shipping_address?: string | null;
  shipping_method?: string | null;
  tracking_number?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  line_items?: PurchaseOrderLineItemRecord[] | null;
};

type PurchaseOrderLineItemRecord = {
  id?: string;
  item_id?: string | null;
  description?: string | null;
  quantity?: number | null;
  unit_cost?: number | string | null;
  tax_rate?: number | string | null;
  discount?: number | string | null;
  line_total?: number | string | null;
  received_quantity?: number | null;
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
  po_number: string;
  supplier_id: string;
  status: string;
  order_date: string;
  expected_delivery_date: string;
  payment_terms: string;
  payment_status: string;
  notes: string;
  shipping_address: string;
  shipping_method: string;
  tracking_number: string;
  approved_by: string;
  approved_at: string;
  line_items: PurchaseOrderLineItemFormState[];
};

type PurchaseOrderLineItemFormState = {
  item_id: string;
  description: string;
  quantity: string;
  unit_cost: string;
  tax_rate: string;
  discount: string;
  received_quantity: string;
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

type SupplierFormState = {
  name: string;
  supplier_code: string;
  status: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  address_line_1: string;
  address_line_2: string;
  postal_code: string;
  payment_terms: string;
  currency: string;
  tax_id: string;
  vat_number: string;
  credit_limit: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  notes: string;
  rating: string;
  preferred_supplier: boolean;
  website: string;
  mobile: string;
};

type ItemSkuStatus = {
  state: "idle" | "available" | "duplicate";
  message: string;
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
  let result;
  try {
    result = await client.authorized<T>(path, session, init);
  } catch (error) {
    if (error instanceof AuthSessionExpiredError) {
      setSession(null);
    }
    throw error;
  }
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

function createDefaultSupplierForm(): SupplierFormState {
  return {
    name: "",
    supplier_code: "",
    status: "ACTIVE",
    phone: "",
    email: "",
    country: "",
    city: "",
    address_line_1: "",
    address_line_2: "",
    postal_code: "",
    payment_terms: "Net 30",
    currency: "USD",
    tax_id: "",
    vat_number: "",
    credit_limit: "0",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    notes: "",
    rating: "",
    preferred_supplier: false,
    website: "",
    mobile: ""
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

function toSupplierFormState(supplier?: SupplierRecord | null): SupplierFormState {
  if (!supplier) {
    return createDefaultSupplierForm();
  }

  return {
    name: String(supplier.name ?? ""),
    supplier_code: String(supplier.supplier_code ?? ""),
    status: String(supplier.status ?? "ACTIVE"),
    phone: String(supplier.phone ?? ""),
    email: String(supplier.email ?? ""),
    country: String(supplier.country ?? ""),
    city: String(supplier.city ?? ""),
    address_line_1: String(supplier.address_line_1 ?? ""),
    address_line_2: String(supplier.address_line_2 ?? ""),
    postal_code: String(supplier.postal_code ?? ""),
    payment_terms: String(supplier.payment_terms ?? "Net 30"),
    currency: String(supplier.currency ?? "USD"),
    tax_id: String(supplier.tax_id ?? ""),
    vat_number: String(supplier.vat_number ?? ""),
    credit_limit: String(supplier.credit_limit ?? "0"),
    contact_name: String(supplier.contact_name ?? ""),
    contact_email: String(supplier.contact_email ?? ""),
    contact_phone: String(supplier.contact_phone ?? ""),
    notes: String(supplier.notes ?? ""),
    rating: supplier.rating === null || supplier.rating === undefined ? "" : String(supplier.rating),
    preferred_supplier: Boolean(supplier.preferred_supplier ?? false),
    website: String(supplier.website ?? ""),
    mobile: String(supplier.mobile ?? "")
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

function buildSupplierPayload(form: SupplierFormState) {
  return {
    name: form.name,
    supplier_code: form.supplier_code || undefined,
    status: form.status,
    phone: form.phone || undefined,
    email: form.email || undefined,
    country: form.country || undefined,
    city: form.city || undefined,
    address_line_1: form.address_line_1 || undefined,
    address_line_2: form.address_line_2 || undefined,
    postal_code: form.postal_code || undefined,
    payment_terms: form.payment_terms || undefined,
    currency: form.currency || undefined,
    tax_id: form.tax_id || undefined,
    vat_number: form.vat_number || undefined,
    credit_limit: form.credit_limit || undefined,
    contact_name: form.contact_name || undefined,
    contact_email: form.contact_email || undefined,
    contact_phone: form.contact_phone || undefined,
    notes: form.notes || undefined,
    rating: form.rating || undefined,
    preferred_supplier: form.preferred_supplier,
    website: form.website || undefined,
    mobile: form.mobile || undefined
  };
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().slice(0, 10);
}

function createDefaultPurchaseOrderLineItem(): PurchaseOrderLineItemFormState {
  return {
    item_id: "",
    description: "",
    quantity: "1",
    unit_cost: "0",
    tax_rate: "0",
    discount: "0",
    received_quantity: "0"
  };
}

function createDefaultPurchaseOrderForm(): PurchaseOrderFormState {
  return {
    po_number: "",
    supplier_id: "",
    status: "DRAFT",
    order_date: toDateInputValue(new Date().toISOString()),
    expected_delivery_date: "",
    payment_terms: "Net 30",
    payment_status: "UNPAID",
    notes: "",
    shipping_address: "",
    shipping_method: "",
    tracking_number: "",
    approved_by: "",
    approved_at: "",
    line_items: [createDefaultPurchaseOrderLineItem()]
  };
}

function toPurchaseOrderFormState(order?: PurchaseOrderRecord | null): PurchaseOrderFormState {
  if (!order) {
    return createDefaultPurchaseOrderForm();
  }

  return {
    po_number: String(order.po_number ?? ""),
    supplier_id: String(order.supplier_id ?? ""),
    status: String(order.status ?? "DRAFT"),
    order_date: toDateInputValue(order.order_date ?? order.created_at ?? null),
    expected_delivery_date: toDateInputValue(order.expected_delivery_date ?? null),
    payment_terms: String(order.payment_terms ?? "Net 30"),
    payment_status: String(order.payment_status ?? "UNPAID"),
    notes: String(order.notes ?? ""),
    shipping_address: String(order.shipping_address ?? ""),
    shipping_method: String(order.shipping_method ?? ""),
    tracking_number: String(order.tracking_number ?? ""),
    approved_by: String(order.approved_by ?? ""),
    approved_at: toDateInputValue(order.approved_at ?? null),
    line_items:
      order.line_items && order.line_items.length > 0
        ? order.line_items.map((item) => ({
            item_id: String(item.item_id ?? ""),
            description: String(item.description ?? ""),
            quantity: String(item.quantity ?? 1),
            unit_cost: String(item.unit_cost ?? 0),
            tax_rate: String(item.tax_rate ?? 0),
            discount: String(item.discount ?? 0),
            received_quantity: String(item.received_quantity ?? 0)
          }))
        : [createDefaultPurchaseOrderLineItem()]
  };
}

function buildPurchaseOrderPayload(form: PurchaseOrderFormState) {
  return {
    po_number: form.po_number || undefined,
    supplier_id: form.supplier_id || undefined,
    status: form.status,
    order_date: form.order_date || undefined,
    expected_delivery_date: form.expected_delivery_date || undefined,
    payment_terms: form.payment_terms || undefined,
    payment_status: form.payment_status || undefined,
    notes: form.notes || undefined,
    shipping_address: form.shipping_address || undefined,
    shipping_method: form.shipping_method || undefined,
    tracking_number: form.tracking_number || undefined,
    approved_by: form.approved_by || undefined,
    approved_at: form.approved_at || undefined,
    line_items: form.line_items.map((item) => ({
      item_id: item.item_id || undefined,
      description: item.description || undefined,
      quantity: item.quantity || "0",
      unit_cost: item.unit_cost || "0",
      tax_rate: item.tax_rate || "0",
      discount: item.discount || "0",
      received_quantity: item.received_quantity || "0"
    }))
  };
}

function computePurchaseOrderLineTotal(item: PurchaseOrderLineItemFormState) {
  const quantity = Number(item.quantity || 0);
  const unitCost = Number(item.unit_cost || 0);
  const taxRate = Number(item.tax_rate || 0);
  const discount = Number(item.discount || 0);
  const subtotal = quantity * unitCost;
  const tax = subtotal * (taxRate / 100);
  return Number((subtotal + tax - discount).toFixed(2));
}

function computePurchaseOrderSummary(form: PurchaseOrderFormState) {
  const subtotal = Number(
    form.line_items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_cost || 0), 0).toFixed(2)
  );
  const totalTax = Number(
    form.line_items
      .reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_cost || 0) * (Number(item.tax_rate || 0) / 100), 0)
      .toFixed(2)
  );
  const totalDiscount = Number(form.line_items.reduce((sum, item) => sum + Number(item.discount || 0), 0).toFixed(2));
  const grandTotal = Number((subtotal + totalTax - totalDiscount).toFixed(2));
  const partialDelivery = form.line_items.some(
    (item) => Number(item.received_quantity || 0) > 0 && Number(item.received_quantity || 0) < Number(item.quantity || 0)
  );
  return { subtotal, totalTax, totalDiscount, grandTotal, partialDelivery };
}

function slugifySkuPart(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 20);
}

function generateSkuFromName(name: string): string {
  const base = slugifySkuPart(name);
  return base ? `ITM-${base}` : "ITM-ITEM";
}

function formatItemValue(value: unknown, fallback = "Not set") {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : fallback;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  const normalized = String(value).trim();
  return normalized ? normalized : fallback;
}

function formatItemDate(value: unknown) {
  if (!value) {
    return "Not available";
  }
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }
  return parsed.toLocaleString();
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
  const [previewItem, setPreviewItem] = React.useState<ItemRecord | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ItemRecord | null>(null);
  const [createForm, setCreateForm] = React.useState<ItemFormState>(createDefaultItemForm);
  const [editForm, setEditForm] = React.useState<ItemFormState>(createDefaultItemForm);
  const [createSkuManual, setCreateSkuManual] = React.useState(false);
  const [editSkuManual, setEditSkuManual] = React.useState(false);
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

  const createSkuStatus = React.useMemo<ItemSkuStatus>(() => {
    const normalizedSku = createForm.sku.trim().toUpperCase();
    if (!normalizedSku) {
      return {
        state: "idle",
        message: "SKU will be auto-generated from the item name, and you can still edit it."
      };
    }

    const exists = rows.some((row) => String(row.sku ?? "").trim().toUpperCase() === normalizedSku);
    if (exists) {
      return { state: "duplicate", message: "Already exists for one of your items." };
    }

    return { state: "available", message: "Available" };
  }, [createForm.sku, rows]);

  const editSkuStatus = React.useMemo<ItemSkuStatus>(() => {
    const normalizedSku = editForm.sku.trim().toUpperCase();
    if (!editing || !normalizedSku) {
      return {
        state: "idle",
        message: "SKU stays editable here if you need to correct or improve it."
      };
    }

    const exists = rows.some(
      (row) => row.id !== editing.id && String(row.sku ?? "").trim().toUpperCase() === normalizedSku
    );
    if (exists) {
      return { state: "duplicate", message: "Already exists for one of your items." };
    }

    return { state: "available", message: "Available" };
  }, [editForm.sku, editing, rows]);

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
      const skuManual = target === "create" ? createSkuManual : editSkuManual;

      if (patch.name !== undefined && !skuManual) {
        next.sku = generateSkuFromName(patch.name);
      }
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
    setPreviewItem(null);
    setEditing(item);
    setEditForm(toItemFormState(item));
    setEditSkuManual(true);
    setEditSections({
      pricing: true,
      inventory: false,
      classification: false,
      advanced: false
    });
  }

  function openCreate() {
    setPreviewItem(null);
    setEditing(null);
    setCreateForm(createDefaultItemForm());
    setCreateSkuManual(false);
    setCreateSections({
      pricing: false,
      inventory: false,
      classification: false,
      advanced: false
    });
    setCreateOpen(true);
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
      setCreateSkuManual(false);
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
      setEditSkuManual(false);
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
    const skuStatus = target === "create" ? createSkuStatus : editSkuStatus;

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
                onChange={(e) => {
                  if (target === "create") {
                    setCreateSkuManual(true);
                  } else {
                    setEditSkuManual(true);
                  }
                  updateItemForm(target, { sku: e.target.value.toUpperCase() });
                }}
                placeholder="SKU"
                required
              />
              <small className="item-form-hint">SKU is auto-generated from the item name, but you can edit it anytime.</small>
              {skuStatus.state !== "idle" && (
                <small className={`item-form-status item-form-status-${skuStatus.state}`}>{skuStatus.message}</small>
              )}
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
          <button className="ui-btn ui-btn-primary" type="button" onClick={openCreate}>
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
          onRowClick={(row) => setPreviewItem(row)}
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

      {previewItem && (
        <div className="ui-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ui-modal-card item-preview-card">
            <div className="item-modal-topbar">
              <div>
                <h3>{formatItemValue(previewItem.name, "Unnamed item")}</h3>
                <p className="ui-muted supplier-modal-copy">Saved item snapshot for quick review before you edit.</p>
              </div>
              <button className="ui-btn ui-btn-secondary" type="button" onClick={() => setPreviewItem(null)}>
                Close
              </button>
            </div>

            <div className="item-preview-grid">
              <section className="item-preview-section">
                <h4>Essentials</h4>
                <dl className="item-preview-list">
                  <div>
                    <dt>SKU</dt>
                    <dd>{formatItemValue(previewItem.sku)}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{formatItemValue(previewItem.status)}</dd>
                  </div>
                  <div>
                    <dt>Selling Price</dt>
                    <dd>{formatItemValue(previewItem.selling_price)}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{formatItemValue(previewItem.category_id)}</dd>
                  </div>
                  <div>
                    <dt>Track Inventory</dt>
                    <dd>{formatItemValue(previewItem.track_inventory)}</dd>
                  </div>
                  <div>
                    <dt>Quantity On Hand</dt>
                    <dd>{formatItemValue(previewItem.quantity_on_hand)}</dd>
                  </div>
                </dl>
              </section>

              <section className="item-preview-section">
                <h4>Pricing</h4>
                <dl className="item-preview-list">
                  <div>
                    <dt>Cost Price</dt>
                    <dd>{formatItemValue(previewItem.cost_price)}</dd>
                  </div>
                  <div>
                    <dt>Currency</dt>
                    <dd>{formatItemValue(previewItem.currency)}</dd>
                  </div>
                  <div>
                    <dt>Tax Rate</dt>
                    <dd>{formatItemValue(previewItem.tax_rate)}</dd>
                  </div>
                  <div>
                    <dt>Discountable</dt>
                    <dd>{formatItemValue(previewItem.discountable)}</dd>
                  </div>
                </dl>
              </section>

              <section className="item-preview-section">
                <h4>Inventory</h4>
                <dl className="item-preview-list">
                  <div>
                    <dt>Reorder Level</dt>
                    <dd>{formatItemValue(previewItem.reorder_level)}</dd>
                  </div>
                  <div>
                    <dt>Max Stock Level</dt>
                    <dd>{formatItemValue(previewItem.max_stock_level)}</dd>
                  </div>
                  <div>
                    <dt>Unit Of Measure</dt>
                    <dd>{formatItemValue(previewItem.unit_of_measure)}</dd>
                  </div>
                  <div>
                    <dt>Barcode</dt>
                    <dd>{formatItemValue(previewItem.barcode)}</dd>
                  </div>
                  <div>
                    <dt>Is Service</dt>
                    <dd>{formatItemValue(previewItem.is_service)}</dd>
                  </div>
                </dl>
              </section>

              <section className="item-preview-section">
                <h4>Classification</h4>
                <dl className="item-preview-list">
                  <div>
                    <dt>Tags</dt>
                    <dd>{formatItemValue(previewItem.tags)}</dd>
                  </div>
                  <div>
                    <dt>Brand</dt>
                    <dd>{formatItemValue(previewItem.brand)}</dd>
                  </div>
                  <div>
                    <dt>Description</dt>
                    <dd>{formatItemValue(previewItem.description)}</dd>
                  </div>
                </dl>
              </section>

              <section className="item-preview-section">
                <h4>Record Info</h4>
                <dl className="item-preview-list">
                  <div>
                    <dt>Created</dt>
                    <dd>{formatItemDate(previewItem.created_at)}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{formatItemDate(previewItem.updated_at)}</dd>
                  </div>
                  <div>
                    <dt>Deleted</dt>
                    <dd>{formatItemDate(previewItem.deleted_at)}</dd>
                  </div>
                </dl>
              </section>
            </div>

            <div className="purchase-order-actions">
              <button className="ui-btn ui-btn-primary" type="button" onClick={() => openEdit(previewItem)}>
                Edit item
              </button>
              <button className="ui-btn ui-btn-secondary" type="button" onClick={() => setPreviewItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
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

function SuppliersPage({
  session,
  setSession,
  notify
}: {
  session: SessionState;
  setSession: (next: SessionState | null) => void;
  notify: (type: "success" | "error", message: string) => void;
}) {
  const [rows, setRows] = React.useState<SupplierRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [includeDeleted, setIncludeDeleted] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [previewSupplier, setPreviewSupplier] = React.useState<SupplierRecord | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SupplierRecord | null>(null);
  const [createForm, setCreateForm] = React.useState<SupplierFormState>(createDefaultSupplierForm);
  const [editForm, setEditForm] = React.useState<SupplierFormState>(createDefaultSupplierForm);
  const [createSections, setCreateSections] = React.useState({
    address: false,
    financial: false,
    contact: false,
    advanced: false
  });
  const [editSections, setEditSections] = React.useState({
    address: true,
    financial: true,
    contact: false,
    advanced: false
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = includeDeleted ? "?includeDeleted=true" : "";
      const data = await withAuth<SupplierRecord[]>(session, setSession, `/erp/suppliers${query}`);
      setRows(data);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, [includeDeleted, notify, session, setSession]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function updateSupplierForm(target: "create" | "edit", patch: Partial<SupplierFormState>) {
    const setForm = target === "create" ? setCreateForm : setEditForm;
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function toggleSupplierSection(
    target: "create" | "edit",
    section: "address" | "financial" | "contact" | "advanced"
  ) {
    const setSections = target === "create" ? setCreateSections : setEditSections;
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function openCreate() {
    setPreviewSupplier(null);
    setEditing(null);
    setCreateForm(createDefaultSupplierForm());
    setCreateSections({
      address: false,
      financial: false,
      contact: false,
      advanced: false
    });
    setCreateOpen(true);
  }

  function openEdit(supplier: SupplierRecord) {
    setPreviewSupplier(null);
    setEditing(supplier);
    setEditForm(toSupplierFormState(supplier));
    setEditSections({
      address: true,
      financial: true,
      contact: false,
      advanced: false
    });
  }

  async function createSupplier(e: React.FormEvent) {
    e.preventDefault();
    try {
      await withAuth(session, setSession, "/erp/suppliers", {
        method: "POST",
        body: JSON.stringify(buildSupplierPayload(createForm))
      });
      notify("success", "Suppliers: record created");
      setCreateOpen(false);
      setCreateForm(createDefaultSupplierForm());
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Create failed");
    }
  }

  async function updateSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) {
      return;
    }
    try {
      await withAuth(session, setSession, `/erp/suppliers/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify(buildSupplierPayload(editForm))
      });
      notify("success", "Suppliers: record updated");
      setEditing(null);
      setEditForm(createDefaultSupplierForm());
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Update failed");
    }
  }

  async function patchSupplier(id: string, payload: Record<string, unknown>) {
    try {
      await withAuth(session, setSession, `/erp/suppliers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      notify("success", "Suppliers: record updated");
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Update failed");
    }
  }

  function renderSupplierSectionToggle(
    target: "create" | "edit",
    section: "address" | "financial" | "contact" | "advanced",
    label: string,
    open: boolean
  ) {
    return (
      <button className="item-section-toggle" type="button" onClick={() => toggleSupplierSection(target, section)}>
        <strong>{label}</strong>
        <span>{open ? "Hide" : "Show"}</span>
      </button>
    );
  }

  function renderSupplierForm(
    target: "create" | "edit",
    form: SupplierFormState,
    sections: { address: boolean; financial: boolean; contact: boolean; advanced: boolean },
    balanceValue?: SupplierRecord["balance"]
  ) {
    return (
      <div className="item-modal-layout">
        <section className="item-form-block">
          <div className="item-form-header">
            <h3>Essentials</h3>
            <p className="ui-muted">Create the supplier profile first. The deeper business details can open only when needed.</p>
          </div>
          <div className="item-form-grid">
            <label className="item-form-field">
              <span>Name</span>
              <input
                className="ui-input"
                value={form.name}
                onChange={(e) => updateSupplierForm(target, { name: e.target.value })}
                placeholder="Supplier name"
                required
              />
            </label>
            <label className="item-form-field">
              <span>Supplier Code</span>
              <input
                className="ui-input"
                value={form.supplier_code}
                onChange={(e) => updateSupplierForm(target, { supplier_code: e.target.value.toUpperCase() })}
                placeholder="SUP-001"
              />
            </label>
            <label className="item-form-field">
              <span>Status</span>
              <select
                className="ui-input"
                value={form.status}
                onChange={(e) => updateSupplierForm(target, { status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="BLACKLISTED">BLACKLISTED</option>
              </select>
            </label>
            <label className="item-form-field">
              <span>Phone</span>
              <input
                className="ui-input"
                value={form.phone}
                onChange={(e) => updateSupplierForm(target, { phone: e.target.value })}
                placeholder="+961 ..."
              />
            </label>
            <label className="item-form-field">
              <span>Email</span>
              <input
                className="ui-input"
                type="email"
                value={form.email}
                onChange={(e) => updateSupplierForm(target, { email: e.target.value })}
                placeholder="supplier@example.com"
              />
            </label>
          </div>
        </section>

        <section className="item-form-block">
          {renderSupplierSectionToggle(target, "address", "Address", sections.address)}
          {sections.address && (
            <div className="item-form-grid">
              <label className="item-form-field">
                <span>Country</span>
                <input className="ui-input" value={form.country} onChange={(e) => updateSupplierForm(target, { country: e.target.value })} />
              </label>
              <label className="item-form-field">
                <span>City</span>
                <input className="ui-input" value={form.city} onChange={(e) => updateSupplierForm(target, { city: e.target.value })} />
              </label>
              <label className="item-form-field item-form-field-wide">
                <span>Address Line 1</span>
                <input className="ui-input" value={form.address_line_1} onChange={(e) => updateSupplierForm(target, { address_line_1: e.target.value })} />
              </label>
              <label className="item-form-field item-form-field-wide">
                <span>Address Line 2</span>
                <input className="ui-input" value={form.address_line_2} onChange={(e) => updateSupplierForm(target, { address_line_2: e.target.value })} />
              </label>
              <label className="item-form-field">
                <span>Postal Code</span>
                <input className="ui-input" value={form.postal_code} onChange={(e) => updateSupplierForm(target, { postal_code: e.target.value })} />
              </label>
            </div>
          )}
        </section>

        <section className="item-form-block">
          {renderSupplierSectionToggle(target, "financial", "Financial", sections.financial)}
          {sections.financial && (
            <>
              <div className="item-form-grid">
                <label className="item-form-field">
                  <span>Payment Terms</span>
                  <select
                    className="ui-input"
                    value={form.payment_terms}
                    onChange={(e) => updateSupplierForm(target, { payment_terms: e.target.value })}
                  >
                    <option value="Net 7">Net 7</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Due on receipt">Due on receipt</option>
                    <option value="Custom">Custom</option>
                  </select>
                </label>
                <label className="item-form-field">
                  <span>Currency</span>
                  <input
                    className="ui-input"
                    value={form.currency}
                    onChange={(e) => updateSupplierForm(target, { currency: e.target.value.toUpperCase() })}
                  />
                </label>
                <label className="item-form-field">
                  <span>Tax ID</span>
                  <input className="ui-input" value={form.tax_id} onChange={(e) => updateSupplierForm(target, { tax_id: e.target.value })} />
                </label>
                <label className="item-form-field">
                  <span>VAT Number</span>
                  <input className="ui-input" value={form.vat_number} onChange={(e) => updateSupplierForm(target, { vat_number: e.target.value })} />
                </label>
                <label className="item-form-field">
                  <span>Credit Limit</span>
                  <input
                    className="ui-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.credit_limit}
                    onChange={(e) => updateSupplierForm(target, { credit_limit: e.target.value })}
                  />
                </label>
              </div>
              <div className="supplier-readonly-panel">
                <strong>Internal financial snapshot</strong>
                <p className="ui-muted">Balance is read-only here so accounting values stay connected to system activity rather than manual edits.</p>
                <span className="supplier-readonly-value">{formatItemValue(balanceValue ?? 0, "0")}</span>
              </div>
            </>
          )}
        </section>

        <section className="item-form-block">
          {renderSupplierSectionToggle(target, "contact", "Contact Person", sections.contact)}
          {sections.contact && (
            <div className="item-form-grid">
              <label className="item-form-field">
                <span>Contact Name</span>
                <input className="ui-input" value={form.contact_name} onChange={(e) => updateSupplierForm(target, { contact_name: e.target.value })} />
              </label>
              <label className="item-form-field">
                <span>Contact Email</span>
                <input
                  className="ui-input"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => updateSupplierForm(target, { contact_email: e.target.value })}
                />
              </label>
              <label className="item-form-field">
                <span>Contact Phone</span>
                <input className="ui-input" value={form.contact_phone} onChange={(e) => updateSupplierForm(target, { contact_phone: e.target.value })} />
              </label>
            </div>
          )}
        </section>

        <section className="item-form-block">
          {renderSupplierSectionToggle(target, "advanced", "Advanced / Internal", sections.advanced)}
          {sections.advanced && (
            <>
              <p className="supplier-internal-note">Use this section for internal notes and preference flags, not primary supplier onboarding.</p>
              <div className="item-form-grid">
                <label className="item-form-field item-form-field-wide">
                  <span>Notes</span>
                  <textarea className="ui-input item-textarea" value={form.notes} onChange={(e) => updateSupplierForm(target, { notes: e.target.value })} />
                </label>
                <label className="item-form-field">
                  <span>Rating</span>
                  <input
                    className="ui-input"
                    type="number"
                    min="0"
                    max="5"
                    step="1"
                    value={form.rating}
                    onChange={(e) => updateSupplierForm(target, { rating: e.target.value })}
                  />
                </label>
                <label className="item-form-field">
                  <span>Website</span>
                  <input className="ui-input" value={form.website} onChange={(e) => updateSupplierForm(target, { website: e.target.value })} />
                </label>
                <label className="item-form-field">
                  <span>Mobile</span>
                  <input className="ui-input" value={form.mobile} onChange={(e) => updateSupplierForm(target, { mobile: e.target.value })} />
                </label>
                <label className="item-form-inline">
                  <input
                    type="checkbox"
                    checked={form.preferred_supplier}
                    onChange={(e) => updateSupplierForm(target, { preferred_supplier: e.target.checked })}
                  />
                  <span>Preferred supplier</span>
                </label>
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  return (
    <section className="ui-card">
      <div className="items-header">
        <div>
          <h2 className="ui-title">Suppliers</h2>
          <p className="ui-muted purchase-orders-copy">
            Supplier profiles feed purchase orders and future vendor relationships, so the record needs clean essentials up front and connected business details underneath.
          </p>
        </div>
        <div className="items-header-actions">
          <label className="ui-checkline">
            <input type="checkbox" checked={includeDeleted} onChange={(e) => setIncludeDeleted(e.target.checked)} />
            Include deleted
          </label>
          <button className="ui-btn ui-btn-primary" type="button" onClick={openCreate}>
            New supplier
          </button>
        </div>
      </div>

      {loading ? (
        <div className="ui-loading">Loading data...</div>
      ) : (
        <DataTable<SupplierRecord>
          rows={rows}
          columns={[
            { key: "name", label: "Name", sortable: true },
            { key: "supplier_code", label: "Code", sortable: true },
            { key: "status", label: "Status", sortable: true },
            { key: "phone", label: "Phone", sortable: true },
            { key: "email", label: "Email", sortable: true },
            { key: "contact_name", label: "Contact", sortable: true }
          ]}
          searchText={search}
          onSearchTextChange={setSearch}
          onRowClick={(row) => setPreviewSupplier(row)}
          renderActions={(row) => (
            <>
              <button className="ui-btn ui-btn-secondary" type="button" onClick={() => openEdit(row)}>
                Edit
              </button>
              {!row.deleted_at && (
                <button
                  className="ui-btn ui-btn-danger"
                  type="button"
                  onClick={() => patchSupplier(row.id, { deleted_at: new Date().toISOString() })}
                >
                  Soft Delete
                </button>
              )}
              {row.deleted_at && (
                <button
                  className="ui-btn ui-btn-primary"
                  type="button"
                  onClick={() =>
                    withAuth(session, setSession, `/erp/suppliers/${row.id}/restore`, {
                      method: "POST",
                      body: JSON.stringify({})
                    })
                      .then(async () => {
                        notify("success", "Suppliers: record restored");
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

      {previewSupplier && (
        <div className="ui-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ui-modal-card item-preview-card">
            <div className="item-modal-topbar">
              <div>
                <h3>{formatItemValue(previewSupplier.name, "Unnamed supplier")}</h3>
                <p className="ui-muted supplier-modal-copy">Saved supplier profile connected to purchasing and vendor operations.</p>
              </div>
              <button className="ui-btn ui-btn-secondary" type="button" onClick={() => setPreviewSupplier(null)}>
                Close
              </button>
            </div>

            <div className="item-preview-grid">
              <section className="item-preview-section">
                <h4>Essentials</h4>
                <dl className="item-preview-list">
                  <div><dt>Code</dt><dd>{formatItemValue(previewSupplier.supplier_code)}</dd></div>
                  <div><dt>Status</dt><dd>{formatItemValue(previewSupplier.status)}</dd></div>
                  <div><dt>Phone</dt><dd>{formatItemValue(previewSupplier.phone)}</dd></div>
                  <div><dt>Email</dt><dd>{formatItemValue(previewSupplier.email)}</dd></div>
                  <div><dt>Preferred</dt><dd>{formatItemValue(previewSupplier.preferred_supplier)}</dd></div>
                </dl>
              </section>

              <section className="item-preview-section">
                <h4>Address</h4>
                <dl className="item-preview-list">
                  <div><dt>Country</dt><dd>{formatItemValue(previewSupplier.country)}</dd></div>
                  <div><dt>City</dt><dd>{formatItemValue(previewSupplier.city)}</dd></div>
                  <div><dt>Address 1</dt><dd>{formatItemValue(previewSupplier.address_line_1)}</dd></div>
                  <div><dt>Address 2</dt><dd>{formatItemValue(previewSupplier.address_line_2)}</dd></div>
                  <div><dt>Postal Code</dt><dd>{formatItemValue(previewSupplier.postal_code)}</dd></div>
                </dl>
              </section>

              <section className="item-preview-section">
                <h4>Financial</h4>
                <dl className="item-preview-list">
                  <div><dt>Payment Terms</dt><dd>{formatItemValue(previewSupplier.payment_terms)}</dd></div>
                  <div><dt>Currency</dt><dd>{formatItemValue(previewSupplier.currency)}</dd></div>
                  <div><dt>Tax ID</dt><dd>{formatItemValue(previewSupplier.tax_id)}</dd></div>
                  <div><dt>VAT Number</dt><dd>{formatItemValue(previewSupplier.vat_number)}</dd></div>
                  <div><dt>Credit Limit</dt><dd>{formatItemValue(previewSupplier.credit_limit)}</dd></div>
                  <div><dt>Balance</dt><dd>{formatItemValue(previewSupplier.balance, "0")}</dd></div>
                </dl>
              </section>

              <section className="item-preview-section">
                <h4>Contact Person</h4>
                <dl className="item-preview-list">
                  <div><dt>Name</dt><dd>{formatItemValue(previewSupplier.contact_name)}</dd></div>
                  <div><dt>Email</dt><dd>{formatItemValue(previewSupplier.contact_email)}</dd></div>
                  <div><dt>Phone</dt><dd>{formatItemValue(previewSupplier.contact_phone)}</dd></div>
                  <div><dt>Website</dt><dd>{formatItemValue(previewSupplier.website)}</dd></div>
                  <div><dt>Mobile</dt><dd>{formatItemValue(previewSupplier.mobile)}</dd></div>
                </dl>
              </section>

              <section className="item-preview-section">
                <h4>Internal</h4>
                <dl className="item-preview-list">
                  <div><dt>Rating</dt><dd>{formatItemValue(previewSupplier.rating)}</dd></div>
                  <div><dt>Notes</dt><dd>{formatItemValue(previewSupplier.notes)}</dd></div>
                  <div><dt>Created</dt><dd>{formatItemDate(previewSupplier.created_at)}</dd></div>
                  <div><dt>Updated</dt><dd>{formatItemDate(previewSupplier.updated_at)}</dd></div>
                  <div><dt>Deleted</dt><dd>{formatItemDate(previewSupplier.deleted_at)}</dd></div>
                </dl>
              </section>
            </div>

            <div className="purchase-order-actions">
              <button className="ui-btn ui-btn-primary" type="button" onClick={() => openEdit(previewSupplier)}>
                Edit supplier
              </button>
              <button className="ui-btn ui-btn-secondary" type="button" onClick={() => setPreviewSupplier(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="ui-modal-backdrop" role="dialog" aria-modal="true">
          <form className="ui-modal-card item-modal-card" onSubmit={createSupplier}>
            <div className="item-modal-topbar">
              <div>
                <h3>Create Supplier</h3>
                <p className="ui-muted supplier-modal-copy">Start with the business identity, then open the rest of the supplier profile only when needed.</p>
              </div>
              <button className="ui-btn ui-btn-secondary" type="button" onClick={() => setCreateOpen(false)}>
                Close
              </button>
            </div>
            {renderSupplierForm("create", createForm, createSections)}
            <div className="purchase-order-actions">
              <button className="ui-btn ui-btn-primary" type="submit">
                Save supplier
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
          <form className="ui-modal-card item-modal-card" onSubmit={updateSupplier}>
            <div className="item-modal-topbar">
              <div>
                <h3>Edit Supplier</h3>
                <p className="ui-muted supplier-modal-copy">Keep the supplier profile connected to purchasing by managing identity, contacts, and financial context in one place.</p>
              </div>
              <button className="ui-btn ui-btn-secondary" type="button" onClick={() => setEditing(null)}>
                Close
              </button>
            </div>
            {renderSupplierForm("edit", editForm, editSections, editing.balance)}
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
  const [items, setItems] = React.useState<ItemRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [includeDeleted, setIncludeDeleted] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [createForm, setCreateForm] = React.useState<PurchaseOrderFormState>(createDefaultPurchaseOrderForm);
  const [editing, setEditing] = React.useState<PurchaseOrderRecord | null>(null);
  const [editForm, setEditForm] = React.useState<PurchaseOrderFormState>(createDefaultPurchaseOrderForm);
  const [supplierPickerOpen, setSupplierPickerOpen] = React.useState<"create" | "edit" | null>(null);

  const supplierMap = React.useMemo(
    () =>
      new Map(
        suppliers.map((supplier) => [
          supplier.id,
          supplier.name?.trim() || supplier.supplier_code?.trim() || supplier.email?.trim() || "Unnamed supplier"
        ])
      ),
    [suppliers]
  );

  const itemMap = React.useMemo(
    () =>
      new Map(
        items.map((item) => [
          item.id,
          {
            label: item.name?.trim() || item.sku?.trim() || "Unnamed item",
            price: Number(item.cost_price ?? item.selling_price ?? 0),
            description: String(item.description ?? "")
          }
        ])
      ),
    [items]
  );

  const supplierOptions = React.useMemo(
    () =>
      suppliers.map((supplier) => ({
        id: supplier.id,
        name: supplier.name?.trim() || "Unnamed supplier",
        meta: [supplier.supplier_code, supplier.status, supplier.email, supplier.phone].filter(Boolean).join(" ? ")
      })),
    [suppliers]
  );

  const itemOptions = React.useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.name?.trim() || item.sku?.trim() || "Unnamed item",
        meta: [item.sku, item.category_id, item.cost_price].filter(Boolean).join(" ? ")
      })),
    [items]
  );

  const rowsWithSupplierNames = React.useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        supplier_name: row.supplier_id ? supplierMap.get(String(row.supplier_id)) || "Unknown supplier" : "No supplier"
      })),
    [rows, supplierMap]
  );

  const createSummary = React.useMemo(() => computePurchaseOrderSummary(createForm), [createForm]);
  const editSummary = React.useMemo(() => computePurchaseOrderSummary(editForm), [editForm]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = includeDeleted ? "?includeDeleted=true" : "";
      const [purchaseOrders, visibleSuppliers, visibleItems] = await Promise.all([
        withAuth<PurchaseOrderRecord[]>(session, setSession, `/erp/purchase-orders${query}`),
        withAuth<SupplierRecord[]>(session, setSession, "/erp/suppliers"),
        withAuth<ItemRecord[]>(session, setSession, "/erp/items")
      ]);
      setRows(purchaseOrders);
      setSuppliers(visibleSuppliers);
      setItems(visibleItems);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  }, [includeDeleted, notify, session, setSession]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function updateForm(target: "create" | "edit", patch: Partial<PurchaseOrderFormState>) {
    if (target === "create") {
      setCreateForm((prev) => ({ ...prev, ...patch }));
      return;
    }
    setEditForm((prev) => ({ ...prev, ...patch }));
  }

  function updateLineItem(
    target: "create" | "edit",
    index: number,
    patch: Partial<PurchaseOrderLineItemFormState>
  ) {
    const setForm = target === "create" ? setCreateForm : setEditForm;
    setForm((prev) => ({
      ...prev,
      line_items: prev.line_items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }
        const next = { ...item, ...patch };
        if (patch.item_id) {
          const selected = itemMap.get(patch.item_id);
          if (selected) {
            if (!patch.description && !item.description) {
              next.description = selected.description;
            }
            if (next.unit_cost === "0" || next.unit_cost === "") {
              next.unit_cost = String(selected.price);
            }
          }
        }
        return next;
      })
    }));
  }

  function addLineItem(target: "create" | "edit") {
    const setForm = target === "create" ? setCreateForm : setEditForm;
    setForm((prev) => ({
      ...prev,
      line_items: [...prev.line_items, createDefaultPurchaseOrderLineItem()]
    }));
  }

  function removeLineItem(target: "create" | "edit", index: number) {
    const setForm = target === "create" ? setCreateForm : setEditForm;
    setForm((prev) => ({
      ...prev,
      line_items:
        prev.line_items.length === 1
          ? prev.line_items
          : prev.line_items.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function duplicateLineItem(target: "create" | "edit", index: number) {
    const setForm = target === "create" ? setCreateForm : setEditForm;
    setForm((prev) => {
      const source = prev.line_items[index];
      return {
        ...prev,
        line_items: [
          ...prev.line_items.slice(0, index + 1),
          { ...source },
          ...prev.line_items.slice(index + 1)
        ]
      };
    });
  }

  function startEdit(row: PurchaseOrderRecord) {
    setEditing(row);
    setEditForm(toPurchaseOrderFormState(row));
  }

  function getSupplierName(supplierId: string) {
    return supplierMap.get(supplierId) || "Unknown supplier";
  }

  function renderSupplierPicker(target: "create" | "edit") {
    const currentSupplierId = target === "create" ? createForm.supplier_id : editForm.supplier_id;

    return (
      <div className="supplier-picker">
        <div className="supplier-picker-row">
          <select className="ui-input" value={currentSupplierId} onChange={(e) => updateForm(target, { supplier_id: e.target.value })}>
            <option value="">No supplier selected</option>
            {supplierOptions.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          <button className="ui-btn ui-btn-secondary" type="button" onClick={() => setSupplierPickerOpen(target)}>
            Browse suppliers
          </button>
        </div>
        <p className="ui-muted supplier-picker-hint">
          {currentSupplierId
            ? `Selected: ${getSupplierName(currentSupplierId)}`
            : suppliers.length > 0
              ? "Pick a supplier by name so this order stays connected to the supplier profile."
              : "No suppliers available yet. Create one in Suppliers first."}
        </p>
      </div>
    );
  }

  function renderLineItemsEditor(target: "create" | "edit", form: PurchaseOrderFormState) {
    const showReceivingFields = form.status === "APPROVED" || form.status === "RECEIVED";
    return (
      <section className="ui-card purchase-order-line-items">
        <div className="purchase-order-section-header">
          <div>
            <h3>Line Items</h3>
            <p className="ui-muted">Build the order as a grid so quantity, cost, and receiving stay visible together.</p>
          </div>
          <button className="ui-btn ui-btn-secondary" type="button" onClick={() => addLineItem(target)}>
            Add row
          </button>
        </div>

        <div className={`purchase-order-line-grid${showReceivingFields ? " purchase-order-line-grid-receiving" : ""}`}>
          <div className="purchase-order-line-grid-header">Item</div>
          <div className="purchase-order-line-grid-header">Description</div>
          <div className="purchase-order-line-grid-header">Qty</div>
          <div className="purchase-order-line-grid-header">Unit Cost</div>
          <div className="purchase-order-line-grid-header">Tax %</div>
          <div className="purchase-order-line-grid-header">Discount</div>
          {showReceivingFields && <div className="purchase-order-line-grid-header">Received</div>}
          <div className="purchase-order-line-grid-header">Line Total</div>
          <div className="purchase-order-line-grid-header">Actions</div>

          {form.line_items.map((item, index) => (
            <React.Fragment key={`${target}-line-${index}`}>
              <div>
                <select
                  className="ui-input"
                  value={item.item_id}
                  onChange={(e) => updateLineItem(target, index, { item_id: e.target.value })}
                >
                  <option value="">Choose item</option>
                  {itemOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <small className="item-form-hint">
                  {item.item_id
                    ? itemOptions.find((option) => option.id === item.item_id)?.meta || ""
                    : "Select a saved item to keep inventory and purchasing connected."}
                </small>
              </div>
              <div>
                <input className="ui-input" value={item.description} onChange={(e) => updateLineItem(target, index, { description: e.target.value })} />
              </div>
              <div>
                <input className="ui-input" type="number" min="1" step="1" value={item.quantity} onChange={(e) => updateLineItem(target, index, { quantity: e.target.value })} />
              </div>
              <div>
                <input className="ui-input" type="number" min="0" step="0.01" value={item.unit_cost} onChange={(e) => updateLineItem(target, index, { unit_cost: e.target.value })} />
              </div>
              <div>
                <input className="ui-input" type="number" min="0" step="0.01" value={item.tax_rate} onChange={(e) => updateLineItem(target, index, { tax_rate: e.target.value })} />
              </div>
              <div>
                <input className="ui-input" type="number" min="0" step="0.01" value={item.discount} onChange={(e) => updateLineItem(target, index, { discount: e.target.value })} />
              </div>
              {showReceivingFields && (
                <div>
                  <input className="ui-input" type="number" min="0" step="1" value={item.received_quantity} onChange={(e) => updateLineItem(target, index, { received_quantity: e.target.value })} />
                </div>
              )}
              <div className="purchase-order-line-total">{computePurchaseOrderLineTotal(item).toFixed(2)}</div>
              <div className="purchase-order-row-actions">
                <button className="ui-btn ui-btn-secondary" type="button" onClick={() => duplicateLineItem(target, index)}>
                  Duplicate
                </button>
                <button className="ui-btn ui-btn-danger" type="button" onClick={() => removeLineItem(target, index)}>
                  Remove
                </button>
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>
    );
  }

  function renderSummarySidebar(target: "create" | "edit", form: PurchaseOrderFormState, summary: ReturnType<typeof computePurchaseOrderSummary>) {
    const showApprovalFields = form.status === "APPROVED" || form.status === "RECEIVED";
    const showReceivingFields = form.status === "RECEIVED";
    return (
      <aside className="ui-card purchase-order-summary">
        <h3>Order Summary</h3>
        <dl className="item-preview-list">
          <div><dt>Subtotal</dt><dd>{summary.subtotal.toFixed(2)}</dd></div>
          <div><dt>Total Tax</dt><dd>{summary.totalTax.toFixed(2)}</dd></div>
          <div><dt>Total Discount</dt><dd>{summary.totalDiscount.toFixed(2)}</dd></div>
          <div><dt>Grand Total</dt><dd>{summary.grandTotal.toFixed(2)}</dd></div>
        </dl>

        <label className="purchase-order-field">
          <span className="purchase-order-label">Payment Status</span>
          <select className="ui-input" value={form.payment_status} onChange={(e) => updateForm(target, { payment_status: e.target.value })}>
            <option value="UNPAID">UNPAID</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="PAID">PAID</option>
          </select>
        </label>
        <label className="purchase-order-field">
          <span className="purchase-order-label">Notes</span>
          <textarea className="ui-input item-textarea" value={form.notes} onChange={(e) => updateForm(target, { notes: e.target.value })} />
        </label>
        <label className="purchase-order-field">
          <span className="purchase-order-label">Shipping Address</span>
          <textarea className="ui-input item-textarea" value={form.shipping_address} onChange={(e) => updateForm(target, { shipping_address: e.target.value })} />
        </label>
        <label className="purchase-order-field">
          <span className="purchase-order-label">Shipping Method</span>
          <input className="ui-input" value={form.shipping_method} onChange={(e) => updateForm(target, { shipping_method: e.target.value })} />
        </label>
        <label className="purchase-order-field">
          <span className="purchase-order-label">Tracking Number</span>
          <input className="ui-input" value={form.tracking_number} onChange={(e) => updateForm(target, { tracking_number: e.target.value })} />
        </label>

        {showApprovalFields && (
          <div className="supplier-readonly-panel">
            <strong>Approval</strong>
            <label className="purchase-order-field">
              <span className="purchase-order-label">Approved By</span>
              <input className="ui-input" value={form.approved_by} onChange={(e) => updateForm(target, { approved_by: e.target.value })} />
            </label>
            <label className="purchase-order-field">
              <span className="purchase-order-label">Approved At</span>
              <input className="ui-input" type="date" value={form.approved_at} onChange={(e) => updateForm(target, { approved_at: e.target.value })} />
            </label>
          </div>
        )}

        {showReceivingFields && (
          <div className="supplier-readonly-panel">
            <strong>Receiving</strong>
            <p className="ui-muted">
              {summary.partialDelivery
                ? "Partial delivery is being tracked at the line level through received quantities."
                : "Received quantities now appear in the line items grid for final receiving confirmation."}
            </p>
          </div>
        )}
      </aside>
    );
  }

  async function createPurchaseOrder(e: React.FormEvent) {
    e.preventDefault();
    try {
      await withAuth(session, setSession, "/erp/purchase-orders", {
        method: "POST",
        body: JSON.stringify(buildPurchaseOrderPayload(createForm))
      });
      notify("success", "Purchase Orders: record created");
      setCreateForm(createDefaultPurchaseOrderForm());
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
        body: JSON.stringify(buildPurchaseOrderPayload(editForm))
      });
      notify("success", "Purchase Orders: record updated");
      setEditing(null);
      setEditForm(createDefaultPurchaseOrderForm());
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
    <section className="purchase-orders-page">
      <section className="ui-card">
        <div className="purchase-orders-header">
          <div>
            <h2 className="ui-title">Purchase Orders</h2>
            <p className="ui-muted purchase-orders-copy">
              This is now a full workflow screen: supplier and timing up top, line items in the center, totals and logistics on the side.
            </p>
          </div>
          <div className="items-header-actions">
            <label className="ui-checkline">
              <input type="checkbox" checked={includeDeleted} onChange={(e) => setIncludeDeleted(e.target.checked)} />
              Include deleted
            </label>
            <button className="ui-btn ui-btn-secondary" type="button" onClick={() => {
              setEditing(null);
              setEditForm(createDefaultPurchaseOrderForm());
            }}>
              New draft
            </button>
          </div>
        </div>
      </section>

      <div className="purchase-order-workflow">
        <form className="purchase-order-editor" onSubmit={editing ? updatePurchaseOrder : createPurchaseOrder}>
          <section className="ui-card">
            <div className="purchase-order-section-header">
              <div>
                <h3>{editing ? "Edit Purchase Order" : "Create Purchase Order"}</h3>
                <p className="ui-muted">
                  Core identity and timing stay here so the order can move through draft, approval, and receiving without clutter.
                </p>
              </div>
            </div>
            <div className="purchase-order-header-grid">
              <label className="purchase-order-field">
                <span className="purchase-order-label">PO Number</span>
                <input className="ui-input" value={(editing ? editForm : createForm).po_number} onChange={(e) => updateForm(editing ? "edit" : "create", { po_number: e.target.value })} placeholder="Auto-generated if left blank" />
              </label>
              <div className="purchase-order-field">
                <span className="purchase-order-label">Supplier</span>
                {renderSupplierPicker(editing ? "edit" : "create")}
              </div>
              <label className="purchase-order-field">
                <span className="purchase-order-label">Status</span>
                <select className="ui-input" value={(editing ? editForm : createForm).status} onChange={(e) => updateForm(editing ? "edit" : "create", { status: e.target.value })}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </label>
              <label className="purchase-order-field">
                <span className="purchase-order-label">Order Date</span>
                <input className="ui-input" type="date" value={(editing ? editForm : createForm).order_date} onChange={(e) => updateForm(editing ? "edit" : "create", { order_date: e.target.value })} />
              </label>
              <label className="purchase-order-field">
                <span className="purchase-order-label">Expected Delivery Date</span>
                <input className="ui-input" type="date" value={(editing ? editForm : createForm).expected_delivery_date} onChange={(e) => updateForm(editing ? "edit" : "create", { expected_delivery_date: e.target.value })} />
              </label>
              <label className="purchase-order-field">
                <span className="purchase-order-label">Payment Terms</span>
                <select className="ui-input" value={(editing ? editForm : createForm).payment_terms} onChange={(e) => updateForm(editing ? "edit" : "create", { payment_terms: e.target.value })}>
                  <option value="Net 7">Net 7</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Due on receipt">Due on receipt</option>
                  <option value="Custom">Custom</option>
                </select>
              </label>
            </div>
          </section>

          {renderLineItemsEditor(editing ? "edit" : "create", editing ? editForm : createForm)}

          <div className="purchase-order-actions">
            <button className="ui-btn ui-btn-primary" type="submit">
              {editing ? "Save Purchase Order" : "Create Purchase Order"}
            </button>
            {editing && (
              <button className="ui-btn ui-btn-secondary" type="button" onClick={() => {
                setEditing(null);
                setEditForm(createDefaultPurchaseOrderForm());
              }}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        {renderSummarySidebar(editing ? "edit" : "create", editing ? editForm : createForm, editing ? editSummary : createSummary)}
      </div>

      <section className="ui-card">
        <div className="purchase-order-section-header">
          <div>
            <h3>Saved Purchase Orders</h3>
            <p className="ui-muted">Click a row to reopen the full workflow editor for that order.</p>
          </div>
        </div>
        {loading ? (
          <div className="ui-loading">Loading data...</div>
        ) : (
          <DataTable<PurchaseOrderRecord>
            rows={rowsWithSupplierNames}
            columns={[
              { key: "po_number", label: "PO Number", sortable: true },
              { key: "supplier_name", label: "Supplier", sortable: true },
              { key: "status", label: "Status", sortable: true },
              { key: "grand_total", label: "Grand Total", sortable: true },
              { key: "payment_status", label: "Payment", sortable: true }
            ]}
            searchText={search}
            onSearchTextChange={setSearch}
            onRowClick={(row) => startEdit(row)}
            renderActions={(row) => (
              <>
                <button className="ui-btn ui-btn-secondary" type="button" onClick={() => startEdit(row)}>
                  Open
                </button>
                {!row.deleted_at && (
                  <button className="ui-btn ui-btn-danger" type="button" onClick={() => patchPurchaseOrder(row.id, { deleted_at: new Date().toISOString() })}>
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
      </section>

      {supplierPickerOpen && (
        <div className="ui-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ui-modal-card supplier-modal">
            <div className="supplier-modal-header">
              <div>
                <h3>Select Supplier</h3>
                <p className="ui-muted supplier-modal-copy">Showing suppliers available to this signed-in user.</p>
              </div>
              <button className="ui-btn ui-btn-secondary" type="button" onClick={() => setSupplierPickerOpen(null)}>
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
                    className={`supplier-option${((supplierPickerOpen === "create" ? createForm : editForm).supplier_id) === supplier.id ? " supplier-option-active" : ""}`}
                    type="button"
                    onClick={() => {
                      updateForm(supplierPickerOpen, { supplier_id: supplier.id });
                      setSupplierPickerOpen(null);
                    }}
                  >
                    <strong>{supplier.name}</strong>
                    <span>{supplier.meta || "No extra supplier details saved"}</span>
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
              <SuppliersPage
                session={session}
                setSession={setSession}
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
