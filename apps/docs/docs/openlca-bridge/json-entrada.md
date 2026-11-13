---
sidebar_label: 'JSON de entrada'
sidebar_position: 4
---

# JSON de entrada

Los endpoints `POST /capture-acv` y `POST /capture-acv-coeficientes` reciben como cuerpo de la petición el JSON de un
cultivo exportado por **LCA Capture**. El modelo se genera a partir del esquema `schema/lca_capture_schema_v1.json`
del repositorio de LCA Bridge y no admite campos no definidos: un campo desconocido, un campo obligatorio ausente o un
tipo incorrecto devuelven **HTTP 422**.

Salvo que se indique otra unidad, las cantidades "por producción" (`*_produccion`, fertilizantes) se expresan **por
tonelada de producto**, ya que `metadatos.cultivo.produccion` está en t/ha.

## Estructura general

| Bloque | Obligatorio | Descripción |
|---|---|---|
| `metadatos` | Sí | Información de la parcela, el cultivo y el usuario. |
| `riegos` | Sí | Parámetros del sistema de riego instalado. |
| `bombeo` | No | Datos del equipo de bombeo. Sin este bloque no se contabilizan la energía ni el acero de la bomba. |
| `caseta` | No | Caseta de riego. |
| `espalderas` | No | Espaldera (olivo y viñedo). |
| `fitosanitarios` | Sí | Productos fitosanitarios aplicados, con detalle y agrupación por clasificación SimaPro. |
| `fertilizantes` | Sí | Nutrientes aplicados y emisiones de la fertilización. |
| `manejo_cultivo` | Sí | Labores agrícolas, ocupación del suelo y uso de agua. |
| `maquinaria` | Sí | Maquinaria empleada, incluida la cosecha mecanizada. |

