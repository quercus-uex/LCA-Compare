---
sidebar_label: 'JSON de entrada'
sidebar_position: 4
---

# JSON de entrada del endpoint `POST /capture-acv`

El endpoint `POST /capture-acv` recibe como cuerpo de la petición el JSON de salida de un cultivo generado por el
servicio **LCA Capture**. A continuación se describe la estructura completa del documento.

## Estructura general

El JSON se compone de siete bloques principales:

| Bloque | Descripción |
|---|---|
| `metadatos` | Información de la parcela, el cultivo y el usuario. |
| `riegos` | Parámetros del sistema de riego instalado. |
| `bombeo` | Datos del equipo de bombeo hidráulico. |
| `fitosanitarios` | Productos fitosanitarios aplicados, con detalle y agrupación por clasificación SimaPro. |
| `fertilizantes` | Cantidades de nutrientes y emisiones asociadas a la fertilización. |
| `manejo_cultivo` | Labores agrícolas realizadas, ocupación del suelo y uso de agua. |
| `maquinaria` | Maquinaria empleada, incluyendo cosecha mecanizada. |

---

## `metadatos`

Contiene los datos identificativos de la parcela, el cultivo y el usuario que realiza la solicitud.

### `metadatos.parcela`

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | `integer` | Sí | Identificador interno de la parcela en LCA Capture. |
| `es_sigpac` | `object` \| `null` | Condicional | Datos SIGPAC de la parcela. Obligatorio si la parcela está registrada en SIGPAC. |
| `es_sigpac.provincia` | `integer` | Condicional | Código de provincia INE. |
| `es_sigpac.municipio` | `integer` | Condicional | Código de municipio INE. |
| `es_sigpac.poligono` | `integer` | Condicional | Número de polígono catastral. |
| `es_sigpac.parcela` | `integer` | Condicional | Número de parcela catastral. |
| `es_referencia_catastral` | `string` \| `null` | Condicional | Referencia catastral de la parcela. Alternativa a SIGPAC. |
| `pt_id_parcela_predial` | `string` \| `null` | Condicional | Identificador de parcela predial (Portugal). Alternativa a SIGPAC y catastro. |
| `nombre` | `string` | Sí | Nombre descriptivo de la parcela. |

:::note
Al menos uno de los tres identificadores geográficos (`es_sigpac`, `es_referencia_catastral` o `pt_id_parcela_predial`)
debe estar presente. El servicio valida la parcela usando el primero que encuentre.
:::

### `metadatos.cultivo`

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | `integer` | Sí | Identificador interno del cultivo en LCA Capture. |
| `tipo` | `string` | Sí | Tipo de cultivo. Valores soportados: `"Tomate"`, `"Olivo"`, `"Vinedo"`. Determina el proceso de cálculo seleccionado (`TomateProcess`, `OlivoProcess`, `VinedoProcess`). |
| `superficie_cultivada` | `number` | Sí | Superficie cultivada en hectáreas (ha). |
| `produccion` | `number` | Sí | Producción total en kilogramos (kg). |
| `consumo_agua` | `number` | Sí | Consumo de agua en metros cúbicos (m³). |
| `fecha_inicio_campania` | `integer` | Sí | Fecha de inicio de campaña en formato `YYYYMMDD`. |
| `fecha_fin_campania` | `integer` | Sí | Fecha de fin de campaña en formato `YYYYMMDD`. |
| `ciclo` | `integer` | Sí | Duración del ciclo de cultivo en días. |

### `metadatos.usuario`

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | `integer` | Sí | Identificador interno del usuario en LCA Capture. |
| `nombre` | `string` | Sí | Nombre del usuario. |
| `email` | `string` | Sí | Correo electrónico del usuario. |

---

## `riegos`

Parámetros técnicos del sistema de riego. Los campos varían según el tipo de riego instalado.

