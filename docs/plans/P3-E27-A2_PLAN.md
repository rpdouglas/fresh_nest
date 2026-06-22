# P3-E27-A2 — 3-Strategy Plan
**Epic:** Fix UID Linking Race Condition
**Date:** 2026-06-22
**Author:** Antigravity (AGY Phase A)

---

## Strategy Comparison

| Dimension | Strategy 1 ⭐ | Strategy 2 | Strategy 3 |
|---|---|---|---|
| Auth account ownership | CF owns full creation | Admin creates Auth manually; CF only writes Firestore doc | CF owns creation (split into 2 callables) |
| Race condition eliminated | ✅ Completely — UID is known before Firestore write | ✅ Mostly — but requires manual Auth step | ✅ But introduces a window between step 1 and step 2 |
| Lauren's UX change | None — same modal, one click | Two steps (Auth console + modal) | None — but CF is slower (2 round trips) |
| Client-side `addDoc` | ❌ Removed | ❌ Removed | ❌ Removed |
| Admin SDK controls full lifecycle | ✅ | ❌ Manual Auth step | ✅ |
| Complexity | M | S | M+ |

---

## Strategy 1 (Recommended) — Full `onStaffRegistered` Callable

### Summary
A single `onStaffRegistered` callable CF handles everything atomically:
`admin.auth().createUser()` → `admin.auth().setCustomUserClaims()` → `db.collection('staff').doc(uid).set()`.
Lauren's UX is unchanged — she fills the same modal and clicks Register. The modal calls
`httpsCallable('onStaffRegistered')` instead of `addDoc`. The CF returns `{ uid, email }`.

### Files changed

| File | Change |
|---|---|
| `functions/src/index.ts` | New `onStaffRegistered` onCall export |
| `apps/customer/src/components/admin/hooks/useStaff.ts` | `addDoc` → `httpsCallable` |
| `apps/fsm/src/context/StaffAuthProvider.tsx` | Remove migration block; Sentry warning |
| `firestore.rules` | Remove `allow create: if isAdmin()` from `staff` |
| `apps/customer/src/components/admin/hooks/useStaff.test.ts` *(new)* | Unit test |

### `onStaffRegistered` CF design

```typescript
export const onStaffRegistered = onCall(async (request) => {
  // 1. Admin-only gate (same pattern as setUserRole)
  // 2. admin.auth().createUser({ email, emailVerified: false })
  // 3. Map role: 'cleaner'|'lead' → 'staff', 'supervisor' → 'supervisor'
  // 4. admin.auth().setCustomUserClaims(uid, { role: authClaim })
  // 5. db.collection('staff').doc(uid).set({ ...staffDoc, compliance: { acceptedTermsVersion: null, termsHistory: [] } })
  // 6. return { uid, email }
})
```

### Error handling

| Error scenario | CF response | Client behaviour |
|---|---|---|
| Email already exists in Firebase Auth | `HttpsError('already-exists', ...)` | `submitError` in modal |
| Admin auth gate fails | `HttpsError('permission-denied', ...)` | `submitError` in modal |
| Firestore write fails after Auth creation | Sentry capture + `HttpsError('internal', ...)` | `submitError` — Auth account exists but doc missing; admin can retry, CF is idempotent on Firestore write |

### Persona impact
- **P12 Lauren**: no UX change — same modal, same Register button, slightly longer CF round-trip (~1–2s vs ~200ms)
- **P8 Jasmine / P11 Brenda**: first FSM login succeeds; `staff/{uid}` exists from creation
- **P9 Mike / P13 Marcus**: same — registration is now reliable regardless of any subsequent auth event timing

### Schema audit
- No new fields — all written fields match the existing `staff` schema (updated by A1)
- `compliance.acceptedTermsVersion: null` matches the A1 type fix

### Risks
- CF cold start adds latency on first registration of the day (~500ms). Acceptable for an admin-only flow.
- If `admin.auth().createUser()` succeeds but the Firestore write then fails, the Auth account exists without a Firestore doc. The CF catches this, reports to Sentry, and returns `HttpsError('internal')`. Lauren sees an error and can safely retry — the CF checks if the Auth account already exists before calling `createUser` and uses `getUser` first if email already has an account.

### Mitigation
- CF is idempotent: if an Auth account already exists for the email, use its UID for the Firestore write rather than failing
- Sentry captures the partial-failure case with UID and email so Lauren can recover without touching the Firebase console

---

## Strategy 2 — Manual Auth Creation + CF Firestore-Only Write

### Summary
Lauren creates the Firebase Auth account manually in the Firebase console first (setting the
email, no password). She then fills the registration modal which calls a slimmer
`registerStaffProfile` callable that receives the email, looks up the UID by email, and writes
`staff/{uid}`. Custom claims are set by the existing `setUserRole` callable (Lauren calls it
separately or it's bundled in `registerStaffProfile`).

### Difference from Strategy 1
- Lauren must do 2 steps: Firebase console + admin modal
- Manual step is error-prone (wrong email, forgot to set claims)
- The race condition is eliminated because UID is known before Firestore write, but the
  multi-step process creates a new operational error surface

### Verdict: Worse UX and higher operational risk than Strategy 1. **Do not select.**

---

## Strategy 3 — Two-Step Callable (`createStaffAuth` + `createStaffProfile`)

### Summary
Step 1: `createStaffAuth` callable creates the Auth account and returns the UID.
Step 2: Client takes the UID and calls `createStaffProfile` callable to write the Firestore doc.

### Difference from Strategy 1
- Two network round-trips instead of one (~2–4s total)
- A window exists between step 1 (Auth created) and step 2 (Firestore doc written) where the
  employee could theoretically attempt login and hit `errorNoProfile`
- More CF surface area for no additional benefit
- The two-step design exists for systems where Auth and profile creation are owned by different
  services — not applicable here

### Verdict: Unnecessarily complex; introduces the same window-of-inconsistency problem Strategy 1 eliminates. **Do not select.**

---

## Recommended Strategy: **Strategy 1**

### Execution plan (Phase B)

**Order matters — functions must be deployed before client changes ship:**

1. **`functions/src/index.ts`** — add `onStaffRegistered` callable
2. **`apps/customer/src/components/admin/hooks/useStaff.ts`** — replace `addDoc` body with `httpsCallable`
3. **`apps/customer/src/components/admin/hooks/useStaff.test.ts`** *(new)* — unit test
4. **`apps/fsm/src/context/StaffAuthProvider.tsx`** — remove migration block; add Sentry warning; clean up unused imports
5. **`firestore.rules`** — remove `allow create: if isAdmin()` from `staff`
6. **Invoke Brand_Auditor** — `RegisterStaffModal.tsx` and `StaffAuthProvider.tsx` class check (no visual changes expected; confirm no regressions)
7. **Invoke Data_Steward** — `onStaffRegistered` Firestore write vs schema
8. **Invoke Linguistic_Auditor** — `RegisterStaffModal.tsx` and `StaffAuthProvider.tsx` i18n check
9. **`tsc -b`** + **ESLint on changed files** — zero errors required
10. **Deploy functions** — `npx firebase deploy --only functions,firestore:rules`
11. **Phase C** — close report, ACTIVE_CYCLE.md updated

### Subagents required (Phase B)
- Brand_Auditor
- Data_Steward
- Linguistic_Auditor
- TypeScript_Strict_Enforcer (custom claim mapping type-safety check)

---

## HALT — Awaiting Human Approval

Approve Strategy 1 to proceed to Phase B execution.
