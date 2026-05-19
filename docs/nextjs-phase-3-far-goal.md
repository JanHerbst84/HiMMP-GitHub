# HiMMP Next.js Phase 3 — Far Goal

Date drafted: 2026-05-19 (post-D-1 §4.9 link retirement)
Author: Claude (Opus 4.7) — proposal for Codex pressure-test and JPH sign-off
Status: draft v2 (post-Codex v1 review), awaiting JPH approval

v1 returned `needs-attention` with 1 HIGH + 1 MEDIUM:

- (HIGH) D-9-b shipped a `@media (prefers-color-scheme: dark)` block
  before the contrast audit cleared the dark scheme; dark-OS users
  would auto-activate the dark scheme before it was verified readable.
  Resolved in v2: D-9-b only adds the explicit `[data-theme="dark"]`
  override; the media query moves to D-9-d alongside the toggle UI
  AFTER D-9-c's contrast audit clears the dark scheme.
- (MEDIUM) Procedural waveform required pure-CSS deterministic
  per-track heights from `data-seed`, which CSS cannot derive
  without JS/SVG/canvas. Resolved in v2: bars are server-rendered
  `<span>` elements with inline `style={{ height }}` computed at
  build time by hashing the track id. No client-side JS. CSS only
  styles the container + base colour.

## What this document is

A north-star statement for the Phase 3 work that follows the Phase 2
far-goal (`docs/nextjs-phase-2-far-goal.md`, shipped through D-1 §4.9
on 2026-05-19). Phase 2 closed with the legacy stylesheets unloaded and
every Family A–L structural rule reproduced in token-driven component
CSS. Phase 3 builds on that foundation.

This file is subordinate to `docs/nextjs-phase-2-design-refresh-future.md`
where they overlap on the D-3, D-6, D-9, D-10 entries — that deferred-
scope record names the gating constraints; this far-goal names how
they get cleared.

## End-state

The HiMMP website at `https://himmp.net` ships in two themes — a
**light dark-academic** scheme (the current shipping default; bone
body, graphite text, mint hairline accents, sulfur audio-playing
states) and a **dark dark-academic** scheme (graphite body, bone text,
mint hairline kept, sulfur still reserved for audio-playing states).
Both themes share the same type system, spacing scale, and structural
CSS — only the surface tokens swap.

A theme is selected by, in order of precedence:

1. A per-user toggle persisted in `localStorage`. Toggle UI lives in
   the main site header next to the navigation links, accessible by
   keyboard and screen reader.
2. The browser's `prefers-color-scheme` media-query if no
   `localStorage` preference is set.
3. The light dark-academic scheme as the implicit default.

The audio surface (`/audio.html` and the in-chapter `.mix-comparison-
embed` blocks) is rewritten so the audio comparison player owns its
own markup and state via a real `<AudioComparison>` React component.
`EnhancedAudioController` is retired to a thin shim or removed
entirely. The player chrome is theme-aware and reads tokens
identically to the rest of the chrome — no audio-specific palette
literals. The audio page additionally renders a CSS-only procedural
waveform-strip decoration above the comparison player; the strip is
deterministic per-track (seeded from track id) so it does not change
between page loads, and respects `prefers-reduced-motion` (no
animation).

The findings reader and every other Family A–L surface from Phase 2
continues to render correctly in both schemes. No structural change
is required to the family-coverage gates; the dark-mode work adds an
additional token-swap layer that the existing audit pipeline can
verify via a parallel run.

## Acceptance criteria

The project is at the Phase 3 far goal when all of the following hold
simultaneously:

1. **Two themes ship from the same build.** `app/tokens.css` defines
   the light scheme as the `:root` default and the dark scheme as an
   explicit `[data-theme="dark"]` override. The semantic tokens that
   swap are `--color-bg` (body surface), `--color-fg` (body text),
   `--color-surface` (card/panel), `--color-rule` (hairline), and a
   small set of accent variants where needed. The existing palette-
   primitive tokens (`--color-bone`, `--color-graphite`, etc.) are
   kept as-is — they are the source values the semantic tokens
   reference. The `@media (prefers-color-scheme: dark)` system-
   preference fallback is added LATER, in D-9-d, after the contrast
   audit has cleared the dark scheme — otherwise users on a dark-OS
   would auto-activate the dark scheme before the contrast checks
   verify it is readable. Mechanical check: `grep -n
   'data-theme="dark"' nextjs-site/app/tokens.css` returns matches.
