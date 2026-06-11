# E21 & E07 Refinement Close Report — Ghosted Hero Images & Clickable Service Cards

**Date:** 2026-06-11
**Epic:** E21 & E07 Refinement
**Primary Personas:** P2 Travis (fast booking + routing), P3 Margaret (accessibility + large targets), P1 Diane / P5 Sophie (bilingual FR/EN), P6 Gallagher (commercial styling)
**Phase:** Phase 3 Refinement
**Plan:** Resumed from compacted state / Goal directives

---

## Summary

This refinement epic implemented:
1. **Ghosted Hero Images**: High-end interior hero images generated with brand-curated cream, warm-white, and sand color tokens, compressed to JPEG at 85% quality to maintain fast page load speeds. They are loaded dynamically on the 5 residential/commercial service pages matching the ghosted image layout originally designed for the Airbnb page.
2. **Clickable Service Cards with Ghosted Backgrounds**: Service cards in the `<ServicesGrid />` (shared by the landing page and `/services` overview page) were updated to display these ghosted service images as faint backgrounds. The images are rendered at exactly 15% opacity (50% more transparent than the 30% opacity on service page heroes) behind a 90% card-theme color overlay (white overlay for light cards, brand-blue overlay for the inverted commercial card) to ensure strong text legibility and compliance with WCAG AA.
3. **Accessible Routing Upgrades**: The card icons and the service title headings were wrapped in router `<Link />` components pointing to the specific service page. Accessibility guidelines were strictly maintained with focus states, border-radius standards, and bilingual `aria-label` attributes.

---

## Deliverables

| Deliverable | Status |
|---|---|
| Convert and save 5 service hero images to `/public/images/` as compressed JPEGs | ✅ |
| Update `ServicePage.tsx` to dynamically render the hero image at `opacity-30` with a gradient overlay | ✅ |
| Add faint card background images in `ServicesGrid.tsx` at 15% opacity | ✅ |
| Add a 90% opacity color overlay (white/brand-blue) in `ServicesGrid.tsx` for high contrast | ✅ |
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
| **P2 Travis** | Main page services cards — clicking the icon or the header redirects to the correct service page with zero friction. | ✅ PASS |
| **P3 Margaret** | Services Grid links — all icon and header links have 48px tap targets, visible focus outline borders, and clear `aria-label` labels. | ✅ PASS |
| **P1 Diane / P5 Sophie** | Localization — hero image alt texts and details labels are completely localized in French when switching locales, with no hardcoded strings. | ✅ PASS |
| **P6 Gallagher** | `/services/commercial-cleaning` — renders the custom commercial hero background image with matching premium charcoal aesthetics. | ✅ PASS |

---

## Files Changed

| File | Action |
|---|---|
| `public/images/standard-hero.jpg` | CREATED — Compressed hero image for Standard cleaning |
| `public/images/deep-hero.jpg` | CREATED — Compressed hero image for Deep clean |
| `public/images/moveout-hero.jpg` | CREATED — Compressed hero image for Move-out cleaning |
| `public/images/postconstruction-hero.jpg` | CREATED — Compressed hero image for Post-construction |
| `public/images/commercial-hero.jpg` | CREATED — Compressed hero image for Commercial cleaning |
| `src/pages/ServicePage.tsx` | EDITED — Integrated absolute hero image overlay block with dynamic key mapping |
| `src/components/home/ServicesGrid.tsx` | EDITED — Wrapped card icons and headings with `Link` router components |
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
