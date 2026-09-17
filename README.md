# HiMMP website repository

Heaviness in Metal Music Production (HiMMP), an AHRC-funded research project
at the University of Huddersfield. The live website is **https://himmp.net**.

## What is live and what is archived

| Path | Status |
|---|---|
| `nextjs-site/` | **Live source.** The Next.js static export built from here is what himmp.net serves (Nginx on the Hostinger VPS, release directories under `/var/www/himmp-site/releases/`, see `docs/hostinger-deployment.md`). Page content lives in `nextjs-site/src/site/components/pages/`. |
| Root `*.html`, `findings/*.html`, `assets/`, `contact-handler.php`, `get-csrf-token.php`, `config.php` | **Archived legacy site (frozen reference).** This is the hand-written HTML/PHP site that himmp.net served until the 2026-05 migration. It is no longer deployed anywhere as a website. Every legacy page carries an `ARCHIVED LEGACY SOURCE` comment in its `<head>`. |
| `himmp-ebook/` | Self-contained HTML ebook with its own README, licence and citation file; maintained separately from both of the above. |
| `deploy/` | Nginx virtual host, cron and PHP hardening files installed on the VPS. |
| `docs/` | Migration, deployment and design-refresh records. |

The legacy root is kept, not deleted, because the build still reads it:

- `nextjs-site/src/site/legacy-content.ts` extracts each page's `<head>`
  metadata, JSON-LD and body scripts from the legacy file so the SEO surface
  stays byte-identical.
- `npm run sync:public` copies `assets/`, `favicon.png`, `robots.txt`,
  `sitemap.xml` and `llms.txt` from the root into the export.
- The parity gates (`npm run parity:content`, `parity:text`, `parity:links`,
  `parity:sitemap`) compare the export against the legacy files. Pages that
  have deliberately grown beyond the legacy version are listed in
  `nextjs-site/scripts/check-text-parity.mjs` with a replacement Playwright
  smoke test.

**Editing a root `.html` file does not change the live site.** To change
visible content, edit the React page under `nextjs-site/src/site/components/pages/`
(and, if the page is still under text parity, mirror the change in the legacy
file so the gate passes), then build and deploy per `docs/hostinger-deployment.md`.

## Old hosting

- GitHub Pages is not enabled for this repository.
- A Vercel project (`himmp-git-hub.vercel.app`) still auto-deploys the
  repository root on every push. `vercel.json` now redirects every path on
  that host permanently to `https://himmp.net`, so the archive cannot be
  browsed there as if it were live. Deleting that Vercel project would retire
  the host entirely; that has to be done in the Vercel dashboard.
- Everything else (Krystal hosting, Matomo) was migrated to the VPS on
  2026-05-12; see `docs/hostinger-deployment.md`.

## Working on the site

```bash
cd nextjs-site
npm run typecheck
npm run build            # lightweight export (no audio)
npm run parity:content && npm run parity:text && npm run parity:links
npx playwright test
npm run build:audio      # promotable artifact (45 MP3s)
npm run preflight:deploy
```

Agent instructions for this repository are generated into `AGENTS.md` and
`CLAUDE.md` from `agent-instructions/projects/himmp-github.md` in the
workspace; edit the source, not the generated files.
