# GitHub Labels And Milestones Standard

Date: 2026-03-20
Scope: SPHINCS beta issue organization
Status: Active standard

## Purpose

This document defines the minimum labeling and milestone structure for SPHINCS beta execution.

The goal is simple:

- make issues searchable
- make triage faster
- make beta-phase scope visible
- reduce confusion about what belongs in the current phase

## Recommended Label Sets

### Type

- `bug`
- `enhancement`
- `docs`
- `test`
- `ops`

### Severity

- `severity:critical`
- `severity:high`
- `severity:medium`
- `severity:low`

### Module

- `module:platform-core`
- `module:erp`
- `module:crm`
- `module:auth`
- `module:docs`
- `module:deployment`

### Area

Use these only when they add real value:

- `area:items`
- `area:suppliers`
- `area:purchase-orders`
- `area:contacts`
- `area:leads`
- `area:opportunities`
- `area:onboarding`
- `area:roles`
- `area:sessions`
- `area:bug-reporting`

### Status / Triage

- `status:confirmed`
- `status:needs-reproduction`
- `status:needs-clarification`
- `status:deferred`
- `status:duplicate`

## Recommended Milestones

- `Beta V2.0.0`
- `Beta V3.0.0`
- `Beta V4.0.0`
- `Beta V5.0.0`
- `Beta V6.0.0`

## Labeling Rules

- every actionable bug should have `bug`
- every issue should have one module label
- every meaningful bug should have a severity label
- every issue currently planned for delivery should have one beta milestone
- enhancement requests should be assigned to the beta phase they truly belong to

## Beta V2 Labeling Rule

For Beta V2 execution, prioritize labels that help close the current phase:

- auth/session
- ERP core workflows
- CRM consistency
- data safety
- testing gaps
- deployment/release blockers

If an issue clearly belongs to later phases, label and milestone it there instead of bloating Beta V2.

## Review Habit

When reviewing the issue board:

- filter by current milestone first
- then scan critical and high severity issues
- then scan unlabeled issues
- then scan issues with no milestone

That sequence keeps the board operational instead of decorative.
