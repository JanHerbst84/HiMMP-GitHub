import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { siteOrigin } from "./site-config.mjs";

const routesPath = path.resolve(process.cwd(), "src/site/routes.ts");
const sitemapPath = path.resolve(process.cwd(), "out/sitemap.xml");

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

console.log(`Sitemap parity passed for ${routeSourceFiles.length} generated legacy routes.`);
