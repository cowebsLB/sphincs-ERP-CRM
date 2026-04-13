# Frontend Guide

## Apps

- ERP web app: `apps/erp-web`
- CRM web app: `apps/crm-web`

Both apps use:

- React + Vite
- `react-router-dom` for protected routing
- `@sphincs/api-client` for auth/login/refresh and authorized requests

## Auth Flow

1. User logs in via `/api/v1/auth/login`.
2. App fetches profile via `/api/v1/auth/me`.
3. Session (`accessToken`, `refreshToken`, `user`) is persisted in localStorage.
4. Protected requests use bearer token and auto-refresh on `401` via `/api/v1/auth/refresh`.

## Role Access

- ERP app checks for `Admin`, `ERP Manager`, or `Staff` (plus optional **Distribution** visibility for additional operational roles — see `hasDistributionAccess` in `apps/erp-web`).
- CRM app checks for `Admin` or `CRM Manager`.

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

- ERP: `http://localhost:5173` (fixed port; `strictPort: true` — change port in `vite.config.ts` if 5173 is taken)
- CRM: `http://localhost:5174` (same)
- API: `http://localhost:3000`

Open each app with a **hash** route, e.g. `http://localhost:5174/#/contacts` and `http://localhost:5173/#/items`. Header links target those origins so you can jump between apps during local development.
