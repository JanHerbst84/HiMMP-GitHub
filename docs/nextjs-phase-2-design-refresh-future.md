# HiMMP Next.js Phase 2 — Visual Design Refresh, Deferred Scope

Date: 2026-05-12
Purpose: preserve the larger design-refresh ambitions that v1 of the plan included, alongside the reviewer findings that gated them, so a future agent can re-propose them with their eyes open.

This file is **a record, not a backlog**. Items here are not "todo someday." They are scope that was reviewed, rejected as written, and will only return if the gating constraints below have first been resolved. Each item names its blocker so a future planner does not waste cycles re-discovering it.

## Source

- v1 plan: `docs/nextjs-phase-2-design-refresh-plan.md` (now replaced by the v2 "Coexist" slice).
- Reviews dated 2026-05-12: internal `feature-dev:code-reviewer`, Codex adversarial review. Codex verdict on v1: REJECT-AS-WRITTEN.
- Live site review: `https://www.himmp.net` (homepage, audio, findings, team) screenshots and Playwright DOM inspection performed 2026-05-12.

## Active-Direction Hypothesis (not yet committed)

If/when the project decides to commit to a final art direction, the live review suggested **dark-academic with restrained sonic-visualisation accents** as the strongest fit for an AHRC-funded research site that should not look like a band site. Indicative palette: graphite `#111418`, bone `#F2EFE8`, mint `#5DC69F` demoted to hairline accent (max ~2 % of pixels), sulfur `#E8C547` reserved for audio "playing" states. Indicative type: Fraunces display + Source Serif 4 long-read body + Inter Tight UI + JetBrains Mono numerals.

These are hypotheses, not decisions. Nothing in the v2 slice locks them in.

## Deferred Workstreams

### D-1: Replace `/assets/css/main.css` In The Live Pages

What was proposed: remove the raw `<link rel="stylesheet" href="/assets/css/main.css">` from `app/layout.tsx` and cover the legacy `<main>` content with a "legacy bridge" stylesheet that re-skins it via design tokens.

Why it was rejected: the legacy stylesheet provides **structural** layout, not just palette and typography. Both reviewers flagged this at HIGH confidence.

Specific structural rules in `assets/css/main.css` that any replacement must reproduce before the legacy file can be unloaded:

- `.container` width and padding (`main.css:74-79`).
- `.hero` flex layout, min-height, and overlay stack (`main.css:292-326`).
- `.section-grid` grid layout (`main.css:673-677`).
- `.video-container` aspect-ratio iframe positioning (`main.css:1045-1061`).
- `.sidebar-box` callout styling (`main.css:487-510`).
- `.read-more` link affordance (referenced from multiple legacy pages).
- The full `responsive.css` mobile breakpoint set.

Gating constraint: a structural-coverage audit must be completed and signed off before this work is proposed again. The audit must enumerate every selector in `main.css` and `responsive.css`, classify each as "palette/type only" (safe to override) versus "layout/structure" (must be ported), and produce a test fixture per legacy page that verifies the bridge covers the structural set. Until that audit exists, this workstream stays here.

### D-2: Home-Page Hero Replacement (React Component)

**Status update (2026-05-12):** The visual refresh of the home hero has shipped as D-2a (commit forthcoming) via a non-invasive CSS-scoped approach: a `[data-page="home"]` attribute on a `display:contents` wrapper in `app/page.tsx`, plus token-driven CSS in `globals.css`. No markup change; JSON-LD selectors remain intact. The legacy `<main>` is rendered verbatim through `LegacyMainHtml`. D-2 proper — extracting the hero into a real `<HomeHero>` React component that owns its own JSX — remains deferred for any future slice that needs to add hero-specific interactivity (e.g. scroll-linked motion, in-place mix-snippet auditioning). The gating constraints below still apply if/when that work is opened.

