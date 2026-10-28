# ADR-019 — E2E on the Firebase Emulators, Back on PRs as a Two-Week Trial (Amends ADR-013 §3 and ADR-014 §2)
**Status:** Proposed — trial decision approved by the owner 2026-10-28 (F5 interview); becomes Accepted when the PR merges
**Date:** 2026-10-28
**Deciders:** Owner

## Context
- **[ADR-013](ADR-013-path-filtered-ci.md) made E2E non-blocking** because the Playwright suite had been failing since June 2026. Re-enabling it "should be made blocking again in a new ADR" once fixed.
- **[ADR-014](ADR-014-ci-gates-scoped.md) moved E2E off PRs** to a weekly job:
  - Under `continue-on-error` the PR job always showed green, so it gave no usable signal.
  - It took about 9 minutes per PR.
- **F5 repaired the suite.** The root problem was the backend: tests faked Firebase's network traffic (`page.route`), or needed real `VITE_FIREBASE_*` secrets that reach `freshnest-dev`. The faked Firebase sign-in had stopped working, and without config the app crashed before rendering. Tests had also drifted from the quote-first UI (P3-E29).
- **Running the suite against the emulators with the production rules exposed two live bugs:**
  - FSM staff sign-in was always denied (HOTFIX-11);
  - the footer failed WCAG AA contrast.

## Decision
1. **Emulators, not fakes or real projects.**
   - **How it runs:** `npm run test:e2e` (in `apps/customer`) runs Playwright inside `firebase emulators:exec` with Auth, Firestore and Storage (`firebase.e2e.json`), using the real `firestore.rules` and `storage.rules`.
   - **Data:** `e2e/harness/seed.cjs` seeds invented test data.
   - **Both apps:** they are served with a Vite plugin (`e2e/harness/swapFirebase.ts`) that replaces their Firebase setup module with an emulator-connected one, so app code doesn't change.
   - **Not used:** no `page.route` fakes for Firebase and no Firebase secrets in E2E.
2. **Back on PRs, as a two-week trial.**
   - **When it runs:** an `e2e` job in `firebase-preview.yml` runs on any PR touching the customer app, the FSM app, shared code or the security rules.
   - **No `continue-on-error`:** a failing run shows **red**. That answers ADR-014's objection that the old job always looked green.
   - **Not a required check:** `main` has no required checks today. If branch protection is added during the trial, E2E stays off the required list.
3. **Weekly run kept.** `e2e.yml` keeps its weekly and manual runs, now on the emulators, without Firebase secrets.
4. **No retries.** `retries: 0`, so a test that fails at random is visible as such during the trial.
5. **After the trial (around 2026-11-11):** if no failures without a code cause were seen, a short follow-up ADR makes `e2e` a required PR check. If there were such failures, they are fixed first.

## Rationale
- **Emulators test what actually runs.** The real rules apply, so a sign-in or a quote request that the rules would deny fails in E2E, as it would in production. The fakes hid exactly that.
- **No dependency on the dev project.** Nothing is written to `freshnest-dev`, no SMS or email triggers fire, and no secrets are needed.
- **A visible but non-required signal** gives two weeks of evidence before E2E can block a hotfix.

## Consequences
**Positive:**
- **Persona flows are checked on every relevant PR:** P2 Travis under 3 minutes, P3 Margaret keyboard-only and axe, P1/P5 French, P9/P11 staff sign-in, job screens and photo proof.
- **The emulator harness is ready for more flows**, such as the admin screens (the P3-E33 screenshot suite already uses the same pattern).

**Negative:**
- **Slower PRs:** about 4–6 minutes of extra wall time on PRs touching the apps (Java and emulator start-up, Chromium install). The job runs in parallel with the others.
- **Seed upkeep:** `seed.cjs` must follow `firestore-schema.md` when the fields its flows read change.

**Neutral:**
- **Red is allowed for now:** until the follow-up ADR, a red `e2e` check can be merged over. Reviewers should read it, not ignore it.

## Alternatives Considered
- **Keep faking Firebase network calls with `page.route`.** Rejected: brittle, broke with the SDK, and bypassed the security rules.
- **Run E2E against `freshnest-dev`.** Rejected: it needs secrets, writes real documents, can trigger SMS and email Functions, and shared data makes tests interfere with each other.
- **Make E2E required immediately.** Rejected for now: the emulator harness is new, and a random failure must not block a hotfix.
- **Keep E2E weekly only (ADR-014 as is).** Rejected: a regression can stay hidden for a week, which is how the suite stayed broken for months.
