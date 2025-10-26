# SEO & AI Detectability Implementation Blueprint

## 1. File-Level Changes

- `index.html`, `about.html`, `approach.html`, `team.html`, `publications.html`, `videos.html`, `audio.html`, `contact.html`, `privacy.html`
  - Promote hero headline to `<h1>` to restore semantic hierarchies without touching styling (`.hero-title` class reused).
  - Inject shared crawl metadata in `<head>`: `meta name="robots"`, `og:locale`, `geo.*` tags, and `<link rel="alternate" type="text/plain" href="llms.txt">`.
  - Append reusable `Organization` + `WebSite` JSON-LD graph (with CC BY license, address, geo coordinates, contact email) alongside existing page-specific schemas.
- `robots.txt`
  - Document `llms.txt` location and explicitly `Allow: /llms.txt` within the default `User-agent: *` block.
- `llms.txt`
  - Add Discovery, Structured Data, and Resource sections clarifying how AI agents can locate policy details and confirming no extra endpoints are required.
- `sitemap.xml`
  - Introduce a short XML comment referencing the AI usage policy so sitemap consumers can connect URLs to the declared license.

## 2. Validation Checklist

1. **Structured data**: Run `index.html` (sample) through Google Rich Results + Schema.org validator to confirm both the new `Organization`/`WebSite` nodes and the existing `ResearchProject` graph co-exist without errors.
2. **Crawl metadata**: Inspect page source to ensure `geo.*`, `og:locale`, and `llms.txt` link render once per document; use browser devtools Coverage tab to confirm no duplicate `<h1>` elements.
3. **Robots/LLM policy**: Fetch `https://himmp.net/robots.txt`, `.../llms.txt`, and `.../sitemap.xml` locally (e.g., via `curl`) verifying new comments/allowances are present and syntactically valid.

## 3. Scope Confirmation

- No new pages, frameworks, or build tooling were introduced—changes touch only static assets already in the repo.
- All additions stay within the SEO + AI detectability brief; no UX/content rewrites beyond retagging the existing hero copy.
- Future iterations can reuse the documented blueprint above to extend metadata without deviating from the current structure.

