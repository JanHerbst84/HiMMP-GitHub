# HiMMP Next.js Migration Review Log

Date: 2026-05-11

## Checkpoint 1: Inventory And Scaffold

Scope reviewed:

- `docs/nextjs-migration-audit.md`
- `nextjs-site/` scaffold
- static export route generation
- current-site inventory and parity scripts
- Playwright smoke test setup

Codex verification:

- `npm view next version` returned `16.2.6`.
- `npm view react version` returned `19.2.6`.
- `npm run inventory` wrote `.migration/current-site-inventory.json` with 27 pages.
- `npm run typecheck` passed.
- `npm run build` passed and generated static pages for all baseline routes.
- `npm run parity` passed for 27 legacy HTML files.
- `npm run test:e2e` passed 16 browser smoke tests against `out/`.

Current deliberate non-parity:

- Page bodies are placeholders; content migration has not started.
- Metadata is not yet page-faithful beyond basic titles for placeholder routes.
- Audio files are not synced into `public/`.
- Contact form is not ported; PHP workflow remains an unresolved hosting decision.

Dependency note:

- `npm audit --json` reports moderate advisories through `next@16.2.6 -> postcss@8.4.31`.
- The suggested automatic fix downgrades Next to `9.3.3`, so it was not applied.

Claude review:

- Scaffold review requested via `env -u ANTHROPIC_API_KEY claude -p ...`.
- Claude found that route parity only checked file existence, asset sync was manual, audio gaps could remain silent, the inventory script used `globSync`, metadata was incomplete, `npm start` was wrong for static export, and nav reachability was under-tested.

Resolution:

- Added `npm run parity:content` for title, description, H1, JSON-LD, iframe, and audio-count checks.
- Added `npm run parity:links` to fail missing local references except explicitly allowed pending audio/PHP endpoints.
- Added `prebuild` so `npm run build` syncs public assets automatically.
- Changed `npm start` to serve the exported `out/` directory.
- Replaced `globSync` usage with `readdirSync`.
- Added page-level description, canonical, Open Graph, Twitter metadata, and JSON-LD extraction.
- Left audio and contact PHP as explicit pending deployment decisions rather than hiding them.

Additional Codex findings during implementation:

- `team.html` opens `<main id="main-content">` but does not close it before the site footer.
- `audio.html` closes `</main>` before the Dave Otero and Andrew Scheps sections.
- Some findings chapters contain semantic `<footer>` elements inside quoted material; extraction must target `<footer class="site-footer">`, not the first `<footer>`.

Latest verification:

- `npm run inventory` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `npm run parity` passed for 27 legacy HTML files.
- `npm run parity:content` passed for 27 generated HTML files.
- `npm run parity:text` passed for 27 generated HTML files.
- `npm run parity:links` passed with 89 explicitly allowed pending audio/PHP references.
- `npm run test:e2e` passed 16 browser tests.

## Checkpoint 2: Mechanical Content Extraction

Scope reviewed:

- legacy `<main>` extraction for all 27 baseline HTML pages
- page-level metadata extraction
- JSON-LD preservation
- page-specific script rendering
- route, content, link, and browser parity gates

Codex verification:

- `npm run inventory` passed and tracked 27 pages.
- `npm run typecheck` passed.
- `npm run build` passed with no Turbopack warnings.
- `npm run parity` passed for 27 legacy HTML files.
- `npm run parity:content` passed for 27 generated HTML files.
- `npm run parity:text` passed for 27 generated HTML files.
- `npm run parity:links` passed with 89 explicitly allowed pending audio/PHP references.
- `npm run test:e2e` passed 28 browser tests: all 27 generated legacy routes plus mobile navigation.

Claude review:

- Second critical review requested via `env -u ANTHROPIC_API_KEY claude -p ...`.
- Claude found that inline scripts rendered through `dangerouslySetInnerHTML` would not execute, analytics had been silently stripped, entity handling was asymmetric, the fallback extractor could be fragile around literal `</main>` text, Playwright only covered part of the route set, and filesystem root discovery caused a Turbopack tracing warning.

Resolution:

