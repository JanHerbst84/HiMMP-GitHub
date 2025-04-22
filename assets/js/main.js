/**
 * HiMMP - Heaviness in Metal Music Production
 * Main JavaScript File
 */

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    setupMobileNavigation();
    
    // Smooth scrolling for anchor links
    setupSmoothScrolling();
    
    // Initialize any interactive components
    setupInteractiveComponents();
    
    // Optimize images for mobile devices
    optimizeImagesForMobile();
});

/**
 * Sets up the mobile navigation menu toggle functionality
 */
function setupMobileNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            // Toggle the active class on the nav links
            navLinks.classList.toggle('active');
            
            // Toggle the menu button appearance (hamburger to X)
            this.classList.toggle('active');
            
            // Toggle aria-expanded for accessibility
            const expanded = this.getAttribute('aria-expanded') === 'true' || false;
            this.setAttribute('aria-expanded', !expanded);
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navLinks.contains(event.target);
            const isClickOnMenuToggle = menuToggle.contains(event.target);
            
            if (!isClickInsideNav && !isClickOnMenuToggle && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', false);
            }
        });
    }
}

/**
 * Sets up smooth scrolling for anchor links
 */
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Calculate header height to offset the scroll position
                const headerHeight = document.querySelector('.site-header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Update URL without page reload
                history.pushState(null, null, targetId);
            }
        });
    });
}

/**
 * Sets up interactive components like tabs, accordions, etc.
 */
function setupInteractiveComponents() {
    // Setup accordions if present
    setupAccordions();
    
    // Setup tabs if present
    setupTabs();
    
    // Setup image lightbox/gallery if present
    setupImageGallery();
}

/**
 * Sets up accordion functionality
 */
function setupAccordions() {
    const accordions = document.querySelectorAll('.accordion');
    
    accordions.forEach(accordion => {
        const headers = accordion.querySelectorAll('.accordion-header');
        
        headers.forEach(header => {
            header.addEventListener('click', function() {
                // Get the associated content panel
                const content = this.nextElementSibling;
                
                // Toggle active state
                this.classList.toggle('active');
                
                // Toggle content visibility
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                    this.setAttribute('aria-expanded', 'false');
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                    this.setAttribute('aria-expanded', 'true');
                }
            });
        });
    });
}

/**
 * Sets up tab functionality
 */
function setupTabs() {
    const tabContainers = document.querySelectorAll('.tabs');
    
    tabContainers.forEach(container => {
        const tabButtons = container.querySelectorAll('.tab-button');
        const tabPanels = container.querySelectorAll('.tab-panel');
        
        tabButtons.forEach((button, index) => {
            button.addEventListener('click', function() {
                // Deactivate all tab buttons and panels
                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-selected', 'false');
                });
                
                tabPanels.forEach(panel => {
                    panel.classList.remove('active');
                    panel.setAttribute('hidden', 'true');
                });
                
                // Activate the clicked tab button and corresponding panel
                this.classList.add('active');
                this.setAttribute('aria-selected', 'true');
                
                const panel = tabPanels[index];
                if (panel) {
                    panel.classList.add('active');
                    panel.removeAttribute('hidden');
                }
            });
        });
    });
}

/**
 * Sets up image gallery/lightbox functionality
 */
function setupImageGallery() {
    const galleryImages = document.querySelectorAll('.gallery-image');
    
    galleryImages.forEach(image => {
        image.addEventListener('click', function() {
            const src = this.getAttribute('src');
            const alt = this.getAttribute('alt');
            
            // Create lightbox elements
            const lightbox = document.createElement('div');
            lightbox.classList.add('lightbox');
            
            const lightboxContent = document.createElement('div');
            lightboxContent.classList.add('lightbox-content');
            
            const lightboxImage = document.createElement('img');
            lightboxImage.src = src;
            lightboxImage.alt = alt;
            
            const closeButton = document.createElement('button');
            closeButton.classList.add('lightbox-close');
            closeButton.innerHTML = '&times;';
            closeButton.setAttribute('aria-label', 'Close lightbox');
            
            // Assemble and append to body
            lightboxContent.appendChild(lightboxImage);
            lightboxContent.appendChild(closeButton);
            lightbox.appendChild(lightboxContent);
            document.body.appendChild(lightbox);
            
            // Prevent body scrolling when lightbox is open
            document.body.style.overflow = 'hidden';
            
            // Close lightbox functionality
            const closeLightbox = () => {
                document.body.removeChild(lightbox);
                document.body.style.overflow = '';
            };
            
            closeButton.addEventListener('click', closeLightbox);
            lightbox.addEventListener('click', function(e) {
                if (e.target === lightbox) {
                    closeLightbox();
                }
            });
            
            // Close on escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeLightbox();
                }
            });
        });
    });
}

/**
 * Detects if the user is on a mobile device
 */
function isMobileDevice() {
    return (window.innerWidth <= 767);
}

/**
 * Utility function to throttle function calls
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Optimizes images for mobile devices and adds fallback handling
 * Ensures proper loading and display of images on all devices
 */
function optimizeImagesForMobile() {
    // Target all content images that might have issues
    const contentImages = document.querySelectorAll('.team-photo, .partner-logo, .team-member img, .producer img, .artist img, .university-logo, .footer-logo');
    
    console.log(`Optimizing ${contentImages.length} images for better display`);
    
    contentImages.forEach(img => {
        // Add loading="lazy" attribute if not already present
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        
        // Add decoding="async" for better performance
        if (!img.hasAttribute('decoding')) {
            img.setAttribute('decoding', 'async');
        }
        
        // Log the original image path
        const originalSrc = img.getAttribute('src');
        console.log(`Processing image: ${originalSrc}`);
        
        // Add error handling to detect failed loads
        img.onerror = function() {
            console.error(`Failed to load image: ${originalSrc}`);
            
            // Try to determine if it's a case sensitivity issue
            if (originalSrc.includes('/')) {
                const parts = originalSrc.split('/');
                const filename = parts[parts.length - 1];
                console.log(`Image filename: ${filename}`);
            }
            
            // Set a background color to show something is there
            this.style.backgroundColor = '#f0f0f0';
            
            // Add a data attribute to track failed images
            this.setAttribute('data-load-failed', 'true');
        };
        
        // Add load success handler
        img.onload = function() {
            console.log(`Successfully loaded image: ${originalSrc}`);
            // Remove any error indicators
            this.removeAttribute('data-load-failed');
        };
    });
    
    // Log a summary after a short delay to allow images to load
    setTimeout(() => {
        const failedImages = document.querySelectorAll('[data-load-failed="true"]');
        if (failedImages.length > 0) {
            console.warn(`${failedImages.length} images failed to load. Check console for details.`);
        } else {
            console.log('All images loaded successfully!');
        }
    }, 3000);
}
