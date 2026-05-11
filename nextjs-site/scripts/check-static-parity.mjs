import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const inventoryPath = path.join(appRoot, ".migration/current-site-inventory.json");
const outDir = path.join(appRoot, "out");

if (!existsSync(inventoryPath)) {
  console.error("Missing .migration/current-site-inventory.json. Run npm run inventory first.");
  process.exit(1);
}

if (!existsSync(outDir)) {
  console.error("Missing out/. Run npm run build first.");
  process.exit(1);
}

const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
const missing = [];

for (const page of inventory.pages) {
  const outputPath = path.join(outDir, page.path);
  if (!existsSync(outputPath)) {
    missing.push(page.path);
  }
}

if (missing.length) {
  console.error(`Missing ${missing.length} legacy static output file(s):`);
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log(`Static route parity passed for ${inventory.pages.length} legacy HTML files.`);
