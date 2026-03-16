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

## Notes

- `pnpm.onlyBuiltDependencies` is configured in root `package.json` to allow Prisma/Nest build scripts needed for client generation.
- Initial migration SQL is committed at:
  - `apps/core-api/prisma/migrations/20260316_init/migration.sql`
