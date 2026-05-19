/*
 * D-1 retirement-gate test (criterion 1, far-goal).
 *
 * Navigates every one of the 27 generated routes, listens for network
 * requests, and asserts zero requests for `/assets/css/main.css` or
 * `/assets/css/responsive.css`. This is the user-visible-switchover
 * proof: a source `grep` for the link references is the cheap
 * preliminary, but a component or generated head output could
 * re-introduce the request without changing `app/layout.tsx` — only
 * a real browser network observation closes that gap.
 *
 * Until D-1 §4.9 (the link-retirement gate slice) lands, this test
 * would FAIL on every route because the legacy links are still in
 * `app/layout.tsx`. So the suite SKIPS unconditionally unless the
 * `RUN_D1_RETIREMENT_GATE=1` env var is set. The gate slice will flip
 * that env var to 1 in CI / npm script and the trip-wire activates.
 * Until then, `npx playwright test` stays green.
 *
 * To run this gate locally:
 *   RUN_D1_RETIREMENT_GATE=1 npx playwright test no-legacy-stylesheet-requests
 *
 * See `docs/nextjs-phase-2-far-goal.md` criterion 1.
 */

import { test, expect } from "@playwright/test";

const D1_GATE_ACTIVE = process.env.RUN_D1_RETIREMENT_GATE === "1";
test.describe.configure({ mode: "default" });
test.skip(
  !D1_GATE_ACTIVE,
  "D-1 link-retirement gate is inactive — set RUN_D1_RETIREMENT_GATE=1 to enable."
);

const LEGACY_STYLESHEETS = [
  "/assets/css/main.css",
  "/assets/css/responsive.css"
];

const ROUTES = [
  "/",
  "/about.html",
  "/approach.html",
  "/team.html",
  "/publications.html",
  "/findings.html",
  "/videos.html",
  "/audio.html",
  "/faq.html",
  "/contact.html",
  "/privacy.html",
  "/acknowledgements.html",
  "/findings/01-introduction.html",
  "/findings/02-producers.html",
  "/findings/03-methodology.html",
  "/findings/04-foundations.html",
  "/findings/05-naturalistic.html",
  "/findings/06-hyperreal.html",
  "/findings/07-meta-instrument.html",
  "/findings/08-drums.html",
  "/findings/09-guitars-bass.html",
  "/findings/10-spatial.html",
  "/findings/11-subjective.html",
  "/findings/12-application.html",
  "/findings/13-future.html",
  "/findings/14-recommended-reading.html",
  "/findings/glossary.html"
];

test.describe("D-1 link-retirement gate", () => {
  for (const route of ROUTES) {
    test(`${route} does not request legacy stylesheets`, async ({ page }) => {
      const legacyRequests: string[] = [];
      page.on("request", (req) => {
        const url = req.url();
        for (const path of LEGACY_STYLESHEETS) {
          if (url.endsWith(path)) {
            legacyRequests.push(url);
          }
        }
      });
      await page.goto(route, { waitUntil: "networkidle" });
      expect(
        legacyRequests,
        `Route ${route} requested legacy stylesheet(s): ${legacyRequests.join(", ")}`
      ).toEqual([]);
    });
  }
});
