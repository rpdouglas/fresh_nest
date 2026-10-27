# HOTFIX-10 — First sign-in shows "no access" before the role arrives

**Type:** Live production bug fix · **Priority:** P1 · **Complexity:** S
**Opened:** 2026-10-27

---

## Problem

On 2026-10-27, Lauren (`freshnestcompany2023@gmail.com`) signed in to `/admin` and was told she has no access.

A role reaches a new account in the background:

1. Someone signs in for the first time, and Firebase creates the account.
2. `onUserCreated` (`functions/src/triggers/auth.ts`) is an **async** v1 trigger. It reads `admins/{email}` or `staff`, then calls `setCustomUserClaims`. This usually takes a few seconds, and longer on a cold start.
3. Meanwhile, the app's `onAuthStateChanged` handler has already fired. It calls `getIdTokenResult(true)` **once**, before step 2 has finished.

Each app then does the wrong thing:

| App | File | What happens on a first sign-in |
|---|---|---|
| Admin (`/admin`) | `apps/customer/src/components/admin/hooks/useAdminAuth.ts` | No office role yet, so it shows **Access Denied**. The page never checks again. Signing out and back in fixes it. |
| Staff app (FSM) | `apps/fsm/src/context/StaffAuthProvider.tsx` | No staff role yet, so it **signs the person out** and shows `fsm.login.errorNoProfile`. A new cleaner opening their welcome magic link hits this. |
| Customer portal | `apps/customer/src/hooks/useCustomerAuth.ts` | It falls back to `customer`, which is the right role anyway. **No bug.** |

The first sign-in is the one moment that must work. Lauren's admin tasks happen "in 10-minute windows… admin UI must be fast and unambiguous" (P12). And for P8 Jasmine: "If the first login fails for any reason, she will assume she did something wrong and may not try again."

### Not this bug

The account may have **already existed** before the office-list entry was added. In that case `onUserCreated` never runs again, and the account keeps `customer`. That is fixed in the product today: an Owner uses Team & roles → **Make Owner/Manager**, and `setUserRole` sets the role on the existing account. This hotfix doesn't change that path.

## Scope

- Recheck the role for a short while after a **brand-new** account signs in, instead of deciding after one check.
- While it waits, the person sees a "setting up your access" state instead of an error.
- Accounts that aren't new (created more than a few minutes ago) keep today's behaviour: one check, then the decision. So a genuine "no access" is never slowed down.

## Out of scope

- Changing who gets which role (`onUserCreated` logic, the allowlist, Team & roles).
- `firestore.rules`.
- The customer portal (no bug, see the table above).

## Personas

- **Primary:** P12 Lauren. The first sign-in to the admin panel works the first time, without a confusing error.
- **Secondary (strategies 2 and 3):** P8 Jasmine, P11 Brenda, P13 Marcus, P14 Sylvie, P15 Daniel. Their first staff-app sign-in from the welcome magic link isn't bounced back to the login screen.

## Acceptance criteria (Persona Tests)

1. **P12 Lauren, first sign-in:** an email pre-approved as Owner, with no account yet, signs in to `/admin` once. She lands on the dashboard without signing out and back in.
   - Unit test: the first token has no role, a later token has `owner`, and the hook ends authorised.
2. **Genuine denial is unchanged:** an account more than 5 minutes old with role `customer` sees Access Denied straight away (one token check).
   - A new account whose role never arrives sees Access Denied after the wait limit.
3. **Bilingual:** any new wait-state text is in `en.json` and `fr.json` and goes through `t()`.
4. **P3 floor:** the wait state uses text of at least 16px. No new tap targets.
5. *(Strategies 2 and 3)* **P8 Jasmine:** a new staff account whose role arrives a few seconds after sign-in reaches My Jobs. It is not signed out.
