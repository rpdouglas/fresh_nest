# Test Coverage Expansion (P2-E10) — 3-Strategy Plan
**Date:** 2026-06-17  
**Status:** Pending Review

---

## 1. Persona Analysis & Coverage Goals

### Personas Impacted
- **P12 Sarah (Owner / Compliance):** Demands absolute assurance that security rules, roles boundaries, and custom claims gates work perfectly to prevent any data leaks or unauthorized updates (especially regarding pay rates and financials).
- **QA & Engineering:** Requires a stable, green CI pipeline with robust unit and E2E coverage that prevents regression in billing (Stripe), scheduling buffers, and multi-language routing.

### Technical Goals
- Raise Vitest coverage thresholds to **60% lines** and **55% branches** in the customer app workspace.
- Write unit tests for `useAdminAuth`, `quotePricing.ts`, and `bookingSchema.ts`.
- Write Firestore security rules emulator tests targeting public bookings, admins, staff, and job permissions.
- Implement Playwright E2E integration tests simulating customer login, Stripe checkouts (mocked), and FSM job completion flows.

---

## 2. Testing Strategies

### Strategy 1: Mock-Centric & Emulator rules-unit-testing (Recommended)
This strategy relies on a running Firestore emulator only for unit rules testing, while all other E2E integrations (Stripe, Auth, Storage) are mocked/injected in the browser window context via Playwright scripts.

- **Files to Modify:**
  - `apps/customer/vitest.config.ts` (thresholds: 60% lines / 55% branches)
  - `apps/customer/playwright.config.ts` (extend webServer to run both customer and FSM apps)
  - `package.json` (add scripts: `test:rules`)
  - Create `apps/customer/test/firestore-rules.test.ts` (using `@firebase/rules-unit-testing`)
  - Create `apps/customer/src/lib/schemas/bookingSchema.test.ts`
  - Create `apps/customer/src/lib/utils/quotePricing.test.ts`
  - Create `apps/customer/src/components/admin/hooks/useAdminAuth.test.ts`
  - Create `apps/customer/e2e/fsm.spec.ts` (FSM login, job checklist, photo upload mocks)
  - Create `apps/customer/e2e/checkout.spec.ts` (Stripe input/API mocks)
- **Persona Impact:** High confidence for Sarah (P12) regarding security rules. Very fast developer feedback loop (<10 seconds test runs) because it avoids slow emulator startups for E2E runs.
- **Risks:** Mocking Stripe JS in Playwright might miss future Stripe element layout changes.
- **Schema Audit:** None. All writes and reads use existing schema fields.

---

### Strategy 2: Full-Emulator Hybrid testing
This strategy spins up all Firebase Emulators (Auth, Firestore, Storage) for both Rules tests and E2E tests, performing real operations (e.g. creating real users via Auth emulator, uploading real files to Storage emulator). Only Stripe requests are stubbed out.

- **Files to Modify:**
  - Same files as Strategy 1, plus additional configuration in `firebase.json` to enable Auth and Storage emulators.
  - Setup files for E2E to initialize emulator connections in the browser.
- **Persona Impact:** Highest fidelity simulation of real user sessions.
- **Risks:** High execution latency and complex synchronization issues (such as cleaning up emulator state between test runs). Can be brittle in CI environments.
- **Schema Audit:** None.

---

### Strategy 3: Mock-Only Rules & Mock E2E
This strategy avoids the Firestore Emulator altogether by mocking rule outcomes in tests and mocking all Firestore database requests in Playwright.

- **Files to Modify:**
  - `apps/customer/vitest.config.ts` (thresholds only)
  - Playwright E2E spec files (inject complete db mocks)
- **Persona Impact:** Low confidence. Leaves `firestore.rules` entirely untested, which is a major compliance risk for Sarah (P12).
- **Risks:** High risk of rules regression in production since rules are never actually executed against the compiler.
- **Schema Audit:** None.

---

## 3. Recommendation
We strongly recommend **Strategy 1**. It delivers rigorous security rules verification using the official `@firebase/rules-unit-testing` emulator, while keeping Playwright E2E execution lightweight, robust, and fast by injecting mock Auth, Stripe, and Storage contexts directly in browser memory.
