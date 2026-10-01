# P3-E29 — 3-Strategy Plan
**Epic:** Remove Public Pricing & Discounts (Quote Follow-Up). See [`docs/projects/P3-E29.md`](../projects/P3-E29.md)
**Date:** 2026-09-30
**Author:** Claude Code (AGY Phase A)
**Status:** ✅ Strategy 2 approved by human 2026-09-30 · D1–D6 approved as recommended

---

## Decisions needed with any strategy

| # | Decision | Recommendation |
|---|---|---|
| **D1** | **P2 Travis conflict.** PERSONAS.md P2 ("see a real price before giving any contact information", acceptance steps 2–3) and CLAUDE.md Rule 3 ("price visible on landing") contradict this epic. | Authorise a PERSONAS.md v4.2 edit that makes P2 about *speed and no friction*: request in under 3 minutes, no account, SMS confirmation. Drop price visibility and the biweekly-discount requirement. Update CLAUDE.md Rule 3 to match. |
| **D2** | **Stripe hold at booking step 4.** It charges `estimate × 1.13` before the booking is saved. With no price shown, charging a card isn't possible. | Remove the payment step from the public flow. Leave the Stripe functions deployed but unused, ready for P3-E26 deposits. |
| **D3** | **Referral programme** ("$20 off" for both parties). It's a discount, so it's in scope. | Remove the promo-code field and the referral share card from the public site. Keep the `referrals` collection and rules untouched. |
| **D4** | **Blog post "cost of cleaning in Cornwall"**, which lists $ ranges. | Unpublish that post. A no-price rewrite can come later. |
| **D5** | **FAQ items 7 and 10** (a same-day cancellation "fee may apply"; accepted payment methods). These describe terms, not prices. | Keep item 10. Keep item 7 but drop the word "fee" ("please give 24 hours' notice"). |
| **D6** | **`/pricing` URL**, which is linked from nav, service pages, the Airbnb page and search results. | Remove the nav link and redirect `/pricing` → `/booking`, so old links and search results still work. |

---

## Strategy Comparison

| | Strategy 1 — Strip in place | Strategy 2 ⭐ — Quote-request flow | Strategy 3 — Feature flag |
|---|---|---|---|
| Prices and discounts removed | ✅ | ✅ | ✅ (hidden) |
| Booking flow | 4 steps; step 4 becomes review-only | **3 steps + review; "Request a Quote" wording throughout** | Unchanged code, payment step hidden |
| Confirmation email/SMS | Unchanged ("booking confirmed", now misleading) | **"Request received — we'll follow up with a quote" (EN/FR)** | Unchanged |
| Home calculator | Kept, prices removed (selector only) | **Replaced by a short "What do you need?" selector that pre-fills the request** | Kept, prices hidden |
| Reversible | Via git | Via git | **Instant (env flag)** |
| Dead code left behind | Some (pricing lib used by admin only) | Little | **All pricing UI kept, behind flags** |
| Functions touched | No | Yes (email/SMS copy) | No |
| Complexity | S–M | M | M |

---

## Strategy 1 — Strip in Place

### Summary
Delete price and discount *display* everywhere and keep the page and flow structure as it is:
- **Home:** the calculator keeps its three selectors (size, service, frequency) but loses the price output and the % badges. `RecurringCTA` is rewritten as "Recurring schedules available" with no savings copy.
- **Service and Airbnb pages:** the pricing blocks are removed.
- **Booking:** step 2 loses its "Save x%" badges. Step 4 keeps its layout as a **review** step: no Stripe, no promo field, and `createPaymentIntent` is no longer called.
- **Pricing page:** `/pricing` redirects to `/booking`, and the nav link is removed.
- **Referrals:** the thank-you referral card is removed.
- **SEO:** `priceRange` is dropped from the JSON-LD.
- **Blog and FAQ:** the pricing post is unpublished and the FAQ is edited (D4, D5).

The confirmation email and SMS are **not** changed.

