## Purpose
Shared EF 3.1 category metadata and aggregation behavior for platform-wide impact statistics, rankings, and temporal impact visualizations.
## Requirements

### Requirement: EF 3.1 category constants
The system SHALL define a shared constant array `EF_CATEGORIES` in `packages/common` containing the 10 Environmental Footprint 3.1 impact category identifiers used for aggregation and display, with one entry per category including its English matching names, Spanish display name, unit, and semantic color.

#### Scenario: Categories include all 10 EF 3.1 impacts
- **WHEN** the constant is referenced
- **THEN** it SHALL include entries for: climate_change, acidification, eutrophication_freshwater, eutrophication_marine, eutrophication_terrestrial, water_use, land_use, particulate_matter, ecotoxicity, and human_toxicity

#### Scenario: Each category has a Spanish display name
- **WHEN** category "climate_change" is used in UI
- **THEN** its Spanish display name SHALL be "Cambio Climático"

#### Scenario: Indicators with different units are not aggregated
- **WHEN** EF 3.1 reports the freshwater (kg P eq), marine (kg N eq) and terrestrial (mol N eq) eutrophication indicators
- **THEN** each SHALL be a separate category with its own unit, and their amounts SHALL NOT be summed into a single eutrophication value

#### Scenario: Each category exposes backend matching names
- **WHEN** backend aggregation matches persisted EF impact JSON category names
- **THEN** it SHALL use the shared category's English matching names from `packages/common`

### Requirement: Per-category impact aggregation
The system SHALL compute platform-wide mean impact values for each of the 10 EF 3.1 categories by extracting `amount` values from the `impacto_total` key of each `ResultadoImpacto.datos` JSON, matching by normalized category name, and computing the arithmetic mean across all `ResultadoImpacto` records.

#### Scenario: Aggregate climate change impact
- **WHEN** computing the platform mean for the "Climate change" category
- **THEN** the system SHALL iterate all `ResultadoImpacto` records, extract `datos.impacto_total[i].amount` where `datos.impacto_total[i].category` matches "Climate change" after normalization, sum all amounts, and divide by the count of records

#### Scenario: Aggregate category with whitespace and case differences
- **WHEN** an impact item has category text with leading/trailing whitespace or different letter casing
- **THEN** the system SHALL match it to the corresponding EF 3.1 category after trimming whitespace and applying case-insensitive comparison

#### Scenario: Category not present in a result
- **WHEN** a `ResultadoImpacto` does not contain a given EF 3.1 category in its `impacto_total` array
- **THEN** that record SHALL contribute 0 to the sum for that category

#### Scenario: No impact results available
- **WHEN** there are zero `ResultadoImpacto` records
- **THEN** all 10 category mean values SHALL be 0

### Requirement: Category-filtered province ranking
The system SHALL support an optional `?categoria=` query parameter on `GET /stats/global` that selects the EF 3.1 category used to sort province and population rankings. Categories have different units, so the system SHALL NOT compute any total impact that adds categories together.

#### Scenario: Filter by climate change category
- **WHEN** client sends `GET /stats/global?categoria=climate_change`
- **THEN** the system SHALL sort provinces and populations by their mean "Climate change" amount

#### Scenario: Omit category filter
- **WHEN** client sends `GET /stats/global` without the `categoria` parameter
- **THEN** the system SHALL sort the rankings by `climate_change` (default category) and SHALL NOT expose a summed `impactoTotalMedio`

#### Scenario: Total category rejected
- **WHEN** client sends `GET /stats/global?categoria=total`
- **THEN** the system SHALL return HTTP 400, since no cross-unit total exists

#### Scenario: Unknown category value
- **WHEN** client sends `GET /stats/global?categoria=invalid_category`
- **THEN** the system SHALL return HTTP 400 with an error message listing valid category identifiers

#### Scenario: Ranking sort helper consistency
- **WHEN** province and population rankings are sorted for the same selected EF 3.1 category
- **THEN** both rankings SHALL use the same category value selection rules and ascending impact order

### Requirement: Per-category temporal evolution with sparklines
The system SHALL compute year-over-year aggregated impact data for each of the 10 EF 3.1 categories and expose it as per-category series: the area chart shows one selected category at a time and the sparklines show each category separately.

#### Scenario: Temporal evolution returns per-category data
- **WHEN** client requests global statistics
- **THEN** the response `evolucionTemporal` array SHALL contain one entry per year, each with fields: `anio`, `numCultivos`, and an object `categorias` mapping each EF 3.1 category identifier to its mean amount for that year

#### Scenario: No summed total per year
- **WHEN** computing temporal evolution for year Y
- **THEN** the year entry SHALL NOT include a `totalImpacto` adding category means with different units

#### Scenario: Temporal evolution ignores the year filter
- **WHEN** client requests statistics filtered by a specific year
- **THEN** the temporal evolution array SHALL still contain data for ALL years
