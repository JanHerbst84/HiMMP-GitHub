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
const scopedThresholds = new Map([
  ["mobile /findings/01-introduction.html", 0.21],
  ["mobile /findings/09-guitars-bass.html", 0.24]
]);

/*
 * Routes still in the migration-preservation set. Once a page is
 * intentionally redesigned beyond just the hero (body content, section
 * rhythm, etc.), it leaves this list — the legacy site is no longer the
 * target for that page. Removed so far:
 *   - /about.html (body refresh shipped 2026-05-13)
 *   - All remaining 11 routes (Slice E / Family A dark-academic chrome,
 *     2026-05-13) — body bg, body type, link/heading treatment diverge
 *     site-wide from legacy. Per-route body-smoke coverage now lives in
 *     tests/static-export.spec.ts ("dark-academic chrome applied").
 *     The script + .migration/visual-parity/ baselines are kept for
 *     reference; a future slice that re-introduces visual regression
 *     coverage should record new baselines against the redesigned state.
 */
const routes = [];

const viewports = [
  { name: "desktop", width: 1440, height: 1400 },
  { name: "mobile", width: 390, height: 1200 }
];

function thresholdFor(route, viewportName) {
  return scopedThresholds.get(`${viewportName} ${route}`) ?? maxNormalizedRmse;
}

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
      *,
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
      }
      body {
        font-family: var(--body-font) !important;
        line-height: 1.6 !important;
        color: var(--text-color) !important;
        background-color: var(--background-color) !important;
      }
      .site-header { visibility: hidden !important; }
      #main-content iframe,
      #main-content audio,
      #main-content video { visibility: hidden !important; }
      #main-content .enhanced-audio-status { display: none !important; }
      #main-content .audio-comparison,
      #main-content .comparison-player-container { display: none !important; }
      /*
       * Inner-page heroes deliberately redesigned in the design-refresh slice
       * (D-2a home, D-2b about/approach/team/publications). Each is targeted
       * via its distinct background image substring so the rest of the legacy
       * page bodies stay in the visual-parity coverage set.
       */
      #main-content section.hero[style*="HiMMP-bg-welcome.jpg"],
      #main-content section.hero[style*="HiMMP-bg-about.jpg"],
      #main-content section.hero[style*="HiMMP-bg-approach.jpg"],
      #main-content section.hero[style*="HiMMP-bg-team.jpg"],
      #main-content section.hero[style*="HiMMP-bg-publications.jpg"],
      #main-content section.hero[style*="HiMMP-bg-contact.jpg"] { display: none !important; }
      #main-content .lazy-video-container { background: transparent !important; }
      #main-content .lazy-video-trigger { display: none !important; }
      .enhanced-findings-shell { display: block !important; background: transparent !important; }
      .enhanced-findings-shell__content { min-width: auto !important; }
      .enhanced-findings-shell #main-content .chapter-section-nav { display: block !important; }
      .enhanced-findings-shell #main-content .chapter-nav { display: flex !important; }
      .enhanced-findings-shell #main-content .content-section { padding: var(--spacing-xl) 0 !important; }
      .enhanced-findings-shell #main-content .content-section > .container { max-width: var(--container-width) !important; }
      .enhanced-findings-shell #main-content .chapter-content {
        font-size: inherit !important;
        line-height: inherit !important;
        overflow-x: visible !important;
      }
      .enhanced-findings-shell #main-content .chapter-content p { line-height: inherit !important; }
      .enhanced-findings-shell #main-content .chapter-content li { line-height: 1.7 !important; }
      .enhanced-findings-shell #main-content .chapter-content h2 {
        margin-top: 0 !important;
        padding-top: 0 !important;
        border-top: 0 !important;
      }
      .enhanced-findings-shell #main-content .figure:not(.portrait) {
        max-width: none !important;
        margin: var(--spacing-md) 0 !important;
      }
      .enhanced-findings-shell #main-content .figure:not(.portrait) img {
        margin: 0 !important;
        box-shadow: none !important;
      }
      .enhanced-findings-shell #main-content .figure:not(.portrait) .figure-caption {
        max-width: none !important;
        margin-right: 0 !important;
        margin-left: 0 !important;
        line-height: inherit !important;
      }
      .enhanced-findings-shell #main-content .content-section table {
        display: table !important;
        max-width: none !important;
      }
      .enhanced-findings-shell #main-content .endnotes {
        margin-top: 2rem !important;
        padding-top: 0 !important;
        border-top: 0 !important;
      }
      .findings-reader-panel,
      .findings-reader-topbar,
      .findings-reader-bottombar { display: none !important; }
    `
  });
  await page.evaluate(async () => {
    for (const image of document.images) {
      image.loading = "eager";
    }

    await Promise.all(
      Array.from(document.images, (image) => {
        if (image.complete) {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      })
    );

    await document.fonts?.ready;
  });
}

if (routes.length === 0) {
  console.log("Visual parity preservation set is empty — no routes to compare.");
  console.log("See the routes-list comment in this file for the migration history.");
  process.exit(0);
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
        const threshold = thresholdFor(route, viewport.name);
        if (normalizedRmse > threshold) {
          failures.push(
            `${viewport.name} ${route}: normalized RMSE ${normalizedRmse.toFixed(4)} ` +
              `(threshold ${threshold.toFixed(2)})`
          );
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error(`Visual parity exceeded configured RMSE thresholds for ${failures.length} capture(s):`);
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
