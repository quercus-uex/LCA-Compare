## Why

The repository currently keeps backend, frontend, and docs as separately managed packages with independent package managers and duplicated workflow setup. Moving to a pnpm-powered Turborepo workspace will centralize dependency management, make cross-app scripts predictable, and prepare the codebase for shared packages without changing product behavior.

## What Changes

- **BREAKING**: Replace npm-based package management with pnpm workspaces and a root lockfile.
- **BREAKING**: Reorganize the repository into a Turborepo monorepo with `apps/web`, `apps/server`, `apps/docs`, and `packages/common`.
- Move the existing frontend code from `web/` to `apps/web`.
- Move the existing backend code from the repository root into `apps/server`.
- Move the existing Docusaurus docs from `docs/` to `apps/docs`.
- Create an empty `packages/common` package for future shared code without extracting any existing code yet.
- Remove all existing frontend and backend tests so they can be rebuilt later from scratch.
- Update scripts, Docker configuration, Prisma paths, frontend proxy assumptions, and GitHub Actions to work from the new workspace layout.

## Capabilities

### New Capabilities
- `monorepo-workspace-migration`: Defines the required repository workspace structure, package manager migration, test removal, and build/deploy compatibility for the Turborepo migration.

### Modified Capabilities

None.

## Impact

- Backend package metadata, source location, Nest build configuration, Prisma config, Docker build context, and deployment commands.
- Frontend package metadata, Vite configuration, source location, lint/build scripts, and Docker/Nginx build path.
- Docs package metadata and Docusaurus command location.
- Root package metadata, workspace configuration, Turborepo pipeline, pnpm lockfile, and removed npm lockfiles.
- GitHub Actions workflow commands and Docker Compose service build definitions.
