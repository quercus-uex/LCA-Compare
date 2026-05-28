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

La variable `DATABASE_URL` se construye automáticamente en el Docker Compose a partir de `DB_USER` y `DB_PASSWORD`.

## Inicialización de la base de datos

En primer lugar, es necesario desplegar la base de datos. Para ello, levantamos el servicio de base de datos del Docker
Compose:

```bash
docker compose up -d db
```

Tras desplegar la base de datos, tendremos que lanzar la migración inicial para crear las tablas y relaciones definidas
en el esquema de Prisma.

:::danger[Importante]
Al crear la migración, es normal que la primera vez lance un error, puesto que esta requiere de la extensión **PostGIS**.
Para solucionar esto, abre el archivo `.sql` de la migración (`prisma/migrations/2026..../migration.sql`) y añade la
siguiente línea al principio:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Una vez hecho vuelve a lanzar la migración con el mismo nombre.
:::

```bash
npx prisma migrate dev --name init
```

Por último, hay que ejecutar el archivo SQL con los datos iniciales (países, provincias, poblaciones...) disponible en
`init/dbinit.sql`:

```bash
docker exec -i db psql -U ${DB_USER} -d acv < init/dbinit.sql
```

## Estructura del Docker Compose

El archivo `docker-compose.yaml` define tres servicios:

| Servicio | Imagen | Puerto | Perfil |
|---|---|---|---|
| `db` | `postgis/postgis:17-master` | 5432 | *(siempre activo)* |
| `acv-compare-backend` | Construida desde `Dockerfile` raíz | 8080→3000 | `prod` |
| `acv-compare-frontend` | Construida desde `web/Dockerfile` | 80 | `prod` |

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
| `/calc` | `capture-acv:3000/capture-acv` (cálculo de ACV) |
| `/` | SPA servida estáticamente (`index.html`) |

## Despliegue completo

Una vez tengamos la base de datos preparada, desplegamos todos los servicios con el perfil de producción:

```bash
docker compose --profile prod up -d --build
```

Esto construirá las imágenes del backend y frontend, y levantará los tres servicios. Tras el despliegue, ejecuta las
migraciones de Prisma en el contenedor del backend:

```bash
docker compose exec acv-compare-backend npx prisma migrate deploy
```

## CI/CD

El proyecto incluye un workflow de GitHub Actions (`.github/workflows/deploy.yml`) que se ejecuta en cada push a las
ramas `main` y `develop`. El pipeline:

1. Se conecta por SSH al servidor de despliegue.
2. Clona o actualiza el repositorio en la rama correspondiente.
3. Reconstruye y levanta los contenedores con `docker compose --profile prod up -d --build`.
4. Ejecuta las migraciones pendientes con `npx prisma migrate deploy`.

Las variables de entorno sensibles se inyectan desde los secretos de GitHub (`DB_USER`, `DB_PASSWORD`, `JWT_SECRET`,
`OPENROUTER_API_KEY`, etc.).

## Verificación

Una vez desplegado, verifica que los servicios responden correctamente:

```bash
# Frontend
curl http://localhost/

# API REST (documentación Swagger)
curl http://localhost/api/docs/
```
