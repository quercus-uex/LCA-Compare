## MODIFIED Requirements

### Requirement: Per-category impact aggregation
The system SHALL compute platform-wide mean impact values for each of the 8 EF 3.1 categories by extracting `amount` values from the `impacto_total` key of each `ResultadoImpacto.datos` JSON, matching by normalized category name, and computing the arithmetic mean across all `ResultadoImpacto` records.

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

#### Scenario: Ranking sort helper consistency
- **WHEN** province and population rankings are sorted for the same selected EF 3.1 category
- **THEN** both rankings SHALL use the same category value selection rules and ascending impact order
