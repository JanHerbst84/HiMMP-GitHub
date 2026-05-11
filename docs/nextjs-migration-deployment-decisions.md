# HiMMP Next.js Migration Deployment Decisions

Date: 2026-05-11

Purpose: record the non-deployment decisions needed to finish the local migration without accidentally changing hosting behavior.

## Decision Summary

| Area | Decision for local migration | Deployment implication |
| --- | --- | --- |
| Rendering model | Keep `output: "export"` static export. | The generated `out/` directory can be hosted by a static web server, but it cannot provide API routes, middleware, server-side redirects, cookies, ISR, or optimized Next image handling. |
| Public URLs | Preserve legacy `.html` URLs. | Existing citations, internal links, canonicals, sitemap entries, and social metadata remain valid only if the host does not normalize `.html` URLs to extensionless routes. |
| Audio assets | Exclude MP3 files from default sync and build. Keep `npm run sync:public:audio` as an explicit deployment-prep command. | Deployment must confirm storage/bandwidth limits before copying about 523 MB of audio into the artifact. |
| Contact form | Preserve the legacy PHP contract in markup and tests; do not reimplement it in Next.js during local migration. | Production must either co-host PHP endpoints or explicitly replace the contact workflow later. |
| Source defects | Fix only migration-safe defects in generated output. Document ambiguous defects rather than silently rewriting them. | Deployment can choose whether to carry or correct legacy behavior with traceability. |

## Static Export

The migration app is intentionally configured for static export:

- `nextjs-site/next.config.ts` sets `output: "export"`.
- `nextjs-site/package.json` serves `out/` with `python3 -m http.server 4173 -d out`.
- E2E tests run against the exported files, not the Next development server.

This preserves a static-host deployment path and keeps the Next app independent of a Node production server.

Static export limits are part of the migration contract:

- No Next API routes for contact submission.
- No middleware/proxy layer for URL rewriting.
- No runtime server cookies or sessions.
- No default Next image optimization pipeline.

Therefore, the migration must keep direct `.html` route output and must not depend on host rewrites for legacy URLs.

Deployment hosts must be configured to serve `.html` URLs without redirecting them to extensionless paths. The current export contains both forms, for example `out/about.html` and `out/about/index.html`, because the App Router catch-all route also emits extensionless static routes. This is acceptable only if `/about.html` remains a `200` response and does not become a `301` or `308` to `/about`.

Before production handoff, test the chosen host with representative URLs:

```bash
curl -I https://HOSTNAME/about.html
curl -I https://HOSTNAME/publications.html
curl -I https://HOSTNAME/findings/08-drums.html
```

Each must return a direct successful response for the `.html` URL. If the host enforces clean URLs, disable that behavior or treat URL normalization as a separate SEO migration with explicit redirect, sitemap, canonical, Open Graph, and JSON-LD updates.

## `.html` URL Preservation

The first migration target is direct access to every baseline source URL:

- `/index.html`
- every root page such as `/about.html`, `/publications.html`, and `/audio.html`
- every findings page such as `/findings/08-drums.html`

The route/parity gates verify this contract:

- `npm run parity` checks exported HTML file presence for all 27 baseline pages.
- `npm run parity:links` checks local references against generated files, allowing only documented pending audio/PHP references.
- `npm run parity:sitemap` checks that the exported sitemap covers every generated legacy route.
- `npm run test:e2e` opens every generated legacy path in a browser.

Do not convert canonical public URLs to extensionless routes during the fidelity phase. Extensionless routes can be considered only after switchover, with redirects and metadata changes handled as a separate SEO migration.

## Audio Strategy

The source audio payload is about 523 MB. It should not be copied into every local build by default.

Current local behavior:

- `npm run sync:public` copies CSS, JavaScript, images, findings figures, favicon, `robots.txt`, `sitemap.xml`, and `llms.txt`.
- `npm run sync:public` intentionally does not copy `assets/audio`.
- `npm run sync:public:audio` copies `assets/audio` explicitly when host limits are confirmed.
- `npm run parity:links` allows pending `assets/audio/*` references and reports them as documented pending references.
- E2E tests stub audio loading where behavior depends on MP3 metadata.

