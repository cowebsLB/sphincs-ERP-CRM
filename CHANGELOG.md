# Changelog

This changelog tracks the product release line for SPHINCS ERP + CRM.

Package versions such as `0.1.0` are kept separate from product release versions.
The product release line for the beta program uses `Beta V<major>.<minor>.<patch>`.

## Current Release

- `Beta V1.11.4` - current active beta snapshot as of 2026-03-20

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
