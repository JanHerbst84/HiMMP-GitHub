# HiMMP Hostinger Deployment

Date: 2026-05-12

This records the Hostinger VPS layout for the migrated HiMMP website.

## Paths

- Static release root: `/var/www/himmp-site/releases/<timestamp>/out`
- Active static symlink: `/var/www/himmp-site/current`
- PHP contact endpoint directory: `/var/www/himmp-site/php`
- Writable contact storage: `/var/www/himmp-site/php/contact_submissions`
- Rate-limit cleanup command: `/var/www/himmp-site/php/cleanup-contact-rate-limits.php`
- Rate-limit cleanup schedule: `/etc/cron.d/himmp-rate-limit-cleanup`
- Nginx site config: `/etc/nginx/sites-available/himmp.net`
- Release retention (since 2026-09-17): `/usr/local/bin/prune-releases.sh`
  (daily cron `/etc/cron.d/prune-releases`) keeps the newest 3 releases and never
  removes the `current` target. Do not rely on more than the previous release
  existing as a rollback target.

## Serving Model

Nginx serves the Next.js static export from:

```text
/var/www/himmp-site/current/out
```

This site does not use a PM2, Docker, or Node TCP app port. The VPS registry records `himmp.net` as a no-port deployment and keeps `3017` as the next available TCP app port.

Only two PHP endpoint URLs are executed through PHP-FPM:

- `/get-csrf-token.php`
- `/contact-handler.php`

The PHP files live outside the static document root. `config.php` and `contact_submissions/` are not served from the static export and are denied explicitly by Nginx if requested as public paths.

## First Deployment Notes

- The first Hostinger staging candidate uses the audio-inclusive export.
- PHP-FPM 8.3 is required for the contact workflow.
- PHP-FPM was installed on the VPS on 2026-05-12 and is reached through `/run/php/php8.3-fpm.sock`.
- Active release: `/var/www/himmp-site/releases/20260512-160459`.
- DNS for `himmp.net` / `www.himmp.net` was moved to the VPS on 2026-05-12.
- A Let's Encrypt certificate for `himmp.net` and `www.himmp.net` was issued on 2026-05-12 and is configured in the versioned Nginx file.
- Mail transport uses authenticated Brevo SMTP configured in untracked `/var/www/himmp-site/php/config.local.php`. The file is owned by `root:www-data` with mode `640` so PHP-FPM can read it while keeping credentials out of git. PHP reports the default `sendmail_path` as `/usr/sbin/sendmail -t -i`, but `/usr/sbin/sendmail` is absent and the checked local mail services were inactive on 2026-05-12; keep the SMTP relay as the production path unless this is deliberately changed.

## Verification

After syncing a release and enabling Nginx:

```bash
curl -I -H 'Host: himmp.net' http://127.0.0.1/about.html
curl -I -H 'Host: himmp.net' http://127.0.0.1/publications.html
curl -I -H 'Host: himmp.net' http://127.0.0.1/findings/08-drums.html
curl -I -H 'Host: himmp.net' http://127.0.0.1/assets/audio/HiMMP.mp3
```

For local Host-header testing from outside the VPS, use the VPS IP with `curl --resolve` once the Nginx site is enabled. The `npm run smoke:contact:php` command should wait until DNS resolves to the VPS because the smoke script does not provide a Host-header override.

## Verified On VPS

Checked live on 2026-07-11 after hardening release `/var/www/himmp-site/releases/20260711-150216-fd80590` (rollback target `/var/www/himmp-site/releases/20260618-112346`):

- Nginx configuration test and reload succeeded; the service remained active.
- Apex returned `200`; `www` returned `301` to the apex; the `Server` header no longer disclosed the Nginx version.
- HSTS, Permissions-Policy, and report-only CSP were present on HTML, audio, redirect, and PHP responses.
- The CSRF session cookie included `Secure`, `HttpOnly`, and `SameSite=Lax`.
- The audio-inclusive release served `HiMMP.mp3` as `audio/mpeg`; deployment preflight counted all 45 MP3 files.
- The 27-route live SEO audit passed with 73 JSON-LD blocks and no failures or warnings.
- Representative live browser checks (home, audio, videos with an activated YouTube embed, and a findings chapter) produced no report-only CSP console violations.
- A tagged real submission (`HARDENING DEPLOY fd80590`) passed the SMTP/log path and created a `www-data:www-data` mode-`600` record; that test record was deleted after verification.
- The recipient confirmed delivery of the tagged hardening-deploy email, closing the end-to-end SMTP verification.
- Existing contact storage was migrated to `www-data:www-data`, directory mode `700`, and file mode `600`. Previously identified deterministic smoke records were deleted; the two remaining records were held for correspondence-owner adjudication without exposing their contents in the deployment log.

