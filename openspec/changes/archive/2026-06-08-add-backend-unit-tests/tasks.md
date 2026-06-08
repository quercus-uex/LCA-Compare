## 1. Test Setup Patterns

- [x] 1.1 Review existing server unit tests to reuse local Jest mock style and avoid new dependencies.
- [x] 1.2 Define minimal Prisma delegate mocks inside each new service spec, using direct service instantiation.
- [x] 1.3 Use minimal fixture objects and explicit casts where generated Prisma model types would otherwise require unrelated fields.

## 2. CRUD Domain Service Specs

- [x] 2.1 Add `apps/server/src/cultivo/cultivo.service.spec.ts` covering `findOne`, recent-by-parcel lookups, bulk recent lookup, `findMany`, `create`, `update`, `delete`, and `count` delegation.
- [x] 2.2 Add `apps/server/src/pais/pais.service.spec.ts` covering `findOne`, `findAll`, `findMany`, `create`, `update`, `delete`, and `count` delegation.
- [x] 2.3 Add `apps/server/src/provincia/provincia.service.spec.ts` covering `findOne`, `findAll` with `pais` include, `findMany`, `create`, `update`, `delete`, and `count` delegation.
- [x] 2.4 Add `apps/server/src/poblacion/poblacion.service.spec.ts` covering `findOne`, `findAll` and `findMany` with `provincia.pais` include, `create`, `update`, `delete`, and `count` delegation.

## 3. Parcel Service Specs

- [x] 3.1 Add `apps/server/src/parcela/parcela.service.spec.ts` coverage for `findOne` including ordered `cultivos`, `findMany` parameter forwarding, plain `create`, `update`, `delete`, and `count`.
- [x] 3.2 Cover `createWithGeom` with a mocked Prisma transaction, mocked `tx.parcela.create`, mocked `tx.$executeRaw`, and verification that the created parcel is returned.
- [x] 3.3 Cover `getGeom` returning the first row GeoJSON value and returning `null` when no rows are found.
- [x] 3.4 Cover `findManyByRange` and `findManyByPointRange` returning mocked raw query rows and invoking Prisma raw query execution.

## 4. Impact Result Service Specs

- [x] 4.1 Add `apps/server/src/resultadoimpacto/resultado-impacto.service.spec.ts` coverage for `findOne` include shape and `findMany` list forwarding with `cultivo.parcela.poblacion.provincia` include.
- [x] 4.2 Cover `findManyAroundParcela` by mocking nearby parcels, recent crops, and verifying impact lookup uses the resulting crop ids and location hierarchy include.
- [x] 4.3 Cover `findManyAroundPoint` by mocking point-range parcels, recent crops, and verifying impact lookup uses the resulting crop ids and location hierarchy include.
- [x] 4.4 Cover `findManyByTipoCultivo`, `create`, and `delete` delegation.

## 5. User Service Specs

- [x] 5.1 Add `apps/server/src/usuario/usuario.service.spec.ts` coverage for `findOne` returning the full Prisma result without an omit clause.
- [x] 5.2 Cover `findOnePublic`, `findAll`, `create`, `update`, and `delete` using `omit: { passwordHash: true }`.
- [x] 5.3 Cover `count` forwarding optional user filters.

## 6. Verification

- [x] 6.1 Run the targeted server Jest suite for the new spec files and fix failures.
- [x] 6.2 Run `pnpm --filter server test` to verify all server unit tests pass with the added coverage.
- [x] 6.3 Run `pnpm server:lint` if implementation changes introduce lint warnings or if the Jest run surfaces TypeScript issues.
