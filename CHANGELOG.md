# Changelog

This changelog tracks the product release line for SPHINCS ERP + CRM.

Package versions such as `0.1.0` are kept separate from product release versions.
The product release line for the beta program uses `Beta V<major>.<minor>.<patch>`.

## Current Release

- `Beta V1.13.0` - current active beta snapshot as of 2026-03-21

## Beta V1.13.0 - 2026-03-21

### Added

- First Beta V3 CRM-to-ERP operational handoff endpoint:
  - `POST /api/v1/crm/opportunities/:id/handoff/purchase-order`
- New e2e coverage validating CRM opportunity handoff creates ERP draft purchase orders.
- New documentation for handoff rules and payload contract.

### Changed

- Opportunity service now supports `WON`-gated handoff to ERP purchasing and creates draft PO payloads through the existing purchasing service.
- Opportunities module now imports ERP purchasing module to support the cross-module handoff path.

## Beta V1.12.2 - 2026-03-21

### Fixed

- Resolved CI e2e regression in `test_core_api` where purchase-order create flow returned `500` due to missing mocked Prisma delegates.
- Added `supplier.findFirst` and `item.findFirst` support in the core-api e2e Prisma mock so relation-scope validations execute correctly in CI.

## Beta V1.12.1 - 2026-03-21

### Added

- Automated tenant/branch safety coverage for relation-linking flows in:
  - ERP purchasing
  - CRM leads
  - CRM opportunities
- New unit coverage for cross-tenant and cross-branch relation rejection on both create and update paths.

### Changed

- Purchasing service now validates `supplier_id` and `line_items[].item_id` against the caller's organization and branch scope before write operations.
- Leads service now validates `contact_id` relation scope before create/update.
- Opportunities service now validates `lead_id` relation scope before create/update.

## Beta V1.12.0 - 2026-03-21

### Added

- Beta V3 relational backbone migration scaffolding with DB-level foreign keys for:
  - `purchase_orders.supplier_id -> suppliers.id`
  - `purchase_order_line_items.item_id -> items.id`
  - `leads.contact_id -> contacts.id`
  - `opportunities.lead_id -> leads.id`
- Organization foreign keys across core ERP/CRM business tables and optional audit-log organization linkage.
- Branch foreign keys across branch-aware ERP/CRM business tables.

### Changed

- Prisma schema now declares explicit relations for V3 backbone entities (including organization and branch links) so application models match DB constraints.
- Migration flow now includes defensive pre-constraint cleanup and integrity checks before enforcing new non-null organization foreign keys.

## Beta V1.11.11 - 2026-03-20

### Fixed

- Prevented ERP/CRM session bootstrap loops that could keep users stuck on `Restoring session...`.
- Session bootstrap now runs once per signed-in user instead of re-triggering on every token update.

## Beta V1.11.10 - 2026-03-20

### Changed

- Removed login-page shortcut links to `Home`, `ERP`, and `CRM` in both ERP and CRM apps.
- Moved the login back button to the top-left of the page for faster, clearer navigation.
- Simplified login header layout to keep focus on authentication.

## Beta V1.11.9 - 2026-03-20

### Added

- Swipe gesture support for mobile navigation drawers in ERP and CRM:
  - edge swipe right opens the sidebar
  - swipe left closes it

### Changed

- Body scrolling is now locked while the mobile sidebar drawer is open.
- Mobile shell overflow behavior is tightened to reduce horizontal drift while swiping.

## Beta V1.11.8 - 2026-03-20

### Added

- Mobile navigation drawer with collapsible sidebar behavior in ERP and CRM.
- Animated hamburger icon that transitions to an `X` when the drawer is open.
- Mobile overlay click-to-close behavior for the sidebar drawer.

### Changed

- Sidebar links now close the drawer automatically on mobile after navigation.
- Topbar now includes a dedicated nav-toggle control for small screens.

## Beta V1.11.7 - 2026-03-20

### Changed

- Added a mobile-testable baseline responsive pass for ERP/CRM app shell and shared UI:
  - app shell now stacks on smaller screens
  - sidebar and topbar adapt cleanly for phone widths
  - table wrappers now support horizontal scrolling
  - modal/auth spacing improved for small viewports
- This is intentionally a baseline usability pass for testing, not a full mobile-perfect redesign.

## Beta V1.11.6 - 2026-03-20

### Added

- Added service-level scope tests proving user-level data isolation for item, supplier, and purchase-order list queries.
- Added Beta V2 closeout evidence block in the checklist with exact command/test references.
- Added Beta V2 closeout run summary in testing docs.

### Changed

