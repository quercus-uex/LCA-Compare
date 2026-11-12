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

## Environment Variables

The backend reads the `.env` file at the repository root. Create it from the template and adjust its values:

```bash
cp .env.example .env
```

`DATABASE_URL`, `JWT_SECRET`, and `DEFAULT_IMPACT_METHOD_UUID` are required. OpenRouter and email are optional: without them, reports do not include AI-generated text and the welcome email is not sent. Keep `PORT=8000`, which is the target of the Vite proxy.

## Database

Start the PostgreSQL database with PostGIS:

```bash
docker compose up -d db
```

The Compose file creates the `acv` database with the `DB_USER` and `DB_PASSWORD` credentials from `.env`; with the template values, `DATABASE_URL` is `postgres://user:password@localhost:5432/acv`.

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

The NestJS server starts on the `PORT` from `.env` (`http://localhost:8000`; without the variable, `3000`) with hot reload. Swagger documentation is available at `http://localhost:8000/docs`.

### Frontend (SPA)

```bash
pnpm web:dev
```

The Vite development server starts at `http://localhost:5173`. Requests to `/api` are redirected to the backend at `http://localhost:8000` (proxy in `apps/web/vite.config.ts`, which strips the `/api` prefix).

In development, `/dev/ui` shows the component library catalog (`src/components/ui`); the route is not included in the production build.

### Whole Monorepo

```bash
pnpm dev
```

Runs `turbo dev --ui=tui`, which starts the development processes of all packages at once.

### Documentation

```bash
pnpm docs:dev
```

The Docusaurus documentation lives in `apps/docs` and is served with `docusaurus start --host 0.0.0.0`.

## Create an Administrator

There is no public sign-up, so an empty database needs an administrator to sign in. Build the backend and run the script from the repository root:

```bash
pnpm server:build
pnpm --filter server admin:create -- --email="admin@example.com" --password="secret" --nombre="Admin" --apellidos="Platform"
```

## Available Scripts

### Workspace Root

| Command | Description |
|---|---|
| `pnpm install` | Installs dependencies for the entire workspace |
| `pnpm dev` | Runs Turbo in development mode for the monorepo |
| `pnpm build` | Builds packages and applications through Turbo |
| `pnpm lint` | Runs configured linters through Turbo |
| `pnpm screenshots` | Captures the web views at mobile, tablet, and desktop sizes (`utils/responsive-screenshots.mjs`; requires the web app, the backend, and `SHOTS_EMAIL`/`SHOTS_PASSWORD`) |
| `pnpm docs:screenshots` | Regenerates the screenshots in this documentation and the ER diagram (`utils/docs-screenshots.mjs`; same requirements, plus `pdftoppm` for the report) |

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
| `pnpm --filter server admin:create` | Creates a user with the `admin` role (see [Create an Administrator](#create-an-administrator)) |

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
│   │   │   ├── auth/              # JWT authentication (login and guards)
│   │   │   ├── usuario/           # Authenticated user's profile
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
│   │   │   ├── organizacion/      # Organizations, per-campaign consents and notifications
│   │   │   ├── admin/             # Role-protected admin CRUD
│   │   │   ├── ai/                # OpenRouter AI integration
│   │   │   ├── mailer/            # Email delivery
│   │   │   ├── prisma/            # PrismaService for database access
│   │   │   ├── common/            # Internal backend DTOs and helpers
│   │   │   ├── scripts/           # Create administrator and demo data
│   │   │   ├── templates/         # Handlebars templates for reports
│   │   │   └── generated/         # Autogenerated Prisma client
│   │   ├── prisma.config.ts       # Prisma configuration for the server package
│   │   ├── prisma/
│   │   │   ├── schema/            # Prisma schema split into multiple files
│   │   │   │   ├── schema.prisma
│   │   │   │   ├── poblacion.prisma
│   │   │   │   └── organizacion.prisma
│   │   │   └── migrations/        # Versioned migrations (0_init, 1_seed_datos_iniciales with the initial data, and 2_organizaciones)
│   │   └── Dockerfile             # Backend image
│   ├── web/                       # React frontend
│   │   ├── src/
│   │   │   ├── main.tsx           # React entry point
│   │   │   ├── App.tsx            # Root component with routes
│   │   │   ├── components/        # Application components
│   │   │   │   └── ui/            # Component library (catalog at /dev/ui)
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
│   ├── .env.example               # Production environment variables
│   └── demo/                      # Demo instance
├── docker/
│   └── backup/                    # Backup image
├── utils/                         # Development tools (responsive screenshots)
├── docker-compose.yaml            # Database for development
├── pnpm-workspace.yaml            # apps/* and packages/* definition
└── turbo.json                     # Turborepo pipeline
```

The backend and frontend consume shared contracts from the `common` workspace package, for example through subpaths such as `common/impact`, `common/stats`, `common/compare`, `common/location`, `common/parcela`, `common/usuario`, `common/organizacion`, `common/auth`, or `common/api`.

## Database Schema

![ER diagram of the LCA Compare database](/img/acv-compare/esquema-er.png)

The Prisma schema defines these main models:

| Model | Description |
|---|---|
| `Usuario` | Users with role (`admin` or standard user) |
| `Parcela` | Plots with SIGPAC, cadastral reference, PostGIS geometry, and a reference plot flag |
| `Cultivo` | Crop seasons with metrics (area, production, water consumption) |
| `ResultadoImpacto` | LCA results in JSON format by impact method |
| `MetodoImpacto` | Registered impact methods (identified by openLCA UUID) |
| `Pais` | Reference countries for locating plots |
| `Provincia` | Provinces associated with a country and its cadastral code |
| `Poblacion` | Towns associated with a province and its cadastral code |
| `Organizacion` | Organizations created by a user, who is their only administrator |
| `Consentimiento` | Access of an organization to a user's data for one campaign (year), with its status: pending, accepted, rejected or revoked |
| `Notificacion` | Informational notices for a user (revocations, removals, transfers…); pending requests are read from `Consentimiento` |

The main relationships are: `Usuario` → `Parcela` → `Cultivo` → `ResultadoImpacto` → `MetodoImpacto`.

Geographic location is modeled with the `Pais` → `Provincia` → `Poblacion` hierarchy, where each plot is assigned to a town and stores its polygon in a PostGIS `geometry(Polygon, 4326)` column. Both fields are optional: if the polygon cannot be obtained during ingestion (wrong SIGPAC, Catastro or predial identifier, unavailable service or invalid geometry) or the town is not found, the plot is still saved without them and the failure is logged as a warning by the backend.

The `esParcelaReferencia` flag (default `false`) can only be set by an administrator and lets the comparator restrict a set to these plots through the `soloParcelasReferencia` filter.

An organization's administrator can access a member's data only for the campaigns that member has accepted: the rule lives in `OrganizacionAccesoService` and is used by the plot and result details, the comparator and the statistics. The campaign is the UTC year of `Cultivo.fechaInicioCampania`. The administrator's own plots count only for the campaigns they contribute themselves (`PUT /organizaciones/:id/campanias-administrador`), stored as accepted consents. `/compare` and `/stats` remain public: `OptionalAuthGuard` identifies the user if they send a valid token, and filtering by an organization they do not manage returns 403. The comparator's `idsParcela` filter also returns 403 without a session; with one it only reaches the user's own plots and, for other owners' plots, the campaigns consented to the organizations the user manages; any other plot is ignored.
