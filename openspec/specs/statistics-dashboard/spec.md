## Purpose
Interactive dashboard page at `/estadisticas` for visualizing aggregated platform statistics with charts, rankings, and filtering controls.
## Requirements
### Requirement: Statistics dashboard page
The system SHALL provide a public page at `/estadisticas` that displays aggregated platform statistics with interactive charts and rankings.

#### Scenario: Navigate to statistics page
- **WHEN** user navigates to `/estadisticas`
- **THEN** the page SHALL fetch data from `/api/stats/global` without forcing the current calendar year as the initial filter and render the dashboard layout

#### Scenario: Public access
- **WHEN** an unauthenticated user navigates to `/estadisticas`
- **THEN** the page SHALL load and display data without redirecting to login

#### Scenario: Historical data exists but current year has no data
- **WHEN** user navigates to `/estadisticas` and the current calendar year has no cultivations but prior years have data
- **THEN** the initial dashboard SHALL show available statistics instead of an empty current-year state

#### Scenario: Wide desktop dashboard
- **WHEN** user views `/estadisticas` on a wide desktop viewport
- **THEN** the dashboard content SHALL be allowed to use a wider maximum page width than the previous `7xl` limit while preserving mobile stacking behavior

### Requirement: Year filter selector
The dashboard SHALL include a year selector dropdown in the header that filters all displayed data.

#### Scenario: Select a different year
- **WHEN** user selects a year from the dropdown
- **THEN** the dashboard SHALL refetch data from `/api/stats/global?anio=<selectedYear>` and update all sections

#### Scenario: Year dropdown populated from available data
- **WHEN** the dashboard loads
- **THEN** the year selector dropdown SHALL be populated with years from `aniosDisponibles` and include an "Todos" option for unfiltered view

#### Scenario: Initial year selector state
- **WHEN** the dashboard first renders before the user selects a year
- **THEN** the year selector SHALL display the unfiltered "Todos" state unless the implementation has selected a latest available year from returned data

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
The dashboard SHALL display ranking cards for provinces with the lowest and highest impact for the selected EF 3.1 category. Each entry SHALL display its real ranking position number, and the dashboard SHALL avoid presenting duplicate best/worst entries as distinct insights when the ranking has too few items.

#### Scenario: Best provinces card
- **WHEN** province ranking data is available
- **THEN** the left card SHALL display up to 10 provinces with lowest impact in green-styled list items showing real position numbers

#### Scenario: Worst provinces card
- **WHEN** province ranking data has enough entries to show a distinct worst list
- **THEN** the right card SHALL display up to 10 provinces with highest impact in red-styled list items showing their real ranking positions (e.g., position "50" for the worst out of 50)

#### Scenario: Province ranking has fewer than enough distinct entries
- **WHEN** the province ranking has too few entries to produce distinct best and worst lists
- **THEN** the dashboard SHALL show a single neutral `Top 10` list instead of separate best and worst province lists

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
The dashboard SHALL display ranking cards for populations with the lowest and highest impact for the selected EF 3.1 category. Each entry SHALL display its real ranking position number. The section SHALL include a text search input and a province filter dropdown, and SHALL avoid presenting duplicate best/worst entries as distinct insights when the ranking has too few items.

#### Scenario: Best populations card
- **WHEN** population ranking data is available
- **THEN** the left card SHALL display up to 10 populations with lowest `impactoTotalMedio` in green-styled list items

#### Scenario: Worst populations card
- **WHEN** population ranking data has enough entries to show a distinct worst list
- **THEN** the right card SHALL display up to 10 populations with highest `impactoTotalMedio` in red-styled list items

#### Scenario: Population ranking has fewer than enough distinct entries
- **WHEN** the population ranking has too few entries to produce distinct best and worst lists
- **THEN** the dashboard SHALL show a single neutral `Top 10` list instead of separate best and worst population lists

#### Scenario: Population ranking responds to category filter
- **WHEN** user selects "Uso de Agua" from the category selector
- **THEN** both population cards SHALL re-sort by water use impact

#### Scenario: Population card shows province context
- **WHEN** a population is listed in the ranking
- **THEN** the population name SHALL be followed by its province name in parentheses

#### Scenario: Population ranking responds to province filter
- **WHEN** user selects a province from the province filter dropdown
- **THEN** both population cards SHALL display only populations from that province, with position numbers relative to that province's ranking

#### Scenario: Population ranking responds to search
- **WHEN** user types a population name in the search input
- **THEN** matching populations SHALL be displayed with their real ranking position

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
The dashboard SHALL handle loading, empty, and error states gracefully using maintainable presentation components or equivalent isolated render paths.

#### Scenario: Loading state
- **WHEN** data is being fetched from the API
- **THEN** skeleton placeholders (DaisyUI `skeleton` class) SHALL be displayed in place of charts and tables

#### Scenario: Error state
- **WHEN** the API request fails
- **THEN** an error message SHALL be displayed and a retry button SHALL be shown

#### Scenario: Empty state
- **WHEN** the API returns empty data (no cultivations)
- **THEN** each section SHALL display a "No hay datos disponibles" message

#### Scenario: Route composition remains readable
- **WHEN** the statistics page is maintained
- **THEN** loading, empty, error, filters, and dashboard content concerns SHALL be isolated enough that changing one does not require editing unrelated chart rendering logic

### Requirement: Navbar integration
The main navigation bar SHALL include a link to the statistics page.

