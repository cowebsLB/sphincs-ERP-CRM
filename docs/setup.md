# Setup Guide

## Prerequisites

- Node.js 20+
- pnpm 10+
- **PostgreSQL 16** (recommended: Docker via the repo `docker-compose.yml`)

You can use a hosted Postgres (e.g. Supabase) or **local Docker** — set `DATABASE_URL` in `apps/core-api/.env` either way.

## Install

```bash
pnpm install
```

## Local database with Docker (recommended)

From the **repository root**:

```bash
docker compose up -d
```

If you get a Docker pipe/daemon error on Windows, start Docker Desktop first, then run the command again.

Wait until Postgres is healthy (`docker compose ps`). Default connection:

- Host: `localhost`
- Port: `5433`
- Database: `sphincs_erp_crm`
- User / password: `postgres` / `postgres` (dev only)

Create `apps/core-api/.env` from the template:

```bash
cp apps/core-api/.env.example apps/core-api/.env
```

Then apply migrations and seed:

```bash
pnpm --filter @sphincs/core-api prisma:generate
pnpm --filter @sphincs/core-api prisma:deploy
pnpm --filter @sphincs/core-api prisma:seed
```

## Run the stack

```bash
pnpm dev
```

Set `DATABASE_URL` in `apps/core-api/.env` if you use a non-default database.

## Local Postgres without Docker

Example:

```bash
createdb sphincs_erp_crm
```

Use a connection string that matches your local user/password, for example:

```env
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/sphincs_erp_crm?schema=public"
JWT_SECRET="change-me"
APP_VERSION="0.1.0"
NODE_ENV="development"
BUILD_HASH="local-postgres-validate"
```

## Database bootstrap (core-api)

Run these from the repo root:

```bash
pnpm --filter @sphincs/core-api prisma:generate
pnpm --filter @sphincs/core-api prisma:deploy
pnpm --filter @sphincs/core-api prisma:seed
```

## Blueprint vs implemented tables

To see which of the **107** blueprint tables are not yet in Prisma:

```bash
pnpm compare:blueprint
```

Output is written to [blueprint-vs-prisma-tables.md](./blueprint-vs-prisma-tables.md).

## Runtime smoke checks

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

## Frontend: ERP / CRM in development

When you run **`pnpm dev`**, workspaces start in parallel. By default (this repo):

| App   | Vite dev URL (hash router)   | Port |
| ----- | ---------------------------- | ---- |
| ERP   | `http://localhost:5173/#/…`  | 5173 |
| CRM   | `http://localhost:5174/#/…`  | 5174 |

**Top navigation (Home / ERP / CRM)** no longer relies only on relative `../` paths (which break across ports). In **development**, links use the origins above unless overridden:

- `VITE_HOME_URL` — portal “Home” (optional; defaults to ERP origin in dev).
- `VITE_ERP_WEB_URL` — ERP origin, no trailing slash (optional; defaults to `http://localhost:5173` in dev).
- `VITE_CRM_WEB_URL` — CRM origin (optional; defaults to `http://localhost:5174` in dev).

In **production** (e.g. static hosting with sibling folders), the same code falls back to relative `../`, `../erp/`, `../crm/` when those variables are unset.

**Subpath deploys:** If you set `VITE_PUBLIC_BASE` (Vite `base`) to something like `/erp/`, ensure **`VITE_ERP_WEB_URL` / `VITE_CRM_WEB_URL`** match the real public URLs so header links stay correct. React `HashRouter` uses **`basename`** derived from `import.meta.env.BASE_URL` so in-app routes align with the base path.

## Notes

- `pnpm.onlyBuiltDependencies` is configured in root `package.json` to allow Prisma/Nest build scripts needed for client generation.
- Migrations live under `apps/core-api/prisma/migrations/`.
- `core-api` start script points to `dist/src/main.js` (Nest build output path).
