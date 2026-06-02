## ADDED Requirements

### Requirement: Searchable entity selector
The system SHALL provide a reusable searchable selector component that replaces native `<select>` dropdowns for choosing a single entity from a potentially large list.

#### Scenario: Typing filters the entity list
- **WHEN** user types text into the search input
- **AND** the entity list contains items matching the typed text (case-insensitive, partial match on entity name)
- **THEN** a dropdown SHALL appear with up to 10 matching entities sorted by relevance

#### Scenario: No matching results
- **WHEN** user types text that matches no entity in the list
- **THEN** the dropdown SHALL display a "Sin resultados" message

#### Scenario: Selecting an entity from the dropdown
- **WHEN** user clicks on an entity in the dropdown
- **THEN** the selected entity name SHALL appear in the input field
- **AND** the dropdown SHALL close
- **AND** the parent component SHALL receive the selected entity via the `onChange` callback

#### Scenario: Keyboard navigation
- **WHEN** the dropdown is open
- **THEN** pressing ArrowDown SHALL move focus to the next item, ArrowUp SHALL move to the previous item, Enter SHALL select the focused item, and Escape SHALL close the dropdown without selecting

#### Scenario: Clearing the selection
- **WHEN** an entity is selected
- **THEN** a clear button (X icon) SHALL appear inside the input
- **WHEN** user clicks the clear button
- **THEN** the selection SHALL be cleared, the input SHALL return to its placeholder state, and `onChange` SHALL be called with `null`

#### Scenario: Click outside closes dropdown
- **WHEN** the dropdown is open and user clicks anywhere outside the component
- **THEN** the dropdown SHALL close without changing the selection

#### Scenario: Dropdown opens on focus
- **WHEN** user clicks or tabs into the search input
- **AND** the input is not empty or user starts typing
- **THEN** the dropdown SHALL open with filtered results