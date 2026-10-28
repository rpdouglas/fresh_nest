# F5 Plan — Repair the Playwright E2E suite

**Follow-up:** F5 in [`ACTIVE_CYCLE.md`](../ACTIVE_CYCLE.md) · **Date:** 2026-10-28 · **Status:** Strategy B approved 2026-10-28 (grill-me interview) — ✅ executed 2026-10-28, see [`reports/F5-close-2026-10-28.md`](../reports/F5-close-2026-10-28.md)
**Related:** [ADR-013](../decisions/ADR-013-path-filtered-ci.md) (E2E non-blocking until repaired), [ADR-014](../decisions/ADR-014-ci-gates-scoped.md) (E2E moved to a weekly job)

## Personas served
- **P2 Travis:** the quote request completes in under 3 minutes (`booking.spec.ts`).
- **P3 Margaret:** keyboard-only booking, skip link, step announcements, 48px targets (`a11y.spec.ts`).
- **P1 Diane / P5 Sophie:** French nav and booking labels (`language.spec.ts`).
- **P11 Brenda / P9 Mike (staff):** FSM login in EN and FR, the auth gate, job detail, Check In, photo upload (`fsm.spec.ts`).

## Baseline (measured 2026-10-28, Chromium, 28 tests)
| Run | Failed | Passed | Cause |
|---|---|---|---|
| No Firebase env (local) | 25 | 3 | The app crashes on `auth/invalid-api-key` before it renders |
| Placeholder Firebase env | 12 | 16 | See the failure groups below |

**Failure groups with placeholder config:**
1. **Out of date after P3-E29 (6):**
   - Travis booking flow
   - empty-submit validation
   - three of Margaret's keyboard tests (skip link, keyboard-only booking, step announcement)
   - the FR nav CTA, which is now "Demander un devis"
2. **FSM faked sign-in (5):** the `page.route` fakes never catch the SDK's sign-in and Firestore traffic, so the app stays on `/login`.
3. **FSM language toggle (1):** the FR button label no longer matches the test.

## Strategies considered
| | Strategy | Verdict |
|---|---|---|
| A | Keep faking network calls with `page.route`; fix the fakes and the stale selectors | Rejected: these fakes are what broke the FSM tests, and they break again whenever the SDK changes |
| **B** | **Firebase emulators (Auth + Firestore + Storage) with seeded data for both apps**, reusing the `e2e-admin` harness pattern | **Approved** |
| C | Mixed: customer pages keep their fakes, the FSM tests move to emulators | Rejected: two approaches to maintain |

## Decisions (human, 2026-10-28)
1. **Backend: emulators.** No `page.route` fakes for Firebase, and no real project (dev or prod) is touched by tests.
2. **FSM scope: repair all 6 FSM tests**, job flows included (job detail, Check In, photo upload). The FSM app is paused, but HOTFIX-06 (photo proof) needs a regression test.
3. **Gate: trial period first.** The suite runs on PRs without blocking for 2 weeks. After that, a follow-up ADR (amending ADR-013 and ADR-014) makes it required, provided there were no random failures (tests that pass or fail without any code change).

Decided without asking, from project rules:
- Stale tests are updated to the current quote-first UI. P3-E29 and the persona tests are settled; the app does not change to fit the tests.
- Chromium only, matching CI. The `firefox` project is removed from the config.

## Approach (Strategy B)
1. **Harness.** Generalise `e2e-admin` into a shared emulator harness:
   - a Vite plugin swaps `src/lib/firebase/firebase.ts` for an emulator-connected module, for both `apps/customer` and `apps/fsm`;
   - production code is not changed;
   - the `firebase.*.json` emulator config gains Storage.
2. **Seed.** Add a seed script for test data:
   - a staff user with a `staff` claim;
   - one assigned job with a task list;
   - the policy settings doc.
   - All test data is invented; no real customer data.
3. **Specs.**
   - Rewrite the stale customer specs (group 1).
   - Rewrite `fsm.spec.ts` to sign in through the Auth emulator, drop the fake JWT and route mocks, and fix the FR toggle.
4. **Scripts.**
   - `npm run test:e2e` runs through `firebase emulators:exec` (needs Java 21 locally).
   - Remove `playwright.config.ts`'s dependency on real `VITE_FIREBASE_*` values.
5. **CI.**
   - Add an `e2e` job to `firebase-preview.yml` with Java set up and `continue-on-error: true` (the trial).
   - It runs on any PR touching `apps/customer`, `apps/fsm`, `packages/shared` or `firestore.rules` / `storage.rules`.
   - Keep `e2e.yml` weekly, also switched to emulators, and drop its Firebase secrets.
6. **After the trial (separate PR):**
   - write the ADR making E2E a required check;
   - remove `continue-on-error`;
   - update the `firebase-preview.yml` comment and `HANDOFF.md`.

## Schema audit
No Firestore schema changes. Seed docs use only the fields in `firestore-schema.md` (Data_Steward check in Phase B).

## Risks
- **Java and emulator start-up add about 1–2 minutes to PRs.** Mitigation: cache the emulator jars.
- **Emulators run the real `firestore.rules`**, so some tests may fail because of a real rules gap rather than a test problem. That's what we want: report it as a finding, and change the rules only with human approval.
- **Random failures during the trial.** Use web-first assertions and no fixed sleeps, and record any random failures in the ADR evidence.
- **The admin screenshot suite shares the harness.** Its desktop baselines must stay unchanged.

## Changes during execution
- **ADR-014 conflict.** ADR-014 had deliberately taken E2E off PRs, so the trial needed a new ADR: ADR-019 (Proposed). The trial job has no `continue-on-error`: it shows red when it fails but isn't required. That answers ADR-014's "always green" objection.
- **Two real bugs found, both owner-approved fixes:**
  - FSM sign-in → HOTFIX-11, a separate PR;
  - footer contrast → `text-sand`.
- **Admin harness:** it now shares `swapFirebase.ts`. Its desktop baselines already mismatch on the Codespace (F20).

## Exit criteria
- `npm run test:e2e` passes 28/28 (Chromium) locally and in CI against emulators, with no real Firebase config.
- Travis's flow finishes in under 3 minutes; Margaret's keyboard-only flow passes; the FR labels pass; the FSM job flows pass.
- The non-blocking PR job is live; the date for the trial-end ADR is recorded in `ACTIVE_CYCLE.md`.
