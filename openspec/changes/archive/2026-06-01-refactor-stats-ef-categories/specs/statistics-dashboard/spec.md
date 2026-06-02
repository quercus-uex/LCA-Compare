## MODIFIED Requirements

### Requirement: KPI summary cards
The dashboard SHALL display 8 KPI summary cards (one per EF 3.1 category) at the top, plus a compact operational stats row below showing total parcels, total cultivations, and total surface.

#### Scenario: Render EF category KPI cards with data
- **WHEN** statistics data is loaded
- **THEN** 8 KPI cards SHALL render in a responsive grid, each displaying the category's Spanish name, its mean value with unit, the category's semantic color as an accent, and the interannual variation percentage

#### Scenario: Interannual variation display
- **WHEN** `variacionInteranual` is negative (impact decreased)
- **THEN** the variation SHALL be displayed in green with a downward arrow on the climate change card
- **WHEN** `variacionInteranual` is positive (impact increased)
- **THEN** the variation SHALL be displayed in red with an upward arrow on the climate change card

#### Scenario: Compact operational stats row
- **WHEN** KPI data is loaded
- **THEN** a compact row of 3 mini-metrics SHALL render below the 8 category cards showing: total parcels, total cultivations, and total surface area

### Requirement: Province ranking table
The dashboard SHALL display a sortable table ranking provinces by the selected EF 3.1 category and cultivation metrics, with a category selector dropdown.

#### Scenario: Province table with default sort
- **WHEN** the dashboard loads without a category filter
- **THEN** the province table SHALL be sorted by total impact (sum of all 8 categories) ascending

#### Scenario: Province table with category filter
- **WHEN** user selects "Cambio Climático" from the category selector
- **THEN** the province table SHALL re-sort by climate change impact ascending and display that category's values in the impact column

#### Scenario: Sort province table by any column
- **WHEN** user clicks a column header
- **THEN** the table SHALL re-sort by that column; clicking again SHALL toggle between ascending and descending

#### Scenario: Highlight best and worst provinces
- **WHEN** the province table renders
- **THEN** the top 3 rows SHALL have a green indicator and the bottom 3 rows SHALL have a red indicator

### Requirement: Temporal evolution visualization
The dashboard SHALL display a stacked area chart showing the evolution of total impact decomposed by EF 3.1 category contribution over campaign years, plus a grid of 8 sparklines (one per category) for individual trend inspection.

#### Scenario: Stacked area chart with EF categories
- **WHEN** temporal evolution data is available
- **THEN** a stacked area chart (Recharts `AreaChart`) SHALL render with years on the X axis, impact values on the Y axis, and one stacked area per EF 3.1 category using the semantic color palette

#### Scenario: Sparklines grid
- **WHEN** temporal evolution data is available
- **THEN** a 4x2 grid of miniature line charts SHALL render below the stacked area chart, each showing the trend of a single EF 3.1 category over time with its semantic color

#### Scenario: Line chart includes all years
- **WHEN** a specific year is selected in the filter
- **THEN** the stacked area chart and sparklines SHALL still display data for all available years

### Requirement: Population ranking cards
The dashboard SHALL display two side-by-side cards showing the top 10 populations with the lowest impact and the top 10 with the highest impact for the selected EF 3.1 category.

#### Scenario: Best populations card
- **WHEN** population ranking data is available
- **THEN** the left card SHALL display the top 10 populations with lowest `impactoTotalMedio` in green-styled list items

#### Scenario: Worst populations card
- **WHEN** population ranking data is available
- **THEN** the right card SHALL display the top 10 populations with highest `impactoTotalMedio` in red-styled list items

#### Scenario: Population ranking responds to category filter
- **WHEN** user selects "Uso de Agua" from the category selector
- **THEN** both population cards SHALL re-sort by water use impact

#### Scenario: Population card shows province context
- **WHEN** a population is listed in the ranking
- **THEN** the population name SHALL be followed by its province name in parentheses

## REMOVED Requirements

### Requirement: Impact bar chart by province
**Reason**: The horizontal bar chart showing `impactoTotalMedio` per province is redundant with the province ranking table. Its function is replaced by the heatmap which provides richer multi-dimensional comparison.
**Migration**: The `StatsBarChart` component is removed. Province impact values are available in the table and heatmap.

### Requirement: Impact vs surface scatter chart
**Reason**: The `StatsImpactScatterChart` showing impacto vs superficie is redundant with the efficiency scatter chart which already visualizes the relationship between key metrics.
**Migration**: The `StatsImpactScatterChart` component is removed. Surface and production metrics remain in the province table and the efficiency scatter chart.

## ADDED Requirements

### Requirement: Category selector for rankings
The dashboard SHALL include a category selector dropdown that filters province and population rankings by a specific EF 3.1 category.

#### Scenario: Category selector filters all rankings
- **WHEN** user selects "Eutrofización" from the category selector
- **THEN** the province ranking table, population ranking cards, spider chart, and heatmap SHALL all re-sort/filter to use eutrophication impact values

#### Scenario: Category selector affects KPI cards
- **WHEN** user selects a category from the selector
- **THEN** the KPI cards SHALL NOT change (they always display all 8 categories); the category selector SHALL apply only to rankings and charts that support sorting

### Requirement: Spider chart on dashboard
The dashboard SHALL include a spider chart section showing the environmental impact profile of a selected province.

#### Scenario: Spider chart with province selector
- **WHEN** the dashboard loads
- **THEN** a spider chart SHALL render with a dropdown allowing selection of a province, defaulting to the province with the highest total impact

#### Scenario: Spider chart compares provinces
- **WHEN** user clicks "Añadir provincia" on the spider chart
- **THEN** a second overlay SHALL appear on the radar, allowing visual comparison of two provinces' impact fingerprints

### Requirement: Heatmap on dashboard
The dashboard SHALL include a heatmap section displaying provinces vs EF 3.1 categories.

#### Scenario: Heatmap renders
- **WHEN** province data is available
- **THEN** a heatmap SHALL render with top 15 provinces as rows and 8 EF 3.1 categories as columns, with color intensity indicating impact magnitude

#### Scenario: Heatmap click navigates to spider
- **WHEN** user clicks a province row label in the heatmap
- **THEN** the spider chart SHALL update to display that province's impact profile
