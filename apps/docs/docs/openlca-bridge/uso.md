---
sidebar_label: 'Uso'
sidebar_position: 3
---

# Uso del servicio

## Endpoint

El servicio expone un único endpoint, `POST /capture-acv`, que recibe como cuerpo el JSON de salida de un cultivo del
servicio de LCA Capture, ejecuta el cálculo de ACV en openLCA y envía el resultado a LCA Compare para su persistencia.

El procesamiento interno sigue el siguiente flujo:

1. **`validate_parcela()`** — Valida los metadatos de la parcela (SIGPAC, referencia catastral o predial).
2. **`get_process_class()`** — Selecciona la clase de proceso según el tipo de cultivo: `TomateProcess`, `OlivoProcess`
   o `VinedoProcess`.
3. **`update_processes()`** — Actualiza los procesos en openLCA a través del cliente IPC (`OLCAClient`).
4. **`calculate_impacts()`** — Ejecuta el cálculo de impacto usando el UUID del sistema de producto como referencia.
5. **`build_final_result()`** — Construye el resultado estructurado a partir de la salida de openLCA.
6. **`send_result_to_app()`** — Envía el resultado a LCA Compare mediante un POST (best-effort; los errores se
   registran en el log sin interrumpir la respuesta).

## Parámetros de cálculo

Ambos parámetros son configurables mediante variables de entorno en el `.env` del servicio.

| Parámetro | Valor por defecto | Descripción |
|---|---|---|
| `IMPACT_METHOD_UUID` | `20629e27-b863-4fbe-bbc2-082d3eefd1e5` | UUID del método de impacto seleccionado para el cálculo. Por defecto se utiliza **EF 3.1** (Environmental Footprint 3.1), el método recomendado por la Comisión Europea. |
| `CALCULATION_AMOUNT` | `0.001` | Cantidad del proceso usada como referencia. Los procesos en la base de datos están definidos para 1 tonelada (1000 kg), por lo que un valor de `0.001` calcula el impacto correspondiente a 1 kg de producción. |

## Integración con LCA Compare

Cuando **LCA Compare** está desplegado en la misma red Docker (`olca`), el resultado del cálculo se transmite
automáticamente al endpoint `POST /capture` de LCA Compare mediante la variable de entorno `ACV_COMPARE_BASE_URL`.

A su vez, el frontend de LCA Compare enruta las peticiones de cálculo a través del proxy inverso Nginx:

| Ruta | Destino |
|---|---|
| `/calc` | `lca-bridge:3000/capture-acv` |

## Respuesta del servicio

Tras ejecutar el cálculo de ACV en openLCA, el servicio devuelve un JSON con los metadatos originales del cultivo y el
resultado desglosado en cinco categorías de impacto. Cada categoría contiene un array de objetos con la categoría
ambiental (`category`), la magnitud (`amount`) y la unidad de medida (`unit`). Los cálculos se han llevado a cabo
siguiendo los procesos de cálculo de ACV definidos por CICYTEX. A continuación se muestra un ejemplo de la salida del
cálculo de ACV realizado.

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

Las cinco categorías de impacto son:

| Categoría | Descripción |
|---|---|
| `impacto_fertilizantes` | Impacto derivado de la fabricación y aplicación de fertilizantes, incluyendo emisiones de NH₃, N₂O, NO₃ y NOₓ. |
| `impacto_manejo_cultivo` | Impacto de las labores agrícolas (labranza, siembra, cosecha), ocupación del suelo y uso de agua. |
| `impacto_pesticidas` | Impacto de los productos fitosanitarios aplicados, clasificados según SimaPro. |
| `impacto_sistema_riego` | Impacto de los materiales del sistema de riego (tuberías, goteros, bomba) y del consumo de agua y energía. |
| `impacto_total` | Suma agregada de todas las categorías anteriores. |

Este mismo JSON es el que se envía al endpoint `POST /capture` de **LCA Compare** para su persistencia y visualización.

## Documentación interactiva (Swagger)

LCA Bridge expone una interfaz **Swagger/OpenAPI** que permite explorar y probar el endpoint `POST /capture-acv`
directamente desde el navegador. La documentación incluye el esquema del JSON de entrada, los códigos de respuesta
y la posibilidad de ejecutar peticiones de prueba.

| Entorno | URL |
|---|---|
| Desarrollo local | `http://localhost:3000/docs` |
| Producción (Docker) | `http://<host-del-servidor>:3000/docs` |

:::tip
La especificación OpenAPI en formato JSON también está disponible en `/openapi.json`, útil para generar clientes
automáticamente o importar en herramientas como Postman o Insomnia.
:::

## Probar el servicio

Puedes probar el correcto funcionamiento del servicio a través de la interfaz Swagger descrita arriba.

Para ver la estructura completa del JSON de entrada con todos sus campos documentados, consulta la página
[JSON de entrada](./json-entrada.md). A continuación se muestra un ejemplo mínimo con los campos esenciales:

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
