# Frontend Guide

## Apps

- **Unified web app:** `apps/erp-web` (ERP + CRM in one shell)
- **Legacy CRM entry:** `apps/crm-web` redirects to `erp-web` (same hash routes; no separate React app)

Both the unified app and the redirect stub use:

- React + Vite (**`erp-web`** only; **`crm-web`** is vanilla TS entry)
- `react-router-dom` for protected routing (**`erp-web`**)
- `@sphincs/api-client` for auth/login/refresh and authorized requests (**`erp-web`**)

## Auth Flow

1. User logs in via `/api/v1/auth/login`.
2. App fetches profile via `/api/v1/auth/me`.
3. Session (`accessToken`, `refreshToken`, `user`) is persisted in localStorage.
4. Protected requests use bearer token and auto-refresh on `401` via `/api/v1/auth/refresh`.

## Role Access

- **ERP module** (items, suppliers, POs, distribution, access): `Admin`, `ERP Manager`, or `Staff`, plus **Distribution** visibility via `hasDistributionAccess` in `apps/erp-web`.
- **CRM module** (contacts, leads, opportunities): `Admin`, `CRM Manager`, or `Staff` (see `hasCrmPortalAccess` / `CrmAccessGate` in `apps/erp-web`).
- Shell access: user needs **at least one** of the ERP or CRM role sets to enter the app; landing route is `/items` or `/contacts` accordingly.

## Modules Wired

ERP:

- `/erp/items`
- `/erp/suppliers`
- `/erp/purchase-orders`
- `/distribution/*` (API-backed **Distribution** hub in-app at route `#/distribution`; see `distribution-hub.tsx`)

CRM:

- `/crm/contacts`
- `/crm/leads`
- `/crm/opportunities`

Each module screen currently supports:

- list
- create
- patch/update
- soft-delete
- restore
- include deleted toggle

## Reusable UI Layer

Shared reusable components now live in `packages/ui-core`:

- `DataTable`:
  - search
  - sortable columns
  - client-side pagination
- `ResourceManager`:
  - create form
  - real edit form (replaces JSON prompt workflow)
  - row actions (edit/delete/restore)

## Visual Polish (Current)

- Shared style tokens and UI classes in `packages/ui-core/src/ui.css`
- App shell layout:
  - left sidebar navigation
  - top bar with contextual title and logout
- UX feedback:
  - toast banners for success/error actions
  - loading and empty states in resource views
- Form UX:
  - inline required-field validation in create/edit flows

## Local Run

From repo root:

```bash
pnpm dev
```

Expected URLs:

- **Unified UI:** `http://localhost:5173` (ERP + CRM; fixed port unless you change `vite.config.ts`)
- **CRM redirect (optional):** `http://localhost:5174` → redirects to `5173` with the same hash
- **API:** `http://localhost:3000` (ensure `apps/core-api` is running; set `VITE_API_BASE_URL` in `apps/erp-web/.env.local` to match)

Use **hash** routes, e.g. `http://localhost:5173/#/items` and `http://localhost:5173/#/contacts`. **`core-api` must be listening** or the browser will show connection errors.
