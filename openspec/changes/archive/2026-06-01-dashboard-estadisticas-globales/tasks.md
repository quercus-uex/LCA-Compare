## 1. Backend - Módulo Stats

- [x] 1.1 Crear directorio `src/stats/` con archivo `stats.module.ts` que importe `PrismaService`, `ResultadoImpactoModule`, `ProvinciaService`, `PoblacionService` y exporte `StatsService`
- [x] 1.2 Crear `src/stats/dto/global-stats.dto.ts` con los DTOs: `GlobalStatsDto`, `KpiDto`, `ProvinciaRankingItemDto`, `PoblacionRankingItemDto`, `EvolucionTemporalItemDto`, `DistribucionCultivoItemDto`
- [x] 1.3 Crear `src/stats/stats.service.ts` con PrismaService inyectado. Métodos privados: `getKPIs(anio?)`, `getRankingProvincias(anio?)`, `getRankingPoblaciones(anio?)`, `getEvolucionTemporal()`, `getDistribucionCultivos(anio?)`, `getAniosDisponibles()`, `computeImpactoMedioPorProvincia(anio?)`, `computeImpactoMedioPorPoblacion(anio?)`
- [x] 1.4 Implementar `getKPIs`: usar `prisma.cultivo.aggregate({ _sum: { superficieCultivada }, _avg: { produccion, consumoAgua }, _count: true })` y `prisma.parcela.count()` con filtro de año. Calcular `impactoTotalMedio` agregando in-memory los `ResultadoImpacto.datos`. Calcular `variacionInteranual` comparando impacto_total del año actual vs anterior
- [x] 1.5 Implementar `getRankingProvincias`: usar `prisma.cultivo.groupBy({ by: ['idParcela'], ... })` y luego agrupar manualmente por provincia recorriendo las relaciones parcela→poblacion→provincia. Alternativa: raw query con JOIN o múltiples queries agrupando por `idProvincia` vía `prisma.cultivo.findMany({ include: { parcela: { include: { poblacion: true } } } })` y agregar en memoria
- [x] 1.6 Implementar `getRankingPoblaciones`: misma estrategia que provincias pero agrupando por `idPoblacion`. Devolver ordenado por `impactoTotalMedio` ascendente
- [x] 1.7 Implementar `getEvolucionTemporal`: agrupar cultivos por año (`groupBy` con expresión sobre `fechaInicioCampania` o post-procesar). Para cada año, cargar `ResultadoImpacto` asociados y calcular media de cada `IMPACT_KEY`
- [x] 1.8 Implementar `getDistribucionCultivos`: `prisma.cultivo.groupBy({ by: ['tipo'], _count: true, _sum: { superficieCultivada } })`
- [x] 1.9 Implementar `getAniosDisponibles`: `prisma.$queryRaw` con `SELECT DISTINCT EXTRACT(YEAR FROM "fechaInicioCampania") AS anio FROM "Cultivo" ORDER BY anio` o post-procesar `prisma.cultivo.findMany({ select: { fechaInicioCampania: true }, distinct: ['fechaInicioCampania'] })`
- [x] 1.10 Crear `src/stats/stats.controller.ts` con endpoint `@Get() getGlobalStats(@Query('anio') anio?: number)` público (sin `@UseGuards`), que llama a `StatsService.getGlobalStats(anio)` y devuelve el `GlobalStatsDto`
- [x] 1.11 Registrar `StatsModule` en `src/app.module.ts` añadiéndolo al array `imports`

## 2. Frontend - Setup y dependencias

- [x] 2.1 Instalar `recharts` en `/web`: `npm install recharts`
- [x] 2.2 Crear directorio `web/src/stats/` para componentes de estadísticas
- [x] 2.3 Crear `web/src/stats/stats.hook.tsx` con hook `useStats(anio?: number)` que llama a `GET /api/stats/global?anio=...` y devuelve `{ data, loading, error, refetch }`

## 3. Frontend - Página y layout

- [x] 3.1 Crear `web/src/routes/stats/stats.route.tsx`: componente principal que usa `useStats`, maneja estado del año seleccionado con `useState`, y renderiza el layout del dashboard con selector de año y todas las secciones
- [x] 3.2 Implementar selector de año: dropdown DaisyUI (`<select className="select">`) poblado desde `data.aniosDisponibles` con opción "Todos" (valor `undefined`). Al cambiar, actualiza estado y dispara refetch
- [x] 3.3 Implementar estados de carga: mostrar skeletons de DaisyUI mientras `loading === true`
- [x] 3.4 Implementar estado de error: mostrar alert con mensaje y botón de reintentar
- [x] 3.5 Implementar estado vacío: si `data` es null o arrays vacíos, mostrar "No hay datos disponibles" en cada sección

## 4. Frontend - KPIs

- [x] 4.1 Crear `web/src/stats/stats-kpi-cards.component.tsx` que recibe `kpis: KpiDto` y renderiza 5 cards en fila con DaisyUI `card` + `stat`
- [x] 4.2 Cada card muestra: icono, nombre de métrica, valor formateado con unidades (Ha, L/Ha, T/Ha), y badge de variación interanual (verde ↓ si negativo, rojo ↑ si positivo, gris si null)
- [x] 4.3 Usar `react-icons` (ya instalado) para iconos: `FiBox`, `FiGrid`, `FiTrendingUp`, etc.

