## ADDED Requirements

### Requirement: Population ranking search
The dashboard SHALL include a text search input in the population ranking section that allows the user to find a specific population by name and see its position in the full ranking.

#### Scenario: Search for a population
- **WHEN** user types a population name in the search input
- **THEN** the system SHALL filter the population ranking array client-side by matching population names (case-insensitive partial match) and display matching populations with their position number in the full ranking

#### Scenario: Search with no matches
- **WHEN** user types a name that does not match any population
- **THEN** the system SHALL display a "Sin resultados" message

#### Scenario: Search shows real ranking position
- **WHEN** a population named "Sevilla" is position 42 in the full ranking and matches the search
- **THEN** the displayed result SHALL show position number 42

#### Scenario: Clear search resets results
- **WHEN** user clears the search input
- **THEN** the search results SHALL disappear and the top 10 best/worst lists SHALL display normally

### Requirement: Province filter for population ranking
The dashboard SHALL include a province selector dropdown in the population ranking section that filters the displayed top 10 best and top 10 worst populations to only include populations from the selected province.

#### Scenario: Select a province
- **WHEN** user selects "Málaga" from the province filter dropdown
- **THEN** the top 10 best populations SHALL only show populations from Málaga with the lowest impact among all Málaga populations, sorted ascending
- **THEN** the top 10 worst populations SHALL only show populations from Málaga with the highest impact among all Málaga populations, sorted descending

#### Scenario: Province filter shows position within province
- **WHEN** a province filter is active and a population is the 3rd best in that province
- **THEN** its displayed position SHALL be "3"

#### Scenario: Province filter with fewer than 10 results
- **WHEN** the selected province has only 5 populations
- **THEN** the top 10 best SHALL show all 5 populations and the top 10 worst SHALL show the same 5 populations

#### Scenario: Clear province filter
- **WHEN** user selects "Todas las provincias" from the province dropdown
- **THEN** the top 10 best/worst SHALL show populations from all provinces, using the full country-level ranking

#### Scenario: Province filter combined with search
- **WHEN** user has selected Málaga as province filter and types a population name in the search
- **THEN** the search SHALL only match populations from Málaga, and the top 10 best/worst SHALL continue showing only Málaga populations
