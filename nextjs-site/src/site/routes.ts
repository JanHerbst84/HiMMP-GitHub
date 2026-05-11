export type LegacyRoute = {
  sourceFile: string;
  routePath: string;
  title: string;
};

export const legacyRoutes: LegacyRoute[] = [
  {
    sourceFile: "index.html",
    routePath: "/",
    title: "HiMMP - Heaviness in Metal Music Production"
  },
  { sourceFile: "about.html", routePath: "/about", title: "About HiMMP" },
  { sourceFile: "approach.html", routePath: "/approach", title: "Research Approach & Methodology" },
  { sourceFile: "team.html", routePath: "/team", title: "Meet the Team" },
  { sourceFile: "publications.html", routePath: "/publications", title: "Publications, Articles & Resources" },
  { sourceFile: "findings.html", routePath: "/findings", title: "Heaviness in Metal Music Production: A Practical Guide" },
  { sourceFile: "videos.html", routePath: "/videos", title: "Videos" },
  { sourceFile: "audio.html", routePath: "/audio", title: "HiMMP Downloads & Resources" },
  { sourceFile: "faq.html", routePath: "/faq", title: "Frequently Asked Questions" },
  { sourceFile: "contact.html", routePath: "/contact", title: "Get in Touch" },
  { sourceFile: "privacy.html", routePath: "/privacy", title: "Privacy Policy" },
  { sourceFile: "acknowledgements.html", routePath: "/acknowledgements", title: "Acknowledgements" },
  {
    sourceFile: "findings/01-introduction.html",
    routePath: "/findings/01-introduction",
    title: "Chapter 1: The Pursuit of Heaviness"
  },
  {
    sourceFile: "findings/02-producers.html",
    routePath: "/findings/02-producers",
    title: "Chapter 2: The Masters of Metal"
  },
  {
    sourceFile: "findings/03-methodology.html",
    routePath: "/findings/03-methodology",
    title: "Chapter 3: The Controlled Experiment"
  },
  {
    sourceFile: "findings/04-foundations.html",
    routePath: "/findings/04-foundations",
    title: "Chapter 4: Shared Foundations of Heaviness"
  },
  {
    sourceFile: "findings/05-naturalistic.html",
    routePath: "/findings/05-naturalistic",
    title: "Chapter 5: The Naturalistic Approach"
  },
  {
    sourceFile: "findings/06-hyperreal.html",
    routePath: "/findings/06-hyperreal",
    title: "Chapter 6: The Hyperreal Approach"
  },
  {
    sourceFile: "findings/07-meta-instrument.html",
    routePath: "/findings/07-meta-instrument",
    title: "Chapter 7: The \"Meta-Instrument\" Concept"
  },
  {
    sourceFile: "findings/08-drums.html",
    routePath: "/findings/08-drums",
    title: "Chapter 8: Drum Production"
  },
  {
    sourceFile: "findings/09-guitars-bass.html",
    routePath: "/findings/09-guitars-bass",
    title: "Chapter 9: Guitar & Bass Engineering"
  },
  {
    sourceFile: "findings/10-spatial.html",
    routePath: "/findings/10-spatial",
    title: "Chapter 10: Spatial Dimensions of Heaviness"
  },
  {
    sourceFile: "findings/11-subjective.html",
    routePath: "/findings/11-subjective",
    title: "Chapter 11: Subjective Dimensions of Heaviness"
  },
  {
    sourceFile: "findings/12-application.html",
    routePath: "/findings/12-application",
    title: "Chapter 12: Application Guide: Choosing Your Approach"
  },
  {
    sourceFile: "findings/13-future.html",
    routePath: "/findings/13-future",
    title: "Chapter 13: Future Directions: The Evolving Pursuit of Heaviness"
  },
  {
    sourceFile: "findings/14-recommended-reading.html",
    routePath: "/findings/14-recommended-reading",
    title: "Chapter 14: Recommended Reading"
  },
  {
    sourceFile: "findings/glossary.html",
    routePath: "/findings/glossary",
    title: "Glossary of Technical Terms"
  }
];

export function routePathToSegments(routePath: string): string[] {
  return routePath.split("/").filter(Boolean);
}
