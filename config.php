<?php
/**
 * HiMMP Configuration File
 *
 * Store sensitive configuration separately from code
 */

// Optional untracked overrides for deployment secrets, e.g. SMTP credentials.
$local_config = __DIR__ . '/config.local.php';
if (file_exists($local_config)) {
    require_once $local_config;
}

// Contact form settings
defined('CONTACT_EMAIL') || define('CONTACT_EMAIL', 'j.herbst@hud.ac.uk');
defined('CONTACT_FROM_EMAIL') || define('CONTACT_FROM_EMAIL', 'noreply@himmp.net');
defined('CONTACT_FROM_NAME') || define('CONTACT_FROM_NAME', 'HiMMP Contact Form');

// Mail transport settings. Use environment variables on the VPS for secrets.
// HIMMP_MAIL_TRANSPORT: auto, smtp, mail, or log
defined('CONTACT_MAIL_TRANSPORT') || define('CONTACT_MAIL_TRANSPORT', getenv('HIMMP_MAIL_TRANSPORT') ?: 'auto');
defined('CONTACT_SMTP_HOST') || define('CONTACT_SMTP_HOST', getenv('HIMMP_SMTP_HOST') ?: '');
defined('CONTACT_SMTP_PORT') || define('CONTACT_SMTP_PORT', (int) (getenv('HIMMP_SMTP_PORT') ?: 587));
defined('CONTACT_SMTP_USERNAME') || define('CONTACT_SMTP_USERNAME', getenv('HIMMP_SMTP_USERNAME') ?: '');
defined('CONTACT_SMTP_PASSWORD') || define('CONTACT_SMTP_PASSWORD', getenv('HIMMP_SMTP_PASSWORD') ?: '');
defined('CONTACT_SMTP_SECURITY') || define('CONTACT_SMTP_SECURITY', getenv('HIMMP_SMTP_SECURITY') ?: 'tls'); // tls, ssl, or none
defined('CONTACT_SMTP_TIMEOUT') || define('CONTACT_SMTP_TIMEOUT', (int) (getenv('HIMMP_SMTP_TIMEOUT') ?: 15));

// Rate limiting settings (submissions per IP per hour)
defined('RATE_LIMIT_SUBMISSIONS') || define('RATE_LIMIT_SUBMISSIONS', 5);
defined('RATE_LIMIT_WINDOW') || define('RATE_LIMIT_WINDOW', 3600); // 1 hour in seconds

// CSRF token settings
defined('CSRF_TOKEN_NAME') || define('CSRF_TOKEN_NAME', 'himmp_csrf_token');
defined('CSRF_TOKEN_EXPIRY') || define('CSRF_TOKEN_EXPIRY', 7200); // 2 hours in seconds
defined('SESSION_COOKIE_SECURE') || define('SESSION_COOKIE_SECURE', true);

// Logging directory
defined('SUBMISSIONS_DIR') || define('SUBMISSIONS_DIR', __DIR__ . '/contact_submissions');

// Ensure submissions directory exists
if (!is_dir(SUBMISSIONS_DIR)) {
    if (!@mkdir(SUBMISSIONS_DIR, 0700, true) && !is_dir(SUBMISSIONS_DIR)) {
        throw new RuntimeException('Contact submissions directory could not be created.');
    }
}
if (!chmod(SUBMISSIONS_DIR, 0700)) {
    throw new RuntimeException('Contact submissions directory permissions could not be secured.');
}

// Session settings for CSRF protection
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => SESSION_COOKIE_SECURE,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}
