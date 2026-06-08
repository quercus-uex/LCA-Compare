## Requirements

### Requirement: Capture backend unit test isolation
The backend test suite SHALL include capture unit tests that run through the existing server Jest configuration without starting the NestJS HTTP server or connecting to external services.

#### Scenario: Running capture unit tests
- **WHEN** a developer runs the backend unit test command
- **THEN** the command SHALL discover and execute capture `*.spec.ts` files in `apps/server/src/capture`

#### Scenario: Isolated capture test execution
- **WHEN** capture backend unit tests execute
- **THEN** they SHALL NOT require PostgreSQL, PostGIS, Prisma migrations, Prisma client generation, mail delivery, password hashing services, or network services

### Requirement: CaptureController submission unit coverage
The test suite SHALL verify `CaptureController.postCaptureData` delegates capture submission steps in order and returns the controller response shape.

#### Scenario: Capture submission creates impact result and returns linked records
- **WHEN** `postCaptureData` receives a valid capture input DTO
- **THEN** it SHALL call `CaptureService.checkUsuario` with `metadatos.usuario`
- **THEN** it SHALL call `CaptureService.checkParcela` with the resolved user id and `metadatos.parcela`
- **THEN** it SHALL call `ResultadoImpactoService.create` with the plain result payload and `DEFAULT_IMPACT_METHOD_UUID`
- **THEN** it SHALL call `CaptureService.checkCultivo` with the resolved parcel id, created impact result id, and `metadatos.cultivo`
- **THEN** it SHALL return an object containing `usuario`, `parcela`, and `cultivo`

### Requirement: CaptureService user unit coverage
The test suite SHALL verify `CaptureService.checkUsuario` reuses existing users and creates missing users with deterministic password handling.

#### Scenario: Existing capture user is reused
- **WHEN** `checkUsuario` receives metadata for an email that resolves to an existing public user
- **THEN** it SHALL return that user
- **THEN** it SHALL NOT generate a password, hash a password, create a user, or send a new-user email

#### Scenario: Missing capture user is created and notified
- **WHEN** `checkUsuario` receives metadata for an email that does not resolve to an existing public user
- **THEN** it SHALL generate a temporary password
- **THEN** it SHALL hash the generated password using argon2id
- **THEN** it SHALL create a user with role `usuario` and metadata name, surname, and email values
- **THEN** it SHALL send a new-user email with the email and generated password
- **THEN** it SHALL return the created user

### Requirement: CaptureService parcel unit coverage
The test suite SHALL verify `CaptureService.checkParcela` finds existing parcels by supported identifiers or creates missing parcels through the correct geospatial lookup branch.

#### Scenario: Existing SIGPAC parcel is reused
- **WHEN** `checkParcela` receives SIGPAC parcel metadata and the owner already has a matching parcel
- **THEN** it SHALL search by owner id and computed SIGPAC key
- **THEN** it SHALL return the existing parcel
- **THEN** it SHALL NOT call geospatial lookup services or create a parcel

#### Scenario: Missing SIGPAC parcel is created
- **WHEN** `checkParcela` receives SIGPAC parcel metadata and no matching parcel exists
- **THEN** it SHALL fetch the polygon from `SigpacService`
- **THEN** it SHALL resolve the Spanish population from province and municipality catastro ids
- **THEN** it SHALL create a parcel with SIGPAC key, owner connection, population connection, and polygon geometry

#### Scenario: Missing Spanish cadastral parcel is created
- **WHEN** `checkParcela` receives Spanish cadastral reference metadata and no matching parcel exists
- **THEN** it SHALL fetch the polygon from `CatastroService`
- **THEN** it SHALL resolve the Spanish population from the cadastral reference province and municipality ids
- **THEN** it SHALL create a parcel with `refCat`, owner connection, population connection, and polygon geometry

#### Scenario: Missing Portuguese predial parcel is created
- **WHEN** `checkParcela` receives Portuguese predial parcel metadata and no matching parcel exists
- **THEN** it SHALL fetch the polygon from `PredialService`
- **THEN** it SHALL resolve the Portuguese population from polygon properties
- **THEN** it SHALL create a parcel with `ptIdParcela`, owner connection, population connection, and polygon geometry

#### Scenario: Parcel metadata without supported identifier is rejected
- **WHEN** `checkParcela` receives parcel metadata without SIGPAC province, Spanish cadastral reference, or Portuguese predial id
- **THEN** it SHALL reject with the missing parcel identifier error

### Requirement: CaptureService crop unit coverage
The test suite SHALL verify `CaptureService.checkCultivo` validates campaign dates, creates missing crops, and updates existing crops while removing the replaced impact result.

#### Scenario: Invalid crop campaign start date is rejected
- **WHEN** `checkCultivo` receives crop metadata whose campaign start date cannot be parsed as `yyyyMMdd`
- **THEN** it SHALL throw `BadRequestException` with the invalid campaign start date message
- **THEN** it SHALL NOT search for, create, update, or delete crop-related records

#### Scenario: Missing crop is created
- **WHEN** `checkCultivo` receives a valid campaign start date and no crop exists for the parcel and date
- **THEN** it SHALL search by parcel id and parsed campaign start date
- **THEN** it SHALL create a crop with production, type, cycle, cultivated surface, water consumption, parcel connection, and impact result connection
- **THEN** it SHALL return the created crop

#### Scenario: Existing crop is updated with new impact result
- **WHEN** `checkCultivo` receives a valid campaign start date and a crop already exists for the parcel and date
- **THEN** it SHALL update that crop to connect the new impact result
- **THEN** it SHALL delete the crop's previous impact result
- **THEN** it SHALL return the existing crop
