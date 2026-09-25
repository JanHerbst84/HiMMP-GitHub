# himmp.net review and remediation plan (2026-09-25)

Status: **plan v1, awaiting Sol review.** Branch `site-review-2026-09` from `main` at `f484e59`.

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

### Slice A — server, 404 and sitemap (T2, T5, D1)

1. `app/not-found.tsx` with site shell, one `<title>`, `noindex`, links to home/findings/publications.
2. Nginx vhost: `error_page 404 /404.html;` plus `location = /404.html { internal; }` (security headers repeated,
   since `add_header` in a location drops the server-level set). Apply to the explicit `return 404` blocks too.
3. Nginx caching: `location ^~ /_next/static/` → `Cache-Control "public, max-age=31536000, immutable"`; add
   `svg|ico|gif|avif` to the static regex; replace `expires 30d` + `add_header Cache-Control "public"` with a single
   `Cache-Control "public, max-age=2592000"` header.
4. Sitemap `lastmod` = newest commit date across the files that actually produce the route (legacy HTML, the
   route's React page/chapter component, `app/<route>/page.tsx`, and the metadata/JSON-LD data files introduced in
   slice C), excluding a named list of non-content bulk commits (initially `0d20f4c`, the archive banner). Unit
   test the mapping.

### Slice B — head metadata and llms.txt (D4, D5, D6, D7)

1. Home canonical/`og:url` → `https://himmp.net/`; sitemap `<loc>` for home → `/`; internal "welcome"/logo links
   → `/`; Nginx `location = /index.html { return 301 /; }`. Verify `location = /`'s `try_files /index.html` is not
   caught by the new redirect (curl both). Update `parity:sitemap`/`parity:links` expectations if they encode
   `index.html`.
2. Home `<title>` ≈ "HiMMP – Heaviness in Metal Music Production | AHRC research project" (≤ 65) and description
   ≤ 160 via `metadata-overrides.json`; keep OG/Twitter in step.
3. Findings OG/Twitter title → "A Practical Guide".
4. Rewrite `llms.txt` facts from the site's own content only (DOIs copied verbatim from `PublicationsPage.tsx` and
   `audio`/`findings` pages); remove the geo claim; update the date.

Chapter titles over 60 chars are left as they are (descriptive, low impact).

### Slice C — structured data (D2, D3, D6)

1. Add a React-side JSON-LD seam: `src/site/data/jsonld/*.ts` exporting per-`sourceFile` transforms applied to the
   legacy-extracted blocks (replace, patch or append), mirroring how `metadata-overrides.json` patches head metadata.
2. Fixes: Volumes I/II → `Book` (keep existing name/author/publisher/DOI/URL fields; add ISBN only if already in
   repo content); `ResearchProject` → `foundingDate`/`dissolutionDate`/`member`, and `funding` → `Grant`
   (`identifier` `AH/T010991/1`, `funder` AHRC); chapter `isPartOf` → the guide `Book` `@id`.
3. Append the 8 missing DOI outputs on `publications.html` and `VideoObject`s for the post-freeze videos using only
   fields present in the page source (title, embed URL, thumbnail). `uploadDate` is omitted where the repo has no
   date — no invented dates.
4. Test: every emitted block parses, has `@context`/`@type`, no duplicate `@id`, and the known type/property fixes
   hold; rerun `audit:seo:live`-style checks against the local export.

### Slice D — performance (T1, T3, T6)

1. Reusable script `nextjs-site/scripts/optimize-figures.mjs` (uses the system `magick` CLI; no npm dependency):
   writes WebP derivatives, max 1600 px wide, to `findings/Figures/web/` (committed, synced by `sync:public`), and a
   JSON manifest of intrinsic sizes. Originals stay and remain reachable: each figure links to its full-resolution
   original.
2. Chapter components: `<img src="Figures/web/….webp" width height loading="lazy" decoding="async">` via one small
   `<ChapterFigure>` component or a mechanical rewrite; first above-the-fold image may stay eager. Chapter hero
   background images pointed at the WebP derivative where one exists.
3. Producer portraits and other below-fold images: `loading="lazy"` (removes the React preloads).
4. YouTube facade for the home, audio and approach embeds, reusing the videos-page `data-lazy-youtube-src`
   pattern and `EnhancedVideoController` (no CSP change: `img.youtube.com` and `www.youtube.com` are approved).
   `youtube-nocookie.com` is **not** adopted in this pass (needs a CSP change and the all-route CSP audit); record it
   as a follow-up.
5. Audio (45 MP3s, 320 kbps) is **excluded**: they are research stimuli; any re-encode needs JPH approval.

### Slice E — accessibility (T4, T7 partial)

1. `assets/js/main.js` smooth scrolling: skip `.skip-link`, move focus to the target (`tabindex="-1"` when needed),
   use `behavior: 'auto'` under `prefers-reduced-motion: reduce`, and update `location.hash`.
2. Heading skips: fix the structural ones in shared components (chapter sidebar, home card grid) where CSS is
   class-based; the remaining per-page skips are recorded, not fixed, in this pass.

### Slice F — visual (V1–V4)

1. Chapter shell: move the "On this page" list below the chapter hero (or into the desktop reader panel under the
   current chapter) and style it; on mobile collapse the reader panel into a closed `<details>` so the chapter title
   is near the top.
2. Counter: "Chapter 7 of 14", "Glossary", "Guide home" instead of the route index.
3. Home outputs grid: 4 columns ≥ 1100 px, 2×2 below, 1 column on phones; tighten section spacing.
4. Page heroes: reduce desktop min-height (target ≈ 320 px); align the publications section nav heading with its pills.

### Held for JPH (content/brand, not implemented)

V5 CTA label wording and the "welcome" nav label; V6 "Project Completed" wording and the duplicate promotions;
audio re-encoding; `youtube-nocookie` adoption.

## 4. Verification and review

Per slice: `npm run typecheck`, `npm run build`, `parity:content`, `parity:text`, `parity:links`,
`parity:sitemap`, `npx playwright test`, `audit:contrast`; before/after screenshots and byte counts with the
review scripts; Sol review of the slice diff (`codex exec -m gpt-5.6-sol`, medium effort, read-only) before the
slice commit. Findings are dispositioned ACCEPT/REJECT/DEFER in §6 with evidence.

## 5. Deployment

Per `docs/hostinger-deployment.md`: `npm run build:audio`, `npm run preflight:deploy`; rsync the export to
`/var/www/himmp-site/releases/<timestamp>-<sha>/out` with `--link-dest` against the current release; back up the
installed vhost to `himmp.net.pre-<sha>-<timestamp>`, install the new vhost, `nginx -t`, reload; switch `current`.
Live checks: 404 page, `/index.html` → `/` 301, cache headers, representative routes, audio MP3, `audit:seo:live`,
and the all-route Chromium CSP audit (embed markup changes). Rollback: previous release symlink plus the vhost
backup. Record the release in `docs/hostinger-deployment.md`.

## 6. Review and decision log

(Sol plan review and per-slice dispositions are appended here.)
