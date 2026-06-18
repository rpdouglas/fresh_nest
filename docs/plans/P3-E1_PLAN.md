# P3-E1: Stripe Payment Integration — Phase A Strategy Plan

**Epic:** P3-E1 · **Priority:** P0 · **Complexity:** XL
**Prepared:** 2026-06-18
**Persona gate:** P2 Travis (< 4 min booking with card), P6 Gallagher (zero friction)

---

## Pre-conditions
- P3-E20 (Firebase App Check) must be complete before this epic executes
- P3-E7 (Cloud Functions `require()` bug fix) executes simultaneously in the same sprint
- P3-E9 (`window.__MOCK_*` cleanup) executes in the same sprint

---

## Strategy 1 — Pre-auth Hold Model (Recommended)

**What:** Authorize the card at booking submission (hold); capture the PaymentIntent when admin confirms the booking; release the hold on cancellation.

**Files changed:**
- `apps/customer/package.json` — add `@stripe/stripe-js`, `@stripe/react-stripe-js`
- `functions/package.json` — add `stripe`
- `functions/src/index.ts` — add `createPaymentIntent` callable, `stripeWebhookHandler` HTTPS, capture in `onBookingStatusConfirmed`, release in `onBookingCancelled`
- `apps/customer/src/pages/BookingPage.tsx` / `BookingStep4.tsx` — add `<Elements>` provider, `<PaymentElement>`, HST line item display
- `apps/customer/src/lib/firebase/firestore.ts` — update `submitBooking` to call `createPaymentIntent` first, confirm payment, then write to Firestore on success only; remove `window.__MOCK_SUBMIT__`
- `firestore.rules` — allow optional `stripePaymentIntentId`, `stripeChargeId`, `stripeChargeStatus` fields on booking writes
- `docs/firestore-schema.md` — add 3 new payment fields to bookings schema
- `apps/customer/e2e/checkout.spec.ts` — replace `window.__MOCK_*` with `page.route()` network interception; use test card `4242 4242 4242 4242`
- `apps/customer/src/i18n/locales/en.json` + `fr.json` — payment UI strings, HST label, error messages
- `firebase.json` — add `stripeWebhookHandler` endpoint

**Persona impact:** Travis completes booking with card in < 4 min; Gallagher gets reliable hold-and-release on turnover bookings; admin sees live payment status in `BookingDetailPanel`.

**Risks:**
- XL complexity — highest single epic in the plan; requires careful Stripe webhook signature verification to prevent spoofed capture/release events
- Firestore rules change requires human approval before deploy
- `onBookingCancelled` currently crashes (`require()` bug — P3-E7 must ship first or simultaneously)
- HST rate for QC (14.975%) is TBD — show 13% ON only for launch, flag QC as "to be confirmed"

**Schema audit:** Adds `stripePaymentIntentId?`, `stripeChargeId?`, `stripeChargeStatus?` to `bookings`. All optional — existing documents unaffected. `docs/firestore-schema.md` must be updated.

---

## Strategy 2 — Immediate Capture at Submission

**What:** Charge the card immediately when the booking is submitted (no hold/release flow). Simpler Stripe integration — no `capture_method: 'manual'`, no webhook capture step.

**Files changed:** Same set as Strategy 1, minus capture/release Cloud Function triggers.

**Persona impact:** Same for Travis. Worse for Gallagher — cancellation would require a refund workflow instead of a hold release (more admin friction).

**Risks:** Charging before the booking is confirmed creates a worse customer experience (charge appears before Lauren has confirmed the slot is available). Refund flow is more complex than hold release. Incompatible with the loyalty/referral credit model (P3-E10) which expects a Stripe coupon applied before capture.

**Schema audit:** Same 3 fields; `stripeChargeStatus` values simplified to `'captured' | 'refunded' | 'failed'`.

---

## Strategy 3 — Stripe Checkout Redirect

**What:** Redirect to a Stripe-hosted Checkout page instead of embedding `PaymentElement` in the booking form. Minimal frontend code, but breaks the single-page booking UX.

**Files changed:**
- `functions/src/index.ts` — `createCheckoutSession` callable instead of `createPaymentIntent`
- `apps/customer/src/pages/BookingPage.tsx` — replace Step 4 with a redirect to `stripe.redirectToCheckout()`
- Success/cancel redirect pages required
- `apps/customer/src/i18n/locales/*.json` — minimal payment strings

**Persona impact:** Travis must leave the Fresh Nest site to complete payment — breaks brand immersion and risks abandonment. Gallagher loses the inline booking flow that P6 persona requires. Margaret (P3) is confused by the page transition.

**Risks:** Cannot customise the Stripe Checkout UI with Fresh Nest design tokens; French language support on the hosted page requires Stripe locale config; Step 4 review (HST, address, addOns) cannot persist into the redirect cleanly.

**Schema audit:** Same payment fields; slightly different flow for populating them.

---

## Recommended Strategy: **Strategy 1**

The pre-auth hold model is what the v3 plan specifies, aligns with P3-E10 (referral Stripe coupon), and gives admin the hold/capture/release control that makes cancellations clean. Strategy 2 creates refund debt. Strategy 3 breaks persona flows.

**Awaiting human approval to proceed to Phase B.**