### Files changed
- **Pages and components:**
  - `apps/customer/src/pages/Home.tsx`
  - `apps/customer/src/components/home/QuoteCalculator.tsx`
  - `apps/customer/src/components/home/RecurringCTA.tsx`
  - `apps/customer/src/pages/PricingPage.tsx` (deleted)
  - `apps/customer/src/App.tsx` (`/pricing` → `<Navigate to="/booking">`)
  - `apps/customer/src/components/layout/Navbar.tsx`
  - `apps/customer/src/pages/ServicePage.tsx`
  - `apps/customer/src/pages/AirbnbTurnoverPage.tsx`
- **Booking:**
  - `apps/customer/src/components/booking/BookingStep2.tsx`
  - `apps/customer/src/components/booking/BookingStep4.tsx`
  - `apps/customer/src/pages/BookingPage.tsx` (remove Stripe `Elements`, `loadStripe`, `computeBookingEstimatedPrice`, and the PaymentIntent fetch)
  - `apps/customer/src/lib/firebase/firestore.ts` (`submitBooking` stops writing `estimatedPrice` and the Stripe fields)
- **Thank-you and portal:**
  - `apps/customer/src/pages/ThankYouPage.tsx`
  - `apps/customer/src/pages/customer/CustomerUpcomingPage.tsx` (cancel message)
- **SEO and content data:**
  - `apps/customer/src/lib/utils/seo.ts`
  - `apps/customer/src/lib/data/blogData.ts`
  - `apps/customer/src/lib/data/serviceData.ts` (drop `pricingKey`)
- **Copy:** `apps/customer/src/i18n/locales/{en,fr}.json`. Remove or rewrite the roughly 40 keys listed in the spec audit, in both languages.
- **Tests:**
  - `apps/customer/src/lib/firebase/analytics.test.ts` if it covers price events
  - Remove `apps/customer/e2e/checkout.spec.ts` (Stripe)
  - Update the price assertions in `apps/customer/e2e/booking.spec.ts`
- **New guard test:** `apps/customer/src/i18n/noPricing.test.ts`. It fails if any customer-facing EN/FR string contains a `$` amount, a "% off" discount or a referral reward.
- **Docs:**
  - `user-guide/booking-guide.md`
  - `docs/PERSONAS.md` v4.2 and `CLAUDE.md` Rule 3 (after D1 authorisation)

### Persona impact
- **P3 Margaret / P4 Baptiste:** no automated prices, but the flow still *reads* like instant booking, and the email says "Your booking is confirmed!". Confirming a booking with no agreed price creates the wrong expectation.
- **P1 Diane / P5 Sophie:** the FR copy is stripped in step, but the FR email still says "confirmée".
- **P2 Travis:** fast, but the calculator is now a "calculator" that calculates nothing.
- **P6 Gallagher:** loses the turnover price, with no replacement framing.

### Risks
- **Misleading confirmation.** The customer is told the booking is "confirmed" with no price agreed. That's a trust and complaint risk, and **this is the main reason Strategy 1 isn't recommended.**
- The calculator UI without output looks broken.
- `/pricing` search results land on a booking form that doesn't say why prices are gone.

### Schema audit
No new fields. The customer site stops *writing* `estimatedPrice`, `stripePaymentIntentId` and `stripeChargeStatus`, which are all optional in `firestore-schema.md` and `firestore.rules`. The public create rule doesn't require them, so **no rules change** is needed.

### Tailwind audit
No new classes. Only markup is removed.

---

## Strategy 2 ⭐ (Recommended) — Quote-Request Flow

### Summary
Everything in Strategy 1, plus the site is *reframed* consistently as request → quote follow-up, so no page or message implies an agreed price:

1. **Wording (EN/FR):** "Book a Clean" / "Book Now" CTAs become **"Request a Quote" / « Demander une soumission »** on the home page, service pages, Airbnb page, nav and booking page. The booking page heading and steps become "Request a quote".
2. **Home:**
   - `QuoteCalculator` is replaced by a compact **"What do you need?"** selector (service, property size, frequency) with a "Request a Quote" CTA that pre-fills the form. It keeps Travis's three taps and pre-fill.
   - `RecurringCTA` becomes a no-savings "Recurring cleaning available: weekly, biweekly, monthly" section.
