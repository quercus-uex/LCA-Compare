## MODIFIED Requirements

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

### Requirement: Dashboard layout sizing
The dashboard SHALL preserve the existing responsive layout while giving dense visualizations enough horizontal room on desktop.

#### Scenario: Impact profile and heatmap desktop split
- **WHEN** viewport width is at least the desktop breakpoint
- **THEN** the impact profile card SHALL receive a larger horizontal share than before and the heatmap card SHALL remain contained within the available dashboard width

#### Scenario: Crop selector label fits
- **WHEN** the header filter bar displays the crop type selector in its default state
- **THEN** the text `Todos los cultivos` SHALL fit without being clipped
