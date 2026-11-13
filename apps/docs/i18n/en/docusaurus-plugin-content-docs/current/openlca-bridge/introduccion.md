---
sidebar_label: 'Introduction'
sidebar_position: 1
---

# Introduction

**LCA Bridge** is a **Python 3.12** microservice built with **FastAPI** that acts as a bridge between the **LCA Capture** platform and the **openLCA** Life Cycle Assessment calculation engine. It receives crop data exported by LCA Capture, calculates its environmental impact in openLCA through the [openLCA IPC server](https://github.com/GreenDelta/olca-ipc-container), and sends the result to [LCA-Compare](https://github.com/quercus-uex/LCA-Compare) for visualization and comparison.

LCA Bridge, the openLCA IPC server, and LCA-Compare are deployed with the same Docker Compose file (`deploy/compose.yaml`) and communicate through its internal network. The data flow is: LCA Capture → LCA Bridge (calculation) → LCA-Compare (persistence and visualization).

## Features

- **LCA calculation** of a crop through two endpoints with the same input and output: `POST /capture-acv` (writes the flows to openLCA and calculates) and `POST /capture-acv-coeficientes` (calculates with in-memory coefficients, without writing to openLCA). The processing flow is described in [Usage](./uso.md).
- **Crop-type-specific processes**: `TomateProcess`, `OlivoProcess`, and `VinedoProcess`, selected according to `metadatos.cultivo.tipo` (see [Process Definition](./procesos.md)).
- **EF 3.1 impact method** (Environmental Footprint 3.1); results are expressed per kg of product.
- **Result delivery** to LCA-Compare (best-effort: a delivery failure is logged and does not affect the response).
- **Swagger documentation** at `/docs`.

The configuration (environment variables) is detailed in [Deployment](./despliegue.md#environment-variables).

## Architecture

| Component | Technology | Port |
|---|---|---|
| **LCA Bridge** | FastAPI (Python 3.12) | 3000 |
| **openLCA IPC** | Java 21 (Maven, `openlca-docker/`) | 8080 *(internal)* |

## Technology Stack

- **Python 3.12** with **FastAPI**; dependencies managed with **uv** (`pyproject.toml` + `uv.lock`)
- **openLCA** as the LCA calculation engine (Java IPC server), with the process database mounted as a volume
- **Docker** for deployment
- **pytest** (with coverage) for testing
