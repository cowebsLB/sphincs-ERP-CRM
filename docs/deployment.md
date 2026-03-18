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

For GitHub Pages builds, set this as a repository variable:

1. GitHub repo -> `Settings` -> `Secrets and variables` -> `Actions` -> `Variables`
2. Add `VITE_API_BASE_URL`
3. Value example:
   - `https://sphincs-erp-crm.onrender.com/api/v1`

## Notes

- Frontend build base paths for Pages are injected in CI using `VITE_PUBLIC_BASE`:
  - ERP: `/sphincs-ERP-CRM/erp/`
  - CRM: `/sphincs-ERP-CRM/crm/`
- Frontend workflow also injects:
  - `VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}`
- Frontend apps use `HashRouter` so deep links are stable on static hosting.

## Backend CORS For Pages

`apps/core-api/src/main.ts` enables CORS using `CORS_ORIGINS`.

Default origins include:

- `https://cowebslb.github.io`
- `http://localhost:5173`
- `http://localhost:5174`

## JWT Secret Environment Variables (2026-03-18)

Backend auth now resolves secrets in this order:

- access token signing/verification:
  - `JWT_ACCESS_SECRET`
  - fallback `JWT_SECRET`
  - fallback `"change-me"` for local scaffolding only
- refresh token signing/verification:
  - `JWT_REFRESH_SECRET`
  - fallback `JWT_SECRET`
  - fallback `"change-me"` for local scaffolding only

Why:

- Prevents runtime failures when `JWT_SECRET` exists but is blank.
- Matches deployment envs that split access and refresh secrets.

## Login 500 Hardening (2026-03-18)

If `/api/v1/auth/login` still returns `500` after successful deploy and seed:

1. Redeploy latest commit so refresh-token hardening is live.
2. Check Render logs for `HttpExceptionFilter` `Unhandled exception` lines.

Hardening shipped:

- refresh tokens include random `jti` to reduce collision risk.
- refresh-token insert retries once on Prisma unique conflict (`P2002`).
- global exception filter logs stack traces for non-HTTP server errors.

## CI Troubleshooting (2026-03-17)

### Failure: `Multiple versions of pnpm specified`

Symptom:

- Pages workflow failed with:
  - `Multiple versions of pnpm specified`
  - one version came from workflow `pnpm/action-setup`
  - one version came from root `package.json` `packageManager`

Fix:

- Removed explicit `version` from `pnpm/action-setup`.
- Kept canonical pnpm version source in root `package.json`:
  - `packageManager: pnpm@10.0.0`

### Warning: Node 20 action runtime deprecation

Fix:

- Updated actions:
  - `actions/checkout@v5`
  - `actions/setup-node@v5`
- Added workflow env:
  - `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`

### Failure: `Dependencies lock file is not found`

Symptom:

- Workflow failed during dependency install on GitHub runner:
  - `pnpm-lock.yaml` not found

Root cause:

- Lockfile was present locally but excluded from git by `.gitignore`, so CI checkout did not include it.

Fix:

- Removed `pnpm-lock.yaml` from `.gitignore`.
- Committed `pnpm-lock.yaml` to repository.

Why:

- Workflow uses `pnpm install --frozen-lockfile`, which requires the lockfile in source control.
