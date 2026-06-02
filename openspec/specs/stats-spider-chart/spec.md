## ADDED Requirements

### Requirement: Spider chart for province impact profile
The dashboard SHALL display a spider/radar chart (Recharts `RadarChart`) showing the environmental impact profile of a selected province across the 8 EF 3.1 categories.

#### Scenario: Render spider chart with province data
- **WHEN** province ranking data is available and a province is selected
- **THEN** a spider/radar chart SHALL render with 8 axes (one per EF 3.1 category), each scaled to the category's unit, showing the selected province's mean impact per category

#### Scenario: Default province selection
- **WHEN** the dashboard loads and no province was previously selected
- **THEN** the spider chart SHALL display the province with the highest total impact (worst performer) and a dropdown selector SHALL allow changing the province

#### Scenario: Compare multiple provinces
- **WHEN** the spider chart renders
- **THEN** it SHALL support overlaying up to 3 provinces simultaneously, with a legend distinguishing them, and an "Add province" dropdown that becomes available

#### Scenario: Spider chart with no data
- **WHEN** the selected province has no impact data
- **THEN** the spider chart area SHALL display a "Sin datos de impacto" message

#### Scenario: Category axis colors match semantic palette
- **WHEN** the spider chart renders
- **THEN** each of the 8 axes SHALL use the same color as the corresponding EF 3.1 category KPI card, defined in the shared `EF_CATEGORIES` palette
