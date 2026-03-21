# Beta V3 Checklist

Date: 2026-03-20
Target Release: `Beta V3.0.0`
Status: Planned execution checklist

## Core Rule

Beta V3 is about connected data and connected workflows.

If Beta V2 makes the current platform usable, Beta V3 makes it structurally trustworthy.

## 1) Relational Backbone

- [ ] Add a real foreign key from `purchase_orders.supplier_id` to `suppliers.id`.
- [ ] Add a real foreign key from `purchase_order_line_items.item_id` to `items.id`.
- [ ] Add a real foreign key from `leads.contact_id` to `contacts.id`.
- [ ] Add a real foreign key from `opportunities.lead_id` to `leads.id`.
- [ ] Add organization foreign keys across ERP business tables where lifecycle rules allow them.
- [ ] Add organization foreign keys across CRM business tables where lifecycle rules allow them.
- [ ] Add branch foreign keys across branch-aware business tables where lifecycle rules allow them.
- [ ] Document any business tables that intentionally stay app-level rather than DB-enforced.

## 2) Tenant And Branch Integrity

- [ ] Verify that organization scoping is enforced consistently in ERP read paths.
- [ ] Verify that organization scoping is enforced consistently in CRM read paths.
- [ ] Verify that create and update paths cannot link records across tenants.
- [ ] Verify that branch-scoped records cannot point to branches from another organization.
- [ ] Add automated tests for cross-tenant relation rejection.
- [ ] Add automated tests for cross-branch relation rejection where relevant.

## 3) CRM To ERP Workflow Connection

- [ ] Define the first supported CRM-to-ERP operational handoff.
- [ ] Document when an opportunity should trigger ERP-side follow-up versus remain CRM-only.
- [ ] Add a safe business-state transition path from lead to opportunity.
- [ ] Add an explicit "won" or downstream operational-ready opportunity flow.
- [ ] Log cross-module workflow transitions in audit history.
- [ ] Ensure the UI explains the relationship between CRM pipeline state and ERP action state.

## 4) Relationship-Aware UX

- [ ] Replace remaining raw relation IDs with searchable record pickers.
- [ ] Add linked-record previews where users need business context before selection.
- [ ] Surface key relationship context in list/detail views instead of only UUID references.
- [ ] Add safe empty-state guidance when a required upstream relation does not yet exist.
- [ ] Standardize related-record badges, labels, or summary chips across ERP and CRM.

## 5) Audit And Traceability

- [ ] Expand audit coverage for cross-module workflow actions.
- [ ] Ensure destructive and restorative flows capture actor and entity context clearly.
- [ ] Add better audit visibility for admin investigations.
- [ ] Document what is and is not captured in audit logs during Beta V3.

## 6) Access And Session Reliability

- [ ] Finish role-change invalidation coverage with meaningful e2e tests.
- [ ] Finish cross-app single-session coverage with meaningful e2e tests.
- [ ] Ensure role removal cleanly removes blocked access across ERP and CRM.
- [ ] Ensure stale local client state cannot keep a user stranded after role changes.

## 7) Reporting And Data Confidence

- [ ] Confirm upgraded relations do not break current beta records or migration paths.
- [ ] Add migration notes for any relational tightening that could affect seeded or legacy data.
- [ ] Add database documentation showing the stronger Beta V3 relationship map.
- [ ] Validate that reporting-oriented reads can rely on the new relations without fallback hacks.

## 8) Hard Stop Definition

Beta V3 is complete only when all of these are true:

- [ ] Core ERP and CRM records are backed by meaningful DB-enforced relationships.
- [ ] Tenant isolation remains intact after relational tightening.
- [ ] CRM and ERP feel more connected at both the data and workflow level.
- [ ] Cross-app session and role-change behavior is tested and trusted.
- [ ] Audit traces are clearer for connected business workflows.

## 9) Immediate Execution Order

- [x] Map and document required new foreign keys.
- [ ] Apply the relational backbone in safe migration order.
- [ ] Add automated tenant-safety coverage.
- [ ] Implement the first supported CRM-to-ERP handoff.
- [ ] Update docs and relationship diagrams before closing Beta V3.
