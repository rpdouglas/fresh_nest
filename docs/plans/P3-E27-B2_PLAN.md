# P3-E27-B2 — 3-Strategy Plan
**Epic:** Background Check Consent Collection
**Date:** 2026-07-21
**Author:** Claude (AGY Phase A)

---

## Strategy Comparison

| Dimension | Strategy 1 (Recommended) ⭐ | Strategy 2 | Strategy 3 |
|---|---|---|---|
| Architecture | Dedicated callables (`submitBackgroundCheckConsent`, `updateBackgroundCheckStatus`); `backgroundCheck` closed to all client writes | Client-direct `updateDoc` + nested-diff Firestore rule restricting sub-fields | Ship schema + admin editor only; defer the consent screen to P3-E27-C1 |
| Rules complexity added to `firestore.rules` | ✅ None — field stays closed to clients, same pattern as `staff` doc creation (A2) | ❌ New nested-diff logic on a mixed-permission map | ✅ None (but doesn't meet this epic's acceptance criteria) |
| Timestamp/IP trust | ✅ Server-observed (`Timestamp.now()`, `request.rawRequest.ip`) | ❌ Client-supplied (`new Date()`, ipify.org — spoofable) | n/a |
| Admin audit trail | ✅ `updateBackgroundCheckStatus` writes to `auditLog` in the same call | ❌ Separate direct write, no natural audit hook | n/a |
| Meets Sprint 6 acceptance criteria | ✅ Yes | ✅ Yes | ❌ No — no consent gate ships this sprint |

---

## Strategy 1 (Recommended) — Dedicated Callables, No New Rules Complexity

### Summary
1. **Callable `submitBackgroundCheckConsent`** (`functions/src/callable/staff.ts`): validates `request.auth.uid` matches the target staff doc, writes `backgroundCheck.consentGiven = true`, `consentGivenAt = Timestamp.now()`, `consentIpAddress = request.rawRequest.ip`. Idempotent — no-ops if already consented.
2. **Callable `updateBackgroundCheckStatus`** (admin-only, validates `admin` custom claim): accepts `{ uid, status, provider?, notes? }`, writes to `staff/{uid}.backgroundCheck`, appends an entry to `auditLog`.
3. **`firestore.rules`**: close `backgroundCheck` to all direct client writes — neither self nor admin write it via `updateDoc`; both paths go exclusively through the callables (Admin SDK bypasses rules), the same pattern already established for `staff` doc creation in P3-E27-A2. This is the smallest possible change to a file CLAUDE.md flags as requiring human approval, and avoids introducing nested-field diff logic.
4. **New component** `BackgroundCheckConsentScreen.tsx` (`apps/fsm/src/components/auth/`): same UI shell as `TermsConsentOverlay.tsx` (brand tokens, 48px targets, bilingual, RTL-aware), but calls `submitBackgroundCheckConsent` via `httpsCallable` instead of `updateDoc`. Includes the consent checkbox and "I do not consent" → sign-out path.
5. **Gating**: mount `BackgroundCheckConsentScreen` alongside `TermsConsentOverlay` in the FSM app shell, shown first when `staffProfile.backgroundCheck?.consentGiven` is not `true`.
6. **Admin UI**: compact status/provider/notes editor added to `StaffTable.tsx`, calling `updateBackgroundCheckStatus`.
7. **Dispatch guard**: extend the existing scheduling/travel-conflict check (`apps/customer/src/lib/utils/scheduling.ts` + `DispatchBoard.tsx`) with a `backgroundCheck.status !== 'cleared'` block, warning banner, and admin override that logs to `auditLog` with a reason.
8. **Shared types/converters**: add `backgroundCheck` to `Staff` in `packages/shared/src/types/staff.ts`; parse `consentGivenAt`/`completedAt` via `toDateOrNull` in `staffConverter`. Default missing/legacy docs to `{ consentGiven: false, consentGivenAt: null, consentIpAddress: null, status: 'not_started', completedAt: null }` so pre-existing staff docs (still on the old boolean flag) don't break the UI.
9. **`onStaffRegistered`**: initialize the new `backgroundCheck` object; remove `onboardingChecklist.backgroundCheck: false`.

### Files Changed

