import { legacyRoutes, type LegacyRoute } from "@/src/site/routes";
import type { ReactNode } from "react";

export type ChapterHeading = { id: string; text: string };

type EnhancedFindingsShellProps = {
  currentRoute: LegacyRoute;
  children: ReactNode;
  /*
   * D-8: the within-chapter section list ("On this page") reads from this list.
   * Headings are pre-computed at chapter port time so they appear in
   * the SSR HTML, not via a post-DOMContentLoaded mutation that would
   * race React hydration (the legacy on-this-page script was the
   * #418 cause that Slice P fixed). Omit on chapters that don't carry
   * h2 landmarks (the findings index page). Threshold: 2 headings —
   * a 1-item TOC is degenerate.
   */
  headings?: ChapterHeading[];
};

type ChapterLink = {
  href: string;
  label: string;
  shortLabel: string;
  routePath: string;
};

const findingsRoutes = legacyRoutes.filter(
  (route) => route.sourceFile === "findings.html" || route.sourceFile.startsWith("findings/")
);

function routeHref(route: LegacyRoute): string {
  return `/${route.sourceFile}`;
}

function shortTitle(title: string): string {
  return title.replace(/^Chapter\s+(\d+):\s+/i, "$1. ");
}

const chapterLinks: ChapterLink[] = findingsRoutes.map((route) => ({
  href: routeHref(route),
  label: route.title,
  shortLabel: route.sourceFile === "findings.html" ? "Guide home" : shortTitle(route.title),
  routePath: route.routePath
}));

function neighborLinks(currentRoute: LegacyRoute) {
  const currentIndex = chapterLinks.findIndex((link) => link.routePath === currentRoute.routePath);

  return {
    currentIndex,
    previous: currentIndex > 0 ? chapterLinks[currentIndex - 1] : null,
    next: currentIndex >= 0 && currentIndex < chapterLinks.length - 1 ? chapterLinks[currentIndex + 1] : null
  };
}

function ChapterLabel({ label }: { label: string }) {
  const numbered = label.match(/^(\d+)\.\s(.+)$/);

  if (!numbered) {
    return <span className="findings-reader-panel__nav-title">{label}</span>;
  }

  const [, num, title] = numbered;

  return (
    <>
      <span className="findings-reader-panel__nav-num">{num}.</span>{" "}
      <span className="findings-reader-panel__nav-title">{title}</span>
    </>
  );
}

function PagingLink({
  direction,
  link
}: {
  direction: "Previous" | "Next";
  link: ChapterLink | null;
}) {
  if (!link) {
    return <span aria-hidden="true" />;
  }

  return (
    <a
      href={link.href}
      rel={direction === "Previous" ? "prev" : "next"}
      aria-label={`${direction}: ${link.shortLabel}`}
    >
      <span className="findings-reader-paging__direction" aria-hidden="true">
        {direction}
      </span>
      <span className="findings-reader-paging__title">{link.shortLabel}</span>
    </a>
  );
}

/*
 * Site review 2026-09 (slice F): the within-chapter section list is nested
 * under the current chapter in the reader navigation instead of sitting
 * above the chapter hero. A 1-item list is degenerate and omitted.
 */
function SectionList({ headings }: { headings: ChapterHeading[] }) {
  if (headings.length < 2) return null;
  return (
    <ul className="findings-reader-sections" aria-label="On this page">
      {headings.map((h) => (
        <li key={h.id}>
          <a href={`#${h.id}`}>{h.text}</a>
        </li>
      ))}
    </ul>
  );
}

function ChapterList({ currentRoute, headings }: { currentRoute: LegacyRoute; headings?: ChapterHeading[] }) {
  return (
    <ol>
      {chapterLinks.map((link) => {
        const current = link.routePath === currentRoute.routePath;
        return (
          <li key={link.href}>
            <a href={link.href} aria-current={current ? "page" : undefined}>
              <ChapterLabel label={link.shortLabel} />
            </a>
            {current && headings ? <SectionList headings={headings} /> : null}
          </li>
        );
      })}
    </ol>
  );
}

const numberedChapterCount = chapterLinks.filter((link) => /^\d+\.\s/.test(link.shortLabel)).length;

/* "Chapter 7 of 14", "Glossary", or the guide's size on the guide home. */
function pageStatusFor(link: ChapterLink | undefined): string {
  const numbered = link?.shortLabel.match(/^(\d+)\.\s/);
  if (numbered) return `Chapter ${numbered[1]} of ${numberedChapterCount}`;
  if (link && link.shortLabel !== "Guide home") return link.shortLabel;
  return `${numberedChapterCount} chapters and a glossary`;
}

export function EnhancedFindingsShell({ currentRoute, children, headings }: EnhancedFindingsShellProps) {
  const { currentIndex, previous, next } = neighborLinks(currentRoute);
  const pageStatus = pageStatusFor(currentIndex >= 0 ? chapterLinks[currentIndex] : undefined);

  return (
    <div className="enhanced-findings-shell" data-enhanced-page="findings-guide">
      <aside className="findings-reader-panel" aria-label="Findings guide navigation">
        <div className="findings-reader-panel__header">
          <p className="findings-reader-panel__eyebrow">Practical guide</p>
          <p className="findings-reader-panel__title">Findings chapters</p>
          <p className="findings-reader-panel__status">{pageStatus}</p>
        </div>
        <nav className="findings-reader-panel__nav" aria-label="Findings chapters">
          <ChapterList currentRoute={currentRoute} headings={headings} />
        </nav>
      </aside>
      <div className="enhanced-findings-shell__content">
        {/*
          Narrow screens get this closed disclosure instead of the panel (the
          panel is display:none there, and this is display:none on wide
          screens), so the chapter title sits near the top and assistive
          technology only meets the visible navigation.
        */}
        <details className="findings-reader-compact">
          <summary>
            <span className="findings-reader-compact__status">{pageStatus}</span>
            <span className="findings-reader-compact__label">Chapters and sections</span>
          </summary>
          <nav className="findings-reader-panel__nav" aria-label="Findings chapters">
            <ChapterList currentRoute={currentRoute} headings={headings} />
          </nav>
        </details>
        <nav className="findings-reader-topbar" aria-label="Chapter paging at start">
          <PagingLink direction="Previous" link={previous} />
          <PagingLink direction="Next" link={next} />
        </nav>
        {children}
        <nav className="findings-reader-bottombar" aria-label="Chapter paging at end">
          <PagingLink direction="Previous" link={previous} />
          <PagingLink direction="Next" link={next} />
        </nav>
      </div>
    </div>
  );
}
