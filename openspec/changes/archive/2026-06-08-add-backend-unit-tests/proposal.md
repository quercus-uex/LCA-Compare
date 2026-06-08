## Why

The backend already has Jest coverage for several integration-facing modules, but core domain services for crops, locations, parcels, impact results, and users are not covered by unit tests. Adding focused tests now reduces regression risk around Prisma query construction, relation includes, geospatial raw SQL delegation, and user password hash omission without requiring a database.

## What Changes

- Add isolated Jest unit tests for `CultivoService`, `PaisService`, `ParcelaService`, `PoblacionService`, `ProvinciaService`, `ResultadoImpactoService`, and `UsuarioService`.
- Mock `PrismaService` and dependent domain services so tests do not connect to PostgreSQL, PostGIS, Prisma migrations, generated Prisma runtime state, or external services.
- Cover CRUD delegation, count/list query forwarding, relation include shapes, geospatial helper calls, impact-result lookup composition, and user public-result password hash omission.
- No production API, DTO, schema, or dependency changes are expected.

## Capabilities

### New Capabilities
- `backend-domain-unit-tests`: Unit-test coverage for backend domain services covering crops, countries, parcels, populations, provinces, impact results, and users.

### Modified Capabilities

None.

## Impact

- Affected code: new `*.spec.ts` files under `apps/server/src/cultivo`, `apps/server/src/pais`, `apps/server/src/parcela`, `apps/server/src/poblacion`, `apps/server/src/provincia`, `apps/server/src/resultadoimpacto`, and `apps/server/src/usuario`.
- Test command: `pnpm --filter server test` or the existing server Jest command.
- Systems: backend unit test suite only; no runtime behavior, API contracts, database migrations, generated Prisma files, frontend, or docs changes.
