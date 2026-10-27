# HOTFIX-04 Close Report — Owner Text Alert for New Quote Requests

**Closed:** 2026-10-27 · **Type:** Live production fix. Requested by the human after the quote-submission review.
**Personas:** P12 Lauren (admin: never miss a request), P2 Travis (fast follow-up within 24 hours).

## Why
App email has failed since 2026-10-01 (P3-E30, paused on Resend/DNS setup). The owner's "New quote request" email was the only alert for a new website request, so requests were visible only to whoever checked the admin panel. SMS (Twilio) still works.

## What changed
1. **`onBookingCreated` texts the owner** for every website quote request and every recurring renewal.
   - Website request: `New quote request — {name}, {service}, {date}, {phone}. Ref #{first 8 of ID}. Follow up within 24 hours.`
   - Renewal: `Recurring renewal — … Confirm it in the admin panel to schedule.`
   - Always in English, like the owner email. No prices (P3-E29).
   - Admin phone-in and walk-in bookings are skipped (`isAdminCreated`), since the admin entered them.
   - `Ref #` matches the "Request reference" on the client's thank-you page.
2. The owner number now comes from one helper, `ownerPhone()` in `functions/src/lib/shared.ts`: `OWNER_PHONE`, falling back to `+16138618812`. The cancellation alert uses the same helper.
3. Send failures are logged per message, with labels kept next to each send.
4. **Admin guide:** new "Checking for New Quote Requests" section covering sign-in, the Pending filter, sorting by Submitted At descending, Load More, matching `Ref #`, working a request, and the daily check while email is down.

Files: `functions/src/triggers/booking.ts`, `functions/src/sendSms.ts`, `functions/src/smsTemplates.ts`, `functions/src/emailTemplates.ts`, `functions/src/lib/shared.ts`, `functions/test/bookingMessages.test.ts`, `user-guide/admin-guide.md`.

## Schema / rules
No changes.

## Verification
- Functions: `npm run build` passes and `npm test` gives 25/25. New tests check the request and renewal wording, the reference, no prices, and that only admin bookings are skipped.
- Persona test (P12 Lauren): a website request produces an owner text with the client's name, phone and reference, independent of email delivery.

## Open item (human)
`OWNER_PHONE` is not set anywhere in the repo or CI, so alerts go to (613) 861-8812. Confirm that number receives SMS, or set `OWNER_PHONE` to the owner's mobile.
