# Implementation Worklog (2026-04-13)

## Context

This entry inventories the **entire local working tree** (modified, deleted, and untracked paths) as of 2026-04-13 relative to `origin/main`. Nothing here is implied to be pushed yet; it is a single checkpoint before commit.

## Tasks Completed (this session + accumulated tree)

### ERP web (`apps/erp-web`)

- **Distribution hub UI** (`src/distribution-hub.tsx`, new): tabbed UI wired to `GET/POST/PATCH` distribution API — overview dashboard, branch stock (with edit), movements (create + list), transfers (create + workflow actions), receipts (read-only list), dispatches (status actions), adjustments (workflow actions). Sidebar route `/distribution` and role gates aligned with API read/write/approve roles.
- **Purchase Orders** copy: clarifies that warehouse flows live under Distribution, not the PO screen.
- **Portal navigation**: `getPortalNavLinks()` + `hashRouterBasename()` — dev uses explicit `http://localhost:5173` / `http://localhost:5174` + hash entry paths; production falls back to relative `../`, `../erp/`, `../crm/`. Login “Back” uses portal home URL.
- **Vite**: `server.port: 5173`, `strictPort: true`.
- **Product label**: `Beta V1.16.77`.

### CRM web (`apps/crm-web`)

- **Portal navigation** (same pattern as ERP): fixes broken `../` top-nav under Vite dev and subpath `BASE_URL`.
- **`VITE_ERP_WEB_URL` dev default** for opportunity → ERP handoff when env is unset.
- **Vite**: `server.port: 5174`, `strictPort: true`.
- **`HashRouter basename`** from `import.meta.env.BASE_URL`.
- **Product label**: `Beta V1.16.77`.

### Shared UI (`packages/ui-core`)

- **`ui.css`**: layout classes for the ERP Distribution hub (tabs, metric grid, alert list, form grid, inline actions).

### Documentation (repo root + `docs/`)

- **`index.md`**: overview, version string, links (to be aligned with 1.16.77 in same commit batch).
- **`docs/index.md`**, **`docs/setup.md`**, **`docs/versioning.md`**, **`docs/database-schema.md`**, **`docs/database-system-design-reference.md`**, **`docs/versioning.md`**: ongoing edits (see git diff).
- **Removed** (per earlier roadmap cleanup): `docs/beta-v1-checklist.md` through `docs/beta-v6-checklist.md`, `docs/release-path-roadmap.md`.
- **Untracked / new docs**: `docs/SPHINCS-Database-System-Design.md`, `docs/blueprint-implementation-backlog.md`, `docs/blueprint-vs-prisma-tables.md`, `docs/implementation-roadmap.md`, `docs/implementation-worklog-2026-03-29.md`.

### Core API (`apps/core-api`)

- **Prisma**: `schema.prisma` and `seed.ts` changes; `migration_lock.toml` touched.
- **New migrations (untracked dirs)**:
  - `20260407062143_add_subscription_plans_core/`
  - `20260407212318_add_permissions_role_permissions_org_settings/`
- **New module (untracked)**: `src/core/permissions/` — permissions controller/service/module.
- **`app.module.ts`**: wires new/updated modules.
- **Organizations / roles**: controller + service updates (settings, permissions-related endpoints).
- **System controller**: minor change.
- **`.env.example`** (untracked): template for local env.

### Root / tooling

- **`docker-compose.yml`** (untracked): Postgres 16 for local dev.
- **`package.json`**, **`.gitignore`**: script entries / ignore rules.
- **Scripts (untracked)**: `scripts/blueprint_missing_by_domain.py`, `scripts/compare_blueprint_prisma_tables.py`, `scripts/extract_docx_blueprint.py`.
- **`CHANGELOG.md`**: accumulated entries (permissions, blueprint, docker, etc.).

## Problems Encountered

1. **Cross-app navigation in dev**: Relative `../erp/` / `../crm/` breaks when each Vite app runs on its own origin/port or when `BASE_URL` is a subpath; users saw CRM at confusing URLs (`/erp/` in path) and non-working top links.
2. **Role vs product surface**: Distribution API allows roles such as Warehouse Staff / Read-Only Auditor; ERP shell still gates on `Admin` | `ERP Manager` | `Staff` for the whole app — warehouse-only operators may need a follow-up gate change.

## Decisions Made

- **Dev portal URLs**: Default ERP to port **5173**, CRM to **5174**, overridable via `VITE_ERP_WEB_URL`, `VITE_CRM_WEB_URL`, `VITE_HOME_URL`.
- **Production**: Keep relative sibling URLs when env vars are not set (GitHub Pages–style layout).
- **HashRouter**: Pass `basename` derived from Vite `BASE_URL` so subpath deploys match router state.

## Files Touched (git summary)

Modified (tracked): `.gitignore`, `CHANGELOG.md`, `apps/core-api/prisma/migrations/migration_lock.toml`, `apps/core-api/prisma/schema.prisma`, `apps/core-api/prisma/seed.ts`, `apps/core-api/src/app.module.ts`, organizations + roles controllers/services, `system.controller.ts`, `apps/crm-web/src/app.tsx`, `apps/crm-web/vite.config.ts`, `apps/erp-web/src/app.tsx`, `apps/erp-web/vite.config.ts`, multiple `docs/*`, `index.md`, `package.json`, `packages/ui-core/src/ui.css`.

Deleted: seven legacy `docs/beta-*` checklists and `docs/release-path-roadmap.md`.

Untracked (high level): `apps/core-api/.env.example`, new Prisma migration folders, `apps/core-api/src/core/permissions/**`, `apps/erp-web/src/distribution-hub.tsx`, `docker-compose.yml`, large `docs/SPHINCS-Database-System-Design.md`, blueprint/roadmap docs and scripts, `docs/implementation-worklog-2026-03-29.md`.

## Next Steps

1. **Commit in logical chunks** (e.g. core-api schema/migrations/permissions separately from web UI, then docs).
2. Run **`pnpm --filter @sphincs/core-api`** tests / `prisma validate` / migrate against a disposable DB before merge.
3. **Verify** CRM + ERP dev URLs after `pnpm dev`: `http://localhost:5174/#/…`, `http://localhost:5173/#/…`.
4. Optional: extend ERP shell roles for distribution-only users; add E2E smoke for portal links under `VITE_PUBLIC_BASE`.
