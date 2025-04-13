<?php
/**
 * PHPMailer Installation and Configuration Script
 * 
 * This script helps install PHPMailer and configure it for the HiMMP contact form.
 * It provides two installation methods:
 * 1. Using Composer (recommended)
 * 2. Manual download and installation
 * 
 * After installation, it helps configure the SMTP settings.
 */

// Set content type to plain text for better readability in browser
header('Content-Type: text/plain');

echo "PHPMailer Installation and Configuration Script\n";
echo "=============================================\n\n";
echo "Run Time: " . date('Y-m-d H:i:s') . "\n\n";

// Function to check if PHPMailer is already installed
function checkPHPMailerInstallation() {
    $composerInstalled = file_exists(__DIR__ . '/vendor/autoload.php') && 
                        file_exists(__DIR__ . '/vendor/phpmailer/phpmailer');
    
    $manualInstalled = file_exists(__DIR__ . '/PHPMailer/src/PHPMailer.php');
    
    if ($composerInstalled) {
        return ['installed' => true, 'method' => 'composer'];
    } elseif ($manualInstalled) {
        return ['installed' => true, 'method' => 'manual'];
    } else {
        return ['installed' => false, 'method' => null];
    }
}

// Function to check if a directory is writable
function isDirectoryWritable($dir) {
    if (!file_exists($dir)) {
        return false;
    }
    
    if (!is_dir($dir)) {
        return false;
    }
    
    return is_writable($dir);
}

// Function to check if Composer is installed
function isComposerInstalled() {
    $output = null;
    $returnVar = null;
    
    exec('composer --version 2>&1', $output, $returnVar);
    
    return $returnVar === 0;
}

// Function to update contact-handler.php with SMTP settings
function updateContactHandler($smtpHost, $smtpUsername, $smtpPassword, $smtpPort, $smtpSecure) {
    $file = __DIR__ . '/contact-handler.php';
    
    if (!file_exists($file)) {
        return [false, "contact-handler.php not found"];
    }
    
    $content = file_get_contents($file);
    
    // Replace SMTP settings
    $content = preg_replace(
        '/\$mail->Host\s*=\s*\'[^\']*\';/',
        "\$mail->Host       = '$smtpHost';",
        $content
    );
    
    $content = preg_replace(
        '/\$mail->Username\s*=\s*\'[^\']*\';/',
        "\$mail->Username   = '$smtpUsername';",
        $content
    );
    
    $content = preg_replace(
        '/\$mail->Password\s*=\s*\'[^\']*\';/',
        "\$mail->Password   = '$smtpPassword';",
        $content
    );
    
    $content = preg_replace(
        '/\$mail->Port\s*=\s*\d+;/',
        "\$mail->Port       = $smtpPort;",
        $content
    );
    
    $content = preg_replace(
        '/\$mail->SMTPSecure\s*=\s*PHPMailer::ENCRYPTION_[^;]+;/',
        "\$mail->SMTPSecure = $smtpSecure;",
        $content
    );
    
    $result = file_put_contents($file, $content);
    
    if ($result === false) {
        return [false, "Failed to update contact-handler.php"];
    }
    
    return [true, "Successfully updated contact-handler.php with SMTP settings"];
}

// Check if PHPMailer is already installed
$phpmailerStatus = checkPHPMailerInstallation();

echo "CURRENT STATUS\n";
echo "--------------\n";
echo "PHPMailer installed: " . ($phpmailerStatus['installed'] ? "Yes" : "No") . "\n";
if ($phpmailerStatus['installed']) {
    echo "Installation method: " . $phpmailerStatus['method'] . "\n";
}
echo "Composer installed: " . (isComposerInstalled() ? "Yes" : "No") . "\n";
echo "Directory writable: " . (isDirectoryWritable(__DIR__) ? "Yes" : "No") . "\n\n";

