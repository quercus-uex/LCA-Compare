---
sidebar_label: 'Deployment'
sidebar_position: 2
---

# Service Deployment

Before deploying the LCA comparison service, you need to have cloned the repository ([https://github.com/quercus-uex/Ventum-ACV-Visualizer](https://github.com/quercus-uex/Ventum-ACV-Visualizer)).

## Environment Variables

The service reads its configuration from a `.env` file located at the project root. As a starting point, copy the `.env.example` file included in the repository and rename it to `.env`:

```bash
cp .env.example .env
```

Then adjust the values for your environment:

```sh
DATABASE_URL="postgres://user:password@localhost:5432/acv"  # Local connection used outside Docker
JWT_SECRET="CHANGEME"                    # Secret key for JWT (authentication)
OPENROUTER_API_KEY="sk-or-v1-...."       # API key for OpenRouter (AI in reports)

DB_USER="user"                           # Database user
DB_PASSWORD="password"                   # Database password

MAILER_EMAIL="example@example.com"       # Email for notification delivery
MAILER_PASSWORD="Password"               # Email password for notifications

CAPTURE_ACV_EMAIL="email@example.com"    # Email for LCA Capture authentication (bulk extraction)
CAPTURE_ACV_PASSWORD="P@ssw0rd"          # Password for LCA Capture authentication (bulk extraction)

DEFAULT_IMPACT_METHOD_UUID="2f995579-06bd-4681-b07c-cee3b1805b0d"  # UUID of the default impact method (EF 3.1)

PORT=8000                                # Backend port in development
```

In production with Docker Compose, `DATABASE_URL` is automatically injected into the backend as `postgres://${DB_USER}:${DB_PASSWORD}@db:5432/acv`. The `.env` value remains available for local commands, tests, or development outside the container.

## Database Initialization

First, deploy the database service from Docker Compose:

```bash
docker compose up -d db
```

After deploying the database, apply Prisma migrations from the `server` package. The schema is split under `apps/server/prisma/schema/`, and the Prisma configuration is in `apps/server/prisma.config.ts`, so commands must run through workspace scripts or explicitly pass that configuration.

```bash
pnpm server:prisma:migrate:deploy
```

Finally, run the SQL file with initial data (countries, provinces, towns, and so on) available at `init/dbinit.sql`. This file is a manual SQL seed for Portugal reference data, not an automatic migration:

```bash
docker exec -i db psql -U ${DB_USER} -d acv < init/dbinit.sql
```

## Docker Compose Structure

The `docker-compose.yaml` file defines three services. The database starts without a profile, and the applications are included only with the `prod` profile:

| Service | Image | Port | Profile |
|---|---|---|---|
| `db` | `postgis/postgis:17-master` | 5432 | *(always active)* |
| `lca-compare-backend` | Built from `apps/server/Dockerfile` | 8080→3000 | `prod` |
| `lca-compare-frontend` | Built from `apps/web/Dockerfile` | 80→80 | `prod` |

### Networks

The compose file defines two networks:

- **`acv-compare`**: internal network for communication between backend, frontend, and database.
- **`olca`**: external network shared with the LCA Bridge service. It must be created manually:

```bash
docker network create olca
```

### Reverse Proxy (Nginx)

The frontend is served with Nginx, which acts as a reverse proxy with the following routing:

| Route | Destination |
|---|---|
| `/api/` | `lca-compare-backend:3000` (REST API, removing the `/api` prefix) |
| `/calc` | `lca-bridge:3000/capture-acv` (LCA calculation) |
| `/` | Statically served SPA (`index.html`) |

## Full Deployment

Once the database is ready, deploy all services with the production profile:

```bash
docker compose --profile prod up -d --build
```

This builds the backend and frontend images and starts all three services. The backend image first builds `packages/common`, generates the Prisma client, and then builds NestJS. If you did not apply migrations during the previous database preparation step, run them now in the backend container using the workspace `server` script:

```bash
docker compose exec lca-compare-backend pnpm --filter server prisma:migrate:deploy
```

## CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that runs on every push to the `main` and `develop` branches. The pipeline:

1. Connects to the deployment server through SSH.
2. Clones or updates the repository on the corresponding branch.
3. Rebuilds and starts the containers with `docker compose --profile prod up -d --build`.
4. Runs pending migrations with `pnpm --filter server prisma:migrate:deploy` inside the `lca-compare-backend` container.

Sensitive environment variables are injected from GitHub secrets (`DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `OPENROUTER_API_KEY`, `CAPTURE_ACV_EMAIL`, `CAPTURE_ACV_PASSWORD`, `MAILER_EMAIL`, `MAILER_PASSWORD`, and `DEFAULT_IMPACT_METHOD_UUID`).

The repository also includes the `.github/workflows/sonar.yml` workflow, which installs dependencies, builds `packages/common`, generates the Prisma client, and runs backend coverage before SonarCloud analysis.

## Verification

After deployment, verify that the services respond correctly:

```bash
# Frontend
curl http://localhost/

# REST API (Swagger documentation)
curl http://localhost/api/docs/
```
