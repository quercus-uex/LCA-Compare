## ADDED Requirements

### Requirement: Campo de formulario con minibuscador para claves foráneas
Los campos de formulario que representan claves foráneas (IDs que referencian otras entidades) SHALL mostrar un componente de búsqueda/selector en lugar de un campo de texto libre. El componente SHALL permitir buscar y seleccionar visualmente el registro referenciado.

#### Scenario: Renderizado del minibuscador en vez de input de texto
- **WHEN** el formulario de creación o edición contiene un campo de tipo FK (ej: `idPais`, `idProvincia`, `idPoblacion`, `idPropietario`, `idParcela`)
- **THEN** en lugar de un `<input type="text">` estándar, SHALL renderizarse el componente `IdLookupField` que muestra el valor seleccionado o un placeholder indicando "Buscar..."

#### Scenario: Apertura del desplegable de búsqueda
- **WHEN** el administrador hace clic en el campo del minibuscador
- **THEN** SHALL desplegarse una lista de opciones con los registros disponibles de la entidad referenciada, mostrando al menos el identificador y un texto representativo (nombre)

#### Scenario: Búsqueda textual en el minibuscador
- **WHEN** el administrador escribe texto en el campo de búsqueda del minibuscador
- **THEN** la lista de opciones SHALL filtrarse en tiempo real mostrando solo los registros cuyo texto representativo contenga el término de búsqueda (filtrado case-insensitive)

#### Scenario: Selección de un registro
- **WHEN** el administrador hace clic en una opción de la lista desplegada
- **THEN** el valor del ID seleccionado SHALL asignarse al campo del formulario, el desplegable SHALL cerrarse, y el campo SHALL mostrar el texto representativo del registro seleccionado en lugar del ID numérico

#### Scenario: Limpiar selección
- **WHEN** el administrador tiene un registro seleccionado y hace clic en un botón de limpiar/cerrar (X) en el minibuscador
- **THEN** la selección SHALL eliminarse, el valor del campo SHALL quedar vacío, y el minibuscador SHALL volver a mostrar el placeholder "Buscar..."

### Requirement: Carga asíncrona de opciones desde la API
El minibuscador SHALL cargar las opciones disponibles desde el endpoint de administración correspondiente a la entidad referenciada.

#### Scenario: Carga inicial de opciones
- **WHEN** el minibuscador se monta en el DOM
- **THEN** SHALL realizar una petición GET a `/api/admin/{entidad-referenciada}` sin paginación (o con un límite alto) para obtener todas las opciones disponibles y mostrarlas en el desplegable

#### Scenario: Indicador de carga durante la petición
- **WHEN** la petición de opciones está en curso
- **THEN** el minibuscador SHALL mostrar un indicador de carga (spinner o skeleton) en lugar de la lista de opciones

#### Scenario: Error al cargar opciones
- **WHEN** la petición de opciones falla
- **THEN** el minibuscador SHALL mostrar un mensaje de error ("Error al cargar opciones") y permitir reintentar

### Requirement: Mapeo de campos FK a entidades
El sistema SHALL mantener una configuración que asocie cada campo FK con su entidad referenciada, el endpoint de búsqueda, y los campos a mostrar como texto representativo.

#### Scenario: Configuración de mapeo FK
- **WHEN** el componente `IdLookupField` recibe un nombre de campo (ej: `idPais`)
- **THEN** SHALL consultar el mapeo FK para determinar que debe buscar en la entidad `paises`, usando el endpoint `/api/admin/paises`, y mostrar el campo `nombre` como texto representativo

#### Scenario: Campo no FK mantiene comportamiento estándar
- **WHEN** un campo del formulario no está definido en el mapeo FK (ej: `nombre`, `email`, `sigpac`)
- **THEN** SHALL renderizarse como un `<input>` estándar con el comportamiento actual, sin minibuscador

### Requirement: Compatibilidad con el flujo de envío del formulario
El minibuscador SHALL integrarse con el sistema de formularios existente basado en `useState<Record<string, string>>`, manteniendo la compatibilidad con `getSubmitBody()` y `handleSubmit()`.

#### Scenario: Valor del formulario actualizado al seleccionar
- **WHEN** el administrador selecciona un registro del minibuscador
- **THEN** el estado `form` SHALL actualizarse con el ID seleccionado como string en el campo correspondiente, igual que si se hubiera escrito manualmente en un input de texto

#### Scenario: Valor del formulario enviado correctamente
- **WHEN** el administrador envía el formulario tras seleccionar un ID mediante el minibuscador
- **THEN** el cuerpo de la petición (POST/PUT) SHALL contener el ID correcto, sin diferencias respecto al comportamiento actual con input de texto

### Requirement: Pre-relleno en modo edición
El minibuscador SHALL mostrar el valor actual del registro cuando se abre en modo edición, incluyendo el texto representativo además del ID.

#### Scenario: Edición de registro existente con FK
- **WHEN** el administrador abre el modal de edición para un registro que tiene un campo FK con valor (ej: una parcela con `idPropietario = 5`)
- **THEN** el minibuscador SHALL mostrar el texto representativo del propietario (ej: "Juan Pérez") precargado, y el ID subyacente SHALL estar disponible en el estado del formulario
