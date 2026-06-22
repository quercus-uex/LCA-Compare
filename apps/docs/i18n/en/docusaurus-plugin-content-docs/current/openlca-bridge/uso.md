---
sidebar_label: 'Usage'
sidebar_position: 3
---

# Service Usage

## Endpoint

The service exposes a single endpoint, `POST /capture-acv`, which receives the crop output JSON from the LCA Capture service, runs the LCA calculation in openLCA, and sends the result to LCA Compare for persistence.

Internal processing follows this flow:

1. **`validate_parcela()`** — Validates plot metadata (SIGPAC, cadastral reference, or property identifier).
2. **`get_process_class()`** — Selects the process class according to crop type: `TomateProcess`, `OlivoProcess`, or `VinedoProcess`.
3. **`update_processes()`** — Updates processes in openLCA through the IPC client (`OLCAClient`).
4. **`calculate_impacts()`** — Runs the impact calculation using the product system UUID as reference.
5. **`build_final_result()`** — Builds the structured result from the openLCA output.
6. **`send_result_to_app()`** — Sends the result to LCA Compare with a POST request (best-effort; errors are logged without interrupting the response).

## Calculation Parameters

Both parameters are configurable through environment variables in the service `.env` file.

| Parameter | Default value | Description |
|---|---|---|
| `IMPACT_METHOD_UUID` | `20629e27-b863-4fbe-bbc2-082d3eefd1e5` | UUID of the impact method selected for the calculation. By default, **EF 3.1** (Environmental Footprint 3.1), the method recommended by the European Commission, is used. |
| `CALCULATION_AMOUNT` | `0.001` | Process amount used as reference. Processes in the database are defined for 1 tonne (1000 kg), so a value of `0.001` calculates the impact for 1 kg of production. |

## Integration with LCA Compare

When **LCA Compare** is deployed on the same Docker network (`olca`), the calculation result is automatically transmitted to the `POST /capture` endpoint of LCA Compare through the `ACV_COMPARE_BASE_URL` environment variable.

The LCA Compare frontend also routes calculation requests through the Nginx reverse proxy:

| Route | Destination |
|---|---|
| `/calc` | `lca-bridge:3000/capture-acv` |

## Service Response

After running the LCA calculation in openLCA, the service returns JSON with the original crop metadata and the result broken down into five impact categories. Each category contains an array of objects with the environmental category (`category`), magnitude (`amount`), and unit of measure (`unit`).

```json
{
    "metadatos": {
        "parcela": {
            "id": 3,
            "es_sigpac": { "provincia": 6, "municipio": 5, "poligono": 1, "parcela": 1 },
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
    "resultado": {
        "impacto_fertilizantes": [
            { "category": "Climate change", "amount": 0.312, "unit": "kg CO2 eq" },
            { "category": "Acidification", "amount": 0.004, "unit": "mol H+ eq" },
            { "category": "Eutrophication, freshwater", "amount": 0.001, "unit": "kg P eq" }
        ],
        "impacto_manejo_cultivo": [
            { "category": "Climate change", "amount": 0.185, "unit": "kg CO2 eq" },
            { "category": "Ozone depletion", "amount": 0.000002, "unit": "kg CFC-11 eq" },
            { "category": "Land use", "amount": 12.45, "unit": "No dimension" }
        ],
        "impacto_pesticidas": [
            { "category": "Ecotoxicity, freshwater", "amount": 45.2, "unit": "CTUe" },
            { "category": "Human toxicity, cancer", "amount": 0.0003, "unit": "CTUh" }
        ],
        "impacto_sistema_riego": [
            { "category": "Climate change", "amount": 0.078, "unit": "kg CO2 eq" },
            { "category": "Resource use, minerals and metals", "amount": 0.005, "unit": "kg Sb eq" },
            { "category": "Water use", "amount": 0.52, "unit": "m3 world eq" }
        ],
        "impacto_total": [
            { "category": "Climate change", "amount": 0.575, "unit": "kg CO2 eq" },
            { "category": "Acidification", "amount": 0.004, "unit": "mol H+ eq" },
            { "category": "Eutrophication, freshwater", "amount": 0.001, "unit": "kg P eq" },
            { "category": "Ecotoxicity, freshwater", "amount": 45.2, "unit": "CTUe" },
            { "category": "Water use", "amount": 0.52, "unit": "m3 world eq" }
        ]
    }
}
```

The five impact categories are:

| Category | Description |
|---|---|
| `impacto_fertilizantes` | Impact derived from fertilizer production and application, including NH₃, N₂O, NO₃, and NOₓ emissions. |
| `impacto_manejo_cultivo` | Impact of agricultural operations (tillage, sowing, harvesting), land occupation, and water use. |
| `impacto_pesticidas` | Impact of applied plant protection products, classified according to SimaPro. |
| `impacto_sistema_riego` | Impact of irrigation system materials (pipes, drippers, pump) and water and energy consumption. |
| `impacto_total` | Aggregated sum of all previous categories. |

This same JSON is sent to the **LCA Compare** `POST /capture` endpoint for persistence and visualization.

## Interactive Documentation (Swagger)

LCA Bridge exposes a **Swagger/OpenAPI** interface that allows users to explore and test the `POST /capture-acv` endpoint directly from the browser. The documentation includes the input JSON schema, response codes, and the ability to run test requests.

| Environment | URL |
|---|---|
| Local development | `http://localhost:3000/docs` |
| Production (Docker) | `http://<server-host>:3000/docs` |

:::tip
The OpenAPI specification in JSON format is also available at `/openapi.json`, which is useful for generating clients automatically or importing into tools such as Postman or Insomnia.
:::

## Testing the Service

You can test that the service works correctly through the Swagger interface described above.

To see the full input JSON structure with all documented fields, see the [Input JSON](./json-entrada.md) page. A minimal example with the essential fields is shown below:

```json
{
    "metadatos": {
        "parcela": {
            "id": 3,
            "es_sigpac": { "provincia": 6, "municipio": 5, "poligono": 1, "parcela": 1 },
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
    "riegos": { "tipo": "Sistema de riego horticola" },
    "bombeo": { "cabeas": 9, "potencia": 3, "consumo_l_h": 2 },
    "fitosanitarios": {
        "detalle": [{ "nombre": "Amectoctradin", "clasificacion_simapro": 1, "cantidad_total_produccion": 0.0048 }],
        "agrupado_por_clasificacion": []
    },
    "fertilizantes": { "kg_N": 0.1, "kg_K2O": 0.252, "kg_P2O5": 0.9389 },
    "manejo_cultivo": {
        "labores": [{ "labor_simapro": "Tillage, cultivating, chiselling [CH]", "UF_1_ha_produccion": 0.018 }],
        "ocupacion_suelo": 0.005,
        "uso_de_agua": 5
    },
    "maquinaria": {
        "cosecha_mecanizada": [],
        "maquinas": [{ "id": 6, "nombre": "John Deere 6M 180", "peso": 8500, "vida_h": 14000 }]
    }
}
```
