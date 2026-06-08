## Context

La plataforma Ventum-ACV almacena datos de parcelas agrícolas con sus cultivos y resultados de impacto ambiental. Actualmente no existe ninguna vista agregada: los datos solo se consultan parcela a parcela o mediante el comparador par a par. Con ~1,200 cultivos registrados, ~300 poblaciones y 29 provincias (Portugal), hay volumen suficiente para que las agregaciones revelen patrones significativos.

### Constraints

- **`ResultadoImpacto.datos` es JSON** → Prisma no puede hacer `groupBy` sobre campos JSON. La agregación de impactos ambientales debe hacerse en memoria.
- **`Cultivo` tiene campos numéricos flat** (`superficieCultivada`, `produccion`, `consumoAgua`, `ciclo`) → Prisma `groupBy` con `_sum`, `_avg`, `_count` sí funciona aquí.
- **PostGIS `geom` es `Unsupported`** → Las queries espaciales requieren SQL raw. Para este dashboard **no se necesitan** queries espaciales (solo agrupaciones por entidad geográfica vía relaciones).
- **Módulo `compare` ya referencia `IMPACT_KEYS` y `ResultadoImpactoDto`** en `src/compare/compare.types.ts` → Podemos reutilizar estas definiciones.
- **Frontend usa TailwindCSS 4 + DaisyUI 5** → Los componentes deben seguir este patrón, sin introducir otro sistema de diseño.
- **No hay librería de gráficos instalada** → Hay que añadir `recharts`.

## Goals / Non-Goals

**Goals:**
- Un único endpoint `GET /stats/global` que devuelva todos los datos necesarios para el dashboard en una sola llamada
- Dashboard frontend con: KPIs, ranking de provincias, gráfico de barras por provincia, evolución temporal, distribución de cultivos, scatter de eficiencia, ranking de poblaciones
- Filtro por año de campaña con selector en cabecera
- Página pública (sin auth), accesible desde la navbar
- Diseño consistente con el resto de la aplicación (Tailwind + DaisyUI)
- Uso de Recharts para todos los gráficos

**Non-Goals:**
- Filtros adicionales más allá del año (tipo de cultivo, provincia específica) → futura iteración
- Caché o pre-cálculo de agregaciones → los datos se calculan on-demand
- Soporte multi-país en el dashboard → aunque la BD lo soporta, los datos semilla son solo Portugal. La API sí debe devolver datos de cualquier país
- Drill-down interactivo (clic en provincia → detalle) → futura iteración
- Exportación de datos del dashboard
- Tests automatizados para el dashboard

## Decisions

### 1. Backend: un solo endpoint monolítico vs múltiples endpoints especializados

**Decisión**: Un solo endpoint `GET /stats/global?anio=<YYYY>` que devuelve toda la respuesta.

**Alternativa considerada**: Endpoints separados (`/stats/kpis`, `/stats/ranking/provincias`, `/stats/ranking/poblaciones`, etc.)

**Razón**: Menos round-trips. El volumen de datos es pequeño (~30 provincias, ~300 poblaciones) así que la respuesta cabe cómodamente en una sola petición. Un solo endpoint simplifica el frontend (un solo fetch, un solo estado de carga). La alternativa de endpoints separados añadiría complejidad innecesaria para este volumen.

### 2. Backend: agregación de impactos en memoria vs pre-cálculo en BD

**Decisión**: Agregación en memoria en el servicio `StatsService`, sin modificar el schema de BD.

**Alternativa considerada**: Añadir columnas materializadas a `Cultivo` con los totales de impacto pre-calculados al insertar cada `ResultadoImpacto`.

**Razón**: La agregación en memoria es trivial para ~1,200 registros (el `getMeanOfResults` de `CompareService` ya demuestra este patrón). Materializar columnas requeriría migración, triggers o lógica en el servicio de captura, y acoplaría el schema al formato específico de `ResultadoImpactoDto`. Si en el futuro el volumen crece significativamente, se puede añadir caché con TTL sin cambiar la API.

### 3. Backend: ubicación del nuevo módulo

**Decisión**: Nuevo módulo `src/stats/` con `stats.module.ts`, `stats.service.ts`, `stats.controller.ts`.

