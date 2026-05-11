# HiMMP Next.js Migration Audit

Date: 2026-05-11

Purpose: migrate the current HiMMP website to a Next.js / TypeScript stack without losing content, behavior, metadata, or public URLs. The current static/PHP site remains the source of truth until parity checks pass.

## Scope

The repo is not just the main brochure site. The migration scope includes:

- 12 root HTML pages: `index.html`, `about.html`, `approach.html`, `team.html`, `publications.html`, `findings.html`, `videos.html`, `audio.html`, `faq.html`, `contact.html`, `privacy.html`, `acknowledgements.html`.
- 15 `findings/` pages: chapters 1-14 plus `glossary.html`.
- Static policy/indexing files: `robots.txt`, `sitemap.xml`, `llms.txt`, `favicon.png`.
- PHP contact workflow: `contact.html`, `get-csrf-token.php`, `contact-handler.php`, `config.php`, `contact_submissions/`.
- Existing generated/mirrored ebook tree: `himmp-ebook/`.

The `himmp-ebook/` tree appears to duplicate or package the findings guide with its own assets. It should not be silently merged into the main route tree until its intended public role is confirmed.

## Current Inventory

| Area | Count / size | Migration implication |
| --- | ---: | --- |
| Root + findings HTML pages | 27 pages | Treat as route parity baseline. |
| Root + findings HTML bytes | about 797 KB | Do not recreate from memory; extract content mechanically. |
| `assets/images` | 69 files, about 6.4 MB | Keep original paths or provide verified redirects. |
| `assets/audio` | 45 MP3 files, about 523 MB | Do not import into JS bundles; serve as static files. |
| `findings/Figures` | 25 files, about 43.5 MB | Preserve chapter figure paths and alt text. |
| `himmp-ebook` | 116 files, about 466 MB | Decide whether it remains static, is migrated, or is archived unchanged. |
| YouTube embeds | 24 iframes across root pages | Preserve titles, loading behavior, and embed URLs. |
| JSON-LD blocks | Present on most public pages | Extract and compare, not regenerate loosely. |

## Route Baseline

Root pages:

- `/index.html` - home page, project overview, video, Routledge volumes, dataset CTA.
- `/about.html` - project context and research rationale.
- `/approach.html` - methodology and controlled experiment.
- `/team.html` - research team, producers, musicians, advisors.
- `/publications.html` - large publication/resource page with filters, accordions, section navigation.
- `/findings.html` - practical guide hub.
- `/videos.html` - producer interviews, mixing sessions, reactions, section navigation.
- `/audio.html` - mix comparison and audio resources.
- `/faq.html` - FAQ and licensing/dataset answers.
- `/contact.html` - contact form using PHP CSRF endpoint and handler.
- `/privacy.html` - long privacy policy.
- `/acknowledgements.html` - guide acknowledgements.

Findings pages:

- `/findings/01-introduction.html`
- `/findings/02-producers.html`
- `/findings/03-methodology.html`
- `/findings/04-foundations.html`
- `/findings/05-naturalistic.html`
- `/findings/06-hyperreal.html`
- `/findings/07-meta-instrument.html`
- `/findings/08-drums.html`
- `/findings/09-guitars-bass.html`
- `/findings/10-spatial.html`
- `/findings/11-subjective.html`
- `/findings/12-application.html`
- `/findings/13-future.html`
- `/findings/14-recommended-reading.html`
- `/findings/glossary.html`

Important mismatch: `sitemap.xml` currently lists findings chapters 1-13 and `glossary.html`, but does not list `/findings/14-recommended-reading.html`.

## Behavior To Preserve

- Mobile navigation toggle with `aria-expanded`, outside-click close, and active nav state.
- Smooth scrolling for in-page anchors with sticky-header offset.
- Sticky header scroll styling.
- Publication filters on `publications.html`.
- Accordions on `publications.html`.
- Section navigation and active-section highlighting on `publications.html` and `videos.html`.
- Contact form client validation, CSRF token fetch, AJAX submission, loading state, success/error messages.
- Audio comparison:
  - `audio.html` uses `.mix-btn` buttons and a local inline script.
  - Findings chapters use `.mix-button` inside `.mix-comparison-player`, driven by `assets/js/audio-player.js`.
  - Switching mixes preserves current playback time and resumes if the prior mix was playing.
  - Chapter players include final mixes and isolated stem groups for drums, guitars, bass, and vocals.

