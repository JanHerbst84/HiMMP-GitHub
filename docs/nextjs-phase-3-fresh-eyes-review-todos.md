# Phase 3 — Fresh-Eyes Visual Review: To-Do List

Captured 2026-05-20 after a fresh-eyes browser pass over the deployed site
(`https://www.himmp.net/`) on a 1440×900 desktop viewport plus a 390×844
mobile pass on the home page. Pages inspected: home, findings index,
findings chapter 7 (Meta-Instrument), publications, team, audio, about.

Items are ranked by tangible payoff, not by file proximity. Severity tags
follow the workspace reviewer-mode contract.

Numbering is stable: each item keeps its number even after items are
shipped or dropped, so commits / PRs can reference `FRESH-1` … `FRESH-13`
without renumbering.

---

## CRITICAL — `audio.html`

- [ ] **FRESH-1 · CRITICAL · `audio.html` "Video Comparison of Producer
      Mixes" iframe has no dimensions.**
      Confirmed in the live DOM: the YouTube embed
      (`src=".../youtube/embed/AuNs1Ga5xgM"`) has no `width` / `height`
      attributes and the surrounding `.video-container` has no responsive
      box. Result: a ~600 px tall empty hole between the listening-with-
      context callout and the interactive mix comparator on a flagship
      page.
      *Fix:* apply the same `aspect-ratio: 16/9` wrapper rule already used
      on the home/videos surfaces, or add a scoped
      `.video-container iframe { width: 100%; aspect-ratio: 16/9; }` rule
      to `app/globals.css`.
      *Verify:* visual diff on `/audio.html`; `parity:text` should still
      pass; Playwright body-smoke for the audio route.

- [ ] **FRESH-2 · CRITICAL · `audio.html` native `<audio controls>`
      players are visually broken on dark.**
      Nine of ten producer-stem players render as the browser's default
      white-pill UI, which clashes hard with the dark, art-directed
      surrounding page. Inspected DOM confirms bare `<audio controls>`
      elements with no skin.
      *Fix (choose one, ordered by ambition):*
      1. Minimum: skin the native controls via
         `audio::-webkit-media-controls-panel` / Firefox equivalents to
         match the mint-on-graphite system.
      2. Better: wrap each producer stem in the same waveform strip shell
         as the interactive comparator (the `<AudioComparison>` React
         component already exists and is dark-theme-correct).
      3. Best: build one consistent minimal mint-on-graphite player and
         use it for every audio surface site-wide.
      *Verify:* visual diff; Playwright body-smoke; check that the audio
      `<source>` URLs and JSON-LD audio counts in
      `.migration/current-site-inventory.json` are unchanged by the skin
      pass.

---

## HIGH — depth and atmosphere on non-hero surfaces

- [ ] **FRESH-3 · HIGH · Publications and team pages are flat card grids.**
      Compared to the findings chapter (which has interior depth from the
      sidebar TOC + body column + author / key-question inset cards), the
      publications and team pages currently read as generic dark-mode CMS
      grids. Cheap, high-impact moves:
      - Add a subtle background motif (the same procedural waveform
        strip from the home page, at ~6% opacity behind each section
        header) so each landing surface has its own tonal signature.
      - On `team.html`, break the symmetric 3-up "Producers" grid: feature
        one card larger (lead-investigator pattern), with offset captions.
        Symmetric portrait grids are the "AI slop" tell here.
      *Verify:* visual diff per route; existing Playwright body-smokes;
      no `parity:text` change (content unchanged).

- [ ] **FRESH-4 · HIGH · Home page "Project Completed" panel reads as a
      stranded boilerplate paragraph in a rounded box.**
      It is the only home-page panel with no internal hierarchy, no
      accent, and no rhythm. Either:
      - Reframe as a small ceremonial moment with tabulated stats:
        "3 years · 14 producers · 1 dataset · 15 chapters"
        (numerals in Fraunces tabular figures), or
      - Absorb the prose into the About module above and remove the panel.
      *Verify:* visual diff on home; `parity:text` will change — update
      the parity baseline as part of the slice; Playwright home smoke.

---

## HIGH — interactive affordance polish

- [ ] **FRESH-5 · HIGH · The interactive mix-comparison tool deserves
      more presence.**
      Right now it sits as a small grey panel with a waveform and pill
      buttons. This is the *signature interaction* of the project — the
      thing nobody else on the web has. Promote it:
      - Full-bleed band with its own background treatment.
      - Larger waveform (at least 1.6× current height).
      - Producer names in Fraunces (display serif) on the active state.
      - One-line "what am I hearing?" caption tied to the active button
        (e.g. "Bogren — naturalistic balance, drums forward").
      *Verify:* manual interaction check (button switching, seek
      preservation per existing behaviour); Playwright behaviour test for
      `<MixComparisonEmbed>` / `<AudioComparison>` should still pass.

- [ ] **FRESH-6 · HIGH · Chapter sidebar is a flat list of 15 items.**
      Add modest wayfinding hierarchy:
      a. Progress indicator on the active chapter (filled bar / dot).
      b. Tiny chapter numerals in Fraunces small-caps.
      c. Hairline divider between Parts (Foundations / Naturalistic /
         Hyperreal / Meta-Instrument / Spatial / Subjective / Applications
         / Evidence / Glossary), reflecting the conceptual structure of
         the findings.
      *Verify:* visual diff on a sample of chapter pages (3–4 across
      Parts); chapter-route Playwright smokes remain green.

