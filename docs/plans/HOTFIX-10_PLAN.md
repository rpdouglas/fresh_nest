# HOTFIX-10 Plan — First sign-in role race

**Spec:** [`docs/projects/HOTFIX-10.md`](../projects/HOTFIX-10.md) · **Phase A:** 2026-10-27 · **Status:** ⏸ Awaiting human approval

**Personas:**
- **Primary:** P12 Lauren.
- **Secondary:** the staff-app first sign-in for P8 Jasmine, P11 Brenda, P13 Marcus, P14 Sylvie and P15 Daniel.

## The shared mechanism (strategies 1 and 2)

**When an account counts as new:** `Date.now() - Date.parse(user.metadata.creationTime) < 5 min`. Only new accounts can be waiting on `onUserCreated`. Any older account already has its final role.

**What happens for a new account:** if the first token has no qualifying role, the app forces a token refresh again on a back-off schedule, then decides:
- **Schedule:** about 1 s, 2 s, 3 s, 4 s, 5 s, then roughly every 5 s.
- **Limit:** about 20 s in total, which covers a cold-start trigger.
- **Outcome:** it stops on the first qualifying role. If the limit runs out, it shows today's denial.

**Cancelling:** the wait stops if the person signs out or the auth state changes, or if the component unmounts. A stale result can never overwrite a newer one.

**What the person sees while it waits:** a spinner and the line "Setting up your access…" (EN/FR), not an error.

**Accounts that aren't new:** exactly today's behaviour, one check. A genuine "no access" is not slowed down.

---

## Strategy 1 — Admin only, retry inside `useAdminAuth`

The wait logic lives in the admin hook, so only `/admin` changes.

**Files changed**
- `apps/customer/src/components/admin/hooks/useAdminAuth.ts`:
  - recheck loop and cancellation;
  - new `checkingAccess` flag.
- `apps/customer/src/pages/AdminPage.tsx`: shows the wait state while `checkingAccess` is true, reusing the existing spinner block.
- `apps/customer/src/components/admin/hooks/useAdminAuth.test.ts`: new cases (role arrives late, account not new, limit reached, sign-out mid-wait). Fake timers.
- `apps/customer/src/i18n/locales/en.json` and `fr.json`: `admin.login.checkingAccess`.

**Persona impact**
- **P12:** fixed. Her first sign-in to `/admin` works the first time.
- **P8, P11, P13–P15:** not helped. A new cleaner's first magic-link sign-in to the staff app can still bounce them back to login.

**Risks**
- Lowest change surface.
- It leaves the worse half of the bug (staff app sign-out) in production.
- The retry logic would later be copied into the staff app, which risks drift.

**Schema audit:** none. It reads only the auth token and `user.metadata.creationTime` (Firebase Auth, not Firestore). No new fields.

**Tailwind audit:** reuses the existing spinner classes from `AdminPage.tsx` (`border-slate-brand`, `bg-warm-white`). The new line uses `font-body text-base text-text-muted`. All are design-system tokens, with 16px text.

---

## Strategy 2 — Shared helper, used by the admin panel and the staff app *(recommended)*

The same mechanism lives once as a small, pure helper in `packages/shared`. It takes a function that returns the token result, plus a predicate, so it has no Firebase import and is easy to unit test. Both apps use it.

**Files changed**
- **New** `packages/shared/src/auth/waitForRoleClaim.ts`:
  - `waitForRoleClaim({ getRole, accepts, isNewAccount, signal, schedule })` returns the role, or `null` when the limit runs out;
  - also exports `isNewAccount(creationTime, now)`.
- **New** `packages/shared/src/auth/waitForRoleClaim.test.ts`: role arrives late, account not new, limit reached, abort.
- `packages/shared/src/index.ts`: export it.
- `apps/customer/src/components/admin/hooks/useAdminAuth.ts`: uses the helper with `accepts = officeRoleOf(r) !== null`; new `checkingAccess` flag.
- `apps/customer/src/pages/AdminPage.tsx`: wait state.
- `apps/customer/src/components/admin/hooks/useAdminAuth.test.ts`: hook-level case for a late role.
- `apps/fsm/src/context/StaffAuthProvider.tsx`:
  - uses the helper with `accepts = isStaffAppRole`, before the "no access" sign-out;
  - `loading` stays true during the wait, so the existing loading screen shows.
