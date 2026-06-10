# AGENTS.md

## Project Shape

- pnpm 10/Turborepo monorepo: apps live in `apps/*`, shared packages in `packages/*`.
- Backend is NestJS in `apps/server`; real entrypoints are `src/main.ts` and `src/app.module.ts`.
- Frontend is React 19/Vite in `apps/web`; routes are in `src/App.tsx`, providers in `src/main.tsx`, API base is `API_BASE_URL = '/api'` in `src/common/constants.ts`.
- Docs is a Docusaurus 3 app in `apps/docs`; locale/search are Spanish-only (`es`, Lunr).
- `packages/common` is a real TypeScript package; backend/frontend import shared DTOs/constants from subpath exports such as `common/impact`, `common/compare`, and `common/api`.
- `.opencode/` and `opencode.json` are OpenCode config, not app code; load the `customize-opencode` skill before editing them.

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
- Clean backend verification needs `pnpm --filter common build` before server tests/build, and `pnpm server:prisma:generate` before anything that imports `src/generated/prisma`.
- The Sonar workflow order is `pnpm --filter common build` -> `pnpm server:prisma:generate` -> `pnpm --filter server test:cov`.

## Prisma And Database

- Prisma config is `apps/server/prisma.config.ts`; run Prisma commands from the server package or use scripts that pass `--config prisma.config.ts`.
- The Prisma schema directory is `apps/server/prisma/schema/`, split into multiple `.prisma` files.
- Prisma client output is `apps/server/src/generated/prisma`, is gitignored, and may be absent after a clean checkout; import it as `../generated/prisma/client`, never `@prisma/client`.
- `PrismaService` uses `@prisma/adapter-pg` (`PrismaPg`) and `DATABASE_URL`; inject `apps/server/src/prisma/prisma.service.ts` instead of constructing Prisma clients directly.
- `Parcela.geom` is `Unsupported("geometry(Polygon, 4326)")`; geometry reads/writes use raw SQL/PostGIS patterns in `apps/server/src/parcela/parcela.service.ts`.
- Local DB must be PostgreSQL with PostGIS. `docker compose up -d` starts only the DB because app services are behind the `prod` profile.
- `init/dbinit.sql` seeds Portugal `Pais`, `Provincia`, and `Poblacion` reference data but is a manual SQL seed, not wired into migrations.

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
- `apps/web/tsconfig.app.json` is strict and enables `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, and `noUncheckedSideEffectImports`.
- Production Nginx proxies `/api/` to `acv-compare-backend:3000/` and `/calc` to `capture-openlca-bridge:3000/capture-acv`; the latter requires the external `olca` network service.

## Deploy And Infra

- `.github/workflows/deploy.yml` deploys on pushes to `main` or `develop`, plus manual dispatch.
- The deploy SSH script force-resets `$HOME/openlca/<repo>` to the pushed branch, runs `docker compose --profile prod up -d --build`, then runs `pnpm --filter server prisma:migrate:deploy` inside `acv-compare-backend`.
- Docker maps backend `8080:3000` and frontend `80:80`; `olca` is an external Docker network required by the prod profile.
- Backend Docker builds `common` first, runs Prisma generate, builds Nest, and installs Playwright Chromium with deps in the production image for report generation.
