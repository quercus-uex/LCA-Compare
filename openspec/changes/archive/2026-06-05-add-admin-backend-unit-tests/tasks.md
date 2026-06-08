## 1. AdminGuard Unit Tests

- [x] 1.1 Create `apps/server/src/admin/admin.guard.spec.ts` with direct `AdminGuard` instantiation and mocked `JwtService.verifyAsync` plus `UsuarioService.findOne`.
- [x] 1.2 Add rejection tests for missing authorization header and non-Bearer authorization header, asserting no JWT verification or user lookup occurs.
- [x] 1.3 Add rejection test for invalid Bearer token, asserting verification uses `JWT_SECRET` and throws the invalid or expired token message.
- [x] 1.4 Add forbidden tests for valid JWT payloads whose user lookup returns no user or a non-admin user.
- [x] 1.5 Add success test for an admin user, asserting `request.user` receives `{ sub, email, rol }` and `canActivate` returns `true`.

## 2. AdminController User Unit Tests

- [x] 2.1 Create `apps/server/src/admin/admin.controller.spec.ts` with direct `AdminController` instantiation and mocked services for all constructor dependencies.
- [x] 2.2 Add `getUsuarios` test for insensitive OR search, numeric `skip`/`take`, matching count filter, and `{ data, total }` response.
- [x] 2.3 Add `getUsuario` tests for successful `{ data }` wrapping and missing user `NotFoundException`.
- [x] 2.4 Add `createUsuario` test that mocks `argon2.hash`, verifies argon2id hashing, passes the hashed value to `UsuarioService.create`, and wraps the result.
- [x] 2.5 Add `updateUsuario` test that hashes string `passwordHash`, passes `{ where: { id }, data }` to `UsuarioService.update`, and wraps the result.
- [x] 2.6 Add `deleteUsuario` test that delegates `{ id }` to `UsuarioService.delete` and wraps the result.

## 3. AdminController Resource CRUD Unit Tests

- [x] 3.1 Add list method tests for parcelas, cultivos, métodos de impacto, países, provincias, and poblaciones covering expected search fields, numeric pagination, count calls, and `{ data, total }` responses.
- [x] 3.2 Add specific `getParcelas` assertion that the list call includes `cultivos` ordered by descending `fechaInicioCampania`.
- [x] 3.3 Add successful lookup tests for resource `get*` methods, asserting each wraps the service result as `{ data }`.
- [x] 3.4 Add missing lookup tests for resource `get*` methods, asserting each throws the correct `NotFoundException` message.
- [x] 3.5 Add create method tests for resources, asserting request bodies are passed to each corresponding service `create` method and results are wrapped.
- [x] 3.6 Add update method tests for resources, asserting `{ where: { id }, data: body }` is passed to each corresponding service `update` method and results are wrapped.
- [x] 3.7 Add delete method tests for resources, asserting ids are passed to each corresponding service `delete` method and results are wrapped.

## 4. Verification

- [x] 4.1 Run `pnpm --filter server test` and fix any unit test failures.
- [x] 4.2 Run `pnpm --filter server build` if production code changes are required during implementation.
- [x] 4.3 Confirm admin tests do not require PostgreSQL, PostGIS, Prisma migrations, Prisma client generation, or network services.
