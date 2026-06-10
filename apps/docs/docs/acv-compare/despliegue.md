---
sidebar_label: 'Despliegue'
sidebar_position: 2
---

# Despliegue del servicio

Antes de desplegar el servicio de comparativa de ACV, necesitas tener clonado el repositorio
([https://github.com/quercus-uex/Ventum-ACV-Visualizer](https://github.com/quercus-uex/Ventum-ACV-Visualizer)).

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

CAPTURE_ACV_EMAIL="email@example.com"    # Email para autenticación en DTAgro (extracción masiva)
CAPTURE_ACV_PASSWORD="P@ssw0rd"          # Password para autenticación en DTAgro (extracción masiva)

DEFAULT_IMPACT_METHOD_UUID="2f995579-06bd-4681-b07c-cee3b1805b0d"  # UUID del método de impacto por defecto (EF 3.1)

PORT=8000                                # Puerto del backend en desarrollo
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

## Estructura del Docker Compose

El archivo `docker-compose.yaml` define tres servicios. La base de datos se levanta sin perfil y las aplicaciones se
incluyen únicamente con el perfil `prod`:

| Servicio | Imagen | Puerto | Perfil |
|---|---|---|---|
| `db` | `postgis/postgis:17-master` | 5432 | *(siempre activo)* |
| `acv-compare-backend` | Construida desde `apps/server/Dockerfile` | 8080→3000 | `prod` |
| `acv-compare-frontend` | Construida desde `apps/web/Dockerfile` | 80→80 | `prod` |

### Redes

El compose define dos redes:

- **`acv-compare`**: red interna para la comunicación entre el backend, frontend y base de datos.
- **`olca`**: red externa compartida con el servicio Capture ACV. Debe crearse manualmente:

```bash
docker network create olca
```

### Proxy inverso (Nginx)

El frontend se sirve con Nginx, que actúa como proxy inverso con el siguiente enrutamiento:

| Ruta | Destino |
|---|---|
| `/api/` | `acv-compare-backend:3000` (API REST, se elimina el prefijo `/api`) |
| `/calc` | `capture-openlca-bridge:3000/capture-acv` (cálculo de ACV) |
| `/` | SPA servida estáticamente (`index.html`) |

## Despliegue completo

Una vez tengamos la base de datos preparada, desplegamos todos los servicios con el perfil de producción:

```bash
docker compose --profile prod up -d --build
```

Esto construirá las imágenes del backend y frontend, y levantará los tres servicios. La imagen del backend compila
primero `packages/common`, genera el cliente Prisma y después compila NestJS. Tras el despliegue, ejecuta las migraciones
de Prisma en el contenedor del backend usando el script del workspace `server`:

```bash
docker compose exec acv-compare-backend pnpm --filter server prisma:migrate:deploy
```

## CI/CD

El proyecto incluye un workflow de GitHub Actions (`.github/workflows/deploy.yml`) que se ejecuta en cada push a las
ramas `main` y `develop`. El pipeline:

1. Se conecta por SSH al servidor de despliegue.
2. Clona o actualiza el repositorio en la rama correspondiente.
3. Reconstruye y levanta los contenedores con `docker compose --profile prod up -d --build`.
4. Ejecuta las migraciones pendientes con `pnpm --filter server prisma:migrate:deploy` dentro del contenedor
   `acv-compare-backend`.

Las variables de entorno sensibles se inyectan desde los secretos de GitHub (`DB_USER`, `DB_PASSWORD`, `JWT_SECRET`,
`OPENROUTER_API_KEY`, `CAPTURE_ACV_EMAIL`, `CAPTURE_ACV_PASSWORD`, `MAILER_EMAIL`, `MAILER_PASSWORD` y
`DEFAULT_IMPACT_METHOD_UUID`).

El repositorio también incluye el workflow `.github/workflows/sonar.yml`, que instala dependencias, compila
`packages/common`, genera el cliente Prisma y ejecuta la cobertura del backend antes del análisis de SonarCloud.

## Verificación

Una vez desplegado, verifica que los servicios responden correctamente:

```bash
# Frontend
curl http://localhost/

# API REST (documentación Swagger)
curl http://localhost/api/docs/
```
