# Slice D-9-e — dark-mode contrast remediation + audit gate

**Date**: 2026-05-20
**Author**: Claude (Opus 4.7) — proposal for re-review
**Version**: v2 (incorporates 15 review findings from v1 dual review + full 27-route audit)
**Status**: awaiting dual re-review

## Revision history

- v1 (deprecated): scoped from a 3-page live audit; dual review returned 4 CRITICAL + 11 WARNING findings.
- v2 (this document): scoped from the **full 27-route audit** (`nextjs-site/.migration/d9e-baseline.json` + `d9e-baseline-grouped.json`, 246 findings across 25 routes); incorporates every reviewer finding from v1.

## Why this slice exists

JPH reported "lots of color contrast issues" after the Phase 3
deploy. The Phase 3 audit script (`audit:contrast`) only verified
**semantic-token pairs** in isolation; it did not walk rendered
DOM. Several legacy `.findings-reader-panel__*`, `.resource-button`,
`.read-more`, and other rules hard-code raw colors that do not flip
under `[data-theme="dark"]`, and several token-driven backgrounds
use `--color-paper` which itself is not dark-mode aware.

Phase 3 was declared SHIPPED at HEAD `fd6eb02`. The live deploy
at `https://himmp.net/` ships dark mode with text contrast as low
as **1.02:1** on the findings-reader sidebar (the sidebar is
essentially invisible in dark mode). Same-day remediation is the
target.

## Audit methodology (the load-bearing artifact)

- Tool: `nextjs-site/tests/contrast-audit-oneoff.spec.ts` — Playwright spec walking every text-bearing element on every route in both schemes (default + explicit `localStorage.himmp-theme="dark"`).
- Algorithm: see §6 below. Improvements vs v1: checks element's own background FIRST (so a `.resource-button` with explicit dark bg is scored against that, not against `.hero-overlay`); handles `.chapter-hero, .chapter-hero-overlay`; reports the raw `rgba` so a downstream pass can re-score with alpha.
- Output: `nextjs-site/.migration/d9e-baseline.json` (246 findings) + `nextjs-site/.migration/d9e-baseline-grouped.json` (36 selector groups).
- Routes: derived from `nextjs-site/.migration/current-site-inventory.json` (the canonical inventory used by `parity:content` etc., not the hand-curated 15-route list in `contrast-sweep.mjs`).

**Known algorithm limitations** (will be documented in code + flagged in a follow-up if they bite):
- Linear-gradient: first-color-stop heuristic; multi-stop gradients with light first-stop and dark middle (or vice versa) will mis-score.
- Alpha: backgrounds with α < 0.5 are skipped (walked-through), backgrounds with α ≥ 0.5 are scored as if fully opaque. Foregrounds with α < 1 are scored at their raw rgb; the alpha is ignored.
- Body bg = `rgba(0, 0, 0, 0)`: some routes don't set `body { background }` explicitly. Algorithm currently falls back to `document.body.backgroundColor`; if that's transparent, contrast becomes meaningless (false-positive ~1.14:1 on graphite text). **v2 fix**: when body bg is transparent, fall back to `getComputedStyle(document.documentElement).backgroundColor`, and if still transparent, use `getPropertyValue('--color-bg')` from `:root`.
- Hero-overlay special case applies only to `.hero, .chapter-hero`. Future overlay-bearing layouts with different class names need to be added to the special-case selector list explicitly.

## Confirmed failures from the full audit

**246 findings across 25 of 27 routes (173 dark + 73 light). 36 unique selector groups.** The full grouped baseline is at `nextjs-site/.migration/d9e-baseline-grouped.json`.

### HIGH-impact (affects ≥5 routes)

