import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { siteOrigin } from "./site-config.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..");
const routesPath = path.resolve(appRoot, "src/site/routes.ts");
const sitemapPath = path.resolve(appRoot, "out/sitemap.xml");

if (!existsSync(routesPath)) {
  console.error(`Missing routes file: ${routesPath}`);
  process.exit(1);
}

if (!existsSync(sitemapPath)) {
  console.error("Missing exported sitemap. Run npm run build first.");
  process.exit(1);
}

const routesSource = readFileSync(routesPath, "utf8");
const routeSourceFiles = [...routesSource.matchAll(/sourceFile:\s*"([^"]+\.html)"/g)].map((match) => match[1]);
const sitemap = readFileSync(sitemapPath, "utf8");
const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
const lastmods = lastmodsBySourceFile(sitemap);
const fallbackLastmod = latestExistingLastmod(sitemap);
const routeSourceFileSet = new Set(routeSourceFiles);
const missing = routeSourceFiles.filter((sourceFile) => !locs.has(`${siteOrigin}/${sourceFile}`));
const stale = [...locs]
  .filter((loc) => loc.startsWith(`${siteOrigin}/`) && loc.endsWith(".html"))
  .map((loc) => loc.slice(`${siteOrigin}/`.length))
  .filter((sourceFile) => !routeSourceFileSet.has(sourceFile));

if (missing.length > 0) {
  console.error("Sitemap is missing generated legacy routes:");
  for (const sourceFile of missing) {
    console.error(`- ${sourceFile}`);
  }
  process.exit(1);
}

if (stale.length > 0) {
  console.error("Sitemap contains URLs that are not generated legacy routes:");
  for (const sourceFile of stale) {
    console.error(`- ${sourceFile}`);
  }
  process.exit(1);
}

const staleLastmods = routeSourceFiles
  .map((sourceFile) => ({
    sourceFile,
    expected: lastmodFor(sourceFile, fallbackLastmod),
    actual: lastmods.get(sourceFile)
  }))
  .filter((entry) => entry.actual !== entry.expected);

if (staleLastmods.length > 0) {
  console.error("Sitemap contains inaccurate lastmod values:");
  for (const entry of staleLastmods) {
    console.error(`- ${entry.sourceFile}: ${entry.actual ?? "missing"} != ${entry.expected}`);
  }
  process.exit(1);
}

console.log(`Sitemap parity passed for ${routeSourceFiles.length} generated legacy routes.`);

function lastmodsBySourceFile(sitemapSource) {
  const values = new Map();

  for (const match of sitemapSource.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const block = match[1];
    const loc = firstTagValue(block, "loc");
    const lastmod = firstTagValue(block, "lastmod");

    if (loc?.startsWith(`${siteOrigin}/`)) {
      values.set(loc.slice(`${siteOrigin}/`.length), lastmod);
    }
  }

  return values;
}

function latestExistingLastmod(sitemapSource) {
  const values = [...sitemapSource.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)]
    .map((match) => match[1])
    .sort();

  return values.at(-1) ?? new Date().toISOString().slice(0, 10);
}

function firstTagValue(source, tagName) {
  const match = source.match(new RegExp(`<${tagName}>([^<]+)</${tagName}>`));
  return match ? match[1] : null;
}

function lastmodFor(sourceFile, fallbackLastmod) {
  const output = execFileSync("git", ["log", "-1", "--format=%cs", "--", sourceFile], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  }).trim();

  return output || fallbackLastmod;
}