- `apps/fsm/src/context/StaffAuthProvider.test.tsx`, existing or new: a late `staff` role is not signed out.
- `apps/customer/src/i18n/locales/{en,fr}.json`: `admin.login.checkingAccess`.
- `apps/fsm/src/i18n/locales/{en,fr}.json`: `fsm.login.checkingAccess`. EN/FR only, as `i18n.test.ts` enforces.

**Persona impact**
- **P12:** fixed for `/admin`.
- **P8 Jasmine, P11 Brenda, P13 Marcus, P14 Sylvie, P15 Daniel:** the first staff-app sign-in from the welcome link reaches My Jobs instead of being signed out. This matches P8's first-login fear.
- **P14:** no confusing error.

**Risks**
- It touches the staff app's auth gate, which matters for security. The helper only delays the decision: the same `isStaffAppRole` gate still applies to the final role, and Firestore rules are untouched.
- The staff app test fallback (`typeof getIdTokenResult !== 'function'`) must keep working. The helper is skipped on that path.
- There is a note on the working tree: this branch (`chore/architecture-hygiene`) has uncommitted edits to `packages/shared/src/index.ts`. Phase B should branch from `main` (`fix/HOTFIX-10-first-signin-role`) so the hotfix doesn't pick them up.

**Schema audit:** none. Only Auth token claims and `user.metadata` are used. No Firestore reads or writes are added.

**Tailwind audit:** the admin side is as in strategy 1. The staff app reuses its existing loading screen, plus one text line with existing FSM tokens (to be confirmed against `docs/design-system.md` in Phase B by Brand_Auditor). No new classes outside the tokens.

---

## Strategy 3 — Server side: a blocking `beforeUserCreated` function

Replace or supplement the async `onUserCreated` with a **blocking** Identity Platform function, `beforeUserCreated` (firebase-functions v2 `identity`). It returns `customClaims: { role }` before the account is created, so the very first token already carries the role. No app changes are needed.

**Files changed**
- **New** `functions/src/triggers/beforeUserCreated.ts`, which reuses the allowlist and staff lookup from `onUserCreated`.
- `functions/src/triggers/auth.ts`: keep the customer profile write and drop the claim write, or keep it as a fallback.
- `functions/src/index.ts`: export it.
- Tests in `functions/`.
- **New ADR** (permanent auth architecture change), plus a note in `docs/HANDOFF.md`.

**Persona impact:** fixes P12 and every staff persona at the source, including any future app.

**Risks**
- **It needs the human:**
  - The project must be upgraded to **Firebase Authentication with Identity Platform**, which changes billing beyond the free monthly-active-user tier.
  - The blocking function must be registered in the console.
  - Agent sessions can't do either step.
- **Sign-up depends on Firestore and Functions:** if the function errors or times out (7 s limit), the **sign-up fails outright**. That is worse than today's few-second delay. A cold start counts toward the 7 s.
- It's the largest change and needs an ADR before code, which makes it slow for a hotfix.
- The two apps would still decide after one check. Any future async claim change, such as a later `setUserRole`, would still need a re-check. So strategy 2's helper stays useful anyway.

**Schema audit:** none. It reads the existing `admins/{email}` (schema §5) and `staff.email`. It writes the existing `customers/{uid}` fields only.

**Tailwind audit:** no UI changes.

---

## Recommendation

**Strategy 2.**
- It fixes the reported bug for Lauren and the same bug in the staff app, where new cleaners are signed out on first login. That is the more damaging half.
- No console, billing or rules changes. It ships through the normal PR, and auto-deploys hosting.
- Strategy 3 can follow later as an ADR if sign-up delays ever become a problem.

**Phase B checks:**
- the new unit tests;
- `npm run build && npm run lint` (customer, FSM, shared);
- Brand_Auditor, Linguistic_Auditor (EN/FR keys) and Data_Steward (no Firestore changes).

No functions or rules are touched, so no Deploy Security Rules run is needed.
