export type NavItem = {
  label: string;
  href: string;
  routePath: string;
};

export const mainNavItems: NavItem[] = [
  { label: "welcome", href: "/index.html", routePath: "/" },
  { label: "about", href: "/about.html", routePath: "/about" },
  { label: "approach", href: "/approach.html", routePath: "/approach" },
  { label: "team", href: "/team.html", routePath: "/team" },
  { label: "publications", href: "/publications.html", routePath: "/publications" },
  { label: "findings", href: "/findings.html", routePath: "/findings" },
  { label: "videos", href: "/videos.html", routePath: "/videos" },
  { label: "audio", href: "/audio.html", routePath: "/audio" },
  { label: "faq", href: "/faq.html", routePath: "/faq" },
  { label: "contact", href: "/contact.html", routePath: "/contact" }
];

