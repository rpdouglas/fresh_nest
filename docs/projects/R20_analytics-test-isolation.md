# R20 — Fix Analytics Singleton Test Isolation
**Epic:** R20 | **Phase:** Phase 2 | **Date:** 2026-06-11  
**Primary Personas:** Dev Team  
**Technical Finding Addressed:** F-22 (Analytics singleton lacks test isolation)  

---

## 1. Context & User Story

As a developer (Ryan), I want unit tests for our Google Analytics integration to run under complete isolation so that state changes made in one test cannot affect the correctness or behavior of other tests.

---

## 2. Technical Architecture & Implementation

### File: [src/lib/analytics.ts](file:///workspaces/fresh_nest/src/lib/analytics.ts)

Add the reset function:
```typescript
export const _resetForTesting = () => {
  if (import.meta.env.MODE === 'test') {
    analyticsInstance = null
  }
}
```

### File: [src/lib/analytics.test.ts](file:///workspaces/fresh_nest/src/lib/analytics.test.ts)

Reset the state before each test:
```typescript
import { _resetForTesting } from './analytics'

beforeEach(() => {
  vi.clearAllMocks()
  _resetForTesting()
})
```

---

## 3. Implementation Steps

1. Export `_resetForTesting` from `src/lib/analytics.ts`.
2. Import and invoke `_resetForTesting` inside the `beforeEach` block of `src/lib/analytics.test.ts`.
3. Run the unit test suite (`npm run test`) and verify that it executes successfully.

---

## 4. Persona Acceptance Tests

*   **Dev Team**:
    Running `npm run test` executes all unit tests successfully. In `analytics.test.ts`, if `initializeAnalytics()` is called in the first test, subsequent tests still start with a clean slate (`analyticsInstance === null`), verifying that mock tracking and firebase analytics initialization state do not bleed between tests.
