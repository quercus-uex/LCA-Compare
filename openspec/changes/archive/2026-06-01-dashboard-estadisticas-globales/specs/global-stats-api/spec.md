## ADDED Requirements

### Requirement: Global statistics endpoint
The system SHALL expose a public REST endpoint `GET /stats/global` that returns aggregated statistics for the entire platform, optionally filtered by campaign year.

#### Scenario: Request global statistics for a specific year
- **WHEN** client sends `GET /stats/global?anio=2024`
- **THEN** system returns a `GlobalStatsDto` containing KPIs, province rankings, population rankings, temporal evolution, and crop distribution for campaigns starting in 2024

#### Scenario: Request global statistics without year filter
- **WHEN** client sends `GET /stats/global` without query parameters
- **THEN** system returns statistics for all data across all years

#### Scenario: No data available
- **WHEN** client requests statistics for a year with zero cultivations
- **THEN** system returns KPIs with zero values, empty arrays for rankings and distributions, and HTTP 200

### Requirement: KPIs aggregation
The system SHALL compute key performance indicators from the `Cultivo` and `ResultadoImpacto` tables, including total parcels, total cultivations, total cultivated surface, average water consumption, average production, and average total environmental impact.

#### Scenario: Compute KPIs with Prisma aggregates
- **WHEN** the stats service processes a request
- **THEN** it SHALL use Prisma `groupBy` with `_sum`, `_avg`, and `_count` on the `Cultivo` table for numeric fields and in-memory aggregation of `ResultadoImpacto.datos` JSON for impact metrics

#### Scenario: Interannual variation
- **WHEN** the requested year has data and the previous year also has data
- **THEN** the `variacionInteranual` field SHALL contain the percentage change in total impact compared to the previous year

#### Scenario: No previous year data for interannual variation
- **WHEN** the requested year is the earliest with data
- **THEN** the `variacionInteranual` field SHALL be `null`

### Requirement: Province ranking
The system SHALL compute and return a ranking of provinces with aggregated cultivation metrics and average environmental impact, orderable by any metric.

#### Scenario: Province ranking with multiple metrics
- **WHEN** client requests global statistics
- **THEN** the response SHALL include an array of provinces with fields: `idProvincia`, `nombreProvincia`, `numParcelas`, `numCultivos`, `superficieTotal`, `produccionMedia`, `consumoAguaMedio`, `impactoTotalMedio`, and `eficiencia`

#### Scenario: Province with no cultivations
- **WHEN** a province has no cultivations in the filtered period
- **THEN** that province SHALL NOT appear in the ranking (only provinces with data are included)

#### Scenario: Impact aggregation for province
- **WHEN** computing `impactoTotalMedio` for a province
- **THEN** the system SHALL find all `ResultadoImpacto` records linked to cultivations in that province and compute the arithmetic mean of the `amount` field for the `impacto_total` category across all sub-categories

### Requirement: Population ranking
The system SHALL compute and return the best and worst populations ranked by average total environmental impact.

#### Scenario: Population ranking with impact
- **WHEN** client requests global statistics
- **THEN** the response SHALL include an array of populations with fields: `idPoblacion`, `nombrePoblacion`, `nombreProvincia`, `numParcelas`, and `impactoTotalMedio`

#### Scenario: Best populations shown first
- **WHEN** the ranking is returned
- **THEN** populations SHALL be sorted by `impactoTotalMedio` ascending (lowest impact = best = first)

### Requirement: Temporal evolution
The system SHALL compute year-over-year aggregated impact data for all campaign years to show trends.

#### Scenario: Temporal evolution across all years
- **WHEN** client requests global statistics
- **THEN** the response SHALL include an array `evolucionTemporal` with one entry per campaign year, each containing `anio`, `impactoFertilizantes`, `impactoManejoCultivo`, `impactoPesticidas`, `impactoSistemaRiego`, `impactoTotal`, and `numCultivos`

#### Scenario: Temporal evolution ignores the year filter
- **WHEN** client requests statistics filtered by a specific year
- **THEN** the temporal evolution array SHALL still contain data for ALL years, not just the filtered year

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

### Requirement: Public access
The endpoint SHALL NOT require authentication.

#### Scenario: Unauthenticated access
- **WHEN** a client without a JWT token requests `GET /stats/global`
- **THEN** the system SHALL respond with HTTP 200 and the full statistics payload
