# HiMMP Next.js Phase 2 — D-1 Slice Plan (Per-CSS-Family)

Date: 2026-05-18
Author: Claude (Opus 4.7), planning pass under read-only exploration.
Status: proposal, awaiting sign-off before any slice opens.
Supersedes nothing; supplements `docs/nextjs-phase-2-design-refresh-plan.md` (v2 Coexist, shipped) and `docs/nextjs-phase-2-d1-main-css-audit.md` (gating audit).

## 1. Framing

### 1.1 Why D-1 now

The v2 Coexist slice shipped at commit `794901f` (Slice E) and has been iterated through Slice N (`6e2e995`). Tokens (`app/tokens.css`) and the dark-academic chrome are layered additively over the legacy `/assets/css/main.css` + `/assets/css/responsive.css`, which both remain `<link>`-loaded in `app/layout.tsx:21-22`. Every page is React-owned (`generateStaticParams` no longer feeds the catch-all). The 2026-05-18 production deploy is the last externally-visible event needed before the deferred-scope re-entry gate opens.

D-1's headline deliverable is the inverse of what Coexist did: instead of layering tokens **above** the legacy stylesheets, the legacy stylesheets get retired link-by-link by absorbing their remaining structural responsibilities into `globals.css` (or co-located CSS modules) and proving — via Playwright body-smoke per page — that nothing visual or functional regresses on the redesigned routes. The two legacy `<link>` tags in `app/layout.tsx` are deleted only once every family the audit enumerates has its replacement landed and verified.

### 1.2 What the audit gate confirmed

`docs/nextjs-phase-2-d1-main-css-audit.md` enumerates **207 STRUCTURAL rules** across **12 selector families (A–L)** in main.css + responsive.css. The classifier (`nextjs-site/scripts/classify-css-families.mjs`) reports `Unclassified: 0`, which is the contract that makes the family map a valid coverage gate: any future change to either legacy stylesheet will surface as an unclassified rule rather than being silently lost.

The audit also flags seven specifically high-risk rules carried forward from the v1 review (Codex 2026-05-12):

- `.container { width / padding }` (main.css:74-79)
- `.hero { display: flex; min-height; overlay stack }` (main.css:292-326)
- `.section-grid { display: grid; grid-template-columns: repeat(2,1fr) }` (main.css:673-677)
- `.video-container { aspect-ratio iframe positioning }` (main.css:1045-1061)
- `.sidebar-box { callout styling }` (main.css:487-510)
- `.read-more` link affordance
- The full `responsive.css` mobile breakpoint set (32 STRUCTURAL rules)

Each of these is named in at least one of the slices below; none ship as a standalone slice because each lives inside a family that has its own coherent scope.

### 1.3 What has already shipped under D-1 labels

The git log shows D-1 work has been arriving in commit-sized slices since Slice E:

| Commit | Slice | Family | Status |
|---|---|---|---|
| `794901f` | E | A. Document chrome | shipped |
| `29c40e0` | F | B. Header + nav | shipped |
| `0db27e9` | G | (responsive + scrollbar polish, cross-family) | shipped |
| `1b4672f` / `3beffcc` | H / I | L (partial) — pill-button contrast | shipped |
| `5901897` | J | K. Footer | shipped |
| `ef7c173` | K | E. Content section + tables + highlights | shipped |
| `12ab6cf` / `f22cc56` / `6e2e995` | L–N | point-fixes across F (team), G (publications), L (advisor cards) | shipped |
| pre-Coexist | hero re-skin | C. Hero | shipped via `[data-page]` scoping |

Remaining D-1 scope therefore covers families **D, F, G, H, I, J, L** and the **full responsive.css mobile breakpoint set**, plus the final `<link>`-tag retirement gate. The slice ordering below targets exactly those, sequenced for risk.

## 2. Operating Principle

D-1 inherits the v2 Coexist preservation contract: visible text is byte-identical (`parity:text`), title/description/h1/JSON-LD counts unchanged (`parity:content`), no controller bindings (`EnhancedAudioController`, `EnhancedVideoController`, `EnhancedFindingsShell`, `AudioComparison`) touched, no legacy markup edited. What changes:

- Each slice **adds** structural CSS to `globals.css` (or a colocated CSS module) that reproduces a named family's STRUCTURAL rules from main.css / responsive.css.
- Once a family's replacement is in place and Playwright body-smoke covers the page surfaces that depended on it, the corresponding rules in the legacy stylesheet are **conceptually superseded** but the file is NOT edited and the link is NOT removed.
- Only after every family has shipped does the final slice (Section 4) remove the two `<link>` tags from `app/layout.tsx`. Deletion of the file from disk is **out of scope** — that is D-7.

