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

The default artifact excludes `assets/audio`. Keep this as the lightweight local verification path; staging and production should use the audio-inclusive artifact now that audio hosting is available.

Because `npm run test:e2e` invokes the default non-audio build, rerun `npm run build:audio` and `npm run preflight:deploy:audio` after e2e before packaging or syncing the staging artifact.

## Audio-Inclusive Artifact

The host can carry the audio payload. Use the audio-inclusive artifact for staging and production deployment checks:

For a final staging candidate, run the full gate, then rebuild the final audio-inclusive artifact:

```bash
npm run build:audio
npm run typecheck
npm run parity
npm run parity:content
npm run parity:text
npm run parity:links
npm run parity:sitemap
npm run parity:visual
npm run test:e2e
npm audit --omit=dev
npm run build:audio
npm run preflight:deploy:audio
```

`build:audio` copies the source MP3 payload into `out/assets/audio` immediately before the static export. The default `npm run build` will continue to omit audio.

Latest local check, 2026-05-12:

- `npm run build:audio` completed successfully.
- `npm run preflight:deploy:audio` passed with 45 MP3 files in the export, about 499 MB.
- A subsequent default `npm run build` removed generated audio from `public/assets/audio` and `out/assets/audio`.
- `npm run preflight:deploy` then passed again with `Audio in export: not included`.
- Checkpoint 18 reran the full staging gate and then reran `npm run build:audio` plus `npm run preflight:deploy:audio`, leaving `nextjs-site/out/` in the audio-inclusive staging-candidate state.

## PHP Contact Co-Hosting

The first deployment should preserve the current contact workflow as one intentional PHP dynamic surface alongside the static export. Deploy these PHP-side files intentionally alongside the static artifact:

- `get-csrf-token.php`
- `contact-handler.php`
- `config.php`
- `contact_submissions/` as a non-public writable directory

The static export tests only prove that the browser-side form contract is preserved. A staging server must prove real PHP execution, PHP sessions, server mail behavior, writable submission/rate-limit files, and non-public handling of `config.php` and `contact_submissions/`.

Run the non-submitting PHP contact smoke test against staging after the files are deployed:

```bash
CONTACT_BASE_URL=https://HOSTNAME npm run smoke:contact:php
```

This checks CSRF JSON, PHP session cookies, handler execution, CSRF rejection, and exposure of sensitive PHP/contact-submission paths. It does not create a contact submission, but it will create normal server access/session activity.

Then run the mutating smoke test once on staging to verify the real mail/logging path:

```bash
CONTACT_BASE_URL=https://HOSTNAME npm run smoke:contact:php -- --submit
```

If staging intentionally has mail disabled but should still prove filesystem logging, use this only as a staging exception:

```bash
CONTACT_BASE_URL=https://HOSTNAME npm run smoke:contact:php -- --submit --allow-mail-failure
```

The production cutover should not rely on `--allow-mail-failure`; the contact form is only fully verified when the handler returns the successful mail response.

The script refuses `--submit` against `himmp.net` or `www.himmp.net` unless `--allow-production-submit` is passed deliberately.

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

## Resolved Preflight Warnings

Earlier migration checkpoints preserved three source-site metadata conditions as warnings:

- `index.html` preserves the source homepage `og:url` as `https://himmp.net` rather than `https://himmp.net/index.html`.
- `acknowledgements.html` has no source canonical URL to preserve.
- `findings/glossary.html` has no source canonical URL to preserve.

These were intentionally cleaned up in the Next.js metadata layer on 2026-05-12. `npm run preflight:deploy` now passes without metadata warnings while preserving the `.html` public URL policy.
