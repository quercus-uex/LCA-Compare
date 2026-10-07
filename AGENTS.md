# AGENTS.md

## Project Shape

- pnpm 10/Turborepo monorepo: apps live in `apps/*`, shared packages in `packages/*`.
- Backend is NestJS in `apps/server`; real entrypoints are `src/main.ts` and `src/app.module.ts`.
- Frontend is React 19/Vite in `apps/web`; routes are declared in `src/App.tsx` (route components under `src/routes/`), providers in `src/main.tsx`, API base is `API_BASE_URL = '/api'` in `src/common/constants.ts`.
- Frontend UI strings live in `apps/web/src/i18n/locales/{es,en,pt}.ts`; add new keys to all three or the UI falls back inconsistently.
- Docs is a Docusaurus 3 app in `apps/docs`; locales are `es` (default), `en`, and `pt`, and Lunr search covers all three. Translations mirror `apps/docs/docs/` under `apps/docs/i18n/<locale>/docusaurus-plugin-content-docs/current/`; keep the three locales in sync when editing docs.
- `packages/common` is a real TypeScript package; backend/frontend import shared DTOs/constants from subpath exports such as `common/impact`, `common/compare`, and `common/api`.
- `docker/backup/` holds the DB backup sidecar image (Postgres 17 client + aws-cli + busybox cron); it lives outside `apps/*` and `packages/*` on purpose, so pnpm/Turborepo never touch it.
- `.opencode/`, `opencode.json`, and `.agents/` are OpenCode config, not app code; load the `customize-opencode` skill before editing them. `openspec/` holds the OpenSpec change/spec workflow artifacts (skills under `.opencode/skills/openspec-*`).

## Commands

```bash
pnpm install
pnpm dev                  # turbo dev across apps, TUI
pnpm build                # turbo build across common/server/web/docs
pnpm lint                 # turbo lint
```

```bash
pnpm --filter common build        # required before consumers can resolve common/dist after clean install
pnpm --filter common typecheck
pnpm server:prisma:generate       # generates apps/server/src/generated/prisma
pnpm server:dev                   # Nest watch mode
pnpm server:build                 # Nest build
pnpm server:lint                  # eslint with --fix and type-aware rules
pnpm server:test                  # Jest backend unit tests
pnpm --filter server test:cov     # backend coverage; used by Sonar workflow
pnpm web:dev                      # Vite --host
pnpm web:build                    # tsc -b then vite build
pnpm web:lint                     # eslint .
pnpm docs:dev                     # Docusaurus --host 0.0.0.0
pnpm docs:build
pnpm docs:typecheck
```

- To run one backend spec, use Jest after the filter, e.g. `pnpm --filter server test -- stats.service.spec.ts`.
- Only `apps/server` has tests; `web` and `docs` have no test scripts.
- Clean backend verification needs `pnpm --filter common build` before server tests/build, and `pnpm server:prisma:generate` before anything that imports `src/generated/prisma`.
- The Sonar workflow order is `pnpm --filter common build` -> `pnpm server:prisma:generate` -> `pnpm --filter server test:cov`.

## Prisma And Database

- Prisma config is `apps/server/prisma.config.ts`; run Prisma commands from the server package or use scripts that pass `--config prisma.config.ts`.
- The Prisma schema directory is `apps/server/prisma/schema/`, split into multiple `.prisma` files.
- Prisma client output is `apps/server/src/generated/prisma`, is gitignored, and may be absent after a clean checkout; import it as `../generated/prisma/client`, never `@prisma/client`.
- `PrismaService` uses `@prisma/adapter-pg` (`PrismaPg`) and `DATABASE_URL`; inject `apps/server/src/prisma/prisma.service.ts` instead of constructing Prisma clients directly.
- `Parcela.geom` is `Unsupported("geometry(Polygon, 4326)")`; geometry reads/writes use raw SQL/PostGIS patterns in `apps/server/src/parcela/parcela.service.ts`.
- Local DB must be PostgreSQL with PostGIS. The root `docker-compose.yaml` only defines the `db` service (`postgis/postgis:17-master`, same image as production).
- Schema changes go through versioned migrations in `apps/server/prisma/migrations/`: create them with `pnpm server:prisma:migrate:dev` and apply them with `pnpm server:prisma:migrate:deploy`. Never use `prisma db push`.
- `0_init` creates the PostGIS extension and the schema; `1_seed_datos_iniciales` seeds `Pais`, `Provincia`, `Poblacion` (Portugal and Spain) and the `EF 3.1` `MetodoImpacto`. A fresh DB gets reference data just by applying migrations.

## Backend Notes

