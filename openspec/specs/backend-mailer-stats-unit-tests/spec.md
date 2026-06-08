## Requirements

### Requirement: Backend mailer and stats unit test isolation
The backend test suite SHALL include unit tests for the mailer and stats modules that run through the existing server Jest configuration without starting application infrastructure.

#### Scenario: Running mailer and stats unit tests
- **WHEN** a developer runs the backend unit test command
- **THEN** the command SHALL discover and execute `*.spec.ts` files for `apps/server/src/mailer` and `apps/server/src/stats`

#### Scenario: Isolated mailer and stats test execution
- **WHEN** the mailer and stats unit tests execute
- **THEN** they SHALL NOT require PostgreSQL, PostGIS, Prisma migrations, SMTP access, external network services, or Nest HTTP server startup

### Requirement: MailerService unit coverage
The test suite SHALL verify `MailerService` configures Nodemailer from mailer environment variables and delegates new-user email dispatch to the transporter.

#### Scenario: Creating mailer transport from environment
- **WHEN** `MailerService` is instantiated with `MAILER_EMAIL` and `MAILER_PASSWORD` environment variables
- **THEN** it SHALL call `nodemailer.createTransport` with Gmail service configuration and those credentials

#### Scenario: Sending new user email
- **WHEN** `sendNewUserMail` receives a recipient email and generated password
- **THEN** it SHALL call the transporter's `sendMail` with that recipient, the `Alta en ACV Compare` subject, and a text body containing the supplied password

### Requirement: StatsController unit coverage
The test suite SHALL verify `StatsController` validates and normalizes `GET /stats/global` query parameters before delegating to `StatsService`.

#### Scenario: Valid query parameters are forwarded
- **WHEN** `getGlobalStats` receives a numeric year, valid EF category, crop type, and province id filter
- **THEN** it SHALL call `StatsService.getGlobalStats` with the parsed year and normalized filter values

#### Scenario: Empty optional filters are omitted
- **WHEN** `getGlobalStats` receives empty strings for optional category, crop type, or province id filters
- **THEN** it SHALL call `StatsService.getGlobalStats` with `undefined` for those filters

#### Scenario: Invalid year is rejected
- **WHEN** `getGlobalStats` receives a non-numeric year value
- **THEN** it SHALL throw `BadRequestException` and SHALL NOT call `StatsService.getGlobalStats`

#### Scenario: Out-of-range year is rejected
- **WHEN** `getGlobalStats` receives a year outside the supported range
- **THEN** it SHALL throw `BadRequestException` and SHALL NOT call `StatsService.getGlobalStats`

#### Scenario: Invalid category is rejected
- **WHEN** `getGlobalStats` receives a category that is not an EF category identifier
- **THEN** it SHALL throw `BadRequestException` containing the valid category identifiers and SHALL NOT call `StatsService.getGlobalStats`

### Requirement: Stats aggregation helper unit coverage
The test suite SHALL verify exported stats aggregation helpers handle EF category mapping, empty data, duplicates, totals, sorting, and year filters deterministically.

#### Scenario: Building campaign year filters
- **WHEN** `buildCampaignYearFilter` receives a campaign year
- **THEN** it SHALL return a date range from the start of that year to the start of the next year

#### Scenario: Omitting campaign year filters
- **WHEN** `buildCampaignYearFilter` receives no campaign year
- **THEN** it SHALL return an empty filter object

#### Scenario: Collecting impact ids
- **WHEN** `collectImpactoIds` receives crops with duplicate impact ids and null impact ids
- **THEN** it SHALL return unique non-null impact ids only

#### Scenario: Mapping impact category amounts
- **WHEN** `getCategoryAmounts` receives `impacto_total` entries using known EF category names with differing casing or whitespace
- **THEN** it SHALL return amounts keyed by EF category id and zeroes for missing categories

#### Scenario: Empty impact category data
- **WHEN** `getCategoryAmounts` receives null, undefined, or missing `impacto_total` data
- **THEN** it SHALL return zero amounts for all EF category ids

#### Scenario: Summing and averaging categories
- **WHEN** `sumCategories` and `meanCategories` receive multiple category amount records
- **THEN** they SHALL return the per-category sums and arithmetic means

#### Scenario: Sorting by impact
- **WHEN** `sortByImpact` receives ranked items and an optional EF category id
- **THEN** it SHALL sort by that category's amount when provided, otherwise by `impactoTotalMedio`

### Requirement: StatsService unit coverage
The test suite SHALL verify `StatsService.getGlobalStats` orchestrates Prisma queries and computes the returned global stats DTO from mocked data.

#### Scenario: Empty global stats data
- **WHEN** Prisma returns no cultivations, no available years, and no crop distribution rows
- **THEN** `getGlobalStats` SHALL return zero KPI values, empty rankings, empty temporal evolution, empty crop distribution, and an empty available-years list

#### Scenario: Global stats with year and crop filters
- **WHEN** `getGlobalStats` receives a year and crop type filter
- **THEN** it SHALL query cultivations using the campaign-year range and crop type
- **THEN** it SHALL compute KPIs, rankings, crop distribution, and available years from the mocked Prisma results

#### Scenario: Impact records are queried only when needed
- **WHEN** the selected cultivations have no impact result ids
- **THEN** `getGlobalStats` SHALL NOT query `resultadoImpacto.findMany` for current selected impact records

#### Scenario: Province ranking aggregation
- **WHEN** selected cultivations include province, parcel, production, water, surface, and impact data
- **THEN** `getGlobalStats` SHALL aggregate province ranking entries with parcel count, crop count, total surface, average production, average water consumption, category impacts, total impact, and efficiency

#### Scenario: Population ranking province filter
- **WHEN** `getGlobalStats` receives an `idProvinciaPoblacion` filter
- **THEN** the returned population ranking SHALL include only populations whose province id matches that filter

#### Scenario: Category-specific ranking sort
- **WHEN** `getGlobalStats` receives a valid EF category id
- **THEN** province and population rankings SHALL be sorted by that category's aggregated amount

#### Scenario: Temporal evolution uses all campaign years
- **WHEN** `getGlobalStats` is requested for a specific filtered year
- **THEN** the returned temporal evolution SHALL be computed from the separate all-cultivations Prisma query rather than only the filtered selected cultivations

#### Scenario: Interannual variation with previous impact data
- **WHEN** `getGlobalStats` receives a year and the previous year has climate-change impact data
- **THEN** the KPI `variacionInteranual` SHALL contain the rounded percentage change from previous-year climate-change mean to current climate-change mean

#### Scenario: Interannual variation without previous impact data
- **WHEN** `getGlobalStats` receives a year and the previous year has no impact result ids or zero previous climate-change impact
- **THEN** the KPI `variacionInteranual` SHALL be `null`
