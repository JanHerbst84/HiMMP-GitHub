import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { siteOrigin } from "./site-config.mjs";

const repoRoot = path.resolve(process.cwd(), "..");
const publicRoot = path.resolve(process.cwd(), "public");
const includeAudio = process.argv.includes("--include-audio");

const entries = [
  ["assets/css", "assets/css"],
  ["assets/js", "assets/js"],
  ["assets/images", "assets/images"],
  ["findings/Figures", "findings/Figures"],
  ["favicon.png", "favicon.png"],
  ["robots.txt", "robots.txt"],
  ["sitemap.xml", "sitemap.xml"],
  ["llms.txt", "llms.txt"]
];

if (includeAudio) {
  entries.push(["assets/audio", "assets/audio"]);
}

mkdirSync(publicRoot, { recursive: true });

if (!includeAudio) {
  rmSync(path.join(publicRoot, "assets/audio"), { recursive: true, force: true });
}

for (const [source, target] of entries) {
  const sourcePath = path.join(repoRoot, source);
  const targetPath = path.join(publicRoot, target);

  if (!existsSync(sourcePath)) {
    console.warn(`Skipping missing source: ${source}`);
    continue;
  }

  mkdirSync(path.dirname(targetPath), { recursive: true });
  cpSync(sourcePath, targetPath, { recursive: true, force: true });
  console.log(`Synced ${source} -> ${path.relative(process.cwd(), targetPath)}`);
}

generateSitemap();

if (!includeAudio) {
  console.log("Audio was not copied. Run npm run sync:public:audio when host limits are confirmed.");
}

function generateSitemap() {
  const routesPath = path.resolve(process.cwd(), "src/site/routes.ts");
  const sitemapPath = path.join(publicRoot, "sitemap.xml");

  if (!existsSync(routesPath) || !existsSync(sitemapPath)) {
    return;
  }

  const routesSource = readFileSync(routesPath, "utf8");
  const routeSourceFiles = [...routesSource.matchAll(/sourceFile:\s*"([^"]+\.html)"/g)].map((match) => match[1]);
  const sourceSitemap = readFileSync(sitemapPath, "utf8");
  assertSupportedSitemapSource(sourceSitemap);
  const existingMetadata = sitemapMetadataBySourceFile(sourceSitemap);
  const routeSourceFileSet = new Set(routeSourceFiles);
  const unmanagedSourceFiles = [...existingMetadata.keys()].filter(
    (sourceFile) => !routeSourceFileSet.has(sourceFile)
  );
  const fallbackLastmod = latestExistingLastmod(sourceSitemap);

  if (unmanagedSourceFiles.length) {
    throw new Error(
      [
        "Refusing to drop sitemap URLs that are not generated from src/site/routes.ts:",
        ...unmanagedSourceFiles.map((sourceFile) => `- ${sourceFile}`)
      ].join("\n")
    );
  }

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- AI usage policy for all listed URLs: https://himmp.net/llms.txt -->',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routeSourceFiles.map((sourceFile) => {
      const preserved = existingMetadata.get(sourceFile);
      const { changefreq, priority } = preserved ?? sitemapDefaultsFor(sourceFile);

      return [
        "  <url>",
        `    <loc>${siteOrigin}/${sourceFile}</loc>`,
        `    <lastmod>${lastmodFor(sourceFile, fallbackLastmod)}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        "  </url>"
      ].join("\n");
    }),
    "</urlset>",
    ""
  ].join("\n");

  writeFileSync(sitemapPath, sitemap);
  console.log(`Generated sitemap.xml for ${routeSourceFiles.length} routes`);
}

function latestExistingLastmod(sitemap) {
  const lastmods = [...sitemap.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)]
    .map((match) => match[1])
    .sort();

  return lastmods.at(-1) ?? new Date().toISOString().slice(0, 10);
}

function assertSupportedSitemapSource(sitemap) {
  const urlsetTag = sitemap.match(/<urlset\b([^>]*)>/i)?.[1] ?? "";
  const extraNamespaces = [...urlsetTag.matchAll(/\sxmlns:([a-zA-Z][\w-]*)=/g)].map((match) => match[1]);

  if (extraNamespaces.length) {
    throw new Error(
      `Refusing to regenerate sitemap with unsupported namespace(s): ${extraNamespaces.join(", ")}`
    );
  }

  const allowedUrlChildTags = new Set(["loc", "lastmod", "changefreq", "priority"]);
  const unsupportedTags = new Set();

  for (const match of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    for (const tag of match[1].matchAll(/<([a-zA-Z][\w:-]*)\b/g)) {
      if (!allowedUrlChildTags.has(tag[1])) {
        unsupportedTags.add(tag[1]);
      }
    }
  }

  if (unsupportedTags.size) {
    throw new Error(
      `Refusing to drop unsupported sitemap child tag(s): ${[...unsupportedTags].join(", ")}`
    );
  }
}

function sitemapMetadataBySourceFile(sitemap) {
  const metadata = new Map();

  for (const match of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const block = match[1];
    const loc = firstTagValue(block, "loc");

    if (!loc?.startsWith(`${siteOrigin}/`)) {
      continue;
    }

    const sourceFile = loc.slice(`${siteOrigin}/`.length);
    metadata.set(sourceFile, {
      changefreq: firstTagValue(block, "changefreq") ?? sitemapDefaultsFor(sourceFile).changefreq,
      priority: firstTagValue(block, "priority") ?? sitemapDefaultsFor(sourceFile).priority
    });
  }

  return metadata;
}

function firstTagValue(source, tagName) {
  const match = source.match(new RegExp(`<${tagName}>([^<]+)</${tagName}>`));
  return match ? match[1] : null;
}

function lastmodFor(sourceFile, fallbackLastmod) {
  try {
    const output = execFileSync("git", ["log", "-1", "--format=%cs", "--", path.join(repoRoot, sourceFile)], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();

    return output || fallbackLastmod;
  } catch {
    return fallbackLastmod;
  }
}

function sitemapDefaultsFor(sourceFile) {
  if (sourceFile === "index.html") {
    return { changefreq: "monthly", priority: "1.0" };
  }

  if (sourceFile === "privacy.html") {
    return { changefreq: "yearly", priority: "0.3" };
  }

  if (sourceFile === "acknowledgements.html") {
    return { changefreq: "yearly", priority: "0.4" };
  }

  if (sourceFile === "contact.html") {
    return { changefreq: "monthly", priority: "0.5" };
  }

  if (sourceFile === "findings/glossary.html") {
    return { changefreq: "monthly", priority: "0.6" };
  }

  if (sourceFile.startsWith("findings/")) {
    return { changefreq: "monthly", priority: "0.8" };
  }

  return { changefreq: "monthly", priority: "0.7" };
}
