# Fresh Nest Co. — Image & Graphic Assets Inventory

This document details all the image and graphic assets located in the `public/` and `src/assets/` folders of the Fresh Nest Co. codebase. An initial audit identified several discrepancies between files and their configurations in `index.html` and `site.webmanifest`. These issues have been successfully resolved by regenerating and duplicating the relevant assets.

---

## Table of Contents
1. [Public Folder (`public/`)](#1-public-folder-public)
   - [Root Assets](#root-public-assets)
   - [SEO & Open Graph Images (`public/images/`)](#seo--open-graph-images-publicimages)
   - [PWA & Icon Assets (`public/icons/`)](#pwa--icon-assets-publicicons)
2. [Source Assets Folder (`src/assets/`)](#2-source-assets-folder-srcassets)
   - [Brand Logo Assets](#brand-logo-assets)
   - [Illustrations & Page Assets](#illustrations--page-assets)
   - [Framework & Tool Logos](#framework--tool-logos)
3. [Audit Results & Resolved Issues](#3-audit-results--resolved-issues)

---

## 1. Public Folder (`public/`)

The `public/` directory contains files that are served directly at the website root path. They are not processed by Vite's build pipeline.

### Root Public Assets

These assets are located directly in the [public/](file:///workspaces/fresh_nest/public) directory.

| Filename | Type | Dimensions | File Size | Description & Usage |
| :--- | :--- | :--- | :--- | :--- |
| [favicon.ico](file:///workspaces/fresh_nest/public/favicon.ico) | ICO (MS Windows Icon) | 16 × 16 | 445 B | Default legacy browser favicon. Contains 1 icon encoded as PNG. |
| [favicon.svg](file:///workspaces/fresh_nest/public/favicon.svg) | SVG Vector | Scalable | 9.3 KB | Modern browser favicon, scales cleanly. |
| [icons.svg](file:///workspaces/fresh_nest/public/icons.svg) | SVG Vector Sprite | Scalable | 4.9 KB | SVG sprite sheet defining symbols used across the app (e.g., social and documentation icons). |
| [site.webmanifest](file:///workspaces/fresh_nest/public/site.webmanifest) | JSON Manifest | N/A | 1.2 KB | Configuration for Progressive Web App (PWA) installation, metadata, and icon paths. |

#### SVG Symbols in `icons.svg`
The following symbol IDs are defined inside [icons.svg](file:///workspaces/fresh_nest/public/icons.svg) and referenced using `<use href="/icons.svg#id" />` in components such as [App.tsx](file:///workspaces/fresh_nest/src/App.tsx):
* **`bluesky-icon`** (viewBox: `0 0 16 17`) — Used for Bluesky social link.
* **`discord-icon`** (viewBox: `0 0 20 19`) — Used for Discord community link.
* **`documentation-icon`** (viewBox: `0 0 21 20`) — Graphic symbol for docs.
* **`github-icon`** (viewBox: `0 0 19 19`) — Used for GitHub source repository link.
* **`social-icon`** (viewBox: `0 0 20 20`) — General community/social icon.
* **`x-icon`** (viewBox: `0 0 19 19`) — Used for X.com (formerly Twitter) link.

---

### SEO & Open Graph Images (`public/images/`)

Located in [public/images/](file:///workspaces/fresh_nest/public/images). Used for social share previews.

| Filename | Type | Dimensions | File Size | Description & Usage |
| :--- | :--- | :--- | :--- | :--- |
| [og-image-1200x630.jpg](file:///workspaces/fresh_nest/public/images/og-image-1200x630.jpg) | JPEG | 1200 × 630 | 32.6 KB (33,385 B) | **Generated:** Logo centered on brand slate background (`#5b7e8f`). Matches social tags in `index.html`. |
| [twitter-card-1200x630.jpg](file:///workspaces/fresh_nest/public/images/twitter-card-1200x630.jpg) | PNG | 512 × 476 | 161.6 KB (165,436 B) | Legacy social image. Note: encoded as a PNG despite `.jpg` extension. |

---

### PWA & Icon Assets (`public/icons/`)

Located in [public/icons/](file:///workspaces/fresh_nest/public/icons). These are primarily referenced in [site.webmanifest](file:///workspaces/fresh_nest/public/site.webmanifest) and [index.html](file:///workspaces/fresh_nest/index.html).

| Filename | Type | Dimensions | File Size | Usage & References |
| :--- | :--- | :--- | :--- | :--- |
| [apple-touch-icon.png](file:///workspaces/fresh_nest/public/icons/apple-touch-icon.png) | PNG | 180 × 180 | 15.5 KB | iOS Home screen bookmark icon (`apple-touch-icon` in `index.html`). |
| [favicon-16x16.png](file:///workspaces/fresh_nest/public/icons/favicon-16x16.png) | PNG | 16 × 16 | 423 B | Standard favicon fallback (`index.html`). |
| [favicon-32x32.png](file:///workspaces/fresh_nest/public/icons/favicon-32x32.png) | PNG | 32 × 32 | 1.2 KB | Standard favicon fallback (`index.html`). |
| [favicon-48x48.png](file:///workspaces/fresh_nest/public/icons/favicon-48x48.png) | PNG | 48 × 48 | 2.2 KB | Standard favicon fallback (`index.html`). |
| [icon-1024x1024.png](file:///workspaces/fresh_nest/public/icons/icon-1024x1024.png) | PNG | 1024 × 1024 | 221.7 KB | High-resolution PWA store icon (`site.webmanifest`). |
| [icon-192x192.png](file:///workspaces/fresh_nest/public/icons/icon-192x192.png) | PNG | 192 × 192 | 18.9 KB | Standard Android PWA splash/home icon (`site.webmanifest`). |
| [icon-256x256.png](file:///workspaces/fresh_nest/public/icons/icon-256x256.png) | PNG | 256 × 256 | 36.2 KB | Intermediate scale PWA icon (`site.webmanifest`). |
| [icon-384x384.png](file:///workspaces/fresh_nest/public/icons/icon-384x384.png) | PNG | 384 × 384 | 71.1 KB | Intermediate scale PWA icon (`site.webmanifest`). |
| [icon-512x512.png](file:///workspaces/fresh_nest/public/icons/icon-512x512.png) | PNG | 512 × 512 | 92.9 KB (95,149 B) | **Duplicated:** Non-maskable 512px icon referenced by `site.webmanifest`. |
| [icon-maskable-192x192.png](file:///workspaces/fresh_nest/public/icons/icon-maskable-192x192.png) | PNG | 192 × 192 | 22.7 KB | Android adaptive/maskable icon preview (`site.webmanifest`). |
| [icon-maskable-512x512.png](file:///workspaces/fresh_nest/public/icons/icon-maskable-512x512.png) | PNG | 512 × 512 | 92.9 KB (95,149 B) | Android adaptive/maskable icon preview (`site.webmanifest`). |

---

## 2. Source Assets Folder (`src/assets/`)

The assets in [src/assets/](file:///workspaces/fresh_nest/src/assets) are intended to be imported into React components (like `import logo from './assets/logo.png'`) so Vite can bundle, hash, and optimize them during production builds.

### Brand Logo Assets

These logo variations are stored in the assets folder to represent the Fresh Nest Co. brand.

| Filename | Type | Dimensions | File Size | Description & Target Usage |
| :--- | :--- | :--- | :--- | :--- |
| [freshnest-logo-transparent.png](file:///workspaces/fresh_nest/src/assets/freshnest-logo-transparent.png) | PNG | 669 × 622 | 207.8 KB | Full company logo with transparent background. |
| [logo-source-512px.png](file:///workspaces/fresh_nest/src/assets/logo-source-512px.png) | PNG | 512 × 476 | 161.6 KB | Master source file for logo compilation. |
| [logo-hero-340px.png](file:///workspaces/fresh_nest/src/assets/logo-hero-340px.png) | PNG | 340 × 316 | 84.8 KB | Intended for the home page hero display block. |
| [logo-navbar-160px@2x.png](file:///workspaces/fresh_nest/src/assets/logo-navbar-160px@2x.png) | PNG | 256 × 238 | 54.4 KB | Navbar logo for high-density retina displays. |
| [logo-navbar-80px.png](file:///workspaces/fresh_nest/src/assets/logo-navbar-80px.png) | PNG | 80 × 74 | 8.7 KB | Standard navbar logo. |
| [logo-footer-dark-120px.png](file:///workspaces/fresh_nest/src/assets/logo-footer-dark-120px.png) | PNG | 128 × 119 | 18.2 KB | Darker theme variant tailored for the footer block. |
| [logo-circle-512px.png](file:///workspaces/fresh_nest/src/assets/logo-circle-512px.png) | PNG | 512 × 512 | 113.7 KB | Circular cropped logo avatar. |
| [logo-circle-256px.png](file:///workspaces/fresh_nest/src/assets/logo-circle-256px.png) | PNG | 256 × 256 | 36.0 KB (36,842 B) | **Regenerated:** High-quality circular logo downscaled from 512px. |
| [logo-circle-128px.png](file:///workspaces/fresh_nest/src/assets/logo-circle-128px.png) | PNG | 128 × 128 | 11.5 KB (11,732 B) | **Regenerated:** High-quality circular logo downscaled from 512px. |
| [logo-circle-64px.png](file:///workspaces/fresh_nest/src/assets/logo-circle-64px.png) | PNG | 64 × 64 | 3.7 KB (3,797 B) | **Regenerated:** High-quality circular logo downscaled from 512px. |

---

### Illustrations & Page Assets

| Filename | Type | Dimensions | File Size | Description & Usage |
| :--- | :--- | :--- | :--- | :--- |
| [hero.png](file:///workspaces/fresh_nest/src/assets/hero.png) | PNG | 343 × 361 | 12.8 KB | Main graphical illustration displayed on the hero page. Imported in [App.tsx](file:///workspaces/fresh_nest/src/App.tsx) and rendered with the class `base`. |

---

### Framework & Tool Logos

Vite default templates include these files for demo page graphics.

| Filename | Type | File Size | Description & Usage |
| :--- | :--- | :--- | :--- |
| [react.svg](file:///workspaces/fresh_nest/src/assets/react.svg) | SVG Vector | 4.0 KB | React logo. Imported and animated in [App.tsx](file:///workspaces/fresh_nest/src/App.tsx). |
| [vite.svg](file:///workspaces/fresh_nest/src/assets/vite.svg) | SVG Vector | 8.5 KB | Vite logo. Imported and displayed in [App.tsx](file:///workspaces/fresh_nest/src/App.tsx). |

---

## 3. Audit Results & Resolved Issues

### Resolved Discrepancies & Implementations:
1. **Broken Metadata & Open Graph Image Links (Fixed)**: 
   * **Problem:** In [index.html](file:///workspaces/fresh_nest/index.html) lines 32 and 44, Open Graph and Twitter Card tags referenced `https://lilypad-freshnest.web.app/images/og-image-1200x630.jpg`, but the file did not exist physically in the codebase.
   * **Resolution:** Generated a high-quality 1200x630 JPEG social share preview card featuring the transparent logo centered on a `#5b7e8f` slate-brand background, and saved it to the expected path: `/public/images/og-image-1200x630.jpg`.
2. **Missing PWA Manifest Icon File (Fixed)**:
   * **Problem:** `site.webmanifest` referenced `/icons/icon-512x512.png`, which was not present in the `/public/icons/` folder (only `icon-maskable-512x512.png` existed).
   * **Resolution:** Duplicated `icon-maskable-512x512.png` to `icon-512x512.png` to successfully resolve the PWA setup reference.
3. **Mismatched Logo Circle Sizes (Fixed)**:
   * **Problem:** Circle logo sizes on disk did not match their names (e.g. `256px` was actually 160x149, `128px` was actually 120x120, and `64px` was 64x60).
   * **Resolution:** Downscaled `logo-circle-512px.png` using PIL with Lanczos resampling to produce clean, exact-sized square images for:
     * `logo-circle-256px.png` (256x256)
     * `logo-circle-128px.png` (128x128)
     * `logo-circle-64px.png` (64x64)
