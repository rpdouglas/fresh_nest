# F08 Planning — Shift Board & claimJob
**Epic:** F08 | **Phase:** Phase 3 (Job Lifecycle & Pipeline) | **Date:** June 15, 2026  
**Primary Personas:** Jasmine (P8 - Travel commuter buffer), Carla (P7 - ODSP Cap claimed tracking), Mike (P9 - Blocked windows check), Sarah (P12 - Compliance / Admin)

---

## 1. Persona Analysis & Acceptance Gate

F08 ensures staff members can access a consolidated "My Jobs" section to view their confirmed work schedule and history, while the underlying infrastructure is cleaned up by moving shared Firebase hooks/initializers to `@freshnest/shared`.

- **Jasmine (P8):** Needs to see a clear chronological list of her upcoming assigned shifts (Assigned, Acknowledged, In Progress) so she can plan Cornwall Transit routes and verify travel buffers.
- **Carla (P7):** Needs to track her claimed shifts in the current month to ensure she doesn't exceed her monthly earnings cap. Seeing her past completed shifts helps verify her monthly earnings total.
- **Mike (P9):** Needs an easy way to verify that his assigned upcoming shifts do not overlap with any recovery commitments.
- **Sarah (P12):** Needs job records to remain secure and correctly display status updates (e.g. Assigned, Completed). Refactoring Firebase into a shared package reduces maintenance drift.

---

## 2. Decisions Captured

| Decision | Choice |
| :--- | :--- |
| **Primary Scope** | Full F08 Completion: Add My Jobs page, refactor shared package, add translations. |
| **Language Support** | Initial release limited to English and French; other languages (e.g. Arabic) deferred to future releases. |
| **Shared Firebase Design** | Expose initialization helpers (`getSharedFirebaseApp` / `getSharedAuth`) from `@freshnest/shared`. Pass env vars dynamically from apps and initialize Firestore locally to preserve FSM-specific offline cache. |
| **My Jobs UI Layout** | Separate tabs/sections: "Upcoming Jobs" (Assigned, Acknowledged, In Progress) on top, and "Completed/Past Jobs" in a separate section. |
| **My Jobs Route** | Map `/jobs` in the FSM application to the new `MyJobsPage` component. |

---

## 3. 3-Strategy Plan

### Strategy 1: Shared Package Refactor + My Jobs Tabbed Page + Unit Tests (Recommended)

Move duplicate Firebase init utilities to `@freshnest/shared` as initialization helpers. Build `MyJobsPage` at `/jobs` with "Upcoming Jobs" vs "Completed/Past Jobs" tabs/sections, and integrate EN/FR translations. Add unit tests for `MyJobsPage` to ensure correct rendering.

**Files Created/Modified:**

*Shared Workspace Package:*
- `packages/shared/package.json` — export details
- `packages/shared/src/index.ts` — export Firebase initialization helpers and `cn()`
- `packages/shared/src/firebase.ts` — new: shared helper logic for Firebase app and auth initialization

*FSM App:*
- `apps/fsm/package.json` — add `@freshnest/shared` dependency
- `apps/fsm/src/lib/firebase/firebase.ts` — refactor to use shared helpers
- `apps/fsm/src/pages/MyJobsPage.tsx` — new: lists assigned jobs using `useMyAssignedShifts`, split by upcoming and completed status
- `apps/fsm/src/pages/MyJobsPage.test.tsx` — new: vitest suite for the page
- `apps/fsm/src/App.tsx` — route `/jobs` maps to `MyJobsPage`
- `apps/fsm/src/components/layout/FsmLayout.tsx` — update nav link highlight for `/jobs`
- `apps/fsm/src/i18n/locales/en.json` & `/fr.json` — add `fsm.myJobs.*` translations

*Customer App:*
- `apps/customer/package.json` — add `@freshnest/shared` dependency
- `apps/customer/src/lib/firebase/firebase.ts` — refactor to use shared helpers

**Persona Impact:**
- *Jasmine:* Chronological list of upcoming jobs allows travel verification.
- *Carla:* Clear tracking of upcoming vs completed jobs for earnings cap checks.
- *Sarah:* Codebase maintenance is simplified by removing duplicate Firebase code.

