## 1. Mailer Tests

- [x] 1.1 Add `apps/server/src/mailer/mailer.service.spec.ts` with a module-level `nodemailer` mock and fresh mocked transporter per test.
- [x] 1.2 Verify `MailerService` creates a Gmail transport using `MAILER_EMAIL` and `MAILER_PASSWORD` from the environment.
- [x] 1.3 Verify `sendNewUserMail` delegates to `sendMail` with recipient, `Alta en ACV Compare` subject, and text containing the supplied password.

## 2. Stats Controller Tests

- [x] 2.1 Add `apps/server/src/stats/stats.controller.spec.ts` using direct controller instantiation with a mocked `StatsService.getGlobalStats`.
- [x] 2.2 Cover forwarding of valid `anio`, `categoria`, `tipoCultivo`, and `idProvinciaPoblacion` query values.
- [x] 2.3 Cover empty optional string filters being forwarded as `undefined`.
- [x] 2.4 Cover `BadRequestException` behavior for non-numeric years, out-of-range years, and invalid categories.

## 3. Stats Helper Tests

- [x] 3.1 Add `apps/server/src/stats/stats-aggregation.helpers.spec.ts` for exported pure helper functions.
- [x] 3.2 Cover campaign-year filter creation and empty filter behavior.
- [x] 3.3 Cover unique non-null impact id collection.
- [x] 3.4 Cover EF category name normalization, amount extraction, empty impact data, category sums/means, total impact, and impact sorting.

## 4. Stats Service Tests

- [x] 4.1 Add `apps/server/src/stats/stats.service.spec.ts` with mocked `PrismaService` delegates for `cultivo.findMany`, `cultivo.groupBy`, and `resultadoImpacto.findMany`.
- [x] 4.2 Cover empty-data output for KPIs, rankings, temporal evolution, crop distribution, and available years.
- [x] 4.3 Cover year and crop type filters in Prisma calls and computed DTO output from representative mocked cultivation and impact data.
- [x] 4.4 Cover skipping current impact lookup when selected cultivations have no impact result ids.
- [x] 4.5 Cover province and population ranking aggregation, including province filter and category-specific sorting.
- [x] 4.6 Cover temporal evolution using the all-cultivations query independently from the selected-year filter.
- [x] 4.7 Cover interannual variation returning a rounded percentage when previous-year impact data exists and `null` when it does not.

## 5. Verification

- [x] 5.1 Run `pnpm --filter server test -- --runInBand` and fix any failures.
- [x] 5.2 Run `pnpm server:lint` if test files introduce lint/type issues that are not caught by Jest.
- [x] 5.3 Confirm all new specs are discovered by the existing Jest `src/**/*.spec.ts` match pattern.
