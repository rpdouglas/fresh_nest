# Fresh Nest Co. — Master Project Plan v2
### The Complete Reference Document · Persona-Driven Edition
**Version:** 2.0 · **Date:** June 2025  
**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v3 · Firebase · TanStack Query  
**Methodology:** Persona-Driven Development · Docs-as-Code · Antigravity CLI · Preview Channel CI/CD  
**Region:** Cornwall ON · Akwesasne · Snye QC · Long Sault · Morrisburg  
**Site:** Fresh Nest Co. — Cleaning & Organizing Services · `lilypad-freshnest.web.app`

---

## What Changed in v2

This version incorporates the complete persona suite from `FreshNestCo_BuildPlan_v2.docx`. Every epic, every acceptance criterion, every feature, and every AI agent instruction is now grounded in one of six named, research-backed personas. The site architecture has been expanded to multi-page (from single-page scroll), the Firestore schema is extended, the epic map is updated to 34 epics, and the CLAUDE.md contract now embeds persona-based development rules that every AI agent must follow.

**Persona-based development** means no feature is built without a named persona driving it, no acceptance criterion is written without a persona test, and no AI agent generates code without first reading `docs/PERSONAS.md` and identifying which persona the current epic serves.

---

## How to Use This Document

- **Part A** — Architecture, decisions, stack, market context
- **Part B** — Step 0: exact environment setup commands
- **Part C** — Docs-as-code, CLAUDE.md, agentic workflow governance
- **Part D** — All 34 development epics with persona attribution and acceptance criteria
- **Part E** — Reference: git workflow, decisions log, integrations
- **Part F** — Phase 6: business operations platform

Every AI agent must read Parts A and C before touching any code.

---

---

# PART A — Architecture & Decisions

---

## A1. Regional Market Context

Fresh Nest Co. operates in a unique tri-border corridor where Ontario, Quebec, and New York State converge within 30 km of the service area. This context is not background information — it is a hard constraint on every feature decision.

| Fact | Implication |
|---|---|
| Cornwall population ~47,845 · avg age 45.0 | Older-skewing market; highest demand for recurring domestic services |
| Median household income $60,000 | Price transparency is a trust signal, not a liability |
| 12.4% unemployment rate | Price sensitivity is real; discount tiers and clear value proposition essential |
| 19.3% French primary speakers | Bilingual UX is a competitive differentiator, not a nice-to-have |
| 65+ cohort: 12,145 people | Single largest addressable segment; accessibility requirements are mandatory |
| Akwesasne territory ~14,000 residents | Distinct community, distinct service logic, not a generic postal code |
| Snye QC (Quebec-side Akwesasne) | Most services stop at the provincial border; serving it is a differentiator |
| Cross-border dynamic / Airbnb corridor | Move-in/move-out and turnover cleaning are high-margin specialty segments |
| No Cornwall brand combines: digital booking + bilingual + Akwesasne + eco | Fresh Nest Co. can own this positioning entirely |

**Competitive landscape:** ServiceMaster (restoration-focused), Molly Maid / Cleaning Authority (national franchises, no bilingual capability), Facebook Marketplace independents (no booking system, no insurance proof). No direct digital-first local competitor.

---

## A2. Tech Stack

| Layer | Technology | Version | Reason |
|---|---|---|---|
| UI Framework | React | 19 | Latest stable; `use()`, `useOptimistic`, improved ref handling |
| Language | TypeScript | Latest | Strict mode; catches Firestore shape errors at compile time |
| Build Tool | Vite | Latest | CRA deprecated; instant HMR; native ES modules |
| CSS Framework | **Tailwind CSS v3.4.x** | v3 | AI agentic tools generate v3 by default; silent v4 failures in autonomous workflow |
| Routing | React Router | v6 | `createBrowserRouter`; multi-page SPA routing |
| Animations | Framer Motion | Latest | Scroll reveals; gentle, on-brand micro-interactions |
| Server State | TanStack Query | v5 | Caching, background refetch, devtools |
| Firebase Integration | @tanstack-query-firebase/react | Latest | Typed Firestore hooks into TanStack Query cache |
| Forms | React Hook Form + Zod | Latest | Client-first SPA validation; real-time field errors |
| Class Utilities | clsx + tailwind-merge | Latest | Conflict-free conditional class composition |
| Hosting | Firebase Hosting | — | CDN-backed, free SSL, preview channels |
| Database | Firestore | — | Two isolated databases: `(default)` prod, `freshnest-dev` dev |
| Auth | Firebase Auth | — | Google sign-in for admin only (Phase 5) |
| Functions | Cloud Functions | — | Email + SMS notifications; FSM integration (Phase 6) |
| CI/CD | GitHub Actions | — | PR → preview channel; `main` → production |
| Environment | GitHub Codespaces | — | Zero local setup |

---

## A3. Architecture Decision Log

### ADR-001 — Tailwind CSS v3 over v4 · Accepted 2025-06-06
Antigravity and Claude Code generate v3 syntax by default. Tailwind v4 class failures are silent — no build error, just invisible styles. In autonomous agentic workflows, this creates compounding debugging overhead. No v1 feature requires v4-only utilities.

### ADR-002 — Multiple Firestore Databases in One Project · Accepted 2025-06-06
`(default)` for production, `freshnest-dev` for development. True data isolation without managing two Firebase projects. Selected via `VITE_FIRESTORE_DB_ID` at build time.

### ADR-003 — React Hook Form + Zod over React 19 Native Forms · Accepted 2025-06-06
React 19's native form handling targets SSR/Next.js. Fresh Nest Co. is a Vite SPA with client-side Firebase writes. RHF provides real-time field errors and schema validation that `useActionState` does not cleanly replicate in this context.

### ADR-004 — Preview Channel CI/CD, No Permanent Staging Branch · Accepted 2025-06-06
Every PR gets an ephemeral Firebase Preview Channel URL (auto-expires 7 days, points to dev DB). Cleaner than a permanent staging environment for a solo developer.

### ADR-005 — Multi-Page Architecture over Single-Page Scroll · Accepted 2025-06-06
Each service and location page can rank independently on Google. A page titled "House Cleaning Cornwall ON" drives local search traffic that a homepage section cannot. Required for the Cornwall/Akwesasne market. The personas Travis, Sophie, and Kahnawà:ke all check the service area before anything else — they need a page, not a scroll target.

### ADR-006 — Bilingual UX (EN/FR) as Core Architecture · Accepted 2025-06-06
19.3% of Cornwall residents are French primary speakers. Sophie (Snye QC) will leave an English-only website immediately. Diane (francophone homeowner) reads English but prefers French. Bilingual support is not a Phase 2 feature — it is a launch requirement for two of six personas. Language state is stored in React context, toggled in the nav, and passed to Firestore `language` field to drive bilingual email/SMS communications.

---

## A4. Firebase Project Architecture

```
Firebase Project: rpd-pawn-shop
│
├── Hosting Sites
│   ├── lilypad-freshnest        → Production (lilypad-freshnest.web.app)
│   └── lilypad-freshnest-dev    → Dev/Preview target
│
├── Firestore Databases
│   ├── (default)                → Production: real bookings, approved reviews
│   └── freshnest-dev            → Dev/preview: test data, seed reviews
│
└── Firebase Auth (shared)       → Admin only, Phase 5
```

**Environment routing:**
- Feature branch PR → `VITE_FIRESTORE_DB_ID=freshnest-dev`
- Production build (main) → `VITE_FIRESTORE_DB_ID=(default)`
- Local dev (`.env.local`) → `VITE_FIRESTORE_DB_ID=freshnest-dev`

---

## A5. Site Architecture (v2 — Multi-Page)

```
/                           → Homepage (persona-optimised scroll)
/services                   → Services hub
/services/residential-cleaning
/services/deep-cleaning
/services/move-in-move-out
/services/commercial-cleaning
/services/post-construction
/services/airbnb-turnover   ← Gallagher persona flagship page
/locations                  → Location hub (local SEO)
/locations/cornwall-on
/locations/akwesasne        ← Kahnawà:ke persona page
/locations/snye-qc          ← Sophie persona page
/locations/long-sault       ← Travis persona page
/locations/morrisburg
/gallery                    → Before/after photos (Sophie trust signal)
/pricing                    → Transparent package pricing (Travis, Margaret)
/faq                        → Reduced pre-booking call volume
/blog                       → Content SEO engine (Phase 2)
/booking                    → Multi-step booking flow
/thank-you
/admin                      → Firebase Auth protected dashboard
```

---

## A6. Firestore Data Model (v2 — Full Schema)

### Collection: `bookings`

