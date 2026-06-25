---
sidebar_label: 'Introducción'
sidebar_position: 1
---

# Introducción

**LCA Bridge** es un microservicio **Python 3.12+** con **FastAPI** que actúa como puente entre la plataforma
**LCA Capture** y el motor de cálculo de Análisis de Ciclo de Vida **openLCA** con base de datos en formato **.zolca**. Recibe
los datos de un cultivo desde LCA Capture, ejecuta el cálculo de impacto ambiental en openLCA a través del
[servidor IPC de OpenLCA](https://github.com/GreenDelta/olca-ipc-container) y envía el resultado a
[LCA Compare](https://github.com/quercus-uex/LCA-Compare) para su visualización y comparativa.

La comunicación entre ambos servicios se realiza a través de una red Docker compartida (`olca`), lo que permite
orquestar todo el flujo de cálculo y visualización de ACV de forma desacoplada.

## Flujo de procesamiento

```
POST /capture-acv    →    ACVService.execute()
                         ├── validate_parcela()
                         ├── get_process_class()  →  TomateProcess | OlivoProcess | VinedoProcess
                         ├── update_processes()   →  OLCAClient (olca-ipc)
                         ├── calculate_impacts()  →  usa process.uuid (UUID del sistema de producto)
                         ├── build_final_result()
                          └── send_result_to_app() →  POST a LCA Compare (best-effort, errores logueados)
```

- **`IMPACT_METHOD_UUID`**: UUID del método de impacto seleccionado para el cálculo. Por defecto se utiliza
  **EF 3.1** (Environmental Footprint 3.1), el método recomendado por la Comisión Europea para la evaluación de
  impacto ambiental de productos. Es configurable mediante variable de entorno.
- **`CALCULATION_AMOUNT`**: cantidad del proceso que se utiliza como referencia en el cálculo de ACV. Su valor por
  defecto es `0.001` porque los procesos en la base de datos están definidos para 1 tonelada (1000 kg), de modo que con
  `0.001` se calcula el impacto de 1 kg de producción. Es configurable mediante variable de entorno.

## Funcionalidades

- **Recepción de datos de cultivo** desde LCA Capture mediante el endpoint `POST /capture-acv`.
- **Cálculo de ACV** delegando en el servidor IPC de openLCA con los procesos definidos en la base de datos .zolca.
- **Procesos específicos por tipo de cultivo**: `TomateProcess`, `OlivoProcess` y `VinedoProcess`, seleccionados
  automáticamente según los metadatos del cultivo.
- **Envío de resultados** a LCA Compare para su persistencia, visualización y comparativa (best-effort).
- **Documentación Swagger** interactiva en la ruta `/docs`.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `OLCA_HOST` | Host del servidor IPC de OpenLCA |
| `OLCA_PORT` | Puerto del servidor IPC de OpenLCA |
| `ACV_COMPARE_BASE_URL` | URL base del servicio LCA Compare para envío de resultados |
| `IMPACT_METHOD_UUID` | UUID del método de impacto para el cálculo (por defecto, EF 3.1) |
| `CALCULATION_AMOUNT` | Cantidad del proceso usada como referencia en el cálculo (por defecto `0.001`, equivalente a 1 kg) |

## Arquitectura

El servicio sigue una arquitectura de microservicio con dos componentes:

| Componente | Tecnología | Puerto |
|---|---|---|
| **LCA Bridge** | FastAPI (Python 3.12+) | 3000 |
| **OpenLCA IPC** | Java (Maven, `openlca-docker/`) | *(interno)* |

El flujo de datos es: LCA Capture → LCA Bridge (cálculo) → LCA Compare (persistencia y visualización).

## Stack tecnológico

- **Python 3.12+** con **FastAPI** como framework REST
- **openLCA** como motor de cálculo de ACV (servidor IPC Java)
- **Base de datos .zolca** para procesos de impacto ambiental
- **Docker** para despliegue y orquestación de servicios
- **Swagger/OpenAPI** para documentación de la API
- **tox + pytest** para testing con cobertura