- Added `LegacyScripts` so extracted page scripts render as actual `<script>` tags.
- Restored the Matomo snippet once in the shared layout while continuing to suppress duplicate page copies.
- Decoded metadata entities before passing values into Next metadata, preventing double escaping such as `&amp;amp;`.
- Expanded Playwright coverage to every route in `legacyRoutes`.
- Scoped the legacy source root with Turbopack's ignore comment; the build is now warning-free.
- Kept the `team.html` and `audio.html` malformed-main repairs documented in the audit rather than silently changing source files.

Remaining explicit non-parity:

- Audio assets are not copied by default because the source audio payload is about 523 MB. Use `npm run sync:public:audio` only after confirming hosting limits.
- `get-csrf-token.php` and `contact-handler.php` remain outside the static export. The contact form needs co-hosted PHP or a deliberate Next/Node reimplementation before switchover.
- The existing `sitemap.xml` still omits `findings/14-recommended-reading.html`; this is documented as a source-site issue.

## Checkpoint 3: Visual Parity Gate

Scope reviewed:

- representative desktop/mobile visual comparison against the legacy static site
- shared `main.js` load order
- page-specific legacy `<style>` preservation
- visual audit artifacts under `.migration/visual-parity/`

Codex findings:

- `npm run parity:visual` initially exposed that `main.js` was executing before migrated page content existed. This could prevent legacy DOM initializers from wiring filters, accordions, section navigation, and related behavior consistently.
- The same visual run exposed that head-level inline `<style>` blocks were missing from the migration. `publications.html` therefore rendered its accordion panels expanded in the Next export even though all text was present.
- Exact pixel diff was too brittle for this comparison because of antialiasing and one-pixel export-height differences, so the visual check now uses normalized RMSE and still writes legacy/Next/diff artifacts for manual inspection.

Resolution:

- Moved `/assets/js/main.js` out of the root layout and into each generated page after `SiteShell`, before page-specific body scripts, matching the source site's bottom-of-body script order.
- Added `LegacyStyles` and `extractHeadStyles()` so page-specific legacy `<style>` blocks are rendered into the generated pages.
- Updated inventory/content parity to count style blocks.
- Updated visual parity to abort audio requests, avoid `networkidle` on embedded-media pages, hide the fixed header during main-content captures, and compare normalized RMSE.

Latest verification:

- `npm run inventory` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `npm run parity:content` passed for 27 generated HTML files.
- `npm run parity:text` passed for 27 generated HTML files.
- `npm run parity:links` passed with 89 explicitly allowed pending audio/PHP references.
- `npm run parity:visual` passed for 16 representative main-content captures.
- `npm run test:e2e` passed 28 browser tests.

Claude review:

- A bounded follow-up Claude review was attempted with a 120-second timeout after the visual fixes. It produced no output before timeout, so there were no additional findings to integrate.

## Checkpoint 4: Behavioral Coverage And Autonomous Plan

Scope reviewed:

- Playwright behavioral coverage for migrated legacy interactions.
- Autonomous completion plan for the remaining local migration work.
- Full local verification suite after test hardening.

Codex verification:

- `npm run typecheck` passed.
- `npm run build` passed as part of `npm run test:e2e`.
- `npm run parity` passed for 27 legacy HTML files.
- `npm run parity:content` passed for 27 generated HTML files.
- `npm run parity:text` passed for 27 generated HTML files.
- `npm run parity:links` passed with 89 explicitly allowed pending audio/PHP references.
- `npm run parity:visual` passed for 16 representative main-content captures.
- `npm run test:e2e` passed 31 browser tests.

Resolution:

- Added behavioral tests for `publications.html` section navigation and accordions.
- Added behavioral tests for `audio.html` mix switching, current-player label updates, active button state, source changes, and playback-time preservation.
- Added behavioral tests for the legacy contact-form contract, including client-side email validation, CSRF token inclusion, and success message handling.
- Replaced global `networkidle` waits with a short local-response settle window so embedded media pages such as `videos.html` do not make route smoke tests depend on third-party network quiescence.
- Added `docs/nextjs-migration-autonomous-plan.md` with local completion boundaries, commit cadence, Claude review points, and deployment-only stopping conditions.

Claude review:

- A bounded Claude review was attempted for this checkpoint. It produced no output after more than 120 seconds and was stopped.
- `CANNOT VERIFY`: no Claude findings were available for this checkpoint. Codex proceeded because the full local verification suite passed.

## Checkpoint 5: Deployment Decision Boundaries

Scope reviewed:

