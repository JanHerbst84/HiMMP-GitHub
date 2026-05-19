import type { Metadata } from "next";
import "./tokens.css";
import "./globals.css";
import { fontVariableClassName } from "@/src/site/fonts";

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
         * D-1 §4.9 link-retirement gate (commit) — legacy stylesheet
         * links removed. All 207 STRUCTURAL rules across Families A
         * through L have been reproduced in `globals.css` with
         * exact-value or whitelisted-equivalent decls per the
         * audit-d1-family-coverage.mjs gate. The legacy files remain
         * on disk pending D-7 (out of scope). To verify the browser
         * stopped requesting the legacy stylesheets, run:
         *   RUN_D1_RETIREMENT_GATE=1 npx playwright test no-legacy-stylesheet-requests
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
