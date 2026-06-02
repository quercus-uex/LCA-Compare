## ADDED Requirements

### Requirement: Tabla de datos con estética modernizada
La tabla de administración SHALL presentar un diseño visual renovado usando exclusivamente clases de daisyUI 5.5 y Tailwind CSS v4, manteniendo el tema `lemonade` activo.

#### Scenario: Tabla con estilo mejorado
- **WHEN** el administrador navega a cualquier pestaña del panel de administración
- **THEN** la tabla SHALL mostrar filas con estilo zebra mejorado, encabezados con fondo diferenciado, bordes redondeados en el contenedor, y espaciado vertical consistente entre celdas

#### Scenario: Fila con hover visible
- **WHEN** el usuario pasa el cursor sobre una fila de la tabla
- **THEN** la fila SHALL resaltar visualmente con un cambio de color de fondo sutil usando clases daisyUI de hover

#### Scenario: Estado de carga con skeleton
- **WHEN** los datos se están cargando desde el servidor
- **THEN** la tabla SHALL mostrar un esqueleto (skeleton) con animación de pulso en lugar de la tabla vacía

#### Scenario: Estado vacío con iconografía
- **WHEN** no hay registros que mostrar (ni por búsqueda ni por ausencia de datos)
- **THEN** el panel SHALL mostrar un mensaje centrado con estilo mejorado indicando "Sin resultados" o "Sin registros" según corresponda

### Requirement: Barra de pestañas con diseño modernizado
Las pestañas de navegación entre entidades SHALL tener un diseño visual mejorado con separación clara entre tabs, indicador de pestaña activa prominente, y transiciones suaves al cambiar.

#### Scenario: Pestaña activa destacada
- **WHEN** el administrador selecciona una pestaña
- **THEN** la pestaña activa SHALL mostrarse con un indicador visual claramente distinguible (borde inferior o color de fondo resaltado) que la diferencie de las inactivas

#### Scenario: Transición suave entre pestañas
- **WHEN** el administrador cambia de una pestaña a otra
- **THEN** el contenido SHALL actualizarse con los datos de la nueva entidad sin parpadeo brusco, usando el skeleton de carga durante la transición

### Requirement: Cabecera con búsqueda y botón de creación mejorados
La barra superior del panel SHALL mostrar el título de la entidad activa, un campo de búsqueda con placeholder contextual, y un botón de creación con icono y estilo destacado.

#### Scenario: Búsqueda con placeholder contextual
- **WHEN** el administrador ve la barra de búsqueda
- **THEN** el placeholder del input SHALL indicar el contexto (ej: "Buscar usuarios...", "Buscar parcelas...") en lugar de un texto genérico

#### Scenario: Botón de creación con estilo primario
- **WHEN** el administrador quiere crear un nuevo registro
- **THEN** el botón "+ Nuevo" SHALL tener un estilo visual destacado (btn-primary) que lo haga fácilmente localizable en la interfaz

### Requirement: Modal de edición/creación con diseño modernizado
Los modales de creación y edición SHALL tener encabezado con título descriptivo, campos agrupados con etiquetas claras, separación visual entre el formulario y los botones de acción, y transición de apertura/cierre suave.

#### Scenario: Modal con estructura clara
- **WHEN** el administrador abre un modal de creación o edición
- **THEN** el modal SHALL mostrar el título con el nombre de la entidad, los campos del formulario en una columna con etiquetas sobre cada input, y los botones de acción (Cancelar/Guardar) alineados a la derecha en la parte inferior

#### Scenario: Cierre de modal por backdrop
- **WHEN** el administrador hace clic fuera del modal (en el backdrop)
- **THEN** el modal SHALL cerrarse y restaurar el estado del formulario a sus valores por defecto

#### Scenario: Modal con transición de apertura
- **WHEN** el modal se abre
- **THEN** SHALL aparecer con una transición visual suave (fade-in del backdrop y escala del modal) en lugar de aparecer instantáneamente

### Requirement: Indicador de total de registros
El panel SHALL mostrar el número total de registros de la entidad activa en un lugar visible de la interfaz.

#### Scenario: Contador visible en la cabecera o junto a la paginación
- **WHEN** el administrador visualiza cualquier entidad con datos
- **THEN** el número total de registros SHALL ser visible, permitiendo al administrador conocer el volumen de datos sin necesidad de contar las páginas
