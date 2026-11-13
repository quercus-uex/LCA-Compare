---
sidebar_label: 'Usage'
sidebar_position: 3
---

# Service Usage

## Endpoints

The service exposes two endpoints. Both take as their body the JSON of a crop exported by LCA Capture (see [Input JSON](./json-entrada.md)), return the same result, and send it to LCA-Compare:

| Endpoint | Description |
|---|---|
| `POST /capture-acv` | Writes the crop flows to the openLCA processes and calculates the product system (about 6-7 s per crop). |
| `POST /capture-acv-coeficientes` | Calculates the result as a linear combination of the flow amounts with impact coefficients obtained from openLCA, without writing to openLCA. The first request for each crop extracts the coefficients (up to a minute) and keeps them in memory; subsequent requests take milliseconds. If the openLCA database changes, the service must be restarted. |

Both endpoints give the same result except for rounding, because the product systems are linear in the amounts that are written.

## Processing Flow

```
POST /capture-acv    →    ACVService.execute()
                         ├── validate_parcela()
                         ├── get_process_class()  →  TomateProcess | OlivoProcess | VinedoProcess
                         ├── validate_cultivo()
                         ├── calculate()          →  under olca_lock
                         │   ├── update_processes()   →  OLCAClient (olca-ipc)
                         │   ├── calculate_impacts()  →  product system (process.uuid)
                         │   └── build_final_result()
                         └── send_result_to_lca_compare()  →  POST {LCA_COMPARE_BASE_URL}/capture
```

1. **`validate_parcela()`**: requires at least one plot identifier (SIGPAC with province, cadastral reference, or property code).
2. **`get_process_class()`**: selects the process class according to `metadatos.cultivo.tipo` (`"Tomate"`, `"Olivo"`, or `"Viñedo"`).
3. **`validate_cultivo()`**: checks that `metadatos.cultivo.produccion`, `metadatos.cultivo.superficie_cultivada`, `riegos.entre_calles` and, with pierced drippers, `riegos.entre_arboles` are greater than 0.
4. **`calculate()`**: writes the flows to the openLCA subprocesses, calculates the product system, and builds the result. The openLCA processes are shared, so these steps are serialized with a lock (`olca_lock`): concurrent requests are handled one at a time.
5. **`send_result_to_lca_compare()`**: sends the result to LCA-Compare (best-effort: errors are logged without interrupting the response).

`POST /capture-acv-coeficientes` follows the same flow, but replaces `calculate()` with `calculate_con_coeficientes()`, which only uses the lock the first time, to extract the coefficients.

## Service Response

The response contains five impact lists. Each element gives the EF 3.1 impact category (`category`), the amount per kg of product (`amount`), and its unit (`unit`). Each list includes every category of the method (25 in the example). The following excerpt from `examples/example_out.json` in the LCA Bridge repository is **truncated** to three categories, with rounded values:

```json
{
    "impacto_fertilizantes": [
        { "category": "Acidification", "amount": 0.004324, "unit": "mol H+ eq" },
        { "category": "Water use", "amount": -0.01905, "unit": "m3 world eq" },
        { "category": "Climate change", "amount": 0.9131, "unit": "kg CO2 eq" }
    ],
    "impacto_manejo_cultivo": [
        { "category": "Acidification", "amount": 0.002339, "unit": "mol H+ eq" },
        { "category": "Water use", "amount": 0.2733, "unit": "m3 world eq" },
        { "category": "Climate change", "amount": 0.4017, "unit": "kg CO2 eq" }
    ],
    "impacto_pesticidas": [
        { "category": "Acidification", "amount": 0.000004240, "unit": "mol H+ eq" },
        { "category": "Water use", "amount": -0.00002757, "unit": "m3 world eq" },
        { "category": "Climate change", "amount": 0.0003020, "unit": "kg CO2 eq" }
    ],
    "impacto_sistema_riego": [
        { "category": "Acidification", "amount": 0.00001233, "unit": "mol H+ eq" },
        { "category": "Water use", "amount": 0.1141, "unit": "m3 world eq" },
        { "category": "Climate change", "amount": 0.004235, "unit": "kg CO2 eq" }
    ],
    "impacto_total": [
        { "category": "Acidification", "amount": 0.006679, "unit": "mol H+ eq" },
        { "category": "Water use", "amount": 0.3683, "unit": "m3 world eq" },
        { "category": "Climate change", "amount": 1.319, "unit": "kg CO2 eq" }
    ]
}
```

| List | Description |
|---|---|
| `impacto_fertilizantes` | Applied fertilizers and fertilization emissions (NH₃, N₂O, NO₃, NOₓ). |
| `impacto_manejo_cultivo` | Agricultural operations, harvesting, land occupation, and water use. |
| `impacto_pesticidas` | Production of plant protection products and emissions of their active ingredients. |
| `impacto_sistema_riego` | Irrigation system materials and pumping energy. |
| `impacto_total` | Total impact of the product system. For Olivo and Viñedo it also includes the "Estructuras permanentes" subprocess (trellis and irrigation shed), which has no list of its own. |

LCA-Compare receives `{ "metadatos": <input metadata>, "resultado": <response> }`.

## Response Codes

| Code | Cause |
|---|---|
| `200` | Successful calculation. |
| `400` | Invalid data: no plot identifier, unknown crop or irrigation type, a plant protection product without a recognized classification, or a divisor (`produccion`, `superficie_cultivada`, `entre_calles`, `entre_arboles`) less than or equal to 0. |
| `422` | The JSON does not match the schema (missing required fields, wrong types, or undefined fields). |
| `500` | openLCA error (`"Error de OpenLCA: ..."`) or IPC server unavailable (`"Error al conectar a OpenLCA"`). |

## Integration with LCA-Compare

In the platform compose file, the result is sent to the `POST /capture` endpoint of LCA-Compare, whose base URL is configured with `LCA_COMPARE_BASE_URL`. From outside, the calculation is exposed through the Nginx reverse proxy of the LCA-Compare frontend:

| Route | Destination |
|---|---|
| `/calc` | `lca-bridge:3000/capture-acv` (requires the `x-api-key` header with the value of `CALC_API_KEY`) |

`POST /capture-acv-coeficientes` is not exposed through Nginx.

## Interactive Documentation (Swagger)

LCA Bridge exposes a **Swagger/OpenAPI** interface with the input schema of both endpoints and the ability to run test requests. The JSON specification is available at `/openapi.json`.

| Environment | URL |
|---|---|
| Local development | `http://localhost:3000/docs` |
| Production (Docker) | Not reachable from outside: port 3000 is not published and the calculation is only exposed at `/calc` |

To test the service, you can use the `examples/example_in.json` file from the [LCA Bridge repository](https://github.com/quercus-uex/LCA-Bridge/blob/main/examples/example_in.json) as the request body.