- Static export boundary.
- `.html` URL preservation.
- Audio asset handling.
- Legacy PHP contact workflow.
- Source-defect policy.

Resolution:

- Added `docs/nextjs-migration-deployment-decisions.md`.
- Recorded the local migration default as static export with direct `.html` routes.
- Recorded audio as excluded from default build sync, with `npm run sync:public:audio` reserved for deployment preparation after host limits are confirmed.
- Recorded contact as a preserved PHP contract, not a Next.js API-route replacement.
- Recorded which source defects are safe to correct in generated output and which must remain documented unless explicitly approved.

Claude review:

- Claude warned that preserving `.html` URLs requires deployment-host checks because static hosts can normalize to clean extensionless URLs. The deployment decisions now require representative `.html` URL header checks and state that host-level clean-URL normalization is out of scope for the fidelity phase.
- Claude warned that PHP co-hosting must account for writable `contact_submissions/`, session support, mail configuration, and non-public handling of `config.php`. The deployment decisions now list those concrete constraints.
- Claude warned that logo case correction was ambiguous. The deployment decisions now specify rewriting references to existing on-disk filenames, not renaming assets.
- Claude noted that copying audio before `npm run build` relies on the current non-pruning public sync behavior. Added `npm run build:audio`, which syncs all public assets including audio immediately before `next build`.

Codex verification:

- `npm run build` passed.
- `npm run typecheck` passed after build. A concurrent `typecheck`/`build` run hit a transient `.next/types` race, so these commands should not be run in parallel against the same workspace.
- `npm run parity` passed for 27 legacy HTML files.
- `npm run parity:links` passed with 89 explicitly allowed pending audio/PHP references.
- `npm run build:audio` was not run at this checkpoint because it intentionally copies the about-523 MB MP3 payload into the export artifact.

## Checkpoint 6: Generated Sitemap Coverage

Scope reviewed:

- Generated `public/sitemap.xml` and exported `out/sitemap.xml`.
- Route coverage for all `legacyRoutes` source files.

Resolution:

- Updated `sync-public-assets.mjs` so the generated public sitemap is patched after copying the legacy source sitemap.
- Added the missing `findings/14-recommended-reading.html` URL to the generated sitemap without editing the source `sitemap.xml`.
- Added `npm run parity:sitemap` to fail if the exported sitemap omits any generated legacy route.

Claude review:

- Claude warned that the appended sitemap `lastmod` value was hardcoded. The sync script now derives appended lastmod values from `git log` for the source HTML file, falling back to the latest existing sitemap lastmod.
- Claude warned that the site origin was duplicated across scripts. Added `scripts/site-config.mjs` and imported the shared `siteOrigin`.
- Claude warned that sitemap parity was one-directional. `npm run parity:sitemap` now also fails same-origin `.html` sitemap entries that do not correspond to a generated legacy route.

Codex verification:

- `npm run build` passed and added the missing generated sitemap URL.
- `npm run typecheck` passed.
- `npm run parity:sitemap` passed for 27 generated legacy routes.
- `npm run parity:content` passed for 27 generated HTML files.
- `npm run parity:links` passed with 89 explicitly allowed pending audio/PHP references.

## Checkpoint 7: Remaining Legacy Interaction Coverage

Scope reviewed:

- Shared `.mix-comparison-player` behavior on findings pages.
- `videos.html` section navigation.
- Contact-form failure states.

Resolution:

- Added Playwright coverage for a findings-page mix comparison player, including active button changes, label updates, source switching, and playback-position restoration after the mocked media element reloads.
- Added Playwright coverage for `videos.html` section navigation, including active button updates and the actual scroll target behavior.
- Added Playwright coverage for the unavailable-CSRF state and handler-error state of the preserved legacy contact-form contract.
- Expanded the handler-error assertion so valid `name`, `email`, `subject`, and `message` inputs must all remain intact after a failed submission.

Claude review:

- Claude warned that the original playback-position assertion was tautological because the mocked media reload never reset `currentTime`. The audio stub now resets `currentTime` before firing `loadedmetadata`, so the test exercises the legacy restoration behavior.
- Claude warned that the initial video navigation test only checked active classes. The test now captures `window.scrollTo` calls and verifies the selected section receives a positive scroll target.
- Claude warned that the CSRF-unavailable test did not guard unexpected network failures after page load. The test now uses the shared unexpected-response tracker and local-response settle helper.
- Claude warned that the handler-error test only proved `name` was retained. It now verifies all user-entered fields.

