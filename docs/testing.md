# Testing Strategy

- Unit tests:
  - RBAC and scope guards
  - Status transitions
  - Soft-delete + restore behavior
  - Audit writer and request logging
- Integration tests:
  - Versioned routes
  - Scoped CRUD
  - Soft-delete filtering defaults
- E2E tests:
  - ERP and CRM core flows
  - Audit trace checks
  - Health and system info endpoint checks
