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

## 12) Purchase-order patch reliability + validation clarity

Problem observed:

- production logs showed repeated `PATCH /api/v1/erp/purchase-orders/:id` failures with `400`
- users also saw mixed `401`/`400` browser errors, while frontend toasts could surface raw JSON text that was hard to interpret quickly
- soft-delete style patches could unnecessarily flow through full purchase-order line-item rebuild/validation

Implemented:

- backend purchase-order update hardening in `apps/core-api/src/erp/purchasing/purchasing.service.ts`:
  - added a delete-only patch path (`{ deleted_at }`) that updates deletion state directly without rebuilding line items
  - added strict `deleted_at` parsing/validation for safer patch handling
- frontend purchase-order form validation hardening in `apps/erp-web/src/app.tsx`:
  - quantity and received quantity now require whole numbers before submit
  - `approved_by` now validates as UUID when provided
- API error readability improvements in `packages/api-client/src/index.ts`:
  - added structured error extraction to prefer backend `error.message` values over raw response text
- added backend unit regression coverage in:
  - `apps/core-api/src/erp/purchasing/purchasing.service.spec.ts`
  - new test confirms delete-only patch updates succeed without line-item rebuild
- bumped product version to `Beta V1.11.3`

Files:

- `apps/core-api/src/erp/purchasing/purchasing.service.ts`
- `apps/core-api/src/erp/purchasing/purchasing.service.spec.ts`
- `apps/erp-web/src/app.tsx`
- `packages/api-client/src/index.ts`
- `apps/core-api/src/system/system.controller.ts`
- `apps/crm-web/src/app.tsx`
- `CHANGELOG.md`
- `docs/versioning.md`
- `index.md`

Validation:

- `pnpm --filter @sphincs/core-api test -- purchasing.service.spec.ts` passed
- `pnpm --filter @sphincs/erp-web build` passed
- `pnpm --filter @sphincs/crm-web build` passed

## 13) CRM popup-only relation pickers (Leads and Opportunities)

Problem observed:

- Leads and Opportunities still had inline dropdown selectors in addition to popup browse modals
- this made relation selection feel duplicated and visually heavier than needed

Implemented:

- updated CRM Leads contact selection UI in `apps/crm-web/src/app.tsx`:
  - removed inline contact dropdown from the picker block
  - kept popup browse modal as the single selection path
  - added `Clear` button when a contact is selected
- updated CRM Opportunities lead selection UI in `apps/crm-web/src/app.tsx`:
  - removed inline lead dropdown from the picker block
  - kept popup browse modal as the single selection path
  - added `Clear` button when a lead is selected
- bumped product version to `Beta V1.11.4`

Files:

- `apps/crm-web/src/app.tsx`
- `apps/core-api/src/system/system.controller.ts`
- `apps/erp-web/src/app.tsx`
- `CHANGELOG.md`
- `docs/versioning.md`
- `index.md`

Validation:

- `pnpm --filter @sphincs/crm-web build` passed
- `pnpm --filter @sphincs/erp-web build` passed

### 6) Full system specification PDF

Problem observed:

- the product vision existed as a draft in chat form, but not yet as a durable long-term platform document
- the project needed a proper system-level blueprint that explains the end product beyond the current beta implementation details

Implemented:

- created a full written system specification in:
  - `docs/sphincs-full-system-spec.md`
- generated a polished PDF version in:
  - `output/pdf/sphincs-full-system-spec.pdf`
- added a dedicated PDF generation script in:
  - `scripts/generate_full_system_spec_pdf.py`
- linked both the markdown source and PDF from:
  - `docs/index.md`

Coverage included in the spec:

- product vision
- platform architecture
- tenant model
- ERP and CRM module scope
- core systems
- onboarding
- subscription tiers
- cross-module workflows
- relational backbone expectations
- expansion roadmap

Files:

- `docs/sphincs-full-system-spec.md`
- `output/pdf/sphincs-full-system-spec.pdf`
- `scripts/generate_full_system_spec_pdf.py`
- `docs/index.md`

Validation:

