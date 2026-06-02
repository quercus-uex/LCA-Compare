## Context

El sistema almacena resultados de ACV en `ResultadoImpacto.datos`, un JSON con 5 claves de proceso (`impacto_fertilizantes`, `impacto_manejo_cultivo`, `impacto_pesticidas`, `impacto_sistema_riego`, `impacto_total`). Cada clave contiene un array de `{category, amount, unit}` con las categorias de EF 3.1 (Climate change, Eutrophication, Acidification, etc.). El dashboard actual agrega por proceso, no por categoria de impacto, produciendo visualizaciones sin valor interpretativo ambiental.

La clave `impacto_total` ya contiene la suma por categoria a traves de todos los procesos, por lo que es la fuente canonica para la agregacion a nivel plataforma.

La interfaz actual tiene 7 secciones de graficos, algunas redundantes (BarChart duplica la tabla de provincias, ImpactScatterChart duplica el ScatterChart de eficiencia).

## Goals / Non-Goals

**Goals:**
- Pivotar toda la logica de agregacion de estadisticas de "clave de proceso" a "categoria de impacto EF 3.1"
- Mostrar 8 KPIs semanticos (uno por categoria EF 3.1) en lugar de un unico `impactoTotalMedio` sin significado
- Sustituir el `LineChart` de 5 lineas de proceso por un stacked area chart + small multiples de sparklines por categoria
- Permitir filtrar rankings de provincia y poblacion por categoria EF 3.1 especifica
- Anadir un spider chart que muestre la huella de una provincia seleccionada en las 8 categorias
- Anadir un heatmap provincias x categorias para deteccion rapida de patrones
- Eliminar graficos redundantes (BarChart, ImpactScatterChart)
- Mantener el estilo DaisyUI + Recharts consistente con el resto de la aplicacion

**Non-Goals:**
- No se modifica el modulo `compare` ni su UI
- No se modifica el esquema de Prisma ni la estructura de `datos` JSON
- No se anaden filtros geograficos adicionales a las estadisticas globales (permanece solo `?anio=` y el nuevo `?categoria=`)
- No se implementa exportacion de datos desde el dashboard de estadisticas
- No se modifica el endpoint `POST /capture`

## Decisions

### 1. Usar `impacto_total` como fuente unica para categorias EF 3.1

**Alternativa**: Sumar las 4 claves de proceso `impacto_fertilizantes` + `impacto_manejo_cultivo` + `impacto_pesticidas` + `impacto_sistema_riego` por categoria.

**Decision**: Usar solo `impacto_total`, que ya es la suma de los 4 procesos por categoria.

**Razon**: `impacto_total[i].amount` ya contiene el total de la categoria `i` sumando los 4 procesos. Re-sumar introduciria duplicacion de logica y posibles errores de redondeo.

### 2. Normalizar nombres de categoria via constante compartida

**Alternativa**: Inferir categorias dinamicamente de los datos existentes.

**Decision**: Definir una constante tipada `EF_CATEGORIES` en `src/compare/compare.types.ts` (junto a `IMPACT_KEYS`) con los 8 nombres de categoria EF 3.1. Usarla tanto en backend como frontend (duplicada en `web/src/common/constants.ts` para el frontend). Si una categoria no existe en un `ResultadoImpacto`, su valor se trata como 0.

**Razon**: Los metodos ACV (EF 3.1 en este caso) tienen categorias fijas y estandarizadas. La normalizacion via constante es mas predecible que la inferencia dinamica y permite comportamientos consistentes ante datos parciales.

### 3. Agregacion en JS con pre-filtro SQL ligero (no raw SQL)

**Alternativa**: Usar `jsonb_array_elements` en SQL para delegar el flatten de categorias a PostgreSQL.

**Decision**: Mantener la agregacion en memoria (JS) por consistencia con el resto del codigo (el servicio `compare` tambien agrega en JS). Optimizar cargando solo `impacto_total` de `datos` en lugar del JSON completo.