**Alternativa considerada**: Extender el módulo `compare` existente.

**Razón**: `CompareService` ya es complejo (tiene Playwright, Handlebars, AI). Mezclar responsabilidades de dashboard y comparación en un solo módulo violaría el patrón de "un módulo por dominio" que sigue el proyecto. `stats` es un dominio nuevo y distinto.

### 4. Frontend: React Context vs hook local con fetch

**Decisión**: Hook local `useStats(anio)` con `useState` + `useEffect`, sin un `StatsProvider` global en el árbol de contextos.

**Alternativa considerada**: `StatsProvider` en `main.tsx` como el resto de hooks (Compare, Parcela, Location, etc.)

**Razón**: Los providers existentes (`CompareProvider`, `LocationProvider`, etc.) envuelven operaciones que se usan desde múltiples componentes en distintas rutas. El dashboard es autocontenido en una sola ruta: un solo componente `<StatsRoute>` consume los datos y los distribuye a sus hijos vía props. Un context global sería sobre-ingeniería. Si en el futuro otras rutas necesitan datos de stats, se puede elevar a provider.

### 5. Frontend: librería de gráficos

**Decisión**: Recharts (`recharts`)

**Alternativas consideradas**: Nivo, Chart.js, ECharts

**Razón**: Recharts es la librería React más ligera y declarativa. Sus componentes son React puro (no wrappers de librerías canvas), lo que facilita el estilado con Tailwind. Nivo es más bonito pero mucho más pesado. Chart.js requiere wrappers. ECharts es el más potente pero overkill para gráficos básicos.

### 6. Diseño del layout del dashboard

**Decisión**: Layout en grid CSS de 2 columnas para pantallas grandes, colapsando a 1 columna en móvil. Secciones apiladas verticalmente con cards DaisyUI.

**Razón**: Sigue el patrón existente en la aplicación (las rutas usan `flex` con `max-xl:flex-col`). Las cards de DaisyUI (`card bg-base-100`) ya se usan en el comparador. No se introduce ningún sistema de layout nuevo.

### 7. Endpoint público vs autenticado

**Decisión**: Endpoint público, sin `@UseGuards(AuthGuard)`.

**Razón**: El endpoint `/compare` ya es público. `GET /provincia` también lo es. El dashboard de estadísticas globales tiene vocación divulgativa y no expone datos personales (son agregaciones anónimas). Seguir el mismo criterio que el resto de endpoints públicos.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│                                                                  │
│  /estadisticas ──▶ StatsRoute                                    │
│                    ├── StatsKPICards                             │
│                    ├── StatsProvinciaRanking (tabla ordenable)    │
│                    ├── StatsBarChart (Recharts BarChart)         │
│                    ├── StatsTimeline (Recharts LineChart)        │
│                    ├── StatsCropDistribution (Recharts PieChart) │
│                    ├── StatsEfficiencyScatter (Recharts Scatter) │
│                    └── StatsPoblacionRanking (top 10 / bottom 10)│
│                                                                  │
│  GET /api/stats/global?anio=2024 ──────────────────────┐         │
│                                                        │         │
├────────────────────────────────────────────────────────┼─────────┤
│                        BACKEND                         │         │
│                                                        ▼         │
│  StatsController ──▶ StatsService                               │
│                        │                                        │
│                        ├── getKPIs(anio)                         │
│                        │   └── prisma.cultivo.groupBy / aggregate│
│                        │                                        │
│                        ├── getRankingProvincias(anio)            │
│                        │   └── prisma.cultivo.groupBy            │
│                        │       (by provincia via include chain)  │
│                        │                                        │
│                        ├── getEvolucionTemporal()                │
│                        │   └── prisma.cultivo.groupBy(by year)   │
│                        │                                        │
│                        ├── getDistribucionCultivos(anio)         │
│                        │   └── prisma.cultivo.groupBy(by tipo)   │
│                        │                                        │
│                        ├── getRankingPoblaciones(anio)           │
│                        │   └── prisma.cultivo.groupBy            │
│                        │       (by poblacion via include chain)  │
│                        │                                        │
│                        └── computeImpactoMedio(ids)              │
│                            └── in-memory aggregation of         │
│                                ResultadoImpacto.datos JSON      │
│                                                                  │
│  Prisma queries: groupBy + _sum, _avg, _count on Cultivo        │
│  JSON aggregation: manual loops on ResultadoImpacto[].datos     │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
1. Frontend monta <StatsRoute>
2. useEffect detecta año seleccionado (default: año actual)
3. fetch('/api/stats/global?anio=2024')
4. Backend StatsService:
   a. Obtiene IDs de todos los cultivos del año → findMany({ where: { fechaInicioCampania: { gte, lt } }, select: { id: true } })
   b. Obtiene IDs de ResultadoImpacto asociados a esos cultivos
   c. Ejecuta queries groupBy en paralelo:
      - KPIs: aggregate sobre toda la tabla Cultivo filtrada por año
      - Ranking provincias: groupBy por idProvincia (vía parcela.poblacion.provincia)
      - Ranking poblaciones: groupBy por idPoblacion (vía parcela.poblacion)
      - Distribución cultivos: groupBy por tipo
      - Evolución temporal: groupBy por año (sin filtrar por año, para tener la serie completa)
   d. Agrega impactos en memoria: carga los ResultadoImpacto del año, calcula media del impacto_total para cada provincia y población
   e. Devuelve todo en un DTO GlobalStatsDto
