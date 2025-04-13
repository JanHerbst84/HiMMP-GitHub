<?php
/**
 * PHPMailer Implementation Example for HiMMP Contact Form
 * 
 * This file demonstrates how to replace the PHP mail() function with PHPMailer
 * for more reliable email delivery. To use this:
 * 
 * 1. Install PHPMailer via Composer: composer require phpmailer/phpmailer
 * 2. Replace the email sending code in contact-handler.php with this implementation
 * 3. Update the SMTP settings with your actual email provider details
 */

// Example of how to integrate this with contact-handler.php
// Replace the mail() function section with this code

/*
// Check if PHPMailer is available
if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
    error_log("ERROR: PHPMailer is not installed. Using fallback mail() function.");
    $response['debug'][] = "PHPMailer not available, using fallback";
    
    // Fallback to regular mail function
    $mailSent = mail($to, $emailSubject, $emailBody, $headers);
} else {
    // Use PHPMailer
    try {
        // Include PHPMailer autoloader if not using Composer
        // require 'path/to/PHPMailer/src/Exception.php';
        // require 'path/to/PHPMailer/src/PHPMailer.php';
        // require 'path/to/PHPMailer/src/SMTP.php';
        
        // Import PHPMailer classes
        use PHPMailer\PHPMailer\PHPMailer;
        use PHPMailer\PHPMailer\Exception;
        use PHPMailer\PHPMailer\SMTP;
        
        // Create a new PHPMailer instance
        $mail = new PHPMailer(true); // true enables exceptions
        
        // Server settings
        $mail->SMTPDebug = SMTP::DEBUG_OFF; // Enable verbose debug output (SMTP::DEBUG_SERVER for detailed logs)
        $mail->isSMTP();                     // Send using SMTP
        $mail->Host       = 'smtp.example.com'; // SMTP server address
        $mail->SMTPAuth   = true;            // Enable SMTP authentication
        $mail->Username   = 'your-email@example.com'; // SMTP username
        $mail->Password   = 'your-password'; // SMTP password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Enable TLS encryption
        $mail->Port       = 587;             // TCP port to connect to (587 for TLS, 465 for SSL)
        
        // Recipients
        $mail->setFrom('noreply@himmp.net', 'HiMMP Contact Form');
        $mail->addAddress($to);              // Add a recipient
        $mail->addReplyTo($email, "$firstName $lastName");
        
        // Content
        $mail->isHTML(true);                 // Set email format to HTML
        $mail->Subject = $emailSubject;
        $mail->Body    = $emailBody;
        $mail->AltBody = strip_tags(str_replace('<br>', "\n", $emailBody)); // Plain text version
        
        // Send the email
        $mailSent = $mail->send();
        error_log("PHPMailer: Email sent successfully");
        $response['debug'][] = "PHPMailer: Email sent successfully";
    } catch (Exception $e) {
        $mailSent = false;
        error_log("PHPMailer Error: " . $mail->ErrorInfo);
        $response['debug'][] = "PHPMailer Error: " . $mail->ErrorInfo;
    }
}
*/

// Standalone example of using PHPMailer
// This is a complete working example you can test separately

// Include Composer's autoloader
// require 'vendor/autoload.php';

// Import PHPMailer classes
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

// Function to send email using PHPMailer
function sendEmailWithPHPMailer($to, $fromEmail, $fromName, $replyToEmail, $replyToName, $subject, $htmlBody) {
    try {
        // Create a new PHPMailer instance
        $mail = new PHPMailer(true);
        
        // Server settings
        $mail->SMTPDebug = SMTP::DEBUG_SERVER; // Enable verbose debug output
        $mail->isSMTP();                       // Send using SMTP
        $mail->Host       = 'smtp.example.com'; // SMTP server
        $mail->SMTPAuth   = true;              // Enable SMTP authentication
        $mail->Username   = 'your-email@example.com'; // SMTP username
        $mail->Password   = 'your-password';   // SMTP password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Enable TLS
        $mail->Port       = 587;               // TCP port (587 for TLS)
        
        // Recipients
        $mail->setFrom($fromEmail, $fromName);
        $mail->addAddress($to);                // Add recipient
        $mail->addReplyTo($replyToEmail, $replyToName);
        
        // Content
        $mail->isHTML(true);                   // Set email format to HTML
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        $mail->AltBody = strip_tags(str_replace('<br>', "\n", $htmlBody));
        
        // Send the email
        $mail->send();
        return [true, "Email sent successfully"];
    } catch (Exception $e) {
        return [false, "Email could not be sent. Mailer Error: {$mail->ErrorInfo}"];
    }
}

// Example usage
if (isset($_GET['test']) && $_GET['test'] == 1) {
    // This is just for testing - remove in production
    header('Content-Type: text/plain');
    
    echo "PHPMailer Test Script\n";
    echo "====================\n\n";
    
    // Check if PHPMailer is installed
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        echo "ERROR: PHPMailer is not installed.\n";
        echo "Please install it using Composer: composer require phpmailer/phpmailer\n";
        exit;
    }
    
    // Test parameters
    $to = 'j.herbst@hud.ac.uk';
    $fromEmail = 'noreply@himmp.net';
    $fromName = 'HiMMP Contact Form';
    $replyToEmail = 'test@example.com';
    $replyToName = 'Test User';
    $subject = 'PHPMailer Test from HiMMP Contact Form';
    $htmlBody = "
    <html>
    <head>
        <title>PHPMailer Test</title>
    </head>
    <body>
        <h2>PHPMailer Test Email</h2>
        <p>This is a test email sent using PHPMailer from the HiMMP website.</p>
        <p>If you received this email, PHPMailer is working correctly!</p>
        <p><strong>Server:</strong> {$_SERVER['SERVER_NAME']}</p>
        <p><strong>Time:</strong> " . date('Y-m-d H:i:s') . "</p>
    </body>
    </html>
    ";
    
    // Send test email
    list($success, $message) = sendEmailWithPHPMailer(
        $to, $fromEmail, $fromName, $replyToEmail, $replyToName, $subject, $htmlBody
    );
    
    // Output result
    echo "Result: " . ($success ? "SUCCESS" : "FAILED") . "\n";
    echo "Message: $message\n\n";
    
    echo "Note: Before using this in production, you need to:\n";
    echo "1. Install PHPMailer via Composer\n";
    echo "2. Update the SMTP settings with your actual email provider details\n";
    echo "3. Integrate this code into contact-handler.php\n";
}

// Instructions for integration
echo "<!-- 
PHPMailer Integration Instructions:

1. Install PHPMailer:
   - Run: composer require phpmailer/phpmailer
   - Or download from: https://github.com/PHPMailer/PHPMailer

2. Update SMTP Settings:
   - Replace smtp.example.com with your SMTP server
   - Update username and password with your credentials
   - Adjust port and encryption as needed for your provider

3. Integration:
   - Copy the code from this file into contact-handler.php
   - Replace the mail() function with the PHPMailer implementation
   - Test thoroughly before deploying to production

Common SMTP Providers:
- Gmail: smtp.gmail.com (Port 587, TLS)
- Outlook/Office 365: smtp.office365.com (Port 587, TLS)
- SendGrid: smtp.sendgrid.net (Port 587, TLS)
- Mailgun: smtp.mailgun.org (Port 587, TLS)

Note: For Gmail and some other providers, you may need to:
- Enable "Less secure apps" or
- Use an "App Password" instead of your regular password
-->";
?>
