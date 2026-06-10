## Why

The Docusaurus documentation is currently configured and authored only for Spanish, which limits access for English- and Portuguese-speaking users of Capture ACV and ACV Compare. Adding first-class internationalization now aligns the documentation with the multilingual direction already established for the web application and makes deployment, usage, and development guidance available to the project's broader audience.

## What Changes

- Configure the docs site to support Spanish, English, and Portuguese locales, with Spanish remaining the default locale.
- Add English and Portuguese translated documentation content for the existing docs structure.
- Add localized Docusaurus UI/theme translations where needed so navigation, metadata, labels, and generated UI are available in each supported locale.
- Update docs search configuration so search remains functional for Spanish, English, and Portuguese content.
- Keep the existing documentation routes and Spanish content as the canonical default experience.

## Capabilities

### New Capabilities
- `docs-internationalization`: Docusaurus documentation is available in Spanish, English, and Portuguese with localized content, UI labels, navigation metadata, and search support.

### Modified Capabilities

## Impact

- Affects `apps/docs/docusaurus.config.ts`, Docusaurus i18n directories, translated docs content, localized category metadata, and docs app scripts or generated translation resources if needed.
- Affects docs build and typecheck verification for the Docusaurus app.
- No backend APIs, frontend runtime application behavior, Prisma schema, Docker service behavior, or shared package contracts are expected to change.
