# F06 Planning — Travel Buffer (P8 Jasmine)
**Epic:** F06 | **Phase:** Phase 3 (Staff Foundation / Job Lifecycle) | **Date:** June 15, 2026  
**Primary Personas:** Jasmine (P8 - Travel Buffers), Sarah (P12 - Admin)  
**Dependencies:** F02 (Staff Profile & Settings)

---

## 1. Persona Analysis & Acceptance Gate

This epic implements travel buffer checks that protect cleaners (specifically Jasmine) from being assigned or claiming geographically impossible back-to-back shifts.

*   **Jasmine (P8):** Commutes via transit, needs a realistic travel buffer between job locations.
    *   **Shift Board UI:** Available shifts must show if they conflict with her existing schedule. If claiming a shift violates her travel buffer (and they are not in the same postal code area), the card must display a `"Travel conflict: Needs [buffer]m buffer after shift [start]-[end]"` warning, and the claim button must be disabled.
    *   **Waived Buffer:** If the new shift is in the same postal code prefix (first 3 characters, e.g. `K6H`) as the prior shift, the buffer is waived.
*   **Sarah (P12):** Wants to ensure schedule feasibility but needs the ability to override a travel conflict when necessary.
    *   **Manual Assignment:** When manually assigning a job to a cleaner in the Admin Panel, Sarah must be warned if a travel buffer conflict exists. She can override it by entering a mandatory reason.
    *   **Audit Trail:** The override action writes to `/auditLog` with `overrideType: 'travel_conflict_exceeded'`.

### Acceptance Criteria (P8 Jasmine & P12 Sarah)
1. Jasmine's profile has `transportMode = 'transit'` and `transitBufferMinutes = 60`.
2. Jasmine is assigned to a shift from 10:00 AM to 12:00 PM at Address A (`123 Pitt St, Cornwall, ON K6J 3P3`).
3. She views the Shift Board for available shifts on the same day:
    *   Shift B at Address B (`456 Water St, Cornwall, ON K6H 2T2` - different postal prefix `K6H` vs `K6J`) from 12:30 PM to 2:30 PM is disabled with `"Travel conflict: Needs 60m buffer after shift 10:00-12:00"`.
    *   Shift C at Address B from 1:15 PM to 3:15 PM is active and claimable.
    *   Shift D at Address C (`789 Fourth St, Cornwall, ON K6J 1E1` - same postal prefix `K6J` as Address A) from 12:30 PM to 2:30 PM is active and claimable (buffer is waived).
4. In the Admin Panel, if Sarah assigns Jasmine to Shift B, she is prompted with the override modal, requiring a reason which is logged in `/auditLog`.
5. The `claimJob` Cloud Function rejects any attempt to claim Shift B without admin override, returning a `TRAVEL_BUFFER_EXCEEDED` error.

---

## 2. 3-Strategy Plan

### Strategy 1: Full-Stack Integrated Validation (Recommended)
Implement travel buffer validation on both the frontend (ShiftBoardPage and BookingDetailPanel) and the backend transaction level (`claimJob` Cloud Function).

*   **Files Changed/Created:**
    *   `functions/src/jobs.ts` (Add travel conflict checker helper and update `executeClaimJob` to query existing shifts for the day and validate).
    *   `apps/fsm/src/hooks/useMyAssignedShifts.ts` (Create hook to fetch active assigned shifts for the logged-in staff member).
    *   `apps/fsm/src/pages/ShiftBoardPage.tsx` (Incorporate travel buffer check logic, warning display, and disabled claim action).
    *   `apps/customer/src/components/admin/BookingDetailPanel.tsx` (Add conflict check before manual assignment, populate warnings, trigger override modal).
    *   `apps/customer/src/components/admin/OverrideModal.tsx` (Display travel conflict warning alongside earnings cap warning).
    *   `apps/customer/src/lib/firebase/firestore.ts` (Accept `overrideType: 'travel_conflict_exceeded'` and log in `/auditLog`).
    *   Translation sheets (`apps/fsm/src/i18n/locales/en.json`, `/fr.json`, `apps/customer/src/i18n/locales/en.json`, `/fr.json`).
