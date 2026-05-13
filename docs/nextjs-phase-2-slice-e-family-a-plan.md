# Phase 2 Slice E — Family A (Document Chrome), Dark-Academic Foundation

Date: 2026-05-13
Status: DRAFT — awaiting user sign-off before any code lands.

## Context

The Phase 2 page-port migration completed at commit `32877ad`. All 27 routes
are React-owned. The next phase is visual design — propagating the
dark-academic direction (graphite / bone / mint / sulfur, Fraunces + Inter
Tight + JetBrains Mono) beyond the heroes into the rest of the site.

This slice is **D-1, Family A** in the audit at
`docs/nextjs-phase-2-d1-main-css-audit.md`. Family A covers document
chrome: base reset, `body`, `.container`, headings, paragraph spacing. The
audit names it "foundational; every other port depends on it."

User decisions (2026-05-13):

- Direction: commit to dark-academic.
- Body treatment: bone paper (`#F2EFE8`), graphite ink (`#111418`).
- Scope: additive only — no edits to `assets/css/main.css`. Token-driven
  overrides land in `app/globals.css` with specificity that beats the
  legacy chrome via inheritance.

## What ships in this slice

### 1. Body chrome (additive override in `app/globals.css`)

Replace the current placeholder body rule (line 12 of `app/globals.css`:
`body { background: #f6f6f6; font-family: Arial, ...; color: #111; }`)
with a token-driven dark-academic rule:

```css
body {
  margin: 0;
  font-family: var(--font-body), -apple-system, BlinkMacSystemFont,
    "Segoe UI", Helvetica, Arial, sans-serif;
  background: var(--color-bone);
  color: var(--color-graphite);
  line-height: 1.6;
}
```

`line-height: 1.6` matches the legacy `body { line-height: 1.6 }` rule
from `main.css` Family A so we do not regress the body-text rhythm.

### 2. Heading typography (additive)

Apply Fraunces to body-level headings while leaving the heading-size
cascade from `main.css` intact (sizes are palette-only per the audit and
can ride along):

```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display), Georgia, "Times New Roman", serif;
  color: var(--color-graphite);
  letter-spacing: -0.012em;
}
```

The hero `.hero-title` rules in `[data-page=X] .hero-title` already
override font-family and colour for the dark hero context; their
specificity (0,1,1) beats this rule's (0,0,1) so heroes stay bone-on-
graphite.

### 3. Link affordance (additive, body-level only)

```css
body a:not(.skip-to-content):not(.read-more):not(.resource-button) {
  color: var(--color-graphite);
  text-decoration: underline;
  text-decoration-color: var(--color-mint);
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}
body a:not(.skip-to-content):not(.read-more):not(.resource-button):hover {
  text-decoration-color: var(--color-graphite);
}
```

The `:not()` exclusions preserve the legacy pill-button affordances
(`.read-more`, `.resource-button`) and the skip-to-content control,
which have their own colour/decoration treatment in Family L and Family
A respectively.

### 4. Mono numerals on tables (additive, palette-only)

```css
.content-section table {
  font-variant-numeric: tabular-nums;
}
.content-section table td:where([class*="num"], [data-numeric]) {
  font-family: var(--font-mono), ui-monospace, Menlo, Consolas, monospace;
}
```

(Future tables can opt in with `data-numeric` on numeric cells. Existing
tables get tabular-nums for free, no markup change.)

### 5. Visual-parity preservation set: drop the 11 redesigned routes

The current `nextjs-site/scripts/check-visual-parity.mjs` preserves 11
routes by RMSE-comparing legacy and Next renders. A body-level chrome
change deliberately diverges the Next render from the legacy. Per the
documented pattern (about-body slice, `tests/static-export.spec.ts:222`),
drop these routes from the preservation set and replace them with
Playwright body-smoke tests that assert the redesigned primitives.

Routes to drop: `/index.html`, `/approach.html`, `/publications.html`,
`/videos.html`, `/audio.html`, `/faq.html`, `/findings.html`,
`/findings/01-introduction.html`, `/findings/09-guitars-bass.html`,
`/findings/14-recommended-reading.html`, `/findings/glossary.html`.

After this slice, `parity:visual` covers zero routes. That is the
correct end-state for a site that has been intentionally redesigned —
the audit doc anticipates this. We keep the script and the
`.migration/visual-parity/` baselines for reference; the next slice that
wants to re-introduce visual regression coverage will record new
baselines against the redesigned state.

