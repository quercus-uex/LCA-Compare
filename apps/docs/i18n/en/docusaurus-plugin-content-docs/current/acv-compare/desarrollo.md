---
sidebar_label: 'Development'
sidebar_position: 4
---

# Development Environment

## Dependency Installation

LCA Compare is part of a **pnpm 10** monorepo with **Turborepo**. Install dependencies from the repository root, not from each application separately:

```bash
pnpm install
```

The workspace includes applications under `apps/*` and shared packages under `packages/*`.

## Database

Start the PostgreSQL database with PostGIS:

```bash
docker compose up -d db
```

In local development, make sure `DATABASE_URL` points to that database. With the included Compose file, the database is created as `acv`, for example `postgres://user:password@localhost:5432/acv` if you use the credentials from `.env.example`.

After a clean install, build the shared package and generate the [Prisma](https://www.prisma.io/docs/orm) client before building or starting the backend:

```bash
pnpm --filter common build
pnpm server:prisma:generate
```

The client is generated in `apps/server/src/generated/prisma`, and the backend imports it from that generated path.

Apply the migrations in `apps/server/prisma/migrations/`. On an empty database they create the schema (with the PostGIS extension) and load the initial data: countries, provinces, towns, and the EF 3.1 impact method:

```bash
pnpm server:prisma:migrate:deploy
```

To change the schema, edit the files in `apps/server/prisma/schema/` and generate a new migration with the development script, which loads `apps/server/prisma.config.ts`:

```bash
pnpm server:prisma:migrate:dev
```

:::warning
Do not use `prisma db push`: it applies the schema without recording migrations and leaves the database outside the history used by deployments.
:::

## Start Development Servers

### Backend (REST API)

```bash
pnpm server:dev
```

The NestJS server starts at `http://localhost:8000` with hot reload enabled. Swagger documentation is available at `http://localhost:8000/docs`.

Port `8000` depends on the `PORT` variable in `.env`. If it is not defined, NestJS uses the default value `3000`.

### Frontend (SPA)

```bash
pnpm web:dev
```

The Vite development server starts at `http://localhost:5173`. Requests to `/api` are automatically redirected to the backend at `http://localhost:8000` through the proxy configured in `apps/web/vite.config.ts`.

### Whole Monorepo

```bash
pnpm dev
```

This command runs `turbo dev --ui=tui` to start the development processes defined in the workspace packages.

### Documentation

```bash
pnpm docs:dev
```

The Docusaurus documentation lives in `apps/docs` and is served with `docusaurus start --host 0.0.0.0`.

## Available Scripts

### Workspace Root

| Command | Description |
|---|---|
| `pnpm install` | Installs dependencies for the entire workspace |
| `pnpm dev` | Runs Turbo in development mode for the monorepo |
| `pnpm build` | Builds packages and applications through Turbo |
| `pnpm lint` | Runs configured linters through Turbo |

### Backend (`apps/server`)

| Command | Description |
|---|---|
| `pnpm server:dev` | Starts the NestJS server in development mode with hot reload |
| `pnpm server:build` | Builds the backend |
| `pnpm server:start:prod` | Starts the compiled version |
| `pnpm server:test` | Runs the backend unit tests with Jest |
| `pnpm server:lint` | Runs ESLint with backend rules |
| `pnpm server:prisma:generate` | Generates the Prisma client using `apps/server/prisma.config.ts` |
| `pnpm server:prisma:migrate:dev` | Creates a new migration from schema changes and applies it locally |
| `pnpm server:prisma:migrate:deploy` | Applies pending migrations (schema and initial data on an empty database) |
| `pnpm --filter server admin:create` | Creates a user with the `admin` role (requires `--email`, `--password`, `--nombre`, `--apellidos`) |

### Frontend (`apps/web`)

| Command | Description |
|---|---|
| `pnpm web:dev` | Starts the Vite development server |
| `pnpm web:build` | Compiles TypeScript and builds with Vite |
| `pnpm web:lint` | Runs ESLint |

### Documentation (`apps/docs`)

| Command | Description |
|---|---|
| `pnpm docs:dev` | Starts Docusaurus in development |
| `pnpm docs:typecheck` | Checks the Docusaurus TypeScript configuration |
| `pnpm docs:build` | Builds the documentation site |

### Shared Package (`packages/common`)

| Command | Description |
|---|---|
| `pnpm --filter common build` | Builds shared DTOs, types, and constants |
| `pnpm --filter common typecheck` | Runs TypeScript without emitting files |

## Project Structure

```
.
├── apps/
│   ├── server/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── main.ts            # Application bootstrap
│   │   │   ├── app.module.ts      # Root module
│   │   │   ├── auth/              # JWT authentication (login, registration, guards)
│   │   │   ├── usuario/           # User CRUD
│   │   │   ├── parcela/           # Plot management with geospatial data
│   │   │   ├── cultivo/           # Crop registration and queries
│   │   │   ├── resultadoimpacto/  # LCA result storage and querying
│   │   │   ├── compare/           # Comparison logic between crop sets
│   │   │   ├── capture/           # Data reception from LCA Bridge
│   │   │   ├── sigpac/            # SIGPAC integration
│   │   │   ├── catastro/          # Catastro integration
│   │   │   ├── predial/           # Portuguese predial identifier
│   │   │   ├── pais/              # Country queries
│   │   │   ├── provincia/         # Province queries
│   │   │   ├── poblacion/         # Town queries
│   │   │   ├── metodoimpacto/     # Impact methods
│   │   │   ├── stats/             # Global statistics and dashboard aggregations
│   │   │   ├── admin/             # Role-protected admin CRUD
│   │   │   ├── ai/                # OpenRouter AI integration
│   │   │   ├── mailer/            # Email delivery
│   │   │   ├── prisma/            # PrismaService for database access
│   │   │   ├── common/            # Internal backend DTOs and helpers
│   │   │   ├── scripts/           # Utility scripts (e.g. create admin user)
│   │   │   ├── templates/         # Handlebars templates for reports
│   │   │   └── generated/         # Autogenerated Prisma client
│   │   ├── prisma.config.ts       # Prisma configuration for the server package
│   │   ├── prisma/
│   │   │   ├── schema/            # Prisma schema split into multiple files
│   │   │   │   ├── schema.prisma
│   │   │   │   └── poblacion.prisma
│   │   │   └── migrations/        # Versioned migrations (0_init, and 1_seed_datos_iniciales with the initial data)
│   │   └── Dockerfile             # Backend image
│   ├── web/                       # React frontend
│   │   ├── src/
│   │   │   ├── main.tsx           # React entry point
│   │   │   ├── App.tsx            # Root component with routes
│   │   │   ├── components/        # Reusable components
│   │   │   ├── hooks/             # Custom hooks
│   │   │   ├── stats/             # Statistical visualization components
│   │   │   ├── routes/            # Application views
│   │   │   ├── common/            # Shared constants and utilities
│   │   │   └── i18n/              # Internationalization (es, en, pt)
│   │   ├── nginx.conf             # Production reverse proxy
│   │   └── Dockerfile             # Frontend image
│   └── docs/                      # Docusaurus site
├── packages/
│   └── common/                    # Shared DTOs, types, and constants
├── deploy/
│   ├── compose.yaml               # Production compose file (GHCR images)
│   └── .env.example               # Production environment variables
├── docker/
│   └── backup/                    # Backup image
├── docker-compose.yaml            # Database for development
├── pnpm-workspace.yaml            # apps/* and packages/* definition
└── turbo.json                     # Turborepo pipeline
```

The backend and frontend consume shared contracts from the `common` workspace package, for example through subpaths such as `common/impact`, `common/stats`, `common/compare`, `common/location`, `common/parcela`, `common/usuario`, `common/auth`, or `common/api`.

## Database Schema

![ER diagram of the LCA Compare database](/img/acv-compare/esquema-er.png)

The Prisma schema defines these main models:

| Model | Description |
|---|---|
| `Usuario` | Users with role (`admin` or standard user) |
| `Parcela` | Plots with SIGPAC, cadastral reference, PostGIS geometry, and a reference plot flag |
| `Cultivo` | Crop campaigns with metrics (area, production, water consumption) |
| `ResultadoImpacto` | LCA results in JSON format by impact method |
| `MetodoImpacto` | Registered impact methods (identified by OpenLCA UUID) |
| `Pais` | Reference countries for locating plots |
| `Provincia` | Provinces associated with a country and its cadastral code |
| `Poblacion` | Towns associated with a province and its cadastral code |

The main relationships are: `Usuario` → `Parcela` → `Cultivo` → `ResultadoImpacto` → `MetodoImpacto`.

Geographic location is modeled with the `Pais` → `Provincia` → `Poblacion` hierarchy, where each plot is assigned to a town and stores its polygon in a PostGIS `geometry(Polygon, 4326)` column.

The `esParcelaReferencia` flag (default `false`) can only be set by an administrator and lets the comparator restrict a set to these plots through the `soloParcelasReferencia` filter.
