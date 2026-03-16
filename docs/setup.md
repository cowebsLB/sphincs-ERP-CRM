# Setup Guide

## Prerequisites

- Node.js 20+
- pnpm 10+
- Supabase Postgres connection string

## Run

```bash
pnpm install
pnpm dev
```

Set `DATABASE_URL` in `apps/core-api/.env`.

## Database Bootstrap (core-api)

Run these from the repo root:

```bash
pnpm --filter @sphincs/core-api prisma:generate
pnpm --filter @sphincs/core-api prisma:deploy
pnpm --filter @sphincs/core-api prisma:seed
```

### Local Postgres (validated on 2026-03-16)

Example local database setup:

```bash
createdb sphincs_erp_crm
```

Example `apps/core-api/.env`:

```env
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/sphincs_erp_crm?schema=public"
JWT_SECRET="change-me"
APP_VERSION="0.1.0"
NODE_ENV="development"
BUILD_HASH="local-postgres-validate"
```

Runtime smoke checks:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/system/info
```

Auth smoke checks (after seed):

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@sphincs.local\",\"password\":\"ChangeMe123!\"}"
```

Use returned bearer token for protected endpoints.

## Notes

- `pnpm.onlyBuiltDependencies` is configured in root `package.json` to allow Prisma/Nest build scripts needed for client generation.
- Initial migration SQL is committed at:
  - `apps/core-api/prisma/migrations/20260316_init/migration.sql`
- `core-api` start script points to `dist/src/main.js` (Nest build output path).
