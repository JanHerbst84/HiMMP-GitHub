#!/usr/bin/env node
/*
 * Unit test for scripts/lib/sitemap-lastmod.mjs against a throwaway git
 * repository with dated commits. Exit 0 on success, 1 on a failed check.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { contentSourcesFor, lastmodFor } from "./lib/sitemap-lastmod.mjs";

const root = mkdtempSync(path.join(os.tmpdir(), "sitemap-lastmod-"));
const app = path.join(root, "nextjs-site");
const opts = { repoRoot: root, appRoot: app };

function write(relative, content) {
  const file = path.join(root, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function commit(date, message) {
  const env = { ...process.env, GIT_AUTHOR_DATE: `${date}T12:00:00Z`, GIT_COMMITTER_DATE: `${date}T12:00:00Z` };
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.org", "commit", "-q", "-m", message], { cwd: root, env });
}

let failures = 0;
function check(label, actual, expected) {
  if (actual !== expected) {
    failures += 1;
    console.error(`FAIL ${label}: ${actual} != ${expected}`);
  }
}

try {
  execFileSync("git", ["init", "-q"], { cwd: root });
  const overrides = (aboutTitle) =>
    JSON.stringify({ title: { "index.html": "Home", "about.html": aboutTitle }, canonical: { "index.html": "/" } }, null, 2);
  write("index.html", "<html>home</html>");
  write("about.html", "<html>about</html>");
  write("findings/01-a.html", "<html>1</html>");
  write("findings/02-b.html", "<html>2</html>");
  write("nextjs-site/src/site/metadata-overrides.json", overrides("About"));
  write("nextjs-site/src/site/metadata.ts", 'import overrides from "@/src/site/metadata-overrides.json";\nexport const m = overrides;\n');
  write("nextjs-site/src/site/components/SiteHeader.tsx", "export const Header = 1;\n");
  write("nextjs-site/src/site/components/pages/HomeMain.tsx", "export const HomeMain = 1;\n");
  write(
    "nextjs-site/src/site/components/pages/AboutPage.tsx",
    '/** Unlike `import { X } from "./HomeMain"` this is a comment. */\nexport const AboutPage = 1;\n'
  );
  write(
    "nextjs-site/app/page.tsx",
    'import { Header } from "@/src/site/components/SiteHeader";\nimport { m } from "@/src/site/metadata";\nimport { HomeMain } from "@/src/site/components/pages/HomeMain";\n'
  );
  write(
    "nextjs-site/app/about/page.tsx",
    'import { Header } from "@/src/site/components/SiteHeader";\nimport { m } from "@/src/site/metadata";\nimport { AboutPage } from "@/src/site/components/pages/AboutPage";\n'
  );
  write("nextjs-site/src/site/components/pages/findings/Chapter01.tsx", "export const Chapter01 = 1;\n");
  write("nextjs-site/src/site/components/pages/findings/Chapter02.tsx", "export const Chapter02 = 1;\n");
  write(
    "nextjs-site/app/findings/[slug]/page.tsx",
    [
      'import { Chapter01 } from "@/src/site/components/pages/findings/Chapter01";',
      'import { Chapter02 } from "@/src/site/components/pages/findings/Chapter02";',
      'const chapters = { "01-a": { Component: Chapter01 }, "02-b": { Component: Chapter02 } };',
      ""
    ].join("\n")
  );
  commit("2026-01-01", "initial");

  write("nextjs-site/src/site/components/pages/HomeMain.tsx", "export const HomeMain = 2;\n");
  commit("2026-02-01", "home content");

  write("nextjs-site/src/site/metadata-overrides.json", overrides("About us"));
  commit("2026-03-01", "about title override only");

  write("nextjs-site/src/site/components/SiteHeader.tsx", "export const Header = 2;\n");
  commit("2026-04-01", "chrome only");

  write("nextjs-site/src/site/components/pages/findings/Chapter02.tsx", "export const Chapter02 = 2;\n");
  commit("2026-05-01", "chapter 2 only");

  check("home: own component, not other routes' override entries", lastmodFor("index.html", "X", opts), "2026-02-01");
  check("about: its own override entry", lastmodFor("about.html", "X", opts), "2026-03-01");
  check("chapter 1: not chapter 2's edit", lastmodFor("findings/01-a.html", "X", opts), "2026-01-01");
  check("chapter 2: own component", lastmodFor("findings/02-b.html", "X", opts), "2026-05-01");
  const aboutSources = contentSourcesFor("about.html", opts).map((file) => path.relative(root, file));
  check("comment-quoted import ignored", aboutSources.some((file) => file.endsWith("HomeMain.tsx")), false);
  check("chrome excluded", aboutSources.some((file) => file.endsWith("SiteHeader.tsx")), false);
  check("metadata module included", aboutSources.some((file) => file.endsWith("metadata.ts")), true);

  write("nextjs-site/src/site/metadata.ts", 'import overrides from "@/src/site/metadata-overrides.json";\nexport const m = { ...overrides };\n');
  commit("2026-06-01", "metadata logic change");
  check("metadata logic change advances routes using it", lastmodFor("index.html", "X", opts), "2026-06-01");
  check("routes not using it keep their date", lastmodFor("findings/01-a.html", "X", opts), "2026-01-01");

  // A new key for another route leaves existing routes alone.
  write(
    "nextjs-site/src/site/metadata-overrides.json",
    JSON.stringify({ title: { "index.html": "Home", "about.html": "About us", "findings/01-a.html": "One" }, canonical: { "index.html": "/" } }, null, 2)
  );
  commit("2026-07-01", "new key for chapter 1");
  check("added key: its route advances", lastmodFor("findings/01-a.html", "X", opts), "2026-07-01");
  check("added key: other routes unchanged", lastmodFor("about.html", "X", opts), "2026-06-01");

  // Removing a route's entry advances that route only.
  write(
    "nextjs-site/src/site/metadata-overrides.json",
    JSON.stringify({ title: { "index.html": "Home", "findings/01-a.html": "One" }, canonical: { "index.html": "/" } }, null, 2)
  );
  commit("2026-08-01", "drop about override");
  check("deleted entry: its route advances", lastmodFor("about.html", "X", opts), "2026-08-01");
  check("deleted entry: other routes unchanged", lastmodFor("index.html", "X", opts), "2026-06-01");

  // Deleting the whole keyed file advances every route that had entries.
  rmSync(path.join(app, "src/site/metadata-overrides.json"));
  write("nextjs-site/src/site/metadata.ts", "export const m = {};\n");
  commit("2026-09-01", "drop overrides file");
  check("deleted file: route with entries advances", lastmodFor("findings/01-a.html", "X", opts), "2026-09-01");

  // Malformed JSON in history is an error, not "file absent".
  write("nextjs-site/src/site/metadata-overrides.json", "{ not json");
  commit("2026-10-01", "broken overrides");
  let threw = false;
  try {
    lastmodFor("index.html", "X", opts);
  } catch (error) {
    threw = /Malformed JSON/.test(error.message);
  }
  check("malformed historical JSON throws", threw, true);
} finally {
  rmSync(root, { recursive: true, force: true });
}

if (failures) process.exit(1);
console.log("Sitemap lastmod tests passed.");