- Marked the remaining Beta V2 hard-stop checklist items as complete after passing critical automated checks and confirming hard-delete remains restricted to soft-delete/restore operational flows in this beta.

## Beta V1.11.5 - 2026-03-20

### Added

- Added backend auth unit coverage for blocked-account login messaging.
- Added frontend regression checks for shared-session token refresh sync and logout cleanup in ERP and CRM.
- Added backend e2e coverage for upgraded ERP create flows (item, supplier, purchase-order) plus non-integer PO quantity rejection.

### Changed

- Auth service now returns a dedicated blocked-account message (`Your account is blocked. Contact an admin.`) instead of folding blocked status into generic disabled messaging.
- ERP and CRM now preserve specific backend account-state messages after session expiry/refresh failure instead of always showing a generic re-login notice.
- Beta V2 checklist status updated for completed access/session and quality coverage items.

## Beta V1.11.4 - 2026-03-20

### Changed

- CRM Leads relation picker now uses popup-only selection (removed inline contact dropdown).
- CRM Opportunities relation picker now uses popup-only selection (removed inline lead dropdown).
- Added quick `Clear` actions in both popup-driven pickers to reset selected relation cleanly.

## Beta V1.11.3 - 2026-03-20

### Fixed

- Purchase-order soft-delete patch path no longer fails by re-validating full line-item payloads.
- Purchase-order client validation now blocks non-integer quantity and received-quantity values before API submission.
- API client now extracts structured backend error messages so `400` responses show readable causes instead of raw JSON blobs.

## Beta V1.11.2 - 2026-03-20

### Fixed

- Purchase-order workflow now stacks earlier on desktop (`<=1760px`) to prevent editor/summary crowding.
- Purchase-order header fields now wrap sooner to avoid squeezed inputs on medium desktop widths.

## Beta V1.11.1 - 2026-03-20

### Fixed

- Purchase-order layout no longer causes cross-panel overlap on narrower desktop viewports.
- Purchase-order line-item grids now scroll inside their section instead of stretching the full page width.
- Workflow column sizing now degrades earlier on smaller desktop widths so the summary panel does not crowd or clip editor content.

## Beta V1.11.0 - 2026-03-20

### Added

- ERP now includes an admin-facing `Access` screen for listing users, assigning/removing roles, creating accounts, and managing access state from inside the app.
- Added backend role-management support on `/api/v1/users` so role changes and account status updates return normalized role-aware user records.
- Added backend coverage for user role assignment and session revocation plus e2e coverage for refresh-session invalidation after role changes.

### Changed

- Critical account changes now revoke active refresh sessions so role, password, and account-state changes force a clean access recovery path.
- ERP and CRM now sync `/auth/me` on startup so shared sessions pick up updated role state instead of relying only on stale client storage.
- Role-denied flows now refresh user context more cleanly and push the user toward a recoverable sign-in path when access changed.
- Disabled accounts now receive a clearer admin-contact message, and zero-role accounts now receive explicit no-platform-role messaging in ERP and CRM.

## Beta V1.10.2 - 2026-03-20

### Fixed

- ERP and CRM login forms no longer preload the admin beta credentials for every visitor.
- Both login screens now start blank so testers must enter credentials intentionally instead of inheriting a default admin session hint.

## Beta V1.10.1 - 2026-03-20

### Fixed

- ERP and CRM destructive actions now require explicit confirmation before soft-delete or restore changes are applied.
- Purchase-order line removal now asks for confirmation before mutating the current draft.
- Frontend validation now catches common bad-input paths earlier across key ERP and CRM forms instead of deferring everything to API errors.

## Beta V1.10.0 - 2026-03-20

### Added

- CRM Contacts now use the same custom page pattern as Leads and Opportunities instead of falling back to the old generic resource screen.
- CRM contact and lead relation pickers now support in-modal searching for faster selection in larger tenant datasets.

### Changed

- CRM Contacts, Leads, and Opportunities now share the same page structure, lightweight create flow, inline edit flow, and table handling pattern.
- CRM empty states now explain the next useful action instead of leaving blank tables with no guidance.

## Beta V1.9.1 - 2026-03-20

### Fixed

- ERP and CRM now clear stale client sessions when refresh-token reuse or refresh-token expiry is detected.
- Reused/expired refresh tokens now force a clean sign-in recovery path instead of leaving the frontend stuck retrying invalid session state.

## Beta V1.9.0 - 2026-03-19

### Added

- Purchase orders now support a composite workflow data model with header fields, line items, computed totals, payment state, logistics, approval data, and receiving quantities.
- Added purchase-order line item modeling and backend tests for computed totals and receiving validation.

