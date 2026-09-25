export const siteOrigin = "https://himmp.net";

// Public URL of a route. The home page's canonical URL is `/`, not `/index.html`.
export function locFor(sourceFile) {
  return sourceFile === "index.html" ? `${siteOrigin}/` : `${siteOrigin}/${sourceFile}`;
}

// Inverse of locFor; null for URLs outside the site.
export function sourceFileForLoc(loc) {
  if (loc === `${siteOrigin}/`) return "index.html";
  return loc.startsWith(`${siteOrigin}/`) ? loc.slice(`${siteOrigin}/`.length) : null;
}
