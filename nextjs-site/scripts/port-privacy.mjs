import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = '/home/jan-herbst/github/Websites/HiMMP-GitHub';
const source = readFileSync(path.join(repoRoot, 'privacy.html'), 'utf8');

const mainMatch = source.match(/<main\b[^>]*id="main-content"[^>]*>([\s\S]*?)<\/main>/i);
if (!mainMatch) throw new Error('no main found');

let body = mainMatch[1];

// Strip the hero section — we'll write that as JSX manually so the
// inline style attribute becomes a typed JSX style prop.
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

// Convert the content-section body to JSX-safe form.
let jsx = afterHero
  // class= -> className=
  .replace(/\bclass=/g, 'className=')
  // <br> (no slash) -> <br />
  .replace(/<br>/gi, '<br />')
  // Empty <hr> just in case
  .replace(/<hr>/gi, '<hr />');

// Wrap.
const out = `/**
 * Privacy page — sixth page to leave the legacy injected-HTML
 * pipeline. The body content is voluminous (613 legacy lines, 13
 * numbered GDPR sections) so it is produced from a one-shot
 * mechanical conversion of the legacy \`privacy.html\` <main> with
 * the script at \`scripts/port-privacy.mjs\` — manual transcription
 * was rejected as too error-prone. The script applied three
 * conversions: \`class=\` -> \`className=\`, \`<br>\` -> \`<br />\`,
 * and the hero <section>'s inline style attribute -> a JSX style
 * prop (written manually below). No content was touched.
 *
 * \`parity:text\` byte-compares visible <main> text against the
 * legacy file and confirms zero content drift.
 */
export function PrivacyPage() {
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
            <h1 className="hero-title">Privacy Policy</h1>
          </div>
        </div>
      </section>
${jsx.trimEnd()}
    </main>
  );
}
`;

writeFileSync(path.join(repoRoot, 'nextjs-site/src/site/components/pages/PrivacyPage.tsx'), out);
console.log('wrote PrivacyPage.tsx (' + out.split('\n').length + ' lines)');
