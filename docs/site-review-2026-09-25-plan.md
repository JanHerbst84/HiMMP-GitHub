# himmp.net review and remediation plan (2026-09-25)

Status: **plan v2 (Sol review integrated, all 9 findings accepted; see §6).** Branch `site-review-2026-09` from `main` at `f484e59`.

Requested by JPH on 2026-09-25: review the main HiMMP website for its visual presentation, technical and
performance criteria and discoverability; write the review up with the planned action; have Sol review it;
resolve disagreements; implement with regular Sol reviews; commit along the way; deploy when done.

## 1. Evidence base

- Live checks on 2026-09-25 against `https://himmp.net`: `curl` headers and redirects; headless Chromium
  (Playwright 1228 headless shell) at 1440x900 and 390x844 for screenshots, Core Web Vitals observers,
  CDP network byte counts. Google PageSpeed Insights was unavailable (daily quota exhausted), so the
  vitals below are unthrottled lab runs, not field data.
- Source audit of `nextjs-site/` and the export in `nextjs-site/out/` (built 2026-09-17 09:28 from `46d0a83`;
  it matches the source).
- Search visibility: one web search each for "heaviness in metal music production research project" and
  "HiMMP meta-instrument kick bass guitars practical guide".

## 2. Findings

Severity: H = high, M = medium, L = low. "Known" = already recorded in `docs/himmp-seo-audit.md`,
`docs/nextjs-phase-3-fresh-eyes-review-todos.md` or `docs/nextjs-phase-2-design-refresh-future.md`.

### 2.1 Technical and performance

Healthy: HTTP/2, gzip, http→https and www→apex 301s, HSTS/CSP/nosniff/Referrer-Policy/Permissions-Policy on
every location block, self-hosted `next/font` fonts with `display: swap`, async first-party Matomo, CLS ≤ 0.024,
FCP 0.5–0.7 s and LCP 0.7–1.4 s (lab). Audio players fetch only metadata until played (0.1 MB measured on
`/audio.html`).

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| T1 | H | Chapter figures are unoptimised originals: 32 referenced figures total 41.4 MB (all PNG/JPG, up to 6444 px wide); `Fig7.4_Widened_bass.png` is 5.87 MB. Chapter 7 transfers 12.7 MB on load. No `<img>` has `width`/`height`; 43 of 170 are not lazy. | live HEAD sizes; CDP byte count; `next.config.ts` `images.unoptimized` |
| T2 | M | Unknown URLs get Nginx's bare 404 page; the exported `/404.html` exists but is never used, and it carries two `<title>` elements. | `curl /nonexistent-xyz` → 146 B nginx page; nginx vhost has no `error_page` |
| T3 | M | YouTube iframes on home (`HomeMain.tsx:57`), audio (`AudioPage.tsx:94`, not lazy) and approach (`ApproachPage.tsx:83`) load ~1 MB of YouTube JS plus doubleclick ad endpoints before any interaction. The videos page already uses a click-to-load facade (`EnhancedVideoController`). | Playwright request log for `/` and `/audio.html` |
| T4 | M | Skip link does not move focus: `assets/js/main.js:57-60` `preventDefault()`s every `a[href^="#"]` and scrolls smoothly without focusing the target or honouring `prefers-reduced-motion`. | source |
| T5 | L | Hashed `/_next/static/` files get `expires 30d` + a second `Cache-Control: public` header rather than one `public, max-age=31536000, immutable`; `.svg/.ico/.gif/.avif` fall outside the static-cache regex. | live headers; vhost |
| T6 | L | Producer portraits on chapter pages are eagerly loaded and preloaded by React (`<link rel=preload as=image>` for Nordström/Odeholm/Otero on ch. 7). | live `<head>` |
| T7 | L | Heading-level skips (h1→h3) on 24 of 27 routes. | source audit |
| T8 | M | JS, CSS, XML and text responses are sent uncompressed: the global `nginx.conf` has `gzip on` but `gzip_types` commented out, so only `text/html` is gzipped (home JS chunks 638 KB raw). The v1 "gzip" claim covered HTML only. Found during slice A. | `curl -H 'Accept-Encoding: gzip'` on `/_next/static/chunks/*.js` → no `Content-Encoding`; VPS `nginx.conf:46-53` |

