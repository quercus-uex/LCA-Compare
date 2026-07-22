---
sidebar_label: 'Despliegue'
sidebar_position: 2
---

# Despliegue del servicio

Antes de desplegar el servicio de comparativa de ACV, necesitas tener clonado el repositorio
([https://github.com/quercus-uex/LCA-Compare](https://github.com/quercus-uex/LCA-Compare)).

## Variables de entorno

El servicio lee su configuración desde un archivo `.env` ubicado en la raíz del proyecto. Como punto de partida,
copia el archivo `.env.example` incluido en el repositorio y renómbralo a `.env`:

```bash
cp .env.example .env
```

A continuación, ajusta los valores según tu entorno:

```sh
DATABASE_URL="postgres://user:password@localhost:5432/acv"  # Conexión local usada fuera de Docker
JWT_SECRET="CHANGEME"                    # Clave secreta para JWT (autenticación)
OPENROUTER_API_KEY="sk-or-v1-...."       # Clave de API para OpenRouter (IA en informes)

DB_USER="user"                           # Usuario de la base de datos
DB_PASSWORD="password"                   # Contraseña de la base de datos

MAILER_EMAIL="example@example.com"       # Email para envío de notificaciones
MAILER_PASSWORD="Password"               # Contraseña del email para notificaciones

CAPTURE_ACV_EMAIL="email@example.com"    # Email para autenticación en LCA Capture (extracción masiva)
CAPTURE_ACV_PASSWORD="P@ssw0rd"          # Password para autenticación en LCA Capture (extracción masiva)

DEFAULT_IMPACT_METHOD_UUID="2f995579-06bd-4681-b07c-cee3b1805b0d"  # UUID del método de impacto por defecto (EF 3.1)

PORT=8000                                # Puerto del backend en desarrollo

BACKUP_S3_ENABLED="false"                 # Subir las copias al bucket S3
BACKUP_LOCAL_ENABLED="false"              # Guardar las copias en un directorio local de la máquina
BACKUP_LOCAL_DIR="./backups"              # Directorio local para las copias (montado en el contenedor como /backups)
BACKUP_S3_ENDPOINT=""                    # Vacío para AWS S3; endpoint para proveedores S3-compatibles
BACKUP_S3_REGION="eu-west-1"             # Región del bucket de backups
BACKUP_S3_BUCKET="acv-db-backups"        # Bucket S3 para las copias de seguridad
BACKUP_S3_ACCESS_KEY_ID="..."            # Access key del usuario IAM de backups
BACKUP_S3_SECRET_ACCESS_KEY="..."        # Secret key del usuario IAM de backups
```

En producción con Docker Compose, `DATABASE_URL` se inyecta automáticamente en el backend como
`postgres://${DB_USER}:${DB_PASSWORD}@db:5432/acv`. El valor del `.env` queda para comandos locales, pruebas o desarrollo
fuera del contenedor.

## Inicialización de la base de datos

En primer lugar, es necesario desplegar la base de datos. Para ello, levantamos el servicio de base de datos del Docker
Compose:

```bash
docker compose up -d db
```

Tras desplegar la base de datos, aplica las migraciones de Prisma desde el paquete `server`. El esquema está dividido en
`apps/server/prisma/schema/` y la configuración de Prisma está en `apps/server/prisma.config.ts`, por lo que los comandos
deben ejecutarse mediante los scripts del workspace o pasando explícitamente esa configuración.

```bash
pnpm server:prisma:migrate:deploy
```

Por último, hay que ejecutar el archivo SQL con los datos iniciales (países, provincias, poblaciones...) disponible en
`init/dbinit.sql`. Este archivo es un seed SQL manual de datos de referencia de Portugal, no una migración automática:

```bash
docker exec -i db psql -U ${DB_USER} -d acv < init/dbinit.sql
```

## Crear un usuario administrador

El backend incluye un script para dar de alta un usuario con rol `admin`. El script necesita que esté disponible
`DATABASE_URL` y que el backend esté compilado.

### En desarrollo local

Compila el backend y ejecuta el script desde `apps/server`:

```bash
pnpm server:build
pnpm admin:create -- --email="admin@example.com" --password="secreto" --nombre="Admin" --apellidos="Plataforma"
```

### En producción con Docker

Una vez levantado el contenedor del backend, ejecútalo dentro de `lca-compare-backend`:

```bash
docker compose exec lca-compare-backend pnpm admin:create -- --email="admin@example.com" --password="secreto" --nombre="Admin" --apellidos="Plataforma"
```

El script valida el email, exige una contraseña de al menos 8 caracteres y comprueba que no exista ya un usuario con
el mismo correo.

## Estructura del Docker Compose

El archivo `docker-compose.yaml` define cuatro servicios. La base de datos se levanta sin perfil y las aplicaciones se
incluyen únicamente con el perfil `prod`:

| Servicio | Imagen | Puerto | Perfil |
|---|---|---|---|
| `db` | `postgis/postgis:17-master` | 5432 | *(siempre activo)* |
| `lca-compare-backend` | Construida desde `apps/server/Dockerfile` | 8080→3000 | `prod` |
| `lca-compare-frontend` | Construida desde `apps/web/Dockerfile` | 80→80 | `prod` |
| `db-backup` | Construida desde `docker/backup/Dockerfile` | — | `prod` |

### Redes

El compose define dos redes:

- **`lca-compare`**: red interna para la comunicación entre el backend, frontend, base de datos y backups.
- **`olca`**: red externa compartida con el servicio LCA Bridge. Debe crearse manualmente:

```bash
docker network create olca
```

### Proxy inverso (Nginx)

El frontend se sirve con Nginx, que actúa como proxy inverso con el siguiente enrutamiento:

| Ruta | Destino |
|---|---|
| `/api/` | `lca-compare-backend:3000` (API REST, se elimina el prefijo `/api`) |
| `/calc` | `lca-bridge:3000/capture-acv` (cálculo de ACV) |
| `/` | SPA servida estáticamente (`index.html`) |

## Despliegue completo

Una vez tengamos la base de datos preparada, desplegamos todos los servicios con el perfil de producción:

```bash
docker compose --profile prod up -d --build
```

Esto construirá las imágenes del backend, frontend y backup, y levantará los cuatro servicios. La imagen del backend compila
primero `packages/common`, genera el cliente Prisma y después compila NestJS. Si no aplicaste las migraciones durante la
preparación previa de la base de datos, ejecútalas ahora en el contenedor del backend usando el script del workspace
`server`:

```bash
docker compose exec lca-compare-backend pnpm --filter server prisma:migrate:deploy
```

## CI/CD

El proyecto incluye un workflow de GitHub Actions (`.github/workflows/deploy.yml`) que se ejecuta en cada push a las
ramas `main` y `develop`. El pipeline:

1. Se conecta por SSH al servidor de despliegue.
2. Clona o actualiza el repositorio en la rama correspondiente.
3. Reconstruye y levanta los contenedores con `docker compose --profile prod up -d --build`.
4. Ejecuta las migraciones pendientes con `pnpm --filter server prisma:migrate:deploy` dentro del contenedor
   `lca-compare-backend`.

Las variables de entorno sensibles se inyectan desde los secretos de GitHub (`DB_USER`, `DB_PASSWORD`, `JWT_SECRET`,
`OPENROUTER_API_KEY`, `CAPTURE_ACV_EMAIL`, `CAPTURE_ACV_PASSWORD`, `MAILER_EMAIL`, `MAILER_PASSWORD`,
`DEFAULT_IMPACT_METHOD_UUID`, `CALC_API_KEY`, `BACKUP_S3_ENDPOINT`, `BACKUP_S3_REGION`, `BACKUP_S3_BUCKET`,
`BACKUP_S3_ACCESS_KEY_ID` y `BACKUP_S3_SECRET_ACCESS_KEY`).

El repositorio también incluye el workflow `.github/workflows/sonar.yml`, que instala dependencias, compila
`packages/common`, genera el cliente Prisma y ejecuta la cobertura del backend antes del análisis de SonarCloud.

## Copias de seguridad

El servicio `db-backup` (perfil `prod`) realiza copias de seguridad automáticas de la base de datos. Cada día a las
03:00 UTC lanza `pg_dump` y comprime el resultado con gzip. El destino de las copias se controla con dos variables
booleanas. Ambas están desactivadas por defecto y hay que activar al menos una de forma explícita (si no, el comando
`backup` termina con error):

- **`BACKUP_S3_ENABLED`**: sube la copia a `s3://<bucket>/lca-compare-db/daily/`. Los domingos copia además el
  backup al prefijo `lca-compare-db/weekly/`.
- **`BACKUP_LOCAL_ENABLED`**: guarda la copia en un directorio local de la máquina. El directorio se define con
  `BACKUP_LOCAL_DIR` (por defecto `./backups`, relativo al `docker-compose.yaml`) y se monta en el contenedor como
  `/backups`. Las copias se organizan igual que en S3: `daily/` y, los domingos, `weekly/`.

Si ambos destinos están activos, el volcado se genera una sola vez y se escribe en los dos. Con solo S3 activo, la
copia se sube en streaming, sin ocupar disco en el servidor.

El workflow de despliegue (`.github/workflows/deploy.yml`) fuerza ambas variables a `true`, por lo que en el
servidor se generan las dos copias: en S3 y en `./backups` dentro del directorio de despliegue.

La retención de las copias en S3 la aplican las lifecycle rules del bucket (7 diarias y 4 semanales). Las copias
locales **no se rotan automáticamente**: hay que purgar `BACKUP_LOCAL_DIR` por otros medios (cron, logrotate...).

La imagen se construye desde `docker/backup/` (cliente de PostgreSQL 17 + AWS CLI + cron) y expone el comando
`backup`, el mismo que ejecuta el cron.

### Configuración previa en AWS

Esta configuración solo es necesaria si `BACKUP_S3_ENABLED=true`. Antes del primer despliegue con backups en S3 hay
que preparar tres cosas en la cuenta de AWS:

**1. Crear el bucket S3.** El nombre debe ser único globalmente (p. ej. `acv-db-backups`). Mantén activado el bloqueo
de acceso público (es el valor por defecto), desactiva el versionado y elige la región que usarás en
`BACKUP_S3_REGION` (p. ej. `eu-west-1`).

**2. Crear un usuario IAM con permisos mínimos.** Crea una política con este JSON (ajustando el nombre del bucket):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::acv-db-backups"
    },
    {
      "Sid": "ReadWriteObjects",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::acv-db-backups/*"
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
  --bucket acv-db-backups \
  --lifecycle-configuration file://lifecycle.json
```

Los márgenes (8 y 29 días) garantizan conservar al menos 7 y 4 copias completas, porque AWS evalúa las reglas solo
una vez al día.

### Ejecución manual y verificación

El comando `backup` permite lanzar una copia bajo demanda y comprobar que todo funciona:

```bash
# Con el contenedor en marcha
docker compose --profile prod exec db-backup backup

# O como ejecución puntual
docker compose --profile prod run --rm db-backup backup
```

Si todo va bien verás `Backup OK: lca-<fecha>.sql.gz`. Comprueba que la copia está en su destino:

```bash
# S3
aws s3 ls s3://acv-db-backups/lca-compare-db/daily/

# Directorio local (la ruta configurada en BACKUP_LOCAL_DIR)
ls ./backups/daily/
```

Las ejecuciones programadas quedan registradas en los logs del contenedor (`docker logs`).

### Restauración

```bash
# 1. Descargar el backup (solo si la copia está en S3; si está en el directorio local, salta este paso y usa esa ruta)
aws s3 cp s3://acv-db-backups/lca-compare-db/daily/<fichero>.sql.gz .

# 2. Recrear la base de datos con la extensión PostGIS (con el backend parado)
docker compose exec -T db psql -U "$DB_USER" -d postgres -c "DROP DATABASE acv; CREATE DATABASE acv;"
docker compose exec -T db psql -U "$DB_USER" -d acv -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 3. Restaurar
gunzip -c <fichero>.sql.gz | docker compose exec -T db psql -U "$DB_USER" -d acv
```

## Verificación

Una vez desplegado, verifica que los servicios responden correctamente:

```bash
# Frontend
curl http://localhost/

# API REST (documentación Swagger)
curl http://localhost/api/docs/
```
