# Versioning Strategy

## Goal

Use a stable product release line during the beta program so every meaningful update has:

- a readable product version
- a matching changelog entry
- a consistent value in runtime metadata and bug reports

## Rule

Product releases use:

- `Beta V<major>.<minor>.<patch>`

Examples:

- `Beta V1.0.0`
- `Beta V1.5.0`
- `Beta V1.6.1`
- `Beta V2.0.0`

This is separate from package versions such as `0.1.0`.

## Meaning

### Major

The major number changes when the beta line changes meaningfully.

Examples:

- `Beta V1.x.x` = Beta V1 stream
- `Beta V2.0.0` = Beta V2 launch line

### Minor

Increase the minor number when we add meaningful product-facing functionality, UX upgrades, or workflow improvements.

Examples:

- new onboarding flow
- new bug reporting flow
- major ERP or CRM form redesign
- purchase-order workflow upgrade

### Patch

Increase the patch number for targeted fixes and low-risk improvements that do not materially change the product surface.

Examples:

- validation fixes
- permission fixes
- UI polish
- bugfixes to existing flows
- docs-only updates tied to an already released version should not force a new release number unless the product changed

## Current Version

Current product version:

- `Beta V1.16.77`

Rationale:

- `Beta V1.0.0` marks the Beta V1 functional baseline.
- `Beta V1.5.0` marks the major usability pass:
  - unified login/session
  - branding pass
  - navigation polish
  - in-app bug reporting
  - recovery UX fixes
- `Beta V1.6.0` marks the relation-picker UX upgrade:
  - ERP purchase-order supplier picker
  - CRM lead contact picker
  - CRM opportunity lead picker
- `Beta V1.7.0` marks the first Beta V2 module rebuild:
  - expanded ERP item data model
  - progressive item create/edit modal
  - inventory/service-aware item form behavior
- `Beta V1.7.1` marks the production auth guard fix:
  - expired JWTs now return `401` instead of `500`
  - guard coverage added for expired-token handling
- `Beta V1.7.2` marks the modal overflow UX fix:
  - long forms and dialogs now scroll inside the viewport correctly
- `Beta V1.7.3` marks the item usability pass:
  - hybrid SKU generation with editable override
  - live SKU availability feedback
  - saved-state item preview on row click
- `Beta V1.8.0` marks the supplier profile rebuild:
  - expanded supplier backend shape for business, address, finance, and contact context
  - structured ERP supplier create/edit experience
  - supplier preview flow and richer purchase-order picker context
- `Beta V1.9.0` marks the purchase-order workflow rebuild:
  - composite purchase-order backend shape with line items and totals
  - full-page purchase-order workflow editor
  - approval, receiving, logistics, and payment state grouped without clutter
- `Beta V1.9.1` marks the stale-session recovery fix:
  - refresh-token reuse/expiry now clears invalid frontend session state
  - ERP and CRM fall back cleanly to sign-in instead of looping on refresh failures
- `Beta V1.10.0` marks the CRM consistency pass:
  - Contacts now use a first-class custom CRM page instead of the older generic resource manager
  - contact and lead pickers are searchable inside their browse modals
  - Contacts, Leads, and Opportunities now share clearer empty-state guidance and aligned create/edit handling
- `Beta V1.10.1` marks the data-safety hardening pass:
  - soft-delete and restore flows now require explicit user confirmation
  - purchase-order line removal now confirms before mutating the draft
  - frontend validation blocks common invalid ERP and CRM form submissions before they fall through to API errors
- `Beta V1.10.2` marks the login credential safety fix:
  - ERP and CRM login screens now start with empty email/password fields
  - beta visitors no longer see prefilled admin credentials on first load
- `Beta V1.11.0` marks the access-control hardening pass:
  - ERP now includes an admin-facing access management screen for user roles and status
  - critical account changes revoke active refresh sessions
  - ERP and CRM sync `/auth/me` on startup so stored sessions pick up updated role state
  - backend and e2e coverage now include role-change session invalidation
