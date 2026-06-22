# P3-E21 — 3-Strategy Plan
**Epic:** Firestore `withConverter()` Adoption
**Date:** 2026-06-22
**Author:** Antigravity (AGY Phase A)

---

## Strategy Comparison

| Dimension | Strategy 1 (Recommended) ⭐ | Strategy 2 | Strategy 3 |
|---|---|---|---|
| Converter placement | Shared package `@freshnest/shared` | Local app level duplicate files | Shared package `@freshnest/shared` |
| Developer ergonomics | ✅ High (simple helper factories `bookingsCollection(db)`) | Medium (duplicate logic) | ❌ Low (devs must chain `.withConverter(...)` manually) |
| Risk of type drift | ✅ Zero (canonical converters shared across apps) | ❌ High (different mapping between FSM and Customer apps) | ✅ Zero |
| Maintainability | ✅ High (changes to Date/Timestamp fields updated in one place) | Low | Medium |
| Code surface | Medium | High (duplicate file layouts) | Medium |

---

## Strategy 1 (Recommended) — Centralized Shared Converters & Helpers

### Summary
Relocate `Review` type to the shared package. Write a single, canonical Firestore converters module inside `@freshnest/shared` (`packages/shared/src/firebase/converters.ts`). Export type-safe helper functions (like `bookingsCollection(db)`) that return pre-configured collection references. Automatically strip `undefined` fields during writes (`toFirestore`) and recursively parse Timestamps to JS Dates during reads (`fromFirestore`).

### Files Changed

| File | Change |
|---|---|
| `packages/shared/src/types/booking.ts` | Move `Review` interface definition here from customer app. |
| `packages/shared/src/firebase/converters.ts` | **New**. Implements all 7 converters and collection helper functions. |
| `packages/shared/src/index.ts` | Re-export `Review` type and the collection helpers. |
| `apps/customer/src/types/index.ts` | Remove local `Review` interface, import from `@freshnest/shared`. |
| `apps/customer/src/lib/firebase/firestore.ts` | Refactor queries to use the collection helpers; remove manual `Timestamp` casts. |
| `apps/customer/src/components/admin/hooks/` | Update hooks (`useBookings`, `useStaff`, `usePayRates`, etc.) to query via helpers. |
| `apps/fsm/src/hooks/` | Update hooks (`useShifts`, `useMyAssignedShifts`, etc.) to use helpers. |
| `apps/fsm/src/context/StaffAuthProvider.tsx` | Use `staffCollection(db)` to look up credentials. |

### Persona Impact
- **P12 Lauren (Admin) / P8 Jasmine (FSM staff)**: Complete type safety and timezone accuracy. Dates are resolved cleanly and uniformly across all operational screens.
- **P3 Margaret**: Prevents accessibility and UI crashes due to unexpected Firestore data structure modifications.

### Risks
- Overlooking nested arrays (like `photos` or `checklistCompletions`) where nested Timestamp parsing is required.
- Typings might mismatch if vitest mock databases are not updated.

### Mitigation
- Implement a recursive, robust `toDate` parser in `converters.ts` that handles arrays, nested objects, and both Firebase JS SDK `Timestamp` objects and plain object timestamp shapes.
- Run `npm run test:customer` and `npm run test:fsm` after refactoring to ensure all test assertions pass.

---

## Strategy 2 — App-Level Local Converters

### Summary
Skip modifying the shared package. Create two independent `converters.ts` files inside `apps/customer` and `apps/fsm` respectively.

### Assessment
This forces code duplication for 5 shared collections (`bookings`, `jobs`, `staff`, `payRates`, `checklistTemplates`). If any schema updates are introduced in later cycles (e.g., auto-scheduling constraints), developers would have to update both converters manually, which will inevitably lead to type mapping drift.

---

## Strategy 3 — Converter Objects Only (Manual Chain)

### Summary
Define converters inside the shared package, but only export the raw converter objects (e.g., `bookingConverter`).

### Assessment
This requires developers to write `collection(db, 'bookings').withConverter(bookingConverter)` for every query. It increases typing overhead and introduces the risk that a developer might forget to attach `.withConverter()` in a new hook, breaking type guarantees silently.

---

## Recommended Strategy: **Strategy 1**

### Execution Plan (Phase B)
1. **Consolidate Types**: Move `Review` from customer app types into `@freshnest/shared`.
2. **Create Converters File**: Implement all converters and collection helpers in `packages/shared/src/firebase/converters.ts`.
3. **Re-export**: Update `@freshnest/shared` entry point.
4. **Refactor Apps**: Refactor queries across hooks and firestore services to use the helpers.
5. **Typescript & ESLint Verification**: Ensure everything builds cleanly.
6. **Test Verification**: Execute unit and integration tests.

---

## HALT — Awaiting Human Approval
Please approve Strategy 1 to proceed to Phase B execution.
