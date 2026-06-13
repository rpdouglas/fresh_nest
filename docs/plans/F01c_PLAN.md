# F01c Planning — FSM Staff Authentication & Login
**Epic:** F01c | **Phase:** Phase 1 (Infrastructure) | **Date:** June 13, 2026  
**Primary Personas:** Ahmed (P10 — ESL/Bilingual Staff), Margaret (P3 — Accessibility/UI size constraints), Sarah (P12 — Compliance/Audit)

---

## 1. Persona Analysis & Acceptance Gate

This epic implements secure authentication for the Field Service Management (FSM) portal, protecting routes and setting up login options (Password and Passwordless Magic Link) for approved staff.

- **Ahmed (ESL/Bilingual Staff / P10):** Following user feedback, the FSM portal is kept strictly bilingual (**English and French** only, removing Arabic). Ahmed's ESL/low-literacy requirements are served by implementing a strongly visual, **icon-first UI** for checklist items and onboarding steps. The login screen must be clean, simple, and support passwordless magic links to avoid password-entry friction on mobile.
- **Margaret (Accessibility / P3):** The login page UI must strictly respect accessibility constraints across all screens: minimum `16px` font size for all body copy and input labels, minimum `48px` height touch targets for inputs, buttons, and language toggles, and at least 4.5:1 color contrast compliance.
- **Sarah (Owner / P12):** Requires a secure authentication system. Access must be restricted only to emails present in the `/staff` collection. Sign-ins or magic link requests from unauthorized emails must be blocked immediately with a user-friendly "Access Denied" error to prevent system abuse.

---

## 2. 3-Strategy Plan

### Strategy 1: Strict Bilingual (EN/FR) Setup with FSM-Specific Vitest configuration (Recommended)
This strategy modifies the FSM portal to support English and French only (removing the Arabic translations and toggles) and configures a dedicated Vitest setup inside `apps/fsm` to run unit tests with mocked Firebase Auth and Firestore.

- **Files Changed:**
  - `apps/fsm/src/i18n/index.ts` (Remove Arabic import, RTL detection, and document direction hook)
  - `apps/fsm/src/types/index.ts` (Update `StaffLanguage` to `'en' | 'fr'`)
  - `apps/fsm/src/pages/LoginPage.tsx` (Remove the Arabic toggle, RTL directional tags, and streamline form logic)
  - `apps/fsm/src/index.css` (Remove RTL fonts and styling rules)
  - `docs/projects/F01c_staff-authentication.md` (Update project specs to remove Arabic requirements, keeping EN/FR)
  - `apps/fsm/vitest.config.ts` (Create dedicated configuration mirroring `apps/customer/vitest.config.ts`)
  - `apps/fsm/src/test/setup.ts` (Create test setup file importing `@testing-library/jest-dom`)
  - `apps/fsm/src/hooks/useStaffAuth.test.tsx` (Add comprehensive unit tests for `useStaffAuth`, checking profile presence and error states)
  - `apps/fsm/src/pages/LoginPage.test.tsx` (Add unit tests for `LoginPage` inputs, alerts, language toggles, and hook connections)

- **Persona Impact:**
  - *Ahmed (P10):* UI is kept simple and bilingual (EN/FR) with magic link sign-in to eliminate password typing. Visually-driven icon tasks will support ESL needs during shift activities.
  - *Margaret (P3):* Fully verified 48px touch targets and 16px text size.
  - *Sarah (P12):* Security checks prevent unregistered logins; tests verify proper denial of access.

- **Risks & Mitigation:**
  - *Risk:* Mocking Firebase complex async flows (like `onAuthStateChanged` or email sign-in links) incorrectly in tests.
  - *Mitigation:* Use robust, deterministic mock functions in `setup.ts` to simulate Auth state changes synchronously and resolve promises cleanly.

- **Schema Audit:**
  - Confirms that the `preferences.language` field in the `/staff` collection accepts `'en' | 'fr'` as valid values. No other fields are added or modified.

---

### Strategy 2: Single Root Workspace Vitest Setup & Code Preservation
This strategy preserves the existing FSM codebase (keeping the Arabic toggle/assets) but configures a single root-level Vitest environment to run tests across all workspaces together.

- **Files Changed:**
  - `vitest.config.ts` (at workspace root, configured to search across workspaces)
  - `apps/fsm/src/hooks/useStaffAuth.test.tsx` (Add tests for the auth hooks)
- **Persona Impact:** Ahmed keeps Arabic support, but this violates the user's design decision to restrict FSM to English and French.
- **Risks & Mitigation:**
  - *Risk:* Root test config is harder to configure when workspaces use different setups (customer uses Next/Vite-like settings, FSM has distinct configurations).
  - *Risk:* Unused Arabic files left in the codebase increase bundle size and maintenance overhead.
- **Schema Audit:** None.

---

### Strategy 3: Real Firebase Local Emulator integration for testing
Instead of mocking Firebase services, this strategy configures Vitest to run tests using the Firebase Emulator Suite.

- **Files Changed:**
  - `apps/fsm/vitest.config.ts`
  - `apps/fsm/src/test/emulator-setup.ts` (Wires test runner to communicate with local emulator endpoints)
- **Persona Impact:** Matches Strategy 1.
- **Risks & Mitigation:**
  - *Risk:* Substantially slower test execution and high complexity to orchestrate emulator startup during CI runs.
  - *Mitigation:* Set up pre-test and post-test lifecycle hooks in shell scripts, but this introduces fragile setup dependencies.
- **Schema Audit:** None.

---

## 3. Recommended Choice & Rationale

**Strategy 1 (Strict Bilingual EN/FR Setup & FSM Vitest Config)** is recommended.
It perfectly matches the user's design decision to remove Arabic support, ensuring clean and maintainable code without unused translation assets. Setting up a dedicated FSM Vitest runner mirrors the customer workspace configuration, keeping test isolation clean and fast.

---

## 4. Implementation Checklist & Verification Gate

1. [ ] Remove `apps/fsm/src/i18n/locales/ar.json`.
2. [ ] Update `apps/fsm/src/i18n/index.ts` to remove Arabic imports, translation keys, and RTL logic.
3. [ ] Update `apps/fsm/src/types/index.ts` to restrict `StaffLanguage` to `'en' | 'fr'`.
4. [ ] Update `apps/fsm/src/pages/LoginPage.tsx` to remove the Arabic toggle button and any input directional direction configurations.
5. [ ] Update `apps/fsm/src/index.css` to remove the RTL custom font-family fallback.
6. [ ] Update `docs/projects/F01c_staff-authentication.md` to remove Arabic specifications.
7. [ ] Create `apps/fsm/vitest.config.ts` mirroring `apps/customer/vitest.config.ts`.
8. [ ] Create `apps/fsm/src/test/setup.ts` containing the necessary `@testing-library/jest-dom` references.
9. [ ] Implement `apps/fsm/src/hooks/useStaffAuth.test.tsx` to unit test the auth context hook.
10. [ ] Implement `apps/fsm/src/pages/LoginPage.test.tsx` to unit test the Login Page.
11. [ ] Run `npm run test:fsm` to verify unit test coverage targets (minimum 40% lines/functions/statements, 35% branches).
12. [ ] Run `npm run build` to verify clean build compilations for all workspaces.
13. [ ] Run `npm run lint` to verify clean linting checkouts.
