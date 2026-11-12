---
sidebar_label: 'Input JSON'
sidebar_position: 4
---

# Input JSON

The `POST /capture-acv` and `POST /capture-acv-coeficientes` endpoints receive as the request body the JSON of a crop exported by **LCA Capture**. The model is generated from the `schema/lca_capture_schema_v1.json` schema in the LCA Bridge repository and does not accept undefined fields: an unknown field, a missing required field, or a wrong type returns **HTTP 422**.

Unless another unit is stated, "per production" amounts (`*_produccion`, fertilizers) are expressed **per tonne of product**, since `metadatos.cultivo.produccion` is in t/ha.

## General Structure

| Block | Required | Description |
|---|---|---|
| `metadatos` | Yes | Plot, crop, and user information. |
| `riegos` | Yes | Parameters of the installed irrigation system. |
| `bombeo` | No | Pumping equipment data. Without this block, pump energy and steel are not accounted for. |
| `caseta` | No | Irrigation shed. |
| `espalderas` | No | Trellis (olive grove and vineyard). |
| `fitosanitarios` | Yes | Applied plant protection products, with detail and grouping by SimaPro classification. |
| `fertilizantes` | Yes | Applied nutrients and fertilization emissions. |
| `manejo_cultivo` | Yes | Agricultural operations, land occupation, and water use. |
| `maquinaria` | Yes | Machinery used, including mechanized harvesting. |

