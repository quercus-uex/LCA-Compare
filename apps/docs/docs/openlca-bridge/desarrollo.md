---
sidebar_label: 'Desarrollo'
sidebar_position: 6
---

# Entorno de desarrollo

## Instalación de dependencias

Las dependencias se gestionan con [uv](https://docs.astral.sh/uv/) (`pyproject.toml` + `uv.lock`; Python 3.12, la
misma versión que la imagen Docker). Desde la raíz del repositorio de LCA Bridge:

```bash
uv sync
```

`uv sync` crea `.venv` con las dependencias exactas de `uv.lock`, incluidas las de desarrollo. Las dependencias se
añaden con `uv add <paquete>` (o `uv add --dev <paquete>` si solo se usan en desarrollo) y se actualizan con
`uv lock --upgrade`; `pyproject.toml` y `uv.lock` se suben siempre juntos.

## [Servidor IPC de openLCA](https://github.com/GreenDelta/olca-ipc-container)

El servicio necesita un servidor IPC de openLCA en ejecución. La base de datos de openLCA debe estar disponible en
`openlca-docker/data/databases/ecoinvent`. Para iniciar solo el servidor IPC del `docker-compose.yml` local:

```bash
docker compose up openlca-ipc
```

Este compose publica el servidor IPC en el puerto **3333** del host, mientras que el servicio lo busca por defecto en
`localhost:8080`. Para ejecutar el servicio fuera de Docker contra este contenedor, define `OLCA_PORT=3333` en el
`.env` de la raíz del repositorio.

## Iniciar el servidor de desarrollo

Para iniciar el servidor con recarga automática, desde la raíz del repositorio:

```bash
uv run uvicorn src.main:app --reload --port 3000
```

La documentación Swagger estará disponible en `http://localhost:3000/docs`.

## Testing

Los tests usan **pytest** con el `TestClient` de **Starlette** y no necesitan un servidor de openLCA: el cliente de
openLCA y el envío a LCA-Compare se sustituyen por mocks (`test/mocks.py`), por lo que el test de entrada válida
espera **HTTP 200**. Las fichas de prueba están en `test/`.

```bash
# Ejecutar todos los tests con cobertura (equivalente a CI)
uv run pytest

# Ejecutar un archivo de test concreto
uv run pytest test/test_main.py

# Ejecutar un test individual
uv run pytest test/test_main.py::test_lca_capture_success
```

No hay linter, formateador ni typechecker configurados.

## Generación de modelos

El archivo `src/models/lca_capture_output.py` se genera automáticamente a partir del esquema JSON
`schema/lca_capture_schema_v1.json` y no debe editarse manualmente. Para regenerarlo tras modificar el esquema:

```bash
bash utils/generate_output_model.sh
```

## Estructura del proyecto

```
.
├── src/
│   ├── client/
│   │   └── olca_client.py          # Cliente IPC de openLCA (OLCAClient)
│   ├── models/
│   │   ├── flow_dict.py            # FlowDict: flujos de cada subproceso
│   │   └── lca_capture_output.py   # Modelo de entrada, generado desde schema/ (no editar)
│   ├── processes/
│   │   ├── process.py              # Clase base Process
│   │   ├── tomate.py               # TomateProcess
│   │   ├── olivo.py                # OlivoProcess
│   │   ├── vinedo.py               # VinedoProcess
│   │   ├── calculos.py             # Cálculos comunes (labores, fitosanitarios, riego, estructuras)
│   │   └── datos_referencia.py     # Datos del Excel de referencia (aperos, fitosanitarios, pesos, vidas útiles)
│   ├── services/
│   │   ├── acv_service.py          # ACVService: validación, escritura en openLCA y cálculo
│   │   └── coeficientes.py         # Cálculo con coeficientes, sin escribir en openLCA
│   └── main.py                     # Punto de entrada FastAPI (endpoints)
├── test/                           # Tests (pytest) y fichas de entrada de prueba
├── examples/                       # Ejemplos de entrada y salida
├── schema/
│   └── lca_capture_schema_v1.json  # Esquema JSON de la entrada
├── utils/                          # Utilidades (regeneración del modelo, envío y cálculo de fichas)
├── docs/
│   └── calculo_procesos.md         # Cálculo de los procesos: fórmulas, supuestos y decisiones
├── openlca-docker/                 # Proyecto Maven/Java del servidor IPC (independiente)
│   └── data/databases/ecoinvent/   # Base de datos de openLCA (uso local, no versionada)
├── docker-compose.yml              # Uso local (openlca-ipc + lca-bridge)
├── Dockerfile                      # Imagen del servicio
├── pyproject.toml                  # Dependencias y configuración de pytest
└── uv.lock                         # Versiones exactas de las dependencias
```
