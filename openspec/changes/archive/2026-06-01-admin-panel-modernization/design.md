## Context

El panel de administración (`admin.route.tsx`) es un componente monolítico de ~600 líneas que gestiona 7 entidades mediante operaciones CRUD. La interfaz es funcional pero básica: tabla zebra estándar, paginación que muestra todas las páginas, y formularios con campos de texto para IDs. El stack es React 19 + TypeScript + Tailwind CSS v4 + daisyUI 5.5 con tema `lemonade`.

No existen specs previos en el proyecto. Todo el frontend relevante está en `web/`. No se modifican APIs backend.

## Goals / Non-Goals

**Goals:**
- Modernizar la apariencia visual manteniendo coherencia con daisyUI y el tema lemonade
- Implementar paginación compacta con ventana deslizante y salto directo
- Sustituir campos de ID libres por un selector con búsqueda asistida
- Extraer componentes reutilizables del monolito (`SmartPagination`, `IdLookupField`)
- Mantener compatibilidad total con los endpoints existentes

**Non-Goals:**
- No se modifica el backend ni los endpoints API
- No se añaden nuevas dependencias npm
- No se cambia la arquitectura de estado (se mantiene `useState` + `fetch`)
- No se extrae el componente admin completo en subcomponentes (solo lo necesario para paginación y lookup)
- No se modifica el tema lemonade ni los estilos globales de la app

## Decisions

### D1: Mantener el componente en un solo archivo con subcomponentes internos

**Alternativa**: refactorizar en módulos separados (`AdminTable`, `AdminModal`, etc.)
**Decisión**: mantener `admin.route.tsx` como archivo principal, extrayendo únicamente `SmartPagination` y `IdLookupField` como funciones helper internas o componentes en el mismo directorio.
**Razón**: el componente está cohesionado (comparte estado, config, handlers). Una refactorización completa excede el alcance. Extraer solo paginación y lookup minimiza riesgo.

### D2: Paginación con ventana deslizante de 5 botones + campo de salto

**Alternativa**: paginación con solo botones Prev/Next, o paginación con ellipsis pero sin input de salto.
**Decisión**: ventana de 5 páginas visibles alrededor de la actual, ellipsis («...») para indicar páginas ocultas, botones «/» para saltar a extremos, e input numérico para salto directo a cualquier página.
**Razón**: el usuario pidió explícitamente "solo unas pocas páginas y una opción de ir a la página". La ventana + input cubre ambos requisitos sin perder navegabilidad.

### D3: Minibuscador como dropdown con búsqueda textual

**Alternativa**: modal completo con tabla de selección, o autocomplete inline.
**Decisión**: implementar un dropdown/buscador inline que al hacer clic muestre una lista filtrable de opciones (ID + nombre/representación textual). Para cada campo FK se define la entidad referenciada y el endpoint de búsqueda.
**Razón**: más ligero que un modal, más interactivo que un autocomplete puro. Permite ver múltiples opciones simultáneamente y buscar por nombre.

### D4: Mapeo de campos FK a entidades referenciadas

Se define un mapa `FK_REFERENCES` que asocia cada campo de formulario que es FK con la entidad de referencia y el campo de búsqueda:

| Campo FK | Entidad referenciada | Campo display |
|---|---|---|
| `idPropietario` (parcelas) | `usuarios` | `nombre` + `apellidos` |
| `idPoblacion` (parcelas) | `poblaciones` | `nombre` |
| `idParcela` (cultivos) | `parcelas` | `nombre` |
| `idPais` (provincias) | `paises` | `nombre` |
| `idProvincia` (poblaciones) | `provincias` | `nombre` |

Los campos que no están en este mapa (`id` de metodos-impacto, `nombre`, `email`, etc.) mantienen su comportamiento actual como input normal.

### D5: Estilizado con daisyUI existente sin CSS adicional

**Alternativa**: añadir CSS custom o usar otra librería de componentes.
**Decisión**: usar exclusivamente clases de Tailwind CSS v4 y daisyUI 5.5 ya disponibles en el proyecto. Mejoras visuales mediante combinaciones de clases existentes (sombras, tarjetas, badges, transiciones).
**Razón**: sin nuevas dependencias, consistencia visual garantizada con el resto de la app.

## Risks / Trade-offs

- **[Riesgo] El componente admin.route.tsx supera las 600 líneas → más difícil de mantener.**
  Mitigación: la extracción de `SmartPagination` e `IdLookupField` reduce parcialmente la complejidad. Una refactorización completa queda para otro cambio.

- **[Riesgo] El minibuscador carga todas las opciones del endpoint sin paginar → posible lentitud con muchos registros.**
  Mitigación: las entidades referenciadas (paises, provincias, poblaciones) suelen tener volúmenes manejables (<1000 registros). Si fuese necesario, se puede añadir búsqueda server-side usando el parámetro `search` ya existente.

- **[Trade-off] La paginación con input de salto requiere validación de rango.**
  Se implementa validación client-side simple (clamp entre 1 y totalPages). Si el usuario introduce un valor inválido, se ignora o se ajusta automáticamente.

## Migration Plan

1. No hay migración de datos ni cambios en APIs.
2. El cambio es puramente de frontend.
3. Despliegue: build de Vite (`npm run build`) y servir los nuevos assets estáticos.
4. Rollback: revertir a la versión anterior del build.
5. No requiere cambios en base de datos ni en el backend Go.

## Open Questions

- Ninguna. El alcance está bien definido por los requisitos del usuario.
