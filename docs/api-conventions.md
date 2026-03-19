# API Conventions

- Versioned prefix: `/api/v1`
- ERP routes:
  - `/api/v1/erp/items`
  - `/api/v1/erp/purchase-orders`
  - `/api/v1/erp/suppliers`
- CRM routes:
  - `/api/v1/crm/contacts`
  - `/api/v1/crm/leads`
  - `/api/v1/crm/opportunities`
- Core auth routes:
  - `/api/v1/auth/login`
  - `/api/v1/auth/refresh`
  - `/api/v1/auth/me`
- Ops routes:
  - `/health`
  - `/api/v1/system/info`

## Input Validation Rules (Beta V1 Hotfix - 2026-03-19)

- Optional relation IDs (`contact_id`, `lead_id`, `supplier_id`) accept:
  - empty value -> `null`
  - valid UUID string -> accepted
  - non-UUID string -> `400 Bad Request`
- Enum status fields (`Lead`, `Opportunity`, `PurchaseOrder`) accept known enum values only.
- Empty status in create payloads falls back to defaults:
  - lead: `NEW`
  - opportunity: `OPEN`
  - purchase order: `DRAFT`
- Invalid status values return `400 Bad Request` with a clear allowed-values message.
