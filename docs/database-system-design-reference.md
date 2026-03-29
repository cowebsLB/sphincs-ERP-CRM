# Database System Design (Reference)

Date: 2026-03-29

## Canonical blueprint

The repository root includes a Word document that defines the **long-term target** database for SPHINCS as a full enterprise platform:

- [SPHINCS Database System Design (Word)](../SPHINCS_Database_System_Design.docx)

That design specifies **107 tables** across domains such as core tenancy, shared reference data, sales, procurement, inventory, production, accounting, HR, governance, CRM, ecommerce, BI, and enterprise asset management. It is written for **NestJS + Prisma + PostgreSQL** with multi-tenant row-level isolation and branch-aware scoping.

## Relationship to the current Prisma schema

The live `apps/core-api/prisma/schema.prisma` is an **incremental implementation** aligned with current beta delivery (auth, ERP items/suppliers/purchase orders, CRM, distribution/inventory, audit, and related workflows). It will evolve toward the blueprint as modules are added and migrations are applied in safe order.

## Product scope note (no standalone POS module)

The blueprint does **not** define a separate “point of sale” module. Retail and counter-style selling are represented through **Sales** (e.g. sales orders, deliveries) and **Ecommerce** (e.g. online orders linked to ERP). Any legacy naming such as “ERP+POS” in folder titles should be treated as historical; the product positioning is **enterprise platform**, not POS-first.

## See also

- [Database schema standards](./database-schema.md)
- [Architecture](./architecture.md)