- PDF generated successfully at `output/pdf/sphincs-full-system-spec.pdf`
- basic artifact check confirmed the file was written successfully
- visual PDF page rendering was not available in this environment because `pdftoppm` is not installed

Revision:

- upgraded the PDF styling to use:
  - branded cover treatment
  - embedded SPHINCS logo from `assets/branding`
  - structured header/footer
  - page numbering
  - stronger section styling for a more polished document feel
- sanity-checked the styled PDF with `PyPDF2`:
  - 14 pages detected
  - cover and first content page text extracted successfully
- `pnpm --filter @sphincs/core-api test` passed

### 2) CRM UX consistency pass

Problem observed:

- CRM still mixed two different interaction patterns:
  - Contacts used the older generic resource page
  - Leads and Opportunities already used the newer custom workflow pattern
- CRM relation pickers were readable but not yet searchable inside the modal flow
- empty-state guidance was uneven across CRM pages

Implemented:

- replaced the old generic Contacts screen with a custom CRM page in:
  - `apps/crm-web/src/app.tsx`
- aligned Contacts, Leads, and Opportunities around the same structure:
  - consistent page header
  - lightweight create form
  - inline edit form
  - searchable table
  - soft-delete and restore actions
- added searchable modal browsing for:
  - contact selection in Leads
  - lead selection in Opportunities
- added stronger empty-state guidance so users know what to create next when a CRM list is empty
- bumped product release to:
  - `Beta V1.10.0`

Files:

- `apps/crm-web/src/app.tsx`
- `apps/core-api/src/system/system.controller.ts`
- `docs/beta-v2-checklist.md`
- `CHANGELOG.md`
- `docs/versioning.md`
- `docs/index.md`
- `index.md`

Validation:

- `pnpm --filter @sphincs/crm-web build` passed

### 3) Data and safety hardening pass

Problem observed:

- destructive actions still triggered too easily across ERP and CRM list pages
- purchase-order drafts could lose a line item with a single click
- several key form flows still relied on backend/API validation for avoidable bad input cases

Implemented:

- added explicit confirmation prompts before:
  - ERP soft-delete and restore actions for items, suppliers, and purchase orders
  - CRM soft-delete and restore actions for contacts, leads, and opportunities
  - purchase-order line-item removal inside the workflow editor
- added clearer client-side validation across the most important beta forms:
  - ERP items
  - ERP suppliers
  - ERP purchase orders
  - CRM contacts
  - CRM leads
  - CRM opportunities
- validation now catches issues like:
  - missing required linked records
  - invalid email formatting
  - negative numeric values
  - invalid purchase-order quantities and receiving values
- bumped product release to:
  - `Beta V1.10.1`

Files:

- `apps/erp-web/src/app.tsx`
- `apps/crm-web/src/app.tsx`
- `apps/core-api/src/system/system.controller.ts`
- `docs/beta-v2-checklist.md`
- `CHANGELOG.md`
- `docs/versioning.md`
- `index.md`

Validation:

- `pnpm --filter @sphincs/crm-web build` passed
- `pnpm --filter @sphincs/erp-web build` passed
- `pnpm --filter @sphincs/core-api test` passed

### 4) Quality and observability coverage pass

Problem observed:

- Beta V2 quality work existed, but some of it was not yet reflected clearly in the checklist or testing docs
- shared-session reuse and forced re-login behavior needed executable frontend coverage
- production smoke steps needed a cleaner repeatable checklist for post-deploy validation

Implemented:

- added frontend regression tests for:
  - shared-session reuse in ERP
  - shared-session reuse in CRM
  - forced session-expiry recovery in ERP
  - forced session-expiry recovery in CRM
- confirmed existing backend e2e smoke already covers:
  - auth login
  - signup
  - `/auth/me`
  - ERP items fetch
  - bug-report submission
- updated testing documentation with:
  - current frontend regression coverage
  - backend smoke coverage summary
  - repeatable production smoke checks for Beta V2
- marked the following Beta V2 checklist items complete:
  - bug-report e2e coverage
  - documented repeatable production smoke checks

Files:

- `apps/erp-web/src/app.test.tsx`
- `apps/crm-web/src/app.test.tsx`
- `docs/testing.md`
- `docs/beta-v2-checklist.md`

