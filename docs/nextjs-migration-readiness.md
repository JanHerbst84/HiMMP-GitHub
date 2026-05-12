# HiMMP Next.js Migration Readiness

Date: 2026-05-11

This note records the local readiness state of the Next.js / TypeScript migration. It does not approve or perform deployment.

## Current Status

The migration is locally complete for the agreed fidelity phase:

- The Next.js app lives in `nextjs-site/`.
- The static export emits the 27 legacy root and findings HTML routes.
- Existing `.html` URLs are preserved in generated output.
- Page content is mechanically extracted from the source HTML rather than rewritten from memory.
- Full visible-text parity passes for all 27 generated HTML pages.
- Content block parity passes for all 27 generated HTML pages.
- Local-reference parity passes with only documented pending audio and PHP references.
- Generated sitemap parity passes for all 27 legacy routes, including `findings/14-recommended-reading.html`.
- Representative visual parity passes for 16 main-content captures. This is a targeted guard, not a claim that every route and viewport has been visually compared.
- Browser e2e tests cover route access, mobile navigation, publication filters/accordions, audio comparison behavior, findings audio-player behavior, video section navigation, and contact-form success/failure states. Audio loading and PHP contact endpoints are stubbed where the local static server cannot provide real MP3 metadata or PHP execution.

## Commits

Migration checkpoints currently pushed to `origin/main`:

- `068dbb2` - `feat: scaffold nextjs migration parity baseline`
- `efc87bc` - `docs: record next migration deployment decisions`
- `df2400d` - `fix: ensure generated sitemap covers legacy routes`
- `12e07c2` - `test: cover remaining legacy interactions`
- `154af6d` - `docs: record next migration readiness`

## Final Local Verification

Run from `nextjs-site/` on 2026-05-11:

- `npm run build` passed.
- `npm run typecheck` passed.
- `npm run parity` passed for 27 legacy HTML files.
- `npm run parity:content` passed for 27 generated HTML files.
- `npm run parity:text` passed for 27 generated HTML files.
- `npm run parity:links` passed with 89 explicitly allowed pending audio/PHP references.
- `npm run parity:sitemap` passed for 27 generated legacy routes.
- `npm run parity:visual` passed for 16 representative main-content captures. The visual gate uses `VISUAL_MAX_RMSE=0.20` unless overridden, so it is a regression smoke test rather than a pixel-perfect proof.
- `npm run test:e2e` passed 35 Playwright tests. These tests prove the browser-side contracts against the exported static site; they do not exercise real PHP endpoints or real MP3 playback from copied audio files.
- `npm run preflight:deploy` passed with three inherited source-metadata warnings.
- `npm audit --omit=dev` passed after adding an npm `overrides` pin for `postcss` to the fixed 8.5 line while keeping `next@16.2.6`.

## Review Caveats

- Claude critical review was used at the deployment-decision, sitemap, interaction-coverage, and final-readiness checkpoints.
- One earlier bounded Claude review produced no output and is recorded as `CANNOT VERIFY` in `docs/nextjs-migration-review-log.md`; the work proceeded because local gates passed.
- The final Claude readiness review identified caveats now recorded in this document and in `docs/nextjs-migration-deployment-decisions.md`.

## Deployment-Only Stopping Conditions

These items remain intentionally outside the local migration:

- Audio deployment: `assets/audio` is about 523 MB and is excluded from default sync/build. The host can carry the audio payload, so staging/production prep should use `npm run build:audio` and `npm run preflight:deploy:audio`.
- PHP contact workflow: the static export preserves the browser-side contract. The first deployment should co-host `get-csrf-token.php`, `contact-handler.php`, `config.php`, and a non-public writable `contact_submissions/` directory, with `npm run smoke:contact:php` used against staging.
- Host URL behavior: the production host must serve representative `.html` URLs directly, without redirecting them to extensionless routes.
- Duplicate route handling: the current export also emits extensionless routes. Production must either avoid serving those publicly or define an explicit canonical/indexation strategy that keeps `.html` as the public URL surface.
- Real integration checks: production preparation must exercise real MP3 delivery and the real PHP contact endpoints together with the exported static files.
- Analytics: Matomo markup is preserved, but the final local gates do not prove that production analytics requests are accepted by the live Matomo endpoint.
- Dependency advisories: `npm audit --omit=dev` now reports no vulnerabilities after overriding transitive `postcss` to the fixed 8.5 line. Keep this checked during deployment preparation because the override should be removed once Next depends on a fixed PostCSS release directly.
- Source-site defects: documented source defects are carried forward or safely corrected only where the decision file permits it; references, prose, empirical claims, and methodological text have not been rewritten.
- `himmp-ebook/`: this duplicate/generated package remains outside the 27-page route parity baseline until its intended public role is confirmed.

## Decision Supported

The local migration can be treated as ready for deployment preparation. The current deployment architecture is static export plus hosted audio plus one co-hosted PHP contact endpoint surface. Replacement of the contact workflow should be treated as a later backend decision, not part of the first deployment.
