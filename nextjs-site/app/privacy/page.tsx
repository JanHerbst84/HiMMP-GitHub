import { SiteShell } from "@/src/site/components/SiteShell";
import { getLegacyPageContent } from "@/src/site/legacy-content";
import { legacyContentToMetadata } from "@/src/site/metadata";
import { LegacyScripts } from "@/src/site/components/LegacyScripts";
import { LegacyStyles } from "@/src/site/components/LegacyStyles";
import { LegacyHeadExtras } from "@/src/site/components/LegacyHeadExtras";
import { PrivacyPage } from "@/src/site/components/pages/PrivacyPage";

const ROUTE_PATH = "/privacy";
const SOURCE_FILE = "privacy.html";

export async function generateMetadata() {
  const content = getLegacyPageContent(SOURCE_FILE);
  return legacyContentToMetadata(content);
}

export default function PrivacyRoute() {
  const content = getLegacyPageContent(SOURCE_FILE);

  return (
    <>
      <LegacyHeadExtras meta={content.headMeta} links={content.headLinks} />
      <SiteShell activePath={ROUTE_PATH}>
        <div data-page="privacy" style={{ display: "contents" }}>
          <LegacyStyles styles={content.headStyles} />
          <LegacyScripts scripts={content.jsonLdScripts} />
          <PrivacyPage />
        </div>
      </SiteShell>
      <script src="/assets/js/main.js" />
      <LegacyScripts scripts={content.bodyScripts} />
    </>
  );
}
