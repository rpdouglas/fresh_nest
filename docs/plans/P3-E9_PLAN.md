---
epic: P3-E9
title: Remove window.__MOCK_* from Production Code — Plan
strategy: 1
approved: 2026-06-18
---

# P3-E9 PLAN — Remove `window.__MOCK_*` from Production Code

## Strategy 1 (Approved): Remove production guard, migrate E2E to page.route(), defer Stripe mock

**Approved decisions:**
- Q3 → A: Migrate Firestore half of `checkout.spec.ts` to `page.route()`; leave Stripe window-inject until P3-E1

**Files changed:**
- `apps/customer/src/lib/firebase/firestore.ts` — remove `window.__MOCK_SUBMIT__` guard block
- `apps/customer/src/vite-env.d.ts` — remove `__MOCK_SUBMIT__` type declaration
- `apps/customer/e2e/booking.spec.ts` — replace window inject with `page.route()` Firestore interception
- `apps/customer/e2e/checkout.spec.ts` — migrate Firestore portion to `page.route()`; Stripe inject unchanged

**Persona impact:** All — removes security surface from every booking submission path.

**Risks:** Low. Behaviour-preserving in production (the guard was a dead branch). E2E coverage maintained via `page.route()` — same pattern already used in `fsm.spec.ts`.

**Schema audit:** No Firestore schema change.

## Strategies considered but not chosen

### Strategy 2: Remove production guard only, leave E2E tests unchanged
- Risk: E2E tests break immediately because `window.__MOCK_SUBMIT__` no longer intercepts the real Firestore write
- Rejected: broken tests are worse than the original problem

### Strategy 3: Remove everything including `__MOCK_CREATE_PAYMENT_INTENT__` now
- Risk: `checkout.spec.ts` becomes partially non-functional until P3-E1 ships Stripe
- Rejected: v3 plan explicitly defers `__MOCK_CREATE_PAYMENT_INTENT__` to P3-E1
