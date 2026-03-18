# API Snapshot (Beta V1)

Date: 2026-03-18
Base URL: `/api/v1`

## Auth

- `POST /auth/login` (public)
- `POST /auth/refresh` (public)
- `POST /auth/rate-limit/reset` (Admin)
- `GET /auth/me` (Admin, ERP Manager, CRM Manager, Staff)

## Core

- `GET /users`
- `POST /users`
- `PATCH /users/:id`
- `POST /users/:id/restore`
- `GET /roles`
- `GET /organizations`
- `POST /organizations`
- `PATCH /organizations/:id`
- `POST /organizations/:id/restore`
- `GET /branches`
- `POST /branches`
- `PATCH /branches/:id`
- `POST /branches/:id/restore`

## ERP

- `GET /erp/items`
- `POST /erp/items`
- `PATCH /erp/items/:id`
- `POST /erp/items/:id/restore`
- `GET /erp/suppliers`
- `POST /erp/suppliers`
- `PATCH /erp/suppliers/:id`
- `POST /erp/suppliers/:id/restore`
- `GET /erp/purchase-orders`
- `POST /erp/purchase-orders`
- `PATCH /erp/purchase-orders/:id`
- `POST /erp/purchase-orders/:id/restore`

## CRM

- `GET /crm/contacts`
- `POST /crm/contacts`
- `PATCH /crm/contacts/:id`
- `POST /crm/contacts/:id/restore`
- `GET /crm/leads`
- `POST /crm/leads`
- `PATCH /crm/leads/:id`
- `POST /crm/leads/:id/restore`
- `GET /crm/opportunities`
- `POST /crm/opportunities`
- `PATCH /crm/opportunities/:id`
- `POST /crm/opportunities/:id/restore`

## Audit + Ops

- `GET /audit/logs`
- `GET /health` (outside prefix)
- `GET /system/info`

## Notes

- Global role guard is active in app module.
- Domain modules (`erp/*`, `crm/*`) enforce role decorators at controller level.
- Login rate limit returns `429` and includes `Retry-After` header.
