#!/usr/bin/env node
/*
 * Build web-sized WebP derivatives of the findings figures.
 *
 * Source:  <repo>/findings/Figures/*.{png,jpg,jpeg}   (originals, unchanged)
 * Output:  <repo>/findings/Figures/web/<name>.webp  + manifest.json
 *
 * Settings (recorded per file in the manifest):
 * - never upscaled; downscaled to at most MAX_WIDTH px wide;
 * - photographs (.jpg/.jpeg): lossy WebP, quality 82;
 * - diagrams (.png): lossless WebP, or lossy quality 90 when that is
 *   smaller; alpha is preserved either way.
 *
 * Uses the system ImageMagick 7 `magick` CLI; no npm dependency. The run is
 * incremental: a figure is re-encoded only when its source hash, the
 * settings version or the output file (by SHA-256) changed. Every output is
 * encoded to a temporary file and renamed into place, so an interrupted run
 * never leaves a truncated derivative. `--check` exits 1 when any derivative
 * is missing, altered or stale (runs before every build).
 *
 * Exit codes: 0 ok, 1 stale derivatives (with --check), 2 tool/input error.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SETTINGS_VERSION = 1;
const MAX_WIDTH = 1600;
const PHOTO_QUALITY = 82;
const DIAGRAM_LOSSY_QUALITY = 90;

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// `--root <dir>` points at another repository root (used by the unit test).
const rootFlag = process.argv.indexOf("--root");
const repoRoot = rootFlag > -1 ? path.resolve(process.argv[rootFlag + 1]) : path.resolve(appRoot, "..");
const sourceDir = path.join(repoRoot, "findings/Figures");
const outputDir = path.join(sourceDir, "web");
const manifestPath = path.join(outputDir, "manifest.json");
const checkOnly = process.argv.includes("--check");

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function magick(args) {
  return execFileSync("magick", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function dimensions(file) {
  const [width, height] = magick(["identify", "-format", "%w %h", `${file}[0]`]).trim().split(" ").map(Number);
  return { width, height };
}

function encode(source, target, options) {
  magick([
    source,
    "-auto-orient",
    "-strip",
    "-resize",
    `${MAX_WIDTH}x>`,
    ...options,
    target
  ]);
}

function build(sourceName) {
  const source = path.join(sourceDir, sourceName);
  const base = sourceName.replace(/\.[^.]+$/, "");
  const target = path.join(outputDir, `${base}.webp`);
  const isPhoto = /\.jpe?g$/i.test(sourceName);

  let settings;
  if (isPhoto) {
    const tmp = `${target}.photo.tmp.webp`;
    encode(source, tmp, ["-quality", String(PHOTO_QUALITY), "-define", "webp:method=6"]);
    renameSync(tmp, target);
    settings = { mode: "lossy", quality: PHOTO_QUALITY };
  } else {
    const lossless = `${target}.lossless.tmp.webp`;
    const lossy = `${target}.lossy.tmp.webp`;
    encode(source, lossless, ["-define", "webp:lossless=true", "-define", "webp:method=6"]);
    encode(source, lossy, ["-quality", String(DIAGRAM_LOSSY_QUALITY), "-define", "webp:method=6", "-define", "webp:alpha-quality=100"]);
    const useLossless = statSync(lossless).size <= statSync(lossy).size;
    renameSync(useLossless ? lossless : lossy, target);
    rmSync(useLossless ? lossy : lossless, { force: true });
    settings = useLossless ? { mode: "lossless" } : { mode: "lossy", quality: DIAGRAM_LOSSY_QUALITY };
  }

  const original = dimensions(source);
  const output = dimensions(target);
  return {
    source: `findings/Figures/${sourceName}`,
    sourceSha256: sha256(source),
    sourceBytes: statSync(source).size,
    sourceWidth: original.width,
    sourceHeight: original.height,
    webp: `findings/Figures/web/${base}.webp`,
    width: output.width,
    height: output.height,
    bytes: statSync(target).size,
    webpSha256: sha256(target),
    settings: { version: SETTINGS_VERSION, maxWidth: MAX_WIDTH, ...settings }
  };
}

function main() {
  if (!existsSync(sourceDir)) {
    console.error(`Missing figure directory: ${sourceDir}`);
    process.exit(2);
  }
  // An unreadable manifest is treated as empty: --check reports everything
  // stale, and an optimize run rebuilds it.
  let manifest = { figures: {} };
  if (existsSync(manifestPath)) {
    try {
      const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
      const figures = parsed?.figures;
      if (!figures || typeof figures !== "object" || Array.isArray(figures)) throw new Error("no figures map");
      manifest = { figures };
    } catch {
      console.warn(`Unreadable ${path.relative(repoRoot, manifestPath)}; treating every figure as stale.`);
    }
  }
  const sources = readdirSync(sourceDir).filter((name) => /\.(png|jpe?g)$/i.test(name)).sort();
  const stale = sources.filter((name) => {
    const entry = manifest.figures[name];
    return (
      !entry ||
      entry.settings?.version !== SETTINGS_VERSION ||
      entry.sourceSha256 !== sha256(path.join(sourceDir, name)) ||
      !existsSync(path.join(repoRoot, entry.webp)) ||
      entry.webpSha256 !== sha256(path.join(repoRoot, entry.webp))
    );
  });
  const removed = Object.keys(manifest.figures).filter((name) => !sources.includes(name));

  if (checkOnly) {
    if (stale.length || removed.length) {
      console.error(`Stale figure derivatives: ${[...stale, ...removed].join(", ")}. Run npm run figures:optimize.`);
      process.exit(1);
    }
    console.log(`Figure derivatives current for ${sources.length} figures.`);
    return;
  }

  if (stale.length) {
    // ImageMagick is needed only to encode; --check and no-op runs read files.
    try {
      magick(["-version"]);
    } catch {
      console.error("ImageMagick 7 `magick` is required to encode figures.");
      process.exit(2);
    }
  }

  mkdirSync(outputDir, { recursive: true });
  for (const name of stale) {
    manifest.figures[name] = build(name);
    const entry = manifest.figures[name];
    console.log(`${name}: ${entry.sourceBytes} B ${entry.sourceWidth}px -> ${entry.bytes} B ${entry.width}px (${entry.settings.mode})`);
  }
  for (const name of removed) {
    rmSync(path.join(repoRoot, manifest.figures[name].webp), { force: true });
    delete manifest.figures[name];
  }
  const ordered = Object.fromEntries(Object.keys(manifest.figures).sort().map((name) => [name, manifest.figures[name]]));
  const manifestTmp = `${manifestPath}.tmp`;
  writeFileSync(manifestTmp, JSON.stringify({ figures: ordered }, null, 2) + "\n");
  renameSync(manifestTmp, manifestPath);
  const total = (key) => Object.values(ordered).reduce((sum, entry) => sum + entry[key], 0);
  console.log(`${sources.length} figures: ${total("sourceBytes")} B originals -> ${total("bytes")} B WebP (${stale.length} re-encoded).`);
}

main();
