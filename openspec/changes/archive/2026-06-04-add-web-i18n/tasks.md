## 1. Dependencies and i18n Foundation

- [x] 1.1 Add `i18next` and `react-i18next` to `apps/web` dependencies and update the lockfile.
- [x] 1.2 Create `apps/web/src/i18n/index.ts` to initialize i18next with `react-i18next`, Spanish fallback, supported language validation, local persistence, and static resources.
- [x] 1.3 Create aligned locale resource files for Spanish, English, and Portuguese under `apps/web/src/i18n/locales/`.
- [x] 1.4 Import the i18n initialization module from `apps/web/src/main.tsx` before rendering `App`.

## 2. Language Selection

- [x] 2.1 Add a reusable language selector component that lists Spanish, English, and Portuguese using shared supported-language metadata.
- [x] 2.2 Wire the selector to `i18n.changeLanguage` so switching languages updates visible UI copy without a page reload.
- [x] 2.3 Place the selector in the shared navbar area so it is available across primary web routes.
- [x] 2.4 Verify selected language persistence across reloads in the same browser.

## 3. Translate Shared UI

- [x] 3.1 Replace navbar and authenticated-user menu literals with translation keys.
- [x] 3.2 Replace login route labels, buttons, placeholders, validation/error messages, and notifications with translation keys.
- [x] 3.3 Replace shared component labels, table headers, buttons, image alt text, empty states, and copy/clipboard feedback with translation keys.
- [x] 3.4 Replace common reusable filter component labels, loading messages, clear actions, and placeholders with translation keys.

## 4. Translate Feature Routes

- [x] 4.1 Replace compare route and compare result card UI copy with translation keys, using interpolation for dynamic values.
- [x] 4.2 Replace parcelas route, parcela detail, cultivo card, and map preview UI copy with translation keys, using interpolation for dynamic values.
- [x] 4.3 Replace resultados route, result table, comparison modal, and result comparison table UI copy with translation keys.
- [x] 4.4 Replace admin route, ID lookup field, and pagination UI copy with translation keys.
- [x] 4.5 Replace statistics route, charts, selectors, ranking lists, and formatter-facing labels with translation keys.

## 5. Verification

- [x] 5.1 Review `apps/web/src` for remaining hardcoded user-facing Spanish, English, or Portuguese UI strings that should be translated.
- [x] 5.2 Confirm every translation key used by components exists in Spanish, English, and Portuguese resources.
- [x] 5.3 Run `pnpm web:lint` and fix reported issues.
- [x] 5.4 Run `pnpm web:build` and fix build/type errors.
- [x] 5.5 Manually smoke-test language switching on representative routes: navbar, login, compare, parcelas, resultados, admin, and statistics.
