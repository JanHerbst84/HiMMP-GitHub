/*
 * Reads JSON audit output from `audit-legacy-css.mjs --json` for both
 * legacy CSS files and bins every STRUCTURAL rule into a family
 * (A through L). Reports per-family counts plus any unclassified
 * selectors — the unclassified count must be zero for the D-1
 * structural-coverage gate to be valid.
 *
 * Usage from the nextjs-site/ directory:
 *
 *   node scripts/audit-legacy-css.mjs ../assets/css/main.css --json > /tmp/main-audit.json
 *   node scripts/audit-legacy-css.mjs ../assets/css/responsive.css --json > /tmp/resp-audit.json
 *   node scripts/classify-css-families.mjs /tmp/main-audit.json /tmp/resp-audit.json
 *
 * Both JSON paths are required; the script fails fast with a clear
 * error if either is missing, rather than silently classifying stale
 * data from a prior run.
 *
 * Optional: `--manifest-json <path>` writes a structured rule manifest
 * to the named path INSTEAD OF printing the stats. The manifest is the
 * canonical input for `audit-d1-family-coverage.mjs`:
 *
 *   [
 *     {
 *       family: "H",
 *       sourceFile: "assets/css/main.css",
 *       selector: ".audio-player",
 *       atRule: null,                          // or "@media (max-width: 767px)"
 *       structuralDecls: [
 *         { property: "display", value: "flex" },
 *         ...
 *       ]
 *     },
 *     ...
 *   ]
 *
 * `structuralDecls` is filtered to LAYOUT_PROPS only (the structural
 * subset of each STRUCTURAL rule); palette/border/visual decls are
 * outside the structural-coverage gate's concern and are handled by
 * the token-coverage audit on the migrated side instead.
 *
 * Pair with `docs/nextjs-phase-2-d1-main-css-audit.md`.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { isStructuralProp } from './lib/css-classes.mjs';

const rawArgs = process.argv.slice(2);
let manifestPath = null;
const positionals = [];
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === '--manifest-json') {
    const next = rawArgs[i + 1];
    if (!next || next.startsWith('--')) {
      console.error(
        '--manifest-json requires a non-flag path argument; falling ' +
          'through to stats mode would silently skip the manifest emit.'
      );
      process.exit(2);
    }
    manifestPath = next;
    i++;
  } else {
    positionals.push(rawArgs[i]);
  }
}
const [mainPath, respPath] = positionals;

if (!mainPath || !respPath) {
  console.error('Usage: node classify-css-families.mjs <main-audit.json> <responsive-audit.json> [--manifest-json <out-path>]');
  console.error('Produce the inputs first via `node audit-legacy-css.mjs <css-file> --json > <path>`.');
  process.exit(2);
}

for (const p of [mainPath, respPath]) {
  if (!existsSync(p)) {
    console.error(`Input JSON not found: ${p}`);
    console.error('Re-run audit-legacy-css.mjs --json to regenerate.');
    process.exit(2);
  }
}

const mainJson = JSON.parse(readFileSync(mainPath, 'utf8'));
const respJson = JSON.parse(readFileSync(respPath, 'utf8'));

const FAMILY_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function classify(sel) {
  let s = sel.replace(/\s+/g, ' ').trim();
  if (s.startsWith('@media') || s.startsWith('@supports')) {
    const open = s.indexOf('{ ');
    if (open !== -1) s = s.slice(open + 2).trim();
  }
  const l = s.toLowerCase();

  if (/^\.read-more\s*,\s*\.resource-button/.test(l)) return 'L';
  if (/^\.read-more::?before\s*,\s*\.resource-button/.test(l)) return 'L';
  if (/^\.read-more:hover::?before/.test(l)) return 'L';
  if (/^\.read-more:active\s*,\s*button:active/.test(l)) return 'L';
  if (/^\.footer-logo:hover/.test(l)) return 'K';
  if (/^\.output-card:hover/.test(l)) return 'L';

  if (/^\*$/.test(l)) return 'A';
  if (/^html$|^body$|^img$|^a$|^a:hover$|^p$|^p\s*\+\s*ul|^h1, h2, h3, h4, h5, h6$|^h[1-6]$/.test(l)) return 'A';
  if (/^\.container$|^\.skip-to-content/.test(l)) return 'A';
  if (/^\.content-section ul|^\.content-section ol|^\.content-section li/.test(l)) return 'A';
  if (/^\.highlight-text/.test(l)) return 'A';

  if (/^\.site-header|^\.logo|^\.logo-image|^\.main-nav|^\.nav-links|^\.menu-toggle/.test(l)) return 'B';

  if (/^\.hero\b|^\.hero-overlay|^\.hero-content|^\.hero-title|^\.hero-text|^\.hero-buttons|^\.chapter-hero/.test(l)) return 'C';

  if (/^\.figure|^\.audio-example|^\.pull-quote|^\.sidebar-box|^\.chapter-nav\b|^\.chapter-content|^\.glossary|^\.portrait|^\.author-bio|^\.citation-box|^\.mix-comparison-embed|^\.chapter-section-nav/.test(l)) return 'D';

  if (/^\.content-section\b/.test(l)) return 'E';
  if (/^\.aims-grid|^\.aim-item/.test(l)) return 'E';
  if (/^\.section-grid|^\.section-content/.test(l)) return 'E';
  if (/^\.updates|^\.update-/.test(l)) return 'E';
  if (/^\.highlight-item/.test(l)) return 'E';

  if (/^\.team-grid|^\.team-member|^\.team-photo|^\.partner-logo|^\.producer img|^\.artist img|^\.advisor-item img|^\.university-logo-container img/.test(l)) return 'F';

  if (/^\.publication-/.test(l)) return 'G';
  if (/^\.section-nav-button/.test(l)) return 'G';

  if (/^audio$|^\.audio-player|^\.audio-container|^\.audio-controls|^\.mix-player|^\.mix-buttons|^\.mix-btn|^\.mix-comparison-player|^#comparison-player|^#currently-playing|^\.comparison-player-container|^\.download-item|^\.download-link/.test(l)) return 'H';

  if (/^\.video-|^\.lazy-video/.test(l)) return 'I';

  if (/^\.contact-|^\.form-row|^\.form-group|^label$|^input\b|^input\s*,|^textarea$|^textarea\s*,|^button$|^button\s*,|^button\[type/.test(l)) return 'J';
  if (/^\.required$|^\.error-message|^\.submission-message/.test(l)) return 'J';

  if (/^\.site-footer|^\.footer-info|^\.footer-nav|^\.footer-logos|^\.footer-logo|^\.university-logo|^\.himmp-logo|^\.ahrc-logo|^\.funder-logo/.test(l)) return 'K';

  if (/^\.read-more|^\.resource-button|^\.resource-buttons|^\.accordion|^\.callout|^\.info-box|^\.collaboration-note|^\.chapters-grid|^\.chapter-card|^\.section-divider|^\.chapter-resources|^\.references-/.test(l)) return 'L';

  return null;
}

function tally(rules) {
  const counts = Object.fromEntries(FAMILY_ORDER.map(k => [k, 0]));
  const unclass = [];
  for (const r of rules) {
    const k = classify(r.selector);
    if (k) counts[k]++; else unclass.push(r.selector);
  }
  return { counts, unclass };
}

const main = tally(mainJson.STRUCTURAL);
const resp = tally(respJson.STRUCTURAL);

// Manifest mode: emit the structured rule manifest and skip the stats
// print-out. The Unclassified: 0 gate is enforced BEFORE the manifest
// file is written — otherwise a future unclassified rule would cause
// an incomplete manifest to land at the requested path and a loose
// downstream consumer (one that only checks for file existence) could
// silently consume it.
if (manifestPath) {
  if (main.unclass.length > 0 || resp.unclass.length > 0) {
    console.error(
      `ERROR: ${main.unclass.length + resp.unclass.length} unclassified ` +
        `STRUCTURAL selector(s) — refusing to emit manifest (would be ` +
        `incomplete). Extend the family classifier so every STRUCTURAL ` +
        `rule lands in exactly one family.`
    );
    process.exit(1);
  }
  const manifest = [];
  function pushAll(rules, sourceFile) {
    for (const r of rules) {
      const family = classify(r.selector);
      if (!family) continue;
      // Inside an at-rule the audit yields a selector like
      // `@media (max-width: 767px) { .form-group.half`. Strip that
      // prefix for the manifest so downstream coverage matches the
      // inner selector against component CSS cleanly; the at-rule
      // context lives separately in `atRule`.
      let manifestSelector = r.selector;
      if (r.atRule && manifestSelector.startsWith(r.atRule)) {
        const cut = manifestSelector.indexOf('{ ', r.atRule.length);
        if (cut !== -1) {
          manifestSelector = manifestSelector.slice(cut + 2).trim();
        }
      }
      // Filter decls down to the structural subset. Each rule's full
      // decl set may contain palette/border/visual properties too;
      // those are handled by the token-coverage audit, not by this
      // gate.
      // Manifest mode requires the new `{property, value}` decl shape
      // emitted by audit-legacy-css.mjs in this same slice. A stale
      // pre-slice JSON file (with bare property-name strings) would
      // produce `value: null` entries here, silently fail downstream
      // value matches, and undermine the structural-coverage gate.
      // Fail fast instead.
      const structuralDecls = (r.decls || []).filter((d) => {
        if (typeof d === 'string' || d.value === undefined) {
          console.error(
            `Stale audit JSON: rule "${r.selector}" has property-name-only ` +
              `decls. Re-run audit-legacy-css.mjs (this slice's version) to ` +
              `regenerate JSON with property+value records.`
          );
          process.exit(2);
        }
        return isStructuralProp(d.property);
      });
      manifest.push({
        family,
        sourceFile,
        selector: manifestSelector,
        atRule: r.atRule ?? null,
        structuralDecls
      });
    }
  }
  pushAll(mainJson.STRUCTURAL, 'assets/css/main.css');
  pushAll(respJson.STRUCTURAL, 'assets/css/responsive.css');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Manifest written: ${manifestPath}`);
  console.log(`  ${manifest.length} structural rule(s) across families ${FAMILY_ORDER.join(', ')}.`);
  process.exit(0);
}

console.log('main.css STRUCTURAL:', mainJson.STRUCTURAL.length);
console.log('responsive.css STRUCTURAL:', respJson.STRUCTURAL.length);
console.log('\nFamily counts (main / responsive / combined):');
for (const k of FAMILY_ORDER) {
  const combined = main.counts[k] + resp.counts[k];
  console.log(`  ${k}: ${main.counts[k]} / ${resp.counts[k]} / ${combined}`);
}

console.log('\nUnclassified (main):', main.unclass.length);
for (const s of main.unclass) console.log('  ' + s);
console.log('\nUnclassified (responsive):', resp.unclass.length);
for (const s of resp.unclass) console.log('  ' + s);

// Enforce the D-1 structural-coverage gate. The audit doc declares
// that the unclassified count must be zero for the family map to be
// a valid coverage gate; without an exit-code signal a re-run could
// pass silently with new uncategorised CSS. Exit 1 surfaces the gap
// to any script or CI step that consumes this output.
if (main.unclass.length > 0 || resp.unclass.length > 0) {
  console.error(
    `\nERROR: ${main.unclass.length + resp.unclass.length} unclassified ` +
      `STRUCTURAL selector(s). Extend the family classifier in this script ` +
      `so every STRUCTURAL rule lands in exactly one family. See ` +
      `docs/nextjs-phase-2-d1-main-css-audit.md.`
  );
  process.exit(1);
}
