import { SiteShell } from "@/src/site/components/SiteShell";
import { getLegacyPageContent, type LegacyScript } from "@/src/site/legacy-content";
import { legacyContentToMetadata } from "@/src/site/metadata";
import { LegacyScripts } from "@/src/site/components/LegacyScripts";
import { LegacyStyles } from "@/src/site/components/LegacyStyles";
import { LegacyHeadExtras } from "@/src/site/components/LegacyHeadExtras";
import { AudioPage } from "@/src/site/components/pages/AudioPage";

const ROUTE_PATH = "/audio";
const SOURCE_FILE = "audio.html";

/*
 * The legacy audio page wires the comparison player via two body
 * scripts that bind to `.mix-btn` / `#comparison-player` /
 * `#currently-playing` after DOM ready. The React `<AudioComparison>`
 * component fully owns that interactive surface, so the legacy
 * scripts would double-bind (or fail because the DOM hooks are no
 * longer in the markup). Filter both out before rendering.
 *
 * Same predicate the catch-all uses in `isLegacyAudioScript`,
 * duplicated here so the audio route is self-contained. If a third
 * consumer ever needs this we should extract a shared helper.
 */
function isLegacyAudioScript(script: LegacyScript): boolean {
  return (
    (script.src !== null && /assets\/js\/audio-player\.js$/.test(script.src)) ||
    (!script.src && script.content.includes("comparison-player") && script.content.includes("mix-btn"))
  );
}

export async function generateMetadata() {
  const content = getLegacyPageContent(SOURCE_FILE);
  return legacyContentToMetadata(content);
}

export default function AudioRoute() {
  const content = getLegacyPageContent(SOURCE_FILE);
  const bodyScripts = content.bodyScripts.filter((script) => !isLegacyAudioScript(script));

  return (
    <>
      <LegacyHeadExtras meta={content.headMeta} links={content.headLinks} />
      <SiteShell activePath={ROUTE_PATH}>
        <div data-page="audio" style={{ display: "contents" }}>
          <LegacyStyles styles={content.headStyles} />
          <LegacyScripts scripts={content.jsonLdScripts} />
          <AudioPage />
        </div>
      </SiteShell>
      <script src="/assets/js/main.js" />
      <LegacyScripts scripts={bodyScripts} />
    </>
  );
}