This means D-1 is dual-coverage during the migration: the legacy stylesheets keep applying while the React-owned replacements layer on top with equal or greater specificity. Removing the links is the single switchover event; everything before it is safe to roll back commit-by-commit.

## 3. Slice Ordering

Seven family slices plus a responsive slice plus a final stylesheet-retirement gate. Ordering principle: highest-risk surfaces (controller-bound, JSON-LD-bound, or geometry-critical) last; lowest-risk (isolated affordances, contact form) first; the responsive slice second-to-last so the desktop coverage is fully landed before mobile breakpoints are touched.

Rationale for the order: D-1's failure mode is silent — a missing rule lands as a one-pixel-off regression that may not show up on any automated gate until a user notices. Sequencing easier surfaces first lets the team build confidence in the slice-and-Playwright-smoke pattern before approaching the findings-reader chrome, which carries 50 of the 207 STRUCTURAL rules and is also where reader experience is most sensitive to layout drift. The contact form is first because it has zero controllers, zero JSON-LD selectors, and a single page surface; affordances are second because they are cross-cutting but stylistically simple; publications and video are mid-pack because they have section-nav and lazy-iframe behaviour respectively but no shared cross-page surface; team is grouped with publications by structural similarity; audio is high-risk because of the controller-binding contract; findings is last because of size + reader sensitivity; responsive sits after every desktop family has landed so mobile breakpoints have a fully-realised desktop layout to override.

| # | Slice | Family | Risk | Rationale |
|---|---|---|---|---|
| 3.1 | Contact form | J | **Low** | Single page, no controller bindings, no JSON-LD selectors on form chrome. Element-name selectors (`input`, `textarea`, `button`, `label`) port mechanically. Smallest surface; good first slice to validate the migration pattern. |
| 3.2 | Affordances + cards (cross-page) | L | **Low** | Pill buttons (`.read-more`, `.resource-button`) already have contrast fixes shipped (Slices H/I). Remaining scope: `.accordion`, `.callout`, `.info-box`, `.chapter-card`, `.chapters-grid`, `.section-divider`, `.references-section`, `.tag`. Stylistically simple; cross-page so it unblocks the per-page slices that follow. |
| 3.3 | Publications + section-nav | G | **Medium** | Body script wires `.section-nav-button` for in-page scroll. Existing Playwright at `tests/static-export.spec.ts:339` already locks the section-nav + accordion behaviour. The `.publication-item` card and meta line are mid-complexity. |
| 3.4 | Team grid | F | **Medium** | `.team-grid` and `.team-member` are grid + image-sizing primitives. Responsive overrides cover `.team-photo`, `.partner-logo`, advisor + university logos. Already partly polished via Slices L/M/N. |
| 3.5 | Video page | I | **Medium** | `.video-container` is a flagged-risk rule (`aspect-ratio: 16/9` + absolute iframe). Lazy-video states (`.lazy-video-container`, `.lazy-video-trigger*`) already live in `globals.css`; the legacy `.video-container` itself does not. EnhancedVideoController binds to `.video-feature` and `.video-grid`; preserving those class hooks is non-negotiable. |
| 3.6 | Audio surface (page chrome only) | H | **High** | Page-level audio chrome (`.audio-player`, `.audio-container`, `.mix-comparison-player`, `.download-item`, `.download-link`). The `<AudioComparison>` React component owns its own scoped CSS and is already comprehensive; this slice covers the legacy audio-page chrome surrounding it. High-risk because the literal-rgb Playwright assertion (`tests/static-export.spec.ts` rgb-color checks) was historically fragile here and EnhancedAudioController binds to class hooks the audit lists. |
| 3.7 | Findings reader chrome | D | **High** | 50 STRUCTURAL rules — largest family. The reader chrome (`.figure`, `.pull-quote`, `.sidebar-box`, `.chapter-nav`, `.chapter-content`, `.glossary`, `.portrait`, `.author-bio`, `.chapter-section-nav`, `.citation-box`, `.mix-comparison-embed`) is reader-experience-critical. EnhancedFindingsShell already overrides several of these; this slice is the careful audit of which legacy rules remain load-bearing for chapters vs the index and absorbs them into `globals.css` or a colocated module under `src/site/components/EnhancedFindingsShell.tsx`. |
| 3.8 | Responsive breakpoint set | responsive.css (full) | **Medium** | All 32 STRUCTURAL rules in responsive.css. Sits after the desktop families because each mobile breakpoint must override the desktop layout the previous slices established. Splitting earlier would risk a slice where desktop is React-owned but mobile is still legacy-driven, creating a hybrid bug surface that nothing in the gates catches. |
| 3.9 | Stylesheet `<link>` retirement | (gate slice) | **High** | Delete the two `<link rel="stylesheet">` tags from `app/layout.tsx`. No CSS work — purely the switchover. All earlier slices must be green before this opens. |

