# P3-E27-C2 — 3-Strategy Plan
**Epic:** Employee Self-Service Profile Completion
**Date:** 2026-07-21
**Author:** Claude (AGY Phase A)

---

## Strategy Comparison

| Dimension | Strategy 1 (Recommended) ⭐ | Strategy 2 | Strategy 3 |
|---|---|---|---|
| Architecture | Extend the existing single `<form>`/`handleSaveProfile` pattern with new fields | Split into independent per-section forms, each with its own Save button | Move "flag a correction" to a dedicated Cloud Function callable |
| Consistency with existing `ProfilePage.tsx` | ✅ High — one save flow, matches current UX | ❌ Diverges from the current single-form pattern for no clear benefit | ⚠️ Partial — introduces a new pattern for one field only |
| `corrections` write safety | ✅ `arrayUnion`, same pattern already used for `compliance.termsHistory` | Same | ✅ Server timestamp instead of client `new Date()` |
| Size of change | Small — additive fields to an existing component | Medium — restructures save state management | Medium — new callable + client wiring for one field |
| Risk to existing Card 1–4 behavior | Low | Medium (touches save-state plumbing) | Low |

---

## Strategy 1 (Recommended) — Extend the Existing Single-Form Pattern

### Summary
1. **Card 1 ("My Details")**: add a status badge next to the role badge (read-only); make `phone` an editable input; add a language `<select>` (en/fr/ar, matching `LanguageSelectionOverlay`'s options) writing `preferences.language`.
2. **New Card ("Contact / Corrections")**: a "Flag a correction" textarea + submit-on-save, writing via `arrayUnion({ text, flaggedAt: new Date() })` to `corrections` — same client-timestamp pattern already used for `compliance.termsHistory` in `TermsConsentOverlay`, so no new trust-model precedent is introduced.
3. **New Card ("Emergency Contact")**: pre-filled inputs from `staffProfile.emergencyContact`, editable, included in the same `handleSaveProfile` submit.
4. **`handleSaveProfile`** extended to include `phone`, `preferences.language`, `emergencyContact`, and `corrections` (via `arrayUnion`) in the same single `updateDoc` call alongside the existing `constraints`/`financials.monthlyEarningsLimit` fields — one Save button, one success/error state, unchanged UX pattern.
5. **`firestore.rules`**: add `'phone'` and `'corrections'` to the `staff/{staffId}` self-service `hasOnly()` list.
6. **`onStaffUpdatedTrigger`**: add a `phone` diff check (5th tracked field), `changedBy` set to the staff doc's own id (self-service edit) rather than `'admin'`.
7. **Schema**: add `corrections: Array<{ text: string; flaggedAt: Date }>` to `Staff`, parsed in `staffConverter` (map `flaggedAt` timestamps to `Date`), documented in `docs/firestore-schema.md`.

### Files Changed

| File | Change |
|---|---|
| `apps/fsm/src/pages/ProfilePage.tsx` | Status badge, editable phone, language select, new Contact/Corrections card, new Emergency Contact card, extended `handleSaveProfile`. |
| `apps/fsm/src/pages/ProfilePage.test.tsx` | New/updated tests for the added fields (this file is one of the 4 pre-existing tests currently blocked by the container's missing Firebase env vars — will apply the same `vi.mock('../lib/firebase/firebase', ...)` fix used in P3-E27-C1 so it actually runs here). |
| `firestore.rules` | Add `phone`, `corrections` to the self-service allowlist. |
| `functions/src/triggers/staff.ts` | Add phone-change audit tracking. |
| `packages/shared/src/types/staff.ts` | Add `corrections` to `Staff`. |
| `packages/shared/src/firebase/converters.ts` | Parse `corrections[].flaggedAt`. |
| `apps/fsm/src/i18n/locales/{en,fr}.json` | New copy for status badge, language select, corrections card, emergency contact card. |
| `docs/firestore-schema.md` | Document `corrections`. |

### Persona Impact
- **Marcus**: can fix his own phone number and flag any other data error without a phone call to Lauren.
- **Jasmine**: her C1 emergency contact is visible and correctable from her profile if circumstances change.

### Risks
- **Fixing `ProfilePage.test.tsx`'s pre-existing environment gap while extending the file**: low risk, same fix already validated in P3-E27-C1 for `TermsConsentOverlay.test.tsx`.
- **`corrections` array growth**: no cap on array length — a determined employee could spam it. Low real-world risk (internal tool, authenticated staff only, visible in an admin trail); not worth a size-limit rule for this epic's scope.
- **Earnings-limit self-edit** (see epic spec's Open Decision): left unchanged in this plan — flagged for explicit approval, not silently resolved.

### Mitigation
- None needed beyond the above — this is a low-risk, additive epic.

---

## Strategy 2 — Independent Per-Section Forms

### Summary
Break `ProfilePage.tsx` into separately-submitted sections (e.g., a "Save Contact Info" button distinct from "Save Availability"), each managing its own saving/success/error state.

### Assessment
Rejected. The current single-form pattern works and is simple; splitting it adds meaningfully more state-management code for a UX improvement (granular save feedback) that no acceptance criterion asks for. Worth reconsidering only if a future epic needs partial-save semantics.

---

## Strategy 3 — Dedicated Callable for "Flag a Correction"

### Summary
Add a `flagProfileCorrection` Cloud Function callable (mirroring the B2 pattern) instead of a client-direct `arrayUnion` write, giving a server-observed timestamp.

### Assessment
Rejected as disproportionate. Unlike B2's background-check consent (a PIPEDA-sensitive legal record), a correction note is a low-stakes internal message to Lauren — the existing `termsHistory` precedent (client-timestamp, `arrayUnion`, direct write) is the established, already-audited pattern for exactly this shape of data on this document. Introducing a new callable here would add asymmetry without a corresponding trust-model benefit.

---

## Recommended Strategy: **Strategy 1**

### Open question for human approval
See the epic spec's "Open decision" section: should `financials.monthlyEarningsLimit` become admin-only as the original narrative source doc's acceptance criteria suggested, or stay self-editable as already shipped? **This plan defaults to leaving it unchanged** — say so before Phase B if you want it locked down instead (would mean removing the input from Card 4 and moving limit-setting to the admin Staff panel, a larger UX change to already-shipped code).

### Execution Plan (Phase B)
1. Update shared types/converter/schema docs for `corrections`.
2. Update `firestore.rules`.
3. Extend `ProfilePage.tsx` and its i18n keys.
4. Extend `onStaffUpdatedTrigger` for phone changes.
5. Fix `ProfilePage.test.tsx`'s environment gap and add tests for the new fields.
6. Run `npm run build && npm run lint`; invoke Brand_Auditor, Data_Steward, Linguistic_Auditor, Security_Auditor.
7. Write the Phase C close report and mark P3-E27-C2 ✅ in `docs/ACTIVE_CYCLE.md`.

---

## HALT — Awaiting Human Approval
Please approve Strategy 1 (and confirm or override the earnings-limit self-edit question above) to proceed to Phase B execution.
