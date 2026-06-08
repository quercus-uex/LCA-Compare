## MODIFIED Requirements

### Requirement: Backend domain unit test isolation
The backend test suite SHALL include unit tests for crop, country, parcel, population, province, impact-method, impact-result, and user services that run through the existing server Jest configuration without starting application infrastructure.

#### Scenario: Running domain unit tests
- **WHEN** a developer runs the backend unit test command
- **THEN** the command SHALL discover and execute `*.spec.ts` files for `apps/server/src/cultivo`, `apps/server/src/pais`, `apps/server/src/parcela`, `apps/server/src/poblacion`, `apps/server/src/provincia`, `apps/server/src/metodoimpacto`, `apps/server/src/resultadoimpacto`, and `apps/server/src/usuario`

#### Scenario: Isolated domain test execution
- **WHEN** the domain service unit tests execute
- **THEN** they SHALL NOT require PostgreSQL, PostGIS, Prisma migrations, Prisma client generation beyond existing imports, external network services, or Nest HTTP server startup

## ADDED Requirements

### Requirement: MetodoImpactoService unit coverage
The test suite SHALL verify `MetodoImpactoService` delegates impact-method persistence operations to Prisma with the expected arguments.

#### Scenario: Finding an impact method by unique filter
- **WHEN** `findOne` receives a unique impact-method filter
- **THEN** it SHALL call `prisma.metodoImpacto.findUnique` with that `where` filter
- **THEN** it SHALL return the Prisma result

#### Scenario: Finding all impact methods
- **WHEN** `findAll` is called
- **THEN** it SHALL call `prisma.metodoImpacto.findMany` without filters
- **THEN** it SHALL return the Prisma result

#### Scenario: Listing impact methods forwards list parameters
- **WHEN** `findMany` receives pagination, filtering, cursor, and ordering parameters
- **THEN** it SHALL call `prisma.metodoImpacto.findMany` with those parameters
- **THEN** it SHALL return the Prisma result

#### Scenario: Impact method CRUD and count delegation
- **WHEN** create, update, delete, or count methods are called
- **THEN** each method SHALL call the matching `prisma.metodoImpacto` delegate with the forwarded arguments
- **THEN** each method SHALL return the Prisma result
