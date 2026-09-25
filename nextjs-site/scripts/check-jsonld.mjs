#!/usr/bin/env node
/*
 * Structured-data gate for the static export (site review 2026-09, slice C).
 *
 * For every HTML file in out/: each JSON-LD block parses and carries
 * @context/@type; no @id is defined twice on a page with conflicting types;
 * no URL points at /index.html (canonical is /); every VideoObject has the
 * Google-required name/thumbnailUrl/uploadDate; no ResearchProject uses the
 * invalid startDate/endDate/performer; the Routledge volumes are Books; and
 * chapter TechArticles point at the guide Book defined on findings.html.
 *
 * Exit codes: 0 pass, 1 findings, 2 missing export.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(appRoot, "out");
const GUIDE_BOOK_ID = "https://himmp.net/findings.html#practical-guide";

if (!existsSync(outDir)) {
  console.error("Missing out/. Run npm run build first.");
  process.exit(2);
}

function htmlFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== "_next" && entry.name !== "assets") files.push(...htmlFiles(full));
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function nodes(value, found = []) {
  if (Array.isArray(value)) value.forEach((entry) => nodes(entry, found));
  else if (value && typeof value === "object") {
    if (value["@type"]) found.push(value);
    Object.values(value).forEach((entry) => nodes(entry, found));
  }
  return found;
}

const findings = [];
let blockCount = 0;
let guideBookDefined = false;

for (const file of htmlFiles(outDir)) {
  const page = path.relative(outDir, file);
  const html = readFileSync(file, "utf8");
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  const ids = new Map();
  const works = new Map();

  for (const [index, text] of blocks.entries()) {
    blockCount += 1;
    let json;
    try {
      json = JSON.parse(text);
    } catch (error) {
      findings.push(`${page} block ${index}: invalid JSON (${error.message})`);
      continue;
    }
    if (!json["@context"]) findings.push(`${page} block ${index}: missing @context`);
    if (!json["@type"] && !json["@graph"]) findings.push(`${page} block ${index}: missing @type/@graph`);
    if (text.includes("https://himmp.net/index.html")) findings.push(`${page} block ${index}: links /index.html instead of /`);

    for (const node of nodes(json)) {
      const type = [].concat(node["@type"]).join(",");
      if (node["@id"] && Object.keys(node).length > 2) {
        const previous = ids.get(node["@id"]);
        if (previous && previous !== type) findings.push(`${page}: @id ${node["@id"]} defined as ${previous} and ${type}`);
        ids.set(node["@id"], type);
      }
      // The same work must not be listed twice (by DOI, else by title).
      if (/Article|Chapter|Book|Dataset/.test(type) && node.name) {
        const doiMatch = JSON.stringify([node.url ?? null, node.identifier ?? null]).match(/10\.\d{4,9}\/[^\s"?#]+/);
        const key = doiMatch ? doiMatch[0].toLowerCase() : String(node.name).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        if (works.has(key) && works.get(key) !== node) findings.push(`${page}: duplicate work ${key}`);
        works.set(key, node);
      }
      if (type === "VideoObject") {
        if (typeof node.contentUrl === "string" && /youtube\.com\/watch/.test(node.contentUrl)) {
          findings.push(`${page}: VideoObject contentUrl is a YouTube watch page`);
        }
        for (const field of ["name", "thumbnailUrl", "uploadDate"]) {
          if (!node[field]) findings.push(`${page}: VideoObject ${node.embedUrl ?? node.name} lacks ${field}`);
        }
      }
      if (type === "MusicRecording" && JSON.stringify(node.byArtist ?? null).includes("#person-mark-deeks")) {
        findings.push(`${page}: Mark Deeks (orchestration) listed as a performer (byArtist)`);
      }
      if (type === "ResearchProject") {
        for (const field of ["startDate", "endDate", "performer"]) {
          if (field in node) findings.push(`${page}: ResearchProject uses invalid property ${field}`);
        }
      }
      if (String(node.name ?? "").startsWith("Heaviness in Metal Music Production, Volume") && type !== "Book") {
        findings.push(`${page}: "${node.name}" is ${type}, expected Book`);
      }
      if (node["@id"] === GUIDE_BOOK_ID && type === "Book") guideBookDefined = true;
      if (type === "TechArticle" && page.startsWith("findings/")) {
        const target = node.isPartOf?.["@id"];
        if (target !== GUIDE_BOOK_ID) findings.push(`${page}: TechArticle isPartOf ${JSON.stringify(node.isPartOf)}`);
      }
    }
  }
}

if (!guideBookDefined) findings.push(`no page defines the guide Book ${GUIDE_BOOK_ID}`);

if (findings.length) {
  console.error(`JSON-LD check found ${findings.length} issue(s):`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log(`JSON-LD check passed: ${blockCount} blocks.`);
