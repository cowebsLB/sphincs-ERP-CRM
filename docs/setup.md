# Setup Guide

## Prerequisites

- Node.js 20+
- pnpm 10+
- **PostgreSQL 16** (Supabase recommended for parity; Docker optional for offline local DB)

You can use a hosted Postgres (e.g. Supabase) or **local Docker** — set `DATABASE_URL` in `apps/core-api/.env` either way.

## Install

```bash
pnpm install
```

## Supabase database (recommended)

Create `apps/core-api/.env` from the template:

```bash
cp apps/core-api/.env.example apps/core-api/.env
```

Update these values from your Supabase dashboard:

- `DATABASE_URL` (Supavisor pooler URL, port `6543`)
- `DIRECT_URL` (direct database URL, port `5432`)

Then apply migrations and seed:

```bash
pnpm --filter @sphincs/core-api prisma:generate
pnpm --filter @sphincs/core-api prisma:deploy
pnpm --filter @sphincs/core-api prisma:seed
```

The seed includes a **demo dataset** across implemented Prisma tables. See [Database Schema Standards — Demo database seed](./database-schema.md#demo-database-seed-implemented-prisma-models).

## Local database with Docker (optional)

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

The seed includes a **demo dataset** across implemented Prisma tables (second branch, catalog, procurement, CRM chain, inventory, distribution, audit). Details: [Database Schema Standards — Demo database seed](./database-schema.md#demo-database-seed-implemented-prisma-models).

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

## Frontend: unified ERP + CRM (`erp-web`)

**Primary UI:** `apps/erp-web` serves **both** ERP and CRM in one React app (hash routes `#/items`, `#/contacts`, etc.). Run it at:

| App   | Role | Vite dev URL (hash router)   | Port |
| ----- | ---- | ---------------------------- | ---- |
| ERP + CRM (unified) | main | `http://localhost:5173/#/…`  | 5173 |

Copy **`apps/erp-web/.env.example`** to **`.env.local`** and set **`VITE_API_BASE_URL`** to match **`core-api`** (default **`http://localhost:3000/api/v1`** — same host and port as `PORT` in `apps/core-api`, usually **3000**). The UI cannot load data if the API is not running.

**Legacy CRM port (`5174`):** `apps/crm-web` is a **redirect stub** (no React UI). Opening `http://localhost:5174/#/…` immediately redirects to the unified app, preserving the hash. Set **`VITE_ERP_WEB_URL`** in `crm-web` when the ERP origin is not the dev default.

**Top navigation (Home / ERP / CRM):** In **development**, “Home” can still use `VITE_HOME_URL` (optional). ERP and CRM entries in the header are **in-app** `Link` components when the user has access. Optional env vars for external portal URLs:

- `VITE_HOME_URL` — portal “Home” (optional; defaults to ERP origin in dev).
- `VITE_ERP_WEB_URL` / `VITE_CRM_WEB_URL` — still used where absolute ERP/CRM origins are needed (e.g. redirect stub, legacy scripts).

In **production** (e.g. static hosting with sibling folders), the same helpers can fall back to relative paths when those variables are unset.

**Subpath deploys:** If you set `VITE_PUBLIC_BASE` (Vite `base`) to something like `/erp/`, ensure public URLs in env match your hosting layout. React `HashRouter` uses **`basename`** derived from `import.meta.env.BASE_URL` so in-app routes align with the base path.

## Notes

- `pnpm.onlyBuiltDependencies` is configured in root `package.json` to allow Prisma/Nest build scripts needed for client generation.
- Migrations live under `apps/core-api/prisma/migrations/`.
- `core-api` start script points to `dist/src/main.js` (Nest build output path).
