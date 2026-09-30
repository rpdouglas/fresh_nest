# HOTFIX-02 — 3-Strategy Plan
**Epic:** Shift Board Permission Fix (Callable Projection). See [`docs/projects/HOTFIX-02.md`](../projects/HOTFIX-02.md)
**Date:** 2026-09-30
**Author:** Claude Code (AGY Phase A)
**Status:** ✅ Strategy 2 approved by human 2026-09-30

---

## Context

- The confirmed bug: staff get `PERMISSION_DENIED` on the Shift Board query. Details are in the project spec.
- The human has chosen a **callable** over loosening `firestore.rules`.
- **No strategy modifies `firestore.rules` or `firestore.dev.rules`.**

What the Shift Board card uses today (`apps/fsm/src/pages/ShiftBoardPage.tsx`):

| Field | Used for | PII? |
|---|---|---|
| `id` | claim button → `claimJob` | no |
| `serviceType` | badge | no |
| `scheduledDate`, `scheduledStartTime`, `scheduledEndTime` | date/time, duration, P9 blocked-window filter, P8 travel check | no |
| `payRateSnapshot.amount` | estimated pay, P7 earnings check | no |
| `clientAddress` | **displayed in full**, plus postal prefix (FSA) for the P8 travel-buffer waiver | **yes** |

`claimJob` (`functions/src/jobs.ts` `executeClaimJob`) already enforces P7, P8 and P9 on the server inside a transaction. This fix only changes what the board *shows*. Claim safety is unchanged.

**DB targeting:** `executeClaimJob` and job creation use `getFirestore('(default)')`. The new callable must read the same database, or the board could list shifts that `claimJob` can't find.

---

## Strategy Comparison

| | Strategy 1 — Thin projection | Strategy 2 ⭐ — Server-evaluated eligibility | Strategy 3 — Denormalised `openShifts` collection |
|---|---|---|---|
| Rules change | None | None | **Yes: new collection rule** (human approval) |
| Schema change | None | None | **Yes: new collection** |
| P9 blocked shifts leave the server? | Yes (hidden on the client) | **No (filtered on the server)** | Yes (hidden on the client) |
| P7/P8 logic, number of copies | 2 (client + `claimJob`) | **1 (shared module)** | 2 |
| Realtime updates | No (poll + refetch) | No (poll + refetch) | Yes (`onSnapshot`) |
| Offline board (P8/P11) | In-memory cache only | In-memory cache only | Firestore persistent cache |
| New moving parts | 1 callable | 1 callable + 1 extracted module | 2 triggers + collection + rule + backfill |
| Complexity | S | M | L |

---

## Strategy 1 — Thin Projection Callable

### Summary
Add a `listOpenShifts` callable. It checks the caller's `role` claim (`staff` / `supervisor` / `admin`), then reads `jobs where status == 'unassigned'` with the Admin SDK on `(default)`. It returns a whitelisted DTO per job:

```ts
{ id, serviceType, scheduledDate, scheduledStartTime, scheduledEndTime,
  payRateAmount, area: { postalPrefix: string | null, municipality: string | null } }
```

`useShifts` switches from `useCollectionQuery` to `useQuery` + `httpsCallable`, with `refetchInterval: 60_000`. The query is invalidated after a successful claim. The page keeps all its current client-side logic. The travel check compares `area.postalPrefix` instead of the full address. The card shows the area instead of the street address.

### Files changed
- **Created:** `functions/src/callable/shifts.ts` (the `listOpenShifts` callable and DTO mapping)
- **Modified:** `functions/src/index.ts` (re-export)
- **Modified:**
  - `packages/shared/src/types/job.ts`: add the `OpenShift` DTO type. It's an API response type, not a Firestore document.
  - `packages/shared/src/index.ts`, only if a new file is used
