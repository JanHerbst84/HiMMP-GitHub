import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Derive the repo root from this script's own location so the port is
// reproducible from any checkout.
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const source = readFileSync(path.join(repoRoot, 'publications.html'), 'utf8');

const mainMatch = source.match(/<main\b[^>]*id="main-content"[^>]*>([\s\S]*?)<\/main>/i);
if (!mainMatch) throw new Error('no main found');

let body = mainMatch[1];

// Find the hero section (top of main) and skip it — the hero is written
// manually because its inline `style="..."` attribute needs to be a JSX
// style prop, and React converts the property names to camelCase.
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

// Mechanical JSX-safety conversions only. Every change here is
// either an attribute-name rename React requires (class -> className,
// for -> htmlFor) or a void-element self-close React requires
// (<br>, <hr>, <input ...>). No content is touched.
function cssToJsxStyle(decl) {
  const props = decl.split(';').map((s) => s.trim()).filter(Boolean);
  const entries = props.map((p) => {
    const colon = p.indexOf(':');
    const key = p.slice(0, colon).trim();
    const val = p.slice(colon + 1).trim();
    // Convert kebab-case CSS property to camelCase JSX key.
    const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    // Wrap in quotes — none of the legacy inline styles in publications.html
    // contain a literal double quote or curly brace, so this is safe.
    return `${camelKey}: "${val}"`;
  });
  return `style={{ ${entries.join(', ')} }}`;
}

let jsx = afterHero
  .replace(/\bclass=/g, 'className=')
  .replace(/\bfor=/g, 'htmlFor=')
  .replace(/<br>/gi, '<br />')
  .replace(/<hr>/gi, '<hr />')
  .replace(/<input\b([^>]*)>/gi, '<input$1 />')
  // Convert inline `style="prop: val; prop2: val2"` to a JSX style object
  // literal. Kebab-case CSS properties are converted to camelCase keys.
  .replace(/\bstyle="([^"]+)"/g, (_match, decl) => cssToJsxStyle(decl));

const out = `/**
 * Publications page — tenth page to leave the legacy injected-HTML
 * pipeline. This is by far the largest port (2400 legacy lines,
 * 600+ lines of <main> content with 4 accordion-wrapped sections,
 * dozens of citation entries, a publication-section-nav header).
 * Hand transcription was rejected as too error-prone.
 *
 * The body content was produced from a one-shot mechanical
 * conversion at \`scripts/port-publications.mjs\` — same approach
 * proven safe on the privacy port. The script applies five regex
 * swaps (\`class=\` -> \`className=\`, \`for=\` -> \`htmlFor=\`,
 * \`<br>\` -> \`<br />\`, \`<hr>\` -> \`<hr />\`, \`<input ...>\` ->
 * \`<input ... />\`); the hero <section> is written manually with a
 * JSX style prop. The page has 0 inputs in main but the void-element
 * self-close rules are kept for symmetry with sibling port scripts.
 *
 * Body scripts preserved:
 *
 * - section-nav-button scrolling (5 buttons + scroll-to-target +
 *   active-section-highlight) — same pattern as the videos page.
 * - accordion toggle behaviour for the 4 \`<button class="accordion">\`
 *   sections.
 * - publication-section-nav highlight on scroll.
 *
 * All three scripts come through the standard
 * <LegacyScripts scripts={content.bodyScripts}> path in the route
 * file. They only ADD event listeners; they do not write to React-
 * managed DOM, so no hydration race is expected.
 *
 * \`parity:text\` byte-compares visible <main> text against the
 * legacy file and confirms zero content drift — this is the
 * primary safety net for a port of this size.
 */
export function PublicationsPage() {
  return (
    <main id="main-content">
      <section
        className="hero"
        style={{
          backgroundImage: "url('assets/images/background/HiMMP-bg-publications.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative"
        }}
      >
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Publications, Articles &amp; Resources</h1>
            <p className="hero-text">
              Below you will find an extensive list of project outputs alongside previously
              published works and articles from the lead HiMMP researchers. For academic inquiries about a specific publication, please <a href="contact.html" style={{ color: "white", textDecoration: "underline" }}><b>get in touch</b></a>.
            </p>
          </div>
        </div>
      </section>
${jsx.trimEnd()}
    </main>
  );
}
`;

writeFileSync(path.join(repoRoot, 'nextjs-site/src/site/components/pages/PublicationsPage.tsx'), out);
console.log('wrote PublicationsPage.tsx (' + out.split('\n').length + ' lines)');
