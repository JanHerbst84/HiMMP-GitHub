import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { legacyRoutes } from "@/src/site/routes";
import { SiteShell } from "@/src/site/components/SiteShell";
import { getLegacyPageContent, type LegacyScript } from "@/src/site/legacy-content";
import { legacyContentToMetadata } from "@/src/site/metadata";
import { LegacyScripts } from "@/src/site/components/LegacyScripts";
import { LegacyStyles } from "@/src/site/components/LegacyStyles";
import { LegacyHeadExtras } from "@/src/site/components/LegacyHeadExtras";
import { EnhancedFindingsShell } from "@/src/site/components/EnhancedFindingsShell";
import { FindingsChapter01, FindingsChapter01Headings } from "@/src/site/components/pages/findings/FindingsChapter01";
import { FindingsChapter02, FindingsChapter02Headings } from "@/src/site/components/pages/findings/FindingsChapter02";
import { FindingsChapter03, FindingsChapter03Headings } from "@/src/site/components/pages/findings/FindingsChapter03";
import { FindingsChapter04, FindingsChapter04Headings } from "@/src/site/components/pages/findings/FindingsChapter04";
import { FindingsChapter05, FindingsChapter05Headings } from "@/src/site/components/pages/findings/FindingsChapter05";
import { FindingsChapter06, FindingsChapter06Headings } from "@/src/site/components/pages/findings/FindingsChapter06";
import { FindingsChapter07, FindingsChapter07Headings } from "@/src/site/components/pages/findings/FindingsChapter07";
import { FindingsChapter08, FindingsChapter08Headings } from "@/src/site/components/pages/findings/FindingsChapter08";
import { FindingsChapter09, FindingsChapter09Headings } from "@/src/site/components/pages/findings/FindingsChapter09";
import { FindingsChapter10, FindingsChapter10Headings } from "@/src/site/components/pages/findings/FindingsChapter10";
import { FindingsChapter11, FindingsChapter11Headings } from "@/src/site/components/pages/findings/FindingsChapter11";
import { FindingsChapter12, FindingsChapter12Headings } from "@/src/site/components/pages/findings/FindingsChapter12";
import { FindingsChapter13, FindingsChapter13Headings } from "@/src/site/components/pages/findings/FindingsChapter13";
import { FindingsChapter14, FindingsChapter14Headings } from "@/src/site/components/pages/findings/FindingsChapter14";
import { FindingsGlossary, FindingsGlossaryHeadings } from "@/src/site/components/pages/findings/FindingsGlossary";
import type { ChapterHeading } from "@/src/site/components/EnhancedFindingsShell";

const chapterComponents: Record<string, { Component: ComponentType; headings: ChapterHeading[] }> = {
  "01-introduction": { Component: FindingsChapter01, headings: FindingsChapter01Headings },
  "02-producers": { Component: FindingsChapter02, headings: FindingsChapter02Headings },
  "03-methodology": { Component: FindingsChapter03, headings: FindingsChapter03Headings },
  "04-foundations": { Component: FindingsChapter04, headings: FindingsChapter04Headings },
  "05-naturalistic": { Component: FindingsChapter05, headings: FindingsChapter05Headings },
  "06-hyperreal": { Component: FindingsChapter06, headings: FindingsChapter06Headings },
  "07-meta-instrument": { Component: FindingsChapter07, headings: FindingsChapter07Headings },
  "08-drums": { Component: FindingsChapter08, headings: FindingsChapter08Headings },
  "09-guitars-bass": { Component: FindingsChapter09, headings: FindingsChapter09Headings },
  "10-spatial": { Component: FindingsChapter10, headings: FindingsChapter10Headings },
  "11-subjective": { Component: FindingsChapter11, headings: FindingsChapter11Headings },
  "12-application": { Component: FindingsChapter12, headings: FindingsChapter12Headings },
  "13-future": { Component: FindingsChapter13, headings: FindingsChapter13Headings },
  "14-recommended-reading": { Component: FindingsChapter14, headings: FindingsChapter14Headings },
  "glossary": { Component: FindingsGlossary, headings: FindingsGlossaryHeadings }
};

/*
 * Findings chapters 07-meta-instrument through 10-spatial ship a
 * `<script src="../assets/js/audio-player.js">` body tag whose
 * sole purpose is to wire `.mix-button` clicks against the legacy
 * comparison-player markup. The React `<MixComparisonEmbed>`
 * components inside each chapter re-implement that interactive
 * surface. Leaving the legacy script in place produces double-bound
 * click handlers — two `audio.src` assignments per click + two
 * competing `loadedmetadata` listeners. Filter the legacy script
 * out before rendering body scripts. Same predicate as
 * `app/audio/page.tsx`; if a third consumer ever needs this we
 * should extract a shared helper.
 */
function isLegacyAudioScript(script: LegacyScript): boolean {
  return script.src !== null && /assets\/js\/audio-player\.js$/.test(script.src);
}

/*
 * Chapters 01–14 (glossary exempt) ship an inline body `<script>`
 * at the very bottom that, on `DOMContentLoaded`, scans
 * `.chapter-content` for `<h2>` headings, slugifies their text into
 * `id` attributes, and prepends a `<nav class="on-this-page">` TOC.
 * Because that mutation runs before React hydration on the static
 * export, hydration finds an unexpected `<nav>` where its tree
 * expects the chapter's first `<p>` and throws a #418 mismatch.
 *
 * Fix is in two parts: (a) `scripts/port-findings-chapters.mjs`
 * now bakes the same slugified `id` attributes onto h2 elements at
 * port time, so the IDs are present in SSR-rendered HTML rather
 * than appearing post-DOMContentLoaded; (b) the inline script is
 * filtered out before reaching `<LegacyScripts>`. The within-chapter
 * TOC affordance is deliberately deferred — see
 * `docs/nextjs-phase-2-design-refresh-future.md` §D-8 for the
 * React-component replacement plan.
 */
function isLegacyOnThisPageScript(script: LegacyScript): boolean {
  return (
    script.src === null &&
    script.content.includes(".chapter-content") &&
    script.content.includes("on-this-page")
  );
}

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return Object.keys(chapterComponents).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const sourceFile = `findings/${slug}.html`;
  const content = getLegacyPageContent(sourceFile);
  return legacyContentToMetadata(content);
}

export default async function FindingsChapterRoute({ params }: { params: Params }) {
  const { slug } = await params;
  const entry = chapterComponents[slug];
  if (!entry) {
    notFound();
  }
  const { Component: ChapterComponent, headings } = entry;

  const routePath = `/findings/${slug}`;
  const route = legacyRoutes.find((candidate) => candidate.routePath === routePath);
  if (!route) {
    notFound();
  }

  const sourceFile = `findings/${slug}.html`;
  const content = getLegacyPageContent(sourceFile);
  const bodyScripts = content.bodyScripts.filter(
    (script) => !isLegacyAudioScript(script) && !isLegacyOnThisPageScript(script)
  );

  return (
    <>
      <LegacyHeadExtras meta={content.headMeta} links={content.headLinks} />
      <SiteShell activePath={routePath}>
        <div data-page="findings" style={{ display: "contents" }}>
          <EnhancedFindingsShell currentRoute={route} headings={headings}>
            <LegacyStyles styles={content.headStyles} />
            <LegacyScripts scripts={content.jsonLdScripts} />
            <ChapterComponent />
          </EnhancedFindingsShell>
        </div>
      </SiteShell>
      <script src="/assets/js/main.js" />
      <LegacyScripts scripts={bodyScripts} />
    </>
  );
}
