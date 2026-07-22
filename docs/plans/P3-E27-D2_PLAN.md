# P3-E27-D2 — 3-Strategy Plan
**Epic:** 30/60/90 Day Probation Tracking
**Date:** 2026-07-21
**Author:** Claude (AGY Phase A)

---

## Strategy Comparison

| Dimension | Strategy 1 (Recommended) ⭐ | Strategy 2 | Strategy 3 |
|---|---|---|---|
| Probation initiation | New `onStaffStatusActivated` trigger, separate from audit logging | Folded into existing `onStaffUpdatedTrigger` | Same as Strategy 1 |
| Concern separation | ✅ Audit logging and business workflow stay independent | ❌ One growing mega-function mixes both | ✅ Same as Strategy 1 |
| Check-in completion write | Direct admin `updateDoc` of the whole `checkIns` array (matches `ProfilePage.tsx`'s `blockedWindows` pattern) | Same | New callable using a Firestore transaction to update one array element |
| New surface area | Small — 1 new trigger, 1 new scheduled fn, no new callable | Small, but the audit trigger grows unreviewably | Medium — new callable to build/test/audit for a concurrency risk that doesn't really exist here |

---

## Strategy 1 (Recommended) — Separate Trigger, Direct Admin Array Writes

### Summary
1. **`probation` schema** added to `staff`, `null` until first activation.
2. **`onStaffStatusActivated`** (new trigger, fires on `status → 'active'`): writes `probation.startDate`/`endDate`, generates 3 check-ins (Day 30/60/90 — pending the cadence confirmation in the epic spec), sends the bilingual activation email.
3. **`onProbationCheckInDue`** (new scheduled function, daily 9am, mirrors `onDailyReminderCheck`'s exact shape): queries staff with a due, incomplete check-in, sends Lauren email + SMS (reusing `sendOwnerNotification`-style email and the `process.env.OWNER_PHONE` SMS pattern from `triggers/booking.ts`).
4. **Check-in completion**: admin edits the check-in in `StaffDetailPanel`, client updates the local array copy, writes the whole `probation.checkIns` array back via `updateDoc` — identical mechanics to how `ProfilePage.tsx` already edits `constraints.blockedWindows`.
5. **`onStaffUpdatedTrigger`**: extended to audit-log `probation.checkIns` and `probation.probationOutcome` diffs.
6. **"Terminated"**: writes `status: 'inactive'` only — nothing else. D3's future trigger reacts to that transition.

### Files Changed

| File | Change |
|---|---|
| `packages/shared/src/types/staff.ts` | Add `Probation`, `ProbationCheckIn` types; add `probation: Probation | null` to `Staff`. |
| `packages/shared/src/firebase/converters.ts` | Parse `probation.startDate`/`endDate`/check-in dates. |
| `functions/src/triggers/staff.ts` | New `onStaffStatusActivated` export; extend `onStaffUpdatedTrigger` for probation diffs. |
| `functions/src/scheduled/probation.ts` | New — `onProbationCheckInDue`. |
| `functions/src/sendEmail.ts` | Add activation congratulations template call + a Lauren-facing "check-in due" notification. |
| `functions/src/sendSms.ts` | Add a Lauren-facing "check-in due" SMS helper. |
| `functions/src/emailTemplates.ts` | New EN/FR activation email templates. |
| `functions/src/index.ts` | Export the two new functions. |
| `apps/customer/src/components/admin/StaffDetailPanel.tsx` | New Probation section: timeline cards, complete-check-in form, outcome selector. |
| `apps/customer/src/components/admin/hooks/useStaff.ts` | Add `completeCheckIn`/`setProbationOutcome` direct-write helpers. |
| `docs/firestore-schema.md` | Document `probation`. |

### Persona Impact
- **Lauren**: gets a reliable, reminded structure for follow-up instead of relying on memory; one more section in the same panel she already uses.
- **Jasmine**: formally checked in on at 30/60/90 days, not left alone after activation.
- **Brenda**: activation email in French.

### Risks
- **Check-in cadence ambiguity** (see epic spec) — building the wrong cadence means redoing the trigger's date math and the admin panel's card count. Flagged for explicit confirmation before Phase B, not guessed.
- **`onStaffStatusActivated` firing on unintended transitions**: must guard on `before.status !== 'active' && after.status === 'active'` specifically (not just "status changed"), so an `active → inactive → active` reactivation doesn't silently re-run probation initiation and overwrite an in-progress probation record. Needs explicit test coverage.
- **Whole-array rewrite race**: two admins editing the same employee's check-ins simultaneously could clobber each other (last write wins). Accepted — same risk profile as `blockedWindows` today, single-admin business in practice.

### Mitigation
- Confirm cadence via the epic spec's flagged question before writing any code.
- `onStaffStatusActivated` test explicitly covers: onboarding→active (initializes), active→active no-op (shouldn't fire, no `before`/`after` diff), inactive→active (reactivation — verify it does *not* stomp an existing non-null `probation` block, only initializes when `probation` is still `null`).

---

## Strategy 2 — Fold Into `onStaffUpdatedTrigger`

### Summary
Add the probation-initiation logic as one more `if` block inside the existing `onStaffUpdatedTrigger`, alongside its audit-logging diffs.

### Assessment
Rejected. `onStaffUpdatedTrigger` already handles 5 categories of audit-log diffing (terms, status, role, earnings limit, phone, and now D1's 4 checklist items). Adding full probation initialization — schema writes, 3-entry generation, sending an email — makes it a single function doing two structurally different jobs (passive record-keeping vs. active business workflow), harder to review and reason about as it keeps growing. Splitting by concern, not by document, keeps each function's purpose legible.

---

## Strategy 3 — Callable-Based Check-In Completion

### Summary
Same triggers as Strategy 1, but check-in completion goes through a new `completeCheckIn` callable using a Firestore transaction to update a single array element by `id`, instead of a client-side whole-array rewrite.

### Assessment
Rejected as unneeded complexity. This mirrors the exact reasoning D1 already used to reject a callable for its 4 checklist toggles: admin already has unrestricted `staff`-doc write access, the editing context is single-admin and low-concurrency, and the codebase's own established precedent for exactly this shape of data (`ProfilePage.tsx`'s `blockedWindows`) already uses whole-array client rewrites successfully. A transaction-based callable would solve a concurrency problem that doesn't meaningfully exist here.

---

## Recommended Strategy: **Strategy 1**

### Open question for human approval
Confirm the check-in cadence — **30/60/90 days** (this plan's default, matching the epic's own name) or **Day 5/30/90** (matching a specific line in the source narrative doc's Key Tasks section) — before Phase B, since it changes the trigger's date math and the admin panel's card count.

### Execution Plan (Phase B)
1. Add `probation` schema (shared types, converter, `docs/firestore-schema.md`).
2. Build `onStaffStatusActivated` + activation email templates; extend `onStaffUpdatedTrigger`.
3. Build `onProbationCheckInDue` + Lauren-facing email/SMS helpers.
4. Add the Probation section to `StaffDetailPanel.tsx`; add `completeCheckIn`/`setProbationOutcome` to `useStaff.ts`.
5. Run `npm run build && npm run lint`; invoke Brand_Auditor, Data_Steward, Linguistic_Auditor. (No `firestore.rules` change expected — same reasoning as D1.)
6. Write the Phase C close report and mark P3-E27-D2 ✅ in `docs/ACTIVE_CYCLE.md`.

---

## HALT — Awaiting Human Approval
Please approve Strategy 1 (and confirm the check-in cadence above) to proceed to Phase B execution.
