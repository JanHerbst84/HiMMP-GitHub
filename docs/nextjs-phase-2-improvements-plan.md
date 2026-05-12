# HiMMP Next.js Phase 2 Improvements Plan

Date: 2026-05-12

Purpose: define the post-fidelity improvement phase for the Next.js / TypeScript site. Phase 1 proved that the existing site can be carried over without content loss. Phase 2 should improve the experience deliberately while keeping the migration baseline available as a guardrail.

## Operating Principle

Treat the migrated static site as the preservation baseline. Improvements may change layout, interaction, and presentation, but they must not silently change academic content, references, empirical claims, route semantics, or public metadata.

For each improvement:

- Record whether it is a presentation change, interaction change, content-structure change, or deployment change.
- Keep full text/content parity checks available until a page is intentionally converted away from mechanical legacy extraction.
- When a parity check is expected to fail because of an intentional redesign, replace it with a more specific regression check for the preserved content.
- Use Claude review for high-risk UX/content boundary changes, especially audio, ebook/findings, metadata, and contact workflow changes.

## Recommended Sequence

### 1. Stabilise The Improvement Architecture

Goal: prepare the Next app for deliberate React components without breaking legacy output.

Tasks:

- Add a clear split between legacy-rendered pages and redesigned React pages.
- Add a route/page registry flag such as `renderMode: "legacy" | "enhanced"` if needed.
- Keep the legacy source extraction available for comparison.
- Add regression fixtures for text, references, JSON-LD, and local links on any page that becomes enhanced.

Done when:

- The app can host both legacy-extracted pages and enhanced React pages.
- Existing gates still pass for pages not yet enhanced.

### 2. Ebook / Findings Guide Redesign

Goal: turn the findings guide into a better reading and learning experience while preserving all scholarly content.

Recommended first target: the `findings/` chapter set, not `himmp-ebook/`, because the 15 findings pages are already in the 27-page parity baseline.

Features:

- Persistent chapter navigation with previous/next controls.
- Reading progress and section outline.
- Search within findings chapters.
- Glossary-aware linking.
- Better figure presentation with captions and mobile handling.
- Embedded audio examples using the improved audio component.
- Print-friendly chapter styling.
- Optional ebook-style landing page that explains the guide structure without changing chapter prose.

Guardrails:

- Preserve chapter titles, body text, references, captions, figure paths, and audio example labels unless explicitly changed.
- Do not merge `himmp-ebook/` into the public route tree until its role is confirmed.
- Keep `.html` routes working.

Done when:

- Chapter navigation works on desktop and mobile.
- Text/reference parity or chapter-specific content snapshots pass.
- Keyboard navigation and screen-reader landmarks are checked.

### 3. Audio Experience

Goal: replace legacy audio scripts with a typed, reusable React audio-comparison system.

Features:

- Shared player for `audio.html` and findings chapters.
- Better loading, error, and unavailable-audio states.
- Stable playback-position preservation when switching mixes/stems.
- Clear producer/stem grouping.
- Mobile-friendly controls.
- Optional waveform or timeline view if it can be generated without bloating the app.
- Optional CDN/object-storage configuration for MP3 delivery.

Guardrails:

- Do not import MP3 files into JavaScript bundles.
- Preserve existing audio source paths until a deliberate audio-hosting decision is made.
- Keep `build:audio` and `preflight:deploy:audio` as the audio-inclusive artifact path.

Done when:

- Unit/component tests cover switching, labels, current-time preservation, error states, and grouped track selection.
- Playwright tests cover at least one root audio player and one findings player.
- A real audio staging check is performed before production deployment.

### 4. Video Experience

Goal: make the video archive easier to browse and lighter to load.

Features:

- Typed video data model extracted from the current embeds.
- Lazy-loaded YouTube embeds with click-to-load placeholders.
- Section filters for interviews, mixing sessions, reactions, and bonus material.
- Better scan layout with producer/session metadata.
- Optional transcript or summary fields only if source material exists.

Guardrails:

- Preserve existing embed URLs, titles, and section groupings until intentionally changed.
- Do not invent transcripts, summaries, dates, or metadata.

Done when:

- Video section navigation and filtering are tested.
- Initial page load avoids loading all YouTube iframes.
- Existing video URLs remain reachable from the enhanced UI.

### 5. Contact Workflow Decision

Goal: keep contact co-hosted in PHP for the first deployment, while preserving a clear path to a later backend replacement if hosting constraints change.

Current decision for first deployment: keep PHP co-hosting.

Later replacement options:

- Small standalone backend endpoint with SMTP.
- Serverless form endpoint with explicit CSRF/rate-limiting design.
- Node/Next server deployment only if the site stops being pure static export.

Guardrails:

- Do not remove CSRF, rate limiting, validation, logging fallback, or privacy expectations.
- Do not replace with `mailto:` as a fidelity-equivalent solution.

Done when:

- A staging form sends a real message or records a deliberate test submission.
- PHP/session/mail/logging behavior is verified with `npm run smoke:contact:php` against staging, or a replacement backend has equivalent tests in a later phase.

### 6. SEO, Accessibility, And Analytics Cleanup

Goal: improve findability and accessibility after the main experience improvements are stable.

Tasks:

- Decide whether to add canonicals to source pages that currently lack them in generated output.
- Decide how to handle homepage `og:url` versus `/index.html`.
- Confirm `.html` URL behavior on the target host.
- Verify Matomo requests on staging.
- Run accessibility checks on enhanced pages.
- Revisit the PostCSS override once Next directly depends on a fixed PostCSS release.

Done when:

