#!/usr/bin/env node
/*
 * All-route Content-Security-Policy browser audit (docs/hostinger-deployment.md
 * requires one after any resource or embed change).
 *
 * Loads every route from src/site/routes.ts in Chromium against
 * CSP_AUDIT_BASE_URL (default https://himmp.net) and reports: a missing
 * enforcing Content-Security-Policy header (or any report-only header) on
 * the document; CSP violations (console "Content Security Policy" /
 * "Refused to" messages and securitypolicyviolation events); failed
 * same-origin requests; and click-to-load YouTube embeds that do not load
 * when their trigger is activated (every page with such an embed must get
 * its first one loaded). Media requests aborted when a page closes are
 * expected and ignored. Set CSP_AUDIT_SKIP_HEADERS=1 for a local static
 * server, which sends no CSP.
 *
 * Exit codes: 0 clean, 1 violations or failures, 2 setup error.
 */
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const baseUrl = (process.env.CSP_AUDIT_BASE_URL ?? "https://himmp.net").replace(/\/$/, "");
const routes = [...readFileSync("src/site/routes.ts", "utf8").matchAll(/sourceFile:\s*"([^"]+\.html)"/g)].map(
  (match) => match[1]
);

let browser;
try {
  browser = await chromium.launch(process.env.CSP_AUDIT_CHROMIUM ? { executablePath: process.env.CSP_AUDIT_CHROMIUM } : { channel: "chrome" });
} catch (error) {
  console.error(`Cannot launch Chromium: ${error.message}`);
  process.exit(2);
}

const problems = [];
let embedsActivated = 0;
let embedPages = 0;
const checkHeaders = process.env.CSP_AUDIT_SKIP_HEADERS !== "1";

for (const route of routes) {
  const page = await browser.newPage();
  const url = route === "index.html" ? `${baseUrl}/` : `${baseUrl}/${route}`;
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.__cspViolations.push(`${event.violatedDirective} blocked ${event.blockedURI}`);
    });
  });
  page.on("console", (message) => {
    const text = message.text();
    if (/Content Security Policy|Refused to/i.test(text)) problems.push(`${route}: console: ${text.slice(0, 200)}`);
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "";
    const sameOrigin = request.url().startsWith(baseUrl);
    const mediaAbort = /ERR_ABORTED/.test(failure) && ["media", "image"].includes(request.resourceType());
    if (sameOrigin && !mediaAbort) problems.push(`${route}: request failed ${request.url()} (${failure})`);
  });
  page.on("response", (response) => {
    if (response.url().startsWith(baseUrl) && response.status() >= 400) {
      problems.push(`${route}: HTTP ${response.status()} ${response.url()}`);
    }
  });

  try {
    const response = await page.goto(url, { waitUntil: "load", timeout: 60000 });
    if (checkHeaders) {
      const headers = response ? await response.allHeaders() : {};
      if (!headers["content-security-policy"]) problems.push(`${route}: no enforcing Content-Security-Policy header`);
      if (headers["content-security-policy-report-only"]) problems.push(`${route}: report-only CSP header present`);
    }

    const lazyFrames = page.locator("iframe[data-lazy-youtube-src]");
    if (await lazyFrames.count()) {
      embedPages += 1;
      const trigger = page.locator(".lazy-video-trigger").first();
      try {
        await trigger.waitFor({ state: "visible", timeout: 10000 });
        await trigger.click();
        await page.waitForFunction(
          () => [...document.querySelectorAll("iframe[data-lazy-youtube-src]")].some((frame) => frame.getAttribute("src")),
          null,
          { timeout: 10000 }
        );
        await page.waitForTimeout(2500);
        embedsActivated += 1;
      } catch (error) {
        problems.push(`${route}: click-to-load embed did not load (${error.message.split("\n")[0]})`);
      }
    }
    await page.waitForTimeout(500);
    const violations = await page.evaluate(() => window.__cspViolations);
    for (const violation of violations) problems.push(`${route}: ${violation}`);
  } catch (error) {
    problems.push(`${route}: ${error.message.split("\n")[0]}`);
  }
  await page.close();
}

await browser.close();
if (embedPages === 0) problems.push("no page with a click-to-load embed was found; the audit exercised no embeds");
console.log(JSON.stringify({ baseUrl, routes: routes.length, embedPages, embedsActivated, problems }, null, 2));
process.exit(problems.length ? 1 : 0);
