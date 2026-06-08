import { readFileSync } from "node:fs";

const baseUrl = process.env.SEO_AUDIT_BASE_URL ?? "https://himmp.net";
const routesSource = readFileSync("src/site/routes.ts", "utf8");
const routes = [...routesSource.matchAll(/sourceFile:\s*"([^"]+\.html)"/g)].map(
  (match) => match[1]
);

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function attr(tag, name) {
  const pattern = new RegExp(
    `${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i"
  );
  const match = tag.match(pattern);
  return match ? decodeEntities(match[1] ?? match[2] ?? match[3] ?? "") : null;
}

function metas(html, attributeName, key) {
  const values = [];

  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if ((attr(tag, attributeName) ?? "").toLowerCase() === key.toLowerCase()) {
      values.push(attr(tag, "content") ?? "");
    }
  }

  return values;
}

function links(html, rel) {
  const values = [];

  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if ((attr(tag, "rel") ?? "").toLowerCase() === rel.toLowerCase()) {
      values.push(attr(tag, "href") ?? "");
    }
  }

  return values;
}

function textFromHtml(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function title(html) {
  return textFromHtml(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
}

function h1(html) {
  return textFromHtml(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
}

function jsonLdScripts(html) {
  const scripts = [];

  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/application\/ld\+json/i.test(match[1] ?? "")) {
      scripts.push(match[2].trim());
    }
  }

  return scripts;
}

function nodesFromJsonLd(value) {
  const parsed = JSON.parse(value);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (Array.isArray(parsed["@graph"])) {
    return parsed["@graph"];
  }
  return [parsed];
}

function routeUrl(route) {
  return `${baseUrl.replace(/\/$/, "")}/${route}`;
}

function addSameOriginStructuredUrl(route, key, value) {
  if (typeof value !== "string" || !/^https?:\/\//.test(value)) {
    return;
  }

  const siteOrigin = baseUrl.replace(/\/$/, "");
  if (!value.startsWith(`${siteOrigin}/`)) {
    return;
  }

  const parsed = new URL(value);
  parsed.hash = "";
  const url = parsed.toString();
  const sources = sameOriginStructuredUrls.get(url) ?? [];
  sources.push({ route, key });
  sameOriginStructuredUrls.set(url, sources);
}

function collectStructuredUrls(route, value, key = "") {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStructuredUrls(route, item, key);
    }
    return;
  }

  if (!value || typeof value !== "object") {
    addSameOriginStructuredUrl(route, key, value);
    return;
  }

  for (const [childKey, childValue] of Object.entries(value)) {
    collectStructuredUrls(route, childValue, childKey);
  }
}

const failures = [];
const warnings = [];
const report = [];
const typeCounts = {};
const sameOriginStructuredUrls = new Map();
let jsonLdTotal = 0;

for (const route of routes) {
  const url = routeUrl(route);
  const response = await fetch(url);

  if (!response.ok) {
    failures.push(`${route}: HTTP ${response.status}`);
    continue;
  }

  const html = await response.text();
  const canonical = links(html, "canonical");
  const description = metas(html, "name", "description");
  const robots = metas(html, "name", "robots");
  const ogTitle = metas(html, "property", "og:title");
  const ogUrl = metas(html, "property", "og:url");
  const ogImage = metas(html, "property", "og:image");
  const twitterCard = metas(html, "name", "twitter:card");
  const jsonLd = jsonLdScripts(html);
  const jsonLdTypes = [];

  if (title(html).length < 10) {
    failures.push(`${route}: weak or missing title`);
  }

  if (description.length !== 1 || description[0].length < 50 || description[0].length > 180) {
    warnings.push(
      `${route}: description count/length ${description.length}/${description[0]?.length ?? 0}`
    );
  }

  if (canonical.length !== 1) {
    failures.push(`${route}: canonical count ${canonical.length}`);
  } else if (canonical[0] !== url) {
    warnings.push(`${route}: canonical ${canonical[0]} does not match route URL ${url}`);
  }

  if (
    !robots[0]?.toLowerCase().includes("index") ||
    !robots[0]?.toLowerCase().includes("follow")
  ) {
    failures.push(`${route}: robots meta is ${robots[0] ?? "missing"}`);
  }

  if (!ogTitle.length || !ogUrl.length || !ogImage.length || !twitterCard.length) {
    warnings.push(`${route}: incomplete social tags`);
  }

  if (!h1(html)) {
    failures.push(`${route}: missing h1`);
  }

  jsonLdTotal += jsonLd.length;

  for (const script of jsonLd) {
    try {
      for (const node of nodesFromJsonLd(script)) {
        collectStructuredUrls(route, node);
        const type = node["@type"];
        const types = Array.isArray(type) ? type : type ? [type] : [];
        for (const value of types) {
          typeCounts[value] = (typeCounts[value] ?? 0) + 1;
          jsonLdTypes.push(value);
        }
      }
    } catch (error) {
      failures.push(`${route}: invalid JSON-LD: ${error.message}`);
    }
  }

  report.push({
    route,
    title: title(html),
    descriptionLength: description[0]?.length ?? 0,
    canonical: canonical[0] ?? null,
    ogImage: ogImage[0] ?? null,
    jsonLd: jsonLd.length,
    jsonLdTypes: [...new Set(jsonLdTypes)],
    h1: h1(html)
  });
}

for (const [url, sources] of sameOriginStructuredUrls) {
  const response = await fetch(url, { method: "HEAD" });
  if (!response.ok) {
    const sourceList = sources.map((source) => `${source.route}:${source.key}`).join(", ");
    failures.push(
      `structured-data URL ${url} returned HTTP ${response.status}; referenced by ${sourceList}`
    );
  }
}

const sitemapResponse = await fetch(`${baseUrl.replace(/\/$/, "")}/sitemap.xml`);
if (!sitemapResponse.ok) {
  failures.push(`sitemap.xml: HTTP ${sitemapResponse.status}`);
} else {
  const sitemap = await sitemapResponse.text();
  const sitemapLocs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
  for (const route of routes) {
    const url = routeUrl(route);
    if (!sitemapLocs.has(url)) {
      failures.push(`${route}: missing from sitemap`);
    }
  }
}

console.log(
  JSON.stringify(
    {
      routes: routes.length,
      jsonLdTotal,
      typeCounts,
      checkedSameOriginStructuredUrls: sameOriginStructuredUrls.size,
      failures,
      warnings,
      report
    },
    null,
    2
  )
);

if (failures.length > 0) {
  process.exit(1);
}
