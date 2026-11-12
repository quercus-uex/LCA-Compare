---
sidebar_label: 'Development'
sidebar_position: 6
---

# Development Environment

## Dependency Installation

Dependencies are managed with [uv](https://docs.astral.sh/uv/) (`pyproject.toml` + `uv.lock`; Python 3.12, the same version as the Docker image). From the root of the LCA Bridge repository:

```bash
uv sync
```

`uv sync` creates `.venv` with the exact dependencies from `uv.lock`, including development dependencies. Add dependencies with `uv add <package>` (or `uv add --dev <package>` if they are only used in development) and update them with `uv lock --upgrade`; always commit `pyproject.toml` and `uv.lock` together.

## [openLCA IPC Server](https://github.com/GreenDelta/olca-ipc-container)

The service requires a running openLCA IPC server. The openLCA database must be available at `openlca-docker/data/databases/ecoinvent`. To start only the IPC server from the local `docker-compose.yml`:

```bash
docker compose up openlca-ipc
```

This compose file publishes the IPC server on host port **3333**, while the service looks for it at `localhost:8080` by default. To run the service outside Docker against this container, set `OLCA_PORT=3333` in the `.env` file at the repository root.

## Start the Development Server

To start the server with hot reload, from the repository root:

```bash
uv run uvicorn src.main:app --reload --port 3000
```

Swagger documentation is available at `http://localhost:3000/docs`.

## Testing

Tests use **pytest** with the **Starlette** `TestClient` and do not need an openLCA server: the openLCA client and the delivery to LCA Compare are replaced by mocks (`test/mocks.py`), so the valid input test expects **HTTP 200**. The test input files are located in `test/`.

```bash
# Run all tests with coverage (equivalent to CI)
uv run pytest

# Run a specific test file
uv run pytest test/test_main.py

# Run an individual test
uv run pytest test/test_main.py::test_lca_capture_success
```

There is no configured linter, formatter, or typechecker.

## Model Generation

The `src/models/lca_capture_output.py` file is automatically generated from the `schema/lca_capture_schema_v1.json` JSON schema and must not be edited manually. To regenerate it after modifying the schema:

```bash
bash utils/generate_output_model.sh
```

## Project Structure

```
.
├── src/
│   ├── client/
│   │   └── olca_client.py          # openLCA IPC client (OLCAClient)
│   ├── models/
│   │   ├── flow_dict.py            # FlowDict: flows of each subprocess
│   │   └── lca_capture_output.py   # Input model, generated from schema/ (do not edit)
│   ├── processes/
│   │   ├── process.py              # Process base class
│   │   ├── tomate.py               # TomateProcess
│   │   ├── olivo.py                # OlivoProcess
│   │   ├── vinedo.py               # VinedoProcess
│   │   ├── calculos.py             # Shared calculations (operations, plant protection, irrigation, structures)
│   │   └── datos_referencia.py     # Data from the reference Excel file (implements, plant protection, weights, service lives)
│   ├── services/
│   │   ├── acv_service.py          # ACVService: validation, writing to openLCA, and calculation
│   │   └── coeficientes.py         # Calculation with coefficients, without writing to openLCA
│   └── main.py                     # FastAPI entry point (endpoints)
├── test/                           # Tests (pytest) and test input files
├── examples/                       # Input and output examples
├── schema/
│   └── lca_capture_schema_v1.json  # Input JSON schema
├── utils/                          # Utilities (model regeneration, sending and calculating input files)
├── docs/
│   └── calculo_procesos.md         # Process calculation: formulas, assumptions, and decisions
├── openlca-docker/                 # Maven/Java IPC server project (independent)
│   └── data/databases/ecoinvent/   # openLCA database (local use, not versioned)
├── docker-compose.yml              # Local use (openlca-ipc + lca-bridge)
├── Dockerfile                      # Service image
├── pyproject.toml                  # Dependencies and pytest configuration
└── uv.lock                         # Exact dependency versions
```