2. **Toggle UI works keyboard-accessibly.** A `<button>` in the site
   header with `aria-pressed` reflecting the active theme; cycles
   `light → dark → system`. Persists to `localStorage` key `himmp-
   theme`. Mechanical check: a new Playwright test
   (`tests/theme-toggle.spec.ts`) navigates `/`, clicks the toggle,
   asserts `data-theme` flips on `<html>`, asserts `localStorage`
   updated, reloads, asserts persistence.
3. **System preference respected.** With no `localStorage` value set,
   Playwright simulates `prefers-color-scheme: dark`, navigates `/`,
   asserts `<html>` resolves to dark theme via the media-query
   fallback. Test in `tests/theme-toggle.spec.ts`.
4. **No literal greys in either scheme.** The
   `audit-token-coverage.mjs` audit passes in both schemes (added
   flag: `--theme {light,dark}`; defaults to running both). Whitelist
   stays semantic; new exceptions require rationale.
5. **D-1 family-coverage gate still passes.** `npm run audit:family-
   coverage:all` reports OK after dark-mode tokens land. The token
   swap is additive over the existing structural rules; no structural
   decl is moved or removed.
6. **WCAG AA contrast in both schemes.** Body text on body bg, link
   text on body bg, pill-button text on mint, audio-playing-state
   text on sulfur — all ≥ 4.5:1 contrast. New audit:
   `scripts/audit-contrast.mjs` computes WCAG contrast for every
   `var(--color-bg)` / `var(--color-fg)` pair the tokens define and
   exits non-zero if any pair drops below 4.5. Mechanical check:
   `npm run audit:contrast` exits 0.
7. **Audio comparison player owns its markup.** The
   `<AudioComparison>` React component (already present at
   `nextjs-site/src/site/components/AudioComparison.tsx`) is the
   only source of the comparison-player markup on `/audio.html` and
   in every findings chapter that embeds `.mix-comparison-embed`.
   `EnhancedAudioController` is reduced to either a typed shim that
   re-exports `AudioComparison` for compatibility OR removed
   entirely. The two are equivalent for the gate; choose by which is
   easier to revert.
8. **Audio Playwright assertions resolve via tokens.** No literal
   `rgb(...)` values remain in `tests/static-export.spec.ts` for
   audio-mix-button colour states. Active button bg resolves via
   `var(--color-sulfur)`; inactive via `var(--color-surface)`;
   text-on-active via `var(--color-fg-on-sulfur)` (new accent token).
9. **Procedural waveform strip renders.** A `.audio-waveform-strip`
   element sits above the `.comparison-player-container` on
   `/audio.html`. The strip is **server-rendered React markup** — a
   horizontal series of `<span>` bar elements, each with an inline
   `style={{ height: '<n>px' }}` whose value is computed at build
   time by hashing the track id (a deterministic per-track seed). No
   client-side JS, no canvas, no SVG. The CSS styles the bar
   container, gap, and base color (via `--color-rule`); the heights
   come from the server-rendered inline styles. The bar heights are
   stable across reloads (same track id → same height sequence).
   Respects `prefers-reduced-motion` (no shimmer animation when
   reduced). Mechanical check: a new Playwright body-smoke
   (`tests/audio-waveform.spec.ts`) asserts the strip is present,
   has ≥ 32 bars, two different track ids produce different stable
   height sequences (compare bar heights across two `audio.html`-
   adjacent embeds with different seeds), and the strip is not
   animated under `prefers-reduced-motion: reduce`.
10. **Production stability observed.** After both the dark-mode and
    audio-rewrite slices land, seven calendar days of prod observation
    (same regression taxonomy as Phase 2 criterion 10): Hostinger
    nginx error log clean, Matomo no bounce/time-on-page anomalies,
    daily `smoke:contact:php` clean, no regression reports via the
    feedback channel. Any regression resets the clock.

## Explicitly out of scope

- **Feature-derived sonic visualisations** (RMS envelope, spectral
  centroid traces per stem). The Phase 3 strip is procedural CSS only.
  Feature-derived would require offline audio analysis to generate
  per-stem assets — that's Phase 4 conversation.
- **View Transitions API page transitions** (deferred-scope D-5).
  Still requires the experimental-flag spike that D-5's gate names.
- **D-10 — TSX inline-style modernisation.** The ~105 inline
  literal-style expressions in `src/site/components/pages/**/*.tsx`
  stay tracked via the snapshot audit. Modernising them is a
  separate proposal post-Phase 3.
