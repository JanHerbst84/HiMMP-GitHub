# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **HiMMP (Heaviness in Metal Music Production)** research project website - a static HTML/CSS/JavaScript site for an academic research project exploring heaviness as the metal genre's central quality feature. The project is funded by the Arts and Humanities Research Council and run by the University of Huddersfield.

## Project Structure

- **Static Website**: Pure HTML/CSS/JavaScript with no build system or package manager
- **Assets**: Organized in `assets/` directory with subdirectories for CSS, JS, images, and audio
- **PHP Backend**: Simple contact form handler (`contact-handler.php`) for form submissions
- **Multi-page Site**: Individual HTML files for each section (index, about, approach, team, publications, videos, audio, contact)

## Key Architecture Components

### JavaScript Architecture
- **Main Script**: `assets/js/main.js` - Core functionality for navigation, smooth scrolling, interactive components
- **Audio Player**: `assets/js/audio-player.js` - Custom audio player with comparison functionality for producer mixes
- **Modular Design**: Each major feature is encapsulated in its own function for maintainability

### CSS Architecture
- **Main Styles**: `assets/css/main.css` - Core styling with CSS custom properties for theming
- **Responsive Design**: `assets/css/responsive.css` - Media queries for tablet and mobile layouts
- **CSS Variables**: Consistent color palette, typography, and spacing defined in `:root`

### Content Organization
- **Pages**: Welcome, About, Approach, Team, Publications, Videos, Audio, Contact
- **Assets**: Images organized by type (background, cover, logos, people, companies)
- **Audio**: Producer comparison audio files stored in `assets/audio/`

## Development Commands

This project has **no build system** - it's a static website that can be served directly from any web server.

### Local Development
- Serve files using any static web server (e.g., `python -m http.server 8000`)
- PHP development server for contact form: `php -S localhost:8000`

### Testing
- No automated testing framework
- Manual testing in multiple browsers and devices
- Test contact form functionality with PHP backend

## Key Features to Understand

### Audio Comparison Player
- Located in `audio.html` with specialized JavaScript in `audio-player.js`
- Allows switching between different producer mixes while maintaining playback position
- Custom controls for professional audio comparison

### Responsive Design
- Mobile-first approach with progressive enhancement
- Hamburger menu for mobile navigation
- Flexible grid layouts that adapt to different screen sizes

### Contact Form
- PHP backend processing (`contact-handler.php`)
- Form validation and email handling
- Submissions stored in `contact_submissions/` directory

### Interactive Components
- Smooth scrolling navigation
- Image lightbox/gallery functionality
- Mobile-optimized image handling with error detection
- Accordion and tab components (when present)

## Important Notes

- **No Package Manager**: This project doesn't use npm, yarn, or composer
- **Static Hosting**: Designed to be deployed to any static web host
- **PHP Optional**: Only needed for contact form functionality
- **Academic Focus**: Content is research-oriented with emphasis on professional metal production techniques
- **SEO Optimized**: Includes structured data, sitemap, and proper meta tags for academic visibility

## File Conventions

- **HTML Files**: Semantic HTML5 with proper accessibility attributes
- **CSS**: BEM-like methodology for class naming, extensive use of CSS custom properties
- **JavaScript**: ES6+ features, event-driven architecture, no external dependencies
- **Images**: Optimized for web with appropriate alt text and lazy loading
- **Audio**: MP3 format for compatibility across all browsers and devices