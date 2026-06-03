## Context

The repository is currently a multi-package project managed as separate npm packages: the Nest backend at the repository root, the Vite React frontend in `web/`, and the Docusaurus site in `docs/`. Each package has its own lockfile and dependency install flow, while Docker and deployment scripts assume the backend lives at the root and the frontend lives at `web/`.

The change migrates the project to a single pnpm workspace managed by Turborepo. The existing application behavior should be preserved while the physical layout and tooling change. Tests for frontend and backend are intentionally removed because they will be recreated later from scratch.

## Goals / Non-Goals

**Goals:**

- Create a root pnpm workspace with Turborepo orchestration.
- Move backend, frontend, and docs into `apps/server`, `apps/web`, and `apps/docs`.
- Add an empty `packages/common` package for future shared code.
- Preserve current backend, frontend, docs, Prisma, Docker, and deployment behavior after paths are updated.
- Remove existing frontend and backend test files, test scripts, and test-only dependencies/configuration.
- Replace npm lockfiles for the migrated apps with a root `pnpm-lock.yaml`.

**Non-Goals:**

- Do not extract existing code into `packages/common`.
- Do not add new product functionality or change API routes.
- Do not introduce new tests in this migration.
- Do not redesign frontend UI or change docs content.
- Do not alter database schema semantics except for required path references.

## Decisions

- Use `apps/*` and `packages/*` as workspace globs. This is the standard Turborepo layout and keeps deployable apps distinct from reusable packages.
- Keep each app's package metadata close to its code. The root `package.json` will be private and contain workspace orchestration scripts such as `build`, `lint`, `dev`, and app filters.
- Use pnpm filters for app-specific commands. Root scripts should delegate to `turbo` for repo-wide tasks and to `pnpm --filter <package>` for targeted commands that operators already need, such as Prisma migrations.
- Move server-specific configuration into `apps/server` when it is coupled to the Nest app. Prisma schema and migrations should remain usable from the server package with `--config prisma.config.ts` and updated relative paths.
- Keep Dockerfiles app-focused but build from a workspace-aware context. Docker builds need access to root `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`, package manifests, and the target app source.
- Remove tests rather than disabling them. Backend Jest scripts/configuration and frontend/backend test files should be deleted so future tests start from a clean baseline.
- Leave `.opencode/` package files outside this migration unless required by workspace tooling. They are OpenCode helper files and should not become part of the application monorepo.

## Risks / Trade-offs

- Workspace path mistakes can break Docker builds or runtime asset copying. Mitigation: update Dockerfiles, Compose build contexts, Nest asset paths, and verify app builds from the root.
- Prisma path changes can break client generation or migrations. Mitigation: keep the documented `--config prisma.config.ts` flow and update config paths relative to the server app location.
- Removing tests reduces regression safety during migration. Mitigation: use build, lint, Prisma generate, and container build commands as the migration verification baseline.
- pnpm's stricter dependency resolution can expose undeclared dependencies. Mitigation: ensure each app declares the packages it imports and avoid relying on hoisted transitive dependencies.
- Turborepo adds orchestration complexity. Mitigation: keep `turbo.json` small, only model core `build`, `lint`, `dev`, and generated-output dependencies initially.