| Campo | Tipo | Descripción |
|---|---|---|
| `tipo` | `string` | Tipo de sistema de riego (ej. `"Sistema de riego horticola"`). |
| `entre_arboles` | `number` | Distancia entre árboles en metros. |
| `entre_calles` | `number` | Distancia entre calles en metros. |
| `n_goteros_arbol` | `number` | Número de goteros por árbol. |
| `n_arboles` | `number` | Número total de árboles. |
| `n_calles` | `number` | Número de calles. |
| `m_portagotero` | `number` | Metros totales de tubería portagoteros. |
| `peso_portagoteros_16mm` | `number` | Peso de los portagoteros de 16 mm en kg. |
| `n_enganches` | `number` | Número de enganches. |
| `peso_enganches` | `number` | Peso total de enganches en kg. |
| `metros_principal` | `number` | Metros de tubería principal. |
| `peso_principal_32mm` | `number` | Peso de la tubería principal de 32 mm en kg. |
| `peso_llaves` | `number` | Peso de las llaves en kg. |
| `kg_PP` | `number` | Kilogramos totales de polipropileno (PP). |
| `peso_tira_pollo` | `number` | Peso de la tira de pollo en kg. |
| `peso_principal_17mm` | `number` | Peso de la tubería principal de 17 mm en kg. |
| `deposito_abono` | `number` | Capacidad del depósito de abono en litros. |
| `kg_PP_ha_anio` | `number` | kg de PP por hectárea y año. |
| `kg_PE_1_ha_anio` | `number` | kg de polietileno (tipo 1) por hectárea y año. |
| `kg_PE_2_ha_anio` | `number` | kg de polietileno (tipo 2) por hectárea y año. |
| `kg_PE_deposito_ha_anio` | `number` | kg de PE del depósito por hectárea y año. |
| `kg_PE_ha_anio` | `number` | kg totales de PE por hectárea y año. |
| `kg_PVC_ha_anio` | `number` | kg de PVC por hectárea y año. |
| `kg_PVC_produccion` | `number` | kg de PVC por kg de producción. |
| `kg_PP_produccion` | `number` | kg de PP por kg de producción. |
| `kg_PE_produccion` | `number` | kg de PE por kg de producción. |

---

## `bombeo`

Datos del equipo de bombeo hidráulico asociado al sistema de riego.

| Campo | Tipo | Descripción |
|---|---|---|
| `cabeas` | `number` | Número de cabezas de bombeo. |
| `potencia` | `number` | Potencia del equipo en kW. |
| `consumo_l_h` | `number` | Consumo en litros por hora. |
| `kg_acero_ha_produccion` | `number` | kg de acero por hectárea y kg de producción. |

---

## `fitosanitarios`

Productos fitosanitarios aplicados al cultivo, con detalle individual y agrupación por clasificación SimaPro.

### `fitosanitarios.detalle[]`

Array con cada producto fitosanitario aplicado.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `integer` | Identificador del producto. |
| `nombre` | `string` | Nombre comercial del producto. |
| `clasificacion_simapro` | `integer` | Código de clasificación SimaPro (determina el proceso de impacto en openLCA). |
| `n_aplicaciones` | `integer` | Número de aplicaciones realizadas. |
| `densidad` | `number` | Densidad del producto en kg/L. |
| `porcentaje_ma` | `number` | Porcentaje de materia activa declarada. |
| `porcentaje_ma_usado` | `number` | Porcentaje de materia activa realmente utilizada. |
| `porcentaje_ma_personalizado` | `number` \| `null` | Porcentaje personalizado por el usuario, si aplica. |
| `max_l_ha` | `number` | Dosis máxima en litros por hectárea. |
| `cantidad_total_ha` | `number` | Cantidad total aplicada por hectárea en litros. |
| `cantidad_total_produccion` | `number` | Cantidad total aplicada por kg de producción en litros. |

### `fitosanitarios.agrupado_por_clasificacion[]`

Array con los fitosanitarios agrupados por su clasificación SimaPro.

| Campo | Tipo | Descripción |
|---|---|---|
| `clasificacion_simapro` | `integer` | Código de clasificación SimaPro del grupo. |
| `cantidad_total_produccion` | `number` | Cantidad total del grupo por kg de producción. |
| `fitosanitarios[]` | `array` | Lista de productos dentro del grupo. |
| `fitosanitarios[].id` | `integer` | Identificador del producto. |
| `fitosanitarios[].nombre` | `string` | Nombre del producto. |
| `fitosanitarios[].n_aplicaciones` | `integer` | Número de aplicaciones. |
| `fitosanitarios[].cantidad_total_ha` | `number` | Cantidad por hectárea en litros. |
| `fitosanitarios[].cantidad_total_produccion` | `number` | Cantidad por kg de producción en litros. |

---

## `fertilizantes`

Cantidades de nutrientes aplicados y emisiones asociadas a la fertilización.

| Campo | Tipo | Descripción |
|---|---|---|
| `kg_N` | `number` | kg de nitrógeno (N) por kg de producción. |
| `kg_K2O` | `number` | kg de óxido de potasio (K₂O) por kg de producción. |
| `kg_P2O5` | `number` | kg de pentóxido de fósforo (P₂O₅) por kg de producción. |
| `kg_NH3` | `number` | kg de amoníaco (NH₃) emitidos por kg de producción. |
| `kg_N2O` | `number` | kg de óxido nitroso (N₂O) emitidos por kg de producción. |
| `kg_NOX` | `number` | kg de óxidos de nitrógeno (NOₓ) emitidos por kg de producción. |
| `kg_NO3` | `number` | kg de nitrato (NO₃) lixiviados por kg de producción. |
| `transporte_fert_UF_1` | `number` | Factor de unidad de transporte de fertilizantes (UF₁). |