| Field | Type | Required | Notes |
|---|---|---|---|
| `firstName` / `lastName` | `string` | ✅ | |
| `email` | `string` | ✅ | CASL opt-in captured at booking |
| `phone` | `string` | ✅ | For SMS (Travis, Margaret require SMS) |
| `language` | `'en' \| 'fr'` | ✅ | Drives bilingual email/SMS (Diane, Sophie) |
| `propertyType` | `string` | ✅ | apartment / 1-2bed / 3-4bed / 5+bed / commercial |
| `bedrooms` / `bathrooms` | `number` | ✅ | Used in quote calculation |
| `squareFootage` | `number` | ❌ | Optional — approximate |
| `frequency` | `string` | ✅ | one-time / weekly / biweekly / monthly |
| `pets` | `boolean` | ✅ | Triggers eco/pet-safe product note (Diane, Margaret, Sophie) |
| `address` | `string` | ✅ | Full address — island/QC flags trigger operational notes |
| `serviceType` | `string` | ✅ | standard / deep / moveout / postconstruction / airbnb / commercial |
| `addOns` | `string[]` | ❌ | oven / fridge / windows / laundry / petHair / basement |
| `preferredDate` | `string` | ✅ | ISO date YYYY-MM-DD |
| `preferredCleaner` | `string \| null` | ❌ | Diane and Margaret loyalty — same cleaner preference |
| `notes` | `string` | ❌ | Island access, entry codes, special instructions |
| `leadSource` | `string` | ✅ | organic / google / referral / facebook / direct |
| `status` | `string` | ✅ | pending / confirmed / completed / cancelled |
| `assignedTo` | `string \| null` | ✅ | Cleaner name when scheduled |
| `isAirbnb` | `boolean` | ✅ | Triggers Gallagher turnover-specific workflow |
| `photoConfirmation` | `boolean` | ✅ | Gallagher requires completion photos |
| `fsmAppointmentId` | `string \| null` | ❌ | Phase 6: FSM platform sync ID |
| `createdAt` | `Timestamp` | ✅ | Firestore server timestamp |

### Collection: `reviews`

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | ✅ | Display name only |
| `location` | `string` | ✅ | Residential Client / Airbnb Host / Commercial Client |
| `language` | `'en' \| 'fr'` | ✅ | Enables bilingual review display |
| `rating` | `1-5` | ✅ | |
| `text` | `string` | ✅ | |
| `approved` | `boolean` | ✅ | Admin moderation before display |
| `createdAt` | `Timestamp` | ✅ | |

### Collection: `staff` (Phase 6)

| Field | Type | Notes |
|---|---|---|
| `name` / `email` / `phone` | `string` | |
| `role` | `string` | cleaner / lead / supervisor |
| `status` | `string` | onboarding / active / inactive |
| `onboardingChecklist` | `{ [key: string]: boolean }` | |
| `fsmStaffId` | `string \| null` | Phase 6 FSM sync |

**AI Rule:** You NEVER invent fields not in this schema. `docs/firestore-schema.md` is the absolute source of truth.

---

## A7. Design System

### Brand Colors (Tailwind v3 token names — use these, never raw hex)

| Token | Hex | Usage |
|---|---|---|
| `slate-brand` | `#5b7e8f` | Primary CTAs, active states, icons |
| `slate-dark` | `#3f5f6e` | Hover states, nav active, dark backgrounds |
| `slate-light` | `#7fa0b0` | Muted accents, secondary icons |
| `slate-pale` | `#d6e5ec` | Card backgrounds, circles, highlights |
| `cream` | `#f7f3ee` | Alternate section backgrounds |
| `warm-white` | `#fdfaf6` | Default page background |
| `sand` | `#e8ddd0` | Borders, dividers, card borders |
| `sand-dark` | `#c4b09a` | Decorative accent lines |
| `charcoal` | `#2c3a40` | Headings, footer |
| `text-muted` | `#7a8f96` | Body copy, labels |

### Typography

| Role | Font | Tailwind Class | Weights |
|---|---|---|---|
| Display / H1–H3 | Cormorant Garamond | `font-display` | 300, 400, italic |
| Subheadings | Marcellus | `font-sub` | 400 |
| Body / UI | DM Sans | `font-body` | 300 (copy), 500 (CTAs) |

### Accessibility (Margaret — 65+ persona requirement)
- Minimum body text: 16px (`text-base` or larger)
- All interactive elements: minimum 48px touch target
- Colour contrast: WCAG AA minimum across all text/background pairs
- Focus rings: visible on all keyboard-navigable elements
- Phone number: in nav and footer, not just a contact form (Margaret will call)

---

---

# PART B — Step 0: Environment Setup

> Blank `fresh_nest` GitHub repo. Codespaces terminal open. Run every step in order.

---

## B1 — Verify Node & npm

```bash
node -v   # must be v18+
npm -v    # must be v7+
```

If below v18: `nvm install 20 && nvm use 20`

---

## B2 — Scaffold Vite + React 19 + TypeScript

```bash
npm create vite@latest . -- --template react-ts
# When prompted "Remove existing files?" → y
npm install
cat package.json | grep '"react"'
# Expected: "react": "^19.x.x"
```

---

## B3 — Install All Dependencies

```bash
# Tailwind v3 — correct v3 setup. DO NOT use @tailwindcss/vite
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p

# Routing
npm install react-router-dom

# Animations
npm install framer-motion

# Server state + Firebase
npm install @tanstack/react-query @tanstack-query-firebase/react firebase

# Forms + validation
npm install react-hook-form @hookform/resolvers zod

# Class utilities
npm install clsx tailwind-merge

# i18n (bilingual EN/FR — Diane, Sophie persona requirement)
npm install react-i18next i18next i18next-browser-languagedetector

# Dev tooling
npm install -D prettier prettier-plugin-tailwindcss @tanstack/eslint-plugin-query @types/node

# Confirm clean install
npm run build
```

> **Why `react-i18next`?** Two of six personas (Diane, Sophie) require French-language UX. This is a launch requirement per ADR-006. `react-i18next` is the standard for React internationalisation, integrates cleanly with Vite, and works with Tailwind. The language toggle lives in the nav; the selected language is stored in localStorage and in the Firestore `language` field on every booking.

---

## B4 — Configure TypeScript (Strict + Path Alias)

**`tsconfig.app.json`:**
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
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

---

## B5 — Configure Vite (Path Alias)

**`vite.config.ts`:**
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

---

## B6 — Configure Tailwind v3 with Brand Tokens

**`tailwind.config.js`:**
```js
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

**`src/index.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { font-family: 'DM Sans', sans-serif; scroll-behavior: smooth; }
  body { @apply bg-warm-white text-charcoal; }
}
```

---

## B7 — Google Fonts + HTML

In `index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Marcellus&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
<title>Fresh Nest Co. — Cleaning & Organizing Services | Cornwall, ON</title>
```

---

## B8 — Core Source Files

**`src/lib/utils.ts`:**
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
```

**`src/types/index.ts`:**
```ts
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
```

---

## B9 — i18n Configuration

**`src/i18n/index.ts`:**
```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import fr from './locales/fr.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, fr: { translation: fr } },
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr'],
    detection: { order: ['localStorage', 'navigator'] },
    interpolation: { escapeValue: false },
  })

export default i18n
```

Create `src/i18n/locales/en.json` and `src/i18n/locales/fr.json` with all UI strings. Never hardcode French or English strings in components — always use the `t()` hook.

---

## B10 — Environment Variables

**`.env.local`** (gitignored):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=rpd-pawn-shop
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIRESTORE_DB_ID=freshnest-dev
```

**`.env.production`** (committed):
```
VITE_FIREBASE_API_KEY=...
[same values]
VITE_FIRESTORE_DB_ID=(default)
```

```bash
echo ".env.local" >> .gitignore
```

---

## B11 — Firebase SDK

**`src/lib/firebase.ts`:**
```ts
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
})

