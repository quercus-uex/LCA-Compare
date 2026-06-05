## 1. Audit Current Documentation

- [x] 1.1 Review `apps/docs/docs/introduccion/introduccion.md` for stale architecture or cross-service statements caused by the monorepo and deployment changes.
- [x] 1.2 Review `apps/docs/docs/acv-compare/*.md` for obsolete package-manager commands, workspace paths, Prisma commands, deployment commands, and removed test references.
- [x] 1.3 Check Capture ACV docs only for statements that contradict this repository's current integration, proxy, or Docker networking behavior.

## 2. Update Development And Architecture Content

- [x] 2.1 Update ACV Compare development docs to use pnpm workspace installation and root/package scripts instead of old npm and `cd web` flows.
- [x] 2.2 Update local backend setup docs to include current common package build and Prisma client generation prerequisites for clean checkouts.
- [x] 2.3 Update documented project structure to use `apps/server`, `apps/web`, `apps/docs`, `packages/common`, and the current Prisma schema/client locations.
- [x] 2.4 Remove or replace any documented backend or frontend test commands that no longer exist in package scripts.

## 3. Update Deployment Content

- [x] 3.1 Update ACV Compare deployment docs to describe current Docker Compose services, Dockerfile paths, ports, production profile, and networks.
- [x] 3.2 Update database and Prisma migration instructions to use the server workspace Prisma config or current server package scripts.
- [x] 3.3 Update CI/CD documentation to match the current deploy workflow, including production Compose startup and server workspace migration execution.

## 4. Verify Documentation Site

- [x] 4.1 Run `pnpm docs:typecheck` to verify Docusaurus TypeScript configuration if dependencies are available.
- [x] 4.2 Run `pnpm docs:build` to verify the Docusaurus site builds if dependencies are available.
- [x] 4.3 Record any verification blocker and confirm the change touched only documentation or docs navigation metadata.
