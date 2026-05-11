# HiMMP Next.js Migration Autonomous Plan

Date: 2026-05-11

Purpose: finish the Next.js / TypeScript migration autonomously, excluding deployment and production-server work.

## Operating Boundaries

- Work inside this repository only.
- Push committed migration work when local verification is green and the configured remote/branch are clean.
- Do not deploy or change VPS/remote infrastructure.
- Make regular local commits in small, reviewable chunks.
- Preserve the legacy static/PHP site as source of truth until a documented migration decision says otherwise.
- Do not rewrite prose, references, empirical claims, metadata, or academic content from memory.
- Treat content and references as copy-only unless the task is explicitly a source-site defect fix.
- Use Claude for bounded critical reviews where useful and available. If Claude times out or fails, record `CANNOT VERIFY` in the review log and continue only if local verification passes.

## Current Baseline

The migration app lives in `nextjs-site/`.

Green verification as of this plan:

- `npm run typecheck`
- `npm run build`
- `npm run parity`
- `npm run parity:content`
- `npm run parity:text`
- `npm run parity:links`
- `npm run parity:visual`
- `npm run test:e2e`

Important current guarantees:

- All 27 baseline legacy HTML routes are generated.
- Visible main text parity passes for all 27 generated pages.
- Content parity checks titles, descriptions, H1s, JSON-LD counts, iframe counts, audio counts, and style counts.
- Representative visual parity passes for 16 desktop/mobile main-content captures.
- E2E tests cover all generated routes, mobile navigation, publication section navigation and accordions, audio comparison switching, and contact-form validation/submission flow.

## Commit Cadence

Use this local commit sequence unless the work naturally splits more cleanly:

1. `test: harden next migration fidelity checks`
   - Includes the behavioral tests and test-suite stability fixes.
   - Gate: full verification suite.

2. `docs: record migration deployment decisions`
   - Audio strategy.
   - Contact/PHP strategy.
   - Static export and `.html` route assumptions.
   - Gate: docs reviewed plus relevant parity checks.

3. `fix: resolve safe static metadata and sitemap issues`
   - Only migration-safe issues, such as generated sitemap coverage for existing generated routes.
   - Do not silently alter ambiguous metadata such as duplicated Open Graph/Twitter fields without documenting the decision.
   - Gate: metadata/content/link parity, build, e2e.

4. `test: cover remaining legacy interactions`
   - Videos section navigation if present.
   - Generic tabs/lightbox behavior if present.
   - Findings-page audio-player behavior.
   - Contact error and CSRF-unavailable states.
   - Gate: e2e plus relevant parity checks.

5. `docs: finalize migration readiness notes`
   - Summarize what is complete.
   - List deployment-only decisions left.
   - Include exact verification commands and latest outcomes.
   - Gate: full verification suite.

## Work Plan

### 1. Freeze The Fidelity Baseline

- Keep the mechanical extraction model unless a specific bug requires changing it.
- Re-run all parity and browser gates after changes that touch extraction, metadata, routing, scripts, styles, or public assets.
- Preserve malformed-source repairs for `team.html` and `audio.html` as documented behavior, not silent source edits.

Stopping condition:

- All baseline gates pass and the current state is committed locally.

### 2. Resolve Non-Deployment Blockers

Audio:

- Keep default public sync excluding the 523 MB audio payload.
- Keep `npm run sync:public:audio` available for deployment preparation.
- Document whether audio is expected to be co-hosted as static files, served from object storage, or left as Box/archive links during deployment.

Contact:

- Keep the legacy PHP workflow represented and tested as a contract.
- Document that pure static export cannot provide `get-csrf-token.php` or `contact-handler.php`.
- Do not reimplement contact submission in Next/Node unless explicitly requested later.

Routes:

- Keep direct `.html` output as the migration baseline.
- Verify generated files under `out/` before each readiness claim.

Stopping condition:

- Audio/contact/static export decisions are documented clearly enough that deployment can proceed later without rediscovering the constraints.

### 3. Fix Only Safe Source-Site Defects

Safe candidates:

- Ensure generated static metadata files know about all generated routes, including `findings/14-recommended-reading.html`.
- Keep corrected logo case in the Next shell, because the source references are known to be broken on case-sensitive hosts.

Do not silently change:

- Reference entries.
- Main academic prose.
- Empirical or methodological details.
- Ambiguous metadata defects where the intended correction is only inferred.
- `himmp-ebook/` public role.

Stopping condition:

- Each fix has a short note in the audit/review log explaining why it is a migration correction rather than content rewriting.

### 4. Broaden Behavioral Coverage

Add tests for remaining behavior only where it exists in the source:

- Videos page section navigation and active button behavior.
- `main.js` tab behavior if any `.tabs` markup is present.
- `main.js` lightbox behavior if any `.gallery-image` markup is present.
- `assets/js/audio-player.js` behavior on findings chapter mix buttons.
- Contact failure states: CSRF unavailable and handler error response.

Keep tests focused on failure modes:

- Scripts execute after migrated DOM exists.
- Active state toggles correctly.
- Audio source switches without replacing the player element.
- Form status messages and disabled states match the legacy contract.

Stopping condition:

- E2E coverage protects every legacy script path that is actually used by migrated pages.

### 5. Claude Review Loop

Run Claude reviews at these points:

- After the current behavioral-test commit.
- After audio/contact deployment-decision docs.
- After any metadata/sitemap fix.
- Before the final readiness note.

Review prompt scope:

- Ask for concrete fidelity regressions, missing content risks, route/SEO drift, audio/contact deployment assumptions, and test blind spots.
- Do not ask for stylistic redesign or prose rewriting.

Timeout handling:

- If Claude gives no usable output within a bounded timeout, log `CANNOT VERIFY - Claude timed out` and proceed only on local gates.

### 6. Final Readiness Package

Finish with:

- Full verification suite passing.
- Local commits made for each completed chunk.
- Updated audit and review log.
- A concise readiness note listing:
  - completed migration guarantees,
  - known source-site issues intentionally carried forward,
  - deployment-only items left,
  - exact commands run and outcomes.

Deployment-only items expected to remain:

- Host/storage decision for large audio assets.
- PHP co-hosting or contact-form replacement decision.
- Final production URL/server configuration.
- Human visual spot-check of header/logo decisions.
