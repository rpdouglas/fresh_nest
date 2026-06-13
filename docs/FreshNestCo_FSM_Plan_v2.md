# Fresh Nest Co. — FSM Platform Plan v2
### Field Service Management · Staff Portal · Operations Intelligence
**Version:** 2.0 · **Date:** June 2026  
**Updated from v1:** Codebase audit against `codebase_export_FN_20260613` · Repository strategy decision · Getting-started guide  
**Stack (Customer Site — current):** React 19 · TypeScript · Vite · Tailwind CSS v3 · Firebase (Firestore, Auth, Functions) · TanStack Query v5  
**Stack (FSM Portal — proposed):** Same stack · separate Vite app · shared Firebase project `freshnest-aa51e` · PWA-enabled  
**Personas:** P7 Carla · P8 Jasmine · P9 Mike · P10 Ahmed · P11 Brenda · P12 Sarah  

---

## What Changed in v2

This version performs a deep audit of the June 13 2026 codebase against the v1 FSM plan, answers the repository strategy question (monorepo vs. separate repo) with a concrete recommendation supported by research, and adds a **Part B: Getting Started** section with exact commands and file contents to boot the FSM portal from scratch. The epic map from v1 is unchanged but each epic now has a "Current State" note documenting what already exists in the `fresh_nest` repo that the FSM can reuse or extend.

---

## How to Use This Document

- **Part A** — Codebase gap analysis: what's done, what's missing, what transfers
- **Part B** — Repository strategy: monorepo vs. separate repo — recommendation and rationale
- **Part C** — Getting started: exact steps to initialize the FSM portal
- **Part D** — Updated epic map with current-state notes
- **Part E** — Architecture: shared Firebase, PWA, offline, auth separation
- **Part F** — Reference: ADR index, Firestore rule extensions, Go/No-Go checklist

---

---

# PART A — Codebase Gap Analysis

---

## A1. What the June 13 Codebase Has Completed (Relevant to FSM)

The June 13 export shows meaningful remediation work has been done since the architectural review. The following items from the Remediation Plan are complete and confirmed in the codebase:

**Security (R01–R04 completed):**
- Production `firestore.rules` now has the `isAdmin()` function reading from the `admins/{email}` collection. The default-deny wildcard is in place. The `bookings` create rule is detailed with 18 required fields, full type checking, and enum validation. This is production-quality.
- `firestore.dev.rules` has identical structure with a `referrals` collection added for the referral program.
- `firebase.json` now includes the `Content-Security-Policy` header on both hosting targets.
- `.gitignore` includes `.env.production` — the file is no longer tracked.

**Architecture (R11–R15 completed):**
- `AdminPage.tsx` is now composed — the hooks (`useAdminAuth`, `useAdminAnalytics`, `useBookings`) and sub-components (`AccessDeniedPanel`, `AnalyticsDashboard`, `BookingDetailPanel`, `BookingsTable`, `LoginPanel`) are all extracted into `src/components/admin/`.
- `useBookings.ts` uses `useCollectionQuery` from `@tanstack-query-firebase/react/firestore` — TanStack Query is now wired to Firestore.
- `lib/` is reorganized into `lib/data/`, `lib/firebase/`, `lib/schemas/`, `lib/utils/`.
- `src/lib/utils/animations.ts` exists — shared Framer Motion variants are consolidated.

**Tooling (R16–R20 completed):**
- `vitest.config.ts` has coverage thresholds (40% lines/functions, 35% branches).
- E2E suite has `booking.spec.ts`, `language.spec.ts`, and `phase4.spec.ts` — the booking form is now covered.
- `README.md` is project-specific.

**Features beyond original plan:**
- `functions/src/index.ts` has a third Cloud Function: `onDailyRecurringRenewal` — auto-generates future bookings for recurring clients. This is beyond Phase 3 of the master plan.
- Referral code generation is implemented inside `onBookingCreated` — writes to a `referrals` collection.
- Blog is implemented: `Blog.tsx`, `BlogPost.tsx`, `lib/data/blogData.ts`.
- `src/types/index.ts` now includes `BlogPost` interface and `referredBy`/`referralCode` on the `Booking` interface.

---

## A2. What the FSM Plan Needs That Does Not Exist Yet

**Firebase Storage:** The codebase has `VITE_FIREBASE_STORAGE_BUCKET` configured in `.env` and `firebase.ts`, but `getStorage()` is never imported or called anywhere. Firebase Storage must be initialized before P11 Brenda's photo upload epic (F09) can begin. The bucket already exists in the Firebase project (confirmed by `.env.production` value `freshnest-aa51e.firebasestorage.app`) — it just needs to be wired in.

**Staff authentication:** The existing `useAdminAuth.ts` uses `GoogleAuthProvider` and `signInWithPopup`. The FSM plan calls for email/password auth for staff (P10 Ahmed may not have a Google account). `EmailAuthProvider` is not referenced anywhere in the codebase. This is a new auth flow that needs to be built.

**FSM Firestore collections:** The current `firestore.rules` explicitly deny-all under the wildcard catch (`match /{document=**} { allow read, write: if false }`). The `staff`, `jobs`, `payRates`, `auditLog`, `checklistTemplates`, and `notifications` collections do not exist yet in rules or in any application code. Any FSM write attempt will be silently blocked until the rules are extended.

**FSM hosting target:** `.firebaserc` only has two targets: `freshnest-prod` and `freshnest-dev`. The FSM portal needs a third target (`freshnest-fsm`) registered in Firebase Console, added to `.firebaserc`, and configured in `firebase.json`.

