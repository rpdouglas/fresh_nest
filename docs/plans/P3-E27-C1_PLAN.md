# P3-E27-C1 — 3-Strategy Plan
**Epic:** First-Login Consent Sequence
**Date:** 2026-07-21
**Author:** Claude (AGY Phase A)

---

## Strategy Comparison

| Dimension | Strategy 1 (Recommended) ⭐ | Strategy 2 | Strategy 3 |
|---|---|---|---|
| Architecture | Route-tree guard (`ProtectedRoute` → `OnboardingSequenceGuard` → `FsmLayout`) rendering one step at a time | Extend existing overlay z-index stack with 2 more overlays + a coordinator | Real URL routes per step (`/onboarding/1`…`/onboarding/4`) with redirect-back navigation |
| Fixes the language/z-index bug | ✅ Yes — deterministic ordered list | ⚠️ Only if the coordinator is airtight; still fragile | ✅ Yes |
| "Step X of 4" indicator | ✅ Trivial — single source of truth for current step | ⚠️ Awkward — each overlay doesn't know about the others | ✅ Trivial |
| Resumability | ✅ Free — guard re-evaluates first-incomplete step on every render | ✅ Same, but coordinator logic duplicates guard logic | ✅ Free, but needs extra redirect-back-to-original-URL handling |
| Size of change | Medium — new guard component, 2 new screens, remove 3 lines from `FsmLayout.tsx` | Small — 2 new overlay components + 1 coordinator | Large — new route tree, navigation-state handling, breaks deep-linking to e.g. `/jobs/:id` mid-onboarding |
| Risk to already-shipped B1/B2 work | Low — `BackgroundCheckConsentScreen` and `TermsConsentOverlay` are reused unchanged, just relocated into the guard's step list | Low — no changes to either component | Medium — both would need to become route-aware |

---

## Strategy 1 (Recommended) — Route-Tree Guard, Single Active Screen

### Summary
1. **New `OnboardingSequenceGuard`** component (`apps/fsm/src/components/auth/`), inserted in `apps/fsm/src/App.tsx`'s router tree between the existing `<ProtectedRoute />` and `<FsmLayout />` routes.
2. The guard computes the current step from `staffProfile` in a fixed priority list:
   1. `!staffProfile.preferences?.language` → render `LanguageSelectionOverlay` (moved here from `FsmLayout`, otherwise unchanged — its own `t()`-free hardcoded EN/FR/AR strings are a pre-existing, deliberate exception since no language is chosen yet, out of scope for this epic).
   2. `!staffProfile.employmentAgreement?.acceptedAt` → render new `EmploymentAgreementScreen` ("Step 1 of 4").
   3. `!staffProfile.backgroundCheck?.consentGiven` → render existing `BackgroundCheckConsentScreen` ("Step 2 of 4" — add an optional `stepLabel` prop, default `null`, so it can show a progress indicator when rendered inside the guard without changing its standalone behavior).
   4. `staffProfile.compliance?.acceptedTermsVersion !== CURRENT_TERMS_VERSION` → render existing `TermsConsentOverlay` ("Step 3 of 4" for new employees; no step label shown for returning employees re-prompted after a terms version bump, since steps 1/2/4 are already complete for them).
   5. `!staffProfile.emergencyContact?.name` → render new `EmergencyContactScreen` ("Step 4 of 4").
   6. Otherwise → render `<Outlet />` (the real FSM app).
3. **Remove** the three ad-hoc mounts from `FsmLayout.tsx` (`<LanguageSelectionOverlay />`, `<BackgroundCheckConsentScreen />`, `<TermsConsentOverlay />` and their imports) — `FsmLayout` no longer manages onboarding state at all.
4. **`BackgroundCheckConsentScreen` and `TermsConsentOverlay` changes**: minimal — add an optional `stepLabel?: string` prop rendered as a small badge above the title (e.g. "Step 2 of 4"), defaulting to not shown, so their existing standalone tests keep passing unmodified.
5. **New screens** (`EmploymentAgreementScreen.tsx`, `EmergencyContactScreen.tsx`), same UI shell as the existing consent screens (brand tokens, 48px targets, bilingual, RTL-aware, step-label badge).
6. **Schema**: add `employmentAgreement` and `emergencyContact` to `Staff` type, `staffConverter`, `firestore.rules` (`staff/{staffId}` self-service `hasOnly()` — both fully employee-writable), and `docs/firestore-schema.md`.

### Files Changed

| File | Change |
|---|---|
| `apps/fsm/src/App.tsx` | Insert `OnboardingSequenceGuard` route between `ProtectedRoute` and `FsmLayout`. |
| `apps/fsm/src/components/auth/OnboardingSequenceGuard.tsx` | New — step-priority logic described above. |
| `apps/fsm/src/components/auth/EmploymentAgreementScreen.tsx` | New. |
| `apps/fsm/src/components/auth/EmergencyContactScreen.tsx` | New. |
| `apps/fsm/src/components/auth/BackgroundCheckConsentScreen.tsx` | Add optional `stepLabel` prop. |
| `apps/fsm/src/components/auth/TermsConsentOverlay.tsx` | Add optional `stepLabel` prop. |
| `apps/fsm/src/components/layout/FsmLayout.tsx` | Remove the 3 overlay mounts + imports. |
| `apps/fsm/src/components/auth/LanguageSelectionOverlay.tsx` | Add optional `stepLabel`-style badge (no functional change otherwise). |
| `packages/shared/src/types/staff.ts` | Add `employmentAgreement`, `emergencyContact` to `Staff`. |
| `packages/shared/src/firebase/converters.ts` | Parse new fields' timestamps; default to `null`. |
| `firestore.rules` | Add both new fields to the `staff/{staffId}` self-service allowlist. |
| `apps/fsm/src/i18n/locales/{en,fr}.json` | New `fsm.compliance.employmentAgreement.*` / `emergencyContact.*` keys. |
| `docs/firestore-schema.md` | Document both new fields. |
| New test files mirroring `TermsConsentOverlay.test.tsx` / `BackgroundCheckConsentScreen.test.tsx` for each new component, plus `OnboardingSequenceGuard.test.tsx`. |

