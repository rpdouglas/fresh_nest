# HOTFIX-05 Close Report — Lowercase Booking Emails

**Closed:** 2026-10-27 · **Type:** Live bug fix. Found in the quote-submission review; the human asked for a fix.
**Personas:** P1 Diane, P3 Margaret, P6 Gallagher (returning customers who sign in to see their bookings), P12 Lauren (no duplicate renewals).

## Problem
Booking emails were saved exactly as typed. The customer portal (`CustomerBookingsPage`, `CustomerUpcomingPage`) looks bookings up with the lowercased sign-in email. The bookings read rule compares `request.auth.token.email == resource.data.email`, and Firebase Auth stores account emails lowercased. So a customer who typed `Diane@Example.ca` on the quote form never saw that request, or any later booking, when signed in.

## What changed
- **`normalizeEmail()`** in `apps/customer/src/lib/firebase/firestore.ts` trims and lowercases. Both `submitBooking` (public quote request) and `createAdminBooking` (phone-in) now store the email this way.
- **`onDailyRecurringRenewal`:**
  - New renewals store the lowercased email.
  - The duplicate check looks up both the lowercased and the stored spelling, so a renewal created before this fix (still mixed-case) isn't created a second time.

## Schema / rules
- No new fields. The description of `email` in `docs/firestore-schema.md` now notes it is stored lowercased.
- No rules change: lowercased values now match the existing read rule.

## Verification
- Customer: 66/66 tests pass. There are 3 new tests: public request, admin booking and `normalizeEmail`. All 3 fail on the previous code and pass with the fix.
- Functions: build passes; 25/25 tests pass.
- FSM: 53/53 tests pass.
- Root build passes. Lint shows 0 errors; the 2 warnings are in files this fix doesn't touch.
- Persona test (P1 Diane): a quote request typed as `Diane@Example.CA` is stored as `diane@example.ca`. That matches her lowercased sign-in email, so it appears in her bookings.

## Not covered
Bookings saved before this fix with capital letters stay invisible to those customers in the portal. Fixing them needs a one-off backfill that lowercases `bookings.email` with the Admin SDK. That is a production data change, so it needs human approval before it runs.

**Backfill script (added 2026-10-27):** `functions/scripts/backfill-lowercase-booking-emails.cjs`.
- Dry run by default, and `--database` must be given explicitly.
- Changes only `email`. Each write is conditional on the booking not having changed since it was read.
- Masks emails in its output. Safe to re-run.
- Verified end to end on the Firestore emulator: dry run, then apply, then a re-run that was a no-op, with other fields untouched.
- Unit tests: `functions/test/backfillLowercaseEmails.test.ts`.

Run it on `freshnest-dev` first. Run it on `(default)` with `--apply` only with human approval.