6. Frontend recibe datos, distribuye a componentes hijos vía props
7. Cada componente de gráfico recibe su slice de datos
```

## API Contract

```
GET /api/stats/global?anio=2024

Response: GlobalStatsDto {
  kpis: {
    totalParcelas: number
    totalCultivos: number
    superficieTotal: number      // Ha, sum
    consumoAguaMedio: number     // L/Ha, avg
    produccionMedia: number      // T/Ha, avg
    impactoTotalMedio: number    // media del impacto_total
    variacionInteranual: number  // % vs año anterior (null si no hay datos)
  }
  rankingProvincias: Array<{
    idProvincia: string
    nombreProvincia: string
    numParcelas: number
    numCultivos: number
    superficieTotal: number
    produccionMedia: number
    consumoAguaMedio: number
    impactoTotalMedio: number
    eficiencia: number           // produccionMedia / consumoAguaMedio
  }>
  rankingPoblaciones: Array<{
    idPoblacion: string
    nombrePoblacion: string
    nombreProvincia: string
    numParcelas: number
    impactoTotalMedio: number
  }>
  evolucionTemporal: Array<{
    anio: number
    impactoFertilizantes: number
    impactoManejoCultivo: number
    impactoPesticidas: number
    impactoSistemaRiego: number
    impactoTotal: number
    numCultivos: number
  }>
  distribucionCultivos: Array<{
    tipo: string
    count: number
    superficieTotal: number
  }>
}
```

## Risks / Trade-offs

- **[Rendimiento] Agregación JSON en memoria sobre 1,200+ registros** → Mitigación: 1,200 registros con ~5 categorías cada uno son ~6,000 iteraciones. Imperceptible. Si crece a 50k+ registros, implementar caché en Redis o añadir tabla materializada. No es un riesgo ahora.
- **[Rendimiento] Muchas queries groupBy en una sola request** → Mitigación: ejecutar todas en paralelo con `Promise.all`. Son ~6 queries ligeras (sin joins pesados). El cuello de botella real es la carga de ResultadoImpacto para la agregación JSON.
- **[Datos vacíos] Si no hay cultivos en el año seleccionado** → Mitigación: el endpoint devuelve arrays vacíos y KPIs a 0. El frontend muestra estados "sin datos".
- **[Consistencia] Si un cultivo no tiene ResultadoImpacto asociado** → Mitigación: el cultivo se incluye en estadísticas de cultivo (superficie, producción, agua) pero se excluye del cálculo de impacto medio. Los rankings de impacto ignoran entidades sin resultados.
- **[UX] Selector de año sin datos de años disponibles** → Mitigación: incluir en la respuesta un campo `aniosDisponibles: number[]` derivado de `SELECT DISTINCT EXTRACT(YEAR FROM "fechaInicioCampania")`. Así el frontend puede deshabilitar años sin datos.
