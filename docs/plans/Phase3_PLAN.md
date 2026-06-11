# Phase 3 Refactoring & Architecture Plan
**Goal:** Decompose front-end monoliths, reorganize workspace imports, centralize animation/icon configurations, and wire TanStack Query to Firebase subscriptions to enable rapid, robust feature additions in Phase 4.

**Primary Persona(s) Served:**
- **Dev Team:** Enhances developer experience (DX), simplifies file navigation, improves testing and code reuse.
- **Ryan (Owner):** Minimizes bug regression rates in administrative views and secures performance/load metrics.

---

## Strategy 1: Centralized Refactoring & Native TanStack Query (Recommended & Pre-selected)
**Description:** Execute the modular architecture approved during the planning interview:
1. **R12 (Reorganize `src/lib/`)**: Group files into `data/`, `firebase/`, `schemas/`, and `utils/`. Update import paths globally.
2. **R11 (Decompose `AdminPage.tsx`)**: Split the 650+ line dashboard file into UI components inside `src/components/admin/` and admin-specific custom hooks inside `src/components/admin/hooks/`.
3. **R15 (Wire TanStack Query)**: Integrate `useFirestoreCollectionQuery` from `@tanstack-query-firebase/react` directly inside the new `useBookings.ts` hook for native, real-time query caching.
4. **R13 (Consolidate Animations)**: Centralize static motion configuration variants in `src/lib/utils/animations.ts` and import them across sections.
5. **R14 (ServiceIcon Map)**: Refactor the `ServiceIcon` switch statement into a typed `ICON_PATHS` react-node dictionary inside `src/components/home/ServicesGrid.tsx`.

**Files Changed:**
1. `src/lib/` (all files moved to subfolders)
2. `src/pages/AdminPage.tsx` (fully decomposed)
3. `src/components/admin/*` (new UI sub-components)
4. `src/components/admin/hooks/*` (new custom hooks: `useAdminAuth`, `useBookings`, `useAdminAnalytics`)
5. `src/lib/utils/animations.ts` (new centralized variants)
6. `src/components/home/ServicesGrid.tsx` (ServiceIcon update)
7. Global import updates in all consumer page and component files.

**Persona Impact:**
- Zero visual changes for end-users, ensuring full compliance with Diane's translation requirements, Travis's checkout speeds, and Margaret's accessibility targets.
- Admin views load instantly with fully cached queries, preventing layout shift or flickering lists for owner Lauren.

**Risks:**
- High import churn since all `src/lib/` imports will need path corrections. This will be fully mitigated by checking `npm run build` and resolving linter warnings.

**Schema Audit:**
- No database schema or rule changes.

---

## Strategy 2: Minimum-Churn Refactoring (Manual State & Flat Lib)
**Description:** Restructure page views with minimal filesystem movement:
1. Keep `src/lib/` flat to avoid import changes in consumer pages.
2. Extract admin page sub-components into the general `src/components/` and `src/hooks/` folders instead of a modular admin folder.
3. Keep standard `useEffect` subscription queries rather than wiring TanStack Query.

**Files Changed:**
1. `src/pages/AdminPage.tsx`
2. `src/components/AdminTable.tsx`, `src/hooks/useBookings.ts`

**Risks:**
- Does not solve real-time query caching, missing out on TanStack Query performance boosts.
- litters global folders with admin-only assets, reducing modularity.

---

## Strategy 3: Pure Component Extraction (No Custom Hooks)
**Description:** Split UI files into smaller presentational blocks, but keep all state management, useEffect hooks, and Firebase subscriptions within `AdminPage.tsx` itself.

**Risks:**
- Fails the core refactoring objectives of R11, R15, and R13.
- Keeps `AdminPage.tsx` as a heavy, hard-to-maintain state-management wrapper.

---

## Recommendation & Next Steps
We recommend proceeding with **Strategy 1** to establish a state-of-the-art modular codebase before building the blog and referral features.

To proceed:
1. Wait for human/user approval of Strategy 1.
2. Execute Strategy 1 step-by-step.
3. Verify via `npm run build && npm run lint`.
