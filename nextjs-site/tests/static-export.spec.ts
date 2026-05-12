import { expect, type Page, test } from "@playwright/test";
import { legacyRoutes } from "../src/site/routes";

const legacyPaths = legacyRoutes.map((route) =>
  route.sourceFile === "index.html" ? "/index.html" : `/${route.sourceFile}`
);
const findingsRoutes = legacyRoutes.filter(
  (route) => route.sourceFile === "findings.html" || route.sourceFile.startsWith("findings/")
);
const enhancedAccessibilityRoutes = [
  "/findings.html",
  "/findings/07-meta-instrument.html",
  "/findings/09-guitars-bass.html",
  "/findings/glossary.html",
  "/audio.html",
  "/videos.html"
];

function findingsHref(sourceFile: string): string {
  return `/${sourceFile}`;
}

function trackUnexpectedFailures(page: Page): string[] {
  const unexpectedFailures: string[] = [];

  page.on("response", (response) => {
    const url = response.url();
    const status = response.status();

    if (status < 400) {
      return;
    }

    const allowedPendingAsset =
      url.includes("/assets/audio/") || url.endsWith("/get-csrf-token.php");

    if (!allowedPendingAsset) {
      unexpectedFailures.push(`${status} ${url}`);
    }
  });

  return unexpectedFailures;
}

async function waitForLocalResponses(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 250);
  });
}

async function stubAudioLoading(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const mediaPrototype = window.HTMLMediaElement.prototype;

    mediaPrototype.load = function load() {
      this.currentTime = 0;
      window.setTimeout(() => {
        this.dispatchEvent(new Event("loadedmetadata"));
      }, 0);
    };

    mediaPrototype.play = function play() {
      return Promise.resolve();
    };
  });

  await page.route("**/assets/audio/**", (route) =>
    route.fulfill({
      contentType: "audio/mpeg",
      body: Buffer.from("")
    })
  );
}

type AccessibilitySmokeIssue = {
  detail: string;
  selector: string;
};

async function accessibilitySmokeIssues(page: Page): Promise<AccessibilitySmokeIssue[]> {
  return page.evaluate(() => {
    const issues: AccessibilitySmokeIssue[] = [];
    const selectorFor = (element: Element): string => {
      if (element.id) {
        return `#${element.id}`;
      }

      const tag = element.tagName.toLowerCase();
      const className = [...element.classList].slice(0, 2).join(".");

      return className ? `${tag}.${className}` : tag;
    };
    const hiddenFromAccessibilityTree = (element: Element): boolean => {
      if (element.closest("[hidden], [aria-hidden='true']")) {
        return true;
      }

      const style = window.getComputedStyle(element);
      return style.display === "none" || style.visibility === "hidden";
    };
    const accessibleDescendantText = (element: Element): string => {
      const texts: string[] = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();

      while (node) {
        const parent = node.parentElement;
        if (parent && !hiddenFromAccessibilityTree(parent)) {
          const text = node.textContent?.trim();
          if (text) {
            texts.push(text);
          }
        }

        node = walker.nextNode();
      }

      return texts.join(" ");
    };

    const accessibleName = (element: Element): string => {
      const labelledBy = element
        .getAttribute("aria-labelledby")
        ?.split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
        .filter(Boolean)
        .join(" ");

      return (
        [
          labelledBy,
          element.getAttribute("aria-label"),
          element.getAttribute("title"),
          accessibleDescendantText(element),
          ...[...element.querySelectorAll("img")]
            .filter((image) => !hiddenFromAccessibilityTree(image))
            .map((image) => image.getAttribute("alt")),
          ...[...element.querySelectorAll("svg title")]
            .filter((title) => !hiddenFromAccessibilityTree(title))
            .map((title) => title.textContent)
        ]
          .map((value) => value?.trim() ?? "")
          .find(Boolean) ?? ""
      );
    };

    if (!document.querySelector("a.skip-to-content[href='#main-content']")) {
      issues.push({ detail: "Missing skip-to-content link", selector: "body" });
    }

    if (!document.querySelector("#main-content")) {
      issues.push({ detail: "Missing main content landmark target", selector: "body" });
    }

    const h1Count = document.querySelectorAll("h1").length;
    if (h1Count !== 1) {
      issues.push({ detail: `Expected one page h1, found ${h1Count}`, selector: "body" });
    }

    for (const image of document.querySelectorAll("img")) {
      if (!image.hasAttribute("alt")) {
        issues.push({ detail: "Image missing alt attribute", selector: selectorFor(image) });
      }
    }

    for (const button of document.querySelectorAll("button")) {
      if (!accessibleName(button)) {
        issues.push({ detail: "Button missing accessible name", selector: selectorFor(button) });
      }
    }

    for (const frame of document.querySelectorAll("iframe")) {
      if (!frame.getAttribute("title")?.trim()) {
        issues.push({ detail: "Iframe missing title", selector: selectorFor(frame) });
      }
    }

    for (const region of document.querySelectorAll("[role='status']")) {
      const explicitLiveMode = region.getAttribute("aria-live");
      if (explicitLiveMode && explicitLiveMode !== "polite") {
        issues.push({
          detail: "Status region should not override polite live updates",
          selector: selectorFor(region)
        });
      }
    }

    return issues;
  });
}

