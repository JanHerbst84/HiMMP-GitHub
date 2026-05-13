# D-1 Structural-Coverage Audit — `/assets/css/main.css` + `/assets/css/responsive.css`

Date: 2026-05-13
Author: Claude (Opus 4.7), produced under the autonomous-follow-up plan after the page-port migration completed (commit `92e1c5a`).

This audit is the gating prerequisite recorded in `docs/nextjs-phase-2-design-refresh-future.md` § D-1. It does NOT propose implementation; it produces the structural-coverage map a future D-1 implementation must reproduce before `main.css` can be unloaded.

## Method

Two committed scripts produce this audit:

- `nextjs-site/scripts/audit-legacy-css.mjs` — AST-aware tokenizer that walks each CSS file, extracts every rule, and classifies it by the set of properties it declares. Outputs human-readable or JSON (`--json`). Strips C-style comments. Recurses into `@media`/`@supports`/`@container` blocks. Skips opaque at-rules (`@keyframes`, `@font-face`, etc.) without counting them.
- `nextjs-site/scripts/classify-css-families.mjs` — Reads the JSON output from the audit script (two required CLI args: paths to the main + responsive JSON dumps) and bins each STRUCTURAL rule into a family (A–L). Reports per-family counts plus any unclassified selectors. **The unclassified count must be zero** for the family map to be a valid D-1 coverage gate; if a future CSS edit adds a selector the classifier doesn't recognise, that selector lands in the unclassified list and surfaces immediately rather than being silently lost. The script fails fast (exit 2) if either input path is missing rather than silently classifying stale data.

To reproduce this audit:

```sh
cd nextjs-site
node scripts/audit-legacy-css.mjs ../assets/css/main.css --json > /tmp/main-audit.json
node scripts/audit-legacy-css.mjs ../assets/css/responsive.css --json > /tmp/resp-audit.json
node scripts/classify-css-families.mjs /tmp/main-audit.json /tmp/resp-audit.json
```

The tokenizer classifies by property set:

- **STRUCTURAL** — declares any layout primitive (`display`, `position`, `width`, `height`, flex/grid, padding, margin, overflow, top/right/bottom/left, transform, `aspect-ratio`, `isolation`, `inset`). Must be ported before `main.css` can be removed.
- **palette-only** — declares only color/typography (`color`, `background-color`, `font-*`, `line-height`, `letter-spacing`, `text-*`, `list-style`). Already safely overridable today via the token layer; not load-bearing.
- **visual** — declares only borders, shadows, opacity, transitions, etc. Visual polish; can be deferred.
- **misc** — declares only custom properties (`:root` etc.) or no recognised property.

@media blocks expand to nested rules. Pseudo-classes count toward the parent selector's classification.

## Totals

| File | STRUCTURAL | palette-only | visual | misc | Total |
|---|---:|---:|---:|---:|---:|
| `assets/css/main.css` | **175** | 37 | 28 | 3 | 243 |
| `assets/css/responsive.css` | **32** | 16 | 1 | 5 | 54 |
| **Combined** | **207** | 53 | 29 | 8 | **297** |

The structural set is **207 rules** spanning 12 families A–L (below). That is the load-bearing scope D-1 must reproduce.

## Structural set by selector family

Grouping the 207 STRUCTURAL rules by feature so a future D-1 migration can land them in coherent slices. **Every** STRUCTURAL rule from both files lands in exactly one family — confirmed by the companion classifier script at `nextjs-site/scripts/classify-css-families.mjs`, which reports an `Unclassified: 0` check. If you re-run the audit and any rule lands as unclassified, extend the classifier rather than leaving the family map silently incomplete.

