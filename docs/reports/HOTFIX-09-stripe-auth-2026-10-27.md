# HOTFIX-09 — Stripe endpoints usable without sign-in (gap analysis N-4)

**Date:** 2026-10-27 · **Found by:** FSM gap analysis ([R10](../gap-analysis/GAP_ANALYSIS_2026-10-27.md)) · **Owner decision:** keep the Stripe functions, require sign-in (answers §7, Q5) · **Status:** ✅ Code complete (PR #38); deploys with the merge (functions)

## Persona
P12 Lauren (owner): no unexpected Stripe activity or tampered booking payment fields. Clients pay by e-Transfer or cash for now (MP-S3), so nothing customer-facing changes.

## Problem
1. **`createPaymentIntent`** (callable) had no auth check. Anyone could create Stripe payment intents (manual capture, CAD) through the deployed endpoint.
2. **`stripeWebhookHandler`** fell back to trusting the raw request body when `STRIPE_WEBHOOK_SECRET` or the `stripe-signature` header was missing. Anyone could post a fake `payment_intent.succeeded` event and change `stripeChargeStatus` / `stripeChargeId` on a booking.

## Fix
- **`createPaymentIntent`:** rejects calls with no `request.auth` (`unauthenticated`) before contacting Stripe. No app code calls it today, so nothing breaks.
- **`stripeWebhookHandler`:** returns 400 unless both the webhook secret and a Stripe signature are present, then verifies with `constructEvent`. There is no unsigned fallback.

## Tests
`functions/test/payments.test.ts` (new), 5 tests:
- a signed-out call is rejected before reaching Stripe;
- a signed-in call works;
- an unsigned webhook is refused;
- a webhook with no configured secret is refused;
- a signed webhook is verified.

Functions: 45/45 passing; build OK.

## Deploy
Functions deploy automatically on merge (`firebase-deploy.yml`). No rules change.

**Note for later:** if card payments are ever turned on, set `STRIPE_WEBHOOK_SECRET` from the Stripe dashboard before registering the webhook. Unsigned events are now always refused.