**Shared types package:** `src/types/index.ts` defines customer-facing types (`Booking`, `BookingStatus`, `ServiceType`, etc.). The FSM needs its own types (`Staff`, `Job`, `JobStatus`, `PayRate`, `AuditEntry`, `ChecklistTemplate`). These must not be added to the customer site's `types/index.ts` — they belong in the FSM app's own type definitions.

**`functions/src/index.ts`:** The Cloud Functions codebase currently uses `getFirestore()` (no DB ID) in `onDailyRecurringRenewal`, which defaults to `(default)`. The FSM plan's `onBookingStatusConfirmed` trigger and `onJobCompleted` trigger must also explicitly target `(default)`. This is consistent with the existing `onDailyReminderCheck` pattern (which was already corrected per R10).

---

## A3. What Transfers Directly from the Customer Site to the FSM Portal

The following can be shared without modification or copied as a starting point:

| Asset | How to share |
|---|---|
| `src/lib/firebase/firebase.ts` | Copy to FSM app — identical Firebase SDK init. Same project, same env vars. |
| `src/lib/utils/utils.ts` (`cn()`) | Copy — no dependencies. |
| `src/lib/utils/animations.ts` | Copy — no dependencies. |
| `tailwind.config.js` | Copy — identical brand tokens. FSM shares the design system. |
| `postcss.config.js` | Copy — identical. |
| `tsconfig.app.json` | Copy as starting point — adjust `paths` alias. |
| `eslint.config.js` | Copy — identical lint rules. |
| `i18n/locales/en.json` and `fr.json` | Extend — FSM adds new keys under an `fsm.*` namespace. Do not duplicate existing keys. |
| `functions/` | Shared — FSM adds new functions to the same `functions/src/index.ts`. The Cloud Functions codebase is not duplicated. |
| `firestore.rules` and `firestore.dev.rules` | Extended — new FSM collections added to the existing rules file. Not duplicated. |

---

---

# PART B — Repository Strategy

---

## B1. The Three Options

**Option 1: Add FSM as a subdirectory inside the existing `fresh_nest` repo**  
All FSM code lives at `fresh_nest/apps/fsm/` alongside the customer site at `fresh_nest/apps/customer/`. This is a monorepo — one repo, two Vite apps, shared packages in `fresh_nest/packages/`.

**Option 2: Create a new `fresh_nest_fsm` repo, point at the same Firebase project**  
Completely separate repository. Two independent codebases that happen to share the same Firebase backend. Shared code (Firebase config, types, utils) is duplicated between repos or published as an npm package.

**Option 3: Keep the existing `fresh_nest` repo exactly as-is, add FSM as a new Vite entry point inside `src/`**  
No structural changes. The FSM portal is a second Vite build target within the existing repo. Shared code is already in the right place.

---

## B2. Deep Dive: Why Option 3 Fails

Option 3 is tempting because it requires zero repo restructuring. In practice it fails for two reasons specific to this codebase and workflow:

**Build contamination.** Vite supports multiple entry points via `rollupOptions.input` in `vite.config.ts`, but both entry points share the same `outDir: 'dist'`. Firebase Hosting deploys from `dist/` and currently maps the entire directory to the `freshnest-prod` target. A second entry point would produce `dist/index.html` (customer) and `dist/fsm.html` (staff), which Firebase Hosting cannot route correctly as two separate sites from one directory without significant `firebase.json` surgery. More critically, the customer site's CSP, cache headers, and SPA rewrite rules would apply to both apps — the FSM has different security requirements (no public booking creation, staff auth only).

**GitHub Actions complexity.** The existing `firebase-deploy.yml` runs `npm run build` and deploys to `freshnest-prod`. If the build produces both apps, the workflow must be split to deploy each app to its own target, which means `vite build --outDir dist/customer` and `vite build --outDir dist/fsm` with different env vars. At that point you have the complexity of Option 1 without the structural clarity of a proper monorepo.

**Verdict:** Option 3 creates hidden coupling that gets worse over time. Eliminate it.

---

## B3. Deep Dive: Separate Repo (Option 2)

**Arguments for a separate repo:**
- Complete independence — the FSM repo can have its own git history, PR templates, branch rules, and deployment cadence without touching the customer site's history.
- Simpler `firebase.json` — each repo has its own, configured for its own targets.
- Access control — if a contractor works on the FSM only, they get access to `fresh_nest_fsm` and nothing else.
- Codespaces: each repo gets its own Codespace with a clean environment. No risk of an FSM dev server interfering with a customer site dev server.

**Arguments against a separate repo:**
- **Code duplication.** Firebase config, Tailwind config, animation utilities, i18n utilities, and eventually shared types would either be duplicated or published to npm. For a solo developer this is pure overhead — any change to the shared Firebase SDK initialization requires editing two repos.
- **Firestore rules drift.** The customer site's `firestore.rules` and the FSM's extended rules need to stay in sync. With two repos, there is no single source of truth for the rules file. If a rule is corrected in one repo and not the other, the production Firestore has whichever version was deployed last. This is a compliance risk given P12 Sarah's requirements.
- **Cloud Functions.** `functions/src/index.ts` is in the customer site repo. FSM-triggered functions (`onBookingStatusConfirmed`, `onJobCompleted`) also belong there. With a separate repo, FSM-related Cloud Functions would need to live in the customer repo (where the `functions/` directory is), which creates an invisible dependency — changing the FSM schema requires a PR in the customer repo.
- **Solo developer workflow.** With Antigravity CLI and Claude Code as the primary development tools, switching between two Codespaces to implement a single feature that touches both portals (e.g., the booking → job pipeline) doubles the context load per session.

**Verdict:** For a solo developer with two tightly coupled portals sharing a Firebase backend, a separate repo trades short-term independence for long-term coordination overhead. The Firestore rules single-source-of-truth issue alone is disqualifying.

