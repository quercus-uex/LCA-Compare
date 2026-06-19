---
sidebar_label: 'Introduction'
sidebar_position: 1
---

# Introduction

**Capture ACV** is a **Python 3.12+** microservice built with **FastAPI** that acts as a bridge between the **DTAgro** platform and the **openLCA** Life Cycle Assessment calculation engine using a database in **.zolca** format. It receives crop data from DTAgro, runs the environmental impact calculation in openLCA through its IPC server, and sends the result to [ACV Compare](https://github.com/quercus-uex/Ventum-ACV-Visualizer) for visualization and comparison.

Communication between both services happens through a shared Docker network (`olca`), which allows the complete LCA calculation and visualization flow to be orchestrated in a decoupled way.

## Processing Flow

```
POST /capture-acv    →    ACVService.execute()
                         ├── validate_parcela()
                         ├── get_process_class()  →  TomateProcess | OlivoProcess | VinedoProcess
                         ├── update_processes()   →  OLCAClient (olca-ipc)
                         ├── calculate_impacts()  →  uses process.uuid (product system UUID)
                         ├── build_final_result()
                         └── send_result_to_app() →  POST to ACV Compare (best-effort, errors logged)
```

- **`IMPACT_METHOD_UUID`**: UUID of the impact method selected for the calculation. By default, **EF 3.1** (Environmental Footprint 3.1) is used, the method recommended by the European Commission for product environmental impact assessment. It is configurable through an environment variable.
- **`CALCULATION_AMOUNT`**: amount of the process used as the LCA calculation reference. Its default value is `0.001` because processes in the database are defined for 1 tonne (1000 kg), so `0.001` calculates the impact of 1 kg of production. It is configurable through an environment variable.

## Features

- **Crop data reception** from DTAgro through the `POST /capture-acv` endpoint.
- **LCA calculation** delegated to the openLCA IPC server using the processes defined in the .zolca database.
- **Crop-type-specific processes**: `TomateProcess`, `OlivoProcess`, and `VinedoProcess`, automatically selected according to crop metadata.
- **Result delivery** to ACV Compare for persistence, visualization, and comparison (best-effort).
- **Interactive Swagger documentation** at `/docs`.

## Environment Variables

| Variable | Description |
|---|---|
| `OLCA_HOST` | OpenLCA IPC server host |
| `OLCA_PORT` | OpenLCA IPC server port |
| `ACV_COMPARE_BASE_URL` | Base URL of the ACV Compare service for result delivery |
| `IMPACT_METHOD_UUID` | UUID of the impact method for the calculation (default: EF 3.1) |
| `CALCULATION_AMOUNT` | Process amount used as calculation reference (default `0.001`, equivalent to 1 kg) |

## Architecture

The service follows a microservice architecture with two components:

| Component | Technology | Port |
|---|---|---|
| **Capture ACV** | FastAPI (Python 3.12+) | 3000 |
| **OpenLCA IPC** | Java (Maven, `openlca-docker/`) | *(internal)* |

The data flow is: DTAgro → Capture ACV (calculation) → ACV Compare (persistence and visualization).

## Technology Stack

- **Python 3.12+** with **FastAPI** as REST framework
- **openLCA** as the LCA calculation engine (Java IPC server)
- **.zolca database** for environmental impact processes
- **Docker** for service deployment and orchestration
- **Swagger/OpenAPI** for API documentation
- **tox + pytest** for testing with coverage