- **Modified:**
  - `apps/fsm/src/hooks/useShifts.ts`: callable + `useQuery`
  - `apps/fsm/src/pages/ShiftBoardPage.tsx`: `OpenShift` type, area display, travel check on postal prefix, invalidate after claim
  - `apps/fsm/src/pages/ShiftBoardPage.test.tsx`: new mock shape
- **Modified:** `apps/fsm/src/i18n/locales/{en,fr,ar}.json` (new keys under `fsm.shifts.area*`)
- **Test infrastructure** (same in all strategies; see below)

### Persona impact
- **P7/P13:** the earnings meter and overage message are unchanged.
- **P8/P15:** the travel check works from the postal prefix. That's what the waiver already uses, so there's no behaviour change.
- **P9 Mike:** shifts are still hidden, but only on the client. Every open shift, including ones in his blocked windows, is still sent to his device.
- **P14 Sylvie:** the board loads again. The existing plain-language error states are unchanged.
- **P12 Lauren:** less PII leaves the server. The PII whitelist lives in one function.

### Risks
- The P7/P8/P9 rules still exist in two copies: the client and `claimJob`. They can drift, which is already the case today.
- Blocked-window shifts still reach Mike's device, so they're visible in dev tools.
- No realtime updates. A shift someone else claims can stay visible for up to 60s, and `claimJob` then correctly returns `JOB_ALREADY_ASSIGNED`.

### Schema audit
No new Firestore fields. Reads existing `jobs` fields documented in `firestore-schema.md` §6. `OpenShift` is a response type and is never persisted. `area` is computed at response time.

### Tailwind audit
No new classes. The area line reuses the existing address-block classes (`text-xs text-text-muted uppercase tracking-wider`, `text-charcoal text-sm font-medium`).

---

## Strategy 2 ⭐ (Recommended) — Server-Evaluated Eligibility

### Summary
Same callable and DTO as Strategy 1. The difference is that the server also works out eligibility for the calling staff member, using **the same code as `claimJob`**:

1. **Extract** the pure checks now inlined in `executeClaimJob` into `functions/src/lib/eligibility.ts`:
   - `estimateShiftPay`
   - `overlapsBlockedWindow`
   - `hasTravelConflict`
   - `timeToMinutes`
   - `extractPostalPrefix`

   Both `executeClaimJob` and `listOpenShifts` import them. The claim logic stays behaviourally identical.
2. `listOpenShifts` reads the caller's `staff/{uid}` doc and their same-day assigned jobs. It then:
   - **Drops shifts that overlap a blocked window before responding (P9).** They never leave the server.
   - Attaches to each shift:
     ```ts
     eligibility: {
       estimatedPay, overLimit, overage,
       travelConflict: { start, end, bufferMinutes } | null
     }
     ```
3. `ShiftBoardPage` renders from `eligibility` and drops its local copies of `timeToMinutes`, `extractPostalPrefix`, `hasTravelConflict` and the blocked-window filter. The top earnings meter still reads the live `staffProfile` snapshot.
4. After a claim, the page invalidates the `availableShifts` query. The eligibility flags then recompute against the new earnings.

`useShifts` works as in Strategy 1: `useQuery` + callable, `refetchInterval: 60_000`, refetch on window focus.

### Files changed
- **Created:**
  - `functions/src/lib/eligibility.ts`: the pure P7/P8/P9 checks, extracted and unchanged
  - `functions/src/callable/shifts.ts`: `listOpenShifts`, with a role check, the `(default)` DB, the DTO whitelist and eligibility
- **Modified:**
  - `functions/src/jobs.ts`: `executeClaimJob` imports from `lib/eligibility.ts`. Logic unchanged.
  - `functions/src/index.ts`: re-export
- **Modified:** `packages/shared/src/types/job.ts`: `OpenShift` and `ShiftEligibility` response types
- **Modified:**
  - `apps/fsm/src/hooks/useShifts.ts`: callable + `useQuery`
  - `apps/fsm/src/pages/ShiftBoardPage.tsx`: render from `eligibility`, remove duplicated helpers, area display, invalidate after claim
  - `apps/fsm/src/pages/ShiftBoardPage.test.tsx`: new mock shape. Adds P7, P8 and P9 cases driven by the eligibility flags.
