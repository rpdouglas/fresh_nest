# E21, E07 & E04 Refinement Close Report — Centered Hero, Watermark Background & Clickable Cards

**Date:** 2026-06-11
**Epic:** E21, E07 & E04 Refinements
**Primary Personas:** P2 Travis (fast booking + layout), P3 Margaret (accessibility), P1 Diane / P5 Sophie (bilingual FR/EN + custom branding), P6 Gallagher (commercial styling)
**Phase:** Phase 3 Refinement
**Plan:** Resumed from compacted state / Goal directives

---

## Summary

This refinement epic implemented:
1. **Centered Hero Layout**: Refactored the homepage `Hero.tsx` from a two-column layout to a centered, single-column alignment, putting focus directly on the centered display title "Professional Cleaning & Organizing" (and its French translation).
2. **Cozy Nest Watermark Background**: Generated a minimalist watercolor/pastel bird's nest illustration woven with subtle green leaves and tiny cleaning tools (broom & feather duster), blending perfectly behind the centered Hero title text using a multiply blend mode and a very soft `12%` opacity to protect text readability.
3. **Ghosted Service Card Backgrounds**: Service cards in the `<ServicesGrid />` (shared by the landing page and `/services` overview page) were updated to display their corresponding service hero images as faint backgrounds. The images are rendered at exactly `15%` opacity directly on the base card colors for maximum readability.
4. **Accessible Routing Upgrades**: Card icons and service title headings in `<ServicesGrid />` were wrapped in router `<Link />` components pointing to the specific service page, styled with custom hover and focus rings.
5. **Colored Theme Expansion**: Applied the colored (blue `bg-slate-brand`) theme to the **Deep Clean** and **Post Construction** cards in `<ServicesGrid />` alongside the existing Commercial card.
6. **Legibility & Font weight Enhancements**: Adjusted default body font weight app-wide in `src/index.css` to `font-normal` (400 weight instead of 300) to resolve legibility issues with DM Sans body copy. Applied `font-medium` (500 weight) to the services section subhead and the card description bodies for enhanced readability.
7. **Book Now Button Inversion**: Styled the "Book Now" button on blue cards with a solid `bg-cream` background and `text-slate-brand` text, providing strong visual contrast, high clickability, and compliance with the brand palette.
8. **Hero Layout Restructuring**: Positioned the birds nest watermark image behind the main headline `h1` ("Professional Cleaning & Organizing") *only*, embedded a new cozy home cleaning banner image featuring a playful nest theme (`/images/hero-nest-banner.png`) directly under the heading with a 25% black mask overlay, and restored the main company logo right under the subtitle and above the "Book Now" button.
9. **Recurring Cleaning Background Images**: Generated three stylized watercolor/pastel images representing the weekly, bi-weekly, and monthly recurring cleaning cards (featuring cozy nests, cleaning equipment, and calendar highlights). Set these images as card backgrounds at 15% opacity, and inverted the Book Now button on the bi-weekly blue card to solid cream-white to ensure visual uniformity.
10. **How It Works Card Redesign**: Restructured the 4-step 'How It Works' section to display each step inside a stylized, full-height card that alternates background colors (Step 1 & 3: white bg; Step 2 & 4: blue bg). Generated 4 whimsical bird's nest background images (`howitworks-step1.png` to `howitworks-step4.png`) depicting the respective booking, confirmation, cleaning, and relaxation themes, placing them behind each card at 15% opacity, and removed the old horizontal connector line.

---

## Deliverables

| Deliverable | Status |
|---|---|
| Convert and save 5 service hero images to `/public/images/` as compressed JPEGs | ✅ |
| Update `ServicePage.tsx` to dynamically render the hero image at `opacity-30` with a gradient overlay | ✅ |
| Refactor `Hero.tsx` to center all elements in a single-column layout | ✅ |
| Generate and save the `nest-watermark.jpg` watercolor bird nest graphic to `/public/images/` | ✅ |
| Embed the nest watermark behind the Hero title at 12% opacity | ✅ |
| Generate and save the `hero-nest-banner.png` home banner image to `/public/images/` | ✅ |
| Embed the banner image under the Hero title with a 25% dark overlay | ✅ |
| Position the company logo under the subtitle and above the Book Now button | ✅ |
| Add faint card background images in `ServicesGrid.tsx` at 15% opacity | ✅ |
| Apply blue/colored theme to Deep Clean and Post Construction cards | ✅ |
| Invert Book Now buttons on blue cards to solid cream-white bg | ✅ |
| Bold body copy globally to normal (400) and card/section subheads to medium (500) | ✅ |
| Generate and save 3 recurring background images showing nests + calendars (`weekly-recurring.png`, `biweekly-recurring.png`, `monthly-recurring.png`) | ✅ |
| Set recurring images as backgrounds at 15% opacity in `RecurringCTA.tsx` | ✅ |
| Invert the Book Now button on the bi-weekly card to solid cream-white | ✅ |
| Generate and save 4 whimsical "How It Works" step backgrounds (`howitworks-step1.png` to `howitworks-step4.png`) | ✅ |
| Restructure steps in `HowItWorks.tsx` to display in alternating-colored cards with background images | ✅ |
| Remove horizontal connector line from `HowItWorks.tsx` | ✅ |
| Add `imgAlt` translations to `en.json` and `fr.json` for all 5 services | ✅ |
| Add `viewDetailsAriaLabel` bilingual helper to `en.json` and `fr.json` | ✅ |
| Wrap card icons in `ServicesGrid.tsx` with specific service detail page routes | ✅ |
| Wrap card headings in `ServicesGrid.tsx` with specific service detail page routes | ✅ |
| Ensure WCAG AA target spacing, focus rings, and contrast criteria are met | ✅ |
| npm run build — PASS | ✅ |
| npm run lint — PASS | ✅ |
| npm run test — PASS | ✅ |
| npm run test:e2e — PASS | ✅ |

