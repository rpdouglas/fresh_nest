# ADR-017 — Owner and Manager office roles
**Status:** Proposed
**Date:** 2026-10-27
**Deciders:** Project lead, for the owner (P12 Lauren Arsenault); drafted by Claude Code (P3-E35)

## Context
[ADR-011](ADR-011-rbac-custom-claims.md) defined the role claims `admin`, `supervisor`, `staff` and `customer`.
- Its `supervisor` was described as an office role without financial data, but that was never built. In practice `supervisor` is given to **field** supervisors and opens only the staff app.
- The owner (P12 Lauren) wants to give future office staff full access while keeping control of who has office access. The FSM master spec uses Owner and Manager.

## Decision
These change ADR-011's taxonomy. ADR-011 itself stays as written; this ADR supersedes its role list.
1. **Office roles are `owner` and `manager`.**
   - Both have the same data access everywhere: rules use `isOffice()`, and functions use `requireOffice()` and `resolveOfficeRole()`.
   - The **only** owner-only power is granting or revoking `owner` and `manager`. It's enforced in the `setUserRole` Cloud Function (`checkRoleChange`), not in rules. There are no owner-only data paths.
2. **`admin` is renamed `owner`.** During the transition, `admin` is accepted as `owner` everywhere. `functions/scripts/migrate-admin-to-owner.cjs` rewrites the claims and allowlist entries. A cleanup change then removes `admin`.
3. **`supervisor` stays a field (staff app) role.** It gets no office access.
4. **Several Owners are allowed.** Nobody can change their own role, so the last Owner can't remove themselves.
5. **The `admins/{email}` allowlist** holds exactly the Owners and Managers (`role` field), and is written only by `setUserRole`.
6. **Every role change** writes an `auditLog` entry (`overrideType: 'role_change'`).
7. **`payroll`** is reserved for wave 3 (timesheets) and isn't defined yet.

## Rationale
- **Claims keep rules cheap**, as ADR-011 intended. Because the owner-only action already goes through a function, rules never need to tell Owner and Manager apart.
- **The transition alias lets the rename roll out without locking the office out,** since rules deploy by hand (ADR-016) while apps and functions deploy on merge.

## Consequences
**Positive:**
- A second office user with full access.
- Owners control access from the app (the Team & roles tab).
- Every role change is audited.

**Negative:**
- Managers can see and change pay. This is the owner's decision (2026-10-27), and it differs from the spec's "no pay fields for managers".
- A role change needs a token refresh (sign out and in) before it applies.

**Neutral:**
- `COMPLIANCE.md` still says "admin" in places. It is human-maintained, so the owner should update the wording.

## Alternatives Considered
- **Reuse `supervisor` as the office manager:** rejected. It would give every field supervisor office access.
- **Store roles in Firestore and read them in rules:** rejected. It adds an extra read per rule, and Storage rules can't reliably read the named dev database.
- **Rename everything in one step:** rejected. It risks locking the office out between the code deploy and the manual rules deploy.
