## Why

The backend `admin` area contains authorization logic and many CRUD controller paths but currently has no dedicated unit test coverage. Adding isolated unit tests reduces regression risk for privileged admin operations without requiring a database, Prisma client generation, or a running NestJS server.

## What Changes

- Add unit tests for `AdminGuard` covering bearer token extraction, JWT verification, admin role checks, request user assignment, and rejection paths.
- Add unit tests for `AdminController` covering representative list, read, create, update, and delete behavior across admin-managed resources.
- Verify password hashing behavior for admin user create/update flows using mocked `argon2`.
- Keep tests isolated by mocking all service dependencies and external crypto/JWT behavior.
- Do not change admin API routes, response shapes, or runtime behavior.

## Capabilities

### New Capabilities
- `backend-admin-unit-tests`: Defines the required isolated backend unit coverage for admin guard authorization and admin controller CRUD delegation behavior.

### Modified Capabilities

## Impact

- Affected code: `apps/server/src/admin/admin.guard.ts`, `apps/server/src/admin/admin.controller.ts`, and new `*.spec.ts` files under `apps/server/src/admin/`.
- Test tooling: existing Jest backend unit test setup in `apps/server`.
- Dependencies: no new runtime dependencies expected; tests should reuse existing Jest, ts-jest, NestJS, and mocked service dependencies.
- APIs: no API contract changes.