Codex verification:

- `npm run typecheck` passed.
- `npm run test:e2e` passed 35 Playwright tests.
- `npm run parity` passed for 27 legacy HTML files.
- `npm run parity:content` passed for 27 generated HTML files.
- `npm run parity:text` passed for 27 generated HTML files.
- `npm run parity:links` passed with 89 explicitly allowed pending audio/PHP references.
- `npm run parity:sitemap` passed for 27 generated legacy routes.

## Checkpoint 8: Deployment Preparation Gates

Scope reviewed:

- Deployment-preflight script.
- PostCSS audit mitigation.
- Deployment-preparation handoff documentation.

Resolution:

- Added `npm run preflight:deploy` to check the generated static artifact for route metadata preservation, Matomo markers, contact endpoint references, PHP source-file availability, local static files, and extensionless duplicate HTML files.
- Added `npm run preflight:deploy:audio` for an audio-inclusive artifact after `npm run build:audio`.
- Added an npm `overrides` pin for `postcss` to the fixed 8.5 line while keeping `next@16.2.6`, because the automatic audit fix would downgrade Next.
- Added `docs/nextjs-migration-deployment-prep.md` with default, audio-inclusive, PHP co-hosting, and target-host URL checks.

Claude review:

- Claude warned that the initial preflight route regex only matched double-quoted `sourceFile` entries and could silently skip all per-route checks if `routes.ts` were reformatted. The regex now accepts single and double quotes, and the script fails if fewer than 27 legacy routes are found.
- Claude warned that the duplicate extensionless HTML guarantee was narrower than the documentation implied. The script now performs a global `out/**/index.html` sweep for sibling `.html` duplicates, while still checking known legacy routes.
- Claude noted that generated `og:url` metadata on a page without source `og:url` would not be surfaced. The script now warns in that case.
- Claude follow-up review returned `No findings.`

Codex verification:

- `npm run build` passed.
- `npm run typecheck` passed.
- `npm run parity` passed for 27 legacy HTML files.
- `npm run parity:content` passed for 27 generated HTML files.
- `npm run parity:text` passed for 27 generated HTML files.
- `npm run parity:links` passed with 89 explicitly allowed pending audio/PHP references.
- `npm run parity:sitemap` passed for 27 generated legacy routes.
- `npm run preflight:deploy` passed with three inherited source-metadata warnings.
- `npm audit --omit=dev` passed with no vulnerabilities.
- `npm run parity:visual` passed for 16 representative main-content captures.
- `npm run test:e2e` passed 35 Playwright tests.

## Checkpoint 9: Phase 2 Findings Guide Slice

Scope reviewed:

- Enhanced findings-guide rendering path.
- Findings hub and `findings/07-meta-instrument.html`.
- Preservation behavior for mechanically extracted legacy content.

Resolution:

- Added a route-level `renderMode` flag so individual pages can opt into enhanced rendering without changing the legacy extraction path for other pages.
- Added `EnhancedFindingsShell`, a reader/navigation shell around the unchanged legacy `<main>` content.
- Enabled the enhanced shell for `findings.html` and `findings/07-meta-instrument.html`.
- Added desktop/mobile-responsive reader navigation and previous/next chapter links.
- Added Playwright coverage proving the enhanced shell appears while the original main content remains present.
- Added desktop/mobile layout regression coverage for enhanced findings pages so the intentionally enhanced pages still fail on horizontal overflow.
- Removed `findings.html` from the visual parity route list because that page is now intentionally visually different; unchanged findings chapters remain in the representative visual parity set.

Claude review:

- Claude warned that an `<h2>` in the reader panel appeared before the legacy page `<h1>`, which could create a heading-order anomaly for assistive technology. The panel title is now rendered as a styled paragraph inside the labelled aside.
- Claude warned that the sticky panel used a hardcoded header offset. The offset now uses `--site-header-height`.
- Claude follow-up warned that the header offset was still effectively hardcoded and that the overflow test contained a redundant poll. The offset now derives from the legacy header spacing/logo dimensions, a sticky-header clearance e2e test covers the behavior, and the redundant poll was removed.
- Claude warned that removing `findings.html` from visual parity weakened layout regression coverage for the enhanced hub. Added e2e layout checks for `findings.html` and `findings/07-meta-instrument.html` at desktop and mobile widths.
- Final Claude follow-up returned `No findings`, confirming the sticky offset, heading order, enhanced layout coverage, and unchanged legacy-content rendering path.

