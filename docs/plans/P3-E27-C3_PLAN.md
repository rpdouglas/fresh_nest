# P3-E27-C3 — 3-Strategy Plan
**Epic:** Platform Training Modules
**Date:** 2026-07-21
**Author:** Claude (AGY Phase A)

---

## Strategy Comparison

| Dimension | Strategy 1 (Recommended) ⭐ | Strategy 2 | Strategy 3 |
|---|---|---|---|
| Module completion write | Dedicated callable `completeTrainingModule` (Admin SDK, `onboardingChecklist` stays closed to clients) | Direct client `updateDoc`, add `onboardingChecklist` to the self-service `hasOnly()` list | Direct client write + nested-diff rule restricting only the 6 module keys |
| Future-proofs D1's admin-only fields in the same map | ✅ Yes — no rework needed | ❌ No — D1 would need to retrofit nested-diff logic later | ⚠️ Partial — still fragile (same class of risk B2 rejected) |
| Content storage | Static TS config + i18n keys (`trainingModules.ts`) | Firestore-stored, admin-editable content collection | Hardcoded JSX per module component |
| New Firestore collection needed | ✅ None | ❌ Yes — new `trainingContent` collection, rules, admin CMS UI | ✅ None |
| Navigation | Single `/training` page, in-page module selection, free order | Per-module routes `/training/:moduleId` | Sequential wizard (like `OnboardingSequenceGuard`), locked order |
| Matches Marcus's "quick reference" need | ✅ Yes — modules stay browsable in any order after completion | ✅ Yes, but adds routing complexity for no acceptance-criteria benefit | ❌ No — a locked sequence contradicts "quick reference" |

---

## Strategy 1 (Recommended) — Callable Completion, Static Content, Free-Order Single Page

### Summary
1. **`trainingModules.ts`** (new, `apps/fsm/src/lib/data/`): array of 6 `{ id, icon, isLegallyRequired, titleKey, sectionKeys: string[], questions: [{ questionKey, choiceKeys: string[], correctIndex }] }`. Mirrors the existing `locationData.ts` config-array pattern in the customer app.
2. **`completeTrainingModule`** callable (`functions/src/callable/staff.ts`): validates `request.auth`, validates `moduleId` against the 6 known ids, reads the current `staff/{uid}.onboardingChecklist`, writes `{moduleId}: true`, and additionally sets `platformTrainingCompleted: true` in the same update if all 6 module flags are now true. Exported in `functions/src/index.ts`.
3. **`TrainingPage.tsx`** (new, route `/training`): module list view (checkmark per completed module, a "Required by law" badge on WHMIS) → selecting a module shows its content sections, then a 3-question comprehension check (radio buttons), then an "I've completed this module" button enabled only once all 3 are answered correctly. On click, calls `completeTrainingModule` via `httpsCallable`.
4. **`FsmLayout`**: add `{ to: '/training', labelKey: 'fsm.training.navLabel' }` to `navLinks`.
5. **Dispatch WHMIS gate**: add a 5th check to `checkCleanerSchedulingConflicts` (`isWhmisIncomplete = selectedStaff.onboardingChecklist?.module4Whmis !== true`) and the matching entry in `DispatchBoard.tsx`'s proactive `conflictsMap`, reusing `admin.override.*` i18n/warning/audit-log plumbing exactly as B2's background-check gate does.
6. **`docs/firestore-schema.md`**: document the 8 new `onboardingChecklist` keys.
7. **i18n**: all 6 modules' titles, section content, quiz questions, and answer choices — EN/FR.

### Files Changed

| File | Change |
|---|---|
| `apps/fsm/src/lib/data/trainingModules.ts` | New — module config array. |
| `functions/src/callable/staff.ts` | Add `completeTrainingModule`. |
| `functions/src/index.ts` | Export it. |
| `apps/fsm/src/pages/TrainingPage.tsx` | New page. |
| `apps/fsm/src/pages/TrainingPage.test.tsx` | New tests. |
| `apps/fsm/src/App.tsx` | Add `/training` route. |
| `apps/fsm/src/components/layout/FsmLayout.tsx` | Add nav link. |
| `apps/customer/src/lib/utils/scheduling.ts` | Add WHMIS check to `checkCleanerSchedulingConflicts`. |
| `apps/customer/src/components/admin/DispatchBoard.tsx` | Add WHMIS check to proactive conflict badges. |
| `apps/fsm/src/i18n/locales/{en,fr}.json` | 6 modules' worth of training content + quiz copy. |
| `apps/customer/src/i18n/locales/{en,fr}.json` | New `admin.override.whmisWarning` key. |
| `docs/firestore-schema.md` | Document new `onboardingChecklist` keys. |

