---
sidebar_label: 'Uso'
sidebar_position: 3
---

# Uso

LCA-Compare recibe los resultados de ACV que calcula **LCA Bridge**. Cuando llega el primer cálculo de un usuario, se
crea su cuenta y, si el envío de correo está configurado, recibe un correo con su contraseña de acceso. No hay registro
público; el resto de cuentas las crea un administrador.

El correo es este:

```text
Asunto: Alta en LCA-Compare

Has sido dado de alta en LCA-Compare. Tu contraseña es <contraseña>.
```

La interfaz está disponible en español, inglés y portugués. Puedes cambiar el idioma desde el selector de la barra de
navegación y la elección se conserva entre sesiones.

## Visualizar resultados de ACV de una parcela

Para visualizar las parcelas de tu usuario, con la sesión iniciada selecciona *Mis parcelas* en la barra de navegación
(en pantallas estrechas, dentro del menú ☰).

<p align="center">
    <img src="/img/acv-compare/mis_parcelas.png" alt="Mis parcelas" width="600"/>
</p>

<p align="center">
    <img src="/img/acv-compare/mis_parcelas_ruta.png" alt="Vista de mis parcelas" width="600"/>
</p>

El listado muestra cada parcela con su municipio, su cultivo actual, la superficie y el número de campañas. Puedes
buscar por nombre, identificador (SIGPAC, referencia catastral o ID predial) o municipio, filtrar por cultivo actual,
por municipio o solo las parcelas de referencia, y ordenar por nombre, última campaña o superficie. Las parcelas se
pueden ver como tarjetas, como tabla o sobre un mapa, donde cada una se colorea según su cultivo actual. La búsqueda,
los filtros y la vista se guardan en la dirección de la página, así que se conservan al volver desde el detalle de una
parcela.

Al abrir una parcela se muestra un mapa con su polígono (con capa de calles o de satélite), su municipio, sus
identificadores, los datos de su cultivo actual y el historial de todas sus campañas. Si la parcela tiene más de una
campaña, una gráfica muestra la evolución de la producción, el rendimiento, el consumo de agua o el impacto total de
cualquier categoría EF 3.1. **Comparar esta parcela** abre el comparador con la parcela precargada como conjunto
objetivo o de referencia. Las parcelas marcadas por un administrador como **parcelas de referencia** se identifican con
la etiqueta «Referencia» junto a su nombre. Si no se pudo determinar la ubicación de la parcela al recibirla, en lugar
del mapa se muestra «Ubicación no disponible»; esas parcelas no aparecen en la vista de mapa del listado ni en los
filtros por ubicación geográfica del comparador.

<p align="center">
    <img src="/img/acv-compare/parcela_ejemplo.png" alt="Ejemplo de parcela" width="600"/>
</p>

Al pulsar **Ver impactos** en el cultivo actual o en cualquier campaña del historial, se muestran los resultados de ACV
de esa campaña: el impacto total de cada categoría y una barra con su reparto entre fertilizantes, manejo de cultivo,
pesticidas y sistema de riego. En pantallas anchas la tabla muestra también el valor de cada etapa; el detalle completo
está siempre en la exportación. Desde esta vista también puedes exportar el resultado en JSON o CSV y usar **Comparar
esta parcela**.

<p align="center">
    <img src="/img/acv-compare/acv_parcela.png" alt="ACV de una parcela" width="600"/>
</p>

## Comparador de ACV

El comparador se abre desde **Comparador** en la barra de navegación.

<p align="center">
    <img src="/img/acv-compare/boton_comparador.png" alt="Botón Comparador en la barra de navegación" width="600"/>
</p>

Compara dos conjuntos de cultivos, cada uno definido por estos filtros:

- País
- Provincia
- Población
- Parcelas (tus propias parcelas; requiere sesión iniciada)
- Ubicación (punto seleccionado en un mapa y radio en metros; incluye todas las campañas de las parcelas dentro del
  radio)
