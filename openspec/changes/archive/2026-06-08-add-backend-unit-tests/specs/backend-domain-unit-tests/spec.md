## ADDED Requirements

### Requirement: Backend domain unit test isolation
The backend test suite SHALL include unit tests for crop, country, parcel, population, province, impact-result, and user services that run through the existing server Jest configuration without starting application infrastructure.

#### Scenario: Running domain unit tests
- **WHEN** a developer runs the backend unit test command
- **THEN** the command SHALL discover and execute `*.spec.ts` files for `apps/server/src/cultivo`, `apps/server/src/pais`, `apps/server/src/parcela`, `apps/server/src/poblacion`, `apps/server/src/provincia`, `apps/server/src/resultadoimpacto`, and `apps/server/src/usuario`

#### Scenario: Isolated domain test execution
- **WHEN** the domain service unit tests execute
- **THEN** they SHALL NOT require PostgreSQL, PostGIS, Prisma migrations, Prisma client generation beyond existing imports, external network services, or Nest HTTP server startup

### Requirement: CultivoService unit coverage
The test suite SHALL verify `CultivoService` delegates crop persistence operations to Prisma with the expected arguments.

#### Scenario: Finding a crop by unique filter
- **WHEN** `findOne` receives a unique crop filter
- **THEN** it SHALL call `prisma.cultivo.findUnique` with that `where` filter
- **THEN** it SHALL return the Prisma result

#### Scenario: Finding most recent crops by parcel
- **WHEN** `findMostRecentByParcelaId` receives a parcel id
- **THEN** it SHALL call `prisma.cultivo.findFirst` filtered by `idParcela` and ordered by descending `fechaInicioCampania`

#### Scenario: Finding most recent crops by parcel ids in bulk
- **WHEN** `findMostRecentByParcelaIdBulk` receives parcel ids
- **THEN** it SHALL call `prisma.cultivo.findMany` with `idParcela` in the provided ids and descending `fechaInicioCampania` order

#### Scenario: Crop CRUD and count delegation
- **WHEN** list, create, update, delete, or count methods are called
- **THEN** each method SHALL call the matching `prisma.cultivo` delegate with the forwarded arguments
- **THEN** each method SHALL return the Prisma result

### Requirement: PaisService unit coverage
The test suite SHALL verify `PaisService` delegates country persistence operations to Prisma with the expected arguments.

#### Scenario: Finding all countries
- **WHEN** `findAll` is called
- **THEN** it SHALL call `prisma.pais.findMany` without filters
- **THEN** it SHALL return the Prisma result

#### Scenario: Country CRUD and count delegation
- **WHEN** find-one, list, create, update, delete, or count methods are called
- **THEN** each method SHALL call the matching `prisma.pais` delegate with the forwarded arguments
- **THEN** each method SHALL return the Prisma result

### Requirement: ParcelaService unit coverage
The test suite SHALL verify `ParcelaService` delegates parcel CRUD, relation includes, and geospatial helper operations correctly.

#### Scenario: Finding one parcel includes ordered crops
- **WHEN** `findOne` receives a unique parcel filter
- **THEN** it SHALL call `prisma.parcela.findUnique` with that `where` filter
- **THEN** it SHALL include `cultivos` ordered by descending `fechaInicioCampania`

#### Scenario: Listing parcels forwards optional include
- **WHEN** `findMany` receives pagination, filtering, ordering, and include parameters
- **THEN** it SHALL call `prisma.parcela.findMany` with the same parameters
- **THEN** it SHALL return the Prisma result

#### Scenario: Creating a parcel with geometry writes geometry in a transaction
- **WHEN** `createWithGeom` receives parcel data and a GeoJSON polygon
- **THEN** it SHALL create the parcel inside a Prisma transaction
- **THEN** it SHALL execute a raw geometry update for the created parcel id
- **THEN** it SHALL return the created parcel

#### Scenario: Reading parcel geometry maps GeoJSON row
- **WHEN** `getGeom` receives a parcel id and Prisma returns a GeoJSON row
- **THEN** it SHALL return the first row `geojson` value

#### Scenario: Reading missing parcel geometry returns null
- **WHEN** `getGeom` receives a parcel id and Prisma returns no rows
- **THEN** it SHALL return `null`

#### Scenario: Parcel range queries return raw query results
- **WHEN** `findManyByRange` or `findManyByPointRange` are called
- **THEN** each method SHALL delegate to Prisma raw query execution with the provided id or point and range inputs
- **THEN** each method SHALL return the raw query result rows

#### Scenario: Parcel CRUD and count delegation
- **WHEN** create, update, delete, or count methods are called
- **THEN** each method SHALL call the matching `prisma.parcela` delegate with the forwarded arguments
- **THEN** each method SHALL return the Prisma result

### Requirement: PoblacionService unit coverage
The test suite SHALL verify `PoblacionService` delegates population persistence operations and required relation includes to Prisma.