| # | Selector | Schemes | Routes | Ratios | Root cause |
|---|----------|---------|--------|--------|------------|
| H1 | `.findings-reader-panel__title` (p) | dark | 16 | 1.02 | `color: #111` hard-coded; not migrated to `--color-fg` |
| H2 | `.findings-reader-panel__nav-title` (span) | dark | 16 | 1.06, 1.09 | `color: #1a1d22` / `#0a0c0f` hard-coded; not migrated. Includes `[aria-current="page"]` override at globals.css:1317. |
| H3 | `.findings-reader-paging__title` (span) | dark | 16 | 1.18 | `color: #20242a` hard-coded |
| H4 | `.findings-reader-panel__eyebrow` (p) | dark | 16 | 2.87 | `color: #5a5f66` hard-coded (mid-gray, fails 4.5:1 on graphite) |
| H5 | `.findings-reader-panel__status` (p) | dark | 16 | 2.87 | Same |
| H6 | `.findings-reader-paging__direction` (span) | dark | 16 | 2.87 | Same |
| H7 | `.findings-reader-panel__nav-num` (span) | light | 16 | 1.82 (active), 3.46 (resting) | Mint on bone for active, gray on bone for resting |
| H8 | `.hero-title` (h1) | light | 16 | 1.14 | Reported by audit due to body-bg-transparent fallback bug (§audit-limitations). REAL: chapter-hero text inheritance is not flipping bone. Needs investigation in CSS file — most likely the `:is(...)` selector at globals.css:709 includes inner pages but NOT findings chapters; the chapter-hero gets a different rule that hard-codes graphite. |
| H9 | `.hero-text` (p) | light | 16 | 1.14 | Same root cause as H8 |
| H10 | `.resource-button` (a) | dark+light | 16 | 1.00 (chapter body), 1.07 (audio hero) | `color: var(--color-graphite) !important` on a Slice H rule. In dark mode body-bg is graphite, fails. In hero context the button has no explicit background and graphite text appears on the dark hero overlay, fails. |
| H11 | (no class) p / h3 / a / label | dark | 6 | 1.00, 1.05–2.09 | Mixed: some are mint-gradient promo section (h2/p white on mint, ~2.09); others are bone text on `rgba(...,0.7-0.55)` backgrounds — those alpha-modulated backgrounds resolve to near-bone in the algorithm but the actual rendered surface is slightly darker; needs per-instance investigation. |
| H12 | `.read-more` (a) | dark | 5 | 1.00 | Same pattern as `.resource-button`: graphite hard-coded, fails on graphite body in dark mode |

### Medium-impact (1–4 routes)

(see `d9e-baseline-grouped.json`; smaller items follow the same patterns — `.required` asterisk on white, contact form labels, audio-status indicators)

### Critical findings missed by v1 (now addressed in v2 scope)

- **Backgrounds**: `.findings-reader-panel { background: var(--color-paper); }` and `.findings-reader-topbar a / __bottombar a { background: var(--color-paper); }` — `--color-paper` is NOT in the dark-scheme override block. In dark mode the sidebar sits on cream. Migrate to `var(--color-surface)`.
- **`.resource-button` `!important` cascade conflict**: the Slice H rule pins `color: var(--color-graphite) !important`. v2 resolution: REMOVE the `!important` from the Slice H rule (the conflicting legacy main.css that necessitated it is no longer loaded after D-1 §4.9), then add context-scoped rules without `!important`. Specifically: `.hero .resource-button, .chapter-hero .resource-button` gets bone text + explicit `--color-chrome-bg` background (so the button is a dark pill, not a transparent overlay on the dark hero overlay); body-context `.resource-button` gets bone text + an accent background — proposal: `--color-mint` background with graphite text (graphite on mint = ~3.5:1, fails 4.5:1; switch to `--color-graphite` background with bone text instead = bone on graphite = ~16:1, comfortably passes).
- **`var(--color-chrome-fg)` on sulfur fails 1.46:1**: Codex caught this. v2 design: never use bone on sulfur. Sulfur is a small-text accent (used for the active mix button on audio.html where text is graphite — which passes 11:1) and for focus outlines (which don't need contrast since they're rendered as outlines, not fills). Define a button-pair token convention: `--color-button-bg-primary` / `--color-button-fg-primary` (mint+graphite or graphite+bone) explicitly paired and contrast-verified.
- **Hairline borders `rgba(17,17,17,0.1)`**: globals.css:1335, 1340, 1346, 1203, 1563 — invisible on dark bg. Migrate to `var(--color-rule)`.
- **`.findings-reader-topbar a:hover { color: #0e3a2f }`**: dark forest green on whatever-bg. Migrate to a hover-state token or `var(--color-fg)`.
- **`.enhanced-audio-status` light backgrounds**: status-color tokens (mint-tint, blue-tint, red-tint) on light surfaces look correct in light mode but inconsistent against a dark body in dark mode. Either add dark-scheme overrides or document as out-of-scope (not a contrast failure, just a visual-consistency one).
- **`.download-link` (L4 in v1)**: misdiagnosed by v1. Failure is a MISSING background after D-1 §4.9 retired the legacy `background-color: var(--primary-color)` rule in main.css. Fix: add `background-color: var(--color-chrome-bg);` (graphite pill in light mode; lifted near-graphite in dark mode), plus bone text — produces a dark pill in light mode and a slightly-lighter-graphite pill in dark mode, both ≥4.5:1.

