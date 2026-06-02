## 1. Backend Safety

- [x] 1.1 Add controller-level parsing/validation for `anio`, `categoria`, `tipoCultivo`, and `idProvinciaPoblacion` in `StatsController`.
- [x] 1.2 Return HTTP 400 for non-integer or out-of-range `anio` values with a clear error message.
- [x] 1.3 Preserve existing HTTP 400 behavior for invalid `categoria` values and keep the valid category list in the response.
- [x] 1.4 Normalize empty optional string query parameters to `undefined` before calling `StatsService`.
- [x] 1.5 Replace `getAniosDisponibles` `$queryRawUnsafe` usage with Prisma APIs or parameterized `$queryRaw`.
- [x] 1.6 Add backend tests for invalid year, empty optional filters, invalid category, and quote-containing `tipoCultivo` values.

## 2. Backend Aggregation Refactor

- [x] 2.1 Extract a pure helper for campaign year range filters used by current and previous-year calculations.
- [x] 2.2 Extract a pure helper for unique non-null impact result ID collection from cultivations.
- [x] 2.3 Extract EF category normalization helpers that map normalized English impact names to `EfCategoryId` values.
- [x] 2.4 Refactor impact JSON extraction to use the normalized category lookup while preserving zero-fill behavior for missing categories.
- [x] 2.5 Extract category sum, mean, and total-impact helper functions.
- [x] 2.6 Extract shared impact sorting logic for province and population rankings.
- [x] 2.7 Refactor `StatsService` to orchestrate Prisma calls and delegate aggregation logic to the extracted helpers.
- [x] 2.8 Add focused unit tests for category normalization, missing categories, zero records, category means, total impact, and shared ranking sorting.
- [x] 2.9 Run backend tests for the stats module and confirm valid existing stats responses keep the same DTO shape.

## 3. Frontend Dashboard State And Layout

- [x] 3.1 Change the initial statistics dashboard year state so the first request does not force `anio=<currentYear>`.
- [x] 3.2 Ensure the year selector shows the unfiltered `Todos` state initially, or a latest-available-year state if implemented without extra misleading empty render.
- [x] 3.3 Extract route-level loading, empty, error, filters, and dashboard content render paths into small components or equivalent isolated functions.
- [x] 3.4 Preserve existing dashboard layout, responsive behavior, labels, and public accessibility while reducing `StatsRoute` responsibility.
- [x] 3.5 Verify changing year, category, crop type, and province filters still produces the expected stats API query parameters.

## 4. Frontend Ranking Reuse And Correctness

- [x] 4.1 Create shared ranking-list helpers/components for deriving best and worst entries with real ranking positions.
- [x] 4.2 Refactor province ranking to use the shared ranking rendering path.
- [x] 4.3 Refactor population ranking to use the shared ranking rendering path while preserving search and province filter behavior.
- [x] 4.4 Implement non-duplicating small-result behavior so identical best/worst lists are not displayed as separate insights.
- [x] 4.5 Preserve selected-category value selection and labels for both province and population rankings.
- [x] 4.6 Verify rankings with fewer than, equal to, and greater than 20 entries display clear best/worst behavior.

## 5. Frontend Formatting And Heatmap Maintainability

- [x] 5.1 Extract shared number and impact value formatters used by stats cards, rankings, heatmap, spider chart, donut, timeline, and scatter chart where practical.
- [x] 5.2 Replace duplicated inline impact formatting functions in stats components with the shared formatters.
- [x] 5.3 Move heatmap cell color and cell value formatting helpers out of the heatmap component render body.
- [x] 5.4 Fix heatmap row rendering so repeated row/cell groups have stable React keys based on province identifiers.
- [x] 5.5 Preserve heatmap sorting, tooltip content, empty state, and responsive behavior.

## 6. Verification

- [x] 6.1 Run `npm test -- stats.service` from the repo root.
- [x] 6.2 Run `npm run lint` from the repo root if backend files changed.
- [x] 6.3 Run `npm run build` from the repo root to verify backend compilation.
- [x] 6.4 Run `npm run lint` from `web/` if frontend files changed.
- [x] 6.5 Run `npm run build` from `web/` to verify frontend compilation.
- [x] 6.6 Manually inspect `/estadisticas` behavior for initial load, empty data, valid filters, invalid API query handling, small ranking datasets if available, and heatmap rendering.
