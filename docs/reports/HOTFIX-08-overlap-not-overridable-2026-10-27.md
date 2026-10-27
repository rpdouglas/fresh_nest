# HOTFIX-08 — Double-booking a cleaner could be overridden (gap analysis N-3)

**Date:** 2026-10-27 · **Found by:** FSM gap analysis ([R6](../gap-analysis/GAP_ANALYSIS_2026-10-27.md), SCH-S5.2 / SCH-S8.1) · **Status:** ✅ Code complete (PR #38). No rules change, so it ships with the merge

## Personas
- **P12 Lauren:** dispatch.
- **All crew (P7–P15):** never booked in two places at once.
- **Clients:** no visit left without its cleaner.

## Problem
When the office assigned a cleaner (booking panel "Assign Cleaner", or a drag on the Dispatch Board), an **overlapping** shift was only a travel-buffer warning in the override dialog. Typing a reason saved the double-booking. The spec says one person on two overlapping jobs is an error **no one can override**. The staff self-claim (`claimJob`) already rejected overlaps on the server.

## Fix
- **`lib/utils/scheduling.ts`:**
  - new `shiftsOverlap()`;
  - `checkCleanerSchedulingConflicts()` now returns `isOverlap`, `overlappingShift` and `blockingErrors`;
  - an overlap is checked **before** the same-postal-area buffer waiver, and is no longer reported as `travel_conflict_exceeded`.
- **`BookingDetailPanel.tsx` and `DispatchBoard.tsx`:** when `blockingErrors` is non-empty, the assignment is **not saved**, the override dialog is **not offered**, and a plain-language alert says who is already booked and when ("pick someone else or change a job's time"). Earnings, travel and blocked-window warnings still go to the override dialog as before.
- **Strings:** `admin.override.overlapBlocked` in EN and FR.

## Tests
- `src/lib/utils/scheduling.test.ts` (new), 5 tests:
  - overlap is blocking, with no travel override type;
  - overlap is blocking even within the same postal area;
  - a short travel gap stays an overridable warning;
  - the job being reassigned doesn't count against itself;
  - `shiftsOverlap` allows back-to-back shifts.
- Customer: 114/114 passing, lint 0 errors, build OK.

## Known limit
This check runs in the admin browser. A server-side check for office assignments comes with W0-6 (`applyScheduleChange`), as in the gap analysis.

## Visual
Desktop is unchanged unless the alert shows. The alert uses the existing red error style and a 48px dismiss button.
