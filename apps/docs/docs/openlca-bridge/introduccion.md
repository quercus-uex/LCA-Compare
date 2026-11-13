---
sidebar_label: 'Introducción'
sidebar_position: 1
---

# Introducción

**LCA Bridge** es un microservicio Python 3.12 con FastAPI que conecta la plataforma LCA Capture con openLCA, el
motor de cálculo de Análisis de Ciclo de Vida. Recibe los datos de un cultivo
exportados por LCA Capture, calcula su impacto ambiental en openLCA a través del
[servidor IPC de openLCA](https://github.com/GreenDelta/olca-ipc-container) y envía el resultado a
[LCA-Compare](https://github.com/quercus-uex/LCA-Compare) para su visualización y comparativa.

LCA Bridge, el servidor IPC de openLCA y LCA-Compare se despliegan en el mismo Docker Compose
(`deploy/compose.yaml`) y se comunican por su red interna. El flujo de datos es: LCA Capture → LCA Bridge (cálculo)
→ LCA-Compare (persistencia y visualización).

## Funcionalidades

- **Cálculo de ACV** de un cultivo mediante dos endpoints con la misma entrada y salida: `POST /capture-acv`
  (escribe los flujos en openLCA y calcula) y `POST /capture-acv-coeficientes` (calcula con coeficientes en memoria,
  sin escribir en openLCA). El flujo de procesamiento se describe en [Uso](./uso.md).
- **Procesos por tipo de cultivo**: `TomateProcess`, `OlivoProcess` y `VinedoProcess`, seleccionados según
  `metadatos.cultivo.tipo` (ver [Definición de procesos](./procesos.md)).
- **Método de impacto EF 3.1** (Environmental Footprint 3.1); los resultados se expresan por kg de producto.
- **Envío de resultados** a LCA-Compare (best-effort: un fallo en el envío se registra en el log y no afecta a la
  respuesta).
- **Documentación Swagger** en la ruta `/docs`.

La configuración (variables de entorno) se detalla en [Despliegue](./despliegue.md#variables-de-entorno).

## Arquitectura

| Componente | Tecnología | Puerto |
|---|---|---|
| **LCA Bridge** | FastAPI (Python 3.12) | 3000 |
| **openLCA IPC** | Java 21 (Maven, `openlca-docker/`) | 8080 *(interno)* |

## Stack tecnológico

- **Python 3.12** con FastAPI; dependencias gestionadas con uv (`pyproject.toml` + `uv.lock`)
- **openLCA** como motor de cálculo de ACV (servidor IPC Java) con la base de datos de procesos montada como volumen
- **Docker** para despliegue
- **pytest** (con cobertura) para testing
