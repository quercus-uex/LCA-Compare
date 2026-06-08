## 1. Service Unit Tests

- [x] 1.1 Add `apps/server/src/metodoimpacto/metodoimpacto.service.spec.ts` with direct `MetodoImpactoService` instantiation and mocked `prisma.metodoImpacto` delegates.
- [x] 1.2 Cover `findOne`, `findAll`, `findMany`, `create`, `update`, `delete`, and `count` delegation and returned Prisma results.

## 2. Simple Controller Unit Tests

- [x] 2.1 Add `PaisController` unit tests covering `getAll` service delegation and `{ data }` response wrapping.
- [x] 2.2 Add `PoblacionController` unit tests covering `nombre` query filter construction, `take: 10`, service delegation, and `{ data }` response wrapping.
- [x] 2.3 Add `ProvinciaController` unit tests covering `getAll`, `getPoblacionesByProvinciaId`, and empty-population `NotFoundException` behavior.
- [x] 2.4 Add `UsuarioController` unit tests covering authenticated email lookup through `findOnePublic` and `{ data }` response wrapping.

## 3. Authenticated Resource Controller Unit Tests

- [x] 3.1 Add `ParcelaController` unit tests covering authenticated owner filtering in `getByAuthUser`.
- [x] 3.2 Cover `ParcelaController.getById` success with geometry, missing parcel `NotFoundException`, and non-owner `UnauthorizedException` without geometry lookup.
- [x] 3.3 Add `ResultadoImpactoController` unit tests covering `getById` success, missing result `NotFoundException`, and non-owner `UnauthorizedException`.
- [x] 3.4 Cover `ResultadoImpactoController.meanOfImpacts` grouping/averaging and `getDiffString` signed percentage formatting.
- [x] 3.5 Cover `ResultadoImpactoController.compareById` success orchestration and missing/non-owner early rejection without nearby parcel lookup.

## 4. Verification

- [x] 4.1 Run `pnpm --filter server test` and fix any failing or type-invalid specs.
- [x] 4.2 Run `pnpm server:lint` if test files introduce lint issues or if Jest output indicates type/lint-sensitive problems.
- [x] 4.3 Confirm all new tests are discovered by the existing `apps/server/jest.config.cjs` `src/**/*.spec.ts` pattern.