---

## MEDIUM — micro-level

- [ ] **FRESH-7 · MEDIUM · Button system reads as one shape.**
      Every CTA on the site is the same mint pill: "Access Data," "View
      Publications," "Watch & Listen," "Read Guide," "More." Introduce a
      secondary ghost / outline variant for non-primary actions — the
      "More" links inside About / Approach blocks should be visually
      quieter than the four "Project Archive" CTAs at top of the home
      page.
      *Fix:* define `.btn-secondary` (transparent fill, mint hairline
      border, mint text) and apply to non-primary CTAs.
      *Verify:* visual diff across home, about, approach.

- [ ] **FRESH-8 · MEDIUM · Mint accent is doing a lot of work alone.**
      Consider a single secondary accent — a hot ember / copper, e.g.
      `#c7593a` — used *very* sparingly: chapter-part dividers, the
      active producer pill in the mix comparator, the JSON-LD-anchored
      heading underlines. Two accents on a near-black ground gives the
      palette range without diluting the mint signature.
      *Verify:* visual diff after the accent is wired into 3–4 surfaces;
      contrast audit (`npm run audit:contrast`) must remain green for
      every new usage.

- [ ] **FRESH-9 · MEDIUM · Hero on `audio.html` is markedly weaker than
      the home hero.**
      Same near-black, no procedural texture, smaller title. Reuse the
      home's waveform treatment but at 50% scale to brand the page as
      part of the same "instrument" family. The audio page is the
      project's most listener-facing surface — its hero should feel
      kindred to the home, not a stripped-down sibling.
      *Verify:* visual diff on `/audio.html`; ensure `[data-page]`-
      scoped CSS does not leak into other routes.

- [ ] **FRESH-10 · MEDIUM · Footer is a plain centred link list.**
      A 3-column footer (Project / Outputs / Institutional + Funder
      logos) would close every page meaningfully and reinforce academic
      legitimacy at the same time. Currently the University of
      Huddersfield and AHRC presence is buried.
      *Verify:* footer renders correctly on every route; logo
      attribution / `alt` text correct; visual diff per page (parity-
      excluded routes likely need updating).

---

## LOW — only if polishing

- [ ] **FRESH-11 · LOW · Numerals on home stats and chapter counts
      should use Fraunces tabular figures.**
      Add `font-variant-numeric: tabular-nums lining-nums` to numeric
      cells (Complete Dataset, Publications, Producer Videos, Findings
      Guide blocks plus any future numeric stats added per FRESH-4).
      Zero performance cost; markedly more deliberate visual rhythm.
      *Verify:* visual diff on home.

- [ ] **FRESH-12 · LOW · Findings-chapter "Key Question" callout could
      earn a custom marker.**
      Replace the generic outlined box with a large serif `?` in mint
      set off in the gutter (or the equivalent typographic moment).
      Currently the callout reads like a stock admonition block.
      *Verify:* visual diff on chapters that contain "Key Question"
      blocks; no `parity:text` change.

- [ ] **FRESH-13 · LOW · Audit any home-hero animation against
      `prefers-reduced-motion: reduce`.**
      Could not confirm from static screenshots whether the hero
      animates. If it does, ensure the media-query guard is in place.
      *Verify:* DevTools "Emulate reduced motion: reduce" on the home
      page; confirm no transform or opacity animation runs on the
      hero or the procedural waveform.

---

## Suggested slice grouping

- **`D-3-d` — audio-page fixes (CRITICAL):** FRESH-1 + FRESH-2 together
  as one tight slice through the dual-review protocol (internal +
  Codex). These are the only items that visibly degrade the build as
  shipped today.
- **`D-9-f` — depth pass (HIGH atmosphere):** FRESH-3 + FRESH-4
  together; both add background-motif / structural rhythm to landing
  surfaces.
- **`D-3-e` — comparator promotion + chapter sidebar (HIGH affordance):**
  FRESH-5 + FRESH-6 together; both touch the chapter / audio
  interactive surface family.
- **`D-9-g` — system polish (MEDIUM):** FRESH-7 → FRESH-10 as a
  one-commit-per-item run with dual review on each.
- **`D-9-h` — finishing pass (LOW):** FRESH-11 → FRESH-13 batched as a
  single optional slice.

Each slice runs through the standard
`do → internal review → Codex adversarial-review → integrate → commit
→ Codex push` loop. Slice numbering is provisional and will be
confirmed against `docs/nextjs-phase-3-slice-d9e-plan.md` once the
current `D-9-e-17` chain is closed.

---

## Reference screenshots (captured 2026-05-20)

Saved at repo root from the fresh-eyes pass:

- `fresh-home-1440.png`
- `fresh-findings-index.png`
- `fresh-chapter-07.png`
- `fresh-publications.png`
- `fresh-team.png`
- `fresh-audio.png` *(shows FRESH-1 and FRESH-2 directly)*
- `fresh-about.png`
- `fresh-home-mobile.png`
