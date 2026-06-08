## 1. Workspace Foundation

- [x] 1.1 Create root `pnpm-workspace.yaml`, `turbo.json`, and a private root `package.json` with Turborepo orchestration scripts.
- [x] 1.2 Add package metadata for an empty `packages/common` workspace package without moving existing shared code into it.
- [x] 1.3 Remove npm lockfiles for the migrated app packages and generate a root `pnpm-lock.yaml`.

## 2. Application Relocation

- [x] 2.1 Move the existing backend package files, source, Prisma files, generated Prisma client, templates, prompts, configuration, and Dockerfile into `apps/server`.
- [x] 2.2 Move the existing frontend package files, source, Vite config, public assets, Nginx config, and Dockerfile into `apps/web`.
- [x] 2.3 Move the existing docs package files, source, static assets, and Docusaurus configuration into `apps/docs`.
- [x] 2.4 Update package names and workspace scripts so `server`, `web`, `docs`, and `common` can be targeted with pnpm filters.

## 3. Server Migration

- [x] 3.1 Update Nest CLI, TypeScript, ESLint, and runtime scripts to work from `apps/server`.
- [x] 3.2 Update Prisma config paths, generated client references, migration commands, and documentation references to work from `apps/server` using `--config prisma.config.ts`.
- [x] 3.3 Update backend build output and production start command so Docker runs the migrated Nest app correctly.
- [x] 3.4 Remove backend `.spec.ts` files, Jest configuration, Jest scripts, and backend test-only dependencies.

## 4. Web And Docs Migration

- [x] 4.1 Update frontend Vite, TypeScript, ESLint, and package scripts to work from `apps/web` while preserving `/api` proxy behavior.
- [x] 4.2 Remove any frontend test files, test scripts, and frontend test-only dependencies if present.
- [x] 4.3 Update docs Docusaurus scripts and configuration paths to work from `apps/docs`.

## 5. Docker And Deployment

- [x] 5.1 Update backend Docker build to install pnpm workspace dependencies, generate Prisma client, build the server app, install Playwright, and run the migrated production entrypoint.
- [x] 5.2 Update frontend Docker build to install pnpm workspace dependencies and build `apps/web` from the workspace context.
- [x] 5.3 Update Docker Compose build contexts, Dockerfile paths, service commands, and local database-only usage for the new app layout.
- [x] 5.4 Update `.github/workflows/deploy.yml` to deploy the workspace layout and run Prisma migrations from the server workspace package.

## 6. Verification

- [x] 6.1 Run `pnpm install` from the repository root and verify the root lockfile is created.
- [x] 6.2 Run root Turborepo build and lint commands for the migrated workspace.
- [x] 6.3 Run Prisma generate and migration command checks from the migrated server package.
- [x] 6.4 Build production Docker services with `docker compose --profile prod build`.
- [x] 6.5 Confirm `docker compose up -d` still starts the database-only local development service.
