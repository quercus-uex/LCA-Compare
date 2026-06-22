# LCA Compare Web

React 19 + Vite 7 frontend for the pnpm workspace.

## Commands

Run from the repository root:

```bash
pnpm web:dev
pnpm web:build
pnpm web:lint
```

`pnpm web:build` runs `tsc -b` before `vite build`. Build `packages/common` first after a clean checkout if shared subpath exports are missing:

```bash
pnpm --filter common build
```

## Runtime Notes

- API calls use `API_BASE_URL = '/api'` in `src/common/constants.ts`.
- Vite proxies `/api` to `http://localhost:8000` and strips the `/api` prefix.
- TailwindCSS 4 is configured through `@tailwindcss/vite`; DaisyUI 5 and the custom `acv` theme are configured in `src/index.css`.