---

## B4. Deep Dive: Monorepo (Option 1) — The Recommendation

A monorepo at the `fresh_nest` repository level — restructured into an `apps/` + `packages/` layout — is the correct path. Here is why it works specifically for this codebase:

**It solves the shared code problem cleanly.** Firebase config, Tailwind config, shared TypeScript types, shared utilities, and i18n foundations live in `packages/shared/`. Both apps import from `@freshnest/shared`. One change propagates to both apps at build time. No npm publishing required.

**Firestore rules stay in one place.** `firestore.rules`, `firestore.dev.rules`, and `firebase.json` live at the monorepo root. There is exactly one source of truth. Both apps are deployed from the same CI pipeline, eliminating the drift risk.

**Cloud Functions stay in one place.** `functions/` stays at the root. Both customer-site and FSM-triggered Cloud Functions live in `functions/src/index.ts`. One deployment, one source.

**Firebase Hosting targets map cleanly.** `firebase.json` at the root maps `freshnest-prod` → `apps/customer/dist`, `freshnest-dev` → `apps/customer/dist` (preview), `freshnest-fsm` → `apps/fsm/dist`. Each app builds to its own `dist/` directory. No cross-contamination.

**GitHub Actions split cleanly.** `firebase-deploy.yml` becomes two jobs in one workflow: one that builds and deploys `apps/customer` when `apps/customer/**` changes, one that builds and deploys `apps/fsm` when `apps/fsm/**` changes. Both use the same shared secrets.

**Tooling overhead is minimal.** A full Turborepo or Nx monorepo setup — with workspace-aware build caching, inter-package dependency graphs, and parallel execution — is enterprise tooling for a solo developer. The recommendation here is a **lightweight monorepo with npm workspaces** only: no Turborepo, no Nx. This gives the structural benefits (shared packages, single `node_modules`, workspace scripts) without the tooling complexity. npm workspaces are supported natively in npm 7+ with zero additional dependencies.

**The migration is a one-time rename, not a rewrite.** The existing `fresh_nest` codebase moves from its current flat structure into `apps/customer/`, and a new `apps/fsm/` is initialized from scratch. Nothing in the existing customer site code changes except its location.

---

## B5. Monorepo Structure (Target State)

```
fresh_nest/                          ← GitHub repo root (renamed conceptually to freshnest-ecosystem)
├── .github/
│   └── workflows/
│       ├── customer-deploy.yml      ← replaces firebase-deploy.yml
│       ├── customer-preview.yml     ← replaces firebase-preview.yml
│       ├── fsm-deploy.yml           ← NEW
│       ├── fsm-preview.yml          ← NEW
│       └── docs-check.yml           ← unchanged
├── apps/
│   ├── customer/                    ← existing fresh_nest src, moved here
│   │   ├── src/
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── vitest.config.ts
│   │   ├── playwright.config.ts
│   │   ├── tsconfig.json
│   │   ├── tsconfig.app.json
│   │   └── package.json
│   └── fsm/                         ← NEW — staff portal
│       ├── src/
│       │   ├── components/
│       │   │   ├── auth/            ← FSM-specific auth (email/password)
│       │   │   ├── shifts/          ← shift listing, claim flow
│       │   │   ├── jobs/            ← checklist, photo upload, check-in
│       │   │   ├── admin/           ← pay rates, staff profiles, templates
│       │   │   └── ui/              ← FSM-specific UI atoms
│       │   ├── hooks/
│       │   ├── i18n/
│       │   │   └── locales/
│       │   │       ├── en.json      ← FSM-specific strings only
│       │   │       ├── fr.json
│       │   │       └── ar.json      ← NEW — P10 Ahmed requirement
│       │   ├── lib/
│       │   │   ├── firebase/        ← copies of firebase.ts (same init, same project)
│       │   │   └── utils/
│       │   ├── pages/
│       │   ├── types/
│       │   │   └── index.ts         ← FSM-specific types (Staff, Job, etc.)
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── public/
│       │   ├── manifest.json        ← PWA manifest
│       │   └── sw.js                ← service worker (offline support)
│       ├── index.html
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   └── shared/                      ← shared code (future — start empty)
│       ├── src/
│       │   └── index.ts             ← export point (start with nothing)
│       └── package.json
├── functions/                       ← unchanged — shared Cloud Functions
├── docs/                            ← unchanged — shared governance
├── firestore.rules                  ← unchanged location — single source
├── firestore.dev.rules              ← unchanged location
├── firestore.indexes.json           ← unchanged location
├── firebase.json                    ← updated — adds freshnest-fsm target
├── .firebaserc                      ← updated — adds freshnest-fsm mapping
├── .gitignore                       ← updated — covers both apps
├── CLAUDE.md                        ← updated — covers both apps
├── GEMINI.md                        ← updated symlink
├── package.json                     ← NEW root — npm workspaces config
└── README.md                        ← updated — ecosystem overview
```

---

## B6. Why a PWA, Not a Native App

The FSM staff portal should be built as a **Progressive Web App (PWA)** — not a native iOS/Android application. This is the correct choice for this context for four reasons:

**1. The Firebase stack already supports it.** Firestore's `persistentLocalCache` API (enabled via `initializeFirestore`) gives the FSM full offline read/write capability with automatic sync on reconnect. Staff can complete a checklist while in a basement with no signal. When they step outside, Firestore silently syncs the completed tasks and photo uploads. This is native-app-quality offline behaviour with zero additional infrastructure.

