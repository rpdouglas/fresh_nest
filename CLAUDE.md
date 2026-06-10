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
