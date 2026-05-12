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

ensureSitemapCoverage();

if (!includeAudio) {
  console.log("Audio was not copied. Run npm run sync:public:audio when host limits are confirmed.");
}

function ensureSitemapCoverage() {
  const routesPath = path.resolve(process.cwd(), "src/site/routes.ts");
  const sitemapPath = path.join(publicRoot, "sitemap.xml");

  if (!existsSync(routesPath) || !existsSync(sitemapPath)) {
    return;
  }

  const routesSource = readFileSync(routesPath, "utf8");
  const routeSourceFiles = [...routesSource.matchAll(/sourceFile:\s*"([^"]+\.html)"/g)].map((match) => match[1]);
  let sitemap = readFileSync(sitemapPath, "utf8");
  const existingLocs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
  const fallbackLastmod = latestExistingLastmod(sitemap);
  const missingSourceFiles = routeSourceFiles.filter(
    (sourceFile) => !existingLocs.has(`${siteOrigin}/${sourceFile}`)
  );

  if (!missingSourceFiles.length) {
    return;
  }

  const insertion = missingSourceFiles
    .map((sourceFile) => {
      const { changefreq, priority } = sitemapDefaultsFor(sourceFile);

      return [
        "  <url>",
        `    <loc>${siteOrigin}/${sourceFile}</loc>`,
        `    <lastmod>${lastmodFor(sourceFile, fallbackLastmod)}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        "  </url>"
      ].join("\n");
    })
    .join("\n");

  sitemap = sitemap.replace("</urlset>", `${insertion}\n</urlset>`);
  writeFileSync(sitemapPath, sitemap);

  for (const sourceFile of missingSourceFiles) {
    console.log(`Added missing sitemap URL for ${sourceFile}`);
  }
}

function latestExistingLastmod(sitemap) {
  const lastmods = [...sitemap.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)]
    .map((match) => match[1])
    .sort();

  return lastmods.at(-1) ?? new Date().toISOString().slice(0, 10);
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
