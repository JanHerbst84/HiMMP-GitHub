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
 * See `docs/nextjs-phase-2-far-goal.md` criterion 1.
 */

import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "default" });

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