Codex verification:

- `npm run typecheck` passed.
- `npm run build` passed.
- `npm run parity:text` passed for 27 generated HTML files.
- `npm run parity:content` passed for 27 generated HTML files.
- `npm run test:e2e` passed 39 Playwright tests.
- `npm run parity` passed for 27 legacy HTML files.
- `npm run parity:links` passed with 89 explicitly allowed pending audio/PHP references.
- `npm run parity:sitemap` passed for 27 generated legacy routes.
- `npm run preflight:deploy` passed with three inherited source-metadata warnings.
- `npm run parity:visual` passed for 14 representative non-enhanced main-content captures.

Notes:

- The direct Playwright screenshot helper failed in this sandbox when launching Chrome outside the test runner, but the Playwright e2e suite and visual parity script both executed successfully with system Chrome.

## Checkpoint 10: Full Findings Guide Shell Expansion

Scope reviewed:

- Expansion of the enhanced findings-guide rendering mode from the hub/chapter 7 slice to the full findings guide.
- Representative visual parity coverage for enhanced findings pages.
- Full-guide e2e coverage for active chapter navigation and chapter paging boundaries.

Resolution:

- Added an `enhancedFindingsRoute` helper and enabled `renderMode: "enhanced-findings"` for every findings chapter and the glossary.
- Kept the unchanged legacy `<main>` extraction path as the content payload inside the enhanced shell.
- Added Playwright coverage that visits every findings route and verifies the enhanced shell, retained `#main-content`, and active navigation href.
- Added first/middle/final paging assertions for chapter 1, chapter 7, and the glossary.
- Updated visual parity so enhanced findings pages can be captured by hiding the reader chrome and comparing the unchanged `#main-content`.
- Kept the visual parity route list to stable representative findings pages after a full all-findings pixel sweep proved too noisy for image-heavy chapters, while all findings pages remain covered by text/content parity and e2e structural checks.

Claude review:

- Claude warned that removing findings routes from visual parity left the guide without pixel coverage. Visual parity now includes enhanced-shell-aware representative findings captures.
- Claude noted that a test helper duplicated the shell's title-shortening logic. The full-guide test now checks the active link href instead, and hard-coded text expectations remain in the paging boundary test.
- Final Claude follow-up returned `No findings`, accepting the documented tradeoff between representative visual captures and full text/content/e2e structural coverage.

Codex verification:

- `npm run typecheck` passed.
- `npm run build` passed.
- `npm run test:e2e` passed 41 Playwright tests.
- `npm run parity:text` passed for 27 generated HTML files.
- `npm run parity:content` passed for 27 generated HTML files.
- `npm run parity` passed for 27 legacy HTML files.
- `npm run parity:links` passed with 89 explicitly allowed pending audio/PHP references.
- `npm run parity:sitemap` passed for 27 generated legacy routes.
- `npm run preflight:deploy` passed with three inherited source-metadata warnings.
- `npm run parity:visual` passed for 24 enhanced-shell-aware main-content captures.

## Checkpoint 11: Findings Reader Polish

Scope reviewed:

- Enhanced findings reader navigation and readability polish.
- Hidden duplicate legacy chapter-section navigation and legacy bottom chapter paging inside the enhanced shell.
- Visual parity hardening for enhanced pages, lazy images, and dynamic media surfaces.
- Regression coverage for guide-home portraits and representative image-heavy findings content.

Resolution:

