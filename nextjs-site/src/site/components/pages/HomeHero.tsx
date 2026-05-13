/**
 * Home hero — dedicated React component for the /index.html hero
 * section. Implements D-2 "proper" from
 * `docs/nextjs-phase-2-design-refresh-future.md`: the hero now owns
 * its own JSX rather than being rendered through a legacy-HTML
 * injection. The CSS-scoped re-skin from D-2a (commit 71e0734) still
 * applies via the `[data-page="home"]` rules in `app/globals.css`.
 *
 * The two class selectors `.hero-title` and `.hero-text` are LOAD-
 * BEARING: the JSON-LD `SpeakableSpecification` block in the legacy
 * `index.html` head (and the equivalent emitted by
 * `getLegacyPageContent("index.html")` for this React route)
 * references them by name as text-to-speech targets:
 *
 *   "cssSelector": [".hero-title", ".hero-text", "h2", "h3"]
 *
 * Any future edit to this component MUST preserve those two class
 * names on the same elements (the h1 and the p containing the
 * intro prose).
 *
 * The hero structure mirrors the legacy markup verbatim:
 * `<section class="hero" style="background-image: ...">` containing
 * `.hero-overlay`, `.container > .hero-content > h1.hero-title +
 * p.hero-text`. The h1 uses two `<br />` separators to split
 * "Heaviness in / Metal Music / Production" onto three lines.
 *
 * `parity:text` byte-compares visible main text against the legacy
 * index.html and confirms zero content drift across this port.
 */
export function HomeHero() {
  return (
    <section
      className="hero"
      style={{
        backgroundImage: "url('assets/images/background/HiMMP-bg-welcome.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative"
      }}
    >
      <div className="hero-overlay"></div>
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">Heaviness in<br />Metal Music<br />Production</h1>
          <p className="hero-text">
            'Heaviness in Metal Music Production' (HiMMP) explores{" "}
            <span className="highlight-text">
              heaviness as the
              metal genre's central quality feature.
            </span>{" "}
            Our aim is to show how heaviness is
            created sonically, how leading <a href="team.html">metal producers</a> define it, and how they
            meticulously control its various aspects when mixing recordings.
          </p>
        </div>
      </div>
    </section>
  );
}
