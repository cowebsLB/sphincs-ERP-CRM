# CRM Lead To Opportunity Transition (Beta V3)

Date: 2026-03-21

## Endpoint

`POST /api/v1/crm/leads/:id/convert-to-opportunity`

## Transition Rules

- Lead must exist in caller organization/user scope.
- Lead must not be soft-deleted.
- `DISQUALIFIED` leads are blocked from conversion.
- `CONVERTED` leads cannot be converted again.
- Conversion creates an opportunity with status `OPEN`.

## Transaction Behavior

The conversion runs in one DB transaction:

1. Update lead status to `CONVERTED`.
2. Create opportunity linked by `lead_id`.

If any step fails, no partial conversion is persisted.

## Audit Coverage

Business audit event recorded:

- `CRM_LEAD_CONVERTED_TO_OPPORTUNITY`

Metadata includes:

- source lead id
- created opportunity id
- previous lead status
- new lead status
- opportunity status

## Related Cross-Module Audit

For the existing CRM-to-ERP handoff endpoint:

- `POST /api/v1/crm/opportunities/:id/handoff/purchase-order`

Business audit event recorded:

- `CRM_OPPORTUNITY_HANDOFF_TO_ERP_PO`
