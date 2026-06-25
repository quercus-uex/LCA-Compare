---
sidebar_label: 'Deployment'
sidebar_position: 2
---

# Service Deployment

## Prerequisites

Before deploying the bridge service between LCA Capture and OpenLCA, you need to have downloaded:

- the repository ([https://github.com/quercus-uex/LCA-Bridge](https://github.com/quercus-uex/LCA-Bridge)) (LCA Bridge).
- the database in **.zolca** format with the required processes already defined.

## .zolca Database Configuration

The [OpenLCA IPC server](https://github.com/GreenDelta/olca-ipc-container) uses the `.zolca` database to run environmental impact calculations.

The OpenLCA database (.zolca file) must exist at `openlca-docker/data/databases/bafu` before starting the service. Modify `docker-compose.yml` so the volume mounted in the `openlca-ipc` service points to the folder that contains that database. The following diagram clarifies the structure:

<p align="center">
    <img src="/img/openlca-bridge/volumen-olca-ipc.png" alt="OpenLCA volume diagram" width="400"/>
</p>

:::note
The `openlca-docker/` subdirectory is an independent **Maven/Java** project that builds the OpenLCA IPC server container image. It is unrelated to the Python code of the bridge service.
:::

## Environment Variables

The service reads its configuration from a `.env` file located at the project root. As a starting point, copy the `.env.example` file included in the repository and rename it to `.env`:

```bash
cp .env.example .env
```

Then adjust the values for your environment:

```sh
OLCA_HOST="openlca-ipc"              # OpenLCA IPC server host
OLCA_PORT="8080"                     # OpenLCA IPC server port
ACV_COMPARE_BASE_URL="http://lca-compare-backend:3000"  # LCA Compare base URL

IMPACT_METHOD_UUID="20629e27-b863-4fbe-bbc2-082d3eefd1e5"  # UUID of the impact method (default: EF 3.1)
CALCULATION_AMOUNT="0.001"           # Process amount for the calculation (1000 kg → 0.001 = 1 kg)
```

:::note
The `.env.example` file contains all default values required for a standard deployment. You only need to modify `ACV_COMPARE_BASE_URL` if the LCA Compare URL differs from the default configuration.
:::

## Shared Network with LCA Compare

If you want to communicate this service with **LCA Compare**, you need to create the shared `olca` network:

```bash
docker network create olca
```

Both services must be connected to this network so LCA Compare can receive calculation results and the frontend can route calculation requests through the reverse proxy to the bridge service.

## Deployment with Docker Compose

Once the database is configured and the `olca` network is created, deploy both the OpenLCA IPC server and the bridge service:

```bash
docker compose up -d
```

The service is deployed on port **3000**.

## Verification

After deployment, verify that the service responds correctly:

```bash
# Swagger documentation
curl http://localhost:3000/docs

# Calculation endpoint
curl -X POST http://localhost:3000/capture-acv \
  -H "Content-Type: application/json" \
  -d '{"metadatos": {...}}'
```
