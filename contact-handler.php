<?php
/**
 * HiMMP Contact Form Handler
 * 
 * Processes form submissions from the contact page
 */

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

// Get form data
$name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);
$email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$subject = filter_input(INPUT_POST, 'subject', FILTER_SANITIZE_STRING);
$message = filter_input(INPUT_POST, 'message', FILTER_SANITIZE_STRING);

// Validate form data
$errors = [];

if (empty($name)) {
    $errors[] = 'Name is required.';
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'A valid email address is required.';
}

if (empty($subject)) {
    $errors[] = 'Subject is required.';
}

if (empty($message)) {
    $errors[] = 'Message is required.';
}

// If there are validation errors, return them
if (!empty($errors)) {
    $response['message'] = 'Please correct the following errors: ' . implode(' ', $errors);
    echo json_encode($response);
    exit;
}

// Prepare email
$to = 'j.herbst@hud.ac.uk'; // Primary recipient
$email_subject = "HiMMP Contact Form: $subject";

// Prepare headers
$headers = "From: HiMMP Contact Form <noreply@himmp.net>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";

// Prepare email message
$email_message = "
<!DOCTYPE html>
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
        }
    </style>
</head>
<body>
    <div class='container'>
        <h2>HiMMP Contact Form Submission</h2>
        
        <div class='contact-field'>
            <div class='field-name'>Name:</div>
            <div class='field-value'>".htmlspecialchars($name)."</div>
        </div>
        
        <div class='contact-field'>
            <div class='field-name'>Email:</div>
            <div class='field-value'>".htmlspecialchars($email)."</div>
        </div>
        
        <div class='contact-field'>
            <div class='field-name'>Subject:</div>
            <div class='field-value'>".htmlspecialchars($subject)."</div>
        </div>
        
        <div class='contact-field'>
            <div class='field-name'>Message:</div>
            <div class='field-value'>".nl2br(htmlspecialchars($message))."</div>
        </div>
        
        <div class='footer'>
            This message was sent from the HiMMP website contact form.<br>
            IP Address: ".$_SERVER['REMOTE_ADDR']."<br>
            Date: ".date('Y-m-d H:i:s')."
        </div>
    </div>
</body>
</html>
";

// Send email
$mail_sent = mail($to, $email_subject, $email_message, $headers);

// Check if mail was sent
if ($mail_sent) {
    $response['success'] = true;
    $response['message'] = 'Thank you for your message! We will get back to you soon.';
} else {
    $response['message'] = 'There was a problem sending your message. Please try again or contact us directly at j.herbst@hud.ac.uk.';
}

// Return response as JSON
echo json_encode($response);
exit;