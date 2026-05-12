import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { siteOrigin } from "./site-config.mjs";

const appRoot = process.cwd();
const repoRoot = path.resolve(appRoot, "..");
const outDir = path.join(appRoot, "out");
const routesPath = path.join(appRoot, "src/site/routes.ts");
const metadataOverridesPath = path.join(appRoot, "src/site/metadata-overrides.json");
const requireAudio = process.argv.includes("--require-audio");

function fail(message) {
  failures.push(message);
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function relOut(filePath) {
  return path.relative(outDir, filePath);
}

function normalizeHtml(value) {
  return value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
}

function firstAttr(html, pattern) {
  const match = html.match(pattern);
  return match ? normalizeHtml(match[1]) : null;
}

function parseAttributes(attrs) {
  const values = {};

  for (const match of attrs.matchAll(/([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)) {
    values[match[1].toLowerCase()] = normalizeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }

  return values;
}

function additionalSeoMarkers(html) {
  const searchableHtml = html.replace(/<!--[\s\S]*?-->/g, "");
  const markers = [];
  const handledMeta = (attributeName, key) => {
    const normalizedKey = key.toLowerCase();

    return (
      normalizedKey === "description" ||
      normalizedKey === "robots" ||
      normalizedKey === "viewport" ||
      (attributeName === "property" && normalizedKey.startsWith("og:")) ||
      (attributeName === "name" && normalizedKey.startsWith("twitter:"))
    );
  };
  const handledLinks = new Set(["alternate", "canonical", "icon", "stylesheet"]);

  for (const match of searchableHtml.matchAll(/<meta\b([^>]*)>/gi)) {
    const attrs = parseAttributes(match[1] ?? "");
    const content = attrs.content;

    if (!content) {
      continue;
    }

    if (attrs.name && !handledMeta("name", attrs.name)) {
      markers.push(`meta:name:${attrs.name}:${content}`);
    } else if (attrs.property && !handledMeta("property", attrs.property)) {
      markers.push(`meta:property:${attrs.property}:${content}`);
    } else if (attrs["http-equiv"]) {
      markers.push(`meta:http-equiv:${attrs["http-equiv"]}:${content}`);
    }
  }

  for (const match of searchableHtml.matchAll(/<link\b([^>]*)>/gi)) {
    const attrs = parseAttributes(match[1] ?? "");
    const rel = attrs.rel?.toLowerCase();
    const href = attrs.href;

    if (!rel || !href || handledLinks.has(rel)) {
      continue;
    }

    markers.push(`link:${rel}:${href}`);
  }

  return markers;
}

function urlsEqual(left, right) {
  if (left === right) {
    return true;
  }

  return left?.replace(/\/$/, "") === right?.replace(/\/$/, "");
}

function metaContentBy(html, attributeName, key) {
  const normalizedAttributeName = attributeName.toLowerCase();
  const normalizedKey = key.toLowerCase();

  for (const match of html.matchAll(/<meta\b([^>]*)>/gi)) {
    const attrs = parseAttributes(match[1] ?? "");
    if (attrs[normalizedAttributeName]?.toLowerCase() === normalizedKey) {
      return attrs.content ?? null;
    }
  }

  return null;
}

function metaDirectiveSet(value) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((directive) => directive.trim().toLowerCase())
      .filter(Boolean)
  );
}

function walkFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const files = [];
  const stack = [directory];

  while (stack.length) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  }

  return files;
}

const failures = [];
const warnings = [];

if (!existsSync(outDir)) {
  fail("Missing out/. Run npm run build first.");
}

if (!existsSync(routesPath)) {
  fail(`Missing routes file: ${routesPath}`);
}

const routesSource = existsSync(routesPath) ? readText(routesPath) : "";
const routeSourceFiles = [...routesSource.matchAll(/sourceFile:\s*["']([^"']+\.html)["']/g)].map(
  (match) => match[1]
);
const metadataOverrides = existsSync(metadataOverridesPath)
  ? JSON.parse(readText(metadataOverridesPath))
  : { canonical: {}, openGraphUrl: {} };

if (routeSourceFiles.length < 27) {
  fail(`Expected at least 27 legacy routes, found ${routeSourceFiles.length}.`);
}

const requiredStaticFiles = ["robots.txt", "sitemap.xml", "llms.txt", "favicon.png"];
for (const staticFile of requiredStaticFiles) {
  if (!existsSync(path.join(outDir, staticFile))) {
    fail(`Missing exported static file: ${staticFile}`);
  }
}

for (const assetPath of ["assets/css/main.css", "assets/css/responsive.css", "assets/js/main.js"]) {
  if (!existsSync(path.join(outDir, assetPath))) {
    fail(`Missing exported asset: ${assetPath}`);
  }
}

