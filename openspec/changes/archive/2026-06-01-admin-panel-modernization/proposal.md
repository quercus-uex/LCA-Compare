## Why

El panel de administración actual es funcional pero tiene una interfaz anticuada y presenta limitaciones de usabilidad que ralentizan el trabajo diario de los administradores. La paginación muestra todas las páginas disponibles sin límite, lo que ensucia la interfaz con datasets grandes, y los campos de ID en los formularios de edición son propensos a errores humanos al requerir escribir identificadores manualmente.

## What Changes

- **Rediseño visual del panel de administración**: modernización de la apariencia de la tabla, modales, pestañas y controles manteniendo el tema `lemonade` de daisyUI y Tailwind CSS como base estética.
- **Paginación compacta con acceso directo**: sustitución de la paginación que muestra todas las páginas por una versión con rango limitado de botones (ventana deslizante) y un campo para saltar directamente a una página concreta.
- **Minibuscador de IDs en formularios**: sustitución de los campos de texto libre para IDs por un componente de búsqueda/asistencia que permita localizar y seleccionar visualmente el ID referenciado, eliminando la necesidad de memorizar o copiar identificadores.

## Capabilities

### New Capabilities
- `admin-panel-ui-modernization`: renovación estética del panel de administración completo (tabla, modales, pestañas, controles de búsqueda y paginación) manteniendo coherencia con daisyUI lemonade y Tailwind CSS.
- `smart-pagination`: componente de paginación que muestra un rango limitado de páginas con ventana deslizante, botones de navegación y un campo de salto directo a página.
- `id-lookup-field`: componente de campo de formulario con minibuscador integrado para seleccionar IDs referenciados de forma visual e interactiva en los modales de creación/edición.

### Modified Capabilities
<!-- No se modifican specs existentes (no hay specs previos en el proyecto). -->

## Impact

- **Código afectado**: `web/src/routes/admin/admin.route.tsx` (componente monolítico del panel de administración, ~600 líneas).
- **Nuevos componentes**: componentes extraídos de `admin.route.tsx` para paginación y campo de búsqueda de IDs, manteniendo el mismo stack (React 19, TypeScript, Tailwind CSS v4, daisyUI 5.5, react-icons/fa6).
- **APIs**: sin cambios. Los endpoints GET/POST/PUT/DELETE de `/api/admin/*` permanecen igual. El minibuscador consumirá los mismos endpoints de listado ya existentes.
- **Dependencias**: sin nuevas dependencias externas.
