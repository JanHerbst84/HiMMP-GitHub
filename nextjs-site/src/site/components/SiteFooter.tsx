/*
 * SiteFooter — three-column layout (D-9-g-3 / FRESH-10).
 *
 * Pre-slice the footer rendered as a centred bullet-separated single-
 * row link list under a 3-logo strip. Post-slice the footer reads
 * as a proper site closure with:
 *
 *   - the existing 3-logo strip (University of Huddersfield, HiMMP,
 *     AHRC) at the top of the band,
 *   - three named columns ("Project" / "Outputs" / "Institutional")
 *     grouping the 9 nav items by purpose,
 *   - an "Institutional support" copy block that restates the
 *     University of Huddersfield + AHRC affiliation and the copyright
 *     line (text copied verbatim from the legacy `index.html` footer-
 *     info paragraph; previously absent from the React port).
 *
 * The footer is excluded from `parity:text` (the legacy-extract logic
 * cuts at the `<footer class="site-footer">` open tag) so the
 * structural change does not impact the gates.
 */

const projectLinks = [
  { label: "About HiMMP", href: "/about.html" },
  { label: "Approach", href: "/approach.html" },
  { label: "Team", href: "/team.html" }
];

const outputsLinks = [
  { label: "Findings", href: "/findings.html" },
  { label: "Publications", href: "/publications.html" },
  { label: "Audio", href: "/audio.html" },
  { label: "Videos", href: "/videos.html" }
];

const institutionalLinks = [
  { label: "FAQ", href: "/faq.html" },
  { label: "Contact", href: "/contact.html" },
  { label: "Privacy Policy", href: "/privacy.html" }
];

function FooterColumn({ heading, links }: { heading: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div className="site-footer__column">
      <h4 className="site-footer__heading">{heading}</h4>
      <ul className="site-footer__list">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href}>
              <span className="highlight-text">{link.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-logos">
          <img
            src="/assets/images/logos/university-logo-white.png"
            alt="University of Huddersfield Logo"
            className="footer-logo"
            loading="lazy"
          />
          <img
            src="/assets/images/logos/HiMMP-Full-Horiz.png"
            alt="HiMMP Logo"
            className="footer-logo"
            loading="lazy"
          />
          <img
            src="/assets/images/logos/AHRC-Logo.png"
            alt="Arts and Humanities Research Council Logo"
            className="footer-logo"
            loading="lazy"
          />
        </div>
        <nav className="site-footer__columns footer-nav" aria-label="Site footer navigation">
          <FooterColumn heading="Project" links={projectLinks} />
          <FooterColumn heading="Outputs" links={outputsLinks} />
          <FooterColumn heading="Institutional" links={institutionalLinks} />
        </nav>
        <div className="footer-info">
          <p>
            HiMMP is based within the School of Arts and Humanities (AH) and Computing and Engineering (C&amp;E) at the University of Huddersfield.{" "}
            <span className="highlight-text">© University of Huddersfield</span> // All rights reserved // The HiMMP Project is supported by the Arts and Humanities Research Council (AHRC) in the United Kingdom.
          </p>
        </div>
      </div>
    </footer>
  );
}