Validation:

- `pnpm --filter @sphincs/erp-web test` passed
- `pnpm --filter @sphincs/crm-web test` passed
- `pnpm --filter @sphincs/core-api test:e2e` passed

### 5) Login credential prefill cleanup

Problem observed:

- both ERP and CRM login screens still prefilled the admin beta email and password for any visitor who opened the site
- this looked sloppy and exposed the default admin credentials too casually on first load

Implemented:

- removed the default admin email and password from:
  - `apps/erp-web/src/app.tsx`
  - `apps/crm-web/src/app.tsx`
- both login forms now start blank and require intentional user input
- bumped product release to:
  - `Beta V1.10.2`

Files:

- `apps/erp-web/src/app.tsx`
- `apps/crm-web/src/app.tsx`
- `apps/core-api/src/system/system.controller.ts`
- `CHANGELOG.md`
- `docs/versioning.md`
- `index.md`

Validation:

- `pnpm --filter @sphincs/erp-web build` passed
- `pnpm --filter @sphincs/crm-web build` passed
## 6) Multi-phase beta roadmap expansion

Problem observed:

- planning existed for Beta V2, but there was no staged execution path beyond it
- the project now has a full system vision, so later-phase roadmap work needs to be broken into explicit beta checkpoints
- without named post-V2 checklists, future work would be easier to blur together and harder to sequence cleanly

Implemented:

- created a staged release-path document covering:
  - Beta V2
  - Beta V3
  - Beta V4
  - Beta V5
  - Beta V6
  - final product direction
- created dedicated planned execution checklists for:
  - `docs/beta-v3-checklist.md`
  - `docs/beta-v4-checklist.md`
  - `docs/beta-v5-checklist.md`
  - `docs/beta-v6-checklist.md`
- positioned each phase around a distinct job:
  - Beta V3 = relational backbone and connected workflow
  - Beta V4 = platform core maturity
  - Beta V5 = commercial operations expansion
  - Beta V6 = ecosystem and production-candidate readiness
- updated both documentation indexes so the new staged roadmap is discoverable from the root project docs and the docs landing page

Files:

- `docs/release-path-roadmap.md`
- `docs/beta-v3-checklist.md`
- `docs/beta-v4-checklist.md`
- `docs/beta-v5-checklist.md`
- `docs/beta-v6-checklist.md`
- `docs/index.md`
- `index.md`

Notes:

- this change does not bump the runtime product version because it is roadmap/documentation planning, not a shipped platform behavior change
- Beta V2 remains the active execution phase until its hard-stop criteria are actually satisfied
## 7) Beta V2 operations documentation pass

Problem observed:

- Beta V2 still had open operational checklist items even though the product-side work had moved much further ahead
- there was no single repeatable release checklist, no short tester release-note template, and no explicit triage/labeling standard to keep issue handling disciplined during the rest of Beta V2
- the versioning and changelog habits were already being followed in practice, but the supporting operational docs were missing

Implemented:

- created `docs/beta-release-checklist.md` for repeatable beta deployment readiness and post-deploy smoke validation
- created `docs/beta-release-notes-template.md` for short tester-facing release notes
- created `docs/issue-triage-workflow.md` to define intake, labeling, priority, and closure rules for beta issues
- created `docs/github-labels-and-milestones.md` to standardize labels, severity tags, module tags, and beta milestones
- updated `docs/beta-v2-checklist.md` to mark the Beta Operations documentation items complete
- updated `docs/index.md` and `index.md` so the new operational docs are easy to find from both entry points

Files:

- `docs/beta-release-checklist.md`
- `docs/beta-release-notes-template.md`
- `docs/issue-triage-workflow.md`
- `docs/github-labels-and-milestones.md`
- `docs/beta-v2-checklist.md`
- `docs/index.md`
- `index.md`

Notes:

- runtime product version remains `Beta V1.10.2` because this pass adds process documentation, not shipped product behavior
- this closes most of the remaining Beta V2 operations block and gives us a cleaner path to the final hard-stop items
## 8) Beta V1 closeout validation refresh

