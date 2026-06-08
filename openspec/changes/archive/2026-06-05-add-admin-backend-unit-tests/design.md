## Context

The server package already has Jest configured to discover `apps/server/src/**/*.spec.ts` and existing auth unit tests demonstrate the preferred pattern: instantiate classes directly, mock collaborators, and avoid bootstrapping a Nest application. The admin backend code currently includes `AdminGuard` authorization behavior and a large `AdminController` that delegates CRUD operations to injected services for users, parcelas, cultivos, métodos de impacto, países, provincias, and poblaciones.

Admin endpoints are privileged and broad in scope, so regressions in guard behavior, password hashing, pagination parameters, search filters, response wrappers, or service delegation can affect multiple admin workflows. The implementation should add test coverage without changing production code unless a defect is exposed during testing.

## Goals / Non-Goals

**Goals:**
- Add isolated unit tests for `AdminGuard` authorization outcomes.
- Add isolated unit tests for `AdminController` CRUD delegation and response wrapping behavior.
- Cover password hashing on user create/update with mocked `argon2.hash`.
- Keep tests deterministic and independent of PostgreSQL, PostGIS, Prisma, network services, or Nest HTTP startup.
- Reuse the existing backend Jest setup and test style.

**Non-Goals:**
- Add end-to-end tests for admin HTTP routes.
- Change admin routes, DTOs, Swagger metadata, or response shapes.
- Add a database test harness or Prisma integration tests.
- Expand coverage to unrelated backend modules.

## Decisions

- Use direct class instantiation instead of `@nestjs/testing` modules for controller and guard tests. This matches the existing auth specs, keeps setup small, and avoids resolving full module dependency graphs.
- Mock all injected services as typed Jest mocks. This isolates unit behavior and prevents accidental database or Prisma access.
- Mock `argon2.hash` in controller tests. User create/update tests need to assert that plain password input is transformed before delegation, but real argon2 hashing would slow tests and make assertions non-deterministic.
- Test representative controller behavior by resource pattern instead of every route with exhaustive duplication. The controller has repeated CRUD patterns across seven resources; tests should cover each behavior class and include all resource-specific service wiring enough to catch delegation mistakes without creating a brittle, oversized suite.
- Verify `AdminGuard` with explicit request objects and mocked `JwtService.verifyAsync` plus `UsuarioService.findOne`. This covers token parsing, JWT verification options, admin role enforcement, and `request.user` assignment without starting the Nest request pipeline.

## Risks / Trade-offs

- Repeated controller CRUD methods can lead to repetitive tests -> Use small local helper data and grouped assertions while keeping each tested behavior readable.
- Direct class instantiation skips Nest decorator behavior -> This is acceptable for unit tests because the target is method logic and dependency interaction, not route binding.
- Mocked services may drift from real service contracts -> Use existing service method names and assert the concrete arguments the controller already passes.
- Tests might expose existing implementation issues -> Treat production code changes as minimal fixes only when required to satisfy the intended admin behavior.
