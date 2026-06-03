## 1. Common Package Setup

- [x] 1.1 Add TypeScript source structure under `packages/common/src` with a root `index.ts` barrel.
- [x] 1.2 Update `packages/common/package.json` with package exports, type entrypoints, and build/typecheck scripts needed by app builds.
- [x] 1.3 Add or update common TypeScript config so the package emits consumable ESM types/code without app-specific dependencies.
- [x] 1.4 Add `common` as a workspace dependency of `apps/server` and `apps/web`.

## 2. Shared Contracts And Constants

- [x] 2.1 Move canonical `EF_CATEGORIES`, `EfCategoryId`, and impact category metadata into `packages/common` using the richer server metadata shape.
- [x] 2.2 Move `IMPACT_KEYS` and derived compare impact key types into `packages/common`.
- [x] 2.3 Add shared stats contracts for `KpiDto`, `ProvinciaRankingItemDto`, `PoblacionRankingItemDto`, `EvolucionTemporalItemDto`, `DistribucionCultivoItemDto`, and `GlobalStatsDto`.
- [x] 2.4 Add shared compare request/result contracts for compare filters, compare query items, compare query body, result items, and grouped compare results.
- [x] 2.5 Add shared API/domain contracts for response envelopes, `Pais`, `Provincia`, `Poblacion`, `Parcela`, `Cultivo`, `Usuario`, login success, and impact result payloads where both apps depend on the shape.
- [x] 2.6 Ensure `packages/common` imports no code from `apps/server`, `apps/web`, React, Nest, Prisma generated clients, browser APIs, or server APIs.

## 3. Server Migration

- [x] 3.1 Replace server-local EF category and impact key definitions with imports from `common` while keeping Prisma-only relation payload types in server code.
- [x] 3.2 Update stats aggregation helpers and services to use shared `EfCategoryId`, category metadata, and stats contracts.
- [x] 3.3 Update compare DTO/service/controller types to align with shared compare contracts while retaining validation decorators and Swagger-compatible runtime classes.
- [x] 3.4 Update location, parcel, cultivo, usuario, auth, resultado-impacto, and API response DTO files to implement or reference shared contracts where practical without removing required Nest decorators.
- [x] 3.5 Remove obsolete duplicated server-only contract aliases that are now sourced from `common`.

## 4. Web Migration

- [x] 4.1 Replace frontend-local `EF_CATEGORIES` and `EfCategoryId` definitions with imports from `common`, keeping `API_BASE_URL` app-local.
- [x] 4.2 Replace duplicated stats DTO aliases in `stats.hook.tsx` with imports from shared stats contracts.
- [x] 4.3 Replace duplicated compare, location, parcel/cultivo, usuario/auth, resultado-impacto, and API response hook types with imports from `common` where applicable.
- [x] 4.4 Adjust UI code for backend-accurate nullability in shared contracts without changing rendered behavior.
- [x] 4.5 Remove obsolete local type definitions that duplicate shared common contracts.

## 5. Verification

- [x] 5.1 Run the common package build or typecheck command and fix package export/type errors.
- [x] 5.2 Run `pnpm server:build` and fix TypeScript or package resolution errors.
- [x] 5.3 Run `pnpm web:build` and fix TypeScript or package resolution errors.
- [x] 5.4 Run relevant lint commands for touched apps/packages where available.
- [x] 5.5 Confirm there are no intentional HTTP route, status code, or JSON payload changes from the shared contract extraction.