// Installation options
if (!$phpmailerStatus['installed']) {
    echo "INSTALLATION OPTIONS\n";
    echo "-------------------\n";
    
    // Option 1: Composer installation
    echo "Option 1: Install via Composer (Recommended)\n";
    if (isComposerInstalled()) {
        echo "Composer is installed. You can run:\n";
        echo "composer require phpmailer/phpmailer\n\n";
    } else {
        echo "Composer is not installed. You can install it from: https://getcomposer.org/download/\n";
        echo "After installing Composer, run:\n";
        echo "composer require phpmailer/phpmailer\n\n";
    }
    
    // Option 2: Manual installation
    echo "Option 2: Manual Installation\n";
    echo "1. Download PHPMailer from: https://github.com/PHPMailer/PHPMailer/archive/refs/heads/master.zip\n";
    echo "2. Extract the zip file\n";
    echo "3. Rename the extracted folder to 'PHPMailer'\n";
    echo "4. Upload the 'PHPMailer' folder to your website root directory\n\n";
    
    echo "After installation, refresh this page to continue with configuration.\n\n";
} else {
    echo "CONFIGURATION\n";
    echo "-------------\n";
    echo "PHPMailer is already installed. You can now configure the SMTP settings.\n\n";
    
    // Check if this is a form submission
    if (isset($_POST['configure']) && $_POST['configure'] === 'yes') {
        // Get SMTP settings from form
        $smtpHost = $_POST['smtp_host'] ?? '';
        $smtpUsername = $_POST['smtp_username'] ?? '';
        $smtpPassword = $_POST['smtp_password'] ?? '';
        $smtpPort = (int)($_POST['smtp_port'] ?? 587);
        $smtpSecure = $_POST['smtp_secure'] === 'ssl' ? 
            'PHPMailer::ENCRYPTION_SMTPS' : 'PHPMailer::ENCRYPTION_STARTTLS';
        
        // Update contact-handler.php
        list($success, $message) = updateContactHandler(
            $smtpHost, $smtpUsername, $smtpPassword, $smtpPort, $smtpSecure
        );
        
        if ($success) {
            echo "SUCCESS: $message\n\n";
            echo "Your contact form is now configured to use PHPMailer with your SMTP settings.\n";
            echo "You can test it by submitting the contact form.\n\n";
        } else {
            echo "ERROR: $message\n\n";
            echo "Please update the SMTP settings manually in contact-handler.php.\n\n";
        }
    } else {
        // Display configuration form
        echo "To configure PHPMailer, please fill out the form below with your SMTP settings.\n\n";
        echo "Common SMTP Providers:\n";
        echo "- Gmail: smtp.gmail.com (Port 587, TLS or 465, SSL)\n";
        echo "  Note: For Gmail, you may need to use an App Password\n";
        echo "- Outlook/Office 365: smtp.office365.com (Port 587, TLS)\n";
        echo "- SendGrid: smtp.sendgrid.net (Port 587, TLS)\n";
        echo "- Mailgun: smtp.mailgun.org (Port 587, TLS)\n\n";
        
        echo "Please switch to HTML view to see the configuration form.\n";
    }
}

// Server information
echo "\nSERVER INFORMATION\n";
echo "------------------\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Operating System: " . PHP_OS . "\n";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
echo "Server Name: " . $_SERVER['SERVER_NAME'] . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Script Path: " . __FILE__ . "\n";

// HTML form for configuration
if ($phpmailerStatus['installed'] && !isset($_POST['configure'])) {
    header('Content-Type: text/html');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHPMailer Configuration</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input[type="text"],
        input[type="password"],
        input[type="number"],
        select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: #45a049;
        }
        .info {
            background-color: #f8f9fa;
            border-left: 4px solid #17a2b8;
            padding: 10px 15px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <h1>PHPMailer Configuration</h1>
    
    <div class="info">
        <p>PHPMailer is installed. Please configure your SMTP settings below.</p>
        <p>These settings will be saved to your contact-handler.php file.</p>
    </div>
    
    <form method="post" action="">
        <input type="hidden" name="configure" value="yes">
        
        <div class="form-group">
            <label for="smtp_host">SMTP Host:</label>
            <input type="text" id="smtp_host" name="smtp_host" placeholder="e.g., smtp.gmail.com" required>
        </div>
        
        <div class="form-group">
            <label for="smtp_username">SMTP Username:</label>
            <input type="text" id="smtp_username" name="smtp_username" placeholder="e.g., your-email@gmail.com" required>
        </div>
        
        <div class="form-group">
            <label for="smtp_password">SMTP Password:</label>
            <input type="password" id="smtp_password" name="smtp_password" placeholder="Your email password or app password" required>
        </div>
        
        <div class="form-group">
            <label for="smtp_port">SMTP Port:</label>
            <input type="number" id="smtp_port" name="smtp_port" value="587" required>
            <small>Common ports: 587 (TLS), 465 (SSL)</small>
        </div>
        
        <div class="form-group">
            <label for="smtp_secure">Encryption:</label>
            <select id="smtp_secure" name="smtp_secure">
                <option value="tls">TLS (Port 587)</option>
                <option value="ssl">SSL (Port 465)</option>
            </select>
        </div>
        
        <button type="submit">Save Configuration</button>
    </form>
    
    <div class="info" style="margin-top: 20px;">
        <h3>Common SMTP Providers:</h3>
        <ul>
            <li><strong>Gmail:</strong> smtp.gmail.com (Port 587, TLS or 465, SSL)<br>
                <small>Note: For Gmail, you may need to use an App Password. <a href="https://support.google.com/accounts/answer/185833" target="_blank">Learn more</a></small>
            </li>
            <li><strong>Outlook/Office 365:</strong> smtp.office365.com (Port 587, TLS)</li>
            <li><strong>SendGrid:</strong> smtp.sendgrid.net (Port 587, TLS)</li>
            <li><strong>Mailgun:</strong> smtp.mailgun.org (Port 587, TLS)</li>
        </ul>
    </div>
</body>
</html>
<?php
}
?>