**Status update (2026-05-13, D-2c):** The data-page allowlist is extended to cover the remaining legacy pages with a `.hero` section — audio, videos, contact, faq, privacy, acknowledgements. Findings (root index and chapter sub-routes) is intentionally excluded: chapter sub-pages use `<section class="chapter-hero">` with descendant `.hero-title` / `.hero-text` class hooks, so a `data-page="findings"` allowlist entry would cascade onto every chapter. Findings deserves its own dedicated slice that handles index-vs-chapter heros explicitly. The inner-hero CSS block is refactored to use `:is(...)` for the allowlist so the selector list is maintained in one place across all nine rule blocks (specificity unchanged: `:is()` adopts the max specificity of its arguments, here 0,1,0). Parity mask extended with `HiMMP-bg-contact.jpg` (covers contact + privacy); the other three new pages reuse `HiMMP-bg-welcome.jpg` (videos, faq, acknowledgements) or `HiMMP-bg-about.jpg` (audio) which are already masked.

**Status update (2026-05-13, D-2b):** D-2b extends the same CSS-scoped pattern to the four primary inner pages — about / approach / team / publications. The catch-all `app/[...segments]/page.tsx` now wraps its render in a `[data-page="<slug>"]` `display:contents` div (slug derived from the first non-empty route segment, falling back to `home`). One generalised CSS block in `globals.css` targets the allowlist of four data-page values, leaving every other legacy page (audio/videos/contact/faq/privacy/acknowledgements) on its original hero chrome. The visual-parity mask in `scripts/check-visual-parity.mjs` is extended in the same PR to hide the four redesigned heroes via their distinct background-image substrings (`HiMMP-bg-about.jpg`, `HiMMP-bg-approach.jpg`, `HiMMP-bg-team.jpg`, `HiMMP-bg-publications.jpg`). Markup unchanged on all four pages; no JSON-LD selectors on any of them depend on hero classes (verified by grep). D-2 proper (real React `<HomeHero>` / `<InnerHero>` components) stays deferred.

What was originally proposed: extract the legacy `.hero` section from `index.html`'s injected `<main>` and slot a real React `<HomeHero>` in its place, while leaving the rest of the page legacy-rendered.

Why it was rejected: today `getLegacyPageContent()` exposes only one complete `mainHtml` string (`legacy-content.ts:27-39`, `:253-269`), and `app/page.tsx` injects that whole `<main>` wholesale. To extract only the hero requires either (a) HTML parsing in `legacy-content.ts`, or (b) string surgery in `page.tsx`. The v1 plan claimed both `legacy-content.ts` and `page.tsx` would stay untouched while still doing the extraction — internally inconsistent.

Secondary blocker (Codex finding 7): the homepage JSON-LD `SpeakableSpecification` references CSS selectors `.hero-title` and `.hero-text` (`index.html:166-169`). JSON-LD is re-emitted from the legacy source via `legacy-content.ts:267-268`. A replacement hero that drops or renames those classes leaves structured-data selectors stale even when visible-text parity passes — a quiet SEO regression on an AHRC-funded site that has invested deliberately in structured data.

Gating constraints, both required:

- A proper HTML-fragment extraction utility in `legacy-content.ts` (or a sibling module), with tests covering selector-based slicing of legacy `<main>` content.
- Either preserve the legacy `.hero-title` / `.hero-text` class hooks on the new React component, or migrate the JSON-LD `SpeakableSpecification` to reference the new selectors as part of the same PR. Either path is acceptable; the v1 plan did neither.

### D-3: Audio Page Dark-First Re-Skin

What was proposed: re-skin `/audio.html` chrome dark-first (graphite background, bone text, sulfur "playing" state on active mix buttons), plus a CSS waveform-strip decoration above the comparison player. Plan claimed it was "visual-only" with no controller-binding changes.

Why it was rejected:

