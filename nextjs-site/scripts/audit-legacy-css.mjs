import { readFileSync } from 'node:fs';
import {
  LAYOUT_PROPS,
  PALETTE_TYPE_PROPS,
  BORDER_PROPS,
  VISUAL_POLISH_PROPS
} from './lib/css-classes.mjs';

function classifyRule(decls) {
  const counts = { layout: 0, palette: 0, border: 0, visual: 0, other: 0 };
  for (const d of decls) {
    const prop = typeof d === 'string' ? d : d.property;
    if (LAYOUT_PROPS.has(prop)) counts.layout++;
    else if (PALETTE_TYPE_PROPS.has(prop)) counts.palette++;
    else if (BORDER_PROPS.has(prop)) counts.border++;
    else if (VISUAL_POLISH_PROPS.has(prop)) counts.visual++;
    else counts.other++;
  }
  if (counts.layout > 0) return 'STRUCTURAL';
  if (counts.palette > 0 && counts.border === 0 && counts.visual === 0) return 'palette-only';
  if (counts.palette > 0 || counts.border > 0 || counts.visual > 0) return 'visual';
  return 'misc';
}


// Strip C-style comments first
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function* iterRules(css) {
  let i = 0;
  while (i < css.length) {
    // Skip whitespace
    while (i < css.length && /\s/.test(css[i])) i++;
    if (i >= css.length) break;
    // Read selector up to {
    const start = i;
    let depth = 0;
    while (i < css.length && (css[i] !== '{' || depth > 0)) {
      if (css[i] === '(') depth++;
      else if (css[i] === ')') depth--;
      i++;
    }
    if (i >= css.length) break;
    const selector = css.slice(start, i).trim();
    i++; // consume {

    // Handle at-rules that wrap nested style rules
    if (selector.startsWith('@media') || selector.startsWith('@supports') || selector.startsWith('@container')) {
      // Recursively process nested rules
      let blockStart = i;
      let blockDepth = 1;
      while (i < css.length && blockDepth > 0) {
        if (css[i] === '{') blockDepth++;
        else if (css[i] === '}') blockDepth--;
        i++;
      }
      const inner = css.slice(blockStart, i - 1);
      for (const r of iterRules(inner)) {
        yield { selector: `${selector} { ${r.selector}`, decls: r.decls, atRule: selector };
      }
      continue;
    }

    // At-rules whose body is opaque to the structural audit
    // (@keyframes with its from/to nested blocks, @font-face, @page,
    // vendor-prefixed variants). Consume the entire block and skip
    // without yielding — otherwise the tokenizer would misparse the
    // nested keyframe blocks and inflate the `misc` bucket with
    // garbage entries.
    if (selector.startsWith('@')) {
      let blockDepth = 1;
      while (i < css.length && blockDepth > 0) {
        if (css[i] === '{') blockDepth++;
        else if (css[i] === '}') blockDepth--;
        i++;
      }
      continue;
    }

    // Read block until }
    const blockStart = i;
    let blockDepth = 1;
    while (i < css.length && blockDepth > 0) {
      if (css[i] === '{') blockDepth++;
      else if (css[i] === '}') blockDepth--;
      i++;
    }
    const block = css.slice(blockStart, i - 1);

    // Extract property+value records. The `decls` array used to be
    // property names only; downstream consumers (manifest emit, family
    // coverage audit) now need values too to verify migrated rules
    // reproduce `display: flex` vs `display: block`, not just that the
    // property is declared.
    const decls = [];
    for (const part of block.split(';')) {
      const p = part.trim();
      if (!p) continue;
      const colon = p.indexOf(':');
      if (colon === -1) continue;
      const property = p.slice(0, colon).trim();
      const value = p.slice(colon + 1).trim();
      decls.push({ property, value });
    }

    yield { selector, decls };
  }
}

const args = process.argv.slice(2);
const file = args[0];
const css = stripComments(readFileSync(file, 'utf8'));

const buckets = { STRUCTURAL: [], 'palette-only': [], visual: [], misc: [] };

for (const rule of iterRules(css)) {
  const cls = classifyRule(rule.decls);
  buckets[cls].push({ selector: rule.selector, decls: rule.decls, atRule: rule.atRule });
}

const format = args[1] === '--json' ? 'json' : 'text';

if (format === 'json') {
  const out = {};
  for (const [k, list] of Object.entries(buckets)) {
    out[k] = list.map((r) => ({
      selector: r.selector.replace(/\s+/g, ' ').trim(),
      decls: r.decls,
      // Normalise `atRule` the same way as `selector` so downstream
      // exact-field matching (audit-d1-family-coverage.mjs, the
      // legacy-style-retained whitelist) is stable across re-runs.
      // Without this, irregular whitespace in the legacy at-rule
      // text would produce key mismatches.
      atRule: r.atRule ? r.atRule.replace(/\s+/g, ' ').trim() : null
    }));
  }
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
} else {
  for (const [k, list] of Object.entries(buckets)) {
    console.log(`\n=== ${k.toUpperCase()} (${list.length}) ===`);
    for (const r of list) {
      const declSummary = r.decls
        .map((d) => (typeof d === 'string' ? d : `${d.property}: ${d.value}`))
        .join(', ');
      console.log(`${r.selector}\n  ${declSummary}`);
    }
  }
}

