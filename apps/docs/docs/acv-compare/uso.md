---
sidebar_label: 'Uso'
sidebar_position: 3
---

# Uso

Este servicio recibe los resultados de ACV calculados por **Capture ACV** siempre que ambos se estén ejecutando
de manera simultánea. Si es la primera vez que un usuario realiza un cálculo de ACV, se le enviará un correo con su
contraseña de acceso.

<p align="center">
    <img src="/img/acv-compare/correo.png" alt="Correo de bienvenida a ACV Compare" width="600"/>
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

El comparador de ACV se accede desde el botón habilitado para ello en la parte superior derecha de la página.

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

Una vez realizada la comparativa, puedes exportar los resultados en formato **JSON** mediante los botones de exportación:

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
Desde allí podrá gestionar los métodos de impacto registrados en el sistema.

<p align="center">
    <img src="/img/acv-compare/panel_admin.png" alt="Panel de administración" width="600"/>
</p>
