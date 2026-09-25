import type { Metadata } from "next";
import { SiteShell } from "@/src/site/components/SiteShell";

/*
 * Site 404 page. Next's static export writes this to `out/404.html`;
 * Nginx serves it via `error_page 404 /404.html` for every unknown URL,
 * including nested ones such as `/findings/missing`, so every asset and
 * link here is root-absolute.
 */
// Next adds `<meta name="robots" content="noindex">` to the not-found page itself.
export const metadata: Metadata = {
  title: "Page not found | HiMMP"
};

export default function NotFound() {
  return (
    <>
      <SiteShell activePath="/404">
        <div data-page="not-found" style={{ display: "contents" }}>
          <main id="main-content" tabIndex={-1}>
            <section
              className="hero"
              style={{
                backgroundImage: "url('/assets/images/background/HiMMP-bg-welcome.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "relative"
              }}
            >
              <div className="hero-overlay"></div>
              <div className="container">
                <div className="hero-content">
                  <h1 className="hero-title">Page not found</h1>
                  <p className="hero-text">The page you were looking for does not exist or has moved.</p>
                </div>
              </div>
            </section>
            <section className="content-section">
              <div className="container">
                <h2>Where to go next</h2>
                <ul>
                  <li>
                    <a href="/">HiMMP home</a>
                  </li>
                  <li>
                    <a href="/findings.html">Heaviness in Metal Music Production: A Practical Guide</a>
                  </li>
                  <li>
                    <a href="/publications.html">Publications</a>
                  </li>
                  <li>
                    <a href="/audio.html">Audio and dataset</a>
                  </li>
                  <li>
                    <a href="/contact.html">Contact</a>
                  </li>
                </ul>
              </div>
            </section>
          </main>
        </div>
      </SiteShell>
      <script src="/assets/js/main.js" />
    </>
  );
}
