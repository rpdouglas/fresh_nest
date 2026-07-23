# P3-E10 — 3-Strategy Plan
**Epic:** Loyalty & Referral Reward Loop
**Date:** 2026-07-22
**Author:** Claude (AGY Phase A)

---

## Strategy Comparison

| Dimension | Strategy 1 (Recommended) ⭐ | Strategy 2 | Strategy 3 |
|---|---|---|---|
| Credit ledger writes | Callable-only — no direct client write to `credits`, not even admin | Admin direct `updateDoc` for adjust/revoke (D1–D3 precedent) | Same as Strategy 1 |
| Discount/redemption mechanism | Internal Firestore `credits` ledger, applied inside `createPaymentIntent` | Same | Real Stripe Coupon/PromotionCode objects |
| Financial integrity | Server-validated at every mutation; audit-logged | A compromised/mistaken admin write can forge unlimited credit with no server bounds-checking | Server-validated, but via a second external system (Stripe) that must stay reconciled with Firestore |
| New surface area | Moderate — 2 new callables, 1 new trigger, 1 rules change | Moderate, same shape, smaller trust boundary | Large — Stripe coupon lifecycle, webhook reconciliation, still needs the same trigger/UI work |

---

## Strategy 1 (Recommended) — Callable-Mediated Ledger

