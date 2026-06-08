## Purpose
Public REST API endpoint for aggregated platform-wide statistics: KPIs, province and population rankings, temporal evolution, and crop distribution.
## Requirements
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

### Requirement: Global stats query validation
The system SHALL validate `GET /stats/global` query parameters before executing statistics queries.

#### Scenario: Invalid year parameter
- **WHEN** client sends `GET /stats/global?anio=abc`
- **THEN** the system SHALL respond with HTTP 400 and an error message indicating that `anio` must be a valid integer year

#### Scenario: Out-of-range year parameter
- **WHEN** client sends `GET /stats/global?anio=0`
- **THEN** the system SHALL respond with HTTP 400 and an error message indicating that `anio` is outside the supported year range

#### Scenario: Empty optional string filters
- **WHEN** client sends `GET /stats/global?tipoCultivo=&idProvinciaPoblacion=`
- **THEN** the system SHALL treat the empty optional filters as absent rather than applying empty-string filters

#### Scenario: Valid query parameters preserved
- **WHEN** client sends `GET /stats/global?anio=2024&categoria=water_use&tipoCultivo=Tomate&idProvinciaPoblacion=<provinciaId>`
- **THEN** the system SHALL accept the request and compute statistics using those filters

### Requirement: KPIs aggregation
The system SHALL compute key performance indicators from the `Cultivo` and `ResultadoImpacto` tables, including operational metrics (total parcels, total cultivations, total cultivated surface) and environmental metrics (one mean impact value per EF 3.1 category across all impact results). The response SHALL include 8 per-category mean values instead of a single `impactoTotalMedio`.

#### Scenario: Compute KPIs with Prisma aggregates
- **WHEN** the stats service processes a request
- **THEN** it SHALL use Prisma `groupBy` with `_sum`, `_avg`, and `_count` on the `Cultivo` table for operational fields and in-memory aggregation of `ResultadoImpacto.datos.impacto_total` JSON for each EF 3.1 category

#### Scenario: Interannual variation
- **WHEN** the requested year has data and the previous year also has data
- **THEN** the `variacionInteranual` field SHALL contain the percentage change in climate change impact compared to the previous year

#### Scenario: No previous year data for interannual variation
- **WHEN** the requested year is the earliest with data
- **THEN** the `variacionInteranual` field SHALL be `null`

### Requirement: Province ranking
The system SHALL compute and return a ranking of provinces with aggregated cultivation metrics and per-category environmental impact, sorted by the selected EF 3.1 category (default: total sum of all categories).

#### Scenario: Province ranking with multiple metrics
- **WHEN** client requests global statistics
- **THEN** the response SHALL include an array of provinces with fields: `idProvincia`, `nombreProvincia`, `numParcelas`, `numCultivos`, `superficieTotal`, `produccionMedia`, `consumoAguaMedio`, `impactoTotalMedio`, `eficiencia`, and `impactosPorCategoria` (a map of EF 3.1 category identifier to mean value)

#### Scenario: Province with no cultivations
- **WHEN** a province has no cultivations in the filtered period
- **THEN** that province SHALL NOT appear in the ranking (only provinces with data are included)

#### Scenario: Impact aggregation for province
- **WHEN** computing `impactoTotalMedio` for a province
- **THEN** the system SHALL find all `ResultadoImpacto` records linked to cultivations in that province and compute the arithmetic mean of the `amount` field for each EF 3.1 category within `datos.impacto_total`

#### Scenario: Filter province ranking by category
- **WHEN** client sends `GET /stats/global?categoria=climate_change`
- **THEN** provinces SHALL be sorted by `impactosPorCategoria.climate_change` ascending, and `impactoTotalMedio` SHALL equal that category's value

### Requirement: Population ranking
The system SHALL compute and return the best and worst populations ranked by the selected EF 3.1 category (default: total sum of all categories).

