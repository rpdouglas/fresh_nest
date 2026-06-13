# F01a — FSM Monorepo Workspace Transition
**Epic:** F01 | **Phase:** Phase 1 (Infrastructure) | **Date:** June 13, 2026  
**Primary Personas:** Dev Team / Ryan  

---

## 1. Context & User Story

As a developer, I want to transition the flat `fresh_nest` repository into an npm-workspace-backed monorepo. This allows us to keep the customer website and the new Field Service Management (FSM) staff portal in a single repository, sharing rules, databases, and assets, without building them into the same runtime artifact.

---

## 2. Technical Architecture & Structural Rules

The repository will be restructured into npm workspaces under `apps/` and `packages/`.
`packages/shared` will start empty, with config files copied for isolation to prevent pre-optimization.

### Proposed Directory Layout
```
fresh_nest/
├── package.json                 ← Unified dependencies & workspaces config
├── apps/
│   ├── customer/                ← Customer site (moved from root)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   └── fsm/                     ← FSM Staff portal (new Vite scaffold)
│       ├── package.json
│       ├── vite.config.ts
│       └── src/
└── packages/
    └── shared/                  ← Starts empty
```

---

## 3. Implementation Steps

### Step 1: Restructure Folder Structure
Execute the shell commands to move the current files to `apps/customer/`:
```bash
mkdir -p apps/customer apps/fsm packages/shared/src
mv src apps/customer/
mv public apps/customer/
mv index.html apps/customer/
mv vite.config.ts apps/customer/
mv vitest.config.ts apps/customer/
mv playwright.config.ts apps/customer/
mv tsconfig.json apps/customer/
mv tsconfig.app.json apps/customer/
mv tsconfig.node.json apps/customer/
mv tailwind.config.js apps/customer/
mv postcss.config.js apps/customer/
mv eslint.config.js apps/customer/
mv e2e apps/customer/
```

### Step 2: Customer Package Setup
Create `apps/customer/package.json`:
```json
{
  "name": "@freshnest/customer",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

### Step 3: Packages Shared Setup
Create `packages/shared/package.json`:
```json
{
  "name": "@freshnest/shared",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```
Create `packages/shared/src/index.ts` exporting an empty object.

### Step 4: Configure Monorepo Root `package.json`
Write a unified root-level `package.json` containing npm workspaces definition and shared scripts:
```json
{
  "name": "freshnest-ecosystem",
  "private": true,
  "version": "0.0.0",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:customer": "npm --workspace=apps/customer run dev",
    "dev:fsm": "npm --workspace=apps/fsm run dev",
    "build:customer": "npm --workspace=apps/customer run build",
    "build:fsm": "npm --workspace=apps/fsm run build",
    "build": "npm run build:customer && npm run build:fsm",
    "test:customer": "npm --workspace=apps/customer run test",
    "test:fsm": "npm --workspace=apps/fsm run test",
    "lint": "npm --workspaces run lint --if-present"
  },
  "devDependencies": { ... },
  "dependencies": { ... }
}
```
*Note: Consolidate devDependencies and dependencies from the original root package.json.*

### Step 5: Scaffold FSM App
Create the following files in `apps/fsm/`:
- `package.json` (name: `@freshnest/fsm`, script `dev` with `--port 5174`, scripts `build`, `lint`, `preview`, `test`)
- `tsconfig.json` referencing `tsconfig.app.json` and `tsconfig.node.json`
- `tsconfig.app.json` with `@/*` mapping to `./src/*`
- `tsconfig.node.json` targeting `vite.config.ts`
- `vite.config.ts` loading `@vitejs/plugin-react` and defining alias `@` to `src/`
- `tailwind.config.js` and `postcss.config.js` copying brand tokens from the customer app
- `index.html` loading `/src/main.tsx` and adding fonts
- `src/index.css` with Tailwind directives
- `src/main.tsx` initializing QueryClient and mounting React
- `src/App.tsx` containing basic route definitions (`/`, `/login`, `/shifts`, `/jobs`) returning simple placeholders
- `src/lib/utils/utils.ts` defining the `cn()` class merger

### Step 6: Verify Builds
Install and verify workspaces resolve:
```bash
npm install
npm run build:customer
npm run build:fsm
```

---

## 4. Persona Acceptance Tests

* **Dev Team (Acceptance Criteria):**
  - Running `npm run build` at the root compiles both `@freshnest/customer` and `@freshnest/fsm` without TypeScript or bundler errors.
  - Port 5173 loads the customer website in dev mode (`npm run dev:customer`).
  - Port 5174 loads the FSM placeholder app in dev mode (`npm run dev:fsm`).
  - Linting passes cleanly across all workspaces (`npm run lint`).