#### Scenario: Finding all populations includes province and country
- **WHEN** `findAll` is called
- **THEN** it SHALL call `prisma.poblacion.findMany` including `provincia` and nested `pais`
- **THEN** it SHALL return the Prisma result

#### Scenario: Listing populations includes province and country
- **WHEN** `findMany` receives list parameters
- **THEN** it SHALL forward pagination, filtering, cursor, and ordering parameters
- **THEN** it SHALL include `provincia` and nested `pais`

#### Scenario: Population CRUD and count delegation
- **WHEN** find-one, create, update, delete, or count methods are called
- **THEN** each method SHALL call the matching `prisma.poblacion` delegate with the forwarded arguments
- **THEN** each method SHALL return the Prisma result

### Requirement: ProvinciaService unit coverage
The test suite SHALL verify `ProvinciaService` delegates province persistence operations and required relation includes to Prisma.

#### Scenario: Finding all provinces includes country
- **WHEN** `findAll` is called
- **THEN** it SHALL call `prisma.provincia.findMany` including `pais`
- **THEN** it SHALL return the Prisma result

#### Scenario: Province CRUD and count delegation
- **WHEN** find-one, list, create, update, delete, or count methods are called
- **THEN** each method SHALL call the matching `prisma.provincia` delegate with the forwarded arguments
- **THEN** each method SHALL return the Prisma result

### Requirement: ResultadoImpactoService unit coverage
The test suite SHALL verify `ResultadoImpactoService` delegates impact-result persistence operations and composes parcel, crop, and impact queries correctly.

#### Scenario: Finding one impact result includes impact and crop parcel
- **WHEN** `findOne` receives a unique impact-result filter
- **THEN** it SHALL call `prisma.resultadoImpacto.findUnique` with that `where` filter
- **THEN** it SHALL include `impacto` and `cultivo.parcela`

#### Scenario: Listing impact results includes crop parcel location hierarchy
- **WHEN** `findMany` receives list parameters
- **THEN** it SHALL forward pagination, filtering, cursor, and ordering parameters
- **THEN** it SHALL include `cultivo.parcela.poblacion.provincia`

#### Scenario: Finding impact results around a parcel uses nearby parcels and recent crops
- **WHEN** `findManyAroundParcela` receives a parcel id and range
- **THEN** it SHALL call `ParcelaService.findManyByRange` with the parcel id and range
- **THEN** it SHALL call `CultivoService.findMostRecentByParcelaIdBulk` with the nearby parcel ids
- **THEN** it SHALL query `prisma.resultadoImpacto.findMany` for the resulting crop ids with the expected location hierarchy include

#### Scenario: Finding impact results around a point uses nearby parcels and recent crops
- **WHEN** `findManyAroundPoint` receives latitude, longitude, and range
- **THEN** it SHALL call `ParcelaService.findManyByPointRange` with those inputs
- **THEN** it SHALL call `CultivoService.findMostRecentByParcelaIdBulk` with the nearby parcel ids
- **THEN** it SHALL query `prisma.resultadoImpacto.findMany` for the resulting crop ids with the expected location hierarchy include

#### Scenario: Finding impact results by crop type uses crop lookup
- **WHEN** `findManyByTipoCultivo` receives a crop type
- **THEN** it SHALL call `CultivoService.findMany` with that crop type
- **THEN** it SHALL query `prisma.resultadoImpacto.findMany` for the resulting crop ids

#### Scenario: Impact result create and delete delegation
- **WHEN** create or delete methods are called
- **THEN** each method SHALL call the matching `prisma.resultadoImpacto` delegate with the forwarded arguments
- **THEN** each method SHALL return the Prisma result

### Requirement: UsuarioService unit coverage
The test suite SHALL verify `UsuarioService` delegates user persistence operations to Prisma and protects public user results from exposing password hashes.

#### Scenario: Finding a private user returns full Prisma result
- **WHEN** `findOne` receives a unique user filter
- **THEN** it SHALL call `prisma.usuario.findUnique` with that `where` filter and no public omit clause
- **THEN** it SHALL return the Prisma result

#### Scenario: Finding a public user omits password hash
- **WHEN** `findOnePublic` receives a unique user filter
- **THEN** it SHALL call `prisma.usuario.findUnique` with that `where` filter and `omit.passwordHash` set to true
- **THEN** it SHALL return the Prisma result

#### Scenario: Public user write and list operations omit password hash
- **WHEN** `findAll`, `create`, `update`, or `delete` are called
- **THEN** each method SHALL call the matching `prisma.usuario` delegate with `omit.passwordHash` set to true
- **THEN** each method SHALL return the Prisma result

#### Scenario: User count delegates filters
- **WHEN** `count` receives an optional user filter
- **THEN** it SHALL call `prisma.usuario.count` with that `where` filter
- **THEN** it SHALL return the Prisma result