## SEO / Metadata To Preserve

- Page titles and descriptions for every public page.
- Canonical URLs, especially existing `.html` URLs.
- Open Graph and Twitter metadata.
- `llms.txt` alternate link where present.
- `robots.txt` bot policy and sitemap pointer.
- `sitemap.xml` URL set, corrected only with explicit migration notes.
- JSON-LD blocks, including `ResearchProject`, `Organization`, `WebSite`, `Person`, `FAQPage`, `VideoObject`, publication metadata, and chapter metadata.
- Geo metadata and contact metadata.
- Matomo analytics snippet and site ID if still required.

## Known Current-Site Issues To Decide Before Migration

These should be treated as explicit migration decisions, not accidental changes:

- Case-sensitive asset references are broken in the working tree for `assets/images/logos/HiMMP-logo-small.png` and `assets/images/logos/AHRC-logo.png`; existing files use `HiMMP-Logo-small.png` and `AHRC-Logo.png`.
- `privacy.html` links to `updates.html`, but no `updates.html` exists.
- `himmp-ebook/index.html` links to `./audio.html`, and ebook chapter pages link to `../audio.html`, `../videos.html`, and `../publications.html`; those files do not exist inside `himmp-ebook/`.
- `sitemap.xml` omits `/findings/14-recommended-reading.html`.
- `findings/14-recommended-reading.html` has a second `og:description` meta tag where the surrounding pattern suggests `twitter:description`; do not silently correct without a metadata decision.
- `team.html` opens `<main id="main-content">` but does not close it before the footer. The Next extractor currently falls back to using the content from `<main>` up to the first `<footer>`.
- `audio.html` closes `</main>` before the Dave Otero and Andrew Scheps sections. The Next extractor currently folds non-empty pre-footer content back into the generated main region so the two audio players are not dropped.
- Several pages rely on inline scripts. During migration, these should become typed client components or small shared hooks, but behavior must be regression-tested first.

## Recommended Architecture

- Use Next.js App Router with TypeScript.
- Use `output: "export"` if the deployed site must remain static. The official Next.js static export documentation states that static export emits HTML/CSS/JS that can be hosted by any static web server, but does not support API routes, redirects, rewrites, headers, middleware/proxy, cookies, ISR, or default `next/image` optimization.
- Preserve `.html` URLs during the first migration. Academic citations, sitemap entries, canonical URLs, and external links already point to `.html` paths. This must be proved in the generated `out/` directory before switchover, not assumed from local development routing.
- Keep PHP contact handling unchanged unless the deployment target is moved to a Node-capable host. Static export cannot replace the current PHP contact workflow with Next.js API routes.
- Store large MP3 files and static images under `public/assets/...` and reference them by URL. Do not import audio into React modules.
- Confirm the target host can accept about 523 MB of audio assets plus generated static output. If not, move audio to object storage or the existing Box/archive URLs and update audio source data intentionally.
- Prefer data-driven typed content only after extraction. Prose and references should initially be copy-only.

## Migration Phases

1. Freeze source inventory.
   - Generate route, asset, metadata, and link inventories from the existing HTML.
   - Fix or explicitly carry known broken references.

2. Scaffold Next.js in a separate branch or subdirectory.
   - No visual redesign in this phase.
   - Copy assets into `public/` preserving public paths.
   - Configure static export if PHP remains outside Next.

3. Build shared layout and page shell.
   - Header, footer, skip link, navigation, Matomo, metadata helpers.
   - Preserve `.html` route behavior.

4. Port content page by page.
   - Start with low-interactivity pages: `about`, `approach`, `faq`, `acknowledgements`.
   - Then migrate `team`, `videos`, `publications`.
   - Migrate `audio` and findings chapters only after the audio component has tests/manual checks.

5. Port interactive behavior.
   - Client components for navigation, section nav, filters, accordions, contact form, and audio comparison.
   - Keep audio switching behavior identical before improving UI.

