# SPHINCS Release Path Roadmap

Date: 2026-03-20
Status: Active roadmap draft
Scope: staged release path from Beta V2 through final product direction

## Purpose

This roadmap turns the long-term product vision into staged execution checkpoints.

Each beta stage should have a clear job:

- Beta V2 finishes and hardens the current foundation
- Beta V3 connects the data model and workflows more deeply
- Beta V4 matures the platform core and business structure
- Beta V5 expands operational intelligence and financial depth
- Beta V6 prepares the platform for a production-candidate path
- Final Product represents the long-term end-state target

This roadmap exists to stop the project from becoming a pile of loosely related tasks.

## Release Philosophy

Every staged beta should do one of these things well:

- strengthen the platform core
- connect business workflows across modules
- improve data integrity and tenant safety
- make the product more operationally complete
- make the platform more commercially real

If a task does not clearly fit the current beta objective, it belongs in a later stage.

## Beta V2: Operational Foundation

Primary goal:

Make the existing ERP, CRM, auth, and beta operations clean enough to function as a serious operational beta.

Focus areas:

- access and session hardening
- ERP usability rebuild
- CRM consistency
- safer destructive flows
- testing discipline
- release and triage discipline

Success test:

The current platform feels stable, usable, and maintainable enough for real beta testing.

Checklist:

- [Beta V2 Checklist](./beta-v2-checklist.md)

## Beta V3: Relational Backbone And Connected Workflow

Primary goal:

Turn the platform from a mostly functional beta into a more strongly connected business system.

Focus areas:

- add stronger foreign-key relationships across ERP and CRM business tables
- improve tenant and branch data ownership guarantees
- connect CRM pipeline progression to ERP-side operational follow-through where appropriate
- strengthen audit traceability around cross-module actions
- stabilize cross-app session and role-change behavior with stronger automated coverage

Success test:

The platform no longer feels like separate records connected only by convention. Core entities are structurally linked and safer to report on.

Checklist:

- [Beta V3 Checklist](./beta-v3-checklist.md)

## Beta V4: Platform Core Maturity

Primary goal:

Make SPHINCS feel like a real business platform, not just two apps sharing a backend.

Focus areas:

- onboarding flow maturity
- plan and subscription structure
- role and permission maturity
- organization and branch management improvements
- dashboard and business-home experience
- stronger admin tooling and internal controls

Success test:

A new business can sign up, create its tenant structure, land in a coherent home experience, and operate with clearer administrative control.

Checklist:

- [Beta V4 Checklist](./beta-v4-checklist.md)

## Beta V5: Commercial Operations Expansion

Primary goal:

Add the next layer of operational depth so the platform starts supporting broader day-to-day business management.

Focus areas:

- finance and accounting foundations
- analytics and reporting foundations
- procurement enrichment
- richer CRM lifecycle management
- role-aware dashboards and KPI visibility
- internal business intelligence groundwork

Success test:

SPHINCS starts moving beyond record management into true operational oversight and decision support.

Checklist:

- [Beta V5 Checklist](./beta-v5-checklist.md)

## Beta V6: Ecosystem And Production-Candidate Readiness

Primary goal:

Prepare the system for broader real-world usage, external connectivity, and a more production-ready operating posture.

Focus areas:

- integrations and external APIs
- billing and commercial platform readiness
- automation and plugin foundation
- advanced compliance-minded controls
- performance, reliability, and support readiness
- release governance and production-candidate standards

Success test:

The platform is not only feature-rich enough, but structurally mature enough, to move toward production-candidate expectations.

Checklist:

- [Beta V6 Checklist](./beta-v6-checklist.md)

## Final Product Direction

The final product should deliver:

- a connected ERP and CRM operating system
- strong tenant-aware and branch-aware business ownership
- reliable RBAC and auditability
- connected CRM-to-ERP workflows
- commercial plan structure and onboarding
- operational analytics and future automation
- extensibility through integrations and platform services

The final product is not defined by having every possible module.
It is defined by having a coherent, connected, scalable business system.

## Planning Rule

Before starting work for any new beta phase:

1. finish the hard-stop criteria for the current phase
2. confirm the next phase checklist is still aligned with the full system specification
3. avoid pulling future-phase work into the current phase unless it is a prerequisite

## Current Working Sequence

1. Close Beta V2 properly
2. Move into Beta V3 relational and workflow hardening
3. Mature the platform core in Beta V4
4. Expand operational depth in Beta V5
5. Prepare for production-candidate maturity in Beta V6
6. Continue toward the full end-state product with clearer confidence and less chaos
