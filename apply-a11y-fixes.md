# Accessibility Fixes - Manual Application Guide

## Pages Updated ✅
- [x] index.html
- [x] about.html
- [x] approach.html
- [x] contact.html

## Pages Remaining ⏳
- [ ] team.html
- [ ] publications.html
- [ ] videos.html
- [ ] privacy.html
- [ ] audio.html

## Changes to Apply to Each Page

### 1. Fix Favicon MIME Type
**Find:**
```html
<link rel="icon" href="favicon.png" type="image/x-icon">
```

**Replace with:**
```html
<link rel="icon" href="favicon.png" type="image/png">
```

### 2. Add Skip-to-Content Link
**Find:**
```html
</head>
<body>
    <header class="site-header">
```

**Replace with:**
```html
</head>
<body>
    <a href="#main-content" class="skip-to-content">Skip to main content</a>
    <header class="site-header">
```

### 3. Add ARIA Navigation Labels
**Find:**
```html
            <nav class="main-nav">
                <button class="menu-toggle" aria-label="Toggle Menu">
```

**Replace with:**
```html
            <nav class="main-nav" aria-label="Main navigation">
                <button class="menu-toggle" aria-label="Toggle Menu" aria-expanded="false" aria-controls="nav-menu">
```

### 4. Add Nav Menu ID
**Find:**
```html
                <ul class="nav-links">
```

**Replace with:**
```html
                <ul class="nav-links" id="nav-menu">
```

### 5. Add Main Content ID
**Find:**
```html
    </header>

    <main>
```

**Replace with:**
```html
    </header>

    <main id="main-content">
```

## CSS Already Updated
The skip-to-content styling and focus-visible styles are already in [main.css](assets/css/main.css) so no CSS changes needed.

## Testing Checklist
After applying fixes to all pages:
- [ ] Test keyboard navigation (Tab key should show focus indicators)
- [ ] Test skip-to-content link (Press Tab when page loads, then Enter)
- [ ] Verify ARIA expanded state toggles on menu button
- [ ] Check screen reader compatibility
- [ ] Validate HTML
