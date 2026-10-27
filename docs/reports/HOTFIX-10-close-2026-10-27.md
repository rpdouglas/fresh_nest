# HOTFIX-10 Report — First Sign-In Role Sync & Self-Healing Access

**Date:** 2026-10-27 · **Strategy:** 2 + `syncMyRole` callable · **Status:** ✅ Complete
**Spec:** [`../projects/HOTFIX-10.md`](../projects/HOTFIX-10.md) · **Plan:** [`../plans/HOTFIX-10_PLAN.md`](../plans/HOTFIX-10_PLAN.md)

## Personas
- **Primary:** **P12 Lauren Arsenault** (`freshnestcompany2023@gmail.com`) — pre-approved Owner signing in to `/admin` for the first time (or after her Auth account was created before the v1 `onUserCreated` trigger completed) now reaches the Admin Dashboard immediately without being locked on an Access Denied screen.
- **Secondary:** **P8 Jasmine**, **P11 Brenda**, **P13 Marcus**, **P14 Sylvie**, **P15 Daniel** — new staff signing in to the FSM app (`apps/fsm`) for the first time are no longer signed out prematurely while their `staff` / `supervisor` role claim is being applied.

## What Shipped
1. **Shared Role Claim Wait & Self-Heal Helper (`packages/shared/src/auth/waitForRoleClaim.ts`):**
   - Exports `isNewAccount` (5-minute window) and `waitForRoleClaim({ initialRole, getRole, accepts, syncRole, isNewAccount, signal, schedule })`.
   - When the initial ID token lacks a qualifying role, it first invokes `syncRole` (`syncMyRole` callable) and refreshes the token once if updated, and for brand-new accounts (`isNewAccount: true`) polls `[1000, 2000, 3000, 4000, 5000, 5000]` ms (20s max) with `AbortSignal` support.
2. **Server Self-Healing Callable (`functions/src/callable/auth.ts` → `syncMyRole`):**
   - Any authenticated user whose token lacks their expected role can call `syncMyRole` to reconcile their custom claim against `admins/{email}` (`owner` / `manager`) and `staff` (`supervisor` / `staff`), respecting the never-downgrade guard (`rolePriority`).
   - Ensures Lauren's existing `freshnestcompany2023@gmail.com` Auth account immediately receives `{ role: 'owner' }` on her next sign-in or page reload without manual intervention.
3. **Admin Portal (`apps/customer/src/components/admin/hooks/useAdminAuth.ts`, `AdminPage.tsx`):**
   - Uses `waitForRoleClaim` + `syncMyRole` and exposes `checkingAccess` so `AdminPage` displays the spinner with bilingual copy (`admin.login.checkingAccess` in `en.json` and `fr.json`, `text-base` >= 16px for P3 Margaret) instead of flashing Access Denied.
4. **Staff App (`apps/fsm/src/context/StaffAuthProvider.tsx`):**
   - Uses `waitForRoleClaim` + `syncMyRole` before deciding whether to sign out an unauthorized user.

## Verification & Persona Tests
- **Functions:** 9 test files, 67/67 tests passing (including 5 new tests in `functions/test/syncMyRole.test.ts`), `npm --prefix functions run build` clean.
- **Customer:** `waitForRoleClaim.test.ts` (7 tests) + `useAdminAuth.test.ts` (12 tests, including Lauren's pre-approved Owner self-heal scenario) passing.
- **FSM:** `useStaffAuth.test.tsx` (10 tests, including late-arriving/synced staff claim scenario) passing.
