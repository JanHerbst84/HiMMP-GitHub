# HiMMP Next.js Deployment Preparation

Date: 2026-05-11

This is the practical handoff checklist for preparing a staging or production artifact. It does not perform deployment.

## Default Static Artifact

Run from `nextjs-site/`:

```bash
npm ci
npm run build
npm run typecheck
npm run parity
npm run parity:content
npm run parity:text
npm run parity:links
npm run parity:sitemap
npm run parity:visual
npm run test:e2e
npm run preflight:deploy
npm audit --omit=dev
```

The default artifact excludes `assets/audio`. This is intentional until host storage and bandwidth are confirmed.

## Audio-Inclusive Artifact

Use only after confirming the host can carry the audio payload:

```bash
npm run build:audio
npm run preflight:deploy:audio
npm run parity:links
```

`build:audio` copies the source MP3 payload into `out/assets/audio` immediately before the static export. The default `npm run build` will continue to omit audio.

Latest local check, 2026-05-12:

- `npm run build:audio` completed successfully.
- `npm run preflight:deploy:audio` passed with 45 MP3 files in the export, about 499 MB.
- A subsequent default `npm run build` removed generated audio from `public/assets/audio` and `out/assets/audio`.
- `npm run preflight:deploy` then passed again with `Audio in export: not included`.

## PHP Contact Co-Hosting

If preserving the current contact workflow, deploy these PHP-side files intentionally alongside the static artifact:

- `get-csrf-token.php`
- `contact-handler.php`
- `config.php`
- `contact_submissions/` as a non-public writable directory

The static export tests only prove that the browser-side form contract is preserved. A staging server must prove real PHP execution, PHP sessions, server mail behavior, writable submission/rate-limit files, and non-public handling of `config.php` and `contact_submissions/`.

## URL Checks On The Target Host

After staging, check representative `.html` URLs:

```bash
curl -I https://HOSTNAME/about.html
curl -I https://HOSTNAME/publications.html
curl -I https://HOSTNAME/findings/08-drums.html
```

Each must return a direct successful response for the `.html` URL.

Also check extensionless forms:

```bash
curl -I https://HOSTNAME/about
curl -I https://HOSTNAME/publications
```

They should be unavailable, redirect to the matching `.html` URL, or carry verified `.html` canonical metadata.

## Known Preflight Warnings

`npm run preflight:deploy` currently passes with three source-faithfulness warnings:

- `index.html` preserves the source homepage `og:url` as `https://himmp.net` rather than `https://himmp.net/index.html`.
- `acknowledgements.html` has no source canonical URL to preserve.
- `findings/glossary.html` has no source canonical URL to preserve.

These are inherited source-site metadata conditions, not Next.js migration failures.
