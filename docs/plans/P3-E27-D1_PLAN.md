# P3-E27-D1 — 3-Strategy Plan
**Epic:** Staff Detail Panel & Onboarding Checklist UI
**Date:** 2026-07-21
**Author:** Claude (AGY Phase A)

---

## Strategy Comparison

| Dimension | Strategy 1 (Recommended) ⭐ | Strategy 2 | Strategy 3 |
|---|---|---|---|
| UI pattern | Expandable row → `StaffDetailPanel` (mirrors `BookingDetailPanel`) | Everything inline in `StaffTable` row cells | Expandable panel, but all writes via a new callable |
| Matches existing precedent | ✅ Yes — identical to `BookingsTable`/`BookingDetailPanel` | ❌ No established precedent for this much inline detail | ✅ UI matches, write path doesn't |
| Row/table readability | ✅ Compact row, detail on demand | ❌ Row becomes very wide (4 new toggles + training bar + compliance data) | ✅ Same as Strategy 1 |
| Audit logging | Extend existing `onStaffUpdatedTrigger` (matches status/role/earnings-limit precedent) | Same | New callable, duplicating a solved problem |
| New surface area | Small — one new component, four new schema fields, no rules change | Medium — StaffTable becomes significantly more complex | Medium — new callable to build, test, and audit for no behavioral gain |

---

## Strategy 1 (Recommended) — Expandable Detail Panel, Trigger-Based Audit Logging

### Summary
1. **`StaffDetailPanel.tsx`** (new): built from `BookingDetailPanel.tsx`'s structure — same card layout, same `AnimatePresence` mount pattern, same brand tokens. Sections: Onboarding Checklist (relocated background-check editor + 4 new toggles + read-only agreement/consent/training data), Compliance Overview, Status Management (Activate Employee), Quick Actions (resend invite, export).
2. **`StaffTable.tsx`**: add `expandedId` state + row `onClick` → toggles `StaffDetailPanel` beneath the row, exactly matching `BookingsTable.tsx`'s `isExpanded` pattern. Remove the inline background-check editor (`editingBgCheckId`/`bgDraft` state and its JSX) since it moves into the panel.
3. **Four new admin-only booleans** added directly to `onboardingChecklist` — no `firestore.rules` change, since `isAdmin()` already grants unrestricted write access to the whole `staff` document.
4. **`onStaffUpdatedTrigger`**: extend the existing before/after diff with four more `if (before.onboardingChecklist?.X !== after.onboardingChecklist?.X)` blocks, `changedBy: 'admin'`, matching the status/role/earnings-limit pattern exactly.
5. **"Activate Employee"**: writes only `status: 'active'`. Gated (disabled + tooltip) on `backgroundCheck.status === 'cleared' && idVerified === true && employmentAgreement !== null && onboardingChecklist.platformTrainingCompleted === true`.
6. **SIN field**: not built. Documented in the epic spec as an explicit deferral pending a `docs/COMPLIANCE.md` update.

### Files Changed

| File | Change |
|---|---|
| `apps/customer/src/components/admin/StaffDetailPanel.tsx` | New. |
| `apps/customer/src/components/admin/StaffTable.tsx` | Add row expansion; remove the relocated inline background-check editor. |
| `apps/customer/src/components/admin/hooks/useStaff.ts` | Add `activateEmployee`/checklist-toggle helper methods (thin wrappers over `updateDoc`, matching the hook's existing style — no new callable). |
| `functions/src/triggers/staff.ts` | Add 4 more tracked `onboardingChecklist` fields. |
| `apps/customer/src/i18n/locales/{en,fr}.json` | New admin-panel copy. |
| `docs/firestore-schema.md` | Document the 4 new fields. |

### Persona Impact
- **Lauren**: single source of truth for every employee's onboarding state; no more direct Firestore edits for ID verification, uniform, supervised shift, or direct deposit tracking.

### Risks
- **Relocating the B2 background-check editor**: real, working, tested code moves — must carry its existing tests (`useStaff.test.ts`'s `updateBackgroundCheckStatus` coverage) along with it rather than losing coverage in the move.
- **Activate-employee gating correctness**: getting the four-condition gate wrong (e.g., forgetting one) would let an under-qualified employee be activated — needs explicit test coverage for each individual missing condition, not just the "all met" happy path.

### Mitigation
- Move (not rewrite) the background-check editor logic; keep its existing tests passing, add new ones for its new location.
- `StaffDetailPanel.test.tsx` explicitly tests each of the four gating conditions independently.

---

## Strategy 2 — Everything Inline in StaffTable Rows

### Summary
Add the four new toggles, training progress bar, and compliance summary directly as additional cells/inline controls in each `StaffTable` row, without a separate expandable panel.

### Assessment
Rejected. `StaffTable` already has 6+ columns; adding four toggle controls plus a progress bar plus compliance data inline would make rows unreadably wide and inconsistent with how this exact "lots of per-row detail" problem was already solved for bookings (`BookingDetailPanel`). No reason to solve the same UX problem differently for staff.

---

## Strategy 3 — Expandable Panel, Callable-Based Writes

### Summary
Same UI as Strategy 1, but route all `onboardingChecklist` admin writes (including the four new toggles and the relocated background-check status) through a new `updateOnboardingChecklist` callable instead of direct `updateDoc` + trigger-based audit logging.

### Assessment
Rejected. Admin already has unrestricted write access to `staff` docs (`isAdmin()` in `firestore.rules`), and the trigger-based audit pattern (`onStaffUpdatedTrigger`) already correctly handles `status`, `role`, and `financials.monthlyEarningsLimit` — the exact same "admin-attributed change" shape as these four new fields. A new callable would duplicate working infrastructure for no security or audit benefit; the callable pattern earned its place in B2/C3 specifically because those fields needed to be *closed* to admin's own direct writes in favor of a narrower, purpose-built path (background check needs server-observed data; training needs `moduleId` validation) — neither applies here.

---

## Recommended Strategy: **Strategy 1**

### Execution Plan (Phase B)
1. Add the 4 new `onboardingChecklist` fields to `docs/firestore-schema.md`.
2. Extend `onStaffUpdatedTrigger`.
3. Build `StaffDetailPanel.tsx`, relocating the B2 background-check editor into it.
4. Wire row expansion in `StaffTable.tsx`; remove the old inline editor.
5. Add `activateEmployee` and checklist-toggle helpers to `useStaff.ts`.
6. Add i18n keys (EN/FR).
7. Run `npm run build && npm run lint`; invoke Brand_Auditor, Data_Steward, Linguistic_Auditor. (No new Security_Auditor-relevant surface — no `firestore.rules` change.)
8. Write the Phase C close report and mark P3-E27-D1 ✅ in `docs/ACTIVE_CYCLE.md`.

---

## HALT — Awaiting Human Approval
Please approve Strategy 1 (and confirm the SIN-field deferral) to proceed to Phase B execution.
