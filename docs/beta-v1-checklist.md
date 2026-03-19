# Beta V1 Checklist (No BS Edition)

Date: 2026-03-19

## Core Principle

If it does not help a tester log in, use the system, and break something, it is not Beta V1.

## Beta V1 Scope Update (2026-03-18 Late)

New required scope for Beta V1:

- [x] Simple `sign up` flow for beta testers (backend + frontend)
- [x] Existing `sign in` flow for existing users
- [x] Private data retention per user (no cross-user visibility by default)
- [x] Frontend can remain minimal and functional (no design polish requirement)

## Requested Beta V1 Tasks (Pinned)

### Auth (minimum viable)

- [x] Login (email + password)
- [x] Signup (basic, no fancy validation)
- [x] JWT/session works
- [x] Logout works

### User isolation (very important)

- [x] Each user sees only their own data
- [x] Data linked to `user_id`
- [x] No cross-user leakage

### Persistence

- [x] Data survives refresh
- [x] Data survives logout/login
- [x] Basic CRUD works per user (with user-isolated visibility)

## 1) Core System (Must Work)

### Authentication

- [x] User can log in successfully.
- [x] Invalid login shows clear error.
- [x] JWT/session works reliably.
- [x] Protected routes require auth.
- [x] `/api/v1/auth/me` works.
- [x] Logout works and clears session.

### Backend Stability

- [x] API boots without errors in production.
- [x] `/health` endpoint works.
- [x] DB connection is stable in current production flow.
- [x] Prisma migrations and seed run cleanly.
- [x] No `500` errors on normal login/ERP/CRM flows.

### Data Persistence

- [x] Data is saved correctly (create/update/restore endpoints in ERP/CRM resource screens).
- [x] Data is retrieved correctly (list endpoints verified in production logs).
- [x] No silent failures (errors surface in UI and backend logs).
- [x] Basic validation exists (DTO + global `ValidationPipe` in API).

## 2) One Complete Usable Flow (MVP Loop)

Chosen flow status:

- [x] Login -> open ERP/CRM feature pages -> read list results.
- [x] Create record.
- [x] View list.
- [x] Edit record.
- [x] Soft-delete/restore record.

Privacy rule for this flow:

- [x] User A cannot see records created by User B unless explicitly allowed by policy.

## 3) Minimal Frontend (Ugly But Alive)

Required:

- [x] Landing page.
- [x] Login page.
- [x] Basic dashboard/entry point.
- [x] One working feature screen.

Not required for Beta V1:

- [ ] Animation polish.
- [ ] Design system perfection.
- [ ] Mobile perfection.
- [ ] Pixel-perfect visual polish.

## 4) Observability

Backend:

- [x] Errors logged.
- [x] Auth performance logs exist (`AuthPerformance`).
- [x] Requests inspectable in Render logs (`RequestLogger`).

Frontend:

- [x] Basic error messages shown in login/resource actions.
- [x] No silent failures by design (error surfaced to user/toast).

## 5) Testing (Light But Real)

- [x] Unit tests pass.
- [x] E2E smoke tests pass.
- [x] E2E includes login.
- [x] E2E includes `/auth/me`.
- [x] E2E includes one ERP route.

## 6) Deployment (Do Not Touch Randomly)

- [x] Render deploy works consistently (post-fixes).
- [x] `scripts/render-build-core-api.sh` works.
- [x] CI gate blocks broken deploys.
- [x] Environment variables are configured for pooled/direct DB URLs.

## 7) Beta Access Setup

- [x] Seeded test users exist (`admin@sphincs.local`).
- [x] Beta URL available and shareable.
- [x] Self-service beta tester signup flow enabled.
- [ ] Tester access list finalized (friends/testers list).
- [ ] Short tester instruction note finalized.

## 8) Fail Gracefully

- [x] No crashes that kill whole app on normal bad input paths.
- [x] Errors return understandable messages.
- [x] Expired token flow is handled via refresh path in API client.
- [x] Backend rejects bad input without exploding.

## 9) Feedback Loop

- [x] Single official bug-report channel finalized (in-app `Report Bug` -> GitHub Issues).
- [x] Central bug tracker list finalized (GitHub Issues in project repo).
- [x] Logs are detailed enough to help reproduce reported issues.

## Hard Stop Rule

Beta V1 is done when all of these are true:

- [x] Users can log in.
- [x] Users can sign up (beta flow).
- [x] Users can complete one full flow.
- [x] Data persists.
- [x] Data is private by default per user.
- [x] System does not randomly explode on normal usage.

## Deferred Security Action (Already Agreed)

- [ ] Rotate Supabase DB password after backend implementation completes.
- [ ] Run final backend sweep right after rotation:
  - auth login/refresh/me
  - health/system
  - representative ERP/CRM flows
  - audit verification
