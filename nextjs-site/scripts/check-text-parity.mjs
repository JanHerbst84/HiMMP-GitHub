import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const repoRoot = path.join(appRoot, "..");
const inventoryPath = path.join(appRoot, ".migration/current-site-inventory.json");
const outDir = path.join(appRoot, "out");

const NAMED_ENTITY_MAP = {
  quot: '"',
  apos: "'",
  amp: "&",
  lt: "<",
  gt: ">",
  nbsp: " ",
  rarr: "→",
  larr: "←",
  uarr: "↑",
  darr: "↓",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  copy: "©",
  reg: "®",
  trade: "™",
  laquo: "«",
  raquo: "»",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  middot: "·",
  bull: "•",
  deg: "°",
  times: "×",
  divide: "÷"
};

/*
 * Single-pass decoder. Double-encoded entities (`&amp;rarr;`) would
 * decode to literal `&rarr;` rather than `→` because `String.replace`
 * does not re-scan replaced substrings. None of the in-scope legacy
 * pages use double-encoding; if a future page does the parity check
 * will fail loudly (visible-text mismatch) rather than corrupting
 * silently. Extend with a fixpoint loop if that ever becomes a real
 * case.
 */
function decodeEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&([a-zA-Z]+);/g, (match, name) => NAMED_ENTITY_MAP[name] ?? match);
}

function extractLegacyMain(source, sourceFile) {
  const mainStart = source.search(/<main\b/i);
  if (mainStart === -1) {
    throw new Error(`Could not find <main> in ${sourceFile}`);
  }

  const relativeFooterStart = source.slice(mainStart).search(/<footer\b[^>]*class="[^"]*\bsite-footer\b/i);
  const match = source.slice(mainStart).match(/^<main\b[\s\S]*?<\/main>/i);
  let mainHtml = match?.[0] ?? null;

  if (relativeFooterStart !== -1) {
    const beforeFooter = source.slice(mainStart, mainStart + relativeFooterStart).trimEnd();
    const firstClose = beforeFooter.search(/<\/main>/i);

    if (firstClose === -1) {
      mainHtml = `${beforeFooter}\n</main>`;
    } else {
      const afterFirstClose = beforeFooter.slice(firstClose).replace(/<\/main>/i, "");
      if (afterFirstClose.trim()) {
        mainHtml = `${beforeFooter.replace(/<\/main>/gi, "").trimEnd()}\n</main>`;
      }
    }
  }

  if (!mainHtml) {
    throw new Error(`Could not extract <main> in ${sourceFile}`);
  }

  return mainHtml;
}

function extractGeneratedMain(source, sourceFile) {
  const match = source.match(/<main\b[^>]*id="main-content"[\s\S]*?<\/main>/i);
  if (!match) {
    throw new Error(`Could not extract generated <main> in ${sourceFile}`);
  }

  return match[0];
}

function visibleText(html) {
  return decodeEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

if (!existsSync(inventoryPath)) {
  console.error("Missing .migration/current-site-inventory.json. Run npm run inventory first.");
  process.exit(1);
}

if (!existsSync(outDir)) {
  console.error("Missing out/. Run npm run build first.");
  process.exit(1);
}

const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
const findings = [];

/*
 * Routes whose React page has deliberately grown beyond the archived
 * legacy HTML. The legacy root is a frozen reference (see ../README.md);
 * once a page is extended in React, the byte-exact text comparison stops
 * being the safety net and a Playwright body smoke in
 * tests/static-export.spec.ts takes over. Each entry names the smoke test
 * that covers it. Do not add a route here without that test.
 */
const TEXT_PARITY_EXEMPT = new Map([
  [
    "videos.html",
    "React-only Key Findings walkthrough box (D-9) and Bilibili link-card section (d9de9b9, 2026-09-16); covered by 'videos body keeps every section and the Bilibili link cards' in tests/static-export.spec.ts"
  ]
]);
const exempted = [];

for (const page of inventory.pages) {
  if (TEXT_PARITY_EXEMPT.has(page.path)) {
    exempted.push(page.path);
    continue;
  }
  const legacyPath = path.join(repoRoot, page.path);
  const generatedPath = path.join(outDir, page.path);

  if (!existsSync(generatedPath)) {
    findings.push(`${page.path}: missing generated file`);
    continue;
  }

  const legacyText = visibleText(extractLegacyMain(readFileSync(legacyPath, "utf8"), page.path));
  const generatedText = visibleText(extractGeneratedMain(readFileSync(generatedPath, "utf8"), page.path));

  if (legacyText !== generatedText) {
    findings.push(
      `${page.path}: visible main text mismatch (${legacyText.length} legacy chars, ${generatedText.length} generated chars)`
    );
  }
}

if (findings.length) {
  console.error(`Text parity found ${findings.length} issue(s):`);
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

for (const route of exempted) {
  console.log(`Text parity skipped for ${route} (React-extended page): ${TEXT_PARITY_EXEMPT.get(route)}`);
}
console.log(`Text parity passed for ${inventory.pages.length - exempted.length} generated HTML files.`);
