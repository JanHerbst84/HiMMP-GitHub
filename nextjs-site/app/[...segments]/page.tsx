import { legacyRoutes, routePathToSegments } from "@/src/site/routes";
import { SiteShell } from "@/src/site/components/SiteShell";
import { getLegacyPageContent } from "@/src/site/legacy-content";
import { legacyContentToMetadata } from "@/src/site/metadata";
import { LegacyScripts } from "@/src/site/components/LegacyScripts";
import { LegacyStyles } from "@/src/site/components/LegacyStyles";
import { LegacyHeadExtras } from "@/src/site/components/LegacyHeadExtras";
import { EnhancedFindingsShell } from "@/src/site/components/EnhancedFindingsShell";
import { EnhancedAudioController } from "@/src/site/components/EnhancedAudioController";
import { EnhancedVideoController } from "@/src/site/components/EnhancedVideoController";
import { AudioComparison } from "@/src/site/components/AudioComparison";
import { LegacyMainHtml } from "@/src/site/components/LegacyMainHtml";
import { notFound } from "next/navigation";

const COMPARISON_SECTION_OPEN_RE = /<section\b[^>]*id="mix-comparison-tool"[^>]*>/i;
const MAIN_OPEN_RE = /<main\b[^>]*>/i;
const MAIN_CLOSE = "</main>";

type AudioSplit = {
  mainOpenTag: string;
  innerBefore: string;
  innerAfter: string;
};

function findBalancedTagEnd(source: string, tag: string, openTagEnd: number): number {
  const openRe = new RegExp(`<${tag}\\b[\\s>]`, "i");
  const closeRe = new RegExp(`</${tag}>`, "i");
  let depth = 1;
  let cursor = openTagEnd;
  while (cursor < source.length) {
    const remaining = source.slice(cursor);
    const nextOpen = remaining.search(openRe);
    const nextClose = remaining.search(closeRe);
    if (nextClose === -1) {
      return -1;
    }
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      cursor = cursor + nextOpen + tag.length + 1;
      continue;
    }
    depth -= 1;
    cursor = cursor + nextClose + tag.length + 3;
    if (depth === 0) {
      return cursor;
    }
  }
  return -1;
}

function sliceAudioMain(mainHtml: string): AudioSplit | null {
  const openMatch = mainHtml.match(MAIN_OPEN_RE);
  if (!openMatch || openMatch.index === undefined) {
    return null;
  }
  const innerStart = openMatch.index + openMatch[0].length;
  const closeIndex = mainHtml.lastIndexOf(MAIN_CLOSE);
  if (closeIndex === -1 || closeIndex <= innerStart) {
    return null;
  }
  const inner = mainHtml.slice(innerStart, closeIndex);

  const sectionMatch = inner.match(COMPARISON_SECTION_OPEN_RE);
  if (!sectionMatch || sectionMatch.index === undefined) {
    return null;
  }
  const sectionOpenEnd = sectionMatch.index + sectionMatch[0].length;
  const sectionEnd = findBalancedTagEnd(inner, "section", sectionOpenEnd);
  if (sectionEnd === -1) {
    return null;
  }

  return {
    mainOpenTag: openMatch[0],
    innerBefore: inner.slice(0, sectionMatch.index),
    innerAfter: inner.slice(sectionEnd)
  };
}

function mainOpeningAttributes(openTag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const matches = openTag.matchAll(/([a-zA-Z_:][\w:-]*)\s*=\s*"([^"]*)"/g);
  for (const match of matches) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

type LegacyPageProps = {
  params: Promise<{
    segments: string[];
  }>;
};

function isLegacyAudioScript(script: { src: string | null; content: string }): boolean {
  return (
    (script.src !== null && /assets\/js\/audio-player\.js$/.test(script.src)) ||
    (!script.src && script.content.includes("comparison-player") && script.content.includes("mix-btn"))
  );
}

function suppressesLegacyAudioScript(route: { renderMode?: string }): boolean {
  return route.renderMode === "enhanced-audio" || route.renderMode === "enhanced-findings";
}

