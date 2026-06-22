---
sidebar_label: 'Despliegue'
sidebar_position: 2
---

# Despliegue del servicio

## Requisitos previos

Antes de desplegar el servicio puente entre LCA Capture y OpenLCA, necesitas tener descargado:

- el repositorio ([https://github.com/quercus-uex/Ventum-OpenLCA-Service](https://github.com/quercus-uex/Ventum-OpenLCA-Service)) (LCA Bridge).
- la base de datos en formato **.zolca** con los procesos necesarios ya definidos.

## Configuración de la base de datos .zolca

La base de datos de OpenLCA (archivo .zolca) debe existir en la ruta `openlca-docker/data/databases/bafu` antes de
iniciar el servicio. Modifica el fichero `docker-compose.yml` para que el volumen montado en el servicio `openlca-ipc`
apunte a la carpeta contenedora de dicha base de datos. A continuación se muestra un gráfico aclaratorio:

<p align="center">
    <img src="/img/openlca-bridge/volumen-olca-ipc.png" alt="Gráfico volumen OpenLCA" width="400"/>
</p>

:::note
El subdirectorio `openlca-docker/` es un proyecto **Maven/Java** independiente que construye la imagen del contenedor
del servidor IPC de OpenLCA. No tiene relación con el código Python del servicio puente.
:::

## Variables de entorno

El servicio lee su configuración desde un archivo `.env` ubicado en la raíz del proyecto. Como punto de partida,
copia el archivo `.env.example` incluido en el repositorio y renómbralo a `.env`:

```bash
cp .env.example .env
```

A continuación, ajusta los valores según tu entorno:

```sh
OLCA_HOST="openlca-ipc"              # Host del servidor IPC de OpenLCA
OLCA_PORT="8080"                     # Puerto del servidor IPC de OpenLCA
ACV_COMPARE_BASE_URL="http://lca-compare-backend:3000"  # URL base de LCA Compare

IMPACT_METHOD_UUID="20629e27-b863-4fbe-bbc2-082d3eefd1e5"  # UUID del método de impacto (por defecto, EF 3.1)
CALCULATION_AMOUNT="0.001"           # Cantidad del proceso para el cálculo (1000 kg → 0.001 = 1 kg)
```

:::note
El archivo `.env.example` contiene todos los valores por defecto necesarios para un despliegue estándar. Solo es
imprescindible modificar `ACV_COMPARE_BASE_URL` si la URL de LCA Compare difiere de la configuración por defecto.
:::

## Red compartida con LCA Compare

En el caso de que quieras comunicar este servicio con **LCA Compare**, necesitas crear la red compartida `olca`:

```bash
docker network create olca
```

Ambos servicios deben estar conectados a esta red para que LCA Compare pueda recibir los resultados de los cálculos y
el frontend pueda rutear las peticiones de cálculo a través del proxy inverso hacia el servicio puente.

## Despliegue con Docker Compose

Una vez configurada la base de datos y creada la red `olca`, despliega tanto el servidor IPC de OpenLCA como el
servicio puente:

```bash
docker compose up -d
```

El servicio se desplegará en el puerto **3000**.

## Verificación

Una vez desplegado, verifica que el servicio responde correctamente:

```bash
# Documentación Swagger
curl http://localhost:3000/docs

# Endpoint de cálculo
curl -X POST http://localhost:3000/capture-acv \
  -H "Content-Type: application/json" \
  -d '{"metadatos": {...}}'
```