- `EnhancedAudioController` binds to specific class hooks: `.comparison-player-container`, `#comparison-player`, `.mix-btn`, `#currently-playing`, `.mix-comparison-player`, `.mix-button`, `.current-mix-name` (`EnhancedAudioController.tsx:145-178`). Re-skinning that wraps or restructures markup violates the binding contract. The waveform-strip decoration cannot be placed structurally adjacent to `.comparison-player-container` from a React component outside the legacy blob without DOM querying after hydration — the same pattern the plan claimed to avoid.
- The existing Playwright test `tests/static-export.spec.ts:268-270` asserts **literal** `rgb()` values on the audio page (`rgb(31, 41, 51)` for inactive Bogren, `rgb(255, 255, 255)` for active HiMMP). Any palette change deterministically breaks it. The v1 plan's "existing e2e tests pass unchanged" acceptance criterion was therefore false.
- Per the project `.claude/CLAUDE.md` `code-delegation` mode, the audio surface is **load-bearing / high-risk**. v1 misclassified it as medium, which would have under-gated the review/push protocol.

Gating constraints, all required:

- A real `<AudioComparison>` React component that owns its own markup and state, replacing the DOM-bound `EnhancedAudioController` entirely. Half-measures (re-skin while keeping controller bindings) do not survive review.
- The audio-page Playwright assertions are updated in the same PR, with the new expected colors tied to token values, not literal `rgb()` strings.
- Risk class set to **high**. Codex review with `/codex:adversarial-review` (not `/codex:review`) before merge. Human confirmation before push, per the high-risk protocol.

### D-4: Findings Sidebar Re-Skin

**Status update (2026-05-18): SHIPPED — closed as implemented across Slices E–F + the `EnhancedFindingsShell` introduction.**

What was originally proposed: re-skin the findings reader sidebar — numbered prefixes in mono, chapter titles in display serif at two distinct sizes, active state on a left hairline rule rather than a tinted background.

What actually shipped (`globals.css:1164–1248`):

- Numbered prefixes in mono — `.findings-reader-panel__nav-num` uses `var(--font-mono)`, mono `0.74rem`, muted graphite, tabular-nums. ✓
- Chapter titles at a distinct second size — `.findings-reader-panel__nav-title` uses `0.96rem` with weight `500`. ✓ on the second-size point.
- Active state on a left hairline rule rather than a tinted background — `.findings-reader-panel__nav a[aria-current="page"]` sets `background: transparent; border-left-color: var(--color-mint)` with the resting state already declaring `border-left: 2px solid transparent`. ✓
- The `[aria-current="page"]` selector hook is preserved verbatim (a11y gating constraint satisfied).

Deliberate adaptation from the original spec: chapter titles render in **Inter Tight (body sans-serif)**, not Fraunces (display serif). The `html .findings-reader-panel__nav-title { font-family: var(--font-body), ... }` override at `globals.css:302` raises specificity over the later 0.96rem rule to enforce sans. The rationale is legibility — Fraunces at 0.96rem inside a narrow ~260px column read as cramped and lower-contrast than Inter Tight at the same size. If the project wants to revisit display-serif in the sidebar, swap the `html`-prefixed override at line 302 to use `var(--font-display)`; that is a one-line change.

No outstanding D-4 work. The within-chapter "On this page" TOC affordance (a related-but-distinct surface) is now tracked separately as D-8.

### D-5: View Transitions API + Page Transitions

What was proposed: page transitions via the View Transitions API; tokens.css motion durations would do the work.

Why it was deferred: the View Transitions integration in Next.js 16 requires `viewTransition: true` in `next.config.ts` (currently absent) and is documented as experimental, not recommended for production. The v1 plan referenced motion durations without wiring the config flag and without specifying where the per-route `<ViewTransition>` boundaries live. The setup cost was understated.

Gating constraint: a separate spike on `viewTransition: true` in a branch with at least two real route boundaries before this is proposed as part of a refresh plan. The spike must measure first-paint impact on the existing static export and confirm `prefers-reduced-motion` actually bypasses the transition (not just the duration).

### D-6: Sonic-Visualisation Decorations

