# R20: Fix Analytics Singleton Test Isolation Plan
**Goal:** Isolate analytics unit tests by resetting the module-level `analyticsInstance` singleton before each test run, preventing cross-test state leakage.

**Primary Persona(s) Served:**
- **Dev Team:** Enhances test isolation, correctness, and reliability, preventing false positives/negatives when running the test suite in random or parallel order.

---

## Strategy 1: Test-Only Reset Export (Recommended & Pre-selected)
**Description:** Export a `_resetForTesting` helper function from `analytics.ts` that sets `analyticsInstance = null` when in the `'test'` environment. Invoke this helper inside the `beforeEach` block of `analytics.test.ts`.

**Files Changed:**
1. `src/lib/analytics.ts`: Add and export the reset helper.
2. `src/lib/analytics.test.ts`: Import and invoke the reset helper in `beforeEach`.

**Risks:**
- Production code contains a testing hook, but it is safely wrapped inside environment checks (`import.meta.env.MODE === 'test'`) and tree-shaken or inactive in production.

---

## Strategy 2: Refactor to Analytics Class (Service Pattern)
**Description:** Refactor `analytics.ts` to export a class or constructor rather than module-level singleton state. The application can instantiate it globally, and test suites can instantiate a fresh instance for each test.

**Files Changed:**
1. `src/lib/analytics.ts`
2. `src/App.tsx` (or where initialized)
3. All files importing analytics helper functions.

**Risks:**
- High-churn refactoring across many components that call analytics functions, which increases the likelihood of human error or import bugs.

---

## Strategy 3: Vitest Module Isolation (`vi.isolateModules`)
**Description:** Avoid modifying the source code of `analytics.ts` by using Vitest's `vi.isolateModules()` inside each test to dynamically import and isolate the analytics module on every test run.

**Files Changed:**
1. `src/lib/analytics.test.ts`

**Risks:**
- Makes the test code extremely verbose and async-heavy, as every test needs a dynamic `import()` wrapped inside an isolation callback.

---

## Recommendation & Next Steps
We recommend and implemented **Strategy 1** because it cleanly accomplishes the goal without changing consumer files or introducing excessive testing boilerplate.

To proceed:
1. Wait for user/human approval of Strategy 1.
2. Edit `src/lib/analytics.ts` and `src/lib/analytics.test.ts`.
3. Run `npm run test` to verify unit tests pass with clean isolation.
