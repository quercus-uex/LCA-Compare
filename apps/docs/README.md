# ACV Compare Docs

Docusaurus 3 documentation app for Capture ACV and ACV Compare in the pnpm workspace.

## Commands

Run from the repository root:

```bash
pnpm docs:dev
pnpm docs:build
pnpm docs:typecheck
```

## Runtime Notes

- `pnpm docs:dev` runs Docusaurus with `--host 0.0.0.0`.
- The docs site is available in Spanish, English, and Portuguese (`defaultLocale: 'es'`, `locales: ['es', 'en', 'pt']`).
- Search uses `docusaurus-lunr-search` configured for Spanish, English, and Portuguese.
