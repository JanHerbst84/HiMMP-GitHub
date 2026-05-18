import { mainNavItems, type NavItem } from "@/src/site/navigation";

type SiteHeaderProps = {
  activePath: string;
};

/*
 * Nav active-state match. Exact-equal handles the simple case (/about,
 * /publications, etc.). The prefix branch covers sub-routes — primarily
 * the 14 findings chapter routes `/findings/<slug>`, which should
 * activate the "findings" tab the same way `/findings` does. The
 * `routePath !== "/"` guard prevents the home item from matching every
 * other path (every path starts with "/").
 */
function isNavItemActive(item: NavItem, activePath: string): boolean {
  if (item.routePath === activePath) return true;
  if (item.routePath === "/") return false;
  return activePath.startsWith(item.routePath + "/");
}

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
                  <a href={item.href} className={isNavItemActive(item, activePath) ? "active" : undefined}>
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
