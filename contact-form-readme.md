# Contact Form Documentation

## Overview

The contact form has been updated to ensure users always receive feedback on their submissions, even if the email delivery fails. This document explains how the system works and how to troubleshoot any issues.

## How It Works

1. When a user submits the contact form, their submission is:
   - Validated for required fields and proper email format
   - Attempted to be sent via email to the recipient (j.herbst@hud.ac.uk)
   - Saved as a backup text file in the `contact_submissions` directory
   - The user always receives a success message, even if email delivery fails

2. The system logs all activity to the server's error log, including:
   - Form submissions received
   - Email sending success/failure
   - Backup file creation success/failure
   - Detailed server information for troubleshooting

## Server Configuration Check

A diagnostic script has been created to help identify server configuration issues:

1. **Run the Server Check Script**
   - Access `server-check.php` in your web browser (e.g., https://yoursite.com/server-check.php)
   - This script will test email functionality and file system permissions
   - It will provide detailed information about your server configuration
   - Follow the recommendations provided by the script

2. **What the Script Checks**
   - PHP configuration and version
   - Mail function availability
   - Directory permissions
   - Ability to send test emails
   - Ability to create backup files

## Checking Form Submissions

### Email Delivery

If the server's mail function is working correctly, all submissions will be delivered to j.herbst@hud.ac.uk.

### Backup Files

All submissions are also saved as text files in the `contact_submissions` directory, with filenames in this format:
```
contact_YYYY-MM-DD_HH-MM-SS_FirstName_LastName.txt
```

These files contain all the submission details and serve as a backup in case email delivery fails.

## Troubleshooting

### If Emails Are Not Being Received

1. **Run the Server Check Script First**
   - This will identify most common issues automatically
   - Follow the recommendations provided

2. **Check Server Mail Configuration**
   - Verify that the PHP `mail()` function is enabled on your server
   - Check if your hosting provider allows sending emails via PHP
   - Review server error logs for mail-related errors

3. **Check Backup Files**
   - Look in the `contact_submissions` directory for backup files
   - If this directory doesn't exist, create it manually and set permissions to 755 or 777
   - These files contain all submissions, even if email delivery failed

4. **Server Error Logs**
   - The system logs detailed information about each submission
   - Check your server's error log for entries containing "Form submission received" or "Mail sent result"

### Common Issues

1. **PHP mail() Function Not Available**
   - Some hosting providers disable the PHP mail() function
   - Solution: Consider implementing a third-party email service like PHPMailer, SendGrid, or Mailgun

2. **Emails Being Marked as Spam**
   - Emails sent via PHP mail() may be flagged as spam
   - Solution: Configure proper SPF and DKIM records for your domain

3. **Permission Issues with Backup Directory**
   - If the script cannot create or write to the `contact_submissions` directory
   - Solution: Create the directory manually and set permissions to 755 or 777
   - Command: `mkdir contact_submissions && chmod 777 contact_submissions`

4. **Server Path Issues**
   - The script now uses absolute paths to avoid path-related issues
   - If problems persist, check the server logs for the exact paths being used

## Manual Directory Creation

If the backup directory isn't being created automatically, create it manually:

1. **Via FTP or File Manager**
   - Navigate to the website root directory
   - Create a new folder named `contact_submissions`
   - Set permissions to 755 or 777 (depending on server security)

2. **Via SSH (if available)**
   ```
   cd /path/to/website/root
   mkdir contact_submissions
   chmod 777 contact_submissions
   ```

## PHPMailer Installation and Configuration

We've provided tools to easily implement PHPMailer for more reliable email delivery:

1. **Use the Installation Helper**
   - Access `install-phpmailer.php` in your web browser
   - This script will guide you through installing PHPMailer and configuring SMTP settings
   - It provides a user-friendly interface for setting up your email credentials

2. **Installation Methods**
   - **Composer (Recommended)**: Run `composer require phpmailer/phpmailer` in your website root directory
   - **Manual**: Download PHPMailer from GitHub and upload to your server

3. **SMTP Configuration**
   - You'll need SMTP credentials from an email provider (Gmail, Outlook, SendGrid, etc.)
   - For Gmail, you may need to create an "App Password" instead of using your regular password
   - The installation helper will update your contact-handler.php file automatically

4. **Testing**
   - After installation and configuration, submit a test message through the contact form
   - Check both the recipient inbox and spam folder
   - The server logs will contain detailed information about the email sending process

## Other Email Service Options

If you prefer not to use PHPMailer, consider these alternatives:

1. **SendGrid, Mailgun, or other API-based services**
   - More reliable email delivery than PHP's mail() function
   - Provides delivery tracking and analytics
   - Requires API key and account setup
   - May require additional PHP libraries or code changes

## Contact

If you need assistance with the contact form, please reach out to the developer who implemented these changes.
