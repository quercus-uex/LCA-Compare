## Why

Actualmente la card "Perfil de Impacto por Provincia" solo permite seleccionar provincias mediante un `<select>` nativo, lo que resulta incómodo cuando hay decenas de provincias en la lista. Además, no existe forma de visualizar el perfil de impacto a nivel de población. Los usuarios necesitan poder buscar rápidamente tanto provincias como poblaciones por nombre y alternar entre ambos niveles geográficos desde la misma card.

## What Changes

- Añadir un toggle Provincia/Población en la card del spider chart
- Reemplazar los `<select>` nativos por un buscador con autocompletado (combobox) que filtre localmente mientras el usuario escribe
- El spider chart se adaptará para mostrar datos de población cuando esté activo el modo Población
- El buscador soportará comparación (seleccionar una segunda entidad para overlay en el radar)

## Capabilities

### New Capabilities
- `searchable-location-select`: Componente reutilizable de búsqueda con autocompletado para seleccionar provincias o poblaciones por nombre. Reemplaza a los `<select>` nativos en la card del spider chart.

### Modified Capabilities
- `stats-spider-chart`: La card de perfil de impacto permitirá alternar entre modo Provincia y modo Población. El selector de entidades usará un buscador tipográfico en lugar de un `<select>`. Las fuentes de datos aceptarán tanto `ProvinciaRankingItemDto[]` como `PoblacionRankingItemDto[]`.

## Impact

- **Frontend**: `web/src/stats/stats-spider-chart.component.tsx` (refactor principal), nuevo componente `searchable-location-select.component.tsx`, `web/src/routes/stats/stats.route.tsx` (pasar ranking de poblaciones al spider chart)
- **Backend**: Sin cambios (los datos ya vienen en `GlobalStatsDto`)
- **APIs**: Sin cambios
- **Dependencias**: Sin nuevas dependencias externas