Checked live on 2026-07-11 after enforcing CSP from commit `6b2fcf8` (Nginx rollback copy `/etc/nginx/sites-available/himmp.net.pre-6b2fcf8-20260711-170447`; static release unchanged):

- `nginx -t` and reload succeeded; the service remained active and the installed virtual host contained five enforcing CSP headers and no report-only headers.
- Apex HTML, the `www` redirect, audio HTML, and the CSRF endpoint returned the enforcing CSP alongside HSTS and Permissions-Policy.
- A Chromium audit loaded all 27 routes and activated three lazy YouTube embeds with no CSP console violations or unexpected request failures. Audio requests cancelled when each audit page closed were recorded as expected client lifecycle aborts, not policy failures.
- The 27-route live SEO audit again passed with 73 JSON-LD blocks and no failures or warnings.
- The non-submitting production contact smoke passed; the previously confirmed SMTP path was not invoked again.
- Nginx and PHP-FPM journals contained no new warnings or errors after deployment. The only HTTP `4xx` entries during the audit were `499` client-close events from the browser ending media/image requests as pages closed.

Contact-storage retention closed on 2026-07-12:

- The correspondence owner reviewed the two remaining submission records through a minimal-data decision surface and classified both as non-actionable automated junk.
- After explicit approval, those two records and four expired one-hour rate-limit state files were deleted. No personal data was added to the repository audit trail.
- The production `contact_submissions` directory was verified empty after deletion and retained `www-data:www-data` ownership with mode `700`. Future valid requests or rejected submission attempts will create new mode-`600` submission or rate-limit files as designed.
- An hourly, low-priority maintenance job removes rate-limit state older than two rate-limit windows. Contact requests hold a shared maintenance lock while opening and updating their IP state; cleanup takes the exclusive lock only around each deletion, so traversal does not block requests and deletion cannot race an active limiter update. Busy candidates are deferred to a later pass. A separate job lock prevents overlapping collectors. The collector traverses the complete directory outside request handling, filters exact rate-state filenames, and ignores submissions, symbolic links, and unrelated files.
- Deploy and roll back `contact-handler.php`, `cleanup-contact-rate-limits.php`, and `/etc/cron.d/himmp-rate-limit-cleanup` as one compatibility unit: an older handler does not participate in the maintenance lock protocol.

Rate-limit retention automation deployed on 2026-07-12 from commit `cd6381d` (handler rollback copy `/var/www/himmp-site/php/contact-handler.php.pre-cd6381d-20260712-080420`):

- The handler and collector passed PHP lint on the VPS; PHP-FPM 8.3 was reloaded and remained active, and the cron service remained active.
- The handler and collector are `root:www-data` mode `640`; the cron definition is `root:root` mode `644`. The two runtime lock files are `www-data:www-data` mode `600`, and the storage directory remains `www-data:www-data` mode `700`.
- A reserved documentation-range test IP exercised the deployed limiter without sending mail. Its mode-`600` synthetic state was aged by three hours, the installed collector reported one examined and deleted state with no deferrals or failures, and the fixture was confirmed absent afterward.
- A subsequent collector pass reported no rate-state candidates. The live non-submitting contact smoke passed, and PHP-FPM and cron journals contained no new warnings.
- The first natural cron tick ran as `www-data` at 08:17 UTC on 2026-07-12 using the installed low-priority command and reported `examined=0 deleted=0 deferred=0 failed=0`. Cron and PHP-FPM remained active, storage permissions were unchanged, and only the two mode-`600` coordination lock files remained.

Checked on 2026-05-12 with `Host: himmp.net` against `127.0.0.1` on the VPS:

