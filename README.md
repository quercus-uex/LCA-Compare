# LCA Compare

## Introducción
LCA Compare es una app web que permite la visualización y comparación del Análisis de Ciclo de Vida (ACV) de los cultivos a partir del resultado proporcionado por [LCA Bridge](https://github.com/quercus-uex/LCA-Bridge).

## Objetivo
El objetivo final de esta app es proporcionar de una interfaz sencilla e intuitiva que permita la comparación de ACV entre cultivos con el fin de identificar puntos de mejora en esta materia. Para ello, la app permite...
- Analizar el resultado de impacto de un cultivo propio.
- Comparar entre distintos grupos de cultivos según los distintos filtros disponibles.
- Exportar de los resultados de la comparativa a **JSON** y **CSV**.
- Gestionar parcelas con integración de **SIGPAC** y **Catastro** para la localización y representación geoespacial de polígonos.
- Generar informes y reportes automatizados.
- Integración con **IA** para análisis asistido.

## Arquitectura

### Backend (`apps/server/src`)
API REST NestJS. Los controladores públicos actuales cubren:
- **Autenticación** (`/auth`) - Login, registro y gestión de sesiones con JWT
- **Usuarios** (`/usuario`) - CRUD de usuarios con roles
- **Parcelas** (`/parcela`) - Gestión de parcelas con datos geoespaciales
- **Resultados de impacto** (`/resultado`) - Almacenamiento y consulta de resultados ACV
- **Comparador** (`/compare`) - Lógica de comparación entre cultivos
- **Estadísticas** (`/stats`) - KPIs y agregaciones para el panel estadístico
- **Administración** (`/admin`) - Operaciones administrativas sobre usuarios, parcelas, cultivos, métodos y ubicaciones
- **Ubicaciones** (`/pais`, `/provincia`, `/poblacion`) - Consulta de datos territoriales
- **LCA Bridge** (`/capture`) - Comunicación con LCA Bridge

La documentación OpenAPI del backend está disponible en `/docs` cuando se accede al servidor directamente, o vía `/api/docs` a través del proxy del frontend.

## Tecnologías
A continuación se detallan las tecnologías usadas para el desarrollo de la webapp:

### Backend
- **Node.js 22**
- **NestJS 11**
- **Prisma ORM 7**
- **PostgreSQL con PostGIS**
- **JWT** para autenticación
- **Swagger/OpenAPI** para documentación
- **Playwright** para generación de reportes
- **Handlebars** para plantillas
- **Nodemailer** para envío de emails
- **OpenRouter SDK** para integración IA
- **proj4** para transformaciones de coordenadas
- **argon2** para hash de contraseñas

### Frontend
- **React 19**
- **TypeScript 5**
- **Vite 7**
- **TailwindCSS 4**
- **DaisyUI 5**
- **Leaflet / React-Leaflet** para mapas
- **React Router 7**
- **React Hook Form**
- **Sonner** para notificaciones

## Servicios externos
Para la localización de parcelas se ha integrado el uso de las APIs públicas tanto del SIGPAC como del Catastro. Esto permite el almacenamiento del polígono representativo de dichas parcelas para su posterior uso en el comparador.

Además, el sistema se comunica con:
- **LCA Bridge** para el cálculo de análisis de ciclo de vida
- **OpenRouter** para capacidades de IA asistida

## Variables de entorno

### Desarrollo
El backend en local lee las variables de `.env` (ver `.env.example`):

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión a PostgreSQL |
| `DB_USER` | Usuario de la base de datos (usado por `docker-compose.yaml`) |
| `DB_PASSWORD` | Contraseña de la base de datos (usada por `docker-compose.yaml`) |
| `JWT_SECRET` | Secret para firmar tokens JWT |
| `OPENROUTER_API_KEY` | API key para OpenRouter |
| `MAILER_EMAIL` | Email para envío de notificaciones |
| `MAILER_PASSWORD` | Password del servicio de email |
| `DEFAULT_IMPACT_METHOD_UUID` | UUID del método de impacto por defecto (EF 3.1) |
| `PORT` | Puerto del backend; usar `8000` en desarrollo para el proxy de Vite (`3000` es el default de Nest y del contenedor) |
| `LCA_CAPTURE_CLIENT_ID` / `LCA_CAPTURE_CLIENT_SECRET` | Credenciales de LCA Capture (solo para regenerar los PDFs de la documentación) |

### Producción
El despliegue lee las variables de `.env` junto a `compose.yaml` (ver `deploy/.env.example`). `DATABASE_URL` se construye
a partir de `DB_USER` y `DB_PASSWORD`.

| Variable | Descripción |
|----------|-------------|
| `TAG` | Etiqueta de las imágenes: `main` o `sha-<hash>` para fijar una versión concreta |
| `DB_USER` / `DB_PASSWORD` | Credenciales de la base de datos |
| `JWT_SECRET` | Secret para firmar tokens JWT |
| `OPENROUTER_API_KEY` | API key para OpenRouter |
| `MAILER_EMAIL` / `MAILER_PASSWORD` | Cuenta de envío de notificaciones |
| `CALC_API_KEY` | Clave que exige nginx en la cabecera `x-api-key` de `/calc` |
| `DEFAULT_IMPACT_METHOD_UUID` | UUID del método de impacto por defecto (EF 3.1) |
| `OLCA_DATA_DIR` | Directorio del servidor con los datos de openLCA (base `ecoinvent`) |
| `BACKUP_SCHEDULE` | Cron de las copias de seguridad (por defecto `0 3 * * *`) |
| `BACKUP_S3_ENABLED` / `BACKUP_LOCAL_ENABLED` | Activan copias en S3 y/o en disco |
| `BACKUP_LOCAL_DIR` | Directorio local de copias (por defecto `./backups`) |
| `BACKUP_S3_ENDPOINT` / `BACKUP_S3_REGION` / `BACKUP_S3_BUCKET` | Configuración del bucket S3 de copias |
| `BACKUP_S3_ACCESS_KEY_ID` / `BACKUP_S3_SECRET_ACCESS_KEY` | Credenciales IAM para subir copias a S3 |

## Desarrollo
```bash
pnpm install
pnpm --filter common build
pnpm server:prisma:generate

docker compose up -d db
pnpm server:prisma:migrate:deploy   # crea el esquema y carga los datos iniciales

pnpm server:dev
pnpm web:dev
pnpm docs:dev
```

Los cambios de esquema se hacen con migraciones (`pnpm server:prisma:migrate:dev`), nunca con `prisma db push`.

## Despliegue
La plataforma completa (LCA Compare, LCA Bridge, servidor IPC de openLCA y copias de seguridad) se despliega con
`deploy/compose.yaml`, usando las imágenes publicadas en GHCR (`ghcr.io/quercus-uex/...`). No hace falta clonar el
repositorio en el servidor.

Requisitos: Docker con el plugin Compose, los datos de openLCA en el servidor y, si los paquetes de GHCR son privados,
iniciar sesión una vez con un token *classic* con `read:packages`:

```bash
echo "$TOKEN" | docker login ghcr.io -u <usuario> --password-stdin
```

Despliegue desde cero:

```bash
mkdir ~/lca-platform && cd ~/lca-platform
# copiar deploy/compose.yaml como compose.yaml y deploy/.env.example como .env, y rellenar .env
chmod 600 .env
docker compose pull
docker compose up -d
```

El compose levanta estos servicios; solo se publica el puerto 80:
- **db** - PostgreSQL con PostGIS
- **migrate** - Aplica las migraciones de Prisma (esquema y datos iniciales) y termina; el backend no arranca si falla
- **lca-compare-backend** - API NestJS
- **lca-compare-frontend** - Frontend React servido con Nginx, que hace de proxy inverso (puerto 80)
- **lca-bridge** - Servicio de cálculo de ACV
- **openlca-ipc** - Servidor IPC de openLCA
- **db-backup** - Copias de seguridad automáticas de la base de datos

Tras el primer arranque, crear el primer administrador:

```bash
docker compose run --rm lca-compare-backend node apps/server/dist/src/scripts/create-admin.js \
  --email="admin@example.com" --password="secreto" --nombre="Admin" --apellidos="Plataforma"
```

Uptime Kuma se ejecuta en el mismo servidor fuera del compose, conectado a la red de la plataforma para que nginx lo
sirva en `quercusstatus.duckdns.org`:

```bash
docker run -d --name uptime-kuma --restart unless-stopped \
  --network lca-platform_default -v uptime-kuma:/app/data louislam/uptime-kuma:1
```

### Actualización
El workflow `Build images` publica las imágenes en cada push a `main` (etiquetas `main` y `sha-<hash>`). El despliegue
en el servidor es manual:

```bash
# desde el equipo local, solo si ha cambiado deploy/compose.yaml
scp deploy/compose.yaml <usuario>@<servidor>:~/lca-platform/compose.yaml

# en el servidor
cd ~/lca-platform
docker compose pull
docker compose up -d --remove-orphans
docker image prune -f
```

## Uso
Por defecto la webapp se encuentra mapeada al puerto 80. La API está disponible a partir de la ruta `/api` y la documentación Swagger a través del proxy en `/api/docs`.

### Endpoints principales
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Login
- `GET /parcela` - Listar parcelas
- `POST /parcela` - Crear parcela
- `GET /compare` - Comparar cultivos
- `GET /stats` - Estadísticas globales
- `GET /api/docs` - Documentación Swagger a través del proxy frontend

## Estructura del proyecto
```
├── apps/
│   ├── server/             # Backend NestJS
│   │   ├── src/
│   │   └── prisma/         # Esquema Prisma y migraciones (incluidos los datos iniciales)
│   ├── web/                # Frontend React
│   │   └── src/
│   └── docs/               # Documentación Docusaurus
├── packages/
│   └── common/             # DTOs, tipos y constantes compartidos por subpath exports
├── deploy/                 # compose.yaml y .env.example de producción
├── docker/backup/          # Imagen de copias de seguridad
├── pnpm-workspace.yaml     # Workspace pnpm
├── turbo.json              # Pipeline Turborepo
└── docker-compose.yaml     # Base de datos para desarrollo
```
