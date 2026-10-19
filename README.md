# LCA Compare

## Introduction
LCA Compare is a web app for visualizing and comparing the Life Cycle Assessment (LCA) of crops, based on the results provided by [LCA Bridge](https://github.com/quercus-uex/LCA-Bridge).

## Goal
The ultimate goal of this app is to provide a simple, intuitive interface for comparing LCAs across crops in order to identify areas for improvement. To that end, the app lets you...
- Analyze the impact results of your own crop.
- Compare different groups of crops using the available filters.
- Export comparison results to **JSON** and **CSV**.
- Manage plots with **SIGPAC** and **Catastro** (Spain) and **SNIC** predial cadastre (Portugal) integration for locating and geospatially representing polygons.
- Generate automated reports.
- Use **AI** integration for assisted analysis.
- Use the interface in Spanish, English or Portuguese.

## Architecture

### Backend (`apps/server/src`)
NestJS REST API. The current public controllers cover:
- **Authentication** (`/auth`) - JWT login (there is no self-registration; administrators create users)
- **Users** (`/usuario`) - Authenticated user's profile
- **Plots** (`/parcela`) - The authenticated user's plots, with geospatial data
- **Impact results** (`/resultado`) - Querying LCA results
- **Comparator** (`/compare`) - Crop comparison and PDF report generation
- **Statistics** (`/stats`) - KPIs and aggregations for the statistics dashboard
- **Administration** (`/admin`) - CRUD for users, plots, crops, impact methods and locations
- **Locations** (`/pais`, `/provincia`, `/poblacion`) - Territorial data lookup
- **LCA Bridge** (`/capture`) - Receives LCA results from LCA Bridge and creates the related user, plot and crop

The backend's OpenAPI documentation is available at `/docs` when accessing the server directly, or at `/api/docs` through the frontend proxy.

## Technologies
The technologies used to build the web app are listed below:

### Backend
- **Node.js 22**
- **NestJS 11**
- **Prisma ORM 7**
- **PostgreSQL with PostGIS**
- **JWT** for authentication
- **Swagger/OpenAPI** for documentation
- **Playwright** for report generation
- **Handlebars** for templates
- **Nodemailer** for sending emails
- **OpenRouter SDK** for AI integration
- **proj4** for coordinate transformations
- **argon2** for password hashing

### Frontend
- **React 19**
- **TypeScript 5**
- **Vite 7**
- **TailwindCSS 4**
- **DaisyUI 5**
- **Leaflet / React-Leaflet** for maps
- **React Router 7**
- **React Hook Form**
- **i18next / react-i18next** for translations (`es`, `en`, `pt`)
- **Recharts** for charts
- **Luxon** for dates
- **Sonner** for notifications

## External services
To locate plots, the public APIs of SIGPAC and Catastro (Spain) and the SNIC predial cadastre of DGT (Portugal) have been integrated. This allows storing the polygon that represents each plot for later use in the comparator.

The system also communicates with:
- **LCA Bridge** for life cycle assessment calculations
- **OpenRouter** for AI-assisted capabilities

### Documentation
The user documentation is a Docusaurus 3 site in `apps/docs`, available in Spanish (default), English and Portuguese.

## Environment variables

### Development
The local backend reads its variables from `.env` (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection URL |
| `DB_USER` | Database user (used by `docker-compose.yaml`) |
| `DB_PASSWORD` | Database password (used by `docker-compose.yaml`) |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `OPENROUTER_API_KEY` | OpenRouter API key (optional: without it, reports omit the AI-generated text) |
| `MAILER_EMAIL` | Email account used to send notifications (optional: without `MAILER_*`, new users get no welcome email) |
| `MAILER_PASSWORD` | Email service password |
| `MAILER_HOST` / `MAILER_PORT` | SMTP server and port (default `587`); leave `MAILER_HOST` empty to use Gmail |
| `DEFAULT_IMPACT_METHOD_UUID` | UUID of the default impact method (EF 3.1) |
| `PORT` | Backend port; use `8000` in development for the Vite proxy (`3000` is the Nest and container default) |
| `LCA_CAPTURE_CLIENT_ID` / `LCA_CAPTURE_CLIENT_SECRET` | LCA Capture credentials (only needed to regenerate the documentation PDFs) |

### Production
The deployment reads its variables from the `.env` next to `compose.yaml` (see `deploy/.env.example`). `DATABASE_URL` is
built from `DB_USER` and `DB_PASSWORD`.

| Variable | Description |
|----------|-------------|
| `TAG` | Image tag: `main`, or `sha-<hash>` to pin a specific version |
| `DB_USER` / `DB_PASSWORD` | Database credentials |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `OPENROUTER_API_KEY` | OpenRouter API key (optional) |
| `MAILER_EMAIL` / `MAILER_PASSWORD` | Account used to send notifications (optional) |
| `MAILER_HOST` / `MAILER_PORT` | SMTP server and port (default `587`); leave `MAILER_HOST` empty to use Gmail |
| `CALC_API_KEY` | Key nginx requires in the `x-api-key` header for `/calc` |
| `DEFAULT_IMPACT_METHOD_UUID` | UUID of the default impact method (EF 3.1) |
| `OLCA_DATA_DIR` | Server directory holding the openLCA data (`ecoinvent` database) |
| `BACKUP_SCHEDULE` | Backup cron schedule (default `0 3 * * *`) |
| `BACKUP_S3_ENABLED` / `BACKUP_LOCAL_ENABLED` | Enable backups to S3 and/or local disk (defaults `false` / `true`) |
| `BACKUP_LOCAL_DIR` | Local backup directory (default `./backups`) |
| `BACKUP_S3_ENDPOINT` / `BACKUP_S3_REGION` / `BACKUP_S3_BUCKET` | Backup S3 bucket configuration |
| `BACKUP_S3_ACCESS_KEY_ID` / `BACKUP_S3_SECRET_ACCESS_KEY` | IAM credentials for uploading backups to S3 |

## Development
```bash
pnpm install
pnpm --filter common build
pnpm server:prisma:generate

docker compose up -d db
pnpm server:prisma:migrate:deploy   # creates the schema and loads the initial data

pnpm server:dev
pnpm web:dev
pnpm docs:dev
```

Schema changes are made through migrations (`pnpm server:prisma:migrate:dev`), never with `prisma db push`.

## Deployment
The full platform (LCA Compare, LCA Bridge, openLCA IPC server and backups) is deployed with
`deploy/compose.yaml`, using the images published on GHCR (`ghcr.io/quercus-uex/...`). There is no need to clone the
repository on the server.

Requirements: Docker with the Compose plugin, the openLCA data on the server and, if the GHCR packages are private,
a one-time login with a *classic* token with `read:packages`:

```bash
echo "$TOKEN" | docker login ghcr.io -u <user> --password-stdin
```

Deploying from scratch:

```bash
mkdir ~/lca-platform && cd ~/lca-platform
# copy deploy/compose.yaml as compose.yaml and deploy/.env.example as .env, then fill in .env
chmod 600 .env
docker compose pull
docker compose up -d
```

The compose file starts these services; only port 80 is published:
- **db** - PostgreSQL with PostGIS
- **migrate** - Applies the Prisma migrations (schema and initial data) and exits; the backend does not start if it fails
- **lca-compare-backend** - NestJS API
- **lca-compare-frontend** - React frontend served by Nginx, which acts as the reverse proxy (port 80)
- **lca-bridge** - LCA calculation service
- **openlca-ipc** - openLCA IPC server
- **db-backup** - Automatic database backups

After the first start, create the first administrator:

```bash
docker compose run --rm lca-compare-backend node apps/server/dist/src/scripts/create-admin.js \
  --email="admin@example.com" --password="secret" --nombre="Admin" --apellidos="Platform"
```

### Updating
The `Build images` workflow publishes the images on every push to `main` (tags `main` and `sha-<hash>`). Deployment
on the server is manual:

```bash
# from your local machine, only if deploy/compose.yaml has changed
scp deploy/compose.yaml <user>@<server>:~/lca-platform/compose.yaml

# on the server
cd ~/lca-platform
docker compose pull
docker compose up -d --remove-orphans
docker image prune -f
```

## Demo instance
`deploy/demo/` contains a self-contained, temporary LCA Compare instance for showcasing the app: database, backend and
frontend only (no LCA Bridge, openLCA or backups), populated with synthetic data. It uses the same GHCR images as
production and runs as a separate Compose project (`lca-compare-demo`), so it can live next to the production stack.

Requirements: Docker with the Compose plugin (and `docker login ghcr.io` if the packages are private). Copy the
`deploy/demo/` folder to the machine (or use it from a clone of the repository) and run:

```bash
cd deploy/demo
./demo.sh up
```

The script only asks for what the demo needs, either from the environment or interactively:

| Variable | Description |
|----------|-------------|
| `DEMO_ADMIN_EMAIL` | Email of the demo administrator |
| `DEMO_PASSWORD` | Password (min. 8 characters) for the administrator and all sample users |
| `DEMO_PORT` | Optional. Host port for the web app (default `8080`) |
| `TAG` | Optional. Image tag (default `main`) |
| `OPENROUTER_API_KEY` | Optional. Without it, comparison reports omit the AI-generated text |

The internal secrets (`DB_PASSWORD`, `JWT_SECRET`, `CALC_API_KEY`) are generated at random into `deploy/demo/.env` on
the first run.

`./demo.sh up` starts the stack, waits for the migrations and, if the database is empty, runs the `seed-demo` script
from the backend image. It creates:
- An administrator plus 8 sample farmers (`maria.sanchez@example.com`, `joao.silva@example.com`, ...), all with
  `DEMO_PASSWORD`; the script prints the full list.
- Around 40 plots in 17 municipalities of Spain and Portugal, with 3-5 campaigns each between 2021 and 2025 (tomato,
  maize, rice, olive, vineyard, wheat, almond and cherry) and their LCA results, including one reference plot per crop
  type.

The data is deterministic and synthetic: plot polygons are generated around each municipality and do not match real
SIGPAC/Catastro parcels, and no external service is called. The seed script refuses to run against a database that
already has users. Running `./demo.sh up` again restarts the demo without re-seeding it.

To remove the demo and all its data (containers, volume and generated `.env`):

```bash
./demo.sh down
```

## Usage
By default the web app is mapped to port 80. The API is available under the `/api` path and the Swagger documentation through the proxy at `/api/docs`.

### Main endpoints
- `POST /auth/login` - Login
- `GET /usuario` - Authenticated user
- `GET /parcela` - List the user's plots
- `GET /parcela/:id` - Plot with geometry
- `GET /resultado/:id` - LCA result
- `POST /compare` - Compare crops
- `POST /compare/report` - Generate the comparison report
- `GET /stats/global` - Global statistics
- `POST /capture` - Ingest results from LCA Bridge
- `GET /api/docs` - Swagger documentation through the frontend proxy

## Project structure
```
├── apps/
│   ├── server/             # NestJS backend
│   │   ├── src/
│   │   └── prisma/         # Prisma schema and migrations (including initial data)
│   ├── web/                # React frontend
│   │   └── src/
│   └── docs/               # Docusaurus documentation
├── packages/
│   └── common/             # DTOs, types and constants shared via subpath exports
├── deploy/                 # Production compose.yaml and .env.example
│   └── demo/               # Temporary demo instance (compose.yaml and demo.sh)
├── docker/backup/          # Backup image
├── openspec/               # OpenSpec changes and specs
├── pnpm-workspace.yaml     # pnpm workspace
├── turbo.json              # Turborepo pipeline
└── docker-compose.yaml     # Development database
```
