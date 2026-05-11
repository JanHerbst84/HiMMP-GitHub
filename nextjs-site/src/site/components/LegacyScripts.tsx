import type { LegacyScript } from "@/src/site/legacy-content";

type LegacyScriptsProps = {
  scripts: LegacyScript[];
};

export function LegacyScripts({ scripts }: LegacyScriptsProps) {
  return (
    <>
      {scripts.map((script, index) => {
        const key = `${script.src ?? "inline"}-${script.type ?? "text/javascript"}-${index}`;

        if (script.src) {
          return <script key={key} src={script.src} type={script.type ?? undefined} />;
        }

        return (
          <script
            key={key}
            type={script.type ?? undefined}
            dangerouslySetInnerHTML={{ __html: script.content }}
          />
        );
      })}
    </>
  );
}