- `ConfigModule.forRoot({ envFilePath: ['../../.env', '.env'] })` loads `.env` from repo root or `apps/server`; `.env.example` sets `PORT=8000` even though Nest defaults to `3000`.
- Vite dev proxy targets `http://localhost:8000` and strips `/api`, so local backend should use `PORT=8000` for frontend integration.
- Swagger is served by `src/main.ts` at `/docs`; `apps/server/nest-cli.json` enables the `@nestjs/swagger` plugin.
- Nest build copies `src/templates/*.hbs` and `src/ai/prompts/*.hbs` into `dist/src`; keep report/prompt assets under those paths.
- Server TypeScript uses `module`/`moduleResolution: "nodenext"`; common package also uses NodeNext and explicit `.js` extensions in source re-exports.
- Backend Jest only matches `apps/server/src/**/*.spec.ts`; it maps `common/*` to `packages/common/src/*.ts`, but `common/impact` and `@openrouter/sdk` use CJS mocks in `apps/server/test/mocks`.

## Frontend Notes

- TailwindCSS 4 is wired through `@tailwindcss/vite`; there is no `tailwind.config.js`.
- DaisyUI 5 is configured in CSS via `@plugin "daisyui"` and the custom `acv` theme in `apps/web/src/index.css`.
- `apps/web/tsconfig.app.json` is strict and enables `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUncheckedSideEffectImports`, `noImplicitOverride`, and `noUncheckedIndexedAccess` (the last makes `arr[i]`/`obj[k]` return `T | undefined`, so index reads need null guards).
- Production Nginx (`apps/web/nginx.conf`, rendered as an envsubst template) proxies `/api/` to `lca-compare-backend:3000/` and `/calc` to `lca-bridge:3000/capture-acv`; `/calc` rejects requests without header `x-api-key: $CALC_API_KEY` (401). A second `server` block serves `quercusstatus.duckdns.org` from `uptime-kuma:3001`.
- Upstreams use `server <name> resolve` with Docker's DNS (`resolver 127.0.0.11`), so nginx starts even if a target container is missing (502) and follows IP changes when a service is recreated; this needs nginx >= 1.27.3 (`nginx:alpine`).

## Deploy And Infra

- `.github/workflows/build.yml` (push to `main` or manual dispatch) builds and pushes `lca-compare-backend`, `lca-compare-frontend` and `lca-compare-backup` to `ghcr.io/quercus-uex/`, tagged `main` and `sha-<hash>`. LCA-Bridge has an equivalent workflow for `lca-bridge` and `openlca-ipc`. There is no deploy workflow: GitHub Actions never connects to the server.
- Production runs `deploy/compose.yaml` (project `lca-platform`) from `~/lca-platform` on the server, next to a `.env` based on `deploy/.env.example`. Services: `db`, `migrate`, `lca-compare-backend`, `lca-compare-frontend`, `lca-bridge`, `openlca-ipc`, `db-backup`. Required vars use `${VAR:?}`, so compose fails fast when one is missing; `TAG` selects the image tag.
- `migrate` reuses the backend image to run `prisma migrate deploy` and exits; `lca-compare-backend` waits for it with `service_completed_successfully`, so the backend does not start if a migration fails (check `docker compose logs migrate`).
- Only the frontend publishes a port (`80:80`); every other service is reachable only on the project network `lca-platform_default`. `openlca-ipc` mounts `OLCA_DATA_DIR` (ecoinvent data, not in the image) at `/app/data`.
- Uptime Kuma runs outside the compose (`docker run --name uptime-kuma --network lca-platform_default ...`); while it is attached, `docker compose down` cannot remove that network.
- Deploys are manual: copy `deploy/compose.yaml` to the server if it changed, then `docker compose pull && docker compose up -d --remove-orphans && docker image prune -f`. Create the first admin with `docker compose run --rm lca-compare-backend node apps/server/dist/src/scripts/create-admin.js --email=... --password=... --nombre=... --apellidos=...`.
- Backend Docker builds `common` first, runs Prisma generate, builds Nest, and installs Playwright Chromium with deps in the production image for report generation. The image includes `apps/server/prisma` (schema and migrations) and the Prisma CLI.
- The `db-backup` service runs a gzipped `pg_dump` on a cron schedule (`BACKUP_SCHEDULE`, default `0 3 * * *` UTC), plus a Sunday copy to the `weekly/` prefix. Destinations are toggled with `BACKUP_S3_ENABLED` (uploads to S3) and `BACKUP_LOCAL_ENABLED` (writes to the host dir `BACKUP_LOCAL_DIR`, default `./backups`, bind-mounted at `/backups` in the container); the script defaults both to `false` and requires at least one, while `deploy/compose.yaml` defaults S3 to `false` and local to `true`. S3 retention (7 daily + 4 weekly) is enforced by bucket lifecycle rules on `lca-compare-db/daily/` (8 days) and `lca-compare-db/weekly/` (29 days), not by code; local copies are not rotated automatically. Run a backup manually with `docker compose exec db-backup backup` or `docker compose run --rm db-backup backup`; logs via `docker compose logs db-backup`.
- Restore: download the `.sql.gz` from S3 (or take it from `BACKUP_LOCAL_DIR/daily/`), stop `lca-compare-backend` and `db-backup`, recreate the `acv` DB with the PostGIS extension, then `gunzip -c file.sql.gz | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d acv'` and `docker compose up -d`. The dump includes `_prisma_migrations`, so `migrate` only applies newer migrations.
- Local development only uses the root `docker-compose.yaml` (DB) and `pnpm` scripts; production images are never built on the server.