### Changed

- ERP purchase orders are now managed through a full workflow page instead of a thin header-only form.
- The purchase-order screen now separates:
  - header identity/timing
  - line-item grid editing
  - sticky summary and logistics sidebar
- Purchase-order statuses now align with the Beta V2 workflow stages:
  - `DRAFT`
  - `SUBMITTED`
  - `APPROVED`
  - `RECEIVED`
  - `CANCELLED`
- Partial delivery is now tracked at the line level through `received_quantity`.

## Beta V1.8.0 - 2026-03-19

### Added

- Beta V2 supplier profiles now support expanded identity, address, financial, contact-person, and internal fields on the backend.
- ERP Suppliers now have a structured create/edit flow with grouped sections and saved-state preview.
- Added supplier service tests covering defaults, financial/preferred flags, and invalid status rejection.

### Changed

- Supplier records are now rich business profiles that can support purchasing workflows instead of only basic contact stubs.
- Purchase-order supplier pickers now surface richer supplier metadata such as code and status.
- Supplier balance remains read-only in the profile flow so connected accounting values are not manually overwritten.

## Beta V1.7.3 - 2026-03-19

### Added

- ERP items now support click-to-preview so saved item details can be reviewed in a read-only modal before editing.

### Changed

- Item rows now feel interactive and open a structured saved-state preview instead of acting like static table output.
- The item SKU field is now hybrid by default: it auto-generates from the item name, stays editable, and shows live availability feedback.

## Beta V1.7.2 - 2026-03-19

### Fixed

- Long modals and popups now scroll correctly inside the viewport.
- The ERP item create/edit modal no longer traps lower sections and save actions off-screen.
- Shared modal styling now supports overflow safely for other long dialogs too.

## Beta V1.7.1 - 2026-03-19

### Fixed

- Expired access tokens on protected ERP/CRM routes now return proper `401 Unauthorized` responses instead of bubbling into `500` server errors.
- Roles guard now translates JWT verification failures into API-safe auth errors so the frontend refresh/login recovery flow can work correctly.
- Added guard test coverage for expired-token behavior.

## Beta V1.7.0 - 2026-03-19

### Added

- Beta V2 `Items` rebuild with a dedicated ERP item management screen.
- Progressive item modal flow with `Essentials`, `Pricing`, `Inventory`, `Classification`, and `Advanced` sections.
- Expanded item backend data shape for:
  - status
  - pricing
  - inventory
  - category
  - tags
  - brand
  - barcode
  - service behavior
  - tax and discount behavior
- Item service unit coverage for defaults, service-mode inventory behavior, and invalid status rejection.

### Changed

- ERP items now use a focused create/edit modal instead of the old generic resource form.
- Item create/edit behavior now adapts when inventory tracking is disabled or the item is marked as a service.
- Runtime app version metadata and bug-report version payloads now track `Beta V1.7.0`.

### Fixed

- Item input handling now validates and normalizes structured values instead of relying on a minimal free-form payload.

## Beta V1.6.0 - 2026-03-19

### Added

- CRM lead forms now use contact pickers instead of raw `contact_id` entry.
- CRM opportunity forms now use lead pickers instead of raw `lead_id` entry.
- ERP purchase-order forms now use supplier pickers instead of raw `supplier_id` entry.
- Dedicated browse modals were added for visible related records in ERP and CRM.
- Product-level versioning and changelog tracking were introduced for the beta program.

### Changed

- Purchase-order, lead, and opportunity tables now render readable relationship labels instead of internal UUIDs.
- Shared UI now supports cleaner relation-selection flows for Beta V1.
- Runtime app version metadata now aligns with the current beta release line.

### Fixed

- Invalid optional relation IDs and invalid status values no longer cause create-flow `500` errors.
- Bad relation/status payloads now return `400` responses with clearer validation messages.

## Beta V1.5.0 - 2026-03-19

### Added

- Unified ERP/CRM login session behavior.
- Landing page navigation/header improvements and branding alignment.
- In-app bug reporting wired to GitHub Issues.
- Better role-denied recovery with account switching.

### Changed

- Landing page, app shell, and login views were aligned to the dark gold beta palette.
- Header navigation was added across the platform.

### Fixed

- User deletion constraints were resolved with cascade behavior for token and role relations.

## Beta V1.0.0 - 2026-03-19

### Added

- Beta V1 baseline with:
  - ERP modules: items, suppliers, purchase orders
  - CRM modules: contacts, leads, opportunities
  - JWT auth, refresh flow, signup, role gating
  - user-scoped data isolation
  - soft delete and restore
  - deployable frontend and backend documentation
