/*
 * D-1 family-coverage audit.
 *
 * Reads the structured rule manifest emitted by
 * `classify-css-families.mjs --manifest-json <path>` and verifies, for
 * a named family (or all families), that every manifested selector is
 * present in the migrated component CSS with every required structural
 * declaration reproduced under the matching `@media` context.
 *
 * Also scans extracted LegacyStyles head `<style>` block content for
 * the 27 routes. A LegacyStyles structural declaration on a
 * D-1-touched selector is either redundant (component CSS reproduces
 * it under the same cascade context) or it must be whitelisted with a
 * rationale; otherwise the audit fails (the LegacyStyles `<style>`
 * block ships AFTER the global stylesheet in document order and could
 * silently mask missing component CSS).
 *
 * Usage:
 *   node scripts/audit-d1-family-coverage.mjs --family H --manifest <path>
 *   node scripts/audit-d1-family-coverage.mjs --all-families --manifest <path>
 *
 * Exit codes:
 *   0 — coverage complete.
 *   1 — coverage gap (missing selector, missing decl, wrong value,
 *       or unaccounted LegacyStyles decl).
 *   2 — usage error or input not found.
 *
 * Optional whitelists (empty by default):
 *   audit-d1-family-coverage.allowed.json — modernisation equivalences.
 *   audit-d1-family-coverage.legacy-style-retained.json — intentional retentions.
 *
 * Per the far-goal anti-staleness rule, the manifest is regenerated
 * into a per-PID temp path in the SAME invocation as the coverage
 * check via the `audit:family-coverage:*` npm wrappers. Passing a
 * pre-existing path is allowed but the caller owns freshness.
 *
 * See `docs/nextjs-phase-2-far-goal.md` criteria 8 and 9.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEquivalenceReplacement } from './lib/d1-equivalence.mjs';
import { isStructuralProp } from './lib/css-classes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const NEXT_ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
let family = null;
let allFamilies = false;
let manifestPath = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--family') { family = args[++i]; }
  else if (args[i] === '--all-families') { allFamilies = true; }
  else if (args[i] === '--manifest') { manifestPath = args[++i]; }
  else {
    console.error(`Unknown argument: ${args[i]}`);
    process.exit(2);
  }
}

if (!manifestPath) {
  console.error('Usage: node audit-d1-family-coverage.mjs (--family <X> | --all-families) --manifest <path>');
  process.exit(2);
}
if (!family && !allFamilies) {
  console.error('Must specify --family <X> or --all-families');
  process.exit(2);
}
if (!existsSync(manifestPath)) {
  console.error(`Manifest not found: ${manifestPath}`);
  process.exit(2);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const targetRules = allFamilies ? manifest : manifest.filter((r) => r.family === family);

if (targetRules.length === 0) {
  console.error(`No rules in manifest for family ${family ?? '(all)'}`);
  process.exit(2);
}

function normaliseAtRule(rule) {
  if (!rule) return null;
  return rule
    .replace(/\s+/g, ' ')
    .replace(/\(\s*/g, '(')
    .replace(/\s*\)/g, ')')
    .replace(/\s*:\s*/g, ': ')
    .trim();
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function parseCss(source) {
  const css = stripComments(source);
  const out = [];
  function* iterRules(src, atRule = null) {
    let i = 0;
    while (i < src.length) {
      while (i < src.length && /\s/.test(src[i])) i++;
      if (i >= src.length) break;
      const start = i;
      let depth = 0;
      while (i < src.length && (src[i] !== '{' || depth > 0)) {
        if (src[i] === '(') depth++;
        else if (src[i] === ')') depth--;
        i++;
      }
      if (i >= src.length) break;
      const selector = src.slice(start, i).trim();
      i++;
      if (
        selector.startsWith('@media') ||
        selector.startsWith('@supports') ||
        selector.startsWith('@container')
      ) {
        const innerStart = i;
        let bd = 1;
        while (i < src.length && bd > 0) {
          if (src[i] === '{') bd++;
          else if (src[i] === '}') bd--;
          i++;
        }
        const inner = src.slice(innerStart, i - 1);
        yield* iterRules(inner, normaliseAtRule(selector));
        continue;
      }
      if (selector.startsWith('@')) {
        let bd = 1;
        while (i < src.length && bd > 0) {
          if (src[i] === '{') bd++;
          else if (src[i] === '}') bd--;
          i++;
        }
        continue;
      }
      const blockStart = i;
      let bd = 1;
      while (i < src.length && bd > 0) {
        if (src[i] === '{') bd++;
        else if (src[i] === '}') bd--;
        i++;
      }
      const block = src.slice(blockStart, i - 1);
      const decls = [];
      for (const part of block.split(';')) {
        const p = part.trim();
        if (!p) continue;
        const colon = p.indexOf(':');
        if (colon === -1) continue;
        decls.push({
          property: p.slice(0, colon).trim(),
          value: p.slice(colon + 1).trim()
        });
      }
      yield { selectorRaw: selector, atRule, decls };
    }
  }
  for (const r of iterRules(css)) out.push(r);
  return out;
}