### Persona Impact
- **Jasmine**: guided, self-paced training with clear progress, completable on mobile.
- **Brenda**: full French training content, verified by Linguistic_Auditor.
- **Marcus**: modules stay accessible after completion — no forced one-time gate, matching his "quick reference" need.

### Risks
- **Content volume**: 6 modules × content sections × 3 quiz questions × 2 languages is substantial i18n content to author and keep in sync — mitigated by keeping each module's content concise and focused (a few short sections, not exhaustive documentation) rather than padding for length.
- **`platformTrainingCompleted` race condition**: if an employee somehow completed modules from two devices near-simultaneously, a read-modify-write in the callable could theoretically miss the "all 6 done" transition on one of two concurrent calls. Low real-world likelihood (one employee, one device, sequential module completion) and self-correcting (the next `completeTrainingModule` call — or a future D1 admin view — would recompute correctly); not worth a Firestore transaction for this epic's scope.
- **WHMIS gate**: reusing the existing override/audit-log mechanism from B2 means no new trust-model surface, but confirm the new `admin.override.whmisWarning` copy is legally accurate about Ontario WHMIS being training, not certification (avoid overstating compliance).

### Mitigation
- Keep content concise; this is onboarding orientation, not exhaustive documentation.
- Note the race-condition edge case in the close report as a known, low-severity, self-correcting limitation rather than silently ignoring it.

---

## Strategy 2 — Direct Client Write, Firestore-Stored Admin-Editable Content

### Summary
Add `onboardingChecklist` to the self-service `hasOnly()` allowlist for direct client writes, and store training module content in a new Firestore `trainingContent` collection so Lauren can edit copy without a code deploy.

### Assessment
Rejected. The `hasOnly()` addition creates exactly the "mixed employee/admin fields in one map" hazard B2 already identified and avoided — D1's admin-only checklist fields are planned for this same map. A Firestore-stored content collection is real scope creep for this epic: it requires new rules, a new admin CMS UI (itself a multi-epic undertaking), and solves a problem nobody asked for (WHMIS/company policy content doesn't need per-deployment editing without a code review, unlike client-facing marketing copy).

---

## Strategy 3 — Nested-Diff Rule + Sequential Wizard

### Summary
Allow direct client writes to `onboardingChecklist` but restrict non-admin writes to only the 6 module keys via nested-field diffing (mirroring what B2's Strategy 2 rejected), and lock modules into a strict 1→6 sequence like `OnboardingSequenceGuard`.

### Assessment
Rejected on both counts. The nested-diff rule repeats the exact pattern already rejected in B2 for the same reasons (fragile, hard to audit correctly, this project's own ADR-007 history). A locked sequence actively contradicts Marcus's "quick reference" persona need and isn't required by any acceptance criterion — WHMIS is legally required to be *completed*, not completed in a specific position among the six.

---

## Recommended Strategy: **Strategy 1**

### Execution Plan (Phase B)
1. Author `trainingModules.ts` + i18n content (concise, real, bilingual).
2. Add `completeTrainingModule` callable; export it.
3. Build `TrainingPage.tsx` + tests; wire the `/training` route and nav link.
4. Extend the WHMIS dispatch gate in `scheduling.ts` and `DispatchBoard.tsx`.
5. Update `docs/firestore-schema.md`.
6. Run `npm run build && npm run lint`; invoke Brand_Auditor, Data_Steward, Linguistic_Auditor, Security_Auditor.
7. Write the Phase C close report and mark P3-E27-C3 ✅ in `docs/ACTIVE_CYCLE.md`.

---

## HALT — Awaiting Human Approval
Please approve Strategy 1 to proceed to Phase B execution.
