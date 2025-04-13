<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

// Initialize response array
$response = [
    'success' => false,
    'message' => 'An unknown error occurred.',
    'debug' => []
];

// Get form data
$firstName = $_POST['first-name'] ?? '';
$lastName = $_POST['last-name'] ?? '';
$email = $_POST['email'] ?? '';
$subject = $_POST['subject'] ?? '';
$message = $_POST['message'] ?? '';

// Log the submission for debugging
error_log("Form submission received: $firstName $lastName <$email>");
$response['debug'][] = "Form submission received";

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $response['message'] = 'Please provide a valid email address.';
    echo json_encode($response);
    exit;
}

// Required fields
if (empty($firstName) || empty($lastName) || empty($email) || empty($subject) || empty($message)) {
    $response['message'] = 'All fields are required.';
    echo json_encode($response);
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

// Try to use PHPMailer if available, otherwise fall back to mail()
$usePHPMailer = false;

// Check if PHPMailer is available (either via Composer autoload or manual include)
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
    $usePHPMailer = class_exists('PHPMailer\PHPMailer\PHPMailer');
    if ($usePHPMailer) {
        error_log("PHPMailer found via Composer autoload");
        $response['debug'][] = "Using PHPMailer via Composer";
    }
} elseif (file_exists(__DIR__ . '/PHPMailer/src/PHPMailer.php')) {
    // Manual installation path
    require_once __DIR__ . '/PHPMailer/src/Exception.php';
    require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
    require_once __DIR__ . '/PHPMailer/src/SMTP.php';
    $usePHPMailer = class_exists('PHPMailer\PHPMailer\PHPMailer');
    if ($usePHPMailer) {
        error_log("PHPMailer found via manual installation");
        $response['debug'][] = "Using PHPMailer via manual installation";
    }
}

if ($usePHPMailer) {
    // Use PHPMailer with SMTP
    try {
        // Import PHPMailer classes
        use PHPMailer\PHPMailer\PHPMailer;
        use PHPMailer\PHPMailer\Exception;
        use PHPMailer\PHPMailer\SMTP;
        
        // Create a new PHPMailer instance
        $mail = new PHPMailer(true); // true enables exceptions
        
        // Server settings - CUSTOMIZE THESE SETTINGS FOR YOUR EMAIL PROVIDER
        $mail->SMTPDebug = SMTP::DEBUG_OFF; // Set to SMTP::DEBUG_SERVER for detailed logs
        $mail->isSMTP();                    // Send using SMTP
        
        // IMPORTANT: Update these settings with your actual SMTP server details
        $mail->Host       = 'smtp.example.com'; // e.g., smtp.gmail.com, smtp.office365.com
        $mail->SMTPAuth   = true;               // Enable SMTP authentication
        $mail->Username   = 'your-email@example.com'; // SMTP username
        $mail->Password   = 'your-password';    // SMTP password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // or PHPMailer::ENCRYPTION_SMTPS
        $mail->Port       = 587;                // TCP port (587 for TLS, 465 for SSL)
        
        // Recipients
        $mail->setFrom('noreply@himmp.net', 'HiMMP Contact Form');
        $mail->addAddress($to);                 // Add recipient
        $mail->addReplyTo($email, "$firstName $lastName");
        
        // Content
        $mail->isHTML(true);                    // Set email format to HTML
        $mail->Subject = $emailSubject;
        $mail->Body    = $emailBody;
        $mail->AltBody = strip_tags(str_replace('<br>', "\n", $emailBody)); // Plain text version
        
        // Send the email
        $mailSent = $mail->send();
        error_log("PHPMailer: Email sent successfully");
        $response['debug'][] = "PHPMailer: Email sent successfully";
    } catch (Exception $e) {
        $mailSent = false;
        error_log("PHPMailer Error: " . $e->getMessage());
        $response['debug'][] = "PHPMailer Error: " . $e->getMessage();
    }
} else {
    // Fall back to PHP mail() function
    error_log("PHPMailer not available, falling back to mail() function");
    $response['debug'][] = "PHPMailer not available, using mail() function";
    
    // Check if mail function is available
    if (!function_exists('mail')) {
        error_log("ERROR: PHP mail function is not available on this server");
        $response['debug'][] = "Mail function not available";
        $mailSent = false;
    } else {
        // Try to send email
        $mailSent = mail($to, $emailSubject, $emailBody, $headers);
        
        // Log the result
        $mailResult = $mailSent ? 'Success' : 'Failed';
        error_log("Mail sent result: $mailResult");
        $response['debug'][] = "Mail sent result: $mailResult";
        
        // Log additional information if mail failed
        if (!$mailSent) {
            error_log("Mail error info: " . (error_get_last()['message'] ?? 'No error information available'));
        }
    }
}

