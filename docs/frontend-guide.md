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

- ERP app checks for `Admin` or `ERP Manager`.
- CRM app checks for `Admin` or `CRM Manager`.

## Modules Wired

ERP:

- `/erp/items`
- `/erp/suppliers`
- `/erp/purchase-orders`

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

## Local Run

From repo root:

```bash
pnpm dev
```

Expected URLs:

- ERP: `http://localhost:5173`
- CRM: `http://localhost:5174`
- API: `http://localhost:3000`
