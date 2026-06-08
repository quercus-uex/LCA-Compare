## Context

La vista de estadísticas globales (`/estadisticas`) actualmente permite filtrar por año de campaña y categoría EF 3.1. El backend `GET /stats/global` acepta `anio` y `categoria`. No existe filtro por tipo de cultivo ni por provincia para el ranking de poblaciones. El ranking de provincias y poblaciones muestra posición relativa dentro del top 10 visible, no la posición real en el ranking completo.

Se reutilizarán patrones existentes: `SearchableLocationSelect` (genérico, del spider chart) para el buscador de poblaciones, y `useLocation` para cargar datos geográficos.

## Goals / Non-Goals

**Goals:**
- Añadir selector de cultivo en la barra de filtros que filtre todos los datos mostrados
- Añadir filtro por provincia en el ranking de poblaciones, mostrando top 10 mejor/peor de esa provincia
- Añadir minibuscador textual en el ranking de poblaciones para localizar posición
- Mostrar posición real en el ranking en cada entrada de provincia y población

**Non-Goals:**
- No se modifica la vista de comparador (`/compare`)
- No se añaden nuevos endpoints de API (solo se extiende el existente)
- No se añade filtro de cultivo al ranking de provincias (ya que el cultivo se filtra globalmente)
- La gráfica de donut "Distribución por Cultivo" no se ve afectada por el filtro de cultivo (muestra siempre la distribución completa)

## Decisions

### 1. Filtro de cultivo: query param en backend, no filtrado en frontend

**Decisión:** Añadir `tipoCultivo?: string` como query param en `GET /stats/global`. El backend aplica `cultivo.where.tipo = tipoCultivo` en todas las queries Prisma (findMany principal, groupBy de distribución, raw SQL de años disponibles). El frontend solo pasa el valor y refetcha.

**Alternativa considerada:** Filtrado client-side sobre los datos ya cargados. Rechazada porque los rankings se computan en backend y filtrar en cliente daría resultados incorrectos (ej. las medias por provincia cambiarían con el filtro).

**Alternativa considerada:** Hacer que el backend siempre devuelva todos los datos y el frontend filtre. Rechazada porque las agregaciones (medias, sumas) deben recalcularse sobre el subset filtrado.

### 2. Filtro de provincia en poblaciones: filtrado en backend

**Decisión:** Añadir `idProvinciaPoblacion?: string` como query param. El backend filtra `computeRankingPoblaciones` para incluir solo poblaciones de esa provincia. Esto devuelve el ranking completo de poblaciones de esa provincia, y el frontend hace `slice(0, 10)` y `slice(-10).reverse()` para mostrar top 10 mejor/peor.

**Alternativa considerada:** Filtrado client-side. Rechazada porque los rankings de poblaciones pueden ser grandes y ya vienen ordenados del backend. Además, si en el futuro se paginan los rankings, el filtrado client-side no funcionaría.

### 3. Buscador de poblaciones: client-side con posición real

**Decisión:** El buscador es puramente frontend. Se añade un `input` de texto en el componente `StatsPoblacionRanking` que filtra el array `ranking` (ya filtrado por provincia si aplica) por nombre de población. Los resultados muestran la posición real en el array completo. Se reutiliza el patrón de `SearchableLocationSelect` pero simplificado (sin dropdown complejo, solo input + lista de resultados).

### 4. Posición real en rankings: cálculo en frontend

**Decisión:** Modificar los componentes de ranking para que:
- Top mejores: posición = `idx + 1` (correcto, el mejor es #1)
- Top peores: posición = `ranking.length - idx` (el peor es #N, el segundo peor es #N-1)

No se añade campo `posicion` al DTO porque es derivable del orden del array.

### 5. Selector de cultivo: dropdown poblado desde la respuesta de la API

**Decisión:** El selector de cultivo se puebla con los tipos de cultivo disponibles, obtenidos de `data.distribucionCultivos.map(d => d.tipo)`. No se necesita un endpoint adicional. Incluye opción "Todos los cultivos" como default.

### 6. Selector de provincia en poblaciones: dropdown con lista de provincias desde `useLocation`

**Decisión:** Se usa `useLocation().getProvincias()` para cargar las provincias disponibles (igual que en el comparador). Se añade un `<select>` en el componente de ranking de poblaciones.

## Risks / Trade-offs

- **[Riesgo] Rendimiento con muchos cultivos:** El filtro `tipoCultivo` añade una condición `where.tipo` que no tiene índice. Si la tabla `Cultivo` crece mucho, las queries podrían ralentizarse. → **Mitigación:** Añadir índice en `Cultivo.tipo` si es necesario. El impacto es bajo porque el número de tipos de cultivo es pequeño (decenas).
- **[Riesgo] Inconsistencia con datos cacheados:** El hook `useStats` ya refetcha al cambiar `anio` o `categoria`. Añadir `tipoCultivo` como dependencia del `useCallback` es natural y no introduce race conditions.
- **[Trade-off] Buscador client-side:** Si el ranking tiene miles de poblaciones, la búsqueda client-side con `filter` + `includes` es rápida. No justifica un endpoint de búsqueda dedicado.
