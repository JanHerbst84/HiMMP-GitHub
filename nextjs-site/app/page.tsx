import { SiteShell } from "@/src/site/components/SiteShell";
import { getLegacyPageContent } from "@/src/site/legacy-content";
import { legacyContentToMetadata } from "@/src/site/metadata";
import { LegacyScripts } from "@/src/site/components/LegacyScripts";
import { LegacyStyles } from "@/src/site/components/LegacyStyles";
import { LegacyHeadExtras } from "@/src/site/components/LegacyHeadExtras";
import { HomeHero } from "@/src/site/components/pages/HomeHero";
import { HomeMain } from "@/src/site/components/pages/HomeMain";

export function generateMetadata() {
  const content = getLegacyPageContent("index.html");

  return legacyContentToMetadata(content);
}

export default function Home() {
  const content = getLegacyPageContent("index.html");

  return (
    <>
      <LegacyHeadExtras meta={content.headMeta} links={content.headLinks} />
      <SiteShell activePath="/">
        <LegacyStyles styles={content.headStyles} />
        <LegacyScripts scripts={content.jsonLdScripts} />
        <div data-page="home" style={{ display: "contents" }}>
          <main id="main-content">
            <HomeHero />
            <HomeMain />
          </main>
        </div>
      </SiteShell>
      <script src="/assets/js/main.js" />
      <LegacyScripts scripts={content.bodyScripts} />
    </>
  );
}
