import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..");
const outputDir = path.resolve(process.cwd(), ".migration");
const outputFile = path.join(outputDir, "current-site-inventory.json");

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
}

function decodeEntities(value) {
  return value
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function firstMatch(source, pattern) {
  const match = source.match(pattern);
  return match ? match[1].trim() : null;
}

function listHtmlPages() {
  const rootPages = readdirSync(repoRoot)
    .filter((entry) => entry.endsWith(".html"))
    .sort();
  const findingPages = readdirSync(path.join(repoRoot, "findings"))
    .filter((entry) => entry.endsWith(".html"))
    .map((entry) => `findings/${entry}`)
    .sort();
  return [...rootPages, ...findingPages];
}

function inventoryPage(relativePath) {
  const source = read(relativePath);
  const stat = statSync(path.join(repoRoot, relativePath));

  return {
    path: relativePath,
    bytes: stat.size,
    title: stripTags(firstMatch(source, /<title>([\s\S]*?)<\/title>/i) ?? ""),
    h1: stripTags(firstMatch(source, /<h1[^>]*>([\s\S]*?)<\/h1>/i) ?? ""),
    description: decodeEntities(firstMatch(source, /<meta\s+name="description"\s+content="([^"]*)"/i) ?? ""),
    canonical: firstMatch(source, /<link\s+rel="canonical"\s+href="([^"]*)"/i),
    imageCount: (source.match(/<img\b/gi) ?? []).length,
    audioCount: (source.match(/<audio\b/gi) ?? []).length,
    iframeCount: (source.match(/<iframe\b/gi) ?? []).length,
    styleCount: (source.match(/<style\b/gi) ?? []).length,
    jsonLdCount: (source.match(/application\/ld\+json/gi) ?? []).length,
    localReferenceCount: (source.match(/\b(?:src|href|data-src)="(?!https?:|mailto:|tel:|#|\/\/)[^"]+"/gi) ?? [])
      .length
  };
}

const pages = listHtmlPages().map(inventoryPage);
const inventory = {
  generatedAt: new Date().toISOString(),
  sourceRoot: repoRoot,
  pageCount: pages.length,
  pages
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputFile, `${JSON.stringify(inventory, null, 2)}\n`);
console.log(`Wrote ${path.relative(process.cwd(), outputFile)} with ${pages.length} pages.`);
