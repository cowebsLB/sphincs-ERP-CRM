# Beta Release Checklist

Date: 2026-03-20
Scope: repeatable checklist for SPHINCS beta deployments
Status: Active

## Purpose

This checklist exists so beta releases are not pushed on vibes alone.

Use it for every meaningful beta deployment until `Beta V2.0.0` is closed.

## 1) Pre-Release Decision

- [ ] Confirm the release belongs to the current beta phase.
- [ ] Confirm the release has a clear version number.
- [ ] Confirm the matching changelog entry exists.
- [ ] Confirm the relevant worklog entry exists.
- [ ] Confirm any docs impacted by behavior changes are updated.

## 2) Code And Data Readiness

- [ ] Confirm the target branch is up to date and the intended commit is known.
- [ ] Confirm no accidental or unrelated files are being included.
- [ ] Confirm required Prisma migrations exist for backend/data-shape changes.
- [ ] Confirm migration notes are documented if production data could be affected.
- [ ] Confirm seeded/default data changes are intentional.

## 3) Validation Gates

- [ ] Run backend tests.
- [ ] Run frontend build for ERP.
- [ ] Run frontend build for CRM.
- [ ] Run any phase-specific regression coverage required for the release.
- [ ] Confirm no critical known issue is being knowingly shipped without documentation.

Recommended commands:

```powershell
pnpm --filter @sphincs/core-api test
pnpm --filter @sphincs/erp-web build
pnpm --filter @sphincs/crm-web build
```

Add more commands when the release specifically touches e2e, migrations, or targeted module tests.

## 4) Runtime Metadata

- [ ] Update runtime version in `apps/core-api/src/system/system.controller.ts` when the product release changes.
- [ ] Update any frontend version metadata used in bug reporting or UI labels.
- [ ] Confirm version strings match `CHANGELOG.md` and `docs/versioning.md`.

## 5) Deployment Readiness

- [ ] Confirm Render backend build path is correct.
- [ ] Confirm GitHub Pages frontend deployment path is correct.
- [ ] Confirm required environment variables exist for the release.
- [ ] Confirm new backend secrets or config values are documented before deploy.
- [ ] Confirm migration deploy path is understood before shipping schema changes.

## 6) Post-Deploy Smoke Checks

- [ ] Check `/health`.
- [ ] Check `/api/v1/system/info`.
- [ ] Confirm ERP login works with a clean session.
- [ ] Confirm CRM login works with a clean session.
- [ ] Confirm shared-session behavior works as expected across ERP and CRM.
- [ ] Confirm the release's primary changed workflow works in production.
- [ ] Confirm bug reporting still works.

## 7) Release Communication

- [ ] Publish or store tester-facing release notes using the beta template.
- [ ] Link any known limitations or follow-up issues.
- [ ] Tag the release against the current beta milestone if applicable.
- [ ] Ensure the GitHub issue triage view reflects the new release state.

## 8) Release Closeout

- [ ] Record final validation notes in the implementation worklog.
- [ ] Confirm the changelog is the source of truth for the shipped version.
- [ ] Confirm any unfinished release risk is explicitly documented.
- [ ] Only then treat the release as complete.
