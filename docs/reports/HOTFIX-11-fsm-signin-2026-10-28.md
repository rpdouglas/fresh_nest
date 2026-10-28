# HOTFIX-11 Report — FSM staff sign-in blocked by a signed-out staff lookup

**Date:** 2026-10-28 · **Found by:** F5 E2E repair (emulators run the real `firestore.rules`) · **Owner approval:** 2026-10-28 ("App fix, own HOTFIX PR") · **Status:** ✅ Deployed 2026-10-28 (PR #54; FSM hosting deploy succeeded; no rules change)

## Personas
- **Primary:** all staff-app users — **P9 Mike**, **P11 Brenda**, **P7 Carla**, **P8 Jasmine**, **P13 Marcus**, **P14 Sylvie**, **P15 Daniel**. None could sign in to the FSM app with a password or a magic link.
- **P14 Sylvie (plain-language errors):** a customer account that tried the staff app was signed out with no message at all. It now sees the "no staff profile" message.

## What was wrong
1. **Sign-in always failed.** Before signing in, `StaffAuthProvider` queried `staff` where `email == …` to check the person was staff. The visitor is still signed out at that point. The rules let only the person themselves or the office read `staff` (`firestore.rules` `match /staff/{staffId}`), so the query was always denied:
   - **Password sign-in:** showed "Invalid email or password." even with the right password.
   - **Magic link (sending and completing):** showed the general error.

   Only a device with a session still saved from before could get in.
   - **Emulator evidence:** a signed-out `runQuery` on `staff` returned `403 PERMISSION_DENIED — false for 'list' @ L205`.
2. **The refusal message disappeared.** When the gate signed out an account without a staff role, the auth listener then fired with no user and ran `setError(null)`, which erased `fsm.login.errorNoProfile`. Bug 1 had hidden this one.

## What changed (`apps/fsm/src/context/StaffAuthProvider.tsx`)
- **Lookup removed.** `checkEmailExists` and its three calls (password sign-in, sending a magic link, completing a magic link) are gone. Sign-in goes straight to Firebase Auth.
- **Who may use the app is still decided after sign-in, as before** (HOTFIX-10):
  - the staff role claim (`waitForRoleClaim` + `syncMyRole`);
  - then the `staff/{uid}` doc;
  - anyone else is signed out with `fsm.login.errorNoProfile`.
- **Message kept.** The listener now clears the message only when someone signs **in**, so the refusal message stays on screen after the gate signs the account out.
- **No rules change.** Signed-out visitors still can't list staff emails. Not checking emails up front also closes a way to probe which emails belong to staff.

## Trade-off
Anyone can now ask for a magic link for any email address. Firebase sends the link, and the person is refused after they open it, unless they are staff. Before this fix, *no one* could get a link. If magic-link abuse becomes a concern, a rate-limited callable can check the email server-side.

## Verification
- **`apps/fsm` unit tests:** 58/58 pass. `useStaffAuth.test.tsx` changes:
  - **Replaced:** the "email not in staff" lookup tests.
  - **New:** sign-in makes no Firestore query; a wrong password shows `errorInvalid`; a magic link is sent without the lookup.
  - **New:** the refusal message survives the sign-out being reported later (this test fails without the fix).
- **`apps/fsm`:** `npm run build` and `npm run lint` are clean.
- **F5 emulator E2E** (Auth, Firestore and Storage emulators with production rules):
  - Mike signs in with email and password and reaches the job page, the Check In button and the photo input.
  - A customer account is refused and the message stays on screen.

## Follow-ups
- Once deployed, a staff member signs in on a phone with their password, as a quick check in production.