Not a site defect: a 21 s `load` event on `/` and `/audio.html` in this environment came from the local resolver
failing `static.doubleclick.net` (YouTube embed); it disappears with T3.

### 2.2 Discoverability

Healthy: one title, description, canonical, OG/Twitter set and `<h1>` per route; all JSON-LD parses; sane
`robots.txt`; generated 27-URL sitemap; `citation_*` tags on `findings.html`; chapter pages rank first for
specific queries.

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| D1 | H | Sitemap `lastmod` comes from `git log` of the archived legacy HTML (`sync-public-assets.mjs:166-168`); the archive commit `0d20f4c` stamped all 27 URLs `2026-09-17`, and React-page edits never move it. | live sitemap |
| D2 | M | JSON-LD is extracted from the frozen legacy files, so content added in React is invisible: videos added since the freeze (e.g. `fpvd9woR-oM`, `nxkTL94OXto`) have no `VideoObject`; 8 DOIs shown on `publications.html` are absent from its JSON-LD (incl. the 2026 Zenodo records and `10.1093/jaac/kpab065`). | source audit |
| D3 | M | Type errors: both Routledge volumes are `ScholarlyArticle` (should be `Book`); `ResearchProject` uses `startDate`/`endDate`/`performer`, which that type lacks; the AHRC grant sits on `funder.identifier` rather than a `Grant` via `funding`. | `publications.html:83,136`; `index.html:81,109` |
| D4 | M | Home canonical and `og:url` are `https://himmp.net/index.html`; `/` and `/index.html` both return 200; the search index lists `/index.html`. For the generic project query himmp.net ranked 9th, behind the University's own pages. | live head; web search |
| D5 | L | Home title 91 chars and description 189 chars (truncated in results). | live head |
| D6 | L | Guide name drift: `og:title`/`twitter:title` on `findings.html` say "A Producer's Guide" while the H1, `Book` and `citation_title` say "A Practical Guide". Chapter `TechArticle.isPartOf` points at the page URL rather than the guide's `Book` node. | source audit |
| D7 | L | `llms.txt` dated Nov 2025; claims every page has geo metadata (only home does); omits the guide DOI, dataset DOI and 2026 outputs. | `llms.txt:43,50,87` |

### 2.3 Visual presentation

Healthy: consistent dark theme with mint accent, Fraunces/Inter Tight pairing, clean mobile menu, no horizontal
overflow at 390 px, readable 15-card findings grid.

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| V1 | M | Chapter pages: the "On this page" list renders **above** the chapter hero/H1 with browser-default bullets (flush to the screen edge on mobile). On mobile the reader panel + paging + TOC fill ~80% of the first viewport before the title. | screenshots `ch7-desk`, `ch7-mob` |
| V2 | M | Chapter counter is off by one: chapter 7 shows "8 of 16" because "Guide home" is counted (`EnhancedFindingsShell.tsx:118`). | source + screenshot |
| V3 | M | Home "Project Archive & Key Outputs": 4 cards in a 3-column grid leave one orphan card; large vertical gaps between home sections on desktop. | `home-desk` screenshot |
| V4 | L | Page heroes are ~450 px tall with a barely visible background image, pushing content below the desktop fold; on `publications.html` the "Navigate to Section" heading is left-aligned while its pills are centred. | `pubs-desk` screenshot |
| V5 | L | CTA styles/labels are mixed ("+ ACCESS DATA" filled caps, "+ MORE" outline, "Explore the Guide →" sentence case); the nav is small lowercase underlined text and "welcome" means home. | screenshots |
| V6 | L | Home content: "Project Completed" still says outputs are forthcoming; the guide and publications are each promoted 2–3 times. | screenshot |

