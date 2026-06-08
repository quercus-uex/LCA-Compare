## 1. Backend: Añadir query params a la API

- [x] 1.1 Añadir `tipoCultivo` y `idProvinciaPoblacion` como query params opcionales en `StatsController.getGlobalStats()` (`src/stats/stats.controller.ts`)
- [x] 1.2 Añadir `tipoCultivo` y `idProvinciaPoblacion` como parámetros en `StatsService.getGlobalStats()` (`src/stats/stats.service.ts`)
- [x] 1.3 Aplicar `tipoCultivo` como filtro `where.tipo` en la query `Cultivo.findMany` principal y en la query de años disponibles
- [x] 1.4 Aplicar `tipoCultivo` como filtro en `computeInterannualVariation` (query de año anterior)
- [x] 1.5 Pasar `tipoCultivo` a `computeDistribucionCultivos` para filtrar también el groupBy — o mantenerlo sin filtrar (decisión de diseño: la distribución de cultivos se mantiene global)
- [x] 1.6 Aplicar `idProvinciaPoblacion` en `computeRankingPoblaciones` para filtrar resultados a la provincia indicada
- [x] 1.7 Ejecutar lint y tests del backend: `npm run lint && npm test`

## 2. Frontend: Añadir filtro de cultivo en la barra superior

- [x] 2.1 Añadir estado `tipoCultivo: string | undefined` en `StatsRoute` (`web/src/routes/stats/stats.route.tsx`)
- [x] 2.2 Crear componente `StatsCropSelector` con dropdown `<select>` poblado desde `data.distribucionCultivos` (`web/src/stats/stats-crop-selector.component.tsx`)
- [x] 2.3 Actualizar `useStats` para aceptar parámetro `tipoCultivo` y pasarlo como query param (`web/src/stats/stats.hook.tsx`)
- [x] 2.4 Renderizar `StatsCropSelector` en la barra de filtros de `StatsRoute` junto a category selector y year selector
- [x] 2.5 Ejecutar lint del frontend: `npm run lint`

## 3. Frontend: Posición real en rankings de provincias y poblaciones

- [x] 3.1 Modificar `StatsProvinciaRanking` para que el top 10 peor muestre `ranking.length - idx` en vez de `idx + 1`
- [x] 3.2 Modificar `StatsPoblacionRanking` para que el top 10 peor muestre la posición real (mismo patrón)

## 4. Frontend: Buscador y filtro de provincia en ranking de poblaciones

- [x] 4.1 Añadir estado `provinciaFilter: string | undefined` en `StatsPoblacionRanking`
- [x] 4.2 Añadir estado `searchQuery: string` en `StatsPoblacionRanking`
- [x] 4.3 Crear UI de dropdown de provincia usando `useLocation().getProvincias()` dentro del componente
- [x] 4.4 Crear UI de input de búsqueda textual para filtrar poblaciones por nombre
- [x] 4.5 Pasar `idProvinciaPoblacion` como query param al hook `useStats` cuando se selecciona una provincia
- [x] 4.6 Implementar filtrado client-side de la búsqueda textual sobre el array `ranking`
- [x] 4.7 Mostrar resultados de búsqueda con la posición real en el ranking (antes de cualquier filtro cliente de búsqueda)
- [x] 4.8 Renderizar dropdown de provincia e input de búsqueda sobre las cards de top 10 mejor/peor
- [x] 4.9 Ejecutar lint del frontend: `npm run lint`