for (const sourceFile of routeSourceFiles) {
  const htmlPath = path.join(outDir, sourceFile);
  const sourcePath = path.join(repoRoot, sourceFile);
  if (!existsSync(htmlPath)) {
    fail(`Missing exported route HTML: ${sourceFile}`);
    continue;
  }

  const html = readText(htmlPath);
  const sourceHtml = existsSync(sourcePath) ? readText(sourcePath) : "";
  const expectedUrl = `${siteOrigin}/${sourceFile}`;
  const sourceCanonical = firstAttr(sourceHtml, /<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const sourceOgUrl = firstAttr(sourceHtml, /<meta\s+property="og:url"\s+content="([^"]+)"/i);
  const canonical = firstAttr(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const ogUrl = firstAttr(html, /<meta\s+property="og:url"\s+content="([^"]+)"/i);
  const robots = metaContentBy(html, "name", "robots");
  const ogImage = metaContentBy(html, "property", "og:image");
  const robotsDirectives = metaDirectiveSet(robots);
  const expectedCanonical = metadataOverrides.canonical[sourceFile] ?? sourceCanonical;
  const expectedOgUrl = metadataOverrides.openGraphUrl[sourceFile] ?? sourceOgUrl ?? expectedCanonical;

  if (
    !robotsDirectives.has("index") ||
    !robotsDirectives.has("follow") ||
    !robotsDirectives.has("max-image-preview:large")
  ) {
    fail(
      `${sourceFile}: robots meta is ${robots ?? "missing"}, expected index, follow, max-image-preview:large`
    );
  }

  if (!ogImage) {
    fail(`${sourceFile}: missing Open Graph image`);
  }

  if (expectedCanonical && !urlsEqual(canonical, expectedCanonical)) {
    fail(`${sourceFile}: canonical is ${canonical ?? "missing"}, expected ${expectedCanonical}`);
  } else if (!expectedCanonical) {
    warnings.push(`${sourceFile}: source page has no canonical URL to preserve`);
  } else if (!urlsEqual(canonical, expectedUrl)) {
    warnings.push(`${sourceFile}: canonical is ${canonical}, not route URL ${expectedUrl}`);
  }

  if (expectedOgUrl && !urlsEqual(ogUrl, expectedOgUrl)) {
    fail(`${sourceFile}: og:url is ${ogUrl ?? "missing"}, expected ${expectedOgUrl}`);
  } else if (expectedOgUrl && !urlsEqual(ogUrl, expectedUrl)) {
    warnings.push(`${sourceFile}: og:url is ${ogUrl}, not route URL ${expectedUrl}`);
  } else if (!expectedOgUrl && ogUrl) {
    warnings.push(`${sourceFile}: generated og:url exists but source page had none`);
  }

  for (const marker of ["analytics.himmp.net", "matomo.php", "matomo.js", "setSiteId', '1'"]) {
    if (!html.includes(marker)) {
      fail(`${sourceFile}: missing Matomo marker ${marker}`);
    }
  }

  const exportedSeoMarkers = new Set(additionalSeoMarkers(html));
  for (const marker of additionalSeoMarkers(sourceHtml)) {
    if (!exportedSeoMarkers.has(marker)) {
      fail(`${sourceFile}: missing legacy SEO head marker ${marker}`);
    }
  }

  const extensionlessIndex = path.join(outDir, sourceFile.replace(/\.html$/, ""), "index.html");
  if (existsSync(extensionlessIndex)) {
    fail(`${sourceFile}: extensionless duplicate HTML exists at ${relOut(extensionlessIndex)}`);
  }
}

for (const indexHtml of walkFiles(outDir).filter((file) => path.basename(file) === "index.html")) {
  const extensionlessPath = path.relative(outDir, path.dirname(indexHtml));
  if (!extensionlessPath || extensionlessPath.startsWith("_next")) {
    continue;
  }

  const siblingHtml = path.join(outDir, `${extensionlessPath}.html`);
  if (existsSync(siblingHtml)) {
    fail(
      `Extensionless duplicate HTML exists at ${relOut(indexHtml)} alongside ${relOut(siblingHtml)}`
    );
  }
}

const contactHtmlPath = path.join(outDir, "contact.html");
if (existsSync(contactHtmlPath)) {
  const contactHtml = readText(contactHtmlPath);
  for (const endpoint of ["get-csrf-token.php", "contact-handler.php"]) {
    if (!contactHtml.includes(endpoint)) {
      fail(`contact.html: missing legacy endpoint reference ${endpoint}`);
    }
  }
}

for (const phpFile of ["get-csrf-token.php", "contact-handler.php", "config.php"]) {
  if (!existsSync(path.join(repoRoot, phpFile))) {
    fail(`Missing PHP source file for co-hosting: ${phpFile}`);
  }
}

const configPath = path.join(repoRoot, "config.php");
if (existsSync(configPath)) {
  const config = readText(configPath);
  if (!config.includes("contact_submissions")) {
    fail("config.php: missing contact_submissions path definition");
  }
  if (!config.includes("session_start")) {
    fail("config.php: missing session_start for CSRF workflow");
  }
}

const sourceAudioFiles = walkFiles(path.join(repoRoot, "assets/audio")).filter((file) => file.endsWith(".mp3"));
const exportedAudioDir = path.join(outDir, "assets/audio");
const exportedAudioFiles = walkFiles(exportedAudioDir).filter((file) => file.endsWith(".mp3"));

if (requireAudio) {
  if (sourceAudioFiles.length === 0) {
    fail("No source MP3 files found under assets/audio.");
  }

  if (exportedAudioFiles.length !== sourceAudioFiles.length) {
    fail(
      `Exported audio count is ${exportedAudioFiles.length}, expected ${sourceAudioFiles.length}. Run npm run build:audio.`
    );
  }
} else if (exportedAudioFiles.length > 0) {
  console.log(`Audio files are present in out/assets/audio (${exportedAudioFiles.length} MP3 files).`);
} else {
  console.log("Audio files are not present in out/assets/audio; this matches the default non-audio build.");
}

if (failures.length > 0) {
  console.error(`Deployment preflight failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

if (warnings.length > 0) {
  console.log(`Deployment preflight warnings (${warnings.length}):`);
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

const exportedAudioBytes = exportedAudioFiles.reduce((total, file) => total + statSync(file).size, 0);
const audioSummary = exportedAudioFiles.length
  ? `${exportedAudioFiles.length} MP3 files, ${Math.round(exportedAudioBytes / 1024 / 1024)} MB`
  : "not included";

console.log(`Deployment preflight passed for ${routeSourceFiles.length} legacy routes.`);
console.log(`Audio in export: ${audioSummary}.`);
