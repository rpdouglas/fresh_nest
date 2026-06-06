# Image & Icon Assets Inventory
**Version:** 2.0 | **Updated:** 2026-06-06

This document maps all image and icon assets in the **Fresh Nest Co.** repository, listing their formats, target paths, and layout roles.

---

## 1. Favicons & Browser Assets
These reside in the `/public/` directory (or `/public/icons/` subfolder) and are loaded directly by `index.html`.

| Filename | Directory Path | Dimensions | Format | Usage / Target Persona |
| :--- | :--- | :--- | :--- | :--- |
| `favicon.ico` | `/public/favicon.ico` | 16/32/48px | ICO | Standard multi-res browser favicon (All) |
| `apple-touch-icon.png` | `/public/icons/apple-touch-icon.png` | 180×180 | PNG | iOS add-to-homescreen icon (All) |
| `favicon-16x16.png` | `/public/icons/favicon-16x16.png` | 16×16 | PNG | Legacy browser tab icon |
| `favicon-32x32.png` | `/public/icons/favicon-32x32.png` | 32×32 | PNG | High-res browser tab / taskbar shortcut |
| `favicon-48x48.png` | `/public/icons/favicon-48x48.png` | 48×48 | PNG | Windows pinned taskbar icon |

---

## 2. Progressive Web App (PWA) Icons
These are defined in `site.webmanifest` and are used by Android, iOS, and desktop PWA install utilities.

| Filename | Directory Path | Dimensions | Format | Purpose / Role |
| :--- | :--- | :--- | :--- | :--- |
| `icon-192x192.png` | `/public/icons/icon-192x192.png` | 192×192 | PNG | Android homescreen shortcut (`any`) |
| `icon-maskable-192x192.png` | `/public/icons/icon-maskable-192x192.png` | 192×192 | PNG | Android adaptive shortcut (`maskable`) |
| `icon-256x256.png` | `/public/icons/icon-256x256.png` | 256×256 | PNG | PWA install prompt / app details |
| `icon-384x384.png` | `/public/icons/icon-384x384.png` | 384×384 | PNG | Supplemental PWA dimension |
| `icon-512x512.png` | `/public/icons/icon-512x512.png` | 512×512 | PNG | Splash screen / high-DPI startup (`any`) |
| `icon-maskable-512x512.png` | `/public/icons/icon-maskable-512x512.png` | 512×512 | PNG | Adaptive splash screen (`maskable`) |
| `icon-1024x1024.png` | `/public/icons/icon-1024x1024.png` | 1024×1024 | PNG | High-res source template asset |

---

## 3. Social Previews (Open Graph)
Used in HTML header meta tags to generate preview cards on Facebook, Twitter, WhatsApp, Scribe, and Snye/Akwesasne community boards.

| Filename | Directory Path | Dimensions | Format | Intended Usage / Metatag |
| :--- | :--- | :--- | :--- | :--- |
| `og-image-1200x630.jpg` | `/public/images/og-image-1200x630.jpg` | 1200×630 | JPEG | Open Graph card for Facebook, LinkedIn (All) |
| `twitter-card-1200x630.jpg` | `/public/images/twitter-card-1200x630.jpg` | 1200×630 | JPEG | Large summary card for Twitter / X |
| `social-square-1080x1080.jpg` | `/public/images/social-square-1080x1080.jpg` | 1080×1080 | JPEG | Instagram / Facebook feed posts |

---

## 4. UI Site Logos (React Components)
Imported directly as assets in React components (e.g., Navbar, Footer, Hero sections).

| Filename | Directory Path | Height | Format | UI Usage / Target Section |
| :--- | :--- | :--- | :--- | :--- |
| `logo-navbar-80px.png` | `/src/assets/logo-navbar-80px.png` | 80px | PNG | Navbar logo (Standard screens) |
| `logo-navbar-160px@2x.png` | `/src/assets/logo-navbar-160px@2x.png` | 160px | PNG | Navbar logo (Retina / 2x screens) |
| `logo-hero-340px.png` | `/src/assets/logo-hero-340px.png` | 340px | PNG | Floating brand logo in the Hero section |
| `logo-footer-dark-120px.png` | `/src/assets/logo-footer-dark-120px.png` | 120px | PNG | Footer logo on dark background |
| `logo-circle-64px.png` | `/src/assets/logo-circle-64px.png` | 64px | PNG | Small badge / review list icons |
| `logo-circle-128px.png` | `/src/assets/logo-circle-128px.png` | 128px | PNG | Medium cards / lists usage |
| `logo-circle-256px.png` | `/src/assets/logo-circle-256px.png` | 256px | PNG | Standard about section / profile usage |
| `logo-circle-512px.png` | `/src/assets/logo-circle-512px.png` | 512px | PNG | High-resolution circles (print/large screens) |
| `logo-source-512px.png` | `/src/assets/logo-source-512px.png` | 512px | PNG | General-purpose transparent logo source |
| `freshnest-logo-transparent.png`| `/src/assets/freshnest-logo-transparent.png`| 512px | PNG | Lossless transparent logo template |
