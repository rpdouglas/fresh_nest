# 0045. Cleaners without Google sign in with Camelo's 6-digit emailed code

- Date: 2026-10-17
- Decided by: Owner
- Status: Active; refines the email-link part of [0037](0037-staff-accounts-and-roles.md) and builds on [0044](0044-clock-in-and-out-with-photos.md)

## Decision

1. **Cleaners without a Google account sign in with the 6-digit code Camelo emails to their work address**, rather than a Firebase Auth email link.
2. **Cleaners only (`SCHEDULE_STAFF` + active in Camelo)**: the office (`SCHEDULE_EDITORS`) stays on Google sign-in only. Before asking Camelo to email a code (`requestLoginSession`), the server checks `SCHEDULE_STAFF` and the active Camelo employee list (`PeopleCache`, kept 10 minutes), refusing (`403`) without sending an email if the address is on the office list, inactive, or not allowed.
3. **One step both signs in and connects Camelo for clocking in**: when `verifyOtp` succeeds (`whoami.id === cleaner.employeeId`), the server stores the cleaner's encrypted Camelo token in `scheduleCleanerTokens` right away (so **My week** is already connected for clocking in and out with no second code prompt) and issues a 30-day HMAC-SHA256 signed cleaner session token (`c1.<payload>.<hmac>`, signed with a key derived from `CAMELO_TOKEN`).
4. **30-day phone session, 10-minute revocation**: the browser keeps a `c1.` token in `localStorage` so an installed phone app stays signed in across restarts for 30 days. Every request still runs `requireStaff` against `SCHEDULE_STAFF` and the 10-minute `PeopleCache` (and `requireOffice` always refuses `c1.` tokens with `403`).

## Why

- **What step 1.8.1 found in the shared Firebase project (`lilypad-strategy-design`, 2026-10-17)**:
  - Firebase Auth already has `email` and `anonymous` sign-in enabled for `tunaspool.web.app`, and its email sender (`noreply@lilypad-strategy-design.firebaseapp.com`) and `%APP_NAME%` template are shared with `tunaspool`.
  - `(default)` Firestore (`bc50e8ba-6baf-4ceb-b8aa-2368e83868f5`) and the default Storage bucket (`feef6102-a591-4120-8a80-c4a3d33cfbe6`) have `allow read, write: if false;`, while `db-tunaspool` already trusts `signedIn()` because anonymous sign-in is enabled.
- Every cleaner already has a Camelo account and receives Camelo's 6-digit login code in their inbox (`requestLoginSession` / `verifyOtp`, built in Sprint 2.4 item 2.4.7). Using that same 6-digit code on the sign-in screen means a cleaner enters one code instead of clicking a Firebase email link and then entering a second Camelo code on **My week**, leaves the shared Firebase Auth settings and email templates untouched, and needs no new `connect-src` domains in `firebase.json`.