test.describe("static export legacy route smoke", () => {
  for (const legacyPath of legacyPaths) {
    test(`${legacyPath} responds and renders the shared shell`, async ({ page }) => {
      const unexpectedFailures = trackUnexpectedFailures(page);
      const response = await page.goto(legacyPath);

      expect(response?.ok()).toBe(true);
      await expect(page.locator(".site-header")).toBeVisible();
      await expect(page.locator(".site-footer")).toBeVisible();
      await expect(page.locator("#main-content")).toBeVisible();
      await waitForLocalResponses();
      expect(unexpectedFailures).toEqual([]);
    });
  }

  test("mobile navigation can open and close", async ({ page }) => {
    const unexpectedFailures = trackUnexpectedFailures(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/about.html");

    const menuToggle = page.locator(".menu-toggle");
    await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute("aria-expanded", "true");
    await page.mouse.click(20, 20);
    await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("publication section navigation and accordions preserve legacy behavior", async ({ page }) => {
    const unexpectedFailures = trackUnexpectedFailures(page);
    await page.goto("/publications.html");

    const mynettNavButton = page.locator(".section-nav-button", {
      hasText: "Mark Mynett Publications"
    });
    await mynettNavButton.click();
    await expect(mynettNavButton).toHaveClass(/active/);

    const firstAccordion = page.locator("button.accordion").first();
    const secondAccordion = page.locator("button.accordion").nth(1);
    const firstPanel = firstAccordion.locator("+ .panel");
    const secondPanel = secondAccordion.locator("+ .panel");

    await firstAccordion.click();
    await expect(firstAccordion).toHaveClass(/active/);
    await expect
      .poll(() => firstPanel.evaluate((panel) => (panel as HTMLElement).style.maxHeight))
      .toMatch(/px$/);

    await secondAccordion.click();
    await expect(firstAccordion).not.toHaveClass(/active/);
    await expect.poll(() => firstPanel.evaluate((panel) => (panel as HTMLElement).style.maxHeight)).toBe("");
    await expect(secondAccordion).toHaveClass(/active/);
    await expect
      .poll(() => secondPanel.evaluate((panel) => (panel as HTMLElement).style.maxHeight))
      .toMatch(/px$/);

    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("audio comparison buttons switch source, label, and active mix", async ({ page }) => {
    await stubAudioLoading(page);
    const unexpectedFailures = trackUnexpectedFailures(page);
    await page.goto("/audio.html");

    await expect(page.locator("[data-enhanced-audio-controller='ready']")).toHaveCount(1);
    await expect(page.locator("script[src$='audio-player.js']")).toHaveCount(0);

    const comparisonPlayer = page.locator("#comparison-player");
    await expect(comparisonPlayer).toHaveAttribute("src", "assets/audio/HiMMP.mp3");
    await expect(page.locator("#currently-playing")).toHaveText("Now Playing: HiMMP");
    await expect(page.locator(".mix-btn", { hasText: "HiMMP" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".enhanced-audio-status")).toContainText("HiMMP");
    await page.mouse.move(0, 0);
    await expect(page.locator(".mix-btn", { hasText: "Bogren" })).toHaveCSS("color", "rgb(31, 41, 51)");
    await expect(page.locator(".mix-btn", { hasText: "HiMMP" })).toHaveCSS("color", "rgb(255, 255, 255)");

    await comparisonPlayer.evaluate((element) => {
      let storedTime = 37;
      Object.defineProperty(element, "currentTime", {
        configurable: true,
        get: () => storedTime,
        set: (value) => {
          storedTime = value;
        }
      });
      Object.defineProperty(element, "paused", {
        configurable: true,
        get: () => true
      });
    });

    const schepsButton = page.locator(".mix-btn", { hasText: "Scheps" });
    await schepsButton.click();

    await expect(schepsButton).toHaveClass(/active/);
    await expect(schepsButton).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".mix-btn", { hasText: "HiMMP" })).not.toHaveClass(/active/);
    await expect(page.locator(".mix-btn", { hasText: "HiMMP" })).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#currently-playing")).toHaveText("Now Playing: Andrew Scheps");
    await expect(comparisonPlayer).toHaveAttribute("src", "assets/audio/Scheps.mp3");
    await expect
      .poll(() => comparisonPlayer.evaluate((element) => (element as HTMLAudioElement).currentTime))
      .toBe(37);
    await expect(page.locator(".enhanced-audio-status")).toContainText("Andrew Scheps");

    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("enhanced audio controller reports unavailable audio without losing selection", async ({ page }) => {
    await stubAudioLoading(page);
    const unexpectedFailures = trackUnexpectedFailures(page);
    await page.goto("/audio.html");

    const comparisonPlayer = page.locator("#comparison-player");
    const schepsButton = page.locator(".mix-btn", { hasText: "Scheps" });
    await schepsButton.click();
    await comparisonPlayer.evaluate((element) => {
      element.dispatchEvent(new Event("error"));
    });

    await expect(schepsButton).toHaveClass(/active/);
    await expect(page.locator("#currently-playing")).toHaveText("Now Playing: Andrew Scheps");
    await expect(page.locator(".enhanced-audio-status")).toHaveAttribute("data-state", "error");
    await expect(page.locator(".enhanced-audio-status")).toHaveText("Audio unavailable: Andrew Scheps");

    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("findings chapter mix buttons use the enhanced audio controller", async ({ page }) => {
    await stubAudioLoading(page);
    const unexpectedFailures = trackUnexpectedFailures(page);
    await page.goto("/findings/07-meta-instrument.html");

    await expect(page.locator("[data-enhanced-audio-controller='ready']")).toHaveCount(1);
    await expect(page.locator("script[src$='audio-player.js']")).toHaveCount(0);

    const comparisonPlayer = page.locator(".mix-comparison-player").first();
    const audio = comparisonPlayer.locator("audio");
    await expect(comparisonPlayer.locator(".current-mix-name")).toHaveText("HiMMP Team");
    await expect(comparisonPlayer.locator(".mix-button", { hasText: "HiMMP" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(comparisonPlayer.locator(".enhanced-audio-status")).toContainText("HiMMP Team");

    await audio.evaluate((element) => {
      let storedTime = 42;
      Object.defineProperty(element, "currentTime", {
        configurable: true,
        get: () => storedTime,
        set: (value) => {
          storedTime = value;
        }
      });
      Object.defineProperty(element, "paused", {
        configurable: true,
        get: () => true
      });
    });

    const oteroButton = comparisonPlayer.locator(".mix-button", { hasText: "Otero" });
    await oteroButton.click();

    await expect(oteroButton).toHaveClass(/active/);
    await expect(oteroButton).toHaveAttribute("aria-pressed", "true");
    await expect(comparisonPlayer.locator(".mix-button", { hasText: "HiMMP" })).not.toHaveClass(/active/);
    await expect(comparisonPlayer.locator(".mix-button", { hasText: "HiMMP" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    await expect(comparisonPlayer.locator(".current-mix-name")).toHaveText("Dave Otero");
    await expect(audio).toHaveAttribute("src", "../assets/audio/Otero.mp3");
    await expect.poll(() => audio.evaluate((element) => (element as HTMLAudioElement).currentTime)).toBe(42);
    await expect(comparisonPlayer.locator(".enhanced-audio-status")).toContainText("Dave Otero");

    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("enhanced findings guide shell preserves chapter content and paging", async ({ page }) => {
    const unexpectedFailures = trackUnexpectedFailures(page);
    await page.goto("/findings/07-meta-instrument.html");

    const shell = page.locator(".enhanced-findings-shell");
    await expect(shell).toBeVisible();
    await expect(page.locator("#main-content h1")).toContainText('The "Meta-Instrument" Concept');
    await expect(page.locator(".findings-reader-panel__nav a[aria-current='page']")).toContainText(
      '7. The "Meta-Instrument" Concept'
    );
    await expect(page.locator(".findings-reader-topbar a[rel='prev']")).toHaveAttribute(
      "aria-label",
      "Previous: 6. The Hyperreal Approach"
    );
    await expect(page.locator(".findings-reader-topbar a[rel='next']")).toHaveAttribute(
      "aria-label",
      "Next: 8. Drum Production"
    );
    await expect(page.locator(".findings-reader-bottombar a[rel='prev']")).toHaveAttribute(
      "aria-label",
      "Previous: 6. The Hyperreal Approach"
    );
    await expect(page.locator(".findings-reader-bottombar a[rel='next']")).toHaveAttribute(
      "aria-label",
      "Next: 8. Drum Production"
    );
    await expect(page.locator(".findings-reader-topbar a[rel='prev'] .findings-reader-paging__title")).toHaveText(
      "6. The Hyperreal Approach"
    );

    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("enhanced findings hub exposes guide navigation without replacing the legacy main content", async ({ page }) => {
    const unexpectedFailures = trackUnexpectedFailures(page);
    await page.goto("/findings.html");

    await expect(page.locator(".enhanced-findings-shell")).toBeVisible();
    await expect(page.locator("#main-content h1")).toContainText("Heaviness in Metal Music Production");
    await expect(page.locator(".findings-reader-panel__nav a[aria-current='page']")).toHaveText("Guide home");
    await expect(page.locator(".findings-reader-topbar a[rel='next']")).toHaveAttribute(
      "aria-label",
      "Next: 1. The Pursuit of Heaviness"
    );

    const portraitWidths = await page
      .locator("#main-content .author-bio .figure.portrait")
      .evaluateAll((portraits) => portraits.map((portrait) => portrait.getBoundingClientRect().width));
    expect(portraitWidths).toHaveLength(2);
    for (const width of portraitWidths) {
      expect(width).toBeGreaterThan(0);
      expect(width).toBeLessThanOrEqual(220);
    }

    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("enhanced findings shell is enabled across the full guide", async ({ page }) => {
    const unexpectedFailures = trackUnexpectedFailures(page);

    for (const route of findingsRoutes) {
      await page.goto(findingsHref(route.sourceFile));

      await expect(page.locator(".enhanced-findings-shell")).toBeVisible();
      await expect(page.locator("#main-content")).toBeVisible();
      await expect(page.locator(".findings-reader-panel__nav a[aria-current='page']")).toHaveAttribute(
        "href",
        findingsHref(route.sourceFile)
      );
    }

    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("enhanced findings paging handles first, middle, and final entries", async ({ page }) => {
    const unexpectedFailures = trackUnexpectedFailures(page);

    const cases = [
      {
        route: "/findings/01-introduction.html",
        previous: "Previous: Guide home",
        next: "Next: 2. The Masters of Metal"
      },
      {
        route: "/findings/07-meta-instrument.html",
        previous: "Previous: 6. The Hyperreal Approach",
        next: "Next: 8. Drum Production"
      },
      {
        route: "/findings/glossary.html",
        previous: "Previous: 14. Recommended Reading",
        next: null
      }
    ];

    for (const testCase of cases) {
      await page.goto(testCase.route);

      await expect(page.locator(".enhanced-findings-shell")).toBeVisible();
      await expect(page.locator(".findings-reader-topbar a[rel='prev']")).toHaveAttribute(
        "aria-label",
        testCase.previous
      );

      const nextLink = page.locator(".findings-reader-topbar a[rel='next']");
      if (testCase.next) {
        await expect(nextLink).toHaveAttribute("aria-label", testCase.next);
      } else {
        await expect(nextLink).toHaveCount(0);
      }
    }

    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("enhanced findings layout does not introduce horizontal overflow", async ({ page }) => {
    const unexpectedFailures = trackUnexpectedFailures(page);

    for (const viewport of [
      { width: 1440, height: 1200 },
      { width: 390, height: 1200 }
    ]) {
      await page.setViewportSize(viewport);

      for (const route of ["/findings.html", "/findings/07-meta-instrument.html", "/findings/glossary.html"]) {
        await page.goto(route);
        await expect(page.locator(".enhanced-findings-shell")).toBeVisible();
        await expect(page.locator("#main-content")).toBeVisible();

        const dimensions = await page.evaluate(() => ({
          viewportWidth: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          mainWidth: document.querySelector("#main-content")?.getBoundingClientRect().width ?? 0
        }));
        expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
        expect(dimensions.mainWidth).toBeGreaterThan(0);
      }
    }

    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("enhanced findings reader polish keeps the legacy content intact", async ({ page }) => {
    const unexpectedFailures = trackUnexpectedFailures(page);
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto("/findings/07-meta-instrument.html");

    await expect(page.locator("#main-content .chapter-section-nav")).toHaveCount(1);
    await expect(page.locator("#main-content .chapter-section-nav")).toBeHidden();
    await expect(page.locator("#main-content .chapter-nav")).toHaveCount(1);
    await expect(page.locator("#main-content .chapter-nav")).toBeHidden();
    await expect(page.locator("#main-content .chapter-content")).toContainText(
      "One of the most significant insights to result from the research was the concept"
    );
    await expect(page.locator(".findings-reader-panel__status")).toHaveText("8 of 16");
    await expect(page.getByRole("navigation", { name: "Chapter paging at start" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Chapter paging at end" })).toBeVisible();
    await expect(page.locator(".findings-reader-bottombar")).toBeVisible();

    const readerMetrics = await page.evaluate(() => {
      const chapterContent = document.querySelector("#main-content .chapter-content")?.getBoundingClientRect();
      const figure = document.querySelector("#main-content .figure")?.getBoundingClientRect();
      const bottomBar = document.querySelector(".findings-reader-bottombar")?.getBoundingClientRect();

      return {
        chapterWidth: chapterContent?.width ?? 0,
        figureWidth: figure?.width ?? 0,
        bottomBarWidth: bottomBar?.width ?? 0
      };
    });

    expect(readerMetrics.chapterWidth).toBeGreaterThan(0);
    expect(readerMetrics.chapterWidth).toBeLessThanOrEqual(960);
    expect(readerMetrics.figureWidth).toBeGreaterThan(0);
    expect(readerMetrics.figureWidth).toBeLessThanOrEqual(860);
    expect(readerMetrics.bottomBarWidth).toBeGreaterThan(0);

    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("enhanced findings media remains loaded in visual-check chapters", async ({ page }) => {
    const unexpectedFailures = trackUnexpectedFailures(page);
    await page.goto("/findings/09-guitars-bass.html");

    const figure93 = page.locator("img[src='Figures/Fig9.3_Asymmetrical_Guitar.png']");
    await expect(figure93).toHaveCount(1);
    await figure93.scrollIntoViewIfNeeded();
    await expect(figure93).toBeVisible();
    await expect
      .poll(() =>
        figure93.evaluate((image) => ({
          complete: (image as HTMLImageElement).complete,
          naturalWidth: (image as HTMLImageElement).naturalWidth,
          naturalHeight: (image as HTMLImageElement).naturalHeight
        }))
      )
      .toEqual({ complete: true, naturalWidth: 2937, naturalHeight: 2644 });

    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("enhanced findings sticky navigation clears the desktop header", async ({ page }) => {
    const unexpectedFailures = trackUnexpectedFailures(page);
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto("/findings/07-meta-instrument.html");
    await page.evaluate(() => window.scrollTo(0, 700));

    const positions = await page.evaluate(() => {
      const header = document.querySelector(".site-header")?.getBoundingClientRect();
      const panel = document.querySelector(".findings-reader-panel")?.getBoundingClientRect();

      return {
        headerBottom: header?.bottom ?? 0,
        panelTop: panel?.top ?? 0
      };
    });

    expect(positions.panelTop).toBeGreaterThanOrEqual(positions.headerBottom - 1);
    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("video section navigation preserves active button behavior", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "__himmpScrollCalls", {
        configurable: true,
        value: [] as ScrollToOptions[]
      });

      window.scrollTo = (options?: ScrollToOptions | number, y?: number) => {
        const scrollOptions = typeof options === "object" ? options : { left: options, top: y };
        (window as typeof window & { __himmpScrollCalls: ScrollToOptions[] }).__himmpScrollCalls.push(
          scrollOptions
        );
      };
    });

    const unexpectedFailures = trackUnexpectedFailures(page);
    await page.goto("/videos.html");

    const bonusButton = page.locator(".section-nav-button", { hasText: "Bonus Content" });
    await bonusButton.click();

    await expect(bonusButton).toHaveClass(/active/);
    await expect(page.locator(".section-nav-button", { hasText: "Conceptual Interviews" })).not.toHaveClass(
      /active/
    );
    await expect
      .poll(() =>
        page.evaluate(() => (window as typeof window & { __himmpScrollCalls: ScrollToOptions[] }).__himmpScrollCalls)
      )
      .toHaveLength(1);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const calls = (window as typeof window & { __himmpScrollCalls: ScrollToOptions[] }).__himmpScrollCalls;
          return calls[0]?.top;
        })
      )
      .toBeGreaterThan(0);

    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("video embeds load YouTube only after activation", async ({ page }) => {
    const youtubeRequests: string[] = [];

    await page.route("https://img.youtube.com/**", (route) =>
      route.fulfill({
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ax9Y3sAAAAASUVORK5CYII=",
          "base64"
        )
      })
    );
    await page.route("https://www.youtube.com/embed/**", (route) => {
      youtubeRequests.push(route.request().url());
      return route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Stubbed YouTube embed</title>"
      });
    });

    const unexpectedFailures = trackUnexpectedFailures(page);
    await page.goto("/videos.html");

    const frames = page.locator(".video-container iframe[data-lazy-youtube-src]");
    const firstFrame = frames.first();
    await expect(page.locator("[data-enhanced-video-controller='ready']")).toHaveCount(1);
    await expect(frames).toHaveCount(22);
    await expect(page.locator(".lazy-video-trigger")).toHaveCount(22);
    await expect(firstFrame).toHaveAttribute("data-lazy-youtube-src", "https://www.youtube.com/embed/TkLQaOkAtlw");
    await expect(firstFrame).not.toHaveAttribute("src", /youtube\.com/);
    expect(youtubeRequests).toEqual([]);

    await page.locator(".lazy-video-trigger").first().click();

    await expect(firstFrame).toHaveAttribute("src", "https://www.youtube.com/embed/TkLQaOkAtlw");
    await expect(page.locator(".lazy-video-trigger")).toHaveCount(21);
    expect(youtubeRequests).toEqual(["https://www.youtube.com/embed/TkLQaOkAtlw"]);

    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  for (const route of enhancedAccessibilityRoutes) {
    test(`${route} passes accessibility smoke checks`, async ({ page }) => {
      await page.goto(route);

      expect(await accessibilitySmokeIssues(page), route).toEqual([]);
    });
  }

  test("contact form validates fields and submits through the legacy handler contract", async ({ page }) => {
    const unexpectedFailures = trackUnexpectedFailures(page);

    let submittedCsrfToken = "";
    await page.route("**/get-csrf-token.php", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ token: "test-csrf-token" })
      })
    );
    await page.route("**/contact-handler.php", async (route) => {
      const postData = route.request().postData() ?? "";
      submittedCsrfToken = postData.includes("test-csrf-token") ? "test-csrf-token" : "";

      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "Message received." })
      });
    });

    await page.goto("/contact.html");

    await page.locator("#name").fill("Test Sender");
    await page.locator("#email").fill("not-an-email");
    await page.locator("#email").blur();
    await expect(page.locator("#email")).toHaveClass(/invalid/);

    await page.locator("#email").fill("sender@example.com");
    await page.locator("#subject").fill("Migration check");
    await page.locator("#message").fill("This verifies that the legacy contact script still submits.");
    await page.locator("#contact-form button[type='submit']").click();

    await expect(page.locator("#status-message")).toContainText("Message received.");
    expect(submittedCsrfToken).toBe("test-csrf-token");
    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("contact form reports unavailable CSRF token", async ({ page }) => {
    const unexpectedFailures = trackUnexpectedFailures(page);

    await page.route("**/get-csrf-token.php", (route) =>
      route.fulfill({
        status: 500,
        contentType: "text/plain",
        body: "csrf unavailable"
      })
    );

    await page.goto("/contact.html");

    await expect(page.locator("#status-message")).toContainText("Security initialization failed.");
    await page.locator("#name").fill("Test Sender");
    await page.locator("#email").fill("sender@example.com");
    await page.locator("#subject").fill("Migration check");
    await page.locator("#message").fill("This verifies the CSRF failure state.");
    await page.locator("#contact-form button[type='submit']").click();
    await expect(page.locator("#status-message")).toContainText("Security token not available.");
    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });

  test("contact form reports handler errors without resetting valid input", async ({ page }) => {
    const unexpectedFailures = trackUnexpectedFailures(page);

    await page.route("**/get-csrf-token.php", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ token: "test-csrf-token" })
      })
    );
    await page.route("**/contact-handler.php", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Submission blocked for test." })
      })
    );

    await page.goto("/contact.html");
    await page.locator("#name").fill("Test Sender");
    await page.locator("#email").fill("sender@example.com");
    await page.locator("#subject").fill("Migration check");
    await page.locator("#message").fill("This verifies the handler failure state.");
    await page.locator("#contact-form button[type='submit']").click();

    await expect(page.locator("#status-message")).toContainText("Submission blocked for test.");
    await expect(page.locator("#name")).toHaveValue("Test Sender");
    await expect(page.locator("#email")).toHaveValue("sender@example.com");
    await expect(page.locator("#subject")).toHaveValue("Migration check");
    await expect(page.locator("#message")).toHaveValue("This verifies the handler failure state.");
    await waitForLocalResponses();
    expect(unexpectedFailures).toEqual([]);
  });
});