Problem observed:

- the Beta V1 checklist was functionally complete, but the remaining deferred security closeout still needed to be separated clearly from product-scope completion
- we needed a fresh validation snapshot to confirm the current codebase still satisfies the Beta V1 baseline before focusing fully on Beta V2

Implemented:

- refreshed core validation for the Beta V1 baseline:
  - `pnpm --filter @sphincs/core-api test`
  - `pnpm --filter @sphincs/core-api test:e2e`
  - `pnpm --filter @sphincs/erp-web build`
  - `pnpm --filter @sphincs/crm-web build`
- updated `docs/backend-final-sweep.md` with:
  - a local validation refresh snapshot dated `2026-03-20`
  - explicit Supabase and Render password-rotation steps
  - a clearer statement that Beta V1 product scope is complete and only the external secret-rotation closeout remains

Files:

- `docs/backend-final-sweep.md`

Notes:

- Beta V1 is complete on the product/code side
- the only unfinished Beta V1 item is the external infrastructure secret rotation and post-rotation production sweep
- no runtime version bump was made because this pass confirms status and docs rather than changing shipped behavior
## 9) Beta V2 access-control hardening pass

Problem observed:

- Beta V2 still lacked a real admin-facing role-management surface even though access/session hardening was a core release requirement
- backend user updates did not yet revoke active refresh sessions on critical account changes such as role updates, password resets, disablement, or deletion
- ERP and CRM reused shared session storage, but they were still too dependent on stale client-side role data until the next full re-login or token refresh

Implemented:

- locked `users` and `roles` management endpoints behind admin-only access
- upgraded `roles` lookup to read active roles from the database instead of a hard-coded list
- expanded `users` backend behavior to:
  - return role-aware user records
  - assign roles on create
  - sync role assignments on update
  - revoke active refresh sessions on critical account changes
- removed the role requirement from `/api/v1/auth/me` so active users with zero roles can still resolve a clean account-state response
- added an ERP `Access` page for admins to:
  - list users
  - create users
  - assign and remove roles
  - change account status
  - restore deleted users
- added shared startup role-sync behavior in ERP and CRM via `/auth/me`
- added cleaner auth notice handling when sessions expire or access changes
- added backend and frontend test coverage for:
  - role-assignment behavior
  - refresh-session invalidation after role changes
  - startup no-access sync behavior in ERP and CRM
- bumped product version to `Beta V1.11.0`

Files:

- `apps/core-api/src/core/auth/auth.controller.ts`
- `apps/core-api/src/core/roles/roles.controller.ts`
- `apps/core-api/src/core/roles/roles.service.ts`
- `apps/core-api/src/core/users/users.controller.ts`
- `apps/core-api/src/core/users/users.service.ts`
- `apps/core-api/src/core/users/users.service.spec.ts`
- `apps/core-api/test/auth-items.e2e-spec.ts`
- `packages/api-client/src/index.ts`
- `packages/ui-core/src/ui.css`
- `apps/erp-web/src/app.tsx`
- `apps/erp-web/src/app.test.tsx`
- `apps/crm-web/src/app.tsx`
- `apps/crm-web/src/app.test.tsx`
- `apps/core-api/src/system/system.controller.ts`
- `CHANGELOG.md`
- `docs/versioning.md`
- `docs/testing.md`
- `docs/beta-v2-checklist.md`
- `index.md`

Validation:

- `pnpm --filter @sphincs/core-api test` passed
- `pnpm --filter @sphincs/core-api test:e2e` passed
- `pnpm --filter @sphincs/erp-web test` passed
- `pnpm --filter @sphincs/crm-web test` passed
- `pnpm --filter @sphincs/erp-web build` passed
- `pnpm --filter @sphincs/crm-web build` passed

Notes:

- this closes a meaningful chunk of the Beta V2 access/session block, but the checklist still keeps cross-app single-session verification and the remaining account-state messaging item open until they are explicitly finished
## 10) Beta V2 account-state messaging follow-up

Problem observed:

- the access-control hardening pass improved role sync and session invalidation, but the account-state messaging still needed clearer wording for disabled and no-role users
- if we are going to count Beta V2 access behavior as serious, the system cannot hide behind generic auth wording when the real problem is account state