- `/about.html` returned `200 OK`.
- `/publications.html` returned `200 OK`.
- `/findings/08-drums.html` returned `200 OK`.
- `/assets/audio/HiMMP.mp3` returned `200 OK` with `Content-Type: audio/mpeg`.
- `/about` returned `404 Not Found`; this was the original `.html` public URL policy before the 2026-06-08 canonical redirect update.
- `/findings/08-drums` returned `404 Not Found`; this was the original `.html` public URL policy for nested routes before the 2026-06-08 canonical redirect update.
- `/config.php` returned `404 Not Found`.
- `/contact_submissions/` returned `404 Not Found`.
- `/get-csrf-token.php` returned JSON with a CSRF token and set a PHP session cookie.
- Invalid CSRF submission returned the expected JSON rejection.
- Valid CSRF submission wrote to `/var/www/himmp-site/php/contact_submissions`; mail initially failed before SMTP relay configuration.

Checked live over HTTPS on 2026-05-12 after issuing the certificate and adding the 443 Nginx server block:

- `https://himmp.net/about.html` returned `200 OK`.
- `https://www.himmp.net/about.html` returned `200 OK`.
- `https://himmp.net/assets/audio/HiMMP.mp3` returned `200 OK` with `Content-Type: audio/mpeg`.
- `https://himmp.net/about` returned `404 Not Found`; this was later changed on 2026-06-08 to a canonical `.html` redirect.
- `https://himmp.net/config.php` returned `404 Not Found`.
- `https://himmp.net/contact_submissions/` returned `404 Not Found`.
- `CONTACT_BASE_URL=https://himmp.net npm run smoke:contact:php` passed.
- `https://himmp.net/contact.html` includes the contact-list marker reset that disables native list bullets and keeps only the page's custom bullet.
- `https://himmp.net/index.html` includes legacy `robots`, `keywords`, `geo.*`, preconnect, and DNS-prefetch head markers.
- `https://himmp.net/publications.html` includes legacy citation and article timestamp metadata.
- `https://himmp.net/findings/08-drums.html` includes legacy chapter `prev`/`next` links, canonical/OpenGraph markers, and JSON-LD scripts.
- `https://himmp.net/sitemap.xml` is generated from the Next route inventory and includes git-backed `lastmod` values for all 27 generated routes. (Since 2026-09-25 `lastmod` comes from the files that produce each route, not the archived legacy HTML alone; see `nextjs-site/scripts/lib/sitemap-lastmod.mjs`.)
- `https://himmp.net/acknowledgements.html` includes canonical, `og:url`, `og:image`, Twitter image metadata, and `robots` with `max-image-preview:large`.
- `https://himmp.net/audio.html` includes high-contrast producer switch buttons for the interactive mix comparison tool.
- `https://himmp.net/contact-handler.php` and `CONTACT_BASE_URL=https://himmp.net npm run smoke:contact:php` passed after syncing the SMTP-capable PHP handler.
- `CONTACT_BASE_URL=https://himmp.net npm run smoke:contact:php -- --submit --allow-production-submit` passed after adding the private Brevo SMTP config.
- PHP local mail transport check on the VPS found no usable `/usr/sbin/sendmail`; production contact submissions use the configured SMTP relay instead.

Checked live over HTTPS on 2026-06-08 after release `/var/www/himmp-site/releases/20260608-074327` and the canonical extensionless-route redirect update:

- `https://himmp.net/findings/07-meta-instrument.html` returned `200 OK`.
- `https://himmp.net/findings/07-meta-instrument` returned `301 Moved Permanently` to `https://himmp.net/findings/07-meta-instrument.html`.
- `https://himmp.net/about` returned `301 Moved Permanently` to `https://himmp.net/about.html`.
- `https://himmp.net/nonexistent` returned `404 Not Found`.
- `https://himmp.net/config` returned `404 Not Found`.
- `https://himmp.net/assets/audio/HiMMP.mp3` returned `200 OK` with `Content-Type: audio/mpeg`.
- `CONTACT_BASE_URL=https://himmp.net npm run smoke:contact:php` passed.

Checked live over HTTPS on 2026-09-16 after release `/var/www/himmp-site/releases/20260916-205457-d9de9b9` (rollback target `/var/www/himmp-site/releases/20260711-150216-fd80590`), synced with `rsync --link-dest` against the previous release and switched by replacing the `current` symlink:

