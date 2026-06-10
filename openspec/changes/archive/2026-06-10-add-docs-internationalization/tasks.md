## 1. Docs I18n Configuration

- [x] 1.1 Update `apps/docs/docusaurus.config.ts` to support `es`, `en`, and `pt`, keeping Spanish as the default locale.
- [x] 1.2 Configure locale labels and user-visible site metadata so Docusaurus can render Spanish, English, and Portuguese navigation chrome.
- [x] 1.3 Add the Docusaurus locale dropdown to the docs navbar without removing existing project links.
- [x] 1.4 Update the existing Lunr search plugin configuration to cover Spanish, English, and Portuguese content.

## 2. Translation Resource Structure

- [x] 2.1 Create English and Portuguese Docusaurus i18n directories following the native `i18n/<locale>/docusaurus-plugin-content-docs/current` structure.
- [x] 2.2 Add or generate English and Portuguese Docusaurus translation JSON files for theme, navbar, footer, and generated UI labels that are visible to users.
- [x] 2.3 Verify localized resource paths match Docusaurus 3 conventions and do not duplicate Spanish source content outside the default docs tree.

## 3. Documentation Content Translation

- [x] 3.1 Translate every Markdown documentation page under `apps/docs/docs` into English, preserving commands, paths, package names, API identifiers, environment variables, product names, and code blocks.
- [x] 3.2 Translate every Markdown documentation page under `apps/docs/docs` into Portuguese, preserving commands, paths, package names, API identifiers, environment variables, product names, and code blocks.
- [x] 3.3 Translate `_category_.json` metadata for English and Portuguese so sidebar category labels are localized.
- [x] 3.4 Check that the English and Portuguese docs trees mirror the Spanish docs tree for every page and category metadata file.

## 4. Verification

- [x] 4.1 Run `pnpm docs:typecheck` and fix any type or Docusaurus config issues.
- [x] 4.2 Run `pnpm docs:build` and fix any i18n, routing, search, or content build issues.
- [x] 4.3 Review the built docs behavior for default Spanish routing and locale-prefixed English and Portuguese routing.
- [x] 4.4 Confirm the implementation scope is limited to the Docusaurus docs app and OpenSpec artifacts unless a directly necessary supporting configuration change is identified.
