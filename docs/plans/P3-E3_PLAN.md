# P3-E3: Admin Booking Creation — Phase A Strategy Plan

**Epic:** P3-E3 · **Priority:** P1 · **Complexity:** L
**Prepared:** 2026-06-18
**Persona gate:** Lauren creates a phone-in booking in under 2 minutes.

---

## Strategy 1 — New AdminBookingModal, Single-Page Form (Recommended)

**What:** Build a dedicated `AdminBookingModal` component — a single-page (non-step) scrollable modal with all fields. Extend `submitBooking` in `firestore.ts` with an `adminCreate` variant that accepts privileged fields. Update Firestore rules to gate the admin path via `isAdmin()`.

**Files changed:**
- `apps/customer/src/components/admin/AdminBookingModal.tsx` — new: single-page form, all required + optional + admin-only fields
- `apps/customer/src/components/admin/BookingsTable.tsx` — add "New Booking" button to header; wire `AdminBookingModal`
- `apps/customer/src/lib/firebase/firestore.ts` — add `adminCreateBooking(input, adminEmail)` function: writes with `status: 'pending' | 'confirmed'`, `createdBy`, non-null `assignedTo`; bypasses Stripe
- `apps/customer/src/types/index.ts` — extend `LeadSource` type with `'phone' | 'walk-in'`
- `firestore.rules` — split create rules: public path blocks `status: confirmed`, `assignedTo`, `createdBy`; admin path (via `isAdmin()`) permits all three — **requires human review before deploy**
- `apps/customer/src/i18n/locales/en.json` + `fr.json` — all AdminBookingModal UI strings
- `docs/firestore-schema.md` — document `createdBy` field and extended `leadSource` enum

**Persona impact:** Lauren logs a P3 Margaret phone call or P6 Gallagher walk-in in < 2 minutes without redirecting the customer to the public site. P4 Baptiste referrals can be entered with `leadSource: 'phone'` and notes. Confirmation email/SMS fires in client's selected language automatically via `onBookingCreated`.

**Risks:**
- Firestore rules split is the most security-sensitive change; **human review required before `firebase deploy --only firestore:rules`**
- Admin booking must NOT trigger Stripe — requires explicit check in `adminCreateBooking` that bypasses the `createPaymentIntent` call
- `onBookingStatusConfirmed` fires if `status: 'confirmed'` at creation — Job document created automatically; ensure this is desired behaviour for walk-ins

**Schema audit:** Adds `createdBy?: string` to `bookings`. Extends `leadSource` enum with `'phone'` and `'walk-in'`. Both are additive — existing documents unaffected. `docs/firestore-schema.md` must be updated.

---

## Strategy 2 — Reuse Public Booking Form Steps Inside Admin

**What:** Render the existing multi-step `BookingPage` form inside the admin modal, with additional admin-only fields (language, leadSource, assignedTo, status) injected as a final admin-only step.

**Files changed:**
- Existing `BookingStep1` through `BookingStep4` components refactored to accept an `adminMode` prop
- New `BookingStep5Admin.tsx` — admin-only fields step
- `apps/customer/src/pages/BookingPage.tsx` — conditionally render via modal when `adminMode`
- `firestore.ts` + `firestore.rules` — same changes as Strategy 1

**Persona impact:** Familiar UX for developers; harder for Lauren — the 5-step flow is optimised for customers, not for operators entering data quickly. Phone-in bookings need all fields visible at once for efficient data entry.

**Risks:** Entangles admin and public booking logic. Any future change to the public form risks breaking admin booking. The 5-step flow violates the "under 2 minutes" acceptance criterion for an experienced admin user.

**Schema audit:** Same as Strategy 1.

---

## Strategy 3 — Extend BookingDetailPanel with Create Mode

**What:** Add a "Create New" button to `BookingsTable` that opens the existing `BookingDetailPanel` in a blank-document create mode. Repurposes the detail panel's edit fields for initial data entry.

**Files changed:**
- `apps/customer/src/components/admin/BookingDetailPanel.tsx` — add `createMode` prop; show all fields editable; save as new document
- `apps/customer/src/components/admin/BookingsTable.tsx` — add "New Booking" button

**Persona impact:** Lowest build effort, but `BookingDetailPanel` was designed for editing existing bookings — it lacks required fields for a new document (firstName, lastName, phone, address are not in the detail panel). Would require significant additions to the panel, making it serve two incompatible purposes.

**Risks:** `BookingDetailPanel` is already 300+ lines and handles complex state for existing bookings. Adding create mode increases complexity without a shared purpose. Violates the single-responsibility principle and makes future refactoring harder.

**Schema audit:** Same as Strategy 1.

---

## Recommended Strategy: **Strategy 1**

A dedicated `AdminBookingModal` keeps admin creation logic isolated, delivers the < 2 min acceptance criterion, and avoids polluting the public booking form or the detail panel. The Firestore rules split is the highest-risk element — plan for explicit human review before that deploy step.

**Awaiting human approval to proceed to Phase B.**