function usesFindingsAudioController(route: { renderMode?: string }): boolean {
  return route.renderMode === "enhanced-findings";
}

function prepareEnhancedVideoHtml(mainHtml: string): string {
  return mainHtml.replace(
    /<iframe\b([^>]*?)\s+src="(https:\/\/www\.youtube\.com\/embed\/[^"]+)"([^>]*)><\/iframe>/gi,
    (_match, beforeSrc: string, src: string, afterSrc: string) =>
      `<iframe${beforeSrc} data-lazy-youtube-src="${src}"${afterSrc}></iframe>`
  );
}

/*
 * Routes that have been ported off the legacy injected-HTML pipeline
 * and own a dedicated `app/<route>/page.tsx`. They are excluded here so
 * generateStaticParams does not collide with the explicit route file
 * (Next.js refuses to build two static routes for the same path).
 */
const REACT_OWNED_ROUTES = new Set<string>(["/", "/about", "/approach", "/team"]);

export function generateStaticParams() {
  return legacyRoutes
    .filter((route) => !REACT_OWNED_ROUTES.has(route.routePath))
    .map((route) => ({
      segments: routePathToSegments(route.routePath)
    }));
}

export async function generateMetadata({ params }: LegacyPageProps) {
  const { segments } = await params;
  const routePath = `/${segments.join("/")}`;
  const route = legacyRoutes.find((candidate) => candidate.routePath === routePath);

  if (!route) {
    return {};
  }

  const content = getLegacyPageContent(route.sourceFile);

  return legacyContentToMetadata(content);
}

export default async function LegacyPlaceholderPage({ params }: LegacyPageProps) {
  const { segments } = await params;
  const routePath = `/${segments.join("/")}`;
  const route = legacyRoutes.find((candidate) => candidate.routePath === routePath);

  if (!route) {
    notFound();
  }

  const content = getLegacyPageContent(route.sourceFile);
  const bodyScripts =
    suppressesLegacyAudioScript(route)
      ? content.bodyScripts.filter((script) => !isLegacyAudioScript(script))
      : content.bodyScripts;

  const audioSlice = route.renderMode === "enhanced-audio" ? sliceAudioMain(content.mainHtml) : null;
  const audioMainAttrs = audioSlice ? mainOpeningAttributes(audioSlice.mainOpenTag) : null;
  const renderedMainHtml = route.renderMode === "enhanced-video"
    ? prepareEnhancedVideoHtml(content.mainHtml)
    : content.mainHtml;

  const legacyContent = audioSlice && audioMainAttrs ? (
    <>
      <LegacyStyles styles={content.headStyles} />
      <LegacyScripts scripts={content.jsonLdScripts} />
      <main id={audioMainAttrs.id ?? "main-content"} className={audioMainAttrs.class}>
        <LegacyMainHtml transparent html={audioSlice.innerBefore} />
        <AudioComparison />
        <LegacyMainHtml transparent html={audioSlice.innerAfter} />
      </main>
    </>
  ) : (
    <>
      <LegacyStyles styles={content.headStyles} />
      <LegacyScripts scripts={content.jsonLdScripts} />
      <LegacyMainHtml html={renderedMainHtml} />
    </>
  );

  const pageSlug = route.routePath.split("/").filter(Boolean)[0] ?? "home";

  return (
    <>
      <LegacyHeadExtras meta={content.headMeta} links={content.headLinks} />
      <SiteShell activePath={route.routePath}>
        <div data-page={pageSlug} style={{ display: "contents" }}>
          {route.renderMode === "enhanced-findings" ? (
            <EnhancedFindingsShell currentRoute={route}>{legacyContent}</EnhancedFindingsShell>
          ) : (
            legacyContent
          )}
          {usesFindingsAudioController(route) ? <EnhancedAudioController /> : null}
          {route.renderMode === "enhanced-video" ? <EnhancedVideoController /> : null}
        </div>
      </SiteShell>
      <script src="/assets/js/main.js" />
      <LegacyScripts scripts={bodyScripts} />
    </>
  );
}
