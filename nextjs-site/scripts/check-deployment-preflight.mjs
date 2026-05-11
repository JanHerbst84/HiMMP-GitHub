import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { siteOrigin } from "./site-config.mjs";

const appRoot = process.cwd();
const repoRoot = path.resolve(appRoot, "..");
const outDir = path.join(appRoot, "out");
const routesPath = path.join(appRoot, "src/site/routes.ts");
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

function urlsEqual(left, right) {
  if (left === right) {
    return true;
  }

  return left?.replace(/\/$/, "") === right?.replace(/\/$/, "");
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

  if (sourceCanonical && !urlsEqual(canonical, sourceCanonical)) {
    fail(`${sourceFile}: canonical is ${canonical ?? "missing"}, expected source value ${sourceCanonical}`);
  } else if (!sourceCanonical) {
    warnings.push(`${sourceFile}: source page has no canonical URL to preserve`);
  } else if (!urlsEqual(canonical, expectedUrl)) {
    warnings.push(`${sourceFile}: canonical preserves source value ${canonical}, not ${expectedUrl}`);
  }

  if (sourceOgUrl && !urlsEqual(ogUrl, sourceOgUrl)) {
    fail(`${sourceFile}: og:url is ${ogUrl ?? "missing"}, expected source value ${sourceOgUrl}`);
  } else if (sourceOgUrl && !urlsEqual(ogUrl, expectedUrl)) {
    warnings.push(`${sourceFile}: og:url preserves source value ${ogUrl}, not ${expectedUrl}`);
  } else if (!sourceOgUrl && ogUrl) {
    warnings.push(`${sourceFile}: generated og:url exists but source page had none`);
  }

  for (const marker of ["analytics.himmp.net", "matomo.php", "matomo.js", "setSiteId', '1'"]) {
    if (!html.includes(marker)) {
      fail(`${sourceFile}: missing Matomo marker ${marker}`);
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
