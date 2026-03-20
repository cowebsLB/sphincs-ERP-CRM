# Implementation Worklog - 2026-03-20

## Purpose

Track implementation work completed on 2026-03-20 for SPHINCS ERP + CRM.

## Context

- Current active product version at start of day: `Beta V1.9.0`
- Current focus: `Beta V2` checklist execution
- Previous worklog: `docs/implementation-worklog-2026-03-19.md`

## Entries

### 1) Frontend stale-session recovery hardening

Problem observed in production logs:

- protected ERP routes correctly returned `401`
- refresh attempts then hit `refresh_reuse_detected`
- frontend still held stale session data and could get stuck retrying invalid refresh state instead of falling back cleanly to login

Implemented:

- updated shared API client in:
  - `packages/api-client/src/index.ts`
- added explicit `AuthSessionExpiredError` handling for refresh failure paths
- updated ERP and CRM auth wrappers in:
  - `apps/erp-web/src/app.tsx`
  - `apps/crm-web/src/app.tsx`
- stale or reused refresh-token failures now:
  - clear the stored session client-side
  - force the app back into a clean sign-in path
- added this recovery requirement to the Beta V2 checklist under access/session hardening
- bumped product release to:
  - `Beta V1.9.1`

Files:

- `packages/api-client/src/index.ts`
- `apps/erp-web/src/app.tsx`
- `apps/crm-web/src/app.tsx`
- `apps/core-api/src/system/system.controller.ts`
- `docs/beta-v2-checklist.md`
- `CHANGELOG.md`
- `docs/versioning.md`
- `index.md`

Validation:

- `pnpm --filter @sphincs/erp-web build` passed
- `pnpm --filter @sphincs/crm-web build` passed
- `pnpm --filter @sphincs/core-api test` passed
