## ADDED Requirements

### Requirement: Compare backend unit test isolation
The backend test suite SHALL include compare controller and service unit tests that run through the existing server Jest configuration without starting the NestJS HTTP server or connecting to external services.

#### Scenario: Running compare unit tests
- **WHEN** a developer runs the backend unit test command
- **THEN** the command SHALL discover and execute compare `*.spec.ts` files in `apps/server/src/compare`

#### Scenario: Isolated compare test execution
- **WHEN** compare backend unit tests execute
- **THEN** they SHALL NOT require PostgreSQL, PostGIS, Prisma migrations, Prisma client generation, real Playwright browser launch, AI or network services, or Nest HTTP server startup

### Requirement: CompareController comparison unit coverage
The test suite SHALL verify `CompareController.compare` delegates mean lookup, handles optional target filters, rejects insufficient data, and preserves the controller response shape.

#### Scenario: Reference-only comparison delegates and wraps data
- **WHEN** `compare` receives reference filters without target filters and reference mean data exists
- **THEN** it SHALL call `CompareService.getMeanByFilters` with the reference filters
- **THEN** it SHALL NOT call `CompareService.getMeanByFilters` for target filters
- **THEN** it SHALL return `{ data: <comparison> }` from `CompareService.compareResults(referenceMean, undefined)`

#### Scenario: Reference and target comparison delegates both means
- **WHEN** `compare` receives reference and target filters and both mean results exist
- **THEN** it SHALL call `CompareService.getMeanByFilters` with the reference filters
- **THEN** it SHALL call `CompareService.getMeanByFilters` with the target filters
- **THEN** it SHALL return `{ data: <comparison> }` from `CompareService.compareResults(referenceMean, targetMean)`

#### Scenario: Missing reference mean is rejected
- **WHEN** `compare` receives filters whose reference mean lookup returns no result
- **THEN** it SHALL throw `UnprocessableEntityException` with the insufficient data message
- **THEN** it SHALL NOT call `CompareService.compareResults`

#### Scenario: Missing target mean is rejected when target filters are provided
- **WHEN** `compare` receives target filters and the target mean lookup returns no result
- **THEN** it SHALL throw `UnprocessableEntityException` with the insufficient data message
- **THEN** it SHALL NOT call `CompareService.compareResults`

### Requirement: CompareController report unit coverage
The test suite SHALL verify `CompareController.compareToReport` validates required filter sets, delegates report data retrieval, and returns a streamable PDF response.

#### Scenario: Report request requires reference and target filters
- **WHEN** `compareToReport` receives a body without either reference or target filters
- **THEN** it SHALL throw `BadRequestException` with the missing filter message
- **THEN** it SHALL NOT call `CompareService.findResults` or `CompareService.generateReport`

#### Scenario: Report request delegates result lookup and PDF generation
- **WHEN** `compareToReport` receives reference and target filters
- **THEN** it SHALL call `CompareService.findResults` with the reference filters
- **THEN** it SHALL call `CompareService.findResults` with the target filters
- **THEN** it SHALL call `CompareService.generateReport` with reference filters, reference results, target filters, and target results
- **THEN** it SHALL return a `StreamableFile` for the generated PDF buffer

### Requirement: CompareService filtering unit coverage
The test suite SHALL verify `CompareService.findResults` builds the expected lookup filters and uses geospatial lookup only when location radius inputs are complete.

#### Scenario: Empty filters return no results without persistence calls
- **WHEN** `findResults` receives filters without location, crop, country, province, population, parcel, or campaign constraints
- **THEN** it SHALL return an empty array
- **THEN** it SHALL NOT call `ResultadoImpactoService.findManyAroundPoint`
- **THEN** it SHALL NOT call `ResultadoImpactoService.findMany`

