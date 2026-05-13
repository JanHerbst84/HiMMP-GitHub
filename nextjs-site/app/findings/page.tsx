import { legacyRoutes } from "@/src/site/routes";
import { SiteShell } from "@/src/site/components/SiteShell";
import { getLegacyPageContent } from "@/src/site/legacy-content";
import { legacyContentToMetadata } from "@/src/site/metadata";
import { LegacyScripts } from "@/src/site/components/LegacyScripts";
import { LegacyStyles } from "@/src/site/components/LegacyStyles";
import { LegacyHeadExtras } from "@/src/site/components/LegacyHeadExtras";
import { EnhancedFindingsShell } from "@/src/site/components/EnhancedFindingsShell";
import { FindingsIndexPage } from "@/src/site/components/pages/FindingsIndexPage";
import { notFound } from "next/navigation";

const ROUTE_PATH = "/findings";
const SOURCE_FILE = "findings.html";

export async function generateMetadata() {
  const content = getLegacyPageContent(SOURCE_FILE);
  return legacyContentToMetadata(content);
}

export default function FindingsIndexRoute() {
  const route = legacyRoutes.find((candidate) => candidate.routePath === ROUTE_PATH);
  if (!route) {
    notFound();
  }
  const content = getLegacyPageContent(SOURCE_FILE);

  return (
    <>
      <LegacyHeadExtras meta={content.headMeta} links={content.headLinks} />
      <SiteShell activePath={ROUTE_PATH}>
        <div data-page="findings" style={{ display: "contents" }}>
          <EnhancedFindingsShell currentRoute={route}>
            <LegacyStyles styles={content.headStyles} />
            <LegacyScripts scripts={content.jsonLdScripts} />
            <FindingsIndexPage />
          </EnhancedFindingsShell>
        </div>
      </SiteShell>
      <script src="/assets/js/main.js" />
      <LegacyScripts scripts={content.bodyScripts} />
    </>
  );
}
