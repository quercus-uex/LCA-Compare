## ADDED Requirements

### Requirement: Statistics dashboard page
The system SHALL provide a public page at `/estadisticas` that displays aggregated platform statistics with interactive charts and rankings.

#### Scenario: Navigate to statistics page
- **WHEN** user navigates to `/estadisticas`
- **THEN** the page SHALL fetch data from `/api/stats/global?anio=<currentYear>` and render the dashboard layout

#### Scenario: Public access
- **WHEN** an unauthenticated user navigates to `/estadisticas`
- **THEN** the page SHALL load and display data without redirecting to login

### Requirement: Year filter selector
The dashboard SHALL include a year selector dropdown in the header that filters all displayed data.

#### Scenario: Select a different year
- **WHEN** user selects a year from the dropdown
- **THEN** the dashboard SHALL refetch data from `/api/stats/global?anio=<selectedYear>` and update all sections

#### Scenario: Year dropdown populated from available data
- **WHEN** the dashboard loads
- **THEN** the year selector dropdown SHALL be populated with years from `aniosDisponibles` and include an "Todos" option for unfiltered view

### Requirement: Category selector for rankings
The dashboard SHALL include a category selector dropdown that filters province and population rankings by a specific EF 3.1 category.

#### Scenario: Category selector filters all rankings
- **WHEN** user selects "Eutrofización" from the category selector
- **THEN** the province ranking table, population ranking cards, spider chart, and heatmap SHALL all re-sort/filter to use eutrophication impact values

#### Scenario: Category selector affects KPI cards
- **WHEN** user selects a category from the selector
- **THEN** the KPI cards SHALL NOT change (they always display all 8 categories); the category selector SHALL apply only to rankings and charts that support sorting

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

### Requirement: Province ranking cards
The dashboard SHALL display two side-by-side cards showing the top 10 provinces with the lowest impact and the top 10 with the highest impact for the selected EF 3.1 category.

#### Scenario: Best provinces card
- **WHEN** province ranking data is available
- **THEN** the left card SHALL display the top 10 provinces with lowest impact in green-styled list items showing province name, parcel count, and surface area

#### Scenario: Worst provinces card
- **WHEN** province ranking data is available
- **THEN** the right card SHALL display the top 10 provinces with highest impact in red-styled list items

#### Scenario: Province ranking responds to category filter
- **WHEN** user selects a category from the selector
- **THEN** both province cards SHALL re-sort by that category's impact values

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

### Requirement: Crop type distribution donut chart
The dashboard SHALL display a donut chart (Recharts `PieChart` with inner radius) showing the distribution of cultivation types.

#### Scenario: Donut chart with crop types
- **WHEN** crop distribution data is available
- **THEN** a donut chart SHALL render with one sector per crop type, sized by `count`, and a legend showing type names with counts

### Requirement: Efficiency scatter chart
The dashboard SHALL display a scatter chart (Recharts `ScatterChart`) plotting average production vs average water consumption per province.

#### Scenario: Scatter chart with provinces
- **WHEN** province ranking data is available
- **THEN** a scatter chart SHALL render with `consumoAguaMedio` on the X axis, `produccionMedia` on the Y axis, and one point per province with bubble size proportional to `superficieTotal`

#### Scenario: Scatter chart quadrant interpretation
- **WHEN** the scatter chart renders
- **THEN** a subtle quadrant separator SHALL be drawn at the median values, and a brief legend SHALL explain the interpretation (high efficiency quadrant, high consumption quadrant, etc.)

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

### Requirement: Spider chart on dashboard
The dashboard SHALL include a spider chart section showing the environmental impact profile of a selected province normalized against the maximum value across all provinces for each EF 3.1 category.

#### Scenario: Spider chart with province selector
- **WHEN** the dashboard loads
- **THEN** a spider chart SHALL render with a dropdown allowing selection of a province, defaulting to the province with the highest total impact

#### Scenario: Spider chart compares provinces
- **WHEN** user selects a second province from the comparison dropdown
- **THEN** a second overlay SHALL appear on the radar, allowing visual comparison of two provinces' normalized impact fingerprints

### Requirement: Heatmap on dashboard
The dashboard SHALL include a heatmap section displaying provinces vs EF 3.1 categories.

#### Scenario: Heatmap renders
- **WHEN** province data is available
- **THEN** a heatmap SHALL render with top 15 provinces as rows and 8 EF 3.1 categories as columns, with color intensity indicating impact magnitude relative to the column maximum

#### Scenario: Heatmap click navigates to spider
- **WHEN** user clicks a province row label in the heatmap
- **THEN** the spider chart SHALL update to display that province's impact profile

### Requirement: Loading and error states
The dashboard SHALL handle loading, empty, and error states gracefully.

#### Scenario: Loading state
- **WHEN** data is being fetched from the API
- **THEN** skeleton placeholders (DaisyUI `skeleton` class) SHALL be displayed in place of charts and tables

#### Scenario: Error state
- **WHEN** the API request fails
- **THEN** an error message SHALL be displayed and a retry button SHALL be shown

#### Scenario: Empty state
- **WHEN** the API returns empty data (no cultivations)
- **THEN** each section SHALL display a "No hay datos disponibles" message

### Requirement: Navbar integration
The main navigation bar SHALL include a link to the statistics page.

#### Scenario: Navbar link visibility
- **WHEN** the application renders the navbar
- **THEN** a button labeled "Estadísticas" SHALL be visible alongside the existing "Comparador" button, linking to `/estadisticas`

### Requirement: Responsive layout
The dashboard SHALL be responsive and usable on mobile devices.

#### Scenario: Desktop layout
- **WHEN** viewport width is >= 1280px
- **THEN** the dashboard SHALL use a multi-column grid layout with KPI cards in a single row at the top and Spider+Heatmap in a 40/60 split

#### Scenario: Mobile layout
- **WHEN** viewport width is < 1280px
- **THEN** the dashboard SHALL collapse to a single column with all sections stacked vertically
