<?php
/**
 * CSRF Token Generator
 *
 * Returns a CSRF token for use in the contact form
 */

require_once 'config.php';

header('Content-Type: application/json');

// Generate CSRF token if it doesn't exist
if (!isset($_SESSION[CSRF_TOKEN_NAME])) {
    $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
    $_SESSION[CSRF_TOKEN_NAME . '_time'] = time();
}

echo json_encode([
    'token' => $_SESSION[CSRF_TOKEN_NAME]
]);