- **D-7 — disk deletion of `/assets/css/main.css` and
  `responsive.css`.** Still gated on every page in the 27-page
  baseline being intentionally redesigned with a new visual baseline
  OR confirmed retired. Phase 3 does not clear this gate.
- **A multi-language i18n system.** The site is English-only.
- **An admin / authoring surface for chapter content.** Chapters
  remain auto-generated from the legacy HTML via the port script.

## Operational shape

Phase 3 is reached by completing two work units in order:

**Workstream 1 — Dark mode (D-9).** Estimated 1–2 working weeks.
Slices:

- **D-9-a — semantic-token foundation.** Introduces `--color-bg`,
  `--color-fg`, `--color-surface`, etc. as aliases over the existing
  palette primitives. No visual change; the audit verifies the
  alias substitution is byte-equivalent.
- **D-9-b — explicit dark scheme tokens.** Adds the
  `[data-theme="dark"]` block in `tokens.css` with the inverted
  values. NOT YET activated by any user path — no element has
  `data-theme` set and the `prefers-color-scheme: dark` media query
  is intentionally NOT included in this slice. The slice is testable
  by manually setting `data-theme="dark"` on `<html>` in dev tools.
- **D-9-c — contrast audit + WCAG pass.** Adds `audit-contrast.mjs`,
  runs against both schemes, fixes any pair below 4.5:1 by adjusting
  the dark-scheme token values. This must clear before the dark
  scheme activates for any user.
- **D-9-d — system preference + toggle UI.** Adds BOTH the
  `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])`
  fallback AND the header toggle button + `localStorage` plumbing +
  the `data-theme` attribute write. The two ship together because
  they share the user-visibility threshold: at this point either a
  dark-OS user OR an explicit-toggle user gets the dark scheme, and
  the contrast audit from D-9-c has already confirmed it is readable.

**Workstream 2 — Audio re-skin (D-3 + D-6 phase-1).** Estimated 2–3
working weeks. Slices:

- **D-3-a — `<AudioComparison>` markup ownership.** Move the audio
  comparison player markup from `<EnhancedAudioController>` DOM-walk
  to the React component. Existing class hooks (`.comparison-
  player-container`, `.mix-btn`, `#currently-playing`,
  `.mix-comparison-player`, `.mix-button`, `.current-mix-name`)
  preserved verbatim because chapters' inline `<script>` blocks
  bind to them (the same way Slice P preserved them when the
  on-this-page script was retired).
- **D-3-b — retire EnhancedAudioController.** Reduce to a typed
  shim that re-exports `<AudioComparison>` so import sites stay
  unchanged.
- **D-3-c — audio-page palette retune.** Move `audio.html` styles
  to dark-first defaults using semantic tokens (still works in
  light mode but reads as deliberately darker than the rest of the
  chrome). Retire literal `rgb()` Playwright assertions on
  mix-button colours.
- **D-6 phase-1 — procedural waveform strip.** Add the CSS-only
  strip above the comparison player. Deterministic per track,
  respects `prefers-reduced-motion`.

Per-slice protocol stays as established in `CLAUDE.md` §"Dual-review
protocol": parallel internal feature-dev review + Codex adversarial
review on the same diff, integrate findings, commit, push via
`codex-push.sh`. High-risk slices (D-3-a, D-3-b) gate on human
confirmation pre-push.

## Why this is the right far goal

It is bounded. Two workstreams, each with named slices, each gated
by mechanical checks that build on the Phase 2 audit pipeline.

It is reversible at every checkpoint. Each slice commits independently
and reverts cleanly. The dark-mode token-swap is a CSS-only layer over
the existing structural rules; reverting D-9 is a CSS edit, not a
markup refactor.

It does not gamble on new infrastructure. View Transitions, i18n,
feature-derived sonic-vis, content-architecture changes, and a CMS
are all explicitly excluded. No new dependencies, no new build steps,
no new hosting decisions.

It builds on rather than replaces Phase 2. The dark-academic palette
is the source values; dark mode swaps which surface those values
paint. The audio surface is the last family that hasn't been re-
skinned to the dark-academic system; D-3 + D-6 close that gap.

## Approval shape

Single Codex adversarial review pass. If verdict is APPROVED or
APPROVED-with-revisions, JPH signs off and slices open in order
(D-9-a → D-9-b → D-9-c → D-9-d → D-3-a → D-3-b → D-3-c → D-6
phase-1). If verdict is REJECT with substantive findings,
revise once and re-review once; no extended iteration loop. If still
unresolved after that, escalate to JPH for a design-decision
conversation.