3. **Booking:** 3 input steps, then a **Review & Send** step with no payment, no promo and no totals. Submitting writes the same `pending` booking as today.
4. **Thank-you page:** "Request received. A member of our team will contact you within 24 hours with your quote." The phone number is prominent (P3). The referral card is removed.
5. **Confirmation email and SMS** (`functions/src/emailTemplates.ts`, `smsTemplates.ts`), EN/FR:
   - Subject: "We received your cleaning request".
   - Body: "we'll follow up with a quote within 24 hours". Replaces "Your booking is confirmed!".
   - The owner email subject becomes "New quote request". The existing `onBookingCreated` trigger is reused.
6. **`/pricing`** redirects to `/booking`, and the nav "Pricing" link is removed. Service and Airbnb pricing blocks become **"Every home is different"** blocks: a short paragraph and a "Request a Quote" CTA.
7. **Discounts, referrals, blog, FAQ, SEO:** same as Strategy 1 (D3–D6), plus the no-pricing guard test.

### Files changed
- **Everything in Strategy 1**, plus:
- **Home:**
  - `apps/customer/src/components/home/QuoteCalculator.tsx`: rewritten as `ServiceSelector`, or renamed with an import update in `Home.tsx`.
  - `apps/customer/src/components/home/Hero.tsx`: CTA wording.
- **Booking:**
  - `apps/customer/src/components/booking/StepIndicator.tsx`: step labels.
  - `apps/customer/src/components/booking/BookingStep4.tsx`: becomes Review & Send.
- **Wording:**
  - `apps/customer/src/components/layout/Navbar.tsx`
  - `apps/customer/src/components/layout/Footer.tsx`
  - `apps/customer/src/pages/ServicesOverview.tsx`
  - `apps/customer/src/pages/LocationPage.tsx`, if it has booking CTAs with price wording
- **Functions:**
  - `functions/src/emailTemplates.ts`: client and owner subject and body, EN/FR.
  - `functions/src/smsTemplates.ts`: booking-received SMS, EN/FR, if a booking SMS exists.
- **Functions test:** `functions/test/emailTemplates.test.ts` (new) asserts the EN/FR "request received / quote to follow" copy and that there are no prices.
- **Copy:** `apps/customer/src/i18n/locales/{en,fr}.json`, including new `quoteRequest.*` keys.
- **Docs:**
  - `user-guide/booking-guide.md`
  - `docs/PERSONAS.md` v4.2 and `CLAUDE.md` Rule 3 (after D1)
  - `docs/ACTIVE_CYCLE.md`: P3-E29 row; P3-E26 note ("public site already quote-first")
- **Unchanged:**
  - The admin dashboard, which can still record an internal `estimatedPrice` on bookings it creates.
  - `lib/utils/quotePricing.ts`, which admin still uses.
  - The Stripe functions.
  - `firestore.rules` and the FSM app.

### Persona impact
- **P3 Margaret:** the site and email set the right expectation: a person will call. The phone number is prominent at the point of submission. Keyboard-only and 48px targets are unchanged.
- **P4 Baptiste:** the price is agreed in conversation, and the Akwesasne notes field stays.
- **P1 Diane / P5 Sophie:** "Demander une soumission" is idiomatic Québec/Ontario French for a quote. The confirmation email arrives in French.
- **P6 Gallagher:** "Every turnover is different — request a quote" with the 11am–3pm window kept. Volume pricing is discussed on the quote.
- **P2 Travis:** three taps still pre-fill the request, with no account, and it's still well under 3 minutes. He doesn't see a price, which is covered by the D1 persona revision.
- **P12 Lauren (owner):** owner notifications arrive as "New quote request", so the follow-up is obvious.

### Risks
- **Conversion drop:** price-shoppers like Travis may leave without a number. That's a business trade-off the human accepted with this request.
- **Email change reaches every new request.** The subject and body change for all new bookings, so it needs a careful FR review and a functions deploy. CI handles the deploy through path filtering.
- **Admin workflow:** a `pending` booking now always means "quote needed". Lauren's process must be to call or email before confirming. **No code enforces this.** P3-E26 adds structure later.
- **SEO:** removing `/pricing` and "transparent pricing" copy may lose price-intent search traffic. The redirect keeps existing links working.
- **E2E:** `checkout.spec.ts` is deleted and `booking.spec.ts` is updated. Both are already non-blocking and broken (ADR-013).

