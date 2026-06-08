## ADDED Requirements

### Requirement: Admin backend unit test isolation
The backend test suite SHALL include admin unit tests that run through the existing server Jest configuration without starting the NestJS HTTP server or connecting to external services.

#### Scenario: Running admin unit tests
- **WHEN** a developer runs the backend unit test command
- **THEN** the command SHALL discover and execute admin `*.spec.ts` files in `apps/server/src/admin`

#### Scenario: Isolated admin test execution
- **WHEN** admin backend unit tests execute
- **THEN** they SHALL NOT require PostgreSQL, PostGIS, Prisma migrations, Prisma client generation, or network services

### Requirement: AdminGuard unit coverage
The test suite SHALL verify `AdminGuard.canActivate` behavior using mocked JWT verification and mocked user lookup dependencies.

#### Scenario: Missing authorization header is rejected
- **WHEN** `AdminGuard.canActivate` receives a request without an authorization header
- **THEN** it SHALL throw `UnauthorizedException` with the missing token message
- **THEN** it SHALL NOT verify a JWT or look up a user

#### Scenario: Non-bearer authorization header is rejected
- **WHEN** `AdminGuard.canActivate` receives an authorization header that is not a Bearer token
- **THEN** it SHALL throw `UnauthorizedException` with the missing token message
- **THEN** it SHALL NOT verify a JWT or look up a user

#### Scenario: Invalid bearer token is rejected
- **WHEN** `AdminGuard.canActivate` receives a Bearer token and JWT verification fails
- **THEN** it SHALL throw `UnauthorizedException` with the invalid or expired token message
- **THEN** it SHALL verify the token using `JWT_SECRET`

#### Scenario: Missing verified user is forbidden
- **WHEN** `AdminGuard.canActivate` receives a valid token whose subject does not resolve to a user
- **THEN** it SHALL throw `ForbiddenException` with the admin role required message

#### Scenario: Non-admin verified user is forbidden
- **WHEN** `AdminGuard.canActivate` receives a valid token whose user role is not `admin`
- **THEN** it SHALL throw `ForbiddenException` with the admin role required message

#### Scenario: Admin user is accepted
- **WHEN** `AdminGuard.canActivate` receives a valid token whose subject resolves to an admin user
- **THEN** it SHALL assign `{ sub, email, rol }` to `request.user`
- **THEN** it SHALL return `true`

### Requirement: AdminController user unit coverage
The test suite SHALL verify `AdminController` user methods delegate to `UsuarioService`, wrap responses consistently, and hash user passwords before persistence.

#### Scenario: Users list delegates search and pagination
- **WHEN** `getUsuarios` receives search, skip, and take query values
- **THEN** it SHALL call `UsuarioService.findAll` with an insensitive OR search across user fields and numeric pagination values
- **THEN** it SHALL call `UsuarioService.count` with the same search filter
- **THEN** it SHALL return `{ data, total }`

#### Scenario: Existing user lookup is wrapped
- **WHEN** `getUsuario` receives an id that resolves to a user
- **THEN** it SHALL return `{ data: <user> }`

#### Scenario: Missing user lookup throws not found
- **WHEN** `getUsuario` receives an id that does not resolve to a user
- **THEN** it SHALL throw `NotFoundException` with the user not found message

#### Scenario: User creation hashes password input
- **WHEN** `createUsuario` receives a body containing `passwordHash`
- **THEN** it SHALL hash the password using argon2id before calling `UsuarioService.create`
- **THEN** it SHALL return `{ data: <created user> }`

#### Scenario: User update hashes string password input
- **WHEN** `updateUsuario` receives a body whose `passwordHash` is a string
- **THEN** it SHALL hash the password using argon2id before calling `UsuarioService.update`
- **THEN** it SHALL pass the route id as the update `where` id

#### Scenario: User delete delegates by id
- **WHEN** `deleteUsuario` receives a user id
- **THEN** it SHALL call `UsuarioService.delete` with that id
- **THEN** it SHALL return `{ data: <deleted user> }`

### Requirement: AdminController resource CRUD unit coverage
The test suite SHALL verify `AdminController` methods for parcelas, cultivos, métodos de impacto, países, provincias, and poblaciones delegate to the correct service methods and preserve controller response shapes.

#### Scenario: Resource list methods delegate search, pagination, and count
- **WHEN** a list method for an admin-managed resource receives search, skip, and take query values
- **THEN** it SHALL call that resource service list method with the expected insensitive search filter and numeric pagination values
- **THEN** it SHALL call that resource service count method with the same search filter
- **THEN** it SHALL return `{ data, total }`

#### Scenario: Parcel list includes cultivos order
- **WHEN** `getParcelas` lists parcelas
- **THEN** it SHALL request related `cultivos` ordered by descending `fechaInicioCampania`

#### Scenario: Resource lookup wraps existing entity
- **WHEN** a single-resource lookup resolves to an entity
- **THEN** it SHALL return `{ data: <entity> }`

#### Scenario: Resource lookup throws not found for missing entity
- **WHEN** a single-resource lookup does not resolve to an entity
- **THEN** it SHALL throw `NotFoundException` with that resource's not found message

#### Scenario: Resource creation delegates body
- **WHEN** a resource create method receives a request body
- **THEN** it SHALL pass that body to the corresponding service create method
- **THEN** it SHALL return `{ data: <created entity> }`

#### Scenario: Resource update delegates id and body
- **WHEN** a resource update method receives a route id and request body
- **THEN** it SHALL pass `{ where: { id }, data: <body> }` to the corresponding service update method
- **THEN** it SHALL return `{ data: <updated entity> }`

#### Scenario: Resource delete delegates by id
- **WHEN** a resource delete method receives a route id
- **THEN** it SHALL pass that id to the corresponding service delete method
- **THEN** it SHALL return `{ data: <deleted entity> }`
