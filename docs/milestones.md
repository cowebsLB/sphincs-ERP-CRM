# Milestones And Tickets

## Goal

Deliver Phase 1 as a usable internal alpha with:

- Separate ERP and CRM web apps
- Shared modular API
- Supabase Postgres persistence
- Auth + RBAC + branch/org scoping
- Soft delete and audit traceability

## Progress Snapshot (2026-03-16)

- Milestone 1.1: Completed (local Postgres validation)
  - Prisma client wiring completed
  - Initial migration baseline committed and applied locally
  - Seed script committed and validated locally
  - Runtime endpoint checks completed (`/health`, `/api/v1/system/info`)
  - Next: repeat deploy/seed flow on Supabase target environment
- Milestone 2 and ERP persistence track: In progress
- Milestone 2 and backend hardening track: Completed
  - Prisma-backed services completed for:
    - organizations
    - branches
    - users
    - items
    - suppliers
    - purchase_orders
    - contacts
    - leads
    - opportunities
  - Auth and RBAC hardening completed:
    - DB-backed login with bcrypt verification
    - legacy sha256 hash auto-upgrade on successful login
    - refresh-token DB persistence + rotation (`refresh_tokens`)
    - JWT bearer role checks resolved from DB (`user_roles` + `roles`)
  - Audit persistence completed:
    - audit writes now stored in `audit_logs`
  - Soft-delete restore endpoints completed for core/ERP/CRM resources
  - Remaining:
    - expand integration/e2e backend test coverage for DB auth/RBAC/audit/restore paths
    - run the same migrate/seed and smoke checks against Supabase target

- Frontend implementation track: In progress
- Frontend implementation track: In progress (phase 2)
- Frontend implementation track: In progress (phase 4 test baseline)
  - Completed:
    - auth login + token persistence in ERP and CRM apps
    - protected routing per app
    - role-gated app shell access (ERP vs CRM)
    - API wiring for ERP resources (items/suppliers/purchase-orders)
    - API wiring for CRM resources (contacts/leads/opportunities)
    - soft-delete and restore actions in both apps
    - reusable shared UI components in `packages/ui-core` (`DataTable`, `ResourceManager`)
    - real edit forms replacing JSON patch prompt flow
    - search/sort/pagination table behavior across resource screens
    - shared style system and app shell layout (sidebar + topbar)
    - toast feedback for create/update/delete/restore actions
    - inline required-field validation in resource forms
    - Vitest + React Testing Library setup in ERP and CRM apps
    - app-level tests for login render, login success path, and role-block behavior
    - GitHub Pages deployment pipeline for monorepo frontends (`/erp` + `/crm`)
  - Remaining:
    - expand frontend tests for session refresh flow and CRUD resource interactions
    - optional: richer charts/widgets and advanced filter presets

## Milestone 1: Backend Persistence Foundation

### T1.1 Prisma Client + Database Bootstrapping

- Scope:
  - Wire generated Prisma client usage in `core-api`
  - Ensure extension support for `gen_random_uuid()`
  - Add local and CI-safe DB initialization notes
- Acceptance criteria:
  - `core-api` compiles with Prisma client types enabled
  - Connection to Supabase Postgres succeeds via `DATABASE_URL`
  - Documented setup steps are reproducible

### T1.2 Migrations And Schema Baseline

- Scope:
  - Create initial migration from current schema
  - Validate enums, `TIMESTAMPTZ`, UUID defaults, indexes
- Acceptance criteria:
  - Migration applies cleanly on empty DB
  - All required tables and indexes exist
  - Migration history is committed and deterministic

### T1.3 Seed Data

- Scope:
  - Seed one organization, one branch, base roles, and one admin user
- Acceptance criteria:
  - Fresh DB is usable immediately after `migrate + seed`
  - Admin can authenticate and retrieve profile

## Milestone 2: Core Platform Security And Access

### T2.1 Real Auth Flow

- Scope:
  - Replace scaffold auth with DB-backed user verification
  - Keep JWT access/refresh pattern
- Acceptance criteria:
  - `/api/v1/auth/login`, `/refresh`, `/me` work with seeded admin
  - Invalid credentials are rejected with consistent error envelope

### T2.2 RBAC Enforcement