### Schema audit
**No new fields.**
- `status: 'pending'` is reused as "quote requested".
- `estimatedPrice`, `stripePaymentIntentId` and `stripeChargeStatus` are no longer written by the public site. All are optional in `firestore-schema.md`.
- **No `firestore.rules` change.** The public create rule already allows their absence.
- P3-E26's new `BookingStatus` values (`quote_requested`, etc.) are deliberately **not** introduced here. That's P3-E26's schema work.

### Tailwind audit
No new classes. The new selector and the "Every home is different" blocks reuse existing card, button and section classes from `QuoteCalculator`, `ServicePage` and `RecurringCTA`: `rounded`, `border-sand`, `bg-cream`, `bg-slate-brand`, `text-charcoal`, `font-display`/`font-body`, `min-h-[48px]`.

---

## Strategy 3 — Feature Flag (Hide, Don't Delete)

### Summary
Add a build-time flag, `VITE_SHOW_PRICING` (default `false`), read once in `apps/customer/src/lib/config.ts`. Every price or discount block and the Stripe step render only when it's `true`. i18n keys stay; Stripe and promo code stay behind the flag. Turning pricing back on is a one-line env change and a redeploy.

### Files changed
- **Flag:**
  - `apps/customer/src/lib/config.ts`: `SHOW_PRICING` constant.
  - `apps/customer/src/vite-env.d.ts`: env type.
  - `.github/workflows/firebase-deploy.yml` and `firebase-preview.yml`: pass `VITE_SHOW_PRICING`.
- **Conditionals added:**
  - `Home.tsx`, `QuoteCalculator.tsx`, `RecurringCTA.tsx`
  - `ServicePage.tsx`, `AirbnbTurnoverPage.tsx`
  - `BookingStep2.tsx`, `BookingStep4.tsx`, `BookingPage.tsx`
  - `ThankYouPage.tsx`, `Navbar.tsx`, `App.tsx` (`/pricing` route), `seo.ts`
- **Blog:** `blogData.ts` (flag-filtered post).
- **Copy:** `apps/customer/src/i18n/locales/{en,fr}.json` gets alternate no-price copy for sections that need wording when hidden. That means about 20 new keys, and the old ones stay.
- **Tests:** both flag states for the booking page and home.
- **Docs:** `docs/PERSONAS.md` / `CLAUDE.md` (D1), `user-guide/booking-guide.md`.

### Persona impact
- The same as Strategy 1 when the flag is off, unless Strategy 2's reframing is also built behind the flag, which roughly doubles the copy work.
- **P2 Travis:** his original price experience can be restored instantly.

### Risks
- **Two sites in one codebase:** every future change to home, services or booking must work with pricing on and off. That's ongoing cost for a solo maintainer.
- **Stale code:** pricing code and the Stripe step rot behind a flag nobody turns on.
- **Leaks:** a missed conditional shows a price; i18n still ships the price strings in the bundle, which is visible in page source.
- **The confirmation email still says "confirmed"** unless the functions are also flagged.

### Schema audit
No new fields. The flag is a build-time env var, not a Firestore `settings` document, because a settings document would be an invented schema and a **blocker**.

### Tailwind audit
No new classes. Only conditional rendering.

---

## Recommendation

**Strategy 2.** Removing prices without changing the flow's wording leaves the site and email promising a *confirmed booking* with no agreed price. That's the main failure mode of Strategy 1, and Strategy 2 prevents it. It also makes the public site consistent with where P3-E26 is heading (quote-first), without taking on P3-E26's schema. Strategy 3 is only worth it if you expect to turn public pricing back on within weeks.

**Before Phase B:** answer D1–D6. D1 needs explicit authorisation to edit PERSONAS.md P2.

## Phase B checklist (approved strategy)
1. Implement; run Brand_Auditor, Data_Steward and Linguistic_Auditor. The no-pricing guard test must pass for EN and FR.
2. `npm run build && npm run lint`, customer unit tests, and functions tests (Strategy 2).
3. Scan the built `apps/customer/dist` for `$` amounts and "% off".
4. PR → preview (customer + functions jobs) → review the preview → merge. CI deploys the functions and the customer site.
