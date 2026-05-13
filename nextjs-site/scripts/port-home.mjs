import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const source = readFileSync(path.join(repoRoot, 'index.html'), 'utf8');

const mainMatch = source.match(/<main\b[^>]*id="main-content"[^>]*>([\s\S]*?)<\/main>/i);
if (!mainMatch) throw new Error('no main found');

let body = mainMatch[1];

// Slice off the hero <section> at the top so we can render it as a
// dedicated React component (HomeHero) per docs/nextjs-phase-2-
// design-refresh-future.md § D-2 "proper". The rest of main is
// mechanically converted as a single HomeMain JSX block.
const heroOpenRe = /<section class="hero"[^>]*>/i;
const heroOpen = body.match(heroOpenRe);
if (!heroOpen) throw new Error('no hero open found');
const heroOpenIdx = body.indexOf(heroOpen[0]);
let cursor = heroOpenIdx + heroOpen[0].length;
let depth = 1;
while (depth > 0 && cursor < body.length) {
  const open = body.slice(cursor).search(/<section\b/i);
  const close = body.slice(cursor).search(/<\/section>/i);
  if (close === -1) throw new Error('unbalanced section');
  if (open !== -1 && open < close) { depth++; cursor += open + 8; }
  else { depth--; cursor += close + 10; }
}
const heroEnd = cursor;
const afterHero = body.slice(heroEnd).trimStart();

function cssToJsxStyle(decl) {
  const props = decl.split(';').map((s) => s.trim()).filter(Boolean);
  let hasCustomProp = false;
  const entries = props.map((p) => {
    const colon = p.indexOf(':');
    const key = p.slice(0, colon).trim();
    const val = p.slice(colon + 1).trim();
    let camelKey;
    if (key.startsWith('--')) {
      camelKey = `"${key}"`;
      hasCustomProp = true;
    } else {
      camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    }
    const escapedVal = val.replace(/"/g, '\\"');
    return `${camelKey}: "${escapedVal}"`;
  });
  const inner = `{ ${entries.join(', ')} }`;
  return hasCustomProp ? `style={${inner} as Record<string, string>}` : `style={${inner}}`;
}

const jsx = afterHero
  .replace(/\bclass=/g, 'className=')
  .replace(/\bfor=/g, 'htmlFor=')
  .replace(/<br>/gi, '<br />')
  .replace(/<hr>/gi, '<hr />')
  .replace(/<input\b([^>]*)>/gi, '<input$1 />')
  .replace(/<img\b([^>]*?)(\s*\/)?>/gi, (_m, attrs) => `<img${attrs.replace(/\s*\/?\s*$/, '')} />`)
  .replace(/<source\b([^>]*?)(\s*\/)?>/gi, (_m, attrs) => `<source${attrs.replace(/\s*\/?\s*$/, '')} />`)
  .replace(/\bsrcset=/g, 'srcSet=')
  .replace(/\bframeborder=/g, 'frameBorder=')
  .replace(/\ballowfullscreen\b/gi, 'allowFullScreen')
  .replace(/\bstyle="([^"]+)"/g, (_match, decl) => cssToJsxStyle(decl))
  // Escape bare ampersands used as the word "and" in JSX text content
  // (e.g. "Project Archive & Key Outputs"). Babel/SWC accept this and
  // browsers render `&` either way, but the `react/no-unescaped-entities`
  // ESLint rule flags bare ampersands and some IDEs warn on them. The
  // pattern ` & ` (space-ampersand-space) is specific enough to avoid
  // touching HTML named entities (which have no spaces) or any URL
  // containing `&`.
  .replace(/ & /g, ' &amp; ')
  // Preserve whitespace at text↔inline-anchor boundaries that the legacy
  // HTML expressed via newline+indent (browsers collapse that to a
  // single space). JSX text adjacent to an element across a newline
  // collapses to NO space, which silently joins words like
  // "theproduction process". Insert `{" "}` at the boundary in both
  // directions: text → <a> and </a> → text.
  .replace(/([^\s>])\n(\s*)<a /g, '$1{" "}\n$2<a ')
  .replace(/<\/a>\n(\s*)([^\s<])/g, '</a>\n$1{" "}$2');

const homeMainOut = `/**
 * Home page body sections (everything after the hero) —
 * auto-generated from \`index.html\`'s \`<main>\` via
 * \`scripts/port-home.mjs\`. The hero itself is rendered by the
 * dedicated \`<HomeHero>\` component so it can own its own JSX
 * markup (per \`docs/nextjs-phase-2-design-refresh-future.md\`
 * § D-2 "proper"). All class names and inline styles are
 * preserved; the JSON-LD \`SpeakableSpecification\` selectors
 * \`.hero-title\` / \`.hero-text\` (referenced by the legacy
 * index.html JSON-LD) live on HomeHero, not here.
 *
 * Mechanical swaps applied: \`class=\` -> \`className=\`,
 * \`<br>\`/\`<hr>\`/\`<input>\`/\`<img>\`/\`<source>\` -> JSX void
 * self-close, \`srcset=\` -> \`srcSet=\`, \`frameborder=\` ->
 * \`frameBorder=\`, \`allowfullscreen\` -> \`allowFullScreen\`,
 * inline \`style="kebab: val"\` -> JSX style object literal.
 */
export function HomeMain() {
  return (
    <>
${jsx.trimEnd()}
    </>
  );
}
`;

writeFileSync(path.join(repoRoot, 'nextjs-site/src/site/components/pages/HomeMain.tsx'), homeMainOut);
console.log('wrote HomeMain.tsx (' + homeMainOut.split('\n').length + ' lines)');
