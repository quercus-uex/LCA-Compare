## Why

La plataforma no tiene ninguna vista que agregue los datos de forma global. Los usuarios (y administradores) no pueden ver el rendimiento comparado entre provincias, ni identificar las zonas o tipos de cultivo con mayor impacto ambiental, ni seguir la evolución temporal de las métricas clave. Esto limita la capacidad de tomar decisiones informadas y deja sin explotar el potencial analítico de los datos que ya existen en el sistema.

## What Changes

- **Nuevo módulo backend `stats`** con endpoints de agregación que consultan `Cultivo` (con `groupBy`/`_sum`/`_avg` de Prisma) y `ResultadoImpacto` (agregación in-memory del campo JSON `datos`)
- **Nueva página frontend `/estadisticas`** con un dashboard de estadísticas globales compuesto por:
  - KPIs de cabecera (total parcelas, cultivos, superficie, consumo agua, impacto medio)
  - Ranking de provincias ordenable por múltiples columnas (mejores y peores por impacto, eficiencia, etc.)
  - Gráfico de barras horizontal de impacto total por provincia
  - Gráfico de evolución temporal del impacto por campaña
  - Gráfico de distribución de tipos de cultivo (donut)
  - Gráfico de dispersión producción vs consumo de agua (scatter con burbujas por provincia)
  - Ranking de poblaciones (top 10 mejores y top 10 peores)
- **Librería Recharts** añadida como dependencia del frontend
- **Filtro por año de campaña** en la cabecera del dashboard que afecta a todas las visualizaciones
- **Navegación**: enlace en la navbar principal a `/estadisticas`
- Página **pública** (sin autenticación requerida), siguiendo el patrón de `/compare`

## Capabilities

### New Capabilities
- `global-stats-api`: Endpoint(s) del backend que devuelven datos agregados de la plataforma (KPIs, rankings, distribuciones, series temporales) para alimentar el dashboard
- `statistics-dashboard`: Página frontend con visualizaciones interactivas (gráficos, rankings, KPIs) usando Recharts, siguiendo el diseño consistente con el resto de la aplicación

### Modified Capabilities
<!-- Ninguna capacidad existente modifica sus requisitos. Se añaden capacidades nuevas, no se alteran las existentes. -->

## Impact

- **Backend**: Nuevo módulo `src/stats/` (controller + service + module), importado en `src/app.module.ts`
- **Frontend**: Nueva ruta en `web/src/App.tsx`, nuevo directorio `web/src/stats/` con componentes y página, nuevo `StatsProvider` en el árbol de contextos
- **Dependencias**: `recharts` añadido a `web/package.json`
- **Navegación**: Modificación del componente `Navbar` para incluir enlace a `/estadisticas`
- **Prisma**: Sin cambios en el schema. Uso intensivo de `groupBy`, `_sum`, `_avg`, `_count` (funcionalidad Prisma ya disponible, nunca usada hasta ahora)
- **Sin impacto en**: módulos existentes (auth, compare, parcela, cultivo, etc.), base de datos, migraciones