- `https://himmp.net/videos.html` returned `200 OK` and contains the new `bilibili-videos-section` with five link cards (source commit `d9de9b9`).
- `https://himmp.net/about.html` and `https://himmp.net/findings/08-drums.html` returned `200 OK`.
- `https://himmp.net/assets/audio/HiMMP.mp3` returned `200 OK` with `Content-Type: audio/mpeg`; the export carried all 45 MP3 files (preflight passed).
- No CSP change: the Bilibili items are plain links, not embeds, so the approved external origins are unchanged and the all-route CSP audit was not required.

Checked live over HTTPS on 2026-09-16 after release `/var/www/himmp-site/releases/20260916-211055-060b4bc` (rollback target `/var/www/himmp-site/releases/20260916-205457-d9de9b9`): `videos.html`, `about.html` and the MP3 asset returned `200 OK`; the Bilibili section now lists six link cards (source commit `060b4bc`).

Checked live over HTTPS on 2026-09-17 after release `/var/www/himmp-site/releases/20260917-070720-d1d2b90` (rollback target `releases/20260916-211055-060b4bc`), synced with rsync and switched by replacing `current`:

- `https://himmp.net/videos.html` returned `200 OK` and now embeds the JackieW YouTube cross-post `nxkTL94OXto` in User-Generated Content (source commit `d1d2b90`); the Bilibili link-card section is unchanged.
- `https://himmp.net/about.html` returned `200 OK`; `https://himmp.net/assets/audio/HiMMP.mp3` returned `200 OK`.
- No CSP change: the embed origin is `www.youtube.com`, already approved.

Checked live over HTTPS on 2026-09-17 after release `/var/www/himmp-site/releases/20260917-075818-7902c2b` (rollback target `releases/20260917-070720-d1d2b90`), synced with `rsync --link-dest` against the previous release and switched by replacing `current`; `nginx -t` passed and no Nginx change was needed:

- `videos.html`, `about.html`, `publications.html` and `assets/audio/HiMMP.mp3` returned `200 OK`; the audio file is byte-identical to the previous release (45 MP3 files, deployment preflight passed for 27 routes).
- `https://himmp.net/videos.html` now embeds the Marnetmar 'In Solitude' mix `fpvd9woR-oM` in Practitioner Reuse alongside the JackieW cross-post `nxkTL94OXto` (source commit `7902c2b`).
- Mobile/dark-mode remediation (source commit `f70a731`) verified with a mobile-emulated Chromium against the live site: sticky header 93px at 375px in both schemes (was 209px), hamburger rendered as a transparent three-bar control, theme toggle on the logo row, no logo/toggle overlap at 320px, open menu without list bullets or stray pseudo-content, publications sticky strip offset equal to the header height, FAQ and team pages at 375px document width, contact submit button on the mint pill treatment.
- No CSP change: only CSS, one scoped inline style selector on the publications page, and a YouTube embed from the already approved origin.

Checked live over HTTPS on 2026-09-17 after release `/var/www/himmp-site/releases/20260917-092921-46d0a83` (rollback target `releases/20260917-075818-7902c2b`):

- `https://himmp.net/videos.html` returned `200 OK` with seven Bilibili link cards (source commit `46d0a83`); about and audio routes `200 OK`. No CSP change (links, not embeds).

Checked live over HTTPS on 2026-09-25 after release `/var/www/himmp-site/releases/20260925-202909-811b57d` (rollback target `releases/20260917-092921-46d0a83`; Nginx rollback copy `/etc/nginx/sites-available/himmp.net.pre-811b57d-20260925-202924`), synced with `rsync --link-dest` against the previous release and switched atomically; site review 2026-09 (`docs/site-review-2026-09-25-plan.md`):

