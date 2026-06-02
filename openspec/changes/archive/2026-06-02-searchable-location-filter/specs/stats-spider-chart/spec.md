## MODIFIED Requirements

### Requirement: Spider chart for province impact profile
The dashboard SHALL display a spider/radar chart (Recharts `RadarChart`) showing the environmental impact profile of a selected province or population across the 8 EF 3.1 categories.

#### Scenario: Render spider chart with province data
- **WHEN** the location mode is set to "Provincia" and a province is selected
- **THEN** a spider/radar chart SHALL render with 8 axes (one per EF 3.1 category), each scaled to the category's unit, showing the selected province's mean impact per category

#### Scenario: Render spider chart with population data
- **WHEN** the location mode is set to "Población" and a population is selected
- **THEN** a spider/radar chart SHALL render with 8 axes showing the selected population's mean impact per category

#### Scenario: Default entity selection
- **WHEN** the dashboard loads and no entity was previously selected
- **THEN** the spider chart SHALL display the entity (province or population, depending on mode) with the highest total impact, and a searchable selector SHALL allow changing the entity

#### Scenario: Compare multiple entities
- **WHEN** the spider chart renders
- **THEN** it SHALL support overlaying up to 2 entities simultaneously (both of the same type: either both provinces or both populations), with a legend distinguishing them, and a second searchable selector for comparison

#### Scenario: Spider chart with no data
- **WHEN** the selected entity has no impact data
- **THEN** the spider chart area SHALL display a "Sin datos de impacto" message

#### Scenario: Category axis colors match semantic palette
- **WHEN** the spider chart renders
- **THEN** each of the 8 axes SHALL use the same color as the corresponding EF 3.1 category KPI card, defined in the shared `EF_CATEGORIES` palette

### Requirement: Spider chart on dashboard
The dashboard SHALL include a spider chart section showing the environmental impact profile of a selected province or population normalized against the maximum value across all entities of the same type for each EF 3.1 category.

#### Scenario: Spider chart with location type toggle
- **WHEN** the dashboard loads
- **THEN** the spider chart card SHALL display a toggle with "Provincia" and "Población" options, defaulting to "Provincia"

#### Scenario: Spider chart with searchable selector
- **WHEN** the dashboard loads
- **THEN** the spider chart SHALL use a search input with autocomplete dropdown instead of a native `<select>` for choosing the primary entity, filtering locally as the user types

#### Scenario: Spider chart mode switch preserves comparison
- **WHEN** user switches from "Provincia" to "Población" mode
- **THEN** the selected entities SHALL reset to the top-impact population, and the comparison selection SHALL also reset

#### Scenario: Spider chart compares entities of same type
- **WHEN** user selects a second entity from the comparison search input
- **THEN** a second overlay SHALL appear on the radar belonging to the same location type (province or population), allowing visual comparison of two entities' normalized impact fingerprints

## ADDED Requirements

### Requirement: Provincia/Población toggle in spider chart
The spider chart card SHALL include a toggle control to switch between visualizing province impact profiles and population impact profiles.

#### Scenario: Toggle default state
- **WHEN** the page loads
- **THEN** the toggle SHALL default to "Provincia" mode

#### Scenario: Switching to Población mode
- **WHEN** user clicks the "Población" tab
- **THEN** the searchable selector SHALL populate with population ranking data
- **AND** the spider chart SHALL display the population with the highest total impact

#### Scenario: Switching back to Provincia mode
- **WHEN** user clicks the "Provincia" tab after being in Población mode
- **THEN** the searchable selector SHALL populate with province ranking data
- **AND** the spider chart SHALL display the province with the highest total impact
