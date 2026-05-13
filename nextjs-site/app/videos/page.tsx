import { SiteShell } from "@/src/site/components/SiteShell";
import { getLegacyPageContent } from "@/src/site/legacy-content";
import { legacyContentToMetadata } from "@/src/site/metadata";
import { LegacyScripts } from "@/src/site/components/LegacyScripts";
import { LegacyStyles } from "@/src/site/components/LegacyStyles";
import { LegacyHeadExtras } from "@/src/site/components/LegacyHeadExtras";
import { EnhancedVideoController } from "@/src/site/components/EnhancedVideoController";
import { VideosPage } from "@/src/site/components/pages/VideosPage";

const ROUTE_PATH = "/videos";
const SOURCE_FILE = "videos.html";

export async function generateMetadata() {
  const content = getLegacyPageContent(SOURCE_FILE);
  return legacyContentToMetadata(content);
}

export default function VideosRoute() {
  const content = getLegacyPageContent(SOURCE_FILE);

  return (
    <>
      <LegacyHeadExtras meta={content.headMeta} links={content.headLinks} />
      <SiteShell activePath={ROUTE_PATH}>
        <div data-page="videos" style={{ display: "contents" }}>
          <LegacyStyles styles={content.headStyles} />
          <LegacyScripts scripts={content.jsonLdScripts} />
          <VideosPage />
        </div>
        <EnhancedVideoController />
      </SiteShell>
      <script src="/assets/js/main.js" />
      <LegacyScripts scripts={content.bodyScripts} />
    </>
  );
}