## 3. Planned action

Principles: live-site behaviour changes go into `nextjs-site/` (React, data, scripts) or `deploy/hostinger/`;
the archived legacy HTML stays frozen except where the build reads it and there is no React-side seam. Parity
gates stay green; where a deliberate change breaks a parity comparison, the gate's allow-list is updated in the
same commit with the reason. No new npm dependencies.

### Slice A — server, 404 and sitemap (T2, T5, T8, D1)

1. `app/not-found.tsx` with site shell, one `<title>`, `noindex`, links to home/findings/publications.
2. Nginx vhost: `error_page 404 /404.html;` plus `location = /404.html { internal; }`. Apply to the explicit
   `return 404` blocks too.
3. Nginx caching: `location ^~ /_next/static/` (keeping `try_files $uri =404`) → `Cache-Control "public,
   max-age=31536000, immutable"`; add `svg|ico|gif|avif` to the static regex; drop `expires 30d` so only one
   `Cache-Control "public, max-age=2592000"` header is sent.
   **Every location that contains any `add_header` (the 404, `_next/static` and static-asset blocks) repeats the
   complete security-header set**, because one `add_header` in a location suppresses all server-level ones. A
   deterministic check (script over the vhost) asserts this.
   Site-scoped `gzip_types` (JS, CSS, JSON, XML, SVG, text), `gzip_vary`, `gzip_comp_level 6` in the himmp.net
   server block (T8); the global `nginx.conf` is left alone because it serves other sites.
4. Sitemap `lastmod` = newest commit date across the files that actually produce the route (legacy HTML, the
   route's React page/chapter component, `app/<route>/page.tsx`, and the metadata/JSON-LD data files introduced in
   slice C), excluding a named list of non-content bulk commits (initially `0d20f4c`, the archive banner). Unit
   test the mapping.

### Slice B — head metadata and llms.txt (D4, D5, D6, D7)

1. Home canonical/`og:url` → `https://himmp.net/`; sitemap `<loc>` for home → `/`; internal "welcome"/logo links
   → `/`; Nginx `location = /index.html { return 301 /; }`. Verify `location = /`'s `try_files /index.html` is not
   caught by the new redirect (curl both). Update `parity:sitemap`/`parity:links` expectations if they encode
   `index.html`.
2. Home `<title>` ≤ 60 chars (e.g. "HiMMP – Heaviness in Metal Music Production", 43) and description ≤ 160 via
   `metadata-overrides.json`. `metadata.ts` gains `openGraphTitle`/`twitterTitle` (and description) overrides, and
   social titles fall back to the overridden title when no explicit social override exists.
3. Findings OG/Twitter title → "A Practical Guide" through the new social-title override.
4. Parity strategy (applies to B and C): `check-content-parity.mjs` and `check-sitemap-parity.mjs` derive the
   intended title/description/canonical/sitemap expectations from the governed overrides instead of the frozen
   inventory; the frozen inventory itself is not regenerated. The gate still fails on any *unintended* drift.
5. Rewrite `llms.txt` facts from the site's own content only (DOIs copied verbatim from `PublicationsPage.tsx` and
   `audio`/`findings` pages); remove the geo claim; update the date.

Chapter titles over 60 chars are left as they are (descriptive, low impact).

### Slice C — structured data (D2, D3, D6)

1. Add a React-side JSON-LD seam: `src/site/data/jsonld/*.ts` exporting per-`sourceFile` patch functions applied to
   the legacy-extracted blocks, mirroring how `metadata-overrides.json` patches head metadata. **Existing graphs are
   patched in place so each page's JSON-LD script count is unchanged** (the content-parity gate stores counts).
2. Fixes: Volumes I/II → `Book` (keep existing name/author/publisher/DOI/URL fields; add ISBN only if already in
   repo content); chapter `isPartOf` → the guide `Book` `@id`.
