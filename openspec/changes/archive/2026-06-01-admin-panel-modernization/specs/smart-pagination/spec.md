## ADDED Requirements

### Requirement: Ventana deslizante de páginas
La paginación SHALL mostrar un máximo de 5 botones de página visibles simultáneamente, centrados alrededor de la página actual, con elipsis para indicar páginas ocultas.

#### Scenario: Menos de 5 páginas totales
- **WHEN** el total de páginas es 4
- **THEN** la paginación SHALL mostrar botones para las páginas 1, 2, 3, 4 sin elipsis

#### Scenario: Página actual al inicio con muchas páginas
- **WHEN** hay 50 páginas y la página actual es la 1
- **THEN** la paginación SHALL mostrar los botones 1, 2, 3, 4, 5 seguidos de elipsis (...) y el botón de última página (50)

#### Scenario: Página actual en el medio con muchas páginas
- **WHEN** hay 50 páginas y la página actual es la 25
- **THEN** la paginación SHALL mostrar el botón de primera página (1), elipsis, los botones 23, 24, 25, 26, 27, elipsis, y el botón de última página (50)

#### Scenario: Página actual al final con muchas páginas
- **WHEN** hay 50 páginas y la página actual es la 50
- **THEN** la paginación SHALL mostrar el botón de primera página (1), elipsis, y los botones 46, 47, 48, 49, 50

### Requirement: Botones de navegación de extremos
La paginación SHALL incluir botones para navegar a la primera y última página, y botones para avanzar y retroceder una página.

#### Scenario: Navegación a página anterior
- **WHEN** el administrador hace clic en el botón de página anterior («) y la página actual no es la primera
- **THEN** la página actual SHALL decrementar en 1 y los datos SHALL recargarse

#### Scenario: Botón de página anterior deshabilitado en primera página
- **WHEN** la página actual es la primera página
- **THEN** el botón de página anterior («) SHALL mostrarse deshabilitado (atributo disabled)

#### Scenario: Navegación a página siguiente
- **WHEN** el administrador hace clic en el botón de página siguiente (») y la página actual no es la última
- **THEN** la página actual SHALL incrementar en 1 y los datos SHALL recargarse

#### Scenario: Botón de página siguiente deshabilitado en última página
- **WHEN** la página actual es la última página
- **THEN** el botón de página siguiente (») SHALL mostrarse deshabilitado

#### Scenario: Navegación directa a primera página
- **WHEN** se muestra el botón de primera página y el administrador hace clic en él
- **THEN** la página actual SHALL cambiar a 0 y los datos SHALL recargarse

#### Scenario: Navegación directa a última página
- **WHEN** se muestra el botón de última página y el administrador hace clic en él
- **THEN** la página actual SHALL cambiar a la última página disponible y los datos SHALL recargarse

### Requirement: Campo de salto directo a página
La paginación SHALL incluir un campo de entrada numérico que permita al administrador saltar directamente a una página específica.

#### Scenario: Salto a página válida
- **WHEN** el administrador introduce un número de página válido (entre 1 y el total de páginas) y presiona Enter
- **THEN** la página actual SHALL cambiar a la página indicada (restando 1 para índice 0) y los datos SHALL recargarse

#### Scenario: Salto a página inválida
- **WHEN** el administrador introduce un número menor que 1 o mayor que el total de páginas
- **THEN** el valor SHALL ajustarse automáticamente al rango válido (clamp a 1 o al máximo) al presionar Enter

#### Scenario: Campo de salto oculto cuando hay una sola página
- **WHEN** el total de páginas es 1
- **THEN** el campo de salto directo y los botones de navegación SHALL ocultarse, mostrando solo el texto informativo de resultados

### Requirement: Información textual de paginación
La paginación SHALL mostrar un texto descriptivo con el número total de resultados, la página actual y el total de páginas.

#### Scenario: Texto informativo visible
- **WHEN** hay datos paginados
- **THEN** el texto SHALL mostrar el formato "X resultados · Página Y de Z" donde X es el total de registros, Y la página actual (1-indexed), y Z el total de páginas

### Requirement: Reinicio de página al cambiar de pestaña o buscar
La página actual SHALL reiniciarse a 0 cuando el administrador cambia de pestaña o modifica el texto de búsqueda.

#### Scenario: Reinicio al cambiar de pestaña
- **WHEN** el administrador cambia de una pestaña a otra
- **THEN** la página actual SHALL volver a 0 y los datos de la nueva entidad SHALL cargarse desde la primera página

#### Scenario: Reinicio al modificar búsqueda
- **WHEN** el administrador escribe en el campo de búsqueda
- **THEN** la página actual SHALL volver a 0 y los resultados filtrados SHALL mostrarse desde la primera página
