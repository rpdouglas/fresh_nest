# F01a Planning — FSM Monorepo Workspace Transition
**Epic:** F01a | **Phase:** Phase 1 (Infrastructure) | **Date:** June 13, 2026  
**Primary Personas:** Dev Team / Ryan  

---

## 1. Persona Analysis & Acceptance Gate

This project establishes the repository infrastructure.
- **Ryan (Dev Team):** Needs a clean, zero-contamination build pipeline where building the customer site does not bundle FSM dependencies, and vice versa. Test suites must run in isolation.
- **Margaret (P3), Diane (P1), Sophie (P5):** No direct user-facing features in this setup, but their localized strings and accessibility settings must not be degraded or broken during the migration of the customer app codebase.

---

## 2. 3-Strategy Plan

### Strategy 1: Clean Step-by-Step Restructure (Recommended)
This strategy moves all customer-related codebase assets into `apps/customer/` using standard shell move operations, initializes workspaces with simple sub-package manifests, and copies configuration files to `apps/fsm/` to maintain decoupled builds.

- **Files Changed:**
  - **Move:** `src`, `public`, `index.html`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `e2e` → `apps/customer/`
  - **Create:**
    - Root `package.json` (npm workspaces config, scripts, unified dependencies)
    - `apps/customer/package.json` (workspace manifest)
    - `apps/fsm/package.json` (workspace manifest)
    - `apps/fsm/tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
    - `apps/fsm/vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`
    - `apps/fsm/index.html`, `apps/fsm/src/main.tsx`, `apps/fsm/src/App.tsx`, `apps/fsm/src/index.css`
    - `packages/shared/package.json`, `packages/shared/src/index.ts`
- **Persona Impact:** Zero regression on customer site UX. Clean environment isolation for FSM staff.
- **Risks & Mitigation:**
  - *Risk:* Git history tracking of moved files might be broken.
  - *Mitigation:* Ensure commands are executed in a single commit context so Git's rename detection algorithm (which operates on similarity) easily maps the files to their new home.
- **Schema Audit:** N/A (no database changes).

---

### Strategy 2: Incremental Move using Git Move (Safety First)
This strategy uses explicit `git mv` commands for all directory and file restructuring. This guarantees that Git maintains 100% trace history for every file, minimizing merge conflicts if other branches are active.

- **Files Changed:** Same file target list as Strategy 1.
- **Methodology:**
  ```bash
  mkdir -p apps/customer
  git mv src apps/customer/src
  git mv public apps/customer/public
  # (repeat for all configs and files)
  ```
- **Persona Impact:** Identical to Strategy 1.
- **Risks & Mitigation:**
  - *Risk:* Git mv can sometimes fail if directories contain untracked files (e.g. `node_modules` or `.env` files).
  - *Mitigation:* Clean the workspace of all untracked compile files (`.tsbuildinfo`, `dist/`, etc.) before starting the move.
- **Schema Audit:** N/A (no database changes).

---

### Strategy 3: Root-Customer / Sub-FSM Layout (Alternative)
This strategy keeps the customer app at the repository root level (avoiding folder movements) and only scaffolds the FSM app under `apps/fsm/`.

- **Files Changed:**
  - **Move:** None.
  - **Create:** `apps/fsm/` structure, root workspaces definition.
- **Persona Impact:** High risk of build contamination. Customer site imports could accidentally pull FSM assets, bloating customer bundle size.
- **Risks & Mitigation:**
  - *Risk:* High complexity in `firebase.json` mapping because the public build target and server assets are mixed in the root.
  - *Mitigation:* Implement strict eslint path-blocking rules to prevent cross-app importing.
- **Schema Audit:** N/A.

---

## 3. Recommended Choice & Rationale

**Strategy 1 (Clean Step-by-Step Restructure)** is recommended.
Since this is a solo-developer repository with no other active branches, we do not need the complexity of incremental git moves for conflict avoidance. Restructuring the workspace into clear subdirectory apps (`apps/customer` and `apps/fsm`) prevents any configuration bleed or build cross-contamination.

---

## 4. Implementation Checklist & Verification Gate

1. [ ] Move customer files to `apps/customer/`
2. [ ] Write root `package.json` workspaces manifest
3. [ ] Scaffold `@freshnest/shared` package
4. [ ] Scaffold `@freshnest/fsm` app skeleton
5. [ ] Copy configs (`tailwind`, `postcss`, `eslint`) to `@freshnest/fsm`
6. [ ] Run `npm install` at root
7. [ ] Run `npm run build:customer` (Verification: passes, zero errors)
8. [ ] Run `npm run build:fsm` (Verification: passes, zero errors)
9. [ ] Run `npm run test:customer` (Verification: passes, all unit tests green)
