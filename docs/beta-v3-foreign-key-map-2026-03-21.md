# Beta V3 Foreign Key Map

Date: 2026-03-21  
Scope: Beta V3 relational backbone kickoff

## Objective

Define the exact foreign keys that Beta V3 must enforce at the database level, including safe migration order and known lifecycle exceptions.

## Current State (As Of 2026-03-21)

The schema already stores relation columns for major ERP/CRM links, but several are UUID fields without DB-enforced foreign keys:

- `purchase_orders.supplier_id` (UUID, nullable, no FK)
- `purchase_order_line_items.item_id` (UUID, nullable, no FK)
- `leads.contact_id` (UUID, nullable, no FK)
- `opportunities.lead_id` (UUID, nullable, no FK)

The platform also has many `organization_id` and `branch_id` columns in business tables without explicit DB relations, which leaves cross-tenant and cross-branch integrity mostly application-enforced today.

## Required FK Additions

## Phase A: Core Relation FKs

1. `purchase_orders.supplier_id -> suppliers.id`  
   - Nullability: keep nullable for draft workflows  
   - Suggested delete behavior: `ON DELETE SET NULL`
2. `purchase_order_line_items.item_id -> items.id`  
   - Nullability: keep nullable for description-only/manual lines  
   - Suggested delete behavior: `ON DELETE SET NULL`
3. `leads.contact_id -> contacts.id`  
   - Nullability: keep nullable for lead-first capture flows  
   - Suggested delete behavior: `ON DELETE SET NULL`
4. `opportunities.lead_id -> leads.id`  
   - Nullability: keep nullable for direct opportunity creation (if allowed)  
   - Suggested delete behavior: `ON DELETE SET NULL`

## Phase B: Organization Backbone FKs

Add `organization_id -> organizations.id` where table lifecycle and tenancy rules require hard DB integrity:

- `items.organization_id`
- `suppliers.organization_id`
- `purchase_orders.organization_id`
- `contacts.organization_id`
- `leads.organization_id`
- `opportunities.organization_id`
- `audit_logs.organization_id` (nullable; enforce when present)

## Phase C: Branch FKs (Branch-Aware Tables)

Add `branch_id -> branches.id` for branch-scoped tables:

- `items.branch_id`
- `suppliers.branch_id`
- `purchase_orders.branch_id`
- `contacts.branch_id`
- `leads.branch_id`
- `opportunities.branch_id`

Notes:

- Keep `branch_id` nullable where records can be organization-wide.
- DB FK alone does not guarantee branch belongs to the same organization; Beta V3 must pair this with composite integrity checks and service-level validation.

## Migration Safety Order

1. Preflight data audit
   - Detect orphan relation IDs for each target FK.
   - Detect tenant mismatches (`record.organization_id != related.organization_id`).
   - Detect branch/org mismatches (`branch.organization_id != record.organization_id`).
2. Data cleanup migration
   - Null invalid optional relation IDs.
   - Repair or archive tenant-invalid records (case-by-case).
3. Add constraints incrementally
   - Add core relation FKs first (Phase A).
   - Add organization and branch FKs after data cleanup (Phases B/C).
4. Validate in staging with production-like seed snapshot.
5. Ship with post-migration verification queries and regression tests.

## Tables Intentionally App-Level (For Now)

These columns are intentionally not converted to strict FKs in this phase because they represent actor metadata with soft lifecycle semantics:

- `created_by` and `updated_by` across business tables
- `audit_logs.user_id` may remain nullable/soft-referential depending on retention and user deletion policy

Reason: hard FK enforcement here can block delete/retention strategies and is not required for the Beta V3 relational backbone hard-stop.

## Acceptance Gate For This Mapping Step

This mapping step is complete when:

- target FK list is explicit and reviewable
- migration order is defined
- known lifecycle exceptions are documented

Status: completed on 2026-03-21.