- Vhost changes: site-scoped gzip for JS/CSS/JSON/XML/SVG/text (the global `nginx.conf` gzips `text/html` only); `error_page 404 /404.html` with an internal location; `/_next/static/` served `public, max-age=31536000, immutable`; one `Cache-Control` on static assets; `/index.html` 301 to `/` (query kept). `nginx -t` passed (only the pre-existing "protocol options redefined" warnings from other sites), reload succeeded, Nginx active; no HiMMP entries in the error log afterwards.
- `/` 200; `/index.html` and `/index.html?x=1` 301 to `/` (and `/?x=1`); `/about` 301 to `/about.html`; unknown URLs, nested unknown URLs and a direct `/404.html` return 404 with the site's 404 page and the security headers; hashed JS gzip-compressed with the immutable cache header; `sitemap.xml` gzip-compressed and listing `https://himmp.net/`; `assets/audio/HiMMP.mp3` 200 (45 MP3 files, deployment preflight passed for 27 routes).
- `npm run audit:seo:live`: 27 routes, 73 JSON-LD blocks, no failures or warnings. `npm run audit:csp:live` (new; enforcing CSP header required on every document, report-only rejected, first click-to-load embed activated on each of the 4 embed pages): no problems. No CSP change was needed: the home/audio/approach embeds use the already approved `www.youtube.com` and `img.youtube.com`.
- Non-submitting production contact smoke passed.
- Transfer on load (Chromium, CDP byte count): home 0.6 MB (was 2.0), chapter 7 0.8 MB (was 12.7), chapter 9 0.9 MB (was 18.1).

## Remaining Before Production Cutover

- Keep `/var/www/himmp-site/php/config.local.php` out of git and preserve `root:www-data` / `640` permissions when rotating credentials.
- Run `sudo bash deploy/hostinger/harden-contact-storage.sh` (or its equivalent against `/var/www/himmp-site/php/contact_submissions`) once during this deploy so the directory and existing files are owned by `www-data:www-data` and move to directory mode `700` and file mode `600`.
- Review future filename-only retention inventories with the correspondence owner. Do not guess which messages have completed correspondence; delete only records the owner confirms are no longer required under the published retention policy.

## Hardening Headers and Edge Limits

The versioned Nginx configuration now:

- suppresses version disclosure with `server_tokens off`;
- limits `/get-csrf-token.php` to 30 requests/minute per address with a burst of 10;
- limits `/contact-handler.php` to 10 requests/minute per address with a burst of 10, returning HTTP 429 at the Nginx layer;
- emits HSTS and a restrictive Permissions-Policy;
- emits an enforcing Content-Security-Policy after the report-only observation window and a subsequent all-route browser audit found no required resource violations.

After any resource or embed change, rerun the live all-route CSP browser audit before deployment. The approved external origins are `analytics.himmp.net`, `img.youtube.com`, and `www.youtube.com`.

## Contact Mail Setup

Preferred production setup is an authenticated SMTP relay rather than a local unauthenticated MTA. Credentials currently live outside git in `/var/www/himmp-site/php/config.local.php` on the VPS:

```php
<?php
define('CONTACT_MAIL_TRANSPORT', 'smtp');
define('CONTACT_SMTP_HOST', 'smtp.example.com');
define('CONTACT_SMTP_PORT', 587);
define('CONTACT_SMTP_SECURITY', 'tls'); // tls, ssl, or none
define('CONTACT_SMTP_USERNAME', 'smtp-user');
define('CONTACT_SMTP_PASSWORD', 'smtp-password');
```

Equivalent environment variables are also supported:

```text
HIMMP_MAIL_TRANSPORT=smtp
HIMMP_SMTP_HOST=smtp.example.com
HIMMP_SMTP_PORT=587
HIMMP_SMTP_SECURITY=tls
HIMMP_SMTP_USERNAME=smtp-user
HIMMP_SMTP_PASSWORD=smtp-password
```

For PHP-FPM, shell exports are not enough by themselves. Add the `HIMMP_SMTP_*` values as `env[...]` entries in the active PHP-FPM pool or systemd service environment and reload PHP-FPM, or use `config.local.php` to avoid PHP-FPM environment passthrough issues.

After configuring SMTP, run:

```bash
CONTACT_BASE_URL=https://himmp.net npm run smoke:contact:php -- --submit --allow-production-submit
```

## Post-DNS TLS Plan

- Ensure HTTP redirects to HTTPS.
- Keep the `.html` URL policy under HTTPS: representative `.html` routes return `200`, and extensionless routes for existing pages redirect to the matching `.html` canonical URL.
- Recheck PHP contact endpoints over HTTPS so PHP receives the expected HTTPS request context.
- HSTS is enabled after stable HTTPS operation on both apex and `www`; verify it remains present on static, PHP, asset, and redirect responses.
- Do not run the production `--submit --allow-production-submit` contact smoke until mail transport is configured.
