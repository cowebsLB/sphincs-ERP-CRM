# Changelog

This changelog tracks the product release line for SPHINCS ERP + CRM.

Package versions such as `0.1.0` are kept separate from product release versions.
The product release line for the beta program uses `Beta V<major>.<minor>.<patch>`.

## Current Release

- `Beta V1.6.0` - current active beta snapshot as of 2026-03-19

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