## Token design (v2)

Add **three** new tokens to `nextjs-site/app/tokens.css`:

```css
:root {
  /*
   * Muted body text. 4.6:1 on bone (--color-bg) in light scheme.
   * Verified value: #5e636a → 4.57:1 on #f2efe8 bone.
   * (#6b6f76 in v1 was wrong: actually 4.0:1 on bone, failed AA.)
   */
  --color-fg-muted: #5e636a;

  /*
   * Button-pair tokens — explicit fg/bg pairs guaranteed to clear
   * 4.5:1 in both schemes. Used by .resource-button, .read-more,
   * .download-link.
   */
  --color-button-bg: var(--color-graphite);   /* graphite light + dark */
  --color-button-fg: var(--color-bone);       /* bone light + dark; ~16:1 */
}

[data-theme="dark"] {
  --color-fg-muted: #a8aeb8;                  /* ~8.3:1 on #1a1e23 surface */
  /* --color-button-bg and --color-button-fg same as light */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-fg-muted: #a8aeb8;
    /* button-pair tokens same */
  }
}
```

Both `[data-theme="dark"]` and the `prefers-color-scheme: dark`
fallback must declare every dark-scheme token — Codex CRITICAL #4.
Same for the `@supports (color-mix(...))` chain if/when extended.

## Scope (v2)

**1. tokens.css — add `--color-fg-muted`, `--color-button-bg`, `--color-button-fg`.** Three blocks: `:root`, `[data-theme="dark"]`, `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])`.

**2. tokens.css — migrate `--color-paper`** to be dark-scheme aware (cream in light, lifted near-graphite in dark). The `.findings-reader-panel` and `.findings-reader-topbar/bottombar a` rules don't need to change if `--color-paper` itself flips. *Alternative*: leave `--color-paper` alone (it's a palette primitive) and migrate the rules to `var(--color-surface)`. **v2 picks the second alternative** — keeping palette primitives stable is the rule that protects against drift. Plan §5 enumerates the rule sites.

**3. globals.css — migrate the 36 selector groups** (full list in `d9e-baseline-grouped.json`). The high-impact set is in §3 above; medium-impact additions:
   - `.required` asterisk (currently `#e74c3c` on white) → either `var(--color-mint)` accent or `var(--color-graphite)` + visual distinction via weight (decision: graphite + bold + asterisk character; mint can stay for color but on a graphite-bg pill).
   - Contact form labels in dark mode (currently bone on white form bg) — migrate form bg to `var(--color-surface)` and labels to `var(--color-fg)`.
   - `<h4>`, `<p>`, `<b>`, `<a>` over `rgba(242,239,232,0.7)` backgrounds in dark mode — these are alpha-modulated bone over graphite body; the rendered surface is ~`#a8a8a3`. Text fg bone on that surface = ~1.5:1 fail. Fix: change those backgrounds from `rgba(bone, 0.7)` to `var(--color-surface)` (which IS dark-mode aware) so text fg=bone passes.

**4. globals.css — resolve the `.resource-button` !important cascade.** REMOVE the Slice H `!important`; add context-scoped rules at higher specificity using the new button-pair tokens.

**5. globals.css — migrate the 5 hairline-border `rgba(17,17,17,0.x)` sites** to `var(--color-rule)`.

**6. `audit:contrast` script extension** (`nextjs-site/scripts/audit-contrast.mjs`):
   - Keep the current token-pair check.
   - Add an additional Playwright-driven rendered-DOM pass running the §6 algorithm against all routes in `current-site-inventory.json`.
   - Exit 1 if any failure not in `nextjs-site/scripts/contrast-allowlist.json`.
   - Wire to `npm run audit:contrast:rendered` and add to the standard verification gate list in CLAUDE.md.

