# HiMMP Next.js Phase 2 — Visual Design Refresh, Slice 1 ("Coexist")

Date: 2026-05-12 (v2; supersedes the v1 plan reviewed 2026-05-12 and rejected as written)
Author: Claude (Opus 4.7), revised after internal `feature-dev:code-reviewer` and Codex adversarial reviews.
Status: proposal, awaiting approval.

## Why This Replaces v1

v1 proposed a foundation phase (WS-A) that removed `/assets/css/main.css` from the live pages and replaced it with a "legacy bridge" stylesheet. Both reviewers landed on the same critical finding at HIGH confidence: the legacy stylesheet contains **structural** layout — `.container`, `.hero`, `.section-grid`, `.video-container`, `.sidebar-box` — not just palette and typography. A bridge stylesheet as scoped would not preserve layout; removing the link would visually break every legacy-rendered page on the first PR. v1's WS-B (home-hero replacement) and WS-C (audio re-skin) had analogous load-bearing-contract violations.

v2 — this plan — adopts the **coexist-first** principle. The legacy stylesheet stays loaded. Tokens and fonts are added *alongside* it, layered above where they win the cascade and below where they would otherwise destabilise legacy layout. Nothing is removed. Nothing is restructured. No load-bearing surface is touched.

The deferred ambitions from v1 (hero replacement, audio re-skin, stylesheet removal, full art-direction commit) are preserved in `docs/nextjs-phase-2-design-refresh-future.md`. That file is a record, not a backlog — it codifies what was rejected and why, so a future agent does not re-propose the same scope without addressing the gating constraints.

## Operating Principle

The migration baseline (27 generated pages, `parity:content` + `parity:text` + `parity:visual` passing) is the preservation contract. This slice may only add visual surface, never remove or replace what the legacy stylesheet establishes. If a token or font conflict with `main.css` produces a regression, the slice is scoped wrong and gets re-scoped — it is not "fixed" by overriding more legacy rules.

## Goals (this slice)

1. Introduce `next/font` so a real type pairing is available for any future React component without further infrastructure work.
2. Introduce a tokens layer (`tokens.css`) so palette, type-scale, spacing, and motion values exist as a single source of truth.
3. Apply the tokens **only to surfaces that are pure React** (`SiteHeader`, `SiteFooter`) — not to anything inside the `dangerouslySetInnerHTML` legacy `<main>`.
4. Land the slice without any change to legacy CSS, legacy HTML, controller bindings, route definitions, or content-extraction code.

## Non-Goals

- No removal or replacement of `/assets/css/main.css` or `/assets/css/responsive.css`.
- No changes to `legacy-content.ts` or the catch-all renderer.
- No changes to `EnhancedAudioController`, `EnhancedVideoController`, or `EnhancedFindingsShell`.
- No re-skin of any legacy section, including the home hero, the "Interactive Findings Guide" gradient banner, the audio page chrome, or the findings sidebar.
- No View Transitions API. No motion-library dependencies. No new Playwright suite.
- No commitment to a final display font. v2 picks one for the implementation but the choice is reversible because nothing inside legacy `<main>` references it.

## Scope (Files Touched)

New files:

- `nextjs-site/src/site/fonts.ts` — `next/font` declarations for the display and body faces, exported as objects with `.variable` CSS variable names.
- `nextjs-site/app/tokens.css` — palette tokens, fluid type scale via `clamp()`, spacing, radii, motion durations, and `prefers-reduced-motion` overrides. Located alongside `globals.css`, not in a new `app/styles/` directory (per internal reviewer's note about app-router conventions).

Modified files:

- `nextjs-site/app/layout.tsx` — import `tokens.css`, import the fonts module, attach `.variable` class names to `<html>`. The existing `<link rel="stylesheet" href="/assets/css/main.css">` and `<link rel="stylesheet" href="/assets/css/responsive.css">` **remain unchanged**.
- `nextjs-site/app/globals.css` — set the body fallback font to the new body CSS variable so React-rendered chrome (SiteHeader, SiteFooter) inherits it. Legacy `<main>` continues to receive its font from `main.css` (Helvetica Neue / Arial) for now.
- `nextjs-site/src/site/components/SiteHeader.tsx` — re-skin the React chrome using tokens. The navigation link list, the brand wordmark wrapper, and the hairline rule below the header become token-driven. Class names that legacy CSS targets are not removed (defensive: a future regression would still find the legacy rules and apply them).
- `nextjs-site/src/site/components/SiteFooter.tsx` — same approach.

Untouched (load-bearing):

- All `*.html` files at the repo root.
- `nextjs-site/src/site/legacy-content.ts`.
- The catch-all `app/[...segments]/page.tsx` and `app/page.tsx`.
- All three `Enhanced*` controllers and shells.
- The entire `public/assets/` tree.
- The `EnhancedFindingsShell`'s sidebar markup and its `aria-current="page"` active-state selector.

## Font Choice For This Slice

- Display: **Fraunces** (variable font, optical sizes). Loaded with subsets `["latin"]`, `display: "swap"`, weights `["400", "600", "800"]`, `variable: "--font-display"`.
- Body: **Inter Tight** (variable). Loaded with subsets `["latin"]`, `display: "swap"`, `variable: "--font-body"`.
- Mono: **JetBrains Mono** (latin subset, weights 400/700, `variable: "--font-mono"`).

Rationale: the slice does not yet need a long-read serif because no legacy long-read surface is being re-skinned; Inter Tight is a safe body face for the header/footer chrome. Source Serif 4 (proposed in v1 for findings prose) is deferred until the findings chrome is itself a real React component, not a dangerously-injected blob.

If the project's CI runs in a network-restricted environment, `next/font/google` will fail at build time. Verify CI fetch access before the implementation PR opens. If access is blocked, switch to `next/font/local` with the woff2 files committed to the repo.

## Token File Contents (target)

`app/tokens.css` defines, at minimum:

- `--color-graphite: #111418`
- `--color-bone: #F2EFE8`
- `--color-mint: #5DC69F` (kept as a token; not re-applied to any legacy surface in this slice)
- `--color-mint-hairline: color-mix(in oklch, var(--color-mint) 70%, var(--color-graphite))`
- `--color-sulfur: #E8C547` (defined but unused in this slice)
- Fluid type scale: `--type-xs` through `--type-display`, each a `clamp()` expression.
- Spacing scale: `--space-1` through `--space-9`, modular.
- Radii: `--radius-sm`, `--radius-md`.
- Motion: `--duration-fast`, `--duration-slow`; `@media (prefers-reduced-motion: reduce)` zeros both.

Tokens are intentionally namespaced (`--color-*`, `--type-*`, etc.) so they do not collide with the legacy CSS custom properties already defined in `main.css` (`--primary-color`, `--brand-teal`, etc.).

## Acceptance Criteria

1. `npm run typecheck` passes.
2. `npm run parity:content` passes for all 27 generated HTML files.
3. `npm run parity:text` passes for all 27 generated HTML files.
4. `npm run parity:visual` passes for the existing 24 desktop/mobile captures. Because this slice only changes React chrome (SiteHeader, SiteFooter), visual captures whose region excludes the chrome should be unaffected. Captures that include the chrome will need re-recorded baselines; this is the only intentional visual delta and must be explicitly listed in the PR.
5. The existing Playwright suite passes unchanged. Specifically `tests/static-export.spec.ts:268-270` (which asserts literal `rgb()` values on the audio page) must still pass because the audio page is untouched in this slice.
6. The Network panel in a built `npm run start` deploy shows requests for both `/assets/css/main.css` **and** the new `next/font` files. This proves coexistence.
7. The brand wordmark, header nav, and footer render in the new body font (`Inter Tight`). The legacy `<main>` continues to render in Helvetica Neue / Arial. This visible split is intentional for this slice and gets resolved in a later slice.

## Sequencing

Single PR. No sub-slices.

## Rollback

The entire slice is reverted by removing the two new imports from `layout.tsx`, deleting `app/tokens.css` and `src/site/fonts.ts`, and reverting the two component files. No content, no controller behavior, no metadata is affected.

## Open Questions

1. Should `--color-mint` stay as the brand-teal value `#5DC69F`, or be retuned to a darker mint (`#3FA982` ish) to anticipate the dark-academic direction documented in the future-scope file? Recommendation: keep `#5DC69F` as the token value in this slice; retuning is part of the future palette decision.
2. Network access at build time for `next/font/google` — confirm with whoever maintains the Hostinger build pipeline before the PR opens.

## Definition Of Done

- All acceptance criteria pass on a clean checkout.
- The PR description lists which visual-parity baselines were intentionally re-recorded and embeds before/after thumbnails of those baselines.
- `docs/nextjs-phase-2-design-refresh-future.md` is referenced in the PR description so future agents can see the deferred scope without re-discovering it.

End of slice plan.
