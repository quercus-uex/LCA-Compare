---
sidebar_label: 'Desarrollo'
sidebar_position: 4
---

# Entorno de desarrollo

Para el desarrollo del servicio he usado [DevContainers](https://containers.dev), una solución basada en Docker que
permite tener entornos aislados para cada desarrollo. Para hacer uso del mismo sólo es necesario abrir el repositorio
del servicio en uno de los IDEs con soporte habilitado para DevContainers (Visual Studio Code, Pycharm, ...).

Una vez dentro del DevContainer, crearemos un entorno virtual de Python e instalaremos las dependencias del mismo:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Para iniciar el servidor IPC de OpenLCA, desplegamos dicho servicio del Docker Compose:

```bash
docker compose up openlca-ipc
```

Para iniciar el servidor en modo desarrollo, ejecuta el siguiente comando dentro de la carpeta `src/`:

```bash
fastapi dev
```