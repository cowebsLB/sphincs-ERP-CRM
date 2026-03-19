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

- `Beta V1.7.0`

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
- `Beta V1.8.0+` for additional ERP form and workflow rebuilds ahead of Beta V2.0.0
- `Beta V2.0.0` once the next major product milestone is intentionally declared
