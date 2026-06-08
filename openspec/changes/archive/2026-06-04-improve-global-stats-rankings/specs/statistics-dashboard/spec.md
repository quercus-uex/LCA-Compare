## ADDED Requirements

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
