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

### Requirement: KPI summary cards
The dashboard SHALL display 5 KPI summary cards at the top showing total parcels, total cultivations, total surface, average water consumption, and average environmental impact.

#### Scenario: Render KPI cards with data
- **WHEN** statistics data is loaded
- **THEN** each KPI card SHALL display the metric name, the numeric value with appropriate units, and the interannual variation percentage with a green/red indicator

#### Scenario: Interannual variation display
- **WHEN** `variacionInteranual` is negative (impact decreased)
- **THEN** the variation SHALL be displayed in green with a downward arrow
- **WHEN** `variacionInteranual` is positive (impact increased)
- **THEN** the variation SHALL be displayed in red with an upward arrow

### Requirement: Province ranking table
The dashboard SHALL display a sortable table ranking provinces by environmental impact and cultivation metrics.

#### Scenario: Province table with default sort
- **WHEN** the dashboard loads
- **THEN** the province table SHALL be sorted by `impactoTotalMedio` ascending (best = lowest impact = first)

#### Scenario: Sort province table by any column
- **WHEN** user clicks a column header (e.g., "Producción Media")
- **THEN** the table SHALL re-sort by that column; clicking again SHALL toggle between ascending and descending

#### Scenario: Highlight best and worst provinces
- **WHEN** the province table renders
- **THEN** the top 3 rows SHALL have a green indicator and the bottom 3 rows SHALL have a red indicator

### Requirement: Impact bar chart by province
The dashboard SHALL display a horizontal bar chart (Recharts `BarChart`) showing average total environmental impact per province.

#### Scenario: Bar chart renders with data
- **WHEN** province ranking data is available
- **THEN** a horizontal bar chart SHALL render with province names on the Y axis and `impactoTotalMedio` on the X axis, sorted from lowest to highest impact

#### Scenario: Bar color gradient
- **WHEN** the bar chart renders
- **THEN** bars SHALL use a color gradient from green (low impact) to red (high impact)

### Requirement: Temporal evolution line chart
The dashboard SHALL display a line chart (Recharts `LineChart`) showing impact trends over campaign years.

#### Scenario: Line chart with multiple impact types
- **WHEN** temporal evolution data is available
- **THEN** a line chart SHALL render with years on the X axis and impact values on the Y axis, with one line per impact type (fertilizantes, manejo_cultivo, pesticidas, sistema_riego, total)

#### Scenario: Line chart includes all years
- **WHEN** a specific year is selected in the filter
- **THEN** the line chart SHALL still display data for all available years, with the currently selected year highlighted

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
The dashboard SHALL display two side-by-side cards showing the top 10 populations with the lowest impact and the top 10 with the highest impact.

#### Scenario: Best populations card
- **WHEN** population ranking data is available
- **THEN** the left card SHALL display the top 10 populations with lowest `impactoTotalMedio` in green-styled list items

#### Scenario: Worst populations card
- **WHEN** population ranking data is available
- **THEN** the right card SHALL display the top 10 populations with highest `impactoTotalMedio` in red-styled list items

#### Scenario: Population card shows province context
- **WHEN** a population is listed in the ranking
- **THEN** the population name SHALL be followed by its province name in parentheses

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
- **THEN** the dashboard SHALL use a two-column grid layout with KPI cards in a single row at the top

#### Scenario: Mobile layout
- **WHEN** viewport width is < 1280px
- **THEN** the dashboard SHALL collapse to a single column with all sections stacked vertically
