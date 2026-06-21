# P3-E27-A1 — 3-Strategy Plan
**Epic:** Fix Terms Pre-Acceptance Compliance Bug (PIPEDA)
**Date:** 2026-06-21
**Author:** Antigravity (AGY Phase A)

---

## Strategy Comparison

| Dimension | Strategy 1 ⭐ | Strategy 2 | Strategy 3 |
|---|---|---|---|
| Migration approach | CF nulls records + auditLog | Overlay catches everyone naturally (no migration CF) | Null records + flag `migratedAt` field |
| Risk to existing logins | Zero — overlay gates them | Low — only if staff don't log in soon | Zero |
| False Firestore records removed | ✅ Immediately | ❌ Records stay until each staff member logs in | ✅ Immediately |
| Audit trail of migration | ✅ auditLog entries | n/a | ✅ `migratedAt` field |
| Code surface | Medium — new CF + overlay fix + type | Smallest — overlay fix + type only | Medium — same as S1 + extra field |
| PIPEDA posture | Strongest — fabricated records gone | Weaker — fabricated records visible to auditor until all staff log in | Strong |

---

## Strategy 1 (Recommended) — Null-Out + auditLog Migration CF

### Summary
A one-shot `migrateComplianceRecords` callable Cloud Function immediately patches all existing
staff documents to `{ acceptedTermsVersion: null, termsHistory: [] }`, writing an `auditLog`
entry for every document touched. The going-forward fix in `registerStaff()` and the `null` guard
in `TermsConsentOverlay` ship in the same deployment.

### Files changed

| File | Change |
|---|---|
| `apps/customer/src/components/admin/hooks/useStaff.ts` | `acceptedTermsVersion: null`, `termsHistory: []` |
| `apps/fsm/src/components/auth/TermsConsentOverlay.tsx` | Show if `null` OR version mismatch |
| `packages/shared/src/types/staff.ts` | `acceptedTermsVersion: string \| null` |
| `functions/src/index.ts` | New `migrateComplianceRecords` onCall |
| `docs/firestore-schema.md` | `string \| null` in compliance table |
| `apps/fsm/src/components/auth/TermsConsentOverlay.test.tsx` | Test case: null triggers overlay |
| `apps/customer/src/components/admin/hooks/useStaff.test.ts` (if exists, else new) | null compliance in registerStaff |

### Persona impact
- **P12 Lauren**: Admin runs the CF once from Firebase console; no change to her registration UX
- **P8 Jasmine / P11 Brenda**: On next FSM login, overlay appears; real IP-logged consent collected
- All ~10 existing staff: Firestore records corrected before next audit

### Schema audit
- `compliance.acceptedTermsVersion`: `string` → `string | null` (backward compatible — existing non-null values still valid)
- `compliance.termsHistory`: no type change
- `auditLog` entry format matches existing schema exactly

### Risks
- The `migrateComplianceRecords` CF must be disabled after running (otherwise reachable by any admin indefinitely)
- If an existing staff member accepts the overlay *before* the migration CF runs, the CF will find `acceptedTermsVersion !== null` and skip that doc — correct behaviour

### Mitigation
- CF includes a guard: skip docs where `acceptedTermsVersion` is already `null`
- Migration report logged to Sentry (count of docs patched vs skipped)
- CF is marked with a `// DELETE AFTER P3-E27-A1 MIGRATION` comment; removal scheduled in next sprint's cleanup

---

## Strategy 2 — Overlay-Only Fix (No Migration CF)

### Summary
Skip the migration callable entirely. Fix `registerStaff()` and the overlay show condition.
Existing staff with `acceptedTermsVersion: '1.0'` will hit the overlay on their next FSM login —
the overlay will collect real consent and overwrite the false record. False records disappear
naturally as each person logs in.

### Files changed

| File | Change |
|---|---|
| `apps/customer/src/components/admin/hooks/useStaff.ts` | Null compliance init |
| `apps/fsm/src/components/auth/TermsConsentOverlay.tsx` | Show if `null` OR version mismatch |
| `packages/shared/src/types/staff.ts` | `string \| null` |
| `docs/firestore-schema.md` | Update type |

### Persona impact
Same end state as Strategy 1, but potentially weeks later (depends on how soon all existing
staff log into the FSM app).

### Risks
- Fabricated consent records remain visible in Firestore to any auditor until every staff member
  logs in — unacceptable PIPEDA posture
- If a staff member never logs into FSM during the remediation window (e.g., on leave), their
  false record persists indefinitely
- No auditLog evidence that remediation was performed

### Verdict: Do not select — insufficient PIPEDA posture.

---

## Strategy 3 — Null-Out + `migratedAt` Timestamp Field

### Summary
Identical to Strategy 1 except the migration CF writes a `compliance.migratedAt: Timestamp`
field onto each patched document in addition to the auditLog entry, providing an in-document
timestamp of when the remediation occurred.

### Difference from Strategy 1
Adds `compliance.migratedAt: Timestamp | undefined` to the `Staff` type and schema.

### Assessment
The `auditLog` collection already provides the migration timestamp externally with less schema
pollution. Adding `migratedAt` to the Staff document is redundant and expands the schema
unnecessarily — the extra field would persist forever on all staff documents. **Strategy 1's
auditLog approach achieves the same audit trail without schema drift.**

### Verdict: Inferior to Strategy 1 — unnecessary schema expansion.

---

## Recommended Strategy: **Strategy 1**

### Execution plan (Phase B)

1. **`packages/shared/src/types/staff.ts`** — change `acceptedTermsVersion: string` to `string | null`
2. **`apps/customer/src/components/admin/hooks/useStaff.ts`** — change compliance init
3. **`apps/fsm/src/components/auth/TermsConsentOverlay.tsx`** — update show condition
4. **`apps/fsm/src/components/auth/TermsConsentOverlay.test.tsx`** — add `null` test case
5. **`functions/src/index.ts`** — add `migrateComplianceRecords` callable
6. **`docs/firestore-schema.md`** — update compliance field type
7. **Invoke Brand_Auditor** — confirm Tailwind classes unchanged in overlay
8. **Invoke Data_Steward** — confirm auditLog write matches schema
9. **Invoke Linguistic_Auditor** — confirm overlay still uses `t()` only
10. **`npm run build && npm run lint`** — zero errors required
11. **Deploy functions** — `npx firebase deploy --only functions`
12. **Run `migrateComplianceRecords`** — trigger from Firebase console; verify auditLog entries
13. **Phase C** — close report, schema update, ACTIVE_CYCLE.md ✅

### Subagent plan (Phase B)
- Brand_Auditor: overlay Tailwind class check
- Data_Steward: auditLog schema conformance
- Linguistic_Auditor: overlay i18n coverage
- TypeScript_Strict_Enforcer: `string | null` propagation (no `any`, no `@ts-ignore`)

---

## HALT — Awaiting Human Approval

Approve Strategy 1 to proceed to Phase B execution.