/*
 * Generate selector candidates from a target component-CSS selector by
 * stripping the project-specific specificity-bump prefixes used in
 * `app/globals.css`:
 *   - `html ` prefix (Slice E convention, raises specificity from
 *     0,0,1 to 0,0,2).
 *   - `[data-page="X"] ` prefix (D-2b/c scoped page redesigns).
 *   - `:is(a, b, c) ` wrapper (multi-page hero allowlist pattern).
 *   - Any combination of the above (e.g. `html [data-page="A"] .foo`).
 * Returns an array of candidate selectors to test against the legacy form.
 */
function expandTargetCandidates(targetSel) {
  const seen = new Set();
  const stack = [targetSel.replace(/\s+/g, ' ').trim()];
  while (stack.length) {
    const cur = stack.pop();
    if (seen.has(cur)) continue;
    seen.add(cur);
    // html prefix strip
    const noHtml = cur.replace(/^html\s+/i, '');
    if (noHtml !== cur) stack.push(noHtml);
    // [data-page="X"] prefix strip
    const noDataPage = cur.replace(/^\[data-page="[^"]*"\]\s+/, '');
    if (noDataPage !== cur) stack.push(noDataPage);
    // :is(a, b, c) prefix expansion — yields one candidate per arg.
    const isMatch = cur.match(/^:is\(([^)]*)\)(\s+.*)?$/);
    if (isMatch) {
      const args = isMatch[1].split(',').map((s) => s.trim());
      const suffix = isMatch[2] ?? '';
      for (const a of args) {
        stack.push((a + suffix).trim());
      }
    }
  }
  return Array.from(seen);
}

function selectorMatches(legacySel, targetSel) {
  const legacy = legacySel.replace(/\s+/g, ' ').trim();
  const candidates = new Set();
  // Expand the target through prefix/wrapper transforms.
  for (const c of expandTargetCandidates(targetSel)) {
    candidates.add(c);
    // Also expand comma lists at each level — the target may be a
    // selector list where one part matches the legacy.
    for (const part of c.split(',').map((s) => s.trim())) {
      candidates.add(part);
      for (const sub of expandTargetCandidates(part)) candidates.add(sub);
    }
  }
  if (candidates.has(legacy)) return true;
  // The legacy selector itself may be a list; require all parts to
  // appear in the candidate set.
  const legacyParts = legacy.split(',').map((s) => s.trim());
  if (legacyParts.length > 1) {
    return legacyParts.every((lp) => candidates.has(lp));
  }
  return false;
}

function collectComponentCssRules() {
  const sources = [];
  function pushFile(path) {
    if (!existsSync(path)) return;
    const css = readFileSync(path, 'utf8');
    for (const r of parseCss(css)) {
      sources.push({ ...r, sourceFile: path });
    }
  }
  pushFile(join(NEXT_ROOT, 'app', 'globals.css'));
  pushFile(join(NEXT_ROOT, 'app', 'tokens.css'));
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (entry.endsWith('.module.css')) pushFile(full);
    }
  }
  walk(join(NEXT_ROOT, 'src', 'site'));
  return sources;
}

