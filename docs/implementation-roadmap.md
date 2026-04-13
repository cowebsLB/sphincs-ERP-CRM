# Implementation roadmap

Schema and backend work for SPHINCS is planned from the **canonical database blueprint**, not from legacy Beta V2–V6 staged checklist files (removed). Use the sources below as the single planning stack.

## Canonical sources

| Artifact | Role |
|----------|------|
| [SPHINCS_Database_System_Design.docx](../SPHINCS_Database_System_Design.docx) | Authoritative Word specification (**107 tables**, all business domains). |
| [SPHINCS-Database-System-Design.md](./SPHINCS-Database-System-Design.md) | Full **UTF-8 text extraction** for search, diff, and review; tables appear as linear text—use the `.docx` for formatted layouts. |
| [database-system-design-reference.md](./database-system-design-reference.md) | Short pointer, scope notes (e.g. no standalone POS module), and relationship to Prisma. |
| `apps/core-api/prisma/schema.prisma` | **Incremental** implementation; grows toward the blueprint through migrations. |
| [blueprint-vs-prisma-tables.md](./blueprint-vs-prisma-tables.md) | **Gap analysis**: blueprint 107 tables vs current `@@map` names (`pnpm compare:blueprint`). |

## Regenerate the Markdown extraction

After editing the Word file, run from the repository root:

```bash
pnpm extract:blueprint
```

or:

```bash
python scripts/extract_docx_blueprint.py
```

## Supplementary implementation notes (not release roadmaps)

- [Beta V3 Foreign Key Map (2026-03-21)](./beta-v3-foreign-key-map-2026-03-21.md)
- [CRM To ERP Handoff (Beta V3)](./crm-to-erp-handoff-v3.md)
- [CRM Lead To Opportunity Transition (Beta V3)](./crm-lead-to-opportunity-transition-v3.md)
- [Distribution DB Foundation (V1)](./distribution-db-foundation-v1.md)
- [Distribution Dashboard API (V1)](./distribution-dashboard-api-v1.md)

## Delivery and testing (unchanged)

- [Beta Release Checklist](./beta-release-checklist.md)
- [Testing Strategy](./testing.md)
- [Versioning Strategy](./versioning.md)
- [Changelog](../CHANGELOG.md)
