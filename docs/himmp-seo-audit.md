# HiMMP SEO Audit

Audit date: 2026-06-08
Production URL: https://himmp.net
Latest production release verified in this audit:
`/var/www/himmp-site/releases/20260608-101001`

This audit applies the reusable scholarly project SEO SOP in
`/home/jan-herbst/github/wikis/web-ops-wiki/wiki/seo/research-project-seo.md`
to the deployed HiMMP site and the Next static-export source.

## Summary

HiMMP has a strong SEO baseline:

- 27 canonical HTML routes are deployed and listed in `sitemap.xml`.
- Pages preserve unique titles, descriptions, canonical URLs, robots metadata,
  Open Graph tags, Twitter cards, and legacy JSON-LD.
- The Next export has guard scripts for metadata preservation and sitemap parity.
- The site already includes rich structured data across research project,
  organization, people, breadcrumbs, videos, audio, dataset, FAQ, technical
  article, and how-to surfaces.
- `robots.txt`, `sitemap.xml`, `llms.txt`, and `favicon.png` are deployed.
- The site has an explicit AI reuse policy in `llms.txt`.

The original structured-data failures found earlier on 2026-06-08 have been
fixed and deployed. The current priority is output-level academic discovery:
publication/dataset identifiers, ORCID links, and correctly scoped Scholar
metadata.

## Live Audit Command

Run from `nextjs-site/`:

```bash
npm run audit:seo:live
```

The script checks all routes from `src/site/routes.ts`, then verifies:

- HTTP 200 for every route.
- Title, meta description, canonical, robots, H1, Open Graph, and Twitter card
  presence.
- JSON-LD parseability.
- Scholar-style `citation_*` metadata shape when present.
- Sitemap coverage.
- Same-origin URLs referenced inside parseable JSON-LD.

The command currently exits `0` against production with zero failures and zero
warnings.

## Resolved Production Findings

### 1. Invalid JSON-LD on `team.html`

Status: fixed and deployed
Severity at discovery: high
Source: `team.html:54`

The first `application/ld+json` block on `team.html` is invalid JSON due to a
trailing comma after the second `member` object:

```json
{
  "@type": "Person",
  "name": "Mark Mynett",
  "...": "..."
},
]
```

Impact:

- Search engines and validators cannot parse that structured-data block.
- The page loses the intended `WebPage` / `ResearchProject` /
  `ResearchOrganization` entity description.
- The deployed page still has other valid JSON-LD blocks, so the issue is
  localized rather than site-wide.

Fix applied:

- Removed the trailing comma in `team.html`.
- Corrected the image URLs inside the same block from lowercase filenames to
  deployed filenames:
  - `assets/images/people/herbst.jpg` -> `assets/images/people/Herbst.jpg`
  - `assets/images/people/mynett.jpg` -> `assets/images/people/Mynett.jpg`

### 2. Broken structured-data logo URL across multiple pages

Status: fixed and deployed
Severity at discovery: high
Affected URL:
`https://himmp.net/assets/images/logos/HiMMP-logo-small.png`

The deployed file is case-sensitive and exists as:

`https://himmp.net/assets/images/logos/HiMMP-Logo-small.png`

Affected structured-data routes reported by the audit:

- `index.html`
- `about.html`
- `approach.html`
- `team.html`
- `publications.html`
- `videos.html`
- `audio.html`
- `faq.html`
- `contact.html`
- `privacy.html`

Impact:

- The visible site logo loads because HTML uses the correct filename in some
  places, but JSON-LD points at a 404.
- Organization/entity markup is weaker because the declared logo URL is not
  resolvable.

Fix applied:

- Replace `https://himmp.net/assets/images/logos/HiMMP-logo-small.png` with
  `https://himmp.net/assets/images/logos/HiMMP-Logo-small.png` in legacy
  JSON-LD source pages.

### 3. Long meta descriptions on four findings chapters

Status: fixed and deployed
Severity at discovery: medium

The audit flags descriptions above 180 characters:

- `findings/03-methodology.html`: 184 characters.
- `findings/05-naturalistic.html`: 188 characters.
- `findings/07-meta-instrument.html`: 183 characters.
- `findings/12-application.html`: 186 characters.