- Metadata changes are explicit and documented.
- Host URL checks pass.
- Accessibility regressions are fixed or recorded.

## Suggested Immediate Next Step

Start with a small enhanced findings-guide slice:

1. Convert only the findings hub and one representative chapter to an enhanced React rendering path.
2. Keep the original legacy-rendered chapter available for comparison during development.
3. Build the chapter shell, navigation, and content-preservation tests.
4. Review with Claude before expanding to all findings chapters.

This gives the project a visible improvement quickly while exercising the hardest content-preservation problem before touching all pages.

## Progress

### 2026-05-12: Initial Findings Slice

- Added a route-level enhanced rendering path.
- Enabled the enhanced findings reader shell for `findings.html` and `findings/07-meta-instrument.html`.
- Preserved the original legacy `<main>` content inside the enhanced shell.
- Added e2e coverage for findings hub navigation, chapter previous/next links, and retained chapter content.
- Added desktop/mobile overflow checks for the enhanced findings layout.
- Kept full text/content parity passing for all 27 generated legacy pages.

### 2026-05-12: Full Findings Shell Expansion

- Enabled the enhanced findings reader shell for every findings chapter and the glossary.
- Kept legacy guide content rendered through the same extracted `<main>` payloads.
- Added e2e coverage proving every findings route uses the enhanced shell and marks the active chapter link.
- Added first/middle/final paging coverage for the chapter navigation.
- Restored enhanced-shell-aware visual parity captures for representative findings pages while keeping all findings pages covered by text/content parity.

### 2026-05-12: Reader Polish And Visual Guardrails

- Added page-position status to the findings reader panel and duplicated previous/next paging at the end of each chapter.
- Hid the duplicate legacy chapter-section strip and bottom chapter pager inside the enhanced shell while keeping them in the DOM for content preservation and parity checks.
- Improved the enhanced reading measure, heading rhythm, non-portrait figure presentation, table overflow handling, and endnote separation.
- Hardened visual parity for enhanced findings pages by neutralising the reader chrome, disabling animation, eager-loading images, and hiding dynamic media surfaces during main-content comparison.
- Expanded visual parity coverage to 24 desktop/mobile captures across representative root, media, findings, and glossary routes.
- Added regression coverage for guide-home author portraits, bottom paging, hidden legacy chapter navigation, reader width limits, and the Figure 9.3 image load path.

### 2026-05-12: Audio Controller Slice

- Added an `enhanced-audio` render mode for `audio.html` while keeping the legacy page markup and all visible text as the content source.
- Replaced the legacy `audio.html` comparison-player script with a typed client controller that binds the preserved DOM after hydration.
- Preserved existing MP3 source paths and avoided importing audio into the JavaScript bundle.
- Added accessible active-button state, live ready/loading/error status text, playback-position preservation, and resume-on-switch behavior.
- Left findings-chapter audio players on the legacy script path for this slice so the higher-risk chapter-media migration can be handled separately.
- Added browser coverage for script suppression, mix switching, `aria-pressed`, current-time preservation, and unavailable-audio reporting.
- Updated visual parity normalization so intentional runtime audio status does not mask content/layout comparison.

### 2026-05-12: Findings Audio Controller Expansion

- Mounted the enhanced audio controller on enhanced findings routes as well as `audio.html`.
- Suppressed the legacy `assets/js/audio-player.js` script on enhanced findings routes while preserving all chapter audio markup and source paths.
- Kept findings chapter audio examples in the existing DOM structure, with the typed controller adding active button state, live status text, and playback-position preservation after hydration.
- Strengthened browser coverage for findings chapter audio by checking controller hydration, legacy-script suppression, `aria-pressed`, status text, label updates, source switching, and current-time preservation.

### 2026-05-12: Video Lazy-Embed Slice

- Added an `enhanced-video` render mode for `videos.html`.
- Rewrote YouTube iframe `src` attributes to `data-lazy-youtube-src` during static rendering so exported `videos.html` preserves all iframe elements, titles, and URLs without loading YouTube embeds immediately.
- Added a typed client video controller that creates thumbnail/play placeholders and restores the original iframe `src` only after user activation.
- Kept the existing video section navigation script and visible video titles unchanged.
- Added browser coverage proving all 22 lazy video URLs remain present, no YouTube embed request happens before activation, and the selected iframe loads after click.
- Updated visual parity normalization so intentional lazy-video placeholders do not affect legacy main-content comparison.

### 2026-05-12: SEO And Accessibility Cleanup

- Added explicit Next.js metadata overrides for inherited source gaps: homepage `og:url`, `acknowledgements.html` canonical, and `findings/glossary.html` canonical.
- Updated deployment preflight so those intentional `.html` URL metadata decisions are checked as expected output rather than reported as warnings.
- Added a browser accessibility smoke sweep for representative enhanced findings, audio, and video routes.
- The sweep checks skip-link/main-target presence, a single page `<h1>`, image `alt` attributes, button accessible names, iframe titles, and polite live regions.
- Centralized intentional metadata overrides in `src/site/metadata-overrides.json` so page metadata and deployment preflight share the same explicit SEO fixture.

## Verification Commands

Run from `nextjs-site/` after each significant change:

```bash
npm run build
npm run typecheck
npm run parity
npm run parity:content
npm run parity:text
npm run parity:links
npm run parity:sitemap
npm run preflight:deploy
npm run test:e2e
```

Run `npm run parity:visual` for layout-affecting changes and before commits that alter enhanced page presentation.

Run `npm run build:audio` and `npm run preflight:deploy:audio` only when preparing or testing an audio-inclusive artifact.
