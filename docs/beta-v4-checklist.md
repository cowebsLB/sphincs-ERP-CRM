# Beta V4 Checklist

Date: 2026-03-20
Target Release: `Beta V4.0.0`
Status: Planned execution checklist

## Core Rule

Beta V4 is about platform maturity.

The goal is to make SPHINCS feel like one real business platform with a proper home, structure, and admin experience.

## 1) Onboarding And Tenant Creation

- [ ] Build a structured sign-up flow that includes plan selection.
- [ ] Capture personal account information during onboarding.
- [ ] Capture organization information during onboarding.
- [ ] Create the initial branch during onboarding.
- [ ] Create the initial admin user and default role assignments automatically.
- [ ] Redirect new accounts into a coherent post-onboarding home experience.
- [ ] Add clear recovery paths for partially completed onboarding states.

## 2) Subscription And Plan Structure

- [ ] Define `Personal`, `Studio`, and `Company` plan rules in documentation and system behavior.
- [ ] Add plan-aware feature gating foundations.
- [ ] Add plan-aware user and branch limit handling.
- [ ] Add plan-aware messaging in onboarding and settings.
- [ ] Document what remains hard-coded or deferred for later billing work.

## 3) Dashboard And Home Experience

- [ ] Create a shared business-home dashboard direction.
- [ ] Show role-aware shortcuts into ERP and CRM.
- [ ] Show useful business summary cards for the current plan and role.
- [ ] Show recent business activity or audit-aware activity feed.
- [ ] Surface alerts or attention states that matter for small business operators.
- [ ] Keep the dashboard useful even when business data is still sparse.

## 4) Role And Permission Maturity

- [ ] Expand role management UI beyond basic assignment.
- [ ] Define clearer permission boundaries for ERP, CRM, and admin operations.
- [ ] Improve admin messaging around restricted actions.
- [ ] Add permission documentation that future developers can actually follow.
- [ ] Add tests around high-risk permission combinations.

## 5) Organization And Branch Administration

- [ ] Improve organization settings and editable business profile management.
- [ ] Improve branch management UX and lifecycle handling.
- [ ] Clarify when records are org-wide versus branch-aware.
- [ ] Add safer admin flows for branch changes and branch assignment updates.
- [ ] Document branch strategy and expected usage patterns.

## 6) Shared Product Shell

- [ ] Finish a coherent app shell shared across ERP and CRM.
- [ ] Standardize headers, navigation, settings entry points, and global actions.
- [ ] Standardize account menus, logout behavior, and support/report actions.
- [ ] Ensure home, login, and in-app shell all feel like the same platform.

## 7) Admin Controls And Internal Safety

- [ ] Add stronger guardrails around admin-only destructive actions.
- [ ] Separate internal/admin-only data from normal operator screens more clearly.
- [ ] Improve support and diagnostic visibility for account-state problems.
- [ ] Document internal operational controls for platform admins.

## 8) Hard Stop Definition

Beta V4 is complete only when all of these are true:

- [ ] New users can onboard into a real tenant structure cleanly.
- [ ] Plans, roles, and business structure feel coherent rather than implied.
- [ ] ERP and CRM feel like one platform with a shared home and shell.
- [ ] Admin operations are safer and easier to understand.
- [ ] Documentation explains how platform-core business setup really works.

## 9) Immediate Execution Order

- [ ] Define onboarding requirements and data shape.
- [ ] Ship tenant creation flow.
- [ ] Ship dashboard/home experience.
- [ ] Harden role and branch administration.
- [ ] Finalize plan/permission documentation before closing Beta V4.
