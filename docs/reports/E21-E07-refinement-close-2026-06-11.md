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

---

## Deliverables

| Deliverable | Status |
|---|---|
| Convert and save 5 service hero images to `/public/images/` as compressed JPEGs | ✅ |
| Update `ServicePage.tsx` to dynamically render the hero image at `opacity-30` with a gradient overlay | ✅ |
| Refactor `Hero.tsx` to center all elements in a single-column layout | ✅ |
| Generate and save the `nest-watermark.jpg` watercolor bird nest graphic to `/public/images/` | ✅ |
| Embed the nest watermark behind the Hero title at 12% opacity with mix-blend-multiply | ✅ |
| Add faint card background images in `ServicesGrid.tsx` at 15% opacity | ✅ |
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
| **P2 Travis** | Centered Hero & Grid Cards — centered CTAs are highly touchable; clicking card components navigates cleanly to the service page. | ✅ PASS |
| **P3 Margaret** | Focus properties — links have a visible focus outline and minimum 48px tap targets. | ✅ PASS |
| **P1 Diane / P5 Sophie** | Localization — Hero title, watermark, and alt attributes translate cleanly into French with zero raw keys or hardcoded English copy. | ✅ PASS |
| **P6 Gallagher** | Premium Branding — soft watercolor bird's nest background watermark enhances the premium and high-end feel of the landing page. | ✅ PASS |

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
| `src/components/home/Hero.tsx` | EDITED — Centered layout and watermark image overlay |
| `src/pages/ServicePage.tsx` | EDITED — Dynamic hero background image overlay block |
| `src/components/home/ServicesGrid.tsx` | EDITED — wrapped card icons and headings with `Link` routes |
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
