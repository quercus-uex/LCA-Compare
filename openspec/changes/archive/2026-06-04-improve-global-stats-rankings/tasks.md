## 1. Ranking Unit Display

- [x] 1.1 Derive the selected category unit in province and population ranking components from `EF_CATEGORIES` when `selectedCategory` is set.
- [x] 1.2 Extend the shared ranking panels/list rendering to accept an optional impact unit and display it next to formatted ranking values without changing numeric sorting inputs.
- [x] 1.3 Update population search result rendering to display the selected category unit next to each result value.
- [x] 1.4 Verify default total-impact ranking values do not show a category-specific unit when no category is selected.

## 2. Ranking Navigation

- [x] 2.1 Add optional row activation support to the shared ranking list component using keyboard-accessible controls and visible focus styles.
- [x] 2.2 Wire province ranking entries to navigate to `/compare` with the clicked province in route state for reference preselection.
- [x] 2.3 Wire population ranking entries and population search results to navigate to `/compare` with the clicked population in route state for reference preselection.
- [x] 2.4 Preserve existing ranking layout, colors, best/worst position numbers, search behavior, and province filter behavior while adding clickability.

## 3. Comparator Reference Preselection

- [x] 3.1 Extend comparator route navigation state handling to accept `provinciaReferencia` and `poblacionReferencia` in addition to the existing parcel target state.
- [x] 3.2 Initialize the comparator `Referencia` filter card with the province or population received from ranking navigation.
- [x] 3.3 Keep the comparator `Objetivo` card disabled and empty for ranking-origin navigation unless existing target state is provided.
- [x] 3.4 Ensure selected reference badges render safely for ranking-origin province/population objects.

## 4. Verification

- [x] 4.1 Run `pnpm web:lint` and fix any frontend lint/type issues introduced by the change.
- [x] 4.2 Run `pnpm web:build` to verify strict TypeScript and Vite production build behavior.
- [x] 4.3 Manually verify `/estadisticas` category selection shows units in province rankings, population rankings, and population search results.
- [x] 4.4 Manually verify clicking province and population ranking entries opens `/compare` with the selected location prefilled in `Referencia`.
