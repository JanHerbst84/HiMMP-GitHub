<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

// Get form data
$firstName = $_POST['first-name'] ?? '';
$lastName = $_POST['last-name'] ?? '';
$email = $_POST['email'] ?? '';
$subject = $_POST['subject'] ?? '';
$message = $_POST['message'] ?? '';

// Log the submission for debugging
error_log("Form submission received: $firstName $lastName <$email>");

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'message' => 'Please provide a valid email address.'
    ]);
    exit;
}

// Required fields
if (empty($firstName) || empty($lastName) || empty($email) || empty($subject) || empty($message)) {
    echo json_encode([
        'success' => false,
        'message' => 'All fields are required.'
    ]);
    exit;
}

// Set email recipient
$to = 'j.herbst@hud.ac.uk'; // Change this to your actual recipient email

// Set email headers
$headers = "From: HiMMP Contact Form <noreply@himmp.net>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";

// Email content
$emailSubject = "HiMMP Contact: $subject";
$emailBody = "
<html>
<head>
    <title>New Contact Form Submission</title>
</head>
<body>
    <h2>New Contact Form Message</h2>
    <p><strong>Name:</strong> $firstName $lastName</p>
    <p><strong>Email:</strong> $email</p>
    <p><strong>Subject:</strong> $subject</p>
    <p><strong>Message:</strong></p>
    <p>" . nl2br(htmlspecialchars($message)) . "</p>
</body>
</html>
";

// Send email
$mailSent = mail($to, $emailSubject, $emailBody, $headers);

// Log the result
error_log("Mail sent result: " . ($mailSent ? 'Success' : 'Failed'));

if ($mailSent) {
    echo json_encode([
        'success' => true,
        'message' => 'Your message has been sent successfully! We will get back to you soon.'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'There was a problem sending your message. Please try again or contact us directly at j.herbst@hud.ac.uk.'
    ]);
}
?>