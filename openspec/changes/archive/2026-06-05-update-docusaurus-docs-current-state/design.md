## Context

The repository is now a pnpm 10/Turborepo monorepo with deployable apps under `apps/*` and shared contracts under `packages/common`. The Docusaurus content still includes instructions from the previous layout, including `npm install`, `cd web`, root-level backend paths, direct Prisma commands without `apps/server/prisma.config.ts`, and backend test scripts that are no longer present.

The documentation site itself lives in `apps/docs`, uses Spanish content, Docusaurus 3, and Lunr search. The requested change is documentation-only: it should make the existing docs truthful without changing application behavior or redesigning the docs site.

## Goals / Non-Goals

**Goals:**

- Update Docusaurus content so development, deployment, architecture, and project-structure guidance matches the current monorepo.
- Prefer concrete commands from the current root and workspace package scripts, such as `pnpm install`, `pnpm dev`, `pnpm --filter common build`, `pnpm server:prisma:generate`, `pnpm server:dev`, `pnpm web:dev`, `pnpm docs:dev`, and production Docker Compose commands.
- Correct stale paths for backend, frontend, docs, Prisma schema, Dockerfiles, and shared package code.
- Remove references to test suites or commands that no longer exist.
- Keep Spanish wording, current navigation, existing screenshots, and Docusaurus configuration intact unless a small content/navigation adjustment is necessary for accuracy.

**Non-Goals:**

- No backend API, frontend UI, Prisma schema, Docker Compose behavior, CI/CD behavior, or shared TypeScript contract changes.
- No migration of Capture ACV external service code or assumptions about changes outside this repository.
- No broad rewrite of every user-guide section unless it is factually stale.
- No new Docusaurus dependencies or theme redesign.

## Decisions

- Use a targeted documentation audit rather than a full docs rewrite. This keeps the implementation small and reduces the risk of accidentally changing still-valid user-facing explanations or screenshot-driven guidance.
- Treat repository files and scripts as the source of truth. Development commands should come from root `package.json`, package-level scripts, `pnpm-workspace.yaml`, Prisma config, Docker Compose, and Dockerfile paths, rather than from historical documentation.
- Document local database and clean-build prerequisites explicitly. The backend can require `pnpm --filter common build` and `pnpm server:prisma:generate` after a clean install, so the docs should call that out where development/build instructions appear.
- Keep deployment guidance aligned with the current production profile. The docs should describe `docker compose --profile prod up -d --build`, `apps/server/Dockerfile`, `apps/web/Dockerfile`, the external `olca` network, and running Prisma migrations through the server workspace command in the backend container.
- Preserve Docusaurus structure unless the audit reveals a stale title, sidebar, or category. The current request is about content accuracy, not information architecture.

## Risks / Trade-offs

- Outdated screenshots may remain if only text is audited -> Mitigation: verify screenshot captions and surrounding flow; only flag screenshots for replacement if they contradict current UI.
- Capture ACV documentation may describe an external repository that is not fully inspectable here -> Mitigation: only update cross-service statements that are directly verifiable from this repository or clearly stale due to the monorepo/deployment changes.
- Documentation can become stale again as scripts evolve -> Mitigation: reference root/package scripts and workspace paths directly, and avoid duplicating low-value implementation details where concise command tables are sufficient.
- Build verification may be slower than content editing -> Mitigation: run `pnpm docs:typecheck` and `pnpm docs:build` after edits if dependencies are available; otherwise record the blocker clearly.
