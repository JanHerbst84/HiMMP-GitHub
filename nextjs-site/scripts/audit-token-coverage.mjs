/*
 * Token-coverage audit.
 *
 * Scans every component CSS source (`app/globals.css`, `app/tokens.css`,
 * every `*.module.css` under `src/site/`) AND every `<style>` block
 * content extracted from the 27 legacy HTML head sections (the same
 * surface `<LegacyStyles>` emits on each route), parses every
 * declaration, and flags any literal color value in any color-bearing
 * property whose value does not resolve via `var(--color-*)` tokens.
 *
 * Whitelist file (optional): `audit-token-coverage.allowed.json` —
 * array of `{ source, selector, property, value, rationale }` records,
 * each justifying a specific literal-color exception (e.g. the
 * semantic audio-status chip backgrounds `#eef9f5`/`#eef4ff`/`#fff1f1`
 * that are intentional and not page-surface neutrals).
 *
 * Usage:
 *   node scripts/audit-token-coverage.mjs [--legacy-styles] [--strict-font-family]
 *
 * Exit codes:
 *   0 — no unwhitelisted literal-color declarations.
 *   1 — one or more findings.
 *   2 — usage error.
 *
 * See `docs/nextjs-phase-2-far-goal.md` criterion 3.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLOR_BEARING_PROPS } from './lib/css-classes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const NEXT_ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
let scanLegacyStyles = true;
let strictFontFamily = false;
for (const a of args) {
  if (a === '--legacy-styles') scanLegacyStyles = true;
  else if (a === '--no-legacy-styles') scanLegacyStyles = false;
  else if (a === '--strict-font-family') strictFontFamily = true;
  else {
    console.error(`Unknown argument: ${a}`);
    process.exit(2);
  }
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
        yield* iterRules(inner, selector);
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

const NAMED_COLOR_RE = /\b(white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|silver|gold|brown|cyan|magenta|aliceblue|antiquewhite|aqua|lightgray|lightgrey|darkgray|darkgrey)\b/i;
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;
const RGB_RE = /\brgba?\s*\(/i;
const HSL_RE = /\bhsla?\s*\(/i;
const LAB_RE = /\b(lab|lch|oklab|hwb)\s*\(/i;
const TOKEN_RE = /\bvar\s*\(\s*--[\w-]+/;

// Tighter guard than v1: instead of exempting any value that contains
// both `var(--color-*)` and `color-mix(`, only the canonical
// `color-mix(in <space>, var(--color-*) ...)` shape is exempt. This
// prevents a shorthand like `background: var(--color-bone), color-mix(
// in srgb, #c00 50%, transparent)` from sneaking a literal #c00
// through the gate just because a token reference exists elsewhere in
// the value.
const TOKENISED_COLOR_MIX_RE = /color-mix\s*\(\s*in\s+\w[\w-]*\s*,\s*var\s*\(\s*--[\w-]+/i;

function findLiteralColor(value) {
  const v = value.trim();
  if (/^(none|transparent|inherit|currentColor|initial|unset|revert)$/i.test(v)) {
    return null;
  }
  // Idiomatic exemption: `color-mix(in oklch, var(--color-X) Y%, white)` —
  // the literal black/white terminal is unavoidable and is exempt by
  // design. The tightened regex requires the first color-stop to be a
  // `var(--…)`, not merely that the value contains a `var()` reference
  // anywhere alongside any color-mix().
  if (TOKENISED_COLOR_MIX_RE.test(v)) return null;
  if (HEX_RE.test(v)) return { kind: 'hex', match: v.match(HEX_RE)[0] };
  if (RGB_RE.test(v) && !TOKEN_RE.test(v)) return { kind: 'rgb', match: v.match(/\brgba?\s*\([^)]+\)/i)[0] };
  if (HSL_RE.test(v) && !TOKEN_RE.test(v)) return { kind: 'hsl', match: v.match(/\bhsla?\s*\([^)]+\)/i)[0] };
  if (LAB_RE.test(v) && !TOKEN_RE.test(v)) return { kind: 'lab', match: v.match(/\b(lab|lch|oklab|hwb)\s*\([^)]+\)/i)[0] };
  if (NAMED_COLOR_RE.test(v)) return { kind: 'named', match: v.match(NAMED_COLOR_RE)[0] };
  return null;
}

function findLiteralFontFamily(value) {
  if (TOKEN_RE.test(value)) return null;
  if (/^(inherit|initial|unset|revert)$/i.test(value.trim())) return null;
  return { kind: 'font-family-literal', match: value.trim() };
}

function loadWhitelist(path) {
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, 'utf8'));
}
const whitelist = loadWhitelist(
  join(NEXT_ROOT, 'scripts', 'audit-token-coverage.allowed.json')
);

function isWhitelisted(source, selector, property, value) {
  return whitelist.some(
    (e) =>
      e.source === source &&
      e.selector === selector &&
      e.property === property &&
      e.value === value
  );
}

function collectComponentCssSources() {
  const sources = [];
  function pushFile(path) {
    if (!existsSync(path)) return;
    sources.push({ id: path, css: readFileSync(path, 'utf8') });
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

function collectLegacyStyleSources() {
  const sources = [];
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
    let idx = 0;
    while ((m = re.exec(head)) !== null) {
      sources.push({ id: `LegacyStyles:${route}#${idx}`, css: m[1] });
      idx++;
    }
  }
  return sources;
}

const componentSources = collectComponentCssSources();
const legacySources = scanLegacyStyles ? collectLegacyStyleSources() : [];
const findings = [];

function scanSource({ id, css }) {
  for (const rule of parseCss(css)) {
    for (const d of rule.decls) {
      const isColorBearing = COLOR_BEARING_PROPS.has(d.property);
      const isFontFamily = d.property === 'font-family';
      if (isColorBearing) {
        const hit = findLiteralColor(d.value);
        if (hit && !isWhitelisted(id, rule.selectorRaw, d.property, d.value)) {
          findings.push({
            source: id,
            selector: rule.selectorRaw,
            property: d.property,
            value: d.value,
            kind: hit.kind,
            literal: hit.match
          });
        }
      }
      if (isFontFamily && strictFontFamily) {
        const hit = findLiteralFontFamily(d.value);
        if (hit && !isWhitelisted(id, rule.selectorRaw, d.property, d.value)) {
          findings.push({
            source: id,
            selector: rule.selectorRaw,
            property: d.property,
            value: d.value,
            kind: hit.kind,
            literal: hit.match
          });
        }
      }
    }
  }
}

for (const s of componentSources) scanSource(s);
for (const s of legacySources) scanSource(s);

console.log('Token-coverage audit');
console.log(`  Component CSS files scanned: ${componentSources.length}`);
console.log(`  LegacyStyles head blocks scanned: ${legacySources.length}`);
console.log(`  Whitelist entries: ${whitelist.length}`);

if (findings.length === 0) {
  console.log('  Result: OK (no unwhitelisted literal colors).');
  process.exit(0);
}

console.log(`  Result: ${findings.length} finding(s).`);
for (const f of findings) {
  console.log(`    [${f.kind}] ${f.source} ${f.selector} :: ${f.property}: ${f.value}   (literal: ${f.literal})`);
}
process.exit(1);
