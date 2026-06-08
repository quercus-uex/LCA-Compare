## 1. Test Environment Setup

- [x] 1.1 Add the minimal server dev dependencies for Jest-based TypeScript unit tests.
- [x] 1.2 Add a server Jest configuration that discovers `apps/server/src/**/*.spec.ts` and works with the existing TypeScript setup.
- [x] 1.3 Add `test` and optional `test:cov` scripts to `apps/server/package.json`.
- [x] 1.4 Add an optional root `server:test` script for consistency with existing server commands.

## 2. AuthService Unit Tests

- [x] 2.1 Create `apps/server/src/auth/auth.service.spec.ts` with mocked `UsuarioService`, `JwtService`, and `argon2.verify`.
- [x] 2.2 Test that missing users throw `UnauthorizedException` with the invalid credentials message.
- [x] 2.3 Test that invalid passwords throw `UnauthorizedException` with the invalid credentials message.
- [x] 2.4 Test that valid credentials sign `{ sub, email }` and return the generated `accessToken`.

## 3. AuthController Unit Tests

- [x] 3.1 Create `apps/server/src/auth/auth.controller.spec.ts` with a mocked `AuthService`.
- [x] 3.2 Test that `login` passes email and password to `AuthService.login`.
- [x] 3.3 Test that `login` returns the `{ data: <login result> }` response shape.

## 4. AuthGuard Unit Tests

- [x] 4.1 Create `apps/server/src/auth/auth.guard.spec.ts` with a minimal mocked `ExecutionContext` and mocked `JwtService`.
- [x] 4.2 Test that a missing authorization header is rejected with the missing token message.
- [x] 4.3 Test that a non-Bearer authorization header is rejected with the missing token message.
- [x] 4.4 Test that a Bearer token rejected by JWT verification throws the invalid or expired token message.
- [x] 4.5 Test that a valid Bearer token assigns the verified payload to `request.user` and returns `true`.

## 5. Verification

- [x] 5.1 Run `pnpm --filter server test` and ensure all auth unit tests pass.
- [x] 5.2 Run `pnpm server:build` to ensure the test setup does not break backend compilation.
- [x] 5.3 Update implementation notes if any NodeNext/Jest configuration nuance is discovered during verification.