- Tipo de cultivo
- Año de campaña (inicio o fin; a partir de 2020)
- **Solo parcelas de referencia**: limita el conjunto a las parcelas marcadas como de referencia
- **Organización**: limita el conjunto a las campañas que los miembros de tu organización te han consentido (solo
  aparece si administras alguna; ver [Organizaciones](#organizaciones))

El filtro de parcelas de referencia puede aplicarse a cualquiera de los dos conjuntos y se combina con el resto de filtros. Una **parcela de
referencia** es una parcela que un administrador ha marcado como dato validado; no debe confundirse con el
**conjunto de Referencia**, que es el conjunto obligatorio de la comparativa.

El conjunto de **Referencia** es obligatorio. Si solo se especifica la referencia, se mostrarán los valores medios de
impacto del conjunto. Si también se especifica un conjunto **Objetivo**, se calculará para cada categoría la diferencia
porcentual del objetivo respecto a la referencia.

Los valores son por kg de producto. El valor de cada conjunto es la **media simple** de sus campañas: cada campaña
cuenta igual, sin ponderar por producción ni superficie. Cada categoría se promedia solo con las campañas que la
incluyen, de modo que una categoría ausente en una campaña no cuenta como 0.

La **Referencia** es la línea base y el **Objetivo** es el conjunto que se evalúa frente a ella:

```
Diferencia (%) = (objetivo − referencia) / |referencia| × 100
```

- Un valor **positivo** (en rojo) indica que el objetivo tiene **más** impacto que la referencia. Por ejemplo, +20 %
  significa que el objetivo supera en un 20 % el impacto de la referencia.
- Un valor **negativo** (en verde) indica que el objetivo tiene **menos** impacto que la referencia.
- Se muestra **n/a** cuando el valor de referencia es 0 o la categoría no tiene datos en el objetivo.

<p align="center">
    <img src="/img/acv-compare/ejemplo_comparativa_acv.png" alt="Ejemplo de comparativa de ACV" width="800"/>
</p>

### Exportar resultados

Tanto en el detalle de un resultado de ACV como en el comparador, el menú **Exportar** descarga los datos en formato
**JSON** o **CSV**:

- **JSON**: conserva la estructura completa de la respuesta, incluyendo metadatos y desglose por categorías.
- **CSV**: genera un archivo de valores separados por punto y coma (`;`) con el desglose por categoría de impacto, que se puede abrir con cualquier hoja de cálculo.

En el comparador, el menú ofrece tres conjuntos de datos, cada uno en JSON o CSV:

- **Exportar comparativa**: exporta los resultados de ambos conjuntos con los metadatos de los filtros aplicados.
- **Exportar referencia**: exporta únicamente los valores del conjunto de referencia.
- **Exportar objetivo**: exporta únicamente los valores del conjunto objetivo.

### Exportar la trazabilidad de una comparativa

{/* <!-- coderabbit-ai-generated:v1 --> */}

{/* <!-- coderabbit-ai-generated-section:v1:8eaa1fbe4ff244ff73ce5eb312270a10484c2ee9811476cd1deca269e8a5afc3 --> */}

Si administras una organización y has filtrado alguno de los conjuntos por ella, el botón **Exportar trazabilidad** descarga los resultados individuales de las campañas que cumplen los filtros aplicados, además de sus metadatos.

{/* <!-- /coderabbit-ai-generated:v1 --> */}

Solo incluye campañas de organizaciones que administras, por lo que para exportar la comparativa completa los dos conjuntos deben estar filtrados por una de ellas. El menú permite elegir **Comparativa completa**, **Solo referencia** o **Solo objetivo**.

{/* <!-- coderabbit-ai-generated:v1 --> */}

{/* <!-- coderabbit-ai-generated-section:v1:641c30cf041134fbbe6a2f22bc1334f6e3e53b6ec41c2c5dd687cc66e76e7321 --> */}

Al descargar, la exportación vuelve a aplicar los filtros con los datos y consentimientos vigentes. Por ello, las campañas y las medias pueden diferir de las de la comparativa mostrada.

{/* <!-- /coderabbit-ai-generated:v1 --> */}

Incluye los filtros aplicados con sus nombres, la media de cada conjunto, la comparativa agregada y una fila por cada resultado individual, con el método de impacto, el cultivo (tipo, campaña, superficie, producción, consumo de agua y ciclo), la parcela, el propietario (nombre y email) y la ubicación. También conserva los datos de impacto tal y como llegaron de openLCA, sin promediar. No incluye la geometría de la parcela ni otros datos personales.

- **JSON**: estructura completa con `reference`, `target` y `comparison` cuando correspondan, más los mismos datos individuales.
- **CSV**: una fila por resultado y categoría de impacto, con una columna por etapa (fertilizantes, manejo del cultivo, pesticidas, sistema de riego y total) y los metadatos del conjunto repetidos en cada fila. Usa `;` como separador y se puede abrir con una hoja de cálculo.

La exportación usa los consentimientos aceptados en el momento de la descarga. Si después el administrador revoca una campaña o expulsa a un miembro, las campañas revocadas dejan de aparecer en exportaciones posteriores, pero el fichero ya generado no cambia.

### Generar informe

**Generar informe** crea un informe de la comparativa en **PDF**. Contiene un resumen de la comparativa generado por IA,
recomendaciones para el conjunto objetivo, los tres impactos con mayor diferencia, y el desglose completo de la
comparativa por categorías. El informe se genera en el idioma activo de la interfaz.

<p align="center">
    <img src="/img/acv-compare/boton_generar_informe.png" alt="Botón para generar informe de ACV" width="400"/>
</p>

<p align="center">
    <img src="/img/acv-compare/informe_acv.png" alt="Ejemplo de informe de ACV en PDF" width="400"/>
</p>

## Administración

Si el usuario que inicia sesión tiene rol de administrador, será redirigido automáticamente al panel de administración.
El menú lateral agrupa las secciones en **Datos** (usuarios, parcelas y cultivos) y **Catálogos** (métodos de impacto,
países, provincias y poblaciones), con el número de registros de cada una. En cada sección se puede buscar, paginar,
crear, editar y eliminar registros. Los registros relacionados (propietario, población, parcela...) se muestran por su
nombre, se eligen con un buscador y, al pulsarlos, abren su sección filtrada por ese registro. La sección y los filtros se
guardan en la dirección de la página, por lo que se pueden recargar o compartir.

Desde la gestión de parcelas se puede marcar o desmarcar una parcela como **parcela de referencia** y asignar la
población a las parcelas que no la tienen: el panel avisa de cuántas hay y permite filtrarlas con **Solo sin población**.
Una parcela sin población no aparece en los filtros por país, provincia o población del comparador.

Al eliminar:

- una parcela, se eliminan también sus cultivos y sus resultados de impacto;
- un cultivo, se elimina también su resultado de impacto;
- un usuario con parcelas, un país con provincias, una provincia con poblaciones, una población con parcelas o un método
  de impacto con resultados, el panel lo impide y explica el motivo.

Un administrador no puede eliminar su propia cuenta ni quitarse el rol de administrador. Tampoco se puede eliminar un
usuario que administra organizaciones: antes debe transferirlas o eliminarlas.

En el grupo **Datos** están también las **organizaciones**, que se pueden consultar y eliminar (se crean y editan desde
la aplicación), y los **consentimientos**, de solo lectura, con su organización, usuario, campaña y estado.

<p align="center">
    <img src="/img/acv-compare/panel_admin.png" alt="Panel de administración" width="600"/>
</p>

## Estadísticas globales

La ruta **Estadísticas** muestra una visión agregada de los resultados registrados en LCA-Compare. Permite filtrar por
categoría de impacto, tipo de cultivo y año (y por organización, si administras alguna), y visualiza:

- KPIs globales: número de parcelas, cultivos y superficie total, impacto medio por categoría y variación interanual
  de cada categoría. La variación interanual compara solo las parcelas con resultado en el año elegido y en el
  anterior (al menos 3), para que no influyan las altas y bajas de explotaciones.
- Ranking de provincias y poblaciones. Al pulsar en una entrada se abre el comparador con esa provincia o población
  precargada como conjunto de Referencia. El ranking de poblaciones se puede limitar a una provincia e incluye un
  buscador que muestra la posición de cada población.
- Evolución temporal de los impactos, con un gráfico de tendencia (sparkline) por categoría.
- Perfil de impacto: gráfico de radar que permite comparar dos provincias o dos poblaciones.
- Mapa de calor por provincia y categoría; al pulsar en el nombre de una categoría se reordena el mapa según sus valores.
- Distribución de cultivos y relación entre producción e impacto.

La toxicidad humana se muestra en dos categorías, cancerígena y no cancerígena, como en EF 3.1. La dotación de agua
(m³/ha) y la productividad del agua (kg/m³) se calculan solo con cultivos de regadío (consumo de agua mayor que 0); el
rendimiento (kg/ha) incluye todos.

## Organizaciones

Una organización permite analizar en conjunto las campañas de varios usuarios. Cualquier usuario con la sesión iniciada
puede crear organizaciones desde **Organizaciones** en la barra de navegación, y quien la crea es su único
administrador.

El administrador pide acceso a otros usuarios desde la pestaña **Solicitar acceso** del panel de la organización,
indicando el correo de un usuario ya registrado y las campañas (años, desde 2020 hasta el siguiente al actual) a las que
quiere acceder. El consentimiento se da por usuario y por campaña.

El usuario recibe la solicitud en las notificaciones de la barra de navegación (icono de campana) y, si el envío de
correo está configurado, también por correo. Desde ahí acepta o rechaza cada campaña, o todas a la vez. **Una vez aceptada
una campaña, el usuario no puede retirarla ni salir de la organización**; solo el administrador de la organización
puede revocarla. Si rechaza una campaña, el administrador puede volver a pedirla.

Con una campaña aceptada, el administrador puede:

- Consultar las parcelas del miembro (**Ver parcelas** en la pestaña **Miembros**), con su mapa, sus cultivos y sus
  resultados de ACV, pero solo de las campañas aceptadas.
- Usar la organización como filtro en el [comparador](#comparador-de-acv) y en las
  [estadísticas](#estadísticas-globales). El filtro incluye solo los cultivos de las campañas aceptadas por los
  miembros y de las que aporta el propio administrador.

El administrador también puede aportar sus propias parcelas: en **Mis campañas**, dentro de la pestaña **Miembros**,
marca las campañas que quiere incluir y las desmarca para retirarlas. No hace falta solicitud ni aceptación, y esas
campañas cuentan igual que las de cualquier miembro. Si transfiere la administración, queda como miembro con las
campañas que aportaba.

En la pestaña **Miembros** el administrador ve el estado de cada campaña (pendiente, aceptada, rechazada o revocada),
puede cancelar una solicitud pendiente, revocar una campaña aceptada o expulsar a un miembro, lo que revoca todas sus
campañas. En **Ajustes** puede cambiar el nombre y la descripción, transferir la administración a un miembro con alguna
campaña aceptada o eliminar la organización. El usuario afectado recibe un aviso de cada revocación, expulsión,
transferencia o eliminación.

En **Organizaciones**, cada usuario ve también las organizaciones de las que es miembro, quién las administra y qué
campañas ha dado, con su estado.
