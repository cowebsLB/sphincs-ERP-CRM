# Implementation worklog — 2026-03-29

## Tasks completed

- Read the full `SPHINCS_Database_System_Design.docx` content via automated UTF-8 extraction (4665 paragraphs).
- Added `docs/SPHINCS-Database-System-Design.md` and `scripts/extract_docx_blueprint.py`; root command `pnpm extract:blueprint`.
- Replaced staged Beta V1–V6 / release-path roadmap Markdown with a single [implementation roadmap](./implementation-roadmap.md) aligned to the Word blueprint.
- Removed: `release-path-roadmap.md`, `beta-v1-checklist.md`, `beta-v2-plan.md`, `beta-v2-checklist.md`, `beta-v3-checklist.md`, `beta-v4-checklist.md`, `beta-v5-checklist.md`, `beta-v6-checklist.md`.
- Updated navigation: [index.md](../index.md), [docs/index.md](./index.md), [database-system-design-reference.md](./database-system-design-reference.md), [database-schema.md](./database-schema.md), product version `Beta V1.16.73`, [CHANGELOG.md](../CHANGELOG.md).

## Problems encountered

- None blocking; Word tables flatten to one cell per line in the extraction (documented in the MD header).

## Decisions made

- **Single planning source**: canonical `.docx` + searchable extraction + `schema.prisma`; retired multi-stage beta roadmap files to avoid duplicate/conflicting roadmaps.

## Next steps

- Implement schema/API gaps against the blueprint domain-by-domain; re-run `pnpm extract:blueprint` whenever the Word spec changes.
- Run `pnpm compare:blueprint` after Prisma changes; use `docker compose up -d` + `apps/core-api/.env` from `.env.example` for local Postgres without Supabase.

## Addendum (same day)

- Full blueprint vs Prisma gap report: [blueprint-vs-prisma-tables.md](./blueprint-vs-prisma-tables.md) (~92 tables still missing from schema, plus 21 extra distribution/auth tables).
- Docker Compose for local PostgreSQL at repo root; setup guide updated.
