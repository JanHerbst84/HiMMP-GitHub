import { readFileSync } from "node:fs";
import path from "node:path";

export type LegacyScript = {
  src: string | null;
  content: string;
  type: string | null;
};

export type LegacyStyle = {
  content: string;
};

export type LegacyPageContent = {
  sourceFile: string;
  title: string;
  description: string | null;
  canonical: string | null;
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
  headStyles: LegacyStyle[];
  jsonLdScripts: LegacyScript[];
  mainHtml: string;
  bodyScripts: LegacyScript[];
};

const repoRoot = path.join(/*turbopackIgnore: true*/ process.cwd(), "..");

function readSource(sourceFile: string): string {
  return readFileSync(path.join(repoRoot, sourceFile), "utf8");
}

function firstMatch(source: string, pattern: RegExp): string | null {
  const match = source.match(pattern);
  return match ? match[1].trim() : null;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function firstDecodedMatch(source: string, pattern: RegExp): string | null {
  const value = firstMatch(source, pattern);
  return value ? decodeEntities(value) : null;
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
}

function extractMain(source: string, sourceFile: string): string {
  const mainStart = source.search(/<main\b/i);
  if (mainStart === -1) {
    throw new Error(`Could not find <main> in ${sourceFile}`);
  }

  const relativeFooterStart = source.slice(mainStart).search(/<footer\b[^>]*class="[^"]*\bsite-footer\b/i);
  const match = source.slice(mainStart).match(/^<main\b[\s\S]*?<\/main>/i);
  let mainHtml = match?.[0] ?? null;

  if (relativeFooterStart !== -1) {
    const beforeFooter = source.slice(mainStart, mainStart + relativeFooterStart).trimEnd();
    const firstClose = beforeFooter.search(/<\/main>/i);

    if (firstClose === -1) {
      mainHtml = `${beforeFooter}\n</main>`;
    } else {
      const afterFirstClose = beforeFooter.slice(firstClose).replace(/<\/main>/i, "");
      if (afterFirstClose.trim()) {
        mainHtml = `${beforeFooter.replace(/<\/main>/gi, "").trimEnd()}\n</main>`;
      }
    }
  }

  if (!mainHtml) {
    throw new Error(`Could not extract <main> in ${sourceFile}`);
  }

  const openingTag = mainHtml.match(/^<main\b[^>]*>/i)?.[0] ?? "";

  if (/\sid=/.test(openingTag)) {
    return mainHtml;
  }

  return mainHtml.replace(/^<main\b/i, '<main id="main-content"');
}

function parseScript(match: RegExpMatchArray): LegacyScript {
  const attrs = match[1] ?? "";
  return {
    src: firstMatch(attrs, /\bsrc="([^"]+)"/i),
    type: firstMatch(attrs, /\btype="([^"]+)"/i),
    content: match[2] ?? ""
  };
}

function extractBodyScripts(source: string): LegacyScript[] {
  const body = firstMatch(source, /<body[^>]*>([\s\S]*?)<\/body>/i) ?? source;
  const scripts = [...body.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];

  return scripts
    .map((match) => {
      const script = parseScript(match);

      if (script.type === "application/ld+json") {
        return null;
      }

      if (script.src && /assets\/js\/main\.js$/.test(script.src)) {
        return null;
      }

      if (!script.src && script.content.includes("analytics.himmp.net")) {
        return null;
      }

      return script;
    })
    .filter((script): script is LegacyScript => Boolean(script));
}

function extractJsonLd(source: string): LegacyScript[] {
  return [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .map((match) => {
      const script = parseScript(match);

      return script.type === "application/ld+json" ? script : null;
    })
    .filter((script): script is LegacyScript => Boolean(script));
}

function extractHeadStyles(source: string): LegacyStyle[] {
  const head = firstMatch(source, /<head[^>]*>([\s\S]*?)<\/head>/i) ?? "";

  return [...head.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((match) => ({
    content: match[1] ?? ""
  }));
}

function extractMetaMap(source: string, attributeName: "property" | "name", prefix: string): Record<string, string> {
  const values: Record<string, string> = {};
  const pattern = new RegExp(
    `<meta\\s+${attributeName}="${prefix}:([^"]+)"\\s+content="([^"]*)"`,
    "gi"
  );

  for (const match of source.matchAll(pattern)) {
    values[match[1]] = decodeEntities(match[2]);
  }

  return values;
}

export function getLegacyPageContent(sourceFile: string): LegacyPageContent {
  const source = readSource(sourceFile);
  const title = stripTags(firstMatch(source, /<title>([\s\S]*?)<\/title>/i) ?? "");

  return {
    sourceFile,
    title,
    description: firstDecodedMatch(source, /<meta\s+name="description"\s+content="([^"]*)"/i),
    canonical: firstMatch(source, /<link\s+rel="canonical"\s+href="([^"]*)"/i),
    openGraph: extractMetaMap(source, "property", "og"),
    twitter: extractMetaMap(source, "name", "twitter"),
    headStyles: extractHeadStyles(source),
    jsonLdScripts: extractJsonLd(source),
    mainHtml: extractMain(source, sourceFile),
    bodyScripts: extractBodyScripts(source)
  };
}
