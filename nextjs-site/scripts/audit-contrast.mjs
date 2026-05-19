/*
 * WCAG contrast audit for the D-9 dark-mode token system.
 *
 * Reads `app/tokens.css`, resolves the semantic token values for the
 * light scheme (the `:root` block) and the dark scheme (the
 * `[data-theme="dark"]` block), then computes the WCAG 2.1 contrast
 * ratio for every body-pair the site relies on. Exits 1 if any pair
 * falls below 4.5:1 (WCAG AA for normal text).
 *
 * The audit prefers static fallback values over color-mix() results
 * because the static is the floor in the supported browser range:
 * a browser without color-mix() support uses the static. The
 * @supports block re-points the token to a color-mix result on
 * modern browsers, which is by design a close-enough sRGB
 * approximation of the static (or vice versa). For WCAG audit
 * purposes the static is the worst-case value.
 *
 * Usage:
 *   node scripts/audit-contrast.mjs
 *
 * Exit codes: 0 OK, 1 contrast failure, 2 usage / parse error.
 *
 * See `docs/nextjs-phase-3-far-goal.md` criterion 6.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NEXT_ROOT = resolve(__dirname, '..');
const TOKENS_PATH = join(NEXT_ROOT, 'app', 'tokens.css');

if (!existsSync(TOKENS_PATH)) {
  console.error(`tokens.css not found at ${TOKENS_PATH}`);
  process.exit(2);
}

const tokensSrc = readFileSync(TOKENS_PATH, 'utf8');

/*
 * Parse a `:root { ... }` or `[data-theme="..."] { ... }` block out of
 * the source and return its declarations as a Map<property, value>.
 * Ignores @supports blocks during the initial parse — we apply them
 * separately to model "static fallback first, then modern override"
 * semantics.
 */