- Added page-position status to the reader panel and bottom previous/next paging so long chapters have navigation at both entry and exit points.
- Kept the legacy `.chapter-section-nav` and `.chapter-nav` in the extracted main content but hid them only in the enhanced shell, avoiding duplicate visible navigation without deleting preserved source content.
- Adjusted enhanced reader CSS for a narrower reading measure, more deliberate heading spacing, polished non-portrait figures, horizontally safe tables, and clearer endnotes.
- Scoped figure polish to `.figure:not(.portrait)` after visual parity exposed that the guide-home author portraits were being enlarged unintentionally.
- Hardened the visual parity harness by neutralising enhanced shell styling, disabling animation, eager-loading images, waiting for fonts and images, and hiding browser-controlled audio/video/iframe surfaces during main-content captures.
- Kept the default visual parity threshold at `0.20` and limited elevated thresholds to two inspected noisy mobile captures: `/findings/01-introduction.html` at `0.21` and `/findings/09-guitars-bass.html` at `0.24`.
- Expanded visual parity to 24 desktop/mobile captures across representative root, media, findings, and glossary routes.
- Added Playwright regressions for bottom paging, hidden legacy chapter navigation, reader/figure width limits, guide-home portrait sizing, and the Figure 9.3 image load path.

Claude review:

- Claude warned that the legacy `.chapter-nav` bottom pager was still visible, creating duplicate bottom navigation. The enhanced shell now hides both `.chapter-section-nav` and `.chapter-nav` while preserving them in the DOM.
- Claude warned that `h2:first-child` missed the first section heading after runtime insertion of "On this page" navigation. The reset now targets `.chapter-content > h2:first-of-type`.
- Claude warned that setting `display: block` on tables could strip table semantics for assistive technology. Table semantics are preserved, with horizontal overflow handled on the chapter content instead.
- Claude warned that the top and bottom paging landmarks had identical accessible names and that the direction label was duplicated. The landmarks are now named by position, the visual eyebrow is `aria-hidden`, and each paging link has a single explicit `aria-label`.
- Claude warned that a route-class-wide mobile findings visual threshold could mask future drift. The allowance is now scoped to the two inspected noisy captures only.
- Claude follow-up found one remaining visual duplication in the paging link text. The title now renders only the chapter label while the `aria-label` retains `Previous:` or `Next:`.
- Final Claude follow-up returned `No findings`.

Codex verification:

- `npm run build` passed.
- `npm run typecheck` passed.
- `npm run parity:text` passed for 27 generated HTML files.
- `npm run parity:content` passed for 27 generated HTML files.
- `npm run parity` passed for 27 legacy HTML files.
- `npm run parity:links` passed with 89 explicitly allowed pending audio/PHP references.
- `npm run parity:sitemap` passed for 27 generated legacy routes.
- `npm run preflight:deploy` passed with the expected audio-excluded artifact warning and three inherited source-metadata warnings.
- `npm run parity:visual` passed for 24 enhanced-shell-aware main-content captures.
- `npm run test:e2e` passed 43 Playwright tests.

## Checkpoint 12: Audio Controller Slice

Scope reviewed:

- `audio.html` enhanced audio render mode.
- Typed client audio controller bound to preserved legacy markup.
- Route-level suppression of the legacy root audio script and inline comparison-player script.
- Browser regression coverage for switching, accessibility state, playback-position preservation, and unavailable-audio feedback.

Resolution:

- Added `EnhancedAudioController`, which hydrates the existing `#comparison-player` and `.mix-btn` markup instead of replacing page content.
- Added `enhanced-audio` as a route render mode and enabled it only for `audio.html`.
- Filtered `assets/js/audio-player.js` and the inline `comparison-player`/`mix-btn` script only on the enhanced audio route, leaving findings chapter audio behavior unchanged for this slice.
- Added `aria-pressed` state to producer buttons, an `aria-live` status region, loading/ready/error status messages, and current-time preservation when switching mixes.
- Kept existing MP3 source paths as DOM attributes and did not import audio assets into the JavaScript bundle.
- Updated visual parity normalization so the dynamic enhanced audio status does not affect main-content comparison.

Claude review:

- Claude reviewed the uncommitted audio slice and returned `No findings`.

Codex verification:

- `npm run typecheck` passed.
- `npm run test:e2e` passed 44 Playwright tests.
- `npm run parity:text` passed for 27 generated HTML files.
- `npm run parity:content` passed for 27 generated HTML files.
- `npm run parity` passed for 27 legacy HTML files.
- `npm run parity:links` passed with 89 explicitly allowed pending audio/PHP references.
- `npm run parity:sitemap` passed for 27 generated legacy routes.
- `npm run preflight:deploy` passed with the expected audio-excluded artifact warning and inherited source-metadata warnings.
- `npm run parity:visual` passed for 24 enhanced-shell-aware main-content captures.
