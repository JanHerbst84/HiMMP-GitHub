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
 * Pair with `docs/nextjs-phase-2-d1-main-css-audit.md`.
 */
import { existsSync, readFileSync } from 'node:fs';

const [mainPath, respPath] = process.argv.slice(2);

if (!mainPath || !respPath) {
  console.error('Usage: node classify-css-families.mjs <main-audit.json> <responsive-audit.json>');
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