What was proposed: a CSS-only procedural waveform strip on the audio page (zero JS cost); longer-term, generative SVG/canvas glyphs derived from real audio features (RMS envelope, spectral centroid trace) per section.

Why it was deferred: the procedural version is tied to D-3 (audio page re-skin) and inherits its gating constraints. The feature-derived version requires offline audio analysis to generate per-stem assets — outside the scope of any visual-refresh slice.

Gating constraint: defer until at least one real `<AudioComparison>` component is in place (D-3). A feature-derived version is a Phase 3 conversation, not Phase 2.

### D-8: Within-Chapter "On This Page" TOC As A React Component

Date added: 2026-05-18.

What was previously in place: 14 of 15 findings chapters (all except `glossary.html`) shipped an inline body `<script>` that, on `DOMContentLoaded`, scanned `.chapter-content` for `<h2>` headings, slugified their text into `id` attributes, and prepended a `<nav class="on-this-page">` TOC with anchor links.

Why it was removed (Slice P, commit 2026-05-18): the DOM-mutation ran before React hydration on the static export, causing a `#418` hydration mismatch (`<nav>` injected where the React tree expected the chapter's first `<p>`). The fix bakes the slugified h2 IDs into `EnhancedFindingsShell`-rendered HTML at port time (via `scripts/port-findings-chapters.mjs`) and strips the inline TOC-building script.

What is missing: the visible "On this page" navigation aside is no longer rendered on any chapter route. The `EnhancedFindingsShell` sidebar covers chapter-to-chapter navigation but not within-chapter section navigation (linking to `<h2>` landmarks inside the current chapter). For long chapters (`01-introduction.html`, `08-drums.html`, `10-spatial.html` and others with 4+ headings), readers have lost a scanning affordance.

Gating constraints:

- The replacement must be a React component, not a DOM-mutation script.
- It must consume the h2 IDs that `port-findings-chapters.mjs` now bakes into chapter components (no runtime DOM scan; read from a static heading list passed from the chapter component or derived at build time).
- It must preserve the legacy class name `.on-this-page` and `aria-label="On this page"` if any external CSS in `main.css` styles those selectors (verify via the D-1 audit before opening this slice).
- No hydration mismatch — the component renders identically on SSR and client.

This is properly a Family L (affordances + cards) sub-slice within D-1 and should be opened after Family L lands. Until then, readers rely on the chapter's natural h2 visual hierarchy + the `EnhancedFindingsShell` sidebar.

### D-7: Stylesheet Removal And `public/assets/` Cleanup

What was proposed: stop loading the legacy stylesheet (D-1) and, eventually, remove it from disk.

Why it stays deferred even after D-1 lands: the legacy stylesheet is also the reference asset for `parity:visual` regression captures of legacy-rendered pages. Removing it from disk before every page has been intentionally redesigned would orphan the parity baselines. A removal must be paired with a redirect of parity captures to the redesigned baselines and a definition of what the regression contract is in the post-legacy world.

Gating constraint: not before every page in the 27-page baseline has either (a) been intentionally redesigned with a new visual baseline, or (b) been confirmed retired.

## What This File Does Not Promise

- That any of D-1 through D-7 will be implemented at all. The project may choose to stay coexist-first indefinitely; that is a valid end-state for an AHRC-funded research site whose primary deliverable is its content, not its visual identity.
- That the dark-academic art direction is the final choice. It is the strongest hypothesis from the 2026-05-12 review; a future stakeholder conversation can override it.

## Re-Entry Checklist For A Future Agent

Before proposing work in any of D-1 through D-7, confirm:

1. The v2 Coexist slice has shipped and is stable in production.
2. The gating constraints named under the relevant deferred item are addressed in the new proposal.
3. The new proposal cites this file and explicitly states which gating constraints it claims to have resolved.
4. The new proposal is routed through both `feature-dev:code-reviewer` and Codex (`/codex:review` for the smaller items, `/codex:adversarial-review` for D-3 specifically) before any code lands.

End of deferred-scope record.
