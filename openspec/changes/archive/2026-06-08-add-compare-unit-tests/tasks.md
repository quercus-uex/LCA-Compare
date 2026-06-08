## 1. CompareController Tests

- [x] 1.1 Add `apps/server/src/compare/compare.controller.spec.ts` with a mocked `CompareService` and direct `CompareController` instantiation.
- [x] 1.2 Cover `compare` reference-only success, reference-and-target success, missing reference mean rejection, and missing target mean rejection.
- [x] 1.3 Cover `compareToReport` missing filter rejection, result lookup delegation, report generation delegation, and returned `StreamableFile` behavior.

## 2. CompareService Test Setup

- [x] 2.1 Add `apps/server/src/compare/compare.service.spec.ts` with mocked `ResultadoImpactoService`, location services, `AiService`, Playwright browser/page objects, and any template dependencies needed for deterministic assertions.
- [x] 2.2 Add compact fixture helpers for complete `ResultadoImpactoDto` impact data across all `IMPACT_KEYS` and related result records used by report context.

## 3. CompareService Filtering And Aggregation Tests

- [x] 3.1 Cover `findResults` empty filters, complete location radius filters, and combined entity/crop/campaign filters.
- [x] 3.2 Cover `getMeanOfResults` empty input, single-result input, and multi-result averages across all impact keys.
- [x] 3.3 Cover `getMeanByFilters` delegation from filters to `findResults` and returned mean calculation.

## 4. CompareService Comparison And Report Tests

- [x] 4.1 Cover `compareResults` reference-only output, target amount and percentage difference output, and missing or zero target amount behavior.
- [x] 4.2 Cover `onModuleInit` and `onModuleDestroy` with mocked Playwright launch and browser close.
- [x] 4.3 Cover `generateReport` comparison creation, AI overview/recommendation generation, location lookup context creation, selected filter markers in template input, browser page PDF rendering, and returned PDF buffer.

## 5. Verification

- [x] 5.1 Run targeted compare tests with the server Jest configuration.
- [x] 5.2 Run the full server unit test suite or document any blocker if unrelated existing tests fail.
