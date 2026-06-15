# F05 Planning — Earnings Cap (P7 Carla)
**Epic:** F05 | **Phase:** Phase 3 (Staff Foundation / Job Lifecycle) | **Date:** June 15, 2026  
**Primary Personas:** Carla (P7 - ODSP Cap), Sarah (P12 - Admin)  
**Dependencies:** F02 (Staff Profile & Settings)

---

## 1. Persona Analysis & Acceptance Gate

This epic implements the business logic, security constraints, and UI notifications that enforce the Ontario Disability Support Program (ODSP) monthly earnings cap for staff members.

*   **Carla (P7):** Needs absolute certainty that working a shift won't exceed her monthly earnings limit.
    *   **Shift Board UI:** Unassigned shifts must show their estimated pay. If claiming a shift would exceed her remaining cap, the claim button must be disabled, showing a message with the exact overage amount (e.g. "Exceeds monthly limit by $25").
    *   **Dashboard/Shift View:** Carla must see her "Safe to Earn" gauge showing her updated monthly earnings total.
*   **Sarah (P12):** Needs the ability to override the cap in exceptional circumstances.
    *   **Manual Assignment:** When manually assigning a job to an over-limit cleaner in the Admin Panel, Sarah must be prompted with an override modal requiring a mandatory reason.
    *   **Audit Trail:** Every override must write an entry to `/auditLog` with the change history and the admin's explanation.

### Acceptance Criteria (P7 Carla & P12 Sarah)
1. Carla's profile has `monthlyEarningsLimit = $800` and `currentMonthEarnings = $750`.
2. On her Shift Board, a shift worth $75 is disabled with a message explaining she would be $25 over her limit.
3. A shift worth $45 is active.
4. Tapping "Claim" on the $45 shift updates her `currentMonthEarnings` to $795 and changes her "Safe to Earn" gauge to red.
5. In the Admin Panel, if Sarah assigns Carla a shift that pushes her over the limit, a modal forces Sarah to type a reason, writing to `/auditLog` upon completion.
6. A scheduled function runs at 12:00 AM on the 1st of every month to reset all staff members' `currentMonthEarnings` to `0` and archive the past month's earnings.

---

## 2. 3-Strategy Plan

### Strategy 1: Vertical Slice with Transactional `claimJob` and Granular Rules (Recommended)
Implements F05 as an end-to-end vertical slice, scaffolding the FSM `/shifts` page, creating the backend `claimJob` function, refining Firestore rules for self-updates, and building the Admin Panel override intercept.

*   **Files Changed/Created:**
    *   `firestore.rules` & `firestore.dev.rules` (Refine `/staff/{uid}` rules to allow staff self-updates for constraints, preferences, and monthly limits only, blocking self-updates to earnings fields).
    *   `functions/src/index.ts` (Export `claimJob` Cloud Function and `onMonthlyEarningsRollover` scheduled trigger).
    *   `functions/src/jobs.ts` (Implement transactional claiming checks, pay calculations, and staff earnings increments).
    *   `apps/fsm/src/pages/ShiftBoardPage.tsx` (Scaffold available shifts board with inline earnings limit checks and detailed overage explanations).
    *   `apps/fsm/src/App.tsx` (Mount ShiftBoardPage at `/shifts`).
    *   `apps/customer/src/components/admin/OverrideModal.tsx` (Prompt Sarah for override reasons).
    *   `apps/customer/src/components/admin/BookingDetailPanel.tsx` (Intercept over-limit assignments and show OverrideModal).
    *   `apps/customer/src/lib/firebase/firestore.ts` (Create admin override assignment method).
    *   Translation sheets (`apps/fsm/src/i18n/locales/en.json`, `/fr.json`, `apps/customer/src/i18n/locales/en.json`, `/fr.json`).
*   **Persona Impact:**
    *   *Carla:* Immediate feedback on shift claiming safety, clear reason for disabled actions.
    *   *Sarah:* Secure overrides and compliant logging without slowing down operations.
*   **Risks & Mitigation:**
    *   *Risk:* Concurrent claiming race conditions.
    *   *Mitigation:* Use Firestore transaction in `claimJob` to lock the job document and verify it remains `unassigned` before claiming.
*   **Schema Audit:**
    *   Complies with `/staff` financials schema (`monthlyEarningsLimit`, `currentMonthEarnings`, `earningsHistory`).
    *   Complies with `/auditLog` schema.

---

### Strategy 2: Client-side Validation and Direct Writes
Allows the FSM client to perform direct updates to `/jobs` and `/staff` documents upon claiming a shift, bypassing the Cloud Function entirely.

*   **Files Changed/Created:**
    *   `apps/fsm/src/pages/ShiftBoardPage.tsx` (Contains all transaction logic).
    *   `firestore.rules` (Loosened to allow staff members write access to jobs' `assignedTo` and staff's `currentMonthEarnings`).
*   **Persona Impact:** Shorter response times on button taps.
*   **Risks:**
    *   *Critical Security Risk:* Staff members can modify their own earnings totals, spoof other users, or claim shifts they are blocked from. Violates security compliance.
*   **Schema Audit:** Uses same schema fields, but compromises access boundaries.

---

### Strategy 3: Backend-only logic (Defer FSM UI to F08)
Builds only the Cloud Functions (`claimJob` and monthly rollover) and tests them via emulator/scripts. Defers the FSM Shift Board UI and Admin Panel override modal to epic F08.

*   **Files Changed/Created:**
    *   `functions/src/index.ts` & `functions/src/jobs.ts` (Cloud Functions).
*   **Persona Impact:**
    *   Carla cannot claim shifts or see disabled states.
    *   Sarah cannot assign cleaners with constraints validation.
*   **Risks:**
    *   Lack of visual verification and higher integration risk during F08.

---

## 3. Recommended Choice & Rationale

**Strategy 1** is recommended.
It implements a secure vertical slice that is immediately testable and provides high value to both Carla (P7) and Sarah (P12). By refining the Firestore rules now, we ensure the codebase remains locked down against security risks while allowing staff self-updates.

---

## 4. Implementation Checklist & Verification Gate

1.  [ ] **Refine Firestore Rules:** Update `firestore.rules` and `firestore.dev.rules` to allow staff self-updates only on `constraints`, `preferences`, and `financials.monthlyEarningsLimit`.
2.  [ ] **Monthly Rollover Trigger:** Add `onMonthlyEarningsRollover` scheduled Cloud Function (runs on 1st of month at 12:00 AM UTC) to reset `currentMonthEarnings` and archive to `earningsHistory`.
3.  [ ] **Transactional `claimJob` Function:** Create callable Cloud Function `claimJob(jobId)` that calculates shift pay, checks cap, increments staff earnings, and updates job status to `assigned` transactionally.
4.  [ ] **Shift Board Page:** Build `ShiftBoardPage.tsx` with list of unassigned jobs. Render estimated pay and check Carla's cap. If limit is exceeded, disable Claim action and print overage (e.g. `+$25 over limit`).
5.  [ ] **Admin Override UI:** Add override check inside `BookingDetailPanel.tsx`. If chosen cleaner exceeds cap, display `OverrideModal.tsx` asking Sarah for a reason, then execute override assignment and write `/auditLog`.
6.  [ ] **i18n Keys:** Add translation labels for FSM portal (over limit messages, shifts titles) and Admin panel (override reason placeholder, modal labels).
7.  [ ] **Unit Tests:** Add tests verifying client-side cap validation and Cloud Function triggers.
8.  [ ] Run `npm run build && npm run lint` to verify compilation.