## 5. Frontend - Ranking de Provincias

- [x] 5.1 Crear `web/src/stats/stats-provincia-ranking.component.tsx` que recibe `ranking: ProvinciaRankingItemDto[]` y renderiza tabla DaisyUI (`table table-zebra`)
- [x] 5.2 Implementar ordenación por columna: estado local `sortColumn` y `sortDirection`, ordenar array con `Array.sort()`, indicador visual de columna ordenada (▲/▼)
- [x] 5.3 Resaltar top 3 filas con clase `bg-success/10` y bottom 3 con `bg-error/10`
- [x] 5.4 Incluir columna de eficiencia (produccionMedia / consumoAguaMedio) con formato de 2 decimales

## 6. Frontend - Gráfico de Barras por Provincia

- [x] 6.1 Crear `web/src/stats/stats-bar-chart.component.tsx`: Recharts `ResponsiveContainer` > `BarChart` horizontal (`layout="vertical"`) con datos de `rankingProvincias`
- [x] 6.2 Eje Y: nombres de provincia (limitados a ~20 chars con truncado). Eje X: `impactoTotalMedio`
- [x] 6.3 Barras con gradiente de color: calcular color HSL interpolando entre verde (120°) y rojo (0°) según el percentil del valor en el rango min-max
- [x] 6.4 Tooltip personalizado al hover mostrando provincia, impacto, nº parcelas

## 7. Frontend - Evolución Temporal

- [x] 7.1 Crear `web/src/stats/stats-timeline.component.tsx`: Recharts `LineChart` con `XAxis` (años), `YAxis` (impacto), y 5 `Line` components (una por cada IMPACT_KEY)
- [x] 7.2 Colores fijos por tipo de impacto: fertilizantes=amber, manejo_cultivo=blue, pesticidas=red, sistema_riego=cyan, total=slate
- [x] 7.3 Tooltip mostrando año y valores de todas las líneas
- [x] 7.4 Leyenda interactiva (clic para ocultar/mostrar línea)

## 8. Frontend - Distribución de Cultivos

- [x] 8.1 Crear `web/src/stats/stats-crop-donut.component.tsx`: Recharts `PieChart` con `innerRadius={60} outerRadius={100}` usando datos de `distribucionCultivos`
- [x] 8.2 `Pie` con `dataKey="count"` y `nameKey="tipo"`
- [x] 8.3 Tooltip mostrando tipo, count y superficie total
- [x] 8.4 Leyenda externa con nombres de cultivo y porcentajes

## 9. Frontend - Scatter de Eficiencia

- [x] 9.1 Crear `web/src/stats/stats-scatter-chart.component.tsx`: Recharts `ScatterChart` con `XAxis` (consumoAguaMedio), `YAxis` (produccionMedia), y `Scatter` con datos de `rankingProvincias`
- [x] 9.2 Tamaño de cada punto (`zAxis`) proporcional a `superficieTotal`
- [x] 9.3 Líneas divisorias en los valores medianos de X e Y para crear cuadrantes (usando `ReferenceLine`)
- [x] 9.4 Tooltip mostrando nombre de provincia, producción, consumo, superficie, eficiencia

## 10. Frontend - Ranking de Poblaciones

- [x] 10.1 Crear `web/src/stats/stats-poblacion-ranking.component.tsx`: dos cards lado a lado con listas
- [x] 10.2 Card izquierda: "Top 10 - Menor Impacto" con estilo verde, mostrando posición, nombre, provincia, impacto
- [x] 10.3 Card derecha: "Top 10 - Mayor Impacto" con estilo rojo. Obtener los últimos 10 del array (ya ordenado ascendente)
- [x] 10.4 Si hay <10 poblaciones con datos, mostrar las que haya

## 11. Frontend - Integración

- [x] 11.1 Añadir ruta en `web/src/App.tsx`: `<Route path="/estadisticas" element={<StatsRoute />} />` dentro del layout `NavbarContainer`
- [x] 11.2 Añadir botón "Estadísticas" en `web/src/components/navbar.component.tsx` junto al botón "Comparador" existente, con `onClick={() => navigate('/estadisticas')}`
- [x] 11.3 Verificar que el layout responsive funciona: probar en viewport < 1280px que las secciones se apilan verticalmente
- [x] 11.4 Verificar consistencia visual: colores, tipografía, espaciado siguen TailwindCSS 4 + DaisyUI 5 como el resto de la app

## 12. Verificación

- [x] 12.1 Verificar compilación backend: `npm run build` (desde raíz)
- [x] 12.2 Verificar lint backend: `npm run lint` (desde raíz)
- [x] 12.3 Verificar compilación frontend: `npm run build` (desde `/web`)
- [x] 12.4 Verificar lint frontend: `npm run lint` (desde `/web`)
- [x] 12.5 Probar endpoint `GET /api/stats/global?anio=2024` con curl o navegador
- [x] 12.6 Probar endpoint `GET /api/stats/global` sin filtro (todos los años)
- [x] 12.7 Navegar a `/estadisticas` y verificar que todos los gráficos y tablas renderizan correctamente
- [x] 12.8 Verificar selector de año: cambiar año y confirmar que los datos se actualizan
- [x] 12.9 Verificar que la navbar muestra el enlace "Estadísticas" y navega correctamente
