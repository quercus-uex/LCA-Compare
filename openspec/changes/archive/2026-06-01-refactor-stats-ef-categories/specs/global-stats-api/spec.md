## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: KPIs aggregation — fields removed
**Reason**: `impactoTotalMedio` is replaced by 8 per-category mean values (`impactosPorCategoria`). `consumoAguaMedio` and `produccionMedia` move to a compact operational stats row.
**Migration**: Frontend KPI cards now read from `impactosPorCategoria.<category_id>` instead of `impactoTotalMedio`.

### Requirement: Temporal evolution — process-key fields removed
**Reason**: The fields `impactoFertilizantes`, `impactoManejoCultivo`, `impactoPesticidas`, `impactoSistemaRiego`, and `impactoTotal` are removed from `EvolucionTemporalItemDto`.
**Migration**: Frontend reads from `categorias.<category_id>` instead. The timeline component uses `categorias` for sparklines and `totalImpacto` for the stacked area chart height.

## ADDED Requirements

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
