---
sidebar_label: 'Despliegue'
sidebar_position: 2
---

# Despliegue del servicio

La plataforma completa (LCA Compare, LCA Bridge, servidor IPC de openLCA y copias de seguridad) se despliega con un
único archivo de Docker Compose, `deploy/compose.yaml`, del repositorio
([https://github.com/quercus-uex/LCA-Compare](https://github.com/quercus-uex/LCA-Compare)). El compose usa imágenes ya
publicadas en GitHub Container Registry (GHCR), por lo que no hace falta clonar el repositorio en el servidor.

## Requisitos previos

- Docker Engine con el plugin Compose.
- Los datos de openLCA (base de datos `ecoinvent`) en un directorio del servidor. No se incluyen en la imagen por
  licencia.
- Si los paquetes de GHCR son privados, iniciar sesión una sola vez con un token *classic* con permiso
  `read:packages`:

```bash
echo "$TOKEN" | docker login ghcr.io -u <usuario> --password-stdin
```

## Variables de entorno

Prepara un directorio con el compose y su archivo `.env`, partiendo de `deploy/compose.yaml` y `deploy/.env.example`:

```bash
mkdir ~/lca-platform && cd ~/lca-platform
# copiar deploy/compose.yaml como compose.yaml y deploy/.env.example como .env
chmod 600 .env
```

A continuación, ajusta los valores del `.env`:

```sh
TAG=main                                 # Etiqueta de las imágenes: main o sha-<hash> para fijar una versión

DB_USER=                                 # Usuario de la base de datos
DB_PASSWORD=                             # Contraseña de la base de datos
JWT_SECRET=                              # Clave secreta para JWT (autenticación)
OPENROUTER_API_KEY=                      # Clave de API para OpenRouter (IA en informes)
MAILER_EMAIL=                            # Email para envío de notificaciones
MAILER_PASSWORD=                         # Contraseña del email para notificaciones
CALC_API_KEY=                            # Clave de API que exige /calc en la cabecera x-api-key
DEFAULT_IMPACT_METHOD_UUID=2f995579-06bd-4681-b07c-cee3b1805b0d  # Método de impacto por defecto (EF 3.1)

OLCA_DATA_DIR=/home/ivan/openlca/data    # Directorio con los datos de openLCA

BACKUP_SCHEDULE="0 3 * * *"              # Cron de las copias de seguridad
BACKUP_LOCAL_ENABLED=true                # Guardar las copias en un directorio local de la máquina
BACKUP_LOCAL_DIR=./backups               # Directorio local para las copias (montado en el contenedor como /backups)
BACKUP_S3_ENABLED=true                   # Subir las copias al bucket S3
BACKUP_S3_ENDPOINT=                      # Vacío para AWS S3; endpoint para proveedores S3-compatibles
BACKUP_S3_REGION=eu-south-2              # Región del bucket de backups
BACKUP_S3_BUCKET=lca-compare-backup      # Bucket S3 para las copias de seguridad
BACKUP_S3_ACCESS_KEY_ID=                 # Access key del usuario IAM de backups
BACKUP_S3_SECRET_ACCESS_KEY=             # Secret key del usuario IAM de backups
```

`DATABASE_URL` no se define: el compose la construye como `postgres://${DB_USER}:${DB_PASSWORD}@db:5432/acv`. Si
falta alguna variable obligatoria, `docker compose` se detiene indicando cuál.

## Despliegue

Con el `.env` preparado, descarga las imágenes y levanta la plataforma:

```bash
docker compose pull
docker compose up -d
docker compose ps
```

Al arrancar, el servicio `migrate` espera a que la base de datos esté lista y ejecuta `prisma migrate deploy`. En una
base de datos vacía crea el esquema (con la extensión PostGIS) y carga los datos iniciales: países, provincias,
poblaciones y el método de impacto EF 3.1. En los despliegues siguientes solo aplica las migraciones pendientes. El
backend no arranca hasta que `migrate` termina correctamente; si falla, revisa `docker compose logs migrate`.

## Crear un usuario administrador

El backend incluye un script para dar de alta un usuario con rol `admin`. El script necesita que esté disponible
`DATABASE_URL` y que el backend esté compilado.

### En desarrollo local

Compila el backend y ejecuta el script desde la raíz del repositorio. El script `admin:create` solo existe en el paquete
`server`, por lo que hay que invocarlo con `--filter`:

```bash
pnpm server:build
pnpm --filter server admin:create -- --email="admin@example.com" --password="secreto" --nombre="Admin" --apellidos="Plataforma"
```

### En producción con Docker

Tras el primer arranque, ejecútalo en un contenedor puntual con la imagen del backend:

```bash
docker compose run --rm lca-compare-backend node apps/server/dist/src/scripts/create-admin.js \
  --email="admin@example.com" --password="secreto" --nombre="Admin" --apellidos="Plataforma"
```

El script valida el email, exige una contraseña de al menos 8 caracteres y comprueba que no exista ya un usuario con
el mismo correo.

## Estructura del Docker Compose

El archivo `deploy/compose.yaml` define el proyecto `lca-platform` con los siguientes servicios:

| Servicio | Imagen | Puerto | Función |
|---|---|---|---|
| `db` | `postgis/postgis:17-master` | — | PostgreSQL con PostGIS |
| `migrate` | `ghcr.io/quercus-uex/lca-compare-backend` | — | Aplica las migraciones de Prisma y termina |
| `lca-compare-backend` | `ghcr.io/quercus-uex/lca-compare-backend` | — | API REST (NestJS) |
| `lca-compare-frontend` | `ghcr.io/quercus-uex/lca-compare-frontend` | 80→80 | SPA y proxy inverso (Nginx) |
| `lca-bridge` | `ghcr.io/quercus-uex/lca-bridge` | — | Cálculo de ACV |
| `openlca-ipc` | `ghcr.io/quercus-uex/openlca-ipc` | — | Servidor IPC de openLCA con los datos de `OLCA_DATA_DIR` |
| `db-backup` | `ghcr.io/quercus-uex/lca-compare-backup` | — | Copias de seguridad de la base de datos |

### Redes

Todos los servicios comparten la red del proyecto, `lca-platform_default`, y se comunican por su nombre de servicio.
Solo el frontend publica un puerto (80); la base de datos, el backend, LCA Bridge y openLCA no son accesibles desde
fuera. Si necesitas acceder a PostgreSQL desde otra máquina, usa un túnel SSH.

### Proxy inverso (Nginx)

El frontend se sirve con Nginx, que actúa como proxy inverso con el siguiente enrutamiento:

| Host / ruta | Destino |
|---|---|
| `/api/` | `lca-compare-backend:3000` (API REST, se elimina el prefijo `/api`) |
| `/calc` | `lca-bridge:3000/capture-acv` (cálculo de ACV; exige la cabecera `x-api-key` con el valor de `CALC_API_KEY`, si no devuelve 401) |
| `/` | SPA servida estáticamente (`index.html`) |
| `quercusstatus.duckdns.org` | `uptime-kuma:3001` (Uptime Kuma) |

Nginx usa upstreams con `resolve` y el DNS interno de Docker (`127.0.0.11`), con una caché DNS válida durante
10 segundos (`valid=10s`). Así detecta los cambios de IP de los servicios al recrearse y actualiza sus destinos sin
reiniciar Nginx. Si un servicio no está disponible, su ruta devuelve 502 sin impedir que Nginx arranque.
Esta configuración requiere Nginx 1.27.3 o superior.

## Uptime Kuma

Uptime Kuma se ejecuta en el mismo servidor, pero fuera del compose. Se conecta a la red de la plataforma para que
Nginx lo alcance como `uptime-kuma`, por lo que debe levantarse después del primer `docker compose up -d`:

```bash
docker run -d --name uptime-kuma --restart unless-stopped \
  --network lca-platform_default -v uptime-kuma:/app/data louislam/uptime-kuma:1
```

Mientras Uptime Kuma esté conectado, `docker compose down` no puede borrar la red `lca-platform_default`: avisa y deja
el resto de servicios parados. `docker compose up -d` reutiliza la red sin problema.

Para actualizarlo, ejecuta `docker pull louislam/uptime-kuma:1` y `docker rm -f uptime-kuma`, y repite el
`docker run` anterior.

## CI/CD

El workflow `.github/workflows/build.yml` se ejecuta en cada push a `main` (y manualmente desde GitHub). Construye y
publica en GHCR las imágenes `lca-compare-backend`, `lca-compare-frontend` y `lca-compare-backup`, cada una con las
etiquetas `main` y `sha-<hash>`. El repositorio de LCA Bridge tiene un workflow equivalente que publica `lca-bridge` y
`openlca-ipc`.

GitHub Actions no se conecta al servidor: el despliegue es manual.

El repositorio también incluye el workflow `.github/workflows/sonar.yml`, que instala dependencias, compila
`packages/common`, genera el cliente Prisma y ejecuta la cobertura del backend antes del análisis de SonarCloud.

## Actualización

Una vez publicadas las imágenes nuevas, actualiza el servidor:

```bash
# desde el equipo local, solo si ha cambiado deploy/compose.yaml
scp deploy/compose.yaml <usuario>@<servidor>:~/lca-platform/compose.yaml

# en el servidor
cd ~/lca-platform
docker compose pull
docker compose up -d --remove-orphans
docker image prune -f
```

Para actualizar solo LCA Bridge:

```bash
docker compose pull lca-bridge openlca-ipc
docker compose up -d lca-bridge openlca-ipc
```

Para volver a una versión anterior, pon `TAG=sha-<hash>` en el `.env` y ejecuta `docker compose up -d`. Las migraciones
de base de datos ya aplicadas no se deshacen.

## Copias de seguridad

El servicio `db-backup` realiza copias de seguridad automáticas de la base de datos. Según `BACKUP_SCHEDULE` (por
defecto, cada día a las 03:00 UTC) lanza `pg_dump` y comprime el resultado con gzip. El destino de las copias se
controla con dos variables booleanas, y al menos una debe estar activada (si no, el comando `backup` termina con
error). Si no se definen en el `.env`, el compose deja S3 desactivado y la copia local activada:

- **`BACKUP_S3_ENABLED`**: sube la copia a `s3://<bucket>/lca-compare-db/daily/`. Los domingos copia además el
  backup al prefijo `lca-compare-db/weekly/`.
- **`BACKUP_LOCAL_ENABLED`**: guarda la copia en un directorio local de la máquina. El directorio se define con
  `BACKUP_LOCAL_DIR` (por defecto `./backups`, relativo al `compose.yaml`) y se monta en el contenedor como
  `/backups`. Las copias se organizan igual que en S3: `daily/` y, los domingos, `weekly/`.

Si ambos destinos están activos, el volcado se genera una sola vez y se escribe en los dos. Con solo S3 activo, la
copia se sube en streaming, sin ocupar disco en el servidor.

La retención de las copias en S3 la aplican las lifecycle rules del bucket (7 diarias y 4 semanales). Las copias
locales **no se rotan automáticamente**: hay que purgar `BACKUP_LOCAL_DIR` por otros medios (cron, logrotate...).

La imagen se construye desde `docker/backup/` (cliente de PostgreSQL 17 + AWS CLI + cron) y expone el comando
`backup`, el mismo que ejecuta el cron.

### Configuración previa en AWS

Esta configuración solo es necesaria si `BACKUP_S3_ENABLED=true`. Antes del primer despliegue con backups en S3 hay
que preparar tres cosas en la cuenta de AWS:

**1. Crear el bucket S3.** El nombre debe ser único globalmente (p. ej. `lca-compare-backup`). Mantén activado el
bloqueo de acceso público (es el valor por defecto), desactiva el versionado y elige la región que usarás en
`BACKUP_S3_REGION` (p. ej. `eu-south-2`).

**2. Crear un usuario IAM con permisos mínimos.** Crea una política con este JSON (ajustando el nombre del bucket):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::lca-compare-backup"
    },
    {
      "Sid": "ReadWriteObjects",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::lca-compare-backup/*"
    }
  ]
}
```

Asigna la política a un usuario nuevo (p. ej. `acv-db-backup`) y genera una access key con el caso de uso
"Application running outside AWS". Esos dos valores son `BACKUP_S3_ACCESS_KEY_ID` y
`BACKUP_S3_SECRET_ACCESS_KEY`.

**3. Configurar las reglas de ciclo de vida (retención).** La rotación no la hace el contenedor: la aplican las
lifecycle rules del bucket, conservando 7 copias diarias y 4 semanales:

```json
{
  "Rules": [
    {
      "ID": "expire-daily",
      "Status": "Enabled",
      "Filter": { "Prefix": "lca-compare-db/daily/" },
      "Expiration": { "Days": 8 }
    },
    {
      "ID": "expire-weekly",
      "Status": "Enabled",
      "Filter": { "Prefix": "lca-compare-db/weekly/" },
      "Expiration": { "Days": 29 }
    }
  ]
}
```

Se configuran una sola vez, desde la consola (S3 → bucket → Management → Lifecycle rules) o por CLI con credenciales
de administrador (no con las del usuario de backups):

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket lca-compare-backup \
  --lifecycle-configuration file://lifecycle.json
```

Los márgenes (8 y 29 días) garantizan conservar al menos 7 y 4 copias completas, porque AWS evalúa las reglas solo
una vez al día.

### Ejecución manual y verificación

El comando `backup` permite lanzar una copia bajo demanda y comprobar que todo funciona:

```bash
# Con el contenedor en marcha
docker compose exec db-backup backup

# O como ejecución puntual
docker compose run --rm db-backup backup
```

Si todo va bien verás `Backup OK: lca-<fecha>.sql.gz`. Comprueba que la copia está en su destino:

```bash
# S3
aws s3 ls s3://lca-compare-backup/lca-compare-db/daily/

# Directorio local (la ruta configurada en BACKUP_LOCAL_DIR)
ls ./backups/daily/
```

Las ejecuciones programadas quedan registradas en los logs del contenedor (`docker compose logs db-backup`).

### Restauración

```bash
# 1. Descargar el backup (solo si la copia está en S3; si está en el directorio local, salta este paso y usa esa ruta)
aws s3 cp s3://lca-compare-backup/lca-compare-db/daily/<fichero>.sql.gz .

# 2. Parar los servicios que usan la base de datos
docker compose stop lca-compare-backend db-backup

# 3. Recrear la base de datos con la extensión PostGIS
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE acv" -c "CREATE DATABASE acv"'
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d acv -c "CREATE EXTENSION IF NOT EXISTS postgis"'

# 4. Restaurar y volver a levantar los servicios
gunzip -c <fichero>.sql.gz | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d acv'
docker compose up -d
```

La copia incluye la tabla de migraciones de Prisma, por lo que al volver a levantar los servicios `migrate` solo aplica
las migraciones posteriores a la copia.

## Verificación

Una vez desplegado, verifica que los servicios responden correctamente:

```bash
# Frontend
curl http://localhost/

# API REST (documentación Swagger)
curl http://localhost/api/docs/

# Cálculo de ACV sin clave de API (debe devolver 401)
curl -i -X POST http://localhost/calc
```
