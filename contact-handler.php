<?php
/**
 * HiMMP Contact Form Handler
 *
 * Secure form submission handler with CSRF protection, rate limiting, and logging
 */

require_once 'config.php';

// Set headers for JSON response
header('Content-Type: application/json');

// Initialize response array
$response = [
    'success' => false,
    'message' => 'An error occurred processing your submission.'
];

// Check if form was submitted
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Invalid request method.';
    echo json_encode($response);
    exit;
}

// Verify CSRF token
if (!validateCSRFToken()) {
    $response['message'] = 'Security validation failed. Please refresh the page and try again.';
    echo json_encode($response);
    exit;
}

// Check rate limiting
if (!checkRateLimit()) {
    $response['message'] = 'Too many submissions. Please try again later.';
    echo json_encode($response);
    exit;
}

// Get and sanitize form data (PHP 8.1+ compatible)
$name = trim(filter_input(INPUT_POST, 'name', FILTER_UNSAFE_RAW) ?? '');
$email = trim(filter_input(INPUT_POST, 'email', FILTER_UNSAFE_RAW) ?? '');
$subject = trim(filter_input(INPUT_POST, 'subject', FILTER_UNSAFE_RAW) ?? '');
$message = trim(filter_input(INPUT_POST, 'message', FILTER_UNSAFE_RAW) ?? '');

// Sanitize strings (replace deprecated FILTER_SANITIZE_STRING)
$name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$subject = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

// Validate email separately
$email = filter_var($email, FILTER_SANITIZE_EMAIL);

// Validate form data
$errors = [];

if (empty($name) || strlen($name) < 2) {
    $errors[] = 'Name is required and must be at least 2 characters.';
}

if (strlen($name) > 100) {
    $errors[] = 'Name must be less than 100 characters.';
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'A valid email address is required.';
}

if (empty($subject) || strlen($subject) < 3) {
    $errors[] = 'Subject is required and must be at least 3 characters.';
}

if (strlen($subject) > 200) {
    $errors[] = 'Subject must be less than 200 characters.';
}

if (empty($message) || strlen($message) < 10) {
    $errors[] = 'Message is required and must be at least 10 characters.';
}

if (strlen($message) > 5000) {
    $errors[] = 'Message must be less than 5000 characters.';
}

// Check for spam patterns
if (containsSpamPatterns($message) || containsSpamPatterns($subject)) {
    $errors[] = 'Your message appears to contain spam content.';
}

// If there are validation errors, return them
if (!empty($errors)) {
    $response['message'] = 'Please correct the following errors: ' . implode(' ', $errors);
    echo json_encode($response);
    exit;
}

// Log submission to file (backup in case email fails)
$submission_logged = logSubmission($name, $email, $subject, $message);

// Prepare email
$to = CONTACT_EMAIL;
$email_subject = "HiMMP Contact Form: " . $subject;

// Prepare headers (prevent header injection)
$headers = "From: " . CONTACT_FROM_NAME . " <" . CONTACT_FROM_EMAIL . ">\r\n";
$headers .= "Reply-To: " . str_replace(["\r", "\n"], '', $email) . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

// Prepare email message
$email_message = generateEmailHTML($name, $email, $subject, $message);

// Send email
$mail_sent = mail($to, $email_subject, $email_message, $headers);

// Check if mail was sent
if ($mail_sent) {
    $response['success'] = true;
    $response['message'] = 'Thank you for your message! We will get back to you soon.';
    recordRateLimitAttempt(); // Only count successful submissions
} else {
    $response['message'] = 'There was a problem sending your message. ' .
                          ($submission_logged ? 'However, your submission has been logged and we will review it.' : 'Please try again or contact us directly at ' . CONTACT_EMAIL . '.');
}

// Return response as JSON
echo json_encode($response);
exit;

/**
 * Validates CSRF token
 */
function validateCSRFToken() {
    $token = $_POST['csrf_token'] ?? '';

    if (empty($token)) {
        return false;
    }

    if (!isset($_SESSION[CSRF_TOKEN_NAME]) || !isset($_SESSION[CSRF_TOKEN_NAME . '_time'])) {
        return false;
    }

    // Check if token has expired
    if (time() - $_SESSION[CSRF_TOKEN_NAME . '_time'] > CSRF_TOKEN_EXPIRY) {
        unset($_SESSION[CSRF_TOKEN_NAME]);
        unset($_SESSION[CSRF_TOKEN_NAME . '_time']);
        return false;
    }

    // Verify token matches
    if (!hash_equals($_SESSION[CSRF_TOKEN_NAME], $token)) {
        return false;
    }

    // Regenerate token after successful validation (one-time use)
    unset($_SESSION[CSRF_TOKEN_NAME]);
    unset($_SESSION[CSRF_TOKEN_NAME . '_time']);

    return true;
}

