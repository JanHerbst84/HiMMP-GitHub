# HiMMP Next.js Site

This is the isolated migration workspace for rebuilding the current static/PHP
HiMMP site in Next.js and TypeScript.

The existing root HTML/PHP site is the source of truth until automated and
manual parity checks pass.

Deployment assumptions and non-deployment decisions are tracked in
`../docs/nextjs-migration-deployment-decisions.md`.

## Commands

```bash
npm run inventory
npm run build
npm run typecheck
npm run parity
npm run parity:content
npm run parity:text
npm run parity:links
npm run parity:sitemap
npm run parity:visual
npm run test:e2e
npm run test:hardening
npm run preflight:deploy
```

`npm run build` syncs CSS, JavaScript, images, figures, favicon, `robots.txt`,
`sitemap.xml`, and `llms.txt` into `public/`. It does not copy audio by default;
use `npm run sync:public:audio` only after confirming the deployment target can
host the MP3 payload.

Use `npm run build:audio` for the staging or production artifact. The deployment
preflight requires all source MP3s, so a lightweight `npm run build` artifact
cannot pass `npm run preflight:deploy` or be promoted accidentally.
Because `npm run test:e2e` performs a lightweight build first, create and check
the promotable artifact afterwards:

```bash
npm run build:audio
npm run preflight:deploy
```

`npm run parity:visual` compares representative legacy and Next-export
screenshots with ImageMagick and writes artifacts to `.migration/visual-parity/`.
It hides the fixed header during main-content captures because the current source
site has known case-sensitive logo-reference defects that are documented in the
migration audit.

`npm run sync:public` copies the legacy `sitemap.xml` and then patches the
generated copy so it covers every generated legacy route. `npm run parity:sitemap`
checks the exported sitemap after `npm run build`.

## Migration Rules

- Preserve current public `.html` URLs in the first migration.
- Preserve prose, references, metadata, JSON-LD, media paths, and audio behavior.
- Keep large MP3 files as static URL assets or move them to object storage
  deliberately; never import them into React modules.
- Keep the PHP contact workflow co-hosted unless it is explicitly reimplemented
  for the chosen deployment target.