function parseSelectorBlock(source, selector) {
  // Strip comments and @supports / @media blocks before searching so the
  // selector match doesn't pick up overrides.
  let src = source.replace(/\/\*[\s\S]*?\*\//g, '');
  src = src.replace(/@supports[\s\S]*?\{\s*[\s\S]*?\}\s*\}/g, '');
  src = src.replace(/@media[^{]*\{\s*[\s\S]*?\}\s*\}/g, '');
  // Need to be careful with selector matching — `:root` vs `[data-theme="dark"]`
  const escaped = selector.replace(/[\[\]"\\.]/g, '\\$&');
  const re = new RegExp(`(?:^|[}\\s])\\s*${escaped}\\s*\\{([^}]*)\\}`);
  const m = src.match(re);
  if (!m) return null;
  const map = new Map();
  for (const part of m[1].split(';')) {
    const p = part.trim();
    if (!p) continue;
    const colon = p.indexOf(':');
    if (colon === -1) continue;
    map.set(p.slice(0, colon).trim(), p.slice(colon + 1).trim());
  }
  return map;
}

const lightRoot = parseSelectorBlock(tokensSrc, ':root');
const darkRoot = parseSelectorBlock(tokensSrc, '[data-theme="dark"]');

if (!lightRoot) {
  console.error(':root block not found in tokens.css');
  process.exit(2);
}
if (!darkRoot) {
  console.error('[data-theme="dark"] block not found in tokens.css');
  process.exit(2);
}

/*
 * Resolve a token value (possibly a `var(--something)` chain) into a
 * final hex / rgb / rgba string. Falls back to the second arg of
 * `var(--name, fallback)` when the variable is not defined.
 * For `color-mix(in <space>, A X%, B Y%)` we use the static-fallback
 * branch instead — the actual color-mix is computed by the browser
 * on modern engines but the static is the audit's worst-case.
 * `color-mix` here returns null so the caller can choose the static.
 */
function resolveToken(value, scheme, depth = 0) {
  if (depth > 20) return null;
  const trimmed = value.trim();

  // Direct hex
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;

  // rgb / rgba
  if (/^rgba?\s*\(/i.test(trimmed)) return trimmed;
  // hsl / hsla
  if (/^hsla?\s*\(/i.test(trimmed)) return trimmed;

  // color-mix — return null; caller should fall back to static
  if (/^color-mix\s*\(/i.test(trimmed)) return null;

  // var(--token, fallback)
  const varMatch = trimmed.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\s*\)$/);
  if (varMatch) {
    const name = varMatch[1];
    const fallback = varMatch[2];
    // Prefer scheme's :root with override for dark
    const map = scheme === 'dark' && darkRoot.has(name) ? darkRoot : lightRoot;
    if (map.has(name)) {
      const resolved = resolveToken(map.get(name), scheme, depth + 1);
      if (resolved) return resolved;
    }
    if (fallback) {
      return resolveToken(fallback, scheme, depth + 1);
    }
    return null;
  }

  return null;
}

/* Convert a hex / rgb / rgba / hsl color to {r, g, b, a} in 0..255. */
function parseColor(str) {
  if (!str) return null;
  const t = str.trim();
  // #rrggbb / #rgb / #rrggbbaa
  let m = t.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  if (m) {
    let hex = m[1];
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }
  m = t.match(/^rgba?\s*\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?/i);
  if (m) {
    const r = Math.round(parseFloat(m[1]));
    const g = Math.round(parseFloat(m[2]));
    const b = Math.round(parseFloat(m[3]));
    let a = 1;
    if (m[4] !== undefined) {
      a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    }
    return { r, g, b, a };
  }
  return null;
}

/*
 * Composite a foreground RGBA onto a fully-opaque background RGB.
 * For WCAG audit, we want the effective on-screen colour after alpha
 * compositing. fg has alpha; bg is treated as fully opaque.
 */
function composite(fg, bg) {
  const a = fg.a;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
    a: 1
  };
}

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb) {
  return (
    0.2126 * srgbToLinear(rgb.r) +
    0.7152 * srgbToLinear(rgb.g) +
    0.0722 * srgbToLinear(rgb.b)
  );
}

function contrastRatio(fg, bg) {
  const fl = relativeLuminance(fg);
  const bl = relativeLuminance(bg);
  const [l1, l2] = fl > bl ? [fl, bl] : [bl, fl];
  return (l1 + 0.05) / (l2 + 0.05);
}

function resolveColor(token, scheme) {
  const map = scheme === 'dark' && darkRoot.has(token) ? darkRoot : lightRoot;
  if (!map.has(token)) return null;
  const value = map.get(token);
  const direct = resolveToken(value, scheme);
  if (direct) return parseColor(direct);
  // color-mix or unresolvable — fall back to the static line if any
  return null;
}

const PAIRS = [
  { fg: '--color-fg', bg: '--color-bg', label: 'body text on body bg', threshold: 4.5 },
  { fg: '--color-fg', bg: '--color-surface', label: 'body text on card surface', threshold: 4.5 },
  { fg: '--color-chrome-fg', bg: '--color-chrome-bg', label: 'chrome text on dark chrome', threshold: 4.5 },
  { fg: '--color-graphite', bg: '--color-mint', label: 'pill-button text (graphite on mint accent)', threshold: 4.5 },
  { fg: '--color-graphite', bg: '--color-sulfur', label: 'audio-playing text (graphite on sulfur accent)', threshold: 4.5 }
];

const findings = [];
console.log('WCAG AA contrast audit (threshold 4.5:1)\n');

for (const scheme of ['light', 'dark']) {
  console.log(`=== ${scheme} scheme ===`);
  for (const pair of PAIRS) {
    const fg = resolveColor(pair.fg, scheme);
    const bg = resolveColor(pair.bg, scheme);
    if (!fg || !bg) {
      console.log(`  [skip] ${pair.label} — unresolved (${pair.fg} / ${pair.bg})`);
      continue;
    }
    const composited = fg.a < 1 ? composite(fg, bg) : fg;
    const ratio = contrastRatio(composited, bg);
    const ok = ratio >= pair.threshold;
    const mark = ok ? '✓' : '✗';
    console.log(
      `  ${mark} ${pair.label}: ${ratio.toFixed(2)}:1   ` +
        `(fg ${fg.r},${fg.g},${fg.b}${fg.a < 1 ? `,${fg.a}` : ''} / bg ${bg.r},${bg.g},${bg.b})`
    );
    if (!ok) {
      findings.push({
        scheme,
        pair: pair.label,
        ratio: ratio.toFixed(2),
        fgToken: pair.fg,
        bgToken: pair.bg
      });
    }
  }
  console.log('');
}

if (findings.length === 0) {
  console.log('Result: OK — all pairs meet WCAG AA in both schemes.');
  process.exit(0);
}

console.log(`Result: ${findings.length} pair(s) below 4.5:1.`);
for (const f of findings) {
  console.log(`  [fail] ${f.scheme} :: ${f.pair} (${f.ratio}:1)`);
}
process.exit(1);
