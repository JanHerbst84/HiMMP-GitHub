import { legacyRoutes, routePathToSegments } from "@/src/site/routes";
import { SiteShell } from "@/src/site/components/SiteShell";
import { getLegacyPageContent } from "@/src/site/legacy-content";
import { legacyContentToMetadata } from "@/src/site/metadata";
import { LegacyScripts } from "@/src/site/components/LegacyScripts";
import { LegacyStyles } from "@/src/site/components/LegacyStyles";
import { notFound } from "next/navigation";

type LegacyPageProps = {
  params: Promise<{
    segments: string[];
  }>;
};

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

  return (
    <>
      <SiteShell activePath={route.routePath}>
        <LegacyStyles styles={content.headStyles} />
        <LegacyScripts scripts={content.jsonLdScripts} />
        <div dangerouslySetInnerHTML={{ __html: content.mainHtml }} />
      </SiteShell>
      <script src="/assets/js/main.js" />
      <LegacyScripts scripts={content.bodyScripts} />
    </>
  );
}
