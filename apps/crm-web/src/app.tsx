import React from "react";
import { HashRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { ApiClient, type SessionState } from "@sphincs/api-client";
import { DataTable, ResourceManager } from "@sphincs/ui-core";
import "@sphincs/ui-core/ui.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";
const API_ROOT = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
const STORAGE_KEY = "sphincs.session";
const LEGACY_STORAGE_KEYS = ["sphincs.crm.session", "sphincs.erp.session"] as const;
const APP_RELEASE_VERSION = "Beta V1.8.0";
const client = new ApiClient(API_BASE_URL);

type RecordData = Record<string, unknown> & { id: string; deleted_at?: string | null };
type ContactRecord = RecordData & {
  full_name?: string | null;
  email?: string | null;
};
type LeadRecord = RecordData & {
  contact_id?: string | null;
  contact_name?: string;
  status?: string | null;
};
type OpportunityRecord = RecordData & {
  lead_id?: string | null;
  lead_name?: string;
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

type LeadFormState = {
  contact_id: string;
  status: string;
};

type OpportunityFormState = {
  lead_id: string;
  status: string;
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
      navigate("/contacts");
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

function LeadsPage({
  session,
  setSession,
  notify
}: {
  session: SessionState;
  setSession: (next: SessionState | null) => void;
  notify: (type: "success" | "error", message: string) => void;
}) {
  const [rows, setRows] = React.useState<LeadRecord[]>([]);
  const [contacts, setContacts] = React.useState<ContactRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [includeDeleted, setIncludeDeleted] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [createForm, setCreateForm] = React.useState<LeadFormState>({
    contact_id: "",
    status: "NEW"
  });
  const [editing, setEditing] = React.useState<LeadRecord | null>(null);
  const [editForm, setEditForm] = React.useState<LeadFormState>({
    contact_id: "",
    status: "NEW"
  });
  const [contactPickerOpen, setContactPickerOpen] = React.useState<"create" | "edit" | null>(null);

  const contactMap = React.useMemo(
    () =>
      new Map(
        contacts.map((contact) => [
          contact.id,
          contact.full_name?.trim() || contact.email?.trim() || "Unnamed contact"
        ])
      ),
    [contacts]
  );

  const contactOptions = React.useMemo(
    () =>
      contacts.map((contact) => ({
        id: contact.id,
        name: contact.full_name?.trim() || "Unnamed contact",
        meta: [contact.email].filter(Boolean).join(" • ")
      })),
    [contacts]
  );

  const rowsWithContactNames = React.useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        contact_name: row.contact_id ? contactMap.get(String(row.contact_id)) || "Unknown contact" : "No contact"
      })),
    [rows, contactMap]
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = includeDeleted ? "?includeDeleted=true" : "";
      const [leads, visibleContacts] = await Promise.all([
        withAuth<LeadRecord[]>(session, setSession, `/crm/leads${query}`),
        withAuth<ContactRecord[]>(session, setSession, "/crm/contacts")
      ]);
      setRows(leads);
      setContacts(visibleContacts);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [includeDeleted, notify, session, setSession]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function updateForm(target: "create" | "edit", patch: Partial<LeadFormState>) {
    if (target === "create") {
      setCreateForm((prev) => ({ ...prev, ...patch }));
      return;
    }
    setEditForm((prev) => ({ ...prev, ...patch }));
  }

  function startEdit(row: LeadRecord) {
    setEditing(row);
    setEditForm({
      contact_id: row.contact_id ? String(row.contact_id) : "",
      status: row.status ? String(row.status) : "NEW"
    });
  }

  function getContactName(contactId: string) {
    return contactMap.get(contactId) || "Unknown contact";
  }

  function renderContactPicker(target: "create" | "edit") {
    const currentContactId = target === "create" ? createForm.contact_id : editForm.contact_id;

    return (
      <div className="supplier-picker">
        <div className="supplier-picker-row">
          <select
            className="ui-input"
            value={currentContactId}
            onChange={(e) => updateForm(target, { contact_id: e.target.value })}
          >
            <option value="">No contact selected</option>
            {contactOptions.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
          <button
            className="ui-btn ui-btn-secondary"
            type="button"
            onClick={() => setContactPickerOpen(target)}
          >
            Browse contacts
          </button>
        </div>
        <p className="ui-muted supplier-picker-hint">
          {currentContactId
            ? `Selected: ${getContactName(currentContactId)}`
            : contacts.length > 0
              ? "Choose a contact by name instead of typing an internal ID."
              : "No contacts available yet. Create one in Contacts first."}
        </p>
      </div>
    );
  }

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    try {
      await withAuth(session, setSession, "/crm/leads", {
        method: "POST",
        body: JSON.stringify({
          contact_id: createForm.contact_id || undefined,
          status: createForm.status || undefined
        })
      });
      notify("success", "Leads: record created");
      setCreateForm({ contact_id: "", status: "NEW" });
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Create failed");
    }
  }

  async function updateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) {
      return;
    }
    try {
      await withAuth(session, setSession, `/crm/leads/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          contact_id: editForm.contact_id || null,
          status: editForm.status || undefined
        })
      });
      notify("success", "Leads: record updated");
      setEditing(null);
      setEditForm({ contact_id: "", status: "NEW" });
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Update failed");
    }
  }

  async function patchLead(id: string, payload: Record<string, unknown>) {
    try {
      await withAuth(session, setSession, `/crm/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      notify("success", "Leads: record updated");
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Update failed");
    }
  }

  return (
    <section className="ui-card">
      <div className="purchase-orders-header">
        <div>
          <h2 className="ui-title">Leads</h2>
          <p className="ui-muted purchase-orders-copy">
            Link leads to contacts by name. The app keeps the internal contact ID behind the scenes.
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

      <form className="ui-form purchase-order-form" onSubmit={createLead}>
        <div className="purchase-order-field">
          <span className="purchase-order-label">Contact</span>
          {renderContactPicker("create")}
        </div>
        <label className="purchase-order-field">
          <span className="purchase-order-label">Status</span>
          <select
            className="ui-input"
            value={createForm.status}
            onChange={(e) => updateForm("create", { status: e.target.value })}
          >
            <option value="NEW">NEW</option>
            <option value="QUALIFIED">QUALIFIED</option>
            <option value="DISQUALIFIED">DISQUALIFIED</option>
            <option value="CONVERTED">CONVERTED</option>
          </select>
        </label>
        <button className="ui-btn ui-btn-primary purchase-order-submit" type="submit">
          Create
        </button>
      </form>

      {editing && (
        <form className="ui-form ui-form-edit purchase-order-form" onSubmit={updateLead}>
          <div className="purchase-order-field">
            <span className="purchase-order-label">Contact</span>
            {renderContactPicker("edit")}
          </div>
          <label className="purchase-order-field">
            <span className="purchase-order-label">Status</span>
            <select
              className="ui-input"
              value={editForm.status}
              onChange={(e) => updateForm("edit", { status: e.target.value })}
            >
              <option value="NEW">NEW</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="DISQUALIFIED">DISQUALIFIED</option>
              <option value="CONVERTED">CONVERTED</option>
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
                setEditForm({ contact_id: "", status: "NEW" });
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
        <DataTable<LeadRecord>
          rows={rowsWithContactNames}
          columns={[
            { key: "contact_name", label: "Contact", sortable: true },
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
                  onClick={() => patchLead(row.id, { deleted_at: new Date().toISOString() })}
                >
                  Soft Delete
                </button>
              )}
              {row.deleted_at && (
                <button
                  className="ui-btn ui-btn-primary"
                  type="button"
                  onClick={() =>
                    withAuth(session, setSession, `/crm/leads/${row.id}/restore`, {
                      method: "POST",
                      body: JSON.stringify({})
                    })
                      .then(async () => {
                        notify("success", "Leads: record restored");
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

      {contactPickerOpen && (
        <div className="ui-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ui-modal-card supplier-modal">
            <div className="supplier-modal-header">
              <div>
                <h3>Select Contact</h3>
                <p className="ui-muted supplier-modal-copy">
                  Showing contacts available to this signed-in user.
                </p>
              </div>
              <button
                className="ui-btn ui-btn-secondary"
                type="button"
                onClick={() => setContactPickerOpen(null)}
              >
                Close
              </button>
            </div>
            {contactOptions.length === 0 ? (
              <p className="ui-empty">No contacts found yet. Create one from the Contacts page first.</p>
            ) : (
              <div className="supplier-grid">
                {contactOptions.map((contact) => (
                  <button
                    key={contact.id}
                    className={`supplier-option${(
                      contactPickerOpen === "create" ? createForm.contact_id : editForm.contact_id
                    ) === contact.id
                      ? " supplier-option-active"
                      : ""}`}
                    type="button"
                    onClick={() => {
                      updateForm(contactPickerOpen, { contact_id: contact.id });
                      setContactPickerOpen(null);
                    }}
                  >
                    <strong>{contact.name}</strong>
                    <span>{contact.meta || "No email saved"}</span>
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

function OpportunitiesPage({
  session,
  setSession,
  notify
}: {
  session: SessionState;
  setSession: (next: SessionState | null) => void;
  notify: (type: "success" | "error", message: string) => void;
}) {
  const [rows, setRows] = React.useState<OpportunityRecord[]>([]);
  const [leads, setLeads] = React.useState<LeadRecord[]>([]);
  const [contacts, setContacts] = React.useState<ContactRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [includeDeleted, setIncludeDeleted] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [createForm, setCreateForm] = React.useState<OpportunityFormState>({
    lead_id: "",
    status: "OPEN"
  });
  const [editing, setEditing] = React.useState<OpportunityRecord | null>(null);
  const [editForm, setEditForm] = React.useState<OpportunityFormState>({
    lead_id: "",
    status: "OPEN"
  });
  const [leadPickerOpen, setLeadPickerOpen] = React.useState<"create" | "edit" | null>(null);

  const contactMap = React.useMemo(
    () =>
      new Map(
        contacts.map((contact) => [
          contact.id,
          contact.full_name?.trim() || contact.email?.trim() || "Unnamed contact"
        ])
      ),
    [contacts]
  );

  const leadMap = React.useMemo(
    () =>
      new Map(
        leads.map((lead) => {
          const label = lead.contact_id
            ? `${contactMap.get(String(lead.contact_id)) || "Unknown contact"} (${lead.status || "NEW"})`
            : `Lead ${lead.id.slice(0, 8)} (${lead.status || "NEW"})`;
          return [lead.id, label];
        })
      ),
    [contactMap, leads]
  );

  const leadOptions = React.useMemo(
    () =>
      leads.map((lead) => ({
        id: lead.id,
        name: leadMap.get(lead.id) || `Lead ${lead.id.slice(0, 8)}`,
        meta: lead.contact_id ? `Contact: ${contactMap.get(String(lead.contact_id)) || "Unknown"}` : "No contact linked"
      })),
    [contactMap, leadMap, leads]
  );

  const rowsWithLeadNames = React.useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        lead_name: row.lead_id ? leadMap.get(String(row.lead_id)) || "Unknown lead" : "No lead"
      })),
    [leadMap, rows]
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = includeDeleted ? "?includeDeleted=true" : "";
      const [opportunities, visibleLeads, visibleContacts] = await Promise.all([
        withAuth<OpportunityRecord[]>(session, setSession, `/crm/opportunities${query}`),
        withAuth<LeadRecord[]>(session, setSession, "/crm/leads"),
        withAuth<ContactRecord[]>(session, setSession, "/crm/contacts")
      ]);
      setRows(opportunities);
      setLeads(visibleLeads);
      setContacts(visibleContacts);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }, [includeDeleted, notify, session, setSession]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function updateForm(target: "create" | "edit", patch: Partial<OpportunityFormState>) {
    if (target === "create") {
      setCreateForm((prev) => ({ ...prev, ...patch }));
      return;
    }
    setEditForm((prev) => ({ ...prev, ...patch }));
  }

  function startEdit(row: OpportunityRecord) {
    setEditing(row);
    setEditForm({
      lead_id: row.lead_id ? String(row.lead_id) : "",
      status: row.status ? String(row.status) : "OPEN"
    });
  }

  function getLeadName(leadId: string) {
    return leadMap.get(leadId) || "Unknown lead";
  }

  function renderLeadPicker(target: "create" | "edit") {
    const currentLeadId = target === "create" ? createForm.lead_id : editForm.lead_id;

    return (
      <div className="supplier-picker">
        <div className="supplier-picker-row">
          <select
            className="ui-input"
            value={currentLeadId}
            onChange={(e) => updateForm(target, { lead_id: e.target.value })}
          >
            <option value="">No lead selected</option>
            {leadOptions.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name}
              </option>
            ))}
          </select>
          <button
            className="ui-btn ui-btn-secondary"
            type="button"
            onClick={() => setLeadPickerOpen(target)}
          >
            Browse leads
          </button>
        </div>
        <p className="ui-muted supplier-picker-hint">
          {currentLeadId
            ? `Selected: ${getLeadName(currentLeadId)}`
            : leads.length > 0
              ? "Choose a lead by label instead of typing an internal ID."
              : "No leads available yet. Create one in Leads first."}
        </p>
      </div>
    );
  }

  async function createOpportunity(e: React.FormEvent) {
    e.preventDefault();
    try {
      await withAuth(session, setSession, "/crm/opportunities", {
        method: "POST",
        body: JSON.stringify({
          lead_id: createForm.lead_id || undefined,
          status: createForm.status || undefined
        })
      });
      notify("success", "Opportunities: record created");
      setCreateForm({ lead_id: "", status: "OPEN" });
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Create failed");
    }
  }

  async function updateOpportunity(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) {
      return;
    }
    try {
      await withAuth(session, setSession, `/crm/opportunities/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          lead_id: editForm.lead_id || null,
          status: editForm.status || undefined
        })
      });
      notify("success", "Opportunities: record updated");
      setEditing(null);
      setEditForm({ lead_id: "", status: "OPEN" });
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Update failed");
    }
  }

  async function patchOpportunity(id: string, payload: Record<string, unknown>) {
    try {
      await withAuth(session, setSession, `/crm/opportunities/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      notify("success", "Opportunities: record updated");
      await load();
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Update failed");
    }
  }

  return (
    <section className="ui-card">
      <div className="purchase-orders-header">
        <div>
          <h2 className="ui-title">Opportunities</h2>
          <p className="ui-muted purchase-orders-copy">
            Link opportunities to leads using readable labels instead of raw lead IDs.
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

      <form className="ui-form purchase-order-form" onSubmit={createOpportunity}>
        <div className="purchase-order-field">
          <span className="purchase-order-label">Lead</span>
          {renderLeadPicker("create")}
        </div>
        <label className="purchase-order-field">
          <span className="purchase-order-label">Status</span>
          <select
            className="ui-input"
            value={createForm.status}
            onChange={(e) => updateForm("create", { status: e.target.value })}
          >
            <option value="OPEN">OPEN</option>
            <option value="WON">WON</option>
            <option value="LOST">LOST</option>
          </select>
        </label>
        <button className="ui-btn ui-btn-primary purchase-order-submit" type="submit">
          Create
        </button>
      </form>

      {editing && (
        <form className="ui-form ui-form-edit purchase-order-form" onSubmit={updateOpportunity}>
          <div className="purchase-order-field">
            <span className="purchase-order-label">Lead</span>
            {renderLeadPicker("edit")}
          </div>
          <label className="purchase-order-field">
            <span className="purchase-order-label">Status</span>
            <select
              className="ui-input"
              value={editForm.status}
              onChange={(e) => updateForm("edit", { status: e.target.value })}
            >
              <option value="OPEN">OPEN</option>
              <option value="WON">WON</option>
              <option value="LOST">LOST</option>
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
                setEditForm({ lead_id: "", status: "OPEN" });
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
        <DataTable<OpportunityRecord>
          rows={rowsWithLeadNames}
          columns={[
            { key: "lead_name", label: "Lead", sortable: true },
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
                  onClick={() => patchOpportunity(row.id, { deleted_at: new Date().toISOString() })}
                >
                  Soft Delete
                </button>
              )}
              {row.deleted_at && (
                <button
                  className="ui-btn ui-btn-primary"
                  type="button"
                  onClick={() =>
                    withAuth(session, setSession, `/crm/opportunities/${row.id}/restore`, {
                      method: "POST",
                      body: JSON.stringify({})
                    })
                      .then(async () => {
                        notify("success", "Opportunities: record restored");
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

      {leadPickerOpen && (
        <div className="ui-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ui-modal-card supplier-modal">
            <div className="supplier-modal-header">
              <div>
                <h3>Select Lead</h3>
                <p className="ui-muted supplier-modal-copy">
                  Showing leads available to this signed-in user.
                </p>
              </div>
              <button
                className="ui-btn ui-btn-secondary"
                type="button"
                onClick={() => setLeadPickerOpen(null)}
              >
                Close
              </button>
            </div>
            {leadOptions.length === 0 ? (
              <p className="ui-empty">No leads found yet. Create one from the Leads page first.</p>
            ) : (
              <div className="supplier-grid">
                {leadOptions.map((lead) => (
                  <button
                    key={lead.id}
                    className={`supplier-option${(
                      leadPickerOpen === "create" ? createForm.lead_id : editForm.lead_id
                    ) === lead.id
                      ? " supplier-option-active"
                      : ""}`}
                    type="button"
                    onClick={() => {
                      updateForm(leadPickerOpen, { lead_id: lead.id });
                      setLeadPickerOpen(null);
                    }}
                  >
                    <strong>{lead.name}</strong>
                    <span>{lead.meta}</span>
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

function CRMApp({
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

  if (!hasRole(session, "Admin", "CRM Manager", "Staff")) {
    return (
      <main style={{ padding: "24px" }}>
        <p>Your account does not have CRM access.</p>
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
            sourceApp: "CRM",
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
        <h2>SPHINCS CRM</h2>
        <p className="ui-muted">{session.user.email}</p>
        <Link to="/contacts">Contacts</Link>
        <Link to="/leads">Leads</Link>
        <Link to="/opportunities">Opportunities</Link>
      </aside>
      <section className="app-main">
        <header className="app-topbar">
          <strong>CRM Operations</strong>
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
                placeholder="Module/Page (e.g. leads)"
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
            path="/contacts"
            element={
              <ResourcePage
                session={session}
                setSession={setSession}
                endpoint="/crm/contacts"
                title="Contacts"
                fields={[
                  { key: "full_name", label: "Full Name" },
                  { key: "email", label: "Email" }
                ]}
                notify={notify}
              />
            }
          />
          <Route
            path="/leads"
            element={
              <LeadsPage
                session={session}
                setSession={setSession}
                notify={notify}
              />
            }
          />
          <Route
            path="/opportunities"
            element={
              <OpportunitiesPage
                session={session}
                setSession={setSession}
                notify={notify}
              />
            }
          />
          <Route path="*" element={<Navigate to="/contacts" replace />} />
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
            session ? <Navigate to="/contacts" replace /> : <LoginPage setSession={setSession} />
          }
        />
        <Route
          path="/*"
          element={
            session ? <CRMApp session={session} setSession={setSession} /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </HashRouter>
  );
}
