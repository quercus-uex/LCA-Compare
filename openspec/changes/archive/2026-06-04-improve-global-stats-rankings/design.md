## Context

The statistics dashboard at `/estadisticas` renders province and population rankings through shared ranking panel components. Rankings already receive `selectedCategory`, derive the displayed value from `impactosPorCategoria`, and show the selected category name in the card title. EF category metadata already includes display units, so unit labels can be sourced from existing constants instead of adding backend fields.

The comparator route at `/compare` currently supports navigation state for preselecting a parcel as the target (`parcelaObjetivo`). It does not yet support province or population preselection, and its reference card currently starts with empty filters.

## Goals / Non-Goals

**Goals:**
- Show the correct EF category unit next to each displayed ranking impact value when a category is selected.
- Make province and population ranking entries behave as navigable controls to `/compare`.
- Preselect the clicked province or population in the comparator's reference filter card.
- Reuse existing frontend data and EF category metadata without changing the stats API.

**Non-Goals:**
- Do not change ranking calculations, sorting, best/worst splitting, search behavior, or province filtering semantics.
- Do not add backend endpoints or alter `GlobalStatsDto` unless implementation reveals an unavoidable missing field.
- Do not automatically run the comparison after navigating; the user still applies filters explicitly using the comparator controls.
- Do not introduce URL persistence for all comparator filters as part of this change.

## Decisions

- Use existing EF category metadata for units.
  - Rationale: `EF_CATEGORIES` already centralizes each category's display label and unit, and the dashboard already depends on it for category labels.
  - Alternative considered: add a unit field to each ranking item from the API. Rejected because units are category metadata, not per-row data, and the frontend already has the source of truth.

- Keep total-impact rankings without a forced unit unless a category is selected.
  - Rationale: the user request specifically targets selected categories and category-specific measures. The default total aggregates multiple EF categories with different units, so appending a single unit would be misleading.
  - Alternative considered: show a generic label such as `total`. Rejected because it would not be a measurement unit and could reduce clarity.

- Add an optional unit prop to the shared ranking list component and render it adjacent to formatted impact values.
  - Rationale: both province and population ranking cards share the same rendering path, so one small component extension covers both without duplicating markup.
  - Alternative considered: append units in each caller's `getValue` or formatter. Rejected because values should remain numeric and formatting concerns belong in the shared ranking UI.

- Add optional row action support to the shared ranking list component.
  - Rationale: province and population rankings need the same clickable-row affordance while preserving the existing ranking layout.
  - Alternative considered: wrap only the text label in a link in each specialized ranking component. Rejected because it creates inconsistent hit targets and duplicates behavior across best/worst/search result render paths.

- Pass comparator preselection through React Router navigation state.
  - Rationale: the comparator already uses route state for parcel-based preselection, and ranking clicks are in-app transitions where state is sufficient and avoids creating a new query-string contract.
  - Alternative considered: introduce query params such as `/compare?refProvincia=<id>`. Rejected for this proposal because the comparator currently expects full selected objects for badges and filter chips, so query params would require additional hydration and error handling.

- Extend comparator route state to support `provinciaReferencia` and `poblacionReferencia`.
  - Rationale: clicked ranking items include enough id/name data to construct the minimal objects required by `CompareFilterType` for reference filters.
  - Alternative considered: fetch full province/population records before navigation. Rejected unless implementation reveals missing required fields, because the comparator compare payload primarily needs selected ids and display badges need names.

## Risks / Trade-offs

- Clicked ranking DTOs may not include every nested field expected by filter badges or comparator export metadata -> construct only fields required by existing UI where possible and add defensive rendering if nested optional fields are absent.
- Router state is not preserved on reload of `/compare` -> acceptable because this is a direct in-app shortcut, not a permalink feature.
- Making list rows clickable can reduce accessibility if implemented as plain `li` handlers -> use button/link semantics or keyboard-accessible handlers with clear focus styles.
- Category unit rendering may wrap poorly on narrow screens -> keep the unit as a small adjacent text element and preserve truncation for labels.
