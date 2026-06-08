## Context

The server already has a Jest configuration that discovers `apps/server/src/**/*.spec.ts` and existing isolated unit tests for several services, guards, and controllers. The requested change adds coverage for one remaining domain service, `MetodoImpactoService`, and six resource controllers that currently contain lightweight delegation, response wrapping, not-found handling, and ownership checks.

These tests should fit the current backend pattern: instantiate classes directly with mocked dependencies, avoid `TestingModule` unless decorators or Nest injection behavior are under test, and avoid any database, Prisma client generation, HTTP server startup, or external services.

## Goals / Non-Goals

**Goals:**

- Add focused unit tests for `MetodoImpactoService` Prisma delegation.
- Add focused unit tests for `PaisController`, `ParcelaController`, `PoblacionController`, `ProvinciaController`, `ResultadoImpactoController`, and `UsuarioController`.
- Verify service call arguments, response wrapper shapes, ownership errors, not-found errors, and comparison helper calculations.
- Keep tests deterministic and executable through `pnpm --filter server test`.

**Non-Goals:**

- Do not add integration or e2e tests that boot NestJS or hit HTTP endpoints.
- Do not connect to PostgreSQL/PostGIS or require Prisma migrations.
- Do not change runtime controller or service behavior unless a test reveals an existing defect that must be fixed for the stated behavior.
- Do not introduce new test frameworks or production dependencies.

## Decisions

- Instantiate tested classes directly with `jest.fn()` dependency objects. This matches existing server tests and keeps controller/service tests isolated from Nest module setup.
- Mock only the dependency surface used by each unit. This keeps test fixtures small and makes failures point to changed method calls or response shapes.
- Use explicit Arrange/Act/Assert test cases per public method or branch instead of table-driven suites for dissimilar controller branches. The controllers have different ownership and wrapper rules, so explicit cases will be clearer and easier to maintain.
- For `ResultadoImpactoController.compareById`, test orchestration with compact mock data and test `meanOfImpacts` and `getDiffString` separately. This avoids coupling every helper branch to the high-level comparison endpoint while still covering the endpoint composition.
- Preserve existing import style and local spec placement. Each new test file should live beside the unit under test so Jest discovers it through the existing `testMatch`.

## Risks / Trade-offs

- Controller tests can become tightly coupled to exact service argument shapes -> mitigate by asserting arguments that represent externally meaningful behavior, such as filters, ids, includes, and response wrappers.
- `ResultadoImpactoController.compareById` uses non-trivial nested `datos` structures -> mitigate with minimal fixtures containing one or two impact categories and enough keys to exercise the loop without excessive data.
- Direct instantiation does not validate decorators or guards -> acceptable because this change targets unit behavior, and guard/decorator integration is outside scope.
- Existing implementation may have type coercion gaps for query params -> tests should document current controller expectations and only require runtime changes if behavior contradicts the requested unit coverage.