Impact:

- This is not an indexing blocker.
- Search snippets may be truncated or rewritten.
- The current descriptions are close to the threshold, so this is a polishing
  issue after structured-data errors are fixed.

Fix applied:

- Shortened each description to roughly 145-165 characters while preserving
  academic clarity.

## Project Output SEO Pass

Implemented after the first production SEO repair:

- Removed `citation_*` tags from `publications.html` because it is a collection
  page listing many outputs. Google Scholar's guidance says each article or
  abstract needs a separate URL and that tags apply to the exact page on which
  they are provided.
- Added `citation_*` tags to `findings.html`, the self-hosted practical guide
  page with DOI `10.5281/zenodo.17608064`.
- Added `Book` JSON-LD to `findings.html` for the practical guide, including
  DOI, Zenodo/Pure `sameAs` links, ORCID-backed authors, publication date, and
  CC BY 4.0 license.
- Added the University of Huddersfield dataset DOI `10.34696/9s05-wv03` and
  Pure dataset record to the `Dataset` JSON-LD on `audio.html`.
- Wrapped Jan Herbst and Mark Mynett author names on `publications.html` with
  ORCID links where those names already appear as authors. The visible text is
  unchanged.

## Scholar And Academic Discoverability

HiMMP is a project website, not a publisher platform. Google Scholar is unlikely
to treat ordinary project pages, findings chapters, or about pages as scholarly
article records.

Scholar-relevant strengths:

- The publications page links project outputs and DOIs.
- The audio page includes `Dataset` structured data.
- The site clearly identifies institution, funder, project context, and research
  team.

Potential improvements:

- For future self-hosted publication landing pages or PDFs, add
  Scholar-supported `citation_*` meta tags and ensure one output per URL.
- Link institutional repository records next to publisher/DOI records where
  available.
- Do not represent `ScholarlyArticle` JSON-LD as a Scholar-ranking mechanism;
  use it only as general structured data unless Scholar's own documentation
  changes.

## Structured Data Inventory

The live audit found 73 JSON-LD blocks across 27 routes. Types observed:

- `ResearchProject`: 1
- `Organization`: 10
- `WebSite`: 10
- `Person`: 126
- `WebPage`: 5
- `Book`: 1
- `BreadcrumbList`: 21
- `MusicComposition`: 1
- `ItemList`: 2
- `CollectionPage`: 1
- `VideoObject`: 22
- `AudioObject`: 9
- `Dataset`: 1
- `FAQPage`: 1
- `TechArticle`: 14
- `HowTo`: 9

This is a good base. The priority is making every block valid and every
same-origin URL resolvable.

## Robots, Sitemap, And AI Policy

Positive:

- `robots.txt` allows ordinary search crawlers.
- `robots.txt` points to `https://himmp.net/sitemap.xml`.
- `sitemap.xml` lists all 27 canonical `.html` routes.
- `llms.txt` is deployed and linked from each page head as an AI usage policy.

Notes:

- `Crawl-delay` is harmless for some crawlers but ignored by Google.
- Wildcard user-agent patterns such as `*scraper*` are not portable across all
  robots parsers.
- Sensitive paths should remain protected by server configuration, not by
  `robots.txt`. The earlier deployment audit verified private/nonexistent paths
  return 404.

## Recommended Implementation Order

1. Fix JSON-LD syntax and case-sensitive image/logo URLs.
2. Rerun `npm run audit:seo:live` against production after deployment.
3. Shorten the four long findings descriptions.
4. Consider richer publication-level metadata only if HiMMP will host dedicated
   landing pages or PDFs for individual scholarly outputs.
5. Optionally validate representative pages in Google's Rich Results Test and
   Schema.org Validator:
   - `index.html`
   - `team.html`
   - `publications.html`
   - `audio.html`
   - one findings chapter with `TechArticle` / `HowTo`

## Source Basis

Primary guidance and literature are recorded in the canonical web-ops wiki SOP:

`/home/jan-herbst/github/wikis/web-ops-wiki/wiki/seo/research-project-seo.md`
