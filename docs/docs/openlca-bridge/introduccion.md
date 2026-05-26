---
sidebar_label: 'Introducción'
sidebar_position: 1
---

# Introducción

**OpenLCA Bridge** es un microservicio **Python 3.12+** con **FastAPI** que actúa como puente entre la plataforma
**Ventum ACV** y el motor de cálculo de Análisis de Ciclo de Vida **openLCA** con base de datos **Ecoinvent**. Recibe
los datos de un cultivo desde Ventum ACV, ejecuta el cálculo de impacto ambiental en openLCA a través de su servidor
IPC y envía el resultado a [ACV Compare](https://github.com/quercus-uex/Ventum-ACV-Visualizer) para su visualización y
comparativa.

La comunicación entre ambos servicios se realiza a través de una red Docker compartida (`olca`), lo que permite
orquestar todo el flujo de cálculo y visualización de ACV de forma desacoplada.

## Flujo de procesamiento

```
POST /ventum-acv    →    ACVService.execute()
                         ├── validate_parcela()
                         ├── get_process_class()  →  TomateProcess | OlivoProcess | VinedoProcess
                         ├── update_processes()   →  OLCAClient (olca-ipc)
                         ├── calculate_impacts()  →  usa process.uuid (UUID del sistema de producto)
                         ├── build_final_result()
                         └── send_result_to_app() →  POST a ACV Compare (best-effort, errores logueados)
```

- **`IMPACT_METHOD_UUID`**: `20629e27-b863-4fbe-bbc2-082d3eefd1e5` (hardcodeado en `acv_service.py`).
- **`CALCULATION_AMOUNT`**: `0.001` (cantidad de referencia usada en los cálculos).

## Funcionalidades

- **Recepción de datos de cultivo** desde Ventum ACV mediante el endpoint `POST /ventum-acv`.
- **Cálculo de ACV** delegando en el servidor IPC de openLCA con los procesos definidos en la base de datos Ecoinvent.
- **Procesos específicos por tipo de cultivo**: `TomateProcess`, `OlivoProcess` y `VinedoProcess`, seleccionados
  automáticamente según los metadatos del cultivo.
- **Envío de resultados** a ACV Compare para su persistencia, visualización y comparativa (best-effort).
- **Documentación Swagger** interactiva en la ruta `/docs`.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `OLCA_HOST` | Host del servidor IPC de OpenLCA |
| `OLCA_PORT` | Puerto del servidor IPC de OpenLCA |
| `ACV_COMPARE_BASE_URL` | URL base del servicio ACV Compare para envío de resultados |

## Arquitectura

El servicio sigue una arquitectura de microservicio con dos componentes:

| Componente | Tecnología | Puerto |
|---|---|---|
| **OpenLCA Bridge** | FastAPI (Python 3.12+) | 3000 |
| **OpenLCA IPC** | Java (Maven, `openlca-docker/`) | *(interno)* |

El flujo de datos es: Ventum ACV → OpenLCA Bridge (cálculo) → ACV Compare (persistencia y visualización).

## Stack tecnológico

- **Python 3.12+** con **FastAPI** como framework REST
- **openLCA** como motor de cálculo de ACV (servidor IPC Java)
- **Base de datos Ecoinvent** para procesos de impacto ambiental
- **Docker** para despliegue y orquestación de servicios
- **Swagger/OpenAPI** para documentación de la API
- **tox + pytest** para testing con cobertura
