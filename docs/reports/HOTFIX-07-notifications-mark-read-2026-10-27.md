# HOTFIX-07 — Staff notifications could not be marked read (gap analysis N-2)

**Date:** 2026-10-27 · **Found by:** FSM gap analysis ([R2](../gap-analysis/GAP_ANALYSIS_2026-10-27.md)) · **Owner approval to draft:** 2026-10-27 · **Status:** ✅ Closed 2026-10-27 — merged (PR #38), rules deployed, owner check passed

## Personas
All staff (P7–P15). The unread badge in the staff app never cleared. P10 Ahmed relies on icons and badges.

## Problem
`apps/fsm/src/hooks/useNotifications.ts` `markAllAsRead` batch-updates `{ read: true }` on `notifications/{uid}/messages/*`. `firestore.rules` had `allow update, delete: if false` for that path, so every batch was denied. The error was only logged to the console.

## Fix
`firestore.rules` and `firestore.dev.rules` now allow **update** when all of these hold:
- the user is signed in and is the message's recipient (`request.auth.uid == staffId`);
- the change touches only `read` (`affectedKeys().hasOnly(['read'])`);
- the new value is `read == true`. Messages can't be marked unread.

Create and delete stay denied; messages are still written only by Cloud Functions. No app change was needed, because the hook already sends exactly `{ read: true }`.

## Tests
`apps/customer/test/firestore-rules.test.ts`, new block "Staff notifications (N-2: mark as read)", 4 tests:
- the recipient can mark a message read;
- no other field can change, and a message can't be marked unread;
- other staff can't read or update the message;
- create and delete are still denied.

Full rules suite: 39/39 passing (Firestore and Storage emulators).

## Deploy (human)
After merging, use either:
- **GitHub:** Actions → **Deploy Security Rules** → target `firestore-rules`, and type DEPLOY ([ADR-016](../decisions/ADR-016-manual-rules-deploy-workflow.md)). This deploys the rules for every database in `firebase.json`: `(default)` with `firestore.rules`, and `freshnest-dev` with `firestore.dev.rules`.
- **A signed-in machine:** `npx firebase deploy --only firestore:rules --project freshnest-aa51e`

**Check:** open the staff app with unread notifications, open the list (which marks them all read), and confirm the badge clears and stays cleared after a reload.

## Close-out (2026-10-27)
- **Merged:** PR #38 merged to `main` at `f5dfffd`. The app deploy (Deploy to Production #127) passed.
- **Rules deployed:** by the owner through **Deploy Security Rules** run #2, target `firestore-rules`. The rules tests passed, then the deploy succeeded.
- **Check:** passed. The staff app notification badge clears after opening the list.