## 4. Per-Slice Detail

Each slice below follows the same template:

- **Selectors absorbed**: which STRUCTURAL rules from the audit migrate into `globals.css` (or a colocated CSS module). Palette-only and visual rules ride along opportunistically per the audit's "Recommended migration sequence" step 8.
- **Pre-commit gates**: which Playwright assertions and parity scripts must pass.
- **Regression surface to watch**: the failure modes a human reviewer should check in the browser sanity-pass.

The page-port content-preservation contract (`CLAUDE.md` §Phase 2) is in force throughout: no markup edits, no JSON-LD selector renames, no controller-binding changes.

### 4.1 Slice — Family J (Contact Form)  · Risk: Low

**Selectors absorbed (11 STRUCTURAL rules in main.css)**: `.contact-grid`, `.contact-card`, `.contact-form`, `.form-row`, `.form-group`, `.form-group.half`, `label`, `input, textarea, select`, `textarea`, `button`, `.required`, `.error-message`, `.submission-message`, `.contact-list`.

The element-name selectors (`input`, `textarea`, `button`, `label`) are the load-bearing base reset; they must move into `globals.css` with `html`-prefixed specificity (the project convention established in Slice E) so they beat the legacy single-element selectors regardless of source order. The compound `.form-group.half` two-column layout is the only geometry-critical primitive — every other rule in this family is padding, spacing, and form-control colour.

**Pre-commit gates**:

- `npm run typecheck`, `npm run build` (cheap, both must pass).
- `npm run parity:content` — title/description/h1/JSON-LD counts on `/contact.html`.
- `npm run parity:text` — visible text on `/contact.html` byte-identical.
- Existing Playwright contact-form tests at `tests/static-export.spec.ts:828`, `:866`, `:890` (validation, CSRF-token unavailable, handler-error reporting) all pass unchanged. These already exercise field-level validation and the legacy handler contract; if any of them go red, the slice is scoped wrong.
- New Playwright body-smoke for `/contact.html`: assert the two-column form-row collapses to one column under 720px, asserts focus-visible outline colour on inputs uses `--color-mint` or `--color-sulfur`. Modelled on `tests/static-export.spec.ts:943` (the existing dark-academic chrome smoke).

**Regression surface**: the `.form-group.half` two-up layout at desktop; the focus-ring on text inputs; the submit button's pill-button hover/active state (this is also a Family L surface — coordinate). The `.submission-message` post-submit replacement (driven by `contact-handler.php`) renders into the same form container — verify the replacement message still inherits the new chrome.

### 4.2 Slice — Family L (Affordances + Cards)  · Risk: Low

**Selectors absorbed (18 STRUCTURAL rules)**: `.read-more` (and the legacy pill-variant), `.resource-button`, `.resource-buttons`, `.chapter-resources`, `.chapter-resources h3`, `.accordion`, `.accordion::after`, `.accordion.active`, `.accordion-panel`, `.accordion-content`, `.callout`, `.info-box`, `.info-box h3`, `.collaboration-note`, `.chapters-grid`, `.chapter-card`, `.section-divider`, `.references-section`, `.references-list`, `.reference-item`, `.tag`, `.output-card:hover`.

Existing coverage: `.read-more` and `.resource-button` pill-button contrast already ship as `html a.read-more` rules (`globals.css:102-116`). `[data-page="about"] .read-more` already redefines the about-page variant (`globals.css:957-977`). This slice fills the rest: `.accordion` open/closed state, `.callout` block, `.info-box` callout, `.chapter-card` grid item, `.chapters-grid` parent, `.section-divider` horizontal rule, `.references-list` item layout, `.tag` inline label.

**Pre-commit gates**:

- All cheap gates (typecheck, build, parity:content, parity:text).
- Existing Playwright at `tests/static-export.spec.ts:339` (publications section-nav + accordions) already locks `.accordion` interactive behaviour. If the structural rules drift, that test goes red.
- New Playwright body-smoke covering one representative page per affordance: `.accordion` (publications), `.callout` / `.info-box` (acknowledgements or about), `.chapter-card` / `.chapters-grid` (findings index), `.section-divider` (multiple pages). Assert layout primitives are applied (display, position) rather than literal colours.