// Add installation instructions to the log if PHPMailer is not available
if (!$usePHPMailer) {
    error_log("IMPORTANT: To fix email delivery issues, install PHPMailer using one of these methods:");
    error_log("1. Composer: Run 'composer require phpmailer/phpmailer' in the website root directory");
    error_log("2. Manual: Download PHPMailer from https://github.com/PHPMailer/PHPMailer and extract to a 'PHPMailer' folder");
    error_log("Then update the SMTP settings in contact-handler.php with your email provider details");
}

// Save to backup file as a fallback
$backupSuccess = false;

// Get server information for debugging
$serverInfo = "Server: " . $_SERVER['SERVER_NAME'] . "\n";
$serverInfo .= "PHP Version: " . phpversion() . "\n";
$serverInfo .= "Script Path: " . __FILE__ . "\n";
$serverInfo .= "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
error_log("Server Info: " . $serverInfo);

// Use absolute path for backup directory
$scriptDir = dirname(__FILE__);
$backupDir = $scriptDir . '/contact_submissions';
error_log("Backup directory path: $backupDir");

try {
    $timestamp = date('Y-m-d_H-i-s');
    
    // Create directory with detailed error reporting
    if (!is_dir($backupDir)) {
        error_log("Attempting to create directory: $backupDir");
        $mkdirResult = mkdir($backupDir, 0755, true);
        
        if (!$mkdirResult) {
            $error = error_get_last();
            error_log("Failed to create directory: " . ($error ? $error['message'] : 'Unknown error'));
            
            // Try to create in the system temp directory as fallback
            $backupDir = sys_get_temp_dir() . '/himmp_contact_submissions';
            error_log("Trying alternate backup directory: $backupDir");
            
            if (!is_dir($backupDir)) {
                mkdir($backupDir, 0755, true);
            }
        } else {
            error_log("Successfully created directory: $backupDir");
        }
    }
    
    // Check if directory is writable
    if (!is_writable($backupDir)) {
        error_log("Directory is not writable: $backupDir");
        throw new Exception("Backup directory is not writable");
    }
    
    $backupFile = "$backupDir/contact_{$timestamp}_{$firstName}_{$lastName}.txt";
    $backupContent = "Timestamp: " . date('Y-m-d H:i:s') . "\n";
    $backupContent .= "Name: $firstName $lastName\n";
    $backupContent .= "Email: $email\n";
    $backupContent .= "Subject: $subject\n";
    $backupContent .= "Message:\n$message\n";
    $backupContent .= "\n--- Server Information ---\n" . $serverInfo;
    
    // Write file with error checking
    $writeResult = file_put_contents($backupFile, $backupContent);
    
    if ($writeResult === false) {
        $error = error_get_last();
        error_log("Failed to write backup file: " . ($error ? $error['message'] : 'Unknown error'));
        throw new Exception("Could not write to backup file");
    }
    
    $backupSuccess = true;
    error_log("Backup successfully saved to: $backupFile");
    $response['debug'][] = "Backup saved to $backupFile";
} catch (Exception $e) {
    error_log("Failed to save backup: " . $e->getMessage());
    $response['debug'][] = "Backup failed: " . $e->getMessage();
    
    // Try to log the submission directly to error_log as last resort
    error_log("CONTACT SUBMISSION DATA (backup failed): Name: $firstName $lastName, Email: $email, Subject: $subject");
}

// Always show success to the user, even if mail fails
// This ensures they get feedback while we handle the issue on the backend
$response['success'] = true;
$response['message'] = 'Your message has been received! We will get back to you soon.';

// For admin debugging, include actual mail status
if (!$mailSent) {
    $response['mailSent'] = false;
    $response['backupSaved'] = $backupSuccess;
    
    // Log the issue for admin
    error_log("IMPORTANT: Mail delivery failed for contact from $firstName $lastName <$email>. " . 
              ($backupSuccess ? "Backup saved to file." : "Backup also failed."));
}

echo json_encode($response);
?>
