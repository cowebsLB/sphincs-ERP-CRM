# Backend Final Sweep Checklist

Date: 2026-03-19

## Auth

- [x] `POST /api/v1/auth/login` returns token + user payload
- [x] `POST /api/v1/auth/signup` works for beta tester onboarding
- [x] `POST /api/v1/auth/refresh` works with valid refresh token
- [x] `GET /api/v1/auth/me` resolves authenticated user context
- [x] Invalid login returns `401`
- [x] Login rate-limit returns `429` on repeated failures
- [x] `Retry-After` header is set on rate-limit responses
- [x] Refresh-token reuse detection revokes active refresh sessions
- [x] Admin reset endpoint validated in production:
  - `POST /api/v1/auth/rate-limit/reset`

## Core API + Ops

- [x] `GET /health` stable
- [x] `GET /api/v1/system/info` stable
- [x] API boots and maps all routes
- [x] Request logs + auth performance logs visible in Render

## ERP/CRM Flows

- [x] ERP list endpoint healthy (`/api/v1/erp/items`)
- [x] CRM list endpoint healthy (`/api/v1/crm/contacts`)
- [x] Resource create/update/restore routes present in API
- [x] Soft-delete behavior active via `deleted_at`
- [x] Data isolation validated:
  - user A cannot list/read user B private records by default

## Data + Migrations

- [x] Prisma generate works in CI and Render builds
- [x] Prisma migrate deploy works from build script
- [x] Seed runs cleanly in production build

## Deployment + CI

- [x] Pages workflow gated by backend tests
- [x] Core API unit tests pass
- [x] Core API e2e smoke tests pass
- [x] Render build script resilient to `DIRECT_URL` failure fallback

## Feedback Loop

- [x] `POST /api/v1/bugs/report` creates GitHub issue successfully
- [x] ERP/CRM in-app `Report Bug` UI submits structured payload

## Production Validation Snapshot (2026-03-19)

Validated against:

- `https://sphincs-erp-crm-1.onrender.com`

Verified pass:

- `GET /health` -> `200`
- `GET /api/v1/system/info` -> `200`
- `POST /api/v1/auth/signup` -> `201`
- `POST /api/v1/auth/login` -> `201`
- `GET /api/v1/auth/me` -> `200`
- `POST /api/v1/auth/refresh` -> `201`
- `GET /api/v1/erp/items` -> `200`
- `GET /api/v1/crm/contacts` -> `200`
- `POST /api/v1/auth/rate-limit/reset` -> `201`
- `POST /api/v1/bugs/report` -> `201`

Rate-limit verification:

- Failed login attempts return `401` for initial attempts
- Rate limit activates with `429`
- `Retry-After` header present (`900`)

## Security Closeout (Deferred)

- [ ] Rotate Supabase DB password
- [ ] Update Render `DATABASE_URL` and `DIRECT_URL`
- [ ] Redeploy and re-run this final sweep