3. Project graph, designed explicitly: `ResearchProject` keeps no invalid properties. Lifecycle dates become
   `foundingDate`/`dissolutionDate` (valid on Organization, which ResearchProject inherits). PI and Co-I become
   `member` entries as `OrganizationRole` with `roleName` (replacing `founder`). The eight producers stay
   `contributor`. The six musicians move off the project onto a `MusicRecording` node for "In Solitude"
   (`byArtist`), since they performed on the recording rather than in the project. `funding` → `Grant`
   (`identifier` `AH/T010991/1`, `funder` AHRC).
4. Append the 8 missing DOI outputs on `publications.html`, copying title/authors/year/DOI from the page source.
   Add `VideoObject`s for videos without one, with `name`, `embedUrl`, `thumbnailUrl`, `contentUrl`
   (`https://www.youtube.com/watch?v=<id>`) and ISO `uploadDate` taken from the date the page source shows
   (e.g. `nxkTL94OXto` 1 March 2025, `fpvd9woR-oM` 29 August 2026); `uploadDate` is omitted only where the source has
   no date.
5. Test: every emitted block parses, has `@context`/`@type`, no duplicate `@id`, every `VideoObject` has the
   Google-required `name`/`thumbnailUrl`/`uploadDate` (or is listed as knowingly incomplete), no `ResearchProject`
   carries `startDate`/`endDate`/`performer`, both volumes are `Book`; rerun the SEO audit against the local export.

### Slice D — performance (T1, T3, T6)

1. Reusable script `nextjs-site/scripts/optimize-figures.mjs` (uses the system `magick` CLI; no npm dependency):
   writes WebP derivatives to `findings/Figures/web/` (committed, synced by `sync:public`) with explicit settings —
   max 1600 px wide, never upscaled, lossy q=82 for photographs (`.jpg`), lossless WebP for PNG diagrams if that
   is smaller than the q=90 lossy result, alpha preserved — and a JSON manifest recording source hash, output
   dimensions and encoder settings. Originals stay and remain reachable: each figure links to its full-resolution
   original.
2. Chapter components use `<picture><source type="image/webp" srcSet="Figures/web/….webp"><img src="<original>"
   width height loading="lazy" decoding="async"></picture>`, so the original is the fallback. The dark-mode paper
   background rules that currently select `img[src$=".png"]` (`globals.css:1640-1657`) are retargeted to a figure
   class (e.g. `.figure--diagram`) so transparent diagrams keep their backing. Text-heavy figures are inspected
   visually at native and mobile widths. The first above-the-fold image may stay eager. Chapter hero backgrounds use
   the WebP derivative where one exists.
3. Producer portraits and other below-fold images: `loading="lazy"` (removes the React preloads).
4. YouTube facade for the home, audio and approach embeds, reusing the videos-page `data-lazy-youtube-src`
   pattern and `EnhancedVideoController` (no CSP change: `img.youtube.com` and `www.youtube.com` are approved).
   `youtube-nocookie.com` is **not** adopted in this pass (needs a CSP change and the all-route CSP audit); record it
   as a follow-up.
5. Audio (45 MP3s, 320 kbps) is **excluded**: they are research stimuli; any re-encode needs JPH approval.

### Slice E — accessibility (T4, T7 partial)

1. Skip link (`.skip-to-content`, `SiteHeader.tsx:25`): every `<main id="main-content">` gets `tabIndex={-1}`.
   `assets/js/main.js` handles in-page anchors by focusing the target with `{ preventScroll: true }` (adding
   `tabindex="-1"` to non-focusable targets), then scrolling with `behavior: 'auto'` under
   `prefers-reduced-motion: reduce` and `'smooth'` otherwise, and updating the hash with `history.replaceState`
   (no duplicate history entries). A Playwright test asserts that activating the skip link moves
   `document.activeElement` to `#main-content`.
2. Heading skips: fix the structural ones in shared components (chapter sidebar, home card grid) where CSS is
   class-based; the remaining per-page skips are recorded, not fixed, in this pass.

