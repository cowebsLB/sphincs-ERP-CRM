# Beta V2 Plan

Date: 2026-03-19  
Status: Draft Plan (Execution Guidance)

Execution checklist:

- [Beta V2 Checklist](./beta-v2-checklist.md)

## 1) Purpose

Beta V2 should move SPHINCS from "functional beta" to "operational beta":

- stronger role/access workflows
- better UX consistency
- tighter issue triage and release discipline
- safer data operations and admin controls

## 2) V2 Objectives

1. Improve user and admin workflows without expanding into full redesign.
2. Reduce operational friction for testers and maintainers.
3. Increase confidence in data integrity and permission behavior.
4. Prepare a clean runway for production candidate planning.

## 3) Scope Themes

### A) Access And Identity

- Role management UI improvements (assign/remove roles safely).
- Session invalidation on critical account/role changes.
- Better account state messaging (disabled/blocked/no-role cases).

### B) UX Consistency

- Unified top navigation patterns across ERP and CRM.
- Consistent page-level layout/styling for login/app shell/forms.
- Better empty/error/loading states on resource pages.

### C) Data And Safety

- Validate destructive flows with explicit confirmation patterns.
- Expand restore/history visibility for soft-deleted records.
- Add guardrails for admin-side hard deletes.

### D) Quality And Observability

- Expand e2e coverage for role-change, token refresh, and bug-report paths.
- Add smoke checks for cross-app single-session behavior.
- Standardize issue labels/triage conventions for faster bug routing.

### E) Beta Operations

- Build a repeatable release checklist for each deployment.
- Add short release notes template for tester-facing updates.
- Track V2 issues by milestone tags in GitHub.

## 4) Proposed Deliverables

1. Permission and session hardening updates.
2. UI consistency pass for core screens (not full visual redesign).
3. Expanded automated tests on critical workflows.
4. Operational docs:
   - release checklist
   - triage workflow
   - tester update template

## 5) Milestones (Suggested)

### M1: Foundations

- finalize V2 ticket breakdown
- define acceptance criteria per feature
- lock non-goals

### M2: Access + Session Hardening

- role-change logout behavior
- account-state handling polish
- related unit/e2e tests

### M3: UX Consistency Pass

- shared nav + layout cleanup
- standardized state handling (loading/error/empty)

### M4: Quality + Ops

- e2e expansion
- release/triage checklist docs
- beta release run-through

## 6) Non-Goals (For V2)

- Full design system rebuild
- Mobile-perfect UI overhaul
- Major new ERP/CRM modules outside current domain
- Deep analytics/reporting suite

## 7) Risks And Mitigations

- Risk: scope creep from feature requests  
  Mitigation: enforce non-goals and milestone acceptance gates.

- Risk: permission/session changes causing regressions  
  Mitigation: prioritize auth/role e2e coverage before rollout.

- Risk: operational noise from tester volume  
  Mitigation: strict issue label taxonomy and triage ownership.

## 8) Exit Criteria

Beta V2 is considered complete when:

1. Access/session hardening tasks are merged and validated.
2. Core UX consistency tasks are shipped and stable.
3. Critical e2e suite passes in CI and production smoke checks.
4. Release + triage documentation is active and used by the team.

## 9) Next Step

Use the execution checklist as the working Beta V2 source of truth:

- [Beta V2 Checklist](./beta-v2-checklist.md)
