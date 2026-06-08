## Requirements
### Requirement: Backend unit test runner
The backend package SHALL provide a unit test command that runs TypeScript test files without starting the NestJS HTTP server or connecting to external services.

#### Scenario: Running backend unit tests
- **WHEN** a developer runs the backend unit test command
- **THEN** the command SHALL discover and execute `*.spec.ts` files in `apps/server/src`

#### Scenario: Isolated test execution
- **WHEN** backend unit tests execute
- **THEN** they SHALL NOT require PostgreSQL, PostGIS, Prisma migrations, Prisma client generation, or network services

### Requirement: AuthService unit coverage
The test suite SHALL verify `AuthService.login` behavior using mocked user lookup, password verification, and JWT signing dependencies.

#### Scenario: Missing user is rejected
- **WHEN** `AuthService.login` receives credentials for an email that does not resolve to a user
- **THEN** it SHALL throw `UnauthorizedException` with the invalid credentials message

#### Scenario: Invalid password is rejected
- **WHEN** `AuthService.login` receives an existing user but password verification fails
- **THEN** it SHALL throw `UnauthorizedException` with the invalid credentials message

#### Scenario: Valid credentials return access token
- **WHEN** `AuthService.login` receives an existing user and password verification succeeds
- **THEN** it SHALL sign a JWT payload containing the user's id as `sub` and email
- **THEN** it SHALL return an object containing the signed `accessToken`

### Requirement: AuthController unit coverage
The test suite SHALL verify `AuthController.login` delegates login work to `AuthService` and returns the API response wrapper used by the controller.

#### Scenario: Login response is wrapped
- **WHEN** `AuthController.login` receives a valid login DTO
- **THEN** it SHALL call `AuthService.login` with the DTO email and password
- **THEN** it SHALL return `{ data: <login result> }`

### Requirement: AuthGuard unit coverage
The test suite SHALL verify `AuthGuard.canActivate` behavior for bearer token extraction, JWT verification, and request user assignment.

#### Scenario: Missing authorization header is rejected
- **WHEN** `AuthGuard.canActivate` receives a request without an authorization header
- **THEN** it SHALL throw `UnauthorizedException` with the missing token message

#### Scenario: Non-bearer authorization header is rejected
- **WHEN** `AuthGuard.canActivate` receives an authorization header that is not a Bearer token
- **THEN** it SHALL throw `UnauthorizedException` with the missing token message

#### Scenario: Invalid bearer token is rejected
- **WHEN** `AuthGuard.canActivate` receives a Bearer token and JWT verification fails
- **THEN** it SHALL throw `UnauthorizedException` with the invalid or expired token message

#### Scenario: Valid bearer token is accepted
- **WHEN** `AuthGuard.canActivate` receives a Bearer token and JWT verification succeeds
- **THEN** it SHALL assign the verified payload to `request.user`
- **THEN** it SHALL return `true`
