#!/usr/bin/env node
/*
 * Unit test for scripts/optimize-figures.mjs on a throwaway figure tree.
 * Exit 0 on success, 1 on a failed check.
 */
import { spawnSync, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "optimize-figures.mjs");
const root = mkdtempSync(path.join(os.tmpdir(), "optimize-figures-"));
const figures = path.join(root, "findings/Figures");
const web = path.join(figures, "web");
let failures = 0;

function run(...args) {
  return spawnSync(process.execPath, [script, "--root", root, ...args], { encoding: "utf8" });
}
function check(label, actual, expected) {
  if (actual !== expected) {
    failures += 1;
    console.error(`FAIL ${label}: ${actual} != ${expected}`);
  }
}

try {
  mkdirSync(figures, { recursive: true });
  execFileSync("magick", ["-size", "2400x1200", "gradient:white-black", path.join(figures, "diagram.png")]);
  execFileSync("magick", ["-size", "800x600", "plasma:", path.join(figures, "photo.jpg")]);

  check("check before first run", run("--check").status, 1);
  check("first run", run().status, 0);
  const manifest = JSON.parse(readFileSync(path.join(web, "manifest.json"), "utf8")).figures;
  check("downscaled to 1600", manifest["diagram.png"].width, 1600);
  check("aspect kept", manifest["diagram.png"].height, 800);
  check("never upscaled", manifest["photo.jpg"].width, 800);
  check("photo is lossy", manifest["photo.jpg"].settings.mode, "lossy");
  check("no temp files left", readdirSync(web).some((name) => name.includes(".tmp.")), false);
  check("check after run", run("--check").status, 0);

  writeFileSync(path.join(web, "photo.webp"), "truncated");
  check("altered derivative detected", run("--check").status, 1);
  check("repair run", run().status, 0);
  check("check after repair", run("--check").status, 0);

  execFileSync("magick", ["-size", "800x600", "gradient:red-blue", path.join(figures, "photo.jpg")]);
  check("changed source detected", run("--check").status, 1);
  run();

  rmSync(path.join(figures, "diagram.png"));
  check("removed source detected", run("--check").status, 1);
  run();
  check("removed derivative deleted", existsSync(path.join(web, "diagram.webp")), false);
  check("final check", run("--check").status, 0);

  // A truncated manifest is recoverable: --check fails, optimize rebuilds it.
  writeFileSync(path.join(web, "manifest.json"), '{ "figures": { "photo');
  check("truncated manifest detected", run("--check").status, 1);
  check("truncated manifest rebuilt", run().status, 0);
  check("check after manifest rebuild", run("--check").status, 0);

  for (const [label, text] of [["empty object", "{}"], ["null figures", '{"figures":null}']]) {
    writeFileSync(path.join(web, "manifest.json"), text);
    check(`${label} manifest detected`, run("--check").status, 1);
    check(`${label} manifest rebuilt`, run().status, 0);
  }

  // --check needs no ImageMagick.
  const noMagick = spawnSync(process.execPath, [script, "--root", root, "--check"], {
    encoding: "utf8",
    env: { ...process.env, PATH: path.dirname(process.execPath) }
  });
  check("--check without ImageMagick", noMagick.status, 0);
} finally {
  rmSync(root, { recursive: true, force: true });
}

if (failures) process.exit(1);
console.log("optimize-figures tests passed.");
