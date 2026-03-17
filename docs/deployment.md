# Deployment Guide

## GitHub Pages Frontend Deploy

This repository deploys static frontend assets to GitHub Pages using:

- `.github/workflows/deploy-pages.yml`

Published structure:

- `/` -> lightweight landing page
- `/erp/` -> ERP frontend app
- `/crm/` -> CRM frontend app

## Why the README appeared on Pages

If no built Pages artifact is published, GitHub Pages may render repository
content (for this repo, that surfaced the root `README.md` page).

The workflow fixes this by publishing an explicit `_site` artifact on each push
to `main`.

## Runtime Environment Variable

Both frontends support:

- `VITE_API_BASE_URL`

This must point to your deployed backend API (for example:
`https://your-api-host/api/v1`), otherwise login/API calls will fail.

## Notes

- Frontend build base paths for Pages are injected in CI using `VITE_PUBLIC_BASE`:
  - ERP: `/sphincs-ERP-CRM/erp/`
  - CRM: `/sphincs-ERP-CRM/crm/`
- Frontend apps use `HashRouter` so deep links are stable on static hosting.
