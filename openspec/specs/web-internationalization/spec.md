## Requirements
### Requirement: Supported web languages
The web application SHALL support Spanish, English, and Portuguese translations for user-facing UI copy.

#### Scenario: Spanish UI is available
- **WHEN** the selected language is Spanish
- **THEN** navigation labels, route titles, form labels, buttons, placeholders, empty states, notifications, and other static UI copy SHALL render in Spanish

#### Scenario: English UI is available
- **WHEN** the selected language is English
- **THEN** navigation labels, route titles, form labels, buttons, placeholders, empty states, notifications, and other static UI copy SHALL render in English

#### Scenario: Portuguese UI is available
- **WHEN** the selected language is Portuguese
- **THEN** navigation labels, route titles, form labels, buttons, placeholders, empty states, notifications, and other static UI copy SHALL render in Portuguese

### Requirement: Language selection
The web application SHALL provide a globally accessible control for switching between Spanish, English, and Portuguese.

#### Scenario: User changes language
- **WHEN** a user selects a supported language from the language control
- **THEN** the visible UI copy SHALL update to the selected language without requiring a page reload

#### Scenario: Selected language persists
- **WHEN** a user selects a supported language
- **AND** the user later reloads or reopens the web application in the same browser
- **THEN** the application SHALL initialize using the previously selected language

### Requirement: Default and fallback language
The web application SHALL use Spanish as the default and fallback language.

#### Scenario: No saved language exists
- **WHEN** the application starts and no supported language preference has been saved
- **THEN** the UI SHALL render in Spanish

#### Scenario: Unsupported saved language exists
- **WHEN** the application starts and the saved language preference is unsupported
- **THEN** the UI SHALL render in Spanish

#### Scenario: Translation key is missing
- **WHEN** a translation key is missing for the selected language
- **THEN** the application SHALL fall back to the Spanish translation for that key

### Requirement: Maintainable translation resources
The web application SHALL keep translation resources in a dedicated frontend i18n structure with aligned resource files for each supported language.

#### Scenario: Adding or reviewing translations
- **WHEN** a developer adds or reviews translatable UI copy
- **THEN** Spanish, English, and Portuguese translations SHALL be discoverable under the web app i18n resource directory
- **AND** translation keys SHALL be grouped by UI domain using stable descriptive names

### Requirement: Runtime interpolation
The web application SHALL translate UI messages containing runtime values through the i18n interpolation mechanism.

#### Scenario: Dynamic UI message is translated
- **WHEN** UI copy includes runtime values such as names, counts, identifiers, or selected filters
- **THEN** the translated message SHALL include those values in the selected language without hardcoding language-specific string concatenation in components
