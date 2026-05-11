import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const outDir = path.join(appRoot, "out");
const inventoryPath = path.join(appRoot, ".migration/current-site-inventory.json");

function isLocalReference(value) {
  return !/^(https?:|mailto:|tel:|#|\/\/|javascript:)/i.test(value);
}

function normalizeReference(sourcePage, value) {
  const withoutHash = value.split("#")[0].split("?")[0];
  if (!withoutHash || withoutHash.includes("${")) {
    return null;
  }

  if (withoutHash.startsWith("/")) {
    return withoutHash.slice(1);
  }

  return path.posix.normalize(path.posix.join(path.posix.dirname(sourcePage), withoutHash));
}

function isAllowedPending(reference) {
  return reference.startsWith("assets/audio/") || reference === "get-csrf-token.php" || reference === "contact-handler.php";
}

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
const pending = [];

for (const page of inventory.pages) {
  const generatedPath = path.join(outDir, page.path);
  if (!existsSync(generatedPath)) {
    missing.push(`${page.path}: generated page missing`);
    continue;
  }

  const html = readFileSync(generatedPath, "utf8").replace(
    /<script>self\.__next_f\.push\([\s\S]*?<\/script>/g,
    ""
  );
  const references = [...html.matchAll(/\b(?:src|href|data-src)="([^"]+)"/gi)]
    .map((match) => match[1])
    .filter(isLocalReference)
    .map((reference) => normalizeReference(page.path, reference))
    .filter((reference) => reference !== null);

  for (const reference of references) {
    if (reference.startsWith("_next/")) {
      continue;
    }

    if (!existsSync(path.join(outDir, reference))) {
      const item = `${page.path}: ${reference}`;
      if (isAllowedPending(reference)) {
        pending.push(item);
      } else {
        missing.push(item);
      }
    }
  }
}

if (missing.length) {
  console.error(`Missing ${missing.length} required local reference(s):`);
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

if (pending.length) {
  console.warn(`Allowed pending local references (${pending.length}):`);
  for (const item of pending.slice(0, 20)) {
    console.warn(`- ${item}`);
  }
  if (pending.length > 20) {
    console.warn(`- ... ${pending.length - 20} more`);
  }
}

console.log(`Local reference check passed for ${inventory.pages.length} generated HTML files.`);
