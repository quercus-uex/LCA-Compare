# LCA-Compare Docs

Docusaurus 3 documentation app for LCA Capture, LCA Bridge, and LCA-Compare in the pnpm workspace.

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

## PDF export

`pdf/generate-pdfs.mjs` renders the built site into one PDF per locale, saved in `pdf/`:

```bash
pnpm docs:build
node apps/docs/pdf/generate-pdfs.mjs
```

It needs [Prince](https://www.princexml.com/) on the `PATH` and `LCA_CAPTURE_CLIENT_ID` / `LCA_CAPTURE_CLIENT_SECRET`
(read from the root `.env`). The website shows those credentials redacted; the PDFs include them in clear.
