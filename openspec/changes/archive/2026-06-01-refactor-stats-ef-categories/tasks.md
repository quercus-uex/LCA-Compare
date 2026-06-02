## 1. Backend — EF categories constant and shared types

- [x] 1.1 Define `EF_CATEGORIES` constant array with 8 categories (id, englishName, spanishName, unit, color) in `src/compare/compare.types.ts`
- [x] 1.2 Export `EfCategoryId` union type from the constant

## 2. Backend — Rewrite StatsService aggregation

- [x] 2.1 Refactor `computeKPIs` to return 8 per-category mean values in `impactosPorCategoria` map instead of single `impactoTotalMedio`
- [x] 2.2 Refactor `computeRankingProvincias` to compute per-category means per province and accept optional `categoria` filter
- [x] 2.3 Refactor `computeRankingPoblaciones` to compute per-category means per population and accept optional `categoria` filter
- [x] 2.4 Refactor `computeEvolucionTemporal` to aggregate by EF category (not process key), returning `categorias` map and `totalImpacto` per year
- [x] 2.5 Optimize `computeEvolucionTemporal` to load only `impacto_total` key from `datos` JSON (not full JSON)

## 3. Backend — Update DTOs and controller

- [x] 3.1 Rewrite `KpiDto` with `impactosPorCategoria: Record<EfCategoryId, number>` and keep operational fields (totalParcelas, etc.)
- [x] 3.2 Rewrite `EvolucionTemporalItemDto` with `categorias: Record<EfCategoryId, number>` and `totalImpacto` (remove process-key fields)
- [x] 3.3 Add `impactosPorCategoria: Record<EfCategoryId, number>` to `ProvinciaRankingItemDto` and `PoblacionRankingItemDto`
- [x] 3.4 Add optional `categoria` query param to `StatsController.getGlobalStats` with validation (must be valid `EfCategoryId` or absent)
- [x] 3.5 Return HTTP 400 for invalid `categoria` values with list of valid categories

## 4. Frontend — Types, hook, and category constant

- [x] 4.1 Define `EF_CATEGORIES` constant in `web/src/common/constants.ts` (Spanish names, units, colors matching backend)
- [x] 4.2 Update all TypeScript types in `stats.hook.tsx` to match new backend DTOs (`impactosPorCategoria`, `categorias`, removed process-key fields)
- [x] 4.3 Update `useStats` hook to pass `categoria` query param
- [x] 5.1 Rewrite `StatsKPICards` to render 8 category cards with semantic colors, Spanish names, and units
- [x] 5.2 Each category KPI card SHALL display tooltip on hover with unit description
- [x] 5.3 Render compact operational stats row (total parcels, cultivations, surface) below category cards
- [x] 5.4 Show interannual variation on the climate change KPI card only
- [x] 5.5 Responsive grid: 4 cols on desktop (xl), 2 cols on tablet, 1 col on mobile
- [x] 6.1 Rewrite `StatsTimeline` to use Recharts `AreaChart` with stacked areas (one per EF category) using semantic colors
- [x] 6.2 Add interactive tooltip showing per-category breakdown for hovered year
- [x] 6.3 Render 4x2 grid of sparkline mini-charts below the stacked area (one per category)
- [x] 6.4 Each sparkline SHALL highlight its category name and show the latest value
- [x] 7.1 Update `StatsProvinciaRanking` to accept `impactosPorCategoria` and `selectedCategory`
- [x] 7.2 Update table columns to show the selected category's impact value instead of the old blob number
- [x] 7.3 Preserve sortable columns, green/red row highlighting behavior
- [x] 8.1 Create `StatsCategorySelector` component: dropdown with 8 EF categories + \"Todas las categorías\" default option
- [x] 8.2 Placed in the header next to the year selector
- [x] 8.3 On change, updates a shared `selectedCategory` state that flows down to province table, population ranking, spider chart, and heatmap
- [x] 8.4 Updates URL query param `?categoria=` for shareable links
- [x] 9.1 Create `StatsSpiderChart` component using Recharts `RadarChart` with 8 axes (one per EF category)
- [x] 9.2 Include province selector dropdown defaulting to highest-impact province
- [x] 9.3 Support \"Add province\" to overlay a second province on the radar
- [x] 9.4 Use EF category semantic colors for axes and data lines
- [x] 10.1 Create `StatsHeatmap` component rendering top 15 provinces × 8 EF categories
- [x] 10.2 Implement color scale from light gray to category semantic color based on value intensity
- [x] 10.3 Tooltip on hover showing province, category, value, unit
- [x] 10.4 Click on province row label updates spider chart selection
- [x] 10.5 Responsive: horizontal scroll with sticky first column below lg breakpoint
- [x] 11.1 Update `StatsPoblacionRanking` to display `impactosPorCategoria` values for the selected category
- [x] 11.2 Cards respond to category selector changes
- [x] 12.1 Delete `stats-bar-chart.component.tsx`
- [x] 12.2 Delete `stats-impact-scatter-chart.component.tsx`
- [x] 12.3 Remove their imports and usage from `stats.route.tsx`
- [x] 13.1 Update `StatsRoute` layout to new 5-row structure: KPI cards, Timeline, Spider+Heatmap, Table+Donut, Scatter+Poblaciones
- [x] 13.2 Add `StatsCategorySelector` to header beside year selector
- [x] 13.3 Wire `selectedCategory` state through to all components
- [x] 13.4 Update loading skeleton to match new layout
- [x] 13.5 Preserve empty state and error state behavior

## 14. Backend — Keep Distribution and Efficiency unchanged

- [x] 14.1 Verify `computeDistribucionCultivos` works correctly (no changes needed — uses Prisma groupBy on Cultivo, not impact data)
- [x] 14.2 Verify scatter chart data (produccionMedia, consumoAguaMedio, superficieTotal) still computed correctly in province ranking
- [x] 14.3 Verify `aniosDisponibles` endpoint field unchanged
- [x] 15.1 Write/update unit tests for `computeKPIs` with per-category aggregation
- [x] 15.2 Write/update unit tests for `computeRankingProvincias` with category filter
- [x] 15.3 Write/update unit tests for `computeRankingPoblaciones` with category filter
- [x] 15.4 Write/update unit tests for `computeEvolucionTemporal` with EF categories
- [x] 16.1 Run backend lint `npm run lint`
- [x] 16.2 Run backend tests `npm test`
- [x] 16.3 Run frontend lint `npm run lint` in `web/`
- [x] 16.4 Run frontend typecheck `npm run build` in `web/`
- [ ] 16.5 Manual visual verification: stacked area renders correctly with 8 categories
- [ ] 16.6 Manual visual verification: spider chart and heatmap render with real data