### 6. Playwright body-smoke for the dropped routes

Add a single parameterised test in `tests/static-export.spec.ts` that,
for each dropped route, asserts:

- `body` background-color resolves to the bone token.
- `body` color resolves to the graphite token.
- `body` font-family contains "Inter Tight".
- The route's primary heading (h1) font-family contains "Fraunces".

This is a thin gate — it does not assert visual fidelity, just that the
dark-academic chrome is actually applied. Per-page deeper smokes (like
the about-body test) come with the per-page redesign slices.

## What does NOT ship in this slice

- No edits to `assets/css/main.css` or `assets/css/responsive.css`. The
  legacy stylesheets stay loaded; we layer over them.
- No Family B (header), C (hero — already done), D (findings reader),
  etc. Those are subsequent slices.
- No retirement of palette-only Family A rules. The audit says
  "opportunistically as families land"; that is for later.
- No new `[data-page]` scoping. Family A is genuinely site-wide.
- No `parity:visual` baseline re-recording. The script is left intact
  for the next slice that wants to use it.

## Verification gates (in order)

```sh
cd nextjs-site
npm run typecheck
npm run build
npm run parity:content        # title/description/h1/JSON-LD counts — unaffected
npm run parity:text           # visible-text byte-compare — unaffected (CSS only)
npm run parity:visual         # 0 routes after the preservation-set edit → passes trivially
npx playwright test           # includes the new body-smoke
```

Then **browser sanity-check at http://localhost:4180** for at least:

- Home (`/index.html`) — hero-to-body transition.
- Findings chapter (`/findings/01-introduction.html`) — long-read
  legibility on bone background.
- Audio (`/audio.html`) — comparison player visibility under new chrome
  (no controller-binding changes; this is a visual sanity check only).
- Mobile viewport on any of the above via DevTools.

If anything looks wrong in the browser, the gates are not a substitute
for human judgment — back out and re-think before commit.

## Dual review (blocking, both must run before commit)

Per `.claude/CLAUDE.md`:

- **Internal review** — `feature-dev:code-reviewer` agent in background
  with the full diff and the constraint set (additive only; no markup
  changes; preserve `.hero-title`/`.hero-text` and Family L affordances).
- **Codex adversarial review** — `codex-companion.mjs adversarial-review
  --background --prompt-file <path>` with a markdown brief.

Take the union of findings. Substantive fixes → re-run dual review.

## Risk class

**Medium.** Site-wide CSS change but additive, no markup changes, no
controller-binding changes, no schema/auth/payments. Reversible by
deleting the new rules from `globals.css`. Dropping routes from
parity:visual is reversible by reverting the script edit. The Playwright
body-smoke is the new safety net.

## Open questions / hypotheses to validate in the browser

- Bone (`#F2EFE8`) at 100% body coverage may feel too warm against the
  graphite hero. If so, tune toward a cooler off-white (e.g.
  `#F4F2EC`) in a follow-up — not in this slice.
- The mint underline on body links may collide with the existing
  `.content-section a { font-weight: 600; text-decoration: underline; }`
  rule (which uses default underline colour). The `body a:not(...)`
  rule has equal specificity (0,0,1 + :not() doesn't add) — content-
  section's compound selector (0,0,2) actually wins. Need to verify in
  browser whether the mint underline shows up where expected, and if not,
  raise our rule's specificity (e.g. `body :is(a):not(...)` or add a
  `.content-section` variant).

These are real things to look at in the browser sanity-check, not gates
to fail the slice.

## Commit message template

```
Slice E (Family A): dark-academic document chrome

Apply token-driven body chrome (bone background, graphite ink, Inter
Tight body, Fraunces headings, mint-underlined links) site-wide via
additive rules in app/globals.css. Drop the 11 redesigned routes from
parity:visual; replace with a parameterised Playwright body-smoke that
asserts the chrome tokens are applied.

Family A from docs/nextjs-phase-2-d1-main-css-audit.md. No markup
changes; no edits to assets/css/main.css; no controller bindings
touched.

## Review (both passes pre-commit)
- Internal feature-dev:code-reviewer: <summary>
- Codex adversarial-review: <verdict>
```
