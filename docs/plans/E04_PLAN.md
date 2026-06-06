# E04 — Hero Section (Bilingual CTA Variants) · 3-Strategy Plan
**Epic:** E04 | **Phase:** 1 | **Date:** 2026-06-06  
**Primary Personas:** Travis McLeod (P2), Sophie Tremblay-Gagnon (P5), Margaret Storey (P3)  
**Prepared by:** AGY Phase A Planning Gate

---

## Persona Identification

| Persona | Need | E04 Feature |
| :--- | :--- | :--- |
| **Travis (P2)** | "Book a Cleaning" CTA above the fold | Mobile-optimized layout, CTA button instantly visible without scrolling |
| **Diane (P1)** | French UX from first interaction | Bilingual content served immediately via `t()` hook on initial load |
| **Sophie (P5)** | Immediate French translation (Snye QC) | Bilingual content through `t()` hook on initial load |
| **Margaret (P3)** | Accessibility and readability | Minimum 16px text, 48px touch target for the CTA |

---

## Schema Audit

E04 (Hero Section) requires **no Firestore writes or reads**. It is purely a presentation component reading from locale JSON files.
**Data_Steward verdict:** No schema changes. No risk.

---

## Files Requiring Creation or Modification

| File | Action | Notes |
| :--- | :--- | :--- |
| `src/components/home/Hero.tsx` | **Create** | New Hero component |
| `src/pages/Home.tsx` | **Modify** | Import `<Hero />` and remove the placeholder code |
| `src/i18n/locales/en.json` | **Modify** | Add hero translations (headline, subhead, CTA) |
| `src/i18n/locales/fr.json` | **Modify** | Add hero translations (headline, subhead, CTA) |

---

## i18n Key Specification

New namespaced keys to add under `hero` in both `en.json` and `fr.json`:

| Key | EN value | FR value |
| :--- | :--- | :--- |
| `hero.headline` | `"Professional Cleaning & Organizing"` | `"Nettoyage et organisation professionnels"` |
| `hero.subhead` | `"Serving Cornwall, Akwesasne, Snye & surrounding communities."` | `"Nous desservons Cornwall, Akwesasne, Snye et les communautés avoisinantes."` |

The CTA button must reuse the existing `common.bookNow` key (already present in both locale files) rather than introducing a `hero.cta` duplicate.

The existing top-level `welcome` and `tagline` keys in `Home.tsx` will be replaced by `hero.headline` and `hero.subhead` as part of this epic.

---

## Strategy 1 — Minimal Atomic (Text-focused)

### Summary
A simple, centered text-based Hero section. No complex images or animations. Focuses solely on delivering the bilingual copy and the CTA.

### Approach
- `Hero.tsx`: Uses `bg-warm-white` with `py-12 px-4 md:py-20 md:px-6` for spacing (design system Section 3).
- Center-aligned `h1` using `font-display text-5xl text-charcoal` (design system H1 scale — no breakpoint size override).
- Paragraph using `font-body text-base text-text-muted` (minimum 16px — Margaret requirement).
- "Book a Cleaning" primary CTA: `bg-slate-brand text-white font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-dark transition-colors duration-200` — note `rounded` (4px), not `rounded-lg`.
- No images or Framer Motion animations.

### Persona Impact
| Persona | Test | Result |
| :--- | :--- | :--- |
| Travis (P2) | CTA above the fold | ✅ Pass |
| Sophie (P5) | Full French hero | ✅ Pass |
| Margaret (P3) | Text size & touch targets | ✅ Pass |

### Risks
- **Low risk.** Easy to implement, but lacks visual "wow" factor or premium feel.

---

## Strategy 2 — Full-Featured Two-Column with Framer Motion (Recommended)

### Summary
A modern two-column layout on desktop (stacked on mobile) with the hero text on the left and the hero logo/image on the right, enhanced by smooth Framer Motion entrance animations.

### Approach
- `Hero.tsx`: 
  - `max-w-content mx-auto` grid layout: 1 column mobile, 2 columns desktop.
  - Left column: `h1` (`font-display text-5xl text-charcoal`), `p` subhead (`font-body text-base text-text-muted`), and a primary CTA linking to `/booking`.
  - Right column: Displays `src/assets/hero.png` (lifestyle image — not the logo mark) with an elegant fade-in or float effect. `logo-hero-340px.png` is reserved for the Navbar; using it here would duplicate the brand mark on the same viewport.
  - Framer Motion: Text and CTA stagger fade-in from the bottom (`initial={{ opacity: 0, y: 20 }}`).
  - CTA: `bg-slate-brand text-white font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-dark transition-colors duration-200` — `rounded` (4px), never `rounded-lg`.
- Incorporates `useTranslation` to instantly serve English or French.

### Persona Impact
| Persona | Test | Result |
| :--- | :--- | :--- |
| Travis (P2) | CTA above the fold | ✅ Pass (Grid stacks on mobile putting CTA right under text) |
| Sophie (P5) | Full French hero | ✅ Pass |
| Margaret (P3) | Text size & touch targets | ✅ Pass |

### Risks
- **Medium scope.** Incorporates Framer Motion (already a dependency) and responsive flex/grid layouts. Ensures image doesn't push the CTA below the fold on mobile.

---

## Strategy 3 — Background Image with Glassmorphism Overlay

### Summary
Hero section spanning the full viewport height (`min-h-screen` or `h-[80vh]`) with a background image, and a glassmorphism card in the center containing the copy and CTA.

### Approach
- `Hero.tsx`: 
  - `bg-[url('...')] bg-cover bg-center`
  - Overlay with `bg-charcoal/40` to ensure text contrast.
  - Center card: `bg-white/90 backdrop-blur-md p-8 rounded border border-sand`.
  - Same text constraints and CTA rules.

### Persona Impact
Same as Strategy 2, but has risks for Margaret's persona requirement.

### Risks
- **Higher risk.** Background images can cause WCAG AA contrast failures if not properly overlaid.
- May push CTA below the fold on smaller devices like Travis's iPhone if padding isn't perfectly tuned.

---

## Recommendation

**Strategy 2 — Full-Featured Two-Column with Framer Motion** is the recommended approach.

**Rationale:**
- It is visually engaging without the contrast risks of Strategy 3.
- On mobile (Travis), stacking the columns ensures the headline, subhead, and CTA are instantly visible above the fold, while the image rests below them or is hidden.
- Adheres perfectly to the design system spacing and Framer Motion animation standards established in E03.
- Easy to validate with the Brand Auditor.

---

## Acceptance Criteria (Pass/Fail Gate for Phase C)

- [ ] Hero headline, subhead, and CTA button use `t()` hook for EN/FR translation (`hero.headline`, `hero.subhead`, `common.bookNow`).
- [ ] CTA links directly to `/booking`.
- [ ] On mobile (375px), CTA is visible above the fold without scrolling.
- [ ] All interactive elements have `min-h-[48px]` (Margaret).
- [ ] Minimum text size is `text-base` (16px) — no `text-sm` on any body or subhead copy.
- [ ] H1 uses `font-display text-5xl text-charcoal` (design system scale; no unapproved size overrides).
- [ ] CTA button uses `rounded` (4px) — Brand_Auditor hard block on `rounded-lg` or `rounded-xl`.
- [ ] `npm run build` passes with zero TypeScript errors.
- [ ] Linguistic_Auditor confirms no hardcoded English/French strings.

---

## Pending Human Decision

**HALT — Awaiting approval of one of the three strategies before any code is written.**

Select Strategy 1, 2, or 3 to proceed to Phase B.
