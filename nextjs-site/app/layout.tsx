import type { Metadata } from "next";
import "./tokens.css";
import "./globals.css";
import { fontVariableClassName } from "@/src/site/fonts";

// Synchronous theme-init script for the document head. Minified
// inline because it must run before first paint. Behaviour:
//  - If user has explicitly chosen 'light' or 'dark' via the
//    toggle (persisted in localStorage('himmp-theme')), honour it.
//  - Otherwise default to 'dark' (D-9-e-17). Dark is the site's
//    intended default presentation; the @media
//    (prefers-color-scheme: dark) fallback in tokens.css used to
//    handle dark-OS users but left default-OS users on the light
//    scheme. Setting data-theme=dark unconditionally for the
//    no-explicit-choice case makes dark the visual default while
//    the toggle still cycles light → dark → system.
const themeInitScript =
  "(function(){try{var t=localStorage.getItem('himmp-theme');" +
  "if(t==='light'||t==='dark'){" +
  "document.documentElement.setAttribute('data-theme',t);" +
  "}else{" +
  "document.documentElement.setAttribute('data-theme','dark');" +
  "}}catch(e){" +
  "document.documentElement.setAttribute('data-theme','dark');" +
  "}})();";

export const metadata: Metadata = {
  metadataBase: new URL("https://himmp.net"),
  title: "HiMMP - Heaviness in Metal Music Production",
  description:
    "The HiMMP research project explores heaviness as metal music's defining sonic characteristic."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontVariableClassName}>
      <head>
        {/*
         * D-9-d early theme init. Runs synchronously before first
         * paint to set `data-theme` on <html> from the user's
         * localStorage preference. Prevents FOWT (flash of wrong
         * theme). Try/catch swallows storage failures gracefully.
         * Static string — same pattern as the Matomo script below.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: themeInitScript
          }}
        />
        {/*
         * D-1 §4.9 link-retirement gate (commit) — legacy stylesheet
         * links removed. All 207 STRUCTURAL rules across Families A
         * through L have been reproduced in `globals.css` with
         * exact-value or whitelisted-equivalent decls per the
         * audit-d1-family-coverage.mjs gate.
         */}
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="alternate" href="/llms.txt" type="text/plain" title="AI Usage Policy" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var _paq = window._paq = window._paq || [];
              _paq.push(['trackPageView']);
              _paq.push(['enableLinkTracking']);
              (function() {
                var u="https://analytics.himmp.net/";
                _paq.push(['setTrackerUrl', u+'matomo.php']);
                _paq.push(['setSiteId', '1']);
                var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
                g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
              })();
            `
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