#### Scenario: Population ranking with impact
- **WHEN** client requests global statistics
- **THEN** the response SHALL include an array of populations with fields: `idPoblacion`, `nombrePoblacion`, `nombreProvincia`, `numParcelas`, `impactoTotalMedio`, and `impactosPorCategoria` (a map of EF 3.1 category identifier to mean value)

#### Scenario: Best populations shown first
- **WHEN** the ranking is returned
- **THEN** populations SHALL be sorted by `impactoTotalMedio` ascending (lowest impact = best = first)

#### Scenario: Filter population ranking by category
- **WHEN** client sends `GET /stats/global?categoria=water_use`
- **THEN** populations SHALL be sorted by `impactosPorCategoria.water_use` ascending, and `impactoTotalMedio` SHALL equal that category's value

### Requirement: Temporal evolution
The system SHALL compute year-over-year aggregated impact data for all campaign years, grouped by EF 3.1 category (not by process key).

#### Scenario: Temporal evolution across all years
- **WHEN** client requests global statistics
- **THEN** the response SHALL include an array `evolucionTemporal` with one entry per campaign year, each containing `anio`, `numCultivos`, `categorias` (object with 8 EF 3.1 category key-value pairs), and `totalImpacto` (sum of all category means for that year)

#### Scenario: Temporal evolution ignores the year filter
- **WHEN** client requests statistics filtered by a specific year
- **THEN** the temporal evolution array SHALL still contain data for ALL years, not just the filtered year

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
- **THEN** the system SHALL respond with HTTP 400 and a JSON body listing valid category identifiers

### Requirement: Crop type distribution
The system SHALL compute the distribution of crop types by count and total cultivated surface.

#### Scenario: Crop distribution for filtered year
- **WHEN** client requests statistics filtered by year
- **THEN** the response SHALL include an array `distribucionCultivos` where each entry has `tipo`, `count`, and `superficieTotal` for cultivations in that year

### Requirement: Available years
The system SHALL return the list of years that have cultivation data.

#### Scenario: Available years included in response
- **WHEN** client requests global statistics
- **THEN** the response SHALL include a field `aniosDisponibles: number[]` with all distinct campaign years sorted ascending

### Requirement: Shared global stats response contract
The system SHALL define the `GlobalStatsDto` response shape and nested statistics item shapes in `packages/common` and use those shared contracts across server and web code.

#### Scenario: Stats endpoint keeps response shape
- **WHEN** a client requests `GET /stats/global`
- **THEN** the returned JSON fields SHALL remain compatible with the existing `GlobalStatsDto` shape while the TypeScript contract is sourced from `packages/common`

#### Scenario: Stats frontend consumes shared shape
- **WHEN** the frontend stats hook stores or returns global statistics data
- **THEN** it SHALL type that data using the shared `GlobalStatsDto` contract from `packages/common`

#### Scenario: Stats backend aligns DTOs with shared shape
- **WHEN** backend stats DTO classes are maintained for Swagger metadata
- **THEN** their fields SHALL remain aligned with the shared global stats contracts from `packages/common`

### Requirement: Safe statistics query execution
The system SHALL execute statistics database queries without constructing SQL through unsafe string interpolation of user-controlled values.

#### Scenario: Available years with crop type filter
- **WHEN** client sends `GET /stats/global?tipoCultivo=Tomate`
- **THEN** the system SHALL compute `aniosDisponibles` using Prisma APIs or parameterized SQL rather than unsafe raw SQL interpolation

#### Scenario: Crop type contains quote characters
- **WHEN** client sends a `tipoCultivo` value containing quote characters
- **THEN** the system SHALL treat the value as data and SHALL NOT alter the SQL query structure

### Requirement: Public access
The endpoint SHALL NOT require authentication.

#### Scenario: Unauthenticated access
- **WHEN** a client without a JWT token requests `GET /stats/global`
- **THEN** the system SHALL respond with HTTP 200 and the full statistics payload

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