**Regression surface**: the `.accordion::after` arrow rotation on open/close — pure CSS, must port the transform exactly. `.chapters-grid` is `auto-fill, minmax(...)` and orphans the last row on wide viewports if the minmax breakpoints shift; the existing Slice N fix for `.departments-grid` is the reference pattern. `.info-box` is used in findings chapters — coordinate with Slice 4.7.

### 4.3 Slice — Family G (Publications + Section-Nav)  · Risk: Medium

**Selectors absorbed (9 STRUCTURAL rules)**: `.publication-item`, `.publication-meta`, `.publication-link`, `.publication-section-nav`, `.section-nav-buttons`, `.section-nav-button`.

Existing coverage: `.publication-item` (and `.publication-card`) repaint to `--color-paper` with a graphite-rule hairline already lands in Slice L (`globals.css:252-267`). This slice absorbs the structural layout of the publication grid + section-nav button row, which the body script (`assets/js/main.js`) wires for in-page anchor scrolling.

**Pre-commit gates**:

- Cheap gates.
- `tests/static-export.spec.ts:339` (publication section navigation + accordions) — must pass unchanged. It explicitly asserts the active-state class transition on `.section-nav-button` after a click.
- New Playwright assertion: each section-nav button has the migrated structural rules applied (`display`, `padding`, `border-radius`).

**Regression surface**: the `.section-nav-button.active` highlight rule (audit notes it lives in Family G, not L) — preserve its specificity contract. `.publication-item` ships an inline `style` block via `LegacyStyles` on some pages that overrides with `!important`; the project convention (see `globals.css:132-139`) is to match `!important` with `!important` rather than edit the legacy HTML.

### 4.4 Slice — Family F (Team Grid)  · Risk: Medium

**Selectors absorbed (5 STRUCTURAL rules in main.css + 5 in responsive.css)**: `.team-grid`, `.team-member`, `.team-member img`, `.team-member h4`, `.team-member .title`. Responsive variants for `.team-photo`, `.partner-logo`, `.producer img`, `.artist img`, `.advisor-item img`, `.university-logo-container img`.

Existing coverage: `.advisor-item` centring and `.departments-grid` / `.advisory-grid` 3-column override at `min-width: 768px` already ship (`globals.css:274-290`).

**Pre-commit gates**:

- Cheap gates.
- Existing Playwright at `tests/static-export.spec.ts:259` (team page renders React-owned grids) — preserve the grid item counts.
- New body-smoke: assert `.team-grid` is `grid` and `.team-member img` has `aspect-ratio` (or the legacy `width: 100%`-with-fixed-height equivalent).

**Regression surface**: the `.team-member img` aspect ratio — legacy `main.css` ships these as fixed-pixel heights. Migrating to `aspect-ratio` is the right modernisation but must not change the visible image dimensions on the desktop layout. Verify against a wide-viewport screenshot before commit.

### 4.5 Slice — Family I (Video Page)  · Risk: Medium

**Selectors absorbed (3 STRUCTURAL rules in main.css + 2 in responsive.css + the lazy-video set)**: `.video-container`, `.video-container iframe`, `.video-grid`, `.video-item`, `.video-feature`, `.video-fallback-note`.

The `aspect-ratio: 16/9` + absolutely-positioned-iframe primitive on `.video-container` is one of the seven gating rules called out by the Codex 2026-05-12 review. The audit confirms it is still load-bearing. Lazy-video states (`.lazy-video-container`, `.lazy-video-trigger*`) already live in `globals.css:1393+`; only the parent video-container primitives migrate here.

**Pre-commit gates**:

- Cheap gates.
- `tests/static-export.spec.ts:727` (video section navigation) — preserve active-button behaviour.
- `tests/static-export.spec.ts:770` (video embeds load YouTube only after activation) — the lazy-load trigger must continue to work.
- `tests/static-export.spec.ts:617` (enhanced findings layout — no horizontal overflow): video chapters use `.mix-comparison-embed`, which is Family D, not I — coordinate but do not block.
- New body-smoke: assert `.video-container { aspect-ratio: 16/9 }` resolves on `/videos.html` after CSS migration. Without this gate the legacy `padding-top: 56.25%` fallback could be lost silently.

**Regression surface**: the `.video-feature` (single large featured video) layout vs `.video-grid` `.video-item` (grid layout) — these have distinct aspect-ratio handling in the legacy file. EnhancedVideoController binds to both; preserve both class hooks. The `.lazy-video-trigger__icon` already ships its play-button SVG composition (`globals.css:1439+`); do not duplicate.

### 4.6 Slice — Family H (Audio Surface)  · Risk: High

