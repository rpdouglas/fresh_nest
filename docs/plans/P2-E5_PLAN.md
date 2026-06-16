# Phase A Plan: P2-E5 Accessibility Pass (WCAG 2.1 AA)

This plan outlines three strategies for establishing full WCAG 2.1 AA accessibility compliance across the customer booking flows and admin panels (including FSM portal screens).

---

## Strategy 1: Wizard-based Booking Form, Global Token Updates & Semantic ARIA Fixes (Recommended)
This strategy converts `/booking` into a true 4-step wizard using `StepIndicator.tsx`, adding Back/Next navigation buttons with validation on each step, and implementing programmatic focus shifting to the step title on transitions. It also binds the HTML `lang` attribute dynamically, fixes the FSM mobile menu toggle, enforces 48px touch targets, and updates the Tailwind color tokens globally to resolve contrast issues.

### Files Changed
- [apps/customer/tailwind.config.js](file:///workspaces/fresh_nest/apps/customer/tailwind.config.js) and [apps/fsm/tailwind.config.js](file:///workspaces/fresh_nest/apps/fsm/tailwind.config.js): Adjust color hex values for `text-muted` (darken from `#7a8f96` to `#5f727c` to achieve >= 4.5:1 on warm-white and cream) and `slate-brand` (darken from `#5b7e8f` to `#547788` to achieve >= 4.5:1 for white text on slate-brand background and slate-brand on warm-white).
- [docs/design-system.md](file:///workspaces/fresh_nest/docs/design-system.md): Update the color codes of `text-muted` and `slate-brand` in documentation.
- [apps/customer/src/pages/BookingPage.tsx](file:///workspaces/fresh_nest/apps/customer/src/pages/BookingPage.tsx):
  - Implement a wizard state (`currentStep` from 0 to 3).
  - Use `StepIndicator` to display progress.
  - Render only the current step (1–4) conditionally.
  - Add "Back" and "Next" buttons with `type="button"` and `min-h-[48px]`.
  - Validate the current step fields using `methods.trigger` before advancing.
  - Programmatically focus the h2 header of the newly active step on transitions using refs.
- [apps/customer/src/components/booking/BookingStep1.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/booking/BookingStep1.tsx): Add a ref-forwarded heading for focus targeting.
- [apps/customer/src/components/booking/BookingStep2.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/booking/BookingStep2.tsx): Add a ref-forwarded heading for focus targeting.
- [apps/customer/src/components/booking/BookingStep3.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/booking/BookingStep3.tsx): Add a ref-forwarded heading for focus targeting.
- [apps/customer/src/components/booking/BookingStep4.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/booking/BookingStep4.tsx): Add a ref-forwarded heading for focus targeting. Fix the CASL marketing consent label's touch target size by adding `min-h-[48px]` and aligning items.
- [apps/customer/src/components/layout/Layout.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/layout/Layout.tsx): Bind document `lang` dynamically using `i18n.language`.
- [apps/fsm/src/components/layout/FsmLayout.tsx](file:///workspaces/fresh_nest/apps/fsm/src/components/layout/FsmLayout.tsx):
  - Bind document `lang` dynamically using `i18n.language`.
  - Add Skip to Content Link `<a href="#main-content" className="sr-only focus:not-sr-only">` at the very top.
  - Change main content container wrapper to `<main id="main-content" tabIndex={-1} className="flex-grow">`.
  - Add `aria-controls="mobile-menu"` on the mobile hamburger button toggle.
  - Add `id="mobile-menu"` on the mobile dropdown menu div.
- [apps/fsm/src/i18n/locales/en.json](file:///workspaces/fresh_nest/apps/fsm/src/i18n/locales/en.json), [fr.json](file:///workspaces/fresh_nest/apps/fsm/src/i18n/locales/fr.json), [ar.json](file:///workspaces/fresh_nest/apps/fsm/src/i18n/locales/ar.json): Add `fsm.skipToContent` translation key.

### Persona Impact
- **P3 Margaret Storey**: Has a huge impact. She can comfortably navigate the 4-step form step-by-step with clear headers announced upon transition. The entire customer app and FSM portal have fully compliant high contrast (4.5:1) body and label texts, with all touch targets >= 48px (including the previously small marketing consent checkbox).
- **P2 Travis McLeod**: The wizard structure is much cleaner on mobile viewports than a long scrolling form, reducing mobile booking friction.
- **P1 Diane Lafleur & P5 Sophie Tremblay-Gagnon**: Dynamically updates the HTML `lang` attribute to `fr` when the French toggle is clicked, ensuring correct screen reader pronunciations.
- **P10 Ahmed**: Dynamically updates HTML `lang` attribute to `ar` in FSM, enabling RTL layout support and Arabic screen readers.

### Risks & Mitigations
- *Risk*: Navigating away from incomplete steps when focus shifts.
  - *Mitigation*: The form values are stored in React Hook Form's context, preserving the form state completely between steps. Validation runs before a user can move to the next step, preventing progress with invalid data.
- *Risk*: Screen readers losing context on step transition.
  - *Mitigation*: Programmatically shifting focus to the `h2` header of the step ensures screen readers read the header immediately.

### Schema Audit
- No database schema changes are required for this epic. All existing Firestore collections and rules are preserved.

---

## Strategy 2: Single-Page Accordion, Custom Local Colors & Anchor Focus
This strategy retains the single-page layout for `/booking` but uses collapsible accordion headers. Instead of updating global Tailwind config tokens (which changes them across all pages), it overrides text colors locally on specific pages where the background is cream or warm-white.

### Files Changed
- [apps/customer/src/pages/BookingPage.tsx](file:///workspaces/fresh_nest/apps/customer/src/pages/BookingPage.tsx): Convert step divs into accordion-like panels. When a panel is expanded, scroll and focus its header.
- [apps/customer/src/components/booking/BookingStep4.tsx](file:///workspaces/fresh_nest/apps/customer/src/components/booking/BookingStep4.tsx): Update specific text copy to use `text-charcoal` instead of `text-muted`.
- [apps/fsm/src/components/layout/FsmLayout.tsx](file:///workspaces/fresh_nest/apps/fsm/src/components/layout/FsmLayout.tsx): Add skip link and FSM mobile controls.

### Persona Impact
- **P3 Margaret Storey**: Good, but expanding and collapsing accordions with keyboard navigation is more complex than a standard wizard.
- **P2 Travis McLeod**: Better than a single long scrolling page, but accordions on mobile can still cause jumpy scrolling.

### Risks & Mitigations
- *Risk*: Local overrides might miss certain texts, leaving contrast violations.
  - *Mitigation*: Redefining the token globally (Strategy 1) is much safer and more maintainable than ad-hoc inline overrides.

---

## Strategy 3: Inline Validation Focus & Minimum Fixes
This strategy maintains the exact single-page stacked layout currently present on `/booking` (all steps rendered and fully visible at once) and focus shifts only when validation errors are triggered.

### Files Changed
- [apps/customer/src/pages/BookingPage.tsx](file:///workspaces/fresh_nest/apps/customer/src/pages/BookingPage.tsx): When validation fails, focus the first error element.
- [apps/fsm/src/components/layout/FsmLayout.tsx](file:///workspaces/fresh_nest/apps/fsm/src/components/layout/FsmLayout.tsx): Fix FSM mobile nav toggle attributes.

### Persona Impact
- **P3 Margaret Storey**: Keyboard users must tab through a very long single form.
- **P2 Travis McLeod**: High friction on mobile since they must scroll through all 4 cards at once.

### Risks & Mitigations
- *Risk*: Low accessibility score and high friction for users.
  - *Mitigation*: Strategy 1 is highly recommended to fully deliver E15/E22 wizard standards.
