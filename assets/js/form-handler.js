/**
 * HiMMP - Heaviness in Metal Music Production
 * Contact Form Handler
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize form validation and submission
    initializeContactForm();
});

/**
 * Sets up contact form validation and submission
 */
function initializeContactForm() {
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;
    
    // Add validation on input fields
    setupFormValidation(contactForm);
    
    // Handle form submission
    contactForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Validate form before submission
        if (!validateForm(contactForm)) {
            return;
        }
        
        // Show loading state
        setFormLoadingState(contactForm, true);
        
        // Collect form data
        const formData = new FormData(contactForm);
        const formObject = {};
        
        formData.forEach((value, key) => {
            formObject[key] = value;
        });
        
        // Form submission options
        // Option 1: Email service (Formspree, EmailJS, etc.)
        submitViaEmailService(formObject, contactForm);
        
        // Option 2: Server endpoint (if you have one)
        // submitToServer(formObject, contactForm);
        
        // Option 3: Netlify Forms (if hosted on Netlify)
        // submitToNetlify(contactForm);
    });
}

/**
 * Sets up form field validation
 */
function setupFormValidation(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        // Add validation on blur
        input.addEventListener('blur', function() {
            validateField(input);
        });
        
        // Clear error on input
        input.addEventListener('input', function() {
            // If there was an error, revalidate on input
            if (input.classList.contains('invalid')) {
                validateField(input);
            }
        });
    });
}

/**
 * Validates the entire form
 * @returns {boolean} True if form is valid
 */
function validateForm(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * Validates a single form field
 * @returns {boolean} True if field is valid
 */
function validateField(field) {
    // Skip fields without validation requirements
    if (!field.hasAttribute('required') && !field.getAttribute('pattern')) {
        return true;
    }
    
    let isValid = true;
    let errorMessage = '';
    
    // Check if empty but required
    if (field.hasAttribute('required') && !field.value.trim()) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    // Email validation
    else if (field.type === 'email' && field.value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(field.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }
    // Pattern validation
    else if (field.getAttribute('pattern') && field.value) {
        const pattern = new RegExp(field.getAttribute('pattern'));
        if (!pattern.test(field.value)) {
            isValid = false;
            errorMessage = field.getAttribute('data-error') || 'Please enter a valid value';
        }
    }
    
    // Update field status
    if (isValid) {
        field.classList.remove('invalid');
        field.classList.add('valid');
        
        // Remove error message if it exists
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    } else {
        field.classList.remove('valid');
        field.classList.add('invalid');
        
        // Add or update error message
        let errorElement = field.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.classList.add('error-message');
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = errorMessage;
    }
    
    return isValid;
}

/**
 * Sets the form loading state during submission
 */
function setFormLoadingState(form, isLoading) {
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (isLoading) {
        // Disable inputs
        form.querySelectorAll('input, textarea, select, button').forEach(el => {
            el.setAttribute('disabled', 'disabled');
        });
        
        // Update button text
        if (submitButton) {
            submitButton.dataset.originalText = submitButton.textContent;
            submitButton.textContent = 'Sending...';
        }
        
        // Add loading class to form
        form.classList.add('loading');
    } else {
        // Re-enable inputs
        form.querySelectorAll('input, textarea, select, button').forEach(el => {
            el.removeAttribute('disabled');
        });
        
        // Restore button text
        if (submitButton && submitButton.dataset.originalText) {
            submitButton.textContent = submitButton.dataset.originalText;
        }
        
        // Remove loading class
        form.classList.remove('loading');
    }
}

/**
 * Shows a submission result message
 */
function showSubmissionResult(form, isSuccess, message) {
    // Remove any existing message
    const existingMessage = form.querySelector('.submission-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.classList.add('submission-message');
    messageElement.classList.add(isSuccess ? 'success' : 'error');
    messageElement.textContent = message;
    
    // Insert after form
    form.parentNode.insertBefore(messageElement, form.nextSibling);
    
    // Scroll to message
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // If success, reset the form
    if (isSuccess) {
        form.reset();
        form.querySelectorAll('.valid').forEach(el => {
            el.classList.remove('valid');
        });
    }
}

/**
 * Submit form via email service like Formspree or EmailJS
 */
function submitViaEmailService(formData, form) {
    // Example using Formspree (replace with your form endpoint)
    const formspreeEndpoint = 'https://formspree.io/f/your-form-id';
    
    fetch(formspreeEndpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Success
        setFormLoadingState(form, false);
        showSubmissionResult(
            form, 
            true, 
            'Thank you for your message! We will get back to you soon.'
        );
    })
    .catch(error => {
        // Error
        console.error('Form submission error:', error);
        setFormLoadingState(form, false);
        showSubmissionResult(
            form, 
            false, 
            'There was a problem submitting your form. Please try again or contact us directly.'
        );
    });
}

/**
 * Submit form to a custom server endpoint
 */
function submitToServer(formData, form) {
    // Replace with your server endpoint
    const serverEndpoint = '/api/contact';
    
    fetch(serverEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        setFormLoadingState(form, false);
        
        if (data.success) {
            showSubmissionResult(
                form, 
                true, 
                'Thank you for your message! We will get back to you soon.'
            );
        } else {
            showSubmissionResult(
                form, 
                false, 
                data.message || 'There was a problem submitting your form. Please try again.'
            );
        }
    })
    .catch(error => {
        console.error('Form submission error:', error);
        setFormLoadingState(form, false);
        showSubmissionResult(
            form, 
            false, 
            'There was a problem submitting your form. Please try again or contact us directly.'
        );
    });
}

/**
 * Submit via Netlify Forms (if hosted on Netlify)
 */
function submitToNetlify(form) {
    // For Netlify forms, the form needs 'data-netlify="true"' attribute
    // and Netlify handles the submission automatically
    
    // Simulate submission for demonstration
    setTimeout(() => {
        setFormLoadingState(form, false);
        showSubmissionResult(
            form, 
            true, 
            'Thank you for your message! We will get back to you soon.'
        );
    }, 1500);
}