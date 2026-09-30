# HOTFIX-02 — Shift Board Permission Fix (Callable Projection)

**Type:** Live production bug fix · **Priority:** P0 · **Complexity:** M
**Opened:** 2026-09-30

---

## Problem

The FSM Shift Board (`/shifts`) is broken for every non-admin staff member.

`apps/fsm/src/hooks/useShifts.ts` queries `jobs where status == 'unassigned' orderBy createdAt desc`.
The `jobs` read rule (`firestore.rules`, jobs block) only allows
`resource.data.assignedTo == request.auth.uid || isAdmin()`. Unassigned jobs have
`assignedTo: null`, so the query is rejected with `PERMISSION_DENIED`.

Confirmed on the Firestore emulator on 2026-09-30 with the real `firestore.rules`:

| Query | Role | Result |
|---|---|---|
| `jobs where assignedTo == uid` (My Jobs) | staff | ✅ allowed |
| `jobs where status == 'unassigned'` (Shift Board) | admin | ✅ allowed |
| `jobs where status == 'unassigned'` (Shift Board) | staff | ❌ `Property assignedTo is undefined on object. for 'list'` |
| `get jobs/{unassignedId}` | staff | ❌ denied |

The FSM unit tests mock Firestore, so they did not catch this.

## Decision (human, 2026-09-30)

Do **not** loosen `firestore.rules`. Serve open shifts to staff through a Cloud Function
callable that returns a **PII-minimised projection** of unassigned jobs. Client name,
phone, notes and street address stay out of the browser until a shift is claimed.
After that, the existing `assignedTo == uid` rule grants full access.

## Scope

1. A new callable, `listOpenShifts`, that returns open shifts to authenticated `staff` / `supervisor` / `admin` callers.
2. The FSM Shift Board reads from the callable instead of a direct Firestore query.
3. Shift cards show a service area (municipality/FSA), not the full client address.
4. Test infrastructure:
   - `npm run test:rules` actually runs. Today `vitest.config.ts` excludes `test/**`, so it finds no files.
   - Fix the 2 stale rules tests: the admin staff-create test and the public booking fixture.
   - Rules tests lock in the decision that staff **cannot** list unassigned jobs directly.

## Out of scope

- Any change to `firestore.rules` or `firestore.dev.rules`.
- Adding `test:rules` to CI (needs a Java runtime in the workflow). This is a follow-up.
- Dev/preview DB asymmetry: the job functions hard-code `(default)`. This is a pre-existing issue, documented in `firestore-schema.md` §13.

## Personas

- **Primary:** P7 Carla, P8 Jasmine, P9 Mike, P13 Marcus, P14 Sylvie, P15 Daniel. The Shift Board is the only way they can pick up work, so it must load.
- **Compliance owner:** P12 Lauren. PIPEDA minimal-access and an audit-safe design.
- **Indirect (client PII):** P1–P6. Their name, phone and address are not shown to cleaners who haven't claimed the job.

## Acceptance criteria (Persona Tests)

1. **Shift Board loads for staff.** A user with the `staff` claim sees open shifts. Rules test: direct listing stays denied.
2. **P7 Carla:** with limit $800 and current $750, a $75 shift shows the disabled overage message and a $45 shift is claimable. This is unchanged from the existing P7 test.
3. **P9 Mike:** a Tuesday 18:30–20:00 shift overlapping his Tuesday 19:00–20:30 recurring window **does not appear**. Tuesday 20:30–22:00 and Wednesday 19:00–20:30 do appear.
4. **P8 Jasmine:** a shift inside her transit buffer of an already-assigned shift shows the travel-conflict message and is not claimable.
5. **PII:** the callable response never contains `clientName`, `clientPhone`, `clientNotes`, `clientAddress`, `bookingId` or `checkedInGeo`.
6. **After a claim**, the shift leaves the board and the full address is visible on `/jobs/:id`.
7. EN/FR/AR strings for every new UI text. `npm run build && npm run lint` pass. `npm run test:rules` runs and passes.
