# R18: Add Vitest Coverage Threshold Plan
**Goal:** Configure a minimum test coverage threshold (40% statement, line, and function coverage; 35% branch coverage) in Vitest to ensure future code modifications or features cannot be committed if they drop unit test coverage below the baseline.

**Primary Persona(s) Served:**
- **Dev Team:** Provides an automated safety net to catch untested code paths and maintains test confidence during Phase 3 (Refactoring) and Phase 4 (Growth features).

---

## Strategy 1: v8 Coverage Provider with Local Thresholds (Recommended & Pre-selected)
**Description:** Configure Vitest to use the `@vitest/coverage-v8` provider. Apply thresholds of 40% for lines, functions, and statements, and 35% for branches. Explicitly exclude standard configurations and static fixtures from coverage calculations.
- Configuration:
  ```typescript
  test: {
    ...
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 35,
        statements: 40,
      },
      exclude: [
        'src/i18n/**',
        'src/lib/data/**',
        'src/types/**',
        'src/main.tsx',
        'src/App.tsx',
        'dist/**',
      ],
    },
  }
  ```

**Files Changed:**
1. `vitest.config.ts`: Add `coverage` configuration under `test`.
2. `package.json`: Formally add `@vitest/coverage-v8` to `devDependencies` (already installed).

**Persona Impact:**
- Zero impact on end-users; major DX benefits for developers by preventing regressions in test coverage.

**Risks:**
- The current test suite must meet the thresholds. Since current coverage of testable files is >95%, this risk is extremely low.

**Schema Audit:**
- No database schema changes.

---

## Strategy 2: Istanbul Coverage Provider
**Description:** Use the alternative `istanbul` coverage provider by configuring `provider: 'istanbul'` and installing `@vitest/coverage-istanbul`.

**Files Changed:**
1. `vitest.config.ts`
2. `package.json`

**Risks:**
- Requires installing and maintaining `@vitest/coverage-istanbul`.
- Istanbul is generally slower and requires Babel/instrumentation overhead for accurate source mapping in certain build setups.

---

## Strategy 3: Manual Coverage Tracking (No Thresholds)
**Description:** Enable coverage reporting without defining hard thresholds, relying on the dev team to manually inspect the terminal output.

**Risks:**
- Fails the core requirement of R18 ("Add Vitest Coverage Threshold").
- Does not block local commits or CI builds when coverage drops.

---

## Recommendation & Next Steps
We recommend **Strategy 1**, using the modern `v8` provider and exact threshold limits.

To proceed:
1. Wait for user/human approval of Strategy 1.
2. Edit `vitest.config.ts`.
3. Verify by running `npx vitest run --coverage` and ensuring that it passes successfully.
