---
sidebar_label: 'Desarrollo'
sidebar_position: 6
---

# Entorno de desarrollo

## DevContainer

Para el desarrollo del servicio he usado [DevContainers](https://containers.dev), una solución basada en Docker que
permite tener entornos aislados para cada desarrollo. Para hacer uso del mismo solo es necesario abrir el repositorio
del servicio en uno de los IDEs con soporte habilitado para DevContainers (Visual Studio Code, PyCharm, ...).

## Instalación de dependencias

Una vez dentro del DevContainer, crea un entorno virtual de Python 3.12+ e instala las dependencias:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Servidor IPC de OpenLCA

El servicio necesita un servidor IPC de OpenLCA en ejecución. La base de datos de OpenLCA debe estar disponible en
`openlca-docker/data/databases/bafu`. Para iniciar el servidor IPC, despliega dicho servicio del Docker Compose:

```bash
docker compose up openlca-ipc
```

## Iniciar el servidor de desarrollo

Para iniciar el servidor en modo desarrollo con hot-reload, ejecuta el siguiente comando dentro de la carpeta `src/`:

```bash
fastapi dev
```

La documentación Swagger estará disponible en `http://localhost:3000/docs`.

## Testing

Los tests usan **pytest** con el cliente de test de **Starlette**. Los fixtures se encuentran en el directorio `test/`:

```bash
# Ejecutar todos los tests con cobertura (recomendado — equivalente a CI)
tox -e py

# Ejecutar un archivo de test concreto
pytest test_main.py

# Ejecutar un test individual
pytest test_main.py::test_dtagro_acv_valid
```

:::note
El test de entrada válida (`test_dtagro_acv_valid`) espera un código **HTTP 500** en lugar de 200, porque el servidor
de OpenLCA no está disponible en el entorno de CI.
:::

No hay linter, formateador ni typechecker configurados.

## Generación de modelos

El archivo `src/models/dtagro_acv_output.py` se genera automáticamente a partir del esquema JSON
`schema/dtagro_schema_v1.json`. No debe editarse manualmente. Para regenerarlo tras modificar el esquema:

```bash
bash utils/generate_output_model.sh
```

## Estructura del proyecto

```
.
├── src/                              # Código fuente del servicio (Python)
│   ├── main.py                       # Punto de entrada de la aplicación FastAPI
│   ├── acv_service.py                # ACVService: lógica principal de cálculo
│   ├── routers/                      # Definición de endpoints
│   ├── services/                     # OLCAClient y gestión de procesos
│   ├── models/                       # Modelos Pydantic
│   │   └── dtagro_acv_output.py      # Autogenerado desde schema/
│   ├── processes/                    # Procesos por tipo de cultivo
│   │   ├── tomate_process.py         # TomateProcess
│   │   ├── olivo_process.py          # OlivoProcess
│   │   └── vinedo_process.py         # VinedoProcess
│   └── templates/                    # Plantillas para cálculos de ACV
├── schema/
│   └── dtagro_schema_v1.json         # Esquema JSON para generación de modelos
├── utils/
│   └── generate_output_model.sh      # Script de regeneración de modelos
├── test/                             # Tests y fixtures
├── openlca-docker/                   # Proyecto Maven/Java del servidor IPC (independiente)
│   └── data/databases/bafu/          # Ruta de la base de datos .zolca
├── requirements.txt                  # Dependencias de Python
├── Dockerfile                        # Imagen del servicio
├── docker-compose.yml                # Orquestación (openlca-ipc + bridge)
├── tox.ini                           # Configuración de tox para testing
└── .devcontainer/                    # Configuración de DevContainer
```