### Slice F — visual (V1–V4)

1. Chapter shell: render two navigation presentations instead of one disclosure. Desktop (≥ 980 px): the existing
   sticky reader panel, with the "On this page" list nested under the current chapter and styled. Mobile (< 980 px):
   a separate compact `<details>` "Chapters and sections" (closed by default) holding the same links; the desktop
   panel is `display: none` on mobile and the mobile disclosure is `display: none` on desktop, so assistive
   technology only ever meets the visible one. Both keep `aria-current`, work without JavaScript and by keyboard;
   Playwright covers both sides of the 980 px breakpoint. The standalone TOC above the hero is removed.
2. Counter: "Chapter 7 of 14", "Glossary", "Guide home" instead of the route index.
3. Home outputs grid: 4 columns ≥ 1100 px, 2×2 below, 1 column on phones; tighten section spacing.
4. Page heroes: reduce desktop min-height (target ≈ 320 px); align the publications section nav heading with its pills.

### Held for JPH (content/brand, not implemented)

V5 CTA label wording and the "welcome" nav label; V6 "Project Completed" wording and the duplicate promotions;
audio re-encoding; `youtube-nocookie` adoption.

## 4. Verification and review

Per slice: `npm run typecheck`, `npm run build`, `parity:content`, `parity:text`, `parity:links`,
`parity:sitemap`, `npx playwright test`, `audit:contrast`; before/after screenshots and byte counts with the
review scripts.