**Selectors absorbed (8 STRUCTURAL rules in main.css + 1 in responsive.css)**: `.audio-player`, `.audio-container`, `audio`, `.audio-controls`, `.mix-comparison-player`, `.mix-player`, `.mix-buttons`, `.mix-btn`, `.mix-btn.active`, `.mix-btn:hover`, `#comparison-player`, `#currently-playing`, `.comparison-player-container`, `.download-item`, `.download-item h4`, `.download-links`, `.download-link`, `.download-link-container`.

Most `.mix-btn` / `#currently-playing` / `#comparison-player` rules already live inside the `.audio-comparison` scope (`globals.css:997+`) because the `<AudioComparison>` React component owns them. The remaining D-1 work is the page-level audio chrome (`.audio-player`, `.download-item`, `.download-link-container`) used by the audio-page sections outside the React comparison player.

**Pre-commit gates**:

- Cheap gates.
- Existing Playwright at `tests/static-export.spec.ts:372` (audio comparison buttons switch source) and `:426` (enhanced controller reports unavailable audio) — both must pass unchanged.
- Existing Playwright at `tests/static-export.spec.ts:447` (findings chapter mix buttons use the enhanced controller) — Family H rules touch findings chapter audio embeds too via `.mix-comparison-embed` (which is technically Family D). Coordinate.
- The historical literal-`rgb()` audio-page assertions (audit §"Gating rules called out by prior reviews") — re-verify these are now token-bound rather than literal-rgb. If any literal-rgb assertions remain in the test file, retune them or document the rationale.
- New body-smoke: `.audio-player` and `.audio-container` resolve their structural primitives; `.download-link` has the correct pill-button colour (already token-bound — Slice I).

**Regression surface**: EnhancedAudioController binds to a documented set of class hooks (`.comparison-player-container`, `#comparison-player`, `.mix-btn`, `#currently-playing`, `.mix-comparison-player`, `.mix-button`, `.current-mix-name` — `EnhancedAudioController.tsx:145-178` per the deferred-scope doc). Any rule rename or removal here violates the binding contract. The legacy `<style>` block in `audio.html` (emitted via `LegacyStyles`) injects `!important` rules — coordinate the override specificity carefully.

