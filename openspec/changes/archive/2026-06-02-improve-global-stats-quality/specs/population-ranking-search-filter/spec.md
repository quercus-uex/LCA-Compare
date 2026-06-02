## MODIFIED Requirements

### Requirement: Province filter for population ranking
The dashboard SHALL include a province selector dropdown in the population ranking section that filters the displayed best and worst populations to only include populations from the selected province.

#### Scenario: Select a province
- **WHEN** user selects "Málaga" from the province filter dropdown
- **THEN** the best populations SHALL only show populations from Málaga with the lowest impact among all Málaga populations, sorted ascending
- **THEN** the worst populations SHALL only show populations from Málaga with the highest impact among all Málaga populations, sorted descending when a distinct worst list can be produced

#### Scenario: Province filter shows position within province
- **WHEN** a province filter is active and a population is the 3rd best in that province
- **THEN** its displayed position SHALL be "3"

#### Scenario: Province filter with fewer than enough distinct results
- **WHEN** the selected province has too few populations to produce distinct best and worst lists
- **THEN** the dashboard SHALL show a single neutral `Top 10` population list instead of separate duplicated best and worst lists

#### Scenario: Clear province filter
- **WHEN** user selects "Todas las provincias" from the province dropdown
- **THEN** the best/worst ranking display SHALL show populations from all provinces, using the full country-level ranking

#### Scenario: Province filter combined with search
- **WHEN** user has selected Málaga as province filter and types a population name in the search
- **THEN** the search SHALL only match populations from Málaga, and the best/worst ranking display SHALL continue using only Málaga populations
