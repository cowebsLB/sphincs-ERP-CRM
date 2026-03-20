# Issue Triage Workflow

Date: 2026-03-20
Scope: GitHub issue handling during the SPHINCS beta program
Status: Active workflow

## Purpose

This workflow keeps GitHub issues useful instead of turning them into a noisy pile.

Use it for tester-reported bugs, internal findings, and follow-up tasks created during Beta V1 and Beta V2.

## 1) Intake Rule

Every new issue should be checked for:

- clear summary
- affected module
- expected vs actual behavior
- basic reproduction steps
- severity signal if available
- route, app version, and context when available

If the report came from the in-app bug form, keep the structured context intact.

## 2) Labeling Rule

Every actionable issue should receive:

- one type label
- one module label
- one severity label when applicable
- one beta milestone when applicable

Do not over-label issues just because labels exist.

## 3) Initial Triage Outcome

Every issue should quickly land in one of these buckets:

- `confirmed`
- `needs reproduction`
- `needs clarification`
- `duplicate`
- `deferred`
- `closed`

If an issue is deferred, explain why and to which beta phase it belongs.

## 4) Priority Heuristics

Treat these as highest priority:

- auth/session failures
- data-loss risks
- tenant-isolation risks
- broken create/edit flows in core ERP or CRM modules
- production deploy blockers

Treat these as medium priority:

- broken but recoverable workflows
- confusing UX with a clear workaround
- missing guardrails around important actions

Treat these as lower priority:

- visual polish only
- low-impact copy issues
- later-phase enhancement requests

## 5) Beta Phase Assignment

Use the phase roadmap actively:

- Beta V2 issues = current-platform hardening, safety, consistency, and operational readiness
- Beta V3 issues = relational backbone, connected workflows, stronger data structure
- Beta V4+ issues = platform expansion, onboarding, plans, dashboards, finance, integrations, and later roadmap work

Do not quietly smuggle future-phase work into Beta V2 without calling it out.

## 6) Closure Rule

Before closing an issue:

- confirm the fix is shipped or intentionally rejected
- reference the release version if shipped
- reference the replacement issue if it was split or deferred
- leave a short closure note that future us can understand

## 7) Weekly Triage Habit

At least once per active beta cycle:

- review open critical and high-severity issues
- check that new issues have labels and milestones
- close duplicates
- move future-scope issues into the right beta phase
- confirm the current beta milestone still reflects reality
