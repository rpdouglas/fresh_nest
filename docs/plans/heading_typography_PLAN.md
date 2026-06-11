# Heading Typography Adjustment Plan
**Goal:** Make page titles (H1) and section titles (H2) using the `font-display` class bold (700 weight) to balance them visually against the bold card body copy and subtitles.

**Primary Persona(s) Served:**
- **P3 — Margaret Storey:** Benefits from stronger visual hierarchy and more distinctive headings.
- **P2 — Travis McLeod:** Benefits from a clear, high-contrast, premium presentation on mobile screens.

---

## Strategy 1: Global CSS Utility Base Class (Recommended & Pre-selected)
**Description:** Load native `600`/`700` weights for Cormorant Garamond from Google Fonts, and apply `@apply font-bold` to all `h1.font-display` and `h2.font-display` headings inside `src/index.css`.
- Font loading: Update `index.html` to load Cormorant Garamond bold weights natively.
- CSS: Add base layer style `@layer base { h1.font-display, h2.font-display { @apply font-bold; } }`.
- Code footprint: Extremely minimal. DRY implementation that modifies no React component files directly, reducing risk of layout bugs.

**Files Changed:**
1. `index.html`: Update Google Fonts embed.
2. `src/index.css`: Add global heading styles.

**Persona Impact:**
- Visual consistency across all pages.
- Headings have more visual gravity and presence, contrasting nicely with heavy body/card components.

**Risks:**
- Adding font weights adds a minor font payload (~few KBs), but resolves synthetic bolding distortions.

**Schema Audit:**
- No database changes.

---

## Strategy 2: Direct Component Level Class Additions
**Description:** Edit every single component and page JSX file (approx. 20+ files) containing `h1` and `h2` elements to manually append `font-bold` to their className attributes.
- Layout: Same visual result.

**Files Changed:**
- `src/components/booking/*`
- `src/components/home/*`
- `src/pages/*`

**Risks:**
- High chance of developer oversight (skipping pages).
- Heavy JSX code bloating.

---

## Strategy 3: Inline CSS Font-Weight Mapping
**Description:** Instead of Tailwind classes, add a custom inline CSS selector in `src/index.css` targeting specific heading element tags without styling constraints.

**Risks:**
- Might bold unintended display elements that happen to be H1/H2 but do not use Cormorant Garamond.

---

## Recommendation & Next Steps
We recommend and implemented **Strategy 1**, as it is clean, maintains design system consistency, and does not require editing multiple React files.
