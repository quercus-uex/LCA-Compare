---
sidebar_label: 'Despliegue'
sidebar_position: 2
---

# Despliegue del servicio

En producción, LCA Bridge y el [servidor IPC de OpenLCA](https://github.com/GreenDelta/olca-ipc-container) se despliegan
junto a LCA Compare con el compose de la plataforma (`deploy/compose.yaml` del repositorio
[LCA-Compare](https://github.com/quercus-uex/LCA-Compare)), usando las imágenes `ghcr.io/quercus-uex/lca-bridge` y
`ghcr.io/quercus-uex/openlca-ipc`. Los pasos generales (preparación del servidor, `.env`, arranque y actualización)
están en [Despliegue de ACV Compare](../acv-compare/despliegue.md).

## Requisitos previos

- La base de datos de OpenLCA con los procesos necesarios ya definidos. No se incluye en la imagen por licencia.
- El `.env` de la plataforma con `OLCA_DATA_DIR` apuntando al directorio que contiene esa base de datos.

## Datos de OpenLCA

El servidor IPC de OpenLCA utiliza la base de datos para ejecutar los cálculos de impacto ambiental. El directorio
`OLCA_DATA_DIR` del servidor se monta en el contenedor `openlca-ipc` como `/app/data`, y el servicio arranca con
`-db ecoinvent`, por lo que la base de datos debe estar en `<OLCA_DATA_DIR>/databases/ecoinvent`. A continuación se
muestra un gráfico aclaratorio de la estructura del volumen:

<p align="center">
    <img src="/img/openlca-bridge/volumen-olca-ipc.png" alt="Gráfico volumen OpenLCA" width="400"/>
</p>

:::note
El subdirectorio `openlca-docker/` es un proyecto **Maven/Java** independiente que construye la imagen del contenedor
del servidor IPC de OpenLCA. No tiene relación con el código Python del servicio puente.
:::

## Variables de entorno

El servicio lee su configuración de las siguientes variables de entorno. En producción, `deploy/compose.yaml` define
las tres primeras y el resto toma su valor por defecto:

| Variable | Valor en producción | Descripción |
|---|---|---|
| `OLCA_HOST` | `http://openlca-ipc` | Host del servidor IPC de OpenLCA |
| `OLCA_PORT` | `8080` | Puerto del servidor IPC de OpenLCA |
| `LCA_COMPARE_BASE_URL` | `http://lca-compare-backend:3000` | URL base de LCA Compare para enviar los resultados |
| `IMPACT_METHOD_UUID` | `20629e27-b863-4fbe-bbc2-082d3eefd1e5` | UUID del método de impacto (por defecto, EF 3.1) |
| `CALCULATION_AMOUNT` | `0.001` | Cantidad del proceso para el cálculo (1000 kg → 0.001 = 1 kg) |

## Red y acceso

LCA Bridge, el servidor IPC y LCA Compare comparten la red del proyecto (`lca-platform_default`) y se comunican por
nombre de servicio. Ninguno de los dos servicios publica puertos: desde fuera, el cálculo solo es accesible a través de
la ruta `/calc` del frontend de LCA Compare, que exige la cabecera `x-api-key`.

## Publicación y actualización

El workflow `.github/workflows/build.yml` del repositorio de LCA Bridge publica las imágenes `lca-bridge` y
`openlca-ipc` en cada push a `main`, con las etiquetas `main` y `sha-<hash>`. Una vez publicadas, actualiza solo estos
servicios en el servidor:

```bash
cd ~/lca-platform
docker compose pull lca-bridge openlca-ipc
docker compose up -d lca-bridge openlca-ipc
```

## Ejecución local con Docker Compose

El `docker-compose.yml` del repositorio de LCA Bridge sirve para levantar el servicio en local construyendo las imágenes.
La base de datos debe estar en `openlca-docker/data/databases/ecoinvent`:

```bash
docker compose up -d
```

El servicio puente queda en el puerto **3000** y el servidor IPC en el **3333**. Los resultados se envían a
`http://host.docker.internal:8000` (el backend de LCA Compare en desarrollo), salvo que se defina
`LCA_COMPARE_BASE_URL`.

## Verificación

En producción, desde fuera del servidor:

```bash
# Sin clave de API (debe devolver 401)
curl -i -X POST http://<servidor>/calc

# Cálculo con el ejemplo de entrada del repositorio de LCA Bridge
curl -X POST http://<servidor>/calc \
  -H "x-api-key: <CALC_API_KEY>" \
  -H "Content-Type: application/json" \
  -d @examples/example_in.json
```

En local:

```bash
# Documentación Swagger
curl http://localhost:3000/docs

# Endpoint de cálculo
curl -X POST http://localhost:3000/capture-acv \
  -H "Content-Type: application/json" \
  -d @examples/example_in.json
```
