## 1. Smart Pagination Component

- [x] 1.1 Crear componente `SmartPagination` en `web/src/routes/admin/` que acepte props: `page`, `totalPages`, `total`, `onPageChange`
- [x] 1.2 Implementar lógica de ventana deslizante: mostrar máximo 5 páginas visibles con elipsis cuando haya más de 5 páginas totales
- [x] 1.3 Mostrar botones de navegación: primera página, anterior, siguiente, última página (con disabled donde aplique)
- [x] 1.4 Añadir input numérico de salto directo a página con validación de rango (clamp) al presionar Enter
- [x] 1.5 Mostrar texto informativo: "X resultados · Página Y de Z"
- [x] 1.6 Sustituir la paginación inline actual en `admin.route.tsx` por el nuevo componente `SmartPagination`

## 2. ID Lookup Field Component

- [x] 2.1 Crear componente `IdLookupField` en `web/src/routes/admin/` con props: `name`, `value`, `onChange`, `fkConfig` (entidad referenciada, campo display, endpoint), `disabled`
- [x] 2.2 Definir mapa `FK_REFERENCES` que asocie cada campo FK con su entidad referenciada: `idPropietario→usuarios`, `idPoblacion→poblaciones`, `idParcela→parcelas`, `idPais→paises`, `idProvincia→provincias`
- [x] 2.3 Implementar carga asíncrona de opciones desde `GET /api/admin/{entidad}` con indicador de carga y manejo de errores
- [x] 2.4 Implementar dropdown con búsqueda textual (filtrado client-side case-insensitive) y lista de opciones mostrando ID + texto representativo
- [x] 2.5 Implementar selección: al elegir una opción, actualizar `form[name]` con el ID seleccionado y mostrar el texto representativo en el campo
- [x] 2.6 Implementar botón de limpiar selección (X) para vaciar el campo
- [x] 2.7 Implementar pre-relleno en modo edición: al abrir modal con valor FK existente, cargar y mostrar el texto representativo
- [x] 2.8 Integrar `IdLookupField` en el modal de admin.route.tsx para campos FK; mantener input estándar para el resto de campos

## 3. Admin Panel UI Modernization

- [x] 3.1 Mejorar estilo de la tabla: encabezados con fondo diferenciado, bordes redondeados en el contenedor, hover más visible en filas
- [x] 3.2 Mejorar estilo de las pestañas (tabs): indicador de pestaña activa más prominente, transición suave
- [x] 3.3 Mejorar estilo de la cabecera: placeholder contextual en el buscador (ej: "Buscar usuarios..."), botón "+ Nuevo" más destacado
- [x] 3.4 Mejorar estilo del modal: encabezado con título descriptivo, campos agrupados con separación visual del formulario y botones, transición fade-in/scale
- [x] 3.5 Mejorar estados de carga y vacío: skeleton animado durante carga, mensaje centrado con estilo mejorado para estado vacío
- [x] 3.6 Añadir indicador de total de registros visible (junto a la cabecera o integrado con la paginación)

## 4. Integration and Verification

- [x] 4.1 Verificar que el flujo CRUD completo funciona para todas las entidades (crear, editar con FK, eliminar) sin errores
- [x] 4.2 Verificar que la paginación funciona correctamente con diferentes volúmenes de datos (1 página, pocas páginas, muchas páginas)
- [x] 4.3 Verificar que el reinicio de página al cambiar de pestaña o buscar funciona correctamente
- [x] 4.4 Verificar que el diseño es responsive y se ve correctamente en diferentes tamaños de pantalla
- [x] 4.5 Ejecutar typecheck (`npx tsc --noEmit`) y build (`npm run build`) sin errores
