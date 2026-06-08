## ADDED Requirements

### Requirement: Backend resource controller unit test isolation
The backend test suite SHALL include resource controller unit tests that run through the existing server Jest configuration without starting the NestJS HTTP server or connecting to external services.

#### Scenario: Running resource controller unit tests
- **WHEN** a developer runs the backend unit test command
- **THEN** the command SHALL discover and execute controller `*.spec.ts` files for `apps/server/src/pais`, `apps/server/src/parcela`, `apps/server/src/poblacion`, `apps/server/src/provincia`, `apps/server/src/resultadoimpacto`, and `apps/server/src/usuario`

#### Scenario: Isolated controller test execution
- **WHEN** resource controller unit tests execute
- **THEN** they SHALL NOT require PostgreSQL, PostGIS, Prisma migrations, Prisma client generation, external network services, or Nest HTTP server startup

### Requirement: PaisController unit coverage
The test suite SHALL verify `PaisController` delegates country listing to `PaisService` and preserves the public response shape.

#### Scenario: Country list is wrapped
- **WHEN** `getAll` is called
- **THEN** it SHALL call `PaisService.findAll`
- **THEN** it SHALL return `{ data: <countries> }`

### Requirement: ParcelaController unit coverage
The test suite SHALL verify `ParcelaController` delegates parcel lookup operations, filters authenticated user data, and enforces ownership checks before returning parcel details.

#### Scenario: Authenticated parcel list is filtered by owner
- **WHEN** `getByAuthUser` receives an authenticated user
- **THEN** it SHALL call `ParcelaService.findMany` with `where.idPropietario` equal to the user's subject
- **THEN** it SHALL return `{ data: <parcels> }`

#### Scenario: Existing owned parcel includes geometry
- **WHEN** `getById` receives an authenticated owner and an existing parcel id
- **THEN** it SHALL call `ParcelaService.findOne` with the route id
- **THEN** it SHALL call `ParcelaService.getGeom` with the route id
- **THEN** it SHALL return `{ data: <parcel with geom> }`

#### Scenario: Missing parcel throws not found
- **WHEN** `getById` receives an id that does not resolve to a parcel
- **THEN** it SHALL throw `NotFoundException`
- **THEN** it SHALL NOT call `ParcelaService.getGeom`

#### Scenario: Parcel owned by another user is rejected
- **WHEN** `getById` resolves a parcel whose owner does not match the authenticated user subject
- **THEN** it SHALL throw `UnauthorizedException` with the parcel ownership message
- **THEN** it SHALL NOT call `ParcelaService.getGeom`

### Requirement: PoblacionController unit coverage
The test suite SHALL verify `PoblacionController` builds the expected case-insensitive name search and wraps population results.

#### Scenario: Population search delegates name filter and limit
- **WHEN** `getByFilters` receives a `nombre` query value
- **THEN** it SHALL call `PoblacionService.findMany` with a case-insensitive `nombre.contains` filter and `take` set to 10
- **THEN** it SHALL return `{ data: <populations> }`

### Requirement: ProvinciaController unit coverage
The test suite SHALL verify `ProvinciaController` lists provinces and delegates population lookups by province id with not-found handling.

#### Scenario: Province list is wrapped
- **WHEN** `getAll` is called
- **THEN** it SHALL call `ProvinciaService.findAll`
- **THEN** it SHALL return `{ data: <provinces> }`

#### Scenario: Province populations are filtered by province id
- **WHEN** `getPoblacionesByProvinciaId` receives a province id that resolves to populations
- **THEN** it SHALL call `PoblacionService.findMany` with `where.idProvincia` equal to the route id
- **THEN** it SHALL return `{ data: <populations> }`

#### Scenario: Province without populations throws not found
- **WHEN** `getPoblacionesByProvinciaId` resolves an empty population list
- **THEN** it SHALL throw `NotFoundException` with the province not found message

### Requirement: ResultadoImpactoController unit coverage
The test suite SHALL verify `ResultadoImpactoController` enforces ownership for impact-result reads, composes nearby comparison data, and calculates comparison helpers consistently.

#### Scenario: Existing owned impact result is wrapped
- **WHEN** `getById` receives an authenticated owner and an existing impact result id
- **THEN** it SHALL call `ResultadoImpactoService.findOne` with the route id
- **THEN** it SHALL return `{ data: <impact result> }`

#### Scenario: Missing impact result throws not found
- **WHEN** `getById` receives an id that does not resolve to an impact result
- **THEN** it SHALL throw `NotFoundException`

#### Scenario: Impact result owned by another user is rejected
- **WHEN** `getById` resolves an impact result whose parcel owner does not match the authenticated user subject
- **THEN** it SHALL throw `UnauthorizedException` with the parcel ownership message

#### Scenario: Mean of impacts groups by category
- **WHEN** `meanOfImpacts` receives multiple impact entries with repeated categories
- **THEN** it SHALL return one entry per category with averaged amounts and preserved units

#### Scenario: Difference string formats signed percentage
- **WHEN** `getDiffString` receives two numeric values
- **THEN** it SHALL return a percentage string with an explicit plus or minus sign and two decimal places

#### Scenario: Comparison by id composes nearby means
- **WHEN** `compareById` receives an authenticated owner, an impact result id, and a range
- **THEN** it SHALL call `ResultadoImpactoService.findOne` with the route id
- **THEN** it SHALL call `ParcelaService.findManyByRange` with the result parcel id and range
- **THEN** it SHALL call `CultivoService.findMostRecentByParcelaId` for each nearby parcel id
- **THEN** it SHALL call `ResultadoImpactoService.findMany` filtered by nearby crop ids and the original impact method id
- **THEN** it SHALL return `{ data: { resultado, nearbyMean } }`

#### Scenario: Comparison by id rejects missing or unauthorized result
- **WHEN** `compareById` receives a missing result or a result owned by another user
- **THEN** it SHALL throw `NotFoundException` for missing data or `UnauthorizedException` for ownership mismatch
- **THEN** it SHALL NOT query nearby parcels

### Requirement: UsuarioController unit coverage
The test suite SHALL verify `UsuarioController` delegates authenticated user lookup to `UsuarioService` and preserves the public response shape.

#### Scenario: Authenticated user lookup uses email
- **WHEN** `get` receives an authenticated user
- **THEN** it SHALL call `UsuarioService.findOnePublic` with the user's email
- **THEN** it SHALL return `{ data: <user> }`
