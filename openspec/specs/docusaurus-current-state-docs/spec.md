## Purpose
Docusaurus documentation that accurately describes the current ACV Compare pnpm/Turborepo monorepo, repository layout, database workflow, deployment workflow, and available documentation-only maintenance expectations.
## Requirements
### Requirement: Monorepo development documentation
The Docusaurus documentation SHALL describe the current pnpm/Turborepo monorepo development workflow for ACV Compare and the docs app.

#### Scenario: Developer follows install instructions
- **WHEN** a developer reads the Docusaurus development documentation
- **THEN** the documented dependency installation uses the root pnpm workspace workflow instead of per-package npm installation

#### Scenario: Developer follows app startup instructions
- **WHEN** a developer reads the local startup instructions
- **THEN** the documented commands include the current root or filtered pnpm scripts for backend, frontend, docs, and repository-wide development

#### Scenario: Developer starts from a clean checkout
- **WHEN** a developer reads backend setup or build guidance
- **THEN** the documentation identifies the current prerequisites for building shared contracts and generating the Prisma client when needed

### Requirement: Current repository layout documentation
The Docusaurus documentation SHALL describe the current repository layout with deployable applications under `apps/*` and shared packages under `packages/*`.

#### Scenario: Reader reviews project structure
- **WHEN** a reader reviews the documented project structure
- **THEN** the backend is documented under `apps/server`, the frontend under `apps/web`, the docs site under `apps/docs`, and shared contracts under `packages/common`

#### Scenario: Reader reviews shared contracts
- **WHEN** a reader reviews how backend and frontend share DTOs, constants, or types
- **THEN** the documentation states that shared contracts are imported from the `common` workspace package through its subpath exports

### Requirement: Current Prisma and database documentation
The Docusaurus documentation SHALL describe the current Prisma and database workflow for the server workspace package.

#### Scenario: Developer generates Prisma client
- **WHEN** a developer reads Prisma setup instructions
- **THEN** the documented command uses the server workspace Prisma generate script or the server Prisma config path rather than an obsolete root-level `npx prisma generate` command

#### Scenario: Developer applies migrations
- **WHEN** a developer reads migration instructions
- **THEN** the documented commands account for the current `apps/server/prisma.config.ts` configuration and the split schema directory under `apps/server/prisma/schema`

#### Scenario: Developer seeds reference data
- **WHEN** a developer reads database initialization instructions
- **THEN** the documentation identifies `init/dbinit.sql` as the manual SQL seed for Portugal reference data and keeps the PostGIS database requirement visible

### Requirement: Current deployment documentation
The Docusaurus documentation SHALL describe the current Docker Compose and CI/CD deployment workflow.

#### Scenario: Operator reviews Docker Compose services
- **WHEN** an operator reads deployment documentation
- **THEN** the documented services, Dockerfile paths, exposed ports, production profile, and networks match the current Docker Compose configuration

#### Scenario: Operator deploys production services
- **WHEN** an operator follows production deployment instructions
- **THEN** the documented command uses `docker compose --profile prod up -d --build` and describes the external `olca` network requirement

#### Scenario: Operator applies production migrations
- **WHEN** an operator follows migration instructions for a deployed backend container
- **THEN** the documented command uses the current server workspace migration script or equivalent Prisma command with the server config

### Requirement: Removed test workflow documentation
The Docusaurus documentation SHALL NOT instruct users to run removed frontend or backend test workflows.

#### Scenario: Reader reviews available scripts
- **WHEN** a reader reviews documented script tables or testing sections
- **THEN** no Jest, end-to-end, coverage, or frontend test commands are presented as currently available unless matching scripts exist in package metadata

### Requirement: Documentation-only implementation
The change SHALL be limited to documentation content and documentation navigation metadata when needed for accuracy.

#### Scenario: Change is implemented
- **WHEN** the implementation is reviewed
- **THEN** no backend runtime code, frontend runtime code, Prisma schema, Docker service behavior, or shared package contract is changed

#### Scenario: Documentation site is verified
- **WHEN** verification is performed after editing the docs
- **THEN** the docs typecheck and build are run if dependencies are available, or any unavailable verification is reported with the reason
