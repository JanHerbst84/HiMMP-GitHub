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
import { EnhancedAudioController } from "@/src/site/components/EnhancedAudioController";
import { FindingsChapter01 } from "@/src/site/components/pages/findings/FindingsChapter01";
import { FindingsChapter02 } from "@/src/site/components/pages/findings/FindingsChapter02";
import { FindingsChapter03 } from "@/src/site/components/pages/findings/FindingsChapter03";
import { FindingsChapter04 } from "@/src/site/components/pages/findings/FindingsChapter04";
import { FindingsChapter05 } from "@/src/site/components/pages/findings/FindingsChapter05";
import { FindingsChapter06 } from "@/src/site/components/pages/findings/FindingsChapter06";
import { FindingsChapter07 } from "@/src/site/components/pages/findings/FindingsChapter07";
import { FindingsChapter08 } from "@/src/site/components/pages/findings/FindingsChapter08";
import { FindingsChapter09 } from "@/src/site/components/pages/findings/FindingsChapter09";
import { FindingsChapter10 } from "@/src/site/components/pages/findings/FindingsChapter10";
import { FindingsChapter11 } from "@/src/site/components/pages/findings/FindingsChapter11";
import { FindingsChapter12 } from "@/src/site/components/pages/findings/FindingsChapter12";
import { FindingsChapter13 } from "@/src/site/components/pages/findings/FindingsChapter13";
import { FindingsChapter14 } from "@/src/site/components/pages/findings/FindingsChapter14";
import { FindingsGlossary } from "@/src/site/components/pages/findings/FindingsGlossary";

const chapterComponents: Record<string, ComponentType> = {
  "01-introduction": FindingsChapter01,
  "02-producers": FindingsChapter02,
  "03-methodology": FindingsChapter03,
  "04-foundations": FindingsChapter04,
  "05-naturalistic": FindingsChapter05,
  "06-hyperreal": FindingsChapter06,
  "07-meta-instrument": FindingsChapter07,
  "08-drums": FindingsChapter08,
  "09-guitars-bass": FindingsChapter09,
  "10-spatial": FindingsChapter10,
  "11-subjective": FindingsChapter11,
  "12-application": FindingsChapter12,
  "13-future": FindingsChapter13,
  "14-recommended-reading": FindingsChapter14,
  "glossary": FindingsGlossary
};

/*
 * Findings chapters 07-meta-instrument through 10-spatial ship a
 * `<script src="../assets/js/audio-player.js">` body tag whose
 * sole purpose is to wire `.mix-button` clicks against the legacy
 * comparison-player markup. The React `<EnhancedAudioController>`
 * (rendered alongside the chapter) re-implements that interactive
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
  const ChapterComponent = chapterComponents[slug];
  if (!ChapterComponent) {
    notFound();
  }

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
          <EnhancedFindingsShell currentRoute={route}>
            <LegacyStyles styles={content.headStyles} />
            <LegacyScripts scripts={content.jsonLdScripts} />
            <ChapterComponent />
          </EnhancedFindingsShell>
        </div>
        <EnhancedAudioController />
      </SiteShell>
      <script src="/assets/js/main.js" />
      <LegacyScripts scripts={bodyScripts} />
    </>
  );
}