| Family | main.css | responsive.css | Combined |
|---|---:|---:|---:|
| A. Document chrome (reset + container + skip-link + base type) | 11 | 3 | 14 |
| B. Site header + main nav | 15 | 8 | 23 |
| C. Hero (incl. `.chapter-hero`, `.hero-buttons`) | 12 | 3 | 15 |
| D. Findings reader | 50 | 0 | 50 |
| E. Content section + tables + updates/highlights + project-aims | 19 | 6 | 25 |
| F. Team grid (incl. `.team-photo` + responsive image rules) | 5 | 5 | 10 |
| G. Publications (`.publication-*`, `.section-nav-button`) | 9 | 0 | 9 |
| H. Audio (audio-player, mix players, download-item/links) | 8 | 1 | 9 |
| I. Video (video-container/grid/item, lazy-video states) | 3 | 2 | 5 |
| J. Contact form (form-row/group, inputs, textareas, buttons) | 11 | 0 | 11 |
| K. Footer (site-footer, footer-nav/info/logos, brand logos) | 14 | 4 | 18 |
| L. Affordances (`.read-more`, `.resource-button`, `.accordion`, `.callout`, `.chapter-resources`, `.chapter-card`, `.section-divider`) | 18 | 0 | 18 |
| **Total** | **175** | **32** | **207** |

Per-family detail follows.

### A. Document chrome (base + container + skip-link)
Rules: `*`, `html`, `body`, `img`, `.container`, `.skip-to-content`, `.skip-to-content:focus`, `p`, `p + ul,p + ol`, headings group `h1..h6`.

Notes: `.container` width and padding are the load-bearing horizontal-spacing primitive used by every page. `body { line-height: 1.6 }` cascades into all child text. Universal `* { box-sizing: border-box }` is the global box-model assumption that any port must preserve.

### B. Site header + main navigation
Rules: `.site-header`, `.site-header .container`, `.logo a`, `.logo-image`, `.main-nav`, `.nav-links`, `.nav-links li`, `.nav-links a`, `.nav-links a::after`, `.nav-links a:hover::after,.nav-links a.active::after`, `.menu-toggle`, `.menu-toggle span` (+ responsive overrides). Already partly redesigned via the React `<SiteHeader>` token re-skin; the layout still relies on these rules.

### C. Hero blocks (`.hero`, `.chapter-hero`)
Rules: `.hero`, `.hero-overlay`, `.hero .container`, `.hero-title`, `.hero-content`, `.chapter-hero`, `.chapter-hero .hero-overlay`, `.chapter-hero .container`, `.chapter-hero .hero-title` (+ responsive overrides). Each ported page emits these class hooks; the structural rules here define the absolute-positioned overlay + min-height + container z-index stack.

### D. Findings reader chrome
Rules: `.figure`, `.figure-caption`, `.audio-example-box`, `.audio-example-box audio`, `.pull-quote`, `.pull-quote::before`, `.pull-quote-content`, `.pull-quote-photo`, `.pull-quote-photo img`, `.pull-quote p`, `.pull-quote footer`, `.sidebar-box`, `.sidebar-box strong`, `.chapter-nav`, `.chapter-nav .all-chapters`, `.chapter-content ul,.chapter-content ol`, `.chapter-content li`, `.chapter-content .endnotes`, `.chapter-content .endnotes li`, `.chapter-content .endnotes .backref`, `.glossary`, `.glossary dt`, `.glossary dd`, `.portrait`, `.portrait img`, `.author-bio`, `.author-bio::after`, **`.chapter-section-nav`**, **`.chapter-section-nav h3`**, **`.citation-box`**, **`.citation-box strong`**, **`.citation-box p`**, **`.mix-comparison-embed`** (+ `h3`, `.embed-intro`, `.currently-playing`, `audio`, `.mix-button-group`, `.mix-button`, `.embed-note`). The findings chapters carry the largest concentration of structural rules — 50 in main.css alone.

### E. Content section + grid primitives
Rules: `.content-section`, `.section-grid`, `.section-content h3`, `.content-section table`, `.content-section th,.content-section td`, `.updates-full-section`, `.updates-list`, `.update-item`, `.update-date`, `.update-content h3`, `.update-content p`, `.update-content ol,.update-content ul`, `.update-content li`, `.update-highlights`, `.highlight-item`, `.highlight-item h4`, `.highlight-item p`, plus the `:hover` / `:last-child` variants. Also: **`.aims-grid`**, **`.aim-item`** (the about-page project-aims grid) appear via `responsive.css` mobile breakpoints.