---

## `manejo_cultivo`

Labores agrícolas realizadas sobre el cultivo, junto con datos de ocupación del suelo y uso de agua.

### `manejo_cultivo.labores[]`

Array con cada labor agrícola realizada.

| Campo | Tipo | Descripción |
|---|---|---|
| `labor_simapro` | `string` | Nombre del proceso SimaPro asociado a la labor. |
| `rendimiento_h_ha` | `number` | Rendimiento en horas por hectárea. |
| `UF_1_ha` | `number` | Factor de unidad 1 por hectárea. |
| `UF_1_ha_produccion` | `number` | Factor de unidad 1 por hectárea y kg de producción. |
| `fabricacion` | `number` | Impacto de fabricación de la maquinaria. |
| `reparacion` | `number` | Impacto de reparación de la maquinaria. |
| `UF_1_kg` | `number` | Factor de unidad 1 por kg de maquinaria. |
| `UF_1_kg_produccion` | `number` | Factor de unidad 1 por kg de maquinaria y kg de producción. |

#### `manejo_cultivo.labores[].pases[]`

Array con cada pase (pasada) de la labor.

| Campo | Tipo | Descripción |
|---|---|---|
| `id_pase_apero` | `integer` \| `null` | Identificador del pase del apero. |
| `apero_id` | `integer` | Identificador del apero. |
| `apero_nombre` | `string` | Nombre del apero. |
| `maquina_id` | `integer` | Identificador de la máquina tractora. |
| `maquina_nombre` | `string` | Nombre de la máquina tractora. |
| `pases` | `integer` | Número de pasadas realizadas. |
| `tiempo_m_labor` | `number` | Tiempo en minutos de labor por pase. |
| `rendimiento_h_ha` | `number` | Rendimiento en horas por hectárea. |
| `UF_1_ha` | `number` | Factor de unidad 1 por hectárea. |
| `UF_1_ha_produccion` | `number` | Factor de unidad 1 por hectárea y kg de producción. |
| `fabricacion` | `number` | Impacto de fabricación. |
| `reparacion` | `number` | Impacto de reparación. |
| `UF_1_kg` | `number` | Factor de unidad 1 por kg. |
| `UF_1_kg_produccion` | `number` | Factor de unidad 1 por kg y kg de producción. |

### Otros campos de `manejo_cultivo`

| Campo | Tipo | Descripción |
|---|---|---|
| `ocupacion_suelo` | `number` | Factor de ocupación del suelo (m²·año por kg de producción). |
| `uso_de_agua` | `number` | Uso de agua en m³ por kg de producción. |

---

## `maquinaria`

Maquinaria empleada en las labores del cultivo.

### `maquinaria.cosecha_mecanizada`

Array con los datos de la cosecha mecanizada, si aplica. Puede estar vacío si la cosecha es manual.

### `maquinaria.maquinas[]`

Array con cada máquina tractora utilizada.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `integer` | Identificador de la máquina. |
| `nombre` | `string` | Nombre o modelo de la máquina. |
| `peso` | `number` | Peso de la máquina en kg. |
| `vida_h` | `number` | Vida útil de la máquina en horas. |
| `rendimiento_h_ha` | `number` | Rendimiento en horas por hectárea. |
| `fabricacion_kg_ha` | `number` | kg de acero de fabricación por hectárea. |
| `reparacion_kg_ha` | `number` | kg de acero de reparación por hectárea. |
| `UF_kg_reciclaje` | `number` | Factor de unidad de reciclaje en kg. |
| `UF_kg_reciclaje_produccion` | `number` | Factor de unidad de reciclaje en kg por kg de producción. |

---

## Ejemplo completo

El siguiente JSON representa la información de un cultivo remitido desde LCA Capture hacia LCA Bridge para ejecutar el
cálculo de ACV correspondiente.