**Razon**: La cantidad de `ResultadoImpacto` es baja (< 10000 tipicamente). El overhead de Prisma raw SQL + type safety es mayor que el beneficio de rendimiento para este volumen. Si en el futuro el volumen crece, se migrara a vistas materializadas.

### 4. Layout del dashboard reorganizado

**Decision**: Nueva distribucion en 5 filas:

```
Row 1: 8 KPI cards (categorías EF 3.1) + 3 mini-stats debajo
Row 2: Stacked area chart (evolución temporal por categoria EF) + sparklines grid
Row 3: Spider chart (huella de provincia) + Heatmap (provincias × categorías)
Row 4: Tabla ranking provincias (con selector de categoría) + Donut cultivos
Row 5: Scatter eficiencia + Ranking poblaciones
```

**Alternativa considerada**: Mantener el layout actual con 7 secciones y solo cambiar el contenido.

**Razon**: El layout actual tiene graficos redundantes. La nueva distribucion elimina duplicacion (BarChart = tabla repetida, ImpactScatterChart = scatter redundante) y anade visualizaciones que realmente comunican el impacto ambiental.

### 5. Paleta de colores semantica para las 8 categorias

**Decision**: Usar colores fijos con significado ambiental:

| Categoria | Color | Hex |
|-----------|-------|-----|
| Climate change | Rojo/Calor | `#ef4444` |
| Eutrophication | Verde/Algas | `#22c55e` |
| Acidification | Amarillo/Acido | `#eab308` |
| Water use | Azul/Agua | `#3b82f6` |
| Land use | Marron/Tierra | `#92400e` |
| Particulate matter | Gris/Polvo | `#6b7280` |
| Ecotoxicity | Purpura/Toxico | `#a855f7` |
| Human toxicity | Naranja/Peligro | `#f97316` |

**Razon**: Los colores semanticos ayudan a la interpretacion inmediata sin necesidad de leer la leyenda. Es consistente con la psicologia del color ambiental.

### 6. API: nuevo query param `?categoria=` para rankings

**Decision**: `GET /stats/global?anio=2024&categoria=climate-change` filtra los rankings de provincia y poblacion por esa categoria. Sin el parametro, se usa `impacto_total` (suma de las 8 categorias) como fallback.

**Razon**: Permitir al usuario explorar "que provincia tiene peor huella de carbono" vs "que provincia tiene peor uso de agua" sin recargar toda la pagina.

## Risks / Trade-offs

- **[Riesgo] Nombres de categoria no coinciden exactamente**: Si los datos reales en `datos[].category` tienen nombres ligeramente distintos a la constante `EF_CATEGORIES` (ej: "Climate change" vs "Climate Change" vs "Cambio climatico"). → **Mitigacion**: Hacer `trim().toLowerCase()` en la comparacion. Si se detectan discrepancias en produccion, anadir un mapeo de alias en la constante.

- **[Riesgo] Stacked area chart con 8 categorias puede ser ilegible**: 8 capas apiladas en un area chart pueden solaparse. → **Mitigacion**: El stacked area muestra area total con tooltip interactivo; los sparklines en small multiples complementan mostrando cada categoria individualmente. El usuario puede hacer hover para ver valores exactos.

- **[Riesgo] Heatmap con muchas provincias**: Si hay 50 provincias, el heatmap puede ser denso. → **Mitigacion**: Mostrar solo top 15 provincias por impacto total en el heatmap. El resto son accesibles via la tabla de ranking.

- **[Trade-off] Se pierde la granularidad por proceso**: Antes se podia ver "el impacto de fertilizantes vs pesticidas". → Esto sigue disponible en el modulo `compare` (que es el contexto adecuado para comparar practicas agricolas). Las estadisticas globales deben comunicar impacto ambiental, no practicas agricolas.

## Open Questions

- Los nombres exactos de las 8 categorias EF 3.1 en los datos reales del Capture ACV Service deben verificarse contra datos de produccion. Usar los nombres en ingles del estandar EF 3.1 como base, con normalizacion case-insensitive.
