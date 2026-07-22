# P3-E27-D3 — 3-Strategy Plan
**Epic:** Structured Offboarding
**Date:** 2026-07-22
**Author:** Claude (AGY Phase A)

---

## Strategy Comparison

| Dimension | Strategy 1 (Recommended) ⭐ | Strategy 2 | Strategy 3 |
|---|---|---|---|
| Deactivation | New `onStaffDeactivated` trigger, separate from audit logging | Folded into `onStaffUpdatedTrigger` | Same as Strategy 1 |
| Session invalidation | `disabled: true` + claims + **`revokeRefreshTokens`** (closes the actual session-persists gap) | Same, but narrative's literal 2-call list (misses `revokeRefreshTokens`) | Same as Strategy 1 |
| Reactivation | New `reactivateStaff` callable (Admin SDK Auth calls required) | Same | Client `updateDoc({status: 'active'})` reusing D1's `activateEmployee` — **broken**: never re-enables Auth |
| D1 button fix | Hide/disable "Activate Employee" for `inactive` staff | Same | Not needed (reuses it) — but leaves it silently non-functional |
| New surface area | Small — 1 new trigger, 1 new callable, 1 new panel section | Small, but the audit trigger grows further | None — but ships an offboarding flow that doesn't actually revoke access on reactivation-reversal, defeating the epic's own purpose |

---

## Strategy 1 (Recommended) — Separate Trigger, Dedicated Reactivation Callable

