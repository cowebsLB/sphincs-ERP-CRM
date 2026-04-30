# Monorepo Overview

- `apps/erp-web`: **Unified** ERP + CRM UI (React + Vite; hash routes for items, suppliers, purchase orders, distribution, access, contacts, leads, opportunities)
- `apps/crm-web`: **Redirect stub** only (Vite + TypeScript); sends the browser to the unified ERP app origin (`VITE_ERP_WEB_URL`), preserving the hash for bookmarks
- `apps/core-api`: Backend API (NestJS)
- `packages/shared-types`: shared DTO/contracts
- `packages/api-client`: typed client helpers
- `packages/ui-core`: shared UI primitives/tokens