**2. Distribution is instant, updates are zero-friction.** A native app requires app store submission, review, and user-prompted updates. A PWA deploys via `firebase deploy` and every staff member gets the update the next time they open the browser. For a small cleaning operation where Ryan is the sole developer, this operational simplicity is significant. PWAs can be installed to the home screen on both iOS (Safari "Add to Home Screen") and Android (Chrome install prompt), giving staff a native-feeling launcher icon.

**3. Ahmed's multilingual requirement is better served by a web app.** Arabic RTL layout in a React PWA is handled by the i18n library and standard HTML `dir="rtl"` — the same techniques used for French on the customer site. Native apps require separate locale bundles and platform-specific RTL work on both iOS and Android.

**4. Photo upload and geolocation work in modern mobile browsers.** The `<input type="file" accept="image/*" capture="environment">` attribute triggers the device camera directly on mobile browsers. The Geolocation API is available and reliable in mobile Chrome and Safari with HTTPS. Firebase Storage upload from a PWA is identical to a native app's Firebase SDK integration. Brenda's photo requirement (P11) is fully achievable without a native app.

**PWA additions required for the FSM app (not present in customer site):**
- `manifest.json` in `apps/fsm/public/` — app name, icons, `display: standalone`, `start_url`
- Service worker registration in `apps/fsm/src/main.tsx`
- `initializeFirestore` with `persistentLocalCache` instead of `getFirestore` for the FSM's Firestore instance
- `vite-plugin-pwa` (from `@vite-pwa/vite-plugin`) to generate the service worker and manifest injection

---

---

# PART C — Getting Started

This section contains the exact steps to go from the current `fresh_nest` flat repo to the monorepo structure with the FSM portal initialized and deploying. These are ordered steps — do not skip or reorder.

---

## C1. Prerequisites — Confirm Before Starting

```bash
# In the fresh_nest Codespace:
node -v          # must be v20+
npm -v           # must be v10+ (npm workspaces support)
firebase --version  # must be v13+

# Confirm the fresh_nest repo is clean (no uncommitted changes)
git status       # should show "nothing to commit"

# Confirm production deploy still passes before restructuring
npm run build && echo "✅ Build clean"
```

---

## C2. Step 1 — Restructure the Existing Repo

```bash
# From the fresh_nest repo root:

# 1. Create the new directory structure
mkdir -p apps/customer apps/fsm packages/shared/src

# 2. Move ALL existing customer site files into apps/customer/
#    List of items to move (everything except .git, docs/, functions/, firestore.*, firebase.json, .firebaserc, CLAUDE.md, GEMINI.md, README.md)
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
mv coverage apps/customer/ 2>/dev/null || true

# 3. Create apps/customer/package.json (workspace member)
cat > apps/customer/package.json << 'EOF'
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
EOF
# NOTE: dependencies stay in the root package.json — see Step 3

# 4. Create packages/shared/package.json
cat > packages/shared/package.json << 'EOF'
{
  "name": "@freshnest/shared",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" }
}
EOF

cat > packages/shared/src/index.ts << 'EOF'
// Shared package — currently empty.
// Future: move firebase.ts, animations.ts, cn() here when both apps need them.
// See docs/decisions/ADR-010 for the shared package strategy.
export {}
EOF
```

---

## C3. Step 2 — Create the Root `package.json` with npm Workspaces

```bash
cat > package.json << 'EOF'
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
    "lint": "npm --workspaces run lint --if-present",
    "deploy:functions": "firebase deploy --only functions"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@playwright/test": "^1.60.0",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^24.13.1",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "@vitest/coverage-v8": "^4.1.8",
    "autoprefixer": "^10.5.0",
    "eslint": "^10.3.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.6.0",
    "jsdom": "^29.1.1",
    "postcss": "^8.5.15",
    "prettier": "^3.8.3",
    "prettier-plugin-tailwindcss": "^0.8.0",
    "tailwindcss": "^3.4.19",
    "typescript": "~6.0.2",
    "typescript-eslint": "^8.59.2",
    "vite": "^8.0.12",
    "vite-plugin-pwa": "^1.0.0",
    "vitest": "^4.1.8"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.4.0",
    "@tanstack-query-firebase/react": "^2.1.1",
    "@tanstack/react-query": "^5.101.0",
    "clsx": "^2.1.1",
    "firebase": "^12.14.0",
    "framer-motion": "^12.40.0",
    "i18next": "^26.3.1",
    "i18next-browser-languagedetector": "^8.2.1",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "react-hook-form": "^7.77.0",
    "react-i18next": "^17.0.8",
    "react-router-dom": "^7.17.0",
    "recharts": "^3.8.1",
    "tailwind-merge": "^3.6.0",
    "zod": "^4.4.3"
  }
}
EOF

# Remove the old package.json that was in the root (now moved to apps/customer)
# The root package.json above IS the new one.

# Install to create the unified node_modules
npm install
```

---

## C4. Step 3 — Update Path References in Customer App

The customer app's Vite and TypeScript configs used `path.resolve(__dirname, './src')` — that path is still correct because `vite.config.ts` is now inside `apps/customer/`. Verify:

```bash
# Confirm the customer build still passes from the new location
cd apps/customer
npx tsc -b --noEmit
cd ../..
npm run build:customer
# Must pass with zero errors
```

If `tsconfig.app.json` has references to `../../` paths, update them. The `@/*` alias in `vite.config.ts` resolves relative to the config file's location, which is correct.

---

## C5. Step 4 — Update `firebase.json` for Two Build Targets

