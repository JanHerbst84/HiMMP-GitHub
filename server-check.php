<?php
// Set content type to plain text for better readability in browser
header('Content-Type: text/plain');

echo "HiMMP Website Server Configuration Check\n";
echo "=======================================\n\n";
echo "Run Time: " . date('Y-m-d H:i:s') . "\n\n";

// Function to display test results
function displayResult($test, $result, $details = '') {
    echo str_pad($test . ': ', 40, ' ') . ($result ? 'PASS' : 'FAIL');
    if (!empty($details)) {
        echo " - $details";
    }
    echo "\n";
}

// Function to check if a directory is writable
function checkDirectoryWritable($dir, $create = true) {
    if (!file_exists($dir)) {
        if (!$create) {
            return [false, "Directory does not exist"];
        }
        
        // Try to create the directory
        $created = @mkdir($dir, 0755, true);
        if (!$created) {
            return [false, "Failed to create directory: " . error_get_last()['message']];
        }
    }
    
    if (!is_dir($dir)) {
        return [false, "Path exists but is not a directory"];
    }
    
    if (!is_writable($dir)) {
        return [false, "Directory is not writable"];
    }
    
    // Try to create a test file
    $testFile = $dir . '/test_' . time() . '.txt';
    $written = @file_put_contents($testFile, 'Test file');
    
    if ($written === false) {
        return [false, "Could not write test file to directory"];
    }
    
    // Clean up test file
    @unlink($testFile);
    
    return [true, "Directory is writable"];
}

// Function to check mail configuration
function checkMailConfiguration() {
    if (!function_exists('mail')) {
        return [false, "PHP mail() function is not available"];
    }
    
    // Check for sendmail path on Linux/Unix systems
    if (PHP_OS !== 'WINNT') {
        $sendmailPath = ini_get('sendmail_path');
        if (empty($sendmailPath)) {
            return [false, "sendmail_path is not set in PHP configuration"];
        }
        
        if (!file_exists($sendmailPath)) {
            return [false, "sendmail binary not found at: $sendmailPath"];
        }
    }
    
    return [true, "Mail function is available"];
}

// Function to check if a test email can be sent
function testSendEmail($to) {
    $subject = "HiMMP Contact Form Test - " . date('Y-m-d H:i:s');
    $message = "This is a test email from the HiMMP website server configuration check script.\n";
    $message .= "If you received this email, the mail function is working correctly.\n";
    $message .= "Server: " . $_SERVER['SERVER_NAME'] . "\n";
    $message .= "PHP Version: " . phpversion() . "\n";
    
    $headers = "From: HiMMP Contact Form <noreply@himmp.net>\r\n";
    $headers .= "Reply-To: noreply@himmp.net\r\n";
    
    $sent = @mail($to, $subject, $message, $headers);
    
    if (!$sent) {
        $error = error_get_last();
        $errorMsg = $error ? $error['message'] : 'Unknown error';
        return [false, "Failed to send test email: $errorMsg"];
    }
    
    return [true, "Test email sent to $to (check inbox and spam folder)"];
}

// SECTION 1: Server Information
echo "SERVER INFORMATION\n";
echo "------------------\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Operating System: " . PHP_OS . "\n";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
echo "Server Name: " . $_SERVER['SERVER_NAME'] . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Script Path: " . __FILE__ . "\n";
echo "Current Directory: " . getcwd() . "\n";
echo "Web Server User: " . (function_exists('posix_getpwuid') ? posix_getpwuid(posix_geteuid())['name'] : 'Unknown (Windows)') . "\n";
echo "\n";

// SECTION 2: PHP Configuration
echo "PHP CONFIGURATION\n";
echo "-----------------\n";
echo "max_execution_time: " . ini_get('max_execution_time') . " seconds\n";
echo "memory_limit: " . ini_get('memory_limit') . "\n";
echo "post_max_size: " . ini_get('post_max_size') . "\n";
echo "upload_max_filesize: " . ini_get('upload_max_filesize') . "\n";
echo "display_errors: " . (ini_get('display_errors') ? 'On' : 'Off') . "\n";
echo "error_reporting: " . ini_get('error_reporting') . "\n";
echo "error_log: " . ini_get('error_log') . "\n";
echo "allow_url_fopen: " . (ini_get('allow_url_fopen') ? 'On' : 'Off') . "\n";
echo "\n";

// SECTION 3: Mail Configuration
echo "MAIL CONFIGURATION\n";
echo "------------------\n";
echo "mail function: " . (function_exists('mail') ? 'Available' : 'Not available') . "\n";
echo "sendmail_path: " . ini_get('sendmail_path') . "\n";
echo "SMTP: " . ini_get('SMTP') . "\n";
echo "smtp_port: " . ini_get('smtp_port') . "\n";
echo "\n";

// SECTION 4: Directory Permissions
echo "DIRECTORY PERMISSIONS\n";
echo "--------------------\n";
$scriptDir = dirname(__FILE__);
echo "Script directory: $scriptDir\n";

// Check main directory permissions
list($mainDirWritable, $mainDirDetails) = checkDirectoryWritable($scriptDir, false);
displayResult("Main directory writable", $mainDirWritable, $mainDirDetails);

// Check contact_submissions directory
$contactSubmissionsDir = $scriptDir . '/contact_submissions';
list($submissionsDirWritable, $submissionsDirDetails) = checkDirectoryWritable($contactSubmissionsDir);
displayResult("contact_submissions directory", $submissionsDirWritable, $submissionsDirDetails);

// Check temp directory
$tempDir = sys_get_temp_dir();
list($tempDirWritable, $tempDirDetails) = checkDirectoryWritable($tempDir, false);
displayResult("Temp directory writable", $tempDirWritable, $tempDirDetails);

echo "\n";

// SECTION 5: Tests
echo "FUNCTIONALITY TESTS\n";
echo "------------------\n";

// Test mail configuration
list($mailConfigOk, $mailConfigDetails) = checkMailConfiguration();
displayResult("Mail configuration", $mailConfigOk, $mailConfigDetails);

// Test sending email
$testEmailTo = 'j.herbst@hud.ac.uk';
list($emailSent, $emailSentDetails) = testSendEmail($testEmailTo);
displayResult("Send test email", $emailSent, $emailSentDetails);

// Test file creation in contact_submissions
$testFile = $contactSubmissionsDir . '/test_submission_' . time() . '.txt';
$testContent = "Test submission\nTimestamp: " . date('Y-m-d H:i:s') . "\n";
$fileWritten = @file_put_contents($testFile, $testContent);
displayResult("Create test submission file", $fileWritten !== false, 
    $fileWritten !== false ? "File created: $testFile" : "Failed: " . error_get_last()['message']);

echo "\n";

// SECTION 6: Recommendations
echo "RECOMMENDATIONS\n";
echo "--------------\n";

if (!$mailConfigOk) {
    echo "- The mail function is not properly configured. Contact your hosting provider to enable it.\n";
    echo "- Consider using a third-party email library like PHPMailer with SMTP authentication.\n";
}

if (!$submissionsDirWritable) {
    echo "- Create the 'contact_submissions' directory manually and set permissions to 755 or 777.\n";
    echo "- Ensure the web server user has write permissions to this directory.\n";
}

if (!$emailSent) {
    echo "- Check server logs for more details about email sending failures.\n";
    echo "- Consider using a third-party email service like SendGrid, Mailgun, or AWS SES.\n";
}

echo "\nEnd of report.\n";
?>
