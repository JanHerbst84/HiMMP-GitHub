import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/*
 * Sitemap `lastmod` for a route = the newest commit that touched a file
 * which produces that route's content:
 *
 * - the archived legacy HTML (the build still reads its head metadata and
 *   JSON-LD),
 * - the route's `app/.../page.tsx` and every module it imports,
 *   transitively (`@/…` and relative imports), except presentation-only site
 *   chrome (header, footer, shell, theme toggle, navigation) and, for the
 *   shared findings-chapter route, the other chapters' components. Modules
 *   that produce metadata or JSON-LD (`metadata.ts`, `legacy-content.ts`,
 *   the JSON-LD patches) are content: changing them changes what crawlers get,
 *   so they advance every route that uses them,
 * - the keyed JSON file `src/site/metadata-overrides.json`, counted only for
 *   commits that changed that route's own entries.
 *
 * Commits that only stamped files without changing what visitors or
 * crawlers get are excluded by full hash. Missing or shallow git history is
 * an error: silently falling back would publish false dates.
 */
export const NON_CONTENT_COMMITS = new Set([
  // Archive banner comment added to every legacy root page (2026-09-17).
  "0d20f4c78591e5efc7e908038aa29319c922ecb6"
]);

// Presentation-only modules every page renders identically; changing them
// is not a content change of any one route.
const CHROME_MODULES = new Set([
  "src/site/components/SiteShell.tsx",
  "src/site/components/SiteHeader.tsx",
  "src/site/components/SiteFooter.tsx",
  "src/site/components/ThemeToggle.tsx",
  "src/site/navigation.ts",
  "src/site/routes.ts",
  "src/site/fonts.ts"
]);

const importPattern = /(?:import|export)\s+(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/g;

function resolveModule(appRoot, fromFile, specifier) {
  let base;
  if (specifier.startsWith("@/")) base = path.join(appRoot, specifier.slice(2));
  else if (specifier.startsWith(".")) base = path.resolve(path.dirname(fromFile), specifier);
  else return null;
  for (const candidate of [base, ...[".tsx", ".ts", ".mjs", ".json"].map((ext) => base + ext)]) {
    if (existsSync(candidate) && !statSync(candidate).isDirectory()) return candidate;
  }
  return null;
}

function moduleClosure(appRoot, entryFile, skip) {
  const seen = new Set();
  const stack = [entryFile];
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    if (!/\.(tsx?|mjs)$/.test(file)) continue;
    // Comments are stripped first so paths quoted in doc comments are not
    // mistaken for imports.
    const code = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, "");
    for (const match of code.matchAll(importPattern)) {
      const resolved = resolveModule(appRoot, file, match[1]);
      if (!resolved) continue;
      const relative = path.relative(appRoot, resolved);
      if (CHROME_MODULES.has(relative) || skip(relative)) continue;
      stack.push(resolved);
    }
  }
  return [...seen];
}

function appPageFor(appRoot, sourceFile) {
  if (sourceFile === "index.html") return path.join(appRoot, "app/page.tsx");
  if (/^findings\/.+\.html$/.test(sourceFile)) return path.join(appRoot, "app/findings/[slug]/page.tsx");
  return path.join(appRoot, "app", sourceFile.replace(/\.html$/, ""), "page.tsx");
}

// The governed keyed JSON file, at a fixed path, considered whether or not it
// currently exists or has an entry for the route: deleting an entry, or the
// whole file, is a change too. Other data lives in modules (import closure).
const KEYED_FILES = ["src/site/metadata-overrides.json"];

function keyedDataFiles(appRoot) {
  return KEYED_FILES.map((relative) => path.join(appRoot, relative));
}

// An absent file has no entries, so creating a file without this route's
// entries is not a change for it. (Renamed files are not followed: the
// governed paths are fixed.)
function entriesFor(json, sourceFile) {
  if (json === null || typeof json !== "object") return "{}";
  const entries = {};
  if (sourceFile in json) entries[""] = json[sourceFile];
  for (const [section, value] of Object.entries(json)) {
    if (value && typeof value === "object" && sourceFile in value) entries[section] = value[sourceFile];
  }
  return JSON.stringify(entries);
}

const fileCache = new Map();

// Parsed JSON of a file at a commit; null when the file is absent there.
// Malformed JSON is an error: such a commit could not have built.
function fileAt(repoRoot, commit, relativePath) {
  const cacheKey = `${repoRoot}\0${commit}:${relativePath}`;
  if (fileCache.has(cacheKey)) return fileCache.get(cacheKey);
  let text = null;
  try {
    text = execFileSync("git", ["show", `${commit}:${relativePath}`], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 16 * 1024 * 1024
    });
  } catch {
    text = null; // path does not exist at that commit
  }
  let parsed = null;
  if (text !== null) {
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new Error(`Malformed JSON in ${relativePath} at ${commit}: ${error.message}`);
    }
  }
  fileCache.set(cacheKey, parsed);
  return parsed;
}

