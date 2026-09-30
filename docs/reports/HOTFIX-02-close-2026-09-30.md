# HOTFIX-02 Close Report — Shift Board Permission Fix
**Date:** 2026-09-30
**ID:** HOTFIX-02
**Title:** Shift Board Permission Fix (Callable Projection)
**Type:** Live production bug fix
**Spec:** [`docs/projects/HOTFIX-02.md`](../projects/HOTFIX-02.md) · **Plan:** [`docs/plans/HOTFIX-02_PLAN.md`](../plans/HOTFIX-02_PLAN.md)
**Status:** ✅ Closed (code complete; goes live on the next merge to `main` via CI)

---

## 1. Incident Summary

The FSM Shift Board (`/shifts`) failed for every non-admin staff member.

- **What broke:** `useShifts` queried `jobs where status == 'unassigned'`, but the `jobs` read rule only allows `assignedTo == request.auth.uid || isAdmin()`. Unassigned jobs have `assignedTo: null`, so every staff query returned `PERMISSION_DENIED`.
- **How it was confirmed:** on the Firestore emulator against the real `firestore.rules`. The emulator reported `Property assignedTo is undefined on object. for 'list'`.
- **Why tests missed it:** FSM unit tests mock Firestore, and `npm run test:rules` had never run, because `apps/customer/vitest.config.ts` excludes `test/**`.

---

## 2. Strategy Chosen

**Strategy 2 — Server-Evaluated Eligibility** (approved by the human on 2026-09-30).

The human rejected loosening `firestore.rules`, because unassigned jobs hold client PII (name, phone, address, notes). Of the two callable-based options, Strategy 2 was chosen because:
- It sends the least data to staff devices.
- Blocked-window shifts are dropped on the server, so Mike's (P9) "must not appear" requirement is met literally.
- It removes the second, drift-prone copy of the P7/P8/P9 logic. The board and `claimJob` now run the same code.
- It needs no rules change and no schema change. Strategy 3 would have needed both.

---

## 3. Files Created / Modified

### Cloud Functions

| Path | Change |
|---|---|
| `functions/src/lib/eligibility.ts` | **Created.** Pure P7/P8/P9 checks: `timeToMinutes`, `extractPostalPrefix` and `hasTravelConflict` moved verbatim from `jobs.ts`; `getShiftDurationHours`, `estimateShiftPay`, `earningsOverage`, `overlapsBlockedWindow`, `resolveBufferMinutes` and `findTravelConflict` extracted from `executeClaimJob`. |
| `functions/src/lib/openShifts.ts` | **Created.** `buildOpenShifts()` is the pure projection: blocked-window filter, eligibility, and an output field whitelist. `resolveMunicipality()` gives the service-area label. |
| `functions/src/callable/shifts.ts` | **Created.** The `listOpenShifts` callable: role gate (`staff`/`supervisor`/`admin`), three reads on `(default)` (same DB as `claimJob`), then `buildOpenShifts`. |
| `functions/src/jobs.ts` | `executeClaimJob` now calls the extracted helpers. Checks run in the same order with the same error codes. The old helpers are re-exported for existing importers. |
| `functions/src/index.ts` | Exports `listOpenShifts`. |
| `functions/test/openShifts.test.ts` | **Created.** 13 tests covering the P7, P8 and P9 persona cases, the PII whitelist and area resolution. |
| `functions/package.json`, `functions/package-lock.json` | Adds a `test` script. Node engine 20 → **22**; `@types/node` ^20 → ^22. |

### Shared package

| Path | Change |
|---|---|
| `packages/shared/src/types/job.ts` | Adds the `OpenShift` response type. This is a callable DTO, not a Firestore document. |

### FSM app

