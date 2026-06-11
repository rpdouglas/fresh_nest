# Fresh Nest Co. — Cleaning & Organizing Services

This repository contains the codebase for the **Fresh Nest Co.** cleaning services platform, serving Cornwall ON, Akwesasne, Snye QC, Long Sault, and Morrisburg.

Live website: [lilypad-freshnest.web.app](https://lilypad-freshnest.web.app)

---

## 🛠 Tech Stack

*   **Frontend**: React 19, TypeScript (strict), Vite, Tailwind CSS v3.4.x (using token names, not Tailwind v4)
*   **Routing**: React Router v6 (multi-page)
*   **Form Management**: React Hook Form + Zod validation
*   **Animations**: Framer Motion
*   **Internationalization**: react-i18next (fully bilingual English/French)
*   **Data & Auth**: TanStack Query v5 + Firebase (Auth, Firestore, Hosting, Cloud Functions)

---

## 📂 Codebase & Docs Reference

Before modifying this project, please read the following guidelines:
*   [CLAUDE.md](file:///workspaces/fresh_nest/CLAUDE.md) — Main developer context, commands, and code styling rules.
*   [GEMINI.md](file:///workspaces/fresh_nest/GEMINI.md) — AI Agent rules and persona-based development gates.
*   [docs/PERSONAS.md](file:///workspaces/fresh_nest/docs/PERSONAS.md) — The 6 core user personas that drive all feature acceptance criteria.
*   [docs/firestore-schema.md](file:///workspaces/fresh_nest/docs/firestore-schema.md) — The strict datastore schema. Never write fields not defined here.
*   [docs/design-system.md](file:///workspaces/fresh_nest/docs/design-system.md) — Brand design tokens and Tailwind configuration mapping.
*   [docs/COMPLIANCE.md](file:///workspaces/fresh_nest/docs/COMPLIANCE.md) — Privacy rules, CASL compliance, and data practices.

---

## ⚙️ Environment Configuration

The application uses the following environment variables. Local settings can be set in `.env.local` (which is gitignored).

| Variable Name | Type | Purpose / Allowed Values |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | `string` | Public Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `string` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `string` | Project ID (`freshnest-aa51e`) |
| `VITE_FIREBASE_STORAGE_BUCKET` | `string` | Storage bucket address |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `string` | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | `string` | Firebase Web App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | `string` | GA4 / Analytics Measurement ID |
| `VITE_FIRESTORE_DB_ID` | `string` | DB target: `(default)` (Prod) \| `freshnest-dev` (Dev/Test) |

*Note: Production values are injected via GitHub Secrets in CI/CD workflows and are not committed.*

---

## 🗄 Database Isolation Architecture

We enforce database isolation using **two separate Firestore databases** in a single Firebase project (see [ADR-002](file:///workspaces/fresh_nest/docs/decisions/ADR-002-firestore-multidb.md)):
1.  **`(default)`** — Hosts production customer bookings and analytics.
2.  **`freshnest-dev`** — Hosts development, staging, and PR preview channel mock data.

Database connection routing is driven at build time by the `VITE_FIRESTORE_DB_ID` variable in [src/lib/firebase.ts](file:///workspaces/fresh_nest/src/lib/firebase.ts).

---

## 🚀 Running Locally

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Run development server**:
    ```bash
    npm run dev
    ```
3.  **Run unit tests**:
    ```bash
    npm run test
    ```
4.  **Run E2E integration tests**:
    ```bash
    npm run test:e2e
    ```
5.  **Build production package**:
    ```bash
    npm run build
    ```
6.  **Run ESLint checking**:
    ```bash
    npm run lint
    ```