### Summary
1. **`offboarding` schema** added to `staff`, `null` until first deactivation, fully overwritten on each new deactivation event (not guarded against re-init like D2's probation — each departure is a fresh event).
2. **`onStaffDeactivated`** (new trigger, fires on `status -> 'inactive'`): `auth.updateUser(disabled: true)`, `auth.setCustomUserClaims({role: 'inactive'})`, **`auth.revokeRefreshTokens(uid)`** (added beyond the narrative's literal list — closes the actual "valid session persists" gap the epic is named for), writes the `offboarding` block, emails Lauren, audit-logs the Auth revocation specifically.
3. **`reactivateStaff`** (new admin-gated callable — Admin SDK Auth calls can't be done from a direct client `updateDoc`): re-enables the Auth account, restores the correct role claim from `staff.role`, sets `status: 'active'`, and (pending the plan's Q2) resets `probation`/`offboarding` to `null` so D2's existing `onStaffStatusActivated` trigger naturally reinitializes a fresh probation window.
4. **Offboarding section in `StaffDetailPanel`**: visible only when `status === 'inactive'` — read-only `authRevoked` + timestamp, 3 admin toggles, departure reason, final notes, Reactivate button.
5. **D1 gating fix**: Status Management gets a third branch for `inactive` status, hiding the plain Activate button (which would otherwise silently fail to restore real access) and pointing to the new Reactivate flow.
6. **`StaffAuthProvider.tsx`**: catches `auth/user-disabled` on both password and magic-link sign-in, shows a real, translated "account deactivated, contact us" message.

### Files Changed

| File | Change |
|---|---|
| `packages/shared/src/types/staff.ts` | Add `Offboarding`, `OffboardingChecklist`, `DepartureReason` types; add `offboarding: Offboarding \| null` to `Staff`. |
| `packages/shared/src/firebase/converters.ts` | Parse `offboarding.deactivatedAt`, default `null`. |
| `functions/src/triggers/staff.ts` | New `onStaffDeactivated` export; extend `onStaffUpdatedTrigger` for offboarding diffs. |
| `functions/src/callable/staff.ts` | New `reactivateStaff` callable. |
| `functions/src/sendEmail.ts` | Add `sendStaffDeactivatedEmail` (English-only, matches `sendOwnerNotification`). |
| `functions/src/emailTemplates.ts` | New `staffDeactivatedSubject/Text`. |
| `functions/src/index.ts` | Export `onStaffDeactivated`, `reactivateStaff`. |
| `apps/customer/src/components/admin/StaffDetailPanel.tsx` | New Offboarding section; Status Management gets an `inactive`-status branch. |
| `apps/customer/src/components/admin/hooks/useStaff.ts` | Add `updateOffboardingChecklist`/`setDepartureReason`/`setFinalNotes` (direct writes) + `reactivateStaff` (callable wrapper). |
| `apps/fsm/src/context/StaffAuthProvider.tsx` | Catch `auth/user-disabled` in `signInWithPassword` + `completeMagicLinkSignIn`. |
| `apps/fsm/src/i18n/locales/en.json` / `fr.json` | Real `fsm.login.errorDeactivated` entries (both languages — this area is fully translated, not defaultValue-only). |
| `docs/firestore-schema.md` | Document `offboarding`. |

### Persona Impact
- **Lauren**: deactivation now actually means access is gone, not just a Firestore flag; gets a lightweight checklist so keys/access-codes/final-pay aren't forgotten; one Reactivate button if a termination needs reversing.
- **Jasmine / all staff**: a deactivated login attempt gets a clear, human message instead of a confusing generic error.

### Risks
- **Reactivation policy ambiguity** (Q1/Q2 in the epic spec) — flagged for explicit confirmation before Phase B, not guessed, since it's a real security/HR-policy tradeoff.
- **`onStaffDeactivated` firing on unintended transitions**: must guard on the exact `before.status !== 'inactive' && after.status === 'inactive'` edge (not "status changed"), same pattern as D2's activation guard. Needs explicit correctness attention, no test infra exists for `functions/` (confirmed — zero test files, no test script — same gap every prior epic's functions code has shipped with).
- **`revokeRefreshTokens` timing**: revokes all refresh tokens issued *before* the call; any ID token already in memory client-side remains valid until its own expiry (up to 1 hour) regardless — this is a Firebase platform limitation, not something more code can close further. Still strictly better than the narrative's original 2-step list.

### Mitigation
- Confirm reactivation policy (Q1/Q2) via the epic spec's flagged questions before writing any code.
- Keep `onStaffDeactivated`'s guard condition identical in shape to D2's proven `onStaffStatusActivated` guard.

---

## Strategy 2 — Fold Into `onStaffUpdatedTrigger`

### Summary
Add the deactivation logic (Auth disable + claims + notification) as another `if` block inside the existing `onStaffUpdatedTrigger`.

### Assessment
Rejected — same reasoning already applied to D2's `onStaffStatusActivated`. `onStaffUpdatedTrigger` is 7 categories of audit-log diffing deep already; adding real Auth Admin SDK calls and email-sending to it mixes passive record-keeping with active security-critical workflow, making the function harder to review exactly where correctness matters most.

---

## Strategy 3 — Reuse D1's `activateEmployee` for Reactivation (No New Callable)

### Summary
Skip a dedicated `reactivateStaff` callable; have the "Reactivate" button just call D1's existing `activateEmployee` (`updateDoc({status: 'active'})`) directly from the client.

### Assessment
**Rejected — this would ship a broken reactivation flow.** `activateEmployee` only ever touches Firestore. It has no way to call `auth.updateUser(disabled: false)` or restore custom claims (`updateDoc` from a browser client cannot invoke the Firebase Auth Admin API — that requires the Admin SDK, only available server-side). Clicking "Reactivate" would flip `status` back to `'active'` in the UI while the employee's Auth account stayed disabled — they would still be unable to log in, and Lauren would have no indication anything was wrong. This directly defeats the point of building a Reactivate flow at all.

---

## Recommended Strategy: **Strategy 1**

### Open questions for human approval
See `docs/projects/P3-E27-D3.md`'s "Open questions" section:
1. Does "Reactivate" land the employee directly in `status: 'active'` (trusting historical clearances), or back in `status: 'onboarding'` (forcing full re-verification)?
2. Does reactivation reset `probation`/`offboarding` to `null` (fresh employment period) or preserve the historical record?

### Execution Plan (Phase B)
1. Add `offboarding` schema (shared types, converter, `docs/firestore-schema.md`).
2. Build `onStaffDeactivated` + deactivation email template; extend `onStaffUpdatedTrigger`.
3. Build `reactivateStaff` callable.
4. Add the Offboarding section to `StaffDetailPanel.tsx`; fix the Status Management `inactive`-status gating; add the 3 new `useStaff.ts` helpers.
5. Fix `StaffAuthProvider.tsx`'s `auth/user-disabled` handling; add real EN/FR `fsm.login.errorDeactivated` keys.
6. Run `npm run build && npm run lint`; invoke Brand_Auditor, Data_Steward, Linguistic_Auditor. (No `firestore.rules` change expected — same reasoning as D1/D2: `offboarding` stays outside the self-service `hasOnly()` list.)
7. Write the Phase C close report and mark P3-E27-D3 ✅ (and, since this is the last sub-epic, P3-E27 overall) in `docs/ACTIVE_CYCLE.md`.

---

## HALT — Awaiting Human Approval
Please approve Strategy 1 and answer the two reactivation-policy questions above to proceed to Phase B execution.