#### Scenario: Location radius filters use nearby impact ids
- **WHEN** `findResults` receives latitude, longitude, and range filters
- **THEN** it SHALL call `ResultadoImpactoService.findManyAroundPoint` with latitude, longitude, and range
- **THEN** it SHALL call `ResultadoImpactoService.findMany` with an `AND` condition containing an `OR` branch for the nearby result ids
- **THEN** it SHALL return the persistence results

#### Scenario: Entity and campaign filters build combined conditions
- **WHEN** `findResults` receives country, province ids, population ids, parcel ids, crop type, and campaign year bounds
- **THEN** it SHALL call `ResultadoImpactoService.findMany` with an `AND` condition containing the relevant location `OR` filters
- **THEN** it SHALL include crop type equality when `tipoCultivo` is provided
- **THEN** it SHALL include campaign start date `gte` and exclusive end date `lt` filters for the provided campaign year bounds

### Requirement: CompareService aggregation unit coverage
The test suite SHALL verify `CompareService.getMeanOfResults` and `getMeanByFilters` produce deterministic impact means without mutating the source data.

#### Scenario: Empty result means are undefined
- **WHEN** `getMeanOfResults` receives an empty result array
- **THEN** it SHALL return `undefined`

#### Scenario: Single result mean returns its impact data
- **WHEN** `getMeanOfResults` receives one result
- **THEN** it SHALL return that result's impact data

#### Scenario: Multiple result means average matching categories across all impact keys
- **WHEN** `getMeanOfResults` receives multiple results containing matching impact categories
- **THEN** it SHALL return a result DTO whose amounts are the arithmetic average per category for each impact key
- **THEN** it SHALL preserve category names and units from the base result items

#### Scenario: Filtered mean delegates through findResults
- **WHEN** `getMeanByFilters` receives compare filters
- **THEN** it SHALL call `findResults` with those filters
- **THEN** it SHALL return `getMeanOfResults` for the found results

### Requirement: CompareService comparison unit coverage
The test suite SHALL verify `CompareService.compareResults` preserves reference values and computes target comparison fields consistently.

#### Scenario: Reference-only comparison omits target fields
- **WHEN** `compareResults` receives only reference impact data
- **THEN** each returned item SHALL include category, unit, and `refAmount`
- **THEN** each returned item SHALL NOT include `tarAmount` or `diff`

#### Scenario: Target comparison includes amount and percentage difference
- **WHEN** `compareResults` receives reference and target impact data with matching categories
- **THEN** each returned matching item SHALL include `tarAmount`
- **THEN** each returned matching item SHALL include `diff` equal to `((refAmount - tarAmount) / tarAmount) * 100`

#### Scenario: Missing or zero target amount produces zero difference
- **WHEN** `compareResults` receives target data without a matching category or with target amount zero
- **THEN** the returned item SHALL use `tarAmount` zero
- **THEN** the returned item SHALL use `diff` zero

### Requirement: CompareService report unit coverage
The test suite SHALL verify `CompareService` lifecycle and report generation orchestration with mocked browser, AI, and lookup dependencies.

#### Scenario: Module lifecycle launches and closes the browser
- **WHEN** `onModuleInit` executes
- **THEN** it SHALL launch Chromium through Playwright
- **WHEN** `onModuleDestroy` executes after initialization
- **THEN** it SHALL close the launched browser

#### Scenario: Report generation builds comparison, AI text, contexts, and PDF
- **WHEN** `generateReport` receives reference and target filters plus impact results with crop and location relations
- **THEN** it SHALL compute comparison data from mean reference and target results
- **THEN** it SHALL call `AiService.generateFromTemplate` for compare overview and recommendations
- **THEN** it SHALL fetch related countries, provinces, and populations for report context
- **THEN** it SHALL render PDF content through the mocked browser page
- **THEN** it SHALL return the generated PDF buffer

#### Scenario: Report context marks selected filters
- **WHEN** `generateReport` builds reference and target report contexts from results and filters
- **THEN** selected country, province, population, crop type, and campaign year filters SHALL be represented as chosen values in the rendered template input