```bash
cat > firebase.json << 'ENDJSON'
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": ["node_modules", ".git", "firebase-debug.log", "firebase-debug.*.log", "*.local"]
    }
  ],
  "hosting": [
    {
      "target": "freshnest-prod",
      "public": "apps/customer/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }],
      "headers": [
        { "source": "**/*.@(js|css|woff2)", "headers": [
            { "key": "Cache-Control", "value": "max-age=31536000, immutable" }
        ]},
        { "source": "**", "headers": [
            { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
            { "key": "X-Content-Type-Options", "value": "nosniff" },
            { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://lh3.googleusercontent.com; frame-ancestors 'none';" }
        ]}
      ]
    },
    {
      "target": "freshnest-dev",
      "public": "apps/customer/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }],
      "headers": [
        { "source": "**", "headers": [
            { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
            { "key": "X-Content-Type-Options", "value": "nosniff" }
        ]}
      ]
    },
    {
      "target": "freshnest-fsm",
      "public": "apps/fsm/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }],
      "headers": [
        { "source": "**/*.@(js|css|woff2)", "headers": [
            { "key": "Cache-Control", "value": "max-age=31536000, immutable" }
        ]},
        { "source": "**", "headers": [
            { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
            { "key": "X-Content-Type-Options", "value": "nosniff" },
            { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://firebasestorage.googleapis.com; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://firebasestorage.googleapis.com; frame-ancestors 'none';" }
        ]}
      ]
    }
  ],
  "firestore": [
    { "database": "(default)", "rules": "firestore.rules", "indexes": "firestore.indexes.json" },
    { "database": "freshnest-dev", "rules": "firestore.dev.rules", "indexes": "firestore.indexes.json" }
  ],
  "emulators": { "firestore": { "port": 8080 }, "hosting": { "port": 5001 }, "ui": { "enabled": true } }
}
ENDJSON
```

