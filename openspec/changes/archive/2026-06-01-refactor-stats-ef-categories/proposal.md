## Why

La vista de estadisticas globales agrega datos de impacto ambiental por la clave de **proceso** (fertilizantes, manejo_cultivo, pesticidas, sistema_riego, total), lo cual no tiene valor interpretativo para un gestor ambiental. Lo que importa en EF 3.1 son las **categorias de impacto** (cambio climatico, eutrofizacion, acidificacion, uso de agua, uso del suelo, particulas, ecotoxicidad, toxicidad humana). Ademas, el `impactoTotalMedio` actual es la suma de todas las categorias a traves de todos los procesos, un numero sin significado real. El dashboard se ve sobrecargado con graficos redundantes y no comunica informacion accionable.

## What Changes

- **BREAKING**: El endpoint `GET /stats/global` cambia la estructura de `evolucionTemporal` — de 5 lineas de proceso a 8 categorias EF 3.1 con soporte para seleccion de categoria
- **BREAKING**: El `KpiDto` se reemplaza por un conjunto de 8 tarjetas KPI, una por categoria EF 3.1, mostrando el valor medio agregado de esa categoria en toda la plataforma
- **BREAKING**: Los rankings de provincia y poblacion dejan de ordenarse por `impactoTotalMedio` (numero blob) y pasan a ordenarse por categoria EF 3.1 seleccionable
- La vista de evolucion temporal pasa de un `LineChart` de 5 lineas a un grafico de area apilada (stacked area) que muestra la contribucion relativa de cada categoria EF 3.1, mas 8 sparklines en small multiples
- Se eliminan el `StatsBarChart` y el `StatsImpactScatterChart` (redundantes con la tabla y el scatter de eficiencia)
- Se anaden un grafico spider/radar para la "huella" de una provincia seleccionada y un heatmap provincias x categorias
- Los KPIs operacionales (parcelas, cultivos, superficie) se mueven a una fila secundaria compacta

## Capabilities

### New Capabilities
- `ef-category-aggregation`: Agregacion de impactos por categoria EF 3.1 en lugar de por clave de proceso, con soporte para media ponderada y seleccion de categoria en rankings y graficos
- `stats-spider-chart`: Grafico spider/radar que muestra el perfil de impacto de una provincia seleccionada en las 8 categorias EF 3.1
- `stats-heatmap`: Mapa de calor provincias x categorias EF 3.1 para identificacion rapida de patrones

### Modified Capabilities
- `global-stats-api`: La estructura de `EvolucionTemporalItemDto`, `KpiDto`, `ProvinciaRankingItemDto`, y `PoblacionRankingItemDto` cambia para reflejar categorias EF 3.1 en lugar de claves de proceso. El endpoint acepta un nuevo query param `?categoria=` para filtrar rankings. La respuesta incluye 8 valores medios por categoria en lugar de un unico `impactoTotalMedio`.
- `statistics-dashboard`: La distribucion de secciones del dashboard cambia — los KPIs pasan a ser 8 tarjetas de categoria + fila compacta operacional, la timeline pasa a area apilada + sparklines, se eliminan BarChart e ImpactScatterChart, se anaden SpiderChart y Heatmap. El ranking de provincias y poblaciones incluye selector de categoria.

## Impact

- `src/stats/stats.service.ts` — reescritura de `computeKPIs`, `computeRankingProvincias`, `computeRankingPoblaciones`, `computeEvolucionTemporal` para pivotar de proceso a categoria
- `src/stats/dto/global-stats.dto.ts` — nuevos DTOs para categorias EF 3.1, incluyendo `EfCategoryKpiDto`, `CategoriaTrendDto`, etc.
- `src/stats/stats.controller.ts` — nuevo query param `?categoria=`
- `web/src/stats/stats.hook.tsx` — nuevos tipos TypeScript alineados con los DTOs del backend
- `web/src/routes/stats/stats.route.tsx` — nuevo layout con menos secciones, mas impacto visual
- `web/src/stats/stats-kpi-cards.component.tsx` — reescritura para 8 categorias + fila operacional
- `web/src/stats/stats-timeline.component.tsx` — reescritura a stacked area + sparklines
- `web/src/stats/stats-bar-chart.component.tsx` — ELIMINADO
- `web/src/stats/stats-impact-scatter-chart.component.tsx` — ELIMINADO
- Nuevos: `stats-spider-chart.component.tsx`, `stats-heatmap.component.tsx`
