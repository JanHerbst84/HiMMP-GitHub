import type { LegacyLink, LegacyMeta } from "@/src/site/legacy-content";

type LegacyHeadExtrasProps = {
  links: LegacyLink[];
  meta: LegacyMeta[];
};

export function LegacyHeadExtras({ links, meta }: LegacyHeadExtrasProps) {
  return (
    <>
      {meta.map((item, index) => {
        const key = `legacy-meta-${item.attributeName}-${item.key}-${index}`;

        if (item.attributeName === "httpEquiv") {
          return <meta key={key} httpEquiv={item.key} content={item.content} />;
        }

        if (item.attributeName === "property") {
          return <meta key={key} property={item.key} content={item.content} />;
        }

        return <meta key={key} name={item.key} content={item.content} />;
      })}
      {links.map((link, index) => (
        <link
          key={`legacy-link-${link.rel}-${link.href}-${index}`}
          rel={link.rel}
          href={link.href}
          type={link.type ?? undefined}
          title={link.title ?? undefined}
        />
      ))}
    </>
  );
}