const dbId = import.meta.env.VITE_FIRESTORE_DB_ID ?? '(default)'
export const db = getFirestore(app, dbId)
export const auth = getAuth(app)
export default app
```

---

## B12 — TanStack Query Provider

**`src/main.tsx`:**
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

## B13 — Firebase Console + CLI Setup

**In Firebase Console:**
1. Add hosting site `lilypad-freshnest` (prod) + `lilypad-freshnest-dev` (dev)
2. Add Firestore database `freshnest-dev` — location `northamerica-northeast1`, test mode

**In terminal:**
```bash
firebase login --no-localhost
firebase init   # Hosting + Firestore + Emulators
firebase target:apply hosting freshnest-prod lilypad-freshnest
firebase target:apply hosting freshnest-dev  lilypad-freshnest-dev
```

---

## B14 — firebase.json

```json
{
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
            { "key": "X-Content-Type-Options", "value": "nosniff" }
        ]}
      ]
    },
    {
      "target": "freshnest-dev",
      "public": "dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
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

## B15 — GitHub Actions (CI/CD)

**`.github/workflows/firebase-preview.yml`** — PR → preview channel (dev DB):
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
          projectId: rpd-pawn-shop
          target: freshnest-dev
          expires: 7d
```

**`.github/workflows/firebase-deploy.yml`** — main → production (prod DB):
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
          projectId: rpd-pawn-shop
          channelId: live
          target: freshnest-prod
```

---

## B16 — Step 0 Go/No-Go Checklist

```
[ ] node -v is v18+
[ ] npm run build passes — zero TypeScript errors
[ ] npm run dev starts at localhost:5173
[ ] tailwind.config.js has all brand tokens
[ ] postcss.config.js exists (v3 required)
[ ] src/lib/firebase.ts routes to correct DB via VITE_FIRESTORE_DB_ID
[ ] src/i18n/ directory with en.json and fr.json
[ ] .env.local has freshnest-dev DB ID — not committed
[ ] .env.production has (default) DB ID — committed
[ ] firebase.json: both hosting targets, both Firestore DB configs
[ ] .firebaserc maps both targets
[ ] firestore.rules and firestore.dev.rules both exist
[ ] GitHub Actions workflows exist (preview + deploy)
[ ] FIREBASE_SERVICE_ACCOUNT + VITE_* secrets in GitHub repo settings
[ ] CLAUDE.md at repo root (written in Part C)
[ ] GEMINI.md symlink → CLAUDE.md
[ ] docs/ directory structure complete (Part C)
[ ] First commit pushed; production deploy succeeded
[ ] lilypad-freshnest.web.app loads in browser
```

---

---

# PART C — Docs-as-Code, Personas & Agentic Workflow

---

## C1. The AI Contract

**Code follows the docs. The docs do not follow the code.**

AI agents read the docs as hard constraints, not suggestions. If generated code conflicts with a doc, the doc wins and the agent surfaces the conflict before proceeding. Persona-based development adds a second constraint: **no feature is built without a named persona driving it.** If an agent cannot name which persona a feature serves, it must halt and ask.

---

## C2. Persona-Based Development — Methodology

### What It Is

Persona-based development (PBD) grounds every feature decision, every piece of copy, and every acceptance criterion in a named, research-backed representation of a real target user. Personas are not decoration — they are the primary filter for scope decisions.

### The Three Rules Every Agent Must Follow

**Rule 1 — No persona, no feature.**
Before implementing any feature, the agent must identify which persona(s) it serves. If the feature doesn't serve a named persona, it is out of scope. If it serves multiple personas, the primary persona is named in the epic spec.

**Rule 2 — Persona tests are acceptance criteria.**
Every epic spec includes a "Persona Test" section. These are not aspirational — they are the literal pass/fail conditions for Phase C ticket close. If Margaret can't complete a booking in under 3 minutes on an iPad, the epic is not done.

**Rule 3 — Copy serves personas, not aesthetics.**
UI copy decisions are made with the primary persona's voice and vocabulary. Diane's confirmation email is in French. Travis's booking form has zero friction. Margaret's font size is never below 16px. Sophie's eco-badge is above the fold. These are not style preferences — they are persona requirements encoded in the spec.

### User Story Format

Every epic generates user stories in the standard format:

> **As [Persona Name], I want to [action] so that [benefit].**

Followed by acceptance criteria in Given/When/Then format:

> **Given** [context] **When** [action] **Then** [outcome]

These stories live in `docs/projects/[epic].md`. They are read by AGY during Phase A planning and validated by the `QA_Engineer` subagent during Phase B.

---

## C3. The Six Personas

Full persona profiles live in `docs/PERSONAS.md`. The AI-readable summary is embedded in `CLAUDE.md`. This section is the canonical reference.

---

### Persona 1 — Diane Lafleur · Francophone Homeowner
**Segment:** Residential Recurring | **Primary Service:** Standard / Eco Clean

| Attribute | Value |
|---|---|
| Age | 58 |
| Location | East Cornwall, ON (Riverdale) |
| Language | French primary · English functional |
| Income | ~$72,000/yr (pension) |
| Home | Owned 3-bed bungalow, 1,450 sq ft |
| Tech | Moderate — Facebook, email, books on mobile with patience |

**Goals:** Maintain her home to a standard she set herself. Consistent cleaner — she will not accept a rotation. Eco-friendly products (cat allergy to chemicals). French-language service.

**Fears:** Being given a stranger with no verifiable reputation. No-shows (she has been burned). English-only service signals the business doesn't want her.

**Buying behaviour:** Deliberate and relationship-driven. Reads the About page, looks for real staff photos, calls if she has any uncertainty. Once she trusts a provider, she rebooks for years and refers her entire church group. **Value: 26 bookings/year + high referral rate.**

**Feature requirements:**
- Bilingual nav toggle + French hero copy + French booking confirmation (CASL-compliant)
- Trust bar with insurance/bonding badges — must be visible without scrolling
- Meet Your Team section with real staff photos and names
- `preferredCleaner` field in booking form and CRM
- Eco-product badge on homepage and service pages
- Phone number in nav header (she will call before booking online)

**Persona Quote:** *"If your website is in English only, I assume you don't want my business. If you have a photo of the owner and it says 'insured and bonded' in French, I'm calling."*

**Persona Test (acceptance):** A French-speaking user can complete the full booking flow — from landing on the homepage to receiving a bilingual confirmation email — entirely in French, without encountering an English-only element.

---

### Persona 2 — Travis McLeod · Busy Trades Professional
**Segment:** Residential Recurring · Time-Poor | **Primary Service:** Standard / Biweekly

| Attribute | Value |
|---|---|
| Age | 38 |
| Location | South Stormont (Long Sault area) |
| Language | English |
| Income | ~$110,000/yr combined |
| Home | Owned 4-bed two-storey, 2,100 sq ft, high-traffic family |
| Tech | High — books everything on his phone, prefers no phone calls |

**Goals:** Eliminate one more thing from his mental load. Transparent pricing — will not call for a quote. Mobile booking in under 3 minutes. Recurring biweekly: set it once and forget it.

**Fears:** "Contact us for a quote" buttons — he leaves immediately. Account creation required before booking. Services that don't cover Long Sault (checks service area first).

**Buying behaviour:** Transactional and fast. Decides within 90 seconds. Checks price, checks service area, reads one review, books. **He is the persona the instant quote calculator was built for.**

**Feature requirements:**
- Instant quote calculator: 4-bed + standard + biweekly → price range in 3 inputs
- `/locations/long-sault` page confirming service area
- Full mobile booking flow, zero account creation required
- SMS confirmation (he is rarely at his computer)
- Add-ons (oven, dog hair) selectable at booking
- Recurring booking with auto-renewal

**Persona Quote:** *"Show me the price. Let me book on my phone. Send me a text when you're confirmed. That's the whole relationship."*

**Persona Test (acceptance):** Travis can land on the homepage, use the instant quote calculator, complete a biweekly booking for a 4-bedroom home, and receive an SMS confirmation — entirely on a mobile device in under 3 minutes, without creating an account or calling.

---

### Persona 3 — Margaret Storey · 65+ Independent Senior
**Segment:** Residential Recurring · Highest Lifetime Value | **Primary Service:** Standard / Weekly

| Attribute | Value |
|---|---|
| Age | 71 |
| Location | Downtown Cornwall (McConnell Ave) |
| Language | English |
| Income | ~$48,000/yr (fixed pension) |
| Home | Owned 2-bed bungalow, 1,150 sq ft, fully paid off |
| Tech | Low-Moderate — iPad, email, Facebook, books cautiously |

**Goals:** Weekly or biweekly clean that keeps her home safe. Consistent cleaner she knows by name. Fixed pricing (she budgets carefully). No surprises — same services, same time, same day, every visit.

**Fears:** Small text and complex navigation. Any sign of rotating staff. No visible phone number — she needs to know she can call a real person.

**Buying behaviour:** Word-of-mouth first, website second. May arrive via neighbour referral or Facebook group post. Will call to confirm before booking online. Once a client, she is effectively permanent and will refer every friend. **Single highest lifetime value persona.**

**Feature requirements:**
- Minimum 16px body text, all elements (WCAG AA)
- 48px minimum tap targets on all interactive elements
- Phone number in nav header AND footer
- Meet Your Team section — real names and photos
- Weekly recurring with day-before SMS reminder
- Pet-friendly product badge prominently displayed
- Fixed-price packages — no "time-and-materials" language
- Referral program: "Give a friend $20 off their first clean"

**Persona Quote:** *"I've tried three cleaning services. The ones I kept were the ones where the same person showed up every time and knew where I kept the mop."*

**Persona Test (acceptance):** Margaret can land on the homepage on an iPad (768px viewport), read all text without zooming, find the phone number in the header, and complete a weekly recurring booking — with tap targets that do not require precision clicking.

---

### Persona 4 — Kahnawà:ke Baptiste · Akwesasne Community Member
**Segment:** Residential One-Time & Recurring | **Primary Service:** Deep / Standard

| Attribute | Value |
|---|---|
| Age | 42 |
| Location | Cornwall Island, Akwesasne (Ontario side) |
| Language | English primary · Mohawk conversational · French functional |
| Income | ~$85,000/yr combined |
| Home | Owned 3-bed on the island |
| Tech | Moderate-High — Facebook, community apps, comfortable booking online |

**Goals:** A cleaning service that actually comes to Cornwall Island. A business respectful of Akwesasne as a distinct community — not a generic service area. Deep cleans before/after family gatherings.

**Fears:** Services that list "Akwesasne" in their area but have never crossed the bridge. Generic corporate language. Booking systems that can't handle island access logistics.

**Buying behaviour:** Community-networked and trust-gated. Will ask in Facebook community groups before searching Google. A single excellent experience converts to a recurring client and a powerful community referral source.

**Feature requirements:**
- `/locations/akwesasne` page with explicit "We serve Cornwall Island" language
- Notes field in booking form with "Island address / bridge crossing notes" placeholder
- About page language demonstrating genuine community relationship — not tourism language
- Community referral program prominently mentioned on the Akwesasne location page
- Optional: one land acknowledgment sentence on About page — authentic, not performative

**Persona Quote:** *"Don't put our community on your service area list if you've never crossed the bridge. If you have — and you did good work — I'll hear about it."*

**Persona Test (acceptance):** The `/locations/akwesasne` page explicitly states service to Cornwall Island, includes island-specific access notes guidance, and the booking form notes field has an island-specific placeholder. A community Facebook post shared by a satisfied client should describe the page as genuinely Akwesasne-aware, not performative.

---

### Persona 5 — Sophie Tremblay-Gagnon · Snye QC Cross-Border Client
**Segment:** Residential One-Time & Recurring | **Primary Service:** Deep / Move-Out

| Attribute | Value |
|---|---|
| Age | 34 |
| Location | Snye, QC (Akwesasne Quebec side) |
| Language | French primary · English functional |
| Income | ~$78,000/yr combined |
| Home | Rented 3-bed; planning to buy in 2 years |
| Tech | Very High — books everything online, expects bilingual digital |

**Goals:** Deep clean before new baby arrives (high urgency). Eco-friendly, baby-safe products (non-negotiable). A service that actually travels to the Quebec side — she has been misled before.

**Fears:** Services that say "Akwesasne" but only serve the Ontario side. English-only websites. No information about baby-safe products.

**Buying behaviour:** Research-heavy and urgency-driven when pregnant. Compares 2–3 services, reads reviews in both languages, books the one that makes her most confident. Responds strongly to before/after gallery and eco-product specifics.

**Feature requirements:**
- `/locations/snye-qc` page with French copy: "Nous servons Akwesasne, côté Québec"
- Eco/baby-safe product information on homepage AND service pages
- Bilingual confirmation emails and SMS in French
- Before/after gallery as primary trust mechanism
- Google Reviews displayed prominently (she verifies independently)

**Persona Quote:** *"I found three cleaning services near Cornwall. Only one had a French option and said they go to Snye. I booked that one in four minutes."*

**Persona Test (acceptance):** Sophie can land on the homepage in French, navigate to the `/locations/snye-qc` page (French copy present), verify eco-product information, view the before/after gallery, and complete a deep clean booking in French — receiving a French-language confirmation email.

---

### Persona 6 — Patricia & Dean Gallagher · Airbnb / STR Owner
**Segment:** Short-Term Rental Turnover | **Primary Service:** Airbnb Turnover Package

| Attribute | Value |
|---|---|
| Age | 49 & 52 |
| Location | South Glengarry (waterfront) |
| Language | English |
| Income | ~$195,000/yr combined |
| Property | Primary + 1 Airbnb unit on the St. Lawrence |
| Tech | High — manages Airbnb via app, expects cleaning to match |

**Goals:** Guaranteed same-day turnover within the 11am–3pm checkout/check-in window. Consistent quality — a bad clean means a bad review means lost revenue. Linen changeover, toiletry restocking, damage photo documentation included.

**Fears:** Services that cannot commit to same-day availability. No photo documentation (they need proof for Airbnb host insurance). Last-minute cancellations — this directly costs revenue.

**Buying behaviour:** High-value, high-expectation, intensely loyal when needs are met. Pays a premium for guaranteed availability. **One Airbnb host generates 40–52 cleaning events per year at premium rates.**

**Feature requirements:**
- Dedicated `/services/airbnb-turnover` page with Airbnb-specific language and scope list
- Airbnb Turnover package: linen change, bathroom reset, kitchen clean, supply count, damage photo
- Priority scheduling: recurring block booking with guaranteed availability window
- SMS/app notification on job completion with photo confirmation
- Admin dashboard view: booking history + receipts (tax documentation for rental income)
- Commercial pricing inquiry flow (custom quote, distinct from residential)

**Persona Quote:** *"I don't need the cheapest. I need the most reliable. If you've never let a client down on a turnover clean, tell me that story. That's what I'm buying."*

**Persona Test (acceptance):** The `/services/airbnb-turnover` page uses Airbnb host language, explicitly lists the 11am–3pm window scope, includes linen and damage photo in the service description, and offers a commercial inquiry form distinct from the standard residential booking flow.

---

## C4. Persona-to-Feature Strategic Map

| Persona | Segment | Primary Service | Key Conversion Feature | Retention Driver |
|---|---|---|---|---|
| Diane Lafleur | Residential Recurring | Standard / Eco | Bilingual UX + Trust Bar + Team Photos | Consistent cleaner + FR email CRM |
| Travis McLeod | Residential Recurring | Standard / Biweekly | Instant Quote Calculator + Mobile Booking | SMS reminders + auto-recurring |
| Margaret Storey | Residential Recurring | Standard / Weekly | Phone # + Accessible Design + Trust | Preferred cleaner + referral credit |
| Kahnawà:ke Baptiste | Residential One-Time/Recurring | Deep / Standard | Akwesasne location page + community trust | Excellent first experience + referral |
| Sophie Tremblay-Gagnon | Residential One-Time/Recurring | Deep / Move-Out | French UX + Eco badge + Before/After gallery | Post-baby recurring + Google review |
| Gallagher (Airbnb) | Short-Term Rental Turnover | Airbnb Turnover | Dedicated page + priority scheduling | Block booking + photo confirmation |

---

## C5. v2 Homepage Section Order (Persona-Informed)

| # | Section | Primary Persona Served |
|---|---|---|
| 1 | Fixed Nav (bilingual EN/FR toggle) | All — Diane/Sophie require FR; Travis requires fast nav |
| 2 | Hero (bilingual CTA variants) | Travis (clear CTA) · Sophie (FR copy) · Margaret (accessible) |
| 3 | Trust Bar | Diane (insured/bonded in FR) · Margaret (reliability) · Gallagher (professional) |
| 4 | Instant Quote Calculator | Travis (price-first) · Sophie (comparison) · Gallagher (custom) |
| 5 | Services Grid (6 cards) | All — clear scope reduces pre-booking calls |
| 6 | Recurring Cleaning CTA | Travis · Diane · Margaret · Sophie — the business model section |
| 7 | Before/After Gallery preview | Sophie (visual proof) · Margaret (quality) · Gallagher (standard proof) |
| 8 | How It Works (4 steps) | Margaret (fear of unknown) · Diane (first-timer) · Kahnawà:ke (trust) |
| 9 | Meet Your Team | Diane (trust) · Margaret (consistent cleaner) · Kahnawà:ke (human connection) |
| 10 | Reviews | All — Google star rating is universal trust signal |
| 11 | Service Areas | Travis (Long Sault) · Sophie (Snye QC) · Kahnawà:ke (island) |
| 12 | FAQ | Margaret (phone vs online) · Diane (eco products) · Gallagher (scope) |
| 13 | Final CTA | Travis (book now) · Sophie (get a quote in French) |
| 14 | Footer | Diane (phone) · Travis (social) · All (legal) |

---

## C6. Full Repository Structure

```
fresh_nest/
├── .github/
│   └── workflows/
│       ├── firebase-preview.yml
│       ├── firebase-deploy.yml
│       └── docs-check.yml
├── docs/
│   ├── firestore-schema.md       ← ABSOLUTE AI LAW
│   ├── design-system.md          ← Versioned token reference
│   ├── PERSONAS.md               ← Full persona profiles (human-defined, AI reads only)
│   ├── EPICS.md                  ← Macro roadmap
│   ├── BACKLOG.md                ← Prioritised unstarted work
│   ├── ACTIVE_CYCLE.md           ← Current sprint (reset weekly)
│   ├── COMPLIANCE.md             ← CASL, data privacy, business rules
│   ├── decisions/
│   │   ├── _TEMPLATE.md
│   │   ├── ADR-001-tailwind-v3.md
│   │   ├── ADR-002-firestore-multidb.md
│   │   ├── ADR-003-rhf-zod.md
│   │   ├── ADR-004-preview-channels.md
│   │   ├── ADR-005-multipage-architecture.md
│   │   └── ADR-006-bilingual-ux.md
│   ├── projects/                 ← One spec per epic
│   ├── plans/                    ← AGY 3-strategy plans
│   ├── reports/                  ← Subagent outputs, Phase C summaries
│   └── archive/cycles/
├── public/
│   ├── favicon.ico
│   └── og-image.jpg              ← 1200×630
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx        ← Bilingual toggle, phone #
│   │   │   └── Footer.tsx
│   │   ├── sections/
│   │   │   ├── Hero.tsx          ← Bilingual CTA variants
│   │   │   ├── TrustBar.tsx      ← Diane, Margaret, Gallagher
│   │   │   ├── QuoteCalculator.tsx ← Travis, Sophie, Gallagher
│   │   │   ├── Services.tsx
│   │   │   ├── RecurringCTA.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── MeetTheTeam.tsx   ← Diane, Margaret, Kahnawà:ke
│   │   │   ├── Reviews.tsx
│   │   │   ├── ServiceAreas.tsx
│   │   │   ├── FAQ.tsx
│   │   │   └── BookingForm.tsx   ← Multi-step, v2 fields
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── SectionHeader.tsx
│   │       ├── ServiceCard.tsx
│   │       ├── ReviewCard.tsx
│   │       └── TrustBadge.tsx
│   ├── hooks/
│   │   ├── useScrollReveal.ts
│   │   └── useLanguage.ts        ← Bilingual state
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── en.json
│   │       └── fr.json
│   ├── lib/
│   │   ├── firebase.ts
│   │   ├── firestore.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Services.tsx
│   │   ├── ServiceDetail.tsx     ← /services/:slug
│   │   ├── Locations.tsx
│   │   ├── LocationDetail.tsx    ← /locations/:slug
│   │   ├── Gallery.tsx           ← Before/after
│   │   ├── Pricing.tsx
│   │   ├── FAQ.tsx
│   │   ├── Booking.tsx           ← Multi-step form
│   │   ├── ThankYou.tsx
│   │   └── Admin.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── user-guide/
│   ├── booking-guide.md
│   └── admin-guide.md
├── CLAUDE.md
├── GEMINI.md → CLAUDE.md (symlink)
├── .env.local (gitignored)
├── .env.production
├── firebase.json
├── .firebaserc
├── firestore.rules
├── firestore.dev.rules
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

---

## C7. CLAUDE.md — Full Content

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
- Project: rpd-pawn-shop
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

## Git Rules (ABSOLUTE)
- NEVER run git add, git commit, or git push
- NEVER modify ADR files once Accepted
- ALWAYS run npm run build before Phase C close
```

---

## C8. GEMINI.md Symlink

```bash
ln -s CLAUDE.md GEMINI.md
git add GEMINI.md
```

---

## C9. docs/ Bootstrap Steps (0.20–0.35)

After Step 0 technical checklist passes:

```bash
mkdir -p docs/decisions docs/projects docs/plans docs/reports docs/archive/cycles
mkdir -p user-guide

# Create all docs files from sections above
# Then:
touch docs/reports/.gitkeep
ln -s CLAUDE.md GEMINI.md

git add docs/ user-guide/ CLAUDE.md GEMINI.md .github/workflows/docs-check.yml .mlc-config.json
git commit -m "chore: bootstrap docs-as-code + persona system + CLAUDE.md v2"
git push origin main
```

---

---

# PART D — Development Phases & Epics

**Methodology:** Every epic has a named primary persona, user stories in "As [Persona], I want... so that..." format, and persona-specific acceptance criteria. No epic is closed without the persona test passing.

**Epic numbering:** Aligned with `docs/EPICS.md`. Each epic has a corresponding `docs/projects/E[nn]_*.md` spec file written before any code.

---

## Phase 1 — Foundation & Infrastructure (Weeks 1–3)
**Done when:** Multi-page site live at `lilypad-freshnest.web.app`, CI/CD operational, docs system bootstrapped, bilingual skeleton in place.

---

### E01 — Infrastructure & CI/CD
**Primary persona:** Ryan (Owner/Admin) | **Scope:** Step 0 complete

**User Story:** As Ryan, I want a deployable skeleton on Firebase with CI/CD so that every feature branch gets a preview URL and every merge to main deploys automatically.

**Acceptance Criteria:**
- `npm run build` passes, zero TypeScript errors
- PR to main → preview channel URL auto-commented on PR
- Merge to main → `lilypad-freshnest.web.app` updated
- All `/docs/` files exist and non-empty
- `CLAUDE.md` and `GEMINI.md` present at repo root

**Persona Test:** Ryan opens a PR, sees the bot comment with the preview URL, clicks it, and sees the Vite default page load at a Firebase Hosting URL.

---

### E02 — Design System & Brand Tokens
**Primary persona:** All | **Scope:** Tailwind config, Google Fonts, CSS foundations

**User Story:** As all personas, I want a visually cohesive, brand-consistent experience so that Fresh Nest Co. feels trustworthy and professional from the first scroll.

**Acceptance Criteria:**
- `tailwind.config.js` has all 10 brand color tokens
- `font-display` (Cormorant Garamond), `font-sub` (Marcellus), `font-body` (DM Sans) all render correctly in browser
- `src/lib/utils.ts` has `cn()` utility
- `src/types/index.ts` has all v2 types including `Language`, `Booking` with all fields
- Brand_Auditor subagent can validate any component against `docs/design-system.md`

---

### E03 — Navbar + Footer (Bilingual)
**Primary persona:** Diane (FR) + Travis (speed) + Margaret (phone)

**User Story (Diane):** As Diane, I want to switch the website to French from the navigation so that I can browse and book in my preferred language without any barrier.

**User Story (Travis):** As Travis, I want to see a "Book Now" button immediately in the nav so that I don't have to scroll to find the call to action.

**User Story (Margaret):** As Margaret, I want to see a phone number in the navigation header so that I know I can call a real person before I commit to booking online.

**Component requirements:**
- Language toggle (EN | FR) — switches `i18next` language, stores in localStorage, updates all `t()` strings
- Phone number: prominently in nav header on desktop; in mobile hamburger menu
- "Book Now" CTA: `bg-slate-brand text-white`, links to `/booking`
- Mobile: hamburger menu at < 768px, accessible (keyboard navigable, aria-labels)
- Scroll: `box-shadow` appears after 20px scroll
- Footer: 4-column grid desktop / 2-column mobile; `bg-charcoal`; all links in both languages

**Acceptance Criteria:**
- Language toggle switches all visible text to French (including nav links, CTA, footer)
- Phone number visible at 375px, 768px, 1280px viewports
- "Book Now" visible without scrolling on all viewports
- Mobile hamburger opens/closes correctly and is keyboard accessible
- All strings use `t()` — Brand_Auditor confirms zero hardcoded EN/FR strings

**Persona Test — Diane:** Diane visits on mobile in French. She sees the nav in French, sees the phone number, taps "Réservez maintenant" and is taken to the booking page with a French URL/title.

**Persona Test — Margaret:** Margaret visits on her iPad. She sees the phone number in the header without scrolling and it is a tappable `tel:` link.

---

### E04 — Hero Section (Bilingual CTA Variants)
**Primary persona:** Travis (CTA) + Sophie (FR copy) + Margaret (accessibility)

**User Story (Travis):** As Travis, I want to see a clear "Book a Cleaning" button above the fold so that I can start the booking process immediately without reading anything.

**User Story (Sophie):** As Sophie, I want to see the hero in French when I toggle the language so that Fresh Nest Co. immediately signals it wants my business.

**Persona Test — Travis:** Travis lands on the homepage on his iPhone. He sees the headline, subhead, and "Book a Cleaning" button without scrolling. He taps the button and is taken directly to the booking form.

**Persona Test — Sophie:** Sophie visits with browser set to French. The hero headline, subhead, and CTA are all in French on first load.

**Persona Test — Margaret:** Margaret visits on her iPad at 768px. All hero text is minimum 16px, CTA button is minimum 48px tall, and no element requires horizontal scrolling.

---

### E05 — Trust Bar
**Primary persona:** Diane (insured/bonded in FR) + Margaret (reliability) + Gallagher (professional)

**User Story (Diane):** As Diane, I want to see trust signals in French immediately below the hero so that I know this is a professional, insured business before I read anything else.

**Trust bar items:**
- ✓ Insured & Bonded / Assuré et cautionné
- ✓ Background-Checked Staff / Personnel vérifié
- ✓ Eco-Friendly Products / Produits écologiques
- ✓ Satisfaction Guarantee / Garantie de satisfaction
- ★ 4.9 / 5 Google Rating
- ✓ Bilingual Service / Service bilingue

**Acceptance Criteria:**
- All items render bilingual (switch with language toggle)
- Trust bar visible immediately below hero without scrolling on desktop
- On mobile: wraps cleanly, no overflow
- Eco badge links to eco-product info on the relevant service page

**Persona Test — Diane:** Diane visits in French. The trust bar shows "Assuré et cautionné" and "Service bilingue" — she does not have to look for insurance information.

---

### E06 — Instant Quote Calculator
**Primary persona:** Travis (price-first) + Sophie (comparison-shopping)

**User Story (Travis):** As Travis, I want to enter my home size, service type, and frequency and immediately see a price range so that I can decide whether to book without calling.

**Calculator inputs:**
- Property type: Apartment / 1–2 bed / 3–4 bed / 5+ bed / Commercial
- Service type: Standard / Deep / Move-out / Post-construction / Airbnb
- Frequency: One-time / Weekly / Biweekly / Monthly → shows discount %

**Output:** Estimated price range ("Starting at $X, typically $X–$X") + CTA to booking form with inputs pre-populated.

**Acceptance Criteria:**
- Calculator renders in 3 inputs, no account required, no form submission
- Result appears on-screen without page load
- Frequency selector shows discount percentages (Weekly 20%, Biweekly 15%, Monthly 10%)
- CTA pre-populates booking form with selected values
- All labels and results bilingual
- Replaces the Services Ticker marquee from v1

**Persona Test — Travis:** Travis selects 4-bed, standard, biweekly on his iPhone. He sees a price range within 3 taps, then taps the CTA and is taken to the booking form with 4-bed + biweekly pre-filled.

---

## Phase 2 — Core Sections & Conversion (Weeks 4–6)
**Done when:** Full homepage renders at all breakpoints with all sections. Before/after gallery live. Location pages seeded. Lighthouse > 90 desktop.

---

### E07 — Services Grid
**Primary persona:** All | **Scope:** 6 service cards

Cards: Standard Residential · Deep Clean · Move-In/Move-Out · Post-Construction · Airbnb Turnover · Commercial Cleaning. Each card: icon, title, description, "Book Now →" link. Card 6 (Recurring Plans): inverted styling (`bg-slate-brand`).

**Persona Test:** Every persona can identify their primary service type from the grid without reading descriptions — the icon and title alone are sufficient.

---

### E08 — Recurring Cleaning Section
**Primary persona:** Travis + Diane + Margaret + Sophie

**User Story:** As Travis, I want to see the biweekly discount clearly displayed so that I have a financial incentive to commit to a recurring schedule rather than booking one-time.

**Section content:** Discount table (Weekly 20%, Biweekly 15%, Monthly 10%) + "Set it and forget it" messaging + CTA to booking form with frequency pre-selected.

**Persona Test — Travis:** Travis sees the discount table and clicks "Book Biweekly." The booking form opens with frequency pre-set to biweekly.

---

### E09 — Before/After Gallery (/gallery)
**Primary persona:** Sophie (visual proof) + Margaret (quality signal) + Gallagher (standard proof)

**User Story (Sophie):** As Sophie, I want to see before-and-after photos of real cleans so that I can trust the quality before booking a deep clean for my home before the baby arrives.

**Requirements:**
- Minimum 5 before/after photo pairs at launch (real photos — Phase 4 photography pass)
- Placeholder images acceptable for preview channel testing
- Photo captions bilingual
- Lightbox on click (full-size view)
- Gallery page linked from homepage "before/after preview" section and from `/services/deep-cleaning`

**Persona Test — Sophie:** Sophie navigates from the French homepage to `/gallery`, sees at minimum 3 before/after pairs, and each has a French caption.

---

### E10 — How It Works (4 Steps)
**Primary persona:** Margaret (fear of unknown) + Diane (first-timer) + Kahnawà:ke (trust)

**Steps:** 1. Book Online · 2. We Confirm · 3. We Clean · 4. You Relax

**Persona Test — Margaret:** Margaret reads the 4 steps and understands the process without calling. The steps clarify what happens after she submits the form (she will receive a confirmation) and that the same cleaner will arrive.

---

### E11 — Meet Your Team
**Primary persona:** Diane (relationship trust) + Margaret (consistent cleaner) + Kahnawà:ke (human connection)

**User Story (Diane):** As Diane, I want to see real photos and names of the cleaners so that I feel I know who is coming into my home before I open the door.

**Requirements:**
- Real staff photos (at minimum owner + 1 cleaner at launch — Phase 4 photography)
- Placeholder cards acceptable for preview
- Each card: photo, name, role, short bio (bilingual)
- Mention of "consistent cleaner assignment" explicitly on this section

**Persona Test — Diane:** Diane visits the Meet Your Team section and sees at least one real photo with a French-bilingual bio. She does not encounter English-only text on this section.

---

### E12 — Reviews Section + Live Firestore Integration
**Primary persona:** All

**Phase 2 (static):** 5 hardcoded review cards. Each has a `language` field — French reviews shown first when language is FR.
**Phase 3 (live):** Replace with `useApprovedReviews()` from Firestore.

**Bilingual requirement:** French reviews (tagged `language: 'fr'`) display in French. English reviews display in English regardless of toggle (authenticity over translation).

**Rating display:** `5.0 ★★★★★ — Based on 80+ reviews` in top-right of section header.

---

### E13 — Service Areas + /locations/* Pages
**Primary persona:** Travis (Long Sault) + Sophie (Snye QC) + Kahnawà:ke (island)

**User Story (Kahnawà:ke):** As Kahnawà:ke, I want to see a dedicated page for Akwesasne that explicitly says "We serve Cornwall Island" so that I know this isn't just a checkbox on their service area list.

**Location pages to build:**
- `/locations/cornwall-on` — primary market, full SEO page
- `/locations/akwesasne` — "We serve Cornwall Island" explicit; island access notes; community language
- `/locations/snye-qc` — French-primary copy; "Nous servons Akwesasne, côté Québec"
- `/locations/long-sault` — Travis's area; South Stormont confirmation
- `/locations/morrisburg` — SDG County catchment

Each location page: local copy, Google Map embed, service types available, CTA, local SEO meta.

**Persona Test — Kahnawà:ke:** Kahnawà:ke navigates to `/locations/akwesasne` and reads "We serve Cornwall Island" explicitly, not just "Akwesasne area." The booking form notes field has "Island address / bridge access" as placeholder text.

**Persona Test — Sophie:** Sophie visits `/locations/snye-qc` and all copy is in French if her language is set to FR. The page explicitly says service crosses the provincial border.

---

### E14 — FAQ Section + /faq Page
**Primary persona:** Margaret (phone vs online) + Diane (eco products) + Gallagher (scope)

**Required FAQ items (bilingual):**
- Do I need to be home during the clean?
- What eco-friendly products do you use? Are they pet-safe?
- Can I request the same cleaner every visit?
- Do you serve Cornwall Island / Akwesasne?
- Do you serve Snye QC?
- What is included in the Airbnb Turnover package?
- How do I reschedule or cancel?
- Are you insured and bonded?
- Do you offer a satisfaction guarantee?
- What payment methods do you accept?

**Persona Test — Margaret:** Margaret finds the FAQ from the homepage, reads "Can I request the same cleaner?" and finds a clear, reassuring answer without having to call.

---

## Phase 3 — Booking, Data & Communications (Weeks 7–8)
**Done when:** Real bookings write to Firestore. Owner receives email. Clients receive bilingual confirmation. SMS reminders sending.

---

### E15 — Multi-Step Booking Form (/booking)
**Primary persona:** Travis (mobile, fast) + Sophie (French) + Margaret (accessible)

**User Story (Travis):** As Travis, I want to complete a booking on my phone in under 3 minutes without creating an account so that I can get it done between jobs.

**Multi-step flow (4 steps):**
1. Service type + property details (type, bedrooms, bathrooms, pets)
2. Add-ons + frequency + preferred date
3. Contact details (name, email, phone, address, notes, preferred cleaner)
4. Review + submit

**V2 fields (vs v1):** Adds `language`, `propertyType`, `bedrooms`, `bathrooms`, `frequency`, `pets`, `addOns`, `preferredCleaner`, `leadSource`, `isAirbnb`, `photoConfirmation`

**Zod schema:** Full schema for all v2 fields including enum validation for `serviceType`, `frequency`, `language`.

**Accessibility (Margaret):** All inputs minimum 48px height. Labels above inputs, not placeholder-only. Error messages descriptive, not just "required."

**Bilingual (Diane, Sophie):** All field labels, validation errors, and step headers use `t()`. Selected language stored in `language` field on submit.

**Persona Test — Travis:** Travis completes a 4-bed, biweekly, standard clean booking on mobile in < 3 minutes without account creation. He receives an SMS confirmation within 30 seconds.

**Persona Test — Sophie:** Sophie completes a deep clean booking in French (all labels, errors, and the confirmation page are in French).

**Persona Test — Margaret:** Margaret completes the booking on her iPad with all tap targets ≥ 48px and all text ≥ 16px. No element requires horizontal scrolling.

---

### E16 — Firestore Booking Integration
**Primary persona:** All (data reliability)

All v2 `Booking` fields write correctly to Firestore. Dev builds → `freshnest-dev` DB. Production → `(default)` DB. `language` field populated from i18next state at submission.

**Data_Steward check:** No field in the Firestore document exists that is not in `docs/firestore-schema.md`.

---

### E17 — Cloud Functions: Bilingual Email Notification
**Primary persona:** Diane (FR email) + Sophie (FR email) + Travis (fast confirmation)

**Function trigger:** `onDocumentCreated('bookings/{docId}')`

**Logic:** Read `booking.language` field → send email in `'en'` or `'fr'` to owner AND client.

**Owner email (always EN):** New booking summary with all fields.

**Client confirmation email:**
- EN: "Your booking is confirmed! Here's what we have scheduled..."
- FR: "Votre réservation est confirmée! Voici ce que nous avons planifié..."

**Persona Test — Diane:** Diane completes a booking with language set to FR. She receives a confirmation email entirely in French within 60 seconds.

---

### E18 — SMS Confirmation + Reminders
**Primary persona:** Travis (SMS first) + Margaret (day-before reminder)

**Via:** Twilio or Firebase Extension (SMS)

**Sequence:**
- Immediate: booking confirmation SMS (EN or FR based on language field)
- 48 hours before: reminder SMS
- Morning of: "Your cleaner arrives today at [time]"
- On-my-way: triggered manually by cleaner (Phase 6 integration)

**Persona Test — Travis:** Travis receives an SMS confirmation within 60 seconds of booking. The message is in English.

**Persona Test — Margaret:** Margaret receives an SMS reminder the day before her weekly clean. She is not surprised when the cleaner arrives.

---

### E19 — /pricing Page
**Primary persona:** Travis (price-before-commitment) + Margaret (fixed-price, no surprises)

**Content:** Package table (Standard / Deep / Move-Out / Commercial) with starting prices and typical ranges. Add-on pricing list. Frequency discount table. CTA to booking with package pre-selected.

**Persona Test — Travis:** Travis navigates to `/pricing` and finds the 4-bedroom biweekly price range without calling.

---

### E20 — /services/airbnb-turnover Page
**Primary persona:** Gallagher

**User Story:** As Patricia Gallagher, I want a dedicated page that speaks Airbnb host language so that I can immediately confirm Fresh Nest Co. understands my specific needs.

**Page content:**
- Airbnb host-specific headline: "Spotless turnover, every time — from 11am to 3pm."
- Scope list: linen change, bathroom reset, kitchen clean, supply count, damage photo
- Priority scheduling block booking description
- Photo completion confirmation (SMS with photo after clean)
- Damage reporting process
- Commercial inquiry form (distinct from residential booking)

**Persona Test — Gallagher:** Patricia lands on `/services/airbnb-turnover` and immediately sees the 11am–3pm window stated, linen change included, and damage photo confirmation described. She submits a commercial inquiry form.

---

### E21 — /services/* Individual Service Pages (6 pages)
**Primary persona:** All (SEO + clarity)

Pages: `/services/residential-cleaning` · `/services/deep-cleaning` · `/services/move-in-move-out` · `/services/commercial-cleaning` · `/services/post-construction` · `/services/airbnb-turnover` (E20).

Each page: service description, what's included/excluded, ideal use case, CTA, FAQ relevant to that service, local SEO meta.

---

### E22 — Thank You Page + Confirmation
**Primary persona:** All

Bilingual confirmation page. Shows booking summary. Explains next steps (we'll confirm within 24 hours). Google review prompt if returning client.

---

## Phase 4 — SEO, Accessibility & Polish (Week 9)
**Done when:** Lighthouse ≥ 90 all metrics. WCAG AA passes. Real photos in place. JSON-LD schema deployed. Analytics live.

---

### E23 — JSON-LD Schema Markup
**Primary persona:** All (search visibility)

Types: `LocalBusiness`, `Service` (per service page), `FAQ` (on `/faq`), `Review` (on homepage), `WebPage` (all pages).

---

### E24 — Meta Tags + Bilingual Page Titles
**Primary persona:** Sophie (FR search) + Travis (local search)

All pages: `<title>`, `<meta name="description">`, `og:*` tags. Bilingual pages: `<link rel="alternate" hreflang="fr">` tags.

---

### E25 — WCAG AA Accessibility Audit
**Primary persona:** Margaret (65+, iPad user)

Full audit: minimum 16px body text, 48px tap targets, 4.5:1 contrast ratios, keyboard navigation, screen reader labels, alt text on all images.

**Persona Test — Margaret:** An accessibility audit tool reports zero WCAG AA failures on the booking form flow.

---

### E26 — Analytics Stack
**Primary persona:** Ryan (operational insight)

- Google Analytics 4
- Google Search Console
- Microsoft Clarity (session recording + heatmaps — mobile drop-off analysis)

---

### E27 — Real Photography Pass
**Primary persona:** Sophie (visual trust) + Gallagher (quality proof)

Replace all placeholder images: owner photo, at least 1 cleaner photo, 5 before/after pairs. All as WebP with explicit dimensions.

---

## Phase 5 — Admin Dashboard (Week 10+)
**Primary persona:** Ryan (Owner/Admin)

### E28 — Firebase Auth + Protected /admin Route
Google sign-in. Redirect unauthenticated users from `/admin`.

### E29 — Booking Dashboard
Bookings table: all v2 fields visible. Sortable by date, filterable by status, language, serviceType. Status update (pending → confirmed → completed → cancelled). Cleaner assignment.

### E30 — Lead Source Dashboard
Breakdown by `leadSource` field. Pie chart: organic / google / referral / facebook / direct. Monthly trend.

### E31 — Referral Program (E29 in epic map)
"Give $20, Get $20" referral link generation. Tracks which bookings came from referrals. Margaret and Diane are the primary referral channels.

---

## Phase 6 — Growth Features (Post-Launch)

### E32 — Blog / Content Engine
4 initial articles targeting Cornwall + Akwesasne search intent:
- "How much does house cleaning cost in Cornwall ON?"
- "Move-out cleaning checklist: Cornwall edition"
- "Commercial cleaning for Akwesasne businesses"
- "Eco-friendly cleaning products — what we use and why"

### E33 — Recurring Booking Auto-Renewal
Travis and Margaret personas: once a recurring schedule is set, it auto-generates future bookings. Owner notified, client reminded.

### E34 — Stripe Deposit Integration
Gallagher persona: deposit at booking for commercial/Airbnb clients. Adds `depositAmount` to Booking schema (ADR required before implementation).

---

---

# PART E — Reference

---

## E1. Complete Epic Map (34 Epics)

| Epic | Name | Priority | Primary Persona(s) | Phase |
|---|---|---|---|---|
| E01 | Infrastructure & CI/CD | P0 | Ryan | 1 |
| E02 | Design System & Brand Tokens | P0 | All | 1 |
| E03 | Navbar + Footer (Bilingual) | P0 | Diane · Travis · Margaret | 1 |
| E04 | Hero Section (Bilingual) | P0 | Travis · Sophie · Margaret | 1 |
| E05 | Trust Bar | P0 | Diane · Margaret · Gallagher | 1 |
| E06 | Instant Quote Calculator | P0 | Travis · Sophie · Gallagher | 1 |
| E07 | Services Grid | P0 | All | 2 |
| E08 | Recurring Cleaning Section | P0 | Travis · Diane · Margaret | 2 |
| E09 | Before/After Gallery | P0 | Sophie · Margaret · Gallagher | 2 |
| E10 | How It Works | P0 | Margaret · Diane · Kahnawà:ke | 2 |
| E11 | Meet Your Team | P0 | Diane · Margaret · Kahnawà:ke | 2 |
| E12 | Reviews Section + Firestore | P0 | All | 2 |
| E13 | Service Areas + /locations/* | P0 | Travis · Sophie · Kahnawà:ke | 2 |
| E14 | FAQ Section + /faq | P0 | Margaret · Diane · Gallagher | 2 |
| E15 | Multi-Step Booking Form | P0 | Travis · Sophie · Margaret | 3 |
| E16 | Firestore Booking Integration | P0 | All | 3 |
| E17 | Cloud Functions: Bilingual Email | P0 | Diane · Sophie · Travis | 3 |
| E18 | SMS Confirmation + Reminders | P0 | Travis · Margaret | 3 |
| E19 | /pricing Page | P1 | Travis · Margaret | 3 |
| E20 | /services/airbnb-turnover | P1 | Gallagher | 3 |
| E21 | /services/* Individual Pages | P1 | All + SEO | 3 |
| E22 | Thank You Page | P0 | All | 3 |
| E23 | JSON-LD Schema | P1 | All (SEO) | 4 |
| E24 | Meta Tags + Bilingual Titles | P1 | Sophie · Travis | 4 |
| E25 | WCAG AA Accessibility Audit | P1 | Margaret | 4 |
| E26 | Analytics Stack | P1 | Ryan | 4 |
| E27 | Real Photography | P0 | Sophie · Gallagher | 4 |
| E28 | Firebase Auth + /admin | P0 | Ryan | 5 |
| E29 | Booking Dashboard | P0 | Ryan | 5 |
| E30 | Lead Source Dashboard | P1 | Ryan | 5 |
| E31 | Referral Program | P1 | Margaret · Diane · Kahnawà:ke | 5 |
| E32 | Blog / Content Engine | P2 | SEO · Sophie · Travis | 6 |
| E33 | Recurring Booking Auto-Renewal | P2 | Travis · Margaret | 6 |
| E34 | Stripe Deposit Integration | P2 | Gallagher · Travis | 6 |

---

## E2. Git Workflow

```
main ──────────────────────────────────────► lilypad-freshnest.web.app (PROD)
  ↑                                           (default) Firestore DB
  │ merge PR
feature/e03-navbar ──► PR → preview URL → freshnest-dev Firestore DB
feature/e06-calculator ──► PR → preview URL  auto-expires 7 days
```

**Commit convention:**
```
feat(scope): description     ← new feature
fix(scope): description      ← bug fix
chore(scope): description    ← config, deps
docs(scope): description     ← docs only
i18n(scope): description     ← translation strings
a11y(scope): description     ← accessibility
```

**Before every push:** `npm run build` — catch TypeScript errors before CI.

---

## E3. Key Decisions Summary

| ADR | Decision | Choice | Rationale |
|---|---|---|---|
| 001 | CSS Framework | Tailwind v3 | AI generates v3 by default; silent v4 failures in agentic workflow |
| 002 | Firestore isolation | Multi-database | Clean env isolation; one project, two DBs |
| 003 | Form handling | RHF + Zod | Client-side SPA; not SSR; real-time field errors |
| 004 | CI/CD pattern | Preview channels | Ephemeral per-PR URLs; no permanent staging branch |
| 005 | Site architecture | Multi-page | Each service/location page ranks independently in Google |
| 006 | Bilingual UX | EN/FR at launch | 19.3% FR market; Diane and Sophie personas require it; not Phase 2 |

---

## E4. Third-Party Integrations Roadmap

| Tool | Purpose | Phase | Persona Driver |
|---|---|---|---|
| Twilio or Firebase SMS | Booking confirmation + reminders | 3 | Travis, Margaret |
| Resend / SendGrid | Bilingual transactional email | 3 | Diane, Sophie |
| Google Analytics 4 | Traffic + conversion | 4 | Ryan |
| Google Search Console | Search performance | 4 | Ryan |
| Microsoft Clarity | Session recording, mobile drop-off | 4 | Ryan |
| Google Calendar API | Availability sync | 4+ | Gallagher |
| Stripe | Deposit at booking | 6 | Gallagher, Travis |
| Mailchimp / Brevo | Post-booking email sequences | 6 | All |

---

---

# PART F — Phase 6: Business Operations Platform

> **Status:** Future State — begins after Phase 5 validated and at least 10 active recurring clients.

---

## F1. Strategic Context

The customer-facing website (Phases 1–5) solves the acquisition problem. Phase 6 solves the operations problem: every booking flows through a professional system with minimal manual intervention.

**The core insight:** Do not build FSM capabilities from scratch. Integrate a proven platform. The custom site owns the brand. An FSM tool owns operational execution. The custom admin dashboard provides the unified view.

---

## F2. Platform Recommendation by Growth Stage

| Stage | Profile | Platform | Cost |
|---|---|---|---|
| Launch | < 5 cleaners, primarily residential recurring, < 20 clients | **ZenMaid** | ~$19–40/mo |
| Growth | 3–8 cleaners, residential + commercial mix, 20–60 clients | **Jobber Connect** | $169/mo |
| Scale | 8+ cleaners, multiple commercial contracts | **Jobber Grow** | $349/mo |

**ZenMaid strengths for Fresh Nest Co. launch:** Purpose-built for residential maid services. Recurring schedule automation. Automated SMS/email reminders to client and cleaner. Mobile cleaner app with on-my-way text and SOS button. Capacity view before quoting. Post-clean follow-up with review request.

**Jobber upgrade triggers:** > 20 recurring clients, commercial contracts, Client Hub needed for Gallagher persona, open API for custom integration.

---

## F3. The Seven Operational Domains

### Domain 1 — Job Lifecycle
Booking → confirmation → scheduled → dispatched → completed → invoice → payment → post-clean follow-up. No manual step.

### Domain 2 — Client CRM
Per-client profiles: access instructions, pets, allergies, `preferredCleaner`, lead source, full job history.

### Domain 3 — Staff Management & Onboarding
Structured digital onboarding checklist per staff member (see Firestore `staff` collection, Phase 6B). Promotion ladder: Junior → Senior → Lead → Supervisor.

### Domain 4 — Communications (Three Streams)
- Stream 1 (client, automated): confirmation → 48hr reminder → morning-of → on-my-way → post-clean → invoice
- Stream 2 (cleaner, mobile): assignment → schedule change → job details in app
- Stream 3 (internal): weekly schedule published; availability through FSM not personal texts

**Critical rule:** Ryan's personal phone is not the communications hub. All operational communications flow through the FSM platform.

### Domain 5 — Quality Control
Service-type specific checklists. Photo documentation required. Post-clean star rating. Low-rating (<4★) alert to owner within the hour.

### Domain 6 — Invoicing & Payments
Auto-invoice on job completion. Recurring auto-invoice. Card payment online. Automated reminders at 3/7/14 days. QuickBooks/Wave sync.

### Domain 7 — Reporting
10 weekly metrics: scheduled revenue, completion rate, no-shows, new clients, recurring ratio, avg revenue/job, cleaner utilisation, avg rating, outstanding invoices, lead source breakdown.

---

## F4. Phase 6 Epics

### E35 — FSM Integration (Phase 6A)
Cloud Function: new website booking → FSM API appointment. Webhook: FSM status changes → Firestore update. 5★ rating → Google review prompt.

### E36 — Staff Module (Phase 6B)
Admin dashboard extension: staff roster, per-cleaner onboarding checklist, performance snapshot (avg rating via FSM API).

### E37 — Operations Intelligence Dashboard (Phase 6C)
10 weekly metrics on one screen. Revenue strip, jobs summary, growth metrics, team performance. Data from FSM API (cached in Firestore) + Firestore `bookings` (lead source).

---

## F5. SOP Documentation

Create in `docs/SOPs/`:
- `residential-standard.md` — room-by-room standard clean
- `deep-clean.md` — extended scope
- `move-in-out.md` — empty property procedure, photo requirements
- `commercial.md` — after-hours access, different surfaces
- `airbnb-turnover.md` — Gallagher persona SOP
- `product-guide.md` — dilution ratios, surface compatibility

---

## F6. Three Questions Before Phase 6 Begins

1. **ZenMaid or Jobber?** — ZenMaid if < 5 cleaners, residential-primary. Jobber if Gallagher clients booked and commercial growing.
2. **Custom staff onboarding or Connecteam ($35/mo)?** — Custom if unified Firebase admin is preferred. Connecteam if mobile time tracking and team chat needed immediately.
3. **QuickBooks Online (~$35/mo CAD) or Wave (free)?** — Wave adequate < $100K revenue. QuickBooks for deeper FSM integration and easier tax season.

---

*This document supersedes all previous Fresh Nest Co. planning documents.*  
*v2.0 incorporates full persona suite from FreshNestCo_BuildPlan_v2.docx.*  
*Next update: after Phase 1 complete — update ACTIVE_CYCLE.md and close E01.*