### F. Team grid
Rules: `.team-grid`, `.team-member`, `.team-member img`, `.team-member h4`, `.team-member .title`. Used by the team-page port; layout is grid + image sizing. Responsive variants also cover `.team-photo`, `.partner-logo`, `.producer img`, `.artist img`, `.advisor-item img`, `.university-logo-container img` (image-sizing rules at narrow viewports).

### G. Publications + section-nav
Rules: **`.publication-item`**, **`.publication-meta`**, **`.publication-link`**, `.publication-section-nav`, `.section-nav-buttons`, `.section-nav-button`. The section-nav buttons are wired by the body script for in-page scroll-to-target. (The `.accordion` family is in Family L below — it's a cross-page affordance rather than publications-specific.) The publication-section-nav block lives outside `.content-section` directly inside `<main>`, so its sizing rules are load-bearing for the visual rhythm of the page.

### H. Audio comparison + mix players + downloads
Rules: `.audio-player`, `.audio-container`, `audio`, `.audio-controls`, `.mix-comparison-player`, `.mix-player`, `.mix-buttons`, `.mix-btn`, `.mix-btn.active`, `.mix-btn:hover`, `#comparison-player`, `#currently-playing`, `.comparison-player-container`, **`.download-item`**, **`.download-item h4`**, **`.download-links`**, `.download-link`, `.download-link-container`. Note: the `<AudioComparison>` React component (shipped D-3) owns its own scoped CSS; these rules still load but are overridden by `.audio-comparison-scoped`.

### I. Video page
Rules: `.video-container`, `.video-container iframe`, `.video-grid`, `.video-item`, `.video-feature`, `.video-fallback-note`, plus lazy-video states `.lazy-video-container`, `.lazy-video-trigger`, `.lazy-video-trigger__icon`. The `aspect-ratio` 16/9 plus the absolute-positioned iframe inside is the structural primitive (specifically called out by both reviewers as load-bearing during the v1 plan review).

### J. Form chrome (contact)
Rules: `.contact-grid`, `.contact-card`, `.contact-form`, `.form-row`, `.form-group`, `.form-group.half`, `label`, `input, textarea, select`, `textarea`, `button`, `.required`, `.error-message`, `.submission-message`, `.contact-list`. Element-name selectors (`input`, `textarea`, `button`, `label`) form the base reset for form controls.

### K. Footer
Rules: `.site-footer`, `.site-footer .container`, `.footer-info`, `.footer-logos`, `.footer-logo`, `.footer-logo:hover`, `.footer-nav`, `.footer-nav ul`, `.footer-nav li`, `.footer-nav li:not(:last-child)::after`, `.footer-nav a`, `.university-logo, .himmp-logo, .ahrc-logo`, `.university-logo img, .himmp-logo img, .footer-logo`, `.ahrc-logo img`, `.funder-logo` (+ responsive variants for the brand-logo sizing at narrow viewports). Token re-skin partially shipped in `<SiteFooter>`.

### L. Affordances + cards + buttons (cross-page)
Rules: `.read-more` (the legacy pill-button variant, partly overridden by `[data-page="about"] .read-more`), `.read-more:hover`, `.read-more, .resource-button` (shared affordance), `.read-more::before, .resource-button::before`, `.read-more:hover::before, .resource-button:hover::before`, `.read-more:active, button:active`, `.resource-button`, `.resource-button:hover`, `.resource-buttons`, **`.chapter-resources`**, **`.chapter-resources h3`**, `.accordion`, `.accordion::after`, `.accordion.active`, `.accordion-panel`, `.accordion-content`, `.callout`, `.info-box`, `.info-box h3`, `.collaboration-note`, `.chapters-grid`, `.chapter-card`, `.section-divider`, `.references-section`, `.references-list`, `.reference-item`, `.tag`, `.output-card:hover`. The `.section-nav-button.active` highlight rule is in Family G with the rest of the publication-section-nav block.

## palette-only set (37 rules in main.css, 16 in responsive.css)

Safe-to-override-today rules. Examples:

```
h1 { font-size: 3rem; }
h2 { font-size: 2.2rem; }
h3 { font-size: 1.8rem; color: var(--brand-teal); }
h4 { font-size: 1.4rem; color: var(--brand-teal); }
.highlight-text { color: var(--brand-teal); font-weight: bold; }
.content-section a { font-weight: 600; text-decoration: underline; }
.content-section thead th { background: var(--light-gray); }
.content-section tbody tr:nth-child(even) { background: #fafafa; }
```

These can be retired or overridden in any order without breaking layout. Several are already shadowed by `[data-page="about"]` rules on the about page.

## Visual set (28 rules in main.css, 1 in responsive.css)

Borders, shadows, transitions, opacity-only rules. Lower priority for D-1; they can ride along with the structural ports rather than being treated as separate work.

## Gating rules called out by prior reviews (Codex 2026-05-12)

The v1 plan review specifically named these as the highest-risk structural rules:

- `.container { width / padding }` (main.css:74-79)
- `.hero { display: flex; min-height; overlay stack }` (main.css:292-326)
- `.section-grid { display: grid; grid-template-columns: repeat(2,1fr) }` (main.css:673-677)
- `.video-container { aspect-ratio iframe positioning }` (main.css:1045-1061)
- `.sidebar-box { callout styling }` (main.css:487-510)
- `.read-more` link affordance
- The full `responsive.css` mobile breakpoint set (all 32 STRUCTURAL rules)

This audit confirms all seven are still present and load-bearing. Any D-1 implementation must reproduce them in the React/CSS-module replacement before the legacy stylesheet links can be removed from `app/layout.tsx`.

## Recommended migration sequence (NOT a commitment)

If/when D-1 is opened, this is the order that minimises risk per slice:

1. **Audit refresh** — re-run `node nextjs-site/scripts/audit-legacy-css.mjs <path>` against the latest legacy CSS to confirm the structural set hasn't shifted.
2. **Token layer hardening** — already mostly done in `app/tokens.css` and `app/globals.css`. Confirm every CSS custom property the legacy `:root` block defines has a token equivalent.
3. **Family A (chrome + container)** — port the base reset, `body`, `.container`, headings, paragraph spacing. This is foundational; every other port depends on it.
4. **Family C (hero) + responsive K (footer)** — the React `<SiteHeader>` and `<SiteFooter>` are already partly token-driven; finish the port and lift their CSS into CSS modules colocated with the component.
5. **Family E (content sections + tables)** — used by every legacy page body.
6. **Per-page surfaces in arbitrary order**: F (team), G (publications + section-nav), H (audio), I (videos), J (contact), L (affordances + cards).
7. **Family D (findings reader)** — largest concentration, do last when the simpler ports are stable.
8. **palette-only retirement** — opportunistically as families land; this is incremental.
9. **Stylesheet removal** — finally remove the `<link>` tags from `app/layout.tsx`, and delete the legacy CSS files from disk only when the `parity:visual` baselines are confirmed against the React-owned post-design state (not the legacy state).

A full D-1 cycle is realistically 8-12 slices spread across the families above. Each slice should ship as its own commit with dual review per `agent-instructions/projects/himmp-github.md`.

## What this audit does NOT do

- It does not propose a specific D-1 implementation. The future-scope doc still gates that on a stakeholder decision about whether to commit to the design-refresh direction at all.
- It does not retire any selector. Both files remain loaded by `app/layout.tsx` and continue to drive layout for every page.
- It does not measure runtime CSS coverage (which rules actually have matching elements on each page). That measurement could narrow the structural set further, but is not required to unblock D-1.

## Re-entry checklist

A future D-1 proposal must cite this file, name which family it covers, and confirm:

1. The structural set listed under that family is reproduced in the React/CSS-module replacement.
2. `parity:visual` baselines for affected pages are intentionally re-recorded (or the page has already exited the parity-preservation set).
3. The slice ships through dual review per the Phase 2 protocol.

End of audit.
