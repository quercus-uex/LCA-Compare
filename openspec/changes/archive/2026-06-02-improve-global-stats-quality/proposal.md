## Why

The global statistics dashboard and its backend currently work, but they concentrate security-sensitive query handling, impact aggregation, ranking logic, and UI layout concerns in ways that make future changes risky. This change improves safety, maintainability, and user-facing correctness without changing the dashboard's core purpose.

## What Changes

- Harden `GET /stats/global` query handling by validating input parameters and replacing unsafe raw SQL usage with safe Prisma or parameterized SQL.
- Refactor backend statistics aggregation into clearer pure helpers for year filters, impact ID extraction, EF category normalization, category summaries, geographic rankings, and impact sorting.
- Preserve existing response shape while making impact category aggregation easier to test and extend.
- Improve ranking display behavior so best/worst lists do not misleadingly duplicate the same entries when there are too few results.
- Improve dashboard initial year behavior so users do not see an empty current-year dashboard when historical data exists.
- Split the statistics route into smaller presentation/state components for loading, empty, filters, and content layout.
- Reuse ranking-list UI logic across province and population rankings.
- Move heatmap formatting/color helpers out of the component and fix React rendering quality issues.
- Keep the implementation intentionally minimal: no broad dashboard redesign, no charting library replacement, and no database model migration.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `global-stats-api`: add stricter query validation and safe query execution requirements while preserving the public endpoint contract.
- `ef-category-aggregation`: clarify that EF category extraction should use normalized lookup logic and reusable summary helpers.
- `statistics-dashboard`: improve initial year selection, route composition, reusable ranking lists, and non-overlapping best/worst display behavior.
- `population-ranking-search-filter`: change fewer-than-10 province-filter behavior to avoid presenting identical best/worst lists as two distinct rankings.
- `stats-heatmap`: require maintainable heatmap rendering helpers and stable React list rendering.

## Impact

- Backend stats module: `src/stats/stats.controller.ts`, `src/stats/stats.service.ts`, `src/stats/stats.service.spec.ts`, and likely new stats helper files under `src/stats/`.
- Frontend stats route and components: `web/src/routes/stats/stats.route.tsx`, ranking components, heatmap component, and likely small shared stats UI/format helper files under `web/src/stats/`.
- API behavior: invalid query parameters will return HTTP 400 instead of being coerced implicitly; valid existing requests remain backward compatible.
- Dependencies: no required new runtime dependency for this change. Optional helper libraries should be avoided unless implementation proves they reduce more code than they add.