- **Modified:** `apps/fsm/src/i18n/locales/{en,fr,ar}.json` (new `fsm.shifts.area*` keys)
- **Created:** `functions/test/eligibility.test.ts`: unit tests for the extracted pure functions, covering the P7, P8 and P9 acceptance cases verbatim. Run with the root Vitest (`npx vitest run --root functions`).
- **Test infrastructure** (same in all strategies; see below)

### Persona impact
- **P9 Mike:** strongest guarantee. Blocked-window shifts are never sent to his device. That matches the PERSONAS.md wording: "a visibility filter… blocked shifts must not appear".
- **P7 Carla / P13 Marcus:** the "why can't I claim this" message is computed by the same code that enforces the claim, so the UI can't disagree with the server.
- **P8 Jasmine / P15 Daniel:** the travel-buffer message uses the full address on the server, so the postal-prefix waiver stays exact. The client only receives the prefix.
- **P14 Sylvie:** the board loads again, and errors stay the existing translated messages.
- **P12 Lauren:** less PII sent to devices, one source of truth for the protective constraints, and an easier audit.

### Risks
- **Refactoring `executeClaimJob`:** a mistake would hit live claims. Mitigations:
  - move the code verbatim as pure functions
  - unit-test them against the persona acceptance cases before and after
  - leave the transaction body otherwise untouched
- **Latency:** the callable does 3 reads (open jobs, staff doc, same-day assigned jobs). That's fine at current volume. A cold start could add about 1–2 s on first load, so the existing spinner covers it.
- **No realtime updates:** same as Strategy 1.
- **Functions deploy is manual.** CI doesn't deploy functions. Phase B step 6 must deploy, and `functions/node_modules` needs `npm ci` locally first.
- **Preview channels** read `(default)` for shifts. This asymmetry already exists for `claimJob`, so it isn't a regression, but it should be noted in the close report.

### Schema audit
No new Firestore fields. It reads existing fields only:
- `jobs`: `status`, `assignedTo`, `scheduledDate`, `scheduledStartTime`, `scheduledEndTime`, `serviceType`, `payRateSnapshot.amount`, `clientAddress` (server-side only), `createdAt`
- `staff`: `status`, `constraints.blockedWindows`, `constraints.transportMode`, `constraints.transitBufferMinutes`, `financials.monthlyEarningsLimit`, `financials.currentMonthEarnings`

All of these are in `firestore-schema.md` §4 and §6. `OpenShift` and `ShiftEligibility` are response types and are never persisted.

### Tailwind audit
No new classes. The page loses code but gains no styles. The area line reuses the existing address-block classes.

---

## Strategy 3 — Denormalised `openShifts` Collection

### Summary
Maintain a sanitised mirror collection:
- `onJobCreatedTrigger` and `onJobUpdatedTrigger` write or delete `openShifts/{jobId}` whenever a job enters or leaves `status == 'unassigned'`.
- A new rule allows `isStaff()` reads.
- The FSM keeps a realtime `useCollectionQuery` against `openShifts`, which works with the persistent offline cache.
- A one-off backfill callable seeds existing unassigned jobs.

### Files changed
- **Modified:**
  - `functions/src/triggers/job.created.ts`
  - `functions/src/triggers/job.updated.ts`
  - `functions/src/index.ts`
- **Created:** `functions/src/callable/backfillOpenShifts.ts`
- **Modified:** `firestore.rules` and `firestore.dev.rules`, adding a `match /openShifts/{id}` block. **This requires human approval under COMPLIANCE.md §4.**
- **Modified:** `firestore.indexes.json` (`openShifts` ordered by `createdAt`)
- **Modified:** `docs/firestore-schema.md` (new §: `openShifts`)
- **Modified:** `packages/shared/src/firebase/converters.ts` and `types/job.ts` (converter and type)
- **Modified:** `apps/fsm/src/hooks/useShifts.ts`, `ShiftBoardPage.tsx`, `ShiftBoardPage.test.tsx`, and the i18n files
- **Test infrastructure** (same in all strategies), plus rules tests for `openShifts`

