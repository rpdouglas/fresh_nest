# F07 Planning — Blocked Windows (P9 Mike)
**Epic:** F07 | **Phase:** Phase 3 (Staff Foundation / Job Lifecycle) | **Date:** June 15, 2026  
**Primary Personas:** Mike (P9 - Recovery Commitment), Sarah (P12 - Admin)  
**Dependencies:** F02 (Staff Profile & Settings)

---

## 1. Persona Analysis & Acceptance Gate

This epic implements the business logic, UI filters, and security constraints that protect employee recovery commitments and personal unavailable blocks.

*   **Mike (P9):** Needs complete peace of mind that shifts conflicting with his support group meetings will never be shown to him.
    *   **Shift Board UI:** Any available shift that overlaps with his recurring or one-time blocked windows must be completely hidden.
    *   **Secure Claiming:** Direct API calls or emulator calls to claim an overlapping shift must be rejected by the backend.
*   **Sarah (P12):** Needs a warning when she manually schedules a cleaner during a blocked window.
    *   **Manual Assignment:** Intercept the selection of a cleaner in the Admin Booking detail panel if there is an overlap.
    *   **Privacy Guard:** Sarah sees a generic warning: "This shift overlaps with a blocked window for this staff member." She does NOT see the label of the blocked window (e.g. "Recovery meeting").
    *   **Audit Logging:** Sarah must input a mandatory reason to override, which is logged to `/auditLog` under `overrideType: 'blocked_window_overlap'`.

---

## 2. 3-Strategy Plan

### Strategy 1: Full-safety integration (Recommended)
Implements client-side available shift filtering, backend transaction verification in Cloud Functions, and Admin Panel warning overrides with private label sanitization.

*   **Files Changed:**
    *   `apps/fsm/src/pages/ShiftBoardPage.tsx` (Add client-side filtering for blocked windows).
    *   `functions/src/jobs.ts` (Add blocked windows overlap validation in `executeClaimJob`).
    *   `functions/src/index.ts` (Map `BLOCKED_WINDOW_OVERLAP` error to `failed-precondition` HttpsError).
    *   `apps/customer/src/components/admin/BookingDetailPanel.tsx` (Add blocked window check on selected cleaner, trigger override warnings).
    *   Translation sheets (`apps/customer/src/i18n/locales/en.json` and `fr.json`).
*   **Persona Impact:**
    *   *Mike:* Complete protection of recovery commitments from the Shift Board UI and the claim API.
    *   *Sarah:* Clear warning interface and compliant, audited override procedures.
*   **Risks & Mitigation:**
    *   *Risk:* Timezone offsets causing incorrect day-of-week parsing (e.g. `2026-06-16` parsed in UTC vs local time).
    *   *Mitigation:* Always parse ISO dates with `T00:00:00` (e.g. `new Date(scheduledDate + 'T00:00:00')`) so that `.getDay()` evaluates in the local timezone consistently.
*   **Schema Audit:**
    *   Complies with `Staff.constraints.blockedWindows` and `/auditLog` collections.

---

### Strategy 2: Client-side Hiding & Admin Warning Only (No backend check)
Filters available shifts on the client-side Shift Board UI and shows warning modals in the Admin Panel, but bypasses backend validation in the `claimJob` Cloud Function.

*   **Files Changed:**
    *   `apps/fsm/src/pages/ShiftBoardPage.tsx`
    *   `apps/customer/src/components/admin/BookingDetailPanel.tsx`
    *   Translation sheets.
*   **Persona Impact:**
    *   Mike sees a filtered list, but has no backend guarantee if the client-side app has a synchronization lag or is bypassed.
*   **Risks:**
    *   Security vulnerability: A tech-savvy cleaner or client-side script manipulation can claim shifts during blocked windows, violating Mike's recovery requirements.
*   **Schema Audit:** Same schema, but compromises transactional enforcement.

---

### Strategy 3: Blocked Window Overrides without Audit Trail
Implements blocked window validation in the UI and backend, but allows Sarah to manually assign conflicting shifts without requiring an override explanation or writing to `/auditLog`.

*   **Files Changed:**
    *   `apps/fsm/src/pages/ShiftBoardPage.tsx`
    *   `functions/src/jobs.ts`
    *   `functions/src/index.ts`
    *   `apps/customer/src/components/admin/BookingDetailPanel.tsx`
*   **Persona Impact:**
    *   Lacks business transparency. Sarah has no accountability logs for violating cleaner availability.
*   **Risks:**
    *   Increased business liability and employee frustration due to silent overrides.
*   **Schema Audit:** Does not write to `/auditLog` for blocked window overrides.

---

## 3. Recommended Choice & Rationale

**Strategy 1 (Full-safety integration)** is recommended.
It provides complete transactional protection of Mike's recovery commitments while ensuring Sarah has standard, audited override workflows. It maintains employee privacy by never leaking blocked window labels to admins or other staff.

---

## 4. Implementation Checklist & Verification Gate

1.  [ ] **i18n Keys:** Add translation labels in `apps/customer/src/i18n/locales/en.json` and `fr.json` under `admin.override.blockedWindowWarning`.
2.  [ ] **Client-side Filtering:** In `apps/fsm/src/pages/ShiftBoardPage.tsx`, retrieve cleaner blocked windows and filter out any available shifts that overlap.
3.  [ ] **Backend Validation:** In `functions/src/jobs.ts` (`executeClaimJob`), query staff's blocked windows and reject claiming with `BLOCKED_WINDOW_OVERLAP` if there is a conflict.
4.  [ ] **Cloud Function Error Mapping:** In `functions/src/index.ts` (`claimJob`), catch `BLOCKED_WINDOW_OVERLAP` and throw a `failed-precondition` HttpsError with a clear translation message.
5.  [ ] **Admin Warning Intercept:** In `apps/customer/src/components/admin/BookingDetailPanel.tsx`, check the selected cleaner's blocked windows against candidate shift times. If overlapping, show the warning and open `OverrideModal` with override type `blocked_window_overlap`.
6.  [ ] **Verification & Build Check:** Run `npm run build` in FSM and Customer apps to ensure zero TypeScript errors. Run unit tests verifying shift filtering.