function collectLegacyStyleBlocks() {
  const blocks = [];
  const findingsDir = join(REPO_ROOT, 'findings');
  const rootHtmlNames = [
    'index.html', 'about.html', 'approach.html', 'team.html',
    'publications.html', 'findings.html', 'videos.html', 'audio.html',
    'faq.html', 'contact.html', 'privacy.html', 'acknowledgements.html'
  ];
  const candidates = [];
  for (const name of rootHtmlNames) {
    const p = join(REPO_ROOT, name);
    if (existsSync(p)) candidates.push({ route: name, path: p });
  }
  if (existsSync(findingsDir)) {
    for (const entry of readdirSync(findingsDir)) {
      if (entry.endsWith('.html')) {
        candidates.push({ route: `findings/${entry}`, path: join(findingsDir, entry) });
      }
    }
  }
  for (const { route, path } of candidates) {
    const html = readFileSync(path, 'utf8');
    const headMatch = html.match(/<head\b[\s\S]*?<\/head>/i);
    if (!headMatch) continue;
    const head = headMatch[0];
    const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
    let m;
    let blockIndex = 0;
    while ((m = re.exec(head)) !== null) {
      const css = m[1];
      for (const r of parseCss(css)) {
        blocks.push({
          ...r,
          sourceFile: `LegacyStyles:${route}`,
          legacyRoute: route,
          legacySourceBlockIndex: blockIndex
        });
      }
      blockIndex++;
    }
  }
  return blocks;
}

function loadWhitelist(path) {
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, 'utf8'));
}
const equivalences = loadWhitelist(
  join(NEXT_ROOT, 'scripts', 'audit-d1-family-coverage.allowed.json')
);
const retainedLegacyStyles = loadWhitelist(
  join(NEXT_ROOT, 'scripts', 'audit-d1-family-coverage.legacy-style-retained.json')
);

function findEquivalence(fam, selector, legacyDecl) {
  return equivalences.find(
    (e) =>
      e.family === fam &&
      (e.selector === selector || selectorMatches(e.selector, selector)) &&
      e.legacyDecl.property === legacyDecl.property &&
      e.legacyDecl.value === legacyDecl.value
  );
}

function findRetainedEntry(legacyRoute, sourceBlockIndex, selector, atRule, property, value) {
  return retainedLegacyStyles.find(
    (e) =>
      e.route === legacyRoute &&
      e.sourceBlockIndex === sourceBlockIndex &&
      e.selector === selector &&
      (e.atRule ?? null) === (atRule ?? null) &&
      e.property === property &&
      e.value === value
  );
}

const componentRules = collectComponentCssRules();
const legacyStyleRules = collectLegacyStyleBlocks();
const failures = [];
let checkedSelectorCount = 0;

for (const mRule of targetRules) {
  checkedSelectorCount++;
  const legacyAt = normaliseAtRule(mRule.atRule);
  const matchingComponent = componentRules.filter(
    (cr) =>
      normaliseAtRule(cr.atRule) === legacyAt && selectorMatches(mRule.selector, cr.selectorRaw)
  );
  if (matchingComponent.length === 0) {
    failures.push({
      kind: 'missing-selector',
      family: mRule.family,
      selector: mRule.selector,
      atRule: legacyAt
    });
    continue;
  }
  const presentProps = new Map();
  for (const cr of matchingComponent) {
    for (const d of cr.decls) {
      presentProps.set(d.property, { value: d.value, sourceFile: cr.sourceFile });
    }
  }
  for (const legacyDecl of mRule.structuralDecls) {
    if (!isStructuralProp(legacyDecl.property)) continue;
    const equivalence = findEquivalence(mRule.family, mRule.selector, legacyDecl);
    if (equivalence) {
      const equivalenceFailure = validateEquivalenceReplacement(equivalence, presentProps);
      if (equivalenceFailure) {
        failures.push({
          ...equivalenceFailure,
          family: mRule.family,
          selector: mRule.selector,
          atRule: legacyAt
        });
      }
      continue;
    }
    const present = presentProps.get(legacyDecl.property);
    if (!present) {
      failures.push({
        kind: 'missing-decl',
        family: mRule.family,
        selector: mRule.selector,
        atRule: legacyAt,
        property: legacyDecl.property,
        expectedValue: legacyDecl.value
      });
      continue;
    }
    if (
      present.value.replace(/\s+/g, ' ').trim() !==
      legacyDecl.value.replace(/\s+/g, ' ').trim()
    ) {
      failures.push({
        kind: 'wrong-value',
        family: mRule.family,
        selector: mRule.selector,
        atRule: legacyAt,
        property: legacyDecl.property,
        expectedValue: legacyDecl.value,
        actualValue: present.value,
        actualSource: present.sourceFile
      });
    }
  }
}

