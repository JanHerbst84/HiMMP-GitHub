import { readFileSync } from 'node:fs';

const LAYOUT_PROPS = new Set([
  'display', 'position', 'width', 'height', 'min-width', 'min-height',
  'max-width', 'max-height', 'top', 'right', 'bottom', 'left',
  'flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
  'justify-content', 'align-items', 'align-self', 'align-content',
  'gap', 'row-gap', 'column-gap', 'order',
  'grid', 'grid-template', 'grid-template-columns', 'grid-template-rows',
  'grid-template-areas', 'grid-column', 'grid-row', 'grid-area',
  'grid-auto-flow', 'grid-auto-columns', 'grid-auto-rows', 'place-items', 'place-self',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-block', 'padding-inline',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-block', 'margin-inline',
  'overflow', 'overflow-x', 'overflow-y', 'overflow-wrap',
  'box-sizing', 'z-index', 'float', 'clear', 'transform', 'transform-origin',
  'aspect-ratio', 'isolation', 'inset'
]);

const PALETTE_TYPE_PROPS = new Set([
  'color', 'background-color', 'background', 'background-image',
  'background-size', 'background-position', 'background-repeat',
  'font-family', 'font-size', 'font-weight', 'font-style',
  'line-height', 'letter-spacing', 'text-align', 'text-decoration',
  'text-transform', 'text-indent', 'text-shadow', 'word-spacing',
  'white-space', 'list-style', 'list-style-type'
]);

const BORDER_PROPS = new Set([
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-color', 'border-style', 'border-width',
  'border-radius', 'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-left-radius', 'border-bottom-right-radius',
  'outline', 'outline-color', 'outline-style', 'outline-width'
]);

const VISUAL_POLISH_PROPS = new Set([
  'opacity', 'visibility', 'box-shadow', 'filter', 'backdrop-filter',
  'cursor', 'pointer-events', 'user-select', 'transition', 'animation',
  'animation-name', 'animation-duration', 'animation-timing-function',
  'animation-delay', 'animation-iteration-count', 'will-change',
  'scroll-behavior', 'content', 'object-fit', 'object-position'
]);

function classifyRule(decl) {
  const counts = { layout: 0, palette: 0, border: 0, visual: 0, other: 0 };
  for (const prop of decl) {
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

    // Extract property names
    const decls = [];
    for (const part of block.split(';')) {
      const p = part.trim();
      if (!p) continue;
      const colon = p.indexOf(':');
      if (colon === -1) continue;
      decls.push(p.slice(0, colon).trim());
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
      atRule: r.atRule ?? null
    }));
  }
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
} else {
  for (const [k, list] of Object.entries(buckets)) {
    console.log(`\n=== ${k.toUpperCase()} (${list.length}) ===`);
    for (const r of list) {
      console.log(`${r.selector}\n  ${r.decls.join(', ')}`);
    }
  }
}
