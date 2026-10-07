---
sidebar_label: 'Deployment'
sidebar_position: 2
---

# Service Deployment

In production, LCA Bridge and the [OpenLCA IPC server](https://github.com/GreenDelta/olca-ipc-container) are deployed together with LCA Compare using the platform compose file (`deploy/compose.yaml` in the [LCA-Compare](https://github.com/quercus-uex/LCA-Compare) repository), with the `ghcr.io/quercus-uex/lca-bridge` and `ghcr.io/quercus-uex/openlca-ipc` images. The general steps (server preparation, `.env`, startup, and updates) are described in [ACV Compare deployment](../acv-compare/despliegue.md).

## Prerequisites

- The OpenLCA database with the required processes already defined. It is not included in the image for licensing reasons.
- The platform `.env` with `OLCA_DATA_DIR` pointing to the directory that contains that database.

## OpenLCA Data

The OpenLCA IPC server uses the database to run environmental impact calculations. The server directory `OLCA_DATA_DIR` is mounted into the `openlca-ipc` container as `/app/data`, and the service starts with `-db ecoinvent`, so the database must be at `<OLCA_DATA_DIR>/databases/ecoinvent`. The following diagram clarifies the volume structure:

<p align="center">
    <img src="/img/openlca-bridge/volumen-olca-ipc.png" alt="OpenLCA volume diagram" width="400"/>
</p>

:::note
The `openlca-docker/` subdirectory is an independent **Maven/Java** project that builds the OpenLCA IPC server container image. It is unrelated to the Python code of the bridge service.
:::

## Environment Variables

The service reads its configuration from the following environment variables. In production, `deploy/compose.yaml` sets the first three and the rest use their default values:

| Variable | Production value | Description |
|---|---|---|
| `OLCA_HOST` | `http://openlca-ipc` | OpenLCA IPC server host |
| `OLCA_PORT` | `8080` | OpenLCA IPC server port |
| `LCA_COMPARE_BASE_URL` | `http://lca-compare-backend:3000` | LCA Compare base URL for sending results |
| `IMPACT_METHOD_UUID` | `20629e27-b863-4fbe-bbc2-082d3eefd1e5` | Impact method UUID (EF 3.1 by default) |
| `CALCULATION_AMOUNT` | `0.001` | Process amount for the calculation (1000 kg → 0.001 = 1 kg) |

## Network and Access

LCA Bridge, the IPC server, and LCA Compare share the project network (`lca-platform_default`) and reach each other by service name. Neither service publishes ports: from outside, the calculation is only reachable through the `/calc` route of the LCA Compare frontend, which requires the `x-api-key` header.

## Publishing and Updating

The `.github/workflows/build.yml` workflow in the LCA Bridge repository publishes the `lca-bridge` and `openlca-ipc` images on every push to `main`, tagged `main` and `sha-<hash>`. Once they are published, update only these services on the server:

```bash
cd ~/lca-platform
docker compose pull lca-bridge openlca-ipc
docker compose up -d lca-bridge openlca-ipc
```

## Running Locally with Docker Compose

The `docker-compose.yml` file in the LCA Bridge repository starts the service locally by building the images. The database must be at `openlca-docker/data/databases/ecoinvent`:

```bash
docker compose up -d
```

The bridge service listens on port **3000** and the IPC server on **3333**. Results are sent to `http://host.docker.internal:8000` (the LCA Compare backend in development) unless `LCA_COMPARE_BASE_URL` is set.

## Verification

In production, from outside the server:

```bash
# Without an API key (must return 401)
curl -i -X POST http://<server>/calc

# Calculation with the sample input from the LCA Bridge repository
curl -X POST http://<server>/calc \
  -H "x-api-key: <CALC_API_KEY>" \
  -H "Content-Type: application/json" \
  -d @examples/example_in.json
```

Locally:

```bash
# Swagger documentation
curl http://localhost:3000/docs

# Calculation endpoint
curl -X POST http://localhost:3000/capture-acv \
  -H "Content-Type: application/json" \
  -d @examples/example_in.json
```
