import { mainNavItems } from "@/src/site/navigation";

type SiteHeaderProps = {
  activePath: string;
};

export function SiteHeader({ activePath }: SiteHeaderProps) {
  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <header className="site-header">
        <div className="container header-container">
          <div className="logo">
            <a href="/index.html">
              <img
                src="/assets/images/logos/HiMMP-Logo-small.png"
                alt="HiMMP - Heaviness in Metal Music Production"
                className="logo-image"
              />
            </a>
          </div>
          <button className="menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
            <span className="hamburger" />
          </button>
          <nav className="main-nav" aria-label="Main navigation">
            <ul className="nav-links">
              {mainNavItems.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className={item.routePath === activePath ? "active" : undefined}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
