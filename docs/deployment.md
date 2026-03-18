# Deployment Guide

## CI Test Failure: Missing Prisma Client Generation (2026-03-18)

Symptom:

- `test_core_api` failed in GitHub Actions with TypeScript compile errors:
  - `Property 'purchaseOrder' does not exist on type 'PrismaService'`
  - `Property 'lead' does not exist on type 'PrismaService'`

Root cause:

- CI test job executed `jest` before generating Prisma Client for the current schema.
- Without generated Prisma types, model delegates were missing at compile time.

Fix:

- Added a Prisma generation step in `.github/workflows/deploy-pages.yml` before unit tests:
  - `pnpm --filter @sphincs/core-api prisma:generate`

Why this works:

- Prisma Client generation restores schema-based delegate typings used by `PrismaService`,
  so `purchaseOrder` and `lead` are available during test compilation.

## GitHub Pages Frontend Deploy

This repository deploys static frontend assets to GitHub Pages using:

- `.github/workflows/deploy-pages.yml`

Deployment gate:

- Pages artifact build/deploy now runs only after backend test checks pass:
  - `pnpm --filter @sphincs/core-api prisma:generate`
  - `pnpm --filter @sphincs/core-api test`
  - `pnpm --filter @sphincs/core-api test:e2e`

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

## Login 500 Root Cause: jsonwebtoken Import Shape (2026-03-18)

Production stack trace:

- `TypeError: Cannot read properties of undefined (reading 'sign')`
- source: `AuthService.createAccessToken(...)`

Root cause:

- `jsonwebtoken` was imported as default (`import jwt from "jsonwebtoken"`), but runtime output
  in this deployment resolves the module without a default export object.

Fix:

- switched to namespace import in backend auth/guard code:
  - `import * as jwt from "jsonwebtoken"`

Why:

- namespace import is CommonJS-safe and avoids `undefined.sign`/`undefined.verify` at runtime.

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

## Render Auto-Deploy Prisma Binary Missing (2026-03-18)

Symptom:

- Render auto deploy failed with:
  - `sh: 1: prisma: not found`
  - at step: `pnpm --filter @sphincs/core-api prisma:generate`
- manual deploy with clear cache could succeed intermittently.

Root cause:

- Render cached installs were reusing production-pruned dependency layouts.
- deploy/build scripts relied on toolchain packages previously in `devDependencies`.

Permanent fix:

- moved deploy/build-critical packages into `apps/core-api` `dependencies`:
  - `prisma`
  - `ts-node`
  - `@nestjs/cli`
  - `typescript`

Why:

- ensures required binaries are always present in build environments regardless of production-pruning behavior in cached installs.

## Render Build Command (Canonical)

Use repository-managed build script:

- Build command:
  - `bash scripts/render-build-core-api.sh`
- Start command:
  - `pnpm --filter @sphincs/core-api start`

Equivalent package script:

- `pnpm --filter @sphincs/core-api render:build`

Why this is now the default:

- avoids fragile inline command drift in Render UI
- enforces cache-safe install + Prisma generate/migrate/seed + Nest build sequence from source control

## Render + Supabase Connection Mode For Login Performance (2026-03-18)

Observed production auth timing showed database latency as the main bottleneck
(`dbLookupMs` dominating `totalMs`).

Recommended environment setup in Render:

- `DATABASE_URL`:
  - use Supabase pooler host on port `6543`
  - include `pgbouncer=true`, `sslmode=require`, and `connection_limit=1`
- `DIRECT_URL`:
  - use direct connection on port `5432`
  - include `sslmode=require`

Automation applied:

- `scripts/render-build-core-api.sh` now uses:
  - `DIRECT_URL` for `prisma migrate deploy` when available
  - `DATABASE_URL` fallback when `DIRECT_URL` is not set
  - `DATABASE_URL` fallback when `DIRECT_URL` is set but migration authentication fails

Why:

- runtime traffic uses pooled connections (better latency and connection handling)
- migrations use direct DB connection (more reliable for schema operations)

### Common error: `P1000` on `DIRECT_URL`

Symptom during Render build:

- `Authentication failed ... provided database credentials ... are not valid`
- host usually shows `...pooler.supabase.com:5432`

Fix checklist:

1. Re-copy the exact connection strings from Supabase (same password in both URLs).
2. Keep password URL-encoded (`%2B`, `%24`, `%25`, etc.).
3. Ensure `DATABASE_URL` uses `6543` with `pgbouncer=true`.
4. Ensure `DIRECT_URL` uses `5432` with `sslmode=require`.
5. Redeploy.

Safety behavior:

- if `DIRECT_URL` migration fails, build script now retries migration with `DATABASE_URL`
  so deploys are not blocked by a single misconfigured direct URL.