```json
{
    "metadatos": {
        "parcela": {
            "id": 3,
            "es_sigpac": {
                "provincia": 6,
                "municipio": 5,
                "poligono": 1,
                "parcela": 1
            },
            "es_referencia_catastral": null,
            "pt_id_parcela_predial": null,
            "nombre": "Prueba"
        },
        "cultivo": {
            "id": 1,
            "tipo": "Tomate",
            "superficie_cultivada": 100,
            "produccion": 100,
            "consumo_agua": 500,
            "fecha_inicio_campania": 20240401,
            "fecha_fin_campania": 20241120,
            "ciclo": 200
        },
        "usuario": {
            "id": 3,
            "nombre": "Prueba",
            "email": "prueba@example.com"
        }
    },
    "riegos": {
        "tipo": "Sistema de riego horticola",
        "entre_arboles": 1.5,
        "entre_calles": 2.1,
        "n_goteros_arbol": 10,
        "n_arboles": 3174.6031746031745,
        "n_calles": 66.66666666666667,
        "m_portagotero": 6666.666666666667,
        "peso_portagoteros_16mm": 375.33333333333337,
        "n_enganches": 66.66666666666667,
        "peso_enganches": 0.78,
        "metros_principal": 100,
        "peso_principal_32mm": 21.07,
        "peso_llaves": 0.0208,
        "kg_PP": 10.1508,
        "peso_tira_pollo": 78,
        "peso_principal_17mm": 110.5,
        "deposito_abono": 5.5,
        "kg_PP_ha_anio": 1.26885,
        "kg_PE_1_ha_anio": 1.1,
        "kg_PE_2_ha_anio": 78,
        "kg_PE_deposito_ha_anio": 0.43333333333333335,
        "kg_PE_ha_anio": 79.53333333333333,
        "kg_PVC_ha_anio": 13.8125,
        "kg_PVC_produccion": 0.138125,
        "kg_PP_produccion": 0.0126885,
        "kg_PE_produccion": 0.7953333333333333
    },
    "bombeo": {
        "cabeas": 9,
        "potencia": 3,
        "consumo_l_h": 2,
        "kg_acero_ha_produccion": 0.0018
    },
    "fitosanitarios": {
        "detalle": [
            {
                "id": 7,
                "nombre": "Amectoctradin",
                "clasificacion_simapro": 1,
                "n_aplicaciones": 2,
                "densidad": 1.04,
                "porcentaje_ma": 20,
                "porcentaje_ma_usado": 20,
                "porcentaje_ma_personalizado": null,
                "max_l_ha": 1.2,
                "cantidad_total_ha": 0.48,
                "cantidad_total_produccion": 0.0048
            }
        ],
        "agrupado_por_clasificacion": [
            {
                "clasificacion_simapro": 1,
                "cantidad_total_produccion": 0.245,
                "fitosanitarios": [
                    {
                        "id": 7,
                        "nombre": "Amectoctradin",
                        "n_aplicaciones": 2,
                        "cantidad_total_ha": 0.48,
                        "cantidad_total_produccion": 0.0048
                    }
                ]
            }
        ]
    },
    "fertilizantes": {
        "kg_N": 0.1,
        "kg_K2O": 0.252,
        "kg_P2O5": 0.9389,
        "kg_NH3": 0.0016400000000000002,
        "kg_N2O": 0.0005,
        "kg_NOX": 0.004,
        "kg_NO3": 0.03,
        "transporte_fert_UF_1": 1.01
    },
    "manejo_cultivo": {
        "labores": [
            {
                "labor_simapro": "Application of plant protection product, by field sprayer [CH]",
                "rendimiento_h_ha": 0.75,
                "UF_1_ha": 0.5249999999999999,
                "UF_1_ha_produccion": 0.018,
                "fabricacion": 0.75,
                "reparacion": 0.3375,
                "UF_1_kg": 1.0875,
                "UF_1_kg_produccion": 0.010875,
                "pases": [
                    {
                        "id_pase_apero": null,
                        "apero_id": 4,
                        "apero_nombre": "Atomizador",
                        "maquina_id": 6,
                        "maquina_nombre": "John Deere 6M 180",
                        "pases": 1,
                        "tiempo_m_labor": 0.25,
                        "rendimiento_h_ha": 0.25,
                        "UF_1_ha": 0.175,
                        "UF_1_ha_produccion": 0.0017499999999999998,
                        "fabricacion": 0.25,
                        "reparacion": 0.1125,
                        "UF_1_kg": 0.3625,
                        "UF_1_kg_produccion": 0.0036249999999999998
                    }
                ]
            }
        ],
        "ocupacion_suelo": 0.005479452054794521,
        "uso_de_agua": 5
    },
    "maquinaria": {
        "cosecha_mecanizada": [],
        "maquinas": [
            {
                "id": 6,
                "nombre": "John Deere 6M 180",
                "peso": 8500,
                "vida_h": 14000,
                "rendimiento_h_ha": 0.75,
                "fabricacion_kg_ha": 0.45535714285714285,
                "reparacion_kg_ha": 0.09107142857142858,
                "UF_kg_reciclaje": 0.5464285714285715,
                "UF_kg_reciclaje_produccion": 0.005464285714285715
            }
        ]
    }
}
```
