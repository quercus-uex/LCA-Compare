## Context

La página de estadísticas (`/estadisticas`) muestra una card "Perfil de Impacto por Provincia" con un spider/radar chart que permite seleccionar una o dos provincias mediante `<select>` nativos. Estos dropdowns se vuelven difíciles de usar con listas largas. Además, el ranking de poblaciones también se recibe del backend pero no se aprovecha en el spider chart.

El ranking de provincias y poblaciones ya se obtiene completo en una sola llamada `GET /stats/global`, por lo que no se requieren cambios en el backend. La búsqueda será local (client-side).

## Goals / Non-Goals

**Goals:**
- Permitir alternar entre modo "Provincia" y "Población" en la card del spider chart
- Reemplazar los `<select>` por un input de búsqueda con dropdown de sugerencias
- Mantener la funcionalidad de comparación (superponer 2 entidades en el radar)
- Usar los datos ya disponibles en `GlobalStatsDto` sin nuevas llamadas API

**Non-Goals:**
- No se modifica el backend ni se añaden nuevos endpoints
- No se añaden filtros geográficos globales a la página de estadísticas (solo afecta al spider chart)
- No se implementa filtro por país (solo provincia y población)
- No se añaden dependencias externas nuevas

## Decisions

### Decisión 1: Búsqueda local vs búsqueda remota

**Elegido**: Búsqueda local (client-side) sobre los datos ya cargados.

**Alternativa considerada**: Usar `useLocation().getPoblacionesByName()` para buscar contra el backend.

**Razón**: Los rankings ya incluyen todas las provincias y poblaciones con datos de impacto. Una búsqueda remota devolvería entidades sin datos de impacto (poblaciones sin cultivos), que no serían útiles para el spider chart. La búsqueda local es instantánea y no requiere red.

### Decisión 2: Componente encapsulado vs inline en el spider chart

**Elegido**: Crear un componente `SearchableLocationSelect` reutilizable.

**Alternativa considerada**: Implementar la lógica de búsqueda directamente en `StatsSpiderChart`.

**Razón**: La lógica de filtrado, debounce, dropdown y teclado es lo suficientemente compleja como para justificar un componente separado. Facilita pruebas y posible reutilización futura.

### Decisión 3: Interfaz del componente SearchableLocationSelect

**Elegido**: Un input de texto con dropdown de resultados filtrados, comportamiento de combobox accesible por teclado.

Props:
- `items: T[]` — lista de entidades (ProvinciaRankingItemDto o PoblacionRankingItemDto)
- `value: T | null` — entidad seleccionada
- `onChange: (item: T | null) => void` — callback al seleccionar
- `getLabel: (item: T) => string` — función para extraer el texto a mostrar y buscar
- `placeholder?: string` — placeholder del input
- `emptyMessage?: string` — mensaje cuando no hay resultados

Comportamiento:
- Al escribir, filtra `items` por `getLabel` (case-insensitive, partial match)
- Muestra hasta 10 resultados en un dropdown posicionado debajo del input
- Navegación por teclado: flechas arriba/abajo + Enter para seleccionar, Escape para cerrar
- Click fuera cierra el dropdown
- Al seleccionar, muestra el label en el input y emite `onChange`
- Permite limpiar la selección (botón X)

**Alternativa considerada**: Usar DaisyUI `dropdown` con un `<ul>` de items.

**Razón**: DaisyUI dropdown no soporta bien el filtrado dinámico ni accesibilidad de teclado. Un componente controlado con estado explícito es más robusto.

### Decisión 4: Toggle Provincia/Población

**Elegido**: Un par de botones tipo tab (DaisyUI `btn-group` o `tabs`) dentro de la card del spider chart.

**Alternativa considerada**: Un `<select>` para elegir el modo.

**Razón**: Solo hay 2 opciones, un toggle visual es más directo y ocupa menos espacio que un dropdown.

### Decisión 5: Adaptación del spider chart para Población

**Elegido**: El spider chart operará sobre una abstracción común. Se creará un tipo unión o se normalizarán las entradas a una interfaz común con `nombre`, `impactoTotalMedio`, `impactosPorCategoria`.

**Alternativa considerada**: Duplicar la lógica del spider chart para población.

**Razón**: Duplicar código es peor. La estructura de `ProvinciaRankingItemDto` y `PoblacionRankingItemDto` ya comparten los campos relevantes (`impactoTotalMedio`, `impactosPorCategoria`). Solo difiere el nombre (`nombreProvincia` vs `nombrePoblacion`).

## Risks / Trade-offs

- **[Riesgo] Muchas entidades en el DOM**: Si hay cientos de provincias/poblaciones, el dropdown podría ser pesado. → **Mitigación**: Limitar resultados visibles a 10 y usar virtualización solo si es necesario.
- **[Riesgo] UX en móvil**: El buscador con dropdown puede ser incómodo en pantallas pequeñas. → **Mitigación**: El dropdown se posiciona con `absolute` y se asegura que no se salga del viewport. Se puede mejorar más adelante.
- **[Trade-off] Sin búsqueda remota**: Si una población no tiene cultivos en el año/categoría seleccionados, no aparecerá en el ranking. Esto es intencional: solo mostramos entidades con datos de impacto.
