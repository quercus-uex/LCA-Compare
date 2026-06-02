## ADDED Requirements

### Requirement: Crop type filter selector
The dashboard SHALL include a crop type selector dropdown in the header filter bar alongside the existing category selector and year selector.

#### Scenario: Select a crop type
- **WHEN** user selects "Tomate" from the crop type dropdown
- **THEN** the dashboard SHALL refetch data from `/api/stats/global?tipoCultivo=Tomate` (plus whatever year and category are selected) and update all sections

#### Scenario: Crop type dropdown populated from available data
- **WHEN** the dashboard loads with data containing crop types "Tomate", "Olivo", and "Trigo" in `distribucionCultivos`
- **THEN** the crop type dropdown SHALL show "Todos los cultivos" (default) plus "Tomate", "Olivo", and "Trigo" as options

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

## MODIFIED Requirements

### Requirement: Category selector for rankings
The dashboard SHALL include a category selector dropdown that filters province and population rankings by a specific EF 3.1 category.

#### Scenario: Category selector filters all rankings
- **WHEN** user selects "Eutrofización" from the category selector
- **THEN** the province ranking table, population ranking cards, spider chart, and heatmap SHALL all re-sort/filter to use eutrophication impact values

#### Scenario: Category selector affects KPI cards
- **WHEN** user selects a category from the selector
- **THEN** the KPI cards SHALL NOT change (they always display all 8 categories); the category selector SHALL apply only to rankings and charts that support sorting

### Requirement: Population ranking cards
The dashboard SHALL display two side-by-side cards showing the top 10 populations with the lowest impact and the top 10 with the highest impact for the selected EF 3.1 category. Each entry SHALL display its real ranking position number. The section SHALL include a text search input and a province filter dropdown.

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

#### Scenario: Population ranking responds to province filter
- **WHEN** user selects a province from the province filter dropdown
- **THEN** both population cards SHALL display only populations from that province, with position numbers relative to that province's ranking

#### Scenario: Population ranking responds to search
- **WHEN** user types a population name in the search input
- **THEN** matching populations SHALL be displayed with their real ranking position

### Requirement: Province ranking cards
The dashboard SHALL display two side-by-side cards showing the top 10 provinces with the lowest impact and the top 10 with the highest impact for the selected EF 3.1 category. Each entry SHALL display its real ranking position number.

#### Scenario: Best provinces card
- **WHEN** province ranking data is available
- **THEN** the left card SHALL display the top 10 provinces with lowest impact in green-styled list items showing position numbers "1" through "10"

#### Scenario: Worst provinces card
- **WHEN** province ranking data is available
- **THEN** the right card SHALL display the top 10 provinces with highest impact in red-styled list items showing their real ranking positions (e.g., position "50" for the worst out of 50)

#### Scenario: Province ranking responds to category filter
- **WHEN** user selects a category from the selector
- **THEN** both province cards SHALL re-sort by that category's impact values
