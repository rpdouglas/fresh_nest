# F06 — Travel Buffer (P8 Jasmine)
**Epic:** F06 | **Phase:** Phase 3 (Staff Foundation / Job Lifecycle) | **Date:** June 15, 2026  
**Primary Personas:** Jasmine (P8 - Travel Buffers), Sarah (P12 - Admin)  
**Dependencies:** F02 (Staff Profile & Settings)

---

## 1. Context & User Stories

### A. Staff Persona
*   **Jasmine (P8 - Transit Commuter):** As a transit-riding cleaner, I want the system to block me from claiming shifts that are geographically or timing-wise impossible to reach using Cornwall Transit, so that I am never set up to fail or be late.
*   When viewing the Shift Board, any shift that conflicts with my existing confirmed schedule (taking into account my transport mode's travel buffer) should show a clear "Travel conflict" label with explanation, and the Claim button should be disabled.
*   If two jobs are in the same postal code prefix (FSA, e.g. both in `K6H`), the travel buffer is waived since they are clustered in the same area.

### B. Admin Persona
*   **Sarah (P12 - Owner):** As the business owner, I want to be warned if I manually assign a cleaner to a job that conflicts with their existing schedule's travel buffers, with the ability to override the conflict by providing a reason that is recorded in the audit log.

---

## 2. Technical Architecture & Database Schema

This epic builds upon the constraints and financials schema in `/staff` and `/jobs`.

### A. Core Constants & Heuristics
1.  **Transport Modes & Default Buffers:**
    *   `transit`: Default buffer `60` minutes
    *   `personal_vehicle`: Default buffer `30` minutes
    *   `rideshare`: Default buffer `30` minutes
    *   `walk`: Default buffer `30` minutes
2.  **Postal Prefix (FSA) Extraction:**
    *   Use a regular expression to extract the first 3 characters of the Canadian postal code (e.g. `K6H`, `H0M`) from the street address.
    *   If both addresses have valid FSA prefixes and they match, the travel buffer is waived (`buffer = 0`).
    *   If either address lacks a valid postal prefix, the default buffer is enforced.
3.  **Conflict Checking Logic:**
    For a candidate shift `C` and an assigned shift `A` on the same day:
    *   **Direct Overlap:** If `startC < endA` and `endC > startA`, they overlap directly (conflict).
    *   **Buffer Overage:**
        *   If `C` is before `A` (`endC <= startA`): Gap is `startA - endC`. If `gap < buffer`, and their postal prefixes differ, then conflict.
        *   If `C` is after `A` (`endA <= startC`): Gap is `startC - endA`. If `gap < buffer`, and their postal prefixes differ, then conflict.

---

## 3. Implementation Steps

### Step 1: Backend Validation (Cloud Functions)
*   **Modify `functions/src/jobs.ts` / `executeClaimJob`:**
    *   Fetch claiming staff's `constraints` (transportMode and transitBufferMinutes). If not present, default to `transit` and `60` minutes, or `30` minutes for vehicle/rideshare/walk.
    *   Query `/jobs` where `assignedTo == staffId` and `scheduledDate == jobDate` and `status != 'cancelled'`.
    *   Run the conflict checking engine.
    *   If conflict is found, throw `TRAVEL_BUFFER_EXCEEDED` error.
*   **Update `functions/src/index.ts`:**
    *   Ensure any travel buffer errors thrown from `executeClaimJob` are formatted correctly for the FSM client.

### Step 2: Client-side Conflict Detection & Shift Board UI (FSM App)
*   **Create `apps/fsm/src/hooks/useMyAssignedShifts.ts`:**
    *   Fetch active assigned shifts for the logged-in user: query `jobs` collection where `assignedTo == uid` and status is not `cancelled` or `unassigned`.
*   **Modify `apps/fsm/src/pages/ShiftBoardPage.tsx`:**
    *   Read transport mode and travel buffer minutes from `staffProfile`.
    *   Utilize `useMyAssignedShifts` to retrieve the user's scheduled jobs.
    *   For each unassigned shift on the board:
        *   Find assigned jobs on the same `scheduledDate`.
        *   Check for overlap or buffer conflicts using the extraction heuristic.
        *   If conflict is detected, render a warning: `"⚠️ Travel conflict: Needs [buffer]m buffer with shift [startTime]-[endTime]"` and disable the "Claim" button.

### Step 3: Admin UI Assignment Overrides (Customer App)
*   **Modify `apps/customer/src/components/admin/BookingDetailPanel.tsx`:**
    *   When selecting a cleaner to assign:
        *   Query the cleaner's assigned jobs on that booking's `preferredDate`.
        *   Check for travel conflicts.
        *   If travel conflict is detected (or both earnings cap and travel buffer are exceeded):
            *   Populate `pendingAssignment` with details of the conflicts.
            *   Open `OverrideModal`, displaying the travel conflict warning (e.g. `"Travel conflict: Needs [buffer]m buffer between assigned shift ([startTime]-[endTime]) and this booking"`).
*   **Modify `apps/customer/src/components/admin/OverrideModal.tsx`:**
    *   Display travel conflict messages alongside earnings cap warning.
*   **Update `apps/customer/src/lib/firebase/firestore.ts` (`assignCleanerTransaction`):**
    *   If override reason and type (`travel_conflict_exceeded`) are passed, write a log entry to `/auditLog` collection.

---

## 4. Persona Acceptance Tests

*   **P8 Jasmine (Transit Commuter Shift Board View):**
    *   Jasmine has `transportMode = 'transit'` and `transitBufferMinutes = 60`.
    *   She is already assigned to a shift from 10:00 AM to 12:00 PM at Address A (`123 Pitt St, Cornwall, ON K6J 3P3`).
    *   She views available shifts on the Shift Board.
    *   **Test Case 1 (Buffer Enforced):** Shift B starts at 12:30 PM at Address B (`456 Water St, Cornwall, ON K6H 2T2`). Shows "Travel conflict: Needs 60m buffer after shift 10:00-12:00" and Claim button is disabled.
    *   **Test Case 2 (Buffer Met):** Shift C starts at 1:15 PM at Address B. Claim button is enabled.
    *   **Test Case 3 (Waived for Clustered postal code):** Shift D starts at 12:30 PM at Address C (`789 Fourth St, Cornwall, ON K6J 1E1` - same FSA prefix `K6J` as Address A). Claim button is enabled.

*   **P12 Sarah (Admin Override):**
    *   Sarah tries to assign Jasmine to Shift B (12:30 PM, Address B).
    *   A modal warns her about the travel conflict and requires a reason.
    *   Sarah types "Clustered transit route is feasible" and clicks Override.
    *   The shift is assigned, and `/auditLog` records the override with type `travel_conflict_exceeded`.