### Persona impact
- **P8 Jasmine / P11 Brenda:** the board keeps realtime updates and works from the offline cache in transit or in a basement.
- **P9 Mike:** blocked shifts are only filtered on the client. Same as today.
- **P12 Lauren:** sanitised data, but a second copy of job data to keep consistent and to erase under PIPEDA (P3-E15).

### Risks
- **Invented schema.** The `openShifts` collection and its fields don't exist in `firestore-schema.md`. That blocks this strategy until the schema is approved and documented.
- **Rules change** needs human review and deployment.
- **Consistency:** trigger failures or retries can leave stale or ghost shifts. The backfill is needed to seed existing unassigned jobs.
- **Biggest change** for a hotfix, and it adds to the P3-E15 erasure scope.

### Schema audit
⚠️ **BLOCKER.** New collection `openShifts` with fields `serviceType`, `scheduledDate`, `scheduledStartTime`, `scheduledEndTime`, `payRateAmount`, `postalPrefix`, `municipality`, `createdAt`. None of these are in `firestore-schema.md`. The strategy needs a schema amendment approved before execution.

### Tailwind audit
No new classes.

---

## Test Infrastructure (common to all strategies)

| Change | File |
|---|---|
| Make `test:rules` runnable. The main config excludes `test/**`, so add a dedicated config (`environment: 'node'`, `include: ['test/firestore-rules.test.ts']`) and point the script at it. | **Created** `apps/customer/vitest.rules.config.ts`; **modified** `apps/customer/package.json` |
| Fix stale test "allows admin to manage staff profiles". Since P3-E27-A2, client-side staff **create** is intentionally denied. Split it into two tests: admin update succeeds, and admin client create is denied. | `apps/customer/test/firestore-rules.test.ts` |
| Fix stale test "allows public creation of booking". Add `preferredDate` to the fixture and confirm the emulator error clears. If it doesn't, investigate before changing anything else. | same |
| Lock in the decision: the two new staff Shift Board tests assert **denial** (`assertFails`), with a comment pointing to HOTFIX-02. Keep the My Jobs and admin controls as `assertSucceeds`. | same |
| Keep `tsconfig.test.json` coverage of `test/` if it applies. | `apps/customer/tsconfig.test.json` (verify only) |

**Follow-up, not in this hotfix:** run `test:rules` in `firebase-preview.yml`. It needs Java and the emulator in CI.

---

## Recommendation

**Strategy 2.**
- It fixes the outage without touching rules or schema.
- It sends the least data to devices.
- It meets Mike's P9 "must not appear" requirement literally, because the filter runs on the server.
- It removes the drift-prone second copy of the P7/P8/P9 logic.

The main cost is a careful extract-only refactor of `executeClaimJob`, covered by new unit tests.

Strategy 1 is the fallback if you want the smallest possible change. Strategy 3 only makes sense if realtime and offline browsing of open shifts is a hard requirement, and it needs rules and schema approval first.

## Phase B checklist (for the approved strategy)
1. Implement. Run Brand_Auditor, Data_Steward and Linguistic_Auditor.
2. `npm run build && npm run lint`, `npm run test:fsm`, `npm run test:customer`, `npm run test:rules` (emulator)
3. `cd functions && npm ci && npm run build`
4. Deploy functions (`npx firebase deploy --only functions:listOpenShifts,functions:claimJob`). **Confirm with the human before deploying.**
5. Phase C: close report `docs/reports/HOTFIX-02-close-YYYY-MM-DD.md`, add a HOTFIX-02 row to `ACTIVE_CYCLE.md`, and update `user-guide/` for the area-instead-of-address display change.