Review gate per slice (the repository's blocking dual-review protocol, `project-context` §Dual-review): run in
parallel (1) the internal `feature-dev:code-reviewer` and (2) a Sol adversarial review of the full slice diff
(`codex exec -m gpt-5.6-sol`, medium effort, read-only sandbox). Take the union of real findings, fix before the
commit, and rerun both reviews after any substantive fix. Findings are dispositioned ACCEPT/REJECT/DEFER in §6 with
evidence. The all-route Chromium CSP audit runs at slice D acceptance (embed markup change) and again after
deployment.

Baseline before any change (unchanged tree, 2026-09-25): typecheck, build, all four parity gates, `audit:contrast`
and `test:hardening` pass; Playwright 128 passed, 4 failed, 49 not run. Failures: the videos smoke test expects 6
Bilibili cards but the page has had 7 since `46d0a83` (stale test, fixed in slice A); three `page.goto` timeouts
(`contrast-audit-oneoff` light `/approach.html`, two `theme-toggle` tests) to be re-run in isolation to separate
flakiness from defects.

## 5. Deployment

Per `docs/hostinger-deployment.md`: `npm run build:audio`, `npm run preflight:deploy`; rsync the export to
`/var/www/himmp-site/releases/<timestamp>-<sha>/out` with `--link-dest` against the current release; back up the
installed vhost to `himmp.net.pre-<sha>-<timestamp>`, install the new vhost, `nginx -t`, reload; switch `current`.
Live checks: 404 page, `/index.html` → `/` 301, cache headers, representative routes, audio MP3, `audit:seo:live`,
and the all-route Chromium CSP audit (embed markup changes). Rollback: previous release symlink plus the vhost
backup. Record the release in `docs/hostinger-deployment.md`.

## 6. Review and decision log

### 6.1 Sol plan review (v1 → v2), 2026-09-25

Reviewer: `gpt-5.6-sol`, medium effort, read-only. Verdict: approve with changes. Each finding was checked against
the source before disposition; all 9 were ACCEPTED, so there was no disagreement to escalate.

| # | Sev | Finding (short) | Evidence checked | Disposition |
|---|---|---|---|---|
| 1 | H | `founder`/`performer` semantics; musicians are not project members | `index.html:83-115` | ACCEPT → §C3 redesigned |
| 2 | M | Video dates exist in source; `uploadDate` omission reason wrong | `VideosPage.tsx:79,93` | ACCEPT → §C4 |
| 3 | H | Title/description, sitemap and added JSON-LD scripts break content/sitemap parity | `check-content-parity.mjs`, `check-sitemap-parity.mjs` | ACCEPT → §B4, §C1 (patch in place) |
| 4 | M | No social-title overrides in `metadata.ts`; proposed title 67 chars | `metadata.ts:7-14,74-95` | ACCEPT → §B2 |
| 5 | M | `_next/static` location drops security headers | vhost `add_header` inheritance | ACCEPT → §A3 + check |
| 6 | M | Class is `.skip-to-content`; `<main>` not focusable | `SiteHeader.tsx:25` | ACCEPT → §E1 |
| 7 | M | `.webp` src breaks `img[src$=".png"]` dark-mode backing; conversion rules unspecified | `globals.css:1640-1657` | ACCEPT → §D1-2 |
| 8 | M | One `<details>` cannot be closed on mobile and open on desktop | `EnhancedFindingsShell.tsx` | ACCEPT → §F1 |
| 9 | H | Repo requires dual review per slice | `project-context` §Dual-review | ACCEPT → §4 |

### 6.2 Slice A (server, 404, sitemap) review log

Reviewers per round: Sol (`gpt-5.6-sol`, medium, read-only) and the internal `feature-dev:code-reviewer`, in
parallel on the staged diff. Gates after the final round: typecheck, build, four parity gates, `audit:contrast`,
`test:hardening`, `test:sitemap`; Playwright 182/182 (after round 1; later rounds only changed the sitemap
library, rechecked by `parity:sitemap` and `test:sitemap`).

| Round | Reviewer | Sev | Finding | Disposition |
|---|---|---|---|---|
| 1 | Sol | M | lastmod dependency discovery missed metadata overrides, shared components, transitive data | ACCEPT: transitive import closure + keyed data files |
| 1 | Sol | M | shallow clone / git failure silently published fallback dates | ACCEPT: hard error |
| 1 | internal | H | empty source list → `git log --` scans the whole repo | ACCEPT: throws |
| 1 | both | – | Nginx `error_page`/internal 404/header inheritance, 404 page | no findings |
| 2 | Sol | M | `metadata.ts`/legacy emitters excluded as "chrome" though they produce SEO output | ACCEPT: only presentation chrome excluded |
| 2 | Sol | M | shared keyed files attribute every commit to every key | ACCEPT: per-entry history for keyed JSON; unit test with dated git fixture |
| 2 | internal | M | import regex matched paths quoted in comments | ACCEPT: comments stripped |
| 2 | internal | L | shared `[slug]` route file bumps all chapters | REJECT: that file renders every chapter, so a change there is a content change for all |
| 3 | internal | H | malformed historical JSON treated as absent | ACCEPT: throws (no malformed version exists in history, verified) |
| 3 | internal | H | O(routes × history) `git show` calls | ACCEPT: caches keyed by repo+commit/HEAD+path; sync step < 1 s |
| 3 | internal | M | merge-commit semantics untested | DEFER: first-parent comparison documented; branch commits appear in the log themselves |
| 3 | internal | L | comment regex could strip `/*` inside strings | REJECT: no import line contains it; low likelihood, not a live defect |
| 3 | Sol | M | deleting a route's override entry never inspected | ACCEPT: all governed keyed files always considered; tests for added/deleted entries |
| 3 | Sol | L | malformed JSON / renames | malformed: ACCEPT (above); renames: DEFER, governed paths are fixed |
| 4 | Sol | M | a deleted keyed JSON file under `src/site/data/` would drop out of discovery | ACCEPT: keyed data restricted to the fixed path `metadata-overrides.json` (no JSON exists under `src/site/data/`; other data lives in modules covered by the import closure); whole-file deletion test |
| 4 | internal | M | root commit compared against `null` instead of "no entries" | ACCEPT: one-line fix |
| 4 | internal | M | malformed-JSON throw path untested | ACCEPT: test added |

Round-4 fixes were a one-line change, a path restriction and tests; with no open finding left, the slice was
committed without a fifth round.
