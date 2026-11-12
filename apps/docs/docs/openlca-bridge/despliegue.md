---
sidebar_label: 'Despliegue'
sidebar_position: 2
---

# Despliegue del servicio

En producción, LCA Bridge y el [servidor IPC de openLCA](https://github.com/GreenDelta/olca-ipc-container) se despliegan
junto a LCA Compare con el compose de la plataforma (`deploy/compose.yaml` del repositorio
[LCA-Compare](https://github.com/quercus-uex/LCA-Compare)), usando las imágenes `ghcr.io/quercus-uex/lca-bridge` y
`ghcr.io/quercus-uex/openlca-ipc`. Los pasos generales (preparación del servidor, `.env`, arranque y actualización)
están en [Despliegue de ACV Compare](../acv-compare/despliegue.md).

## Requisitos previos

- La base de datos de openLCA con los procesos necesarios ya definidos. No se incluye en la imagen por licencia.
- El `.env` de la plataforma con `OLCA_DATA_DIR` apuntando al directorio que contiene esa base de datos.

## Datos de openLCA

El servidor IPC de openLCA utiliza la base de datos para ejecutar los cálculos de impacto ambiental. El directorio
`OLCA_DATA_DIR` del servidor se monta en el contenedor `openlca-ipc` como `/app/data`, y el servicio arranca con
`-db ecoinvent`, por lo que la base de datos debe estar en `<OLCA_DATA_DIR>/databases/ecoinvent`. A continuación se
muestra la estructura del volumen:

<p align="center">
    <img src="/img/openlca-bridge/volumen-olca-ipc.png" alt="Gráfico volumen openLCA" width="400"/>
</p>

:::note
El subdirectorio `openlca-docker/` es un proyecto **Maven/Java** independiente que construye la imagen del contenedor
del servidor IPC de openLCA. No tiene relación con el código Python del servicio puente.
:::

## Variables de entorno

El servicio lee su configuración de las siguientes variables de entorno (también de un fichero `.env` en la raíz del
repositorio). En producción, `deploy/compose.yaml` define las tres primeras y el resto toma su valor por defecto:

| Variable | Valor por defecto | Valor en producción | Descripción |
|---|---|---|---|
| `OLCA_HOST` | `localhost` | `http://openlca-ipc` | Host del servidor IPC de openLCA, con o sin esquema (`localhost` o `http://localhost`) |
| `OLCA_PORT` | `8080` | `8080` | Puerto del servidor IPC de openLCA |
| `LCA_COMPARE_BASE_URL` | `http://127.0.0.1:8000` | `http://lca-compare-backend:3000` | URL base de LCA Compare para enviar los resultados |
| `IMPACT_METHOD_UUID` | `20629e27-b863-4fbe-bbc2-082d3eefd1e5` | *(por defecto)* | UUID del método de impacto en openLCA (EF 3.1) |
| `CALCULATION_AMOUNT` | `1` | *(por defecto)* | Cantidad de producto, en kg, para la que se calculan los impactos: con `1`, los resultados son por kg |

## Red y acceso

LCA Bridge, el servidor IPC y LCA Compare comparten la red del proyecto (`lca-platform_default`) y se comunican por
nombre de servicio. Ni LCA Bridge ni `openlca-ipc` publican puertos: desde fuera, el cálculo solo es accesible a
través de la ruta `/calc` del frontend de LCA Compare, que exige la cabecera `x-api-key`.

## Publicación y actualización

El workflow `.github/workflows/build.yml` del repositorio de LCA Bridge publica las imágenes `lca-bridge` y
`openlca-ipc` en cada push a `main` (o al lanzarlo manualmente), con las etiquetas `main` y `sha-<hash>`. Una vez
publicadas, actualiza solo estos servicios en el servidor:

```bash
cd ~/lca-platform
docker compose pull lca-bridge openlca-ipc
docker compose up -d lca-bridge openlca-ipc
```

:::warning
La variable `TAG` de `deploy/compose.yaml` se aplica a todas las imágenes, incluidas `lca-bridge` y `openlca-ipc`.
LCA Bridge solo publica la etiqueta `main` y las `sha-<hash>` de sus propios commits, así que fijar `TAG` a una
versión de LCA Compare (`X.Y.Z`) o a un `sha-<hash>` de LCA Compare hace fallar el `pull` de las imágenes de
LCA Bridge.
:::

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

En producción, desde fuera del servidor y desde la raíz del repositorio de LCA Bridge:

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

# Endpoints de cálculo
curl -X POST http://localhost:3000/capture-acv \
  -H "Content-Type: application/json" \
  -d @examples/example_in.json

curl -X POST http://localhost:3000/capture-acv-coeficientes \
  -H "Content-Type: application/json" \
  -d @examples/example_in.json
```
