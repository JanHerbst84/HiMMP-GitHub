import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const repoRoot = path.join(appRoot, "..");
const inventoryPath = path.join(appRoot, ".migration/current-site-inventory.json");
const outDir = path.join(appRoot, "out");

function decodeEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
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

for (const page of inventory.pages) {
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

console.log(`Text parity passed for ${inventory.pages.length} generated HTML files.`);
