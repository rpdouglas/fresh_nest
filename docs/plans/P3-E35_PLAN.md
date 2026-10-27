---
epic: P3-E35
title: Roles — Owner and Manager — Plan
strategy: 2
approved: 2026-10-27
---

# P3-E35 PLAN — Roles: Owner and Manager

**Phase A written:** 2026-10-27 · **Status:** ✅ Strategy 2 approved 2026-10-27 — Phase B
**Spec:** [`../projects/P3-E35.md`](../projects/P3-E35.md)

## Personas
| Persona | Impact |
|---|---|
| **P12 Lauren (primary)** | Gets her own **Manager** login with the full admin panel, instead of sharing the owner's access |
| **Owner** | Controls who has office access, from the app |
| **P7–P15** | No change. Staff and supervisor access is unchanged |

## What the code looks like today
"admin" is checked in about 25 places:
- **Rules:** `firestore.rules` and `firestore.dev.rules` (`isAdmin()`, `isStaff()`); `storage.rules` (gallery and job photos).
- **Functions:**
  - `setUserRole` (admin-only);
  - `onStaffRegistered` / `resendWelcomeEmail` / `migrateComplianceRecords` (admin gate);
  - `listOpenShifts`, `getAnalyticsKPIs`;
  - `onUserCreated` (assigns `admin` from the `admins/{email}` allowlist; `ROLE_PRIORITY`);
  - the staff trigger.
- **Apps:** `useAdminAuth` (`role === 'admin'`), `CustomerProtectedRoute`, `App.tsx`, the FSM `ProtectedRoute` and `StaffAuthProvider`.
- **Tests:** rules tests, `useAdminAuth.test.ts`, the e2e-admin seed.

## Common to all strategies
- **Rules helpers:**
  - `isOwner()` = `role == 'owner'`;
  - `isOffice()` = `role in ['owner','manager']`, replacing every `isAdmin()` use;
  - `isStaff()` = `['staff','supervisor','owner','manager']`.
- **`setUserRole`:**
  - anyone in the office may set `staff`, `supervisor` or `customer`;
  - **only `owner`** may set or remove `owner` or `manager`;
  - an Owner can't change their own role;
  - every role change writes an `auditLog` entry (field `role`, before and after, changedBy).
- **Allowlist `admins/{email}`:** gains `role: 'owner' | 'manager'`, written only by the role callable. Rules stay `write: if false`.
- **Team & roles section (Owner-only):**
  - lists office users from the allowlist;
  - "Add Manager / Owner" by email;
  - "Remove";
  - EN/FR strings, using the P3-E33 dialog primitives.
- **Schema audit:** one new field, `admins.role`. No other schema change.
- **Deploy order matters.** Rules deploy by hand (ADR-016); functions and apps deploy on merge. Any order must keep the office signed in.

---

## Strategy 1 — Big-bang rename
- One PR switches everything to `owner` / `manager`, and a migration script flips the `admin` claims.
- **Rollout:**
  1. merge (functions and apps deploy);
  2. run the migration;
  3. deploy rules.
- **Pros:** the smallest code; no leftover alias.
- **Cons:** between steps 1 and 3 the deployed apps expect `owner` while the rules still require `admin` (or the reverse), so **the office is locked out** until all three are done. That needs a careful, timed sequence on a live system.
- **Risk:** medium–high. A broken middle state.

## Strategy 2 — Rename with a short transition alias, then clean up (recommended)
- **PR 1 (this epic):**
  - everything understands `owner` and `manager`, and **also still accepts `admin` as Owner** (rules `isOffice()` includes `'admin'`; apps and functions treat `admin` like `owner`);
  - new grants only ever write `owner` or `manager`;
  - the migration script (dry run by default) switches `admin` claims and allowlist entries to `owner`.
- **Rollout:**
  1. merge;
  2. deploy rules (Deploy Security Rules → `all`);
  3. run the migration;
  4. sign out and in again to refresh the token.

  Every step keeps the office working.
- **PR 2 (small follow-up, after the migration has run):** remove `'admin'` from the rules, apps and functions, and add rules tests proving `admin` no longer passes.
- **Pros:**
  - no lockout at any point;
  - each step can be tested on its own;
  - the cleanup is mechanical.
- **Cons:** two PRs, and a short period where `admin` still works.
- **Risk:** low.

## Strategy 3 — Roles stored in Firestore, read by rules
- **How:** keep a single `office` claim, and store owner versus manager in `admins/{email}.role`, which rules look up with `get()` when they need the difference.
- **Pros:** you can change the Owner/Manager split without a token refresh.
- **Cons:**
  - an extra Firestore read on every rule that needs it;
  - it goes against ADR-011's reason for using claims (cost and speed);
  - Storage rules can't reliably read the named dev database (see HOTFIX-06).

  The only Owner-only action, granting roles, already runs in a function, so rules never need the difference anyway.
- **Risk:** medium; rejected on cost and complexity.

---

## Recommendation
**Strategy 2.** It makes the rename safe on a live system, keeps rules as fast as today, and the cleanup PR is small.

## Phase B checklist (once approved)
1. **Tests first:**
   - rules tests for owner, manager, and legacy admin (still passing in PR 1);
   - `setUserRole` tests: a Manager can't grant manager or owner; an Owner can't self-demote; staff grants allowed;
   - a `useAdminAuth` test for the manager role.
2. **Rules:** helpers in `firestore.rules`, `firestore.dev.rules` and `storage.rules`.
3. **Functions:** `setUserRole`, the admin gates, `onUserCreated` (allowlist role and the new `ROLE_PRIORITY`), the staff trigger, an audit entry for role changes.
4. **Apps:** `useAdminAuth`, the route guards, `StaffAuthProvider`, and the **Team & roles** section (EN/FR).
5. **Migration script:** `functions/scripts/migrate-admin-to-owner.cjs`, dry run by default.
6. **Docs:**
   - an ADR, "Owner/Manager office roles", which amends ADR-011's taxonomy (ADR-011 is left unchanged);
   - `firestore-schema.md` (`admins.role`);
   - the admin guide;
   - `COMPLIANCE.md` mentions "admin". **Flagged for you to update**, since it is human-maintained.
7. **Checks:** build, lint and all test suites; the e2e-admin harness, updating its seeded admin to `owner`.
8. **Rollout as above, then PR 2 (cleanup).**

## Decision for the human
1. **Strategy:** 1, 2 (recommended) or 3?