The calculation criteria for each field are described in [Process calculation](https://github.com/quercus-uex/LCA-Bridge/blob/main/docs/calculo_procesos.md).

---

## `metadatos`

### `metadatos.parcela`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `integer` | Yes | Plot identifier in LCA Capture. |
| `es_sigpac` | `object` \| `null` | No | SIGPAC code: `provincia`, `municipio`, `poligono`, and `parcela` (`integer` \| `null`). |
| `es_referencia_catastral` | `string` \| `null` | No | Cadastral reference. |
| `pt_id_parcela_predial` | `string` \| `null` | No | Property plot code (Portugal). |
| `nombre` | `string` | Yes | Plot name. |

:::note
At least one of the three identifiers (`es_sigpac` with `provincia`, `es_referencia_catastral`, or `pt_id_parcela_predial`) must be provided; otherwise, the service returns **HTTP 400**.
:::

### `metadatos.cultivo`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `integer` | Yes | Crop identifier in LCA Capture. |
| `tipo` | `string` | Yes | Crop type: `"Tomate"`, `"Olivo"`, or `"Viñedo"`. Determines the calculation process; any other value returns HTTP 400. |
| `superficie_cultivada` | `number` | Yes | Cultivated area (ha). Must be greater than 0. |
| `produccion` | `number` | Yes | Production (t/ha). Must be greater than 0. |
| `consumo_agua` | `number` \| `null` | Yes | Water consumption (m³/ha). With `null`, pumping energy is not accounted for. |
| `fecha_inicio_campania` | `integer` | Yes | Season start date (`YYYYMMDD`). |
| `fecha_fin_campania` | `integer` | Yes | Season end date (`YYYYMMDD`). |
| `ciclo` | `integer` \| `null` | Yes | Crop cycle duration in days. |

### `metadatos.usuario`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `integer` | Yes | User identifier in LCA Capture. |
| `nombre` | `string` | Yes | User name. |
| `email` | `string` | Yes | Email (must be a valid address). |

---

## `riegos`

`tipo` determines how the irrigation plastics are calculated: it must contain `"hortícola"` (drip tape), `"integrados"` (trees with integrated drippers), or `"pinchados"` (trees with pierced drippers); any other value returns HTTP 400.

| Field | Type | Required | Description |
|---|---|---|---|
| `tipo` | `string` | Yes | Irrigation system type (e.g. `"Sistema de riego hortícola"`). |
| `entre_arboles` | `number` | Yes | Distance between trees or plants (m). With pierced drippers, it must be greater than 0. |
| `entre_calles` | `number` | Yes | Distance between rows or lines (m). Must be greater than 0. |
| `n_goteros_arbol` | `integer` \| `null` | No | Number of drippers per tree. |
| `n_arboles` | `number` | Yes | Number of trees. |
| `n_calles` | `number` | Yes | Number of rows. |
| `m_portagotero` | `number` | Yes | Meters of dripline pipe. |
| `peso_portagoteros_16mm` | `number` | Yes | Weight of the 16 mm driplines (kg). |
| `n_enganches` | `number` | Yes | Number of couplings. |
| `peso_enganches` | `number` | Yes | Weight of the couplings (kg). |
| `metros_principal` | `integer` | Yes | Meters of main pipe. |
| `peso_principal_32mm` | `number` | Yes | Weight of the 32 mm main pipe (kg). |
| `peso_llaves` | `number` | Yes | Weight of the valves (kg). |
| `kg_PP` | `number` | Yes | kg of polypropylene (PP). |
| `kg_PE` | `number` \| `null` | No | kg of polyethylene (PE). |
| `peso_tira_pollo` | `integer` \| `null` | No | Weight of the drip tape (kg). |
| `peso_principal_17mm` | `number` \| `null` | No | Weight of the 17 mm main pipe (kg). |
| `deposito_abono` | `number` \| `null` | No | Weight of the fertilizer tank (kg). |
| `kg_PP_ha_anio` | `number` | Yes | kg of PP per hectare and year. |
| `kg_PE_1_ha_anio` | `number` \| `null` | No | kg of PE (type 1) per hectare and year. |
| `kg_PE_2_ha_anio` | `integer` \| `null` | No | kg of PE (type 2) per hectare and year. |
| `kg_PE_deposito_ha_anio` | `number` \| `null` | No | kg of tank PE per hectare and year. |
| `kg_PE_ha_anio` | `number` \| `null` | No | kg of PE per hectare and year. |
| `kg_PVC_ha_anio` | `number` \| `null` | No | kg of PVC per hectare and year. |
| `kg_PVC_produccion` | `number` \| `null` | No | kg of PVC per tonne. |
| `kg_PP_produccion` | `number` | Yes | kg of PP per tonne. |
| `kg_PE_produccion` | `number` | Yes | kg of PE per tonne. |

---

## `bombeo`

Optional block. If included, all of its fields are required.

| Field | Type | Description |
|---|---|---|
| `cabeas` | `number` | Number of pumping heads. |
| `potencia` | `number` | Pump power; determines electricity consumption according to the pumping unit table. |
| `consumo_l_h` | `number` | Diesel consumption (l/h) of a diesel pump. |
| `kg_acero_ha_produccion` | `number` | kg of pump steel per tonne. |

---

## `caseta`

Optional block. The calculation uses `largo` and `ancho` (m); without them, the shed is not accounted for.

| Field | Type | Required | Description |
|---|---|---|---|
| `largo`, `ancho` | `string` \| `null` | No | Shed dimensions (m). |
| `alto`, `largo_tejado`, `ancho_tejado` | `string` \| `null` | No | Shed and roof dimensions (m). |
| `superficie_tejado`, `kg_hormigon_m2`, `kg_hormigon`, `peso_m2_chapas_acero`, `kg_poliuretano`, `kg_acero` | `number` \| `null` | No | Intermediate data from LCA Capture. |
| `kg_hor` | `number` | Yes | kg of concrete per tonne. |
| `kg_PU` | `number` | Yes | kg of polyurethane per tonne. |
| `kg_acero_ha_anio` | `number` | Yes | kg of steel per tonne. |

---

## `espalderas`

Optional block, calculated by LCA Capture with the ESPALDERAS sheet of the reference Excel file (weights in kg per ha). With `kg_acero_ha` equal to 0, the trellis is not accounted for.

| Field | Type | Required | Description |
|---|---|---|---|
| `kg_acero_ha` | `number` | Yes | kg of trellis steel per ha. |
| `kg_acero_ha_anio_produccion` | `number` | Yes | kg of steel per tonne. |
| `peso_alambre_ha` | `number` \| `null` | No | kg of wire per ha (olive trellis). |
| `peso_alambre_formacion_ha`, `peso_alambre_vegetacion_ha` | `number` \| `null` | No | kg of training wire and foliage wire per ha (vine trellis). |
| `tipo` | `integer` \| `null` | No | Trellis type. |

The remaining fields (`entre_arboles`, `entre_calles`, `distancia_postes`, `postes_linea`, `peso_poste`, `lineas_ha`, `postes_ha`, `m_alambre_*`, `*gripple*`, `peso_postes_ha`, `kg_acero_ha_anio`) are optional intermediate data.

---

## `fitosanitarios`

### `fitosanitarios.detalle[]`

Each applied plant protection product. All fields are required except `porcentaje_ma_personalizado`.

| Field | Type | Description |
|---|---|---|
| `id` | `integer` | Product identifier. |
| `nombre` | `string` | Trade name; it is looked up in the reference plant protection product table. |
| `clasificacion_simapro` | `integer` | SimaPro classification code. Used if the product is not in the reference table; if it is not recognized either, the service returns HTTP 400. |
| `n_aplicaciones` | `integer` | Number of applications. |
| `densidad` | `number` | Product density (kg/l). |
| `porcentaje_ma` | `number` | Declared active ingredient percentage. |
| `porcentaje_ma_usado` | `number` | Active ingredient percentage used in the calculation. |
| `porcentaje_ma_personalizado` | `number` \| `null` | User-defined percentage, if any. |
| `max_l_ha` | `number` | Dose per application (l/ha). |
| `cantidad_total_ha` | `number` | Total amount applied per hectare. |
| `cantidad_total_produccion` | `number` | Total amount applied per tonne. |

### `fitosanitarios.agrupado_por_clasificacion[]`

Plant protection products grouped by SimaPro classification. All fields are required.

| Field | Type | Description |
|---|---|---|
| `clasificacion_simapro` | `integer` | SimaPro classification code of the group. |
| `cantidad_total_produccion` | `number` | Total amount of the group per tonne. |
| `fitosanitarios[]` | `array` | Products in the group, with `id`, `nombre`, `n_aplicaciones`, `cantidad_total_ha`, and `cantidad_total_produccion`. |

---

## `fertilizantes`

All fields are required.

| Field | Type | Description |
|---|---|---|
| `kg_N` | `number` | kg of nitrogen (N) per tonne. |
| `kg_K2O` | `number` | kg of potassium oxide (K₂O) per tonne. |
| `kg_P2O5` | `number` | kg of phosphorus pentoxide (P₂O₅) per tonne. |
| `kg_NH3` | `number` | kg of ammonia (NH₃) emitted per tonne. |
| `kg_N2O` | `number` | kg of nitrous oxide (N₂O) emitted per tonne. |
| `kg_NOX` | `number` | kg of nitrogen oxides (NOₓ) emitted per tonne. |
| `kg_NO3` | `number` | kg of nitrate (NO₃) leached per tonne. |
| `transporte_fert_UF_1` | `number` | Fertilizer transport (t·km per tonne). |

---

## `manejo_cultivo`

### `manejo_cultivo.labores[]`

Each agricultural operation performed. All fields are required.

| Field | Type | Description |
|---|---|---|
| `labor_simapro` | `string` | Name of the SimaPro process associated with the operation. |
| `rendimiento_h_ha` | `number` | Work rate (h/ha). |
| `UF_1_ha` | `number` | Functional unit per hectare. |
| `UF_1_ha_produccion` | `number` | Functional unit per hectare and tonne. |
| `fabricacion` | `number` | Machinery manufacturing. |
| `reparacion` | `number` | Machinery repair. |
| `UF_1_kg` | `number` | Functional unit per kg of machinery. |
| `UF_1_kg_produccion` | `number` | Functional unit per kg of machinery and tonne. |
| `pases[]` | `array` | Passes of the operation (see below). |

#### `manejo_cultivo.labores[].pases[]`

Each pass of an implement. The calculation uses `apero_nombre`, `tiempo_m_labor`, and `pases`.

| Field | Type | Required | Description |
|---|---|---|---|
| `id_pase_apero` | `number` \| `null` | No | Implement pass identifier. |
| `apero_id` | `integer` | Yes | Implement identifier. |
| `apero_nombre` | `string` | Yes | Implement name; an unknown implement is not accounted for. |
| `maquina_id` | `integer` \| `null` | No | Tractor identifier. |
| `maquina_nombre` | `string` \| `null` | No | Tractor name. |
| `pases` | `integer` | Yes | Number of passes. |
| `tiempo_m_labor` | `number` | Yes | Operation time (h/ha). |
| `rendimiento_h_ha`, `UF_1_ha`, `UF_1_ha_produccion`, `fabricacion`, `reparacion`, `UF_1_kg`, `UF_1_kg_produccion` | `number` | Yes | As in `labores[]`, for the pass. |

### Other `manejo_cultivo` Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `ocupacion_suelo` | `number` | Yes | Land occupation per tonne. |
| `uso_de_agua` | `number` | Yes | Water use per tonne. |

---

## `maquinaria`

### `maquinaria.cosecha_mecanizada[]`

Harvesters used; empty if harvesting is not mechanized. All fields are required.

| Field | Type | Description |
|---|---|---|
| `tipo` | `string` | Harvester type: `"cosechadora_tomate"`, `"cosechadora_olivo"`, or `"cosechadora_vid"`. Only the one for the calculated crop is counted. |
| `UF_kg` | `number` | Harvester diesel. |
| `UF_kg_produccion` | `number` | Harvester diesel per tonne (kg/t). |
| `UF_kg_fabricacion` | `number` | Harvester manufacturing. |
| `UF_kg_fabricacion_produccion` | `number` | Harvester manufacturing per tonne (kg/t). |

### `maquinaria.maquinas[]`

Each tractor used. All fields are required.

| Field | Type | Description |
|---|---|---|
| `id` | `integer` | Machine identifier. |
| `nombre` | `string` | Name or model. |
| `peso` | `integer` | Weight (kg). |
| `vida_h` | `integer` | Service life (h). |
| `rendimiento_h_ha` | `number` | Work rate (h/ha). |
| `fabricacion_kg_ha` | `number` | kg of manufacturing steel per hectare. |
| `reparacion_kg_ha` | `number` | kg of repair steel per hectare. |
| `UF_kg_reciclaje` | `number` | kg of recycling. |
| `UF_kg_reciclaje_produccion` | `number` | kg of recycling per tonne. |

---

## Full Example

The following JSON corresponds to a tomato crop exported by LCA Capture, based on `examples/example_in.json` from the [LCA Bridge repository](https://github.com/quercus-uex/LCA-Bridge/blob/main/examples/example_in.json).

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
