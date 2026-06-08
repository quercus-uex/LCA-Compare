## ADDED Requirements

### Requirement: Workspace Layout
The repository SHALL be organized as a pnpm workspace with deployable applications under `apps/` and reusable packages under `packages/`.

#### Scenario: Applications are moved into apps directory
- **WHEN** the migration is applied
- **THEN** the existing frontend code is located under `apps/web`, the existing backend code is located under `apps/server`, and the existing docs code is located under `apps/docs`

#### Scenario: Common package exists without extracted code
- **WHEN** the migration is applied
- **THEN** `packages/common` exists as a workspace package and does not contain abstractions extracted from the existing apps

### Requirement: pnpm Package Management
The repository SHALL use pnpm workspaces with a single root lockfile for backend, frontend, docs, and common package dependency management.

#### Scenario: Root workspace files define the monorepo
- **WHEN** dependencies are installed
- **THEN** pnpm uses root workspace configuration to include `apps/*` and `packages/*`

#### Scenario: npm lockfiles are removed from migrated application packages
- **WHEN** the migration is applied
- **THEN** npm lockfiles for the root backend, frontend, and docs package layout are replaced by a root `pnpm-lock.yaml`

### Requirement: Turborepo Orchestration
The repository SHALL provide Turborepo-based root commands for common development and CI tasks.

#### Scenario: Repository-wide build runs through Turborepo
- **WHEN** a developer runs the root build command
- **THEN** Turborepo builds the workspace apps using their package scripts

#### Scenario: Application-specific commands remain available
- **WHEN** a developer needs to run backend, frontend, or docs commands individually
- **THEN** root scripts or pnpm filters provide access to the corresponding app package scripts

### Requirement: Existing Behavior Preservation
The migration SHALL preserve existing backend, frontend, and docs behavior except for test removal and package-manager changes.

#### Scenario: Backend API keeps existing entrypoints and runtime behavior
- **WHEN** the server app is built and started
- **THEN** it runs the existing Nest application with the same API routes, Swagger setup, configuration loading, templates, prompts, and Prisma integration

#### Scenario: Frontend keeps existing API proxy behavior
- **WHEN** the web app is run in development
- **THEN** requests using `API_BASE_URL = '/api'` continue to proxy to the backend target with `/api` stripped

#### Scenario: Docs site keeps existing Docusaurus behavior
- **WHEN** the docs app is built or started
- **THEN** it uses the existing Docusaurus configuration and content from the migrated docs app

### Requirement: Test Removal
The migration SHALL remove existing frontend and backend tests and their dedicated test tooling from app scripts and configuration.

#### Scenario: Backend tests are removed
- **WHEN** the migration is applied
- **THEN** backend `.spec.ts` test files, Jest scripts, Jest configuration, and backend test-only dependencies are removed

#### Scenario: Frontend tests are removed
- **WHEN** the migration is applied
- **THEN** any existing frontend test files and frontend test scripts or test-only dependencies are removed

### Requirement: Docker And Deployment Compatibility
The migration SHALL update Docker, Docker Compose, and GitHub Actions so production deployment works from the new pnpm/Turborepo workspace layout.

#### Scenario: Production Docker builds use workspace paths
- **WHEN** Docker Compose builds production services
- **THEN** backend and frontend images are built using the new workspace paths and pnpm workspace dependency installation

#### Scenario: Deployment runs migrations from the server workspace package
- **WHEN** the GitHub Actions deployment workflow runs after updating the remote checkout
- **THEN** it starts production services and executes Prisma migrations using the migrated server app configuration

#### Scenario: Database-only compose usage remains available
- **WHEN** Docker Compose is started without the production profile
- **THEN** the database service remains available for local development
