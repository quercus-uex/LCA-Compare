## ADDED Requirements

### Requirement: EF 3.1 category constants
The system SHALL define a constant array `EF_CATEGORIES` containing the 8 Environmental Footprint 3.1 impact category identifiers used for aggregation and display, with one entry per category including its English name, Spanish display name, and semantic color.

#### Scenario: Categories include all 8 EF 3.1 impacts
- **WHEN** the constant is referenced
- **THEN** it SHALL include entries for: climate_change, eutrophication, acidification, water_use, land_use, particulate_matter, ecotoxicity, and human_toxicity

#### Scenario: Each category has a Spanish display name
- **WHEN** category "climate_change" is used in UI
- **THEN** its Spanish display name SHALL be "Cambio Climático"

### Requirement: Per-category impact aggregation
The system SHALL compute platform-wide mean impact values for each of the 8 EF 3.1 categories by extracting `amount` values from the `impacto_total` key of each `ResultadoImpacto.datos` JSON, matching by category name (case-insensitive), and computing the arithmetic mean across all `ResultadoImpacto` records.

#### Scenario: Aggregate climate change impact
- **WHEN** computing the platform mean for the "Climate change" category
- **THEN** the system SHALL iterate all `ResultadoImpacto` records, extract `datos.impacto_total[i].amount` where `datos.impacto_total[i].category` matches "Climate change" (case-insensitive), sum all amounts, and divide by the count of records

#### Scenario: Category not present in a result
- **WHEN** a `ResultadoImpacto` does not contain a given EF 3.1 category in its `impacto_total` array
- **THEN** that record SHALL contribute 0 to the sum for that category

#### Scenario: No impact results available
- **WHEN** there are zero `ResultadoImpacto` records
- **THEN** all 8 category mean values SHALL be 0

### Requirement: Category-filtered province ranking
The system SHALL support an optional `?categoria=` query parameter on `GET /stats/global` that filters province and population rankings to a specific EF 3.1 category instead of the total impact aggregation.

#### Scenario: Filter by climate change category
- **WHEN** client sends `GET /stats/global?categoria=climate_change`
- **THEN** the system SHALL compute `impactoTotalMedio` for each province using only the "Climate change" category amounts instead of summing all categories

#### Scenario: Omit category filter
- **WHEN** client sends `GET /stats/global` without the `categoria` parameter
- **THEN** the system SHALL compute `impactoTotalMedio` as the sum of all 8 EF 3.1 category amounts (backwards-compatible total)

#### Scenario: Unknown category value
- **WHEN** client sends `GET /stats/global?categoria=invalid_category`
- **THEN** the system SHALL return HTTP 400 with an error message listing valid category identifiers

### Requirement: Per-category temporal evolution with sparklines
The system SHALL compute year-over-year aggregated impact data for each of the 8 EF 3.1 categories and expose it as a stacked time series for the area chart and per-category arrays for sparklines.

#### Scenario: Temporal evolution returns per-category data
- **WHEN** client requests global statistics
- **THEN** the response `evolucionTemporal` array SHALL contain one entry per year, each with fields: `anio`, `numCultivos`, and an object `categorias` mapping each EF 3.1 category identifier to its mean amount for that year

#### Scenario: Stacked total for area chart
- **WHEN** computing temporal evolution for year Y
- **THEN** each year entry SHALL also include `totalImpacto` which is the sum of all 8 category means, used as the area chart's total height

#### Scenario: Temporal evolution ignores the year filter
- **WHEN** client requests statistics filtered by a specific year
- **THEN** the temporal evolution array SHALL still contain data for ALL years
