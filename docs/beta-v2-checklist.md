# Beta V2 Checklist

Date: 2026-03-19
Target Release: `Beta V2.0.0`
Status: Execution Checklist

## Core Rule

Beta V2 is not about adding random new modules.

Beta V2 is about making the current platform operational, cleaner, safer, and easier to use.

If a task does not clearly improve:

- core ERP workflows
- core CRM workflows
- access/session safety
- release discipline
- tester/admin usability

then it belongs in Beta V3, not Beta V2.

## 1) Access And Identity

- [x] Role management UI can safely assign and remove roles.
- [x] Critical role changes invalidate active sessions correctly.
- [x] Disabled, blocked, and no-role account states show clear messages.
- [x] ERP/CRM role-denied flows always give the user a recovery path.
- [x] Auth/session behavior is consistent across ERP and CRM.
- [x] Stale, expired, or reused refresh tokens are cleared client-side and force a clean re-login path.
- [x] Cross-app single-session flow is verified after login, refresh, logout, and role changes.

## 2) ERP UX Rebuild

### Items

- [x] Replace the current generic item form with a compact drawer or modal flow.
- [x] Default visible item fields are:
  - `name`
  - `sku`
  - `status`
  - `selling_price`
  - `category`
  - `track_inventory`
  - `quantity_on_hand`
- [x] Add collapsed `Pricing` section:
  - `cost_price`
  - `currency`
  - `tax_rate`
  - `discountable`
- [x] Add collapsed `Inventory` section:
  - `reorder_level`
  - `max_stock_level`
  - `unit_of_measure`
  - `barcode`
- [x] Add collapsed `Classification` section:
  - `tags`
  - `brand`
  - `description`
- [x] Add hidden `Advanced` section:
  - `is_service`
- [x] `is_service = true` hides or disables inventory controls.
- [x] `track_inventory = false` hides stock controls cleanly.
- [x] Create mode is minimal and fast.
- [x] Edit mode exposes richer fields without cluttering create flow.

### Suppliers

- [x] Replace the current generic supplier form with a structured profile flow.
- [x] Default visible supplier fields are:
  - `name`
  - `supplier_code`
  - `status`
  - `phone`
  - `email`
- [x] Add `Address` section:
  - `country`
  - `city`
  - `address_line_1`
  - `address_line_2`
  - `postal_code`
- [x] Add `Financial` section:
  - `payment_terms`
  - `currency`
  - `tax_id`
  - `vat_number`
  - `credit_limit`
  - `balance` (read-only)
- [x] Add `Contact Person` section:
  - `contact_name`
  - `contact_email`
  - `contact_phone`
- [x] Add `Advanced / Internal` section:
  - `notes`
  - `rating`
  - `preferred_supplier`
  - `website`
  - `mobile`
- [x] Internal/admin-only fields are visually separated from primary entry fields.
- [x] Read-only financial values are never editable as normal inputs.

### Purchase Orders

- [x] Keep purchase orders as a full-page workflow, never a modal.
- [x] Build PO header area with:
  - `po_number` (read-only / auto-generated)
  - `supplier`
  - `status`
  - `order_date`
  - `expected_delivery_date`
  - `payment_terms`
- [x] Build line-items table/grid with:
  - `item picker`
  - `description override`
  - `quantity`
  - `unit_cost`
  - `tax_rate`
  - `discount`
  - `line_total` (computed)
- [x] Line items support:
  - add row
  - remove row
  - duplicate row
- [x] Add summary sidebar with:
  - `subtotal`
  - `total_tax`
  - `total_discount`
  - `grand_total`
  - `payment_status`
  - `notes`
  - `shipping_address`
  - `shipping_method`
  - `tracking_number`
- [x] Totals are computed live and read-only.
- [x] Workflow-state visibility is enforced:
  - draft
  - submitted
  - approved
  - received
  - cancelled
- [x] Approval fields only appear when the workflow actually needs them.
- [x] Receiving fields only appear when the order has progressed to receiving stages.
- [x] Partial delivery support is implemented or explicitly deferred with a documented constraint.

## 3) CRM UX Consistency

- [x] Contacts, Leads, and Opportunities share consistent page structure and state handling.
- [x] Relation pickers remain readable and searchable across CRM flows.
- [x] Empty, loading, and error states are standardized across CRM pages.
- [x] Create flows are minimal.
- [x] Edit flows expose richer detail without overloading initial entry.

## 4) Data And Safety

- [x] Destructive actions use explicit confirmation patterns.
- [x] Soft-delete restore paths are visible and understandable.
- [ ] Hard-delete admin flows have strong guardrails or remain restricted.
- [x] Read-only and computed fields are not presented as editable inputs.
- [x] Org/branch/audit metadata stays hidden from normal create/edit forms.
- [x] Form validation is clear and prevents common bad-input paths before API failure.

## 5) Backend And Data Shape

- [x] Items backend supports the expanded field set required for Beta V2 UX.
- [x] Suppliers backend supports the expanded field set required for Beta V2 UX.
- [x] Purchase orders backend supports composite transaction data cleanly.
- [x] PO line items are modeled in a way that supports totals and workflow states.
- [x] Approval/receiving fields are either implemented cleanly or explicitly deferred with docs.
- [x] Validation rules match frontend conditional behavior.
- [ ] Existing user-level data isolation remains intact after model expansion.

## 6) Quality And Observability

- [x] Add e2e coverage for role-change and forced session invalidation.
- [x] Add automated coverage for cross-app single-session behavior.
- [x] Add e2e coverage for bug-report submission.
- [x] Add meaningful flow coverage for upgraded ERP item, supplier, and purchase-order behavior.
- [x] Add regression coverage for conditional form behavior.
- [x] Production smoke checks are documented and repeatable.

## 7) Beta Operations

- [x] Create a repeatable release checklist for beta deployments.
- [x] Create a short tester-facing release note template.
- [x] Create an issue triage workflow doc.
- [x] Standardize GitHub issue labels/milestones for Beta V2 execution.
- [x] Every meaningful product update is logged in `CHANGELOG.md`.
- [x] Product version is bumped consistently until `Beta V2.0.0`.

## 8) Non-Goals

- [ ] No full design system rebuild.
- [ ] No mobile-perfect overhaul as a release blocker.
- [ ] No major brand-new ERP/CRM modules.
- [ ] No deep analytics/reporting suite in Beta V2.

This section is complete only when these remain out of scope during Beta V2 execution.

## 9) Hard Stop Definition

Beta V2 is complete only when all of these are true:

- [x] Access/session hardening is shipped and validated.
- [x] Items UX rebuild is shipped.
- [x] Suppliers UX rebuild is shipped.
- [x] Purchase-order workflow screen is shipped.
- [x] CRM page consistency and relation flows are stable.
- [ ] Critical e2e and smoke checks pass.
- [ ] Release, changelog, and triage workflow are active and being used.

## 10) Immediate Execution Order

- [x] Finalize this checklist as the Beta V2 source of truth.
- [x] Implement `Items` rebuild first.
- [x] Implement `Suppliers` rebuild second.
- [x] Implement `Purchase Orders` workflow rebuild third.
- [x] Finish access/session hardening tasks in parallel where safe.
- [ ] Close Beta V2 only after the hard-stop section is truly satisfied.
