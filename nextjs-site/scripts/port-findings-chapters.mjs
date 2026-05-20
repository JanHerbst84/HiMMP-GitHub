import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const componentsDir = path.join(repoRoot, 'nextjs-site/src/site/components/pages/findings');

const chapters = [
  { slug: '01-introduction', component: 'FindingsChapter01' },
  { slug: '02-producers', component: 'FindingsChapter02' },
  { slug: '03-methodology', component: 'FindingsChapter03' },
  { slug: '04-foundations', component: 'FindingsChapter04' },
  { slug: '05-naturalistic', component: 'FindingsChapter05' },
  { slug: '06-hyperreal', component: 'FindingsChapter06' },
  { slug: '07-meta-instrument', component: 'FindingsChapter07' },
  { slug: '08-drums', component: 'FindingsChapter08' },
  { slug: '09-guitars-bass', component: 'FindingsChapter09' },
  { slug: '10-spatial', component: 'FindingsChapter10' },
  { slug: '11-subjective', component: 'FindingsChapter11' },
  { slug: '12-application', component: 'FindingsChapter12' },
  { slug: '13-future', component: 'FindingsChapter13' },
  { slug: '14-recommended-reading', component: 'FindingsChapter14' },
  { slug: 'glossary', component: 'FindingsGlossary' }
];