- Scope:
  - Enforce role policies for ERP and CRM route groups
  - Verify Admin/ERP Manager/CRM Manager/Staff behaviors
- Acceptance criteria:
  - Forbidden access is blocked correctly per role
  - Role checks are covered by unit + integration tests

### T2.3 Org/Branch Scope Enforcement

- Scope:
  - Enforce `organization_id` and `branch_id` rules on list/read/write endpoints
- Acceptance criteria:
  - Cross-organization data access is impossible
  - Branch-scoped queries return only allowed records

## Milestone 3: ERP Module Completion (DB-backed)

### T3.1 Items CRUD

- Scope:
  - DB-backed CRUD for `/api/v1/erp/items`
  - Soft-delete support and default filtering
- Acceptance criteria:
  - Items persist to DB
  - Soft-deleted items excluded unless explicitly requested

### T3.2 Suppliers CRUD

- Scope:
  - DB-backed CRUD for `/api/v1/erp/suppliers`
  - Traceability fields populated (`created_by`, `updated_by`)
- Acceptance criteria:
  - Supplier records are persisted and auditable
  - List queries are scoped and indexed

### T3.3 Purchase Orders Workflow

- Scope:
  - DB-backed CRUD for `/api/v1/erp/purchase-orders`
  - Validate status transitions
- Acceptance criteria:
  - Status lifecycle is enforced
  - Workflow actions generate audit entries

## Milestone 4: CRM Module Completion (DB-backed)

### T4.1 Contacts CRUD

- Scope:
  - DB-backed CRUD for `/api/v1/crm/contacts`
  - Soft-delete and scoping behavior
- Acceptance criteria:
  - Contacts persist and filter correctly

### T4.2 Leads Workflow

- Scope:
  - DB-backed CRUD for `/api/v1/crm/leads`
  - Status enum handling and transition validation
- Acceptance criteria:
  - Lead status lifecycle is enforced and test-covered

### T4.3 Opportunities Workflow

- Scope:
  - DB-backed CRUD for `/api/v1/crm/opportunities`
  - Status validation and scoped queries
- Acceptance criteria:
  - Opportunity lifecycle works end-to-end
  - Audit trail records status changes

## Milestone 5: Audit, Logging, And Ops Hardening

### T5.1 Audit Persistence

- Scope:
  - Persist audit events to `audit_logs` table
  - Support filtering by action/entity/user/date
- Acceptance criteria:
  - Mutating ERP/CRM operations produce queryable audit rows

### T5.2 Request Logging Standardization

- Scope:
  - Standardize operational request logs:
    - method, path, user_id, duration, status_code
- Acceptance criteria:
  - Logs are emitted consistently for all requests
  - Failed requests include status and duration

### T5.3 Health + System Endpoints

- Scope:
  - Keep `/health` and `/api/v1/system/info` production-ready
- Acceptance criteria:
  - Health indicates service and DB readiness
  - System info returns version/environment/build hash/timestamp

## Milestone 6: Frontend Integration (ERP + CRM)

### T6.1 Shared API Client Integration

- Scope:
  - Use `packages/api-client` and `packages/shared-types` in both web apps
- Acceptance criteria:
  - Frontends consume real API responses with typed contracts

### T6.2 ERP UI Basic Screens

- Scope:
  - Login + app shell
  - Items, Suppliers, Purchase Orders list/create/edit views
- Acceptance criteria:
  - ERP user completes one full purchase-order flow in UI

### T6.3 CRM UI Basic Screens

- Scope:
  - Login + app shell
  - Contacts, Leads, Opportunities list/create/edit views
- Acceptance criteria:
  - CRM user completes lead-to-opportunity flow in UI

## Milestone 7: Quality Gates And Alpha Exit

### T7.1 Test Expansion

- Scope:
  - Add unit + integration + e2e coverage for persistence and scopes
- Acceptance criteria:
  - Critical paths have passing automated tests in CI

### T7.2 Internal Alpha Readiness

- Scope:
  - Validate setup docs, environment config, and happy-path workflows
- Acceptance criteria:
  - New developer can run and verify system from docs only
  - Internal team can execute core ERP and CRM workflows end-to-end

## Recommended Execution Order

1. Milestone 1
2. Milestone 2
3. Milestone 3 and Milestone 4 in parallel
4. Milestone 5
5. Milestone 6
6. Milestone 7
