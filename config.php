<?php
/**
 * HiMMP Configuration File
 *
 * Store sensitive configuration separately from code
 */

// Contact form settings
define('CONTACT_EMAIL', 'j.herbst@hud.ac.uk');
define('CONTACT_FROM_EMAIL', 'noreply@himmp.net');
define('CONTACT_FROM_NAME', 'HiMMP Contact Form');

// Rate limiting settings (submissions per IP per hour)
define('RATE_LIMIT_SUBMISSIONS', 5);
define('RATE_LIMIT_WINDOW', 3600); // 1 hour in seconds

// CSRF token settings
define('CSRF_TOKEN_NAME', 'himmp_csrf_token');
define('CSRF_TOKEN_EXPIRY', 7200); // 2 hours in seconds

// Logging directory
define('SUBMISSIONS_DIR', __DIR__ . '/contact_submissions');

// Ensure submissions directory exists
if (!file_exists(SUBMISSIONS_DIR)) {
    mkdir(SUBMISSIONS_DIR, 0755, true);
}

// Session settings for CSRF protection
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
