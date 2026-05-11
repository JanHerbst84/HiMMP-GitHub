import { footerNavItems } from "@/src/site/navigation";

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
        <nav className="footer-nav">
          <ul>
            {footerNavItems.map((item) => (
              <li key={item.href}>
                <a href={item.href}>
                  <span className="highlight-text">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