Los criterios de cálculo de cada campo están en
[Cálculo de los procesos](https://github.com/quercus-uex/LCA-Bridge/blob/main/docs/calculo_procesos.md).

---

## `metadatos`

### `metadatos.parcela`

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | `integer` | Sí | Identificador de la parcela en LCA Capture. |
| `es_sigpac` | `object` \| `null` | No | Código SIGPAC: `provincia`, `municipio`, `poligono` y `parcela` (`integer` \| `null`). |
| `es_referencia_catastral` | `string` \| `null` | No | Referencia catastral. |
| `pt_id_parcela_predial` | `string` \| `null` | No | Código de parcela predial (Portugal). |
| `nombre` | `string` | Sí | Nombre de la parcela. |

:::note
Debe informarse al menos uno de los tres identificadores (`es_sigpac` con `provincia`, `es_referencia_catastral` o
`pt_id_parcela_predial`); en caso contrario, el servicio responde **HTTP 400**.
:::

### `metadatos.cultivo`

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | `integer` | Sí | Identificador del cultivo en LCA Capture. |
| `tipo` | `string` | Sí | Tipo de cultivo: `"Tomate"`, `"Olivo"` o `"Viñedo"`. Determina el proceso de cálculo; otro valor devuelve HTTP 400. |
| `superficie_cultivada` | `number` | Sí | Superficie cultivada (ha). Debe ser mayor que 0. |
| `produccion` | `number` | Sí | Producción (t/ha). Debe ser mayor que 0. |
| `consumo_agua` | `number` \| `null` | Sí | Consumo de agua (m³/ha). Con `null` no se contabiliza energía de bombeo. |
| `fecha_inicio_campania` | `integer` | Sí | Fecha de inicio de campaña (`AAAAMMDD`). |
| `fecha_fin_campania` | `integer` | Sí | Fecha de fin de campaña (`AAAAMMDD`). |
| `ciclo` | `integer` \| `null` | Sí | Duración del ciclo de cultivo en días. |

### `metadatos.usuario`

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | `integer` | Sí | Identificador del usuario en LCA Capture. |
| `nombre` | `string` | Sí | Nombre del usuario. |
| `email` | `string` | Sí | Correo electrónico (debe ser una dirección válida). |

---

## `riegos`

`tipo` determina el cálculo de los plásticos del riego: debe contener `"hortícola"` (cinta de goteo), `"integrados"`
(árboles con goteros integrados) o `"pinchados"` (árboles con goteros pinchados); otro valor devuelve HTTP 400.

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `tipo` | `string` | Sí | Tipo de sistema de riego (p. ej. `"Sistema de riego hortícola"`). |
| `entre_arboles` | `number` | Sí | Distancia entre árboles o plantas (m). Con goteros pinchados debe ser mayor que 0. |
| `entre_calles` | `number` | Sí | Distancia entre calles o líneas (m). Debe ser mayor que 0. |
| `n_goteros_arbol` | `integer` \| `null` | No | Número de goteros por árbol. |
| `n_arboles` | `number` | Sí | Número de árboles. |
| `n_calles` | `number` | Sí | Número de calles. |
| `m_portagotero` | `number` | Sí | Metros de tubería portagoteros. |
| `peso_portagoteros_16mm` | `number` | Sí | Peso de los portagoteros de 16 mm (kg). |
| `n_enganches` | `number` | Sí | Número de enganches. |
| `peso_enganches` | `number` | Sí | Peso de los enganches (kg). |
| `metros_principal` | `integer` | Sí | Metros de tubería principal. |
| `peso_principal_32mm` | `number` | Sí | Peso de la tubería principal de 32 mm (kg). |
| `peso_llaves` | `number` | Sí | Peso de las llaves (kg). |
| `kg_PP` | `number` | Sí | kg de polipropileno (PP). |
| `kg_PE` | `number` \| `null` | No | kg de polietileno (PE). |
| `peso_tira_pollo` | `integer` \| `null` | No | Peso de la cinta de goteo (kg). |
| `peso_principal_17mm` | `number` \| `null` | No | Peso de la tubería principal de 17 mm (kg). |
| `deposito_abono` | `number` \| `null` | No | Peso del depósito de abono (kg). |
| `kg_PP_ha_anio` | `number` | Sí | kg de PP por hectárea y año. |
| `kg_PE_1_ha_anio` | `number` \| `null` | No | kg de PE (tipo 1) por hectárea y año. |
| `kg_PE_2_ha_anio` | `integer` \| `null` | No | kg de PE (tipo 2) por hectárea y año. |
| `kg_PE_deposito_ha_anio` | `number` \| `null` | No | kg de PE del depósito por hectárea y año. |
| `kg_PE_ha_anio` | `number` \| `null` | No | kg de PE por hectárea y año. |
| `kg_PVC_ha_anio` | `number` \| `null` | No | kg de PVC por hectárea y año. |
| `kg_PVC_produccion` | `number` \| `null` | No | kg de PVC por tonelada. |
| `kg_PP_produccion` | `number` | Sí | kg de PP por tonelada. |
| `kg_PE_produccion` | `number` | Sí | kg de PE por tonelada. |

---

## `bombeo`

Bloque opcional. Si se incluye, todos sus campos son obligatorios.

| Campo | Tipo | Descripción |
|---|---|---|
| `cabeas` | `number` | Número de cabezas de bombeo. |
| `potencia` | `number` | Potencia de la bomba; determina el consumo eléctrico según la tabla de grupos de bombeo. |
| `consumo_l_h` | `number` | Consumo de gasóleo (l/h) de una bomba diésel. |
| `kg_acero_ha_produccion` | `number` | kg de acero de la bomba por tonelada. |

---

## `caseta`

Bloque opcional. El cálculo usa `largo` y `ancho` (m); sin ellos, la caseta no se contabiliza.

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `largo`, `ancho` | `string` \| `null` | No | Dimensiones de la caseta (m). |
| `alto`, `largo_tejado`, `ancho_tejado` | `string` \| `null` | No | Dimensiones de la caseta y del tejado (m). |
| `superficie_tejado`, `kg_hormigon_m2`, `kg_hormigon`, `peso_m2_chapas_acero`, `kg_poliuretano`, `kg_acero` | `number` \| `null` | No | Datos intermedios de LCA Capture. |
| `kg_hor` | `number` | Sí | kg de hormigón por tonelada. |
| `kg_PU` | `number` | Sí | kg de poliuretano por tonelada. |
| `kg_acero_ha_anio` | `number` | Sí | kg de acero por tonelada. |

---

## `espalderas`

Bloque opcional, calculado por LCA Capture con la hoja ESPALDERAS del Excel de referencia (pesos en kg por ha). Con
`kg_acero_ha` igual a 0, la espaldera no se contabiliza.

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `kg_acero_ha` | `number` | Sí | kg de acero de la espaldera por ha. |
| `kg_acero_ha_anio_produccion` | `number` | Sí | kg de acero por tonelada. |
| `peso_alambre_ha` | `number` \| `null` | No | kg de alambre por ha (espaldera de olivo). |
| `peso_alambre_formacion_ha`, `peso_alambre_vegetacion_ha` | `number` \| `null` | No | kg de alambre de formación y de vegetación por ha (espaldera de viña). |
| `tipo` | `integer` \| `null` | No | Tipo de espaldera. |

El resto de campos (`entre_arboles`, `entre_calles`, `distancia_postes`, `postes_linea`, `peso_poste`, `lineas_ha`,
`postes_ha`, `m_alambre_*`, `*gripple*`, `peso_postes_ha`, `kg_acero_ha_anio`) son datos intermedios opcionales.

---

## `fitosanitarios`

### `fitosanitarios.detalle[]`

Cada producto fitosanitario aplicado. Todos los campos son obligatorios salvo `porcentaje_ma_personalizado`.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `integer` | Identificador del producto. |
| `nombre` | `string` | Nombre comercial; se busca en la tabla de fitosanitarios de referencia. |
| `clasificacion_simapro` | `integer` | Código de clasificación SimaPro. Se usa si el producto no está en la tabla de referencia; si tampoco se reconoce, el servicio responde HTTP 400. |
| `n_aplicaciones` | `integer` | Número de aplicaciones. |
| `densidad` | `number` | Densidad del producto (kg/l). |
| `porcentaje_ma` | `number` | Porcentaje de materia activa declarado. |
| `porcentaje_ma_usado` | `number` | Porcentaje de materia activa usado en el cálculo. |
| `porcentaje_ma_personalizado` | `number` \| `null` | Porcentaje personalizado por el usuario, si lo hay. |
| `max_l_ha` | `number` | Dosis por aplicación (l/ha). |
| `cantidad_total_ha` | `number` | Cantidad total aplicada por hectárea. |
| `cantidad_total_produccion` | `number` | Cantidad total aplicada por tonelada. |

### `fitosanitarios.agrupado_por_clasificacion[]`

Fitosanitarios agrupados por clasificación SimaPro. Todos los campos son obligatorios.

| Campo | Tipo | Descripción |
|---|---|---|
| `clasificacion_simapro` | `integer` | Código de clasificación SimaPro del grupo. |
| `cantidad_total_produccion` | `number` | Cantidad total del grupo por tonelada. |
| `fitosanitarios[]` | `array` | Productos del grupo, con `id`, `nombre`, `n_aplicaciones`, `cantidad_total_ha` y `cantidad_total_produccion`. |

---

## `fertilizantes`

Todos los campos son obligatorios.

| Campo | Tipo | Descripción |
|---|---|---|
| `kg_N` | `number` | kg de nitrógeno (N) por tonelada. |
| `kg_K2O` | `number` | kg de óxido de potasio (K₂O) por tonelada. |
| `kg_P2O5` | `number` | kg de pentóxido de fósforo (P₂O₅) por tonelada. |
| `kg_NH3` | `number` | kg de amoníaco (NH₃) emitidos por tonelada. |
| `kg_N2O` | `number` | kg de óxido nitroso (N₂O) emitidos por tonelada. |
| `kg_NOX` | `number` | kg de óxidos de nitrógeno (NOₓ) emitidos por tonelada. |
| `kg_NO3` | `number` | kg de nitrato (NO₃) lixiviados por tonelada. |
| `transporte_fert_UF_1` | `number` | Transporte de los fertilizantes (t·km por tonelada). |

---

## `manejo_cultivo`

### `manejo_cultivo.labores[]`

Cada labor agrícola realizada. Todos los campos son obligatorios.

| Campo | Tipo | Descripción |
|---|---|---|
| `labor_simapro` | `string` | Nombre del proceso SimaPro asociado a la labor. |
| `rendimiento_h_ha` | `number` | Rendimiento (h/ha). |
| `UF_1_ha` | `number` | Unidad funcional por hectárea. |
| `UF_1_ha_produccion` | `number` | Unidad funcional por hectárea y tonelada. |
| `fabricacion` | `number` | Fabricación de la maquinaria. |
| `reparacion` | `number` | Reparación de la maquinaria. |
| `UF_1_kg` | `number` | Unidad funcional por kg de maquinaria. |
| `UF_1_kg_produccion` | `number` | Unidad funcional por kg de maquinaria y tonelada. |
| `pases[]` | `array` | Pases de la labor (ver abajo). |

#### `manejo_cultivo.labores[].pases[]`

Cada pase de un apero. El cálculo usa `apero_nombre`, `tiempo_m_labor` y `pases`.

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id_pase_apero` | `number` \| `null` | No | Identificador del pase del apero. |
| `apero_id` | `integer` | Sí | Identificador del apero. |
| `apero_nombre` | `string` | Sí | Nombre del apero; un apero desconocido no se contabiliza. |
| `maquina_id` | `integer` \| `null` | No | Identificador de la máquina tractora. |
| `maquina_nombre` | `string` \| `null` | No | Nombre de la máquina tractora. |
| `pases` | `integer` | Sí | Número de pases. |
| `tiempo_m_labor` | `number` | Sí | Tiempo de la labor (h/ha). |
| `rendimiento_h_ha`, `UF_1_ha`, `UF_1_ha_produccion`, `fabricacion`, `reparacion`, `UF_1_kg`, `UF_1_kg_produccion` | `number` | Sí | Como en `labores[]`, para el pase. |

### Otros campos de `manejo_cultivo`

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `ocupacion_suelo` | `number` | Sí | Ocupación del suelo por tonelada. |
| `uso_de_agua` | `number` | Sí | Uso de agua por tonelada. |

---

## `maquinaria`

### `maquinaria.cosecha_mecanizada[]`

Cosechadoras empleadas; vacío si la cosecha no es mecanizada. Todos los campos son obligatorios.

| Campo | Tipo | Descripción |
|---|---|---|
| `tipo` | `string` | Tipo de cosechadora: `"cosechadora_tomate"`, `"cosechadora_olivo"` o `"cosechadora_vid"`. Solo cuenta la del cultivo calculado. |
| `UF_kg` | `number` | Gasóleo de la cosechadora. |
| `UF_kg_produccion` | `number` | Gasóleo de la cosechadora por tonelada (kg/t). |
| `UF_kg_fabricacion` | `number` | Fabricación de la cosechadora. |
| `UF_kg_fabricacion_produccion` | `number` | Fabricación de la cosechadora por tonelada (kg/t). |

### `maquinaria.maquinas[]`

Cada máquina tractora utilizada. Todos los campos son obligatorios.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `integer` | Identificador de la máquina. |
| `nombre` | `string` | Nombre o modelo. |
| `peso` | `integer` | Peso (kg). |
| `vida_h` | `integer` | Vida útil (h). |
| `rendimiento_h_ha` | `number` | Rendimiento (h/ha). |
| `fabricacion_kg_ha` | `number` | kg de acero de fabricación por hectárea. |
| `reparacion_kg_ha` | `number` | kg de acero de reparación por hectárea. |
| `UF_kg_reciclaje` | `number` | kg de reciclaje. |
| `UF_kg_reciclaje_produccion` | `number` | kg de reciclaje por tonelada. |

---

## Ejemplo completo

El siguiente JSON corresponde a un cultivo de tomate exportado por LCA Capture, basado en `examples/example_in.json`
del [repositorio de LCA Bridge](https://github.com/quercus-uex/LCA-Bridge/blob/main/examples/example_in.json).

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
        "tipo": "Sistema de riego hortícola",
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
