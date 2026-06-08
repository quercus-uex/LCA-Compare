## Why

`mailer/` and `stats/` currently have no unit tests, leaving email dispatch wiring and statistics aggregation behavior unprotected against regressions. Adding focused Jest coverage now improves confidence around modules that depend on external mail transport and multi-step Prisma aggregation without requiring live infrastructure.

## What Changes

- Add isolated backend unit tests for `MailerService` that mock Nodemailer transport creation and verify new-user email dispatch payloads.
- Add isolated backend unit tests for `StatsController` query parsing, optional filter normalization, valid category forwarding, and invalid query rejection.
- Add isolated backend unit tests for `StatsService` covering Prisma query delegation, KPI/ranking/temporal/crop-distribution aggregation, empty-data behavior, year/category/crop/province filters, and interannual variation edge cases.
- Add isolated backend unit tests for `stats-aggregation.helpers.ts` covering impact id collection, EF category lookup, amount extraction, category averaging, totals, sorting, and campaign-year filter construction.
- Keep tests executable through the existing server Jest configuration without PostgreSQL, PostGIS, SMTP, Nest HTTP startup, or external services.

## Capabilities

### New Capabilities
- `backend-mailer-stats-unit-tests`: Defines unit test coverage requirements for backend mailer and statistics modules.

### Modified Capabilities

## Impact

- Affected code: `apps/server/src/mailer/*.spec.ts`, `apps/server/src/stats/*.spec.ts`.
- Affected tooling: existing `apps/server/jest.config.cjs` and `pnpm --filter server test` execution path.
- No API, database schema, runtime dependency, or frontend behavior changes are expected.
