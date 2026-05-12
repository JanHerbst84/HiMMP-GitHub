import { legacyRoutes, routePathToSegments } from "@/src/site/routes";
import { SiteShell } from "@/src/site/components/SiteShell";
import { getLegacyPageContent } from "@/src/site/legacy-content";
import { legacyContentToMetadata } from "@/src/site/metadata";
import { LegacyScripts } from "@/src/site/components/LegacyScripts";
import { LegacyStyles } from "@/src/site/components/LegacyStyles";
import { EnhancedFindingsShell } from "@/src/site/components/EnhancedFindingsShell";
import { EnhancedAudioController } from "@/src/site/components/EnhancedAudioController";
import { notFound } from "next/navigation";

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

export function generateStaticParams() {
  return legacyRoutes
    .filter((route) => route.routePath !== "/")
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
    route.renderMode === "enhanced-audio"
      ? content.bodyScripts.filter((script) => !isLegacyAudioScript(script))
      : content.bodyScripts;
  const legacyContent = (
    <>
      <LegacyStyles styles={content.headStyles} />
      <LegacyScripts scripts={content.jsonLdScripts} />
      <div dangerouslySetInnerHTML={{ __html: content.mainHtml }} />
    </>
  );

  return (
    <>
      <SiteShell activePath={route.routePath}>
        {route.renderMode === "enhanced-findings" ? (
          <EnhancedFindingsShell currentRoute={route}>{legacyContent}</EnhancedFindingsShell>
        ) : (
          legacyContent
        )}
        {route.renderMode === "enhanced-audio" ? <EnhancedAudioController /> : null}
      </SiteShell>
      <script src="/assets/js/main.js" />
      <LegacyScripts scripts={bodyScripts} />
    </>
  );
}
