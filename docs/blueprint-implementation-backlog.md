# Blueprint implementation backlog

This backlog is generated from the canonical blueprint (`SPHINCS_Database_System_Design.docx`) versus live Prisma `@@map` tables.

- Current missing blueprint tables: `88`
- Current mapped Prisma tables: `40`
- Source report: [blueprint-vs-prisma-tables.md](./blueprint-vs-prisma-tables.md)

## Missing by domain

- `hr`: 11
- `accounting`: 10
- `shared`: 10
- `ecom`: 9
- `sales`: 9
- `core`: 4
- `bi`: 6
- `eam`: 6
- `governance`: 5
- `procurement`: 5
- `production`: 5
- `crm`: 4
- `inventory`: 4

## Suggested implementation order

1. **Core foundation**
   - [x] `core.organization_settings` (implemented)
   - [x] `core.permissions` (implemented)
   - [x] `core.role_permissions` (implemented)
   - `core.organization_members`
   - `core.member_roles`
   - `core.notifications`
   - `core.user_sessions` (or explicit aliasing to current token/session model)
2. **Shared references**
   - `shared.currencies`, `shared.countries`, `shared.units_of_measure`, `shared.taxes`, `shared.payment_terms`
   - `shared.tags`, `shared.entity_tags`, `shared.attachments`, `shared.addresses`, `shared.number_sequences`
3. **Sales + Procurement baseline**
   - sales quote/order chain
   - procurement request/rfq/order chain (aligning current `purchase_orders`)
4. **Accounting + HR**
   - accounting periods, GL and journals first
   - employee, departments, contracts, leave, payroll, recruitment
5. **Ecommerce + BI + EAM + Governance + Production**
   - module-by-module once core transactional layers stabilize

## Next executable slice

Immediate next schema slice:

- add `core.organization_members` + `core.member_roles` (proper org membership vs global `users.organization_id`)
- add `core.notifications`
- add `core.user_sessions` (or formalize mapping to `refresh_tokens`)