const historyCache = new Map();

// Commits touching a keyed file, newest first, with their first parent.
// Merges are compared with their first parent; changes made on a merged
// branch appear as that branch's own commits in the log.
function commitsTouching(repoRoot, relativePath, head) {
  const cacheKey = `${repoRoot}\0${head}\0${relativePath}`;
  if (!historyCache.has(cacheKey)) {
    historyCache.set(
      cacheKey,
      execFileSync("git", ["log", "--format=%H %cs %P", "--", relativePath], {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
      })
        .split("\n")
        .filter(Boolean)
        .map((line) => line.split(" "))
    );
  }
  return historyCache.get(cacheKey);
}

// Commits (newest first) that changed this route's entries in a keyed file.
function keyedEntryHistory(repoRoot, relativePath, sourceFile, head) {
  const changes = [];
  for (const [hash, date, parent] of commitsTouching(repoRoot, relativePath, head)) {
    const after = entriesFor(fileAt(repoRoot, hash, relativePath), sourceFile);
    const before = entriesFor(parent ? fileAt(repoRoot, parent, relativePath) : null, sourceFile);
    if (after !== before) changes.push({ hash, date });
  }
  return changes;
}

export function contentSourcesFor(sourceFile, { repoRoot, appRoot }) {
  const sources = [path.join(repoRoot, sourceFile)];
  const appPage = appPageFor(appRoot, sourceFile);

  if (existsSync(appPage)) {
    let skip = () => false;
    const chapter = sourceFile.match(/^findings\/(.+)\.html$/);
    if (chapter) {
      const pageSource = readFileSync(appPage, "utf8");
      const entry = pageSource.match(new RegExp(`"${chapter[1]}":\\s*\\{\\s*Component:\\s*(\\w+)`));
      if (!entry) throw new Error(`Cannot resolve the page component for ${sourceFile}`);
      const own = `src/site/components/pages/findings/${entry[1].replace(/Headings$/, "")}.tsx`;
      if (!existsSync(path.join(appRoot, own))) throw new Error(`Missing chapter component ${own}`);
      skip = (relative) => relative.startsWith("src/site/components/pages/findings/") && relative !== own;
    }
    // Keyed JSON data is attributed per entry by keyedEntryHistory, not per
    // file, even when a module imports it (metadata.ts imports the overrides).
    const keyed = (file) => KEYED_FILES.includes(path.relative(appRoot, file));
    sources.push(...moduleClosure(appRoot, appPage, skip).filter((file) => !keyed(file)));
  }

  return [...new Set(sources)].filter((file) => existsSync(file));
}

export function keyedSourcesFor(_sourceFile, { appRoot }) {
  return keyedDataFiles(appRoot);
}

function assertFullHistory(repoRoot) {
  let shallow;
  try {
    shallow = execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();
  } catch (error) {
    throw new Error(`Sitemap lastmod needs git history, but git failed: ${error.message}`);
  }
  if (shallow === "true") {
    throw new Error("Sitemap lastmod needs full git history; this clone is shallow (run git fetch --unshallow).");
  }
}

export function lastmodFor(sourceFile, fallbackLastmod, { repoRoot, appRoot }) {
  assertFullHistory(repoRoot);
  // History caches are keyed by HEAD so a new commit is never served stale.
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
  const sources = contentSourcesFor(sourceFile, { repoRoot, appRoot }).map((file) => path.relative(repoRoot, file));
  // An empty pathspec after `--` would mean "whole repository".
  if (sources.length === 0) throw new Error(`No content source files found for ${sourceFile}`);
  const output = execFileSync("git", ["log", "--format=%H %cs", "--", ...sources], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 16 * 1024 * 1024
  });

  const candidates = [];
  for (const line of output.split("\n")) {
    const [hash, date] = line.trim().split(" ");
    if (hash && date && !NON_CONTENT_COMMITS.has(hash)) {
      candidates.push(date);
      break;
    }
  }
  for (const file of keyedSourcesFor(sourceFile, { appRoot })) {
    const change = keyedEntryHistory(repoRoot, path.relative(repoRoot, file), sourceFile, head).find(
      (entry) => !NON_CONTENT_COMMITS.has(entry.hash)
    );
    if (change) candidates.push(change.date);
  }

  if (candidates.length) return candidates.sort().at(-1);
  // Only reachable for a route whose producing files are all uncommitted.
  console.warn(`sitemap: no committed history for ${sourceFile}; using ${fallbackLastmod}`);
  return fallbackLastmod;
}
