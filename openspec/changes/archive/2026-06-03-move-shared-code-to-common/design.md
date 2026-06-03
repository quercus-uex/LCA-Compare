## Context

The repository is already a pnpm/Turborepo monorepo with `apps/server`, `apps/web`, and an intentionally empty `packages/common`. Both apps currently duplicate or locally redefine several contracts that represent the same HTTP payloads or domain concepts.

Observed candidates include:

- `EF_CATEGORIES` and `EfCategoryId`, currently duplicated in `apps/web/src/common/constants.ts` and `apps/server/src/compare/compare.types.ts`, with the server version carrying extra `englishNames` metadata needed for matching persisted impact JSON.
- `IMPACT_KEYS`, currently app-local to server compare logic but useful as a stable shared contract for compare result keys.
- Global stats DTO shapes, currently Nest classes in `apps/server/src/stats/dto/global-stats.dto.ts` and TypeScript aliases in `apps/web/src/stats/stats.hook.tsx`.
- Compare request/result payload shapes, currently represented by server DTO classes and frontend hook types.
- Basic domain response shapes for `Pais`, `Provincia`, `Poblacion`, `Parcela`, `Cultivo`, `Usuario`, login success, and API response envelopes.

`common` must remain dependency-light because it will be consumed by browser and Node builds. It should not import React, Nest, Prisma, validators, Swagger decorators, local storage, fetch utilities, or app services.

## Goals / Non-Goals

**Goals:**

- Establish `packages/common` as the single source of truth for shared constants and TypeScript-only API/domain contracts.
- Preserve existing HTTP payload shapes and endpoint behavior.
- Keep app-specific runtime code in the apps while removing duplicated contract definitions.
- Make `server` and `web` consume `common` through workspace package imports.
- Keep Nest DTO classes available where decorators, validation, Swagger metadata, or runtime class constructors are needed.

**Non-Goals:**

- Changing backend API routes, JSON field names, validation behavior, or authentication behavior.
- Moving React hooks, components, providers, server services, Prisma payload types, Nest decorators, or generated Prisma code into `common`.
- Introducing runtime schema validation libraries or new external dependencies.
- Refactoring all possible frontend fetch logic or backend controllers beyond what is needed to use shared contracts.

## Decisions

### Decision: Common Exports Are TypeScript Contracts And Plain Constants

`packages/common` will expose plain constants and TypeScript interfaces/types, organized by domain, for example `src/impact.ts`, `src/stats.ts`, `src/compare.ts`, `src/location.ts`, `src/parcela.ts`, `src/usuario.ts`, `src/auth.ts`, `src/api.ts`, and a root `src/index.ts` barrel.

Rationale: both apps can consume these exports without pulling in framework-specific dependencies. This also keeps the package small and avoids requiring decorators or runtime metadata in frontend code.

Alternative considered: move Nest DTO classes into common. That would couple common to `@nestjs/swagger`, `class-validator`, and class-transformer, making it unsuitable as a neutral shared package.

### Decision: Preserve Nest DTO Classes As Thin Runtime Wrappers

Server DTO classes that need Swagger or validation decorators will remain in `apps/server`. Where possible, they will implement or reference common interfaces/types so their field shapes stay aligned.

Rationale: Nest Swagger and validation decorators require runtime classes and metadata. TypeScript interfaces from common do not exist at runtime, so they cannot replace decorated classes directly.

Alternative considered: remove DTO classes and rely only on inferred TypeScript types. That would degrade Swagger metadata and validation behavior.

### Decision: Use The Server EF Metadata As The Canonical Category Source

The shared `EF_CATEGORIES` will include all fields currently required by both apps: `id`, `englishNames`, `spanishName`, `unit`, and `color`. The web can ignore `englishNames`; the server keeps using it for EF category matching.

Rationale: the current server copy has the richer shape and is required for aggregation correctness. The frontend copy is a subset, so adopting the richer shared shape avoids data loss.

Alternative considered: expose separate frontend and backend category lists. That would keep duplication and preserve the same drift risk this change is intended to remove.

### Decision: Model Nullability From Backend Payloads, Not UI Assumptions

Common DTO-shaped contracts will reflect the backend response shape. For example, nullable parcel fields such as `sigpac`, `refCat`, and `ptIdParcela` should remain nullable in common if the server DTO exposes them as nullable.

Rationale: the shared package should describe transport contracts, not what a particular UI component currently assumes after rendering guards.

Alternative considered: keep frontend-friendly non-null shapes in common. That would hide real API nullability from web callers and reduce type safety.

### Decision: Add Workspace Package Wiring Without New Runtime Dependencies

Both `apps/server/package.json` and `apps/web/package.json` will declare a workspace dependency on `common`. `packages/common/package.json` will define package exports and, if needed, a small TypeScript build script/config so app builds resolve the package consistently.

Rationale: package-level imports make the shared boundary explicit and align with the existing pnpm workspace layout.

Alternative considered: use TypeScript path aliases directly to `packages/common/src`. That would be more brittle across Vite, Nest, and emitted builds.

## Risks / Trade-offs

- [Risk] Server DTO classes and common interfaces can still drift if classes do not explicitly implement common interfaces. -> Mitigation: update DTO classes to implement common contracts where practical and use common types in services and controllers.
- [Risk] Common package build/export configuration can break either Vite or Nest NodeNext resolution. -> Mitigation: use standard ESM package exports and verify with both `pnpm web:build` and `pnpm server:build`.
- [Risk] Moving constants can create import cycles if common imports app code. -> Mitigation: enforce one-way dependency only: apps import common; common imports no app modules.
- [Risk] Shared contracts can become a dumping ground. -> Mitigation: only move code consumed by both apps or representing public API payloads; leave framework-specific/runtime logic in apps.

## Migration Plan

1. Configure `packages/common` with TypeScript source, exports, and build/type scripts as needed.
2. Add common contracts and constants in domain-focused files.
3. Update server imports for EF categories, impact keys, stats/compare/result/location/user types while preserving DTO classes and decorators.
4. Update web imports to use common types/constants and remove duplicate local type aliases.
5. Run builds and lint/typecheck commands to confirm package resolution and no payload behavior changes.
6. Rollback strategy: revert app imports back to local definitions and remove the workspace dependency if common resolution blocks deployment.

## Open Questions

- None blocking. During implementation, exact contract naming should follow existing domain names to minimize churn.