### Persona Impact
- **Jasmine**: one continuous, understandable flow with visible progress instead of overlays appearing with no context.
- **Brenda**: language is now guaranteed to be resolved before any consent text renders — closes the exact bug described in Background.
- **Marcus**: resumability is automatic and reliable — no risk of re-doing a step he already completed.

### Risks
- **`employmentAgreement`/`emergencyContact` placement**: the narrative source doc nested `emergencyContact` under a `personalDetails` map that doesn't exist anywhere else in this schema. Placing both fields top-level (matching every other `staff` field) is a deviation from that source doc — flagged for explicit approval since schema shape affects `docs/firestore-schema.md`, C2 (which pre-fills from this data), and D1 (admin panel reads it).
- **Regression risk to B1/B2**: reusing `BackgroundCheckConsentScreen`/`TermsConsentOverlay` unchanged (only an additive optional prop) minimizes this, but the guard's step-order logic must be covered by tests before this is trusted.
- **Returning-employee edge case**: an employee mid-sequence who gets a terms-version bump before finishing Steps 1/2/4 must still see Step 3 in the right position, not jump the queue — covered by the priority-list design (Step 3's condition is independent of Steps 1/2/4's completion).

### Mitigation
- `OnboardingSequenceGuard.test.tsx` explicitly covers: fresh employee (no language) → Step 0; Steps 1–4 each independently incomplete → correct screen; all complete → `Outlet`; returning employee with only Step 3 incomplete → Step 3 with no step label.
- Confirm the `employmentAgreement`/`emergencyContact` schema shape with the human before Phase B (see HALT below).

---

## Strategy 2 — Extend the Existing Overlay Stack

### Summary
Add `EmploymentAgreementScreen` and `EmergencyContactScreen` as two more independently-mounted overlays in `FsmLayout.tsx`, each with its own `showOverlay` condition, and add a lightweight "coordinator" that computes which single overlay should be visible (hiding the others) to fix the current z-index bug — without moving anything out of `FsmLayout` or touching the router tree.

### Assessment
Rejected as the primary approach. It fixes the immediate z-index bug with the least code change, but leaves five independent components each holding a fragment of sequencing logic that the coordinator has to out-guess — every future onboarding step (e.g. training modules in C3) would need the same coordinator updated in two places (the step's own component and the coordinator), which is exactly the kind of scattered logic that produced the current bug. Strategy 1's single-guard design is barely larger and eliminates this failure mode structurally instead of patching around it.

---

## Strategy 3 — Real URL Routes Per Step

### Summary
Give onboarding its own routes (`/onboarding/language`, `/onboarding/agreement`, `/onboarding/background-check`, `/onboarding/terms`, `/onboarding/emergency-contact`), each redirecting to the next incomplete step, with a final redirect back to the originally-requested URL (e.g. if the magic link pointed at `/jobs/:id`).

### Assessment
Rejected for this epic. It's the most "correct" from a pure routing standpoint, but requires deep-link redirect-back state handling that adds real complexity for no acceptance-criteria benefit — nothing in P3-E27-C1's acceptance criteria requires onboarding steps to be independently bookmarkable or shareable URLs. It's also a bigger deviation from the existing overlay-based components (`BackgroundCheckConsentScreen`, `TermsConsentOverlay`) than Strategy 1, both of which would need to become route-aware. Worth reconsidering only if a future epic needs deep-linkable onboarding steps.

---

## Recommended Strategy: **Strategy 1**

### Open question for human approval
Confirm the schema shape for `emergencyContact` — this plan places it **top-level** on `staff/{uid}` (`emergencyContact: { name, phone, relationship } | null`) rather than nested under `personalDetails.emergencyContact` as the original narrative source doc proposed, since `personalDetails` doesn't exist anywhere else in this schema. If you'd rather introduce a `personalDetails` map now (anticipating other fields going there later), say so before Phase B — it's a one-line change to the plan but affects `docs/firestore-schema.md`, C2, and D1 downstream.

### Execution Plan (Phase B)
1. Add `employmentAgreement`/`emergencyContact` to shared types, converter, `firestore.rules`, and `docs/firestore-schema.md`.
2. Build `OnboardingSequenceGuard`, `EmploymentAgreementScreen`, `EmergencyContactScreen` + tests.
3. Add the optional `stepLabel` prop to `BackgroundCheckConsentScreen` and `TermsConsentOverlay` (and `LanguageSelectionOverlay`) without changing their existing tested behavior.
4. Wire `OnboardingSequenceGuard` into `App.tsx`'s router tree; remove the 3 ad-hoc mounts from `FsmLayout.tsx`.
5. Add i18n keys (EN/FR) for both new screens.
6. Run `npm run build && npm run lint`; invoke Brand_Auditor, Data_Steward, Linguistic_Auditor.
7. Write the Phase C close report and mark P3-E27-C1 ✅ in `docs/ACTIVE_CYCLE.md`.

---

## HALT — Awaiting Human Approval
Please approve Strategy 1 (and confirm or override the `emergencyContact` schema placement above) to proceed to Phase B execution.
