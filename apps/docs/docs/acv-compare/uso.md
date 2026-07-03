---
sidebar_label: 'Uso'
sidebar_position: 3
---

# Uso

Este servicio recibe los resultados de ACV calculados por **LCA Bridge** siempre que ambos se estén ejecutando
de manera simultánea. Si es la primera vez que un usuario realiza un cálculo de ACV, se le enviará un correo con su
contraseña de acceso.

<p align="center">
    <img src="/img/acv-compare/correo.png" alt="Correo de bienvenida a LCA Compare" width="600"/>
</p>

## Visualizar resultados de ACV de una parcela

Para visualizar las parcelas de tu usuario, con la sesión iniciada selecciona la imagen de perfil y *Mis parcelas*.

<p align="center">
    <img src="/img/acv-compare/mis_parcelas.png" alt="Mis parcelas" width="600"/>
</p>

<p align="center">
    <img src="/img/acv-compare/mis_parcelas_ruta.png" alt="Vista de mis parcelas" width="600"/>
</p>

Desde el listado de parcelas, puedes acceder al detalle de cada una, donde se muestra su identificador SIGPAC, referencia
catastral, un mapa con el polígono de la parcela, y los cultivos asociados ordenados por campaña.

<p align="center">
    <img src="/img/acv-compare/parcela_ejemplo.png" alt="Ejemplo de parcela" width="600"/>
</p>

Al seleccionar un cultivo, se muestran los resultados de ACV desglosados por categoría de impacto: fertilizantes, manejo
de cultivo, pesticidas, sistema de riego e impacto total.

<p align="center">
    <img src="/img/acv-compare/acv_parcela.png" alt="ACV de una parcela" width="600"/>
</p>

## Comparador de ACV

El comparador de ACV se accede desde el botón habilitado para ello en la barra de navegación.

<p align="center">
    <img src="/img/acv-compare/boton_comparador.png" alt="ACV de una parcela" width="600"/>
</p>

En él, podrás comparar dos conjuntos de cultivos, filtrando por:

- País
- Provincia
- Población
- Ubicación (coordenadas y radio en kilómetros)
- Tipo de cultivo
- Año de campaña (inicio o fin)

El conjunto de **Referencia** es obligatorio. Si solo se especifica la referencia, se mostrarán los valores medios de
impacto del conjunto. Si también se especifica un conjunto **Objetivo**, se calculará la diferencia porcentual entre
ambos para cada categoría.

<p align="center">
    <img src="/img/acv-compare/ejemplo_comparativa_acv.png" alt="Ejemplo de comparativa de ACV" width="800"/>
</p>

### Exportar resultados

Tanto en el detalle de un resultado de ACV como en el comparador, puedes exportar los datos en formato **JSON** o **CSV** mediante los botones de exportación:

- **JSON**: conserva la estructura completa de la respuesta, incluyendo metadatos y desglose por categorías.
- **CSV**: genera un archivo de valores separados por punto y coma (`;`) con el desglose por categoría de impacto, listo para abrir en hojas de cálculo.

En el comparador, las opciones disponibles son:

- **Exportar comparativa**: exporta los resultados de ambos conjuntos con los metadatos de los filtros aplicados.
- **Exportar referencia**: exporta únicamente los valores del conjunto de referencia.
- **Exportar objetivo**: exporta únicamente los valores del conjunto objetivo.

### Generar informe

A su vez podrás generar un informe detallado de la comparativa en **PDF** pulsando en **Generar informe**. El informe
contiene un resumen de la comparativa generado por IA, recomendaciones para el conjunto objetivo, los tres impactos con
mayor diferencia, y el desglose completo de la comparativa por categorías.

<p align="center">
    <img src="/img/acv-compare/boton_generar_informe.png" alt="Botón para generar informe de ACV" width="400"/>
</p>

<p align="center">
    <img src="/img/acv-compare/informe_acv.png" alt="Ejemplo de comparativa de ACV" width="400"/>
</p>

## Administración

Si el usuario que inicia sesión tiene rol de administrador, será redirigido automáticamente al panel de administración.
Desde allí podrá gestionar usuarios, parcelas, cultivos, métodos de impacto, países, provincias y poblaciones. El panel
incluye búsqueda, paginación, creación, edición, borrado y ayudas para seleccionar identificadores de entidades
relacionadas.

<p align="center">
    <img src="/img/acv-compare/panel_admin.png" alt="Panel de administración" width="600"/>
</p>

## Estadísticas globales

La ruta **Estadísticas** muestra una visión agregada de los resultados registrados en LCA Compare. Permite filtrar por
año, categoría de impacto, tipo de cultivo y provincia, y visualiza:

- KPIs globales de cultivos, parcelas, usuarios, superficie, producción, agua e impacto medio.
- Ranking de provincias y poblaciones.
- Evolución temporal de los impactos.
- Perfil de impacto, mapa de calor, distribución de cultivos y relación entre producción e impacto.