function cssToJsxStyle(decl) {
  const props = decl.split(';').map((s) => s.trim()).filter(Boolean);
  let hasCustomProp = false;
  const entries = props.map((p) => {
    const colon = p.indexOf(':');
    const key = p.slice(0, colon).trim();
    const val = p.slice(colon + 1).trim();
    // CSS custom properties (--foo) need quoted keys in JSX object literals
    // and a React.CSSProperties cast because React's CSSProperties type
    // does not include an index signature for `--*` keys.
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
  // `Record<string, string>` is a structural cast that satisfies React's
  // style prop and tolerates CSS custom properties (`--foo`). Avoids the
  // need to import React.CSSProperties into every generated file.
  return hasCustomProp
    ? `style={${inner} as Record<string, string>}`
    : `style={${inner}}`;
}

// Match the legacy on-this-page script's slug rule verbatim so any
// JSON-LD URL or external link that was built against the legacy
// runtime IDs still resolves after the port. See
// `findings/<chapter>.html` bottom inline `<script>` for the source.
function slugifyHeading(text) {
  return text
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Inject stable `id="<slug>"` on every `<h2>` that does not already
// declare one. Mirrors what the legacy on-this-page script does at
// runtime, but at port time, so the IDs are present in the
// SSR-rendered HTML rather than appearing after `DOMContentLoaded`
// (which races React hydration and triggers #418). Inner HTML tags
// in the heading (e.g. `<sup>` footnote refs) are stripped before
// slugification, matching `.textContent`.
function injectH2Ids(html) {
  return html.replace(
    /<h2\b([^>]*)>([\s\S]*?)<\/h2>/g,
    (match, attrs, inner) => {
      if (/\bid\s*=/.test(attrs)) {
        return match;
      }
      const text = inner.replace(/<[^>]+>/g, '');
      const slug = slugifyHeading(text);
      if (!slug) {
        return match;
      }
      return `<h2${attrs} id="${slug}">${inner}</h2>`;
    }
  );
}

function convertMain(html) {
  return injectH2Ids(html)
    .replace(/\bclass=/g, 'className=')
    .replace(/\bfor=/g, 'htmlFor=')
    .replace(/<br>/gi, '<br />')
    .replace(/<hr>/gi, '<hr />')
    .replace(/<input\b([^>]*)>/gi, '<input$1 />')
    .replace(/<img\b([^>]*?)(\s*\/)?>/gi, (_m, attrs) => `<img${attrs.replace(/\s*\/?\s*$/, '')} />`)
    .replace(/<source\b([^>]*?)(\s*\/)?>/gi, (_m, attrs) => `<source${attrs.replace(/\s*\/?\s*$/, '')} />`)
    .replace(/\bsrcset=/g, 'srcSet=')
    .replace(/\bstyle="([^"]+)"/g, (_match, decl) => cssToJsxStyle(decl));
}

/*
 * D-3-a — detect <div class="mix-comparison-player"> blocks in the
 * chapter HTML and replace them with `<MixComparisonEmbed mixes={...}
 * note="...">` JSX so the React component owns the surface (markup +
 * state) instead of EnhancedAudioController DOM-walking it after
 * hydration.
 *
 * Returns { html, mixEmbeds }. The HTML has placeholders that survive
 * convertMain unchanged; mixEmbeds contains the parsed data each
 * placeholder substitutes back to. The placeholder format is the
 * literal string `__MIX_EMBED_<index>__` wrapped in a marker div so
 * JSX parsing is preserved through convertMain.
 */
function extractMixEmbeds(html) {
  const mixEmbeds = [];
  const openRe = /<div\s+class="mix-comparison-player"[^>]*>/gi;
  const segments = [];
  let cursor = 0;
  let openMatch;
  while ((openMatch = openRe.exec(html)) !== null) {
    const openStart = openMatch.index;
    const openEnd = openMatch.index + openMatch[0].length;
    // Walk forward counting balanced <div ...>...</div> until the
    // outer mix-comparison-player closes. Non-div tags don't affect
    // the count; only <div and </div> shift the depth. This avoids
    // the non-greedy-regex pitfall where nested inner divs were
    // matched as the closing tag.
    let depth = 1;
    let i = openEnd;
    while (i < html.length && depth > 0) {
      const nextOpen = html.indexOf('<div', i);
      const nextClose = html.indexOf('</div>', i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 4;
      } else {
        depth--;
        i = nextClose + 6;
      }
    }
    if (depth !== 0) {
      // unbalanced — bail out, leave the rest of the HTML untouched
      segments.push(html.slice(cursor));
      cursor = html.length;
      break;
    }
    const closeEnd = i;
    const innerHtml = html.slice(openEnd, closeEnd - '</div>'.length);

    const buttonRe = /<button\s+class="mix-button(?:\s+active)?"\s+data-src="([^"]+)"\s+data-name="([^"]+)"\s*>([\s\S]*?)<\/button>/gi;
    const mixes = [];
    let bm;
    while ((bm = buttonRe.exec(innerHtml)) !== null) {
      mixes.push({
        src: bm[1],
        name: bm[2],
        label: bm[3].replace(/<[^>]+>/g, '').trim()
      });
    }
    const noteMatch = innerHtml.match(/<div\s+class="embed-note"[^>]*>([\s\S]*?)<\/div>/i);
    const note = noteMatch ? noteMatch[1].replace(/<[^>]+>/g, '').trim() : null;
    const idx = mixEmbeds.length;
    mixEmbeds.push({ mixes, note });

    segments.push(html.slice(cursor, openStart));
    segments.push(`<MixComparisonEmbedPlaceholder index="${idx}" />`);
    cursor = closeEnd;
    openRe.lastIndex = closeEnd;
  }
  segments.push(html.slice(cursor));
  return { html: segments.join(''), mixEmbeds };
}

function substituteMixEmbeds(jsx, mixEmbeds) {
  return jsx.replace(/<MixComparisonEmbedPlaceholder index="(\d+)" \/>/g, (_m, idxStr) => {
    const idx = Number(idxStr);
    const entry = mixEmbeds[idx];
    if (!entry) return _m;
    const mixesLiteral = entry.mixes
      .map(
        (mix) =>
          `        { src: ${JSON.stringify(mix.src)}, name: ${JSON.stringify(mix.name)}, label: ${JSON.stringify(mix.label)} }`
      )
      .join(',\n');
    const noteAttr = entry.note ? ` note={${JSON.stringify(entry.note)}}` : '';
    return `<MixComparisonEmbed${noteAttr} mixes={[\n${mixesLiteral}\n      ]} />`;
  });
}

for (const { slug, component } of chapters) {
  const sourcePath = path.join(repoRoot, 'findings', `${slug}.html`);
  const source = readFileSync(sourcePath, 'utf8');

  const mainMatch = source.match(/<main\b[^>]*id="main-content"[^>]*>([\s\S]*?)<\/main>/i);
  if (!mainMatch) {
    throw new Error(`no main found in ${sourcePath}`);
  }

  const body = mainMatch[1].trim();
  // Bake h2 IDs first so the headings list and the JSX share the same
  // ids. `injectH2Ids` runs again inside `convertMain` but it is
  // idempotent — pre-existing ids survive the second pass.
  const bodyWithIds = injectH2Ids(body);
  // D-3-a — extract mix-comparison-player blocks and replace with
  // placeholders that survive convertMain unchanged. After conversion
  // we substitute the placeholders with React component invocations.
  const { html: bodyWithEmbedsExtracted, mixEmbeds } = extractMixEmbeds(bodyWithIds);
  const rawJsx = convertMain(bodyWithEmbedsExtracted);
  const jsx = substituteMixEmbeds(rawJsx, mixEmbeds);
  const hasMixEmbeds = mixEmbeds.length > 0;

  // Collect h2 list for D-8 TOC. The "endnotes" heading is skipped
  // because it is a chapter-footer landmark, not a content section a
  // reader would jump to.
  const h2Re = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/g;
  const headings = [];
  let h2match;
  while ((h2match = h2Re.exec(bodyWithIds)) !== null) {
    const attrs = h2match[1];
    const inner = h2match[2];
    const idMatch = attrs.match(/\bid="([^"]+)"/);
    if (!idMatch) continue;
    if (idMatch[1] === 'endnotes') continue;
    const text = inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    headings.push({ id: idMatch[1], text });
  }
  const headingsLiteral = headings.length
    ? '[\n' + headings.map((h) => '  { id: ' + JSON.stringify(h.id) + ', text: ' + JSON.stringify(h.text) + ' }').join(',\n') + '\n]'
    : '[]';

  const importLines = [];
  if (hasMixEmbeds) {
    importLines.push(`import { MixComparisonEmbed } from "@/src/site/components/MixComparisonEmbed";`);
  }
  const importBlock = importLines.length ? importLines.join('\n') + '\n\n' : '';

  const out = `/**
 * Findings chapter "${slug}" — auto-generated by
 * \`scripts/port-findings-chapters.mjs\` from the legacy
 * \`findings/${slug}.html\`. Do not hand-edit this file; rerun the
 * script after editing the legacy source. The script applies
 * mechanical JSX-safety conversions only (\`class=\` ->
 * \`className=\`, void-element self-close, kebab-case style ->
 * camelCase JSX style prop, \`srcset=\` -> \`srcSet=\`,
 * \`for=\` -> \`htmlFor=\`). Mix-comparison-player blocks are
 * additionally replaced with \`<MixComparisonEmbed>\` React
 * component calls (D-3-a) so the chapter audio surfaces own their
 * markup and state instead of relying on EnhancedAudioController's
 * post-hydration DOM walk.
 */
${importBlock}export type FindingsChapterHeading = { id: string; text: string };

/*
 * Chapter h2 headings, in document order. The D-8 within-chapter
 * TOC component (rendered by \`EnhancedFindingsShell\`) reads this
 * to emit \`<nav aria-label="On this page">\` for long chapters.
 * IDs match the values baked into the JSX below by \`injectH2Ids\`.
 */
export const ${component}Headings: FindingsChapterHeading[] = ${headingsLiteral};

export function ${component}() {
  return (
    <main id="main-content">
${jsx}
    </main>
  );
}
`;

  const outPath = path.join(componentsDir, `${component}.tsx`);
  writeFileSync(outPath, out);
  console.log('wrote', outPath);
}
