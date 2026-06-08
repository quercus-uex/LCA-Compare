## Context

The server package already uses Jest with `ts-jest` and discovers `apps/server/src/**/*.spec.ts`. Existing specs for auth, admin, capture, compare, geospatial lookup, and predial demonstrate isolated unit tests with mocked collaborators. The requested services are thin NestJS services around `PrismaService`, except `ParcelaService`, which also delegates raw PostGIS SQL through Prisma, and `ResultadoImpactoService`, which composes parcel and crop lookups before querying impact results.

The implementation should add service-level tests only. These tests should validate query shape and collaborator delegation while staying independent from a real database, generated Prisma client side effects, migrations, and external services.

## Goals / Non-Goals

**Goals:**
- Add unit tests for `CultivoService`, `PaisService`, `ParcelaService`, `PoblacionService`, `ProvinciaService`, `ResultadoImpactoService`, and `UsuarioService`.
- Exercise all public methods in these services where practical, focusing on Prisma method delegation, forwarded arguments, relation `include`/`omit` shapes, and composed lookup behavior.
- Keep tests fast and deterministic through plain Jest mocks for `PrismaService` and dependent services.
- Make the new tests pass through the existing server Jest configuration.

**Non-Goals:**
- Do not add end-to-end, integration, or database-backed tests.
- Do not modify production behavior, API routes, DTOs, Prisma schema, migrations, or generated Prisma files.
- Do not introduce new test libraries or change the Jest configuration unless a current configuration issue prevents these tests from running.
- Do not assert Prisma SQL internals beyond verifying raw query helpers are invoked with the expected parameters and return values.

## Decisions

- Use direct service instantiation with object-shaped Jest mocks instead of Nest `TestingModule` for most tests. These services have simple constructor dependencies, so direct construction keeps setup small and avoids unnecessary Nest module wiring.
- Validate query contracts by asserting calls to mocked Prisma delegates. This catches regressions in `where`, `include`, `orderBy`, `omit`, and CRUD argument forwarding without requiring generated Prisma types at runtime.
- For `ParcelaService` raw SQL methods, assert the Prisma raw-query/transaction collaborators are called and returned values are mapped correctly. SQL template identity is less useful than verifying method behavior such as `getGeom` returning the first row GeoJSON or `null`.
- For `ResultadoImpactoService`, mock `ParcelaService` and `CultivoService` separately from Prisma. Tests should verify parcel ids flow into crop lookup, crop ids flow into impact-result queries, and relation includes are preserved.
- Keep fixture objects minimal and cast as needed in tests. The purpose is behavioral delegation, not validating full generated Prisma model completeness.

## Risks / Trade-offs

- Mock-heavy tests can overfit current implementation details -> Mitigation: assert externally meaningful service contracts such as forwarded filters, relation selection, password hash omission, and lookup composition rather than every incidental call detail.
- Raw SQL template assertions can be brittle -> Mitigation: test `ParcelaService` raw SQL methods through mocked `$queryRaw`, `$executeRaw`, and `$transaction` behavior and verify inputs/outputs, not exact generated SQL string formatting.
- Type strictness with generated Prisma imports can make test fixtures verbose -> Mitigation: use minimal typed helper mocks and explicit casts in specs rather than weakening production types.
- Adding many unit files can increase maintenance cost -> Mitigation: keep each spec colocated with its service and use repeated simple mock patterns instead of shared abstractions that obscure failures.