Accepted deployment options:

1. Co-host audio under `/assets/audio/...`.
   - Run `npm run sync:public:audio` before the production export artifact is assembled.
   - Best fidelity, because all source URLs remain unchanged.

2. Move audio to object storage or a CDN.
   - Requires an explicit content/path migration and updated parity expectations.
   - Must preserve playback behavior and download semantics.

3. Replace local audio sources with Box/archive links.
   - Lowest artifact size.
   - Not equivalent to the current interactive audio comparison experience unless the player can stream those URLs reliably.

Default recommendation before deployment: use option 1 if the host can accept the storage and bandwidth load; otherwise treat option 2 as a deliberate follow-up task.

## Contact Strategy

The current contact flow is PHP-based:

- `contact.html` fetches `get-csrf-token.php`.
- Form submission posts `FormData` to `contact-handler.php`.
- The PHP backend depends on session state, file-backed submissions/rate limiting, and server mail behavior.

Current local migration behavior:

- The migrated page preserves the legacy form markup and client-side script.
- E2E tests stub `get-csrf-token.php` and `contact-handler.php` to verify the browser-side contract.
- `npm run parity:links` allows the PHP endpoints as documented pending references.

Accepted deployment options:

1. Co-host existing PHP endpoints alongside the static export.
   - Best fidelity.
   - Requires the production server to serve both `out/` static files and the PHP files/endpoints.

2. Reimplement contact submission in a non-static Next/Node deployment.
   - Requires leaving pure static export or adding a separate backend.
   - Must preserve CSRF, validation, rate limiting, storage/email behavior, and privacy expectations.

3. Replace the form with a mailto or third-party form service.
   - Not fidelity-equivalent and should be treated as a product decision, not a migration default.

Default recommendation before deployment: co-host the existing PHP endpoints unless the deployment target explicitly supports and justifies a backend replacement.

## Source Defect Policy

Safe to correct in generated migration output:

- Case-sensitive logo references where the source HTML points to files that do not exist on a case-sensitive filesystem. The migration should rewrite references to the existing on-disk filenames `HiMMP-Logo-small.png` and `AHRC-Logo.png`; it should not rename the asset files.
- Generated sitemap coverage for routes the migration already exports.

Carry forward or document unless explicitly approved:

- `privacy.html` linking to missing `updates.html`.
- `findings/14-recommended-reading.html` duplicated `og:description` metadata where `twitter:description` appears intended.
- `himmp-ebook/` role and internal link structure.
- Any reference-entry, prose, empirical, or methodological changes.

## Verification Before Deployment Handoff

Run from `nextjs-site/`:

```bash
npm run typecheck
npm run build
npm run parity
npm run parity:content
npm run parity:text
npm run parity:links
npm run parity:sitemap
npm run parity:visual
npm run test:e2e
```

If production will co-host audio, use the audio-aware build command:

```bash
npm run build:audio
npm run parity:links
```

`npm run build:audio` runs the full public-asset sync including audio immediately before `next build`, avoiding dependence on the default `prebuild` sync that intentionally excludes audio.

If production will co-host PHP, verify the exported static site and PHP endpoints together with the actual server configuration. The local static-export test server cannot prove PHP execution.

## PHP Hosting Constraints

If the deployment co-hosts the existing PHP contact workflow, the server must satisfy these constraints:

- `get-csrf-token.php`, `contact-handler.php`, and `config.php` must be deployed outside the immutable Next `out/` artifact or copied into a PHP-capable document root intentionally.
- `contact_submissions/` must be writable by the PHP process because `contact-handler.php` writes rate-limit files and submission logs there.
- `contact_submissions/` must not be publicly downloadable and should not be cached by a CDN.
- `config.php` must be readable by PHP but must not be served as a static download. It contains mail/recipient configuration and belongs outside any static-only public artifact.
- PHP sessions must work for CSRF validation.
- Server mail behavior must be configured, or the existing mail path must be replaced deliberately.

These requirements cannot be verified by `python3 -m http.server` or a static-host preview.
