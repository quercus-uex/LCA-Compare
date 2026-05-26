---
sidebar_label: 'Despliegue'
sidebar_position: 2
---

# Despliegue del servicio

## Requisitos previos

Antes de desplegar el servicio puente entre Ventum ACV y OpenLCA, necesitas tener descargado:

- el repositorio ([https://github.com/quercus-uex/Ventum-OpenLCA-Service](https://github.com/quercus-uex/Ventum-OpenLCA-Service)).
- la base de datos **Ecoinvent** con los procesos necesarios ya definidos.

## Configuración de la base de datos Ecoinvent

La base de datos de OpenLCA (BAFU/ecoinvent) debe existir en la ruta `openlca-docker/data/databases/bafu` antes de
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

Configura las siguientes variables de entorno para el despliegue:

```sh
OLCA_HOST="openlca-ipc"              # Host del servidor IPC de OpenLCA
OLCA_PORT="8080"                     # Puerto del servidor IPC de OpenLCA
ACV_COMPARE_BASE_URL="http://acv-compare-backend:3000"  # URL base de ACV Compare
```

## Red compartida con ACV Compare

En el caso de que quieras comunicar este servicio con **ACV Compare**, necesitas crear la red compartida `olca`:

```bash
docker network create olca
```

Ambos servicios deben estar conectados a esta red para que ACV Compare pueda recibir los resultados de los cálculos y
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
curl -X POST http://localhost:3000/ventum-acv \
  -H "Content-Type: application/json" \
  -d '{"metadatos": {...}}'
```
