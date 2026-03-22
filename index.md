# SPHINCS ERP+POS

## Project Overview

SPHINCS ERP+POS is a monorepo that delivers:

- a shared backend API (`apps/core-api`)
- ERP frontend (`apps/erp-web`)
- CRM frontend (`apps/crm-web`)
- shared packages for API client/types/UI (`packages/*`)

The current delivery target is Beta V1 with functional auth, scoped ERP/CRM flows, and deployment-ready documentation.

Current product version:

- `Beta V1.16.25`

## Features

- JWT auth with refresh-token rotation and lockout controls
- ERP modules: items, suppliers, purchase orders
- CRM modules: contacts, leads, opportunities
- Soft-delete + restore flows
- Role-based access controls
- User-scoped data isolation for beta privacy defaults
- CI test gate before Pages deploy

## Setup Instructions

Use the setup guide:

- [Setup Guide](./docs/setup.md)

## Usage

Primary docs entry:

- [Documentation Index](./docs/index.md)

For Beta V1 test execution:

- [Beta V1 Checklist](./docs/beta-v1-checklist.md)
- [Beta V2 Plan](./docs/beta-v2-plan.md)
- [Beta V2 Checklist](./docs/beta-v2-checklist.md)
- [Beta Release Checklist](./docs/beta-release-checklist.md)
- [Beta Tester Release Notes Template](./docs/beta-release-notes-template.md)
- [Issue Triage Workflow](./docs/issue-triage-workflow.md)
- [GitHub Labels And Milestones Standard](./docs/github-labels-and-milestones.md)
- [Release Path Roadmap](./docs/release-path-roadmap.md)
- [Beta V3 Checklist](./docs/beta-v3-checklist.md)
- [Beta V4 Checklist](./docs/beta-v4-checklist.md)
- [Beta V5 Checklist](./docs/beta-v5-checklist.md)
- [Beta V6 Checklist](./docs/beta-v6-checklist.md)
- [Beta Tester Access List](./docs/beta-tester-access-list.md)
- [Beta Tester Instructions](./docs/beta-tester-instructions.md)
- [Testing Strategy](./docs/testing.md)
- [Versioning Strategy](./docs/versioning.md)
- [Changelog](./CHANGELOG.md)

## Tech Stack

- NestJS + Prisma + PostgreSQL (Supabase)
- React + Vite + TypeScript
- PNPM workspaces (monorepo)
- GitHub Actions + GitHub Pages + Render

## Quick Navigation To Docs

- [Architecture](./docs/architecture.md)
- [API Snapshot (Beta V1)](./docs/api-snapshot-beta-v1.md)
- [Deployment Guide](./docs/deployment.md)
- [Versioning Strategy](./docs/versioning.md)
- [Changelog](./CHANGELOG.md)
- [Milestones And Tickets](./docs/milestones.md)
- [Beta V2 Checklist](./docs/beta-v2-checklist.md)
- [Beta Release Checklist](./docs/beta-release-checklist.md)
- [Issue Triage Workflow](./docs/issue-triage-workflow.md)
- [Release Path Roadmap](./docs/release-path-roadmap.md)
- [SPHINCS Full System Specification](./docs/sphincs-full-system-spec.md)
- [Implementation Worklog (2026-03-19)](./docs/implementation-worklog-2026-03-19.md)
- [Implementation Worklog (2026-03-20)](./docs/implementation-worklog-2026-03-20.md)