| Path | Change |
|---|---|
| `apps/fsm/src/hooks/useShifts.ts` | Replaces the Firestore `useCollectionQuery` with `useQuery` + the `listOpenShifts` callable. Refetches every 60 s and on window focus. Exports `AVAILABLE_SHIFTS_QUERY_KEY`. |
| `apps/fsm/src/pages/ShiftBoardPage.tsx` | Renders from the server's `eligibility`. Removes about 150 lines of duplicated helper and filter code. Shows the service area instead of the street address. Invalidates the query after a claim. Shows a translated load error. |
| `apps/fsm/src/pages/ShiftBoardPage.test.tsx` | Rewritten for the `OpenShift` shape. Adds P7, P8, invalidation and P14 load-error cases. |
| `apps/fsm/src/types/index.ts` | Re-exports `OpenShift`. |
| `apps/fsm/src/i18n/locales/{en,fr}.json` | New `fsm.shifts` keys: `loadError`, `areaLabel`, `areaUnknown`, `addressAfterClaim`, `serviceTypes.*`. |

### Rules tests

| Path | Change |
|---|---|
| `apps/customer/vitest.rules.config.ts` | **Created.** Node-environment config for the rules suite. |
| `apps/customer/package.json` | `test:rules` now uses the new config. |
| `apps/customer/tsconfig.test.json` | Includes the new config. |
| `apps/customer/test/firestore-rules.test.ts` | Adds four FSM query-shape tests. Staff direct listing and reading of unassigned jobs are **asserted denied**, which locks in the design. Fixes 2 stale tests: the booking fixture was missing `preferredDate`, and staff create has been server-only since P3-E27-A2. |

### CI

| Path | Change |
|---|---|
| `.github/workflows/firebase-deploy.yml` | Adds FSM tests plus functions install, build and test. Adds a **Deploy Cloud Functions** step (`firebase-tools@15`, using the `FIREBASE_SERVICE_ACCOUNT` secret) that runs *before* hosting. Adds `concurrency: deploy-production`. Node 22. |
| `.github/workflows/firebase-preview.yml` | Adds FSM tests plus functions build and test. Functions are **not** deployed from PRs. Node 22. |
| `.github/workflows/codeql.yml` | Node 22. |

### Docs

| Path | Change |
|---|---|
| `docs/projects/HOTFIX-02.md`, `docs/plans/HOTFIX-02_PLAN.md` | Phase A spec and plan. |
| `docs/ACTIVE_CYCLE.md` | HOTFIX-02 row added. |
| `user-guide/staff-guide.md` | **Created.** Shift Board section. |

**Schema:** no changes. `docs/firestore-schema.md` was not modified. Only existing `jobs` and `staff` fields are read, and no new fields are written.

---

## 4. Verification

| Check | Result |
|---|---|
| `npm run build` (customer + FSM) | ✅ |
| `npm run lint` | ✅ 0 errors (the 2 existing RHF `watch()` warnings remain) |
| `npm run test:fsm` | ✅ 50/50 |
| `npm run test:customer` | ✅ 39/39 |
| `functions`: `npm run build` / `npm test` | ✅ / ✅ 13/13 |
| `npm run test:rules` (Firestore emulator) | ✅ 19/19 |
| Brand_Auditor | ✅ No new violations. One `text-xs` hint was changed to `text-base`. |
| Data_Steward | ✅ No new Firestore fields. No new writes in production code. |
| Linguistic_Auditor | ✅ No hardcoded strings. All new keys are present in EN/FR. |

---

## 5. Persona Tests

