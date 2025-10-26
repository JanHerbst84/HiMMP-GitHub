# SEO & AI Detectability Baseline (HiMMP)

## 1. Existing Signals (snapshot)

| Page | Primary Schema | Notable Meta Elements |
| --- | --- | --- |
| `index.html` | `ResearchProject` | Canonical, OG/Twitter, keywords, sitemap reference |
| `about.html` | `WebPage` + nested `ResearchProject` | Canonical, OG/Twitter, keywords |
| `approach.html` | `WebPage` + `Dataset` + `VideoObject` | Canonical, OG/Twitter, keywords |
| `team.html` | `WebPage` | Canonical, OG/Twitter, keywords |
| `publications.html` | `ItemList` of `ScholarlyArticle` | Canonical, OG/Twitter, keywords |
| `videos.html` | `VideoObject` (per item) | Canonical, OG/Twitter, keywords |
| `audio.html` | `AudioObject` graph | Canonical, OG/Twitter, keywords |
| `contact.html` | *(no JSON-LD)* | Canonical, OG/Twitter, keywords |
| `privacy.html` | `WebPage` | Canonical, OG/Twitter, keywords |

- **Global artifacts**: `robots.txt` welcoming major search + AI bots, `sitemap.xml` covering 9 HTML pages, `llms.txt` describing AI usage policy, custom favicon, canonical tags per page.
- **Per-page head elements**: Consistent `<title>` + `<meta name="description">` + `<meta name="keywords">`, Open Graph + Twitter cards (shared image), per-page JSON-LD describing the primary resource (`ResearchProject`, `WebPage`, `AudioObject`, etc.).
- **Body structure**: Semantic `<main>`, accessible navigation, hero headline currently implemented as `<h2 class="hero-title">` on all pages.
- **Schemas in use**: `ResearchProject`, `WebPage`, `VideoObject`, `AudioObject`, `ItemList`, `ScholarlyArticle`, `Dataset`. No global `Organization`/`WebSite` definition or breadcrumb/search actions.

## 2. Gaps Affecting SEO + AI/LLM Crawlability

1. **Heading hierarchy**: No `<h1>` elements; hero sections start at `<h2>`, diluting primary keyword signals and making document outlines ambiguous for crawlers.
2. **Missing locale/GEO metadata**: No `og:locale`, `geo.*` meta tags, postal coordinates, or structured location data besides a nested `PostalAddress`. Limits regional relevance and local discovery.
3. **Fragmented structured data**: Each page declares only its local entity; lack of shared `Organization`/`WebSite` nodes prevents knowledge graph consolidation. No explicit `license` references for AI usage.
4. **AI discoverability hooks**: `llms.txt` exists but is orphaned—no `<link>` from documents, no mention in `robots.txt`/schema, and no CC-BY statement inside JSON-LD.
5. **Sitemap scope**: Only HTML pages listed; auxiliary resources (robots, llms) not referenced anywhere else, so AI agents must guess URLs.

## 3. Prioritized Fixes (within SEO + AI detectability scope)

1. **Semantic hierarchy** – promote hero headings to `<h1>` on all pages without altering existing styling.
2. **Shared metadata block** – add `meta name="robots"`, `og:locale`, and GEO tags (`geo.region`, `geo.position`, etc.) + link `llms.txt` from the head for machine discovery.
3. **Structured data enrichment** – inject reusable `Organization` + `WebSite` JSON-LD (with address, geo-coordinates, CC-BY license, contact info) alongside existing page schemas.
4. **AI policy signalling** – refresh `robots.txt`/`llms.txt` commentary to surface permissive stance and reference `llms.txt` explicitly; ensure `llms.txt` reiterates licensing & contact.
5. **Documentation + validation** – capture implementation blueprint + manual testing steps to verify metadata + schema with tools (Rich Results/URL Inspection) and avoid scope creep.
