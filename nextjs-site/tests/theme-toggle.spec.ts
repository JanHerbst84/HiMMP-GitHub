/*
 * D-9-d theme-toggle Playwright suite.
 *
 * Verifies the three user paths the Phase 3 far-goal §6 names:
 *
 *  1. Clicking the toggle cycles light → dark → system; the
 *     `<html data-theme>` attribute flips accordingly; the
 *     `localStorage` `himmp-theme` value persists across reloads.
 *  2. With no `localStorage` set, a browser with
 *     `prefers-color-scheme: dark` activates the dark scheme via
 *     the @media fallback in tokens.css.
 *  3. An explicit "light" choice in localStorage wins over a
 *     dark-OS system preference.
 */

import { test, expect } from "@playwright/test";

test.describe("D-9-d theme toggle", () => {
  test("click cycles light → dark → system and persists across reload", async ({ page, context }) => {
    await page.goto("/");

    const toggle = page.locator("button.theme-toggle");
    await expect(toggle).toBeVisible();

    // First click: system → light
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    // Second: light → dark
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    // Third: dark → system (attribute removed)
    await toggle.click();
    const themeAttr = await page.locator("html").getAttribute("data-theme");
    expect(themeAttr).toBeNull();

    // Cycle back to dark and reload — should persist
    await toggle.click(); // → light
    await toggle.click(); // → dark
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    // Cleanup so subsequent tests start from clean state.
    await page.evaluate(() => localStorage.removeItem("himmp-theme"));
  });

  test("system preference (dark OS) activates dark scheme without explicit choice", async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: "dark" });
    const page = await ctx.newPage();
    await page.goto("/");
    // Confirm no localStorage value — the early-init script should
    // leave data-theme unset and the media query takes over.
    const themeAttr = await page.locator("html").getAttribute("data-theme");
    expect(themeAttr).toBeNull();
    // Body bg should resolve to graphite via the media query.
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBe("rgb(17, 20, 24)");
    await ctx.close();
  });

  test("explicit 'light' choice overrides dark-OS preference", async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: "dark" });
    const page = await ctx.newPage();
    // Set localStorage before navigating so the early-init script
    // reads it. Use page.addInitScript to inject before any page
    // script runs.
    await ctx.addInitScript(() => {
      try {
        window.localStorage.setItem("himmp-theme", "light");
      } catch {
        /* swallow */
      }
    });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    // Body bg should resolve to bone.
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBe("rgb(242, 239, 232)");
    await ctx.close();
  });
});
