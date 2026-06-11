# R16: Enable Type-Aware ESLint Rules Plan
**Goal:** Upgrade the project's ESLint configuration to enable type-aware static analysis, catching common runtime bugs (such as unawaited promises or unsafe type assignments) before runtime.

**Primary Persona(s) Served:**
- **Dev Team:** Enhances developer experience (DX), prevents coding regressions, and provides immediate compiler feedback during the coding cycle.

---

## Strategy 1: tseslint.config Wrapper with Project Service (Recommended & Pre-selected)
**Description:** Refactor `eslint.config.js` to use `tseslint.config(...)` with the modern `projectService: true` setting and `tseslint.configs.recommendedTypeChecked`.
- Configuration:
  1. Remove `js.configs.recommended` and `tseslint.configs.recommended` from the custom files config block.
  2. Spread `...tseslint.configs.recommendedTypeChecked` directly in the config array.
  3. Configure `languageOptions.parserOptions.projectService = true` and `tsconfigRootDir: import.meta.dirname`.
  4. Ensure `js.configs.recommended` is also present at the top level or spread properly.

**Files Changed:**
1. `eslint.config.js`: Refactor to type-aware config schema.

**Persona Impact:**
- Major upgrade to code health and static checks.
- Extremely fast lint compilation using TypeScript's project service.

**Risks:**
- Type-aware linting might highlight existing type mismatches, empty interfaces, or unhandled promises in the current codebase. Any resulting lint errors must be resolved to satisfy the AGY gate.

**Schema Audit:**
- No database changes.

---

## Strategy 2: Explicit Project Path Mapping
**Description:** Enable type-checking by explicitly pointing to `tsconfig.app.json` and `tsconfig.node.json` using `parserOptions.project: ['./tsconfig.app.json', './tsconfig.node.json']`.

**Files Changed:**
1. `eslint.config.js`

**Risks:**
- Slower lint execution compared to the project service.
- If a new TS configuration file is added later, ESLint won't automatically track it until the array is updated.

---

## Strategy 3: Loose Type-Checking with No Project Service
**Description:** Skip the project service and rely only on standard TypeScript plugin rules without type-aware configurations.

**Risks:**
- Fails the core requirement of R16 ("Enable Type-Aware ESLint Rules").

---

## Recommendation & Next Steps
We recommend and implemented **Strategy 1**, as it is the standard v8 setup, utilizes the faster project service compilation, and is fully automated.

To proceed:
1. Obtain human approval for Strategy 1.
2. Refactor `eslint.config.js`.
3. Run `npm run lint` and resolve any newly reported type-aware lint errors.
