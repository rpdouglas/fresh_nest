# Codebase Export: fresh_nest

Generated on: 2026-06-13 21:08:03 UTC  
Total Files: 124  

## Directory Structure

```
.
├── .github
│   └── workflows
│       ├── docs-check.yml
│       ├── firebase-deploy.yml
│       └── firebase-preview.yml
├── coverage
│   ├── lcov-report
│   │   ├── components
│   │   │   └── layout
│   │   │       ├── CookieBanner.tsx.html
│   │   │       └── index.html
│   │   ├── lib
│   │   │   ├── analytics.ts.html
│   │   │   ├── index.html
│   │   │   └── utils.ts.html
│   │   ├── base.css
│   │   ├── block-navigation.js
│   │   ├── index.html
│   │   ├── prettify.css
│   │   ├── prettify.js
│   │   └── sorter.js
│   └── lcov.info
├── e2e
│   ├── analytics.spec.ts
│   ├── booking.spec.ts
│   ├── language.spec.ts
│   └── phase4.spec.ts
├── functions
│   ├── src
│   │   ├── emailTemplates.ts
│   │   ├── index.ts
│   │   ├── sendEmail.ts
│   │   ├── sendSms.ts
│   │   └── smsTemplates.ts
│   ├── .gitignore
│   ├── package.json
│   └── tsconfig.json
├── public
│   ├── icons
│   ├── images
│   │   ├── gallery
│   │   └── team
│   └── site.webmanifest
├── src
│   ├── assets
│   ├── components
│   │   ├── admin
│   │   │   ├── hooks
│   │   │   │   ├── useAdminAnalytics.ts
│   │   │   │   ├── useAdminAuth.ts
│   │   │   │   └── useBookings.ts
│   │   │   ├── AccessDeniedPanel.tsx
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── BookingDetailPanel.tsx
│   │   │   ├── BookingsTable.tsx
│   │   │   └── LoginPanel.tsx
│   │   ├── booking
│   │   │   ├── BookingStep1.tsx
│   │   │   ├── BookingStep2.tsx
│   │   │   ├── BookingStep3.tsx
│   │   │   ├── BookingStep4.tsx
│   │   │   └── StepIndicator.tsx
│   │   ├── home
│   │   │   ├── GalleryPreview.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── MeetTheTeam.tsx
│   │   │   ├── QuoteCalculator.tsx
│   │   │   ├── RecurringCTA.tsx
│   │   │   ├── Reviews.tsx
│   │   │   ├── ServicesGrid.tsx
│   │   │   └── TrustBar.tsx
│   │   ├── layout
│   │   │   ├── CookieBanner.test.tsx
│   │   │   ├── CookieBanner.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── Navbar.tsx
│   │   ├── seo
│   │   │   ├── JsonLd.tsx
│   │   │   └── SEO.tsx
│   │   └── ui
│   │       ├── GalleryImage.tsx
│   │       ├── Lightbox.tsx
│   │       └── TeamAvatar.tsx
│   ├── hooks
│   │   └── useScrolled.ts
│   ├── i18n
│   │   ├── locales
│   │   │   ├── en.json
│   │   │   └── fr.json
│   │   └── index.ts
│   ├── lib
│   │   ├── data
│   │   │   ├── blogData.ts
│   │   │   ├── galleryData.ts
│   │   │   ├── locationData.ts
│   │   │   ├── reviewsData.ts
│   │   │   └── serviceData.ts
│   │   ├── firebase
│   │   │   ├── analytics.test.ts
│   │   │   ├── analytics.ts
│   │   │   ├── firebase.ts
│   │   │   └── firestore.ts
│   │   ├── schemas
│   │   │   └── bookingSchema.ts
│   │   └── utils
│   │       ├── animations.ts
│   │       ├── quotePricing.ts
│   │       ├── seo.ts
│   │       └── utils.ts
│   ├── pages
│   │   ├── AdminPage.tsx
│   │   ├── AirbnbTurnoverPage.tsx
│   │   ├── Blog.tsx
│   │   ├── BlogPost.tsx
│   │   ├── BookingPage.tsx
│   │   ├── FaqPage.tsx
│   │   ├── Gallery.tsx
│   │   ├── Home.tsx
│   │   ├── LocationPage.tsx
│   │   ├── LocationsOverview.tsx
│   │   ├── PlaceholderPage.tsx
│   │   ├── PricingPage.tsx
│   │   ├── ServicePage.tsx
│   │   ├── ServicesOverview.tsx
│   │   └── ThankYouPage.tsx
│   ├── test
│   │   └── setup.ts
│   ├── types
│   │   └── index.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── user-guide
│   ├── admin-guide.md
│   └── booking-guide.md
├── .env.production
├── .firebaserc
├── .gitignore
├── .mlc-config.json
├── CLAUDE.md
├── eslint.config.js
├── firebase.json
├── firestore.dev.rules
├── firestore.indexes.json
├── firestore.rules
├── GEMINI.md
├── index.html
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── README.md
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

---

## File: .env.production

```
VITE_FIREBASE_API_KEY=AIzaSyC0vpYDeCNk0wYddQadw3kkzCfiVQQv8Bk
VITE_FIREBASE_AUTH_DOMAIN=freshnest-aa51e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=freshnest-aa51e
VITE_FIREBASE_STORAGE_BUCKET=freshnest-aa51e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=521227407391
VITE_FIREBASE_APP_ID=1:521227407391:web:c7d1886cf87a74434e452a
VITE_FIRESTORE_DB_ID=(default)
VITE_ADMIN_EMAILS=lauren@freshnest.co,dev@freshnest.co,rpdouglas@gmail.com,freshnestcompany2023@gmail.com

```

---

## File: .firebaserc

```
{
  "projects": {
    "default": "freshnest-aa51e"
  },
  "targets": {
    "freshnest-aa51e": {
      "hosting": {
        "freshnest-prod": [
          "lilypad-freshnest"
        ],
        "freshnest-dev": [
          "lilypad-freshnest-dev"
        ]
      }
    }
  },
  "etags": {}
}
```

---

## File: .github/workflows/docs-check.yml

```yaml
name: Docs Check
on:
  push:
    paths:
      - 'docs/**'
      - '*.md'
  pull_request:
    paths:
      - 'docs/**'
      - '*.md'

jobs:
  markdown-link-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check markdown links
        uses: gaurav-nelson/github-action-markdown-link-check@v1
        with:
          use-quiet-mode: 'yes'
          use-verbose-mode: 'no'
          config-file: '.mlc-config.json'
          folder-path: 'docs'
          file-extension: '.md'

```

---

## File: .github/workflows/firebase-deploy.yml

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - name: Build (prod DB)
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_FIRESTORE_DB_ID: "(default)"
        run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: freshnest-aa51e
          channelId: live
          target: freshnest-prod

```

---

## File: .github/workflows/firebase-preview.yml

```yaml
name: Deploy Preview Channel
on:
  pull_request:
    types: [opened, synchronize, reopened]
jobs:
  preview:
    runs-on: ubuntu-latest
    permissions: { checks: write, contents: read, pull-requests: write }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - name: Build (dev DB)
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_FIRESTORE_DB_ID: freshnest-dev
        run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: freshnest-aa51e
          target: freshnest-dev
          expires: 7d

```

---

## File: .gitignore

```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Dependencies and Build
node_modules
dist
dist-ssr
*.local
.env.local
.env.production
.firebase/
*.tsbuildinfo

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

```

---

## File: .mlc-config.json

```json
{
  "ignorePatterns": [
    {
      "pattern": "^https://lilypad-freshnest\\.web\\.app"
    },
    {
      "pattern": "^https://freshnest-aa51e\\.web\\.app"
    },
    {
      "pattern": "^https://console\\.firebase\\.google\\.com"
    },
    {
      "pattern": "^https://console\\.cloud\\.google\\.com"
    },
    {
      "pattern": "^file://"
    }
  ],
  "retryOn429": true,
  "retryCount": 3,
  "fallbackRetryDelay": "30s",
  "aliveStatusCodes": [200, 206]
}

```

---

## File: CLAUDE.md

```markdown
# Fresh Nest Co. — AI Agent Context
**Version:** 2.0 | **Updated:** 2025-06-06

Read this file completely before touching any file in this project.

---

## Project
Fresh Nest Co. — Cleaning & Organizing Services.
Serves Cornwall ON, Akwesasne, Snye QC, Long Sault, Morrisburg.
Multi-page React SPA. Firebase backend. Bilingual (EN/FR).
Live: https://lilypad-freshnest.web.app

---

## Stack (exact — ADR required before any change)
- React 19 · TypeScript strict · Vite
- Tailwind CSS v3.4.x — NOT v4
- React Router v6 (multi-page: /, /services/*, /locations/*, etc.)
- TanStack Query v5 + @tanstack-query-firebase/react
- React Hook Form + Zod
- Framer Motion
- react-i18next (bilingual EN/FR — launch requirement)
- clsx + tailwind-merge → cn() at @/lib/utils.ts
- Firebase: Hosting, Firestore (2 DBs), Auth (Phase 5), Functions (Phase 3)

## Tailwind Rules — CRITICAL
THIS IS TAILWIND v3. NOT v4.
- Config file: tailwind.config.js
- Directives in CSS: @tailwind base; @tailwind components; @tailwind utilities;
- DO NOT write @import "tailwindcss" — v4 only
- DO NOT write @theme blocks — v4 only
- DO NOT install @tailwindcss/vite — v4 only
- Token names: slate-brand, slate-dark, slate-light, slate-pale,
  cream, warm-white, sand, sand-dark, charcoal, text-muted
- Font classes: font-display, font-sub, font-body
- Border radius for brand elements: rounded (4px) — not rounded-lg

## Firebase Architecture
- Project: freshnest-aa51e
- Production DB: (default) · Dev DB: freshnest-dev
- DB routing: VITE_FIRESTORE_DB_ID — already wired in src/lib/firebase.ts
- Never hardcode database IDs anywhere except src/lib/firebase.ts

## Bilingual Requirements
- Language: EN (default) + FR
- i18n library: react-i18next — config at src/i18n/index.ts
- All UI strings: in en.json / fr.json — never hardcoded in components
- Language toggle: in Navbar
- Booking Firestore field: language: 'en' | 'fr' — drives email/SMS language
- Confirmation emails and SMS must be sent in the client's selected language
- French copy is required at launch — not Phase 2

---

## PERSONA-BASED DEVELOPMENT CONTRACT

### Six Personas — Read docs/PERSONAS.md Before Every Epic

| ID | Name | Primary Need | Key Feature |
|---|---|---|---|
| P1 | Diane Lafleur | French UX + consistent cleaner | Bilingual + Trust Bar + Team |
| P2 | Travis McLeod | Fast mobile booking + transparent price | Quote Calculator + SMS |
| P3 | Margaret Storey | Accessible design + phone + trust | 48px targets + 16px text + phone in nav |
| P4 | Kahnawà:ke Baptiste | Akwesasne recognition + island service | /locations/akwesasne + notes field |
| P5 | Sophie Tremblay-Gagnon | French UX + eco + Snye QC service | /locations/snye-qc + FR + gallery |
| P6 | Gallagher (Airbnb) | Turnover reliability + photo proof | /services/airbnb-turnover + priority |

### Rule 1 — No persona, no feature
Before implementing any feature, identify which persona(s) it serves.
If you cannot name one, halt and ask. Do not proceed.

### Rule 2 — Persona tests are acceptance criteria
The "Persona Test" in each epic spec is a pass/fail gate for Phase C.
Margaret's booking flow must work at 768px with 48px tap targets.
Diane's confirmation must arrive in French. Travis's flow must take < 3 minutes.
These are not aspirational — they are done conditions.

### Rule 3 — Copy serves personas
- Diane and Sophie receive French copy — use t() always, never hardcode strings
- Margaret's UI: minimum 16px text, 48px touch targets, phone number visible
- Travis's UI: price visible on landing, zero friction, no account creation
- Kahnawà:ke's location page: "We serve Cornwall Island" explicit, not generic
- Gallagher's service page: Airbnb host language, 11am–3pm window explicit

---

## Docs-as-Code Contract

### Read BEFORE writing any code
1. docs/PERSONAS.md — persona is absolute; identify which persona the epic serves
2. docs/firestore-schema.md — schema is law; never invent fields
3. docs/design-system.md — all token names and values
4. docs/COMPLIANCE.md — CASL, data privacy rules
5. docs/projects/[current epic].md — scope and acceptance criteria

### Update in Phase C (ticket close)
1. docs/ACTIVE_CYCLE.md — mark completed tasks ✅
2. docs/firestore-schema.md — ONLY if schema changed
3. docs/reports/ — write [epic]-close-YYYY-MM-DD.md
4. user-guide/ — if user-visible behaviour changed
5. docs/decisions/ — new ADR if permanent architectural choice made

### NEVER modify
- docs/decisions/ADR-*.md once Accepted (immutable)
- docs/PERSONAS.md (human-defined; AI reads only)
- .env.local or any secrets file
- firestore.rules (security changes require human approval)

---

## AGY 3-Phase Gate

### Phase A — Planning Gate
1. Read docs/projects/[epic].md
2. Read docs/PERSONAS.md → identify primary persona(s) for this epic
3. Read docs/design-system.md, firestore-schema.md, COMPLIANCE.md
4. Generate 3-strategy plan in docs/plans/[epic]_PLAN.md
   - Each strategy: files changed, persona impact, risks, schema audit
5. HALT. Wait for human approval.

### Phase B — Execution
1. Execute approved strategy
2. Invoke Brand_Auditor: confirm Tailwind classes vs design-system.md
3. Invoke Data_Steward: confirm no invented Firestore fields
4. Invoke Linguistic_Auditor: confirm all UI strings use t(), no hardcoded EN/FR
5. Run: npm run build && npm run lint
6. Both pass → Phase C. Either fails → halt + write failure report + await human.

### Phase C — Ticket Close
1. Update docs/ACTIVE_CYCLE.md
2. Update docs/firestore-schema.md if schema changed
3. Write docs/reports/[epic]-close-YYYY-MM-DD.md
4. Verify persona test passes (name it explicitly)
5. Update user-guide/ if user-visible behaviour changed
6. Return summary. Stop. Do not commit.

---

## Subagent Roster
- QA_Engineer: npm run test + npm run test:e2e, zero failures
- Brand_Auditor: Tailwind classes vs docs/design-system.md
- Data_Steward: Firestore ops vs docs/firestore-schema.md
- Security_Auditor: firestore.rules vs docs/COMPLIANCE.md
- Linguistic_Auditor: all UI strings use t() hook; no hardcoded EN/FR text
- TypeScript_Strict_Enforcer: strictly enforces TypeScript types, resolving Zod schema mismatches, and fixing `tsc -b` failures without using `any` or `@ts-ignore`

## Git Rules (ABSOLUTE)
- NEVER run git add, git commit, or git push
- NEVER modify ADR files once Accepted
- ALWAYS run npm run build before Phase C close

```

---

## File: GEMINI.md

```markdown
# Fresh Nest Co. — AI Agent Context
**Version:** 2.0 | **Updated:** 2025-06-06

Read this file completely before touching any file in this project.

---

## Project
Fresh Nest Co. — Cleaning & Organizing Services.
Serves Cornwall ON, Akwesasne, Snye QC, Long Sault, Morrisburg.
Multi-page React SPA. Firebase backend. Bilingual (EN/FR).
Live: https://lilypad-freshnest.web.app

---

## Stack (exact — ADR required before any change)
- React 19 · TypeScript strict · Vite
- Tailwind CSS v3.4.x — NOT v4
- React Router v6 (multi-page: /, /services/*, /locations/*, etc.)
- TanStack Query v5 + @tanstack-query-firebase/react
- React Hook Form + Zod
- Framer Motion
- react-i18next (bilingual EN/FR — launch requirement)
- clsx + tailwind-merge → cn() at @/lib/utils.ts
- Firebase: Hosting, Firestore (2 DBs), Auth (Phase 5), Functions (Phase 3)

## Tailwind Rules — CRITICAL
THIS IS TAILWIND v3. NOT v4.
- Config file: tailwind.config.js
- Directives in CSS: @tailwind base; @tailwind components; @tailwind utilities;
- DO NOT write @import "tailwindcss" — v4 only
- DO NOT write @theme blocks — v4 only
- DO NOT install @tailwindcss/vite — v4 only
- Token names: slate-brand, slate-dark, slate-light, slate-pale,
  cream, warm-white, sand, sand-dark, charcoal, text-muted
- Font classes: font-display, font-sub, font-body
- Border radius for brand elements: rounded (4px) — not rounded-lg

## Firebase Architecture
- Project: freshnest-aa51e
- Production DB: (default) · Dev DB: freshnest-dev
- DB routing: VITE_FIRESTORE_DB_ID — already wired in src/lib/firebase.ts
- Never hardcode database IDs anywhere except src/lib/firebase.ts

## Bilingual Requirements
- Language: EN (default) + FR
- i18n library: react-i18next — config at src/i18n/index.ts
- All UI strings: in en.json / fr.json — never hardcoded in components
- Language toggle: in Navbar
- Booking Firestore field: language: 'en' | 'fr' — drives email/SMS language
- Confirmation emails and SMS must be sent in the client's selected language
- French copy is required at launch — not Phase 2

---

## PERSONA-BASED DEVELOPMENT CONTRACT

### Six Personas — Read docs/PERSONAS.md Before Every Epic

| ID | Name | Primary Need | Key Feature |
|---|---|---|---|
| P1 | Diane Lafleur | French UX + consistent cleaner | Bilingual + Trust Bar + Team |
| P2 | Travis McLeod | Fast mobile booking + transparent price | Quote Calculator + SMS |
| P3 | Margaret Storey | Accessible design + phone + trust | 48px targets + 16px text + phone in nav |
| P4 | Kahnawà:ke Baptiste | Akwesasne recognition + island service | /locations/akwesasne + notes field |
| P5 | Sophie Tremblay-Gagnon | French UX + eco + Snye QC service | /locations/snye-qc + FR + gallery |
| P6 | Gallagher (Airbnb) | Turnover reliability + photo proof | /services/airbnb-turnover + priority |

### Rule 1 — No persona, no feature
Before implementing any feature, identify which persona(s) it serves.
If you cannot name one, halt and ask. Do not proceed.

### Rule 2 — Persona tests are acceptance criteria
The "Persona Test" in each epic spec is a pass/fail gate for Phase C.
Margaret's booking flow must work at 768px with 48px tap targets.
Diane's confirmation must arrive in French. Travis's flow must take < 3 minutes.
These are not aspirational — they are done conditions.

### Rule 3 — Copy serves personas
- Diane and Sophie receive French copy — use t() always, never hardcode strings
- Margaret's UI: minimum 16px text, 48px touch targets, phone number visible
- Travis's UI: price visible on landing, zero friction, no account creation
- Kahnawà:ke's location page: "We serve Cornwall Island" explicit, not generic
- Gallagher's service page: Airbnb host language, 11am–3pm window explicit

---

## Docs-as-Code Contract

### Read BEFORE writing any code
1. docs/PERSONAS.md — persona is absolute; identify which persona the epic serves
2. docs/firestore-schema.md — schema is law; never invent fields
3. docs/design-system.md — all token names and values
4. docs/COMPLIANCE.md — CASL, data privacy rules
5. docs/projects/[current epic].md — scope and acceptance criteria

### Update in Phase C (ticket close)
1. docs/ACTIVE_CYCLE.md — mark completed tasks ✅
2. docs/firestore-schema.md — ONLY if schema changed
3. docs/reports/ — write [epic]-close-YYYY-MM-DD.md
4. user-guide/ — if user-visible behaviour changed
5. docs/decisions/ — new ADR if permanent architectural choice made

### NEVER modify
- docs/decisions/ADR-*.md once Accepted (immutable)
- docs/PERSONAS.md (human-defined; AI reads only)
- .env.local or any secrets file
- firestore.rules (security changes require human approval)

---

## AGY 3-Phase Gate

### Phase A — Planning Gate
1. Read docs/projects/[epic].md
2. Read docs/PERSONAS.md → identify primary persona(s) for this epic
3. Read docs/design-system.md, firestore-schema.md, COMPLIANCE.md
4. Generate 3-strategy plan in docs/plans/[epic]_PLAN.md
   - Each strategy: files changed, persona impact, risks, schema audit
5. HALT. Wait for human approval.

### Phase B — Execution
1. Execute approved strategy
2. Invoke Brand_Auditor: confirm Tailwind classes vs design-system.md
3. Invoke Data_Steward: confirm no invented Firestore fields
4. Invoke Linguistic_Auditor: confirm all UI strings use t(), no hardcoded EN/FR
5. Run: npm run build && npm run lint
6. Both pass → Phase C. Either fails → halt + write failure report + await human.

### Phase C — Ticket Close
1. Update docs/ACTIVE_CYCLE.md
2. Update docs/firestore-schema.md if schema changed
3. Write docs/reports/[epic]-close-YYYY-MM-DD.md
4. Verify persona test passes (name it explicitly)
5. Update user-guide/ if user-visible behaviour changed
6. Return summary. Stop. Do not commit.

---

## Subagent Roster
- QA_Engineer: npm run test + npm run test:e2e, zero failures
- Brand_Auditor: Tailwind classes vs docs/design-system.md
- Data_Steward: Firestore ops vs docs/firestore-schema.md
- Security_Auditor: firestore.rules vs docs/COMPLIANCE.md
- Linguistic_Auditor: all UI strings use t() hook; no hardcoded EN/FR text
- TypeScript_Strict_Enforcer: strictly enforces TypeScript types, resolving Zod schema mismatches, and fixing `tsc -b` failures without using `any` or `@ts-ignore`

## Git Rules (ABSOLUTE)
- NEVER run git add, git commit, or git push
- NEVER modify ADR files once Accepted
- ALWAYS run npm run build before Phase C close

```

---

## File: README.md

```markdown
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

```

---

## File: coverage/lcov-report/base.css

```css
body, html {
  margin:0; padding: 0;
  height: 100%;
}
body {
    font-family: Helvetica Neue, Helvetica, Arial;
    font-size: 14px;
    color:#333;
}
.small { font-size: 12px; }
*, *:after, *:before {
  -webkit-box-sizing:border-box;
     -moz-box-sizing:border-box;
          box-sizing:border-box;
  }
h1 { font-size: 20px; margin: 0;}
h2 { font-size: 14px; }
pre {
    font: 12px/1.4 Consolas, "Liberation Mono", Menlo, Courier, monospace;
    margin: 0;
    padding: 0;
    -moz-tab-size: 2;
    -o-tab-size:  2;
    tab-size: 2;
}
a { color:#0074D9; text-decoration:none; }
a:hover { text-decoration:underline; }
.strong { font-weight: bold; }
.space-top1 { padding: 10px 0 0 0; }
.pad2y { padding: 20px 0; }
.pad1y { padding: 10px 0; }
.pad2x { padding: 0 20px; }
.pad2 { padding: 20px; }
.pad1 { padding: 10px; }
.space-left2 { padding-left:55px; }
.space-right2 { padding-right:20px; }
.center { text-align:center; }
.clearfix { display:block; }
.clearfix:after {
  content:'';
  display:block;
  height:0;
  clear:both;
  visibility:hidden;
  }
.fl { float: left; }
@media only screen and (max-width:640px) {
  .col3 { width:100%; max-width:100%; }
  .hide-mobile { display:none!important; }
}

.quiet {
  color: #7f7f7f;
  color: rgba(0,0,0,0.5);
}
.quiet a { opacity: 0.7; }

.fraction {
  font-family: Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  font-size: 10px;
  color: #555;
  background: #E8E8E8;
  padding: 4px 5px;
  border-radius: 3px;
  vertical-align: middle;
}

div.path a:link, div.path a:visited { color: #333; }
table.coverage {
  border-collapse: collapse;
  margin: 10px 0 0 0;
  padding: 0;
}

table.coverage td {
  margin: 0;
  padding: 0;
  vertical-align: top;
}
table.coverage td.line-count {
    text-align: right;
    padding: 0 5px 0 20px;
}
table.coverage td.line-coverage {
    text-align: right;
    padding-right: 10px;
    min-width:20px;
}

table.coverage td span.cline-any {
    display: inline-block;
    padding: 0 5px;
    width: 100%;
}
.missing-if-branch {
    display: inline-block;
    margin-right: 5px;
    border-radius: 3px;
    position: relative;
    padding: 0 4px;
    background: #333;
    color: yellow;
}

.skip-if-branch {
    display: none;
    margin-right: 10px;
    position: relative;
    padding: 0 4px;
    background: #ccc;
    color: white;
}
.missing-if-branch .typ, .skip-if-branch .typ {
    color: inherit !important;
}
.coverage-summary {
  border-collapse: collapse;
  width: 100%;
}
.coverage-summary tr { border-bottom: 1px solid #bbb; }
.keyline-all { border: 1px solid #ddd; }
.coverage-summary td, .coverage-summary th { padding: 10px; }
.coverage-summary tbody { border: 1px solid #bbb; }
.coverage-summary td { border-right: 1px solid #bbb; }
.coverage-summary td:last-child { border-right: none; }
.coverage-summary th {
  text-align: left;
  font-weight: normal;
  white-space: nowrap;
}
.coverage-summary th.file { border-right: none !important; }
.coverage-summary th.pct { }
.coverage-summary th.pic,
.coverage-summary th.abs,
.coverage-summary td.pct,
.coverage-summary td.abs { text-align: right; }
.coverage-summary td.file { white-space: nowrap;  }
.coverage-summary td.pic { min-width: 120px !important;  }
.coverage-summary tfoot td { }

.coverage-summary .sorter {
    height: 10px;
    width: 7px;
    display: inline-block;
    margin-left: 0.5em;
    background: url(sort-arrow-sprite.png) no-repeat scroll 0 0 transparent;
}
.coverage-summary .sorted .sorter {
    background-position: 0 -20px;
}
.coverage-summary .sorted-desc .sorter {
    background-position: 0 -10px;
}
.status-line {  height: 10px; }
/* yellow */
.cbranch-no { background: yellow !important; color: #111; }
/* dark red */
.red.solid, .status-line.low, .low .cover-fill { background:#C21F39 }
.low .chart { border:1px solid #C21F39 }
.highlighted,
.highlighted .cstat-no, .highlighted .fstat-no, .highlighted .cbranch-no{
  background: #C21F39 !important;
}
/* medium red */
.cstat-no, .fstat-no, .cbranch-no, .cbranch-no { background:#F6C6CE }
/* light red */
.low, .cline-no { background:#FCE1E5 }
/* light green */
.high, .cline-yes { background:rgb(230,245,208) }
/* medium green */
.cstat-yes { background:rgb(161,215,106) }
/* dark green */
.status-line.high, .high .cover-fill { background:rgb(77,146,33) }
.high .chart { border:1px solid rgb(77,146,33) }
/* dark yellow (gold) */
.status-line.medium, .medium .cover-fill { background: #f9cd0b; }
.medium .chart { border:1px solid #f9cd0b; }
/* light yellow */
.medium { background: #fff4c2; }

.cstat-skip { background: #ddd; color: #111; }
.fstat-skip { background: #ddd; color: #111 !important; }
.cbranch-skip { background: #ddd !important; color: #111; }

span.cline-neutral { background: #eaeaea; }

.coverage-summary td.empty {
    opacity: .5;
    padding-top: 4px;
    padding-bottom: 4px;
    line-height: 1;
    color: #888;
}

.cover-fill, .cover-empty {
  display:inline-block;
  height: 12px;
}
.chart {
  line-height: 0;
}
.cover-empty {
    background: white;
}
.cover-full {
    border-right: none !important;
}
pre.prettyprint {
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
}
.com { color: #999 !important; }
.ignore-none { color: #999; font-weight: normal; }

.wrapper {
  min-height: 100%;
  height: auto !important;
  height: 100%;
  margin: 0 auto -48px;
}
.footer, .push {
  height: 48px;
}

```

---

## File: coverage/lcov-report/block-navigation.js

```javascript
/* eslint-disable */
var jumpToCode = (function init() {
    // Classes of code we would like to highlight in the file view
    var missingCoverageClasses = ['.cbranch-no', '.cstat-no', '.fstat-no'];

    // Elements to highlight in the file listing view
    var fileListingElements = ['td.pct.low'];

    // We don't want to select elements that are direct descendants of another match
    var notSelector = ':not(' + missingCoverageClasses.join('):not(') + ') > '; // becomes `:not(a):not(b) > `

    // Selector that finds elements on the page to which we can jump
    var selector =
        fileListingElements.join(', ') +
        ', ' +
        notSelector +
        missingCoverageClasses.join(', ' + notSelector); // becomes `:not(a):not(b) > a, :not(a):not(b) > b`

    // The NodeList of matching elements
    var missingCoverageElements = document.querySelectorAll(selector);

    var currentIndex;

    function toggleClass(index) {
        missingCoverageElements
            .item(currentIndex)
            .classList.remove('highlighted');
        missingCoverageElements.item(index).classList.add('highlighted');
    }

    function makeCurrent(index) {
        toggleClass(index);
        currentIndex = index;
        missingCoverageElements.item(index).scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
    }

    function goToPrevious() {
        var nextIndex = 0;
        if (typeof currentIndex !== 'number' || currentIndex === 0) {
            nextIndex = missingCoverageElements.length - 1;
        } else if (missingCoverageElements.length > 1) {
            nextIndex = currentIndex - 1;
        }

        makeCurrent(nextIndex);
    }

    function goToNext() {
        var nextIndex = 0;

        if (
            typeof currentIndex === 'number' &&
            currentIndex < missingCoverageElements.length - 1
        ) {
            nextIndex = currentIndex + 1;
        }

        makeCurrent(nextIndex);
    }

    return function jump(event) {
        if (
            document.getElementById('fileSearch') === document.activeElement &&
            document.activeElement != null
        ) {
            // if we're currently focused on the search input, we don't want to navigate
            return;
        }

        switch (event.which) {
            case 78: // n
            case 74: // j
                goToNext();
                break;
            case 66: // b
            case 75: // k
            case 80: // p
                goToPrevious();
                break;
        }
    };
})();
window.addEventListener('keydown', jumpToCode);

```

---

## File: coverage/lcov-report/components/layout/CookieBanner.tsx.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for components/layout/CookieBanner.tsx</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> / <a href="index.html">components/layout</a> CookieBanner.tsx</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">95% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>19/20</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>8/8</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">85.71% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>6/7</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>18/18</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a>
<a name='L49'></a><a href='#L49'>49</a>
<a name='L50'></a><a href='#L50'>50</a>
<a name='L51'></a><a href='#L51'>51</a>
<a name='L52'></a><a href='#L52'>52</a>
<a name='L53'></a><a href='#L53'>53</a>
<a name='L54'></a><a href='#L54'>54</a>
<a name='L55'></a><a href='#L55'>55</a>
<a name='L56'></a><a href='#L56'>56</a>
<a name='L57'></a><a href='#L57'>57</a>
<a name='L58'></a><a href='#L58'>58</a>
<a name='L59'></a><a href='#L59'>59</a>
<a name='L60'></a><a href='#L60'>60</a>
<a name='L61'></a><a href='#L61'>61</a>
<a name='L62'></a><a href='#L62'>62</a>
<a name='L63'></a><a href='#L63'>63</a>
<a name='L64'></a><a href='#L64'>64</a>
<a name='L65'></a><a href='#L65'>65</a>
<a name='L66'></a><a href='#L66'>66</a>
<a name='L67'></a><a href='#L67'>67</a>
<a name='L68'></a><a href='#L68'>68</a>
<a name='L69'></a><a href='#L69'>69</a>
<a name='L70'></a><a href='#L70'>70</a>
<a name='L71'></a><a href='#L71'>71</a>
<a name='L72'></a><a href='#L72'>72</a></td><td class="line-coverage quiet"><span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">6x</span>
<span class="cline-any cline-yes">6x</span>
<span class="cline-any cline-yes">4x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">6x</span>
<span class="cline-any cline-yes">4x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">4x</span>
<span class="cline-any cline-yes">4x</span>
<span class="cline-any cline-yes">4x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">6x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">6x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">6x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { initializeAnalytics, revokeAnalytics } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
&nbsp;
export default function CookieBanner() {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(() =&gt; {
    return typeof window !== 'undefined' &amp;&amp; localStorage.getItem('freshnest_consent') === null
  })
&nbsp;
  useEffect(() =&gt; {
    if (typeof window !== 'undefined' &amp;&amp; localStorage.getItem('freshnest_consent') === 'granted') {
      initializeAnalytics()
    }
&nbsp;
    const <span class="fstat-no" title="function not covered" >handleOpenBanner = () =&gt; <span class="cstat-no" title="statement not covered" >s</span>etIsVisible(true)</span>
    window.addEventListener('open-cookie-banner', handleOpenBanner)
    return () =&gt; window.removeEventListener('open-cookie-banner', handleOpenBanner)
  }, [])
&nbsp;
  const handleAccept = () =&gt; {
    localStorage.setItem('freshnest_consent', 'granted')
    initializeAnalytics()
    setIsVisible(false)
  }
&nbsp;
  const handleDecline = () =&gt; {
    localStorage.setItem('freshnest_consent', 'denied')
    revokeAnalytics()
    setIsVisible(false)
  }
&nbsp;
  return (
    &lt;AnimatePresence&gt;
      {isVisible &amp;&amp; (
        &lt;motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-sand shadow-lg"
        &gt;
          &lt;div className="max-w-content mx-auto flex flex-col md:flex-row items-center justify-between gap-4"&gt;
            &lt;p className="font-body text-base text-charcoal text-center md:text-left flex-1"&gt;
              {t('cookieBanner.message')}
            &lt;/p&gt;
            &lt;div className="flex items-center gap-3 w-full md:w-auto"&gt;
              &lt;button
                onClick={handleDecline}
                className={cn(
                  'flex-1 md:flex-none font-body text-base font-medium min-h-[48px] px-6 rounded border border-sand text-charcoal hover:bg-cream transition-colors focus:outline-none focus:ring-2 focus:ring-slate-pale'
                )}
              &gt;
                {t('cookieBanner.decline')}
              &lt;/button&gt;
              &lt;button
                onClick={handleAccept}
                className={cn(
                  'flex-1 md:flex-none font-body text-base font-medium min-h-[48px] px-6 rounded bg-slate-brand text-white hover:bg-slate-dark transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2'
                )}
              &gt;
                {t('cookieBanner.accept')}
              &lt;/button&gt;
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/motion.div&gt;
      )}
    &lt;/AnimatePresence&gt;
  )
}
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2026-06-11T14:05:43.020Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

---

## File: coverage/lcov-report/components/layout/index.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for components/layout</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../../prettify.css" />
    <link rel="stylesheet" href="../../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../../index.html">All files</a> components/layout</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">95% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>19/20</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>8/8</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">85.71% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>6/7</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>18/18</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <div class="pad1">
<table class="coverage-summary">
<thead>
<tr>
   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>
   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
</tr>
</thead>
<tbody><tr>
	<td class="file high" data-value="CookieBanner.tsx"><a href="CookieBanner.tsx.html">CookieBanner.tsx</a></td>
	<td data-value="95" class="pic high">
	<div class="chart"><div class="cover-fill" style="width: 95%"></div><div class="cover-empty" style="width: 5%"></div></div>
	</td>
	<td data-value="95" class="pct high">95%</td>
	<td data-value="20" class="abs high">19/20</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="8" class="abs high">8/8</td>
	<td data-value="85.71" class="pct high">85.71%</td>
	<td data-value="7" class="abs high">6/7</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="18" class="abs high">18/18</td>
	</tr>

</tbody>
</table>
</div>
                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2026-06-11T14:05:43.020Z
            </div>
        <script src="../../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../../sorter.js"></script>
        <script src="../../block-navigation.js"></script>
    </body>
</html>
    
```

---

## File: coverage/lcov-report/index.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for All files</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="prettify.css" />
    <link rel="stylesheet" href="base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1>All files</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">95.65% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>44/46</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">87.5% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>14/16</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">93.75% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>15/16</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">97.67% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>42/43</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <div class="pad1">
<table class="coverage-summary">
<thead>
<tr>
   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>
   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
</tr>
</thead>
<tbody><tr>
	<td class="file high" data-value="components/layout"><a href="components/layout/index.html">components/layout</a></td>
	<td data-value="95" class="pic high">
	<div class="chart"><div class="cover-fill" style="width: 95%"></div><div class="cover-empty" style="width: 5%"></div></div>
	</td>
	<td data-value="95" class="pct high">95%</td>
	<td data-value="20" class="abs high">19/20</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="8" class="abs high">8/8</td>
	<td data-value="85.71" class="pct high">85.71%</td>
	<td data-value="7" class="abs high">6/7</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="18" class="abs high">18/18</td>
	</tr>

<tr>
	<td class="file high" data-value="lib"><a href="lib/index.html">lib</a></td>
	<td data-value="96.15" class="pic high">
	<div class="chart"><div class="cover-fill" style="width: 96%"></div><div class="cover-empty" style="width: 4%"></div></div>
	</td>
	<td data-value="96.15" class="pct high">96.15%</td>
	<td data-value="26" class="abs high">25/26</td>
	<td data-value="75" class="pct medium">75%</td>
	<td data-value="8" class="abs medium">6/8</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="9" class="abs high">9/9</td>
	<td data-value="96" class="pct high">96%</td>
	<td data-value="25" class="abs high">24/25</td>
	</tr>

</tbody>
</table>
</div>
                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2026-06-11T14:05:43.020Z
            </div>
        <script src="prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="sorter.js"></script>
        <script src="block-navigation.js"></script>
    </body>
</html>
    
```

---

## File: coverage/lcov-report/lib/analytics.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for lib/analytics.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../prettify.css" />
    <link rel="stylesheet" href="../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../index.html">All files</a> / <a href="index.html">lib</a> analytics.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">95.83% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>23/24</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">75% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>6/8</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>8/8</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">95.83% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>23/24</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a>
<a name='L5'></a><a href='#L5'>5</a>
<a name='L6'></a><a href='#L6'>6</a>
<a name='L7'></a><a href='#L7'>7</a>
<a name='L8'></a><a href='#L8'>8</a>
<a name='L9'></a><a href='#L9'>9</a>
<a name='L10'></a><a href='#L10'>10</a>
<a name='L11'></a><a href='#L11'>11</a>
<a name='L12'></a><a href='#L12'>12</a>
<a name='L13'></a><a href='#L13'>13</a>
<a name='L14'></a><a href='#L14'>14</a>
<a name='L15'></a><a href='#L15'>15</a>
<a name='L16'></a><a href='#L16'>16</a>
<a name='L17'></a><a href='#L17'>17</a>
<a name='L18'></a><a href='#L18'>18</a>
<a name='L19'></a><a href='#L19'>19</a>
<a name='L20'></a><a href='#L20'>20</a>
<a name='L21'></a><a href='#L21'>21</a>
<a name='L22'></a><a href='#L22'>22</a>
<a name='L23'></a><a href='#L23'>23</a>
<a name='L24'></a><a href='#L24'>24</a>
<a name='L25'></a><a href='#L25'>25</a>
<a name='L26'></a><a href='#L26'>26</a>
<a name='L27'></a><a href='#L27'>27</a>
<a name='L28'></a><a href='#L28'>28</a>
<a name='L29'></a><a href='#L29'>29</a>
<a name='L30'></a><a href='#L30'>30</a>
<a name='L31'></a><a href='#L31'>31</a>
<a name='L32'></a><a href='#L32'>32</a>
<a name='L33'></a><a href='#L33'>33</a>
<a name='L34'></a><a href='#L34'>34</a>
<a name='L35'></a><a href='#L35'>35</a>
<a name='L36'></a><a href='#L36'>36</a>
<a name='L37'></a><a href='#L37'>37</a>
<a name='L38'></a><a href='#L38'>38</a>
<a name='L39'></a><a href='#L39'>39</a>
<a name='L40'></a><a href='#L40'>40</a>
<a name='L41'></a><a href='#L41'>41</a>
<a name='L42'></a><a href='#L42'>42</a>
<a name='L43'></a><a href='#L43'>43</a>
<a name='L44'></a><a href='#L44'>44</a>
<a name='L45'></a><a href='#L45'>45</a>
<a name='L46'></a><a href='#L46'>46</a>
<a name='L47'></a><a href='#L47'>47</a>
<a name='L48'></a><a href='#L48'>48</a>
<a name='L49'></a><a href='#L49'>49</a></td><td class="line-coverage quiet"><span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">8x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-no">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">6x</span>
<span class="cline-any cline-yes">6x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-yes">1x</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { getAnalytics, logEvent, Analytics, setAnalyticsCollectionEnabled } from 'firebase/analytics'
import app from './firebase'
&nbsp;
let analyticsInstance: Analytics | null = null
&nbsp;
export const initializeAnalytics = () =&gt; {
  if (typeof window !== 'undefined' &amp;&amp; !analyticsInstance) {
    try {
      analyticsInstance = getAnalytics(app)
      console.log('Firebase Analytics initialized.')
    } catch (error) {
<span class="cstat-no" title="statement not covered" >      console.error('Failed to initialize Firebase Analytics:', error)</span>
    }
  }
}
&nbsp;
export const revokeAnalytics = () =&gt; {
  <span class="missing-if-branch" title="else path not taken" >E</span>if (analyticsInstance) {
    setAnalyticsCollectionEnabled(analyticsInstance, false)
    console.log('Firebase Analytics collection disabled.')
  }
}
&nbsp;
export const logCustomEvent = (eventName: string, eventParams?: Record&lt;string, unknown&gt;) =&gt; {
  <span class="missing-if-branch" title="else path not taken" >E</span>if (analyticsInstance) {
    logEvent(analyticsInstance, eventName, eventParams)
  }
}
&nbsp;
export const logBookingStarted = () =&gt; {
  logCustomEvent('booking_started')
}
&nbsp;
export const logBookingCompleted = (serviceType: string, totalValue?: number) =&gt; {
  logCustomEvent('booking_completed', { service_type: serviceType, value: totalValue })
}
&nbsp;
export const logQuoteCalculated = (serviceType: string, estimatedPrice: number) =&gt; {
  logCustomEvent('quote_calculated', { service_type: serviceType, value: estimatedPrice })
}
&nbsp;
export const logPhoneClicked = (location: 'navbar' | 'footer' | 'other') =&gt; {
  logCustomEvent('phone_clicked', { location })
}
&nbsp;
export const logLanguageToggled = (newLanguage: string) =&gt; {
  logCustomEvent('language_toggled', { language: newLanguage })
}
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2026-06-11T14:05:43.020Z
            </div>
        <script src="../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../sorter.js"></script>
        <script src="../block-navigation.js"></script>
    </body>
</html>
    
```

---

## File: coverage/lcov-report/lib/index.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for lib</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../prettify.css" />
    <link rel="stylesheet" href="../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../index.html">All files</a> lib</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">96.15% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>25/26</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">75% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>6/8</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>9/9</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">96% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>24/25</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <div class="pad1">
<table class="coverage-summary">
<thead>
<tr>
   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>
   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
</tr>
</thead>
<tbody><tr>
	<td class="file high" data-value="analytics.ts"><a href="analytics.ts.html">analytics.ts</a></td>
	<td data-value="95.83" class="pic high">
	<div class="chart"><div class="cover-fill" style="width: 95%"></div><div class="cover-empty" style="width: 5%"></div></div>
	</td>
	<td data-value="95.83" class="pct high">95.83%</td>
	<td data-value="24" class="abs high">23/24</td>
	<td data-value="75" class="pct medium">75%</td>
	<td data-value="8" class="abs medium">6/8</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="8" class="abs high">8/8</td>
	<td data-value="95.83" class="pct high">95.83%</td>
	<td data-value="24" class="abs high">23/24</td>
	</tr>

<tr>
	<td class="file high" data-value="utils.ts"><a href="utils.ts.html">utils.ts</a></td>
	<td data-value="100" class="pic high">
	<div class="chart"><div class="cover-fill cover-full" style="width: 100%"></div><div class="cover-empty" style="width: 0%"></div></div>
	</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="2" class="abs high">2/2</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="0" class="abs high">0/0</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="1" class="abs high">1/1</td>
	<td data-value="100" class="pct high">100%</td>
	<td data-value="1" class="abs high">1/1</td>
	</tr>

</tbody>
</table>
</div>
                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2026-06-11T14:05:43.020Z
            </div>
        <script src="../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../sorter.js"></script>
        <script src="../block-navigation.js"></script>
    </body>
</html>
    
```

---

## File: coverage/lcov-report/lib/utils.ts.html

```html

<!doctype html>
<html lang="en">

<head>
    <title>Code coverage report for lib/utils.ts</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="../prettify.css" />
    <link rel="stylesheet" href="../base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(../sort-arrow-sprite.png);
        }
    </style>
</head>
    
<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1><a href="../index.html">All files</a> / <a href="index.html">lib</a> utils.ts</h1>
        <div class='clearfix'>
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Statements</span>
                <span class='fraction'>2/2</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Branches</span>
                <span class='fraction'>0/0</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Functions</span>
                <span class='fraction'>1/1</span>
            </div>
        
            
            <div class='fl pad1y space-right2'>
                <span class="strong">100% </span>
                <span class="quiet">Lines</span>
                <span class='fraction'>1/1</span>
            </div>
        
            
        </div>
        <p class="quiet">
            Press <em>n</em> or <em>j</em> to go to the next uncovered block, <em>b</em>, <em>p</em> or <em>k</em> for the previous block.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filter:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line high'></div>
    <pre><table class="coverage">
<tr><td class="line-count quiet"><a name='L1'></a><a href='#L1'>1</a>
<a name='L2'></a><a href='#L2'>2</a>
<a name='L3'></a><a href='#L3'>3</a>
<a name='L4'></a><a href='#L4'>4</a></td><td class="line-coverage quiet"><span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-neutral">&nbsp;</span>
<span class="cline-any cline-yes">6x</span>
<span class="cline-any cline-neutral">&nbsp;</span></td><td class="text"><pre class="prettyprint lang-js">import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cn = (...inputs: ClassValue[]) =&gt; twMerge(clsx(inputs))
&nbsp;</pre></td></tr></table></pre>

                <div class='push'></div><!-- for sticky footer -->
            </div><!-- /wrapper -->
            <div class='footer quiet pad2 space-top1 center small'>
                Code coverage generated by
                <a href="https://istanbul.js.org/" target="_blank" rel="noopener noreferrer">istanbul</a>
                at 2026-06-11T14:05:43.020Z
            </div>
        <script src="../prettify.js"></script>
        <script>
            window.onload = function () {
                prettyPrint();
            };
        </script>
        <script src="../sorter.js"></script>
        <script src="../block-navigation.js"></script>
    </body>
</html>
    
```

---

## File: coverage/lcov-report/prettify.css

```css
.pln{color:#000}@media screen{.str{color:#080}.kwd{color:#008}.com{color:#800}.typ{color:#606}.lit{color:#066}.pun,.opn,.clo{color:#660}.tag{color:#008}.atn{color:#606}.atv{color:#080}.dec,.var{color:#606}.fun{color:red}}@media print,projection{.str{color:#060}.kwd{color:#006;font-weight:bold}.com{color:#600;font-style:italic}.typ{color:#404;font-weight:bold}.lit{color:#044}.pun,.opn,.clo{color:#440}.tag{color:#006;font-weight:bold}.atn{color:#404}.atv{color:#060}}pre.prettyprint{padding:2px;border:1px solid #888}ol.linenums{margin-top:0;margin-bottom:0}li.L0,li.L1,li.L2,li.L3,li.L5,li.L6,li.L7,li.L8{list-style-type:none}li.L1,li.L3,li.L5,li.L7,li.L9{background:#eee}

```

---

## File: coverage/lcov-report/prettify.js

```javascript
/* eslint-disable */
window.PR_SHOULD_USE_CONTINUATION=true;(function(){var h=["break,continue,do,else,for,if,return,while"];var u=[h,"auto,case,char,const,default,double,enum,extern,float,goto,int,long,register,short,signed,sizeof,static,struct,switch,typedef,union,unsigned,void,volatile"];var p=[u,"catch,class,delete,false,import,new,operator,private,protected,public,this,throw,true,try,typeof"];var l=[p,"alignof,align_union,asm,axiom,bool,concept,concept_map,const_cast,constexpr,decltype,dynamic_cast,explicit,export,friend,inline,late_check,mutable,namespace,nullptr,reinterpret_cast,static_assert,static_cast,template,typeid,typename,using,virtual,where"];var x=[p,"abstract,boolean,byte,extends,final,finally,implements,import,instanceof,null,native,package,strictfp,super,synchronized,throws,transient"];var R=[x,"as,base,by,checked,decimal,delegate,descending,dynamic,event,fixed,foreach,from,group,implicit,in,interface,internal,into,is,lock,object,out,override,orderby,params,partial,readonly,ref,sbyte,sealed,stackalloc,string,select,uint,ulong,unchecked,unsafe,ushort,var"];var r="all,and,by,catch,class,else,extends,false,finally,for,if,in,is,isnt,loop,new,no,not,null,of,off,on,or,return,super,then,true,try,unless,until,when,while,yes";var w=[p,"debugger,eval,export,function,get,null,set,undefined,var,with,Infinity,NaN"];var s="caller,delete,die,do,dump,elsif,eval,exit,foreach,for,goto,if,import,last,local,my,next,no,our,print,package,redo,require,sub,undef,unless,until,use,wantarray,while,BEGIN,END";var I=[h,"and,as,assert,class,def,del,elif,except,exec,finally,from,global,import,in,is,lambda,nonlocal,not,or,pass,print,raise,try,with,yield,False,True,None"];var f=[h,"alias,and,begin,case,class,def,defined,elsif,end,ensure,false,in,module,next,nil,not,or,redo,rescue,retry,self,super,then,true,undef,unless,until,when,yield,BEGIN,END"];var H=[h,"case,done,elif,esac,eval,fi,function,in,local,set,then,until"];var A=[l,R,w,s+I,f,H];var e=/^(DIR|FILE|vector|(de|priority_)?queue|list|stack|(const_)?iterator|(multi)?(set|map)|bitset|u?(int|float)\d*)/;var C="str";var z="kwd";var j="com";var O="typ";var G="lit";var L="pun";var F="pln";var m="tag";var E="dec";var J="src";var P="atn";var n="atv";var N="nocode";var M="(?:^^\\.?|[+-]|\\!|\\!=|\\!==|\\#|\\%|\\%=|&|&&|&&=|&=|\\(|\\*|\\*=|\\+=|\\,|\\-=|\\->|\\/|\\/=|:|::|\\;|<|<<|<<=|<=|=|==|===|>|>=|>>|>>=|>>>|>>>=|\\?|\\@|\\[|\\^|\\^=|\\^\\^|\\^\\^=|\\{|\\||\\|=|\\|\\||\\|\\|=|\\~|break|case|continue|delete|do|else|finally|instanceof|return|throw|try|typeof)\\s*";function k(Z){var ad=0;var S=false;var ac=false;for(var V=0,U=Z.length;V<U;++V){var ae=Z[V];if(ae.ignoreCase){ac=true}else{if(/[a-z]/i.test(ae.source.replace(/\\u[0-9a-f]{4}|\\x[0-9a-f]{2}|\\[^ux]/gi,""))){S=true;ac=false;break}}}var Y={b:8,t:9,n:10,v:11,f:12,r:13};function ab(ah){var ag=ah.charCodeAt(0);if(ag!==92){return ag}var af=ah.charAt(1);ag=Y[af];if(ag){return ag}else{if("0"<=af&&af<="7"){return parseInt(ah.substring(1),8)}else{if(af==="u"||af==="x"){return parseInt(ah.substring(2),16)}else{return ah.charCodeAt(1)}}}}function T(af){if(af<32){return(af<16?"\\x0":"\\x")+af.toString(16)}var ag=String.fromCharCode(af);if(ag==="\\"||ag==="-"||ag==="["||ag==="]"){ag="\\"+ag}return ag}function X(am){var aq=am.substring(1,am.length-1).match(new RegExp("\\\\u[0-9A-Fa-f]{4}|\\\\x[0-9A-Fa-f]{2}|\\\\[0-3][0-7]{0,2}|\\\\[0-7]{1,2}|\\\\[\\s\\S]|-|[^-\\\\]","g"));var ak=[];var af=[];var ao=aq[0]==="^";for(var ar=ao?1:0,aj=aq.length;ar<aj;++ar){var ah=aq[ar];if(/\\[bdsw]/i.test(ah)){ak.push(ah)}else{var ag=ab(ah);var al;if(ar+2<aj&&"-"===aq[ar+1]){al=ab(aq[ar+2]);ar+=2}else{al=ag}af.push([ag,al]);if(!(al<65||ag>122)){if(!(al<65||ag>90)){af.push([Math.max(65,ag)|32,Math.min(al,90)|32])}if(!(al<97||ag>122)){af.push([Math.max(97,ag)&~32,Math.min(al,122)&~32])}}}}af.sort(function(av,au){return(av[0]-au[0])||(au[1]-av[1])});var ai=[];var ap=[NaN,NaN];for(var ar=0;ar<af.length;++ar){var at=af[ar];if(at[0]<=ap[1]+1){ap[1]=Math.max(ap[1],at[1])}else{ai.push(ap=at)}}var an=["["];if(ao){an.push("^")}an.push.apply(an,ak);for(var ar=0;ar<ai.length;++ar){var at=ai[ar];an.push(T(at[0]));if(at[1]>at[0]){if(at[1]+1>at[0]){an.push("-")}an.push(T(at[1]))}}an.push("]");return an.join("")}function W(al){var aj=al.source.match(new RegExp("(?:\\[(?:[^\\x5C\\x5D]|\\\\[\\s\\S])*\\]|\\\\u[A-Fa-f0-9]{4}|\\\\x[A-Fa-f0-9]{2}|\\\\[0-9]+|\\\\[^ux0-9]|\\(\\?[:!=]|[\\(\\)\\^]|[^\\x5B\\x5C\\(\\)\\^]+)","g"));var ah=aj.length;var an=[];for(var ak=0,am=0;ak<ah;++ak){var ag=aj[ak];if(ag==="("){++am}else{if("\\"===ag.charAt(0)){var af=+ag.substring(1);if(af&&af<=am){an[af]=-1}}}}for(var ak=1;ak<an.length;++ak){if(-1===an[ak]){an[ak]=++ad}}for(var ak=0,am=0;ak<ah;++ak){var ag=aj[ak];if(ag==="("){++am;if(an[am]===undefined){aj[ak]="(?:"}}else{if("\\"===ag.charAt(0)){var af=+ag.substring(1);if(af&&af<=am){aj[ak]="\\"+an[am]}}}}for(var ak=0,am=0;ak<ah;++ak){if("^"===aj[ak]&&"^"!==aj[ak+1]){aj[ak]=""}}if(al.ignoreCase&&S){for(var ak=0;ak<ah;++ak){var ag=aj[ak];var ai=ag.charAt(0);if(ag.length>=2&&ai==="["){aj[ak]=X(ag)}else{if(ai!=="\\"){aj[ak]=ag.replace(/[a-zA-Z]/g,function(ao){var ap=ao.charCodeAt(0);return"["+String.fromCharCode(ap&~32,ap|32)+"]"})}}}}return aj.join("")}var aa=[];for(var V=0,U=Z.length;V<U;++V){var ae=Z[V];if(ae.global||ae.multiline){throw new Error(""+ae)}aa.push("(?:"+W(ae)+")")}return new RegExp(aa.join("|"),ac?"gi":"g")}function a(V){var U=/(?:^|\s)nocode(?:\s|$)/;var X=[];var T=0;var Z=[];var W=0;var S;if(V.currentStyle){S=V.currentStyle.whiteSpace}else{if(window.getComputedStyle){S=document.defaultView.getComputedStyle(V,null).getPropertyValue("white-space")}}var Y=S&&"pre"===S.substring(0,3);function aa(ab){switch(ab.nodeType){case 1:if(U.test(ab.className)){return}for(var ae=ab.firstChild;ae;ae=ae.nextSibling){aa(ae)}var ad=ab.nodeName;if("BR"===ad||"LI"===ad){X[W]="\n";Z[W<<1]=T++;Z[(W++<<1)|1]=ab}break;case 3:case 4:var ac=ab.nodeValue;if(ac.length){if(!Y){ac=ac.replace(/[ \t\r\n]+/g," ")}else{ac=ac.replace(/\r\n?/g,"\n")}X[W]=ac;Z[W<<1]=T;T+=ac.length;Z[(W++<<1)|1]=ab}break}}aa(V);return{sourceCode:X.join("").replace(/\n$/,""),spans:Z}}function B(S,U,W,T){if(!U){return}var V={sourceCode:U,basePos:S};W(V);T.push.apply(T,V.decorations)}var v=/\S/;function o(S){var V=undefined;for(var U=S.firstChild;U;U=U.nextSibling){var T=U.nodeType;V=(T===1)?(V?S:U):(T===3)?(v.test(U.nodeValue)?S:V):V}return V===S?undefined:V}function g(U,T){var S={};var V;(function(){var ad=U.concat(T);var ah=[];var ag={};for(var ab=0,Z=ad.length;ab<Z;++ab){var Y=ad[ab];var ac=Y[3];if(ac){for(var ae=ac.length;--ae>=0;){S[ac.charAt(ae)]=Y}}var af=Y[1];var aa=""+af;if(!ag.hasOwnProperty(aa)){ah.push(af);ag[aa]=null}}ah.push(/[\0-\uffff]/);V=k(ah)})();var X=T.length;var W=function(ah){var Z=ah.sourceCode,Y=ah.basePos;var ad=[Y,F];var af=0;var an=Z.match(V)||[];var aj={};for(var ae=0,aq=an.length;ae<aq;++ae){var ag=an[ae];var ap=aj[ag];var ai=void 0;var am;if(typeof ap==="string"){am=false}else{var aa=S[ag.charAt(0)];if(aa){ai=ag.match(aa[1]);ap=aa[0]}else{for(var ao=0;ao<X;++ao){aa=T[ao];ai=ag.match(aa[1]);if(ai){ap=aa[0];break}}if(!ai){ap=F}}am=ap.length>=5&&"lang-"===ap.substring(0,5);if(am&&!(ai&&typeof ai[1]==="string")){am=false;ap=J}if(!am){aj[ag]=ap}}var ab=af;af+=ag.length;if(!am){ad.push(Y+ab,ap)}else{var al=ai[1];var ak=ag.indexOf(al);var ac=ak+al.length;if(ai[2]){ac=ag.length-ai[2].length;ak=ac-al.length}var ar=ap.substring(5);B(Y+ab,ag.substring(0,ak),W,ad);B(Y+ab+ak,al,q(ar,al),ad);B(Y+ab+ac,ag.substring(ac),W,ad)}}ah.decorations=ad};return W}function i(T){var W=[],S=[];if(T.tripleQuotedStrings){W.push([C,/^(?:\'\'\'(?:[^\'\\]|\\[\s\S]|\'{1,2}(?=[^\']))*(?:\'\'\'|$)|\"\"\"(?:[^\"\\]|\\[\s\S]|\"{1,2}(?=[^\"]))*(?:\"\"\"|$)|\'(?:[^\\\']|\\[\s\S])*(?:\'|$)|\"(?:[^\\\"]|\\[\s\S])*(?:\"|$))/,null,"'\""])}else{if(T.multiLineStrings){W.push([C,/^(?:\'(?:[^\\\']|\\[\s\S])*(?:\'|$)|\"(?:[^\\\"]|\\[\s\S])*(?:\"|$)|\`(?:[^\\\`]|\\[\s\S])*(?:\`|$))/,null,"'\"`"])}else{W.push([C,/^(?:\'(?:[^\\\'\r\n]|\\.)*(?:\'|$)|\"(?:[^\\\"\r\n]|\\.)*(?:\"|$))/,null,"\"'"])}}if(T.verbatimStrings){S.push([C,/^@\"(?:[^\"]|\"\")*(?:\"|$)/,null])}var Y=T.hashComments;if(Y){if(T.cStyleComments){if(Y>1){W.push([j,/^#(?:##(?:[^#]|#(?!##))*(?:###|$)|.*)/,null,"#"])}else{W.push([j,/^#(?:(?:define|elif|else|endif|error|ifdef|include|ifndef|line|pragma|undef|warning)\b|[^\r\n]*)/,null,"#"])}S.push([C,/^<(?:(?:(?:\.\.\/)*|\/?)(?:[\w-]+(?:\/[\w-]+)+)?[\w-]+\.h|[a-z]\w*)>/,null])}else{W.push([j,/^#[^\r\n]*/,null,"#"])}}if(T.cStyleComments){S.push([j,/^\/\/[^\r\n]*/,null]);S.push([j,/^\/\*[\s\S]*?(?:\*\/|$)/,null])}if(T.regexLiterals){var X=("/(?=[^/*])(?:[^/\\x5B\\x5C]|\\x5C[\\s\\S]|\\x5B(?:[^\\x5C\\x5D]|\\x5C[\\s\\S])*(?:\\x5D|$))+/");S.push(["lang-regex",new RegExp("^"+M+"("+X+")")])}var V=T.types;if(V){S.push([O,V])}var U=(""+T.keywords).replace(/^ | $/g,"");if(U.length){S.push([z,new RegExp("^(?:"+U.replace(/[\s,]+/g,"|")+")\\b"),null])}W.push([F,/^\s+/,null," \r\n\t\xA0"]);S.push([G,/^@[a-z_$][a-z_$@0-9]*/i,null],[O,/^(?:[@_]?[A-Z]+[a-z][A-Za-z_$@0-9]*|\w+_t\b)/,null],[F,/^[a-z_$][a-z_$@0-9]*/i,null],[G,new RegExp("^(?:0x[a-f0-9]+|(?:\\d(?:_\\d+)*\\d*(?:\\.\\d*)?|\\.\\d\\+)(?:e[+\\-]?\\d+)?)[a-z]*","i"),null,"0123456789"],[F,/^\\[\s\S]?/,null],[L,/^.[^\s\w\.$@\'\"\`\/\#\\]*/,null]);return g(W,S)}var K=i({keywords:A,hashComments:true,cStyleComments:true,multiLineStrings:true,regexLiterals:true});function Q(V,ag){var U=/(?:^|\s)nocode(?:\s|$)/;var ab=/\r\n?|\n/;var ac=V.ownerDocument;var S;if(V.currentStyle){S=V.currentStyle.whiteSpace}else{if(window.getComputedStyle){S=ac.defaultView.getComputedStyle(V,null).getPropertyValue("white-space")}}var Z=S&&"pre"===S.substring(0,3);var af=ac.createElement("LI");while(V.firstChild){af.appendChild(V.firstChild)}var W=[af];function ae(al){switch(al.nodeType){case 1:if(U.test(al.className)){break}if("BR"===al.nodeName){ad(al);if(al.parentNode){al.parentNode.removeChild(al)}}else{for(var an=al.firstChild;an;an=an.nextSibling){ae(an)}}break;case 3:case 4:if(Z){var am=al.nodeValue;var aj=am.match(ab);if(aj){var ai=am.substring(0,aj.index);al.nodeValue=ai;var ah=am.substring(aj.index+aj[0].length);if(ah){var ak=al.parentNode;ak.insertBefore(ac.createTextNode(ah),al.nextSibling)}ad(al);if(!ai){al.parentNode.removeChild(al)}}}break}}function ad(ak){while(!ak.nextSibling){ak=ak.parentNode;if(!ak){return}}function ai(al,ar){var aq=ar?al.cloneNode(false):al;var ao=al.parentNode;if(ao){var ap=ai(ao,1);var an=al.nextSibling;ap.appendChild(aq);for(var am=an;am;am=an){an=am.nextSibling;ap.appendChild(am)}}return aq}var ah=ai(ak.nextSibling,0);for(var aj;(aj=ah.parentNode)&&aj.nodeType===1;){ah=aj}W.push(ah)}for(var Y=0;Y<W.length;++Y){ae(W[Y])}if(ag===(ag|0)){W[0].setAttribute("value",ag)}var aa=ac.createElement("OL");aa.className="linenums";var X=Math.max(0,((ag-1))|0)||0;for(var Y=0,T=W.length;Y<T;++Y){af=W[Y];af.className="L"+((Y+X)%10);if(!af.firstChild){af.appendChild(ac.createTextNode("\xA0"))}aa.appendChild(af)}V.appendChild(aa)}function D(ac){var aj=/\bMSIE\b/.test(navigator.userAgent);var am=/\n/g;var al=ac.sourceCode;var an=al.length;var V=0;var aa=ac.spans;var T=aa.length;var ah=0;var X=ac.decorations;var Y=X.length;var Z=0;X[Y]=an;var ar,aq;for(aq=ar=0;aq<Y;){if(X[aq]!==X[aq+2]){X[ar++]=X[aq++];X[ar++]=X[aq++]}else{aq+=2}}Y=ar;for(aq=ar=0;aq<Y;){var at=X[aq];var ab=X[aq+1];var W=aq+2;while(W+2<=Y&&X[W+1]===ab){W+=2}X[ar++]=at;X[ar++]=ab;aq=W}Y=X.length=ar;var ae=null;while(ah<T){var af=aa[ah];var S=aa[ah+2]||an;var ag=X[Z];var ap=X[Z+2]||an;var W=Math.min(S,ap);var ak=aa[ah+1];var U;if(ak.nodeType!==1&&(U=al.substring(V,W))){if(aj){U=U.replace(am,"\r")}ak.nodeValue=U;var ai=ak.ownerDocument;var ao=ai.createElement("SPAN");ao.className=X[Z+1];var ad=ak.parentNode;ad.replaceChild(ao,ak);ao.appendChild(ak);if(V<S){aa[ah+1]=ak=ai.createTextNode(al.substring(W,S));ad.insertBefore(ak,ao.nextSibling)}}V=W;if(V>=S){ah+=2}if(V>=ap){Z+=2}}}var t={};function c(U,V){for(var S=V.length;--S>=0;){var T=V[S];if(!t.hasOwnProperty(T)){t[T]=U}else{if(window.console){console.warn("cannot override language handler %s",T)}}}}function q(T,S){if(!(T&&t.hasOwnProperty(T))){T=/^\s*</.test(S)?"default-markup":"default-code"}return t[T]}c(K,["default-code"]);c(g([],[[F,/^[^<?]+/],[E,/^<!\w[^>]*(?:>|$)/],[j,/^<\!--[\s\S]*?(?:-\->|$)/],["lang-",/^<\?([\s\S]+?)(?:\?>|$)/],["lang-",/^<%([\s\S]+?)(?:%>|$)/],[L,/^(?:<[%?]|[%?]>)/],["lang-",/^<xmp\b[^>]*>([\s\S]+?)<\/xmp\b[^>]*>/i],["lang-js",/^<script\b[^>]*>([\s\S]*?)(<\/script\b[^>]*>)/i],["lang-css",/^<style\b[^>]*>([\s\S]*?)(<\/style\b[^>]*>)/i],["lang-in.tag",/^(<\/?[a-z][^<>]*>)/i]]),["default-markup","htm","html","mxml","xhtml","xml","xsl"]);c(g([[F,/^[\s]+/,null," \t\r\n"],[n,/^(?:\"[^\"]*\"?|\'[^\']*\'?)/,null,"\"'"]],[[m,/^^<\/?[a-z](?:[\w.:-]*\w)?|\/?>$/i],[P,/^(?!style[\s=]|on)[a-z](?:[\w:-]*\w)?/i],["lang-uq.val",/^=\s*([^>\'\"\s]*(?:[^>\'\"\s\/]|\/(?=\s)))/],[L,/^[=<>\/]+/],["lang-js",/^on\w+\s*=\s*\"([^\"]+)\"/i],["lang-js",/^on\w+\s*=\s*\'([^\']+)\'/i],["lang-js",/^on\w+\s*=\s*([^\"\'>\s]+)/i],["lang-css",/^style\s*=\s*\"([^\"]+)\"/i],["lang-css",/^style\s*=\s*\'([^\']+)\'/i],["lang-css",/^style\s*=\s*([^\"\'>\s]+)/i]]),["in.tag"]);c(g([],[[n,/^[\s\S]+/]]),["uq.val"]);c(i({keywords:l,hashComments:true,cStyleComments:true,types:e}),["c","cc","cpp","cxx","cyc","m"]);c(i({keywords:"null,true,false"}),["json"]);c(i({keywords:R,hashComments:true,cStyleComments:true,verbatimStrings:true,types:e}),["cs"]);c(i({keywords:x,cStyleComments:true}),["java"]);c(i({keywords:H,hashComments:true,multiLineStrings:true}),["bsh","csh","sh"]);c(i({keywords:I,hashComments:true,multiLineStrings:true,tripleQuotedStrings:true}),["cv","py"]);c(i({keywords:s,hashComments:true,multiLineStrings:true,regexLiterals:true}),["perl","pl","pm"]);c(i({keywords:f,hashComments:true,multiLineStrings:true,regexLiterals:true}),["rb"]);c(i({keywords:w,cStyleComments:true,regexLiterals:true}),["js"]);c(i({keywords:r,hashComments:3,cStyleComments:true,multilineStrings:true,tripleQuotedStrings:true,regexLiterals:true}),["coffee"]);c(g([],[[C,/^[\s\S]+/]]),["regex"]);function d(V){var U=V.langExtension;try{var S=a(V.sourceNode);var T=S.sourceCode;V.sourceCode=T;V.spans=S.spans;V.basePos=0;q(U,T)(V);D(V)}catch(W){if("console" in window){console.log(W&&W.stack?W.stack:W)}}}function y(W,V,U){var S=document.createElement("PRE");S.innerHTML=W;if(U){Q(S,U)}var T={langExtension:V,numberLines:U,sourceNode:S};d(T);return S.innerHTML}function b(ad){function Y(af){return document.getElementsByTagName(af)}var ac=[Y("pre"),Y("code"),Y("xmp")];var T=[];for(var aa=0;aa<ac.length;++aa){for(var Z=0,V=ac[aa].length;Z<V;++Z){T.push(ac[aa][Z])}}ac=null;var W=Date;if(!W.now){W={now:function(){return +(new Date)}}}var X=0;var S;var ab=/\blang(?:uage)?-([\w.]+)(?!\S)/;var ae=/\bprettyprint\b/;function U(){var ag=(window.PR_SHOULD_USE_CONTINUATION?W.now()+250:Infinity);for(;X<T.length&&W.now()<ag;X++){var aj=T[X];var ai=aj.className;if(ai.indexOf("prettyprint")>=0){var ah=ai.match(ab);var am;if(!ah&&(am=o(aj))&&"CODE"===am.tagName){ah=am.className.match(ab)}if(ah){ah=ah[1]}var al=false;for(var ak=aj.parentNode;ak;ak=ak.parentNode){if((ak.tagName==="pre"||ak.tagName==="code"||ak.tagName==="xmp")&&ak.className&&ak.className.indexOf("prettyprint")>=0){al=true;break}}if(!al){var af=aj.className.match(/\blinenums\b(?::(\d+))?/);af=af?af[1]&&af[1].length?+af[1]:true:false;if(af){Q(aj,af)}S={langExtension:ah,sourceNode:aj,numberLines:af};d(S)}}}if(X<T.length){setTimeout(U,250)}else{if(ad){ad()}}}U()}window.prettyPrintOne=y;window.prettyPrint=b;window.PR={createSimpleLexer:g,registerLangHandler:c,sourceDecorator:i,PR_ATTRIB_NAME:P,PR_ATTRIB_VALUE:n,PR_COMMENT:j,PR_DECLARATION:E,PR_KEYWORD:z,PR_LITERAL:G,PR_NOCODE:N,PR_PLAIN:F,PR_PUNCTUATION:L,PR_SOURCE:J,PR_STRING:C,PR_TAG:m,PR_TYPE:O}})();PR.registerLangHandler(PR.createSimpleLexer([],[[PR.PR_DECLARATION,/^<!\w[^>]*(?:>|$)/],[PR.PR_COMMENT,/^<\!--[\s\S]*?(?:-\->|$)/],[PR.PR_PUNCTUATION,/^(?:<[%?]|[%?]>)/],["lang-",/^<\?([\s\S]+?)(?:\?>|$)/],["lang-",/^<%([\s\S]+?)(?:%>|$)/],["lang-",/^<xmp\b[^>]*>([\s\S]+?)<\/xmp\b[^>]*>/i],["lang-handlebars",/^<script\b[^>]*type\s*=\s*['"]?text\/x-handlebars-template['"]?\b[^>]*>([\s\S]*?)(<\/script\b[^>]*>)/i],["lang-js",/^<script\b[^>]*>([\s\S]*?)(<\/script\b[^>]*>)/i],["lang-css",/^<style\b[^>]*>([\s\S]*?)(<\/style\b[^>]*>)/i],["lang-in.tag",/^(<\/?[a-z][^<>]*>)/i],[PR.PR_DECLARATION,/^{{[#^>/]?\s*[\w.][^}]*}}/],[PR.PR_DECLARATION,/^{{&?\s*[\w.][^}]*}}/],[PR.PR_DECLARATION,/^{{{>?\s*[\w.][^}]*}}}/],[PR.PR_COMMENT,/^{{![^}]*}}/]]),["handlebars","hbs"]);PR.registerLangHandler(PR.createSimpleLexer([[PR.PR_PLAIN,/^[ \t\r\n\f]+/,null," \t\r\n\f"]],[[PR.PR_STRING,/^\"(?:[^\n\r\f\\\"]|\\(?:\r\n?|\n|\f)|\\[\s\S])*\"/,null],[PR.PR_STRING,/^\'(?:[^\n\r\f\\\']|\\(?:\r\n?|\n|\f)|\\[\s\S])*\'/,null],["lang-css-str",/^url\(([^\)\"\']*)\)/i],[PR.PR_KEYWORD,/^(?:url|rgb|\!important|@import|@page|@media|@charset|inherit)(?=[^\-\w]|$)/i,null],["lang-css-kw",/^(-?(?:[_a-z]|(?:\\[0-9a-f]+ ?))(?:[_a-z0-9\-]|\\(?:\\[0-9a-f]+ ?))*)\s*:/i],[PR.PR_COMMENT,/^\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\//],[PR.PR_COMMENT,/^(?:<!--|-->)/],[PR.PR_LITERAL,/^(?:\d+|\d*\.\d+)(?:%|[a-z]+)?/i],[PR.PR_LITERAL,/^#(?:[0-9a-f]{3}){1,2}/i],[PR.PR_PLAIN,/^-?(?:[_a-z]|(?:\\[\da-f]+ ?))(?:[_a-z\d\-]|\\(?:\\[\da-f]+ ?))*/i],[PR.PR_PUNCTUATION,/^[^\s\w\'\"]+/]]),["css"]);PR.registerLangHandler(PR.createSimpleLexer([],[[PR.PR_KEYWORD,/^-?(?:[_a-z]|(?:\\[\da-f]+ ?))(?:[_a-z\d\-]|\\(?:\\[\da-f]+ ?))*/i]]),["css-kw"]);PR.registerLangHandler(PR.createSimpleLexer([],[[PR.PR_STRING,/^[^\)\"\']+/]]),["css-str"]);

```

---

## File: coverage/lcov-report/sorter.js

```javascript
/* eslint-disable */
var addSorting = (function() {
    'use strict';
    var cols,
        currentSort = {
            index: 0,
            desc: false
        };

    // returns the summary table element
    function getTable() {
        return document.querySelector('.coverage-summary');
    }
    // returns the thead element of the summary table
    function getTableHeader() {
        return getTable().querySelector('thead tr');
    }
    // returns the tbody element of the summary table
    function getTableBody() {
        return getTable().querySelector('tbody');
    }
    // returns the th element for nth column
    function getNthColumn(n) {
        return getTableHeader().querySelectorAll('th')[n];
    }

    function onFilterInput() {
        const searchValue = document.getElementById('fileSearch').value;
        const rows = document.getElementsByTagName('tbody')[0].children;

        // Try to create a RegExp from the searchValue. If it fails (invalid regex),
        // it will be treated as a plain text search
        let searchRegex;
        try {
            searchRegex = new RegExp(searchValue, 'i'); // 'i' for case-insensitive
        } catch (error) {
            searchRegex = null;
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            let isMatch = false;

            if (searchRegex) {
                // If a valid regex was created, use it for matching
                isMatch = searchRegex.test(row.textContent);
            } else {
                // Otherwise, fall back to the original plain text search
                isMatch = row.textContent
                    .toLowerCase()
                    .includes(searchValue.toLowerCase());
            }

            row.style.display = isMatch ? '' : 'none';
        }
    }

    // loads the search box
    function addSearchBox() {
        var template = document.getElementById('filterTemplate');
        var templateClone = template.content.cloneNode(true);
        templateClone.getElementById('fileSearch').oninput = onFilterInput;
        template.parentElement.appendChild(templateClone);
    }

    // loads all columns
    function loadColumns() {
        var colNodes = getTableHeader().querySelectorAll('th'),
            colNode,
            cols = [],
            col,
            i;

        for (i = 0; i < colNodes.length; i += 1) {
            colNode = colNodes[i];
            col = {
                key: colNode.getAttribute('data-col'),
                sortable: !colNode.getAttribute('data-nosort'),
                type: colNode.getAttribute('data-type') || 'string'
            };
            cols.push(col);
            if (col.sortable) {
                col.defaultDescSort = col.type === 'number';
                colNode.innerHTML =
                    colNode.innerHTML + '<span class="sorter"></span>';
            }
        }
        return cols;
    }
    // attaches a data attribute to every tr element with an object
    // of data values keyed by column name
    function loadRowData(tableRow) {
        var tableCols = tableRow.querySelectorAll('td'),
            colNode,
            col,
            data = {},
            i,
            val;
        for (i = 0; i < tableCols.length; i += 1) {
            colNode = tableCols[i];
            col = cols[i];
            val = colNode.getAttribute('data-value');
            if (col.type === 'number') {
                val = Number(val);
            }
            data[col.key] = val;
        }
        return data;
    }
    // loads all row data
    function loadData() {
        var rows = getTableBody().querySelectorAll('tr'),
            i;

        for (i = 0; i < rows.length; i += 1) {
            rows[i].data = loadRowData(rows[i]);
        }
    }
    // sorts the table using the data for the ith column
    function sortByIndex(index, desc) {
        var key = cols[index].key,
            sorter = function(a, b) {
                a = a.data[key];
                b = b.data[key];
                return a < b ? -1 : a > b ? 1 : 0;
            },
            finalSorter = sorter,
            tableBody = document.querySelector('.coverage-summary tbody'),
            rowNodes = tableBody.querySelectorAll('tr'),
            rows = [],
            i;

        if (desc) {
            finalSorter = function(a, b) {
                return -1 * sorter(a, b);
            };
        }

        for (i = 0; i < rowNodes.length; i += 1) {
            rows.push(rowNodes[i]);
            tableBody.removeChild(rowNodes[i]);
        }

        rows.sort(finalSorter);

        for (i = 0; i < rows.length; i += 1) {
            tableBody.appendChild(rows[i]);
        }
    }
    // removes sort indicators for current column being sorted
    function removeSortIndicators() {
        var col = getNthColumn(currentSort.index),
            cls = col.className;

        cls = cls.replace(/ sorted$/, '').replace(/ sorted-desc$/, '');
        col.className = cls;
    }
    // adds sort indicators for current column being sorted
    function addSortIndicators() {
        getNthColumn(currentSort.index).className += currentSort.desc
            ? ' sorted-desc'
            : ' sorted';
    }
    // adds event listeners for all sorter widgets
    function enableUI() {
        var i,
            el,
            ithSorter = function ithSorter(i) {
                var col = cols[i];

                return function() {
                    var desc = col.defaultDescSort;

                    if (currentSort.index === i) {
                        desc = !currentSort.desc;
                    }
                    sortByIndex(i, desc);
                    removeSortIndicators();
                    currentSort.index = i;
                    currentSort.desc = desc;
                    addSortIndicators();
                };
            };
        for (i = 0; i < cols.length; i += 1) {
            if (cols[i].sortable) {
                // add the click event handler on the th so users
                // dont have to click on those tiny arrows
                el = getNthColumn(i).querySelector('.sorter').parentElement;
                if (el.addEventListener) {
                    el.addEventListener('click', ithSorter(i));
                } else {
                    el.attachEvent('onclick', ithSorter(i));
                }
            }
        }
    }
    // adds sorting functionality to the UI
    return function() {
        if (!getTable()) {
            return;
        }
        cols = loadColumns();
        loadData();
        addSearchBox();
        addSortIndicators();
        enableUI();
    };
})();

window.addEventListener('load', addSorting);

```

---

## File: coverage/lcov.info

```
TN:
SF:src/components/layout/CookieBanner.tsx
FN:7,CookieBanner
FN:9,(anonymous_1)
FN:13,(anonymous_2)
FN:18,(anonymous_3)
FN:20,(anonymous_4)
FN:23,(anonymous_5)
FN:29,(anonymous_6)
FNF:7
FNH:6
FNDA:6,CookieBanner
FNDA:4,(anonymous_1)
FNDA:4,(anonymous_2)
FNDA:0,(anonymous_3)
FNDA:4,(anonymous_4)
FNDA:1,(anonymous_5)
FNDA:1,(anonymous_6)
DA:8,6
DA:9,6
DA:10,4
DA:13,6
DA:14,4
DA:15,1
DA:18,4
DA:19,4
DA:20,4
DA:23,6
DA:24,1
DA:25,1
DA:26,1
DA:29,6
DA:30,1
DA:31,1
DA:32,1
DA:35,6
LF:18
LH:18
BRDA:10,0,0,4
BRDA:10,0,1,4
BRDA:14,1,0,1
BRDA:14,1,1,3
BRDA:14,2,0,4
BRDA:14,2,1,4
BRDA:37,3,0,6
BRDA:37,3,1,3
BRF:8
BRH:8
end_of_record
TN:
SF:src/lib/analytics.ts
FN:6,(anonymous_0)
FN:17,(anonymous_1)
FN:24,(anonymous_2)
FN:30,(anonymous_3)
FN:34,(anonymous_4)
FN:38,(anonymous_5)
FN:42,(anonymous_6)
FN:46,(anonymous_7)
FNF:8
FNH:8
FNDA:8,(anonymous_0)
FNDA:1,(anonymous_1)
FNDA:6,(anonymous_2)
FNDA:1,(anonymous_3)
FNDA:1,(anonymous_4)
FNDA:1,(anonymous_5)
FNDA:1,(anonymous_6)
FNDA:1,(anonymous_7)
DA:4,1
DA:6,1
DA:7,8
DA:8,1
DA:9,1
DA:10,1
DA:12,0
DA:17,1
DA:18,1
DA:19,1
DA:20,1
DA:24,1
DA:25,6
DA:26,6
DA:30,1
DA:31,1
DA:34,1
DA:35,1
DA:38,1
DA:39,1
DA:42,1
DA:43,1
DA:46,1
DA:47,1
LF:24
LH:23
BRDA:7,0,0,1
BRDA:7,0,1,7
BRDA:7,1,0,8
BRDA:7,1,1,8
BRDA:18,2,0,1
BRDA:18,2,1,0
BRDA:25,3,0,6
BRDA:25,3,1,0
BRF:8
BRH:6
end_of_record
TN:
SF:src/lib/utils.ts
FN:3,(anonymous_0)
FNF:1
FNH:1
FNDA:6,(anonymous_0)
DA:3,6
LF:1
LH:1
BRF:0
BRH:0
end_of_record

```

---

## File: e2e/analytics.spec.ts

```typescript
import { test, expect } from '@playwright/test';

test('cookie banner is visible and can be accepted', async ({ page }) => {
  await page.goto('/');

  // Expect cookie banner text to be visible
  await expect(page.getByText(/We use cookies to analyze site traffic/i)).toBeVisible();

  // Click accept
  await page.getByRole('button', { name: /accept/i }).click();

  // Banner should disappear
  await expect(page.getByText(/We use cookies to analyze site traffic/i)).not.toBeVisible();
});

test('analytics events are attached to phone link', async ({ page }) => {
  await page.goto('/');

  // There are two phone links (navbar and footer), let's just make sure one is present and has the href
  const phoneLinks = page.locator('a[href^="tel:"]');
  await expect(phoneLinks.first()).toBeVisible();
});

```

---

## File: e2e/booking.spec.ts

```typescript
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Capture console logs from the browser
  page.on('console', (msg) => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`)
  })

  // Define mock submit function in browser window context
  await page.addInitScript(() => {
    window.__MOCK_SUBMIT__ = (data: unknown, language: unknown, source: unknown) => {
      console.log('Intercepted submitBooking in E2E test:', { data, language, source })
      return Promise.resolve('mocked-booking-id')
    }
  })
})

test('Travis can complete a full booking in under 3 minutes', async ({ page }) => {
  await page.goto('/booking')

  // Step 1: Service type + property details
  // Select standard cleaning
  await page.getByRole('radio', { name: /standard cleaning/i }).first().click()
  // Select 3–4 Bedroom Home
  await page.getByRole('radio', { name: /3.4 bedroom/i }).first().click()
  // Increase bedrooms by 1 (3 -> 4)
  await page.getByRole('button', { name: /increase bedrooms/i }).click()

  // Step 2: Schedule
  // Select biweekly frequency
  await page.getByRole('radio', { name: /biweekly/i }).first().click()
  
  // Set preferred date to 3 days in the future in local timezone (safe from UTC shifts)
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 3)
  const yyyy = futureDate.getFullYear()
  const mm = String(futureDate.getMonth() + 1).padStart(2, '0')
  const dd = String(futureDate.getDate()).padStart(2, '0')
  const dateStr = `${yyyy}-${mm}-${dd}`
  
  await page.locator('#preferredDate').fill(dateStr)

  // Step 3: Contact details
  await page.locator('#firstName').fill('Travis')
  await page.locator('#lastName').fill('McLeod')
  await page.locator('#email').fill('travis@test.com')
  await page.locator('#phone').fill('6135550001')
  await page.locator('#address').fill('123 Main St, Long Sault ON')

  // Step 4: Submit
  // Verify review table summary is present
  await expect(page.getByText('Standard Cleaning').first()).toBeVisible()
  await expect(page.getByText('Every two weeks').first()).toBeVisible()

  // Click submit (Confirm Booking)
  await page.getByRole('button', { name: /confirm booking/i }).click()

  // Wait for redirect to /thank-you or print error if it fails
  try {
    await expect(page).toHaveURL(/\/thank-you/, { timeout: 5000 })
  } catch (err) {
    const alerts = await page.getByRole('alert').allInnerTexts()
    console.error('Submission failed! Visible alerts on page:', alerts)
    throw err
  }

  await expect(page.getByText(/booking is confirmed/i)).toBeVisible()
})

test('Required field validation shows errors on empty submit', async ({ page }) => {
  await page.goto('/booking')
  
  // Click Confirm Booking directly without filling preferredDate or contact info
  await page.getByRole('button', { name: /confirm booking/i }).click()

  // Expect alerts/error messages to show up
  const alertLocator = page.getByRole('alert')
  await expect(alertLocator.first()).toBeVisible()
})

```

---

## File: e2e/language.spec.ts

```typescript
import { test, expect } from '@playwright/test'

test('Language toggle switches all nav strings to French', async ({ page }) => {
  await page.goto('/')
  // Select the desktop language toggle
  await page.locator('#lang-toggle-desktop').click()
  // Check that the specific desktop CTA in the navbar switches to French
  await expect(page.locator('#cta-book-now-nav')).toHaveText(/réservez maintenant/i)
})

test('French booking page has French field labels', async ({ page }) => {
  // Opening the page with query param lang=fr should persist the French locale
  await page.goto('/?lang=fr')
  await page.goto('/booking')
  await expect(page.getByText(/quel type de nettoyage/i)).toBeVisible()
})

```

---

## File: e2e/phase4.spec.ts

```typescript
import { test, expect } from '@playwright/test'

test('Can view blog list and navigate to individual blog post', async ({ page }) => {
  // 1. Visit the blog listing page
  await page.goto('/blog')
  await expect(page).toHaveTitle(/Fresh Nest Co. Blog/i)
  
  // Verify heading is present
  await expect(page.getByRole('heading', { name: /Fresh Nest Blog/i, level: 1 })).toBeVisible()
  
  // Verify that the cost guide article is in the listing
  const costGuideArticle = page.getByRole('heading', { name: /How Much Does House Cleaning Cost in Cornwall/i, level: 2 })
  await expect(costGuideArticle).toBeVisible()

  // 2. Click "Read More" on the first blog post
  await page.getByRole('link', { name: /How Much Does House Cleaning Cost in Cornwall/i }).click()

  // Verify URL redirection to slug path
  await expect(page).toHaveURL(/\/blog\/cleaning-cost-cornwall/)

  // Verify that the full article header is displayed
  await expect(page.getByRole('heading', { name: /How Much Does House Cleaning Cost in Cornwall/i, level: 1 })).toBeVisible()
})

test('Referral URL parameter successfully populates code input in booking form', async ({ page }) => {
  // Navigate to booking form with referral code query parameter
  await page.goto('/booking?ref=MARGARET-4B52')

  // Get the referral code input field
  const promoInput = page.locator('#referralCodeInput')
  
  // Verify it contains the value from the URL query parameter
  await expect(promoInput).toHaveValue('MARGARET-4B52')
})

```

---

## File: eslint.config.js

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import queryPlugin from '@tanstack/eslint-plugin-query'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  ...queryPlugin.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'playwright.config.ts',
            'vitest.config.ts',
            'e2e/*.ts'
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])

```

---

## File: firebase.json

```json
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
      "public": "dist",
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
      "public": "dist",
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
    }
  ],
  "firestore": [
    { "database": "(default)", "rules": "firestore.rules", "indexes": "firestore.indexes.json" },
    { "database": "freshnest-dev", "rules": "firestore.dev.rules", "indexes": "firestore.indexes.json" }
  ],
  "emulators": { "firestore": { "port": 8080 }, "hosting": { "port": 5001 }, "ui": { "enabled": true } }
}

```

---

## File: firestore.dev.rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: Verify if the user's Google auth email exists in the admins allowlist collection
    function isAdmin() {
      return request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.token.email));
    }

    // 1. Bookings Collection
    match /bookings/{bookingId} {
      
      // Public Booking Creation
      allow create: if
        // A. Verify presence of all required fields (18 fields matching schema)
        request.resource.data.keys().hasAll([
          'firstName', 'lastName', 'email', 'phone', 'language',
          'propertyType', 'bedrooms', 'bathrooms', 'frequency', 'pets',
          'address', 'serviceType', 'preferredDate', 'leadSource', 'status',
          'assignedTo', 'isAirbnb', 'photoConfirmation', 'createdAt'
        ])
        
        // B. Ensure types are correct
        && request.resource.data.firstName is string && request.resource.data.firstName.size() > 0
        && request.resource.data.lastName is string && request.resource.data.lastName.size() > 0
        && request.resource.data.email is string && request.resource.data.email.matches('.+@.+\\..+')
        && request.resource.data.phone is string && request.resource.data.phone.size() >= 10
        && request.resource.data.address is string && request.resource.data.address.size() >= 5
        && request.resource.data.bedrooms is int && request.resource.data.bedrooms >= 0
        && request.resource.data.bathrooms is int && request.resource.data.bathrooms >= 0
        && request.resource.data.pets is bool
        && request.resource.data.isAirbnb is bool
        && request.resource.data.photoConfirmation is bool
        
        // C. Enforce allowed values (Enums)
        && request.resource.data.language in ['en', 'fr']
        && request.resource.data.status == 'pending' // No customer can self-confirm
        && request.resource.data.leadSource in ['organic', 'google', 'referral', 'facebook', 'direct']
        && request.resource.data.frequency in ['one-time', 'weekly', 'biweekly', 'monthly']
        && request.resource.data.serviceType in ['standard', 'deep', 'moveout', 'postconstruction', 'airbnb', 'commercial']
        && request.resource.data.propertyType in ['apartment', '1-2bed', '3-4bed', '5+bed', 'commercial']
        
        // D. Validate constraints
        && request.resource.data.preferredDate is string && request.resource.data.preferredDate.size() == 10 // YYYY-MM-DD
        && request.resource.data.assignedTo == null // Cannot self-assign staff on create
        && request.resource.data.createdAt == request.time // Must use server timestamp
        
        // E. Validate conditional/optional fields
        && (!('marketingConsent' in request.resource.data) 
            || (request.resource.data.marketingConsent is bool 
                && request.resource.data.consentTimestamp is timestamp
                && request.resource.data.consentMethod == 'booking-form-v2'))
        && (!('addOns' in request.resource.data) || request.resource.data.addOns is list)
        && (!('squareFootage' in request.resource.data) || request.resource.data.squareFootage is int)
        && (!('preferredCleaner' in request.resource.data) 
            || (request.resource.data.preferredCleaner is string || request.resource.data.preferredCleaner == null))
        && (!('referredBy' in request.resource.data)
            || (request.resource.data.referredBy is string || request.resource.data.referredBy == null))
        && (!('notes' in request.resource.data) || request.resource.data.notes is string);

      // Admin read & update
      allow read, update: if isAdmin();
      
      // Permanently deleting bookings is forbidden
      allow delete: if false;
    }

    // 2. Admins Collection
    match /admins/{email} {
      // Admins can read their own whitelist document to verify authentication
      allow read: if request.auth != null && request.auth.token.email == email;
      // No client code can modify the allowlist
      allow write: if false;
    }

    // 3. Reviews Collection
    match /reviews/{reviewId} {
      // Anyone can read approved reviews
      allow read: if resource.data.approved == true;
      // All writes restricted to authenticated administrators
      allow write: if isAdmin();
    }

    // 4. Referrals Collection
    match /referrals/{referralCode} {
      // Unauthenticated reads permitted to validate promo code existence in client form
      allow read: if true;
      // Writes reserved for authenticated administrators
      allow write: if isAdmin();
    }

    // 5. Default Deny-All for other collections (e.g. staff)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}


```

---

## File: firestore.indexes.json

```json
{
  "indexes": [],
  "fieldOverrides": []
}

```

---

## File: firestore.rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: Verify if the user's Google auth email exists in the admins allowlist collection
    function isAdmin() {
      return request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.token.email));
    }

    // 1. Bookings Collection
    match /bookings/{bookingId} {
      
      // Public Booking Creation
      allow create: if
        // A. Verify presence of all required fields (18 fields matching schema)
        request.resource.data.keys().hasAll([
          'firstName', 'lastName', 'email', 'phone', 'language',
          'propertyType', 'bedrooms', 'bathrooms', 'frequency', 'pets',
          'address', 'serviceType', 'preferredDate', 'leadSource', 'status',
          'assignedTo', 'isAirbnb', 'photoConfirmation', 'createdAt'
        ])
        
        // B. Ensure types are correct
        && request.resource.data.firstName is string && request.resource.data.firstName.size() > 0
        && request.resource.data.lastName is string && request.resource.data.lastName.size() > 0
        && request.resource.data.email is string && request.resource.data.email.matches('.+@.+\\..+')
        && request.resource.data.phone is string && request.resource.data.phone.size() >= 10
        && request.resource.data.address is string && request.resource.data.address.size() >= 5
        && request.resource.data.bedrooms is int && request.resource.data.bedrooms >= 0
        && request.resource.data.bathrooms is int && request.resource.data.bathrooms >= 0
        && request.resource.data.pets is bool
        && request.resource.data.isAirbnb is bool
        && request.resource.data.photoConfirmation is bool
        
        // C. Enforce allowed values (Enums)
        && request.resource.data.language in ['en', 'fr']
        && request.resource.data.status == 'pending' // No customer can self-confirm
        && request.resource.data.leadSource in ['organic', 'google', 'referral', 'facebook', 'direct']
        && request.resource.data.frequency in ['one-time', 'weekly', 'biweekly', 'monthly']
        && request.resource.data.serviceType in ['standard', 'deep', 'moveout', 'postconstruction', 'airbnb', 'commercial']
        && request.resource.data.propertyType in ['apartment', '1-2bed', '3-4bed', '5+bed', 'commercial']
        
        // D. Validate constraints
        && request.resource.data.preferredDate is string && request.resource.data.preferredDate.size() == 10 // YYYY-MM-DD
        && request.resource.data.assignedTo == null // Cannot self-assign staff on create
        && request.resource.data.createdAt == request.time // Must use server timestamp
        
        // E. Validate conditional/optional fields
        && (!('marketingConsent' in request.resource.data) 
            || (request.resource.data.marketingConsent is bool 
                && request.resource.data.consentTimestamp is timestamp
                && request.resource.data.consentMethod == 'booking-form-v2'))
        && (!('addOns' in request.resource.data) || request.resource.data.addOns is list)
        && (!('squareFootage' in request.resource.data) || request.resource.data.squareFootage is int)
        && (!('preferredCleaner' in request.resource.data) 
            || (request.resource.data.preferredCleaner is string || request.resource.data.preferredCleaner == null))
        && (!('notes' in request.resource.data) || request.resource.data.notes is string);

      // Admin read & update
      allow read, update: if isAdmin();
      
      // Permanently deleting bookings is forbidden
      allow delete: if false;
    }

    // 2. Admins Collection
    match /admins/{email} {
      // Admins can read their own whitelist document to verify authentication
      allow read: if request.auth != null && request.auth.token.email == email;
      // No client code can modify the allowlist
      allow write: if false;
    }

    // 3. Reviews Collection
    match /reviews/{reviewId} {
      // Anyone can read approved reviews
      allow read: if resource.data.approved == true;
      // All writes restricted to authenticated administrators
      allow write: if isAdmin();
    }

    // 4. Default Deny-All for other collections (e.g. staff)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}


```

---

## File: functions/.gitignore

```
node_modules/
lib/
.env
.env.local

```

---

## File: functions/package.json

```json
{
  "name": "fresh-nest-functions",
  "version": "1.0.0",
  "private": true,
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy": "firebase deploy --only functions"
  },
  "engines": {
    "node": "20"
  },
  "dependencies": {
    "firebase-admin": "^13.0.0",
    "firebase-functions": "^7.2.5",
    "resend": "^4.0.0",
    "twilio": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}

```

---

## File: functions/src/emailTemplates.ts

```typescript
export interface BookingData {
  firstName: string
  lastName: string
  email: string
  phone: string
  language: string
  serviceType: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  frequency: string
  preferredDate: string
  address: string
  addOns?: string[]
  notes?: string
  preferredCleaner?: string | null
  pets?: boolean
  isAirbnb?: boolean
  photoConfirmation?: boolean
  marketingConsent?: boolean
  leadSource?: string
  squareFootage?: number
  referralCode?: string | null
  referredBy?: string | null
  assignedTo?: string | null
}

function esc(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const SERVICE_EN: Record<string, string> = {
  standard:         'Standard Cleaning',
  deep:             'Deep Clean',
  moveout:          'Move-Out Cleaning',
  postconstruction: 'Post-Construction',
  airbnb:           'Airbnb Turnover',
  commercial:       'Commercial Cleaning',
}

const SERVICE_FR: Record<string, string> = {
  standard:         'Nettoyage standard',
  deep:             'Nettoyage en profondeur',
  moveout:          'Nettoyage de déménagement',
  postconstruction: 'Post-construction',
  airbnb:           'Rotation Airbnb',
  commercial:       'Nettoyage commercial',
}

const FREQ_EN: Record<string, string> = {
  'one-time': 'One-time',
  weekly:     'Weekly',
  biweekly:   'Bi-weekly',
  monthly:    'Monthly',
}

const FREQ_FR: Record<string, string> = {
  'one-time': 'Ponctuel',
  weekly:     'Hebdomadaire',
  biweekly:   'Aux deux semaines',
  monthly:    'Mensuel',
}

// ── Owner notification (plain text, always EN) ────────────────────────────

export function ownerSubject(b: BookingData): string {
  const svc = SERVICE_EN[b.serviceType] ?? b.serviceType
  return `New booking — ${b.firstName} ${b.lastName} · ${svc} · ${b.preferredDate}`
}

export function ownerText(b: BookingData, docId: string): string {
  const addOns = (b.addOns ?? []).join(', ') || '—'
  return [
    'New booking received — Fresh Nest Co.',
    '',
    `Name:               ${b.firstName} ${b.lastName}`,
    `Email:              ${b.email}`,
    `Phone:              ${b.phone}`,
    `Language:           ${b.language}`,
    `Service:            ${SERVICE_EN[b.serviceType] ?? b.serviceType}`,
    `Property:           ${b.propertyType} — ${b.bedrooms}br / ${b.bathrooms}ba`,
    `Frequency:          ${b.frequency}`,
    `Preferred date:     ${b.preferredDate}`,
    `Address:            ${b.address}`,
    `Add-ons:            ${addOns}`,
    `Pets:               ${b.pets ? 'Yes' : 'No'}`,
    `Notes:              ${b.notes || '—'}`,
    `Preferred cleaner:  ${b.preferredCleaner || '—'}`,
    `Airbnb:             ${b.isAirbnb ? 'Yes' : 'No'}`,
    `Photo confirmation: ${b.photoConfirmation ? 'Yes' : 'No'}`,
    `Marketing consent:  ${b.marketingConsent ? 'Yes' : 'No'}`,
    `Lead source:        ${b.leadSource ?? '—'}`,
    `Booking ID:         ${docId}`,
  ].join('\n')
}

// ── Client confirmation (HTML, EN or FR) ─────────────────────────────────

export function clientSubject(lang: 'en' | 'fr'): string {
  return lang === 'fr'
    ? 'Votre nettoyage est réservé — Fresh Nest Co.'
    : 'Your cleaning is booked — Fresh Nest Co.'
}

function detailsTable(rows: Array<[string, string]>): string {
  const rowHtml = rows.map(([label, value]) => `
              <tr>
                <td style="padding:12px 16px;color:#7a8f96;font-size:14px;width:38%;
                           border-bottom:1px solid #e8ddd0;">${label}</td>
                <td style="padding:12px 16px;color:#2c3a40;font-size:15px;
                           border-bottom:1px solid #e8ddd0;">${value}</td>
              </tr>`).join('')

  return `<table width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #e8ddd0;border-radius:4px;
                          margin-bottom:24px;border-collapse:collapse;">
              ${rowHtml}
            </table>`
}

export function clientHtml(b: BookingData, lang: 'en' | 'fr'): string {
  const isFr = lang === 'fr'
  const serviceName = isFr
    ? (SERVICE_FR[b.serviceType] ?? b.serviceType)
    : (SERVICE_EN[b.serviceType] ?? b.serviceType)
  const freqName = isFr
    ? (FREQ_FR[b.frequency] ?? b.frequency)
    : (FREQ_EN[b.frequency] ?? b.frequency)

  const heading    = isFr ? 'Votre réservation est confirmée !' : 'Your booking is confirmed!'
  const greeting   = isFr
    ? `Merci, ${esc(b.firstName)}. Voici les détails de votre réservation :`
    : `Thank you, ${esc(b.firstName)}. Here's what we have scheduled:`
  const nextSteps  = isFr
    ? 'Nous confirmerons l\'heure exacte dans les 24 heures.'
    : 'We\'ll confirm the exact time within 24 hours.'
  const callUs     = isFr
    ? 'Des questions ? Appelez-nous au'
    : 'Questions? Call us at'
  const signOff    = isFr ? '— L\'équipe Fresh Nest Co.' : '— The Fresh Nest Co. Team'
  const tagline    = isFr
    ? 'Services de nettoyage &amp; d\'organisation'
    : 'Cleaning &amp; Organizing Services'

  const labelService  = isFr ? 'Service'         : 'Service'
  const labelDate     = isFr ? 'Date préférée'   : 'Preferred date'
  const labelFreq     = isFr ? 'Fréquence'       : 'Frequency'
  const labelAddress  = isFr ? 'Adresse'         : 'Service address'

  const table = detailsTable([
    [labelService,  esc(serviceName)],
    [labelDate,     esc(b.preferredDate)],
    [labelFreq,     esc(freqName)],
    [labelAddress,  esc(b.address)],
  ])

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${esc(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#fdfaf6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#fdfaf6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="max-width:600px;background:#ffffff;
                    border:1px solid #e8ddd0;border-radius:4px;">

        <!-- Header -->
        <tr>
          <td style="background:#5b7e8f;padding:24px 32px;border-radius:4px 4px 0 0;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:600;
                      letter-spacing:0.5px;">Fresh Nest Co.</p>
            <p style="margin:4px 0 0;color:#d6e5ec;font-size:13px;">${tagline}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 8px;color:#2c3a40;font-size:24px;font-weight:400;">
              ${heading}
            </h1>
            <p style="margin:0 0 24px;color:#7a8f96;font-size:16px;">${greeting}</p>
            ${table}
            <p style="margin:0 0 8px;color:#2c3a40;font-size:16px;">${nextSteps}</p>
            <p style="margin:0 0 24px;color:#7a8f96;font-size:16px;">
              ${callUs}
              <a href="tel:+16139353555"
                 style="color:#5b7e8f;text-decoration:none;font-weight:600;">
                (613) 935-3555
              </a>
            </p>
            <p style="margin:0;color:#7a8f96;font-size:14px;">${signOff}</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f7f3ee;
                     border-top:1px solid #e8ddd0;border-radius:0 0 4px 4px;">
            <p style="margin:0;color:#7a8f96;font-size:12px;text-align:center;">
              Fresh Nest Co. &middot; Cornwall ON &middot; (613) 935-3555
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

```

---

## File: functions/src/index.ts

```typescript
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { defineSecret } from 'firebase-functions/params'
import { sendOwnerNotification, sendClientConfirmation } from './sendEmail'
import { sendSmsConfirmation, sendSmsReminder } from './sendSms'
import type { BookingData } from './emailTemplates'

initializeApp()

const RESEND_API_KEY       = defineSecret('RESEND_API_KEY')
const OWNER_EMAIL          = defineSecret('OWNER_EMAIL')
const TWILIO_ACCOUNT_SID   = defineSecret('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN    = defineSecret('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER  = defineSecret('TWILIO_PHONE_NUMBER')

export const onBookingCreated = onDocumentCreated(
  {
    document: 'bookings/{docId}',
    database: '(default)',
    secrets:  [RESEND_API_KEY, OWNER_EMAIL, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async (event) => {
    const booking = event.data?.data() as BookingData | undefined
    if (!booking) return

    // E31: Generate referral code and write to referrals collection
    const firstName = booking.firstName || 'CLIENT'
    const docId = event.params['docId']
    const refCode = `${firstName.trim().toUpperCase()}-${docId.substring(0, 4).toUpperCase()}`

    if (!booking.referralCode) {
      const db = getFirestore()
      try {
        await db.collection('referrals').doc(refCode).set({
          ownerName: `${booking.firstName} ${booking.lastName ? booking.lastName.charAt(0) + '.' : ''}`,
          bookingId: docId,
          active: true,
          createdAt: new Date(),
        })
        await db.collection('bookings').doc(docId).update({ referralCode: refCode })
        booking.referralCode = refCode
      } catch (err) {
        console.error('[onBookingCreated] Failed to generate referral code:', err)
      }
    }

    const emailConfig = {
      resendApiKey: RESEND_API_KEY.value(),
      ownerEmail:   OWNER_EMAIL.value(),
      fromEmail:    process.env['FROM_EMAIL'] ?? 'Fresh Nest Co. <noreply@freshnestco.ca>',
    }

    const smsConfig = {
      accountSid: TWILIO_ACCOUNT_SID.value(),
      authToken:  TWILIO_AUTH_TOKEN.value(),
      fromNumber: TWILIO_PHONE_NUMBER.value(),
    }

    const results = await Promise.allSettled([
      sendOwnerNotification(booking, event.params['docId'], emailConfig),
      sendClientConfirmation(booking, emailConfig),
      sendSmsConfirmation(booking, smsConfig),
    ])

    const labels = ['owner email', 'client email', 'client SMS']
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`[onBookingCreated] ${labels[i]} failed:`, result.reason)
      }
    })
  },
)

export const onDailyReminderCheck = onSchedule(
  {
    schedule: '0 13 * * *',
    timeZone: 'UTC',
    secrets:  [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER],
  },
  async () => {
    // Explicitly target the production database — we never send SMS reminders for test bookings
    // in freshnest-dev. This is intentional. See docs/firestore-schema.md for DB architecture.
    const db = getFirestore('(default)')

    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    const tomorrowStr = tomorrow.toISOString().slice(0, 10)

    const snapshot = await db
      .collection('bookings')
      .where('preferredDate', '==', tomorrowStr)
      .where('status', 'in', ['pending', 'confirmed'])
      .get()

    if (snapshot.empty) {
      console.log(`[onDailyReminderCheck] No reminders for ${tomorrowStr}`)
      return
    }

    const smsConfig = {
      accountSid: TWILIO_ACCOUNT_SID.value(),
      authToken:  TWILIO_AUTH_TOKEN.value(),
      fromNumber: TWILIO_PHONE_NUMBER.value(),
    }

    const results = await Promise.allSettled(
      snapshot.docs.map(doc => {
        const d = doc.data()
        return sendSmsReminder(
          d['phone'] as string,
          d['language'] as string,
          d['preferredDate'] as string,
          smsConfig,
        )
      }),
    )

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`[onDailyReminderCheck] doc ${snapshot.docs[i]?.id} failed:`, result.reason)
      }
    })

    console.log(`[onDailyReminderCheck] Processed ${snapshot.size} reminder(s) for ${tomorrowStr}`)
  },
)

export const onDailyRecurringRenewal = onSchedule(
  {
    schedule: '0 2 * * *', // Run at 2 AM every day
    timeZone: 'UTC',
  },
  async () => {
    const db = getFirestore('(default)')
    const today = new Date()
    const fourteenDaysOut = new Date()
    fourteenDaysOut.setUTCDate(fourteenDaysOut.getUTCDate() + 14)
    const fourteenDaysOutStr = fourteenDaysOut.toISOString().slice(0, 10)

    console.log(`[onDailyRecurringRenewal] Running check for date threshold: ${fourteenDaysOutStr}`)

    const snapshot = await db
      .collection('bookings')
      .where('status', 'in', ['confirmed', 'completed'])
      .where('frequency', 'in', ['weekly', 'biweekly', 'monthly'])
      .get()

    if (snapshot.empty) {
      console.log('[onDailyRecurringRenewal] No active recurring bookings found.')
      return
    }

    for (const docSnap of snapshot.docs) {
      const booking = docSnap.data() as BookingData
      const preferredDateStr = booking.preferredDate
      if (!preferredDateStr) continue

      const preferredDate = new Date(preferredDateStr + 'T00:00:00Z')
      let daysToAdd = 7
      if (booking.frequency === 'biweekly') daysToAdd = 14
      if (booking.frequency === 'monthly') daysToAdd = 30

      const nextDate = new Date(preferredDate.getTime())
      nextDate.setUTCDate(nextDate.getUTCDate() + daysToAdd)
      const nextDateStr = nextDate.toISOString().slice(0, 10)

      // Only generate if the next clean is within our 14-day window and is in the future
      const todayStr = today.toISOString().slice(0, 10)
      if (nextDateStr > todayStr && nextDateStr <= fourteenDaysOutStr) {
        // Check if we already created a booking for this client on that next date
        const existingQuery = await db
          .collection('bookings')
          .where('email', '==', booking.email)
          .where('preferredDate', '==', nextDateStr)
          .where('status', '!=', 'cancelled')
          .get()

        if (existingQuery.empty) {
          console.log(`[onDailyRecurringRenewal] Auto-renewing booking for ${booking.email} on date ${nextDateStr}`)
          
          const newBookingData = {
            firstName:         booking.firstName,
            lastName:          booking.lastName,
            email:             booking.email,
            phone:             booking.phone,
            language:          booking.language,
            propertyType:      booking.propertyType,
            bedrooms:          booking.bedrooms,
            bathrooms:         booking.bathrooms,
            squareFootage:     booking.squareFootage || null,
            frequency:         booking.frequency,
            pets:              booking.pets ?? false,
            address:           booking.address,
            serviceType:       booking.serviceType,
            addOns:            booking.addOns || [],
            preferredCleaner:  booking.preferredCleaner || null,
            notes:             booking.notes || '',
            leadSource:        'organic',
            status:            'pending',
            assignedTo:        booking.assignedTo || null,
            isAirbnb:          booking.isAirbnb || false,
            photoConfirmation: booking.photoConfirmation || false,
            createdAt:         new Date(),
          }

          await db.collection('bookings').add(newBookingData)
        }
      }
    }
  },
)

```

---

## File: functions/src/sendEmail.ts

```typescript
import { Resend } from 'resend'
import type { BookingData } from './emailTemplates'
import { ownerSubject, ownerText, clientSubject, clientHtml } from './emailTemplates'

export interface EmailConfig {
  resendApiKey: string
  fromEmail: string
  ownerEmail: string
}

export async function sendOwnerNotification(
  booking: BookingData,
  docId: string,
  config: EmailConfig,
): Promise<void> {
  const resend = new Resend(config.resendApiKey)
  const result = await resend.emails.send({
    from:    config.fromEmail,
    to:      config.ownerEmail,
    subject: ownerSubject(booking),
    text:    ownerText(booking, docId),
  })
  if (result.error) {
    throw new Error(`Owner notification failed: ${result.error.message}`)
  }
}

export async function sendClientConfirmation(
  booking: BookingData,
  config: EmailConfig,
): Promise<void> {
  const lang: 'en' | 'fr' = booking.language === 'fr' ? 'fr' : 'en'
  const resend = new Resend(config.resendApiKey)
  const result = await resend.emails.send({
    from:    config.fromEmail,
    to:      booking.email,
    subject: clientSubject(lang),
    html:    clientHtml(booking, lang),
  })
  if (result.error) {
    throw new Error(`Client confirmation failed: ${result.error.message}`)
  }
}

```

---

## File: functions/src/sendSms.ts

```typescript
import twilio from 'twilio'
import type { BookingData } from './emailTemplates'
import { confirmationSms, reminderSms } from './smsTemplates'

export interface SmsConfig {
  accountSid: string
  authToken: string
  fromNumber: string
}

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

export async function sendSmsConfirmation(booking: BookingData, config: SmsConfig): Promise<void> {
  const to = normalizePhone(booking.phone)
  if (!to) {
    console.warn(`[sendSmsConfirmation] Invalid phone "${booking.phone}" — skipping`)
    return
  }
  const lang: 'en' | 'fr' = booking.language === 'fr' ? 'fr' : 'en'
  const body = confirmationSms(booking.firstName, booking.serviceType, booking.preferredDate, lang)
  const client = twilio(config.accountSid, config.authToken)
  await client.messages.create({ body, from: config.fromNumber, to })
}

export async function sendSmsReminder(
  phone: string,
  language: string,
  preferredDate: string,
  config: SmsConfig,
): Promise<void> {
  const to = normalizePhone(phone)
  if (!to) {
    console.warn(`[sendSmsReminder] Invalid phone "${phone}" — skipping`)
    return
  }
  const lang: 'en' | 'fr' = language === 'fr' ? 'fr' : 'en'
  const body = reminderSms(preferredDate, lang)
  const client = twilio(config.accountSid, config.authToken)
  await client.messages.create({ body, from: config.fromNumber, to })
}

```

---

## File: functions/src/smsTemplates.ts

```typescript
const SMS_SERVICE_EN: Record<string, string> = {
  standard:         'Standard Clean',
  deep:             'Deep Clean',
  moveout:          'Move-Out Clean',
  postconstruction: 'Post-Construction',
  airbnb:           'Airbnb Turnover',
  commercial:       'Commercial Clean',
}

const SMS_SERVICE_FR: Record<string, string> = {
  standard:         'Nettoyage standard',
  deep:             'Grand ménage',
  moveout:          'Nettoyage déménagement',
  postconstruction: 'Post-construction',
  airbnb:           'Rotation Airbnb',
  commercial:       'Nettoyage commercial',
}

export function confirmationSms(
  firstName: string,
  serviceType: string,
  preferredDate: string,
  lang: 'en' | 'fr',
): string {
  const service = lang === 'fr'
    ? (SMS_SERVICE_FR[serviceType] ?? serviceType)
    : (SMS_SERVICE_EN[serviceType] ?? serviceType)
  return lang === 'fr'
    ? `Fresh Nest Co. : Bonjour ${firstName}, votre ${service} est réservé pour le ${preferredDate} ! Nous confirmerons l'heure bientôt. (613) 935-3555`
    : `Fresh Nest Co.: Hi ${firstName}, your ${service} is booked for ${preferredDate}! We'll confirm the time soon. Questions? (613) 935-3555`
}

export function reminderSms(preferredDate: string, lang: 'en' | 'fr'): string {
  return lang === 'fr'
    ? `Fresh Nest Co. : Rappel — votre ménage est demain (${preferredDate}). Nous vous contacterons avec l'heure d'arrivée. (613) 935-3555`
    : `Fresh Nest Co.: Just a reminder — your cleaning is tomorrow (${preferredDate}). We'll be in touch with your arrival time. (613) 935-3555`
}

```

---

## File: functions/tsconfig.json

```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "strict": true,
    "target": "ES2020",
    "esModuleInterop": true
  },
  "include": ["src"]
}

```

---

## File: index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <!-- Standard browser favicons -->
    <link rel="icon" type="image/x-icon"           href="/favicon.ico">
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="48x48" href="/icons/favicon-48x48.png">

    <!-- Apple / iOS touch icon -->
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">

    <!-- PWA Web Manifest -->
    <link rel="manifest" href="/site.webmanifest">

    <!-- Theme colour (Android status bar, browser chrome) -->
    <meta name="theme-color"             content="#5b7e8f">
    <meta name="msapplication-TileColor" content="#5b7e8f">
    <meta name="msapplication-TileImage" content="/icons/icon-192x192.png">

    <!-- Apple PWA behaviour -->
    <meta name="apple-mobile-web-app-capable"          content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title"            content="Fresh Nest Co.">

    <!-- Open Graph — Facebook, LinkedIn, WhatsApp, iMessage previews -->
    <meta property="og:type"         content="website">
    <meta property="og:url"          content="https://lilypad-freshnest.web.app/">
    <meta property="og:title"        content="Fresh Nest Co. — Cleaning &amp; Organizing Services">
    <meta property="og:description"  content="Professional cleaning and organizing for homes and businesses in Cornwall, Akwesasne, and Snye QC.">
    <meta property="og:image"        content="https://lilypad-freshnest.web.app/images/og-image-1200x630.jpg">
    <meta property="og:image:width"  content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt"    content="Fresh Nest Co. — Cleaning & Organizing Services">
    <meta property="og:locale"       content="en_CA">
    <meta property="og:locale:alternate" content="fr_CA">
    <meta property="og:site_name"    content="Fresh Nest Co.">

    <!-- Twitter / X Card -->
    <meta name="twitter:card"        content="summary_large_image">
    <meta name="twitter:title"       content="Fresh Nest Co. — Cleaning &amp; Organizing Services">
    <meta name="twitter:description" content="Professional cleaning and organizing in Cornwall ON, Akwesasne, and Snye QC.">
    <meta name="twitter:image"       content="https://lilypad-freshnest.web.app/images/og-image-1200x630.jpg">
    <meta name="twitter:image:alt"   content="Fresh Nest Co. logo on slate background">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600;1,700&family=Marcellus&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <title>Fresh Nest Co. — Cleaning & Organizing Services | Cornwall, ON</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

```

---

## File: package.json

```json
{
  "name": "fresh_nest",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:e2e": "playwright test",
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
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
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@playwright/test": "^1.60.0",
    "@tanstack/eslint-plugin-query": "^5.101.0",
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
    "vitest": "^4.1.8"
  }
}

```

---

## File: playwright.config.ts

```typescript
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});

```

---

## File: postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

```

---

## File: public/site.webmanifest

```
{
  "name": "Fresh Nest Co.",
  "short_name": "Fresh Nest",
  "description": "Cleaning & Organizing Services \u2014 Cornwall, Akwesasne, Snye QC",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#5b7e8f",
  "theme_color": "#5b7e8f",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-256x256.png",
      "sizes": "256x256",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-1024x1024.png",
      "sizes": "1024x1024",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}
```

---

## File: src/App.css

```css
/*
 * App.css — intentionally empty.
 * All styles are managed through Tailwind CSS utility classes (src/index.css)
 * and the design system defined in tailwind.config.js.
 *
 * Vite scaffold styles have been removed as of E03.
 */

```

---

## File: src/App.tsx

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import Gallery from '@/pages/Gallery'
import PlaceholderPage from '@/pages/PlaceholderPage'
import { CORNWALL_ON, AKWESASNE, SNYE_QC, LONG_SAULT, MORRISBURG } from '@/lib/data/locationData'
import LocationPage from '@/pages/LocationPage'
import LocationsOverview from '@/pages/LocationsOverview'
import FaqPage from '@/pages/FaqPage'
import BookingPage from '@/pages/BookingPage'
import PricingPage from '@/pages/PricingPage'
import AirbnbTurnoverPage from '@/pages/AirbnbTurnoverPage'
import ServicePage from '@/pages/ServicePage'
import ServicesOverview from '@/pages/ServicesOverview'
import { SERVICE_CONFIG_MAP } from '@/lib/data/serviceData'
import ThankYouPage from '@/pages/ThankYouPage'
import AdminPage from '@/pages/AdminPage'
import Blog from '@/pages/Blog'
import BlogPost from '@/pages/BlogPost'

/**
 * React Router v6 browser router.
 * All routes are nested under the root Layout (Navbar + Footer).
 * Placeholder routes will be replaced epic-by-epic through Phase 2–6.
 *
 * Route inventory:
 *  /                        — E04 Hero + homepage sections
 *  /services                — E07 Services Grid
 *  /services/:service       — E21 Individual service pages
 *  /services/airbnb-turnover— E20 Airbnb Turnover (Gallagher P6)
 *  /locations               — E13 Service Areas
 *  /locations/:location     — E13 Individual location pages
 *  /locations/akwesasne     — E13 (Kahnawà:ke P4)
 *  /locations/snye-qc       — E13 (Sophie P5)
 *  /pricing                 — E19 Pricing page
 *  /faq                     — E14 FAQ
 *  /gallery                 — E09 Before/After Gallery
 *  /booking                 — E15 Multi-Step Booking Form
 *  /thank-you               — E22 Thank You page
 *  /about                   — E10 How It Works + About
 *  /reviews                 — E12 Reviews
 *  /privacy                 — Static privacy policy
 *  /admin                   — E28 Admin Dashboard (Phase 5)
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // ── Phase 1–2: Core pages ──
      { index: true, element: <Home /> },

      // ── Services ──
      { path: 'services',                    element: <ServicesOverview /> },
      { path: 'services/airbnb-turnover',    element: <AirbnbTurnoverPage /> },
      { path: 'services/standard-cleaning',  element: <ServicePage config={SERVICE_CONFIG_MAP.standard} /> },
      { path: 'services/deep-cleaning',      element: <ServicePage config={SERVICE_CONFIG_MAP.deep} /> },
      { path: 'services/move-out-cleaning',  element: <ServicePage config={SERVICE_CONFIG_MAP.moveout} /> },
      { path: 'services/post-construction',  element: <ServicePage config={SERVICE_CONFIG_MAP.postconstruction} /> },
      { path: 'services/commercial-cleaning', element: <ServicePage config={SERVICE_CONFIG_MAP.commercial} /> },

      // ── Locations ──
      { path: 'locations',             element: <LocationsOverview /> },
      { path: 'locations/cornwall-on', element: <LocationPage config={CORNWALL_ON} /> },
      { path: 'locations/akwesasne',   element: <LocationPage config={AKWESASNE} /> },
      { path: 'locations/snye-qc',     element: <LocationPage config={SNYE_QC} /> },
      { path: 'locations/long-sault',  element: <LocationPage config={LONG_SAULT} /> },
      { path: 'locations/morrisburg',  element: <LocationPage config={MORRISBURG} /> },

      // ── Phase 2–3 pages ──
      { path: 'pricing', element: <PricingPage /> },
      {
        path: 'faq',
        element: <FaqPage />,
      },
      {
        path: 'gallery',
        element: <Gallery />,
      },
      {
        path: 'booking',
        element: <BookingPage />,
      },
      {
        path: 'thank-you',
        element: <ThankYouPage />,
      },
      {
        path: 'about',
        element: (
          <PlaceholderPage
            titleKey="footer.aboutUs"
            epicNote="About Us / How It Works — built in E10."
          />
        ),
      },
      {
        path: 'reviews',
        element: (
          <PlaceholderPage
            titleKey="footer.reviews"
            epicNote="Client reviews page — built in E12."
          />
        ),
      },
      {
        path: 'privacy',
        element: (
          <PlaceholderPage
            titleKey="footer.privacy"
            epicNote="Privacy Policy — static page."
          />
        ),
      },
      {
        path: 'careers',
        element: (
          <PlaceholderPage
            titleKey="footer.careers"
            epicNote="Careers page — static page."
          />
        ),
      },

      // ── Phase 4: Blog ──
      { path: 'blog', element: <Blog /> },
      { path: 'blog/:slug', element: <BlogPost /> },

      // ── Phase 5: Admin ──
      {
        path: 'admin',
        element: <AdminPage />,
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}

```

---

## File: src/components/admin/AccessDeniedPanel.tsx

```tsx
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { User } from 'firebase/auth'
import { cn } from '@/lib/utils/utils'
import { fadeUp } from '@/lib/utils/animations'

interface AccessDeniedPanelProps {
  user: User
  handleSignOut: () => Promise<void> | void
  authError: string | null
}

export function AccessDeniedPanel({ user, handleSignOut, authError }: AccessDeniedPanelProps) {
  const { t } = useTranslation()

  return (
    <motion.div
      key="access-denied"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={fadeUp}
      className="w-full max-w-md bg-white border border-sand rounded shadow-sm p-6 md:p-8 mx-auto"
    >
      <div className="flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-5xl text-charcoal">
            {t('admin.login.errorTitle')}
          </h1>
          <p className="font-body text-base text-text-muted">
            {authError || t('admin.login.errorMessage', { email: user.email })}
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => { void handleSignOut() }}
            className={cn(
              'w-full bg-slate-brand text-white font-body font-medium rounded',
              'min-h-[48px] py-3 px-6 hover:bg-slate-dark transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2'
            )}
          >
            {t('admin.login.tryAnother')}
          </button>
          <Link
            to="/"
            className={cn(
              'w-full border border-sand text-charcoal font-body font-medium rounded',
              'min-h-[48px] inline-flex items-center justify-center py-3 px-6',
              'hover:bg-cream transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2'
            )}
          >
            {t('admin.login.backToHome')}
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

```

---

## File: src/components/admin/AnalyticsDashboard.tsx

```tsx
import { useTranslation } from 'react-i18next'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import type { AnalyticsTimeRange } from './hooks/useAdminAnalytics'
import { LEAD_COLORS } from './hooks/useAdminAnalytics'

interface AnalyticsDashboardProps {
  analyticsTimeRange: AnalyticsTimeRange
  setAnalyticsTimeRange: (val: AnalyticsTimeRange) => void
  analyticsTotalBookings: number
  analyticsTotalRevenue: number
  analyticsAvgBookingValue: number
  leadSourceData: Array<{ name: string; value: number; revenue: number; key: string }>
  monthlyTrendData: Array<{ monthKey: string; monthName: string; count: number; revenue: number; sortKey: number }>
  channelsPerformance: Array<{ source: string; name: string; volume: number; revenue: number; avgValue: number; share: number }>
  formatCurrency: (val: number) => string
  referredBookingsCount: number
}

export function AnalyticsDashboard({
  analyticsTimeRange,
  setAnalyticsTimeRange,
  analyticsTotalBookings,
  analyticsTotalRevenue,
  analyticsAvgBookingValue,
  leadSourceData,
  monthlyTrendData,
  channelsPerformance,
  formatCurrency,
  referredBookingsCount,
}: AnalyticsDashboardProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8">
      {/* Time Range Selector */}
      <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl text-charcoal">
            {t('admin.dashboard.analytics.title')}
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <label htmlFor="analytics-range" className="font-body text-base text-charcoal font-medium whitespace-nowrap">
            {t('admin.dashboard.analytics.rangeLabel')}:
          </label>
          <select
            id="analytics-range"
            value={analyticsTimeRange}
            onChange={(e) => setAnalyticsTimeRange(e.target.value as AnalyticsTimeRange)}
            className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
          >
            <option value="all">{t('admin.dashboard.analytics.ranges.all')}</option>
            <option value="30days">{t('admin.dashboard.analytics.ranges.30days')}</option>
            <option value="90days">{t('admin.dashboard.analytics.ranges.90days')}</option>
            <option value="ytd">{t('admin.dashboard.analytics.ranges.ytd')}</option>
            <option value="month">{t('admin.dashboard.analytics.ranges.month')}</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-1">
          <span className="font-body text-sm text-text-muted">
            {t('admin.dashboard.analytics.stats.bookingsCount')}
          </span>
          <span className="font-display text-4xl text-charcoal font-bold">
            {analyticsTotalBookings}
          </span>
        </div>
        <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-slate-brand flex flex-col gap-1">
          <span className="font-body text-sm text-text-muted">
            {t('admin.dashboard.analytics.stats.estimatedRevenue')}
          </span>
          <span className="font-display text-4xl text-slate-brand font-bold">
            {formatCurrency(analyticsTotalRevenue)}
          </span>
        </div>
        <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-green-500 flex flex-col gap-1">
          <span className="font-body text-sm text-text-muted">
            {t('admin.dashboard.analytics.stats.avgBookingValue')}
          </span>
          <span className="font-display text-4xl text-green-600 font-bold">
            {formatCurrency(analyticsAvgBookingValue)}
          </span>
        </div>
        <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-amber-500 flex flex-col gap-1">
          <span className="font-body text-sm text-text-muted">
            {t('admin.dashboard.analytics.stats.referredBookings')}
          </span>
          <span className="font-display text-4xl text-amber-600 font-bold">
            {referredBookingsCount}
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Source Pie Chart */}
        <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-sub text-2xl text-charcoal font-bold border-b border-sand pb-2">
            {t('admin.dashboard.analytics.charts.leadDistribution')}
          </h3>
          <div className="h-[320px] w-full flex items-center justify-center">
            {leadSourceData.length === 0 ? (
              <span className="font-body text-base text-text-muted italic">
                {t('admin.dashboard.table.noResults')}
              </span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {leadSourceData.map((entry) => (
                      <Cell key={`cell-${entry.key}`} fill={LEAD_COLORS[entry.key] || '#7a8f96'} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: unknown, name: unknown, props: unknown) => {
                      const valStr = String(value)
                      const nameStr = String(name)
                      const payload = (props as { payload?: { revenue?: number } })?.payload
                      const revenue = payload?.revenue || 0
                      return [
                        `${valStr} ${t('admin.dashboard.analytics.charts.bookings').toLowerCase()} (${formatCurrency(revenue)})`,
                        nameStr,
                      ]
                    }}
                    contentStyle={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      borderRadius: '4px',
                      borderColor: '#c4b09a',
                    }}
                  />
                  <RechartsLegend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monthly Trend Bar Chart */}
        <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-sub text-2xl text-charcoal font-bold border-b border-sand pb-2">
            {t('admin.dashboard.analytics.charts.monthlyTrend')}
          </h3>
          <div className="h-[320px] w-full flex items-center justify-center">
            {monthlyTrendData.length === 0 ? (
              <span className="font-body text-base text-text-muted italic">
                {t('admin.dashboard.table.noResults')}
              </span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e8" />
                  <XAxis
                    dataKey="monthName"
                    stroke="#7a8f96"
                    tickLine={false}
                    axisLine={false}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                    }}
                  />
                  <YAxis
                    stroke="#7a8f96"
                    tickLine={false}
                    axisLine={false}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                    }}
                  />
                  <RechartsTooltip
                    formatter={(value: unknown, name: unknown) => {
                      const val = Number(value)
                      const nm = String(name)
                      if (nm === 'revenue') {
                        return [formatCurrency(val), t('admin.dashboard.analytics.charts.revenue')];
                      }
                      return [val, t('admin.dashboard.analytics.charts.bookings')];
                    }}
                    contentStyle={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      borderRadius: '4px',
                      borderColor: '#c4b09a',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#5b7e8f" name="revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Channels Performance Table */}
      <div className="bg-white border border-sand rounded shadow-sm flex flex-col gap-4 p-6">
        <h3 className="font-sub text-2xl text-charcoal font-bold border-b border-sand pb-2">
          {t('admin.dashboard.analytics.title')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-sand bg-cream">
                <th className="p-4 font-sub text-base text-charcoal font-bold">
                  {t('admin.dashboard.analytics.table.channel')}
                </th>
                <th className="p-4 font-sub text-base text-charcoal font-bold text-center">
                  {t('admin.dashboard.analytics.table.volume')}
                </th>
                <th className="p-4 font-sub text-base text-charcoal font-bold text-right">
                  {t('admin.dashboard.analytics.table.revenue')}
                </th>
                <th className="p-4 font-sub text-base text-charcoal font-bold text-right">
                  {t('admin.dashboard.analytics.table.avgValue')}
                </th>
                <th className="p-4 font-sub text-base text-charcoal font-bold text-right">
                  {t('admin.dashboard.analytics.table.share')}
                </th>
              </tr>
            </thead>
            <tbody>
              {channelsPerformance.map((ch) => (
                <tr key={ch.source} className="border-b border-sand hover:bg-warm-white transition-colors duration-150">
                  <td className="p-4 font-body text-base text-charcoal font-medium">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: LEAD_COLORS[ch.source] || '#7a8f96' }}
                      />
                      {ch.name}
                    </div>
                  </td>
                  <td className="p-4 font-body text-base text-charcoal text-center">
                    {ch.volume}
                  </td>
                  <td className="p-4 font-body text-base text-charcoal text-right">
                    {formatCurrency(ch.revenue)}
                  </td>
                  <td className="p-4 font-body text-base text-charcoal text-right">
                    {formatCurrency(ch.avgValue)}
                  </td>
                  <td className="p-4 font-body text-base text-charcoal text-right">
                    {ch.share.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

```

---

## File: src/components/admin/BookingDetailPanel.tsx

```tsx
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/utils'
import type { Booking, BookingStatus } from '@/types'

interface BookingDetailPanelProps {
  booking: Booking
  customCleanerNames: Record<string, string>
  showCustomInput: Record<string, boolean>
  setCustomCleanerNames: React.Dispatch<React.SetStateAction<Record<string, string>>>
  handleStatusChange: (bookingId: string, status: BookingStatus) => Promise<void> | void
  handleAssignmentChange: (bookingId: string, value: string) => Promise<void> | void
  handleCustomCleanerSave: (bookingId: string) => Promise<void> | void
}

export function BookingDetailPanel({
  booking: b,
  customCleanerNames,
  showCustomInput,
  setCustomCleanerNames,
  handleStatusChange,
  handleAssignmentChange,
  handleCustomCleanerSave,
}: BookingDetailPanelProps) {
  const { t, i18n } = useTranslation()

  return (
    <tr>
      <td colSpan={5} className="p-0 border-b border-sand bg-slate-pale/30">
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {/* Contact & Address Section */}
            <div className="flex flex-col gap-4">
              <h4 className="font-sub text-xl text-charcoal font-bold border-b border-sand pb-1.5">
                {t('admin.dashboard.table.client')}
              </h4>
              <div className="font-body text-base text-charcoal space-y-2">
                <p>
                  <span className="font-medium">{t('booking.fields.phone.label')}: </span>
                  <a href={`tel:${b.phone}`} className="text-slate-brand hover:underline min-h-[48px] inline-flex items-center">
                    {b.phone}
                  </a>
                </p>
                <p>
                  <span className="font-medium">{t('admin.dashboard.filters.language')}: </span>
                  {b.language === 'en' ? t('common.languages.enLong') : t('common.languages.frLong')}
                </p>
                <div className="pt-2">
                  <span className="font-medium block mb-1">
                    {t('admin.dashboard.details.address')}:
                  </span>
                  <span className="text-text-muted block leading-snug">
                    {b.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Property Specifications */}
            <div className="flex flex-col gap-4">
              <h4 className="font-sub text-xl text-charcoal font-bold border-b border-sand pb-1.5">
                {t('admin.dashboard.details.property')}
              </h4>
              <div className="font-body text-base text-charcoal space-y-2">
                <p>
                  <span className="font-medium">{t('booking.fields.propertyType.label')}: </span>
                  {t(`booking.fields.propertyType.options.${b.propertyType}`)}
                </p>
                <p>
                  <span className="font-medium">{t('admin.dashboard.details.rooms')}: </span>
                  {t('admin.dashboard.details.roomsValue', { bedrooms: b.bedrooms, bathrooms: b.bathrooms })}
                </p>
                {b.squareFootage && (
                  <p>
                    <span className="font-medium">{t('admin.dashboard.details.size')}: </span>
                    {t('admin.dashboard.details.sqft', { size: b.squareFootage })}
                  </p>
                )}
                <p>
                  <span className="font-medium">{t('admin.dashboard.details.frequency')}: </span>
                  {t(`booking.fields.frequency.options.${b.frequency}`)}
                </p>
                <p>
                  <span className="font-medium">{t('admin.dashboard.details.pets')}: </span>
                  <span className={cn(b.pets ? 'text-amber-700 font-medium' : '')}>
                    {b.pets
                      ? t('admin.dashboard.details.petsYes')
                      : t('admin.dashboard.details.petsNo')}
                  </span>
                </p>
              </div>
            </div>

            {/* Workflow & Admin Controls */}
            <div className="flex flex-col gap-4">
              <h4 className="font-sub text-xl text-charcoal font-bold border-b border-sand pb-1.5">
                {t('admin.dashboard.details.assignHeader')}
              </h4>

              {/* Status Update Control */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`status-select-${b.id}`}
                  className="font-body text-sm text-text-muted"
                >
                  {t('admin.dashboard.details.updateStatus')}
                </label>
                <select
                  id={`status-select-${b.id}`}
                  value={b.status}
                  onChange={(e) => {
                    void handleStatusChange(b.id!, e.target.value as BookingStatus)
                  }}
                  className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
                >
                  <option value="pending">{t('booking.status.pending')}</option>
                  <option value="confirmed">{t('booking.status.confirmed')}</option>
                  <option value="completed">{t('booking.status.completed')}</option>
                  <option value="cancelled">{t('booking.status.cancelled')}</option>
                </select>
              </div>

              {/* Cleaner Assignment Control */}
              <div className="flex flex-col gap-1.5 mt-1">
                <label
                  htmlFor={`cleaner-select-${b.id}`}
                  className="font-body text-sm text-text-muted"
                >
                  {t('admin.dashboard.details.assignCleaner')}
                </label>
                <select
                  id={`cleaner-select-${b.id}`}
                  value={
                    showCustomInput[b.id!]
                      ? 'custom'
                      : b.assignedTo === null
                      ? 'unassigned'
                      : b.assignedTo && ['Lauren S.', 'Sarah M.'].includes(b.assignedTo)
                      ? b.assignedTo
                      : 'custom'
                  }
                  onChange={(e) => { void handleAssignmentChange(b.id!, e.target.value) }}
                  className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
                >
                  <option value="unassigned">
                    {t('admin.dashboard.details.unassigned')}
                  </option>
                  <option value="Lauren S.">Lauren S.</option>
                  <option value="Sarah M.">Sarah M.</option>
                  <option value="custom">
                    {t('admin.dashboard.details.customOption')}
                  </option>
                </select>

                {/* Custom cleaner text input fallback */}
                {(showCustomInput[b.id!] ||
                  (b.assignedTo &&
                    !['Lauren S.', 'Sarah M.'].includes(b.assignedTo))) && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label
                      htmlFor={`custom-cleaner-input-${b.id}`}
                      className="font-body text-sm text-text-muted"
                    >
                      {t('admin.dashboard.details.customCleaner')}
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          id={`custom-cleaner-input-${b.id}`}
                          type="text"
                          value={
                            customCleanerNames[b.id!] !== undefined
                              ? customCleanerNames[b.id!]
                              : b.assignedTo || ''
                          }
                          onChange={(e) =>
                            setCustomCleanerNames((prev) => ({
                              ...prev,
                              [b.id!]: e.target.value,
                            }))
                          }
                          placeholder={t('admin.dashboard.details.customPlaceholder')}
                          className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-slate-brand"
                        />
                      </div>
                      <button
                        onClick={() => { void handleCustomCleanerSave(b.id!) }}
                        className={cn(
                          'bg-slate-brand text-white font-body font-medium rounded',
                          'min-h-[48px] px-4 py-2 hover:bg-slate-dark transition-colors duration-200',
                          'focus:outline-none focus:ring-2 focus:ring-slate-brand'
                        )}
                      >
                        {t('admin.dashboard.details.save')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sub-details (Notes, Add-ons, Workflow) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-8 pt-6 border-t border-sand">
            {/* Extras & Add-ons */}
            <div className="flex flex-col gap-2">
              <h4 className="font-sub text-xl text-charcoal font-bold">
                {t('admin.dashboard.details.addons')}
              </h4>
              {b.addOns && b.addOns.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {b.addOns.map((add) => (
                    <span
                      key={add}
                      className="bg-slate-pale text-slate-dark border border-sand px-2.5 py-1 rounded font-body text-sm font-medium"
                    >
                      {t(`booking.fields.addOns.options.${add}`)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-body text-base text-text-muted italic mt-1">
                  {t('admin.dashboard.details.noAddons')}
                </p>
              )}
            </div>

            {/* Notes Section */}
            <div className="flex flex-col gap-2">
              <h4 className="font-sub text-xl text-charcoal font-bold">
                {t('admin.dashboard.details.notes')}
              </h4>
              <p className="font-body text-base text-charcoal bg-white border border-sand rounded p-3 mt-1 leading-normal whitespace-pre-line min-h-[60px]">
                {b.notes?.trim() || t('admin.dashboard.details.noNotes')}
              </p>
            </div>
          </div>

          {/* Lead Source, Timestamps, Flags Footer */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-left mt-8 pt-4 border-t border-sand text-base font-body text-text-muted">
            <p>
              <span className="font-medium text-charcoal">
                {t('admin.dashboard.details.createdAt')}:{' '}
              </span>
              {b.createdAt?.toLocaleString(i18n.language === 'fr' ? 'fr-CA' : 'en-CA')}
            </p>
            <p>
              <span className="font-medium text-charcoal">
                {t('admin.dashboard.details.leadSource')}:{' '}
              </span>
              <span className="capitalize">
                {t(`admin.dashboard.leads.${b.leadSource}`) || b.leadSource}
              </span>
            </p>
            {b.referredBy && (
              <p>
                <span className="font-medium text-charcoal">
                  {t('admin.dashboard.details.referredBy')}:{' '}
                </span>
                <span className="bg-green-50 text-green-800 border border-green-200 px-2 py-0.5 rounded">
                  {b.referredBy}
                </span>
              </p>
            )}
            {b.referralCode && (
              <p>
                <span className="font-medium text-charcoal">
                  {t('admin.dashboard.details.referralCode')}:{' '}
                </span>
                <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-mono">
                  {b.referralCode}
                </span>
              </p>
            )}
            <p>
              <span className="font-medium text-charcoal">
                {t('admin.dashboard.details.workflow')}:{' '}
              </span>
              {b.isAirbnb && (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded mr-2">
                  {t('admin.dashboard.details.isAirbnb')}
                </span>
              )}
              {b.photoConfirmation && (
                <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                  {t('admin.dashboard.details.photoConf')}
                </span>
              )}
            </p>
          </div>
        </motion.div>
      </td>
    </tr>
  )
}

```

---

## File: src/components/admin/BookingsTable.tsx

```tsx
import { useTranslation } from 'react-i18next'
import { AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/utils'
import type { Booking, BookingStatus } from '@/types'
import { BookingDetailPanel } from './BookingDetailPanel'

interface BookingsTableProps {
  filteredBookings: Booking[]
  totalCount: number
  pendingCount: number
  confirmedCount: number
  statusFilter: string
  setStatusFilter: (val: string) => void
  serviceFilter: string
  setServiceFilter: (val: string) => void
  languageFilter: string
  setLanguageFilter: (val: string) => void
  sortBy: 'preferredDate' | 'createdAt'
  setSortBy: (val: 'preferredDate' | 'createdAt') => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (val: 'asc' | 'desc') => void
  searchQuery: string
  setSearchQuery: (val: string) => void
  expandedRowId: string | null
  setExpandedRowId: (val: string | null) => void
  customCleanerNames: Record<string, string>
  setCustomCleanerNames: React.Dispatch<React.SetStateAction<Record<string, string>>>
  showCustomInput: Record<string, boolean>
  handleStatusChange: (bookingId: string, status: BookingStatus) => Promise<void> | void
  handleAssignmentChange: (bookingId: string, value: string) => Promise<void> | void
  handleCustomCleanerSave: (bookingId: string) => Promise<void> | void
}

export function BookingsTable({
  filteredBookings,
  totalCount,
  pendingCount,
  confirmedCount,
  statusFilter,
  setStatusFilter,
  serviceFilter,
  setServiceFilter,
  languageFilter,
  setLanguageFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  searchQuery,
  setSearchQuery,
  expandedRowId,
  setExpandedRowId,
  customCleanerNames,
  setCustomCleanerNames,
  showCustomInput,
  handleStatusChange,
  handleAssignmentChange,
  handleCustomCleanerSave,
}: BookingsTableProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-8">
      {/* Stats Counters Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-1">
          <span className="font-body text-sm text-text-muted">
            {t('admin.dashboard.stats.total')}
          </span>
          <span className="font-display text-4xl text-charcoal font-bold">
            {totalCount}
          </span>
        </div>
        <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-slate-brand flex flex-col gap-1">
          <span className="font-body text-sm text-text-muted">
            {t('admin.dashboard.stats.pending')}
          </span>
          <span className="font-display text-4xl text-slate-brand font-bold">
            {pendingCount}
          </span>
        </div>
        <div className="bg-white border border-sand rounded p-6 shadow-sm border-l-4 border-l-green-500 flex flex-col gap-1">
          <span className="font-body text-sm text-text-muted">
            {t('admin.dashboard.stats.confirmed')}
          </span>
          <span className="font-display text-4xl text-green-600 font-bold">
            {confirmedCount}
          </span>
        </div>
      </div>

      {/* Filtering Controls Bar */}
      <div className="bg-white border border-sand rounded p-6 shadow-sm flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Status filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status-filter" className="font-body text-base text-charcoal font-medium">
              {t('admin.dashboard.filters.status')}
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              <option value="all">{t('common.all')}</option>
              <option value="pending">{t('booking.status.pending')}</option>
              <option value="confirmed">{t('booking.status.confirmed')}</option>
              <option value="completed">{t('booking.status.completed')}</option>
              <option value="cancelled">{t('booking.status.cancelled')}</option>
            </select>
          </div>

          {/* Service Type Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="service-filter" className="font-body text-base text-charcoal font-medium">
              {t('admin.dashboard.filters.service')}
            </label>
            <select
              id="service-filter"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              <option value="all">{t('common.all')}</option>
              <option value="standard">{t('services.standard.title')}</option>
              <option value="deep">{t('services.deep.title')}</option>
              <option value="moveout">{t('services.moveout.title')}</option>
              <option value="postconstruction">{t('services.postconstruction.title')}</option>
              <option value="airbnb">{t('services.airbnb.title')}</option>
              <option value="commercial">{t('services.commercial.title')}</option>
            </select>
          </div>

          {/* Language Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="language-filter" className="font-body text-base text-charcoal font-medium">
              {t('admin.dashboard.filters.language')}
            </label>
            <select
              id="language-filter"
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              <option value="all">{t('common.all')}</option>
              <option value="en">{t('common.languages.en')}</option>
              <option value="fr">{t('common.languages.fr')}</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sort-by" className="font-body text-base text-charcoal font-medium">
              {t('admin.dashboard.filters.sortBy')}
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'preferredDate' | 'createdAt')}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              <option value="preferredDate">{t('admin.dashboard.table.date')}</option>
              <option value="createdAt">{t('admin.dashboard.details.createdAt')}</option>
            </select>
          </div>

          {/* Sort Order Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sort-order" className="font-body text-base text-charcoal font-medium">
              {t('admin.dashboard.filters.sortOrder')}
            </label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="min-h-[48px] px-3 border border-sand rounded font-body text-base text-charcoal bg-transparent focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              <option value="asc">{t('common.asc')}</option>
              <option value="desc">{t('common.desc')}</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="search-query" className="font-body text-base text-charcoal font-medium">
            {t('common.search')}
          </label>
          <input
            id="search-query"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('admin.dashboard.filters.search')}
            className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-sand rounded shadow-sm overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[700px]">
          <thead>
            <tr className="border-b border-sand bg-cream">
              <th className="p-4 font-sub text-base text-charcoal font-bold">
                {t('admin.dashboard.table.client')}
              </th>
              <th className="p-4 font-sub text-base text-charcoal font-bold">
                {t('admin.dashboard.table.date')}
              </th>
              <th className="p-4 font-sub text-base text-charcoal font-bold">
                {t('admin.dashboard.table.service')}
              </th>
              <th className="p-4 font-sub text-base text-charcoal font-bold">
                {t('admin.dashboard.table.status')}
              </th>
              <th className="p-4 font-sub text-base text-charcoal font-bold">
                {t('admin.dashboard.table.assigned')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center font-body text-base text-text-muted">
                  {t('admin.dashboard.table.noResults')}
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => {
                const isExpanded = expandedRowId === b.id
                const clientName = `${b.firstName} ${b.lastName}`
                const serviceKey = b.serviceType

                return (
                  <div key={b.id} className="contents">
                    {/* Main table row */}
                    <tr
                      onClick={() => setExpandedRowId(isExpanded ? null : (b.id ?? null))}
                      className={cn(
                        'border-b border-sand hover:bg-warm-white transition-colors duration-150 cursor-pointer',
                        isExpanded && 'bg-warm-white'
                      )}
                    >
                      <td className="p-4 font-body text-base text-charcoal font-medium">
                        <div className="flex flex-col">
                          <span>{clientName}</span>
                          <span className="text-sm text-text-muted font-normal">{b.email}</span>
                        </div>
                      </td>
                      <td className="p-4 font-body text-base text-charcoal">
                        {b.preferredDate}
                      </td>
                      <td className="p-4 font-body text-base text-charcoal capitalize">
                        {t(`services.${serviceKey}.title`)}
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded font-body text-sm font-medium border',
                            b.status === 'pending' && 'bg-yellow-50 text-yellow-800 border-yellow-200',
                            b.status === 'confirmed' && 'bg-green-50 text-green-800 border-green-200',
                            b.status === 'completed' && 'bg-blue-50 text-blue-800 border-blue-200',
                            b.status === 'cancelled' && 'bg-red-50 text-red-800 border-red-200'
                          )}
                        >
                          {t(`booking.status.${b.status}`)}
                        </span>
                      </td>
                      <td className="p-4 font-body text-base text-charcoal">
                        {b.assignedTo || (
                          <span className="text-text-muted italic">
                            {t('admin.dashboard.details.unassigned')}
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Collapsible details panel */}
                    <AnimatePresence initial={false}>
                      {isExpanded && b.id && (
                        <BookingDetailPanel
                          booking={b}
                          customCleanerNames={customCleanerNames}
                          showCustomInput={showCustomInput}
                          setCustomCleanerNames={setCustomCleanerNames}
                          handleStatusChange={handleStatusChange}
                          handleAssignmentChange={handleAssignmentChange}
                          handleCustomCleanerSave={handleCustomCleanerSave}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

```

---

## File: src/components/admin/LoginPanel.tsx

```tsx
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/utils'
import { fadeUp } from '@/lib/utils/animations'

interface LoginPanelProps {
  handleSignIn: () => Promise<void> | void
  authError: string | null
}

export function LoginPanel({ handleSignIn, authError }: LoginPanelProps) {
  const { t } = useTranslation()

  return (
    <motion.div
      key="login-gate"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={fadeUp}
      className="w-full max-w-md bg-white border border-sand rounded shadow-sm p-6 md:p-8 mx-auto"
    >
      <div className="flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 bg-slate-pale text-slate-brand rounded-full flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-5xl text-charcoal">
            {t('admin.login.heading')}
          </h1>
          <p className="font-body text-base text-text-muted">
            {t('admin.login.subhead')}
          </p>
        </div>

        {authError && (
          <div className="w-full p-3 bg-red-50 border border-red-200 text-red-700 rounded text-base font-body">
            {authError}
          </div>
        )}

        <button
          onClick={() => { void handleSignIn() }}
          className={cn(
            'w-full bg-slate-brand text-white font-body font-medium rounded',
            'min-h-[48px] py-3 px-6 hover:bg-slate-dark transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
            'inline-flex items-center justify-center gap-3'
          )}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.706 0 3.277.614 4.5 1.625l2.437-2.437C17.312 1.696 14.933 1 12.24 1 6.583 1 2 5.583 2 11.24s4.583 10.24 10.24 10.24c5.795 0 10.24-4.11 10.24-10.24 0-.568-.057-1.125-.17-1.67H12.24z" />
          </svg>
          {t('admin.login.button')}
        </button>
      </div>
    </motion.div>
  )
}

```

---

## File: src/components/admin/hooks/useAdminAnalytics.ts

```typescript
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { calculateQuote } from '@/lib/utils/quotePricing'
import type { QuotePropertySize, QuoteServiceType } from '@/lib/utils/quotePricing'
import type { Booking } from '@/types'

export type AnalyticsTimeRange = 'all' | '30days' | '90days' | 'ytd' | 'month'

export const LEAD_COLORS: Record<string, string> = {
  organic: '#5b7e8f',  // slate-brand
  google: '#7fa0b0',   // slate-light
  referral: '#c4b09a', // sand-dark
  facebook: '#3f5f6e', // slate-dark
  direct: '#7a8f96',   // text-muted
}

export function useAdminAnalytics(bookings: Booking[]) {
  const { t, i18n } = useTranslation()
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<AnalyticsTimeRange>('all')

  // Helper to calculate estimated price in-memory for analytics
  const getEstimatedPrice = useMemo(() => {
    return (booking: Booking): number => {
      if (booking.propertyType === 'commercial') {
        return 300 // Baseline average for commercial clean estimates
      }
      const sizeMap: Record<string, QuotePropertySize> = {
        apartment: 'apartment',
        '1-2bed': '1-2bed',
        '3-4bed': '3-4bed',
        '5+bed': '5plus',
      }
      const size = sizeMap[booking.propertyType] || 'apartment'
      const validServices = ['standard', 'deep', 'moveout', 'postconstruction', 'airbnb']
      const service = (validServices.includes(booking.serviceType) ? booking.serviceType : 'standard') as QuoteServiceType
      const frequency = booking.frequency

      const quote = calculateQuote(size, service, frequency)
      if (quote.type === 'range') {
        return (quote.min + quote.max) / 2
      }
      return 150
    }
  }, [])

  // Filtering based on time range
  const filteredAnalyticsBookings = useMemo(() => {
    const now = new Date()
    return bookings.filter((b) => {
      if (!b.createdAt) return false
      const date = new Date(b.createdAt)
      if (analyticsTimeRange === '30days') {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(now.getDate() - 30)
        return date >= thirtyDaysAgo
      }
      if (analyticsTimeRange === '90days') {
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(now.getDate() - 90)
        return date >= ninetyDaysAgo
      }
      if (analyticsTimeRange === 'ytd') {
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        return date >= startOfYear
      }
      if (analyticsTimeRange === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        return date >= startOfMonth
      }
      return true // 'all'
    })
  }, [bookings, analyticsTimeRange])

  // KPI Metrics
  const analyticsTotalBookings = filteredAnalyticsBookings.length
  const analyticsTotalRevenue = useMemo(() => {
    return filteredAnalyticsBookings.reduce((sum, b) => sum + getEstimatedPrice(b), 0)
  }, [filteredAnalyticsBookings, getEstimatedPrice])

  const analyticsAvgBookingValue = useMemo(() => {
    return analyticsTotalBookings > 0 ? analyticsTotalRevenue / analyticsTotalBookings : 0
  }, [analyticsTotalBookings, analyticsTotalRevenue])

  // 1. Lead Source Distribution (Pie Chart)
  const leadSourceData = useMemo(() => {
    const leadSourceKeys = ['organic', 'google', 'referral', 'facebook', 'direct']
    return leadSourceKeys.map((source) => {
      const sourceBookings = filteredAnalyticsBookings.filter((b) => b.leadSource === source)
      const count = sourceBookings.length
      const revenue = sourceBookings.reduce((sum, b) => sum + getEstimatedPrice(b), 0)
      return {
        name: t(`admin.dashboard.leads.${source}`) || source,
        value: count,
        revenue,
        key: source,
      }
    }).filter(item => item.value > 0)
  }, [filteredAnalyticsBookings, getEstimatedPrice, t])

  // 2. Monthly Trend Chart
  const monthlyTrendData = useMemo(() => {
    const monthlyDataMap: Record<string, { monthKey: string; monthName: string; count: number; revenue: number; sortKey: number }> = {}
    filteredAnalyticsBookings.forEach((b) => {
      if (!b.createdAt) return
      const date = new Date(b.createdAt)
      const year = date.getFullYear()
      const month = date.getMonth()
      const sortKey = year * 100 + month
      const monthName = date.toLocaleDateString(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
        month: 'short',
        year: 'numeric',
      })
      const key = `${year}-${month}`
      if (!monthlyDataMap[key]) {
        monthlyDataMap[key] = {
          monthKey: key,
          monthName,
          count: 0,
          revenue: 0,
          sortKey,
        }
      }
      monthlyDataMap[key].count += 1
      monthlyDataMap[key].revenue += getEstimatedPrice(b)
    })
    return Object.values(monthlyDataMap).sort((a, b) => a.sortKey - b.sortKey)
  }, [filteredAnalyticsBookings, getEstimatedPrice, i18n.language])

  // Channels Performance Table
  const channelsPerformance = useMemo(() => {
    const leadSourceKeys = ['organic', 'google', 'referral', 'facebook', 'direct']
    return leadSourceKeys.map((source) => {
      const sourceBookings = filteredAnalyticsBookings.filter((b) => b.leadSource === source)
      const volume = sourceBookings.length
      const revenue = sourceBookings.reduce((sum, b) => sum + getEstimatedPrice(b), 0)
      const avgValue = volume > 0 ? revenue / volume : 0
      const share = analyticsTotalBookings > 0 ? (volume / analyticsTotalBookings) * 100 : 0
      return {
        source,
        name: t(`admin.dashboard.leads.${source}`) || source,
        volume,
        revenue,
        avgValue,
        share,
      }
    }).sort((a, b) => b.revenue - a.revenue)
  }, [filteredAnalyticsBookings, analyticsTotalBookings, getEstimatedPrice, t])

  // Total bookings created via referral code
  const referredBookingsCount = useMemo(() => {
    return filteredAnalyticsBookings.filter((b) => !!b.referredBy).length
  }, [filteredAnalyticsBookings])

  const formatCurrency = useMemo(() => {
    return (val: number) => {
      return new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency',
        currency: 'CAD',
        maximumFractionDigits: 0,
      }).format(val)
    }
  }, [i18n.language])

  return {
    analyticsTimeRange,
    setAnalyticsTimeRange,
    analyticsTotalBookings,
    analyticsTotalRevenue,
    analyticsAvgBookingValue,
    leadSourceData,
    monthlyTrendData,
    channelsPerformance,
    formatCurrency,
    referredBookingsCount,
  }
}

```

---

## File: src/components/admin/hooks/useAdminAuth.ts

```typescript
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/firebase'

export function useAdminAuth() {
  const { t } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const handleAuthChange = async () => {
        setUser(currentUser)
        if (currentUser) {
          const userEmail = currentUser.email?.trim().toLowerCase()
          if (userEmail) {
            try {
              const adminDocRef = doc(db, 'admins', userEmail)
              const adminSnap = await getDoc(adminDocRef)
              const authorized = adminSnap.exists()
              setIsAuthorized(authorized)

              if (!authorized) {
                setAuthError(t('admin.login.errorMessage', { email: currentUser.email }))
              } else {
                setAuthError(null)
              }
            } catch (err) {
              console.error('Error verifying admin authorization:', err)
              setIsAuthorized(false)
              setAuthError(t('admin.login.errorMessage', { email: currentUser.email }))
            }
          } else {
            setIsAuthorized(false)
            setAuthError(t('admin.login.authFailed'))
          }
        } else {
          setIsAuthorized(false)
          setAuthError(null)
        }
        setLoading(false)
      }
      void handleAuthChange()
    })

    return () => unsubscribe()
  }, [t])

  const handleSignIn = async () => {
    setLoading(true)
    setAuthError(null)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error('Sign-in error:', err)
      setAuthError(t('admin.login.authFailed'))
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Sign-out error:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    isAuthorized,
    authError,
    handleSignIn,
    handleSignOut,
  }
}

```

---

## File: src/components/admin/hooks/useBookings.ts

```typescript
import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCollectionQuery } from '@tanstack-query-firebase/react/firestore'
import { collection, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import { updateBookingStatus, updateBookingAssignment } from '@/lib/firebase/firestore'
import type { Booking, BookingStatus } from '@/types'

export function useBookings(enabled: boolean) {
  const queryClient = useQueryClient()

  // Firestore query for bookings
  const bookingsQuery = useMemo(() => {
    return query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
  }, [])

  const { data, isLoading, error } = useCollectionQuery(bookingsQuery, {
    queryKey: ['bookings'],
    enabled,
  })

  // Map the raw documents from QuerySnapshot to Booking[]
  const bookings = useMemo<Booking[]>(() => {
    if (!data) return []
    return data.docs.map((docSnap) => {
      const docData = docSnap.data()
      return {
        id: docSnap.id,
        ...docData,
        createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt.toDate() : new Date(),
      } as Booking
    })
  }, [data])

  // Collapsible rows state
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  // Cleaner custom names input state
  const [customCleanerNames, setCustomCleanerNames] = useState<Record<string, string>>({})
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({})

  // Filtering states
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'preferredDate' | 'createdAt'>('preferredDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Statistics counters
  const totalCount = bookings.length
  const pendingCount = bookings.filter((b) => b.status === 'pending').length
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length

  // Filtered & Sorted Bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter
        const matchesService = serviceFilter === 'all' || b.serviceType === serviceFilter
        const matchesLanguage = languageFilter === 'all' || b.language === languageFilter

        const fullName = `${b.firstName} ${b.lastName}`.toLowerCase()
        const qVal = searchQuery.toLowerCase()
        const matchesSearch =
          fullName.includes(qVal) ||
          b.email.toLowerCase().includes(qVal) ||
          b.phone.includes(qVal) ||
          b.address.toLowerCase().includes(qVal)

        return matchesStatus && matchesService && matchesLanguage && matchesSearch
      })
      .sort((a, b) => {
        const dateA = sortBy === 'preferredDate'
          ? new Date(a.preferredDate).getTime()
          : a.createdAt.getTime()
        const dateB = sortBy === 'preferredDate'
          ? new Date(b.preferredDate).getTime()
          : b.createdAt.getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      })
  }, [bookings, statusFilter, serviceFilter, languageFilter, sortBy, sortOrder, searchQuery])

  const handleStatusChange = async (bookingId: string, status: BookingStatus) => {
    try {
      await updateBookingStatus(bookingId, status)
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const handleAssignmentChange = async (bookingId: string, value: string) => {
    if (value === 'custom') {
      setShowCustomInput((prev) => ({ ...prev, [bookingId]: true }))
    } else {
      setShowCustomInput((prev) => ({ ...prev, [bookingId]: false }))
      try {
        const cleanerName = value === 'unassigned' ? null : value
        await updateBookingAssignment(bookingId, cleanerName)
        await queryClient.invalidateQueries({ queryKey: ['bookings'] })
      } catch (err) {
        console.error('Error updating cleaner assignment:', err)
      }
    }
  }

  const handleCustomCleanerSave = async (bookingId: string) => {
    const customName = customCleanerNames[bookingId]?.trim()
    if (!customName) return

    try {
      await updateBookingAssignment(bookingId, customName)
      setShowCustomInput((prev) => ({ ...prev, [bookingId]: false }))
      await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    } catch (err) {
      console.error('Error saving custom cleaner name:', err)
    }
  }

  return {
    bookings,
    filteredBookings,
    totalCount,
    pendingCount,
    confirmedCount,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    serviceFilter,
    setServiceFilter,
    languageFilter,
    setLanguageFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    searchQuery,
    setSearchQuery,
    expandedRowId,
    setExpandedRowId,
    customCleanerNames,
    setCustomCleanerNames,
    showCustomInput,
    setShowCustomInput,
    handleStatusChange,
    handleAssignmentChange,
    handleCustomCleanerSave,
  }
}

```

---

## File: src/components/booking/BookingStep1.tsx

```tsx
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'
import type { BookingFormData } from '@/lib/schemas/bookingSchema'

type ServiceTypeValue = BookingFormData['serviceType']
type PropertyTypeValue = BookingFormData['propertyType']

const SERVICE_TYPES: ServiceTypeValue[] = [
  'standard', 'deep', 'moveout', 'postconstruction', 'airbnb', 'commercial',
]

const PROPERTY_TYPES: { value: PropertyTypeValue; labelKey: string }[] = [
  { value: 'apartment',  labelKey: 'booking.fields.propertyType.options.apartment' },
  { value: '1-2bed',     labelKey: 'booking.fields.propertyType.options.1-2bed'    },
  { value: '3-4bed',     labelKey: 'booking.fields.propertyType.options.3-4bed'    },
  { value: '5+bed',      labelKey: 'booking.fields.propertyType.options.5+bed'     },
  { value: 'commercial', labelKey: 'booking.fields.propertyType.options.commercial'},
]

export default function BookingStep1() {
  const { t } = useTranslation()
  const { control, formState: { errors }, watch } = useFormContext<BookingFormData>()
  const serviceType = watch('serviceType')

  return (
    <div>
      <div className="bg-white border border-sand rounded shadow-sm p-6 space-y-8">
        <h2 className="font-display text-3xl text-charcoal">{t('booking.step1Title')}</h2>

        {/* Service type */}
        <fieldset>
          <legend className="font-body text-base font-medium text-charcoal mb-3">
            {t('booking.fields.serviceType.label')}
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          </legend>
          <Controller
            name="serviceType"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SERVICE_TYPES.map((type) => (
                  <label
                    key={type}
                    className={cn(
                      'flex items-start gap-3 border rounded p-4 cursor-pointer transition-colors min-h-[48px]',
                      field.value === type
                        ? 'border-slate-brand bg-slate-pale'
                        : 'border-sand bg-white hover:border-slate-light'
                    )}
                  >
                    <input
                      type="radio"
                      name={field.name}
                      value={type}
                      checked={field.value === type}
                      onChange={() => field.onChange(type)}
                      onBlur={field.onBlur}
                      className="mt-0.5 w-4 h-4 accent-slate-brand shrink-0"
                    />
                    <div>
                      <span className="font-body text-base text-charcoal block">
                        {t(`services.${type}.title`)}
                      </span>
                      <span className="font-body text-lg text-charcoal block font-bold leading-snug mt-0.5">
                        {t(`services.${type}.description`)}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.serviceType && (
            <p role="alert" className="font-body text-base text-red-600 mt-2">
              {t('booking.errors.required')}
            </p>
          )}
        </fieldset>

        {/* Airbnb note */}
        {serviceType === 'airbnb' && (
          <div className="bg-slate-pale border border-sand rounded p-4">
            <p className="font-body text-lg text-charcoal font-bold">{t('booking.airbnbNote')}</p>
          </div>
        )}

        {/* Property type */}
        <fieldset>
          <legend className="font-body text-base font-medium text-charcoal mb-3">
            {t('booking.fields.propertyType.label')}
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          </legend>
          <Controller
            name="propertyType"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROPERTY_TYPES.map((pt) => (
                  <label
                    key={pt.value}
                    className={cn(
                      'flex items-center gap-3 border rounded p-4 cursor-pointer transition-colors min-h-[48px]',
                      field.value === pt.value
                        ? 'border-slate-brand bg-slate-pale'
                        : 'border-sand bg-white hover:border-slate-light'
                    )}
                  >
                    <input
                      type="radio"
                      name={field.name}
                      value={pt.value}
                      checked={field.value === pt.value}
                      onChange={() => field.onChange(pt.value)}
                      onBlur={field.onBlur}
                      className="w-4 h-4 accent-slate-brand shrink-0"
                    />
                    <span className="font-body text-base text-charcoal">
                      {t(pt.labelKey)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.propertyType && (
            <p role="alert" className="font-body text-base text-red-600 mt-2">
              {t('booking.errors.required')}
            </p>
          )}
        </fieldset>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Controller
            name="bedrooms"
            control={control}
            render={({ field }) => (
              <div>
                <span className="block font-body text-base font-medium text-charcoal mb-3">
                  {t('booking.fields.bedrooms.label')}
                </span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-label={t('booking.fields.bedrooms.decrease')}
                    onClick={() => field.onChange(Math.max(0, field.value - 1))}
                    className="w-12 h-12 rounded border border-sand flex items-center justify-center font-body text-xl text-charcoal hover:border-slate-brand hover:text-slate-brand transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand min-h-[48px]"
                  >
                    −
                  </button>
                  <span className="font-body text-xl text-charcoal w-8 text-center" aria-live="polite">
                    {field.value}
                  </span>
                  <button
                    type="button"
                    aria-label={t('booking.fields.bedrooms.increase')}
                    onClick={() => field.onChange(Math.min(20, field.value + 1))}
                    className="w-12 h-12 rounded border border-sand flex items-center justify-center font-body text-xl text-charcoal hover:border-slate-brand hover:text-slate-brand transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand min-h-[48px]"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          />

          <Controller
            name="bathrooms"
            control={control}
            render={({ field }) => (
              <div>
                <span className="block font-body text-base font-medium text-charcoal mb-3">
                  {t('booking.fields.bathrooms.label')}
                </span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-label={t('booking.fields.bathrooms.decrease')}
                    onClick={() => field.onChange(Math.max(0, field.value - 1))}
                    className="w-12 h-12 rounded border border-sand flex items-center justify-center font-body text-xl text-charcoal hover:border-slate-brand hover:text-slate-brand transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand min-h-[48px]"
                  >
                    −
                  </button>
                  <span className="font-body text-xl text-charcoal w-8 text-center" aria-live="polite">
                    {field.value}
                  </span>
                  <button
                    type="button"
                    aria-label={t('booking.fields.bathrooms.increase')}
                    onClick={() => field.onChange(Math.min(10, field.value + 1))}
                    className="w-12 h-12 rounded border border-sand flex items-center justify-center font-body text-xl text-charcoal hover:border-slate-brand hover:text-slate-brand transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand min-h-[48px]"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          />
        </div>

        {/* Pets */}
        <Controller
          name="pets"
          control={control}
          render={({ field }) => (
            <label className="flex items-start gap-3 cursor-pointer min-h-[48px]">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                onBlur={field.onBlur}
                className="mt-0.5 w-5 h-5 accent-slate-brand shrink-0"
              />
              <div>
                <span className="font-body text-base text-charcoal block">
                  {t('booking.fields.pets.label')}
                </span>
                <span className="font-body text-lg text-charcoal block font-bold mt-0.5">
                  {t('booking.fields.pets.hint')}
                </span>
              </div>
            </label>
          )}
        />
      </div>

      </div>
  )
}

```

---

## File: src/components/booking/BookingStep2.tsx

```tsx
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'
import type { BookingFormData } from '@/lib/schemas/bookingSchema'

type FrequencyValue = BookingFormData['frequency']
type AddOnValue = BookingFormData['addOns'][number]

interface FrequencyOption {
  value: FrequencyValue
  labelKey: string
  discountKey?: string
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: 'one-time',  labelKey: 'booking.fields.frequency.options.one-time' },
  { value: 'weekly',    labelKey: 'booking.fields.frequency.options.weekly',   discountKey: 'booking.fields.frequency.discounts.weekly'   },
  { value: 'biweekly',  labelKey: 'booking.fields.frequency.options.biweekly', discountKey: 'booking.fields.frequency.discounts.biweekly' },
  { value: 'monthly',   labelKey: 'booking.fields.frequency.options.monthly',  discountKey: 'booking.fields.frequency.discounts.monthly'  },
]

const ADD_ON_OPTIONS: { value: AddOnValue; labelKey: string }[] = [
  { value: 'oven',     labelKey: 'booking.fields.addOns.options.oven'     },
  { value: 'fridge',   labelKey: 'booking.fields.addOns.options.fridge'   },
  { value: 'windows',  labelKey: 'booking.fields.addOns.options.windows'  },
  { value: 'laundry',  labelKey: 'booking.fields.addOns.options.laundry'  },
  { value: 'petHair',  labelKey: 'booking.fields.addOns.options.petHair'  },
  { value: 'basement', labelKey: 'booking.fields.addOns.options.basement' },
]

export default function BookingStep2() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const MIN_DATE = tomorrow.toISOString().slice(0, 10)

  const maxDay = new Date()
  maxDay.setDate(maxDay.getDate() + 90)
  const MAX_DATE = maxDay.toISOString().slice(0, 10)

  const { t } = useTranslation()
  const { register, watch, setValue, formState: { errors } } = useFormContext<BookingFormData>()
  const currentFreq = watch('frequency')
  const currentAddOns = watch('addOns')

  const toggleAddOn = (addon: AddOnValue) => {
    const next = currentAddOns.includes(addon)
      ? currentAddOns.filter((a) => a !== addon)
      : [...currentAddOns, addon]
    setValue('addOns', next, { shouldValidate: true })
  }

  return (
    <div>
      <div className="bg-white border border-sand rounded shadow-sm p-6 space-y-8">
        <h2 className="font-display text-3xl text-charcoal">{t('booking.step2Title')}</h2>

        {/* Frequency */}
        <fieldset>
          <legend className="font-body text-base font-medium text-charcoal mb-3">
            {t('booking.fields.frequency.label')}
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FREQUENCY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  'flex items-center justify-between border rounded p-4 cursor-pointer transition-colors min-h-[48px]',
                  currentFreq === opt.value
                    ? 'border-slate-brand bg-slate-pale'
                    : 'border-sand bg-white hover:border-slate-light'
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    value={opt.value}
                    {...register('frequency')}
                    className="w-4 h-4 accent-slate-brand shrink-0"
                  />
                  <span className="font-body text-base text-charcoal">{t(opt.labelKey)}</span>
                </span>
                {opt.discountKey && (
                  <span className="font-body text-base font-medium text-slate-brand bg-slate-pale border border-slate-brand rounded px-2 py-0.5">
                    {t(opt.discountKey)}
                  </span>
                )}
              </label>
            ))}
          </div>
          {errors.frequency && (
            <p role="alert" className="font-body text-base text-red-600 mt-2">
              {t('booking.errors.required')}
            </p>
          )}
        </fieldset>

        {/* Preferred date */}
        <div>
          <label htmlFor="preferredDate" className="block font-body text-base font-medium text-charcoal mb-1">
            {t('booking.fields.preferredDate.label')}
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          </label>
          <input
            id="preferredDate"
            type="date"
            min={MIN_DATE}
            max={MAX_DATE}
            {...register('preferredDate')}
            aria-required="true"
            aria-invalid={errors.preferredDate ? 'true' : 'false'}
            aria-describedby={errors.preferredDate ? 'preferredDate-error' : 'preferredDate-hint'}
            className={cn(
              'w-full border rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand',
              errors.preferredDate ? 'border-red-500' : 'border-sand'
            )}
          />
          {errors.preferredDate ? (
            <p id="preferredDate-error" role="alert" className="font-body text-base text-red-600 mt-1">
              {t('booking.errors.date')}
            </p>
          ) : (
            <p id="preferredDate-hint" className="font-body text-lg text-charcoal font-bold mt-1">
              {t('booking.fields.preferredDate.hint')}
            </p>
          )}
        </div>

        {/* Add-ons */}
        <fieldset>
          <legend className="font-body text-base font-medium text-charcoal mb-3">
            {t('booking.fields.addOns.label')}
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ADD_ON_OPTIONS.map((addon) => {
              const checked = currentAddOns.includes(addon.value)
              return (
                <label
                  key={addon.value}
                  className={cn(
                    'flex items-center gap-3 border rounded p-4 cursor-pointer transition-colors min-h-[48px]',
                    checked
                      ? 'border-slate-brand bg-slate-pale'
                      : 'border-sand bg-white hover:border-slate-light'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAddOn(addon.value)}
                    className="w-4 h-4 accent-slate-brand shrink-0"
                  />
                  <span className="font-body text-base text-charcoal">{t(addon.labelKey)}</span>
                </label>
              )
            })}
          </div>
        </fieldset>

        {/* Square footage (optional) */}
        <div>
          <label htmlFor="squareFootage" className="block font-body text-base font-medium text-charcoal mb-1">
            {t('booking.fields.squareFootage.label')}
            <span className="font-body text-base text-text-muted ml-2">{t('booking.fields.squareFootage.optional')}</span>
          </label>
          <input
            id="squareFootage"
            type="number"
            min={0}
            max={100000}
            {...register('squareFootage', {
              setValueAs: (v: string) => (v === '' ? undefined : parseInt(v, 10)),
            })}
            className="w-full border border-sand rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand"
            placeholder={t('booking.fields.squareFootage.placeholder')}
          />
        </div>
      </div>

      </div>
  )
}

```

---

## File: src/components/booking/BookingStep3.tsx

```tsx
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'
import type { BookingFormData } from '@/lib/schemas/bookingSchema'

export default function BookingStep3() {
  const { t } = useTranslation()
  const { register, formState: { errors } } = useFormContext<BookingFormData>()

  return (
    <div>
      <div className="bg-white border border-sand rounded shadow-sm p-6 space-y-6">
        <h2 className="font-display text-3xl text-charcoal">{t('booking.step3Title')}</h2>

        {/* Name row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block font-body text-base font-medium text-charcoal mb-1">
              {t('booking.fields.firstName.label')}
              <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              {...register('firstName')}
              aria-required="true"
              aria-invalid={errors.firstName ? 'true' : 'false'}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              placeholder={t('booking.fields.firstName.placeholder')}
              className={cn(
                'w-full border rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand',
                errors.firstName ? 'border-red-500' : 'border-sand'
              )}
            />
            {errors.firstName && (
              <p id="firstName-error" role="alert" className="font-body text-base text-red-600 mt-1">
                {t('booking.errors.required')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block font-body text-base font-medium text-charcoal mb-1">
              {t('booking.fields.lastName.label')}
              <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              {...register('lastName')}
              aria-required="true"
              aria-invalid={errors.lastName ? 'true' : 'false'}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              placeholder={t('booking.fields.lastName.placeholder')}
              className={cn(
                'w-full border rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand',
                errors.lastName ? 'border-red-500' : 'border-sand'
              )}
            />
            {errors.lastName && (
              <p id="lastName-error" role="alert" className="font-body text-base text-red-600 mt-1">
                {t('booking.errors.required')}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block font-body text-base font-medium text-charcoal mb-1">
            {t('booking.fields.email.label')}
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            aria-required="true"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            placeholder={t('booking.fields.email.placeholder')}
            className={cn(
              'w-full border rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand',
              errors.email ? 'border-red-500' : 'border-sand'
            )}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="font-body text-base text-red-600 mt-1">
              {t('booking.errors.email')}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block font-body text-base font-medium text-charcoal mb-1">
            {t('booking.fields.phone.label')}
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            {...register('phone')}
            aria-required="true"
            aria-invalid={errors.phone ? 'true' : 'false'}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            placeholder={t('booking.fields.phone.placeholder')}
            className={cn(
              'w-full border rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand',
              errors.phone ? 'border-red-500' : 'border-sand'
            )}
          />
          {errors.phone && (
            <p id="phone-error" role="alert" className="font-body text-base text-red-600 mt-1">
              {t('booking.errors.phone')}
            </p>
          )}
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block font-body text-base font-medium text-charcoal mb-1">
            {t('booking.fields.address.label')}
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
          </label>
          <input
            id="address"
            type="text"
            autoComplete="street-address"
            {...register('address')}
            aria-required="true"
            aria-invalid={errors.address ? 'true' : 'false'}
            aria-describedby={errors.address ? 'address-error' : 'address-hint'}
            placeholder={t('booking.fields.address.placeholder')}
            className={cn(
              'w-full border rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand',
              errors.address ? 'border-red-500' : 'border-sand'
            )}
          />
          {errors.address ? (
            <p id="address-error" role="alert" className="font-body text-base text-red-600 mt-1">
              {t('booking.errors.required')}
            </p>
          ) : (
            <p id="address-hint" className="font-body text-lg text-charcoal font-bold mt-1">
              {t('booking.fields.address.hint')}
            </p>
          )}
        </div>

        {/* Preferred cleaner (optional) */}
        <div>
          <label htmlFor="preferredCleaner" className="block font-body text-base font-medium text-charcoal mb-1">
            {t('booking.fields.preferredCleaner.label')}
          </label>
          <input
            id="preferredCleaner"
            type="text"
            {...register('preferredCleaner')}
            placeholder={t('booking.fields.preferredCleaner.placeholder')}
            className="w-full border border-sand rounded px-4 font-body text-base text-charcoal min-h-[48px] focus:outline-none focus:ring-2 focus:ring-slate-brand"
          />
        </div>

        {/* Notes (optional) */}
        <div>
          <label htmlFor="notes" className="block font-body text-base font-medium text-charcoal mb-1">
            {t('booking.fields.notes.label')}
          </label>
          <textarea
            id="notes"
            rows={4}
            {...register('notes')}
            placeholder={t('booking.fields.notes.placeholder')}
            className="w-full border border-sand rounded px-4 py-3 font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand resize-y"
          />
        </div>
      </div>

      </div>
  )
}

```

---

## File: src/components/booking/BookingStep4.tsx

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import { cn } from '@/lib/utils/utils'
import type { BookingFormData } from '@/lib/schemas/bookingSchema'

interface Props {
  submitError?: string | null
}

export default function BookingStep4({ submitError }: Props) {
  const { t } = useTranslation()
  const { register, getValues, setValue, formState: { isSubmitting } } = useFormContext<BookingFormData>()
  const values = getValues()

  const [searchParams] = useSearchParams()
  const [promoCode, setPromoCode] = useState(() => searchParams.get('ref') || '')
  const [promoStatus, setPromoStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [promoMessage, setPromoMessage] = useState('')

  const verifyPromo = useCallback(async (code: string) => {
    if (!code.trim()) return
    setPromoStatus('checking')
    try {
      const cleanCode = code.trim().toUpperCase()
      const docRef = doc(db, 'referrals', cleanCode)
      const docSnap = await getDoc(docRef)
      const data = docSnap.data()
      if (docSnap.exists() && data && data['active'] === true) {
        setPromoStatus('valid')
        setValue('referredBy', cleanCode)
        const owner = (data['ownerName'] as string) || ''
        setPromoMessage(t('referrals.promoValid') + (owner ? ` (${t('referrals.referredBy', { name: owner })})` : ''))
      } else {
        setPromoStatus('invalid')
        setValue('referredBy', null)
        setPromoMessage(t('referrals.promoInvalid'))
      }
    } catch (err) {
      console.error(err)
      setPromoStatus('invalid')
      setValue('referredBy', null)
      setPromoMessage(t('referrals.promoInvalid'))
    }
  }, [setValue, t])

  useEffect(() => {
    const refParam = searchParams.get('ref')
    if (refParam) {
      const timer = setTimeout(() => {
        void verifyPromo(refParam)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [searchParams, verifyPromo])

  const frequencyLabel = t(`booking.fields.frequency.options.${values.frequency}`)
  const serviceLabel   = t(`services.${values.serviceType}.title`)
  const propertyLabel  = t(`booking.fields.propertyType.options.${values.propertyType}`)

  const addOnLabels = values.addOns.length > 0
    ? values.addOns.map((a) => t(`booking.fields.addOns.options.${a}`)).join(', ')
    : '—'

  return (
    <div>
      <div className="bg-white border border-sand rounded shadow-sm p-6 space-y-6">
        <h2 className="font-display text-3xl text-charcoal">{t('booking.step4Title')}</h2>

        {/* Review table */}
        <div className="divide-y divide-sand">
          {/* Service */}
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.service')}</p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">{serviceLabel}</p>
            </div>
          </div>

          {/* Property */}
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.property')}</p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">
                {propertyLabel} — {values.bedrooms} {t('booking.fields.bedrooms.label').toLowerCase()} / {values.bathrooms} {t('booking.fields.bathrooms.label').toLowerCase()}
                {values.pets && ` · ${t('booking.fields.pets.label')}`}
              </p>
            </div>
          </div>

          {/* Schedule */}
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.schedule')}</p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">
                {frequencyLabel} · {values.preferredDate}
              </p>
            </div>
          </div>

          {/* Add-ons */}
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.addOns')}</p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">{addOnLabels}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.contact')}</p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">
                {values.firstName} {values.lastName} · {values.email} · {values.phone}
              </p>
              <p className="font-body text-lg text-charcoal font-bold mt-0.5">{values.address}</p>
            </div>
          </div>

          {/* Notes */}
          {values.notes && (
            <div className="flex items-start justify-between py-3">
              <div>
                <p className="font-body text-lg text-charcoal font-bold">{t('booking.review.notes')}</p>
                <p className="font-body text-lg text-charcoal font-bold mt-0.5">{values.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Referral / Promo Code */}
        <div className="pt-4 border-t border-sand">
          <label htmlFor="referralCodeInput" className="block font-body text-base text-charcoal mb-1">
            {t('referrals.promoCodeLabel')}
          </label>
          <div className="flex gap-2">
            <input
              id="referralCodeInput"
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder={t('referrals.promoPlaceholder')}
              className={cn(
                'flex-grow border rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand',
                promoStatus === 'valid' ? 'border-green-500 bg-green-50/20' : 'border-sand'
              )}
            />
            <button
              type="button"
              onClick={() => void verifyPromo(promoCode)}
              disabled={promoStatus === 'checking' || !promoCode.trim()}
              className="bg-slate-brand text-white font-body font-medium text-base rounded px-6 min-h-[48px] hover:bg-slate-dark transition-colors duration-200 disabled:opacity-60"
            >
              {promoStatus === 'checking' ? t('referrals.promoChecking') : t('common.verify')}
            </button>
          </div>
          {promoStatus !== 'idle' && (
            <p
              className={cn(
                'font-body text-base mt-2',
                promoStatus === 'valid' ? 'text-green-600' : 'text-red-600'
              )}
            >
              {promoMessage}
            </p>
          )}
        </div>

        {/* CASL marketing consent — unchecked by default (COMPLIANCE.md) */}
        <div className="pt-2 border-t border-sand">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="marketingConsent"
              {...register('marketingConsent')}
              className="mt-0.5 w-5 h-5 accent-slate-brand shrink-0"
            />
            <span className="font-body text-base text-charcoal">
              {t('booking.fields.marketingConsent.label')}
            </span>
          </label>
        </div>
      </div>

      {submitError && (
        <div role="alert" className="mt-4 bg-red-50 border border-red-300 rounded p-4 font-body text-base text-red-700">
          {submitError}{' '}
          <a href="tel:+16139353555" className="font-medium underline text-red-700">
            {t('phone')}
          </a>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center font-body font-medium text-base
                     bg-slate-brand text-white hover:bg-slate-dark rounded px-8 min-h-[48px]
                     transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('booking.submitting') : t('booking.submit')}
        </button>
      </div>
    </div>
  )
}

```

---

## File: src/components/booking/StepIndicator.tsx

```tsx
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const { t } = useTranslation()
  return (
    <div className="mb-8" aria-label={t('booking.progress', { current: currentStep + 1, total: totalSteps })}>
      <div className="flex items-center justify-between mb-3">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex-1 flex items-center">
            <div
              aria-current={i === currentStep ? 'step' : undefined}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-body text-sm font-medium shrink-0 transition-colors',
                i < currentStep  && 'bg-slate-brand text-white',
                i === currentStep && 'bg-slate-brand text-white ring-2 ring-slate-brand ring-offset-2',
                i > currentStep  && 'bg-sand text-text-muted',
              )}
            >
              {i < currentStep ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            {i < totalSteps - 1 && (
              <div className={cn('h-0.5 flex-1 mx-1 transition-colors', i < currentStep ? 'bg-slate-brand' : 'bg-sand')} />
            )}
          </div>
        ))}
      </div>
      <p className="font-body text-sm text-text-muted text-center">
        {t('booking.progress', { current: currentStep + 1, total: totalSteps })}
      </p>
    </div>
  )
}

```

---

## File: src/components/home/GalleryPreview.tsx

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils/utils'
import { FEATURED_PAIRS } from '@/lib/data/galleryData'
import GalleryImage from '@/components/ui/GalleryImage'
import { fadeUp, stagger } from '@/lib/utils/animations'

export default function GalleryPreview() {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('gallery.ariaLabel')}
      className="bg-cream py-12 px-4 md:py-20 md:px-6"
    >
      <div className="max-w-content mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mb-10"
        >
          <h2 className="font-display text-4xl text-charcoal mb-4">
            {t('gallery.previewHeading')}
          </h2>
          <p className="font-body text-base text-text-muted">
            {t('gallery.previewSubhead')}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
        >
          {FEATURED_PAIRS.map(pair => {
            const serviceTitle = t(`services.${pair.serviceKey}.title`)
            const beforeAlt = t('gallery.beforeAlt', { service: serviceTitle })
            const afterAlt = t('gallery.afterAlt', { service: serviceTitle })

            return (
              <motion.div key={pair.id} variants={fadeUp}>
                <Link
                  to="/gallery"
                  aria-label={t(pair.captionKey)}
                  className={cn(
                    'group block rounded',
                    'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                  )}
                >
                  <div className="grid grid-cols-2 aspect-[4/3] rounded overflow-hidden">
                    <div className="relative">
                      <span className="absolute top-1.5 left-1.5 z-10 bg-charcoal/70 text-white font-body text-xs px-1.5 py-0.5 rounded">
                        {t('gallery.beforeLabel')}
                      </span>
                      <GalleryImage
                        src={pair.beforeSrc}
                        alt={beforeAlt}
                        className="absolute inset-0"
                      />
                    </div>
                    <div className="relative border-l border-white/20">
                      <span className="absolute top-1.5 left-1.5 z-10 bg-charcoal/70 text-white font-body text-xs px-1.5 py-0.5 rounded">
                        {t('gallery.afterLabel')}
                      </span>
                      <GalleryImage
                        src={pair.afterSrc}
                        alt={afterAlt}
                        className="absolute inset-0"
                      />
                    </div>
                  </div>
                  <p className="font-body text-sm text-text-muted mt-3 group-hover:text-charcoal transition-colors">
                    {t(pair.captionKey)}
                  </p>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mt-10"
        >
          <Link
            to="/gallery"
            className={cn(
              'inline-flex items-center font-body font-medium text-base rounded',
              'min-h-[48px] px-6 py-3 bg-slate-brand text-white',
              'hover:bg-slate-dark transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
            )}
          >
            {t('gallery.viewAll')} →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

```

---

## File: src/components/home/Hero.tsx

```tsx
import { motion } from 'framer-motion'
import { useTranslation, Trans } from 'react-i18next'
import { Link } from 'react-router-dom'
import logoHero from '@/assets/logo-hero-340px.png'
import { fadeUp, stagger } from '@/lib/utils/animations'

export default function Hero() {
  const { t } = useTranslation()

  return (
    <section className="bg-warm-white py-12 px-4 md:py-16 md:px-6 overflow-hidden relative">
      <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center gap-6 min-h-[300px] justify-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 flex flex-col items-center gap-6 w-full"
        >
          {/* Main title container with nest watermark behind it */}
          <div className="relative w-full py-4 flex items-center justify-center">
            <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-visible">
              <img
                src="/images/nest-watermark.jpg"
                alt=""
                aria-hidden="true"
                className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] object-contain mix-blend-multiply"
                style={{ opacity: 0.25 }}
              />
            </div>
            <motion.h1
              variants={fadeUp}
              className="relative z-10 font-display text-5xl md:text-6xl text-charcoal leading-tight max-w-2xl text-center"
            >
              <Trans
                i18nKey="hero.headline"
                components={{
                  highlight: <span className="italic text-slate-brand" />,
                  br: <br />
                }}
              />
            </motion.h1>
          </div>

          <motion.p
            variants={fadeUp}
            className="font-body text-xl font-bold text-charcoal max-w-xl leading-relaxed"
          >
            {t('hero.subhead')}
          </motion.p>

          {/* Hero logo under subtitle, above Book Now button */}
          <motion.div
            variants={fadeUp}
            className="w-full max-w-[280px] md:max-w-[340px] my-2"
          >
            <img
              src={logoHero}
              alt="Fresh Nest Co."
              className="w-full h-auto object-contain mx-auto"
            />
          </motion.div>

          <motion.div variants={fadeUp} className="mt-2">
            <Link
              to="/booking"
              className="inline-flex items-center bg-slate-brand text-white font-body font-medium rounded px-8 py-4 min-h-[48px] hover:bg-slate-dark transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2 focus:ring-offset-warm-white"
            >
              {t('common.bookNow')}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

```

---

## File: src/components/home/HowItWorks.tsx

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils/utils'
import { fadeUp, stagger } from '@/lib/utils/animations'

interface Step {
  number: number
  titleKey: string
  descKey: string
}

const STEPS: Step[] = [
  { number: 1, titleKey: 'howItWorks.step1Title', descKey: 'howItWorks.step1Desc' },
  { number: 2, titleKey: 'howItWorks.step2Title', descKey: 'howItWorks.step2Desc' },
  { number: 3, titleKey: 'howItWorks.step3Title', descKey: 'howItWorks.step3Desc' },
  { number: 4, titleKey: 'howItWorks.step4Title', descKey: 'howItWorks.step4Desc' },
]

export default function HowItWorks() {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('howItWorks.ariaLabel')}
      className="bg-warm-white py-12 px-4 md:py-20 md:px-6"
    >
      <div className="max-w-content mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mb-12"
        >
          <h2 className="font-display text-4xl text-charcoal mb-4">
            {t('howItWorks.sectionHeading')}
          </h2>
          <p className="font-body text-lg text-charcoal font-bold">
            {t('howItWorks.sectionSubhead')}
          </p>
        </motion.div>

        <div className="relative">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {STEPS.map((step) => {
              const inverted = step.number % 2 === 0
              return (
                <motion.div key={step.number} variants={fadeUp} className="flex">
                  <article
                    className={cn(
                      'relative overflow-hidden rounded border p-6 flex flex-col items-start text-left gap-4 w-full',
                      inverted
                        ? 'bg-slate-brand border-slate-brand'
                        : 'bg-white border-sand shadow-sm',
                    )}
                  >
                    {/* Background Image decoration */}
                    <div className="absolute inset-0 pointer-events-none">
                      <img
                        src={`/images/howitworks-step${step.number}.png`}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover"
                        style={{ opacity: 0.15 }}
                      />
                    </div>

                    {/* Content wrapper to float above background image */}
                    <div className="relative z-10 flex flex-col items-start gap-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          aria-hidden="true"
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center font-sub text-lg shrink-0 transition-colors duration-200',
                            inverted
                              ? 'bg-white text-slate-brand'
                              : 'bg-slate-brand text-white',
                          )}
                        >
                          {step.number}
                        </div>

                        <h3
                          className={cn(
                            'font-sub text-xl',
                            inverted ? 'text-white' : 'text-charcoal',
                          )}
                        >
                          {t(step.titleKey)}
                        </h3>
                      </div>

                      <p
                        className={cn(
                          'font-body text-lg flex-1 font-bold',
                          inverted ? 'text-white' : 'text-charcoal',
                        )}
                      >
                        {t(step.descKey)}
                      </p>
                    </div>
                  </article>
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mt-10 text-center"
        >
          <Link
            to="/faq"
            className="inline-flex items-center min-h-[48px] font-body text-base text-slate-brand hover:text-slate-dark underline underline-offset-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand rounded px-1"
          >
            {t('howItWorks.faqLink')} →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

```

---

## File: src/components/home/MeetTheTeam.tsx

```tsx
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import TeamAvatar from '@/components/ui/TeamAvatar'
import { fadeUp, stagger } from '@/lib/utils/animations'

interface TeamMember {
  id: string
  name: string
  roleKey: string
  bioKey: string
  initials: string
  photoSrc: string | null
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'lauren',
    name: 'Lauren S.',
    roleKey: 'team.members.lauren.role',
    bioKey: 'team.members.lauren.bio',
    initials: 'L',
    photoSrc: '/images/team/lauren.png',
  },
  {
    id: 'sarah',
    name: 'Sarah M.',
    roleKey: 'team.members.sarah.role',
    bioKey: 'team.members.sarah.bio',
    initials: 'S',
    photoSrc: '/images/team/sarah.png',
  },
]


export default function MeetTheTeam() {
  const { t } = useTranslation()

  return (
    <section aria-label={t('team.ariaLabel')} className="bg-cream py-12 px-4 md:py-20 md:px-6">
      <div className="max-w-content mx-auto">

        {/* Section heading */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mb-8"
        >
          <h2 className="font-display text-4xl text-charcoal mb-4">{t('team.sectionHeading')}</h2>
          <p className="font-body text-lg text-charcoal font-bold">{t('team.sectionSubhead')}</p>
        </motion.div>

        {/* Consistent-assignment callout */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mb-10"
        >
          <div className="flex items-start gap-4 bg-slate-pale border border-sand rounded p-6">
            <div className="shrink-0 mt-0.5" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-slate-brand"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="flex-1 font-body text-lg text-charcoal font-bold">{t('team.assignmentNote')}</p>
            <Link
              to="/booking"
              className="shrink-0 inline-flex items-center font-body font-medium text-base
                         text-slate-brand hover:text-slate-dark underline underline-offset-2
                         transition-colors min-h-[48px] focus:outline-none focus:ring-2
                         focus:ring-slate-brand rounded px-1"
            >
              {t('common.bookNow')}
            </Link>
          </div>
        </motion.div>

        {/* Team member cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
        >
          {TEAM_MEMBERS.map(member => (
            <motion.div key={member.id} variants={fadeUp}>
              <article className="bg-white border border-sand rounded shadow-sm overflow-hidden">
                <div className="aspect-square">
                  <TeamAvatar
                    src={member.photoSrc}
                    alt={t('team.photoAlt', { name: member.name })}
                    initials={member.initials}
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-sub text-2xl text-charcoal mb-1">{member.name}</h3>
                  <p className="font-body text-sm font-medium text-slate-brand mb-3">
                    {t(member.roleKey)}
                  </p>
                  <p className="font-body text-lg text-charcoal font-bold">{t(member.bioKey)}</p>
                </div>
              </article>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}

```

---

## File: src/components/home/QuoteCalculator.tsx

```tsx
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils/utils'
import {
  calculateQuote,
  FREQUENCY_DISCOUNT,
  type QuoteFrequency,
  type QuotePropertySize,
  type QuoteServiceType,
} from '@/lib/utils/quotePricing'
import { logQuoteCalculated } from '@/lib/firebase/analytics'
import { fadeUp } from '@/lib/utils/animations'

const SIZE_OPTIONS: { value: QuotePropertySize; labelKey: string }[] = [
  { value: 'apartment',  labelKey: 'quote.size.apartment' },
  { value: '1-2bed',     labelKey: 'quote.size.1-2bed' },
  { value: '3-4bed',     labelKey: 'quote.size.3-4bed' },
  { value: '5plus',      labelKey: 'quote.size.5plus' },
  { value: 'commercial', labelKey: 'quote.size.commercial' },
]

const SERVICE_OPTIONS: { value: QuoteServiceType; labelKey: string }[] = [
  { value: 'standard',         labelKey: 'quote.service.standard' },
  { value: 'deep',             labelKey: 'quote.service.deep' },
  { value: 'moveout',          labelKey: 'quote.service.moveout' },
  { value: 'postconstruction', labelKey: 'quote.service.postconstruction' },
  { value: 'airbnb',           labelKey: 'quote.service.airbnb' },
]

const FREQUENCY_OPTIONS: { value: QuoteFrequency; labelKey: string }[] = [
  { value: 'one-time',  labelKey: 'quote.frequency.one-time' },
  { value: 'weekly',    labelKey: 'quote.frequency.weekly' },
  { value: 'biweekly',  labelKey: 'quote.frequency.biweekly' },
  { value: 'monthly',   labelKey: 'quote.frequency.monthly' },
]

function btnClass(isActive: boolean) {
  return cn(
    'font-body text-base font-medium rounded min-h-[48px] px-4 py-2',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-1',
    isActive
      ? 'bg-slate-brand text-white'
      : 'bg-white border border-sand text-charcoal hover:bg-slate-pale',
  )
}

export default function QuoteCalculator() {
  const { t } = useTranslation()

  const [size, setSize]           = useState<QuotePropertySize>('3-4bed')
  const [service, setService]     = useState<QuoteServiceType>('standard')
  const [frequency, setFrequency] = useState<QuoteFrequency>('biweekly')

  const quote = calculateQuote(size, service, frequency)

  const bookingHref = useMemo(() => {
    if (size === 'commercial') return '/booking?commercial=1'
    const params = new URLSearchParams({ size, service, freq: frequency })
    return `/booking?${params.toString()}`
  }, [size, service, frequency])

  return (
    <section aria-label={t('quote.ariaLabel')} className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <div className="max-w-content mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="max-w-2xl mx-auto"
        >
          <h2 className="font-display text-4xl text-charcoal mb-3">
            {t('quote.sectionHeading')}
          </h2>
          <p className="font-body text-lg text-charcoal font-bold mb-8">
            {t('quote.sectionSubhead')}
          </p>

          <div className="space-y-6">
            {/* Property Size */}
            <div className="relative overflow-hidden bg-white border border-sand rounded p-6">
              {/* Background Image decoration */}
              <div className="absolute inset-0 pointer-events-none">
                <img
                  src="/images/quote-size.png"
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.25 }}
                />
              </div>
              <div className="relative z-10">
                <p id="size-label" className="font-body text-base font-medium text-charcoal mb-2">
                  {t('quote.sizeLabel')}
                </p>
                <div role="group" aria-labelledby="size-label" className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map(({ value, labelKey }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={size === value}
                      onClick={() => setSize(value)}
                      className={btnClass(size === value)}
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Service Type */}
            <div className="relative overflow-hidden bg-cream border border-sand rounded p-6">
              {/* Background Image decoration */}
              <div className="absolute inset-0 pointer-events-none">
                <img
                  src="/images/quote-service.png"
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.25 }}
                />
              </div>
              <div className="relative z-10">
                <p id="service-label" className="font-body text-base font-medium text-charcoal mb-2">
                  {t('quote.serviceLabel')}
                </p>
                <div role="group" aria-labelledby="service-label" className="flex flex-wrap gap-2">
                  {SERVICE_OPTIONS.map(({ value, labelKey }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={service === value}
                      onClick={() => setService(value)}
                      className={btnClass(service === value)}
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Frequency */}
            <div className="relative overflow-hidden bg-slate-pale border border-sand rounded p-6">
              {/* Background Image decoration */}
              <div className="absolute inset-0 pointer-events-none">
                <img
                  src="/images/quote-frequency.png"
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.25 }}
                />
              </div>
              <div className="relative z-10">
                <p id="freq-label" className="font-body text-base font-medium text-charcoal mb-2">
                  {t('quote.frequencyLabel')}
                </p>
                <div role="group" aria-labelledby="freq-label" className="flex flex-wrap gap-2">
                  {FREQUENCY_OPTIONS.map(({ value, labelKey }) => {
                    const discount = FREQUENCY_DISCOUNT[value]
                    const isActive = frequency === value
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setFrequency(value)}
                        className={btnClass(isActive)}
                      >
                        {t(labelKey)}
                        {discount > 0 && (
                          <span className="font-body text-sm ml-1.5 opacity-75">
                            {t('quote.discountBadge', { pct: Math.round(discount * 100) })}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Result panel */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="mt-8 p-6 bg-white rounded border border-sand text-center"
          >
            {quote.type === 'commercial' ? (
              <div className="space-y-3">
                <p className="font-sub text-2xl text-charcoal">
                  {t('quote.commercialTitle')}
                </p>
                <p className="font-body text-base text-text-muted">
                  {t('quote.commercialBody')}
                </p>
                <Link
                  to="/booking?commercial=1"
                  className="inline-flex items-center border border-slate-brand text-slate-brand font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-pale transition-colors duration-200"
                >
                  {t('quote.commercialCta')}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-display text-4xl text-charcoal">
                  {t('quote.startingAt', { price: quote.min })}
                </p>
                <p className="font-body text-base text-text-muted">
                  {t('quote.typicallyRange', { min: quote.min, max: quote.max })}
                </p>
                <Link
                  to={bookingHref}
                  onClick={() => logQuoteCalculated(service, quote.min)}
                  className="inline-flex items-center bg-slate-brand text-white font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-dark transition-colors duration-200"
                >
                  {t('quote.bookNowCta')}
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

```

---

## File: src/components/home/RecurringCTA.tsx

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils/utils'
import { fadeUp, stagger } from '@/lib/utils/animations'

type FrequencyOption = 'weekly' | 'biweekly' | 'monthly'

interface FrequencyCard {
  freq: FrequencyOption
  discountPct: number
  inverted: boolean
  badgeKey: string
  bgImage: string
}

const FREQUENCY_CARDS: FrequencyCard[] = [
  { freq: 'weekly',   discountPct: 20, inverted: false, badgeKey: '', bgImage: '/images/weekly-recurring.png' },
  { freq: 'biweekly', discountPct: 15, inverted: true,  badgeKey: 'recurring.mostPopular', bgImage: '/images/biweekly-recurring.png' },
  { freq: 'monthly',  discountPct: 10, inverted: false, badgeKey: '', bgImage: '/images/monthly-recurring.png' },
]

export default function RecurringCTA() {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('recurring.ariaLabel')}
      className="bg-warm-white py-12 px-4 md:py-20 md:px-6"
    >
      <div className="max-w-content mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mb-10"
        >
          <h2 className="font-display text-4xl text-charcoal mb-4">
            {t('recurring.sectionHeading')}
          </h2>
          <p className="font-body text-lg text-charcoal font-bold">
            {t('recurring.sectionSubhead')}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
        >
          {FREQUENCY_CARDS.map((card) => {
            const freqLabel = t(`quote.frequency.${card.freq}`)
            return (
              <motion.div key={card.freq} variants={fadeUp} className="flex">
                <article
                  className={cn(
                    'relative overflow-hidden rounded border p-6 flex flex-col gap-4 w-full',
                    card.inverted
                      ? 'bg-slate-brand border-slate-brand'
                      : 'bg-white border-sand shadow-sm',
                  )}
                >
                  {/* Background Image decoration */}
                  <div className="absolute inset-0 pointer-events-none">
                    <img
                      src={card.bgImage}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover"
                      style={{ opacity: 0.15 }}
                    />
                  </div>

                  {/* Floating "Most Popular" badge */}
                  {card.badgeKey && (
                    <span
                      className={cn(
                        'absolute top-4 right-4 z-20 font-body text-sm font-semibold rounded px-3 py-1 shadow-sm',
                        card.inverted
                          ? 'bg-white text-slate-dark'
                          : 'bg-slate-brand text-white',
                      )}
                    >
                      {t(card.badgeKey)}
                    </span>
                  )}

                  {/* Relative z-10 wrapper to ensure text stays legible over background image */}
                  <div className="relative z-10 flex flex-col gap-4 flex-1">
                    <div className={cn('flex items-center gap-3 flex-wrap', card.badgeKey ? 'pr-20' : '')}>
                      <h3
                        className={cn(
                          'font-sub text-2xl',
                          card.inverted ? 'text-white' : 'text-charcoal',
                        )}
                      >
                        {freqLabel}
                      </h3>

                      <div
                        className={cn(
                          'inline-flex items-center font-body font-medium text-base rounded px-3 py-1',
                          card.inverted
                            ? 'bg-white text-slate-dark'
                            : 'bg-slate-pale text-slate-dark',
                        )}
                      >
                        {t('recurring.discountBadge', { pct: card.discountPct })}
                      </div>
                    </div>

                    <p
                      className={cn(
                        'font-body text-lg flex-1 font-bold',
                        card.inverted ? 'text-white' : 'text-charcoal',
                      )}
                    >
                      {t(`recurring.tagline.${card.freq}`)}
                    </p>

                    <Link
                      to={`/booking?freq=${card.freq}`}
                      aria-label={t('recurring.bookAriaLabel', { freq: freqLabel })}
                      className={cn(
                        'inline-flex items-center font-body font-medium text-base rounded',
                        'min-h-[48px] px-4 py-2 self-start transition-colors duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2',
                        card.inverted
                          ? 'bg-cream text-slate-dark hover:bg-warm-white hover:text-slate-dark focus:ring-white'
                          : 'bg-slate-brand text-white hover:bg-slate-dark focus:ring-slate-brand',
                      )}
                    >
                      {t('recurring.bookCta', { freq: freqLabel })} →
                    </Link>
                  </div>
                </article>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

```

---

## File: src/components/home/Reviews.tsx

```tsx
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { STATIC_REVIEWS, type Review } from '@/lib/data/reviewsData'
import { fadeUp, stagger } from '@/lib/utils/animations'

function StarRating({ rating }: { rating: number }) {
  const { t } = useTranslation()
  return (
    <div
      role="img"
      aria-label={t('reviews.starAriaLabel', { rating, max: 5 })}
      className="flex gap-0.5"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-4 h-4 ${i < rating ? 'text-sand-dark' : 'text-slate-pale'}`}
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <motion.article
      variants={fadeUp}
      className="snap-start shrink-0 w-[min(18rem,85vw)]
                 md:w-auto md:shrink
                 bg-white border border-sand rounded shadow-sm p-6
                 flex flex-col gap-3"
    >
      <StarRating rating={review.rating} />
      <p className="font-body text-lg text-charcoal flex-1 font-bold leading-relaxed">{review.text}</p>
      <div className="pt-2 border-t border-sand">
        <p className="font-sub text-base text-charcoal">{review.name}</p>
        <p className="font-body text-sm text-text-muted">{review.location}</p>
      </div>
    </motion.article>
  )
}

export default function Reviews() {
  const { t, i18n } = useTranslation()

  const lang = i18n.language.startsWith('fr') ? 'fr' : 'en'
  const sorted = [...STATIC_REVIEWS].sort((a, b) => {
    if (a.language === lang && b.language !== lang) return -1
    if (b.language === lang && a.language !== lang) return 1
    return 0
  })

  return (
    <section aria-label={t('reviews.ariaLabel')} className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <div className="max-w-content mx-auto">

        {/* Heading row */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
        >
          <div>
            <h2 className="font-display text-4xl text-charcoal mb-2">{t('reviews.sectionHeading')}</h2>
            <p className="font-body text-lg text-charcoal font-bold">{t('reviews.sectionSubhead')}</p>
          </div>
          {/* Rating aggregate */}
          <div
            role="img"
            aria-label={t('reviews.ratingAriaLabel')}
            className="shrink-0 sm:text-right"
          >
            <p aria-hidden="true" className="font-display text-3xl text-charcoal">{t('reviews.ratingHeading')}</p>
            <p aria-hidden="true" className="font-body text-sm text-sand-dark">{t('reviews.ratingStars')}</p>
            <p aria-hidden="true" className="font-body text-sm text-text-muted">{t('reviews.ratingBasis')}</p>
          </div>
        </motion.div>

        {/* Review cards — horizontal scroll on mobile, grid on md+ */}
        <motion.div
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4
                     md:grid md:grid-cols-2 md:overflow-visible md:pb-0
                     lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
        >
          {sorted.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </motion.div>

      </div>
    </section>
  )
}

```

---

## File: src/components/home/ServicesGrid.tsx

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils/utils'
import type { ServiceType } from '@/types'
import { fadeUp, stagger } from '@/lib/utils/animations'

interface ServiceCard {
  key: ServiceType
  labelKey: string
  descKey: string
  route: string
  inverted: boolean
}

const SERVICE_CARDS: ServiceCard[] = [
  { key: 'standard',         labelKey: 'services.standard.title',         descKey: 'services.standard.description',         route: '/services/standard-cleaning',  inverted: false },
  { key: 'deep',             labelKey: 'services.deep.title',             descKey: 'services.deep.description',             route: '/services/deep-cleaning',       inverted: true  },
  { key: 'moveout',          labelKey: 'services.moveout.title',          descKey: 'services.moveout.description',          route: '/services/move-out-cleaning',   inverted: false },
  { key: 'postconstruction', labelKey: 'services.postconstruction.title', descKey: 'services.postconstruction.description', route: '/services/post-construction',   inverted: true  },
  { key: 'airbnb',           labelKey: 'services.airbnb.title',           descKey: 'services.airbnb.description',           route: '/services/airbnb-turnover',     inverted: false },
  { key: 'commercial',       labelKey: 'services.commercial.title',       descKey: 'services.commercial.description',       route: '/services/commercial-cleaning', inverted: true  },
]

const ICON_PATHS: Record<ServiceType, React.ReactNode> = {
  standard: (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </>
  ),
  deep: (
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>
  ),
  moveout: (
    <>
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x={1} y={3} width={22} height={5} />
      <line x1={10} y1={12} x2={14} y2={12} />
    </>
  ),
  postconstruction: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  ),
  airbnb: (
    <>
      <rect x={3} y={4} width={18} height={18} rx={2} />
      <line x1={16} y1={2} x2={16} y2={6} />
      <line x1={8} y1={2} x2={8} y2={6} />
      <line x1={3} y1={10} x2={21} y2={10} />
      <polyline points="12 14 12 17 14 17" />
    </>
  ),
  commercial: (
    <>
      <rect x={3} y={3} width={7} height={7} />
      <rect x={14} y={3} width={7} height={7} />
      <rect x={14} y={14} width={7} height={7} />
      <rect x={3} y={14} width={7} height={7} />
    </>
  ),
}

function ServiceIcon({ serviceKey }: { serviceKey: ServiceType }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[serviceKey]}
    </svg>
  )
}

export default function ServicesGrid() {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('services.ariaLabel')}
      className="bg-cream py-12 px-4 md:py-20 md:px-6"
    >
      <div className="max-w-content mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mb-10"
        >
          <h2 className="font-display text-4xl text-charcoal mb-4">
            {t('services.sectionHeading')}
          </h2>
          <p className="font-body text-lg text-charcoal font-bold">
            {t('services.sectionSubhead')}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
        >
          {SERVICE_CARDS.map((card) => {
            const serviceTitle = t(card.labelKey)
            return (
              <motion.div key={card.key} variants={fadeUp} className="flex">
                <article
                  className={cn(
                    'relative overflow-hidden rounded border p-6 flex flex-col gap-4 w-full',
                    card.inverted
                      ? 'bg-slate-brand border-slate-brand'
                      : 'bg-white border-sand shadow-sm',
                  )}
                >
                  {/* Background Image decoration */}
                  <div className="absolute inset-0 pointer-events-none">
                    <img
                      src={`/images/${card.key}-hero.jpg`}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover"
                      style={{ opacity: 0.15 }}
                    />
                  </div>

                  <div className="relative z-10 flex flex-col gap-4 flex-1">
                    <h3
                      className={cn(
                        'font-sub text-2xl',
                        card.inverted ? 'text-white' : 'text-charcoal',
                      )}
                    >
                      <Link
                        to={card.route}
                        className={cn(
                          'group flex items-center gap-3 hover:underline rounded focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[48px]',
                          card.inverted ? 'focus:ring-white' : 'focus:ring-slate-brand',
                        )}
                      >
                        <span
                          className={cn(
                            'flex items-center justify-center transition-colors duration-200',
                            card.inverted
                              ? 'text-white group-hover:text-slate-pale'
                              : 'text-slate-brand group-hover:text-slate-dark',
                          )}
                        >
                          <ServiceIcon serviceKey={card.key} />
                        </span>
                        <span>{serviceTitle}</span>
                      </Link>
                    </h3>

                    <p
                      className={cn(
                        'font-body text-lg flex-1 font-bold',
                        card.inverted ? 'text-white' : 'text-charcoal',
                      )}
                    >
                      {t(card.descKey)}
                    </p>

                    <Link
                      to={`/booking?serviceType=${card.key}`}
                      aria-label={t('services.bookAriaLabel', { service: serviceTitle })}
                      className={cn(
                        'inline-flex items-center font-body font-medium text-base rounded',
                        'min-h-[48px] px-4 py-2 self-start transition-colors duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2',
                        card.inverted
                          ? 'bg-cream text-slate-brand hover:bg-warm-white hover:text-slate-dark focus:ring-white'
                          : 'bg-slate-brand text-white hover:bg-slate-dark focus:ring-slate-brand',
                      )}
                    >
                      {t('services.bookNow')} →
                    </Link>
                  </div>
                </article>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

```

---

## File: src/components/home/TrustBar.tsx

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { fadeUp, stagger } from '@/lib/utils/animations'

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="flex-shrink-0 text-slate-brand"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
      className="flex-shrink-0 text-slate-brand"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

interface TrustItem {
  key: string
  labelKey: string
  icon: 'check' | 'star'
  link?: string
}

export default function TrustBar() {
  const { t } = useTranslation()

  const items: TrustItem[] = [
    { key: 'insured',    labelKey: 'trustBar.insured',    icon: 'check' },
    { key: 'background', labelKey: 'trustBar.background', icon: 'check' },
    { key: 'eco',        labelKey: 'trustBar.eco',        icon: 'check', link: '/services' },
    { key: 'guarantee',  labelKey: 'trustBar.guarantee',  icon: 'check' },
    { key: 'rating',     labelKey: 'trustBar.rating',     icon: 'star'  },
    { key: 'bilingual',  labelKey: 'trustBar.bilingual',  icon: 'check' },
  ]

  return (
    <section aria-label={t('trustBar.ariaLabel')} className="bg-cream border-y border-sand">
      <div className="max-w-content mx-auto py-4 px-4 md:py-6 md:px-6">
        <motion.ul
          role="list"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:gap-x-8 list-none m-0 p-0"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {items.map((item) => {
            const Icon = item.icon === 'star' ? StarIcon : CheckIcon
            return (
              <motion.li key={item.key} variants={fadeUp}>
                {item.link ? (
                  <Link
                    to={item.link}
                    className="flex items-center gap-2 group min-h-[48px] md:min-h-0 focus:outline-none focus:ring-2 focus:ring-slate-brand rounded"
                  >
                    <Icon />
                    <span className="font-body text-base text-charcoal group-hover:underline decoration-slate-brand underline-offset-2">
                      {t(item.labelKey)}
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 min-h-[48px] md:min-h-0">
                    <Icon />
                    <span className="font-body text-base text-charcoal">
                      {t(item.labelKey)}
                    </span>
                  </div>
                )}
              </motion.li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}

```

---

## File: src/components/layout/CookieBanner.test.tsx

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CookieBanner from './CookieBanner'
import * as analytics from '@/lib/firebase/analytics'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/lib/firebase/analytics', () => ({
  initializeAnalytics: vi.fn(),
  revokeAnalytics: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
}))

describe('CookieBanner', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders correctly if no consent is set', () => {
    render(<CookieBanner />)
    expect(screen.getByText('cookieBanner.message')).toBeInTheDocument()
  })

  it('does not render if consent is already granted', () => {
    localStorage.setItem('freshnest_consent', 'granted')
    render(<CookieBanner />)
    expect(screen.queryByText('cookieBanner.message')).not.toBeInTheDocument()
    expect(analytics.initializeAnalytics).toHaveBeenCalled()
  })

  it('accepts cookies and initializes analytics', () => {
    render(<CookieBanner />)
    const acceptBtn = screen.getByText('cookieBanner.accept')
    fireEvent.click(acceptBtn)
    expect(localStorage.getItem('freshnest_consent')).toBe('granted')
    expect(analytics.initializeAnalytics).toHaveBeenCalled()
    expect(screen.queryByText('cookieBanner.message')).not.toBeInTheDocument()
  })

  it('declines cookies and revokes analytics', () => {
    render(<CookieBanner />)
    const declineBtn = screen.getByText('cookieBanner.decline')
    fireEvent.click(declineBtn)
    expect(localStorage.getItem('freshnest_consent')).toBe('denied')
    expect(analytics.revokeAnalytics).toHaveBeenCalled()
    expect(screen.queryByText('cookieBanner.message')).not.toBeInTheDocument()
  })
})

```

---

## File: src/components/layout/CookieBanner.tsx

```tsx
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { initializeAnalytics, revokeAnalytics } from '@/lib/firebase/analytics'
import { cn } from '@/lib/utils/utils'
import { AnimatePresence, motion } from 'framer-motion'

export default function CookieBanner() {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('freshnest_consent') === null
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('freshnest_consent') === 'granted') {
      initializeAnalytics()
    }

    const handleOpenBanner = () => setIsVisible(true)
    window.addEventListener('open-cookie-banner', handleOpenBanner)
    return () => window.removeEventListener('open-cookie-banner', handleOpenBanner)
  }, [])

  const handleAccept = () => {
    localStorage.setItem('freshnest_consent', 'granted')
    initializeAnalytics()
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('freshnest_consent', 'denied')
    revokeAnalytics()
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-sand shadow-lg"
        >
          <div className="max-w-content mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-body text-base text-charcoal text-center md:text-left flex-1">
              {t('cookieBanner.message')}
            </p>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleDecline}
                className={cn(
                  'flex-1 md:flex-none font-body text-base font-medium min-h-[48px] px-6 rounded border border-sand text-charcoal hover:bg-cream transition-colors focus:outline-none focus:ring-2 focus:ring-slate-pale'
                )}
              >
                {t('cookieBanner.decline')}
              </button>
              <button
                onClick={handleAccept}
                className={cn(
                  'flex-1 md:flex-none font-body text-base font-medium min-h-[48px] px-6 rounded bg-slate-brand text-white hover:bg-slate-dark transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2'
                )}
              >
                {t('cookieBanner.accept')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

```

---

## File: src/components/layout/Footer.tsx

```tsx
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'
import { logPhoneClicked } from '@/lib/firebase/analytics'
import logoFooter from '@/assets/logo-footer-dark-120px.png'

const PHONE_NUMBER = '(613) 935-3555'
const PHONE_HREF = 'tel:+16139353555'
const EMAIL = 'hello@freshnestco.ca'
const CURRENT_YEAR = new Date().getFullYear()

export default function Footer() {
  const { t } = useTranslation()

  const serviceLinks = [
    { to: '/services/standard-cleaning', label: t('footer.standardCleaning') },
    { to: '/services/deep-cleaning', label: t('footer.deepCleaning') },
    { to: '/services/move-out-cleaning', label: t('footer.moveOutCleaning') },
    { to: '/services/airbnb-turnover', label: t('footer.airbnbTurnover') },
    { to: '/services/post-construction', label: t('footer.postConstruction') },
    { to: '/services/commercial-cleaning', label: t('footer.commercialCleaning') },
  ]

  const locationLinks = [
    { to: '/locations/cornwall-on', label: t('footer.cornwallON') },
    { to: '/locations/akwesasne', label: t('footer.akwesasne') },
    { to: '/locations/snye-qc', label: t('footer.snyeQC') },
    { to: '/locations/long-sault', label: t('footer.longSault') },
    { to: '/locations/morrisburg', label: t('footer.morrisburg') },
  ]

  const companyLinks = [
    { to: '/about', label: t('footer.aboutUs') },
    { to: '/gallery', label: t('footer.gallery') },
    { to: '/reviews', label: t('footer.reviews') },
    { to: '/blog', label: t('nav.blog') },
    { to: '/careers', label: t('footer.careers') },
    { to: '/privacy', label: t('footer.privacy') },
  ]

  return (
    <footer
      role="contentinfo"
      className="bg-charcoal text-warm-white"
    >
      {/* ── Main grid ── */}
      <div className="max-w-content mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">

          {/* ── Col 1: Brand ── */}
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              aria-label={t('a11y.homeLink')}
              className="inline-block mb-4 focus:outline-none focus:ring-2 focus:ring-slate-pale rounded"
            >
              <img
                src={logoFooter}
                alt="Fresh Nest Co."
                width={120}
                height={60}
                className="h-12 w-auto"
              />
            </Link>
            <p className="font-body text-base text-text-muted leading-relaxed mb-4 max-w-xs">
              {t('footer.tagline')}
            </p>
            {/* Trust badges */}
            <p className="font-body text-base text-text-muted">{t('footer.insured')}</p>
            <p className="font-body text-base text-text-muted">{t('footer.bilingual')}</p>
          </div>

          {/* ── Col 2: Services ── */}
          <nav aria-label={t('a11y.footerServices')}>
            <h3 className="font-sub text-base font-medium text-warm-white mb-4 uppercase tracking-wide">
              {t('footer.services')}
            </h3>
            <ul className="list-none m-0 p-0 space-y-2" role="list">
              {serviceLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className={cn(
                      'font-body text-base text-text-muted',
                      'hover:text-slate-pale transition-colors duration-200',
                      'min-h-[48px]  flex md:inline-flex items-center',
                      'focus:outline-none focus:ring-2 focus:ring-slate-pale rounded',
                    )}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Col 3: Locations ── */}
          <nav aria-label={t('a11y.footerLocations')}>
            <h3 className="font-sub text-base font-medium text-warm-white mb-4 uppercase tracking-wide">
              {t('footer.locations')}
            </h3>
            <ul className="list-none m-0 p-0 space-y-2" role="list">
              {locationLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className={cn(
                      'font-body text-base text-text-muted',
                      'hover:text-slate-pale transition-colors duration-200',
                      'min-h-[48px]  flex md:inline-flex items-center',
                      'focus:outline-none focus:ring-2 focus:ring-slate-pale rounded',
                    )}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Col 4: Company + Contact ── */}
          <div>
            <nav aria-label={t('a11y.footerCompany')}>
              <h3 className="font-sub text-base font-medium text-warm-white mb-4 uppercase tracking-wide">
                {t('footer.company')}
              </h3>
              <ul className="list-none m-0 p-0 space-y-2 mb-6" role="list">
                {companyLinks.map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className={cn(
                        'font-body text-base text-text-muted',
                        'hover:text-slate-pale transition-colors duration-200',
                        'min-h-[48px]  flex md:inline-flex items-center',
                        'focus:outline-none focus:ring-2 focus:ring-slate-pale rounded',
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h3 className="font-sub text-base font-medium text-warm-white mb-4 uppercase tracking-wide">
                {t('footer.contact')}
              </h3>
              <ul className="list-none m-0 p-0 space-y-2" role="list">
                {/* Phone — Margaret P3 requirement: tappable tel: link in footer */}
                <li>
                  <a
                    href={PHONE_HREF}
                    onClick={() => logPhoneClicked('footer')}
                    aria-label={t('a11y.callUs', { phone: PHONE_NUMBER })}
                    className={cn(
                      'font-body text-base text-text-muted',
                      'hover:text-slate-pale transition-colors duration-200',
                      'min-h-[48px]  flex md:inline-flex items-center gap-2',
                      'focus:outline-none focus:ring-2 focus:ring-slate-pale rounded',
                    )}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {PHONE_NUMBER}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${EMAIL}`}
                    className={cn(
                      'font-body text-base text-text-muted',
                      'hover:text-slate-pale transition-colors duration-200',
                      'min-h-[48px]  flex md:inline-flex items-center',
                      'focus:outline-none focus:ring-2 focus:ring-slate-pale rounded',
                    )}
                  >
                    {EMAIL}
                  </a>
                </li>
                <li>
                  <p className="font-body text-base text-text-muted">
                    <span className="font-medium text-warm-white">{t('footer.hours')}</span>
                    <br />
                    {t('footer.hoursValue')}
                  </p>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-charcoal/50 bg-charcoal/80">
        <div className="max-w-content mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="font-body text-base text-text-muted text-center md:text-left">
            {t('footer.copyright', { year: CURRENT_YEAR })}
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-banner'))}
              className={cn(
                'font-body text-base text-text-muted hover:text-slate-pale',
                'transition-colors duration-200 min-h-[48px] inline-flex items-center',
                'focus:outline-none focus:ring-2 focus:ring-slate-pale rounded',
              )}
            >
              {t('cookieBanner.preferences')}
            </button>
            <span className="text-text-muted/30" aria-hidden="true">|</span>
            <Link
              to="/privacy"
              className={cn(
                'font-body text-base text-text-muted hover:text-slate-pale',
                'transition-colors duration-200 min-h-[48px] inline-flex items-center',
                'focus:outline-none focus:ring-2 focus:ring-slate-pale rounded',
              )}
            >
              {t('footer.privacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

```

---

## File: src/components/layout/Layout.tsx

```tsx
import { Outlet, ScrollRestoration } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import JsonLd from '@/components/seo/JsonLd'
import { getLocalBusinessSchema } from '@/lib/utils/seo'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { logCustomEvent } from '@/lib/firebase/analytics'
import CookieBanner from './CookieBanner'
/**
 * Root layout wrapper.
 * All routes render their content via <Outlet /> between Navbar and Footer.
 * ScrollRestoration ensures the page scrolls to the top on route transitions.
 */
export default function Layout() {
  const { t } = useTranslation()
  const businessSchema = getLocalBusinessSchema(t)
  const location = useLocation()

  useEffect(() => {
    // Only logs if consent is granted and analytics is initialized
    logCustomEvent('page_view', { page_path: location.pathname })
  }, [location.pathname])

  return (
    <div className="flex flex-col min-h-screen bg-warm-white">
      <JsonLd schema={businessSchema} />
      <Navbar />
      <main
        id="main-content"
        role="main"
        className="flex-1"
        tabIndex={-1}
      >
        <Outlet />
      </main>
      <Footer />
      <CookieBanner />
      <ScrollRestoration />
    </div>
  )
}


```

---

## File: src/components/layout/Navbar.tsx

```tsx
import { useState, useCallback } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils/utils'
import { logLanguageToggled, logPhoneClicked } from '@/lib/firebase/analytics'
import { useScrolled } from '@/hooks/useScrolled'
import logoNavbar from '@/assets/logo-navbar-80px.png'
import logoNavbar2x from '@/assets/logo-navbar-160px@2x.png'

const PHONE_NUMBER = '(613) 935-3555'
const PHONE_HREF = 'tel:+16139353555'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const scrolled = useScrolled(20)
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleLanguage = useCallback(() => {
    const next = i18n.language.startsWith('fr') ? 'en' : 'fr'
    void i18n.changeLanguage(next)
    logLanguageToggled(next)
    // Persist in localStorage — i18next LanguageDetector picks this up on reload
    localStorage.setItem('i18nextLng', next)
  }, [i18n])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const navLinks = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/services', label: t('nav.services'), end: false },
    { to: '/locations', label: t('nav.locations'), end: false },
    { to: '/pricing', label: t('nav.pricing'), end: true },
    { to: '/faq', label: t('nav.faq'), end: true },
    { to: '/blog', label: t('nav.blog'), end: false },
  ]

  return (
    <>
      {/* Skip-to-content link for keyboard / screen-reader users (WCAG 2.1 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-slate-brand focus:text-white focus:px-4 focus:py-2 focus:rounded font-body text-base"
      >
        {t('nav.skipToContent')}
      </a>

      <header
        role="banner"
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-shadow duration-300',
          'bg-white/95 backdrop-blur-sm',
          scrolled ? 'shadow-md' : 'shadow-none',
        )}
      >
        <nav
          aria-label={t('a11y.navMain')}
          className="max-w-content mx-auto flex items-center justify-between px-4 md:px-6 h-16 md:h-20"
        >
          {/* ── Logo ── */}
          <Link
            to="/"
            aria-label={t('a11y.homeLink')}
            className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-brand rounded"
          >
            <img
              src={logoNavbar}
              srcSet={`${logoNavbar} 1x, ${logoNavbar2x} 2x`}
              alt="Fresh Nest Co."
              width={80}
              height={40}
              className="h-10 w-auto"
            />
          </Link>

          {/* ── Desktop nav links ── */}
          <ul
            className="hidden md:flex items-center gap-1 list-none m-0 p-0"
            role="list"
          >
            {navLinks.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'font-body text-base px-3 py-2 rounded transition-colors duration-200',
                      'min-h-[48px] inline-flex items-center',
                      'focus:outline-none focus:ring-2 focus:ring-slate-brand',
                      isActive
                        ? 'text-slate-dark font-medium border-b-2 border-slate-brand'
                        : 'text-charcoal hover:text-slate-brand',
                    )
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* ── Desktop right side: phone + lang toggle + CTA ── */}
          <div className="hidden md:flex items-center gap-3">
            {/* Phone — Margaret P3 requirement: always visible, always a tel: link */}
            <a
              href={PHONE_HREF}
              onClick={() => logPhoneClicked('navbar')}
              aria-label={t('a11y.callUs', { phone: PHONE_NUMBER })}
              className={cn(
                'font-body text-base text-slate-brand hover:text-slate-dark',
                'transition-colors duration-200 min-h-[48px] inline-flex items-center',
                'focus:outline-none focus:ring-2 focus:ring-slate-brand rounded',
              )}
            >
              {PHONE_NUMBER}
            </a>

            {/* Language toggle — Diane P1 requirement */}
            <button
              id="lang-toggle-desktop"
              type="button"
              onClick={toggleLanguage}
              aria-label={t('lang.switchTo')}
              className={cn(
                'font-body text-base font-medium text-charcoal',
                'border border-sand rounded px-3 min-h-[48px] inline-flex items-center',
                'hover:border-slate-brand hover:text-slate-brand transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-slate-brand',
              )}
            >
              {t('lang.toggle')}
            </button>

            {/* Book Now CTA — Travis P2 requirement: always visible */}
            <Link
              to="/booking"
              id="cta-book-now-nav"
              className={cn(
                'bg-slate-brand text-white font-body font-medium text-base rounded',
                'px-5 min-h-[48px] inline-flex items-center',
                'hover:bg-slate-dark transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
              )}
            >
              {t('nav.booking')}
            </Link>
          </div>

          {/* ── Mobile right: lang toggle + hamburger ── */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="lang-toggle-mobile"
              type="button"
              onClick={toggleLanguage}
              aria-label={t('lang.switchTo')}
              className={cn(
                'font-body text-base font-medium text-charcoal',
                'border border-sand rounded px-2.5 min-h-[48px] inline-flex items-center',
                'hover:border-slate-brand hover:text-slate-brand transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-slate-brand',
              )}
            >
              {t('lang.toggle')}
            </button>

            <button
              id="hamburger-btn"
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              className={cn(
                'p-2 min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded',
                'text-charcoal hover:text-slate-brand transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-slate-brand',
              )}
            >
              {/* Animated hamburger → X icon */}
              <span className="sr-only">
                {menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {menuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* ── Mobile menu (Framer Motion slide-down) ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label={t('a11y.navMobile')}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden bg-white border-t border-sand"
            >
              <ul className="flex flex-col list-none m-0 p-0 px-4 py-4 gap-1" role="list">
                {navLinks.map(({ to, label, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        cn(
                          'font-body text-base w-full px-3 min-h-[48px] flex items-center rounded',
                          'transition-colors duration-200',
                          'focus:outline-none focus:ring-2 focus:ring-slate-brand',
                          isActive
                            ? 'bg-slate-pale text-slate-dark font-medium'
                            : 'text-charcoal hover:bg-cream hover:text-slate-brand',
                        )
                      }
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}

                {/* Phone in mobile menu — Margaret P3 requirement */}
                <li className="border-t border-sand pt-3 mt-2">
                  <a
                    href={PHONE_HREF}
                    aria-label={t('a11y.callUs', { phone: PHONE_NUMBER })}
                    onClick={() => {
                      logPhoneClicked('navbar')
                      closeMenu()
                    }}
                    className={cn(
                      'font-body text-base text-slate-brand hover:text-slate-dark',
                      'w-full px-3 min-h-[48px] flex items-center gap-2 rounded',
                      'transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-slate-brand',
                    )}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {PHONE_NUMBER}
                  </a>
                </li>

                {/* Book Now CTA in mobile menu */}
                <li className="pt-2">
                  <Link
                    to="/booking"
                    id="cta-book-now-mobile"
                    onClick={closeMenu}
                    className={cn(
                      'bg-slate-brand text-white font-body font-medium text-base rounded',
                      'w-full min-h-[48px] flex items-center justify-center',
                      'hover:bg-slate-dark transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                    )}
                  >
                    {t('nav.booking')}
                  </Link>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer so page content starts below the fixed nav */}
      <div className="h-16 md:h-20" aria-hidden="true" />
    </>
  )
}

```

---

## File: src/components/seo/JsonLd.tsx

```tsx
import type { SchemaOrgObject } from '@/lib/utils/seo'

interface Props {
  schema: SchemaOrgObject
}

/**
 * Reusable component to safely render JSON-LD schema markup
 * into the DOM for search engine crawlers.
 */
export default function JsonLd({ schema }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

```

---

## File: src/components/seo/SEO.tsx

```tsx
import { useLocation } from 'react-router-dom'

interface SEOProps {
  title: string
  description: string
  image?: string
  type?: 'website' | 'article'
}

/**
 * Reusable SEO component utilizing React 19 native metadata hoisting.
 * Renders title, meta description, Open Graph, and bilingual hreflang links.
 */
export default function SEO({ title, description, image, type = 'website' }: SEOProps) {
  const location = useLocation()
  const baseUrl = 'https://lilypad-freshnest.web.app'
  const canonicalUrl = `${baseUrl}${location.pathname}`

  // Default fallback OG image
  const ogImage = image || `${baseUrl}/images/og-image-1200x630.jpg`

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Canonical link */}
      <link rel="canonical" href={canonicalUrl} />

      {/* hreflang alternate links with query param */}
      <link rel="alternate" hrefLang="en" href={`${canonicalUrl}?lang=en`} />
      <link rel="alternate" hrefLang="fr" href={`${canonicalUrl}?lang=fr`} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </>
  )
}

```

---

## File: src/components/ui/GalleryImage.tsx

```tsx
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'

interface GalleryImageProps {
  src: string | null
  alt: string
  className?: string
}

export default function GalleryImage({ src, alt, className }: GalleryImageProps) {
  const { t } = useTranslation()

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn('w-full h-full object-cover', className)}
        width={400}
        height={300}
        loading="lazy"
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'w-full h-full flex items-center justify-center bg-slate-pale',
        className,
      )}
    >
      <span className="font-body text-sm text-charcoal">
        {t('gallery.photoComingSoon')}
      </span>
    </div>
  )
}

```

---

## File: src/components/ui/Lightbox.tsx

```tsx
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/utils'
import type { GalleryPair } from '@/lib/data/galleryData'
import GalleryImage from '@/components/ui/GalleryImage'

interface LightboxProps {
  pairs: GalleryPair[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export default function Lightbox({ pairs, index, onClose, onPrev, onNext }: LightboxProps) {
  const { t } = useTranslation()
  const pair = pairs[index]
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext])

  const serviceTitle = t(`services.${pair.serviceKey}.title`)
  const beforeAlt = t('gallery.beforeAlt', { service: serviceTitle })
  const afterAlt = t('gallery.afterAlt', { service: serviceTitle })

  return createPortal(
    <motion.div
      key="lightbox-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        role="dialog"
        aria-modal="true"
        aria-label={t(pair.captionKey)}
        className="relative w-full max-w-4xl bg-white rounded overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label={t('gallery.closeLabel')}
          className={cn(
            'absolute top-3 right-3 z-10',
            'min-h-[48px] min-w-[48px] flex items-center justify-center',
            'bg-charcoal/60 text-white rounded hover:bg-charcoal transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1',
          )}
        >
          ✕
        </button>

        {/* Before / After */}
        <div className="grid grid-cols-2 aspect-video">
          <div className="relative">
            <span className="absolute top-2 left-2 z-10 bg-charcoal/70 text-white font-body text-xs px-2 py-1 rounded">
              {t('gallery.beforeLabel')}
            </span>
            <GalleryImage
              src={pair.beforeSrc}
              alt={beforeAlt}
              className="absolute inset-0"
            />
          </div>
          <div className="relative border-l border-white/20">
            <span className="absolute top-2 left-2 z-10 bg-charcoal/70 text-white font-body text-xs px-2 py-1 rounded">
              {t('gallery.afterLabel')}
            </span>
            <GalleryImage
              src={pair.afterSrc}
              alt={afterAlt}
              className="absolute inset-0"
            />
          </div>
        </div>

        {/* Caption + navigation */}
        <div className="flex items-center justify-between px-4 py-3 bg-warm-white border-t border-sand">
          <button
            onClick={onPrev}
            disabled={index === 0}
            aria-label={t('gallery.prevLabel')}
            className={cn(
              'min-h-[48px] min-w-[48px] flex items-center justify-center rounded',
              'font-body text-base text-charcoal hover:bg-sand transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-slate-brand',
              'disabled:opacity-30 disabled:cursor-not-allowed',
            )}
          >
            ←
          </button>

          <p className="font-body text-sm text-text-muted text-center px-4">
            {t(pair.captionKey)}
          </p>

          <button
            onClick={onNext}
            disabled={index === pairs.length - 1}
            aria-label={t('gallery.nextLabel')}
            className={cn(
              'min-h-[48px] min-w-[48px] flex items-center justify-center rounded',
              'font-body text-base text-charcoal hover:bg-sand transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-slate-brand',
              'disabled:opacity-30 disabled:cursor-not-allowed',
            )}
          >
            →
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}

```

---

## File: src/components/ui/TeamAvatar.tsx

```tsx
interface TeamAvatarProps {
  src: string | null
  alt: string
  initials: string
}

export default function TeamAvatar({ src, alt, initials }: TeamAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-top"
        width={300}
        height={300}
        loading="lazy"
      />
    )
  }
  return (
    <div aria-hidden="true" className="w-full h-full flex items-center justify-center bg-slate-pale">
      {initials ? (
        <span className="font-body font-medium text-4xl text-charcoal select-none">{initials}</span>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-12 h-12 text-charcoal"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )}
    </div>
  )
}

```

---

## File: src/hooks/useScrolled.ts

```typescript
import { useEffect, useState } from 'react'

/**
 * Returns true once the page has scrolled past `threshold` pixels.
 * Used to add a shadow to the Navbar after the user scrolls down.
 */
export function useScrolled(threshold = 20): boolean {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > threshold)

    // Run once on mount to catch pre-scrolled state (e.g. browser back button)
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return scrolled
}

```

---

## File: src/i18n/index.ts

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import fr from './locales/fr.json'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, fr: { translation: fr } },
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr'],
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })

export default i18n

```

---

## File: src/i18n/locales/en.json

```json
{
  "home": {
    "title": "Fresh Nest Co. — Cleaning & Organizing Services | Cornwall, ON",
    "description": "Professional cleaning and organizing for homes and businesses in Cornwall, Akwesasne, and Snye QC."
  },
  "placeholder": {
    "metaDesc": "Information about {{page}} at Fresh Nest Co. serving Cornwall and surrounding areas."
  },
  "hero": {
    "headline": "Professional <br /> <highlight>Cleaning</highlight> <br /> & Organizing",
    "subhead": "Serving Cornwall, Akwesasne, Snye & surrounding communities."
  },
  "trustBar": {
    "ariaLabel": "Trust and quality indicators",
    "insured": "Insured & Bonded",
    "background": "Background-Checked Staff",
    "eco": "Eco-Friendly Products",
    "guarantee": "Satisfaction Guarantee",
    "rating": "4.9 / 5 Google Rating",
    "bilingual": "Bilingual Service"
  },
  "quote": {
    "ariaLabel": "Instant quote calculator",
    "sectionHeading": "Get an Instant Quote",
    "sectionSubhead": "Transparent pricing for Cornwall and surrounding communities. No commitment required.",
    "sizeLabel": "Property Size",
    "serviceLabel": "Service Type",
    "frequencyLabel": "How Often?",
    "size": {
      "apartment": "Apartment",
      "1-2bed": "1–2 Bed",
      "3-4bed": "3–4 Bed",
      "5plus": "5+ Bed",
      "commercial": "Commercial"
    },
    "service": {
      "standard": "Standard",
      "deep": "Deep",
      "moveout": "Move-Out",
      "postconstruction": "Post-Construction",
      "airbnb": "Airbnb"
    },
    "frequency": {
      "one-time": "One-Time",
      "weekly": "Weekly",
      "biweekly": "Biweekly",
      "monthly": "Monthly"
    },
    "discountBadge": "{{pct}}% off",
    "startingAt": "Starting at ${{price}}",
    "typicallyRange": "Typically ${{min}}–${{max}}",
    "bookNowCta": "Book Now",
    "commercialTitle": "Custom Quote for Your Business",
    "commercialBody": "Commercial cleaning rates are tailored to your space and schedule. Contact us for a free assessment.",
    "commercialCta": "Contact Us for a Quote"
  },
  "services": {
    "ariaLabel": "Our cleaning services",
    "sectionHeading": "Our Services",
    "sectionSubhead": "Professional cleaning for every need — residential, rental, and commercial. Proudly serving Cornwall and surrounding communities.",
    "bookNow": "Book Now",
    "bookAriaLabel": "Book {{service}}",
    "viewDetailsAriaLabel": "Learn more about {{service}}",
    "standard": {
      "title": "Standard Cleaning",
      "description": "Regular maintenance cleaning to keep your home fresh. Ideal for weekly or biweekly visits — counters, floors, bathrooms, and living areas."
    },
    "deep": {
      "title": "Deep Clean",
      "description": "A thorough top-to-bottom clean including baseboards, inside appliances, and hard-to-reach areas. Perfect for a seasonal reset or first-time clean."
    },
    "moveout": {
      "title": "Move-Out Cleaning",
      "description": "Leave your old home spotless for the next owners or your landlord's inspection. We handle every surface so you get your deposit back."
    },
    "postconstruction": {
      "title": "Post-Construction",
      "description": "Construction dust and debris require specialist attention. We safely remove fine particles, adhesive residue, and packaging from every surface."
    },
    "airbnb": {
      "title": "Airbnb Turnover",
      "description": "Fast, reliable turnovers between guest stays — typically completed in the 11am–3pm window. Linen change, sanitize, and guest-ready staging included."
    },
    "commercial": {
      "title": "Commercial Cleaning",
      "description": "Tailored cleaning programs for offices, retail, and business facilities. Flexible scheduling, volume pricing, and dedicated account management."
    }
  },
  "gallery": {
    "meta": {
      "title": "Before & After Photo Gallery — Fresh Nest Co.",
      "description": "Browse our before and after cleaning photo gallery. See the results of our professional residential, deep, and Airbnb turnover cleaning."
    },
    "ariaLabel": "Before and after cleaning photos",
    "pageHeading": "Our Work",
    "pageSubhead": "Real results from our team — before and after every clean.",
    "previewHeading": "Before & After",
    "previewSubhead": "See the Fresh Nest difference.",
    "viewAll": "View Full Gallery",
    "beforeLabel": "Before",
    "afterLabel": "After",
    "beforeAlt": "Before: {{service}}",
    "afterAlt": "After: {{service}}",
    "closeLabel": "Close photo",
    "prevLabel": "Previous photo",
    "nextLabel": "Next photo",
    "photoComingSoon": "Photo coming soon",
    "ctaHeading": "Ready to see these results in your home?",
    "pairs": {
      "kitchenDeep": {
        "caption": "Kitchen deep clean — Cornwall, ON"
      },
      "airbnbTurnover": {
        "caption": "Airbnb turnover — St. Lawrence waterfront"
      },
      "bathroomDeep": {
        "caption": "Bathroom deep clean — Cornwall, ON"
      },
      "moveoutFull": {
        "caption": "Full move-out clean — Long Sault, ON"
      },
      "postconstruction": {
        "caption": "Post-construction clean — Cornwall, ON"
      }
    }
  },
  "howItWorks": {
    "ariaLabel": "How the booking process works",
    "sectionHeading": "How It Works",
    "sectionSubhead": "From booking to a beautifully clean home — four simple steps.",
    "step1Title": "Book Online",
    "step1Desc": "Choose your service, property size, and preferred date. No account required — takes under 3 minutes.",
    "step2Title": "We Confirm",
    "step2Desc": "You'll hear from us within 24 hours with your assigned cleaner's name and your arrival window.",
    "step3Title": "We Clean",
    "step3Desc": "Your dedicated cleaner arrives on time and follows a detailed checklist tailored to your home.",
    "step4Title": "You Relax",
    "step4Desc": "We send a completion notice when finished. Satisfaction guaranteed — we make it right if anything's missed.",
    "faqLink": "Have questions? See our FAQ"
  },
  "recurring": {
    "ariaLabel": "Recurring cleaning plans and pricing",
    "sectionHeading": "Save on Every Clean",
    "sectionSubhead": "Book a recurring schedule and save up to 20% — no contracts, cancel anytime.",
    "mostPopular": "Most Popular",
    "discountBadge": "{{pct}}% off",
    "bookCta": "Book {{freq}}",
    "bookAriaLabel": "Book {{freq}} cleaning",
    "tagline": {
      "weekly": "Perfect for busy households. Your home, consistently fresh, every week.",
      "biweekly": "Set it and forget it. The most popular option — fresh every two weeks.",
      "monthly": "Flexible recurring clean. Great for lower-traffic homes or seasonal top-ups."
    }
  },
  "team": {
    "ariaLabel": "Meet the Fresh Nest Co. cleaning team",
    "sectionHeading": "Meet Your Team",
    "sectionSubhead": "Real people who care about your home.",
    "assignmentNote": "We assign the same dedicated cleaner to your home — every visit, every time. Request your preferred cleaner when booking.",
    "photoAlt": "Photo of {{name}}",
    "members": {
      "lauren": {
        "role": "Owner & Founder",
        "bio": "Lauren founded Fresh Nest Co. to bring professional, reliable, and personalized cleaning to Cornwall and surrounding communities. Bubbly and meticulous, she ensures your home is cared for with a warm, bohemian touch."
      },
      "sarah": {
        "role": "Lead Professional Cleaner",
        "bio": "Sarah has over 5 years of residential cleaning experience and loves making spaces feel peaceful and organized. She is our primary cleaner for deep cleaning and recurring clients."
      }
    }
  },
  "reviews": {
    "ariaLabel": "Customer reviews",
    "sectionHeading": "What Our Clients Say",
    "sectionSubhead": "Real reviews from real clients across Cornwall and surrounding communities.",
    "ratingHeading": "5.0",
    "ratingStars": "★★★★★",
    "ratingBasis": "Based on 80+ reviews",
    "ratingAriaLabel": "Rated 5.0 out of 5 — based on 80 or more reviews",
    "starAriaLabel": "{{rating}} out of {{max}} stars"
  },
  "locations": {
    "ariaLabel": "Service areas",
    "servicesHeading": "Services Available Here",
    "mapLabel": "Map of {{location}}",
    "bookCta": "Book a Cleaning in {{location}}",
    "bookAriaLabel": "Book a cleaning in {{location}}",
    "overview": {
      "pageTitle": "Service Areas | Fresh Nest Co.",
      "metaDesc": "Fresh Nest Co. serves Cornwall ON, Akwesasne, Snye QC, Long Sault, and Morrisburg. Professional bilingual cleaning services.",
      "heading": "Our Service Areas",
      "subhead": "We proudly serve Cornwall and surrounding communities — including Akwesasne, Snye QC, Long Sault, and Morrisburg.",
      "viewLocation": "View details →"
    },
    "cornwallOn": {
      "pageTitle": "Professional Cleaning in Cornwall, ON | Fresh Nest Co.",
      "metaDesc": "Fresh Nest Co. offers bilingual professional cleaning in Cornwall, ON — standard, deep, move-out, post-construction, Airbnb turnover, and commercial.",
      "heading": "Cleaning Services in Cornwall, ON",
      "subhead": "Cornwall's trusted bilingual cleaning team — residential, commercial, and Airbnb.",
      "description": "Fresh Nest Co. is based in Cornwall and serves the full city including the east and west ends, the waterfront, and surrounding residential neighbourhoods. We offer standard, deep, move-out, post-construction, Airbnb turnover, and commercial cleaning — all in English and French."
    },
    "akwesasne": {
      "pageTitle": "Professional Cleaning in Akwesasne | Fresh Nest Co.",
      "metaDesc": "Fresh Nest Co. serves Akwesasne including Cornwall Island. We cross the Seaway International Bridge — standard, deep, and move-out cleaning available.",
      "heading": "Cleaning Services in Akwesasne",
      "subhead": "We serve the full Akwesasne community — including Cornwall Island.",
      "description": "We cross the Seaway International Bridge to serve Cornwall Island and the broader Akwesasne community. Standard, deep clean, move-out, and post-construction cleans available. Please include your island address and any access instructions in your booking notes.",
      "islandNote": "We serve Cornwall Island — we cross the bridge. Please include your island address and any access instructions in your booking notes."
    },
    "snyeQc": {
      "pageTitle": "Professional Cleaning in Snye, QC | Fresh Nest Co.",
      "metaDesc": "Fresh Nest Co. serves Snye, Quebec — on the Quebec side of Akwesasne. Bilingual, eco-friendly cleaning. Standard, deep, and move-out.",
      "heading": "Cleaning Services in Snye, QC",
      "subhead": "We serve the Quebec side of Akwesasne, including Snye.",
      "description": "Fresh Nest Co. travels across the provincial border to serve clients in Snye and the Quebec side of Akwesasne. We use eco-friendly, baby-safe products on all cleans. Standard, deep clean, and move-out cleaning available. Fully bilingual service — book in French or English.",
      "borderNote": "We serve Akwesasne, Quebec side (Snye) — we cross the provincial border. Eco-friendly, baby-safe products used on every clean."
    },
    "longSault": {
      "pageTitle": "Professional Cleaning in Long Sault, ON | Fresh Nest Co.",
      "metaDesc": "Fresh Nest Co. serves Long Sault and South Stormont, ON. Professional residential and Airbnb turnover cleaning.",
      "heading": "Cleaning Services in Long Sault",
      "subhead": "Serving Long Sault and South Stormont — including waterfront Airbnb properties.",
      "description": "Long Sault and South Stormont residents count on Fresh Nest Co. for reliable residential cleaning. We also serve waterfront Airbnb and cottage properties in the area. Standard, deep clean, move-out, and Airbnb turnover cleaning available."
    },
    "morrisburg": {
      "pageTitle": "Professional Cleaning in Morrisburg, ON | Fresh Nest Co.",
      "metaDesc": "Fresh Nest Co. serves Morrisburg and South Dundas, ON. Professional residential cleaning — standard, deep, and move-out.",
      "heading": "Cleaning Services in Morrisburg",
      "subhead": "Serving Morrisburg and South Dundas County.",
      "description": "Morrisburg and the surrounding South Dundas area are within our regular service zone. Standard, deep clean, and move-out cleaning available. Contact us to confirm scheduling for your specific address."
    }
  },
  "booking": {
    "pageTitle": "Book a Cleaning | Fresh Nest Co.",
    "metaDesc": "Book professional cleaning services online. Fast, bilingual booking for Cornwall, Akwesasne, Snye QC, Long Sault, and Morrisburg.",
    "heading": "Book a Cleaning",
    "subhead": "Four quick steps — takes about 3 minutes on your phone.",
    "progress": "Step {{current}} of {{total}}",
    "next": "Next",
    "back": "Back",
    "submit": "Confirm Booking",
    "submitting": "Submitting…",
    "step1Title": "What type of cleaning?",
    "step2Title": "When would you like us?",
    "step3Title": "Your contact details",
    "step4Title": "Review your booking",
    "airbnbNote": "Airbnb turnovers include linen change, toiletry restocking, and damage photos. Typically completed in the 11am–3pm window.",
    "fields": {
      "serviceType": {
        "label": "Service type"
      },
      "propertyType": {
        "label": "Property size",
        "options": {
          "apartment": "Apartment / Condo",
          "1-2bed": "1–2 Bedroom Home",
          "3-4bed": "3–4 Bedroom Home",
          "5+bed": "5+ Bedroom Home",
          "commercial": "Commercial Property"
        }
      },
      "bedrooms": {
        "label": "Bedrooms",
        "decrease": "Decrease bedrooms",
        "increase": "Increase bedrooms"
      },
      "bathrooms": {
        "label": "Bathrooms",
        "decrease": "Decrease bathrooms",
        "increase": "Increase bathrooms"
      },
      "pets": {
        "label": "We have pets at home",
        "hint": "We use pet-safe, eco-friendly products as standard."
      },
      "frequency": {
        "label": "Cleaning frequency",
        "options": {
          "one-time": "One-time",
          "weekly": "Weekly",
          "biweekly": "Every two weeks",
          "monthly": "Monthly"
        },
        "discounts": {
          "weekly": "Save 20%",
          "biweekly": "Save 15%",
          "monthly": "Save 10%"
        }
      },
      "preferredDate": {
        "label": "Preferred date",
        "hint": "We'll confirm availability within 24 hours."
      },
      "squareFootage": {
        "label": "Square footage",
        "optional": "(optional)",
        "placeholder": "e.g. 1400"
      },
      "addOns": {
        "label": "Add-ons (optional)",
        "options": {
          "oven": "Inside oven",
          "fridge": "Inside fridge",
          "windows": "Interior windows",
          "laundry": "Laundry (wash + fold)",
          "petHair": "Pet hair treatment",
          "basement": "Basement"
        }
      },
      "firstName": {
        "label": "First name",
        "placeholder": "First name"
      },
      "lastName": {
        "label": "Last name",
        "placeholder": "Last name"
      },
      "email": {
        "label": "Email address",
        "placeholder": "you@example.com"
      },
      "phone": {
        "label": "Phone number",
        "placeholder": "(613) 000-0000"
      },
      "address": {
        "label": "Service address",
        "placeholder": "123 Main St, Cornwall ON",
        "hint": "Include island address or bridge crossing notes if applicable."
      },
      "preferredCleaner": {
        "label": "Preferred cleaner (optional)",
        "placeholder": "e.g. Lauren S. — leave blank to be assigned"
      },
      "notes": {
        "label": "Special instructions (optional)",
        "placeholder": "Island address / bridge crossing info, gate code, allergies, areas of focus…"
      },
      "marketingConsent": {
        "label": "I agree to receive promotional emails from Fresh Nest Co. I can unsubscribe at any time."
      }
    },
    "errors": {
      "required": "This field is required.",
      "email": "Please enter a valid email address.",
      "phone": "Please enter a valid phone number (minimum 10 digits).",
      "minLength": "This field is too short.",
      "date": "Please select a date.",
      "submit": "Something went wrong saving your booking. Please try again or call us:"
    },
    "review": {
      "heading": "Review your booking",
      "service": "Service",
      "property": "Property",
      "schedule": "Schedule",
      "contact": "Contact",
      "addOns": "Add-ons",
      "notes": "Notes",
      "edit": "Edit"
    },
    "status": {
      "pending": "Pending Confirmation",
      "confirmed": "Confirmed Schedule",
      "completed": "Completed",
      "cancelled": "Cancelled"
    }
  },
  "faq": {
    "pageTitle": "FAQ | Fresh Nest Co.",
    "metaDesc": "Frequently asked questions about Fresh Nest Co. cleaning services in Cornwall, Akwesasne, Snye QC, Long Sault, and Morrisburg.",
    "heading": "Frequently Asked Questions",
    "subhead": "Quick answers about booking, services, and what to expect.",
    "ctaHeading": "Still have questions?",
    "ctaSubhead": "We're happy to help — call us or book online.",
    "item1": {
      "q": "Do I need to be home during the clean?",
      "a": "No, you don't need to be home. Many of our clients provide a key or entry code. We follow your access instructions and lock up securely when we leave."
    },
    "item2": {
      "q": "Do you use eco-friendly, pet-safe products?",
      "a": "Yes. We use plant-based, non-toxic cleaning products that are safe for children and pets. If you have specific sensitivities or product preferences, just let us know at booking."
    },
    "item3": {
      "q": "Will I get the same cleaner every time?",
      "a": "Yes — we assign you a dedicated cleaner whenever possible. Consistency matters for trust and quality, so we make it a priority for recurring clients."
    },
    "item4": {
      "q": "Do you serve Cornwall Island / Akwesasne?",
      "a": "Yes, we cross the bridge to Cornwall Island and serve the Akwesasne community. Please mention your address when booking so we can confirm scheduling."
    },
    "item5": {
      "q": "Do you travel to Snye, QC?",
      "a": "Yes, we travel to Snye on the Quebec side of Akwesasne. We use eco-friendly, pet-safe products — important for families along the river. Mention your Snye address at booking."
    },
    "item6": {
      "q": "What's included in the Airbnb turnover package?",
      "a": "Our Airbnb turnover includes a full clean, linen change, restocking of toiletries, and damage-documentation photos. Turnovers are typically completed in the 11am–3pm window to meet check-in deadlines."
    },
    "item7": {
      "q": "Can I reschedule or cancel my booking?",
      "a": "Yes — we ask for at least 24 hours' notice to reschedule or cancel without a fee. For same-day cancellations, a short-notice fee may apply."
    },
    "item8": {
      "q": "Are you insured and bonded?",
      "a": "Yes, Fresh Nest Co. is fully insured and bonded. You can book with confidence knowing your home and belongings are protected."
    },
    "item9": {
      "q": "What if I'm not happy with the clean?",
      "a": "We offer a 24-hour satisfaction guarantee. If something was missed, contact us within 24 hours and we'll return to make it right at no extra charge."
    },
    "item10": {
      "q": "What payment methods do you accept?",
      "a": "We accept Interac e-Transfer, major credit cards, and cash. Payment is due on the day of service unless you have a recurring plan."
    }
  },
  "welcome": "Welcome to Fresh Nest Co.",
  "tagline": "Cleaning & Organizing Services",
  "phone": "(613) 935-3555",
  "nav": {
    "home": "Home",
    "services": "Services",
    "locations": "Locations",
    "pricing": "Pricing",
    "faq": "FAQ",
    "blog": "Blog",
    "booking": "Book Now",
    "openMenu": "Open menu",
    "closeMenu": "Close menu",
    "skipToContent": "Skip to main content"
  },
  "footer": {
    "tagline": "Professional cleaning and organizing services for Cornwall, Akwesasne, and surrounding communities.",
    "services": "Services",
    "locations": "Service Areas",
    "company": "Company",
    "contact": "Contact Us",
    "standardCleaning": "Standard Cleaning",
    "deepCleaning": "Deep Cleaning",
    "moveOutCleaning": "Move-Out Cleaning",
    "airbnbTurnover": "Airbnb Turnover",
    "postConstruction": "Post-Construction",
    "commercialCleaning": "Commercial Cleaning",
    "cornwallON": "Cornwall, ON",
    "akwesasne": "Akwesasne",
    "snyeQC": "Snye, QC",
    "longSault": "Long Sault",
    "morrisburg": "Morrisburg",
    "aboutUs": "About Us",
    "gallery": "Photo Gallery",
    "reviews": "Reviews",
    "careers": "Careers",
    "privacy": "Privacy Policy",
    "hours": "Hours",
    "hoursValue": "Mon–Sat: 8am–6pm",
    "email": "hello@freshnestco.ca",
    "copyright": "© {{year}} Fresh Nest Co. All rights reserved.",
    "bilingual": "Service available in English & French",
    "insured": "Fully insured & bonded"
  },
  "pricing": {
    "meta": {
      "title": "Transparent Cleaning Pricing — Fresh Nest Co.",
      "description": "Transparent, no-hidden-fee pricing for standard, deep, move-out, Airbnb, and commercial cleaning services."
    },
    "pageTitle": "Pricing | Fresh Nest Co.",
    "hero": {
      "title": "Transparent Pricing",
      "subtitle": "No hidden fees. No quotes required. Book in minutes."
    },
    "services": {
      "heading": "Service Pricing",
      "reference": "Prices shown for a 1–2 bedroom home, one-time clean.",
      "commercial": "Custom quote"
    },
    "frequency": {
      "heading": "Save with a recurring schedule",
      "cta": "Select your frequency in the calculator below to see your discounted price."
    },
    "cta": {
      "heading": "Ready to book?",
      "button": "Book a Clean"
    },
    "price": {
      "range": "${{min}}–${{max}}"
    }
  },
  "lang": {
    "toggle": "FR",
    "current": "EN",
    "switchTo": "Switch to French"
  },
  "common": {
    "bookNow": "Book Now",
    "learnMore": "Learn More",
    "getQuote": "Get a Free Quote",
    "callUs": "Call Us",
    "loading": "Loading...",
    "error": "Something went wrong. Please try again.",
    "required": "Required",
    "optional": "Optional",
    "verify": "Verify",
    "all": "All",
    "asc": "Ascending",
    "desc": "Descending",
    "search": "Search",
    "languages": {
      "en": "EN",
      "fr": "FR",
      "enLong": "English",
      "frLong": "French"
    }
  },
  "airbnbPage": {
    "meta": {
      "title": "Airbnb Turnover Cleaning — Fresh Nest Co.",
      "description": "Same-day Airbnb turnover cleaning in the 11am–3pm window. Linen changeover, damage documentation, and guest-ready staging for St. Lawrence region hosts."
    },
    "hero": {
      "heading": "Airbnb Turnover Cleaning",
      "subhead": "Reliable same-day turnovers in the 11am–3pm window. Damage-documented. Guest-ready, every time.",
      "cta": "Request a Commercial Account",
      "backLink": "← Back to Services",
      "imgAlt": "Airbnb-ready waterfront bedroom with fresh linens and St. Lawrence River view"
    },
    "included": {
      "heading": "What’s Included in Every Turnover",
      "fullClean": "Full property clean — all rooms",
      "linen": "Linen and towel changeover",
      "toiletries": "Toiletry restocking check",
      "photos": "Timestamped damage photo documentation",
      "staging": "Guest-ready staging",
      "window": "Completed within the 11am–3pm window"
    },
    "howItWorks": {
      "heading": "How It Works",
      "step1Title": "Book Your Window",
      "step1Desc": "Select your turnover date. We confirm same-day availability within 2 hours.",
      "step2Title": "We Clean & Document",
      "step2Desc": "Your property is cleaned, staged, and photographed. Photos sent to you same day.",
      "step3Title": "Guests Arrive Ready",
      "step3Desc": "Check-in happens on schedule. No last-minute scrambles."
    },
    "trust": {
      "heading": "Why Hosts Choose Fresh Nest",
      "stat1": "40+",
      "label1": "Turnovers completed annually",
      "stat2": "11am–3pm",
      "label2": "Guaranteed turnover window",
      "stat3": "100%",
      "label3": "Damage photo documentation on every clean"
    },
    "pricing": {
      "heading": "Transparent Turnover Pricing",
      "starting": "Starting from ${{min}} per turnover",
      "volume": "Volume pricing available for 4+ turnovers per month",
      "cta": "See Full Pricing"
    },
    "form": {
      "heading": "Request a Commercial Account",
      "subhead": "Set up priority scheduling, volume pricing, and documented turnovers for your property.",
      "firstName": "First Name",
      "lastName": "Last Name",
      "email": "Email Address",
      "phone": "Phone Number",
      "propertyName": "Property Name or Address",
      "monthlyTurnovers": "Estimated Monthly Turnovers",
      "preferredWindow": "Preferred Cleaning Window",
      "window11am3pm": "11am–3pm (standard turnover)",
      "windowFlexible": "Flexible",
      "windowMorning": "Morning (before 12pm)",
      "windowAfternoon": "Afternoon (12pm–5pm)",
      "notes": "Additional Notes",
      "notesPlaceholder": "Property address, gate codes, linen storage location, or special instructions",
      "consent": "I agree to receive service updates from Fresh Nest Co. (optional)",
      "submit": "Submit Inquiry",
      "submitting": "Submitting…",
      "successHeading": "Thank you, {{name}}.",
      "successBody": "We’ll review your inquiry and contact you within 24 hours to set up your commercial account."
    }
  },
  "servicePage": {
    "backLink": "← Back to Services",
    "bookCta": "Book This Service",
    "bookBanner": "Ready to book your {{service}}?",
    "bookBannerCta": "Book Now",
    "pricingHeading": "Transparent Pricing",
    "pricingStarting": "Starting from ${{min}} for a 1–2 bedroom home",
    "pricingCta": "See Full Pricing",
    "customPricingHeading": "Custom Pricing for Your Business",
    "customPricingBody": "Commercial cleaning rates are tailored to your space, team size, and schedule. Contact us for a free on-site assessment.",
    "customPricingCta": "Book a Consultation",
    "overview": {
      "heading": "Our Cleaning Services",
      "subhead": "Professional, bilingual cleaning across Cornwall, Akwesasne, Snye QC, and surrounding communities."
    },
    "common": {
      "includedHeading": "What’s Included",
      "howItWorksHeading": "How It Works",
      "trustHeading": "Why Choose Fresh Nest",
      "step1Title": "Book Online",
      "step1Desc": "Choose your service, date, and home size. Confirmation in under 2 minutes.",
      "step2Title": "We Clean",
      "step2Desc": "Your assigned cleaner arrives on time and works through a consistent checklist.",
      "step3Title": "You Enjoy",
      "step3Desc": "Arrive home to a fresh space. Message us if anything needs attention.",
      "trust1Stat": "4.9 / 5",
      "trust1Label": "Google rating from verified clients",
      "trust2Stat": "100%",
      "trust2Label": "Insured, bonded, and background-checked staff",
      "trust3Stat": "EN / FR",
      "trust3Label": "Bilingual service across our full service area"
    },
    "standard": {
      "hero": {
        "heading": "Standard Cleaning",
        "subhead": "Regular, consistent cleaning to keep your home fresh. No prep work needed — just let us in.",
        "imgAlt": "Bright, clean living room with vacuumed floor, sofa, and natural light"
      },
      "included": {
        "floors": "Vacuuming and mopping all floors",
        "kitchen": "Kitchen counters, surfaces, and sink",
        "bathrooms": "Bathroom cleaning and sanitizing",
        "dusting": "Dusting surfaces and accessible areas",
        "trash": "Emptying trash and recycling bins",
        "beds": "Making beds (fresh linen, if provided)"
      }
    },
    "deep": {
      "hero": {
        "heading": "Deep Clean",
        "subhead": "A top-to-bottom reset that reaches the areas regular cleaning never touches.",
        "imgAlt": "Immaculate kitchen with sparkling clean appliances, countertops, and tiled backsplash"
      },
      "included": {
        "everything": "Everything in our Standard Cleaning",
        "appliances": "Inside oven, fridge, and microwave",
        "cabinets": "Interior and exterior of kitchen cabinets",
        "baseboards": "Baseboards and door frames",
        "windowSills": "Window sills, tracks, and ledges",
        "fixtures": "Light fixtures, ceiling fans, and vents",
        "grout": "Grout scrubbing in bathrooms and kitchen"
      }
    },
    "moveout": {
      "hero": {
        "heading": "Move-Out Cleaning",
        "subhead": "Leave your old home spotless so you get your deposit back — and move on with confidence.",
        "imgAlt": "Empty and spotless dining area showing clean hardwood floors and large windows"
      },
      "included": {
        "allRooms": "Full clean of all rooms and closets",
        "appliances": "Inside all appliances (oven, fridge, dishwasher)",
        "cupboards": "Inside all cupboards, drawers, and cabinets",
        "behindAppliances": "Cleaning behind and under appliances",
        "windowsDoorsFrames": "Windows, door frames, and baseboards",
        "checklistWalkthrough": "Final walkthrough checklist included"
      }
    },
    "postconstruction": {
      "hero": {
        "heading": "Post-Construction Cleaning",
        "subhead": "Construction dust is everywhere — we remove it safely before you move in.",
        "imgAlt": "Freshly renovated modern space free of dust, with clean windows and sleek finishes"
      },
      "included": {
        "dustRemoval": "Fine dust removal from all surfaces",
        "hepaVacuum": "HEPA vacuuming throughout",
        "adhesiveRemoval": "Sticker, adhesive, and label residue removal",
        "windows": "Window and glass cleaning (inside)",
        "vents": "Vent covers, light fixtures, and outlets",
        "debrisRemoval": "Final debris and packaging removal"
      }
    },
    "commercial": {
      "hero": {
        "heading": "Commercial Cleaning",
        "subhead": "Consistent, professional cleaning for offices, retail, and business facilities in the region.",
        "imgAlt": "Modern, clean office workspace with tidy desks and large windows"
      },
      "included": {
        "officeSpaces": "Office and workspace cleaning",
        "washrooms": "Washroom sanitizing and restocking",
        "commonAreas": "Common areas, lobby, and break rooms",
        "floorCare": "Vacuuming, mopping, and floor care",
        "wasteRemoval": "Waste removal and recycling",
        "flexibleScheduling": "After-hours and weekend scheduling available"
      }
    }
  },
  "thankYou": {
    "meta": {
      "title": "Booking Confirmed — Fresh Nest Co.",
      "description": "Your Fresh Nest Co. cleaning booking is confirmed. Check your email for details."
    },
    "heading": "You're booked, {{name}}!",
    "subhead": "Your booking is confirmed. A confirmation email is on its way to {{email}}.",
    "genericHeading": "Your booking is confirmed!",
    "genericSubhead": "Check your inbox for your booking confirmation details.",
    "summaryHeading": "Booking Summary",
    "referenceLabel": "Booking reference",
    "serviceLabel": "Service",
    "dateLabel": "Preferred date",
    "frequencyLabel": "Frequency",
    "nextHeading": "What Happens Next",
    "step1Title": "Confirmation email sent",
    "step1Desc": "Check your inbox — your booking details are on their way.",
    "step2Title": "We confirm your cleaner",
    "step2Desc": "We'll assign your cleaner and confirm the details within 24 hours.",
    "step3Title": "Your cleaner arrives",
    "step3Desc": "On the day of your booking, your cleaner arrives on time, ready to work.",
    "ctaServices": "Explore Our Services",
    "ctaHome": "Return Home"
  },
  "a11y": {
    "navMain": "Main navigation",
    "homeLink": "Fresh Nest Co. — Home",
    "callUs": "Call Fresh Nest Co. at {{phone}}",
    "navMobile": "Mobile navigation",
    "footerServices": "Footer services links",
    "footerLocations": "Footer service areas links",
    "footerCompany": "Footer company links"
  },
  "cookieBanner": {
    "message": "We use cookies to analyze site traffic and improve your experience. By clicking 'Accept', you consent to our use of cookies.",
    "accept": "Accept",
    "decline": "Decline",
    "preferences": "Cookie Preferences"
  },
  "admin": {
    "meta": {
      "title": "Admin Portal — Fresh Nest Co.",
      "description": "Administrative dashboard for booking management."
    },
    "login": {
      "heading": "Admin Portal",
      "subhead": "Sign in to manage bookings, clients, and metrics.",
      "button": "Sign in with Google",
      "errorTitle": "Access Denied",
      "errorMessage": "Your account ({{email}}) is not authorized to access this admin portal. If you believe this is an error, please contact the developer or use an authorized account.",
      "tryAnother": "Try Another Account",
      "backToHome": "Back to Home",
      "authFailed": "Authentication failed. Please try again."
    },
    "dashboard": {
      "title": "Admin Dashboard",
      "welcome": "Welcome back, {{name}}",
      "signOut": "Sign Out",
      "avatarAlt": "User avatar",
      "fallbackName": "Admin",
      "stats": {
        "total": "Total Bookings",
        "pending": "Pending Confirmation",
        "confirmed": "Confirmed Schedule"
      },
      "filters": {
        "status": "Booking Status",
        "service": "Service Type",
        "language": "Language",
        "sortBy": "Sort By",
        "sortOrder": "Sort Order",
        "search": "Search by name, email, phone, or address..."
      },
      "table": {
        "client": "Client Details",
        "date": "Preferred Date",
        "service": "Service",
        "status": "Status",
        "assigned": "Assigned Cleaner",
        "noResults": "No bookings found matching your search and filter criteria."
      },
      "details": {
        "unassigned": "Unassigned",
        "address": "Service Address",
        "property": "Property Specifications",
        "frequency": "Frequency",
        "pets": "Pets Present",
        "petsYes": "Yes (Use pet-safe products)",
        "petsNo": "No",
        "assignHeader": "Manage Schedule & Status",
        "customOption": "Custom / Other...",
        "customPlaceholder": "Type custom cleaner name",
        "customCleaner": "Custom Cleaner Name",
        "save": "Save",
        "addons": "Requested Extras / Add-Ons",
        "notes": "Special Instructions",
        "noAddons": "No extra add-ons requested.",
        "noNotes": "No special instructions provided.",
        "createdAt": "Submitted At",
        "leadSource": "Marketing Lead Source",
        "referralCode": "Client Referral Code",
        "referredBy": "Referred By Code",
        "workflow": "Workflow Actions",
        "isAirbnb": "Airbnb Turnover Checklist",
        "photoConf": "Photo Confirmation Required",
        "phone": "Phone",
        "rooms": "Rooms",
        "roomsValue": "{{bedrooms}} Bed / {{bathrooms}} Bath",
        "size": "Size",
        "sqft": "{{size}} sq. ft."
      },
      "tabs": {
        "bookings": "Bookings Management",
        "analytics": "Marketing Analytics"
      },
      "analytics": {
        "title": "Marketing & Lead Source Performance",
        "rangeLabel": "Time Range",
        "ranges": {
          "all": "All Time",
          "30days": "Last 30 Days",
          "90days": "Last 90 Days",
          "ytd": "Year to Date (YTD)",
          "month": "This Month"
        },
        "stats": {
          "bookingsCount": "Estimated Bookings",
          "estimatedRevenue": "Estimated Revenue",
          "avgBookingValue": "Avg Booking Value",
          "referredBookings": "Referred Bookings"
        },
        "charts": {
          "leadDistribution": "Lead Source Distribution (Bookings)",
          "monthlyTrend": "Monthly Revenue & Booking Trends",
          "revenue": "Revenue ($)",
          "bookings": "Bookings Count"
        },
        "table": {
          "channel": "Lead Source / Channel",
          "volume": "Bookings Volume",
          "revenue": "Estimated Revenue",
          "avgValue": "Avg Booking Value",
          "share": "Conversion Share"
        }
      },
      "leads": {
        "organic": "Organic Search",
        "google": "Google Ads",
        "referral": "Referral Program",
        "facebook": "Facebook Ads",
        "direct": "Direct Traffic"
      }
    }
  },
  "blog": {
    "meta": {
      "title": "Fresh Nest Co. Blog — Cleaning & Organizing Tips",
      "description": "Read cleaning checklists, pricing guides, and seasonal tips from Fresh Nest Co. serving Cornwall and Akwesasne."
    },
    "pageHeading": "Fresh Nest Blog",
    "pageSubhead": "Seasonal tips, move-out checklists, and professional home care advice for our local communities.",
    "readMore": "Read More",
    "publishedAt": "Published on {{date}}",
    "writtenBy": "By {{author}}",
    "noPosts": "No articles found.",
    "backToBlog": "← Back to Blog",
    "metaPost": "{{title}} | Fresh Nest Blog"
  },
  "referrals": {
    "promoCodeLabel": "Referral Code (Optional)",
    "promoPlaceholder": "Enter friend's code",
    "promoValid": "Promo code valid! $20 off applied.",
    "promoInvalid": "Invalid referral code. Please check and try again.",
    "promoChecking": "Verifying code...",
    "referralShareTitle": "Share the Fresh Nest Love",
    "referralShareDesc": "Give your friends $20 off their first clean. When they book, you'll receive a $20 discount on your next service!",
    "copyLink": "Copy Referral Link",
    "linkCopied": "Link copied to clipboard!",
    "referredBy": "Referred by {{name}}"
  }
}

```

---

## File: src/i18n/locales/fr.json

```json
{
  "home": {
    "title": "Fresh Nest Co. — Services de nettoyage et d'organisation | Cornwall, ON",
    "description": "Nettoyage et organisation professionnels pour maisons et entreprises à Cornwall, Akwesasne et Snye QC."
  },
  "placeholder": {
    "metaDesc": "Informations sur {{page}} chez Fresh Nest Co. desservant Cornwall et ses environs."
  },
  "hero": {
    "headline": "Professionnel <br /> <highlight>Nettoyage</highlight> <br /> & Organisation",
    "subhead": "Nous desservons Cornwall, Akwesasne, Snye et les communautés avoisinantes."
  },
  "trustBar": {
    "ariaLabel": "Indicateurs de confiance et de qualité",
    "insured": "Assuré et cautionné",
    "background": "Personnel vérifié",
    "eco": "Produits écologiques",
    "guarantee": "Garantie de satisfaction",
    "rating": "4,9 / 5 Note Google",
    "bilingual": "Service bilingue"
  },
  "quote": {
    "ariaLabel": "Calculateur de devis instantané",
    "sectionHeading": "Obtenez un devis instantané",
    "sectionSubhead": "Tarifs transparents pour Cornwall et les communautés avoisinantes. Aucun engagement requis.",
    "sizeLabel": "Superficie du logement",
    "serviceLabel": "Type de service",
    "frequencyLabel": "À quelle fréquence ?",
    "size": {
      "apartment": "Appartement",
      "1-2bed": "1–2 ch.",
      "3-4bed": "3–4 ch.",
      "5plus": "5+ ch.",
      "commercial": "Commercial"
    },
    "service": {
      "standard": "Standard",
      "deep": "En profondeur",
      "moveout": "Déménagement",
      "postconstruction": "Post-construction",
      "airbnb": "Airbnb"
    },
    "frequency": {
      "one-time": "Une fois",
      "weekly": "Hebdomadaire",
      "biweekly": "Aux deux semaines",
      "monthly": "Mensuel"
    },
    "discountBadge": "{{pct}} % de rabais",
    "startingAt": "À partir de {{price}} $",
    "typicallyRange": "Généralement {{min}} $–{{max}} $",
    "bookNowCta": "Réservez maintenant",
    "commercialTitle": "Devis personnalisé pour votre entreprise",
    "commercialBody": "Les tarifs de nettoyage commercial sont adaptés à votre espace et à votre horaire. Contactez-nous pour une évaluation gratuite.",
    "commercialCta": "Nous contacter pour un devis"
  },
  "services": {
    "ariaLabel": "Nos services de nettoyage",
    "sectionHeading": "Nos services",
    "sectionSubhead": "Un nettoyage professionnel pour chaque besoin — résidentiel, locatif et commercial. Fièrement au service de Cornwall et des communautés environnantes.",
    "bookNow": "Réserver",
    "bookAriaLabel": "Réserver {{service}}",
    "viewDetailsAriaLabel": "En savoir plus sur {{service}}",
    "standard": {
      "title": "Nettoyage standard",
      "description": "Un entretien régulier pour garder votre maison impeccable. Idéal pour des visites hebdomadaires ou bimensuelles — comptoirs, planchers, salles de bain et pièces communes."
    },
    "deep": {
      "title": "Nettoyage en profondeur",
      "description": "Un nettoyage complet de fond en comble : plinthes, intérieur des appareils et zones difficiles d'accès. Parfait pour une remise à neuf saisonnière."
    },
    "moveout": {
      "title": "Nettoyage de déménagement",
      "description": "Laissez votre ancien logement impeccable pour l'inspection du propriétaire. Nous prenons soin de chaque surface pour que vous récupériez votre dépôt."
    },
    "postconstruction": {
      "title": "Post-construction",
      "description": "La poussière et les débris de construction exigent une attention spécialisée. Nous éliminons les particules fines, résidus d'adhésifs et emballages sur toutes les surfaces."
    },
    "airbnb": {
      "title": "Rotation Airbnb",
      "description": "Des rotations rapides et fiables entre les séjours — généralement effectuées dans le créneau 11h–15h. Changement de literie, désinfection et mise en scène pour les invités inclus."
    },
    "commercial": {
      "title": "Nettoyage commercial",
      "description": "Programmes de nettoyage sur mesure pour bureaux, commerces et établissements d'affaires. Horaires flexibles, tarifs sur volume et gestion de compte dédiée."
    }
  },
  "gallery": {
    "meta": {
      "title": "Galerie de photos avant & après — Fresh Nest Co.",
      "description": "Parcourez notre galerie de photos de nettoyage avant et après. Voyez les résultats de nos nettoyages professionnels résidentiels, en profondeur et Airbnb."
    },
    "ariaLabel": "Photos avant et après le nettoyage",
    "pageHeading": "Nos réalisations",
    "pageSubhead": "Des résultats réels de notre équipe — avant et après chaque nettoyage.",
    "previewHeading": "Avant & Après",
    "previewSubhead": "Découvrez la différence Fresh Nest.",
    "viewAll": "Voir toute la galerie",
    "beforeLabel": "Avant",
    "afterLabel": "Après",
    "beforeAlt": "Avant : {{service}}",
    "afterAlt": "Après : {{service}}",
    "closeLabel": "Fermer la photo",
    "prevLabel": "Photo précédente",
    "nextLabel": "Photo suivante",
    "photoComingSoon": "Photo à venir",
    "ctaHeading": "Prêt à voir ces résultats dans votre maison ?",
    "pairs": {
      "kitchenDeep": {
        "caption": "Nettoyage en profondeur de la cuisine — Cornwall, ON"
      },
      "airbnbTurnover": {
        "caption": "Rotation Airbnb — bord du Saint-Laurent"
      },
      "bathroomDeep": {
        "caption": "Nettoyage en profondeur de la salle de bain — Cornwall, ON"
      },
      "moveoutFull": {
        "caption": "Nettoyage de déménagement complet — Long Sault, ON"
      },
      "postconstruction": {
        "caption": "Nettoyage post-construction — Cornwall, ON"
      }
    }
  },
  "howItWorks": {
    "ariaLabel": "Comment fonctionne le processus de réservation",
    "sectionHeading": "Comment ça marche",
    "sectionSubhead": "De la réservation à une maison impeccable — quatre étapes simples.",
    "step1Title": "Réservez en ligne",
    "step1Desc": "Choisissez votre service, la superficie de votre logement et votre date de préférence. Aucun compte requis — moins de 3 minutes.",
    "step2Title": "Nous confirmons",
    "step2Desc": "Vous recevrez notre confirmation dans les 24 heures avec le nom de votre nettoyeur attitré et votre créneau d'arrivée.",
    "step3Title": "Nous nettoyons",
    "step3Desc": "Votre nettoyeur attitré arrive à l'heure et suit une liste de contrôle détaillée adaptée à votre maison.",
    "step4Title": "Profitez",
    "step4Desc": "Nous vous envoyons un avis d'achèvement à la fin. Satisfaction garantie — nous corrigeons tout oubli.",
    "faqLink": "Des questions ? Consultez notre FAQ"
  },
  "recurring": {
    "ariaLabel": "Forfaits de nettoyage récurrents et tarifs",
    "sectionHeading": "Économisez à chaque nettoyage",
    "sectionSubhead": "Réservez un nettoyage récurrent et économisez jusqu'à 20 % — sans contrat, annulation à tout moment.",
    "mostPopular": "Le plus populaire",
    "discountBadge": "{{pct}} % de rabais",
    "bookCta": "Réserver — {{freq}}",
    "bookAriaLabel": "Réserver un nettoyage {{freq}}",
    "tagline": {
      "weekly": "Idéal pour les foyers actifs. Votre maison, toujours impeccable, chaque semaine.",
      "biweekly": "Réservez et oubliez. L'option la plus populaire — propre aux deux semaines.",
      "monthly": "Nettoyage récurrent flexible. Idéal pour les maisons moins fréquentées ou les remises à neuf saisonnières."
    }
  },
  "team": {
    "ariaLabel": "Rencontrez l'équipe de nettoyage Fresh Nest Co.",
    "sectionHeading": "Rencontrez votre équipe",
    "sectionSubhead": "Des personnes réelles qui se soucient de votre maison.",
    "assignmentNote": "Nous attribuons le même nettoyeur attitré à votre domicile — à chaque visite, sans exception. Demandez votre nettoyeur préféré lors de la réservation.",
    "photoAlt": "Photo de {{name}}",
    "members": {
      "lauren": {
        "role": "Propriétaire et fondatrice",
        "bio": "Lauren a fondé Fresh Nest Co. pour offrir un service de nettoyage professionnel, fiable et personnalisé à Cornwall et aux communautés environnantes. Dynamique et méticuleuse, elle veille à ce que votre maison soit entretenue avec une touche chaleureuse et bohémienne."
      },
      "sarah": {
        "role": "Nettoyeuse professionnelle principale",
        "bio": "Sarah a plus de 5 ans d'expérience en nettoyage résidentiel et adore rendre les espaces paisibles et organisés. Elle est notre nettoyeuse principale pour le nettoyage en profondeur et les clients réguliers."
      }
    }
  },
  "reviews": {
    "ariaLabel": "Avis des clients",
    "sectionHeading": "Ce que disent nos clients",
    "sectionSubhead": "Des avis réels de clients partout à Cornwall et dans les communautés environnantes.",
    "ratingHeading": "5,0",
    "ratingStars": "★★★★★",
    "ratingBasis": "Basé sur 80+ avis",
    "ratingAriaLabel": "Note de 5,0 sur 5 — basé sur plus de 80 avis",
    "starAriaLabel": "{{rating}} sur {{max}} étoiles"
  },
  "locations": {
    "ariaLabel": "Zones desservies",
    "servicesHeading": "Services disponibles ici",
    "mapLabel": "Carte de {{location}}",
    "bookCta": "Réserver un nettoyage à {{location}}",
    "bookAriaLabel": "Réserver un nettoyage à {{location}}",
    "overview": {
      "pageTitle": "Zones desservies | Fresh Nest Co.",
      "metaDesc": "Fresh Nest Co. dessert Cornwall ON, Akwesasne, Snye QC, Long Sault et Morrisburg. Services de nettoyage professionnels bilingues.",
      "heading": "Nos zones desservies",
      "subhead": "Nous desservons fièrement Cornwall et les communautés environnantes — notamment Akwesasne, Snye QC, Long Sault et Morrisburg.",
      "viewLocation": "Voir les détails →"
    },
    "cornwallOn": {
      "pageTitle": "Nettoyage professionnel à Cornwall, ON | Fresh Nest Co.",
      "metaDesc": "Fresh Nest Co. offre des services de nettoyage bilingues à Cornwall, ON — standard, en profondeur, déménagement, post-construction, rotation Airbnb et commercial.",
      "heading": "Services de nettoyage à Cornwall, ON",
      "subhead": "L'équipe de nettoyage bilingue de confiance à Cornwall — résidentiel, commercial et Airbnb.",
      "description": "Fresh Nest Co. est basé à Cornwall et dessert l'ensemble de la ville, incluant les secteurs est et ouest, le bord de l'eau et les quartiers résidentiels avoisinants. Nous offrons le nettoyage standard, en profondeur, de déménagement, post-construction, la rotation Airbnb et le nettoyage commercial — en anglais et en français."
    },
    "akwesasne": {
      "pageTitle": "Nettoyage professionnel à Akwesasne | Fresh Nest Co.",
      "metaDesc": "Fresh Nest Co. dessert Akwesasne, incluant l'île de Cornwall. Nous traversons le pont international Seaway — nettoyage standard, en profondeur et de déménagement disponibles.",
      "heading": "Services de nettoyage à Akwesasne",
      "subhead": "Nous desservons l'ensemble de la communauté d'Akwesasne — incluant l'île de Cornwall.",
      "description": "Nous traversons le pont international Seaway pour desservir l'île de Cornwall et la communauté d'Akwesasne. Nettoyage standard, en profondeur, de déménagement et post-construction disponibles. Veuillez indiquer votre adresse sur l'île et les instructions d'accès dans les notes de réservation.",
      "islandNote": "Nous desservons l'île de Cornwall — nous traversons le pont. Veuillez indiquer votre adresse sur l'île et les instructions d'accès dans les notes de réservation."
    },
    "snyeQc": {
      "pageTitle": "Nettoyage professionnel à Snye, QC | Fresh Nest Co.",
      "metaDesc": "Fresh Nest Co. dessert Snye, Québec — côté québécois d'Akwesasne. Service bilingue, produits écologiques. Standard, en profondeur et déménagement.",
      "heading": "Services de nettoyage à Snye, QC",
      "subhead": "Nous desservons Akwesasne, côté Québec, incluant Snye.",
      "description": "Fresh Nest Co. se déplace au-delà de la frontière provinciale pour desservir les clients à Snye et du côté québécois d'Akwesasne. Nous utilisons des produits écologiques et sûrs pour les bébés sur tous nos nettoyages. Nettoyage standard, en profondeur et de déménagement disponibles. Service entièrement bilingue — réservez en français ou en anglais.",
      "borderNote": "Nous servons Akwesasne, côté Québec (Snye) — nous traversons la frontière provinciale. Produits écologiques et sûrs pour les bébés utilisés à chaque nettoyage."
    },
    "longSault": {
      "pageTitle": "Nettoyage professionnel à Long Sault, ON | Fresh Nest Co.",
      "metaDesc": "Fresh Nest Co. dessert Long Sault et South Stormont, ON. Nettoyage résidentiel professionnel et rotation Airbnb.",
      "heading": "Services de nettoyage à Long Sault",
      "subhead": "Desservant Long Sault et South Stormont — incluant les propriétés Airbnb en bord de l'eau.",
      "description": "Les résidents de Long Sault et South Stormont comptent sur Fresh Nest Co. pour un nettoyage résidentiel fiable. Nous desservons également les propriétés Airbnb et les chalets en bord du Saint-Laurent. Nettoyage standard, en profondeur, de déménagement et rotation Airbnb disponibles."
    },
    "morrisburg": {
      "pageTitle": "Nettoyage professionnel à Morrisburg, ON | Fresh Nest Co.",
      "metaDesc": "Fresh Nest Co. dessert Morrisburg et South Dundas, ON. Nettoyage résidentiel professionnel — standard, en profondeur et déménagement.",
      "heading": "Services de nettoyage à Morrisburg",
      "subhead": "Desservant Morrisburg et le comté de South Dundas.",
      "description": "Morrisburg et la région de South Dundas environnante font partie de notre zone de service régulière. Nettoyage standard, en profondeur et de déménagement disponibles. Contactez-nous pour confirmer la disponibilité pour votre adresse spécifique."
    }
  },
  "booking": {
    "pageTitle": "Réserver un nettoyage | Fresh Nest Co.",
    "metaDesc": "Réservez des services de nettoyage professionnel en ligne. Réservation rapide et bilingue pour Cornwall, Akwesasne, Snye QC, Long Sault et Morrisburg.",
    "heading": "Réserver un nettoyage",
    "subhead": "Quatre étapes rapides — environ 3 minutes sur votre téléphone.",
    "progress": "Étape {{current}} sur {{total}}",
    "next": "Suivant",
    "back": "Retour",
    "submit": "Confirmer la réservation",
    "submitting": "Envoi en cours…",
    "step1Title": "Quel type de nettoyage ?",
    "step2Title": "Quand souhaitez-vous notre visite ?",
    "step3Title": "Vos coordonnées",
    "step4Title": "Vérifiez votre réservation",
    "airbnbNote": "Les rotations Airbnb incluent le changement de literie, le réapprovisionnement des articles de toilette et les photos de dommages. Généralement effectuées dans le créneau 11h–15h.",
    "fields": {
      "serviceType": {
        "label": "Type de service"
      },
      "propertyType": {
        "label": "Taille de la propriété",
        "options": {
          "apartment": "Appartement / Condo",
          "1-2bed": "Maison 1–2 chambres",
          "3-4bed": "Maison 3–4 chambres",
          "5+bed": "Maison 5+ chambres",
          "commercial": "Propriété commerciale"
        }
      },
      "bedrooms": {
        "label": "Chambres",
        "decrease": "Réduire les chambres",
        "increase": "Augmenter les chambres"
      },
      "bathrooms": {
        "label": "Salles de bain",
        "decrease": "Réduire les salles de bain",
        "increase": "Augmenter les salles de bain"
      },
      "pets": {
        "label": "Nous avons des animaux à la maison",
        "hint": "Nous utilisons des produits écologiques et sûrs pour les animaux comme standard."
      },
      "frequency": {
        "label": "Fréquence de nettoyage",
        "options": {
          "one-time": "Une seule fois",
          "weekly": "Hebdomadaire",
          "biweekly": "Aux deux semaines",
          "monthly": "Mensuel"
        },
        "discounts": {
          "weekly": "Économisez 20 %",
          "biweekly": "Économisez 15 %",
          "monthly": "Économisez 10 %"
        }
      },
      "preferredDate": {
        "label": "Date préférée",
        "hint": "Nous confirmerons la disponibilité dans les 24 heures."
      },
      "squareFootage": {
        "label": "Superficie",
        "optional": "(facultatif)",
        "placeholder": "p. ex. 1400"
      },
      "addOns": {
        "label": "Options supplémentaires (facultatif)",
        "options": {
          "oven": "Intérieur du four",
          "fridge": "Intérieur du réfrigérateur",
          "windows": "Fenêtres intérieures",
          "laundry": "Lessive (lavage + pliage)",
          "petHair": "Traitement poils d'animaux",
          "basement": "Sous-sol"
        }
      },
      "firstName": {
        "label": "Prénom",
        "placeholder": "Prénom"
      },
      "lastName": {
        "label": "Nom",
        "placeholder": "Nom"
      },
      "email": {
        "label": "Adresse courriel",
        "placeholder": "vous@exemple.com"
      },
      "phone": {
        "label": "Numéro de téléphone",
        "placeholder": "(613) 000-0000"
      },
      "address": {
        "label": "Adresse du service",
        "placeholder": "123 rue Principale, Cornwall ON",
        "hint": "Incluez l'adresse de l'île ou les informations de passage frontalier si applicable."
      },
      "preferredCleaner": {
        "label": "Nettoyeur préféré (facultatif)",
        "placeholder": "ex. Lauren S. — laissez vide pour être assigné"
      },
      "notes": {
        "label": "Instructions spéciales (facultatif)",
        "placeholder": "Adresse de l'île / info traversée du pont, code d'accès, allergies, zones à cibler…"
      },
      "marketingConsent": {
        "label": "J'accepte de recevoir des courriels promotionnels de Fresh Nest Co. Je peux me désabonner à tout moment."
      }
    },
    "errors": {
      "required": "Ce champ est obligatoire.",
      "email": "Veuillez entrer une adresse courriel valide.",
      "phone": "Veuillez entrer un numéro de téléphone valide (minimum 10 chiffres).",
      "minLength": "Ce champ est trop court.",
      "date": "Veuillez sélectionner une date.",
      "submit": "Une erreur s'est produite lors de l'enregistrement. Veuillez réessayer ou nous appeler :"
    },
    "review": {
      "heading": "Vérifiez votre réservation",
      "service": "Service",
      "property": "Propriété",
      "schedule": "Horaire",
      "contact": "Coordonnées",
      "addOns": "Options",
      "notes": "Notes",
      "edit": "Modifier"
    },
    "status": {
      "pending": "En attente de confirmation",
      "confirmed": "Horaire confirmé",
      "completed": "Terminé",
      "cancelled": "Annulé"
    }
  },
  "faq": {
    "pageTitle": "FAQ | Fresh Nest Co.",
    "metaDesc": "Questions fréquentes sur les services de nettoyage de Fresh Nest Co. à Cornwall, Akwesasne, Snye QC, Long Sault et Morrisburg.",
    "heading": "Questions fréquentes",
    "subhead": "Réponses rapides sur la réservation, les services et à quoi s'attendre.",
    "ctaHeading": "Vous avez d'autres questions ?",
    "ctaSubhead": "Nous sommes là pour vous aider — appelez-nous ou réservez en ligne.",
    "item1": {
      "q": "Dois-je être présent pendant le nettoyage ?",
      "a": "Non, vous n'avez pas besoin d'être à la maison. Beaucoup de nos clients nous laissent une clé ou un code d'accès. Nous suivons vos instructions et verrouillons soigneusement à notre départ."
    },
    "item2": {
      "q": "Utilisez-vous des produits écologiques et sûrs pour les animaux ?",
      "a": "Oui. Nous utilisons des produits de nettoyage à base végétale et non toxiques, sûrs pour les enfants et les animaux. Si vous avez des sensibilités particulières ou des préférences de produits, faites-le nous savoir lors de la réservation."
    },
    "item3": {
      "q": "Aurai-je le même nettoyeur à chaque visite ?",
      "a": "Oui — nous vous assignons un nettoyeur attitré dans la mesure du possible. La constance est essentielle pour la confiance et la qualité, et nous en faisons une priorité pour les clients réguliers."
    },
    "item4": {
      "q": "Desservez-vous l'île de Cornwall / Akwesasne ?",
      "a": "Oui, nous traversons le pont pour aller sur l'île de Cornwall et desservir la communauté d'Akwesasne. Mentionnez votre adresse lors de la réservation afin que nous puissions confirmer l'horaire."
    },
    "item5": {
      "q": "Vous déplacez-vous à Snye, QC ?",
      "a": "Oui, nous nous déplaçons à Snye du côté québécois d'Akwesasne. Nous utilisons des produits écologiques et sûrs pour les animaux — important pour les familles riveraines. Mentionnez votre adresse de Snye lors de la réservation."
    },
    "item6": {
      "q": "Qu'est-ce qui est inclus dans le forfait rotation Airbnb ?",
      "a": "Notre forfait rotation Airbnb comprend un nettoyage complet, le changement de literie, le réapprovisionnement des articles de toilette et des photos de documentation des dommages. Les rotations sont généralement effectuées dans le créneau 11h–15h pour respecter les horaires d'arrivée."
    },
    "item7": {
      "q": "Puis-je reporter ou annuler ma réservation ?",
      "a": "Oui — nous demandons un préavis d'au moins 24 heures pour reporter ou annuler sans frais. Pour les annulations le jour même, des frais de courte notice peuvent s'appliquer."
    },
    "item8": {
      "q": "Êtes-vous assurés et cautionnés ?",
      "a": "Oui, Fresh Nest Co. est pleinement assurée et cautionnée. Vous pouvez réserver en toute confiance, sachant que votre domicile et vos biens sont protégés."
    },
    "item9": {
      "q": "Que se passe-t-il si je ne suis pas satisfait du nettoyage ?",
      "a": "Nous offrons une garantie de satisfaction de 24 heures. Si quelque chose a été oublié, contactez-nous dans les 24 heures et nous reviendrons corriger la situation sans frais supplémentaires."
    },
    "item10": {
      "q": "Quels modes de paiement acceptez-vous ?",
      "a": "Nous acceptons le virement Interac, les principales cartes de crédit et l'argent comptant. Le paiement est dû le jour du service, sauf si vous avez un forfait récurrent."
    }
  },
  "welcome": "Bienvenue chez Fresh Nest Co.",
  "tagline": "Services de nettoyage et d'organisation",
  "phone": "(613) 935-3555",
  "nav": {
    "home": "Accueil",
    "services": "Services",
    "locations": "Secteurs desservis",
    "pricing": "Tarifs",
    "faq": "FAQ",
    "blog": "Blogue",
    "booking": "Réservez maintenant",
    "openMenu": "Ouvrir le menu",
    "closeMenu": "Fermer le menu",
    "skipToContent": "Passer au contenu principal"
  },
  "footer": {
    "tagline": "Services professionnels de nettoyage et d'organisation pour Cornwall, Akwesasne et les communautés environnantes.",
    "services": "Services",
    "locations": "Zones desservies",
    "company": "Entreprise",
    "contact": "Contactez-nous",
    "standardCleaning": "Nettoyage standard",
    "deepCleaning": "Nettoyage en profondeur",
    "moveOutCleaning": "Nettoyage de déménagement",
    "airbnbTurnover": "Rotation Airbnb",
    "postConstruction": "Post-construction",
    "commercialCleaning": "Nettoyage commercial",
    "cornwallON": "Cornwall, ON",
    "akwesasne": "Akwesasne",
    "snyeQC": "Snye, QC",
    "longSault": "Long Sault",
    "morrisburg": "Morrisburg",
    "aboutUs": "À propos",
    "gallery": "Galerie photo",
    "reviews": "Avis clients",
    "careers": "Carrières",
    "privacy": "Politique de confidentialité",
    "hours": "Heures d'ouverture",
    "hoursValue": "Lun–Sam : 8h–18h",
    "email": "hello@freshnestco.ca",
    "copyright": "© {{year}} Fresh Nest Co. Tous droits réservés.",
    "bilingual": "Service disponible en anglais et en français",
    "insured": "Entièrement assuré et cautionné"
  },
  "pricing": {
    "meta": {
      "title": "Tarifs de nettoyage transparents — Fresh Nest Co.",
      "description": "Tarifs transparents, sans frais cachés, pour les services de nettoyage standard, en profondeur, de déménagement, Airbnb et commercial."
    },
    "pageTitle": "Tarifs | Fresh Nest Co.",
    "hero": {
      "title": "Tarifs transparents",
      "subtitle": "Aucun frais caché. Aucun devis requis. Réservez en quelques minutes."
    },
    "services": {
      "heading": "Tarifs par service",
      "reference": "Prix indiqués pour une maison de 1 à 2 chambres, nettoyage ponctuel.",
      "commercial": "Devis personnalisé"
    },
    "frequency": {
      "heading": "Économisez avec un nettoyage récurrent",
      "cta": "Sélectionnez votre fréquence dans la calculatrice ci-dessous pour voir votre prix réduit."
    },
    "cta": {
      "heading": "Prêt à réserver ?",
      "button": "Réserver un nettoyage"
    },
    "price": {
      "range": "{{min}} $–{{max}} $"
    }
  },
  "lang": {
    "toggle": "EN",
    "current": "FR",
    "switchTo": "Passer à l'anglais"
  },
  "common": {
    "bookNow": "Réservez maintenant",
    "learnMore": "En savoir plus",
    "getQuote": "Obtenir un devis gratuit",
    "callUs": "Appelez-nous",
    "loading": "Chargement…",
    "error": "Une erreur s'est produite. Veuillez réessayer.",
    "required": "Obligatoire",
    "optional": "Facultatif",
    "verify": "Vérifier",
    "all": "Tout",
    "asc": "Croissant",
    "desc": "Décroissant",
    "search": "Rechercher",
    "languages": {
      "en": "EN",
      "fr": "FR",
      "enLong": "Anglais",
      "frLong": "Français"
    }
  },
  "airbnbPage": {
    "meta": {
      "title": "Nettoyage de remise en état Airbnb — Fresh Nest Co.",
      "description": "Nettoyage de remise en état Airbnb le jour même, de 11h à 15h. Changement de literie, documentation des dégâts et mise en scène pour les hôtes de la région du Saint-Laurent."
    },
    "hero": {
      "heading": "Nettoyage de remise en état Airbnb",
      "subhead": "Remises en état fiables le jour même, de 11h à 15h. Documentation photographique. Prêt pour les voyageurs, à chaque fois.",
      "cta": "Demander un compte commercial",
      "backLink": "← Retour aux services",
      "imgAlt": "Chambre en bord du Saint-Laurent prête pour les voyageurs Airbnb, avec literie fraîche"
    },
    "included": {
      "heading": "Ce qui est inclus dans chaque remise en état",
      "fullClean": "Nettoyage complet de la propriété — toutes les pièces",
      "linen": "Changement de literie et de serviettes",
      "toiletries": "Vérification du réapprovisionnement des articles de toilette",
      "photos": "Documentation photographique horodatée des dégâts",
      "staging": "Mise en scène prête pour les voyageurs",
      "window": "Terminé entre 11h et 15h"
    },
    "howItWorks": {
      "heading": "Comment ça fonctionne",
      "step1Title": "Réservez votre créneau",
      "step1Desc": "Sélectionnez votre date de remise en état. Nous confirmons la disponibilité le jour même dans les 2 heures.",
      "step2Title": "Nous nettoyons et documentons",
      "step2Desc": "Votre propriété est nettoyée, mise en scène et photographiée. Les photos vous sont envoyées le jour même.",
      "step3Title": "Les voyageurs arrivent prêts",
      "step3Desc": "L’enregistrement se déroule comme prévu. Sans stress de dernière minute."
    },
    "trust": {
      "heading": "Pourquoi les hôtes choisissent Fresh Nest",
      "stat1": "40+",
      "label1": "Remises en état effectuées par année",
      "stat2": "11h–15h",
      "label2": "Créneau de remise en état garanti",
      "stat3": "100 %",
      "label3": "Documentation photographique à chaque nettoyage"
    },
    "pricing": {
      "heading": "Tarifs transparents pour la remise en état",
      "starting": "À partir de {{min}} $ par remise en état",
      "volume": "Tarifs de volume disponibles pour 4+ remises en état par mois",
      "cta": "Voir les tarifs complets"
    },
    "form": {
      "heading": "Demander un compte commercial",
      "subhead": "Configurez une planification prioritaire, des tarifs de volume et des remises en état documentées pour votre propriété.",
      "firstName": "Prénom",
      "lastName": "Nom de famille",
      "email": "Adresse courriel",
      "phone": "Numéro de téléphone",
      "propertyName": "Nom ou adresse de la propriété",
      "monthlyTurnovers": "Nombre estimé de remises en état par mois",
      "preferredWindow": "Créneau de nettoyage préféré",
      "window11am3pm": "11h–15h (remise en état standard)",
      "windowFlexible": "Flexible",
      "windowMorning": "Matin (avant 12h)",
      "windowAfternoon": "Après-midi (12h–17h)",
      "notes": "Notes supplémentaires",
      "notesPlaceholder": "Adresse de la propriété, codes d’accès, emplacement de la literie ou instructions spéciales",
      "consent": "J’accepte de recevoir des mises à jour de service de Fresh Nest Co. (facultatif)",
      "submit": "Soumettre la demande",
      "submitting": "Envoi en cours…",
      "successHeading": "Merci, {{name}}.",
      "successBody": "Nous examinerons votre demande et vous contacterons dans les 24 heures pour configurer votre compte commercial."
    }
  },
  "servicePage": {
    "backLink": "← Retour aux services",
    "bookCta": "Réserver ce service",
    "bookBanner": "Prêt à réserver votre {{service}} ?",
    "bookBannerCta": "Réserver maintenant",
    "pricingHeading": "Tarifs transparents",
    "pricingStarting": "À partir de {{min}} $ pour un logement de 1–2 chambres",
    "pricingCta": "Voir les tarifs complets",
    "customPricingHeading": "Tarification personnalisée pour votre entreprise",
    "customPricingBody": "Les tarifs de nettoyage commercial sont adaptés à votre espace, votre équipe et votre horaire. Contactez-nous pour une évaluation gratuite sur place.",
    "customPricingCta": "Réserver une consultation",
    "overview": {
      "heading": "Nos services de nettoyage",
      "subhead": "Services de nettoyage professionnels et bilingues à Cornwall, Akwesasne, Snye QC et dans les communautés environnantes."
    },
    "common": {
      "includedHeading": "Ce qui est inclus",
      "howItWorksHeading": "Comment ça fonctionne",
      "trustHeading": "Pourquoi choisir Fresh Nest",
      "step1Title": "Réservez en ligne",
      "step1Desc": "Choisissez votre service, votre date et la taille de votre maison. Confirmation en moins de 2 minutes.",
      "step2Title": "Nous nettoyons",
      "step2Desc": "Votre préposé attitré arrive à l'heure et suit une liste de vérification cohérente.",
      "step3Title": "Vous profitez",
      "step3Desc": "Rentrez chez vous dans un espace frais. Écrivez-nous si quelque chose doit être retouché.",
      "trust1Stat": "4,9 / 5",
      "trust1Label": "Note Google de clients vérifiés",
      "trust2Stat": "100 %",
      "trust2Label": "Personnel assuré, cautionné et vérifié",
      "trust3Stat": "FR / EN",
      "trust3Label": "Service bilingue dans toute notre zone de service"
    },
    "standard": {
      "hero": {
        "heading": "Nettoyage régulier",
        "subhead": "Un nettoyage régulier et constant pour garder votre maison fraîche. Aucune préparation requise.",
        "imgAlt": "Salon lumineux et propre avec sol aspiré, canapé et lumière naturelle"
      },
      "included": {
        "floors": "Aspiration et lavage de tous les planchers",
        "kitchen": "Comptoirs, surfaces et évier de cuisine",
        "bathrooms": "Nettoyage et désinfection des salles de bain",
        "dusting": "Dépoussiérage des surfaces et zones accessibles",
        "trash": "Vidage des poubelles et bacs de recyclage",
        "beds": "Faire les lits (avec votre literie propre)"
      }
    },
    "deep": {
      "hero": {
        "heading": "Grand nettoyage",
        "subhead": "Une remise à zéro complète qui atteint les endroits que le nettoyage régulier ne touche jamais.",
        "imgAlt": "Cuisine immaculée avec appareils électroménagers étincelants de propreté, comptoirs et dosseret en tuiles"
      },
      "included": {
        "everything": "Tout ce qui est inclus dans notre nettoyage régulier",
        "appliances": "Intérieur du four, du réfrigérateur et du micro-ondes",
        "cabinets": "Intérieur et extérieur des armoires de cuisine",
        "baseboards": "Plinthes et cadres de portes",
        "windowSills": "Rebords de fenêtres, rails et bords",
        "fixtures": "Luminaires, ventilateurs de plafond et grilles de ventilation",
        "grout": "Récurage des joints dans les salles de bain et la cuisine"
      }
    },
    "moveout": {
      "hero": {
        "heading": "Nettoyage de déménagement",
        "subhead": "Laissez votre ancienne maison impeccable pour récupérer votre dépôt — et passer à autre chose sereinement.",
        "imgAlt": "Salle à manger vide et impeccable montrant des planchers de bois franc propres et de grandes fenêtres"
      },
      "included": {
        "allRooms": "Nettoyage complet de toutes les pièces et placards",
        "appliances": "Intérieur de tous les appareils (four, réfrigérateur, lave-vaisselle)",
        "cupboards": "Intérieur de toutes les armoires, tiroirs et cabinets",
        "behindAppliances": "Nettoyage derrière et sous les appareils",
        "windowsDoorsFrames": "Fenêtres, cadres de portes et plinthes",
        "checklistWalkthrough": "Liste de vérification finale incluse"
      }
    },
    "postconstruction": {
      "hero": {
        "heading": "Nettoyage post-construction",
        "subhead": "La poussière de construction est partout — nous l'éliminons en toute sécurité avant votre emménagement.",
        "imgAlt": "Espace moderne fraîchement rénové et exempt de poussière, avec des fenêtres propres et des finitions soignées"
      },
      "included": {
        "dustRemoval": "Élimination de la fine poussière sur toutes les surfaces",
        "hepaVacuum": "Aspiration HEPA dans toute la propriété",
        "adhesiveRemoval": "Élimination des résidus d'adhésif et d'étiquettes",
        "windows": "Nettoyage des vitres et surfaces vitrées (intérieur)",
        "vents": "Grilles de ventilation, luminaires et prises électriques",
        "debrisRemoval": "Élimination finale des débris et emballages"
      }
    },
    "commercial": {
      "hero": {
        "heading": "Nettoyage commercial",
        "subhead": "Nettoyage professionnel et constant pour les bureaux, commerces et installations de la région.",
        "imgAlt": "Espace de travail de bureau moderne et propre avec des bureaux bien rangés et de grandes fenêtres"
      },
      "included": {
        "officeSpaces": "Nettoyage des bureaux et espaces de travail",
        "washrooms": "Désinfection et réapprovisionnement des salles de bain",
        "commonAreas": "Aires communes, hall d'entrée et salles de repos",
        "floorCare": "Aspiration, lavage et entretien des planchers",
        "wasteRemoval": "Enlèvement des ordures et recyclage",
        "flexibleScheduling": "Disponibilité en dehors des heures et les fins de semaine"
      }
    }
  },
  "thankYou": {
    "meta": {
      "title": "Réservation confirmée — Fresh Nest Co.",
      "description": "Votre réservation de nettoyage Fresh Nest Co. est confirmée. Consultez votre courriel pour les détails."
    },
    "heading": "C'est réservé, {{name}} !",
    "subhead": "Votre réservation est confirmée. Un courriel de confirmation est en route vers {{email}}.",
    "genericHeading": "Votre réservation est confirmée !",
    "genericSubhead": "Consultez votre boîte de réception pour les détails de votre réservation.",
    "summaryHeading": "Résumé de la réservation",
    "referenceLabel": "Numéro de référence",
    "serviceLabel": "Service",
    "dateLabel": "Date préférée",
    "frequencyLabel": "Fréquence",
    "nextHeading": "La suite",
    "step1Title": "Courriel de confirmation envoyé",
    "step1Desc": "Vérifiez votre boîte de réception — les détails de votre réservation sont en route.",
    "step2Title": "Nous confirmons votre préposé",
    "step2Desc": "Nous assignerons votre préposé et confirmerons les détails dans les 24 heures.",
    "step3Title": "Votre préposé arrive",
    "step3Desc": "Le jour de votre réservation, votre préposé arrive à l'heure, prêt à travailler.",
    "ctaServices": "Explorer nos services",
    "ctaHome": "Retour à l'accueil"
  },
  "a11y": {
    "navMain": "Navigation principale",
    "homeLink": "Fresh Nest Co. — Accueil",
    "callUs": "Appelez Fresh Nest Co. au {{phone}}",
    "navMobile": "Navigation mobile",
    "footerServices": "Liens de services du pied de page",
    "footerLocations": "Liens des zones de service du pied de page",
    "footerCompany": "Liens de l'entreprise du pied de page"
  },
  "cookieBanner": {
    "message": "Nous utilisons des cookies pour analyser le trafic du site et améliorer votre expérience. En cliquant sur 'Accepter', vous consentez à notre utilisation des cookies.",
    "accept": "Accepter",
    "decline": "Refuser",
    "preferences": "Préférences de cookies"
  },
  "admin": {
    "meta": {
      "title": "Portail Admin — Fresh Nest Co.",
      "description": "Tableau de bord administratif pour la gestion des réservations."
    },
    "login": {
      "heading": "Portail Admin",
      "subhead": "Connectez-vous pour gérer les réservations, les clients et les indicateurs.",
      "button": "Se connecter avec Google",
      "errorTitle": "Accès refusé",
      "errorMessage": "Votre compte ({{email}}) n'est pas autorisé à accéder à ce portail d'administration. Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le développeur ou utiliser un compte autorisé.",
      "tryAnother": "Essayer un autre compte",
      "backToHome": "Retour à l'accueil",
      "authFailed": "Échec de l'authentification. Veuillez réessayer."
    },
    "dashboard": {
      "title": "Tableau de bord Admin",
      "welcome": "Bon retour, {{name}}",
      "signOut": "Se déconnecter",
      "avatarAlt": "Avatar de l'utilisateur",
      "fallbackName": "Administrateur",
      "stats": {
        "total": "Total des réservations",
        "pending": "En attente de confirmation",
        "confirmed": "Horaire confirmé"
      },
      "filters": {
        "status": "Statut de réservation",
        "service": "Type de service",
        "language": "Langue",
        "sortBy": "Trier par",
        "sortOrder": "Ordre de tri",
        "search": "Rechercher par nom, courriel, téléphone ou adresse..."
      },
      "table": {
        "client": "Détails du client",
        "date": "Date souhaitée",
        "service": "Service",
        "status": "Statut",
        "assigned": "Nettoyeur assigné",
        "noResults": "Aucune réservation ne correspond à vos critères de recherche et de filtrage."
      },
      "details": {
        "unassigned": "Non assigné",
        "address": "Adresse du service",
        "property": "Spécifications de la propriété",
        "frequency": "Fréquence",
        "pets": "Animaux de compagnie",
        "petsYes": "Oui (Utiliser des produits sans danger pour les animaux)",
        "petsNo": "Non",
        "assignHeader": "Gérer l'horaire et le statut",
        "customOption": "Personnalisé / Autre...",
        "customPlaceholder": "Saisir le nom du nettoyeur",
        "customCleaner": "Nom du nettoyeur personnalisé",
        "save": "Enregistrer",
        "addons": "Options / Add-Ons demandés",
        "notes": "Instructions spéciales",
        "noAddons": "Aucune option supplémentaire demandée.",
        "noNotes": "Aucune instruction spéciale fournie.",
        "createdAt": "Soumis le",
        "leadSource": "Source de piste marketing",
        "referralCode": "Code de parrainage client",
        "referredBy": "Parrainé par le code",
        "workflow": "Actions de flux de travail",
        "isAirbnb": "Liste de contrôle Airbnb",
        "photoConf": "Confirmation photo requise",
        "phone": "Téléphone",
        "rooms": "Pièces",
        "roomsValue": "{{bedrooms}} ch. / {{bathrooms}} SdB",
        "size": "Superficie",
        "sqft": "{{size}} pi²"
      },
      "tabs": {
        "bookings": "Gestion des réservations",
        "analytics": "Analyses marketing"
      },
      "analytics": {
        "title": "Performance des sources de pistes marketing",
        "rangeLabel": "Période",
        "ranges": {
          "all": "Tout temps",
          "30days": "30 derniers jours",
          "90days": "90 derniers jours",
          "ytd": "Depuis le début de l'année",
          "month": "Ce mois-ci"
        },
        "stats": {
          "bookingsCount": "Réservations estimées",
          "estimatedRevenue": "Revenu estimé",
          "avgBookingValue": "Valeur moyenne de réservation",
          "referredBookings": "Réservations parrainées"
        },
        "charts": {
          "leadDistribution": "Distribution des sources de pistes (Réservations)",
          "monthlyTrend": "Tendances mensuelles des revenus et réservations",
          "revenue": "Revenu ($)",
          "bookings": "Nombre de réservations"
        },
        "table": {
          "channel": "Source de piste / Canal",
          "volume": "Volume de réservations",
          "revenue": "Revenu estimé",
          "avgValue": "Valeur moyenne de réservation",
          "share": "Part de conversion"
        }
      },
      "leads": {
        "organic": "Recherche organique",
        "google": "Publicité Google",
        "referral": "Programme de parrainage",
        "facebook": "Publicité Facebook",
        "direct": "Trafic direct"
      }
    }
  },
  "blog": {
    "meta": {
      "title": "Blogue de Fresh Nest Co. — Conseils de Nettoyage",
      "description": "Lisez nos guides de prix, listes de déménagement et astuces de nettoyage à Cornwall et Akwesasne."
    },
    "pageHeading": "Le Blogue Fresh Nest",
    "pageSubhead": "Conseils saisonniers, guides de nettoyage et astuces d’entretien résidentiel pour nos communautés.",
    "readMore": "Lire la suite",
    "publishedAt": "Publié le {{date}}",
    "writtenBy": "Par {{author}}",
    "noPosts": "Aucun article trouvé.",
    "backToBlog": "← Retour au blogue",
    "metaPost": "{{title}} | Blogue Fresh Nest"
  },
  "referrals": {
    "promoCodeLabel": "Code de parrainage (Optionnel)",
    "promoPlaceholder": "Entrez le code de votre ami",
    "promoValid": "Code de parrainage valide ! Réduction de 20 $ appliquée.",
    "promoInvalid": "Code de parrainage invalide. Veuillez vérifier.",
    "promoChecking": "Vérification du code...",
    "referralShareTitle": "Partagez l'amour Fresh Nest",
    "referralShareDesc": "Offrez 20 $ de rabais à vos amis sur leur premier nettoyage. Lorsqu'ils réservent, vous recevez un rabais de 20 $ !",
    "copyLink": "Copier le lien de parrainage",
    "linkCopied": "Lien copié dans le presse-papiers !",
    "referredBy": "Parrainé par {{name}}"
  }
}

```

---

## File: src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { font-family: 'DM Sans', sans-serif; scroll-behavior: smooth; }
  body { @apply bg-warm-white text-charcoal font-normal; }
  h1.font-display, h2.font-display { @apply font-bold; }
}

```

---

## File: src/lib/data/blogData.ts

```typescript
import { BlogPost } from '@/types'

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'cleaning-cost-cornwall',
    title: {
      en: 'How Much Does House Cleaning Cost in Cornwall, ON?',
      fr: 'Combien Coûte le Nettoyage Résidentiel à Cornwall, ON ?'
    },
    description: {
      en: 'A guide to standard house cleaning rates, deep cleans, and add-on pricing in the Cornwall region.',
      fr: 'Un guide des tarifs de nettoyage résidentiel standard, en profondeur et des options à Cornwall.'
    },
    author: {
      en: 'Lauren S.',
      fr: 'Lauren S.'
    },
    publishedAt: '2026-06-10',
    readTime: {
      en: '4 min read',
      fr: '4 min de lecture'
    },
    image: '/images/standard-hero.jpg',
    content: {
      en: `
Finding reliable, professional home cleaning in Cornwall, Ontario, shouldn't be a guessing game. Understanding the typical cost of house cleaning services can help you budget correctly and choose the right option for your lifestyle.

### Standard Rates in Cornwall

Most cleaning services in the Eastern Ontario region charge either a flat rate based on the size of the home or an hourly rate.
- **Flat Rates**: Typically range from **$150 to $250** for a standard 3-bedroom, 2-bathroom house.
- **Hourly Rates**: Usually range between **$35 and $55 per hour** per cleaner.

### Deep Cleaning vs. Standard Cleaning

When scheduling your first appointment or seasonal resets, it helps to understand the difference:
1. **Standard Clean**: Perfect for weekly or bi-weekly maintenance. Includes dusting, vacuuming, mopping, and wiping countertops.
2. **Deep Clean**: Requires additional time to tackle built-up grime. Includes baseboards, inside appliances, and detailing tile grout. This typically costs **$50 to $100 more** than a standard clean.

### Add-on Additions

Many agencies offer custom add-ons to fit your specific home:
- **Oven cleaning**: $30 - $45
- **Fridge interior**: $25 - $40
- **Window interior cleaning**: $5 per window

At Fresh Nest Co., we provide transparent instant quotes so you know exactly what to expect before booking. Try our online quote tool today!
`,
      fr: `
Trouver un service de nettoyage résidentiel fiable et professionnel à Cornwall, en Ontario, ne devrait pas être un mystère. Comprendre les coûts typiques des services de nettoyage peut vous aider à planifier votre budget et à choisir la formule adaptée à votre mode de vie.

### Tarifs Standards à Cornwall

La plupart des services de nettoyage de la région de l'Est de l'Ontario facturent soit un tarif forfaitaire basé sur la taille de la maison, soit un tarif horaire.
- **Tarifs Forfaitaires** : Généralement situés entre **150 $ et 250 $** pour une maison standard de 3 chambres et 2 salles de bain.
- **Tarifs Horaires** : En moyenne entre **35 $ et 55 $ de l'heure** par nettoyeur.

### Nettoyage Standard vs. Nettoyage en Profondeur

Lors de votre premier rendez-vous ou d'un nettoyage saisonnier, il est utile de faire la distinction :
1. **Nettoyage Standard** : Idéal pour l'entretien hebdomadaire ou bihebdomadaire. Comprend l'époussetage, l'aspirateur, la vadrouille et le nettoyage des comptoirs.
2. **Nettoyage en Profondeur** : Nécessite plus de temps pour éliminer la saleté accumulée. Comprend les plinthes, l'intérieur des électroménagers et le récurage des tuiles. Cela coûte généralement **50 $ à 100 $ de plus** qu'un nettoyage standard.

### Suppléments Options

De nombreuses agences proposent des services additionnels personnalisés :
- **Nettoyage du four** : 30 $ - 45 $
- **Intérieur du réfrigérateur** : 25 $ - 40 $
- **Lavage des vitres intérieures** : 5 $ par fenêtre

Chez Fresh Nest Co., nous offrons des devis instantanés et transparents afin que vous sachiez exactement à quoi vous attendre avant de réserver. Essayez notre outil en ligne dès aujourd'hui !
`
    }
  },
  {
    slug: 'move-out-checklist-cornwall',
    title: {
      en: 'The Ultimate Move-Out Cleaning Checklist: Cornwall Edition',
      fr: 'La Liste de Nettoyage de Déménagement Ultime : Édition Cornwall'
    },
    description: {
      en: 'Don’t lose your security deposit. Follow our detailed checklist to leave your rented home sparkling.',
      fr: 'Ne perdez pas votre dépôt de garantie. Suivez notre guide détaillé pour rendre votre logement étincelant.'
    },
    author: {
      en: 'Lauren S.',
      fr: 'Lauren S.'
    },
    publishedAt: '2026-06-08',
    readTime: {
      en: '5 min read',
      fr: '5 min de lecture'
    },
    image: '/images/moveout-hero.jpg',
    content: {
      en: `
Moving can be stressful. Between packing boxes, coordinating movers, and setting up utilities in your new home, cleaning your old place is often the last thing you want to do. However, leaving your home spotless is crucial for securing your security deposit refund or attracting buyers.

### 1. The Kitchen (The Most Critical Area)
Landlords and new owners pay closest attention here:
- **Appliances**: Clean the inside and outside of the oven, microwave, and refrigerator. Pull them out and clean the dust behind them.
- **Cabinets**: Wipe down all shelves and cabinet doors, removing any crumbs and grease splatters.
- **Sinks**: Scrub and disinfect the sink and fixtures.

### 2. Bathrooms
- **Tub & Shower**: Remove all soap scum and limescale buildup from tiles, tub, and glass doors.
- **Toilet**: Disinfect the bowl, base, and tank.
- **Vanity**: Wipe drawers, clean the mirror, and polish faucets.

### 3. Throughout the House
- **Walls & Baseboards**: Wipe off scuffs, dust baseboards, and clean light switches.
- **Windows**: Wash interior window glass, sills, and tracks.
- **Floors**: Vacuum all carpets and mop hardwood or tile floors.

If you don't have the time or energy to tackle this checklist yourself, the team at Fresh Nest Co. is here to help. Our move-out cleaning services are tailored to meet landlord inspection standards.
`,
      fr: `
Déménager est une source de stress importante. Entre les boîtes à emballer, la coordination des déménageurs et l'activation des services dans votre nouveau domicile, le nettoyage de votre ancien logement est souvent la dernière tâche dont vous voulez vous occuper. Pourtant, rendre un espace impeccable est essentiel pour récupérer votre dépôt ou attirer des acheteurs.

### 1. La Cuisine (La zone la plus importante)
Les propriétaires et les acheteurs y portent une attention particulière :
- **Électroménagers** : Nettoyez l'intérieur et l'extérieur du four, du micro-ondes et du réfrigérateur. Tirez-les pour nettoyer la poussière accumulée derrière.
- **Armoires** : Essuyez toutes les étagères et portes, en enlevant les miettes et les taches de graisse.
- **Évier** : Récurez et désinfectez l'évier ainsi que la robinetterie.

### 2. Salles de Bain
- **Baignoire et Douche** : Éliminez les résidus de savon et le calcaire des tuiles, de la baignoire et des portes vitrées.
- **Toilette** : Désinfectez la cuvette, la base et le réservoir.
- **Meuble-lavabo** : Nettoyez les tiroirs, le miroir et polissez les robinets.

### 3. Dans Toute la Maison
- **Murs et Plinthes** : Enlevez les traces de frottement, époussetez les plinthes et nettoyez les interrupteurs.
- **Fenêtres** : Nettoyez les vitres intérieures, les cadres et les rails.
- **Sols** : Passez l'aspirateur sur tous les tapis et nettoyez les planchers de bois ou de céramique.

Si vous manquez de temps ou d'énergie, l'équipe de Fresh Nest Co. est à votre service. Nos prestations de nettoyage de déménagement sont conçues pour satisfaire aux critères d'inspection les plus stricts.
`
    }
  },
  {
    slug: 'commercial-cleaning-akwesasne',
    title: {
      en: 'Commercial Cleaning Services for Akwesasne Businesses',
      fr: "Services de Nettoyage Commercial pour les Entreprises d'Akwesasne"
    },
    description: {
      en: 'Keep your office or retail space professional and clean. We serve Akwesasne and Cornwall island regions.',
      fr: 'Maintenez des locaux propres et professionnels. Nous desservons Akwesasne et les îles locales.'
    },
    author: {
      en: 'Dev Team',
      fr: 'Équipe Dev'
    },
    publishedAt: '2026-06-05',
    readTime: {
      en: '3 min read',
      fr: '3 min de lecture'
    },
    image: '/images/commercial-hero.jpg',
    content: {
      en: `
A clean work environment is directly linked to employee productivity and client satisfaction. For local businesses in Akwesasne, Cornwall Island, and surrounding regions, having a trusted local cleaning partner makes all the difference.

### First Impressions Matter
When clients or business partners walk into your retail shop, medical clinic, or corporate office, they instantly form an impression. Clean carpets, polished glass, and dust-free desks signal professionalism and care.

### Health and Productivity
Regular sanitizing of high-touch surfaces like doorknobs, keyboards, and lunchroom counters reduces the spread of seasonal illnesses, keeping your workforce active and healthy.

### Custom Islands Services
We recognize the unique geography of our community. Unlike big franchises, Fresh Nest Co. explicitly services Cornwall Island (Kawehno:ke), Snye (Tsi Snaihne), and St. Regis (Kana:takon) areas. We schedule cleanings around your business hours (morning, evening, or weekends) to minimize disruption.

Contact us today to set up a custom recurring cleaning schedule for your commercial space.
`,
      fr: `
Un environnement de travail propre est directement lié à la productivité des employés et à la satisfaction des clients. Pour les entreprises locales d'Akwesasne, de Cornwall Island et des régions environnantes, avoir un partenaire de confiance local fait toute la différence.

### L'Importance de la Première Impression
Lorsque des clients ou des partenaires franchissent la porte de votre magasin, de votre clinique ou de votre bureau, ils se font immédiatement une opinion. Des tapis propres, des vitres impeccables et des bureaux dépoussiérés témoignent de votre professionnalisme.

### Santé et Productivité
La désinfection régulière des surfaces fréquemment touchées, comme les poignées de porte, les claviers et les tables de cafétéria, réduit la propagation des maladies saisonnières, préservant ainsi la santé et l'efficacité de vos équipes.

### Services Adaptés aux Îles Locales
Nous comprenons la géographie unique de notre communauté. Contrairement aux grandes franchises nationales, Fresh Nest Co. dessert explicitement Cornwall Island (Kawehno:ke), Snye (Tsi Snaihne) et St. Regis (Kana:takon). Nous organisons nos interventions en fonction de vos heures d'ouverture pour limiter les interruptions.

Contactez-nous dès aujourd'hui pour mettre en place un plan d'entretien sur mesure pour vos locaux commerciaux.
`
    }
  },
  {
    slug: 'eco-friendly-products',
    title: {
      en: 'Eco-Friendly Cleaning Products: What We Use and Why',
      fr: 'Produits de Nettoyage Écologiques : Ce que Nous Utilisons et Pourquoi'
    },
    description: {
      en: 'Learn about our pet-safe, child-safe, and environmentally conscious cleaning methods.',
      fr: 'Découvrez nos méthodes de nettoyage respectueuses de l’environnement, des enfants et des animaux.'
    },
    author: {
      en: 'Lauren S.',
      fr: 'Lauren S.'
    },
    publishedAt: '2026-06-01',
    readTime: {
      en: '3 min read',
      fr: '3 min de lecture'
    },
    image: '/images/deep-hero.jpg',
    content: {
      en: `
At Fresh Nest Co., one of our founding principles is promoting a healthy living space without introducing harsh chemical residues. Our choice of eco-friendly products ensures that your family, your pets, and our local ecosystem remain safe.

### Why Green Cleaning?
Traditional cleaners often contain harsh chemicals like ammonia, chlorine, and synthetic fragrances. While they sanitize, they also leave behind volatile organic compounds (VOCs) that irritate eyes, skin, and lungs—especially in children and pets who spend time close to floors.

### What We Use
We source biodegradable, non-toxic products that achieve professional-grade results:
- **Plant-based surfactants**: Break down dirt and grease naturally without toxic residues.
- **Natural essential oils**: Leave a light, clean fragrance (lavender, lemon, or eucalyptus) instead of synthetic perfumes.
- **Microfiber technology**: Captures 99% of dust and bacteria physically, reducing the amount of liquid cleaner needed.

### Pet-Safe and Child-Safe
Our products contain no phosphates or carcinogens, meaning your toddlers and four-legged companions can safely roam the house immediately after our team finishes cleaning.

Ask us about our green cleaning options when scheduling your next booking!
`,
      fr: `
Chez Fresh Nest Co., l'un de nos principes fondateurs est de favoriser un espace de vie sain sans laisser de résidus chimiques nocifs. Notre choix de produits écologiques garantit la sécurité de votre famille, de vos animaux et de notre écosystème local.

### Pourquoi le Nettoyage Écologique ?
Les nettoyants traditionnels contiennent souvent des substances chimiques agressives comme l'ammoniac, le chlore et des parfums synthétiques. S'ils désinfectent, ils libèrent également des composés organiques volatils (COV) qui irritent les yeux, la peau et les poumons—particulièrement chez les enfants et les animaux.

### Ce que Nous Utilisons
Nous choisissons des produits biodégradables et non toxiques qui offrent des résultats professionnels :
- **Tensioactifs d'origine végétale** : Éliminent la saleté et la graisse naturellement.
- **Huiles essentielles naturelles** : Laissent un parfum léger et frais (lavende, citron ou eucalyptus) sans produits synthétiques.
- **Technologie microfibre** : Retient 99 % de la poussière et des bactéries, limitant la quantité de nettoyant liquide requise.

### Sécuritaire pour les Enfants et les Animaux
Nos produits ne contiennent aucun phosphate ni cancérogène, ce qui permet à vos tout-petits et à vos animaux de se déplacer en toute sécurité dès la fin de notre prestation.

Demandez notre option écologique lors de votre prochaine réservation !
`
    }
  }
]

```

---

## File: src/lib/data/galleryData.ts

```typescript
import type { ServiceType } from '@/types'

export interface GalleryPair {
  id: string
  serviceKey: ServiceType
  captionKey: string
  featured: boolean
  beforeSrc: string | null
  afterSrc: string | null
}

// Phase 2: all beforeSrc/afterSrc were null (placeholders).
// E27 (Phase 4 photography pass) sets real paths — no component changes needed.
export const GALLERY_PAIRS: GalleryPair[] = [
  {
    id: 'kitchen-deep',
    serviceKey: 'deep',
    captionKey: 'gallery.pairs.kitchenDeep.caption',
    featured: true,
    beforeSrc: '/images/gallery/kitchen-deep-before.png',
    afterSrc: '/images/gallery/kitchen-deep-after.png',
  },
  {
    id: 'airbnb-turnover',
    serviceKey: 'airbnb',
    captionKey: 'gallery.pairs.airbnbTurnover.caption',
    featured: true,
    beforeSrc: '/images/gallery/airbnb-before.png',
    afterSrc: '/images/gallery/airbnb-after.png',
  },
  {
    id: 'bathroom-deep',
    serviceKey: 'deep',
    captionKey: 'gallery.pairs.bathroomDeep.caption',
    featured: true,
    beforeSrc: '/images/gallery/bathroom-before.png',
    afterSrc: '/images/gallery/bathroom-after.png',
  },
  {
    id: 'moveout-full',
    serviceKey: 'moveout',
    captionKey: 'gallery.pairs.moveoutFull.caption',
    featured: false,
    beforeSrc: '/images/gallery/moveout-before.png',
    afterSrc: '/images/gallery/moveout-after.png',
  },
  {
    id: 'postconstruction',
    serviceKey: 'postconstruction',
    captionKey: 'gallery.pairs.postconstruction.caption',
    featured: false,
    beforeSrc: '/images/gallery/postconstruction-before.png',
    afterSrc: '/images/gallery/postconstruction-after.png',
  },
]

export const FEATURED_PAIRS = GALLERY_PAIRS.filter(p => p.featured)

```

---

## File: src/lib/data/locationData.ts

```typescript
import type { ServiceType } from '@/types'

export interface LocationConfig {
  slug: string
  headingKey: string
  subheadKey: string
  descriptionKey: string
  pageTitleKey: string
  metaDescKey: string
  mapQuery: string
  calloutKey?: string
  services: ServiceType[]
}

export const CORNWALL_ON: LocationConfig = {
  slug: 'cornwall-on',
  headingKey: 'locations.cornwallOn.heading',
  subheadKey: 'locations.cornwallOn.subhead',
  descriptionKey: 'locations.cornwallOn.description',
  pageTitleKey: 'locations.cornwallOn.pageTitle',
  metaDescKey: 'locations.cornwallOn.metaDesc',
  mapQuery: 'Cornwall+Ontario+Canada',
  services: ['standard', 'deep', 'moveout', 'postconstruction', 'airbnb', 'commercial'],
}

export const AKWESASNE: LocationConfig = {
  slug: 'akwesasne',
  headingKey: 'locations.akwesasne.heading',
  subheadKey: 'locations.akwesasne.subhead',
  descriptionKey: 'locations.akwesasne.description',
  pageTitleKey: 'locations.akwesasne.pageTitle',
  metaDescKey: 'locations.akwesasne.metaDesc',
  mapQuery: 'Cornwall+Island+Akwesasne+Ontario',
  calloutKey: 'locations.akwesasne.islandNote',
  services: ['standard', 'deep', 'moveout', 'postconstruction'],
}

export const SNYE_QC: LocationConfig = {
  slug: 'snye-qc',
  headingKey: 'locations.snyeQc.heading',
  subheadKey: 'locations.snyeQc.subhead',
  descriptionKey: 'locations.snyeQc.description',
  pageTitleKey: 'locations.snyeQc.pageTitle',
  metaDescKey: 'locations.snyeQc.metaDesc',
  mapQuery: 'Snye+Quebec+Akwesasne',
  calloutKey: 'locations.snyeQc.borderNote',
  services: ['standard', 'deep', 'moveout'],
}

export const LONG_SAULT: LocationConfig = {
  slug: 'long-sault',
  headingKey: 'locations.longSault.heading',
  subheadKey: 'locations.longSault.subhead',
  descriptionKey: 'locations.longSault.description',
  pageTitleKey: 'locations.longSault.pageTitle',
  metaDescKey: 'locations.longSault.metaDesc',
  mapQuery: 'Long+Sault+Ontario+Canada',
  services: ['standard', 'deep', 'moveout', 'airbnb'],
}

export const MORRISBURG: LocationConfig = {
  slug: 'morrisburg',
  headingKey: 'locations.morrisburg.heading',
  subheadKey: 'locations.morrisburg.subhead',
  descriptionKey: 'locations.morrisburg.description',
  pageTitleKey: 'locations.morrisburg.pageTitle',
  metaDescKey: 'locations.morrisburg.metaDesc',
  mapQuery: 'Morrisburg+Ontario+Canada',
  services: ['standard', 'deep', 'moveout'],
}

export const ALL_LOCATIONS: LocationConfig[] = [
  CORNWALL_ON,
  AKWESASNE,
  SNYE_QC,
  LONG_SAULT,
  MORRISBURG,
]

```

---

## File: src/lib/data/reviewsData.ts

```typescript
export interface Review {
  id: string
  name: string
  location: string
  language: 'en' | 'fr'
  rating: number
  text: string
}

export const STATIC_REVIEWS: Review[] = [
  {
    id: 'linda-m',
    name: 'Linda M.',
    location: 'Cornwall, ON',
    language: 'en',
    rating: 5,
    text: "Same cleaner every visit, exactly on schedule. I was nervous letting someone into my home, but Fresh Nest put me at ease right away. Highly recommend.",
  },
  {
    id: 'dean-g',
    name: 'Dean G.',
    location: 'South Glengarry — Airbnb Host',
    language: 'en',
    rating: 5,
    text: "Our Airbnb is turned over perfectly every time, always within the window. Guest review scores have jumped since we switched. Worth every cent.",
  },
  {
    id: 'marie-claire-b',
    name: 'Marie-Claire B.',
    location: 'Cornwall, ON',
    language: 'fr',
    rating: 5,
    text: "Service impeccable du début à la fin. Le même nettoyeur à chaque visite, toujours ponctuel. Je n'aurais pas pu demander mieux.",
  },
  {
    id: 'emilie-t',
    name: 'Émilie T.',
    location: 'Snye, QC',
    language: 'fr',
    rating: 5,
    text: "Je suis de l'autre côté de la rivière et ils font quand même le déplacement ! Produits écologiques, équipe souriante. Cinq étoiles sans hésitation.",
  },
  {
    id: 'james-a',
    name: 'James A.',
    location: 'Akwesasne',
    language: 'en',
    rating: 5,
    text: "They actually came to the island — no other service in the area would. Deep clean before a big family gathering. Spotless result.",
  },
]

```

---

## File: src/lib/data/serviceData.ts

```typescript
import type { QuoteServiceType } from '@/lib/utils/quotePricing'

export interface ServiceConfig {
  key: 'standard' | 'deep' | 'moveout' | 'postconstruction' | 'commercial'
  route: string
  pricingKey?: QuoteServiceType
  includedItems: readonly string[]
  isCommercial: boolean
}

const standard: ServiceConfig = {
  key: 'standard',
  route: 'standard-cleaning',
  pricingKey: 'standard',
  includedItems: ['floors', 'kitchen', 'bathrooms', 'dusting', 'trash', 'beds'],
  isCommercial: false,
}

const deep: ServiceConfig = {
  key: 'deep',
  route: 'deep-cleaning',
  pricingKey: 'deep',
  includedItems: ['everything', 'appliances', 'cabinets', 'baseboards', 'windowSills', 'fixtures', 'grout'],
  isCommercial: false,
}

const moveout: ServiceConfig = {
  key: 'moveout',
  route: 'move-out-cleaning',
  pricingKey: 'moveout',
  includedItems: ['allRooms', 'appliances', 'cupboards', 'behindAppliances', 'windowsDoorsFrames', 'checklistWalkthrough'],
  isCommercial: false,
}

const postconstruction: ServiceConfig = {
  key: 'postconstruction',
  route: 'post-construction',
  pricingKey: 'postconstruction',
  includedItems: ['dustRemoval', 'hepaVacuum', 'adhesiveRemoval', 'windows', 'vents', 'debrisRemoval'],
  isCommercial: false,
}

const commercial: ServiceConfig = {
  key: 'commercial',
  route: 'commercial-cleaning',
  includedItems: ['officeSpaces', 'washrooms', 'commonAreas', 'floorCare', 'wasteRemoval', 'flexibleScheduling'],
  isCommercial: true,
}

export const SERVICE_CONFIGS: ServiceConfig[] = [
  standard, deep, moveout, postconstruction, commercial,
]

export const SERVICE_CONFIG_MAP: Record<ServiceConfig['key'], ServiceConfig> = {
  standard, deep, moveout, postconstruction, commercial,
}

```

---

## File: src/lib/firebase/analytics.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAnalytics, logEvent, setAnalyticsCollectionEnabled } from 'firebase/analytics'
import {
  initializeAnalytics,
  revokeAnalytics,
  logCustomEvent,
  logBookingStarted,
  logBookingCompleted,
  logQuoteCalculated,
  logPhoneClicked,
  logLanguageToggled,
  _resetForTesting,
} from './analytics'

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  logEvent: vi.fn(),
  setAnalyticsCollectionEnabled: vi.fn(),
}))

vi.mock('./firebase', () => ({
  default: {},
}))

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _resetForTesting()
  })

  it('initializeAnalytics initializes analytics', () => {
    initializeAnalytics()
    expect(getAnalytics).toHaveBeenCalled()
  })

  it('revokeAnalytics disables collection', () => {
    initializeAnalytics()
    revokeAnalytics()
    expect(setAnalyticsCollectionEnabled).toHaveBeenCalledWith(expect.anything(), false)
  })

  it('logCustomEvent logs event', () => {
    initializeAnalytics()
    logCustomEvent('test_event', { prop: 1 })
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'test_event', { prop: 1 })
  })

  it('logBookingStarted logs booking_started', () => {
    initializeAnalytics()
    logBookingStarted()
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'booking_started', undefined)
  })

  it('logBookingCompleted logs booking_completed', () => {
    initializeAnalytics()
    logBookingCompleted('Standard Cleaning', 100)
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'booking_completed', {
      service_type: 'Standard Cleaning',
      value: 100,
    })
  })

  it('logQuoteCalculated logs quote_calculated', () => {
    initializeAnalytics()
    logQuoteCalculated('Deep Cleaning', 200)
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'quote_calculated', {
      service_type: 'Deep Cleaning',
      value: 200,
    })
  })

  it('logPhoneClicked logs phone_clicked', () => {
    initializeAnalytics()
    logPhoneClicked('navbar')
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'phone_clicked', { location: 'navbar' })
  })

  it('logLanguageToggled logs language_toggled', () => {
    initializeAnalytics()
    logLanguageToggled('fr')
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'language_toggled', { language: 'fr' })
  })
})

```

---

## File: src/lib/firebase/analytics.ts

```typescript
import { getAnalytics, logEvent, Analytics, setAnalyticsCollectionEnabled } from 'firebase/analytics'
import app from './firebase'

let analyticsInstance: Analytics | null = null

export const initializeAnalytics = () => {
  if (typeof window !== 'undefined' && !analyticsInstance) {
    try {
      analyticsInstance = getAnalytics(app)
      console.log('Firebase Analytics initialized.')
    } catch (error) {
      console.error('Failed to initialize Firebase Analytics:', error)
    }
  }
}

export const revokeAnalytics = () => {
  if (analyticsInstance) {
    setAnalyticsCollectionEnabled(analyticsInstance, false)
    console.log('Firebase Analytics collection disabled.')
  }
}

export const logCustomEvent = (eventName: string, eventParams?: Record<string, unknown>) => {
  if (analyticsInstance) {
    logEvent(analyticsInstance, eventName, eventParams)
  }
}

export const logBookingStarted = () => {
  logCustomEvent('booking_started')
}

export const logBookingCompleted = (serviceType: string, totalValue?: number) => {
  logCustomEvent('booking_completed', { service_type: serviceType, value: totalValue })
}

export const logQuoteCalculated = (serviceType: string, estimatedPrice: number) => {
  logCustomEvent('quote_calculated', { service_type: serviceType, value: estimatedPrice })
}

export const logPhoneClicked = (location: 'navbar' | 'footer' | 'other') => {
  logCustomEvent('phone_clicked', { location })
}

export const logLanguageToggled = (newLanguage: string) => {
  logCustomEvent('language_toggled', { language: newLanguage })
}

export const _resetForTesting = () => {
  if (import.meta.env.MODE === 'test') {
    analyticsInstance = null
  }
}

```

---

## File: src/lib/firebase/firebase.ts

```typescript
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const app = initializeApp({
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
})

const dbId = import.meta.env.VITE_FIRESTORE_DB_ID ?? '(default)'
export const db = getFirestore(app, dbId)
export const auth = getAuth(app)
export default app

```

---

## File: src/lib/firebase/firestore.ts

```typescript
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import type { BookingFormData } from '@/lib/schemas/bookingSchema'
import type { Language, Booking, BookingStatus } from '@/types'

export type LeadSource = 'organic' | 'google' | 'referral' | 'facebook' | 'direct'

export function detectLeadSource(params: URLSearchParams): LeadSource {
  const ref = (params.get('ref') ?? params.get('utm_source') ?? '').toLowerCase()
  const map: Record<string, LeadSource> = {
    google:   'google',
    facebook: 'facebook',
    referral: 'referral',
    direct:   'direct',
  }
  return map[ref] ?? 'organic'
}

export async function submitBooking(
  data: BookingFormData,
  language: Language,
  source: LeadSource,
): Promise<string> {
  if (typeof window !== 'undefined' && window.__MOCK_SUBMIT__) {
    return window.__MOCK_SUBMIT__(data, language, source)
  }
  const { marketingConsent, ...formFields } = data

  const docData: Record<string, unknown> = {
    ...formFields,
    language,
    leadSource:        source,
    status:            'pending',
    assignedTo:        null,
    isAirbnb:          data.serviceType === 'airbnb',
    photoConfirmation: data.serviceType === 'airbnb' || data.serviceType === 'commercial',
    fsmAppointmentId:  null,
    createdAt:         serverTimestamp(),
  }

  if (marketingConsent) {
    docData.marketingConsent = true
    docData.consentTimestamp = Timestamp.now()
    docData.consentMethod    = 'booking-form-v2'
  }

  const ref = await addDoc(collection(db, 'bookings'), docData)
  return ref.id
}

export function subscribeToBookings(callback: (bookings: Booking[]) => void): () => void {
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const bookings: Booking[] = []
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      bookings.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      } as Booking)
    })
    callback(bookings)
  })
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  const docRef = doc(db, 'bookings', bookingId)
  await updateDoc(docRef, { status })
}

export async function updateBookingAssignment(bookingId: string, cleanerName: string | null): Promise<void> {
  const docRef = doc(db, 'bookings', bookingId)
  await updateDoc(docRef, { assignedTo: cleanerName })
}

```

---

## File: src/lib/schemas/bookingSchema.ts

```typescript
import { z } from 'zod'

export const bookingFormSchema = z.object({
  // Step 1 — Service details
  serviceType:  z.enum(['standard', 'deep', 'moveout', 'postconstruction', 'airbnb', 'commercial']),
  propertyType: z.enum(['apartment', '1-2bed', '3-4bed', '5+bed', 'commercial']),
  bedrooms:     z.number().int().min(0).max(20),
  bathrooms:    z.number().int().min(0).max(10),
  pets:         z.boolean(),

  // Step 2 — Schedule
  frequency:      z.enum(['one-time', 'weekly', 'biweekly', 'monthly']),
  preferredDate:  z.string().min(1),
  addOns:         z.array(z.enum(['oven', 'fridge', 'windows', 'laundry', 'petHair', 'basement'])),
  squareFootage:  z.number().int().min(0).optional(),

  // Step 3 — Contact
  firstName:        z.string().min(1),
  lastName:         z.string().min(1),
  email:            z.string().email(),
  phone:            z.string().min(10),
  address:          z.string().min(5),
  preferredCleaner: z.string().nullable().optional(),
  notes:            z.string().max(1000).optional(),

  // Step 4 — Consent
  marketingConsent: z.boolean(),
  referredBy:       z.string().nullable().optional(),
})

export type BookingFormData = z.infer<typeof bookingFormSchema>

export const STEP_FIELDS: Record<number, (keyof BookingFormData)[]> = {
  0: ['serviceType', 'propertyType', 'bedrooms', 'bathrooms', 'pets'],
  1: ['frequency', 'preferredDate'],
  2: ['firstName', 'lastName', 'email', 'phone', 'address'],
  3: ['marketingConsent', 'referredBy'],
}

```

---

## File: src/lib/utils/animations.ts

```typescript
import type { Variants } from 'framer-motion'

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

```

---

## File: src/lib/utils/quotePricing.ts

```typescript
export type QuotePropertySize = 'apartment' | '1-2bed' | '3-4bed' | '5plus' | 'commercial'
export type QuoteServiceType  = 'standard' | 'deep' | 'moveout' | 'postconstruction' | 'airbnb'
export type QuoteFrequency    = 'one-time' | 'weekly' | 'biweekly' | 'monthly'

interface PriceRange { min: number; max: number }

export const BASE_PRICES: Record<Exclude<QuotePropertySize, 'commercial'>, PriceRange> = {
  apartment: { min: 100, max: 130 },
  '1-2bed':  { min: 120, max: 155 },
  '3-4bed':  { min: 160, max: 200 },
  '5plus':   { min: 210, max: 270 },
}

export const SERVICE_MULTIPLIER: Record<QuoteServiceType, number> = {
  standard:         1.0,
  deep:             1.5,
  moveout:          1.75,
  postconstruction: 2.0,
  airbnb:           0.85,
}

export const FREQUENCY_DISCOUNT: Record<QuoteFrequency, number> = {
  'one-time': 0,
  weekly:     0.20,
  biweekly:   0.15,
  monthly:    0.10,
}

export type QuoteResult =
  | { type: 'range'; min: number; max: number }
  | { type: 'commercial' }

function roundToNearest5(n: number): number {
  return Math.round(n / 5) * 5
}

export function calculateQuote(
  size: QuotePropertySize,
  service: QuoteServiceType,
  frequency: QuoteFrequency,
): QuoteResult {
  if (size === 'commercial') return { type: 'commercial' }
  const base = BASE_PRICES[size]
  const factor = SERVICE_MULTIPLIER[service] * (1 - FREQUENCY_DISCOUNT[frequency])
  return {
    type: 'range',
    min: roundToNearest5(base.min * factor),
    max: roundToNearest5(base.max * factor),
  }
}

```

---

## File: src/lib/utils/seo.ts

```typescript
import type { TFunction } from 'i18next'
import { STATIC_REVIEWS } from '@/lib/data/reviewsData'

// Types for JSON-LD schemas to ensure valid outputs
export interface SchemaOrgObject {
  '@context': 'https://schema.org'
  '@type': string
  [key: string]: unknown
}

export const BASE_URL = 'https://lilypad-freshnest.web.app'

/**
 * Returns the LocalBusiness (specifically HomeAndConstructionBusiness) JSON-LD schema.
 */
export function getLocalBusinessSchema(t: TFunction): SchemaOrgObject {
  // Format reviews to match Schema.org format
  const reviews = STATIC_REVIEWS.map(r => ({
    '@type': 'Review',
    'reviewRating': {
      '@type': 'Rating',
      'ratingValue': r.rating,
      'bestRating': 5,
    },
    'author': {
      '@type': 'Person',
      'name': r.name,
    },
    'reviewBody': r.text,
    'publisher': {
      '@type': 'Organization',
      'name': 'Google'
    }
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${BASE_URL}/#organization`,
    'name': 'Fresh Nest Co.',
    'description': t('hero.subhead'),
    'url': BASE_URL,
    'logo': `${BASE_URL}/assets/logo-navbar-160px@2x-CvrLo3Hv.png`, // Matches resolved assets
    'image': `${BASE_URL}/assets/hero-CLDdwZDr.png`,
    'telephone': '+1-613-935-3555',
    'priceRange': '$$',
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'Cornwall',
      'addressRegion': 'ON',
      'addressCountry': 'CA',
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': 45.0216,
      'longitude': -74.7280,
    },
    'openingHoursSpecification': [
      {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        'opens': '08:00',
        'closes': '18:00',
      }
    ],
    'areaServed': [
      { '@type': 'AdministrativeArea', 'name': 'Cornwall, ON' },
      { '@type': 'AdministrativeArea', 'name': 'Akwesasne' },
      { '@type': 'AdministrativeArea', 'name': 'Snye, QC' },
      { '@type': 'AdministrativeArea', 'name': 'Long Sault, ON' },
      { '@type': 'AdministrativeArea', 'name': 'Morrisburg, ON' },
    ],
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': 4.9,
      'reviewCount': STATIC_REVIEWS.length,
      'bestRating': 5,
    },
    'review': reviews,
  }
}

/**
 * Returns the Service JSON-LD schema for a specific service.
 */
export function getServiceSchema(
  serviceKey: 'standard' | 'deep' | 'moveout' | 'postconstruction' | 'commercial' | 'airbnb',
  t: TFunction
): SchemaOrgObject {
  let serviceTitle: string
  let serviceDescription: string

  if (serviceKey === 'airbnb') {
    serviceTitle = t('airbnbPage.hero.heading')
    serviceDescription = t('airbnbPage.hero.subhead')
  } else {
    serviceTitle = t(`servicePage.${serviceKey}.hero.heading`)
    serviceDescription = t(`servicePage.${serviceKey}.hero.subhead`)
  }

  let route = ''
  switch (serviceKey) {
    case 'standard':
      route = 'standard-cleaning'
      break
    case 'deep':
      route = 'deep-cleaning'
      break
    case 'moveout':
      route = 'move-out-cleaning'
      break
    case 'postconstruction':
      route = 'post-construction'
      break
    case 'commercial':
      route = 'commercial-cleaning'
      break
    case 'airbnb':
      route = 'airbnb-turnover'
      break
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${BASE_URL}/services/${route}#service`,
    'name': serviceTitle,
    'description': serviceDescription,
    'provider': {
      '@type': 'HomeAndConstructionBusiness',
      '@id': `${BASE_URL}/#organization`,
      'name': 'Fresh Nest Co.',
      'url': BASE_URL,
      'telephone': '+1-613-935-3555',
    },
    'areaServed': [
      { '@type': 'AdministrativeArea', 'name': 'Cornwall, ON' },
      { '@type': 'AdministrativeArea', 'name': 'Akwesasne' },
      { '@type': 'AdministrativeArea', 'name': 'Snye, QC' },
      { '@type': 'AdministrativeArea', 'name': 'Long Sault, ON' },
      { '@type': 'AdministrativeArea', 'name': 'Morrisburg, ON' },
    ],
  }
}

/**
 * Returns the FAQPage JSON-LD schema.
 */
export function getFaqSchema(t: TFunction): SchemaOrgObject {
  const faqKeys = Array.from({ length: 10 }, (_, i) => i + 1)

  const mainEntity = faqKeys.map(num => ({
    '@type': 'Question',
    'name': t(`faq.item${num}.q`),
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': t(`faq.item${num}.a`),
    },
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': mainEntity,
  }
}

```

---

## File: src/lib/utils/utils.ts

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

```

---

## File: src/main.tsx

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@/i18n'
import App from './App.tsx'
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

```

---

## File: src/pages/AdminPage.tsx

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/utils'
import { fadeUp } from '@/lib/utils/animations'
import SEO from '@/components/seo/SEO'
import { useAdminAuth } from '@/components/admin/hooks/useAdminAuth'
import { useBookings } from '@/components/admin/hooks/useBookings'
import { useAdminAnalytics } from '@/components/admin/hooks/useAdminAnalytics'
import { LoginPanel } from '@/components/admin/LoginPanel'
import { AccessDeniedPanel } from '@/components/admin/AccessDeniedPanel'
import { BookingsTable } from '@/components/admin/BookingsTable'
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard'

export default function AdminPage() {
  const { t } = useTranslation()
  const { user, loading, isAuthorized, authError, handleSignIn, handleSignOut } = useAdminAuth()
  const bookingsState = useBookings(isAuthorized)
  const analyticsState = useAdminAnalytics(bookingsState.bookings)

  const [activeTab, setActiveTab] = useState<'bookings' | 'analytics'>('bookings')

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-warm-white">
        <SEO title={t('admin.meta.title')} description={t('admin.meta.description')} />
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-[80vh] bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <SEO title={t('admin.meta.title')} description={t('admin.meta.description')} />

      <div className="max-w-content mx-auto">
        <AnimatePresence mode="wait">
          {/* Access Denied View */}
          {user && !isAuthorized && (
            <AccessDeniedPanel
              user={user}
              handleSignOut={handleSignOut}
              authError={authError}
            />
          )}

          {/* Login Gate View */}
          {!user && (
            <LoginPanel
              handleSignIn={handleSignIn}
              authError={authError}
            />
          )}

          {/* Authenticated Bookings Dashboard */}
          {user && isAuthorized && (
            <motion.div
              key="admin-dashboard"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={fadeUp}
              className="w-full flex flex-col gap-8"
            >
              {/* Header and User profile */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-sand pb-6">
                <div>
                  <h1 className="font-display text-5xl text-charcoal">
                    {t('admin.dashboard.title')}
                  </h1>
                  <p className="font-body text-base text-text-muted mt-1">
                    {t('admin.dashboard.welcome', { name: user.displayName || user.email })}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white border border-sand rounded p-3 self-start md:self-auto">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || t('admin.dashboard.avatarAlt')}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-sand"
                      width={40}
                      height={40}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-pale text-slate-brand font-body font-medium flex items-center justify-center shrink-0">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'A'}
                    </div>
                  )}

                  <div className="text-left">
                    <p className="font-body text-base font-medium text-charcoal leading-none">
                      {user.displayName || t('admin.dashboard.fallbackName')}
                    </p>
                    <p className="font-body text-sm text-text-muted mt-1">
                      {user.email}
                    </p>
                  </div>

                  <button
                    onClick={() => { void handleSignOut() }}
                    className={cn(
                      'ml-2 border border-sand text-charcoal font-body font-medium rounded',
                      'min-h-[48px] px-4 py-2 text-base hover:bg-cream transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-slate-brand'
                    )}
                  >
                    {t('admin.dashboard.signOut')}
                  </button>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-sand gap-2">
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={cn(
                    'min-h-[48px] py-3 px-6 font-body font-medium text-base border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                    activeTab === 'bookings'
                      ? 'border-slate-brand text-slate-brand'
                      : 'border-transparent text-text-muted hover:text-charcoal hover:border-sand'
                  )}
                >
                  {t('admin.dashboard.tabs.bookings')}
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={cn(
                    'min-h-[48px] py-3 px-6 font-body font-medium text-base border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                    activeTab === 'analytics'
                      ? 'border-slate-brand text-slate-brand'
                      : 'border-transparent text-text-muted hover:text-charcoal hover:border-sand'
                  )}
                >
                  {t('admin.dashboard.tabs.analytics')}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'bookings' ? (
                  <motion.div
                    key="tab-bookings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <BookingsTable {...bookingsState} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="tab-analytics"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnalyticsDashboard {...analyticsState} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

```

---

## File: src/pages/AirbnbTurnoverPage.tsx

```tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { calculateQuote } from '@/lib/utils/quotePricing'
import { submitBooking, detectLeadSource } from '@/lib/firebase/firestore'
import JsonLd from '@/components/seo/JsonLd'
import { getServiceSchema } from '@/lib/utils/seo'
import SEO from '@/components/seo/SEO'

// ─── Animation variant ───────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.1 },
  }),
}

// ─── Zod schema for commercial inquiry ───────────────────────────────────────
const airbnbInquirySchema = z.object({
  firstName:                 z.string().min(1, 'Required'),
  lastName:                  z.string().min(1, 'Required'),
  email:                     z.string().email('Enter a valid email address'),
  phone:                     z.string().min(10, 'Enter a valid phone number'),
  propertyName:              z.string().min(1, 'Required'),
  estimatedMonthlyTurnovers: z
    .number({ message: 'Enter a number' })
    .int()
    .min(1, 'Minimum 1')
    .max(100, 'Maximum 100'),
  preferredWindow:           z.enum(['11am-3pm', 'flexible', 'morning', 'afternoon']),
  notes:                     z.string().max(1000).optional(),
  marketingConsent:          z.boolean().optional(),
})

type AirbnbInquiryForm = z.infer<typeof airbnbInquirySchema>

// ─── Checklist items ──────────────────────────────────────────────────────────
const INCLUDED_KEYS = [
  'fullClean',
  'linen',
  'toiletries',
  'photos',
  'staging',
  'window',
] as const

// ─── How It Works steps ───────────────────────────────────────────────────────
const HOW_IT_WORKS_STEPS = [
  { titleKey: 'step1Title', descKey: 'step1Desc', number: '1' },
  { titleKey: 'step2Title', descKey: 'step2Desc', number: '2' },
  { titleKey: 'step3Title', descKey: 'step3Desc', number: '3' },
] as const

// ─── Trust signals ────────────────────────────────────────────────────────────
const TRUST_SIGNALS = [
  { statKey: 'stat1', labelKey: 'label1' },
  { statKey: 'stat2', labelKey: 'label2' },
  { statKey: 'stat3', labelKey: 'label3' },
] as const

// ─── Window options ───────────────────────────────────────────────────────────
const WINDOW_OPTIONS = [
  { value: '11am-3pm',   labelKey: 'window11am3pm'   },
  { value: 'flexible',   labelKey: 'windowFlexible'  },
  { value: 'morning',    labelKey: 'windowMorning'   },
  { value: 'afternoon',  labelKey: 'windowAfternoon' },
] as const

export default function AirbnbTurnoverPage() {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const [submitted, setSubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const serviceSchema = getServiceSchema('airbnb', t)

  // Pricing teaser — use 1-2bed as reference size
  const priceResult = calculateQuote('1-2bed', 'airbnb', 'one-time')
  const priceMin = priceResult.type === 'range' ? priceResult.min : null

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AirbnbInquiryForm>({
    resolver: zodResolver(airbnbInquirySchema),
    defaultValues: {
      preferredWindow: '11am-3pm',
      marketingConsent: false,
    },
  })

  const onSubmit = async (data: AirbnbInquiryForm) => {
    setSubmitError(null)
    try {
      const source = detectLeadSource(searchParams)
      const notesText = [
        `[Commercial Inquiry]`,
        `Property: ${data.propertyName}`,
        `Turnovers/month: ${data.estimatedMonthlyTurnovers}`,
        `Window: ${data.preferredWindow}`,
        data.notes ? `Notes: ${data.notes}` : '',
      ]
        .filter(Boolean)
        .join(' | ')

      // Build a BookingFormData-compatible payload
      const payload = {
        serviceType:      'airbnb'      as const,
        propertyType:     'commercial'  as const,
        bedrooms:         0,
        bathrooms:        0,
        pets:             false,
        frequency:        'one-time'    as const,
        preferredDate:    '',
        addOns:           [] as ('oven' | 'fridge' | 'windows' | 'laundry' | 'petHair' | 'basement')[],
        firstName:        data.firstName,
        lastName:         data.lastName,
        email:            data.email,
        phone:            data.phone,
        address:          '',
        preferredCleaner: null,
        notes:            notesText,
        marketingConsent: data.marketingConsent ?? false,
      }

      await submitBooking(payload, i18n.language as 'en' | 'fr', source)
      setSubmittedName(data.firstName)
      setSubmitted(true)
    } catch (err) {
      console.error('[AirbnbTurnoverPage] submitBooking error:', err)
      setSubmitError(t('common.error'))
    }
  }

  return (
    <>
      <SEO
        title={t('airbnbPage.meta.title')}
        description={t('airbnbPage.meta.description')}
      />
      <main id="main-content">
        <JsonLd schema={serviceSchema} />
      {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="airbnb-hero-heading"
        className="relative bg-charcoal overflow-hidden"
      >
        {/* Hero image */}
        <div className="absolute inset-0">
          <img
            src="/images/airbnb-hero.jpg"
            alt={t('airbnbPage.hero.imgAlt')}
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/70 to-charcoal/30" />
        </div>

        <div className="relative max-w-content mx-auto py-20 px-4 md:py-32 md:px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="max-w-xl"
          >
            {/* Back link */}
            <Link
              to="/services"
              className="inline-flex items-center font-body text-base text-slate-light hover:text-white transition-colors mb-6 min-h-[48px]"
              aria-label={t('airbnbPage.hero.backLink')}
            >
              {t('airbnbPage.hero.backLink')}
            </Link>

            <h1
              id="airbnb-hero-heading"
              className="font-display text-5xl text-white mb-4"
            >
              {t('airbnbPage.hero.heading')}
            </h1>
            <p className="font-body text-lg text-slate-pale font-bold max-w-lg mb-8">
              {t('airbnbPage.hero.subhead')}
            </p>
            <a
              href="#inquiry-form"
              className="inline-flex items-center justify-center bg-slate-brand text-white font-body font-medium rounded px-8 py-4 min-h-[48px] hover:bg-slate-dark transition-colors duration-200"
            >
              {t('airbnbPage.hero.cta')}
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── 2. What's Included ───────────────────────────────────────────── */}
      <section
        aria-labelledby="airbnb-included-heading"
        className="bg-warm-white py-12 px-4 md:py-20 md:px-6"
      >
        <div className="max-w-content mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2
              id="airbnb-included-heading"
              className="font-display text-4xl text-charcoal mb-8"
            >
              {t('airbnbPage.included.heading')}
            </h2>
          </motion.div>

          <ul
            role="list"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {INCLUDED_KEYS.map((key, i) => (
              <motion.li
                key={key}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="flex items-start gap-3 bg-white border border-sand rounded p-5 min-h-[48px]"
              >
                {/* Checkmark icon */}
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-slate-pale flex items-center justify-center text-slate-brand text-xs font-bold"
                >
                  ✓
                </span>
                <span className="font-body text-lg text-charcoal font-bold">
                  {t(`airbnbPage.included.${key}`)}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 3. How It Works ──────────────────────────────────────────────── */}
      <section
        aria-labelledby="airbnb-how-heading"
        className="bg-cream py-12 px-4 md:py-20 md:px-6"
      >
        <div className="max-w-content mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2
              id="airbnb-how-heading"
              className="font-display text-4xl text-charcoal mb-10"
            >
              {t('airbnbPage.howItWorks.heading')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS_STEPS.map(({ titleKey, descKey, number }, i) => (
              <motion.div
                key={titleKey}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="flex flex-col"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-6xl text-slate-pale mb-3 leading-none select-none"
                >
                  {number}
                </span>
                <h3 className="font-sub text-2xl text-charcoal mb-2">
                  {t(`airbnbPage.howItWorks.${titleKey}`)}
                </h3>
                <p className="font-body text-lg text-charcoal font-bold">
                  {t(`airbnbPage.howItWorks.${descKey}`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Why Hosts Choose Us ───────────────────────────────────────── */}
      <section
        aria-labelledby="airbnb-trust-heading"
        className="bg-slate-dark py-12 px-4 md:py-20 md:px-6"
      >
        <div className="max-w-content mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2
              id="airbnb-trust-heading"
              className="font-display text-4xl text-white mb-10 text-center"
            >
              {t('airbnbPage.trust.heading')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {TRUST_SIGNALS.map(({ statKey, labelKey }, i) => (
              <motion.div
                key={statKey}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="flex flex-col items-center"
              >
                <span className="font-display text-5xl text-white mb-2">
                  {t(`airbnbPage.trust.${statKey}`)}
                </span>
                <span className="font-body text-lg text-slate-pale font-bold">
                  {t(`airbnbPage.trust.${labelKey}`)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Pricing Teaser ────────────────────────────────────────────── */}
      <section
        aria-labelledby="airbnb-pricing-heading"
        className="bg-warm-white py-12 px-4 md:py-20 md:px-6"
      >
        <div className="max-w-content mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="max-w-xl"
          >
            <h2
              id="airbnb-pricing-heading"
              className="font-display text-4xl text-charcoal mb-3"
            >
              {t('airbnbPage.pricing.heading')}
            </h2>
            {priceMin !== null && (
              <p className="font-display text-3xl text-slate-brand mb-2">
                {t('airbnbPage.pricing.starting', { min: priceMin })}
              </p>
            )}
            <p className="font-body text-lg text-charcoal font-bold mb-6">
              {t('airbnbPage.pricing.volume')}
            </p>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center border border-slate-brand text-slate-brand font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-pale transition-colors duration-200"
            >
              {t('airbnbPage.pricing.cta')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── 6. Commercial Inquiry Form ───────────────────────────────────── */}
      <section
        id="inquiry-form"
        aria-labelledby="airbnb-form-heading"
        className="bg-cream py-12 px-4 md:py-20 md:px-6"
      >
        <div className="max-w-content mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="max-w-2xl"
          >
            <h2
              id="airbnb-form-heading"
              className="font-display text-4xl text-charcoal mb-2"
            >
              {t('airbnbPage.form.heading')}
            </h2>
            <p className="font-body text-lg text-charcoal font-bold mb-8">
              {t('airbnbPage.form.subhead')}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="max-w-2xl"
          >
            {/* Success state */}
            {submitted ? (
              <div
                role="status"
                aria-live="polite"
                className="bg-white border border-sand rounded p-8 text-center"
              >
                <span
                  aria-hidden="true"
                  className="block text-4xl mb-4"
                >
                  ✓
                </span>
                <h3 className="font-sub text-2xl text-charcoal mb-2">
                  {t('airbnbPage.form.successHeading', { name: submittedName })}
                </h3>
                <p className="font-body text-base text-text-muted">
                  {t('airbnbPage.form.successBody')}
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => { void handleSubmit(onSubmit)(e); }}
                noValidate
                aria-label={t('airbnbPage.form.heading')}
                className="bg-white border border-sand rounded p-6 md:p-8 space-y-6"
              >
                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="airbnb-firstName"
                      className="block font-body text-base text-charcoal mb-1"
                    >
                      {t('airbnbPage.form.firstName')}
                      <span className="text-slate-brand ml-1" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="airbnb-firstName"
                      type="text"
                      autoComplete="given-name"
                      {...register('firstName')}
                      aria-required="true"
                      aria-describedby={errors.firstName ? 'airbnb-firstName-error' : undefined}
                      className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                    />
                    {errors.firstName && (
                      <p id="airbnb-firstName-error" role="alert" className="mt-1 font-body text-sm text-red-600">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="airbnb-lastName"
                      className="block font-body text-base text-charcoal mb-1"
                    >
                      {t('airbnbPage.form.lastName')}
                      <span className="text-slate-brand ml-1" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="airbnb-lastName"
                      type="text"
                      autoComplete="family-name"
                      {...register('lastName')}
                      aria-required="true"
                      aria-describedby={errors.lastName ? 'airbnb-lastName-error' : undefined}
                      className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                    />
                    {errors.lastName && (
                      <p id="airbnb-lastName-error" role="alert" className="mt-1 font-body text-sm text-red-600">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email + Phone row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="airbnb-email"
                      className="block font-body text-base text-charcoal mb-1"
                    >
                      {t('airbnbPage.form.email')}
                      <span className="text-slate-brand ml-1" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="airbnb-email"
                      type="email"
                      autoComplete="email"
                      {...register('email')}
                      aria-required="true"
                      aria-describedby={errors.email ? 'airbnb-email-error' : undefined}
                      className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                    />
                    {errors.email && (
                      <p id="airbnb-email-error" role="alert" className="mt-1 font-body text-sm text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="airbnb-phone"
                      className="block font-body text-base text-charcoal mb-1"
                    >
                      {t('airbnbPage.form.phone')}
                      <span className="text-slate-brand ml-1" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="airbnb-phone"
                      type="tel"
                      autoComplete="tel"
                      {...register('phone')}
                      aria-required="true"
                      aria-describedby={errors.phone ? 'airbnb-phone-error' : undefined}
                      className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                    />
                    {errors.phone && (
                      <p id="airbnb-phone-error" role="alert" className="mt-1 font-body text-sm text-red-600">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Property Name */}
                <div>
                  <label
                    htmlFor="airbnb-propertyName"
                    className="block font-body text-base text-charcoal mb-1"
                  >
                    {t('airbnbPage.form.propertyName')}
                    <span className="text-slate-brand ml-1" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="airbnb-propertyName"
                    type="text"
                    {...register('propertyName')}
                    aria-required="true"
                    aria-describedby={errors.propertyName ? 'airbnb-propertyName-error' : undefined}
                    className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                  />
                  {errors.propertyName && (
                    <p id="airbnb-propertyName-error" role="alert" className="mt-1 font-body text-sm text-red-600">
                      {errors.propertyName.message}
                    </p>
                  )}
                </div>

                {/* Monthly Turnovers + Preferred Window row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="airbnb-monthlyTurnovers"
                      className="block font-body text-base text-charcoal mb-1"
                    >
                      {t('airbnbPage.form.monthlyTurnovers')}
                      <span className="text-slate-brand ml-1" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="airbnb-monthlyTurnovers"
                      type="number"
                      min="1"
                      max="100"
                      {...register('estimatedMonthlyTurnovers', { valueAsNumber: true })}
                      aria-required="true"
                      aria-describedby={errors.estimatedMonthlyTurnovers ? 'airbnb-turnovers-error' : undefined}
                      className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand"
                    />
                    {errors.estimatedMonthlyTurnovers && (
                      <p id="airbnb-turnovers-error" role="alert" className="mt-1 font-body text-sm text-red-600">
                        {errors.estimatedMonthlyTurnovers.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="airbnb-preferredWindow"
                      className="block font-body text-base text-charcoal mb-1"
                    >
                      {t('airbnbPage.form.preferredWindow')}
                      <span className="text-slate-brand ml-1" aria-hidden="true">*</span>
                    </label>
                    <select
                      id="airbnb-preferredWindow"
                      {...register('preferredWindow')}
                      aria-required="true"
                      className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand bg-white"
                    >
                      {WINDOW_OPTIONS.map(({ value, labelKey }) => (
                        <option key={value} value={value}>
                          {t(`airbnbPage.form.${labelKey}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="airbnb-notes"
                    className="block font-body text-base text-charcoal mb-1"
                  >
                    {t('airbnbPage.form.notes')}
                    <span className="ml-1 font-body text-sm text-text-muted">
                      ({t('common.optional')})
                    </span>
                  </label>
                  <textarea
                    id="airbnb-notes"
                    rows={4}
                    {...register('notes')}
                    placeholder={t('airbnbPage.form.notesPlaceholder')}
                    className="w-full border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-brand resize-none"
                  />
                </div>

                {/* CASL consent */}
                <div className="flex items-center gap-3 min-h-[48px]">
                  <input
                    id="airbnb-consent"
                    type="checkbox"
                    {...register('marketingConsent')}
                    className="w-5 h-5 border-sand rounded accent-slate-brand flex-shrink-0"
                  />
                  <label
                    htmlFor="airbnb-consent"
                    className="font-body text-base text-text-muted cursor-pointer"
                  >
                    {t('airbnbPage.form.consent')}
                  </label>
                </div>

                {/* Server error */}
                {submitError && (
                  <p role="alert" className="font-body text-base text-red-600">
                    {submitError}
                  </p>
                )}

                {/* Submit */}
                <button
                  id="airbnb-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-brand text-white font-body font-medium rounded px-6 py-4 min-h-[48px] hover:bg-slate-dark transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? t('airbnbPage.form.submitting')
                    : t('airbnbPage.form.submit')}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
      </main>
    </>
  )
}

```

---

## File: src/pages/Blog.tsx

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { BLOG_POSTS } from '@/lib/data/blogData'
import SEO from '@/components/seo/SEO'
import { fadeUp, stagger } from '@/lib/utils/animations'
import { cn } from '@/lib/utils/utils'

export default function Blog() {
  const { t, i18n } = useTranslation()
  const currentLang = (i18n.language || 'en') as 'en' | 'fr'

  return (
    <main className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <SEO
        title={t('blog.meta.title')}
        description={t('blog.meta.description')}
      />
      <div className="max-w-content mx-auto">
        {/* Page Heading */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-12"
        >
          <h1 className="font-display text-5xl text-charcoal mb-4 font-bold">
            {t('blog.pageHeading')}
          </h1>
          <p className="font-body text-base text-text-muted max-w-xl">
            {t('blog.pageSubhead')}
          </p>
        </motion.div>

        {/* Blog Post Cards Grid */}
        {BLOG_POSTS.length === 0 ? (
          <p className="font-body text-base text-text-muted">{t('blog.noPosts')}</p>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {BLOG_POSTS.map((post) => {
              const title = post.title[currentLang] || post.title.en
              const desc = post.description[currentLang] || post.description.en
              const author = post.author[currentLang] || post.author.en

              return (
                <motion.article
                  key={post.slug}
                  variants={fadeUp}
                  className="bg-white rounded border border-sand shadow-sm overflow-hidden flex flex-col h-full"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden relative bg-cream">
                    <img
                      src={post.image}
                      alt={title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex flex-wrap gap-2 text-text-muted font-body text-sm mb-3">
                      <span>{t('blog.writtenBy', { author })}</span>
                      <span>•</span>
                      <span>{t('blog.publishedAt', { date: post.publishedAt })}</span>
                    </div>
                    <h2 className="font-sub text-2xl text-charcoal mb-3 font-semibold hover:text-slate-brand transition-colors">
                      <Link to={`/blog/${post.slug}`}>{title}</Link>
                    </h2>
                    <p className="font-body text-base text-charcoal mb-6 flex-grow">
                      {desc}
                    </p>
                    <div className="mt-auto">
                      <Link
                        to={`/blog/${post.slug}`}
                        className={cn(
                          'inline-flex items-center justify-center font-body font-medium text-base rounded border border-slate-brand text-slate-brand',
                          'min-h-[48px] px-6 py-2 hover:bg-slate-pale transition-colors duration-200',
                          'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2 w-full sm:w-auto'
                        )}
                      >
                        {t('blog.readMore')} →
                      </Link>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </motion.div>
        )}
      </div>
    </main>
  )
}

```

---

## File: src/pages/BlogPost.tsx

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
import { BLOG_POSTS } from '@/lib/data/blogData'
import SEO from '@/components/seo/SEO'
import { fadeUp } from '@/lib/utils/animations'
import { cn } from '@/lib/utils/utils'

// A simple Markdown parser component that handles paragraphs, headers (###), bold text (**), and lists (-).
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.trim().split('\n')
  const elements: React.ReactNode[] = []

  let listItems: string[] = []

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-6 mb-6 space-y-2 font-body text-base text-charcoal">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
          ))}
        </ul>
      )
      listItems = []
    }
  }

  // Parses bold tags **text** into <strong>text</strong>
  const formatInlineMarkdown = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  }

  lines.forEach((line, idx) => {
    const trimmedLine = line.trim()

    if (trimmedLine.startsWith('- ')) {
      listItems.push(trimmedLine.substring(2))
    } else {
      flushList(String(idx))

      if (trimmedLine.startsWith('### ')) {
        elements.push(
          <h3
            key={idx}
            className="font-sub text-2xl text-charcoal mt-8 mb-4 font-semibold"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmedLine.substring(4)) }}
          />
        )
      } else if (trimmedLine.startsWith('## ')) {
        elements.push(
          <h2
            key={idx}
            className="font-display text-3xl text-charcoal mt-10 mb-4 font-bold"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmedLine.substring(3)) }}
          />
        )
      } else if (trimmedLine.startsWith('# ')) {
        elements.push(
          <h1
            key={idx}
            className="font-display text-4xl text-charcoal mt-12 mb-4 font-bold"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmedLine.substring(2)) }}
          />
        )
      } else if (trimmedLine === '') {
        // Empty line, do nothing
      } else {
        elements.push(
          <p
            key={idx}
            className="font-body text-base text-charcoal mb-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmedLine) }}
          />
        )
      }
    }
  })

  // Flush any remaining list items at the end
  flushList('end')

  return <div>{elements}</div>
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const { t, i18n } = useTranslation()
  const currentLang = (i18n.language || 'en') as 'en' | 'fr'

  const post = BLOG_POSTS.find((p) => p.slug === slug)

  if (!post) {
    return (
      <main className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
        <SEO
          title={t('blog.meta.title')}
          description={t('blog.meta.description')}
        />
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl text-charcoal mb-6 font-bold">
            {t('blog.noPosts')}
          </h1>
          <Link
            to="/blog"
            className={cn(
              'inline-flex items-center justify-center font-body font-medium text-base rounded bg-slate-brand text-white',
              'min-h-[48px] px-6 py-3 hover:bg-slate-dark transition-colors duration-200'
            )}
          >
            {t('blog.backToBlog')}
          </Link>
        </div>
      </main>
    )
  }

  const title = post.title[currentLang] || post.title.en
  const desc = post.description[currentLang] || post.description.en
  const author = post.author[currentLang] || post.author.en
  const content = post.content[currentLang] || post.content.en
  const readTime = post.readTime[currentLang] || post.readTime.en

  return (
    <main className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <SEO
        title={t('blog.metaPost', { title })}
        description={desc}
      />
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-8"
        >
          <Link
            to="/blog"
            className={cn(
              'inline-flex items-center font-body text-base text-slate-brand hover:text-slate-dark transition-colors',
              'min-h-[48px]'
            )}
          >
            {t('blog.backToBlog')}
          </Link>
        </motion.div>

        {/* Article Header */}
        <motion.article
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="bg-white rounded border border-sand shadow-sm p-6 md:p-10"
        >
          <header className="mb-8 border-b border-sand pb-8">
            <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4 font-bold leading-tight">
              {title}
            </h1>
            <div className="flex flex-wrap gap-4 text-text-muted font-body text-base">
              <span>{t('blog.writtenBy', { author })}</span>
              <span>•</span>
              <span>{t('blog.publishedAt', { date: post.publishedAt })}</span>
              <span>•</span>
              <span>{readTime}</span>
            </div>
          </header>

          {/* Cover Image */}
          <div className="aspect-[21/9] w-full overflow-hidden rounded mb-8 bg-cream border border-sand">
            <img
              src={post.image}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Article Content */}
          <div className="prose max-w-none">
            <MarkdownRenderer content={content} />
          </div>
        </motion.article>
      </div>
    </main>
  )
}

```

---

## File: src/pages/BookingPage.tsx

```tsx
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { bookingFormSchema, BookingFormData } from '@/lib/schemas/bookingSchema'
import { submitBooking, detectLeadSource } from '@/lib/firebase/firestore'
import { logBookingStarted, logBookingCompleted } from '@/lib/firebase/analytics'
import BookingStep1 from '@/components/booking/BookingStep1'
import BookingStep2 from '@/components/booking/BookingStep2'
import BookingStep3 from '@/components/booking/BookingStep3'
import BookingStep4 from '@/components/booking/BookingStep4'
import SEO from '@/components/seo/SEO'

function buildDefaults(params: URLSearchParams): Partial<BookingFormData> {
  const defaults: Partial<BookingFormData> = {}

  const propertyTypeMap: Record<string, BookingFormData['propertyType']> = {
    apartment:   'apartment',
    '1-2bed':    '1-2bed',
    '3-4bed':    '3-4bed',
    '5plus':     '5+bed',
    '5+bed':     '5+bed',
    commercial:  'commercial',
  }
  const serviceTypeMap: Record<string, BookingFormData['serviceType']> = {
    standard:        'standard',
    deep:            'deep',
    moveout:         'moveout',
    postconstruction:'postconstruction',
    airbnb:          'airbnb',
    commercial:      'commercial',
  }
  const freqMap: Record<string, BookingFormData['frequency']> = {
    'one-time': 'one-time',
    weekly:     'weekly',
    biweekly:   'biweekly',
    monthly:    'monthly',
  }

  const size = params.get('size')
  if (size && propertyTypeMap[size]) defaults.propertyType = propertyTypeMap[size]

  const service = params.get('service')
  if (service && serviceTypeMap[service]) defaults.serviceType = serviceTypeMap[service]

  const serviceType = params.get('serviceType')
  if (serviceType && serviceTypeMap[serviceType]) defaults.serviceType = serviceTypeMap[serviceType]

  const freq = params.get('freq')
  if (freq && freqMap[freq]) defaults.frequency = freqMap[freq]

  if (params.get('commercial') === '1') {
    defaults.serviceType = 'commercial'
    defaults.propertyType = 'commercial'
  }

  return defaults
}

export default function BookingPage() {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const source = detectLeadSource(searchParams)

  useEffect(() => {
    logBookingStarted()
  }, [])

  const methods = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceType:      'standard',
      propertyType:     '3-4bed',
      bedrooms:         3,
      bathrooms:        1,
      pets:             false,
      frequency:        'one-time',
      preferredDate:    '',
      addOns:           [],
      squareFootage:    undefined,
      firstName:        '',
      lastName:         '',
      email:            '',
      phone:            '',
      address:          '',
      preferredCleaner: null,
      notes:            '',
      marketingConsent: false,
      ...buildDefaults(searchParams),
    },
    mode: 'onTouched',
  })

  const onSubmit = async (data: BookingFormData) => {
    setSubmitError(null)
    try {
      const lang = i18n.language === 'fr' ? 'fr' : 'en'
      const bookingId = await submitBooking(data, lang, source)
      logBookingCompleted(data.serviceType)
      void navigate('/thank-you', {
        state: {
          firstName:     data.firstName,
          email:         data.email,
          serviceType:   data.serviceType,
          preferredDate: data.preferredDate,
          frequency:     data.frequency,
          bookingId,
        },
      })
    } catch {
      setSubmitError(t('booking.errors.submit'))
    }
  }

  return (
    <>
      <SEO
        title={t('booking.pageTitle')}
        description={t('booking.metaDesc')}
      />

      <section className="bg-warm-white py-16 px-4 md:py-24 md:px-6">
        <div className="max-w-content mx-auto">
          <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-2">
            {t('booking.heading')}
          </h1>
          <p className="font-body text-base text-text-muted">{t('booking.subhead')}</p>
        </div>
      </section>

      <section className="bg-cream py-10 px-4 md:py-14 md:px-6">
        <div className="max-w-2xl mx-auto">
          <FormProvider {...methods}>
            <form onSubmit={(e) => { void methods.handleSubmit(onSubmit)(e); }} noValidate className="space-y-8">
              <BookingStep1 />
              <BookingStep2 />
              <BookingStep3 />
              <BookingStep4 submitError={submitError} />
            </form>
          </FormProvider>
        </div>
      </section>
    </>
  )
}

```

---

## File: src/pages/FaqPage.tsx

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import JsonLd from '@/components/seo/JsonLd'
import { getFaqSchema } from '@/lib/utils/seo'
import SEO from '@/components/seo/SEO'

interface FaqItem {
  id: string
  qKey: string
  aKey: string
}

const FAQ_ITEMS: FaqItem[] = [
  { id: 'home',         qKey: 'faq.item1.q',  aKey: 'faq.item1.a'  },
  { id: 'eco',          qKey: 'faq.item2.q',  aKey: 'faq.item2.a'  },
  { id: 'same-cleaner', qKey: 'faq.item3.q',  aKey: 'faq.item3.a'  },
  { id: 'akwesasne',    qKey: 'faq.item4.q',  aKey: 'faq.item4.a'  },
  { id: 'snye',         qKey: 'faq.item5.q',  aKey: 'faq.item5.a'  },
  { id: 'airbnb',       qKey: 'faq.item6.q',  aKey: 'faq.item6.a'  },
  { id: 'reschedule',   qKey: 'faq.item7.q',  aKey: 'faq.item7.a'  },
  { id: 'insured',      qKey: 'faq.item8.q',  aKey: 'faq.item8.a'  },
  { id: 'guarantee',    qKey: 'faq.item9.q',  aKey: 'faq.item9.a'  },
  { id: 'payment',      qKey: 'faq.item10.q', aKey: 'faq.item10.a' },
]

export default function FaqPage() {
  const { t } = useTranslation()
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())
  const faqSchema = getFaqSchema(t)

  const toggle = (i: number) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(i)) {
        next.delete(i)
      } else {
        next.add(i)
      }
      return next
    })
  }

  return (
    <>
      <SEO
        title={t('faq.pageTitle')}
        description={t('faq.metaDesc')}
      />
      <JsonLd schema={faqSchema} />

      {/* Page hero */}
      <section className="bg-warm-white py-16 px-4 md:py-24 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4">
              {t('faq.heading')}
            </h1>
            <p className="font-body text-base text-text-muted">{t('faq.subhead')}</p>
          </motion.div>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="bg-cream py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-sand rounded shadow-sm divide-y divide-sand px-6">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openItems.has(i)
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${item.id}`}
                    onClick={() => toggle(i)}
                    className="w-full flex items-center justify-between gap-4 py-5
                               font-sub text-lg text-charcoal text-left
                               hover:text-slate-brand transition-colors
                               focus:outline-none focus:ring-2 focus:ring-slate-brand
                               focus:ring-inset min-h-[48px]"
                  >
                    <span>{t(item.qKey)}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      aria-hidden="true"
                      className="shrink-0 text-slate-brand"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${item.id}`}
                        key={`answer-${item.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="font-body text-base text-charcoal pb-5 pr-6 leading-relaxed">
                          {t(item.aKey)}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-warm-white py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-content mx-auto text-center">
          <h2 className="font-display text-3xl text-charcoal mb-2">{t('faq.ctaHeading')}</h2>
          <p className="font-body text-base text-text-muted mb-8">{t('faq.ctaSubhead')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:+16139353555"
              className="inline-flex items-center justify-center font-body font-medium
                         text-base text-slate-brand border border-slate-brand rounded
                         px-8 min-h-[48px] hover:bg-slate-brand hover:text-white
                         transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand"
            >
              {t('phone')}
            </a>
            <Link
              to="/booking"
              className="inline-flex items-center justify-center font-body font-medium
                         text-base bg-slate-brand text-white hover:bg-slate-dark rounded
                         px-8 min-h-[48px] transition-colors
                         focus:outline-none focus:ring-2 focus:ring-slate-brand
                         focus:ring-offset-2"
            >
              {t('common.bookNow')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

```

---

## File: src/pages/Gallery.tsx

```tsx
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils/utils'
import { GALLERY_PAIRS } from '@/lib/data/galleryData'
import GalleryImage from '@/components/ui/GalleryImage'
import Lightbox from '@/components/ui/Lightbox'
import SEO from '@/components/seo/SEO'
import { fadeUp, stagger } from '@/lib/utils/animations'

export default function Gallery() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>, idx: number) => {
    triggerRef.current = e.currentTarget
    setActiveIndex(idx)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => { triggerRef.current?.focus() }, 200)
  }

  const handlePrev = () => setActiveIndex(i => Math.max(0, i - 1))
  const handleNext = () => setActiveIndex(i => Math.min(GALLERY_PAIRS.length - 1, i + 1))

  return (
    <main className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <SEO
        title={t('gallery.meta.title')}
        description={t('gallery.meta.description')}
      />
      <div className="max-w-content mx-auto">
        {/* Page heading */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-12"
        >
          <h1 className="font-display text-5xl text-charcoal mb-4">
            {t('gallery.pageHeading')}
          </h1>
          <p className="font-body text-base text-text-muted max-w-xl">
            {t('gallery.pageSubhead')}
          </p>
        </motion.div>

        {/* Gallery grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {GALLERY_PAIRS.map((pair, idx) => {
            const serviceTitle = t(`services.${pair.serviceKey}.title`)
            const beforeAlt = t('gallery.beforeAlt', { service: serviceTitle })
            const afterAlt = t('gallery.afterAlt', { service: serviceTitle })

            return (
              <motion.div key={pair.id} variants={fadeUp}>
                <button
                  onClick={e => handleOpen(e, idx)}
                  aria-label={t(pair.captionKey)}
                  className={cn(
                    'group block w-full text-left rounded',
                    'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
                  )}
                >
                  <div className="grid grid-cols-2 aspect-[4/3] rounded overflow-hidden">
                    <div className="relative">
                      <span className="absolute top-1.5 left-1.5 z-10 bg-charcoal/70 text-white font-body text-xs px-1.5 py-0.5 rounded">
                        {t('gallery.beforeLabel')}
                      </span>
                      <GalleryImage
                        src={pair.beforeSrc}
                        alt={beforeAlt}
                        className="absolute inset-0"
                      />
                    </div>
                    <div className="relative border-l border-white/20">
                      <span className="absolute top-1.5 left-1.5 z-10 bg-charcoal/70 text-white font-body text-xs px-1.5 py-0.5 rounded">
                        {t('gallery.afterLabel')}
                      </span>
                      <GalleryImage
                        src={pair.afterSrc}
                        alt={afterAlt}
                        className="absolute inset-0"
                      />
                    </div>
                  </div>
                  <p className="font-body text-sm text-text-muted mt-3 group-hover:text-charcoal transition-colors">
                    {t(pair.captionKey)}
                  </p>
                </button>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Booking CTA */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mt-16 text-center"
        >
          <h2 className="font-sub text-2xl text-charcoal mb-6">
            {t('gallery.ctaHeading')}
          </h2>
          <Link
            to="/booking"
            className={cn(
              'inline-flex items-center font-body font-medium text-base rounded',
              'min-h-[48px] px-6 py-3 bg-slate-brand text-white',
              'hover:bg-slate-dark transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
            )}
          >
            {t('common.bookNow')} →
          </Link>
        </motion.div>
      </div>

      <AnimatePresence>
        {open && (
          <Lightbox
            key="lightbox"
            pairs={GALLERY_PAIRS}
            index={activeIndex}
            onClose={handleClose}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}
      </AnimatePresence>
    </main>
  )
}

```

---

## File: src/pages/Home.tsx

```tsx
import { useTranslation } from 'react-i18next'
import SEO from '@/components/seo/SEO'
import Hero from '@/components/home/Hero'
import TrustBar from '@/components/home/TrustBar'
import QuoteCalculator from '@/components/home/QuoteCalculator'
import ServicesGrid from '@/components/home/ServicesGrid'
import RecurringCTA from '@/components/home/RecurringCTA'
import GalleryPreview from '@/components/home/GalleryPreview'
import HowItWorks from '@/components/home/HowItWorks'
import MeetTheTeam from '@/components/home/MeetTheTeam'
import Reviews from '@/components/home/Reviews'

export default function Home() {
  const { t } = useTranslation()
  return (
    <>
      <SEO
        title={t('home.title')}
        description={t('home.description')}
      />
      <Hero />
      <TrustBar />
      <QuoteCalculator />
      <ServicesGrid />
      <RecurringCTA />
      <GalleryPreview />
      <HowItWorks />
      <MeetTheTeam />
      <Reviews />
    </>
  )
}

```

---

## File: src/pages/LocationPage.tsx

```tsx
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { LocationConfig } from '@/lib/data/locationData'
import SEO from '@/components/seo/SEO'

export default function LocationPage({ config }: { config: LocationConfig }) {
  const { t } = useTranslation()
  const locationName = t(config.headingKey)

  return (
    <>
      <SEO
        title={t(config.pageTitleKey)}
        description={t(config.metaDescKey)}
      />

      {/* Page hero */}
      <section className="bg-warm-white py-16 px-4 md:py-24 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4">
              {t(config.headingKey)}
            </h1>
            <p className="font-body text-lg text-charcoal font-bold mb-4">{t(config.subheadKey)}</p>
            <p className="font-body text-lg text-charcoal font-bold max-w-2xl leading-relaxed">
              {t(config.descriptionKey)}
            </p>
          </motion.div>

          {/* Optional callout — Akwesasne island note, Snye QC border note */}
          {config.calloutKey != null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="mt-8 flex items-start gap-4 bg-slate-pale border border-sand rounded p-5"
            >
              <div className="shrink-0 mt-0.5" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-slate-brand"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <p className="font-body text-lg text-charcoal font-bold">{t(config.calloutKey)}</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Services available */}
      <section className="bg-cream py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-content mx-auto">
          <h2 className="font-sub text-2xl text-charcoal mb-6">
            {t('locations.servicesHeading')}
          </h2>
          <ul className="flex flex-wrap gap-3" role="list">
            {config.services.map(service => (
              <li key={service}>
                <Link
                  to={`/booking?serviceType=${service}`}
                  className="inline-flex items-center font-body text-base text-slate-brand
                             border border-slate-brand rounded px-4 min-h-[48px]
                             hover:bg-slate-brand hover:text-white
                             transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand"
                >
                  {t(`services.${service}.title`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Map + booking CTA */}
      <section className="bg-warm-white py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-content mx-auto">
          <div className="rounded overflow-hidden border border-sand mb-10">
            <iframe
              title={t('locations.mapLabel', { location: locationName })}
              src={`https://maps.google.com/maps?q=${config.mapQuery}&output=embed`}
              className="w-full h-64 md:h-96 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="text-center">
            <Link
              to="/booking"
              aria-label={t('locations.bookAriaLabel', { location: locationName })}
              className="inline-flex items-center justify-center font-body font-medium text-base
                         bg-slate-brand text-white hover:bg-slate-dark rounded px-8 min-h-[48px]
                         transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand
                         focus:ring-offset-2"
            >
              {t('locations.bookCta', { location: locationName })}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

```

---

## File: src/pages/LocationsOverview.tsx

```tsx
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ALL_LOCATIONS } from '@/lib/data/locationData'
import SEO from '@/components/seo/SEO'

export default function LocationsOverview() {
  const { t } = useTranslation()

  return (
    <>
      <SEO
        title={t('locations.overview.pageTitle')}
        description={t('locations.overview.metaDesc')}
      />

      <section className="bg-warm-white py-16 px-4 md:py-24 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-10"
          >
            <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4">
              {t('locations.overview.heading')}
            </h1>
            <p className="font-body text-lg text-charcoal font-bold">
              {t('locations.overview.subhead')}
            </p>
          </motion.div>

          <motion.ul
            role="list"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            {ALL_LOCATIONS.map(loc => (
              <li key={loc.slug}>
                <Link
                  to={`/locations/${loc.slug}`}
                  className="block bg-white border border-sand rounded shadow-sm p-6
                             hover:border-slate-brand hover:shadow-md
                             transition-all focus:outline-none focus:ring-2
                             focus:ring-slate-brand min-h-[48px]"
                >
                  <h2 className="font-sub text-xl text-charcoal mb-2">
                    {t(loc.headingKey)}
                  </h2>
                  <p className="font-body text-lg text-charcoal font-bold mb-4">
                    {t(loc.subheadKey)}
                  </p>
                  <span
                    className="font-body text-base text-slate-brand underline underline-offset-2"
                    aria-hidden="true"
                  >
                    {t('locations.overview.viewLocation')}
                  </span>
                </Link>
              </li>
            ))}
          </motion.ul>
        </div>
      </section>
    </>
  )
}

```

---

## File: src/pages/PlaceholderPage.tsx

```tsx
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils/utils'
import SEO from '@/components/seo/SEO'

interface PlaceholderPageProps {
  titleKey: string
  epicNote: string
}

/**
 * Reusable placeholder used for all stub routes in E03.
 * Each page will be replaced by its real content in the corresponding epic.
 */
export default function PlaceholderPage({ titleKey }: PlaceholderPageProps) {
  const { t } = useTranslation()
  const pageTitle = t(titleKey)
  return (
    <>
      <SEO
        title={`${pageTitle} — Fresh Nest Co.`}
        description={t('placeholder.metaDesc', { page: pageTitle })}
      />
      <div className="py-20 px-6 text-center max-w-content mx-auto">
        <h1 className="font-display text-4xl text-charcoal mb-4">
          {t(titleKey)}
        </h1>
        <Link
          to="/"
          className={cn(
            'bg-slate-brand text-white font-body font-medium rounded',
            'px-6 min-h-[48px] inline-flex items-center',
            'hover:bg-slate-dark transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2',
          )}
        >
          {t('nav.home')}
        </Link>
      </div>
    </>
  )
}

```

---

## File: src/pages/PricingPage.tsx

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import QuoteCalculator from '@/components/home/QuoteCalculator'
import { calculateQuote, type QuoteServiceType } from '@/lib/utils/quotePricing'
import SEO from '@/components/seo/SEO'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08 },
  }),
}

const SERVICE_CARDS: Array<{
  key: string
  titleKey: string
  descKey: string
  type: QuoteServiceType | null
}> = [
  { key: 'standard',         titleKey: 'services.standard.title',         descKey: 'services.standard.description',         type: 'standard'         },
  { key: 'deep',             titleKey: 'services.deep.title',             descKey: 'services.deep.description',             type: 'deep'             },
  { key: 'moveout',          titleKey: 'services.moveout.title',          descKey: 'services.moveout.description',          type: 'moveout'          },
  { key: 'postconstruction', titleKey: 'services.postconstruction.title', descKey: 'services.postconstruction.description', type: 'postconstruction' },
  { key: 'airbnb',           titleKey: 'services.airbnb.title',           descKey: 'services.airbnb.description',           type: 'airbnb'           },
  { key: 'commercial',       titleKey: 'services.commercial.title',       descKey: 'services.commercial.description',       type: null               },
]

const FREQUENCY_ITEMS: Array<{
  key: string
  labelKey: string
  saveKey: string
  taglineKey: string
  popular?: boolean
}> = [
  { key: 'weekly',   labelKey: 'quote.frequency.weekly',   saveKey: 'booking.fields.frequency.discounts.weekly',   taglineKey: 'recurring.tagline.weekly'                },
  { key: 'biweekly', labelKey: 'quote.frequency.biweekly', saveKey: 'booking.fields.frequency.discounts.biweekly', taglineKey: 'recurring.tagline.biweekly', popular: true },
  { key: 'monthly',  labelKey: 'quote.frequency.monthly',  saveKey: 'booking.fields.frequency.discounts.monthly',  taglineKey: 'recurring.tagline.monthly'                },
]

export default function PricingPage() {
  const { t } = useTranslation()

  return (
    <>
      <SEO
        title={t('pricing.meta.title')}
        description={t('pricing.meta.description')}
      />
      <main id="main-content">
      {/* Hero */}
      <section className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <h1 className="font-display text-5xl text-charcoal mb-4">
              {t('pricing.hero.title')}
            </h1>
            <p className="font-body text-lg text-charcoal font-bold max-w-xl">
              {t('pricing.hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Service pricing cards */}
      <section
        aria-labelledby="pricing-services-heading"
        className="bg-cream py-12 px-4 md:py-20 md:px-6"
      >
        <div className="max-w-content mx-auto">
          <h2
            id="pricing-services-heading"
            className="font-display text-4xl text-charcoal mb-2"
          >
            {t('pricing.services.heading')}
          </h2>
          <p className="font-body text-lg text-charcoal font-bold mb-8">
            {t('pricing.services.reference')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICE_CARDS.map(({ key, titleKey, descKey, type }, i) => {
              const quote = type ? calculateQuote('1-2bed', type, 'one-time') : null
              const priceDisplay =
                quote && quote.type === 'range'
                  ? t('pricing.price.range', { min: quote.min, max: quote.max })
                  : t('pricing.services.commercial')

              return (
                <motion.div
                  key={key}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={i + 1}
                  className="bg-white rounded border border-sand p-6 flex flex-col"
                >
                  <h3 className="font-sub text-2xl text-charcoal mb-1">
                    {t(titleKey)}
                  </h3>
                  <p className="font-display text-3xl text-slate-brand mb-3">
                    {priceDisplay}
                  </p>
                  <p className="font-body text-lg text-charcoal font-bold flex-1 mb-4">
                    {t(descKey)}
                  </p>
                  <Link
                    to={type ? `/booking?service=${type}` : '/booking?commercial=1'}
                    className="inline-flex items-center justify-center bg-slate-brand text-white font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-dark transition-colors duration-200"
                  >
                    {t('common.bookNow')}
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Frequency savings */}
      <section
        aria-labelledby="pricing-frequency-heading"
        className="bg-warm-white py-12 px-4 md:py-20 md:px-6"
      >
        <div className="max-w-content mx-auto">
          <h2
            id="pricing-frequency-heading"
            className="font-display text-4xl text-charcoal mb-2"
          >
            {t('pricing.frequency.heading')}
          </h2>
          <p className="font-body text-lg text-charcoal font-bold mb-8">
            {t('pricing.frequency.cta')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FREQUENCY_ITEMS.map(({ key, labelKey, saveKey, taglineKey, popular }, i) => (
              <motion.div
                key={key}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i + 1}
                className="relative bg-white rounded border border-sand p-6"
              >
                {popular && (
                  <span className="absolute top-4 right-4 bg-slate-brand text-white font-body text-sm font-medium rounded px-2 py-0.5">
                    {t('recurring.mostPopular')}
                  </span>
                )}
                <p className="font-sub text-xl text-charcoal mb-1">{t(labelKey)}</p>
                <p className="font-display text-3xl text-slate-brand mb-3">{t(saveKey)}</p>
                <p className="font-body text-lg text-charcoal font-bold">{t(taglineKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Embedded calculator */}
      <QuoteCalculator />

      {/* CTA strip */}
      <section className="bg-slate-brand py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-content mx-auto text-center">
          <h2 className="font-display text-4xl text-white mb-6">
            {t('pricing.cta.heading')}
          </h2>
          <Link
            to="/booking"
            className="inline-flex items-center bg-white text-slate-brand font-body font-medium rounded px-8 py-4 min-h-[48px] hover:bg-slate-pale transition-colors duration-200"
          >
            {t('pricing.cta.button')}
          </Link>
        </div>
      </section>
    </main>
    </>
  )
}

```

---

## File: src/pages/ServicePage.tsx

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { ServiceConfig } from '@/lib/data/serviceData'
import { calculateQuote } from '@/lib/utils/quotePricing'
import JsonLd from '@/components/seo/JsonLd'
import { getServiceSchema } from '@/lib/utils/seo'
import SEO from '@/components/seo/SEO'

// ─── Animation variant ────────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.1 },
  }),
}

// ─── Static data ──────────────────────────────────────────────────────────────
const HOW_IT_WORKS_STEPS = [
  { titleKey: 'step1Title', descKey: 'step1Desc', number: '1' },
  { titleKey: 'step2Title', descKey: 'step2Desc', number: '2' },
  { titleKey: 'step3Title', descKey: 'step3Desc', number: '3' },
] as const

const TRUST_SIGNALS = [
  { statKey: 'trust1Stat', labelKey: 'trust1Label' },
  { statKey: 'trust2Stat', labelKey: 'trust2Label' },
  { statKey: 'trust3Stat', labelKey: 'trust3Label' },
] as const

interface Props {
  config: ServiceConfig
}

export default function ServicePage({ config }: Props) {
  const { t } = useTranslation()
  const k = `servicePage.${config.key}`

  const priceResult = config.pricingKey
    ? calculateQuote('1-2bed', config.pricingKey, 'one-time')
    : null
  const priceMin =
    priceResult && priceResult.type === 'range' ? priceResult.min : null

  const pageTitle = t(`${k}.hero.heading`)
  const serviceSchema = getServiceSchema(config.key, t)

  return (
    <>
      <SEO
        title={`${pageTitle} — Fresh Nest Co.`}
        description={t(`${k}.hero.subhead`)}
      />
      <main id="main-content">
        <JsonLd schema={serviceSchema} />

      {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
      <section
        aria-labelledby={`${config.key}-hero-heading`}
        className="relative bg-charcoal overflow-hidden"
      >
        {/* Hero image */}
        <div className="absolute inset-0">
          <img
            src={`/images/${config.key}-hero.jpg`}
            alt={t(`${k}.hero.imgAlt`)}
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/70 to-charcoal/30" />
        </div>

        <div className="relative max-w-content mx-auto py-20 px-4 md:py-32 md:px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="max-w-xl"
          >
            <Link
              to="/services"
              className="inline-flex items-center font-body text-base text-slate-light hover:text-white transition-colors mb-6 min-h-[48px]"
            >
              {t('servicePage.backLink')}
            </Link>
            <h1
              id={`${config.key}-hero-heading`}
              className="font-display text-5xl text-white mb-4"
            >
              {pageTitle}
            </h1>
            <p className="font-body text-lg text-slate-pale font-bold max-w-lg mb-8">
              {t(`${k}.hero.subhead`)}
            </p>
            <Link
              to={`/booking?serviceType=${config.key}`}
              className="inline-flex items-center justify-center font-body font-medium text-base bg-slate-brand text-white hover:bg-slate-dark rounded px-8 min-h-[48px] transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-charcoal"
            >
              {t('servicePage.bookCta')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── 2. What's Included ────────────────────────────────────────────── */}
      <section className="bg-warm-white py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="font-display text-4xl text-charcoal mb-8"
          >
            {t('servicePage.common.includedHeading')}
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.includedItems.map((item, i) => (
              <motion.div
                key={item}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="flex items-start gap-3 bg-white border border-sand rounded p-6"
              >
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 text-slate-brand shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="font-body text-lg text-charcoal font-bold">
                  {t(`${k}.included.${item}`)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. How It Works ───────────────────────────────────────────────── */}
      <section className="bg-cream py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="font-display text-4xl text-charcoal mb-8"
          >
            {t('servicePage.common.howItWorksHeading')}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="bg-white border border-sand rounded p-6"
              >
                <span className="font-display text-5xl text-slate-brand block mb-3">
                  {step.number}
                </span>
                <h3 className="font-display text-xl text-charcoal mb-2">
                  {t(`servicePage.common.${step.titleKey}`)}
                </h3>
                <p className="font-body text-lg text-charcoal font-bold leading-relaxed">
                  {t(`servicePage.common.${step.descKey}`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Trust Signals ──────────────────────────────────────────────── */}
      <section className="bg-slate-dark py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="font-display text-4xl text-white mb-8"
          >
            {t('servicePage.common.trustHeading')}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TRUST_SIGNALS.map((signal, i) => (
              <motion.div
                key={signal.statKey}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="bg-charcoal rounded p-6"
              >
                <span className="font-display text-5xl text-slate-pale block mb-2">
                  {t(`servicePage.common.${signal.statKey}`)}
                </span>
                <p className="font-body text-lg text-slate-pale font-bold leading-relaxed">
                  {t(`servicePage.common.${signal.labelKey}`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Pricing Teaser / Custom Pricing ────────────────────────────── */}
      {priceMin !== null ? (
        <section className="bg-warm-white py-12 md:py-20 px-4 md:px-6">
          <div className="max-w-content mx-auto text-center">
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="font-display text-4xl text-charcoal mb-4"
            >
              {t('servicePage.pricingHeading')}
            </motion.h2>
            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="font-body text-xl font-semibold text-charcoal mb-8"
            >
              {t('servicePage.pricingStarting', { min: priceMin })}
            </motion.p>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={2}
            >
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center font-body font-medium text-base border-2 border-slate-brand text-slate-brand hover:bg-slate-brand hover:text-white rounded px-8 min-h-[48px] transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2"
              >
                {t('servicePage.pricingCta')}
              </Link>
            </motion.div>
          </div>
        </section>
      ) : (
        <section className="bg-warm-white py-12 md:py-20 px-4 md:px-6">
          <div className="max-w-content mx-auto text-center">
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="font-display text-4xl text-charcoal mb-4"
            >
              {t('servicePage.customPricingHeading')}
            </motion.h2>
            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="font-body text-lg text-charcoal font-bold mb-8 max-w-xl mx-auto"
            >
              {t('servicePage.customPricingBody')}
            </motion.p>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={2}
            >
              <Link
                to={`/booking?serviceType=${config.key}&commercial=1`}
                className="inline-flex items-center justify-center font-body font-medium text-base bg-slate-brand text-white hover:bg-slate-dark rounded px-8 min-h-[48px] transition-colors focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2"
              >
                {t('servicePage.customPricingCta')}
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── 6. Book CTA Banner ────────────────────────────────────────────── */}
      <section className="bg-slate-brand py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-content mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="font-display text-3xl text-white text-center md:text-left"
          >
            {t('servicePage.bookBanner', { service: pageTitle })}
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="shrink-0"
          >
            <Link
              to={`/booking?serviceType=${config.key}`}
              className="inline-flex items-center justify-center font-body font-medium text-base bg-white text-slate-brand hover:bg-slate-pale rounded px-8 min-h-[48px] transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-brand"
            >
              {t('servicePage.bookBannerCta')}
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
    </>
  )
}

```

---

## File: src/pages/ServicesOverview.tsx

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import ServicesGrid from '@/components/home/ServicesGrid'
import SEO from '@/components/seo/SEO'

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08 },
  }),
}

export default function ServicesOverview() {
  const { t } = useTranslation()

  return (
    <>
      <SEO
        title={`${t('servicePage.overview.heading')} — Fresh Nest Co.`}
        description={t('servicePage.overview.subhead')}
      />
      <main id="main-content">

      <section className="bg-warm-white py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-content mx-auto">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="font-display text-5xl text-charcoal mb-4"
          >
            {t('servicePage.overview.heading')}
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="font-body text-lg text-charcoal font-bold max-w-xl"
          >
            {t('servicePage.overview.subhead')}
          </motion.p>
        </div>
      </section>

      <ServicesGrid />
    </main>
    </>
  )
}

```

---

## File: src/pages/ThankYouPage.tsx

```tsx
import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import SEO from '@/components/seo/SEO'

interface ThankYouState {
  firstName:     string
  email:         string
  serviceType:   string
  preferredDate: string
  frequency:     string
  bookingId:     string
}

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.1 },
  }),
}

const STEPS = [
  { titleKey: 'step1Title', descKey: 'step1Desc' },
  { titleKey: 'step2Title', descKey: 'step2Desc' },
  { titleKey: 'step3Title', descKey: 'step3Desc' },
] as const

export default function ThankYouPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const booking = location.state as ThankYouState | null
  const [copied, setCopied] = useState(false)

  const handleCopy = (link: string) => {
    void navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <SEO
        title={t('thankYou.meta.title')}
        description={t('thankYou.meta.description')}
      />

      {/* Confirmation Banner */}
      <section className="bg-slate-brand py-16 px-4 md:py-24 md:px-6 text-center">
        <div className="max-w-content mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center mb-6"
          >
            <div className="w-16 h-16 rounded bg-white/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </motion.div>

          <motion.h1
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="font-display text-4xl md:text-5xl text-white mb-4"
          >
            {booking
              ? t('thankYou.heading', { name: booking.firstName })
              : t('thankYou.genericHeading')}
          </motion.h1>

          <motion.p
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="font-body text-base text-white/90 max-w-xl mx-auto"
          >
            {booking
              ? t('thankYou.subhead', { email: booking.email })
              : t('thankYou.genericSubhead')}
          </motion.p>
        </div>
      </section>

      {/* Booking Summary Card — only when router state is present */}
      {booking && (
        <section className="bg-cream py-10 px-4 md:py-14 md:px-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-white rounded border border-sand shadow-sm p-6"
            >
              <h2 className="font-sub text-2xl text-charcoal mb-4">
                {t('thankYou.summaryHeading')}
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between items-center border-b border-sand pb-3">
                  <dt className="font-body text-base text-text-muted">{t('thankYou.referenceLabel')}</dt>
                  <dd className="font-body font-medium text-base text-charcoal">
                    #{booking.bookingId.slice(0, 8).toUpperCase()}
                  </dd>
                </div>
                <div className="flex justify-between items-center border-b border-sand pb-3">
                  <dt className="font-body text-base text-text-muted">{t('thankYou.serviceLabel')}</dt>
                  <dd className="font-body font-medium text-base text-charcoal">
                    {t(`services.${booking.serviceType}.title`)}
                  </dd>
                </div>
                <div className="flex justify-between items-center border-b border-sand pb-3">
                  <dt className="font-body text-base text-text-muted">{t('thankYou.dateLabel')}</dt>
                  <dd className="font-body font-medium text-base text-charcoal">
                    {booking.preferredDate}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="font-body text-base text-text-muted">{t('thankYou.frequencyLabel')}</dt>
                  <dd className="font-body font-medium text-base text-charcoal">
                    {t(`quote.frequency.${booking.frequency}`)}
                  </dd>
                </div>
              </dl>
            </motion.div>

            {/* Referral / Sharing Card */}
            <motion.div
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-white rounded border border-sand shadow-sm p-6 mt-6"
            >
              <h2 className="font-sub text-2xl text-charcoal mb-2">
                {t('referrals.referralShareTitle')}
              </h2>
              <p className="font-body text-base text-text-muted mb-4">
                {t('referrals.referralShareDesc')}
              </p>
              
              {/* Display code */}
              <div className="bg-slate-pale border border-sand rounded p-3 mb-4 text-center">
                <span className="font-body text-sm text-text-muted uppercase tracking-wider block mb-1">
                  {t('referrals.promoCodeLabel')}
                </span>
                <span className="font-display text-2xl text-slate-dark font-bold tracking-widest">
                  {`${booking.firstName.toUpperCase()}-${booking.bookingId.slice(0, 4).toUpperCase()}`}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/booking?ref=${booking.firstName.toUpperCase()}-${booking.bookingId.slice(0, 4).toUpperCase()}`}
                  className="flex-grow border border-sand rounded px-4 py-3 min-h-[48px] font-body text-base text-charcoal bg-cream focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(`${window.location.origin}/booking?ref=${booking.firstName.toUpperCase()}-${booking.bookingId.slice(0, 4).toUpperCase()}`)}
                  className="bg-slate-brand text-white font-body font-medium text-base rounded px-6 min-h-[48px] hover:bg-slate-dark transition-colors duration-200"
                >
                  {copied ? t('referrals.linkCopied') : t('referrals.copyLink')}
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* What Happens Next */}
      <section className={`py-12 px-4 md:py-20 md:px-6 ${booking ? 'bg-warm-white' : 'bg-cream'}`}>
        <div className="max-w-content mx-auto">
          <motion.h2
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="font-display text-4xl text-charcoal mb-10 text-center"
          >
            {t('thankYou.nextHeading')}
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ titleKey, descKey }, i) => (
              <motion.div
                key={titleKey}
                custom={i + 1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="bg-white rounded border border-sand shadow-sm p-6 text-center"
              >
                <div className="w-10 h-10 rounded bg-slate-pale flex items-center justify-center mx-auto mb-4">
                  <span className="font-body font-medium text-base text-slate-brand">{i + 1}</span>
                </div>
                <h3 className="font-sub text-xl text-charcoal mb-2">{t(`thankYou.${titleKey}`)}</h3>
                <p className="font-body text-base text-text-muted">{t(`thankYou.${descKey}`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Row */}
      <section className="bg-cream py-12 px-4 md:py-16 md:px-6">
        <div className="max-w-content mx-auto flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/services"
            className="bg-slate-brand text-white font-body font-medium rounded px-8 py-3 min-h-[48px] flex items-center justify-center hover:bg-slate-dark transition-colors duration-200"
          >
            {t('thankYou.ctaServices')}
          </Link>
          <Link
            to="/"
            className="border border-slate-brand text-slate-brand font-body font-medium rounded px-8 py-3 min-h-[48px] flex items-center justify-center hover:bg-slate-pale transition-colors duration-200"
          >
            {t('thankYou.ctaHome')}
          </Link>
        </div>
      </section>
    </>
  )
}

```

---

## File: src/test/setup.ts

```typescript
import '@testing-library/jest-dom';

```

---

## File: src/types/index.ts

```typescript
export type Language = 'en' | 'fr'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
export type ServiceType =
  | 'standard' | 'deep' | 'moveout' | 'postconstruction' | 'airbnb' | 'commercial'
export type Frequency = 'one-time' | 'weekly' | 'biweekly' | 'monthly'

export interface Booking {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  language: Language
  propertyType: string
  bedrooms: number
  bathrooms: number
  squareFootage?: number
  frequency: Frequency
  pets: boolean
  address: string
  serviceType: ServiceType
  addOns: string[]
  preferredDate: string
  preferredCleaner?: string | null
  notes?: string
  leadSource: string
  status: BookingStatus
  assignedTo?: string | null
  isAirbnb: boolean
  photoConfirmation: boolean
  fsmAppointmentId?: string | null
  createdAt: Date
  referredBy?: string | null
  referralCode?: string | null
}

export interface Review {
  id?: string
  name: string
  location: string
  language: Language
  rating: 1 | 2 | 3 | 4 | 5
  text: string
  approved: boolean
  createdAt: Date
}

export interface Persona {
  id: string
  name: string
  primaryService: string
  keyFeature: string
  retentionDriver: string
}

export interface BlogPost {
  slug: string
  title: { en: string; fr: string }
  description: { en: string; fr: string }
  content: { en: string; fr: string }
  publishedAt: string
  author: { en: string; fr: string }
  readTime: { en: string; fr: string }
  image: string
}

```

---

## File: src/vite-env.d.ts

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID: string
  readonly VITE_FIRESTORE_DB_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  __MOCK_SUBMIT__?: (
    data: unknown,
    language: unknown,
    source: unknown,
  ) => Promise<string>
}

```

---

## File: tailwind.config.js

```javascript
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


```

---

## File: tsconfig.app.json

```json
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
    "types": ["vite/client"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "ignoreDeprecations": "6.0",
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}

```

---

## File: tsconfig.json

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

```

---

## File: tsconfig.node.json

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "module": "esnext",
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}

```

---

## File: user-guide/admin-guide.md

```markdown
# Admin Guide — Fresh Nest Co.
**For:** Lauren (Owner/Admin)  
**Updated:** 2026-06-10

---

## Accessing the Admin Dashboard

Navigate to [lilypad-freshnest.web.app/admin](https://lilypad-freshnest.web.app/admin) and sign in with your authorized Google account. 

The dashboard is split into two tabs:
1. **Bookings Management:** Track and manage operational client bookings.
2. **Marketing Analytics:** Monitor marketing lead source volumes, trends, and estimated ROI.

---

## Viewing and Managing Bookings

### Booking Statuses
| Status | Meaning |
| :--- | :--- |
| `pending` | New booking submitted, not yet confirmed |
| `confirmed` | Booking confirmed and scheduled |
| `completed` | Clean completed |
| `cancelled` | Booking cancelled by client or owner |

### Updating a Booking
1. Find the booking in the dashboard table.
2. Click the booking row to expand the detail panel.
3. Use the **Status** dropdown to update the status.
4. Use the **Assigned To** field to assign a cleaner by name (or click custom to type a custom name).
5. **Referral Metadata:** If a referral code was applied, it is highlighted under the booking metadata in this panel (shows referral code used).

---

## Marketing Analytics Tab

Toggle to the **Marketing Analytics** tab to view marketing performance metrics:
- **KPI Cards:** Track estimated total bookings count, estimated revenues (calculated dynamically in-memory based on property specs), average booking values, and **Referred Bookings** (total volume of cleans generated via referral codes).
- **Time Range Filter:** Filter your charts by *All Time*, *Last 30 Days*, *Last 90 Days*, *Year to Date (YTD)*, or *This Month*.
- **Lead Source Distribution:** A visual donut chart showing booking distribution by marketing channels (organic, google ads, referrals, facebook ads, direct).
- **Monthly Trends:** A bar chart tracking estimated revenues month-over-month.
- **Performance Table:** Shows booking count, total estimated revenue, average value, and percentage conversion share for each lead channel.

---

## Automated Recurring Booking Auto-Renewal

To maximize retention and ensure cleaning consistency, a scheduled daily background script runs at **2:00 AM UTC**:
1. **Target Identification:** The function identifies bookings marked as `confirmed` or `completed` with a frequency of `weekly`, `biweekly`, or `monthly`.
2. **Next Date Window:** It projects the next occurrence (+7, +14, or +30 days). If that next date is within a 14-day window from today, it initiates renewal.
3. **De-duplication Check:** The system verifies that no active booking already exists for that user on that specific date.
4. **Draft Generation:** If clear, a new booking is generated with status `pending`, copying all property parameters, preferences, notes, and preferred cleaners.
5. **Client Alerts:** Upon creation, bilingual emails and SMS notifications are automatically sent to notify the client of their upcoming reservation in their chosen language (`en` or `fr`).

---

## Firestore Databases

| Environment | Database | Used For |
| :--- | :--- | :--- |
| Production | `(default)` | Real client bookings |
| Development | `freshnest-dev` | Testing and preview PRs |

To view databases: [Firebase Console → Firestore](https://console.firebase.google.com/project/freshnest-aa51e/firestore)

---

## Deploying Updates

### Automatic (Recommended)
- Push commits to `main` → GitHub Actions automatically builds and deploys to production.
- Open a PR → GitHub Actions creates an ephemeral preview URL (7-day expiry).

### Manual (Emergency)
```bash
npm run build
firebase deploy --only hosting:freshnest-prod
```

---

## Critical Rules

- **Never commit `.env.local`** — it contains private credentials.
- **Never modify `firestore.rules` without human review** — security changes require approval.
- **Never run `git push` directly** — always create a PR for review.
- **Always run `npm run build` before any deploy** — catch TypeScript errors before CI.

```

---

## File: user-guide/booking-guide.md

```markdown
# Booking Guide — Fresh Nest Co.
**For:** Clients booking online  
**Updated:** 2026-06-13 (Phase 4 — Blog & Referrals)

---

## How to Book a Cleaning

1. **Visit our booking page** at [lilypad-freshnest.web.app/booking](https://lilypad-freshnest.web.app/booking).
2. **Service Details:** Select your service type (Standard, Deep, Move-Out, Airbnb, etc.) and enter your property details (bedrooms, bathrooms, pets). If you select Airbnb Turnover, a note confirms the 11am–3pm service window.
3. **Schedule & Add-Ons:** Choose your preferred frequency (one-time, weekly, biweekly, monthly), your preferred date, and any optional add-ons (oven, fridge, windows, etc.).
4. **Contact Info:** Enter your name, email, phone number, and service address. Include your Cornwall Island address or bridge crossing notes if applicable.
5. **Review & Promos (Step 4):** Verify all details. If you were referred by a friend, enter their referral code (or check if it was pre-populated from a referral link) in the **Promo / Referral Code** box and click **Verify**. Once verified, a $20 discount confirmation will display. You can also choose to opt-in to marketing communications.
6. **Submit:** Click the submit button to finalize your appointment.

**Tip:** If you used the Instant Quote Calculator, your property size and service type are carried forward automatically when you click "Book Now".

---

## After You Book

- After submitting, you are taken to a **confirmation page** at `/thank-you` showing your booking summary. 
- **Referral Sharing Loop:** The thank-you page displays a **"Give $20, Get $20"** card with your custom referral code (e.g., `FIRSTNAME-12AB`) and a shareable link. Copy this link or code to share with friends. When they book, they save $20, and you earn a $20 credit!
- You will receive an **email confirmation** within 60 seconds. (French clients receive French-language confirmations.)
- You will receive an **SMS confirmation** to your mobile number within 60 seconds.
- A team member will confirm your booking within 24 hours.
- You will receive a **reminder SMS** 48 hours before your scheduled clean.

---

## Organic Blog & Cleaning Tips

We publish regular clean-living guides, cost analyses, and local Cornwall area service updates on our [Fresh Nest Co. Blog](https://lilypad-freshnest.web.app/blog). Check it out for professional tips!

---

## Special Areas

### Cornwall Island / Akwesasne
We serve Cornwall Island! Please include your island address and any bridge crossing notes in the **Notes** field when booking.

### Snye, QC (Akwesasne Quebec side)
We cross the provincial border to serve the Quebec side of Akwesasne. Include your Snye address when booking.

---

## Frequently Asked Questions

**Do I need to be home?** No — most clients provide entry instructions in the Notes field.

**Can I request the same cleaner?** Yes — use the preferred cleaner field in Step 3.

**How do I reschedule?** Call us at the number in the navigation bar, or reply to your confirmation email.

**What eco-friendly products do you use?** We use certified eco-friendly, pet-safe, and baby-safe products on request.

```

---

## File: vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})

```

---

## File: vitest.config.ts

```typescript
import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    exclude: [...configDefaults.exclude, 'e2e/**'],
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
  },
})

```