const targetSelectors = new Set(targetRules.map((r) => r.selector));
for (const lsr of legacyStyleRules) {
  for (const d of lsr.decls) {
    if (!isStructuralProp(d.property)) continue;
    let matched = false;
    for (const ts of targetSelectors) {
      if (selectorMatches(ts, lsr.selectorRaw) || ts === lsr.selectorRaw) {
        matched = true;
        break;
      }
    }
    if (!matched) continue;
    const reproducedInComponent = componentRules.some(
      (cr) =>
        normaliseAtRule(cr.atRule) === normaliseAtRule(lsr.atRule) &&
        selectorMatches(lsr.selectorRaw, cr.selectorRaw) &&
        cr.decls.some((cd) => cd.property === d.property && cd.value === d.value)
    );
    if (reproducedInComponent) continue;
    const entry = findRetainedEntry(
      lsr.legacyRoute,
      lsr.legacySourceBlockIndex,
      lsr.selectorRaw,
      lsr.atRule,
      d.property,
      d.value
    );
    if (entry) continue;
    failures.push({
      kind: 'legacy-style-unaccounted',
      legacyRoute: lsr.legacyRoute,
      sourceBlockIndex: lsr.legacySourceBlockIndex,
      selector: lsr.selectorRaw,
      atRule: lsr.atRule,
      property: d.property,
      value: d.value
    });
  }
}

const scope = allFamilies ? 'all families' : `family ${family}`;
console.log(`D-1 family-coverage audit — ${scope}`);
console.log(`  Manifest: ${manifestPath}`);
console.log(`  Selectors checked: ${checkedSelectorCount}`);
console.log(`  Component CSS rules scanned: ${componentRules.length}`);
console.log(`  LegacyStyles head rules scanned: ${legacyStyleRules.length}`);

if (failures.length === 0) {
  console.log('  Result: OK (no missing selectors, no missing declarations, no unaccounted LegacyStyles).');
  process.exit(0);
}

console.log(`  Result: ${failures.length} finding(s).`);
for (const f of failures) {
  if (f.kind === 'missing-selector') {
    console.log(`    [missing-selector] ${f.family} ${f.selector}${f.atRule ? ` @ ${f.atRule}` : ''}`);
  } else if (f.kind === 'missing-decl') {
    console.log(`    [missing-decl]     ${f.family} ${f.selector}${f.atRule ? ` @ ${f.atRule}` : ''} :: ${f.property}: ${f.expectedValue}`);
  } else if (f.kind === 'wrong-value') {
    console.log(`    [wrong-value]      ${f.family} ${f.selector}${f.atRule ? ` @ ${f.atRule}` : ''} :: ${f.property}: expected '${f.expectedValue}', got '${f.actualValue}' (${f.actualSource})`);
  } else if (f.kind === 'invalid-equivalence') {
    console.log(`    [invalid-equivalence] ${f.family} ${f.selector}${f.atRule ? ` @ ${f.atRule}` : ''} :: replacementDecl must name a property and string value`);
  } else if (f.kind === 'missing-equivalence-replacement') {
    console.log(`    [missing-equivalence-replacement] ${f.family} ${f.selector}${f.atRule ? ` @ ${f.atRule}` : ''} :: ${f.property}: expected '${f.expectedValue}'`);
  } else if (f.kind === 'wrong-equivalence-replacement') {
    console.log(`    [wrong-equivalence-replacement] ${f.family} ${f.selector}${f.atRule ? ` @ ${f.atRule}` : ''} :: ${f.property}: expected '${f.expectedValue}', got '${f.actualValue}' (${f.actualSource})`);
  } else if (f.kind === 'legacy-style-unaccounted') {
    console.log(`    [legacy-style-unaccounted] ${f.legacyRoute}#${f.sourceBlockIndex} ${f.selector}${f.atRule ? ` @ ${f.atRule}` : ''} :: ${f.property}: ${f.value}`);
  }
}
process.exit(1);