---

## Persona Acceptance Tests — PASS ✅

| Persona | Test | Result |
|---|---|---|
| **P2 Travis** | Centered Hero & Grid Cards — centered CTAs are highly touchable; clicking card components navigates cleanly to the service page. Logo and banner are beautifully integrated into the page flow. | ✅ PASS |
| **P3 Margaret** | Legibility and Touch Contrast — body fonts are bolded globally to normal (400) and in cards/subheads to medium (500) for clean reading. Book Now buttons on blue cards (and bi-weekly card) use high contrast cream-white background with a minimum 48px tap target. Focus outline is visible. "How It Works" step descriptions are structured in high-contrast cards. | ✅ PASS |
| **P1 Diane / P5 Sophie** | Localization — Hero title, watermark, and alt attributes translate cleanly into French with zero raw keys or hardcoded English copy. | ✅ PASS |
| **P6 Gallagher** | Premium Branding — soft watercolor bird's nest background watermark, customized home banner image, recurring cards with stylized illustrations, alternating cards in "How It Works" with custom illustrations, and consistent colored card themes (Commercial, Deep, Post Construction, Bi-weekly) elevate the premium visual aesthetic. | ✅ PASS |

---

## Files Changed

| File | Action |
|---|---|
| `public/images/standard-hero.jpg` | CREATED — Compressed hero image for Standard cleaning |
| `public/images/deep-hero.jpg` | CREATED — Compressed hero image for Deep clean |
| `public/images/moveout-hero.jpg` | CREATED — Compressed hero image for Move-out cleaning |
| `public/images/postconstruction-hero.jpg` | CREATED — Compressed hero image for Post-construction |
| `public/images/commercial-hero.jpg` | CREATED — Compressed hero image for Commercial cleaning |
| `public/images/nest-watermark.jpg` | CREATED — Web-optimized watercolor bird's nest background graphic |
| `public/images/hero-nest-banner.png` | CREATED — Stylized horizontal home interior banner with nest details |
| `public/images/weekly-recurring.png` | CREATED — Whimsical weekly calendar + nest illustration |
| `public/images/biweekly-recurring.png` | CREATED — Whimsical bi-weekly calendar + nest illustration |
| `public/images/monthly-recurring.png` | CREATED — Whimsical monthly calendar + nest illustration |
| `public/images/howitworks-step1.png` | CREATED — Whimsical nest and calendar illustration for Step 1 |
| `public/images/howitworks-step2.png` | CREATED — Whimsical flying bird carrying envelope for Step 2 |
| `public/images/howitworks-step3.png` | CREATED — Whimsical nest with cleaning supplies for Step 3 |
| `public/images/howitworks-step4.png` | CREATED — Whimsical bird sleeping in nest for Step 4 |
| `src/index.css` | EDITED — Configured default body font weight to normal (400) |
| `src/components/home/Hero.tsx` | EDITED — Centered layout, watermark under h1 title, nested banner, and logo under subtitle |
| `src/components/home/RecurringCTA.tsx` | EDITED — Added background images to cards, solid cream-white button layout |
| `src/components/home/HowItWorks.tsx` | EDITED — Render steps inside alternating colored cards with background images, remove connector line |
| `src/pages/ServicePage.tsx` | EDITED — Dynamic hero background image overlay block |
| `src/components/home/ServicesGrid.tsx` | EDITED — Applied color theme expansion, solid buttons, font-medium, and card link wrapping |
| `src/i18n/locales/en.json` | EDITED — Added `imgAlt` and `viewDetailsAriaLabel` localization strings |
| `src/i18n/locales/fr.json` | EDITED — Added `imgAlt` and `viewDetailsAriaLabel` French localization strings |

---

## Audit Results

### Brand_Auditor — PASS ✅
The newly compressed hero images load quickly, match the specific interior design system guidelines (clean, bright, cream/sand accents), and use the exact `opacity-30` styling from the Airbnb hero section. Spacing and link focus properties follow `design-system.md` specifications.

### Linguistic_Auditor — PASS ✅
All UI text additions (alt tags, aria-labels) are loaded through the `react-i18next` `t()` translation mechanism, ensuring a completely localized bilingual experience.

---

## Build Gate

```
npm run build     → ✅ BUILD_PASS (1212 modules, 0 TS errors)
npm run lint      → ✅ LINT_PASS (0 warnings, 0 errors)
npm run test      → ✅ TEST_PASS (12 unit tests passed)
npm run test:e2e  → ✅ E2E_PASS (2 E2E tests passed)
```

---

*E21 & E07 refinement closed. Do not commit.*
