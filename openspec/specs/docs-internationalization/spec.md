## ADDED Requirements

### Requirement: Supported docs locales
The Docusaurus documentation SHALL support Spanish, English, and Portuguese locales, with Spanish as the default locale.

#### Scenario: Spanish docs remain default
- **WHEN** a user visits the documentation root without a locale prefix
- **THEN** the documentation SHALL render the Spanish locale

#### Scenario: English docs are available
- **WHEN** a user selects or visits the English locale
- **THEN** the documentation SHALL render English documentation content and localized Docusaurus UI labels

#### Scenario: Portuguese docs are available
- **WHEN** a user selects or visits the Portuguese locale
- **THEN** the documentation SHALL render Portuguese documentation content and localized Docusaurus UI labels

### Requirement: Complete localized docs content
The Docusaurus documentation SHALL provide English and Portuguese translations for every existing Spanish documentation page and category metadata file.

#### Scenario: Spanish docs page has translations
- **WHEN** a documentation page exists under `apps/docs/docs`
- **THEN** matching translated pages SHALL exist under the English and Portuguese Docusaurus i18n docs directories

#### Scenario: Spanish category metadata has translations
- **WHEN** a `_category_.json` metadata file exists under `apps/docs/docs`
- **THEN** matching localized category metadata SHALL exist for English and Portuguese

#### Scenario: Technical references are translated safely
- **WHEN** documentation content includes commands, paths, package names, API identifiers, environment variables, product names, or code blocks
- **THEN** the translated content SHALL preserve those technical references unless the reference itself is natural-language copy intended for users

### Requirement: Localized docs navigation and site chrome
The Docusaurus documentation SHALL localize user-visible navigation, metadata, and generated UI labels for Spanish, English, and Portuguese.

#### Scenario: User views navbar and footer in a supported locale
- **WHEN** a user views the documentation in Spanish, English, or Portuguese
- **THEN** navbar labels, footer text, locale selector labels, and site title metadata SHALL be shown in the active locale where Docusaurus exposes them for translation

#### Scenario: User switches docs language
- **WHEN** a user uses the Docusaurus locale selection control
- **THEN** the user SHALL be able to navigate between Spanish, English, and Portuguese documentation locales

### Requirement: Multilingual docs search
The Docusaurus documentation SHALL keep search functional for Spanish, English, and Portuguese documentation content.

#### Scenario: Search indexes supported languages
- **WHEN** the docs site is built
- **THEN** the generated search index SHALL include content from the supported Spanish, English, and Portuguese documentation locales

#### Scenario: User searches in active locale
- **WHEN** a user searches documentation content in Spanish, English, or Portuguese
- **THEN** search results SHALL be available for the active locale's documentation content

### Requirement: Docs i18n verification
The change SHALL be verified through the docs app's existing typecheck and build workflows when dependencies are available.

#### Scenario: Docs typecheck runs
- **WHEN** verification is performed after implementing docs internationalization
- **THEN** `pnpm docs:typecheck` SHALL pass or any inability to run it SHALL be reported with the reason

#### Scenario: Docs build runs
- **WHEN** verification is performed after implementing docs internationalization
- **THEN** `pnpm docs:build` SHALL pass or any inability to run it SHALL be reported with the reason

#### Scenario: Implementation scope is reviewed
- **WHEN** the implementation is reviewed
- **THEN** changes SHALL be limited to the Docusaurus docs app and OpenSpec artifacts unless a directly necessary supporting configuration change is identified
