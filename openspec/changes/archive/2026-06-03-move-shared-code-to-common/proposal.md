## Why

`apps/server` and `apps/web` define overlapping API contracts and domain constants independently, which makes small API shape changes error-prone and forces duplicated maintenance. `packages/common` already exists in the monorepo but is effectively empty, so moving shared contracts there can simplify both applications without changing runtime behavior.

## What Changes

- Populate `packages/common` with structured, dependency-light shared exports for client/server contracts.
- Move shared EF impact category metadata and impact key constants out of app-local modules.
- Move shared API response wrappers and DTO-shaped TypeScript contracts for stats, compare, locations, parcels, users, auth, and impact result data into common.
- Keep Nest-specific DTO classes, decorators, validators, controllers, services, hooks, React components, browser-only code, and Prisma-only relation payloads inside their current apps.
- Update `server` and `web` imports to consume shared contracts from the common package while preserving existing endpoint payloads and UI behavior.
- Add package wiring so both apps can typecheck/build against `common` in the pnpm workspace.

## Capabilities

### New Capabilities
- `shared-common-contracts`: Shared package contracts and constants consumed by both `apps/server` and `apps/web`.

### Modified Capabilities
- `global-stats-api`: Statistics response payloads and EF category identifiers are sourced from shared contracts without changing the API response shape.
- `ef-category-aggregation`: EF category aggregation uses the shared EF category identifiers and metadata as its source of truth.
- `monorepo-workspace-migration`: The common workspace package becomes an active dependency of both app packages.

## Impact

- Affected code: `packages/common`, `apps/server/src/**`, `apps/web/src/**`, app `package.json` files, and TypeScript/package export configuration.
- APIs: No intentional HTTP endpoint, status code, or JSON payload changes.
- Dependencies: `server` and `web` gain a workspace dependency on `common`; `common` must avoid React, Nest, Prisma, browser-only, and server-only dependencies.
- Verification: Run `pnpm server:build`, `pnpm web:build`, and relevant lint/typecheck commands after implementation.