6. Verification gate.
   - Static build succeeds.
   - Route list matches baseline, including direct access to `.html` URLs.
   - Internal link checker reports no missing local refs.
   - Page titles/descriptions/canonicals match or have documented changes.
   - JSON-LD blocks parse as JSON.
   - Audio player preserves playback position across mix switches.
   - Contact form decision is tested against the chosen hosting model.
   - Desktop and mobile screenshots are compared against the current site.

## Suggested Verification Commands

These are placeholders until the Next.js project exists:

```bash
npm run sync:public
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
```

Deployment-decision details are recorded in `docs/nextjs-migration-deployment-decisions.md`. The local migration defaults are static export, direct `.html` route preservation, audio excluded from default build sync until host limits are confirmed, and legacy PHP contact co-hosting unless a backend replacement is explicitly approved.

Current-site inventory commands used for this audit:

```bash
rg --files
python3 -B # HTML route/asset/link extraction scripts run from shell
```

## External Documentation Checked

- Next.js static export guide, accessed 2026-05-11: https://nextjs.org/docs/pages/guides/static-exports

## Reviewer Notes

- Codex initial assessment: feasible, but only as an inventory-led migration. The riskiest parts are route preservation, audio-player parity, JSON-LD preservation, and the PHP contact workflow.
- Scaffold checkpoint on 2026-05-11:
  - Created isolated Next.js / TypeScript app in `nextjs-site/`.
  - Confirmed `next build` static export emits all 27 legacy source HTML paths, including nested `findings/*.html`.
  - Current generated page bodies are mechanically extracted from the legacy HTML `<main>` regions rather than rewritten from memory.
  - Added current-site inventory, static route parity, content parity, full visible-text parity, local-reference parity, and representative visual parity scripts.
  - Added Playwright smoke tests against exported files using system Chrome; all 27 legacy routes plus mobile navigation passed.
  - Synced CSS, JavaScript, images, figures, favicon, `robots.txt`, `sitemap.xml`, and `llms.txt` into `nextjs-site/public/` for local/export tests. Audio is intentionally excluded until host limits are confirmed.
  - `npm audit` reports two moderate advisories through `next@16.2.6 -> postcss@8.4.31`. The suggested fix is a downgrade to Next 9.3.3, so no automatic fix was applied.
- Visual parity checkpoint on 2026-05-11:
  - Added `npm run parity:visual`, which compares representative legacy and Next-export main-content screenshots on desktop and mobile.
  - The first visual run exposed two fidelity bugs: `/assets/js/main.js` was running before migrated page content existed, and legacy page-specific `<style>` blocks from the HTML head were not being extracted.
  - Fixed script order to match the source site's footer-adjacent script loading model: shared `main.js` loads after the site footer and before page-specific body scripts.
  - Added extraction/rendering of legacy head `<style>` blocks and made content parity count style blocks, preventing hidden layout loss on pages such as `publications.html`.
  - Visual parity now passes for 16 representative main-content captures. Header/logo comparison remains a separate decision because the source site contains documented case-sensitive logo-reference defects.
- Claude critical review completed on 2026-05-11. Substantive points to carry forward:
  - Route preservation is the first blocker: sitemap, canonicals, Open Graph URLs, and internal links are all `.html`-oriented. A Next.js build must either emit/serve those paths directly or ship host-level rewrites/redirects with matching sitemap/canonical updates.
  - The contact form is PHP-session and filesystem dependent: CSRF uses `$_SESSION`, rate limiting and submissions use files under `contact_submissions/`, and email uses `mail()`. This is compatible with co-hosted PHP, but not with a pure static export or a serverless Node host without reimplementation.
  - The audio payload is large enough that host limits must be checked before copying it into a new deployment artifact.
  - `publications.html` is a high-risk content page because it combines about 128 KB of markup, multiple JSON-LD blocks, filters, section navigation, and accordion logic.
  - Findings chapter relative links need mechanical rewriting or route-preserving output. This is especially important for `../*.html`, `./*.html`, and in-chapter anchors/endnotes.
  - The audio comparison player should keep a stable `<audio>` element via a ref-style implementation. A naive React re-render on source change can reset playback position.
  - `robots.txt`, `sitemap.xml`, and `llms.txt` should be generated or copied as deliberate migration artifacts; stale URL formats would create SEO and crawler-policy drift.