| File | Change |
|---|---|
| `packages/shared/src/types/staff.ts` | Add `backgroundCheck` object to `Staff`; remove `backgroundCheck` from `onboardingChecklist` semantics. |
| `packages/shared/src/firebase/converters.ts` | Parse `backgroundCheck` timestamps; default missing/legacy docs. |
| `functions/src/callable/staff.ts` | Add `submitBackgroundCheckConsent`, `updateBackgroundCheckStatus`; update `onStaffRegistered` initialization. |
| `functions/src/index.ts` | Export the two new callables. |
| `firestore.rules` | Exclude `backgroundCheck` from client-writable fields on `staff/{staffId}` (both self and generic paths). |
| `apps/fsm/src/components/auth/BackgroundCheckConsentScreen.tsx` | New component. |
| `apps/fsm/src/components/auth/BackgroundCheckConsentScreen.test.tsx` | New unit test, mirroring `TermsConsentOverlay.test.tsx`. |
| FSM app shell (wherever `TermsConsentOverlay` is mounted) | Add gating for the new screen, ordered before Terms. |
| `apps/fsm/src/i18n/locales/{en,fr}.json` | New consent copy. |
| `apps/customer/src/components/admin/StaffTable.tsx` | Background-check status/provider/notes editor. |
| `apps/customer/src/components/admin/DispatchBoard.tsx` / `lib/utils/scheduling.ts` | Uncleared-employee assignment guard + override. |
| `apps/customer/src/i18n/locales/{en,fr}.json` | New admin/dispatch copy. |
| `docs/firestore-schema.md` | Document the new `backgroundCheck` field (Phase C). |

### Persona Impact
- **Lauren (Admin)**: single admin surface to see/update status; dispatch board actively prevents an unsafe assignment instead of relying on her memory.
- **Jasmine (Cleaner)**: cannot be background-checked without explicitly, knowingly consenting first.
- **Brenda (Lead Cleaner)**: full French consent experience, matching the existing Terms overlay's bilingual pattern.

### Risks
- **Legacy staff docs**: existing records still carry the old `onboardingChecklist.backgroundCheck: boolean`. The converter must default gracefully rather than crash; no backfill migration script is in scope for this epic (small enough dataset per `docs/reports/` history — confirm during Phase B).
- **`request.rawRequest.ip` behind Hosting rewrites** may return a proxy/CDN IP rather than the true client IP — acceptable for consent-audit purposes (same precision class as the existing ipify-based approach in `TermsConsentOverlay`), but worth a code comment so it isn't mistaken for a bug later.
- **Two-app coordination**: the dispatch guard lives in `apps/customer`, the consent screen in `apps/fsm` — both must consume the identical `backgroundCheck` shape from `packages/shared` to stay in sync.

### Mitigation
- Converter-level defaulting (see Files Changed) covers the legacy-doc risk without a migration script.
- Comment the IP-source caveat directly above `request.rawRequest.ip` usage.

---

## Strategy 2 — Client-Direct Write + Nested-Diff Firestore Rule

### Summary
Mirror `TermsConsentOverlay` exactly: the employee writes `backgroundCheck.consentGiven/consentGivenAt/consentIpAddress` directly via `updateDoc`, guarded by a new Firestore rule that inspects individual nested fields inside the `backgroundCheck` map to ensure a non-admin request never changes `status`/`completedAt`/`provider`/`notes`.

### Assessment
Rejected. Nested-field diffing inside a single map is a well-known source of subtle Firestore rules bypass bugs — notably, this project's own `ADR-007` exists specifically because of a previous Firestore rules vulnerability. Introducing a new hand-written nested-diff condition into a file CLAUDE.md marks as requiring human approval raises the review burden and the risk of getting it wrong, for no real benefit over Strategy 1. It also keeps trusting client-supplied timestamps and a client-fetched IP (spoofable) instead of server-observed values, and gives the admin status edit no natural audit-log hook.

---

## Strategy 3 — Ship Schema + Admin Field Only; Defer the Consent Screen to P3-E27-C1

### Summary
Add only the `backgroundCheck` schema and a basic admin status editor now. Leave the actual consent-collection UI for P3-E27-C1, since C1 is nominally where the "first-login sequence" and `OnboardingSequenceGuard` live.

### Assessment
Rejected. This directly violates the epic's own acceptance criteria (a consent screen must exist and gate FSM access) and leaves every employee hired between Sprint 6 and Sprint 7 with no background-check consent gate at all — the exact PIPEDA gap this epic exists to close. It's also unnecessary: as P3-E27-B1 already demonstrated, standalone overlay components (`TermsConsentOverlay`) work fine before a formal sequencing guard exists, and C1 later absorbs them into the ordered flow without rework.

---

## Recommended Strategy: **Strategy 1**

### Execution Plan (Phase B)
1. Add the two callables in `functions/src/callable/staff.ts`; export in `index.ts`; update `onStaffRegistered` initialization.
2. Update `firestore.rules` to close `backgroundCheck` to direct client writes (Security_Auditor + human review, per CLAUDE.md).
3. Update `packages/shared` types and converters, including legacy-doc defaulting.
4. Build `BackgroundCheckConsentScreen` + tests + i18n; wire gating ahead of `TermsConsentOverlay`.
5. Add the admin status editor to `StaffTable.tsx` and the dispatch board guard + override audit logging.
6. Update `docs/firestore-schema.md`.
7. Run `npm run build && npm run lint`; invoke Brand_Auditor, Data_Steward, Linguistic_Auditor, Security_Auditor.
8. Write the Phase C close report and mark P3-E27-B2 ✅ in `docs/ACTIVE_CYCLE.md`.

---

## HALT — Awaiting Human Approval
Please approve Strategy 1 to proceed to Phase B execution.
