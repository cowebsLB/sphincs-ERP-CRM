import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { ApiClient, type SessionState, type SessionTokens } from "@sphincs/api-client";
import { ResourceManager } from "@sphincs/ui-core";
import "@sphincs/ui-core/ui.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";
const STORAGE_KEY = "sphincs.crm.session";
const client = new ApiClient(API_BASE_URL);

type RecordData = Record<string, unknown> & { id: string; deleted_at?: string | null };

function useSessionState() {
  const [session, setSession] = React.useState<SessionState | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionState) : null;
  });

  const update = React.useCallback((next: SessionState | null) => {
    setSession(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
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
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const tokens = await client.login(email, password);
      const user = await client.authorized<SessionState["user"]>(
        "/auth/me",
        tokens as SessionTokens
      );
      setSession({
        accessToken: user.tokens.accessToken,
        refreshToken: user.tokens.refreshToken,
        user: user.data
      });
      navigate("/contacts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>CRM Login</h1>
      <form onSubmit={onSubmit}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />
        <button disabled={busy} type="submit">
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
      {error && <p>{error}</p>}
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

function CRMApp({
  session,
  setSession
}: {
  session: SessionState;
  setSession: (next: SessionState | null) => void;
}) {
  const navigate = useNavigate();
  const [toast, setToast] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const notify = React.useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2600);
  }, []);

  if (!hasRole(session, "Admin", "CRM Manager")) {
    return <p>Your account does not have CRM access.</p>;
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
        </header>
        {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
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
              <ResourcePage
                session={session}
                setSession={setSession}
                endpoint="/crm/leads"
                title="Leads"
                fields={[
                  { key: "contact_id", label: "Contact ID" },
                  { key: "status", label: "Status (NEW/QUALIFIED/...)" }
                ]}
                notify={notify}
              />
            }
          />
          <Route
            path="/opportunities"
            element={
              <ResourcePage
                session={session}
                setSession={setSession}
                endpoint="/crm/opportunities"
                title="Opportunities"
                fields={[
                  { key: "lead_id", label: "Lead ID" },
                  { key: "status", label: "Status (OPEN/WON/LOST)" }
                ]}
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

function RootApp() {
  const { session, setSession } = useSessionState();
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
