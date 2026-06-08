## Why

The `capture` backend flow coordinates user creation, parcel lookup or creation, crop upsert behavior, and impact result persistence, but it currently lacks unit coverage. Adding focused tests reduces regression risk around this integration-heavy endpoint without requiring PostgreSQL, PostGIS, Prisma, external geospatial services, or network calls.

## What Changes

- Add isolated Jest unit tests for `CaptureController` request orchestration and response shape.
- Add isolated Jest unit tests for `CaptureService` branch behavior across user, parcel, and crop checks.
- Mock all persistence, mail, password, geospatial, and impact dependencies so tests remain deterministic and fast.
- Keep production behavior and public API contracts unchanged.

## Capabilities

### New Capabilities
- `backend-capture-unit-tests`: Unit coverage expectations for the backend capture controller and service.

### Modified Capabilities

## Impact

- Affected code: `apps/server/src/capture/capture.controller.spec.ts`, `apps/server/src/capture/capture.service.spec.ts`.
- Existing test command: `pnpm --filter server test` / `pnpm --dir apps/server test` should discover and run the new specs.
- No API, database schema, dependency, or runtime behavior changes are expected.
