# Recurring Service Cards Layout Optimization Close Report
**Date:** 2026-06-11
**Epic/Task:** Recurring Service Cards Layout Optimization

---

## 1. Executive Summary
This task optimized the card components in the `RecurringCTA` section. The discount badge and the recurrence title (frequency type) have been placed inline on the same line to save vertical space. The "Most Popular" tag on the biweekly card has been styled as a premium floating pill at the top-right corner, and all styling elements have been audited for WCAG AA compliance.

---

## 2. Implemented Changes
- **Inline Recurrence Header**: Grouped the recurrence title (`h3`) and discount badge side-by-side using `flex items-center gap-3 flex-wrap` in [RecurringCTA.tsx](file:///workspaces/fresh_nest/src/components/home/RecurringCTA.tsx).
- **Floating Popular Pill Tag**: Absolute positioned the "Most Popular" badge at `absolute top-4 right-4` as a premium pill tag.
- **Overlap Prevention**: Added `pr-20` safety margin padding to the inline header row on cards with the floating badge to prevent text overlap on narrow viewports.
- **WCAG AA Compliance Adjustments**:
  - Changed the discount badge text from `text-slate-brand` to `text-slate-dark` on both standard and inverted cards to satisfy contrast ratio requirements (~6.22:1 contrast ratio, passing the 4.5:1 minimum).
  - Changed the "Most Popular" badge text from `text-slate-brand` to `text-slate-dark` for the same contrast enhancement.
  - Increased the floating badge font size from `text-xs` (12px) to `text-sm` (14px) to satisfy Margaret's accessibility minimum.
  - Changed the floating badge shape from `rounded-full` to `rounded` to align with the brand border-radius conventions.
  - Corrected tagline text from `text-white/95` to solid `text-white` on the inverted card.
  - Corrected CTA link text color from `text-slate-brand` to `text-slate-dark` on the inverted card.

---

## 3. Persona Verification

### P2 — Travis McLeod (Mobile layout efficiency)
- **Result**: **PASS**. Merging the discount badge and title inline saves ~40px of vertical height per card, reducing scrolling requirements on job sites.

### P3 — Margaret Storey (A11y/Contrast)
- **Result**: **PASS**. All text elements (tagline, badges, CTA button text) have contrast levels exceeding 4.5:1, and the floating badge font size respects the 14px label minimum size.

---

## 4. Auditor Reports

1. **Brand_Auditor**: Verified spacing, colors, font declarations, and border-radius (`rounded`) compliance. Contrast violations and font-size minimums have been resolved.
2. **Data_Steward**: Verified zero database collections or schema fields were altered.
3. **Linguistic_Auditor**: Confirmed all dynamic headers, taglines, and CTAs pull from translation locale files. Zero hardcoded copy.

---

## 5. Verification Logs
- `npm run build`: Success.
- `npm run lint`: Success.
- Assets changed:
  - [RecurringCTA.tsx](file:///workspaces/fresh_nest/src/components/home/RecurringCTA.tsx)
