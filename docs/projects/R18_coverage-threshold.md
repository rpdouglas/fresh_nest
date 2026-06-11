# R18 — Add Vitest Coverage Threshold
**Epic:** R18 | **Phase:** Phase 2 | **Date:** 2026-06-11  
**Primary Personas:** Dev Team  
**Technical Finding Addressed:** F-19 (Vitest has no coverage threshold configured)  

---

## 1. Context & User Story

As a developer (Ryan), I want to enforce a minimum test coverage baseline (40% statement, line, and function coverage; 35% branch coverage) so that future modifications to the application codebase cannot silently reduce test coverage and degrade test confidence.

---

## 2. Technical Architecture & Coverage Rules

The coverage configuration will be added under `test.coverage` in `vitest.config.ts`. It will use the `@vitest/coverage-v8` provider and target all files except for translation files, types, static data, and build/bootstrap scripts.

### File: [vitest.config.ts](file:///workspaces/fresh_nest/vitest.config.ts)

```typescript
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
```

---

## 3. Implementation Steps

1. Install the `@vitest/coverage-v8` package (completed).
2. Configure the `coverage` block inside the `test` configuration section of `vitest.config.ts`.
3. Verify that the threshold limits are active by running `npx vitest run --coverage`.

---

## 4. Persona Acceptance Tests

*   **Dev Team**:
    Running `npm run test -- --coverage` successfully measures unit test coverage, outputs the text table, and finishes with exit code `0` if all thresholds are met. If code coverage drops below the defined limits (e.g. statement coverage drops below 40%), the command fails with a non-zero exit code, blocking commits or PR integrations.
