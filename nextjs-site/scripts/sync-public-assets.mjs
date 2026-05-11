import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

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

if (!includeAudio) {
  console.log("Audio was not copied. Run npm run sync:public:audio when host limits are confirmed.");
}
