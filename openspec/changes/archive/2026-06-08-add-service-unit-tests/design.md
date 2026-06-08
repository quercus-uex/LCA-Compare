## Context

The backend already has a Jest setup and recent isolated unit tests for auth, admin, and capture behavior. `CatastroService`, `SigpacService`, and `PredialService` are small HTTP-backed services that convert external cadastral responses into GeoJSON polygons, but they currently rely on indirect coverage through capture flows.

These tests need to run inside the existing server test configuration, without live HTTP requests, database access, Prisma client generation, or PostGIS. The services can be instantiated directly with mocked `HttpService` instances because their behavior is concentrated in `getPolygon`.

## Goals / Non-Goals

**Goals:**

- Add focused unit specs for `CatastroService.getPolygon`, `SigpacService.getPolygon`, and `PredialService.getPolygon`.
- Verify externally visible service behavior: outgoing request URL/options, response parsing, returned GeoJSON shape, coordinate ordering, and predial metadata extraction.
- Keep tests deterministic by mocking `HttpService.get` and avoiding external network calls.
- Keep the existing Jest test command as the only required test runner path.

**Non-Goals:**

- Change production lookup behavior, DTOs, endpoint URLs, or capture service logic.
- Add integration tests against live Catastro, SIGPAC, predial, database, or PostGIS services.
- Add new test frameworks or runtime dependencies.

## Decisions

- Instantiate services directly instead of using Nest testing modules. These services only depend on `HttpService`, so direct construction keeps tests smaller and avoids unnecessary Nest container setup.
- Mock `HttpService.get` to return RxJS observables consumed by `firstValueFrom`. This preserves the service's async control flow while preventing network access.
- Assert request URLs with `URL` parsing rather than brittle full-string comparisons where query parameter ordering is not semantically important.
- Mock `proj4` in predial tests to make coordinate transformation deterministic and to verify EPSG source/target arguments without depending on projection math.
- Use one `*.service.spec.ts` file per service in the service directory. This matches the current backend test discovery pattern and keeps each service's fixtures local to its behavior.

## Risks / Trade-offs

- Fixture brittleness around external response formats -> Keep XML, JSON, and WKT fixtures minimal but representative of the fields currently parsed by each service.
- Over-mocking projection math -> Verify the `proj4` calls and returned transformed coordinates; do not attempt to validate the third-party library itself.
- URL encoding differences can make assertions noisy -> Parse captured URL strings and assert individual query parameters and origins instead of relying on full URL text.
- Tests may reveal edge cases not currently handled, such as empty SIGPAC features or malformed WKT -> Keep this change focused on current expected behavior unless implementation fails the specified happy paths.