*   **Persona Impact:**
    *   *Jasmine:* Complete schedule safety; clear and precise feedback on conflicts.
    *   *Sarah:* Full control with audit logging for compliance.
*   **Risks & Mitigation:**
    *   *Risk:* Address formatting inconsistency could break postal prefix extraction.
    *   *Mitigation:* Use case-insensitive regex pattern `([A-Z]\d[A-Z])` to find the Canadian FSA prefix. If no match is found, safely fall back to enforcing the buffer rather than waiving it.

---

### Strategy 2: Frontend-Only Validation
Implement validation check strictly in the React client apps (FSM and Customer App) using the local cache and query results. Do not update the Cloud Function.

*   **Files Changed/Created:**
    *   `apps/fsm/src/pages/ShiftBoardPage.tsx`, `apps/customer/src/components/admin/BookingDetailPanel.tsx`.
*   **Persona Impact:** High responsiveness, same visual feedback.
*   **Risks:**
    *   *Security Risk:* Bypassing frontend verification (e.g. concurrent claims, direct API triggers, custom scripts) would allow staff to claim conflicting shifts, defeating the hard constraint.

---

### Strategy 3: Backend-Only Validation (Defer UI to F08)
Build conflict checks inside the Cloud Function and return errors when claiming. Defer FSM UI warnings and Admin Panel modal prompts to F08.

*   **Files Changed/Created:**
    *   `functions/src/jobs.ts`.
*   **Persona Impact:**
    *   Jasmine sees all shifts as active, but gets an error dialog only after tapping "Claim". Very poor UX.
    *   Sarah cannot perform override assignments easily.

---

## 3. Recommended Choice & Rationale

**Strategy 1** is recommended.
It provides a robust, multi-layer check that is both secure (validated on backend transaction) and highly accessible (visual indicators on the Shift Board and Admin Panel). This strategy ensures compliance with P8 Jasmine's transit constraints and keeps Sarah's audit logging intact.

---

## 4. Implementation Checklist & Verification Gate

1.  [ ] **Helper: Postal Prefix FSA Extraction & Time Converter:**
    *   Create utility functions in a shared lib or files to convert time string `'HH:MM'` to minutes, and extract Canadian FSA (`[A-Za-z]\d[A-Za-z]`) from address.
2.  [ ] **Cloud Function Validation:**
    *   Update `executeClaimJob` in `functions/src/jobs.ts` to check candidate shift against the cleaner's other assigned shifts on that day.
    *   Ensure it throws `TRAVEL_BUFFER_EXCEEDED` if conflict exists.
3.  [ ] **FSM App - Assigned Shifts Hook:**
    *   Build `useMyAssignedShifts` hook querying `/jobs` with `assignedTo == uid` and `status != 'cancelled'`.
4.  [ ] **FSM App - Shift Board Integration:**
    *   In `ShiftBoardPage.tsx`, cross-reference each unassigned job against assigned shifts.
    *   Display `"Travel conflict: Needs [buffer]m buffer after shift [start]-[end]"` and disable Claim button.
5.  [ ] **Admin App - Booking Assignment Checks:**
    *   In `BookingDetailPanel.tsx`, fetch selected cleaner's assigned jobs on the booking date.
    *   Evaluate travel conflicts. If found, display in `OverrideModal` and require override reason.
6.  [ ] **Admin App - Audit Logging:**
    *   Ensure `assignCleanerTransaction` logs override with `overrideType: 'travel_conflict_exceeded'`.
7.  [ ] **Bilingual Keys:**
    *   Add translations for travel conflict warnings and overrides in English and French locales.
8.  [ ] **Unit Tests:**
    *   Add unit tests verifying postal prefix matching and conflict checking functions.
9.  [ ] Run `npm run build && npm run lint` to verify compilation.
