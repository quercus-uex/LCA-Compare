## Context

The server package already has Jest configured and uses direct class instantiation with mocked dependencies for backend unit tests. Existing auth and admin specs demonstrate the expected pattern: keep tests close to the Nest classes, mock external modules where needed, and avoid bootstrapping the HTTP server or connecting to infrastructure.

`CaptureController` orchestrates a single capture submission by checking or creating a user, checking or creating a parcel, creating an impact result, then checking or creating a crop. `CaptureService` contains most branch logic and depends on persistence services, geospatial lookups, password hashing, generated passwords, mail delivery, and date parsing.

## Goals / Non-Goals

**Goals:**

- Add deterministic unit tests for `CaptureController.postCaptureData` orchestration.
- Add deterministic unit tests for `CaptureService.checkUsuario`, `checkParcela`, and `checkCultivo` behavior.
- Verify the main supported parcel identifier branches: SIGPAC, Spanish cadastral reference, and Portuguese predial id.
- Ensure tests run through the existing server Jest command without PostgreSQL, Prisma, PostGIS, network, or mail services.

**Non-Goals:**

- Do not change capture endpoint behavior or response shape.
- Do not add end-to-end tests, HTTP integration tests, or database-backed tests.
- Do not test external service implementations such as Catastro, SIGPAC, Predial, Mailer, or Prisma services.
- Do not introduce new testing dependencies unless existing Jest capabilities are insufficient.

## Decisions

- Use direct class instantiation instead of `TestingModule` for both controller and service tests. This matches existing unit test style and keeps dependency wiring explicit and fast.
- Mock dependencies as typed `jest.Mocked<Pick<...>>` service slices. This validates interactions with the current service APIs while avoiding construction of unrelated providers.
- Mock `argon2` and `generate-password` at module level in the service spec. This makes new-user coverage deterministic and prevents expensive password hashing in unit tests.
- Test private parcel creation behavior through the public `checkParcela` method. This preserves encapsulation while still covering SIGPAC, cadastral, predial, and missing-identifier branches.
- Assert observable effects rather than implementation internals where possible: service calls, thrown exceptions, returned entities, and cleanup of replaced impact results.

## Risks / Trade-offs

- Mock-heavy tests can mirror implementation details too closely -> Keep assertions focused on behavior-critical calls and data shapes, not every intermediate variable.
- Date assertions can be timezone-sensitive -> Use UTC ISO timestamps when checking parsed campaign dates.
- Private `createParcela` branch coverage depends on `checkParcela` finding no existing parcel -> Explicitly mock `parcelaService.findMany` to return `[]` in creation tests.
- Generated Prisma types may make mock fixtures verbose -> Use minimal objects cast to the expected return types where the tested code only reads a subset of fields.

## Migration Plan

No runtime migration is required. Add the spec files, run the server Jest command for the capture tests, and leave production code unchanged unless tests reveal an existing defect that must be fixed during implementation.