**Risks & Mitigation:**
- *Risk:* Shared package resolution fails at build/test time due to symlink or type resolution issues.
- *Mitigation:* Ensure workspace package is installed and symlinked, and `tsconfig.json` paths or standard `node_modules` lookup resolves correctly. Run `npm run build` to verify.

**Schema Audit:**
- Mapped to existing `/jobs` collection (reads status, assignedTo, scheduledDate, scheduledStartTime, scheduledEndTime, clientAddress, clientNotes, clientPhone).

---

### Strategy 2: My Jobs Page Only, Defer Shared Package

Do not touch `@freshnest/shared` or the Firebase configurations. Build `MyJobsPage.tsx` at `/jobs` and register it in the router.

- *Persona Impact:* Jasmine, Carla, and Mike get the UI schedule list. Sarah's maintenance drift risk remains.
- *Risks:* Duplicated code remains, violating the FSM monorepo clean-up guideline.

---

### Strategy 3: Tab in ShiftBoardPage (No Separate Page)

Do not create a separate page. Add a tab inside the existing `ShiftBoardPage.tsx` to toggle between "Available Shifts" and "My Schedule".

- *Persona Impact:* Schedule details crammed onto the shift board page. Poor mobile usability.
- *Risks:* Violates routing convention established in `App.tsx` where `/jobs` is mapped as a separate page.

---

## 4. Recommended Choice & Rationale

**Strategy 1** is recommended.
It resolves code duplication in a clean, robust way by keeping Firebase initialization logic DRY. It also delivers the dedicated `MyJobsPage` that staff members need to view their schedule, preparing the app for F09 (Job Execution & Checklist).

---

## 5. Implementation Checklist

### Shared Package
1.  Create `packages/shared/src/firebase.ts` with `getSharedFirebaseApp` and `getSharedAuth` helpers.
2.  Export helpers and `cn` in `packages/shared/src/index.ts`.
3.  Add `@freshnest/shared` dependency to `apps/customer/package.json` and `apps/fsm/package.json`.
4.  Run `npm install` from the root to establish workspace symlinks.

### Firebase Refactoring
5.  Refactor `apps/customer/src/lib/firebase/firebase.ts` to import initialization helpers from `@freshnest/shared`.
6.  Refactor `apps/fsm/src/lib/firebase/firebase.ts` to import initialization helpers from `@freshnest/shared`, preserving local `initializeFirestore` offline cache initialization.

### My Jobs UI
7.  Create `apps/fsm/src/pages/MyJobsPage.tsx`. Use `useMyAssignedShifts` hook.
8.  Split shifts into:
    - **Upcoming Jobs**: Status `'assigned'`, `'acknowledged'`, `'in_progress'`.
    - **Completed Jobs**: Status `'completed'`, `'disputed'`.
9.  Design a responsive layout using Tailwind brand colors, Marcellus headings, and DM Sans body typography. Interactive cards should have a minimum height of 48px.
10. Map `/jobs` route to `MyJobsPage` in `apps/fsm/src/App.tsx`.
11. Update translations for `fsm.myJobs.*` in `apps/fsm/src/i18n/locales/en.json` and `fr.json`.

### Testing & Verification
12. Create unit tests in `apps/fsm/src/pages/MyJobsPage.test.tsx` verifying empty states, tab switches, and correct rendering.
13. Verify all tests pass: `npm run test` in `apps/fsm`.
14. Verify full build succeeds: `npm run build` in the monorepo root.

---

## 6. Persona Acceptance Tests (Phase C Gate)

| Persona | Test | Pass Condition |
| :--- | :--- | :--- |
| **Jasmine (P8)** | Accesses `/jobs` tab in the portal | List displays upcoming assigned shifts sorted chronologically. Addresses and durations are clearly visible. |
| **Carla (P7)** | Views 'Completed Jobs' tab | Shows all past completed jobs, facilitating monthly earnings calculation. |
| **Dev Team** | Run customer and FSM builds | Both packages compile cleanly with no duplication of Firebase initialization. |
