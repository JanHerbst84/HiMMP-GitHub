<?php
/**
 * HiMMP Contact Form - Create Submissions Directory
 * 
 * This script creates the contact_submissions directory with the correct permissions.
 * Run this script on your server if the contact form is not creating the directory automatically.
 */

// Set content type to plain text for better readability in browser
header('Content-Type: text/plain');

echo "HiMMP Contact Form - Create Submissions Directory\n";
echo "===============================================\n\n";
echo "Run Time: " . date('Y-m-d H:i:s') . "\n\n";

// Get the script directory
$scriptDir = dirname(__FILE__);
$submissionsDir = $scriptDir . '/contact_submissions';

echo "Script directory: $scriptDir\n";
echo "Submissions directory: $submissionsDir\n\n";

// Check if directory already exists
if (is_dir($submissionsDir)) {
    echo "Status: The contact_submissions directory already exists.\n\n";
    
    // Check if it's writable
    if (is_writable($submissionsDir)) {
        echo "Permissions: The directory is writable. ✓\n";
    } else {
        echo "Permissions: The directory is NOT writable. ✗\n";
        echo "Attempting to set permissions to 0755...\n";
        
        $chmodResult = @chmod($submissionsDir, 0755);
        if ($chmodResult) {
            echo "Successfully set permissions to 0755. ✓\n";
        } else {
            echo "Failed to set permissions. ✗\n";
            echo "Please set permissions manually using FTP or file manager.\n";
        }
    }
} else {
    echo "Status: The contact_submissions directory does not exist.\n";
    echo "Attempting to create directory...\n";
    
    // Try to create the directory
    $mkdirResult = @mkdir($submissionsDir, 0755, true);
    
    if ($mkdirResult) {
        echo "Successfully created directory with permissions 0755. ✓\n";
        
        // Create a test file to verify write permissions
        $testFile = $submissionsDir . '/test_file.txt';
        $writeResult = @file_put_contents($testFile, 'This is a test file to verify write permissions.');
        
        if ($writeResult !== false) {
            echo "Successfully created test file. Directory is writable. ✓\n";
            // Clean up test file
            @unlink($testFile);
        } else {
            echo "Failed to create test file. Directory may not be writable. ✗\n";
            echo "Error: " . error_get_last()['message'] . "\n";
        }
    } else {
        echo "Failed to create directory. ✗\n";
        echo "Error: " . error_get_last()['message'] . "\n\n";
        echo "Alternative methods to create the directory:\n\n";
        
        echo "1. Using FTP or File Manager:\n";
        echo "   - Connect to your server using FTP or your hosting control panel's file manager\n";
        echo "   - Navigate to the website root directory\n";
        echo "   - Create a new folder named 'contact_submissions'\n";
        echo "   - Set permissions to 755 or 777\n\n";
        
        echo "2. Using SSH (if available):\n";
        echo "   ssh username@your-server\n";
        echo "   cd " . $scriptDir . "\n";
        echo "   mkdir contact_submissions\n";
        echo "   chmod 777 contact_submissions\n\n";
    }
}

// Try alternate location in system temp directory
if (!is_dir($submissionsDir) || !is_writable($submissionsDir)) {
    echo "\nTrying alternate location in system temp directory...\n";
    
    $tempDir = sys_get_temp_dir() . '/himmp_contact_submissions';
    echo "Alternate directory: $tempDir\n";
    
    if (!is_dir($tempDir)) {
        $mkdirResult = @mkdir($tempDir, 0755, true);
        if ($mkdirResult) {
            echo "Successfully created alternate directory. ✓\n";
        } else {
            echo "Failed to create alternate directory. ✗\n";
        }
    } else {
        echo "Alternate directory already exists. ✓\n";
    }
    
    if (is_dir($tempDir) && is_writable($tempDir)) {
        echo "Alternate directory is writable. ✓\n";
        echo "\nTo use this alternate directory, update the \$backupDir variable in contact-handler.php to:\n";
        echo "\$backupDir = '" . addslashes($tempDir) . "';\n";
    }
}

echo "\n";
echo "Server Information:\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Operating System: " . PHP_OS . "\n";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
echo "User: " . (function_exists('posix_getpwuid') ? posix_getpwuid(posix_geteuid())['name'] : 'Unknown (Windows)') . "\n";

echo "\n";
echo "If you continue to have issues, please check the server-check.php script for more detailed diagnostics.\n";
?>
