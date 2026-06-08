## Why

The web application currently hardcodes Spanish UI copy across routes and components, which prevents users from working in their preferred language. Adding internationalization now creates a maintainable foundation for Spanish, English, and Portuguese before the UI surface grows further.

## What Changes

- Add `react-i18next` support to the web app with a centralized, maintainable translation structure.
- Provide Spanish, English, and Portuguese resources for user-facing web UI copy.
- Initialize i18n during web app startup and expose translations through React hooks/components.
- Add a language selector so users can switch between supported languages.
- Persist the selected language locally and fall back safely to Spanish when no supported preference exists.

## Capabilities

### New Capabilities
- `web-internationalization`: Covers multilingual web UI behavior, supported locales, language switching, translation resource organization, persistence, and fallback behavior.

### Modified Capabilities

## Impact

- Affected code: `apps/web/src/main.tsx`, shared web components, route components, and any UI modules containing user-facing strings.
- Dependencies: add `i18next` and `react-i18next` to the web package.
- Systems: frontend only; no backend API contract changes are required.
