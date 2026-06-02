## ADDED Requirements

### Requirement: Global stats query validation
The system SHALL validate `GET /stats/global` query parameters before executing statistics queries.

#### Scenario: Invalid year parameter
- **WHEN** client sends `GET /stats/global?anio=abc`
- **THEN** the system SHALL respond with HTTP 400 and an error message indicating that `anio` must be a valid integer year

#### Scenario: Out-of-range year parameter
- **WHEN** client sends `GET /stats/global?anio=0`
- **THEN** the system SHALL respond with HTTP 400 and an error message indicating that `anio` is outside the supported year range

#### Scenario: Empty optional string filters
- **WHEN** client sends `GET /stats/global?tipoCultivo=&idProvinciaPoblacion=`
- **THEN** the system SHALL treat the empty optional filters as absent rather than applying empty-string filters

#### Scenario: Valid query parameters preserved
- **WHEN** client sends `GET /stats/global?anio=2024&categoria=water_use&tipoCultivo=Tomate&idProvinciaPoblacion=<provinciaId>`
- **THEN** the system SHALL accept the request and compute statistics using those filters

### Requirement: Safe statistics query execution
The system SHALL execute statistics database queries without constructing SQL through unsafe string interpolation of user-controlled values.

#### Scenario: Available years with crop type filter
- **WHEN** client sends `GET /stats/global?tipoCultivo=Tomate`
- **THEN** the system SHALL compute `aniosDisponibles` using Prisma APIs or parameterized SQL rather than unsafe raw SQL interpolation

#### Scenario: Crop type contains quote characters
- **WHEN** client sends a `tipoCultivo` value containing quote characters
- **THEN** the system SHALL treat the value as data and SHALL NOT alter the SQL query structure
