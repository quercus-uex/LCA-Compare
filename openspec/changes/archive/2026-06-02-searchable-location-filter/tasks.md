## 1. SearchableLocationSelect component

- [x] 1.1 Create `web/src/stats/searchable-location-select.component.tsx` with generic `SearchableLocationSelect<T>` component that accepts `items`, `value`, `onChange`, `getLabel`, `placeholder`, and `emptyMessage` props
- [x] 1.2 Implement client-side filtering logic: case-insensitive partial match against `getLabel(item)`, limited to 10 results
- [x] 1.3 Implement dropdown UI with DaisyUI styling: absolute-positioned list below input, highlight matching text, scrollable container
- [x] 1.4 Implement keyboard navigation: ArrowDown/ArrowUp to move focus, Enter to select, Escape to close dropdown
- [x] 1.5 Implement click-outside handler to close dropdown without selecting
- [x] 1.6 Implement clear button (X icon) to reset selection and call `onChange(null)`
- [x] 1.7 Add empty state message when no items match the search query

## 2. Refactor StatsSpiderChart

- [x] 2.1 Add `poblacionRanking: PoblacionRankingItemDto[]` prop alongside existing `ranking`
- [x] 2.2 Add `mode` state (`'provincia' | 'poblacion'`) with default `'provincia'`
- [x] 2.3 Add Provincia/Población toggle using DaisyUI `tabs` or `btn-group` at the top of the component
- [x] 2.4 Create a unified internal type for the active entity list that normalizes `nombreProvincia`/`nombrePoblacion` into a common `nombre` field
- [x] 2.5 Replace both native `<select>` dropdowns with two `SearchableLocationSelect` instances (primary + comparison)
- [x] 2.6 Ensure comparison selector excludes the already-selected primary entity and only shows entities of the same type
- [x] 2.7 Reset selections when mode toggles: select top-impact entity of the new type, clear comparison
- [x] 2.8 Preserve existing radar chart rendering, normalization, tooltip, and legend logic unchanged

## 3. Wire up in stats route

- [x] 3.1 Update `StatsSpiderChart` usage in `web/src/routes/stats/stats.route.tsx` to pass `poblacionRanking={data.rankingPoblaciones}`
- [x] 3.2 Update card title from "Perfil de Impacto por Provincia" to "Perfil de Impacto" (dynamic based on mode or generic)

## 4. Verification

- [x] 4.1 Run `npm run lint` in `/web` and fix any issues
- [x] 4.2 Run `npm run build` in `/web` and verify no TypeScript errors
- [ ] 4.3 Manually test: type in search input, verify filtering works, select province, toggle to población, verify population data shows
- [ ] 4.4 Manually test: keyboard navigation (arrows, enter, escape) on the search input
- [ ] 4.5 Manually test: comparison mode with two provinces and two populations
- [ ] 4.6 Manually test: responsive layout and mobile behavior
