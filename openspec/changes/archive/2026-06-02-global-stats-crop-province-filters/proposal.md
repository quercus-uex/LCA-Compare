## Why

La vista de estadísticas globales actualmente solo permite filtrar por año de campaña y categoría EF, pero no por tipo de cultivo ni por provincia en el ranking de poblaciones. Esto limita el análisis exploratorio: un usuario que quiera ver cómo un cultivo concreto (ej. "Tomate") impacta en las distintas provincias o cómo se ordenan las poblaciones de una provincia específica no puede hacerlo sin salir de la página. Además, no hay forma de buscar una población concreta en el ranking ni de ver su posición real.

## What Changes

- Se añade un selector de cultivo (dropdown) en la barra de filtros superior, que recarga todos los datos (KPIs, rankings de provincias y poblaciones, perfil de impacto, mapa de calor, eficiencia producción vs consumo H2O, distribución de cultivos) filtrando por el tipo de cultivo seleccionado.
- El ranking de poblaciones incluye un minibuscador textual para localizar una población concreta por nombre y ver su posición en el ranking.
- El ranking de poblaciones incluye un filtro por provincia que muestra únicamente el top 10 peor y top 10 mejor de la provincia seleccionada.
- Cada entrada en los rankings de provincias y poblaciones muestra su número de posición real (1, 2, 3...) en lugar de solo la lista ordenada.
- **BREAKING**: La API `GET /stats/global` acepta nuevos query params opcionales (`tipoCultivo`, `idProvinciaPoblacion`) que afectan a qué datos se filtran en backend.

## Capabilities

### New Capabilities
- `population-ranking-search-filter`: Búsqueda textual y filtro por provincia en el ranking de poblaciones de la vista de estadísticas globales.

### Modified Capabilities
- `global-stats-api`: Se añaden query params `tipoCultivo` y `idProvinciaPoblacion` al endpoint `GET /stats/global`. El parámetro `tipoCultivo` filtra todos los cultivos usados en los cómputos. El parámetro `idProvinciaPoblacion` filtra el ranking de poblaciones a las de una provincia concreta.
- `statistics-dashboard`: La barra de filtros incluye un nuevo selector de cultivo. El ranking de provincias y poblaciones muestra posición numérica. El ranking de poblaciones añade buscador textual y filtro por provincia.

## Impact

- **Backend**: `StatsController` y `StatsService` (`src/stats/`) — nuevos query params, nueva lógica de filtrado en consultas Prisma/raw SQL, DTO actualizado.
- **Frontend**: `StatsRoute` (`web/src/routes/stats/stats.route.tsx`) — nuevo estado para filtro de cultivo, paso de props a componentes hijos. `StatsPoblacionRanking` (`web/src/stats/stats-poblacion-ranking.component.tsx`) — buscador textual, filtro provincia, posición numérica. `StatsProvinciaRanking` (`web/src/stats/stats-provincia-ranking.component.tsx`) — posición numérica. `useStats` hook (`web/src/stats/stats.hook.tsx`) — nuevos parámetros en la llamada API. `StatsSpiderChart`, `StatsHeatmap`, `StatsScatterChart` — reciben datos ya filtrados desde el hook.
