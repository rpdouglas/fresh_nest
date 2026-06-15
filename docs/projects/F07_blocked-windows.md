# F07 — Blocked Windows (P9 Mike)
**Epic:** F07 | **Phase:** Phase 3 (Staff Foundation / Job Lifecycle) | **Date:** June 15, 2026  
**Primary Personas:** Mike (P9 - Recovery Commitment), Sarah (P12 - Admin)  
**Dependencies:** F02 (Staff Profile & Settings)

---

## 1. Context & User Stories

### A. Staff Persona
*   **Mike (P9 - Recovery Commitment Worker):** As a cleaner in recovery, I need the system to respect my recurring support group meetings so that I am never put in a position where I have to choose between my livelihood and my recovery program.
*   When viewing the Shift Board, any shift whose time window overlaps with any of my blocked windows (recurring weekly or one-time dates) must be **completely hidden** from my view. It should not appear as greyed-out or unavailable — it must be absent.
*   If I attempt to claim a shift using a direct action, the backend must transactionally verify and reject the claim if it overlaps with my blocked windows to guarantee my commitments are protected.

### B. Admin Persona
*   **Sarah (P12 - Operations Manager):** As the operations manager, I want to be warned when I attempt to manually assign a cleaner to a shift that overlaps with their blocked windows, with the ability to override the warning by providing a reason that is permanently recorded in the audit log.
*   **Privacy Constraint:** To respect the cleaner's privacy, the blocked window label (e.g. "Recovery meeting" or "Therapy appointment") must never be exposed to other staff, clients, or in the general admin warning message shown to Sarah.

---

## 2. Technical Architecture & Database Schema

This epic builds upon the constraints schema in `/staff` and the `/auditLog` collection.

### A. Blocked Window Data Schema (`Staff.constraints.blockedWindows`)
Defined in `apps/fsm/src/types/index.ts`:
```typescript
export interface BlockedWindow {
  id: string
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0 = Sunday
  startTime: string  // 'HH:MM'
  endTime: string    // 'HH:MM'
  recurring: boolean
  date?: string      // ISO date 'YYYY-MM-DD' — for one-time blocks only
  label: string      // staff-private label (e.g. 'Recovery meeting')
}
```

### B. Overlap Detection Logic
For a candidate shift date `scheduledDate` (YYYY-MM-DD), start time `scheduledStartTime` ('HH:MM'), end time `scheduledEndTime` ('HH:MM'), and a cleaner's blocked window `W`:
1.  **Day/Date Match check:**
    *   Find the day of the week of `scheduledDate` using `new Date(scheduledDate + 'T00:00:00').getDay()`.
    *   If `W.recurring === true`: Day matches if `W.dayOfWeek === shiftDayOfWeek`.
    *   If `W.recurring === false`: Day matches if `W.date === scheduledDate`.
2.  **Time Overlap check:**
    *   Convert time strings to minutes from midnight (e.g., `18:30` -> `1110`).
    *   Let `startS = timeToMinutes(scheduledStartTime)` and `endS = timeToMinutes(scheduledEndTime)`.
    *   Let `startW = timeToMinutes(W.startTime)` and `endW = timeToMinutes(W.endTime)`.
    *   Overlap occurs if and only if: `startS < endW && endS > startW`.

---

## 3. Implementation Steps

### Step 1: Add translation keys (EN/FR)
*   **FSM locales (`apps/fsm/src/i18n/locales/`):**
    *   No changes to FSM Shift Board UI are needed other than filtering shifts.
*   **Admin locales (`apps/customer/src/i18n/locales/`):**
    *   `admin.override.blockedWindowWarning`: `"{{name}} has a blocked window that overlaps with this shift"` (EN) / `"{{name}} a un créneau bloqué qui chevauche ce quart"` (FR)

### Step 2: Implement Client-side Shift Board Visibility Filter (FSM App)
*   **Modify `apps/fsm/src/pages/ShiftBoardPage.tsx`:**
    *   Extract the blocked windows of `staffProfile.constraints.blockedWindows`.
    *   Filter the `shifts` array retrieved from `useShifts` before rendering.
    *   If a shift overlaps with any blocked window of the staff profile, remove it completely from the rendered list.

### Step 3: Implement Backend Validation in `claimJob` Cloud Function
*   **Modify `functions/src/jobs.ts` / `executeClaimJob`:**
    *   Retrieve the claiming cleaner's `constraints.blockedWindows` array.
    *   For each blocked window, run the overlap checking engine.
    *   If any overlap is detected, throw a `BLOCKED_WINDOW_OVERLAP` error.
*   **Modify `functions/src/index.ts`:**
    *   In the `claimJob` wrapper, intercept `BLOCKED_WINDOW_OVERLAP` and throw an `HttpsError('failed-precondition', ...)` to the client.

### Step 4: Admin UI Assignment Warning & Override Intercept (Customer App)
*   **Modify `apps/customer/src/components/admin/BookingDetailPanel.tsx`:**
    *   When selecting a cleaner, evaluate their `constraints.blockedWindows` against the shift's details.
    *   If an overlap is detected:
        *   Push a generic warning: `"This shift overlaps with a blocked window for this staff member."` (translated via `admin.override.blockedWindowWarning`).
        *   Push `'blocked_window_overlap'` to the `overrideTypes` array.
        *   Open the `OverrideModal` to require an override reason.
*   **Update `apps/customer/src/lib/firebase/firestore.ts` (`assignCleanerTransaction`):**
    *   Already logs overrides using `overrideType` and `overrideReason` to the `/auditLog` collection. No additional database changes required.

---

## 4. Persona Acceptance Tests

*   **P9 Mike (Recovery Commitment - Shift Board Filter):**
    *   Mike has a recurring blocked window on Tuesday (`dayOfWeek = 2`) from 19:00 to 20:30 (labeled "Support Group").
    *   He logs into the FSM portal and views available shifts.
    *   A Tuesday shift from 18:30 to 20:00 (which overlaps with his meeting) is **not visible** on the page.
    *   A Tuesday shift from 16:00 to 18:00 (which does not overlap) is **visible**.
*   **P12 Sarah (Admin Override):**
    *   Sarah attempts to manually assign Mike to the Tuesday 18:30–20:00 shift.
    *   The Booking Detail Panel flags a conflict: "Mike has a blocked window that overlaps with this shift" (private label is hidden).
    *   Sarah is prompted with the override modal. She enters "Mike agreed to attend morning meeting instead", and clicks Override.
    *   The shift is assigned, and `/auditLog` records the override under type `blocked_window_overlap`.
