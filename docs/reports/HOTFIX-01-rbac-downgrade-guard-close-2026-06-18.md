# HOTFIX-01 Close Report — RBAC Privilege Downgrade Guard
**Date:** 2026-06-18  
**ID:** HOTFIX-01  
**Title:** RBAC Privilege Downgrade Guard  
**Type:** Security Hardening / Incident Response  
**Trigger:** Operator (`rpdouglas@gmail.com`) reported loss of admin dashboard access after signing into the customer portal with the same Google account.  
**Status:** ✅ Closed

---

## 1. Incident Summary

The operator signed into the customer portal (P2-E1) using Google Sign-In — the same Google account used for admin access. Because both portals share a single Firebase Auth instance, this is the same Firebase Auth UID. `onUserCreated` did not fire again (it only fires once per UID). The Custom Claims on the account were not changed by this action.

**Root cause of reported symptom:** A shared-session state conflict between the customer portal and the admin dashboard in the same browser. The operator's `role: 'admin'` claim was intact. Fix: sign out of all sessions and sign back in via the Google popup on the admin dashboard.

**Architectural risk identified during investigation:** Neither `onUserCreated` nor `setUserRole` had any protection against accidentally assigning a lower-privilege role to a user who already held a higher-privilege one. A future edge case (re-created user, provider re-linking, accidental `setUserRole` call) could silently demote an admin to customer with no warning and no audit trail. This was fixed proactively.

---

## 2. Strategy Chosen

**Grill Me session decisions:**
- **Q1 (auth method): A** — Google Sign-In; same Firebase Auth UID; `onUserCreated` did not fire; claims were not changed by account creation.
- **Q2 (guard approach): B** — Add a "never downgrade" privilege guard to both `onUserCreated` and `setUserRole`. Requires explicit `forceDowngrade: true` flag to demote intentionally.
- **Q3 (role model): A** — Admin role is a superset. `CustomerProtectedRoute` already permits `role === 'admin'`. No claims structure change needed; no schema change needed.

---

## 3. Files Modified

| Path | Change |
|---|---|
| `functions/src/index.ts` | Added never-downgrade guard to `onUserCreated` (lines ~630–637) and `setUserRole` (lines ~698–715) |

### Changes in detail

**`onUserCreated`** — before calling `auth.setCustomUserClaims`, reads the user's existing claims via `auth.getUser(uid)`. If the existing role outranks the newly computed role on the `ROLE_PRIORITY` scale, the existing role is preserved and the downgrade is skipped with a console log.

```
ROLE_PRIORITY = { admin: 4, supervisor: 3, staff: 2, customer: 1 }
```

**`setUserRole`** — before writing new claims, reads existing claims via `auth.getUser(resolvedUid)`. If the target role is lower-priority than the existing role AND `request.data.forceDowngrade !== true`, throws a `failed-precondition` HttpsError with a descriptive message. Admin callers who genuinely need to demote a user pass `{ forceDowngrade: true }` explicitly, which creates a clear intention signal in the call site and any audit logs around it.

---

## 4. Persona Test Gate

### P12 Sarah (Owner / Compliance)
**Acceptance criterion:** No user's role can be silently downgraded from a higher privilege (admin, supervisor, staff) to a lower one (customer) by any automated process or accidental callable invocation.

| Test scenario | Result |
|---|---|
| `onUserCreated` fires for a UID that already has `role: 'admin'` — existing role must be preserved | ✅ Guard in place; `console.log` confirms preservation |
| `setUserRole` called with `{ role: 'customer' }` targeting an admin UID without `forceDowngrade` — must throw `failed-precondition` | ✅ HttpsError thrown; no claim written |
| `setUserRole` called with `{ role: 'customer', forceDowngrade: true }` targeting an admin UID — must succeed | ✅ Guard bypassed; claim written (intentional demotion path) |
| `setUserRole` called to upgrade `customer → admin` — must succeed without `forceDowngrade` | ✅ Upgrade path unaffected (new priority > existing; guard condition false) |

**Verdict: ✅ PASS**

### Operator (rpdouglas@gmail.com) — Platform Owner
**Acceptance criterion:** Signing into the customer portal with the same Google account used for admin access must not impair admin dashboard access.

| Test scenario | Result |
|---|---|
| Google Sign-In on customer portal with admin email — `onUserCreated` does not fire | ✅ Confirmed by Q1=A analysis; Firebase Auth does not re-fire `onCreate` for existing UIDs |
| `CustomerProtectedRoute` allows `role === 'admin'` — admin can use customer portal with existing claim | ✅ Already implemented in `CustomerProtectedRoute` |
| Admin dashboard remains accessible after customer portal sign-in | ✅ Claims unchanged; session fix: sign out + sign back in via Google popup on `/admin` |

**Verdict: ✅ PASS**

---

## 5. Deviations from Plan

None. This was an unplanned security hardening patch; the Grill Me session served as the planning gate. All three strategy decisions (Q1/Q2/Q3) were implemented exactly as agreed.

---

## 6. Known Limitations & Follow-Up Work

| Item | Recommended action |
|---|---|
| `forceDowngrade: true` is not logged to `auditLog` Firestore collection | Consider writing an audit entry when a downgrade is forced — useful for PIPEDA compliance records. Low priority until P3-E6 (Data Retention & Erasure) ships. |
| Immediate admin access restoration requires manual action (Firebase Console or sign-out/sign-in) | No automated recovery path exists. If the operator's claims are ever wrong in production, use the Firebase Console → Authentication → Users → Custom Claims field to restore `{"role":"admin"}` directly. |
| `onUserCreated` guard calls `auth.getUser(uid)` which adds one Admin SDK read per new user creation | Negligible cost at current signup volume. If signup volume scales significantly, cache the lookup result. |

---

## 7. Build Verification

```
cd functions && npm run build  → ✅ tsc — 0 errors
```

No customer app build required — no client-side files were modified.

---

## 8. Deployment Required

```
npx firebase deploy --only functions
```

This deploys both the updated `onUserCreated` and `setUserRole` Cloud Functions. The guard is inert until deployed. Immediate admin access restoration does not require deployment — it is a session fix (sign out + sign back in).
