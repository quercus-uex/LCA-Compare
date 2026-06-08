## Context

The web app is a React 19 and Vite application with routes, shared components, hooks, and charts under `apps/web/src`. User-facing copy is currently embedded directly in TSX components and helper modules, mostly in Spanish. The app has no i18n initialization, translation resources, language selector, or persistence for language preferences.

The change is frontend-only. It must preserve the current Spanish experience as the default while adding English and Portuguese translations in a structure that remains easy to extend as more routes and components are added.

## Goals / Non-Goals

**Goals:**
- Add `i18next` and `react-i18next` to the web app.
- Initialize i18n once during web startup before rendering translated components.
- Organize translations under a dedicated `apps/web/src/i18n` area with one resource file per supported language.
- Support Spanish (`es`), English (`en`), and Portuguese (`pt`).
- Provide a visible language selector and persist the selected language locally.
- Replace hardcoded user-facing UI strings in the web app with translation keys.

**Non-Goals:**
- Translating backend-generated data, database reference values, or API payload fields.
- Adding route-level locale prefixes such as `/es/compare`.
- Adding server-side rendering, remote translation loading, or automated machine translation.
- Changing application navigation, authorization behavior, or API contracts.

## Decisions

1. Use `react-i18next` with local static resources.

   Rationale: The app is client-rendered and already bundles frontend assets through Vite. Local resources avoid backend changes and make missing translation issues discoverable during builds and reviews.

   Alternative considered: Fetch translations from the backend or public JSON files. This would add deployment and caching complexity without a current need.

2. Store i18n setup in `apps/web/src/i18n`.

   Rationale: A dedicated directory keeps initialization, supported locale metadata, and language resources together. A maintainable structure is:
   - `apps/web/src/i18n/index.ts` for initialization and exports.
   - `apps/web/src/i18n/locales/es.ts`
   - `apps/web/src/i18n/locales/en.ts`
   - `apps/web/src/i18n/locales/pt.ts`
   - optional `apps/web/src/i18n/types.ts` for shared language metadata if needed.

   Alternative considered: Keeping translations beside each component. That improves local proximity but makes language switching and resource completeness harder to audit in this small app.

3. Keep Spanish as fallback and initial default.

   Rationale: Existing copy is Spanish and current users expect that language. Unsupported or missing preferences should resolve to Spanish.

   Alternative considered: Browser-language auto-detection as the primary behavior. This can be added later, but persisting explicit user choice with a stable Spanish fallback is simpler and predictable.

4. Add a reusable language selector component to the navbar area.

   Rationale: The navbar is shared across primary routes and already contains navigation actions. A small selector there makes language switching globally accessible without altering route structure.

   Alternative considered: A settings page. That would hide a fundamental global preference and requires extra navigation work.

5. Use descriptive dot-separated translation keys grouped by UI domain.

   Rationale: Names such as `nav.compare`, `auth.login.title`, and `stats.filters.crop` are stable across languages and easier to maintain than using source text as keys.

   Alternative considered: Using Spanish strings as keys. That reduces initial mapping work but makes refactors and non-Spanish source maintenance harder.

## Risks / Trade-offs

- Incomplete string migration could leave mixed-language screens → Review all TSX/helper files with visible labels, placeholders, toast messages, button text, chart labels, and empty states before completion.
- Translation keys can drift between locale files → Define Spanish as the canonical resource shape and keep English and Portuguese files aligned during implementation.
- Dynamic values may be translated incorrectly if interpolated manually → Use i18next interpolation for counts, names, and formatted values where copy surrounds runtime data.
- Some chart labels or table headers may come from domain/API values → Translate static labels only; avoid mutating API identifiers unless they are purely display copy.
- Adding a dependency changes lockfile contents → Run `pnpm install` and verify the web build/lint after implementation.

## Migration Plan

1. Install `i18next` and `react-i18next` in the web workspace.
2. Add the `src/i18n` module and import it from `main.tsx` before rendering `App`.
3. Add a language selector component and place it in the shared navbar.
4. Replace hardcoded user-facing strings with `useTranslation` calls and translation keys.
5. Run lint/build checks for the web app.

Rollback is straightforward: remove the i18n import/component usage and dependencies, then restore literals from the Spanish resource file if needed.

## Open Questions

- None. The initial implementation will support Spanish, English, and Portuguese with Spanish as the default fallback.