### Summary
1. **`referralConfig`** (new doc): configurable `$20/$20`, public-read, admin-write.
2. **`referrals/{code}`** extended with `ownerEmail` at creation (`onBookingCreated`), so credit issuance doesn't need an extra lookup.
3. **New trigger** (separate from `onStaffUpdatedTrigger`'s audit-logging shape, same split as `onStaffStatusActivated`/`onStaffDeactivated`): fires on `bookings.status -> 'confirmed'` where `referredBy` is set and no credit has yet been issued for that specific booking (idempotency guard against duplicate status writes). Issues one `credits` doc to the referrer.
4. **`createPaymentIntent`** extended: subtracts the referee discount if `referredBy` is valid, and separately subtracts the paying customer's own available credits (looked up by email), marking them `redeemed` atomically in the same call — closes the double-spend window between two simultaneous browser tabs.
5. **`credits` collection**: zero direct client writes, customer read-only on their own docs. All mutation goes through `issueCredit` (internal, called by the trigger) and a new admin-gated `adjustCredit` callable — both write `auditLog`.
6. **Customer portal**: new `/account/rewards` tab (extends `CustomerPortalLayout.tsx`'s existing 3-tab array) — own code/share link (reuses `ThankYouPage.tsx`'s existing logic), credit history, available balance.
7. **Admin**: new Rewards screen (mirrors `PayRatesManager.tsx`/`AuditLogsTable.tsx`) — all credits, Adjust/Revoke via the callable.
8. **`onBookingCancelled`** extended to flip `referrals/{code}.active = false` when the cancelled booking owns that code — closes ADR-009's own flagged gap.

### Files Changed

| File | Change |
|---|---|
| `packages/shared/src/types/booking.ts` | Add `Credit`, `ReferralConfig` types; extend `Referral`-shaped data with `ownerEmail`. |
| `packages/shared/src/firebase/converters.ts` | Add `creditConverter`; parse `issuedAt`/`redeemedAt` timestamps. |
| `functions/src/triggers/booking.ts` | Extend `onBookingCreated` (`ownerEmail`) and `onBookingCancelled` (deactivate code); new credit-issuance trigger. |
| `functions/src/callable/payments.ts` | Extend `createPaymentIntent` with discount + credit-redemption math. |
| `functions/src/callable/referrals.ts` | New — `adjustCredit` (admin-gated). |
| `functions/src/index.ts` | Export the new trigger + callable. |
| `apps/customer/src/components/layout/CustomerPortalLayout.tsx` | Add the 4th tab. |
| `apps/customer/src/pages/customer/CustomerRewardsPage.tsx` | New. |
| `apps/customer/src/components/admin/RewardsManager.tsx` | New admin screen. |
| `apps/customer/src/pages/AdminPage.tsx` | Wire in the new admin tab. |
| `firestore.rules` | New `credits`/`referralConfig` blocks — **flagged for explicit human review before deploy**, per `docs/COMPLIANCE.md`. |
| `docs/firestore-schema.md` | Document `credits`, `referralConfig`, extended `referrals`. |

### Persona Impact
- **Diane**: her referral network actually pays off now, in French.
- **Travis**: sees the $20 off applied before he pays — no surprise, no friction.
- **Lauren**: one screen for every credit issued/redeemed, with the ability to fix a mistake.

### Risks
- **Double-issuance on repeated `confirmed` writes**: mitigated by the idempotency check (query `credits` for an existing doc with this `sourceBookingId` before issuing).
- **Double-spend across two simultaneous checkout tabs**: mitigated by marking credits `redeemed` inside the same `createPaymentIntent` call that computes the discount, not as a separate step.
- **`firestore.rules` deploy is a hard blocker until a human reviews it** — Phase B will produce the rules diff but will not run `firebase deploy --only firestore:rules` without explicit sign-off, per `docs/COMPLIANCE.md`.
- **No test infra exists in `functions/`** (confirmed — zero test files, no test script, same gap every prior epic's Cloud Function code has shipped with). The discount/credit math is the most financially sensitive code this session has written; flagging this explicitly rather than silently accepting the same gap — worth discussing whether to introduce minimal `functions/` test infra as part of this epic given the stakes.

### Mitigation
- Idempotency guard on credit issuance, keyed on `sourceBookingId`.
- Atomic redeem-and-charge inside `createPaymentIntent`.
- Rules diff called out explicitly as its own deliverable requiring sign-off, not bundled silently into a "no rules change" close report.

---

## Strategy 2 — Direct Client Writes for Admin Credit Actions

### Summary
Same trigger/callable design for automatic issuance and Stripe-side redemption, but admin "adjust/revoke" done via a plain client `updateDoc` on the `credits` doc, matching D1–D3's checklist-toggle precedent (`isAdmin()` already grants unrestricted write access).

### Assessment
Rejected. D1–D3's direct-write precedent works because the fields being toggled are booleans with no server-side bounds (`idVerified`, `keysReturned`, etc.) — a wrong click just needs re-clicking. `credits.amount` is a real dollar figure that directly reduces a future Stripe charge. A raw client write has no way to validate the amount, prevent setting a negative revocation into a positive credit, or guarantee the audit log entry is actually written (a client crash between `updateDoc` and the audit write leaves an unlogged financial change). The trust model that justified skipping a callable in D1–D3 doesn't hold once the field is money.

---

## Strategy 3 — Real Stripe Coupon/PromotionCode Objects

### Summary
Instead of an internal Firestore `credits` ledger, create a real Stripe Coupon scoped to the referrer's customer on credit issuance, and let Stripe apply it automatically at their next `createPaymentIntent` call.

### Assessment
Rejected for this epic's scope — legitimate longer-term architecture (offloads ledger bookkeeping to Stripe, arguably more "correct"), but materially larger: real Stripe API surface for coupon creation/expiry, a reconciliation problem between Stripe's coupon state and Firestore's booking state, and a new failure mode (Stripe API down at trigger time) with no clean retry story. The epic's own acceptance criteria only requires "reduces next booking's PaymentIntent amount" — achievable with a much simpler internal ledger that stays entirely within infrastructure this codebase already manages. Matches the same reasoning used to reject the equivalent "more infrastructure than the acceptance criteria needs" option in D2 and D3.

---

## Recommended Strategy: **Strategy 1**

### Execution Plan (Phase B)
1. Add `referralConfig`/`credits` schema (shared types, converter, `docs/firestore-schema.md`); extend `referrals` with `ownerEmail`.
2. Build the credit-issuance trigger; extend `onBookingCancelled` for code deactivation.
3. Extend `createPaymentIntent` with discount + redemption math; build `adjustCredit` callable.
4. Build the customer `/account/rewards` tab and the admin Rewards screen.
5. Produce the `firestore.rules` diff for `credits`/`referralConfig` — **present it explicitly for human review before any deploy**, per `docs/COMPLIANCE.md`.
6. Run `npm run build && npm run lint`; invoke Brand_Auditor, Data_Steward, Linguistic_Auditor.
7. Write the Phase C close report and mark P3-E10 ✅ in `docs/ACTIVE_CYCLE.md`.

---

## HALT — Awaiting Human Approval
Please approve Strategy 1 to proceed to Phase B execution. Note: this epic's `firestore.rules` changes will be presented separately for explicit sign-off before any deployment, per `docs/COMPLIANCE.md` — approving Strategy 1 here approves writing the rules diff, not deploying it.
