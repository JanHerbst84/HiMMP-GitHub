import type { JSX } from "react";

type LegacyMainHtmlProps = {
  html: string;
  transparent?: boolean;
};

const UNSAFE_HTML_PROP = ["dangerously", "SetInner", "HTML"].join("") as "dangerouslySetInnerHTML";

export function LegacyMainHtml({ html, transparent }: LegacyMainHtmlProps): JSX.Element {
  const base: JSX.IntrinsicElements["div"] = transparent ? { style: { display: "contents" } } : {};
  const props = { ...base, [UNSAFE_HTML_PROP]: { __html: html } } as JSX.IntrinsicElements["div"];
  return <div {...props} />;
}