/**
 * Checks rate limiting based on IP address
 */
function checkRateLimit() {
    $ip = $_SERVER['REMOTE_ADDR'];
    $rate_limit_file = SUBMISSIONS_DIR . '/rate_limit_' . md5($ip) . '.json';

    if (!file_exists($rate_limit_file)) {
        return true;
    }

    $data = json_decode(file_get_contents($rate_limit_file), true);

    if (!$data || !isset($data['count']) || !isset($data['timestamp'])) {
        return true;
    }

    // Check if rate limit window has passed
    if (time() - $data['timestamp'] > RATE_LIMIT_WINDOW) {
        unlink($rate_limit_file);
        return true;
    }

    // Check if limit exceeded
    if ($data['count'] >= RATE_LIMIT_SUBMISSIONS) {
        return false;
    }

    return true;
}

/**
 * Records a rate limit attempt
 */
function recordRateLimitAttempt() {
    $ip = $_SERVER['REMOTE_ADDR'];
    $rate_limit_file = SUBMISSIONS_DIR . '/rate_limit_' . md5($ip) . '.json';

    $data = ['count' => 1, 'timestamp' => time()];

    if (file_exists($rate_limit_file)) {
        $existing_data = json_decode(file_get_contents($rate_limit_file), true);
        if ($existing_data && isset($existing_data['count'])) {
            $data['count'] = $existing_data['count'] + 1;
            $data['timestamp'] = $existing_data['timestamp'];
        }
    }

    file_put_contents($rate_limit_file, json_encode($data));
}

/**
 * Logs submission to file
 */
function logSubmission($name, $email, $subject, $message) {
    $timestamp = date('Y-m-d_H-i-s');
    $filename = SUBMISSIONS_DIR . '/submission_' . $timestamp . '_' . uniqid() . '.txt';

    $log_content = "=== HiMMP Contact Form Submission ===\n";
    $log_content .= "Date: " . date('Y-m-d H:i:s') . "\n";
    $log_content .= "IP Address: " . $_SERVER['REMOTE_ADDR'] . "\n";
    $log_content .= "User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown') . "\n";
    $log_content .= "\n--- Form Data ---\n";
    $log_content .= "Name: $name\n";
    $log_content .= "Email: $email\n";
    $log_content .= "Subject: $subject\n";
    $log_content .= "Message:\n$message\n";
    $log_content .= "\n=================================\n";

    return file_put_contents($filename, $log_content) !== false;
}

/**
 * Generates HTML email content
 */
function generateEmailHTML($name, $email, $subject, $message) {
    return "<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        h2 {
            color: #5DC69F;
            margin-top: 0;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
        }
        .contact-field {
            margin-bottom: 15px;
        }
        .field-name {
            font-weight: bold;
            color: #555;
        }
        .field-value {
            margin-top: 5px;
            padding: 10px;
            background-color: #f9f9f9;
            border-left: 3px solid #5DC69F;
        }
    </style>
</head>
<body>
    <div class='container'>
        <h2>HiMMP Contact Form Submission</h2>

        <div class='contact-field'>
            <div class='field-name'>Name:</div>
            <div class='field-value'>$name</div>
        </div>

        <div class='contact-field'>
            <div class='field-name'>Email:</div>
            <div class='field-value'>$email</div>
        </div>

        <div class='contact-field'>
            <div class='field-name'>Subject:</div>
            <div class='field-value'>$subject</div>
        </div>

        <div class='contact-field'>
            <div class='field-name'>Message:</div>
            <div class='field-value'>" . nl2br($message) . "</div>
        </div>

        <div class='footer'>
            This message was sent from the HiMMP website contact form.<br>
            IP Address: " . $_SERVER['REMOTE_ADDR'] . "<br>
            User Agent: " . htmlspecialchars($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown') . "<br>
            Date: " . date('Y-m-d H:i:s') . "
        </div>
    </div>
</body>
</html>";
}

/**
 * Checks for common spam patterns
 */
function containsSpamPatterns($text) {
    $spam_patterns = [
        '/\[url=/i',
        '/\[link=/i',
        '/<a\s+href/i',
        '/viagra|cialis|pharmacy/i',
        '/\b(earn|make)\s+\$\d+/i',
        '/click here now/i',
        '/limited time offer/i',
    ];

    foreach ($spam_patterns as $pattern) {
        if (preg_match($pattern, $text)) {
            return true;
        }
    }

    return false;
}
