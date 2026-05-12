import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const appRoot = process.cwd();
const repoRoot = path.join(appRoot, "..");
const outDir = path.join(appRoot, "out");
const artifactRoot = path.join(appRoot, ".migration", "visual-parity");
const legacyPort = 4174;
const nextPort = 4175;
const maxNormalizedRmse = Number(process.env.VISUAL_MAX_RMSE ?? "0.20");

const routes = [
  "/index.html",
  "/about.html",
  "/approach.html",
  "/publications.html",
  "/videos.html",
  "/audio.html",
  "/faq.html",
  "/findings.html",
  "/findings/01-introduction.html",
  "/findings/09-guitars-bass.html",
  "/findings/14-recommended-reading.html",
  "/findings/glossary.html"
];

const viewports = [
  { name: "desktop", width: 1440, height: 1400 },
  { name: "mobile", width: 390, height: 1200 }
];

function startServer(directory, port) {
  const server = spawn("python3", ["-m", "http.server", String(port), "-d", directory], {
    stdio: ["ignore", "ignore", "ignore"]
  });

  return server;
}

async function waitForServer(baseUrl) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until the server is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Timed out waiting for ${baseUrl}`);
}

function safeName(route, viewportName) {
  return `${viewportName}-${route.replace(/^\/|\.html$/g, "").replace(/\//g, "__") || "index"}`;
}

function compareImages(legacyPath, nextPath, diffPath) {
  return new Promise((resolve, reject) => {
    const compare = spawn("compare", ["-metric", "RMSE", legacyPath, nextPath, diffPath], {
      stdio: ["ignore", "ignore", "pipe"]
    });
    let stderr = "";

    compare.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    compare.on("error", reject);
    compare.on("close", (code) => {
      const normalizedRmse = Number(stderr.trim().match(/\(([^)]+)\)/)?.[1] ?? "0");
      if (code !== 0 && Number.isNaN(normalizedRmse)) {
        reject(new Error(`ImageMagick compare failed for ${nextPath}: ${stderr.trim()}`));
        return;
      }
      resolve(normalizedRmse);
    });
  });
}

async function capture(locator, pathName) {
  await locator.scrollIntoViewIfNeeded();
  await locator.screenshot({ path: pathName, animations: "disabled" });
}

async function preparePage(page) {
  await page.addStyleTag({
    content: `
      .site-header { visibility: hidden !important; }
      .enhanced-findings-shell { display: block !important; background: transparent !important; }
      .enhanced-findings-shell__content { min-width: auto !important; }
      .findings-reader-panel,
      .findings-reader-topbar { display: none !important; }
    `
  });
}

if (!existsSync(outDir)) {
  console.error("Missing out/. Run npm run build first.");
  process.exit(1);
}

rmSync(artifactRoot, { recursive: true, force: true });
mkdirSync(artifactRoot, { recursive: true });

const legacyServer = startServer(repoRoot, legacyPort);
const nextServer = startServer(outDir, nextPort);

try {
  await Promise.all([
    waitForServer(`http://127.0.0.1:${legacyPort}/index.html`),
    waitForServer(`http://127.0.0.1:${nextPort}/index.html`)
  ]);

  const browser = await chromium.launch({ channel: "chrome" });
  const failures = [];

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport });
      await context.route(/\/assets\/audio\//, (route) => route.abort());
      const legacyPage = await context.newPage();
      const nextPage = await context.newPage();

      for (const route of routes) {
        const baseName = safeName(route, viewport.name);
        const legacyPath = path.join(artifactRoot, `${baseName}-legacy.png`);
        const nextPath = path.join(artifactRoot, `${baseName}-next.png`);
        const diffPath = path.join(artifactRoot, `${baseName}-diff.png`);

        await legacyPage.goto(`http://127.0.0.1:${legacyPort}${route}`, { waitUntil: "domcontentloaded" });
        await nextPage.goto(`http://127.0.0.1:${nextPort}${route}`, { waitUntil: "domcontentloaded" });
        await preparePage(legacyPage);
        await preparePage(nextPage);
        await legacyPage.waitForTimeout(500);
        await nextPage.waitForTimeout(500);

        await capture(legacyPage.locator("#main-content"), legacyPath);
        await capture(nextPage.locator("#main-content"), nextPath);

        const normalizedRmse = await compareImages(legacyPath, nextPath, diffPath);
        if (normalizedRmse > maxNormalizedRmse) {
          failures.push(`${viewport.name} ${route}: normalized RMSE ${normalizedRmse.toFixed(4)}`);
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error(`Visual parity exceeded normalized RMSE ${maxNormalizedRmse} for ${failures.length} capture(s):`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    console.error(`Artifacts written to ${path.relative(appRoot, artifactRoot)}/`);
    process.exit(1);
  }

  console.log(`Visual parity passed for ${routes.length * viewports.length} main-content captures.`);
  console.log(`Artifacts written to ${path.relative(appRoot, artifactRoot)}/`);
} finally {
  legacyServer.kill();
  nextServer.kill();
}
