## Why

Several backend controllers and `MetodoImpactoService` currently lack focused unit coverage, leaving delegation logic, response wrappers, authorization checks, and small comparison helpers vulnerable to regressions. Adding these tests now extends the existing backend Jest safety net around public API entrypoints without requiring database or HTTP server startup.

## What Changes

- Add isolated unit tests for `MetodoImpactoService` covering Prisma delegation for lookup, listing, CRUD, and count operations.
- Add isolated unit tests for `PaisController`, `ParcelaController`, `PoblacionController`, `ProvinciaController`, `ResultadoImpactoController`, and `UsuarioController`.
- Verify controller response shapes, service call arguments, not-found handling, ownership checks, and comparison helper behavior using mocked dependencies.
- Keep all tests executable through the existing server Jest configuration without adding external infrastructure requirements.

## Capabilities

### New Capabilities
- `backend-resource-controller-unit-tests`: Covers unit-test expectations for resource controllers that wrap service results, delegate filters, and enforce auth-related ownership behavior.

### Modified Capabilities
- `backend-domain-unit-tests`: Extend backend domain unit test requirements to include `MetodoImpactoService` coverage.

## Impact

- Affected code: new `*.spec.ts` files under `apps/server/src/metodoimpacto`, `apps/server/src/pais`, `apps/server/src/parcela`, `apps/server/src/poblacion`, `apps/server/src/provincia`, `apps/server/src/resultadoimpacto`, and `apps/server/src/usuario`.
- APIs: no runtime API contract changes.
- Dependencies: no new production dependencies; tests use existing Jest and Nest testing stack.
- Systems: backend unit test suite only, with no PostgreSQL, PostGIS, Prisma migrations, external network services, or Nest HTTP server startup required.
