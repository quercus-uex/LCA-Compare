---
sidebar_label: 'Uso'
sidebar_position: 3
---

# Uso del servicio

## Endpoints

El servicio expone dos endpoints. Ambos reciben como cuerpo el JSON de un cultivo exportado por LCA Capture (ver
[JSON de entrada](./json-entrada.md)), devuelven el mismo resultado y lo envían a LCA-Compare:

| Endpoint | Descripción |
|---|---|
| `POST /capture-acv` | Escribe los flujos del cultivo en los procesos de openLCA y calcula el sistema de producto (unos 6-7 s por cultivo). |
| `POST /capture-acv-coeficientes` | Calcula como combinación lineal de las cantidades de los flujos con coeficientes de impacto obtenidos de openLCA, sin escribir en openLCA. La primera petición de cada cultivo extrae los coeficientes (hasta un minuto) y los guarda en memoria; las siguientes tardan milisegundos. Si cambia la base de datos de openLCA, hay que reiniciar el servicio. |

Ambos endpoints dan el mismo resultado salvo por el redondeo, porque los sistemas de producto son lineales en las
cantidades que se escriben.

## Flujo de procesamiento

```
POST /capture-acv    →    ACVService.execute()
                         ├── validate_parcela()
                         ├── get_process_class()  →  TomateProcess | OlivoProcess | VinedoProcess
                         ├── validate_cultivo()
                         ├── calculate()          →  bajo olca_lock
                         │   ├── update_processes()   →  OLCAClient (olca-ipc)
                         │   ├── calculate_impacts()  →  sistema de producto (process.uuid)
                         │   └── build_final_result()
                         └── send_result_to_lca_compare()  →  POST {LCA_COMPARE_BASE_URL}/capture
```

1. **`validate_parcela()`**: exige al menos un identificador de parcela (SIGPAC con provincia, referencia catastral o
   código predial).
2. **`get_process_class()`**: selecciona la clase de proceso según `metadatos.cultivo.tipo` (`"Tomate"`, `"Olivo"`
   o `"Viñedo"`).
3. **`validate_cultivo()`**: comprueba que `metadatos.cultivo.produccion`, `metadatos.cultivo.superficie_cultivada`,
   `riegos.entre_calles` y, con goteros pinchados, `riegos.entre_arboles` son mayores que 0.
4. **`calculate()`**: escribe los flujos en los subprocesos de openLCA, calcula el sistema de producto y construye el
   resultado. Los procesos de openLCA son compartidos, así que estos pasos se serializan con un bloqueo (`olca_lock`):
   las peticiones concurrentes se atienden de una en una.
5. **`send_result_to_lca_compare()`**: envía el resultado a LCA-Compare (best-effort: los errores se registran en el
   log sin interrumpir la respuesta).

`POST /capture-acv-coeficientes` sigue el mismo flujo, pero sustituye `calculate()` por
`calculate_con_coeficientes()`, que solo usa el bloqueo la primera vez para extraer los coeficientes.

## Respuesta del servicio

La respuesta contiene cinco listas de impactos. Cada elemento indica la categoría de impacto de EF 3.1 (`category`),
la cantidad por kg de producto (`amount`) y su unidad (`unit`). Cada lista incluye todas las categorías del método
(25 en el ejemplo). El siguiente extracto de `examples/example_out.json` del repositorio de LCA Bridge está
**truncado** a tres categorías y con los valores redondeados:

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

| Lista | Descripción |
|---|---|
| `impacto_fertilizantes` | Fertilizantes aplicados y emisiones de la fertilización (NH₃, N₂O, NO₃, NOₓ). |
| `impacto_manejo_cultivo` | Labores agrícolas, cosecha, ocupación del suelo y uso de agua. |
| `impacto_pesticidas` | Producción de los fitosanitarios y emisiones de sus materias activas. |
| `impacto_sistema_riego` | Materiales del sistema de riego y energía de bombeo. |
| `impacto_total` | Impacto total del sistema de producto. En Olivo y Viñedo incluye además el subproceso "Estructuras permanentes" (espaldera y caseta de riego), que no tiene lista propia. |

A LCA-Compare se envía `{ "metadatos": <metadatos de la entrada>, "resultado": <respuesta> }`.

## Códigos de respuesta

| Código | Causa |
|---|---|
| `200` | Cálculo correcto. |
| `400` | Datos no válidos: sin identificador de parcela, tipo de cultivo o de riego desconocido, fitosanitario sin clasificación reconocida o un divisor (`produccion`, `superficie_cultivada`, `entre_calles`, `entre_arboles`) menor o igual que 0. |
| `422` | El JSON no cumple el esquema (campos obligatorios ausentes, tipos incorrectos o campos no definidos). |
| `500` | Error de openLCA (`"Error de OpenLCA: ..."`) o servidor IPC no disponible (`"Error al conectar a OpenLCA"`). |

## Integración con LCA-Compare

En el compose de la plataforma, el resultado se envía a `POST /capture` de LCA-Compare, cuya URL base se configura
con `LCA_COMPARE_BASE_URL`. Desde fuera, el cálculo se expone a través del proxy inverso Nginx del frontend de LCA
Compare:

| Ruta | Destino |
|---|---|
| `/calc` | `lca-bridge:3000/capture-acv` (exige la cabecera `x-api-key` con el valor de `CALC_API_KEY`) |

`POST /capture-acv-coeficientes` no se expone a través de Nginx.

## Documentación interactiva (Swagger)

LCA Bridge expone una interfaz **Swagger/OpenAPI** con el esquema de entrada de ambos endpoints y la posibilidad de
ejecutar peticiones de prueba. La especificación en JSON está en `/openapi.json`.

| Entorno | URL |
|---|---|
| Desarrollo local | `http://localhost:3000/docs` |
| Producción (Docker) | No accesible desde fuera: el puerto 3000 no se publica y el cálculo se expone solo en `/calc` |

Para probar el servicio, puede usarse como cuerpo el fichero `examples/example_in.json` del
[repositorio de LCA Bridge](https://github.com/quercus-uex/LCA-Bridge/blob/main/examples/example_in.json).