#### Scenario: Navbar link visibility
- **WHEN** the application renders the navbar
- **THEN** a button labeled "Estadísticas" SHALL be visible alongside the existing "Comparador" button, linking to `/estadisticas`

### Requirement: Responsive layout
The dashboard SHALL be responsive and usable on mobile devices.

#### Scenario: Desktop layout
- **WHEN** viewport width is >= 1280px
- **THEN** the dashboard SHALL use a multi-column grid layout with KPI cards in a single row at the top and Spider+Heatmap in a split where the impact profile has enough horizontal room and the heatmap remains contained within the dashboard width

#### Scenario: Mobile layout
- **WHEN** viewport width is < 1280px
- **THEN** the dashboard SHALL collapse to a single column with all sections stacked vertically

### Requirement: Crop type filter selector
The dashboard SHALL include a crop type selector dropdown in the header filter bar alongside the existing category selector and year selector.

#### Scenario: Select a crop type
- **WHEN** user selects "Tomate" from the crop type dropdown
- **THEN** the dashboard SHALL refetch data from `/api/stats/global?tipoCultivo=Tomate` (plus whatever year and category are selected) and update all sections

#### Scenario: Crop type dropdown populated from available data
- **WHEN** the dashboard loads with data containing crop types "Tomate", "Olivo", and "Trigo" in `distribucionCultivos`
- **THEN** the crop type dropdown SHALL show "Todos los cultivos" (default) plus "Tomate", "Olivo", and "Trigo" as options

#### Scenario: Crop selector label fits
- **WHEN** the header filter bar displays the crop type selector in its default state
- **THEN** the text `Todos los cultivos` SHALL fit without being clipped

#### Scenario: Crop type filter affects all sections
- **WHEN** a crop type is selected
- **THEN** the KPI cards, province ranking, population ranking, spider chart, heatmap, and scatter chart SHALL all display data filtered by the selected crop type
- **THEN** the donut chart "Distribucion por Cultivo" SHALL continue showing the full distribution of all crop types

#### Scenario: Clear crop type filter
- **WHEN** user selects "Todos los cultivos" from the crop type dropdown
- **THEN** the dashboard SHALL refetch data without the `tipoCultivo` parameter and show all crop types

### Requirement: Ranking position numbers
The dashboard SHALL display the actual ranking position number for each entry in the province and population ranking lists, not just the position within the displayed top 10 subset.

#### Scenario: Best provinces show real positions
- **WHEN** the province ranking shows the top 10 best provinces
- **THEN** the first entry SHALL display position "1", the second "2", continuing to "10"

#### Scenario: Worst provinces show real positions
- **WHEN** the province ranking has 50 provinces and shows the top 10 worst
- **THEN** the first entry (worst) SHALL display position "50", the second "49", continuing to "41"

#### Scenario: Best populations show real positions
- **WHEN** the population ranking shows the top 10 best populations
- **THEN** the first entry SHALL display position "1"

#### Scenario: Worst populations show real positions
- **WHEN** a province filter is active and there are 15 populations from that province, showing top 10 worst
- **THEN** the first entry (worst within that province) SHALL display position "15"

### Requirement: Ranking values show selected category unit
The statistics dashboard SHALL display the selected EF 3.1 category's measurement unit next to impact values in province and population ranking entries when a category filter is selected.

#### Scenario: Province ranking shows selected category unit
- **WHEN** user selects an EF 3.1 category from the statistics category selector
- **THEN** each visible province ranking value SHALL display the value followed by that category's unit from EF category metadata

#### Scenario: Population ranking shows selected category unit
- **WHEN** user selects an EF 3.1 category from the statistics category selector
- **THEN** each visible population ranking value SHALL display the value followed by that category's unit from EF category metadata

#### Scenario: Population search results show selected category unit
- **WHEN** user selects an EF 3.1 category and searches for a population in the population ranking section
- **THEN** matching search result values SHALL display the value followed by that category's unit from EF category metadata

#### Scenario: Total ranking avoids misleading category unit
- **WHEN** no EF 3.1 category is selected in the statistics category selector
- **THEN** ranking values SHALL NOT display a category-specific unit next to the total impact value

### Requirement: Ranking entries navigate to comparator reference
The statistics dashboard SHALL allow users to click province and population ranking entries to navigate to the comparator with the clicked location preselected as the reference filter.

#### Scenario: Click province ranking entry
- **WHEN** user clicks a province entry in the province ranking list
- **THEN** the application SHALL navigate to `/compare`
- **THEN** the comparator reference filter card SHALL contain that province as a selected province filter

#### Scenario: Click population ranking entry
- **WHEN** user clicks a population entry in the population ranking list
- **THEN** the application SHALL navigate to `/compare`
- **THEN** the comparator reference filter card SHALL contain that population as a selected population filter

#### Scenario: Click population search result
- **WHEN** user clicks a population entry in the population ranking search results
- **THEN** the application SHALL navigate to `/compare`
- **THEN** the comparator reference filter card SHALL contain that population as a selected population filter

#### Scenario: Ranking navigation preserves comparator target state
- **WHEN** user arrives at `/compare` from a province or population ranking entry
- **THEN** the comparator target filter card SHALL remain disabled and empty unless another existing navigation state explicitly preselects a target

#### Scenario: Clickable ranking entries remain keyboard accessible
- **WHEN** a province or population ranking entry is rendered as a navigation control
- **THEN** keyboard users SHALL be able to focus and activate the entry to reach the comparator
