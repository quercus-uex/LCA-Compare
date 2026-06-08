## Context

The server already uses Jest with `ts-jest` and discovers `apps/server/src/**/*.spec.ts`. Many backend modules have isolated service/controller specs, but `mailer/` and `stats/` currently do not. `MailerService` constructs a Nodemailer transporter from environment variables, while `StatsService` performs multi-query Prisma reads and in-memory EF category aggregation for `GET /stats/global`.

The change is limited to backend test coverage. It should not require PostgreSQL/PostGIS, SMTP access, Prisma migrations, Nest HTTP server startup, or changes to production code unless a small refactor is strictly necessary to make existing behavior testable.

## Goals / Non-Goals

**Goals:**

- Cover `MailerService.sendNewUserMail` with a Nodemailer mock that verifies transporter setup and `sendMail` payloads.
- Cover `StatsController.getGlobalStats` query normalization and validation without starting a Nest app.
- Cover `StatsService.getGlobalStats` by injecting a mocked `PrismaService` and asserting returned DTO data plus important Prisma calls.
- Cover exported stats aggregation helpers as pure unit tests.
- Keep all tests runnable through `pnpm --filter server test` and compatible with existing Jest configuration.

**Non-Goals:**

- No end-to-end HTTP tests for `/stats/global`.
- No live database, SMTP, or external service integration tests.
- No changes to the global stats API response contract or mail content beyond asserting current behavior.
- No new test framework, coverage threshold, or CI workflow changes.

## Decisions

- Test controllers and services by direct class instantiation rather than `TestingModule` where dependency injection adds no value.
  Alternative considered: Nest testing modules for every spec. Direct construction is simpler and matches several existing unit tests while avoiding framework startup.

- Mock Prisma delegates with plain Jest functions and typed casts instead of importing/generated Prisma clients in test setup.
  Alternative considered: using a generated Prisma client mock library. The existing suite already relies on simple mocks, and no new dependency is needed.

- Mock `nodemailer` at module level and assert `createTransport`/`sendMail` interactions.
  Alternative considered: refactoring `MailerService` to accept an injected transport. That would improve dependency injection but changes production wiring for a small testing need.

- Use representative fixture data for stats aggregation rather than exhaustive EF category datasets in every service test.
  Alternative considered: fully populated impact records in all tests. Helper specs can validate category mapping broadly; service specs only need enough data to prove orchestration and aggregation paths.

- Add pure helper specs for `stats-aggregation.helpers.ts` to reduce the amount of private-method behavior that must be inferred through `StatsService.getGlobalStats` tests.
  Alternative considered: only black-box service tests. Separate helper tests make failures easier to diagnose and keep service tests focused on orchestration.

## Risks / Trade-offs

- Stats fixtures can become verbose and brittle → Keep fixtures small, use local builders, and assert key output fields instead of entire large DTOs when not necessary.
- Private `StatsService` helpers are tested indirectly → Add direct tests for exported pure helper functions and use `getGlobalStats` scenarios for private orchestration behavior.
- Nodemailer default import mocking can be sensitive to TypeScript interop → Follow Jest module mock patterns compatible with the existing `ts-jest` setup and assert through `jest.requireMock('nodemailer')` if needed.
- Existing Jest `clearMocks` may not reset module-level mocked transport state between tests → Reset/clear mock functions in `beforeEach` and create fresh service instances per test.
