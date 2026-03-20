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