| Persona | Acceptance criterion (spec) | Result |
|---|---|---|
| **All staff (P7–P15)** | Shift Board loads for the `staff` claim, and direct listing stays denied | ✅ **Pass.** The callable serves the board; the rules tests assert direct list and get are denied. *Needs live confirmation after the first CI deploy.* |
| **P7 Carla** | $800 limit, $750 earned: $75 shift disabled with overage, $45 claimable | ✅ **Pass.** `earningsOverage` gives 25 and 0. FSM test renders the disabled button and the overage message. |
| **P7 Carla, step 6** | "$10 claimable / $11 blocked" at $795 | ⚠️ **Spec inconsistency.** Only $5 remains at $795/$800. The test asserts $5 fits and $6 is blocked. See §6. |
| **P9 Mike** | Tuesday 18:30–20:00 hidden; Tuesday 20:30–22:00 and Wednesday 19:00–20:30 shown; window label never exposed | ✅ **Pass.** Filtered on the server. The test asserts the response contains neither the shift nor "Recovery meeting". |
| **P8 Jasmine** | A shift inside the transit buffer of an assigned shift shows the conflict and can't be claimed | ✅ **Pass.** 60 min transit default; same-FSA waiver still applies to direct overlap; cancelled jobs ignored. FSM test disables the button with the conflict message. |
| **P13 Marcus / P15 Daniel** | Same earnings and buffer protections | ✅ **Pass.** Same code paths as P7/P8. Cornwall Island resolves ahead of Cornwall. |
| **P14 Sylvie** | Plain-language errors | ✅ **Pass.** A load failure shows the translated `fsm.shifts.loadError`, not the raw server message. |
| **P12 Lauren / P1–P6 (PII)** | Response never contains `clientName`, `clientPhone`, `clientNotes`, `clientAddress`, `bookingId` or `checkedInGeo` | ✅ **Pass.** Asserted by the key-whitelist test and the string-absence test. |
| **After claim** | The shift leaves the board, and the full address is visible on `/jobs/:id` | ✅ **Pass** (by design). The query is invalidated after a claim (tested). The existing `assignedTo == uid` rule grants the full read (rules test "My Jobs" ✅). |

---

## 6. Deviations From the Approved Plan

- **Projection logic moved into a pure module.** `buildOpenShifts` lives in `functions/src/lib/openShifts.ts` instead of inline in the callable, so the PII whitelist and the P9 filter can be unit-tested without Firestore. The callable only handles auth and reads.
- **The functions test file is `functions/test/openShifts.test.ts`**, not `eligibility.test.ts` as in the plan. It covers both modules.
- **Scope added at the human's request:**
  - CI now deploys Cloud Functions on merge to `main`.
  - The functions runtime moved from Node 20 to Node 22, since Node 20 is being retired on Cloud Functions.
  - CI also runs FSM and functions tests.
- **Small fixes found during the work:**
  - The shift card used `admin.dashboard.details.address` and `booking.fields.*` translation keys, which don't exist in the FSM locales, so the raw key was displayed. They were replaced with new `fsm.shifts.*` keys.
  - The load-error state showed the raw server message. It now shows `fsm.shifts.loadError`.
- **Composite index avoided.** There is no `jobs(status, createdAt)` index, so the callable does a single-field query and sorts in memory. No `firestore.indexes.json` change was needed.

---

## 7. Known Limitations and Follow-Ups

1. **Not live yet.** The fix ships on the next merge to `main`, where CI deploys functions and then hosting. That first CI run also validates the service-account IAM roles (updated by the human on 2026-09-30) and the Node 22 runtime.
2. **PERSONAS.md P7 step 6 arithmetic** needs a human correction. The AI must not edit PERSONAS.md.
3. **Arabic removed from the FSM app** (human decision 2026-09-30: EN + FR only for this release). This includes `ar.json`, the language toggles, the RTL handling, and the Arabic option in the first-login language picker. A guard test (`apps/fsm/src/i18n/i18n.test.ts`) and a CLAUDE.md rule stop it from coming back. **PERSONAS.md P10 still requires Arabic and needs a human edit.** Staff docs that already hold `preferences.language: 'ar'` fall back to English in the UI but violate the schema (`'en' | 'fr'`); a human should check production data for them.
4. **No realtime updates on the board.** It refreshes every 60 s, on focus and after a claim. A shift claimed by someone else can stay visible briefly; `claimJob` correctly returns `JOB_ALREADY_ASSIGNED` in that case.
5. **The claim error still shows the server's English message** (a pre-existing issue). Mapping `HttpsError` codes to translated `fsm.shifts.*` strings would finish P14/P10 plain-language support.
6. **Preview channels read `(default)`** for shifts, the same as `claimJob` (asymmetry documented in `firestore-schema.md` §13). This isn't a regression.
7. **`test:rules` isn't in CI yet.** It needs Java and the Firestore emulator in the workflow.
8. **Existing brand drift in `ShiftBoardPage.tsx`:** 11 `text-xs`/`text-sm` uses and 4 `rounded-full` spinners and dots, all from before this change. They should go into a separate brand clean-up pass.
