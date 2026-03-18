# Hosting Overview

## Current Production Hosting (2026-03-18)

- Frontend: GitHub Pages
  - `https://cowebslb.github.io/sphincs-ERP-CRM/`
  - ERP app: `/erp/`
  - CRM app: `/crm/`
- Backend API: Render
  - `https://sphincs-erp-crm.onrender.com`
- Database: Supabase Postgres

## Portfolio Summary Line

Use this short description:

- "Frontend is deployed on GitHub Pages, backend API on Render, with Supabase Postgres."

## Vercel Readiness

Frontend apps are Vercel-ready if migration is needed:

- `apps/erp-web` and `apps/crm-web` are Vite apps.
- API base URL is externally configurable via `VITE_API_BASE_URL`.
- Static-friendly routing is already configured via `HashRouter`.

## If Migrating Frontend To Vercel Later

1. Create Vercel project(s) for ERP and CRM (or one app shell, depending on strategy).
2. Set build env var:
   - `VITE_API_BASE_URL=https://sphincs-erp-crm.onrender.com/api/v1`
3. Keep backend CORS allowlist updated with Vercel domain(s).
4. Validate login + `/auth/me` + core resource fetch on production URLs.