**Why High**: the audio surface is named "load-bearing / high-risk" in the deferred-scope doc D-3 entry. D-1 here is not rewriting the controller (D-3's scope) but the structural CSS underneath it. Failure-mode: a subtle change to `.mix-comparison-player`'s flex layout breaks the controller's DOM-walking expectations and surfaces as a silent JS error on first interaction rather than a CSS regression. Human confirmation before push, per the High-risk protocol.

### 4.7 Slice — Family D (Findings Reader Chrome)  · Risk: High

**Selectors absorbed (50 STRUCTURAL rules in main.css)**: `.figure`, `.figure-caption`, `.audio-example-box`, `.audio-example-box audio`, `.pull-quote`, `.pull-quote::before`, `.pull-quote-content`, `.pull-quote-photo`, `.pull-quote-photo img`, `.pull-quote p`, `.pull-quote footer`, `.sidebar-box` (audit-flagged gating rule, main.css:487-510), `.sidebar-box strong`, `.chapter-nav`, `.chapter-nav .all-chapters`, `.chapter-content ul,.chapter-content ol`, `.chapter-content li`, `.chapter-content .endnotes`, `.chapter-content .endnotes li`, `.chapter-content .endnotes .backref`, `.glossary`, `.glossary dt`, `.glossary dd`, `.portrait`, `.portrait img`, `.author-bio`, `.author-bio::after`, `.chapter-section-nav`, `.chapter-section-nav h3`, `.citation-box`, `.citation-box strong`, `.citation-box p`, `.mix-comparison-embed` (+ descendants `h3`, `.embed-intro`, `.currently-playing`, `audio`, `.mix-button-group`, `.mix-button`, `.embed-note`).

Existing coverage: `EnhancedFindingsShell` already redefines `.enhanced-findings-shell #main-content .chapter-content`, `.figure:not(.portrait)`, `.endnotes`, `.content-section table` (`globals.css:1308+`). The findings sidebar (`.findings-reader-panel__*`) is fully owned by the React component, not by main.css. Family D's remaining D-1 scope is the chapter-body chrome that sits inside `#main-content` and remains driven by `main.css`: pull-quotes, sidebar-boxes, citation-boxes, portraits, glossary, the mix-comparison-embed block, and the chapter-section-nav.

The audit flags this as the largest family and recommends doing it last (audit §"Recommended migration sequence" step 7). This plan adopts that ordering. A natural sub-split — chapter-body chrome (pull-quote / sidebar / citation / portrait / glossary / author-bio) vs mix-comparison-embed (`audio` controller integration) vs chapter navigation (`.chapter-nav`, `.chapter-section-nav`) — is allowed as three sub-slices within Slice 4.7 if the diff size exceeds the dual-review attention budget; it does not require re-planning.

**Pre-commit gates**:

- Cheap gates.
- Existing Playwright suite around findings (`tests/static-export.spec.ts:498`, `:532`, `:557`, `:575`, `:617`, `:645`, `:684`, `:706`) — all must pass unchanged.
- The `aria-current="page"` selector preserved (deferred-scope doc D-4 names this as the a11y gate). The findings-reader-panel `[aria-current="page"]` rule already lives in `globals.css:1235+`.
- New body-smoke per chapter-body affordance: `.sidebar-box` (gating rule, main.css:487-510 — preserve callout structure), `.pull-quote::before` (decorative quote-mark — verify the pseudo-element still renders), `.glossary dt`/`dd` (definition-list layout), `.mix-comparison-embed` (audio controller hooks).
- The `.chapter-content` long-read column max-width — already constrained in `EnhancedFindingsShell` (`globals.css:1317`). Verify any Family D rule does not regress it.

**Regression surface**: `.sidebar-box` is a flagged gating rule — preserve the callout's structural shell exactly (border-left rule, padding rhythm, background). `.pull-quote::before` is a pseudo-element decoration; missing it is a quiet regression. `.mix-comparison-embed` integrates with EnhancedAudioController bindings — Family H's controller-binding contract extends here. `.chapter-section-nav` and `.chapter-nav` are wired by the legacy body scripts emitted via `<LegacyScripts content.bodyScripts>` — do not rename the class hooks.

**Why High**: 50 STRUCTURAL rules in a single family; the findings reader is the project's primary research-output surface; reader experience is sensitive to small layout drift in a way that no automated gate can catch fully. Human reviewer browser-pass on at least three chapters (intro, mid, glossary) before push.

### 4.8 Slice — Responsive Breakpoint Set  · Risk: Medium

**Selectors absorbed (32 STRUCTURAL rules in responsive.css)**: every STRUCTURAL rule in `/assets/css/responsive.css` — covers mobile-breakpoint overrides for the header (`.main-nav`, `.menu-toggle`, `.nav-links`), hero (`.hero` / `.chapter-hero` min-height + padding), team images, footer brand-logo sizing, project-aims grid, and image-sizing rules across `.team-photo`, `.partner-logo`, `.producer img`, `.artist img`, `.advisor-item img`, `.university-logo-container img`.

This slice sits second-to-last because each mobile breakpoint overrides the desktop layout the earlier slices establish. Splitting earlier (e.g. shipping each family's responsive variants with the family slice itself) risks leaving the responsive.css `<link>` partly in force, partly shadowed — a hybrid bug surface nothing in the gates can detect cleanly. By bundling all responsive overrides into one slice that lands after every desktop family, the cutover from responsive.css to `globals.css` mobile rules is a single observable event.

Existing coverage: hero mobile breakpoint (max-width: 720px) already ships for the home and inner-page heroes (`globals.css:585+`, `:812+`); the about-page aims-grid collapse breakpoint (max-width: 767px) ships at `globals.css:985+`. This slice absorbs everything else.

**Pre-commit gates**:

- Cheap gates.
- Existing Playwright at `tests/static-export.spec.ts:207` (mobile navigation can open and close) — must pass unchanged.
- The full Playwright suite run twice in CI — once at desktop viewport, once at mobile — to verify no regression at the breakpoint boundary (already configured per Playwright project setup).
- New body-smoke: at 480px and 768px viewports, assert `.main-nav` collapse, `.hero` reduced min-height, `.aims-grid` single-column.

**Regression surface**: the legacy responsive.css uses a single breakpoint at 767px throughout. The dark-academic CSS ships with multiple breakpoints (560px, 720px, 767px, 980px, 1440px, 1920px). The risk is that a rule at a non-767px breakpoint in `globals.css` interacts unexpectedly with a legacy rule at 767px — verify by checking each family's responsive coverage one more time at the breakpoint boundary.

### 4.9 Slice — Stylesheet `<link>` Retirement  · Risk: High (gate slice)

**Scope**: delete the two `<link rel="stylesheet" href="/assets/css/main.css">` and `<link rel="stylesheet" href="/assets/css/responsive.css">` tags from `nextjs-site/app/layout.tsx:21-22`. No CSS work in `globals.css`. No edits to `assets/css/*.css`. No deletion of files from disk (D-7 scope).

**Pre-commit gates** (all of D-1 by definition):

- `npm run typecheck`, `npm run build`.
- `npm run parity:content` across all 27 routes.
- `npm run parity:text` across all 27 routes — content unchanged.
- `npm run parity:visual` — the script currently covers zero routes (preservation set empty per `check-visual-parity.mjs:32`), so this passes trivially. **This slice is the right moment to re-record visual baselines against the fully-React-owned state** if the project wants visual-regression coverage going forward; that is a parallel decision, not a D-1 prerequisite.
- Full Playwright suite passes — all body-smoke tests added across slices 4.1–4.8 plus the existing 30+ tests.
- Network panel check on `npm run start` deploy: no requests for `/assets/css/main.css` or `/assets/css/responsive.css`. (This is the inverse of the Coexist slice's acceptance criterion #6.)
- Browser sanity-pass on at least: home, about, audio, videos, team, publications, contact, faq, privacy, acknowledgements, findings index, three findings chapters (intro / mid / glossary). Desktop + mobile viewport on each.

**Regression surface**: this is the single switchover. Failure-mode: a rule that was load-bearing but missed in the family migration disappears the moment the `<link>` is removed, and the regression surfaces somewhere unexpected. Mitigations: the 207-rule audit + the `Unclassified: 0` classifier contract; the per-family body-smoke gates; the cumulative browser sanity-pass across slices. The slice itself is trivial to revert (one commit removing two lines is one revert away).

**Why High**: cumulative-impact change. Even though the diff is two lines, the blast radius is every page on the site.

## 5. Acceptance Criteria for "D-1 Done"

D-1 is complete when all of the following hold simultaneously:

1. Both `<link rel="stylesheet">` tags for `/assets/css/main.css` and `/assets/css/responsive.css` are removed from `nextjs-site/app/layout.tsx`. (Slice 4.9.)
2. `npm run parity:content` and `npm run parity:text` pass for all 27 generated pages. (Content preservation contract.)
3. `npm run parity:visual` passes. The preservation set may be empty (status quo) or re-recorded against the new React-owned baselines (parallel decision); either is acceptable, but `parity:visual` exits 0 on a clean run.
4. The full Playwright suite (`npx playwright test`) passes across the desktop + mobile project configurations. Every existing test passes unchanged; the new body-smoke tests added across slices 4.1–4.8 also pass.
5. No visual regression observed in the human browser sanity-pass across all 11 redesigned pages and the remaining unredesigned pages (findings chapters not yet body-redesigned, etc.). "No visual regression" here means: no missing element, no broken layout, no contrast collapse, no controller binding broken. Token-driven re-skin work that is the natural consequence of D-1 absorbing palette-only rules along with structural ones is intentional and not a regression.
6. The classifier script (`nextjs-site/scripts/classify-css-families.mjs`) when re-run against the current state of the legacy stylesheets continues to report `Unclassified: 0`. This is defensive: if the legacy stylesheets were edited mid-D-1 (which they should not have been), an unclassified rule appears and the audit gate has to be re-issued.
7. The Network panel on a built `npm run start` deploy shows zero requests for the legacy stylesheet paths.
8. Each slice's commit message follows the dual-review template (Section 7).

## 6. Explicit Non-Goals

D-1 does **not** include any of the following:

- **D-7 (file deletion from disk)**: `/assets/css/main.css` and `/assets/css/responsive.css` remain on disk after D-1 lands. The deferred-scope record (`docs/nextjs-phase-2-design-refresh-future.md` §D-7) gates disk deletion on every page in the 27-page baseline having either been intentionally redesigned with a new visual baseline OR confirmed retired. That work is not D-1's scope and would orphan parity baselines if done prematurely.
- **D-3 (audio dark-first re-skin)**: D-1 absorbs the page-level audio chrome (Family H) but does not rewrite EnhancedAudioController, does not introduce a new `<AudioComparison>` markup, does not re-skin the comparison player surface beyond what already ships. The D-3 gating constraints (real React component owning markup, Playwright assertions tied to tokens, High-risk protocol) remain unaddressed.
- **D-4 (findings sidebar re-skin)**: the findings sidebar is owned by EnhancedFindingsShell and the `[aria-current="page"]` a11y selector is preserved as-is in D-1's Family D slice. Restyling the sidebar to numbered prefixes in mono / chapter titles at two distinct sizes is D-4 scope.
- **D-5 (View Transitions API)**: not touched in D-1. Requires the `viewTransition: true` config spike that D-5's gate names.
- **D-6 (sonic-visualisation decorations)**: not touched in D-1. Inherits D-3's gating constraints.

If during a D-1 slice the team realises a deferred item's gating constraint has incidentally been resolved (e.g. a real `<AudioComparison>` already exists, which is the case at `src/site/components/AudioComparison.tsx`), the corresponding deferred item is **not** re-opened in the same slice. Re-open it as a separate proposal that cites the gate as resolved.

## 7. Re-Entry Checklist Alignment

The deferred-scope record (`docs/nextjs-phase-2-design-refresh-future.md`) lists four re-entry conditions for any D-1 through D-7 proposal:

1. **The v2 Coexist slice has shipped and is stable in production.** Coexist shipped at commit `794901f` (Slice E, 2026-05-13). Subsequent commits through Slice N (`6e2e995`) are non-breaking enhancements layered on the same Coexist principle. The 2026-05-18 production deploy is the most recent externally-visible event. Before Slice 4.1 opens, the team should observe the deploy for ~24 hours (through 2026-05-19) for any error reports, analytics anomalies, or user-visible regressions. The Matomo analytics endpoint (`https://analytics.himmp.net/`) and any Hostinger error logs are the relevant observables. If observation is clean through 2026-05-19, condition 1 is satisfied.

2. **The gating constraints named under the relevant deferred item are addressed in the new proposal.** D-1's gate is the structural-coverage audit at `docs/nextjs-phase-2-d1-main-css-audit.md`. This plan cites it explicitly (Section 1.2, Section 4 per slice) and the audit's `Unclassified: 0` contract is the coverage guarantee that lets the family migration ship slice-by-slice without silently losing rules.

3. **The new proposal cites this file and explicitly states which gating constraints it claims to have resolved.** This plan cites `docs/nextjs-phase-2-design-refresh-future.md` §D-1 and confirms the audit deliverable is in place. The seven gating rules called out by the v1 Codex review are each named in a slice (Section 1.2).

4. **The new proposal is routed through both `feature-dev:code-reviewer` and Codex.** Section 8 below establishes that per-slice.

## 8. Dual-Review Protocol Per Slice

Every slice in Section 4 — including the gate slice 4.9 — runs the dual-review protocol from `CLAUDE.md` §"Dual-review protocol (every slice — visual refresh or page port)". This is a blocking requirement before commit:

1. **Internal review**: spawn `feature-dev:code-reviewer` via the `Agent` tool with `run_in_background: true`. Brief with the slice's exact file changes, the constraint set (additive only; no markup edits; no controller binding changes; content-preservation contract verbatim), and the SEVERITY contract from the workspace `reviewer` mode.

2. **Codex review**: run `node ~/.claude/plugins/cache/openai-codex/codex/*/scripts/codex-companion.mjs adversarial-review --background --prompt-file <path>` with a markdown prompt that embeds the slice context, what changed, focus areas, and the full uncommitted diff inline. Use `/codex:adversarial-review` (not `/codex:review`) for Slices 4.6, 4.7, 4.9 (the High-risk slices); `/codex:review` is acceptable for Low and Medium slices but adversarial-review is strictly safer.

3. **Integrate findings**: union both reviewers' findings. Fix substantive issues before commit. Re-run dual review on the fixed diff if the fix is more than a one-character change.

4. **Commit message** follows the project template:

```
Slice <letter> (Family <X>, D-1): <one-line summary>

<body — what migrated, why, regression surface watched>

## Review (both passes pre-commit)
- Internal feature-dev:code-reviewer: <summary or "no findings">
- Codex adversarial-review: <verdict or "no findings">
```

5. **High-risk slice protocol** (4.6 audio, 4.7 findings, 4.9 gate): Claude commits locally; human confirms before push. The commit can land in the local worktree but no push happens until a human reviewer has confirmed the browser sanity-pass.

## 9. Sequencing Summary

| Slice | Family | Risk | Sub-split allowed? |
|---|---|---|---|
| 4.1 | J Contact form | Low | No |
| 4.2 | L Affordances + cards | Low | Optional (accordion + callout + chapter-card as 3 sub-slices) |
| 4.3 | G Publications | Medium | No |
| 4.4 | F Team grid | Medium | No |
| 4.5 | I Video page | Medium | No |
| 4.6 | H Audio surface | High | Optional (page chrome / download-link / mix-comparison-embed as 3 sub-slices) |
| 4.7 | D Findings reader | High | Recommended (chapter-body chrome / mix-comparison-embed / chapter-nav as 3 sub-slices) |
| 4.8 | responsive.css full set | Medium | No — bundled by design |
| 4.9 | `<link>` retirement | High | No |

Total: 9 slice commits at minimum; up to 14 if Slices 4.2, 4.6, 4.7 are sub-split. Each commit ships independently through the dual-review protocol. A realistic calendar at one slice per working session is 2–3 weeks; faster if multiple low-risk slices are batched into a single review cycle with the user's approval.

End of plan.
