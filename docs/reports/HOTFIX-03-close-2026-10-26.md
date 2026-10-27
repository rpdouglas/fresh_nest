# HOTFIX-03 Close Report — Quote Flow: Renewal Messages, Reminders, Dispatch Transaction

**Closed:** 2026-10-26 · **Type:** Live production bug fix. Found in an end-to-end review of the quote flow; the human asked for an immediate fix.
**Personas:** P12 Lauren (admin dispatch, owner alerts), P2 Travis and P3 Margaret (no misleading texts), P1 Diane (FR clients get no wrong-language or wrong-meaning messages).

## What changed

1. **Recurring renewals are no longer treated as new quote requests.**
   - **Before:** `onDailyRecurringRenewal` created `pending` bookings with no marker. `onBookingCreated` then sent the client a "we received your quote request" email and SMS, sent the owner a "New quote request" email, and created a new referral code every cycle.
   - **Now:** a renewal copies the parent's `referralCode` and sets `createdBy: 'system:recurring-renewal'`. `onBookingCreated` checks for it with `isRenewal()`: it creates no referral code, sends no client messages, and sends the owner a "Recurring renewal — confirm it in the admin panel" email.
   - Files: `functions/src/scheduled/renewals.ts`, `functions/src/triggers/booking.ts` and `functions/src/emailTemplates.ts`.
2. **Day-before reminders go to confirmed bookings only.**
   - **Before:** `onDailyReminderCheck` also texted `pending` bookings: "your cleaning is tomorrow". Those included quote requests that were never quoted or accepted.
   - **Now:** it queries `status == 'confirmed'` (`functions/src/scheduled/reminders.ts`).
3. **Dispatch Board assignment transaction fixed.**
   - **Before:** `assignCleanerTransaction` wrote to the booking and job before reading staff records. The browser Firestore SDK rejects that ("all reads must be executed before all writes"), so assigning or reassigning a cleaner failed.
   - **Now:** both staff records are read first, and reassigning to the same cleaner leaves earnings unchanged (`apps/customer/src/lib/firebase/firestore.ts`).

## Schema
No new fields. The descriptions of `createdBy` and `referralCode` in `docs/firestore-schema.md` now cover renewals. No rules or index changes.

## Verification
- **Functions:** `npm run build` passes and `npm test` gives 22/22. New tests cover renewal owner wording and admin bookings not being treated as renewals.
- **Customer:** `npm run test:customer` gives 63/63. Three new `assignCleanerTransaction` tests use a fake transaction that enforces reads-before-writes. All three fail against the old code with the real Firestore error and pass with the fix.
- **FSM:** 53/53.
- **Build and lint:** `npm run build` passes. `npm run lint` shows 0 errors; its 2 warnings are in files this fix doesn't touch.
- **Persona test (P12 Lauren):** a renewal sends the owner a confirm-to-schedule email rather than a quote-request alert. Dispatch assignment now completes and moves the shift's earnings between cleaners.

## Behaviour notes
- Clients no longer get a message when a renewal is created. Their next message is the day-before reminder, sent after the owner confirms the renewal. Before this fix the renewal message was the incorrect "quote request received" one.
- An unconfirmed renewal gets no reminder. The owner must confirm renewals for them to be scheduled. Confirming also creates the job.

## Deploy
Functions changes go live on the next merge to `main` via CI (`firebase deploy --only functions`). Nothing was deployed from this session.

## Follow-up (not in scope)
- Recording the quoted price and quote acceptance is P3-E26 (Quote-First Booking System). It needs a Phase A plan and ADR D11.
- The public `bookings` create rule has no `keys().hasOnly(...)`. Tightening it needs human approval of a `firestore.rules` change.
