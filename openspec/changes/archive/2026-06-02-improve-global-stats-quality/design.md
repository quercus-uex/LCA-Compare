## Context

The global statistics feature spans a Nest backend endpoint and a React dashboard. The backend currently performs query parsing, raw SQL, impact JSON normalization, grouping, ranking, KPI calculation, and time-series calculation inside one service. The frontend is split into visualization components, but repeats ranking-list rendering, impact number formatting, and heatmap helper logic.

The goal is to improve quality and safety while preserving the current API response shape and dashboard functionality. This is primarily a refactor plus a small set of user-visible correctness improvements.

## Goals / Non-Goals

**Goals:**

- Validate `GET /stats/global` query parameters before they reach aggregation logic.
- Replace unsafe raw SQL usage with safe parameterized SQL or Prisma APIs.
- Split backend stats aggregation into small pure functions that are easy to test.
- Normalize EF category extraction through a lookup-based path rather than repeated nested searches.
- Preserve existing `GlobalStatsDto` fields and valid request behavior.
- Avoid misleading duplicate best/worst ranking lists when there are too few items.
- Make `/estadisticas` choose a useful initial year state instead of assuming the current calendar year has data.
- Reduce frontend duplication by extracting route subcomponents, shared ranking-list rendering, and formatting/heatmap helpers.

**Non-Goals:**

- No database schema migration or impact JSON normalization into new tables.
- No replacement of Recharts, DaisyUI, Tailwind, or the current visual language.
- No generated API client or OpenAPI type generation in this change.
- No TanStack Query adoption in this change.
- No behavior changes to authentication; the stats page and endpoint remain public.

## Decisions

### Use safe query construction for available years

`getAniosDisponibles` will stop using `$queryRawUnsafe`. Prefer Prisma `findMany({ select: { fechaInicioCampania: true }, distinct/order if practical })` with in-memory year extraction for simplicity, or `$queryRaw` with parameter binding if SQL is clearer.

Alternatives considered:

- Keep `$queryRawUnsafe` with escaping: rejected because it preserves unnecessary SQL injection risk and future-maintenance risk.
- Add a materialized view: rejected as too large for this quality-focused change.

### Validate at the controller boundary

The controller will validate `anio`, `categoria`, and non-empty string filters before calling `StatsService`. Invalid `anio` and invalid `categoria` will return HTTP 400 with useful messages. Valid existing requests remain accepted.

Alternatives considered:

- Validate inside `StatsService`: rejected because controller-level validation keeps service inputs typed and reduces defensive code.
- Add DTO class plus global validation pipe changes: acceptable if local controller parsing remains minimal; avoid broad app-level changes unless already configured.

### Extract pure backend helpers, not a large new architecture

The backend should introduce small helpers under `src/stats/` for repeated logic:

- Build campaign-year date filters.
- Extract unique impact IDs from cultivations.
- Build a normalized EF category name lookup.
- Convert `ResultadoImpacto.datos.impacto_total` into `Record<EfCategoryId, number>`.
- Sum/mean category records and calculate total impact.
- Sort impact-ranked entities by selected category or total impact.

`StatsService` remains the orchestrator and owns Prisma access. This keeps the refactor limited while reducing cognitive load.

Alternatives considered:

- Introduce repository, domain service, and mapper classes: rejected as too much structure for the current module size.
- Leave helpers private in `StatsService`: rejected because testing pure aggregation logic would remain unnecessarily coupled to Prisma mocks.

### Keep ranking slicing reusable and non-misleading

Frontend ranking components will use a shared helper/component to derive best and worst lists with real ranking positions. When the ranked collection is small enough that best and worst would be identical, the UI must not present the duplicated list as two distinct top/bottom rankings.

Acceptable presentations include a single ranked list, a hidden worst list with explanatory empty text, or a non-overlapping worst list. The implementation should choose the smallest change that keeps the user from seeing duplicated entries as separate insights.

Alternatives considered:

- Preserve duplicate best/worst lists for backward compatibility: rejected because it is actively misleading.

### Choose a data-aware initial year state

The dashboard should not assume the current calendar year has data. The simplest acceptable behavior is to request all years initially, then allow the user to select a specific year. If implementation can do so without extra request churn, selecting the latest available year after initial load is also acceptable.

The preferred path is initial all-years because it preserves the global-dashboard purpose and avoids a second automatic fetch.

Alternatives considered:

- Keep current year default: rejected because it commonly produces false empty states when historical data exists.

### Refactor frontend by extracting existing patterns only

Extract route subcomponents and utility helpers only where duplication already exists:

- `StatsFilters` for category/crop/year controls.
- `StatsLoadingSkeleton`, `StatsEmptyState`, and `StatsDashboardContent` or equivalent route-level components.
- Shared impact/number formatting helpers.
- Shared ranking list/panel rendering for province and population rankings.
- Shared heatmap color/format helpers.

Avoid new styling abstractions that do not remove real duplication.

## Risks / Trade-offs

- Query validation may reject malformed requests that previously returned arbitrary results -> Mitigation: only reject clearly invalid values and preserve valid query behavior.
- Refactoring aggregation could accidentally change numeric output -> Mitigation: add/adjust tests around category aggregation, rankings, zero data, category filters, and interannual variation.
- Switching available-year calculation away from SQL could be less efficient on large datasets -> Mitigation: use parameterized SQL if Prisma cannot express the query efficiently enough.
- Non-overlapping ranking behavior changes UI expectations for small datasets -> Mitigation: make the empty/small-data state explicit and test both small and large rankings.
- Extracting components can over-abstract the page -> Mitigation: extract only cohesive units already visible in the route.
