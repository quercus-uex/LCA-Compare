## MODIFIED Requirements

### Requirement: EF 3.1 category constants
The system SHALL define a shared constant array `EF_CATEGORIES` in `packages/common` containing the 8 Environmental Footprint 3.1 impact category identifiers used for aggregation and display, with one entry per category including its English matching names, Spanish display name, unit, and semantic color.

#### Scenario: Categories include all 8 EF 3.1 impacts
- **WHEN** the constant is referenced
- **THEN** it SHALL include entries for: climate_change, eutrophication, acidification, water_use, land_use, particulate_matter, ecotoxicity, and human_toxicity

#### Scenario: Each category has a Spanish display name
- **WHEN** category "climate_change" is used in UI
- **THEN** its Spanish display name SHALL be "Cambio Climático"

#### Scenario: Each category exposes backend matching names
- **WHEN** backend aggregation matches persisted EF impact JSON category names
- **THEN** it SHALL use the shared category's English matching names from `packages/common`
