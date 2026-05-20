import { SiteShell } from "@/src/site/components/SiteShell";
import { getLegacyPageContent } from "@/src/site/legacy-content";
import { legacyContentToMetadata } from "@/src/site/metadata";
import { LegacyScripts } from "@/src/site/components/LegacyScripts";
import { LegacyStyles } from "@/src/site/components/LegacyStyles";
import { LegacyHeadExtras } from "@/src/site/components/LegacyHeadExtras";
import { FindingsIndexPage } from "@/src/site/components/pages/FindingsIndexPage";

const ROUTE_PATH = "/findings";
const SOURCE_FILE = "findings.html";

export async function generateMetadata() {
  const content = getLegacyPageContent(SOURCE_FILE);
  return legacyContentToMetadata(content);
}

export default function FindingsIndexRoute() {
  const content = getLegacyPageContent(SOURCE_FILE);

  /*
   * D-9-e-8 — drop the EnhancedFindingsShell wrapper on the
   * findings index. The shell is designed for the chapter reader
   * (previous/next pagination + sidebar chapter list); on the
   * INDEX page that produces (a) a horizontal "Practical guide /
   * Findings chapters" strip above the hero, (b) a "NEXT" box
   * pointing to chapter 1, both of which read as visual noise
   * because the index body already lists every chapter as the
   * primary content. The index now renders the legacy page hero
   * + body directly inside SiteShell, like every other top-level
   * route.
   */
  return (
    <>
      <LegacyHeadExtras meta={content.headMeta} links={content.headLinks} />
      <SiteShell activePath={ROUTE_PATH}>
        <div data-page="findings" style={{ display: "contents" }}>
          <LegacyStyles styles={content.headStyles} />
          <LegacyScripts scripts={content.jsonLdScripts} />
          <FindingsIndexPage />
        </div>
      </SiteShell>
      <script src="/assets/js/main.js" />
      <LegacyScripts scripts={content.bodyScripts} />
    </>
  );
}
