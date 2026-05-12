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
- Active release: `/var/www/himmp-site/releases/20260512-132320`.
- DNS for `himmp.net` / `www.himmp.net` must point to the VPS before a public Certbot certificate can be issued.
- Before DNS cutover, the site can be checked with a Host header against the VPS IP.
- Mail transport is not yet configured on the VPS. The PHP contact handler currently validates CSRF and writes submissions, but `mail()` does not return success until a mail transport or SMTP relay is configured.

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

Checked on 2026-05-12 with `Host: himmp.net` against `127.0.0.1` on the VPS:

- `/about.html` returned `200 OK`.
- `/publications.html` returned `200 OK`.
- `/findings/08-drums.html` returned `200 OK`.
- `/assets/audio/HiMMP.mp3` returned `200 OK` with `Content-Type: audio/mpeg`.
- `/about` returned `404 Not Found`, preserving the `.html` public URL policy.
- `/findings/08-drums` returned `404 Not Found`, preserving the `.html` public URL policy for nested routes.
- `/config.php` returned `404 Not Found`.
- `/contact_submissions/` returned `404 Not Found`.
- `/get-csrf-token.php` returned JSON with a CSRF token and set a PHP session cookie.
- Invalid CSRF submission returned the expected JSON rejection.
- Valid CSRF submission wrote to `/var/www/himmp-site/php/contact_submissions`; mail failed because no mail transport is configured.

## Remaining Before Production Cutover

- Point DNS for `himmp.net` and `www.himmp.net` at `5.182.18.217`.
- Issue and enable Certbot certificates for `himmp.net` and `www.himmp.net`.
- Configure a real mail transport or SMTP relay for PHP contact submissions.
- Run `CONTACT_BASE_URL=https://himmp.net npm run smoke:contact:php -- --submit --allow-production-submit` only after DNS, HTTPS, and mail are configured.

## Post-DNS TLS Plan

After DNS points to the VPS:

- Run Certbot for `himmp.net` and `www.himmp.net`.
- Review the Certbot-edited Nginx config before accepting production cutover.
- Ensure HTTP redirects to HTTPS.
- Keep the `.html` URL policy under HTTPS: representative `.html` routes return `200`, extensionless routes return `404` or an explicitly documented canonical strategy.
- Recheck PHP contact endpoints over HTTPS so PHP receives the expected HTTPS request context.
- Consider HSTS only after HTTPS is stable for both apex and `www`.
- Do not run the production `--submit --allow-production-submit` contact smoke until mail transport is configured.