- `Beta V1.11.1` marks the purchase-order layout stability fix:
  - workflow grid sizing no longer squeezes the editor and summary into overlap on tighter desktop widths
  - line-item grids scroll inside their own section instead of forcing page-wide horizontal overflow
- `Beta V1.11.2` marks the purchase-order medium-desktop fit fix:
  - workflow now stacks earlier on desktop widths that still felt crowded in real usage
  - purchase-order header fields wrap sooner to reduce squeezed or visually colliding controls
- `Beta V1.11.3` marks the purchase-order patch reliability + error clarity fix:
  - soft-delete-only purchase-order patches no longer re-trigger full line-item validation
  - purchase-order form now validates integer-only quantity/received values before submission
  - API client now surfaces cleaner backend validation messages in frontend toasts
- `Beta V1.11.4` marks the CRM relation picker simplification:
  - Leads now select contacts through popup-only browse flow
  - Opportunities now select leads through popup-only browse flow
  - inline dropdown relation selectors removed from these CRM forms
- `Beta V1.11.5` marks the access/session + coverage closeout pass:
  - blocked-account messaging is now explicit and preserved through frontend auth-notice handling
  - shared-session behavior is now regression-tested for refresh token sync and logout cleanup in ERP and CRM
  - backend e2e now covers upgraded ERP create flows for items, suppliers, and purchase orders
- `Beta V1.11.6` marks Beta V2 checklist closeout evidence:
  - user-level data isolation is now backed by explicit service-level scope assertions for ERP core entities
  - critical automated checks are recorded as the Beta V2 closeout run
  - remaining Beta V2 hard-stop checklist gates are now explicitly closed with evidence references
- `Beta V1.11.7` marks the mobile-testable baseline pass:
  - shared UI shell/navigation/layout behavior now adapts for phone testing
  - table and modal overflow behavior is improved for smaller screens
  - this remains a practical testing baseline, not a full mobile-perfect design overhaul
- `Beta V1.11.8` marks the mobile navigation control pass:
  - ERP and CRM now use a collapsible sidebar drawer on small screens
  - the menu toggle animates from hamburger to `X` when open
  - overlay click and route navigation both close the drawer cleanly
- `Beta V1.11.9` marks the mobile nav interaction refinement pass:
  - edge-swipe open and swipe-close gestures are enabled for ERP and CRM side drawers
  - body scroll is locked while the drawer is open to keep mobile focus on navigation
- `Beta V1.11.10` marks the login navigation simplification pass:
  - login-page shortcut links were removed to reduce visual noise and mis-click paths
  - back navigation is now placed at the top-left of the login screen in ERP and CRM
- `Beta V1.11.11` marks the session-bootstrap stability fix:
  - ERP and CRM no longer re-bootstrap on every token update
  - users are no longer trapped on persistent `Restoring session...` screens caused by bootstrap loops

## Workflow For Future Updates

For every meaningful product update until `Beta V2.0.0`:

1. Decide whether the change is `minor` or `patch`.
2. Update the current product version string where applicable.
3. Add a dated entry to [CHANGELOG.md](../CHANGELOG.md).
4. If behavior or architecture changed, update the relevant docs/worklog too.

## Recommended Release Rule Of Thumb

- New workflow, major UX upgrade, or meaningful module expansion:
  - bump `minor`
- Fix to an existing workflow without expanding product scope:
  - bump `patch`

## Before Beta V2.0.0

Target release flow:

- `Beta V1.7.x` for fixes on the first Beta V2 module rebuild baseline
- `Beta V1.8.x` for supplier rebuild work ahead of Beta V2.0.0
- `Beta V1.9.x` for purchase-order workflow stabilization ahead of Beta V2.0.0
- `Beta V2.0.0` once the next major product milestone is intentionally declared
