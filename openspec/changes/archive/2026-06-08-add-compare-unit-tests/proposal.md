## Why

The `compare` module contains controller branching, aggregation logic, filtering query construction, and PDF report generation orchestration that are currently not covered by unit tests. Adding targeted tests will reduce regression risk for comparison responses and report generation without requiring database, browser, AI, or network services.

## What Changes

- Add backend unit tests for `CompareController` request handling and service delegation.
- Add backend unit tests for `CompareService` result filtering, mean aggregation, comparison math, lifecycle cleanup, and report orchestration.
- Keep tests isolated by mocking persistence, Playwright/browser behavior, AI generation, template rendering dependencies, and location lookup services.
- No API behavior, DTO shape, or runtime dependency changes are intended.

## Capabilities

### New Capabilities
- `backend-compare-unit-tests`: Unit test coverage for the backend compare controller and service.

### Modified Capabilities

## Impact

- Affected code: `apps/server/src/compare/compare.controller.spec.ts`, `apps/server/src/compare/compare.service.spec.ts`.
- Verification: existing server Jest command, `pnpm --filter server test -- compare` or equivalent targeted Jest invocation.
- External systems: none; tests should run without PostgreSQL, PostGIS, Prisma migrations/client generation, Playwright browser launch against a real browser, AI/network calls, or Nest HTTP server startup.