**Note on the FSM CSP:** The FSM CSP adds `blob:` to `img-src` (for camera capture preview) and `https://firebasestorage.googleapis.com` to both `connect-src` and `img-src` (for Brenda's photo uploads and display). The customer site CSP does not need these.

---

## C6. Step 5 — Register the FSM Hosting Site in Firebase Console

This is a manual step that cannot be scripted.

1. Open [Firebase Console](https://console.firebase.google.com) → project `freshnest-aa51e`
2. Go to **Hosting** → **Add another site**
3. Site ID: `freshnest-fsm` → Create site
4. Update `.firebaserc` to add the new target mapping:

```json
{
  "projects": { "default": "freshnest-aa51e" },
  "targets": {
    "freshnest-aa51e": {
      "hosting": {
        "freshnest-prod": ["lilypad-freshnest"],
        "freshnest-dev":  ["lilypad-freshnest-dev"],
        "freshnest-fsm":  ["freshnest-fsm"]
      }
    }
  },
  "etags": {}
}
```

5. Enable **Firebase Storage** if not already enabled: Console → Storage → Get Started → choose `northamerica-northeast1` (same region as Firestore)

---

## C7. Step 6 — Scaffold the FSM App

```bash
# From the monorepo root:
cd apps/fsm

# Initialize package.json for the FSM app
cat > package.json << 'EOF'
{
  "name": "@freshnest/fsm",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 5174",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
EOF

# Create directory structure
mkdir -p src/{components/{auth,shifts,jobs,admin,ui},hooks,i18n/locales,lib/{firebase,utils},pages,types,test}
mkdir -p public/icons

# TypeScript config
cat > tsconfig.json << 'EOF'
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
EOF

cat > tsconfig.app.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
EOF

cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
EOF

# Vite config with PWA plugin
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Fresh Nest Staff Portal',
        short_name: 'FN Staff',
        description: 'Fresh Nest Co. — Staff scheduling and job management',
        theme_color: '#5b7e8f',
        background_color: '#fdfaf6',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Firestore offline persistence handles data — service worker handles app shell only
        runtimeCaching: [],
      },
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: { outDir: 'dist' },
})
EOF

# Tailwind (identical to customer site — shared design system)
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'slate-brand':  '#5b7e8f',
        'slate-dark':   '#3f5f6e',
        'slate-light':  '#7fa0b0',
        'slate-pale':   '#d6e5ec',
        cream:          '#f7f3ee',
        'warm-white':   '#fdfaf6',
        sand:           '#e8ddd0',
        'sand-dark':    '#c4b09a',
        charcoal:       '#2c3a40',
        'text-muted':   '#7a8f96',
        // FSM-specific status colours
        'status-safe':    '#4d9221',
        'status-caution': '#f9cd0b',
        'status-danger':  '#c21f39',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        sub:     ['Marcellus', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      maxWidth: { content: '1240px' },
    },
  },
  plugins: [],
}
EOF

cat > postcss.config.js << 'EOF'
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
EOF

# index.html
cat > index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
    <title>Fresh Nest — Staff Portal</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

cd ../..
```

---

## C8. Step 7 — FSM Core Source Files

```bash
# src/index.css
cat > apps/fsm/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { font-family: 'DM Sans', sans-serif; scroll-behavior: smooth; }
  body { @apply bg-warm-white text-charcoal; }
  
  /* RTL support for Ahmed (P10) */
  [dir="rtl"] { font-family: 'DM Sans', 'Noto Sans Arabic', sans-serif; }
}
EOF

# src/lib/utils/utils.ts
cat > apps/fsm/src/lib/utils/utils.ts << 'EOF'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
EOF

# src/lib/firebase/firebase.ts
# NOTE: Identical init to customer site. Same project, same env vars.
# FSM uses initializeFirestore with persistentLocalCache for offline support.
cat > apps/fsm/src/lib/firebase/firebase.ts << 'EOF'
import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const app = initializeApp({
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
})

// FSM uses persistentLocalCache for offline support (P8 Jasmine transit gaps, P11 Brenda basement photos)
// This replaces getFirestore(app, dbId) from the customer site.
const dbId = import.meta.env.VITE_FIRESTORE_DB_ID ?? '(default)'
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
}, dbId)

export const auth = getAuth(app)
export const storage = getStorage(app)  // P11 Brenda — photo evidence
export default app
EOF

# src/types/index.ts — FSM-specific types
cat > apps/fsm/src/types/index.ts << 'EOF'
// FSM Platform Types — do not merge with customer site types
// Customer site types live in apps/customer/src/types/index.ts

export type StaffLanguage = 'en' | 'fr' | 'ar'  // P10 Ahmed adds Arabic
export type TransportMode = 'personal_vehicle' | 'transit' | 'rideshare' | 'walk'
export type StaffRole = 'cleaner' | 'lead' | 'supervisor'
export type StaffStatus = 'onboarding' | 'active' | 'inactive'
export type JobStatus = 'unassigned' | 'assigned' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'
export type TaskIconType = 'mop' | 'toilet' | 'trash' | 'key' | 'bed' | 'oven' | 'fridge' | 'window' | 'photo' | 'check' | 'vacuum' | 'sink'
export type EarningsSafetyState = 'safe' | 'caution' | 'at_limit'

export interface BlockedWindow {
  id: string
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0 = Sunday
  startTime: string  // 'HH:MM'
  endTime: string    // 'HH:MM'
  recurring: boolean
  date?: string      // ISO date — for one-time blocks only
  label: string      // staff-private label (e.g. 'Recovery meeting')
}

export interface TermsAcceptance {
  version: string
  acceptedAt: Date
  ipAddress?: string
}

export interface PayRateSnapshot {
  rateId: string
  amount: number
  currency: 'CAD'
  effectiveAt: string  // ISO timestamp
  snapshotAt: string   // ISO timestamp
}

export interface Staff {
  id: string
  uid: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: StaffRole
  status: StaffStatus
  preferences: {
    language: StaffLanguage
  }
  constraints: {
    transportMode: TransportMode
    transitBufferMinutes: number
    blockedWindows: BlockedWindow[]
  }
  financials: {
    monthlyEarningsLimit: number | null
    currentMonthEarnings: number
    earningsHistory: Array<{ month: string; total: number }>
  }
  compliance: {
    acceptedTermsVersion: string
    termsHistory: TermsAcceptance[]
  }
  onboardingChecklist: Record<string, boolean>
  createdAt: Date
}

export interface ChecklistTask {
  id: string
  labelKey: string  // i18n key
  icon: TaskIconType
  requiresPhoto: boolean
  photoPhase?: 'before' | 'after'
}

export interface ChecklistTemplate {
  id: string
  name: string
  serviceType: string
  tasks: ChecklistTask[]
  active: boolean
}

export interface JobPhoto {
  id: string
  taskId: string
  url: string
  capturedAt: Date
  geoLat: number | null
  geoLng: number | null
  geoTagged: boolean
  staffId: string
}

export interface ChecklistCompletion {
  taskId: string
  completedAt: Date
  photos: JobPhoto[]
}

export interface Job {
  id: string
  bookingId: string
  clientName: string
  clientAddress: string
  clientPhone: string
  clientNotes?: string
  serviceType: string
  scheduledDate: string  // YYYY-MM-DD
  scheduledStartTime: string  // HH:MM
  scheduledEndTime: string    // HH:MM
  status: JobStatus
  assignedTo: string | null   // Staff UID
  checkedInAt: Date | null
  checkedInGeo: { lat: number; lng: number } | null
  completedAt: Date | null
  payRateSnapshot: PayRateSnapshot
  checklistTemplate: string   // ChecklistTemplate ID (snapshot at creation)
  checklistCompletions: ChecklistCompletion[]
  photos: JobPhoto[]
  createdAt: Date
}

export interface PayRate {
  id: string
  role: StaffRole
  amount: number
  currency: 'CAD'
  effectiveFrom: Date
  effectiveTo: Date | null
  createdBy: string
  createdAt: Date
}

export interface AuditEntry {
  id: string
  collection: string
  documentId: string
  field: string
  oldValue: unknown
  newValue: unknown
  changedBy: string
  changedAt: Date
  reason: string | null
  overrideType: string | null
}
EOF

# src/main.tsx
cat > apps/fsm/src/main.tsx << 'EOF'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@/i18n'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
EOF

# src/App.tsx — skeleton with placeholder routes
cat > apps/fsm/src/App.tsx << 'EOF'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

// Placeholder — replaced epic-by-epic
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-white">
      <div className="text-center">
        <h1 className="font-display text-3xl text-charcoal">{title}</h1>
        <p className="mt-2 font-body text-text-muted">Fresh Nest Co. — Staff Portal</p>
        <p className="mt-1 font-body text-sm text-text-muted">Epic in progress</p>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/',       element: <PlaceholderPage title="Staff Dashboard" /> },
  { path: '/shifts', element: <PlaceholderPage title="Available Shifts" /> },
  { path: '/jobs',   element: <PlaceholderPage title="My Jobs" /> },
  { path: '/login',  element: <PlaceholderPage title="Staff Login" /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
EOF

# src/i18n/index.ts — FSM i18n with Arabic support
cat > apps/fsm/src/i18n/index.ts << 'EOF'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import fr from './locales/fr.json'
import ar from './locales/ar.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr', 'ar'],
    detection: { order: ['localStorage', 'navigator'] },
    interpolation: { escapeValue: false },
  })

// Set RTL direction for Arabic
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
})

export default i18n
EOF

# Locale files — minimal stubs
cat > apps/fsm/src/i18n/locales/en.json << 'EOF'
{
  "fsm": {
    "portal": "Staff Portal",
    "dashboard": "Dashboard",
    "shifts": "Available Shifts",
    "myJobs": "My Jobs",
    "login": "Sign In",
    "logout": "Sign Out"
  }
}
EOF

cat > apps/fsm/src/i18n/locales/fr.json << 'EOF'
{
  "fsm": {
    "portal": "Portail du personnel",
    "dashboard": "Tableau de bord",
    "shifts": "Quarts disponibles",
    "myJobs": "Mes mandats",
    "login": "Connexion",
    "logout": "Déconnexion"
  }
}
EOF

cat > apps/fsm/src/i18n/locales/ar.json << 'EOF'
{
  "fsm": {
    "portal": "بوابة الموظفين",
    "dashboard": "لوحة التحكم",
    "shifts": "الوردیات المتاحة",
    "myJobs": "وظائفي",
    "login": "تسجيل الدخول",
    "logout": "تسجيل الخروج"
  }
}
EOF

# Environment file for FSM dev (gitignored)
cat > apps/fsm/.env.local << 'EOF'
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=freshnest-aa51e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=freshnest-aa51e
VITE_FIREBASE_STORAGE_BUCKET=freshnest-aa51e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=521227407391
VITE_FIREBASE_APP_ID=
VITE_FIRESTORE_DB_ID=freshnest-dev
EOF
# NOTE: Fill in VITE_FIREBASE_API_KEY and VITE_FIREBASE_APP_ID from .env.local in apps/customer/

# .gitignore for FSM app
cat > apps/fsm/.gitignore << 'EOF'
node_modules
dist
.env.local
.env.production
.firebase/
*.tsbuildinfo
EOF
```

---

## C9. Step 8 — Verify the FSM App Builds

```bash
# Install FSM app dependencies (resolved from root node_modules via workspaces)
npm install

# Build the FSM app
npm run build:fsm
# Expected: apps/fsm/dist/ created with index.html

# Run the FSM dev server
npm run dev:fsm
# Expected: local server at http://localhost:5174 showing the placeholder dashboard

# Verify customer site still builds
npm run build:customer
# Expected: apps/customer/dist/ created, identical to before
```

---

## C10. Step 9 — Update GitHub Actions

Update `.github/workflows/firebase-deploy.yml` to deploy both apps on push to `main`:

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy-customer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - name: Build customer site (prod DB)
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_FIRESTORE_DB_ID: "(default)"
        run: npm run build:customer
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: freshnest-aa51e
          channelId: live
          target: freshnest-prod

  deploy-fsm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - name: Build FSM portal (prod DB)
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_FIRESTORE_DB_ID: "(default)"
        run: npm run build:fsm
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: freshnest-aa51e
          channelId: live
          target: freshnest-fsm
```

---

## C11. Step 10 — Firestore Rules Extension for FSM Collections

Add the following to both `firestore.rules` and `firestore.dev.rules` **before** the wildcard deny-all rule:

```javascript
// ── FSM Collections ──────────────────────────────────────────────────────────

// Staff profiles
// - Self-read for own profile (staff portal)
// - Admin read/write (admin dashboard)
// - No staff member can read another staff member's profile
match /staff/{staffId} {
  allow read:  if (request.auth != null && request.auth.uid == staffId) || isAdmin();
  allow write: if isAdmin();
}

// Jobs
// - Assigned staff member can read their own jobs and update status/checklist only
// - Admin read/write all
match /jobs/{jobId} {
  allow read:   if (request.auth != null && resource.data.assignedTo == request.auth.uid) || isAdmin();
  allow create: if isAdmin();
  allow update: if isAdmin()
    || (request.auth != null
        && resource.data.assignedTo == request.auth.uid
        && request.resource.data.diff(resource.data).affectedKeys()
             .hasOnly(['status', 'checkedInAt', 'checkedInGeo', 'completedAt', 'checklistCompletions'])
       );
  allow delete: if false;
}

// Pay rates — admin only
match /payRates/{rateId} {
  allow read:   if isAdmin();
  allow create: if isAdmin();
  allow update, delete: if false;  // Immutable — create new rate instead
}

// Audit log — write from Cloud Functions (service account) only, admin read
match /auditLog/{logId} {
  allow read:   if isAdmin();
  allow create: if false;   // Only Cloud Functions (service account) write to this
  allow update, delete: if false;
}

// Checklist templates — admin write, assigned staff read
match /checklistTemplates/{templateId} {
  allow read:  if request.auth != null;  // Any authenticated user (staff or admin)
  allow write: if isAdmin();
}

// Staff notifications — self-read, system write (Cloud Functions)
match /notifications/{staffId}/messages/{messageId} {
  allow read:   if request.auth != null && request.auth.uid == staffId;
  allow create: if false;   // Only Cloud Functions write
  allow update, delete: if false;
}
```

---

## C12. Step 11 — Go / No-Go Checklist

```
[ ] npm run build:customer — passes, zero TypeScript errors
[ ] npm run build:fsm — passes, zero TypeScript errors
[ ] apps/fsm/dist/ exists with index.html
[ ] apps/customer/dist/ exists with index.html (unchanged from before migration)
[ ] firebase.json has three hosting targets: freshnest-prod, freshnest-dev, freshnest-fsm
[ ] .firebaserc has freshnest-fsm mapping to the new Firebase Hosting site
[ ] Firebase Console shows freshnest-fsm hosting site exists
[ ] Firebase Storage is enabled in the freshnest-aa51e project
[ ] firestore.rules and firestore.dev.rules include FSM collection rules
[ ] firestore.rules deployed: firebase deploy --only firestore:rules
[ ] FSM portal loads at http://localhost:5174 with placeholder dashboard
[ ] Customer site loads at http://localhost:5173 — no regression
[ ] GitHub Actions: push to main deploys both apps
[ ] docs/PERSONAS.md v3.0 committed (P7–P12 added — from prior output)
[ ] CLAUDE.md updated to reference both apps and FSM plan
[ ] ADR-009, ADR-010, ADR-011 committed to docs/decisions/
```

---

---

# PART D — Updated Epic Map with Current-State Notes

*Epics F01–F15 are unchanged from v1. Each now includes a "Current State" note reflecting the June 13 codebase.*

| Epic | Name | Current State |
|---|---|---|
| F01 | FSM Hosting + Auth | **Not started.** Steps C2–C11 above complete this. |
| F02 | Staff Profile Management | **Not started.** Depends on F01. Admin hooks (`useAdminAuth`) can be adapted — Firebase Auth is already initialized. |
| F03 | Booking → Job Pipeline | **Partial.** `onBookingCreated` exists. `onBookingStatusConfirmed` does not. Cloud Function infrastructure (Resend, Twilio, secrets pattern) is production-ready — new triggers follow the same pattern. |
| F04 | Pay Rate Management | **Not started.** `payRates` collection does not exist. |
| F05 | Earnings Cap (P7 Carla) | **Not started.** Depends on F02. |
| F06 | Travel Buffer (P8 Jasmine) | **Not started.** Depends on F02. |
| F07 | Blocked Windows (P9 Mike) | **Not started.** Depends on F02. |
| F08 | Shift View + Claim | **Not started.** Depends on F05–F07. |
| F09 | Check-in + Checklist + Photos | **Not started.** Firebase Storage exists in project; `getStorage()` not yet called in any app code. |
| F10 | Checklist Templates | **Not started.** Depends on F03 (jobs need template at creation). |
| F11 | Audit Log UI | **Not started.** Depends on F02–F07 (entries generated throughout). |
| F12 | Terms Management | **Not started.** Depends on F01. |
| F13 | Employment Record Export | **Not started.** Depends on F11, F12. |
| F14 | Operations Dashboard | **Partial.** `AnalyticsDashboard.tsx` in the admin app handles booking analytics. Job-level metrics (completion rate, cleaner utilisation) need the `jobs` collection which depends on F03. Recharts is already installed. |
| F15 | Staff Notifications | **Partial.** Twilio SMS infrastructure exists in `functions/src/sendSms.ts`. In-app notifications subcollection does not exist. |

---

---

# PART E — Architecture Reference

---

## E1. Why `initializeFirestore` with `persistentLocalCache` for FSM (Not `getFirestore`)

The customer site uses `getFirestore(app, dbId)`. The FSM portal uses `initializeFirestore(app, { localCache: persistentLocalCache() }, dbId)`.

The difference matters for the staff-use cases. Jasmine (P8) rides transit — she may be underground or in a dead zone between two jobs. Brenda (P11) takes photos in client basements with no signal. Ahmed (P10) checks his shift list before leaving the house on mobile data. In all three cases, the FSM needs to serve data from cache when the network is unavailable and sync writes when it returns.

`persistentLocalCache` (the current Firestore SDK v9+ API, replacing the deprecated `enablePersistence()`) activates IndexedDB-backed offline storage. Every document the user has read is available offline. Every write made offline is queued and synced automatically on reconnect. Combined with the PWA service worker (which caches the app shell), the FSM portal functions completely offline.

The customer site does not need this because customers only interact with it once to submit a booking — they do not need offline access to booking data.

---

## E2. Auth Separation Summary

| Portal | Auth Method | Auth Provider | User type |
|---|---|---|---|
| Customer site `/admin` | Google OAuth | `GoogleAuthProvider` | Ryan + admin emails only |
| FSM staff portal | Email/Password + magic link | `EmailAuthProvider` + `sendSignInLinkToEmail` | All staff |

Both use the same Firebase Auth instance (`freshnest-aa51e`). They do not conflict. Firebase Auth supports multiple providers per user.

The FSM's `useStaffAuth` hook (to be built in F01) uses `signInWithEmailAndPassword` for the primary flow and `sendSignInLinkToEmail` for passwordless magic link (useful for Ahmed who may prefer not to manage a password).

---

## E3. ADR Index

| ADR | Decision | Status |
|---|---|---|
| ADR-009 | Custom FSM build over third-party (ZenMaid/Jobber) | Proposed — requires Ryan approval |
| ADR-010 | Monorepo with npm workspaces (not separate repo, not flat structure) | **Proposed — recommend Accepted** |
| ADR-011 | Staff auth via email/password + magic link | Proposed |
| ADR-012 | FSM as PWA with `persistentLocalCache` for offline support | **New in v2 — Proposed** |

---

## E4. The `packages/shared/` Strategy — When to Use It

The `packages/shared/` directory starts empty. The rule for moving something into it is: **only move code that is actively needed by both apps and that causes a maintenance problem when duplicated**.

In practice, this means the shared package stays empty during F01–F07. If, during F08 or later, you find yourself copy-pasting a bug fix from `apps/customer/src/lib/firebase/firebase.ts` to `apps/fsm/src/lib/firebase/firebase.ts`, that is the signal to extract the shared init into `packages/shared/src/firebase.ts`.

Do not pre-optimize. Empty shared package at launch is correct.

---

*This plan supersedes FSM Plan v1. Epic specifications (F01–F15) from v1 are unchanged except for the Current State notes added in Part D.*  
*v2.0 — Adds codebase gap analysis (Part A), repository strategy deep dive (Part B), and complete getting-started guide (Part C).*
