# F02 Planning — Staff Profile & Settings
**Epic:** F02 | **Phase:** Phase 2 (Staff Foundation) | **Date:** June 13, 2026  
**Primary Personas:** Carla (P7 - ODSP Cap), Jasmine (P8 - Transit Buffers), Mike (P9 - Blocked Windows), Sarah (P12 - Admin)

---

## 1. Persona Analysis & Acceptance Gate

This epic establishes the profiles and schedule constraints that protect staff members during active scheduling.

*   **Carla (P7):** Needs to prevent ODSP clawbacks. The profile page must provide an input for her `monthlyEarningsLimit` and present a visual "Safe to Earn" indicator mapping current earnings against the limit.
*   **Jasmine (P8):** Needs reasonable commute windows. The profile page must capture her `transportMode` and `transitBufferMinutes` configuration.
*   **Mike (P9):** Needs to preserve personal/recovery commitments. The profile page must allow him to manage a list of recurring `blockedWindows` (day of week, start/end time) which will be used in future epics to hide overlapping shifts.
*   **Sarah (P12):** Needs to register staff securely. The customer admin dashboard must include a "Staff" tab to list staff and enroll new members with role, phone, and status fields.

---

## 2. 3-Strategy Plan

### Strategy 1: Consolidated Admin Tab & Visual FSM Profile Dashboard (Recommended)
Consolidates the administrative view as a new tab within the existing Customer App Admin Panel, leveraging Google OAuth. The FSM Profile page is structured as a single-page visual dashboard with modern forms, a blocked window manager list, and a colored SVG gauge for Carla's ODSP limits.

*   **Files Changed/Created:**
    *   `apps/customer/src/pages/AdminPage.tsx` (Add Staff tab & state)
    *   `apps/customer/src/components/admin/StaffTable.tsx` (Create table rendering `/staff` registry)
    *   `apps/customer/src/components/admin/RegisterStaffModal.tsx` (Create registration form modal)
    *   `apps/customer/src/i18n/locales/en.json` & `fr.json` (Add admin staff labels)
    *   `apps/fsm/src/pages/ProfilePage.tsx` (Create profile dashboard page)
    *   `apps/fsm/src/pages/ProfilePage.test.tsx` (Add unit tests for profile UI)
    *   `apps/fsm/src/App.tsx` (Wire route guard and link Profile in nav)
    *   `apps/fsm/src/i18n/locales/en.json` & `fr.json` (Add profile i18n keys)
*   **Persona Impact:**
    *   *Sarah (P12):* Seamlessly registers staff in her consolidated admin site.
    *   *Carla (P7):* Clear, color-coded visual indicator prevents benefit overages.
    *   *Jasmine (P8) & Mike (P9):* Easy inputs to safeguard transport and meeting slots.
*   **Risks & Mitigation:**
    *   *Risk:* Direct updates to the `constraints` map might overwrite other sub-fields if not merged carefully.
    *   *Mitigation:* Use transactional update operations or standard `updateDoc(docRef, { "constraints.blockedWindows": newWindows })` dot-notation paths to update sub-fields safely.
*   **Schema Audit:**
    *   Completely complies with `/staff` collection fields (`firstName`, `lastName`, `email`, `phone`, `role`, `status`, `preferences`, `constraints`, `financials`, `compliance`, `onboardingChecklist`).

---

### Strategy 2: Duplicate Admin controls in FSM App
Avoids touching the Customer App codebase by building both the Admin Staff registration/enrollment UI and the Cleaner profile dashboard directly inside the FSM App.

*   **Files Changed/Created:**
    *   `apps/fsm/src/pages/AdminStaffPage.tsx` (New page for staff listing)
    *   `apps/fsm/src/pages/ProfilePage.tsx` (Profile dashboard)
*   **Persona Impact:** Registers cleaners in FSM, but requires administrators (Sarah) to log in to two different apps with two different auth flows (Google OAuth vs Email/Password) which violates the unified admin consolidation rule.
*   **Risks & Mitigation:**
    *   *Risk:* Security boundary leakage. Cleaner UI and Admin UI elements mixed in the same client bundle.
*   **Schema Audit:** Aligned with `/staff`.

---

### Strategy 3: Cloud Function-based Constraint updates and Simple Text Windows
Instead of modifying complex arrays/maps directly, this strategy uses Cloud Functions to validate and set constraints. The blocked windows are represented as simple text lists rather than structured weekly objects.

*   **Files Changed/Created:**
    *   `functions/src/staff.ts` (Cloud Functions for updating constraints)
    *   `apps/fsm/src/pages/ProfilePage.tsx` (Simplified profile)
*   **Persona Impact:** High latency and visual latency when saving profile modifications. Mike cannot accurately filter schedule overlaps if the blocked windows are stored as text comments rather than structured calendar objects.
*   **Risks & Mitigation:**
    *   *Risk:* Network overhead and increased Firebase Function invocation charges.
*   **Schema Audit:** Deviates from the structured `BlockedWindow[]` array specified in `firestore-schema.md`.

---

## 3. Recommended Choice & Rationale

**Strategy 1** is recommended.
It perfectly honors the **Admin UI Consolidation** decision (keeping all administration in the Customer App under secure Google OAuth) and implements a fully offline-capable visual dashboard in the FSM portal. Storing the weekly blocked windows as a structured array (`BlockedWindow[]`) allows future scheduling algorithms to perform precise datetime overlap calculations.

---

## 4. Implementation Checklist & Verification Gate

1.  [ ] Add i18n translation keys in `apps/customer/src/i18n/locales/` for staff list and registration modal.
2.  [ ] Add i18n translation keys in `apps/fsm/src/i18n/locales/` for profile constraints and ODSP visuals.
3.  [ ] Create `apps/customer/src/components/admin/StaffTable.tsx` for staff lists.
4.  [ ] Create `apps/customer/src/components/admin/RegisterStaffModal.tsx` for staff creation.
5.  [ ] Add "Staff" tab to `apps/customer/src/pages/AdminPage.tsx` and integrate the table and modal.
6.  [ ] Create `apps/fsm/src/pages/ProfilePage.tsx` containing transport buffer controls, blocked windows manager, and the ODSP meter.
7.  [ ] Mount ProfilePage in `apps/fsm/src/App.tsx` and link it in the navbar.
8.  [ ] Implement unit tests in `apps/fsm/src/pages/ProfilePage.test.tsx` verifying visual components and save mutations.
9.  [ ] Audit styles and Tailwind class configurations using `Brand_Auditor`.
10. [ ] Audit Firestore queries using `Data_Steward`.
11. [ ] Audit translation hooks using `Linguistic_Auditor`.
12. [ ] Run `npm run build` to verify clean compilation.
13. [ ] Run `npm run lint` and all unit test suites.