Implemented:

- updated backend login and `/auth/me` behavior so disabled accounts now return a clearer admin-contact message
- updated API client unauthorized handling so a post-refresh `401` can preserve the backend message instead of collapsing into a generic session-expired fallback
- updated ERP and CRM role-denied views so zero-role users now see a specific `no active platform roles` message rather than the generic module-denied copy
- added test coverage for:
  - disabled-account login messaging
  - no-role account login rejection
  - ERP no-role startup message
  - CRM no-role startup message

Files:

- `apps/core-api/src/core/auth/auth.service.ts`
- `apps/core-api/src/core/auth/auth.service.spec.ts`
- `packages/api-client/src/index.ts`
- `apps/erp-web/src/app.tsx`
- `apps/erp-web/src/app.test.tsx`
- `apps/crm-web/src/app.tsx`
- `apps/crm-web/src/app.test.tsx`
- `CHANGELOG.md`

Validation:

- `pnpm --filter @sphincs/core-api test` passed
- `pnpm --filter @sphincs/core-api test:e2e` passed
- `pnpm --filter @sphincs/erp-web test` passed
- `pnpm --filter @sphincs/crm-web test` passed
- `pnpm --filter @sphincs/erp-web build` passed
- `pnpm --filter @sphincs/crm-web build` passed

Notes:

- this improves the open Beta V2 account-state messaging item, but I am still leaving the checklist conservative until the remaining blocked/cross-app verification language is explicitly finished
## 10) Purchase-order overlap hotfix

Problem observed:

- live ERP purchase-order screens could feel visually overlapped on some desktop widths
- the line-item grid could force page-wide horizontal overflow, making the summary panel appear crowded into editor content
- the issue was reported from production usage and required an immediate UI stability patch

Implemented:

- updated shared UI layout constraints in `packages/ui-core/src/ui.css`:
  - added `min-width: 0` guards for shell/editor containers to prevent runaway overflow behavior in nested grids
  - tuned `purchase-order-workflow` columns to a safer desktop split (`main + fixed summary width`)
  - made `purchase-order-line-items` horizontally scrollable within the section instead of stretching the whole page
  - added explicit minimum widths for line-item grids so overflow is handled in the section, not by the page
  - added an earlier desktop breakpoint (`max-width: 1400px`) to stack workflow and summary before they crowd each other
- bumped product version to `Beta V1.11.1`

Files:

- `packages/ui-core/src/ui.css`
- `apps/core-api/src/system/system.controller.ts`
- `apps/erp-web/src/app.tsx`
- `apps/crm-web/src/app.tsx`
- `CHANGELOG.md`
- `docs/versioning.md`
- `index.md`

Validation:

- `pnpm --filter @sphincs/erp-web build` passed
- `pnpm --filter @sphincs/crm-web build` passed

Notes:

- this patch targets layout stability only and does not change backend behavior
- it is designed to reduce overlap perception and improve usability on narrower desktop windows without changing the existing visual theme

## 11) Purchase-order medium-desktop fit follow-up

Problem observed:

- after the first overlap hotfix, some real-world desktop widths still felt crowded in the purchase-order workflow
- users could still perceive sections as visually colliding because the two-column split stayed active too long on medium desktop widths

Implemented:

- updated shared UI in `packages/ui-core/src/ui.css`:
  - reduced purchase-order header grid minimum field width (`220px -> 180px`) so controls wrap sooner instead of compressing
  - changed the purchase-order workflow stack breakpoint from `1400px` to `1760px` so summary/sidebar moves below editor earlier on desktop
- bumped product version to `Beta V1.11.2`

Files:

- `packages/ui-core/src/ui.css`
- `apps/core-api/src/system/system.controller.ts`
- `apps/erp-web/src/app.tsx`
- `apps/crm-web/src/app.tsx`
- `CHANGELOG.md`
- `docs/versioning.md`
- `index.md`

Validation:

- `pnpm --filter @sphincs/erp-web build` passed
- `pnpm --filter @sphincs/crm-web build` passed
