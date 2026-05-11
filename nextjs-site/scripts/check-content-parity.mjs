import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const inventoryPath = path.join(appRoot, ".migration/current-site-inventory.json");
const outDir = path.join(appRoot, "out");

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

function outputPathFor(sourcePath) {
  return path.join(outDir, sourcePath);
}

if (!existsSync(inventoryPath)) {
  console.error("Missing .migration/current-site-inventory.json. Run npm run inventory first.");
  process.exit(1);
}

const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
const findings = [];

for (const page of inventory.pages) {
  const generatedPath = outputPathFor(page.path);

  if (!existsSync(generatedPath)) {
    findings.push(`${page.path}: missing generated file`);
    continue;
  }

  const html = readFileSync(generatedPath, "utf8").replace(
    /<script>self\.__next_f\.push\([\s\S]*?<\/script>/g,
    ""
  );
  const title = stripTags(firstMatch(html, /<title>([\s\S]*?)<\/title>/i) ?? "");
  const description = firstMatch(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const h1 = stripTags(firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) ?? "");
  const jsonLdCount = (html.match(/application\/ld\+json/gi) ?? []).length;
  const styleCount = (html.match(/<style\b/gi) ?? []).length;
  const iframeCount = (html.match(/<iframe\b/gi) ?? []).length;
  const audioCount = (html.match(/<audio\b/gi) ?? []).length;

  if (title !== page.title) {
    findings.push(`${page.path}: title mismatch`);
  }

  if ((description ? decodeEntities(description) : "") !== page.description) {
    findings.push(`${page.path}: description mismatch`);
  }

  if (h1 !== page.h1) {
    findings.push(`${page.path}: h1 mismatch`);
  }

  if (jsonLdCount !== page.jsonLdCount) {
    findings.push(`${page.path}: JSON-LD count ${jsonLdCount} != ${page.jsonLdCount}`);
  }

  if (styleCount < page.styleCount) {
    findings.push(`${page.path}: style count ${styleCount} < ${page.styleCount}`);
  }

  if (iframeCount !== page.iframeCount) {
    findings.push(`${page.path}: iframe count ${iframeCount} != ${page.iframeCount}`);
  }

  if (audioCount !== page.audioCount) {
    findings.push(`${page.path}: audio count ${audioCount} != ${page.audioCount}`);
  }
}

if (findings.length) {
  console.error(`Content parity found ${findings.length} issue(s):`);
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log(`Content parity passed for ${inventory.pages.length} generated HTML files.`);
