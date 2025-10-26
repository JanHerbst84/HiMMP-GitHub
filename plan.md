# SEO & AI Detectability Plan

**Overall Progress:** `100%`

## Tasks:

- [x] 🟩 **Step 1: Baseline Audit & Prioritization**
  - [x] 🟩 Document existing SEO signals per page (titles, headings, meta, JSON-LD)
  - [x] 🟩 Identify gaps affecting LLM/AI crawlability (licensing cues, llms.txt alignment, schema coverage)
  - [x] 🟩 Prioritize fixes confined strictly to SEO + AI detectability scope

- [x] 🟩 **Step 2: Semantic Structure & Metadata Enhancements**
  - [x] 🟩 Define consistent `<h1>` strategy and heading hierarchy updates
  - [x] 🟩 Standardize shared head metadata (og:locale, meta robots, geo tags if needed for SEO)
  - [x] 🟩 Expand or adjust JSON-LD (`WebSite`, `Organization`, clarify `ResearchProject`) without conflicting existing schemas

- [x] 🟩 **Step 3: AI/LLM Discoverability Improvements**
  - [x] 🟩 Review and align `robots.txt`, `llms.txt`, and sitemap entries with desired AI-friendly messaging
  - [x] 🟩 Determine additional machine-readable hints (e.g., schema for licensing, creative works) that benefit AI consumption
  - [x] 🟩 Specify any new resources (e.g., dedicated AI/usage page) needed strictly for detectability

- [x] 🟩 **Step 4: Implementation Blueprint**
  - [x] 🟩 Map each change to concrete files/sections (per-page head/body edits, shared assets)
  - [x] 🟩 Outline validation approach (manual checks, structured-data testing, crawlers)
  - [x] 🟩 Confirm no out-of-scope features are introduced

- [x] 🟩 **Step 5: Contributor Metadata Enrichment**
  - [x] 🟩 Catalog producers and musicians referenced in content
  - [x] 🟩 Embed shared `Person` JSON-LD nodes across site metadata
  - [x] 🟩 Link ResearchProject schema (`index`, `about`) to new Person IDs via `contributor`/`performer`
