# E25 — WCAG AA Accessibility Audit Plan

**Status:** Phase A — Planning Gate
**Epic:** E25
**Primary Persona:** P3 Margaret (Accessibility + phone contact + trust)

## Strategy 1: Comprehensive Accessibility Audit & Fix (Recommended & Selected)
**Description:** A complete sweep of all components to ensure full WCAG 2.1 AA compliance and adherence to P3 Margaret's requirements (touch targets, typography, contrast, layout, and visible phone numbers).
- **Files Changed:**
  - `src/components/layout/Navbar.tsx` & `src/components/layout/Footer.tsx` (Phone link visibility and touch targets)
  - `src/components/forms/*` (Booking form single-page flow, 48px touch targets, labels, focus states)
  - `src/pages/*.tsx` (Reviewing body text classes to ensure min `text-base`, removing horizontal scroll at 768px)
  - `tailwind.config.js` or `index.css` (If global focus ring utilities need updating)
- **Persona Impact:** High (Directly satisfies Margaret's need for readable text, tappable elements, and constant access to a phone number).
- **Risks:** High surface area; updating global components like Navbar and Footer might affect layout on very small screens (e.g., 320px). Need to test extensively on iPad 768px portrait.
- **Schema Audit:** No changes to `firestore-schema.md` required. Booking data structure remains identical.

## Strategy 2: Form & Input Optimization
**Description:** Focus specifically on the Booking Flow and Forms. Ensure the checkout flow is a single-page experience without multi-step wizards that lose state. Audit all `<input>`, `<select>`, and `<button>` elements for 48px minimum height.
- **Files Changed:**
  - `src/components/forms/BookingForm.tsx` (and related form sub-components)
  - `src/components/ui/Input.tsx`, `src/components/ui/Button.tsx` (If abstracted)
- **Persona Impact:** Medium (Fixes Margaret's fear of complicated forms and small touch targets, but ignores contrast and phone visibility).
- **Risks:** Isolated risk. Modifying the booking form might conflict with existing validation or CASL/Law 25 consent flows if not careful.
- **Schema Audit:** No changes to `firestore-schema.md` required.

## Strategy 3: Global Navigation & Contrast Pass
**Description:** Prioritize global layouts. Ensure the phone number is clearly visible in the Navbar and Footer as a `tel:` link. Conduct a strict color contrast audit to ensure 4.5:1 ratio across all text and background pairings.
- **Files Changed:**
  - `src/components/layout/Navbar.tsx`
  - `src/components/layout/Footer.tsx`
  - `src/components/ui/*` (Adjusting text and bg color classes, e.g. text-muted might need to be darker against certain backgrounds)
- **Persona Impact:** Medium (Provides immediate trust via phone number and readability via contrast, but leaves the booking form potentially frustrating).
- **Risks:** Altering color contrast might slightly shift the brand aesthetics (e.g., making muted text darker). Must ensure we only use tokens from `docs/design-system.md`.
- **Schema Audit:** No changes to `firestore-schema.md` required.

---
**Approval Status:** User selected Strategy 1 via `/grill-me`. Waiting for explicit authorization to proceed to Phase B.
