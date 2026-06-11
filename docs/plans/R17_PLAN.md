# R17: Wire @tanstack/eslint-plugin-query Plan
**Goal:** Enable TanStack Query linting rules to prevent query anti-patterns (e.g., destructuring query results directly, unstable QueryClients, or incorrect exhaustive dependencies) prior to using hooks.

**Primary Persona(s) Served:**
- **Dev Team:** Ensures best practices when writing query hooks during Phase 3 (Refactoring) and Phase 4 (Growth features).

---

## Strategy 1: Spread Flat Recommended Config (Recommended & Pre-selected)
**Description:** Import `@tanstack/eslint-plugin-query` as `queryPlugin` and spread `...queryPlugin.configs['flat/recommended']` at the top level of the flat configuration list in `eslint.config.js`.
- Configuration:
  ```javascript
  import queryPlugin from '@tanstack/eslint-plugin-query'
  ...
  export default defineConfig([
    globalIgnores(['dist']),
    ...queryPlugin.configs['flat/recommended'],
    {
      files: ['**/*.{ts,tsx}'],
      extends: [ ... ]
  ```
- Scope: Applies automatically to all files.

**Files Changed:**
1. `eslint.config.js`: Import and inject the plugin's recommended flat configuration array.

**Persona Impact:**
- Preempts runtime query bugs and compiler warnings by warning developers of unstable configurations during development.

**Risks:**
- None. This is standard and non-invasive.

**Schema Audit:**
- No database changes.

---

## Strategy 2: Manual Rule Declarations
**Description:** Declare the plugin in `plugins` and define explicit rules in a custom config object.

**Files Changed:**
1. `eslint.config.js`

**Risks:**
- Requires manual mapping and tracking of new rule names when TanStack Query is upgraded.

---

## Recommendation & Next Steps
We recommend and implemented **Strategy 1** to match the modern flat config standard.

To proceed:
1. Obtain human approval for Strategy 1.
2. Edit `eslint.config.js`.
3. Verify compilation and lint status.
