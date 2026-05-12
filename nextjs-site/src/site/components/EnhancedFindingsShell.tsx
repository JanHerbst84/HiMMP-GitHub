import { legacyRoutes, type LegacyRoute } from "@/src/site/routes";
import type { ReactNode } from "react";

type EnhancedFindingsShellProps = {
  currentRoute: LegacyRoute;
  children: ReactNode;
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

export function EnhancedFindingsShell({ currentRoute, children }: EnhancedFindingsShellProps) {
  const { currentIndex, previous, next } = neighborLinks(currentRoute);
  const pageStatus =
    currentIndex >= 0 ? `${currentIndex + 1} of ${chapterLinks.length}` : `${chapterLinks.length} chapters`;

  return (
    <div className="enhanced-findings-shell" data-enhanced-page="findings-guide">
      <aside className="findings-reader-panel" aria-label="Findings guide navigation">
        <div className="findings-reader-panel__header">
          <p className="findings-reader-panel__eyebrow">Practical guide</p>
          <p className="findings-reader-panel__title">Findings chapters</p>
          <p className="findings-reader-panel__status">{pageStatus}</p>
        </div>
        <nav className="findings-reader-panel__nav" aria-label="Findings chapters">
          <ol>
            {chapterLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={link.routePath === currentRoute.routePath ? "page" : undefined}
                >
                  {link.shortLabel}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>
      <div className="enhanced-findings-shell__content">
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
