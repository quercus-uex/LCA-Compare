## Context

`CompareController` exposes `/compare` and `/compare/report` handlers that delegate most behavior to `CompareService`, with important branching for optional target filters and insufficient data errors. `CompareService` builds Prisma-style filters, averages impact arrays, computes comparison differences, enriches report context from related location services, calls AI prompt generation, renders a Handlebars template, and uses a Playwright browser page to generate PDFs.

The backend already has Jest configured for `apps/server/src/**/*.spec.ts`, and similar backend unit test changes use direct class instantiation with mocked dependencies instead of bootstrapping a Nest HTTP server.

## Goals / Non-Goals

**Goals:**
- Add isolated unit tests for `CompareController` response/error paths and delegation.
- Add isolated unit tests for `CompareService` filter construction, aggregation, comparison math, lifecycle cleanup, and report generation orchestration.
- Mock all external or heavyweight collaborators so the compare tests run through the existing server Jest configuration without database, Prisma generation, real browser launch, AI/network calls, or Nest HTTP startup.
- Keep fixtures focused and deterministic while still covering every impact key used by comparison logic.

**Non-Goals:**
- Do not change `/compare` API behavior, DTO validation rules, response shapes, or report content.
- Do not add integration/e2e tests or start a Nest application in tests.
- Do not introduce new test framework dependencies.
- Do not refactor production compare logic unless a minimal change is required to make the existing behavior testable.

## Decisions

- Use direct class instantiation with `jest.Mocked<Pick<...>>` collaborators. This matches existing backend unit tests and keeps tests fast and independent of Nest module wiring.
- Mock Playwright's `chromium.launch` and the browser/page objects rather than launching Chromium. This validates service lifecycle and PDF orchestration while avoiding binary/runtime dependencies in unit tests.
- Mock filesystem/template dependencies only if needed by the constructor. The service constructor reads and compiles the report template, so tests can either rely on the checked-in template file or mock `fs.readFileSync`/Handlebars compilation; prefer the smallest reliable approach that keeps report assertions deterministic.
- Treat private methods as implementation details. Cover `buildReportContext` through `generateReport`, and cover `percentageDiff` through `compareResults`.
- Use representative impact fixtures that include all `IMPACT_KEYS` with at least one shared category, plus targeted category differences where needed. This prevents tests from depending on a single impact section while keeping setup compact.

## Risks / Trade-offs

- Browser and template mocks can become too implementation-specific -> assert collaborator calls and stable output inputs, not every generated HTML detail.
- Filter construction tests can be brittle because Prisma query object shapes are exact -> keep scenarios limited to meaningful branches: location OR filters, country/province/population/parcel filters, crop type, and campaign year ranges.
- Report generation currently assumes reference means exist -> include tests only for supported orchestration behavior and avoid specifying new failure handling unless implementation later requires it.
- Large impact fixtures can obscure intent -> use helper builders inside the spec files to create complete but compact result DTOs.
