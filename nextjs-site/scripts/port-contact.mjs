import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Derive the repo root from this script's own location so the port is
// reproducible from any checkout. Script lives at
// `<repo>/nextjs-site/scripts/port-contact.mjs`, so repo root is two
// levels up.
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const source = readFileSync(path.join(repoRoot, 'contact.html'), 'utf8');

const mainMatch = source.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
if (!mainMatch) throw new Error('no main found');

let body = mainMatch[1];

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

// Convert the body to JSX-safe form.
let jsx = afterHero
  // class= -> className=
  .replace(/\bclass=/g, 'className=')
  // <br> -> <br />
  .replace(/<br>/gi, '<br />')
  // <input ...> -> <input ... /> (input is a void element; JSX needs self-close)
  .replace(/<input\b([^>]*)>/gi, '<input$1 />')
  // for= -> htmlFor= (JSX label attribute)
  .replace(/\bfor=/g, 'htmlFor=')
  // rows="N" -> rows={N} (React types <textarea rows> as number)
  .replace(/\brows="(\d+)"/g, 'rows={$1}');

const out = `/**
 * Contact page — seventh page to leave the legacy injected-HTML
 * pipeline. The page contains a contact form whose behaviour (CSRF
 * fetch, validation, fetch POST to contact-handler.php) is wired by
 * a body <script> in the legacy file. That script is preserved via
 * the standard \`<LegacyScripts scripts={content.bodyScripts}>\` path
 * in the route file, so all three existing Playwright tests for the
 * contact form continue to pass against the React-owned DOM.
 *
 * Body produced by \`scripts/port-contact.mjs\` from the legacy
 * \`contact.html\` <main>; the hero <section> is written manually
 * with a JSX-style prop. Mechanical swaps applied to the body:
 * \`class=\` -> \`className=\`, \`<br>\` -> \`<br />\`,
 * \`<input ...>\` -> \`<input ... />\` (void-element self-close), and
 * \`for=\` -> \`htmlFor=\` on labels.
 *
 * \`parity:text\` byte-compares visible main text against the legacy
 * and confirms zero content drift.
 */
export function ContactPage() {
  return (
    <main id="main-content">
      <section
        className="hero"
        style={{
          backgroundImage: "url('assets/images/background/HiMMP-bg-contact.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative"
        }}
      >
        <div className="hero-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Get in Touch</h1>
            <p className="hero-text">
              If you have any questions about the HiMMP project, please get in
              touch with us via the contact form below.
            </p>
            <p className="hero-text">
              We're always interested in increasing our impact and outreach,
              so let us know if you're interested in getting involved...
            </p>
          </div>
        </div>
      </section>
${jsx.trimEnd()}
    </main>
  );
}
`;

writeFileSync(path.join(repoRoot, 'nextjs-site/src/site/components/pages/ContactPage.tsx'), out);
console.log('wrote ContactPage.tsx (' + out.split('\n').length + ' lines)');
