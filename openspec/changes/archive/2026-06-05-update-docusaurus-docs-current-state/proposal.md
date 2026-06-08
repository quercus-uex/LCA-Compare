## Why

The Docusaurus documentation no longer reflects the current repository state after the pnpm/Turborepo monorepo migration and related backend, frontend, docs, Docker, and Prisma workflow changes. Keeping these docs current reduces onboarding friction and prevents developers or deployers from following obsolete `npm`, path, test, and migration instructions.

## What Changes

- Audit the Spanish Docusaurus content for ACV Compare and the general project introduction against the current repository layout and scripts.
- Update development documentation to describe the pnpm workspace, Turborepo commands, `apps/*` and `packages/*` layout, common package build requirements, and current app-specific scripts.
- Update deployment documentation to describe the current Docker Compose services, workspace Dockerfile paths, production profile, Prisma migration commands, and CI/CD migration command.
- Remove or correct stale references to removed tests, old `web/` and root backend paths, direct `npx prisma` commands without the server config, and obsolete package-manager flows.
- Preserve the existing Docusaurus site structure, Spanish language, screenshots, and user-facing usage guidance unless a section is factually outdated.

## Capabilities

### New Capabilities

- `docusaurus-current-state-docs`: Ensures the Docusaurus documentation describes the current monorepo structure, development workflow, deployment workflow, and available scripts accurately.

### Modified Capabilities

None.

## Impact

- Affected content: `apps/docs/docs/**/*.md` and, only if needed for navigation or labels, `apps/docs/sidebars.ts` or category metadata.
- Affected systems: Docusaurus documentation site only.
- No backend API, frontend runtime behavior, database schema, Docker service behavior, or shared package contracts are intended to change.