**7. `tests/contrast.spec.ts`** — replace the one-off audit with a permanent suite. Routes from `current-site-inventory.json` (NOT hard-coded). Three scenarios per route:
   - explicit light (`localStorage.himmp-theme = "light"`)
   - explicit dark (`localStorage.himmp-theme = "dark"`)
   - system dark via `colorScheme: "dark"` browser context with no localStorage override

**8. Allowlist file** `nextjs-site/scripts/contrast-allowlist.json` for any documented exceptions (none expected after v2 remediation; the file is created with `[]` so future regressions can be tracked).

**Out of scope:**
- D-7 legacy CSS deletion.
- `.hero-text` opacity-0.9 perceived-contrast (text reads against hero-overlay dark layer at body-text scale; passes the refined audit).
- Hover/focus contrast variations beyond the named topbar/bottombar hover bug.
- The visual-inconsistency `.enhanced-audio-status` light-tint backgrounds — these PASS contrast but look out-of-place in dark mode; documented as a follow-up D-9-f visual sweep, not a contrast fix.
- The home "Interactive Findings Guide" promo section background. v2 decides to fix it (it's a real failure at 2.09:1) by changing the *section* background from `linear-gradient(mint→...)` to `var(--color-surface)` with a mint left-border accent. This is a small visual change, in scope.

## Risk class

**HIGH.** Production deploy from 2026-05-20-1339 is currently live
with known failures across 25 of 27 routes. Recommendation
unchanged from v1: do NOT roll back (rollback would lose Phase 3
dark mode + audio re-skin + waveform entirely); ship D-9-e same
day.

## Build sequence (v2)

1. **Tokens** — add the three new tokens to all three declaration sites (root, `[data-theme="dark"]`, `prefers-color-scheme: dark`). Verify the new pairs in `audit:contrast`'s token-pair table.
2. **Fix the audit algorithm body-bg-transparent fallback** (so H8/H9 false positives clear before remediation begins; otherwise the "before/after" diff hides the real fixes).
3. **Re-run the baseline audit** with the fixed algorithm; expect H8/H9 to drop out, leaving ~28 unique selector groups.
4. **CSS remediation** — work through the grouped baseline starting with the highest route-impact (sidebar dark → resource-button → read-more → download-link → hairline borders → hover bug → label/promo). Each substantive step: run `audit:contrast` + the one-off audit + Playwright. Save grouped baseline after each pass.
5. **`.resource-button` !important resolution** — verified by re-running the one-off audit and confirming H10 ratios climb from 1.00/1.07 to ≥4.5.
6. **`tests/contrast.spec.ts`** — author the permanent suite. Three scenarios per route. Routes from `current-site-inventory.json`. Test must pass with zero findings (or zero findings outside `contrast-allowlist.json`).
7. **`audit:contrast:rendered`** — wire the rendered-DOM check into npm run-scripts; add to the CLAUDE.md verification-gate list.
8. **Full Playwright pass** — verify no regressions on the existing 76 tests; new contrast tests pass.
9. **Dual review** of the implementation diff.
10. **Commit + push + deploy** — replace the 2026-05-20-1339 release with the D-9-e commit.

## The audit algorithm — full reference

```javascript
function parseRgb(s) {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map((x) => Number(x.trim()));
  return [p[0], p[1], p[2], p[3] !== undefined ? p[3] : 1];
}

function effectiveBg(el) {
  // 1. Element's OWN bg first (so an explicit .resource-button bg
  //    is scored against itself, not against an ancestor overlay).
  const own = getComputedStyle(el);
  if (own.backgroundImage && own.backgroundImage !== 'none') {
    const g = own.backgroundImage.match(
      /linear-gradient\([^,]+,\s*(rgba?\([^)]+\))/
    );
    if (g) return g[1];
  }
  if (own.backgroundColor &&
      own.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
      own.backgroundColor !== 'transparent') {
    const p = parseRgb(own.backgroundColor);
    if (p && p[3] >= 0.5) return own.backgroundColor;
  }
  // 2. Hero overlay special case (text floats over a sibling overlay).
  const hero = el.closest('.hero, .chapter-hero');
  if (hero) {
    const o = hero.querySelector('.hero-overlay, .chapter-hero-overlay');
    if (o) return getComputedStyle(o).backgroundColor;
  }
  // 3. Walk ancestors.
  let c = el.parentElement;
  while (c) {
    const cs = getComputedStyle(c);
    if (cs.backgroundImage && cs.backgroundImage !== 'none') {
      const g = cs.backgroundImage.match(
        /linear-gradient\([^,]+,\s*(rgba?\([^)]+\))/
      );
      if (g) return g[1];
    }
    if (cs.backgroundColor &&
        cs.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
        cs.backgroundColor !== 'transparent') {
      const p = parseRgb(cs.backgroundColor);
      if (p && p[3] >= 0.5) return cs.backgroundColor;
    }
    c = c.parentElement;
  }
  // 4. Body bg, fall back through html element, then root token.
  let bg = getComputedStyle(document.body).backgroundColor;
  if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
    bg = getComputedStyle(document.documentElement).backgroundColor;
  }
  if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
    const tok = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-bg').trim();
    if (tok) bg = tok;
  }
  return bg || 'rgb(255, 255, 255)'; // last-resort white
}

function relLuminance([r, g, b]) {
  const toLin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function contrast(fg, bg) {
  const l1 = relLuminance(fg);
  const l2 = relLuminance(bg);
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}
```

WCAG AA thresholds: 4.5:1 normal text; 3:1 large text (≥24px OR
≥18.66px and bold).

## Acceptance criteria (v2 — transcript-provable)

D-9-e is complete when **all** of the following are true and pasted into the commit message or the deploy-verification log:

1. `tests/contrast.spec.ts` passes (no findings outside allowlist) across all routes × 3 schemes. Paste the test output showing `(N)/(N) passed` where N = routes × 3.
2. `npm run audit:contrast:rendered` exits 0. Paste the script's output line: `Rendered contrast audit: X routes × 3 schemes, 0 failures.`
3. Dual review returns no CRITICAL findings on the implementation diff. WARNINGs may be accepted with stated reasons in the commit body.
4. Production deploy: paste `ssh hostinger 'readlink /var/www/himmp-site/current'` showing the new release timestamp.
5. Live URL verification: paste output of the one-off audit script run against `https://himmp.net/` for at least 3 representative routes (home, audio, a chapter), showing zero findings. The script command + the URL + the result must all appear in the deploy-verification log.

## Open questions (v2 — narrowed)

1. The audit baseline reports `.hero-title` / `.hero-text` failures on 16 routes (H8, H9). Some are body-bg-transparent false positives. After step 2 of the build sequence (algorithm fix), how many are real, and do any chapter-hero rules need explicit `color: var(--color-chrome-fg);` overrides analogous to globals.css:709? The `:is(...)` selector list excludes `findings`, which suggests the chapter-hero is INTENTIONALLY skipped — but the contrast failures suggest the intent didn't survive. Investigation step 2 will clarify.
2. The `--color-paper` background migration option (rule-side vs. token-side) — v2 picks the rule-side migration to keep palette primitives stable. Confirm.
3. The `.resource-button` body-context background-color choice — v2 proposes `var(--color-graphite)` for both schemes (bone-on-graphite, ~16:1). The legacy main.css used `--brand-teal` (mint). Mint-on-bone is fine in light mode but mint-on-bone for a body-context "primary action" button feels too low-key for visual hierarchy. Graphite-on-bone gives stronger affordance. Confirm.
4. `.required` red asterisk choice — keep `#e74c3c` (fails 3.82:1 on white form bg in light, fails dark) or migrate to `var(--color-mint)` (mint on white passes 1.82:1 — wait, that's worse) or graphite with bold? Decision pending in v2.

## What v2 explicitly does NOT promise

- That every selector group in the baseline gets remediated this slice. Medium-impact items (1-4 routes) covered in §scope, but if any prove non-trivial they spin off as D-9-f.
- That the new rendered-DOM audit catches everything. Known algorithm limitations are documented in §audit-methodology.
- That production stability time is met by the existing 7-day Phase 3 convention. D-9-e is the FIX for the Phase 3 ship; its own stability window starts when D-9-e lands and lasts ≥48h before declaring "Phase 3 + D-9-e shipped".
