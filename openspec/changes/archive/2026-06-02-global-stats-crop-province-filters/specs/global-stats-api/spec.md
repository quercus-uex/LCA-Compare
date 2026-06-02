## ADDED Requirements

### Requirement: Cultivo type filter parameter
The endpoint `GET /stats/global` SHALL accept an optional query parameter `tipoCultivo` that filters all computations (KPIs, rankings, temporal evolution, and crop distribution) to only include cultivations of the specified type.

#### Scenario: Request with valid crop type
- **WHEN** client sends `GET /stats/global?tipoCultivo=Tomate&anio=2024`
- **THEN** the system SHALL filter all `Cultivo` queries by `tipo = "Tomate"` and compute KPIs, province rankings, population rankings, and temporal evolution using only Tomate cultivations from 2024

#### Scenario: Request without crop type filter
- **WHEN** client sends `GET /stats/global` without the `tipoCultivo` parameter
- **THEN** the system SHALL include all crop types in computations (backward compatible behavior)

#### Scenario: Crop type filter combined with category filter
- **WHEN** client sends `GET /stats/global?tipoCultivo=Olivo&categoria=water_use`
- **THEN** the system SHALL filter to Olivo cultivations and rank/sort by water_use category impact

#### Scenario: Crop type with no data for selected year
- **WHEN** client sends `GET /stats/global?tipoCultivo=Trigo&anio=2024` and there are no Trigo cultivations in 2024
- **THEN** the system SHALL return KPIs with zero values, empty arrays for rankings and distributions, and HTTP 200

#### Scenario: Crop distribution still shows all types regardless of filter
- **WHEN** client sends `GET /stats/global?tipoCultivo=Tomate`
- **THEN** the `distribucionCultivos` field SHALL still return the distribution of ALL crop types (unaffected by the `tipoCultivo` filter), to preserve the donut chart's informational value

### Requirement: Province filter for population ranking parameter
The endpoint `GET /stats/global` SHALL accept an optional query parameter `idProvinciaPoblacion` that filters the population ranking to only include populations belonging to the specified province.

#### Scenario: Request with province filter for populations
- **WHEN** client sends `GET /stats/global?idProvinciaPoblacion=<provinciaId>`
- **THEN** the `rankingPoblaciones` array SHALL contain only populations whose province matches `<provinciaId>`, sorted by impact ascending

#### Scenario: Province filter does not affect other sections
- **WHEN** client sends `GET /stats/global?idProvinciaPoblacion=<provinciaId>`
- **THEN** the `rankingProvincias`, KPIs, `evolucionTemporal`, and `distribucionCultivos` SHALL be unaffected by the province filter and include data from all provinces

#### Scenario: Province filter combined with crop and category filters
- **WHEN** client sends `GET /stats/global?tipoCultivo=Tomate&idProvinciaPoblacion=<provinciaId>&categoria=climate_change`
- **THEN** the population ranking SHALL contain only populations from `<provinciaId>` with Tomate cultivations, sorted by climate_change impact

#### Scenario: Request with non-existent province
- **WHEN** client sends `GET /stats/global?idProvinciaPoblacion=invalid-id`
- **THEN** the `rankingPoblaciones` array SHALL be empty (no populations match)

## MODIFIED Requirements

### Requirement: Global statistics endpoint
The system SHALL expose a public REST endpoint `GET /stats/global` that returns aggregated statistics for the entire platform, optionally filtered by campaign year, EF 3.1 category, crop type, and province (for population ranking).

#### Scenario: Request global statistics for a specific year
- **WHEN** client sends `GET /stats/global?anio=2024`
- **THEN** system returns a `GlobalStatsDto` containing KPIs, province rankings, population rankings, temporal evolution, and crop distribution for campaigns starting in 2024

#### Scenario: Request global statistics without year filter
- **WHEN** client sends `GET /stats/global` without query parameters
- **THEN** system returns statistics for all data across all years

#### Scenario: No data available
- **WHEN** client requests statistics for a year with zero cultivations
- **THEN** system returns KPIs with zero values, empty arrays for rankings and distributions, and HTTP 200

### Requirement: Category query parameter
The endpoint `GET /stats/global` SHALL accept an optional query parameter `categoria` that filters province and population rankings by a specific EF 3.1 category.

#### Scenario: Request with valid category
- **WHEN** client sends `GET /stats/global?categoria=climate_change&anio=2024`
- **THEN** the response SHALL compute province and population `impactoTotalMedio` and sorting using only the "Climate change" category amounts

#### Scenario: Request without category
- **WHEN** client sends `GET /stats/global` without the `categoria` parameter
- **THEN** the response SHALL compute `impactoTotalMedio` as the sum of all 8 EF 3.1 category means

#### Scenario: Request with invalid category
- **WHEN** client sends `GET /stats/global?categoria=invalid`
- **THEN** the system SHALL respond with HTTP 400 and a JSON body `{ "message": "Categoria no valida", "categoriasValidas": ["climate_change", "eutrophication", ...] }`
