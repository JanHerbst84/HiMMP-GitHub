# HiMMP Hostinger Deployment

Date: 2026-05-12

This records the Hostinger VPS layout for the migrated HiMMP website.

## Paths

- Static release root: `/var/www/himmp-site/releases/<timestamp>/out`
- Active static symlink: `/var/www/himmp-site/current`
- PHP contact endpoint directory: `/var/www/himmp-site/php`
- Writable contact storage: `/var/www/himmp-site/php/contact_submissions`
- Nginx site config: `/etc/nginx/sites-available/himmp.net`

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
- Existing contact storage was migrated to `www-data:www-data`, directory mode `700`, and file mode `600`. One older deterministic smoke record was also deleted. Four historical submission records remain pending correspondence-owner retention adjudication; their contents were not exposed in the deployment log.

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
- `https://himmp.net/sitemap.xml` is generated from the Next route inventory and includes git-backed `lastmod` values for all 27 generated routes.
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

## Remaining Before Production Cutover

- Keep `/var/www/himmp-site/php/config.local.php` out of git and preserve `root:www-data` / `640` permissions when rotating credentials.
- Run `sudo bash deploy/hostinger/harden-contact-storage.sh` (or its equivalent against `/var/www/himmp-site/php/contact_submissions`) once during this deploy so the directory and existing files are owned by `www-data:www-data` and move to directory mode `700` and file mode `600`.
- Review the resulting filename-only retention inventory with the correspondence owner. The deployment must not guess which messages have completed correspondence; delete only records the owner confirms are no longer required under the published retention policy.

## Hardening Headers and Edge Limits

The versioned Nginx configuration now:

- suppresses version disclosure with `server_tokens off`;
- limits `/get-csrf-token.php` to 30 requests/minute per address with a burst of 10;
- limits `/contact-handler.php` to 10 requests/minute per address with a burst of 10, returning HTTP 429 at the Nginx layer;
- emits HSTS and a restrictive Permissions-Policy;
- emits Content-Security-Policy in `Report-Only` mode. Do not promote it to an enforcing `Content-Security-Policy` header until live browser checks show no required resource would be blocked.

After deployment, inspect representative routes and an activated YouTube embed for report-only CSP console violations. The expected external origins are `analytics.himmp.net`, `img.youtube.com`, and `www.youtube.com`.

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
