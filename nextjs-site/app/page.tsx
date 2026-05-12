import { SiteShell } from "@/src/site/components/SiteShell";
import { getLegacyPageContent } from "@/src/site/legacy-content";
import { legacyContentToMetadata } from "@/src/site/metadata";
import { LegacyScripts } from "@/src/site/components/LegacyScripts";
import { LegacyStyles } from "@/src/site/components/LegacyStyles";
import { LegacyHeadExtras } from "@/src/site/components/LegacyHeadExtras";

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
        <div dangerouslySetInnerHTML={{ __html: content.mainHtml }} />
      </SiteShell>
      <script src="/assets/js/main.js" />
      <LegacyScripts scripts={content.bodyScripts} />
    </>
  );
}
