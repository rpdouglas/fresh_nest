# Fresh Nest Co. — Architectural Remediation Plan v1
### Security Hardening · Refactoring · DX Improvements
**Version:** 1.0 · **Date:** June 2026  
**Source:** Architectural Review — `codebase_export_FN_20260610`  
**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v3 · Firebase · TanStack Query  
**Methodology:** Persona-Driven Development · Docs-as-Code · AGY 3-Phase Gate  
**Site:** Fresh Nest Co. — Cleaning & Organizing Services · `lilypad-freshnest.web.app`

---

## What This Document Is

This plan translates every finding from the June 2026 architectural review into actionable epics, organized by risk and logical implementation order. It follows the same persona-driven, docs-as-code format as `FreshNestCo_MasterPlan_v2.md`. Every epic has a named driver (persona or operational owner), acceptance criteria, and a persona test or verification gate.

**The three tiers of work:**

- **Phase R1 — Critical Security Hardening** — Must be completed before any additional bookings accept PII. Estimated 2–4 days.
- **Phase R2 — Correctness & Consistency Fixes** — Low-risk bugs and missing content that affect user-facing correctness. Estimated 1–2 days.
- **Phase R3 — Refactoring & Scalability** — Structural improvements that reduce technical debt and unlock future development velocity. Estimated 1–2 weeks.
- **Phase R4 — Tooling & Developer Experience** — Test coverage, ESLint upgrades, and DX improvements. Ongoing, parallelizable with R3.

**Epic numbering:** Prefixed `R` to distinguish from the original `E` series. Each epic has a corresponding `docs/projects/R[nn]_*.md` spec file that must be written before any code is touched, per the AGY 3-Phase Gate.

---

## How to Use This Document

- **Part A** — Risk register and priority rationale
- **Part B** — Phase R1: Critical Security Hardening
- **Part C** — Phase R2: Correctness & Consistency Fixes
- **Part D** — Phase R3: Refactoring & Scalability
- **Part E** — Phase R4: Tooling & Developer Experience
- **Part F** — Reference: complete epic map, ADR index, verification checklist

Every AI agent must read the source `CLAUDE.md` and `docs/PERSONAS.md` before implementing any epic in this plan.

---

---

# PART A — Risk Register & Priority Rationale

---

## A1. Risk Classification

| Severity | Definition | Response |
|---|---|---|
| **Critical** | Data breach, PII exposure, unauthorized system access possible right now | Fix before next production commit. No exceptions. |
| **High** | User-facing bug or correctness failure that will manifest in normal use | Fix in current sprint. |
| **Medium** | Incorrect behaviour under edge conditions; maintenance hazard; performance degradation | Fix before Phase R3 refactoring begins. |
| **Low** | Code smell, DX friction, missed optimization | Incorporate into planned refactoring cycle. |

---

## A2. Complete Finding Inventory

| ID | Finding | Severity | Phase |
|---|---|---|---|
| F-01 | Firestore security rules allow unauthenticated read/write on all documents — production | **Critical** | R1 |
| F-02 | Admin authorization is client-side only; `VITE_ADMIN_EMAILS` baked into JS bundle | **Critical** | R1 |
| F-03 | `.env.production` committed to repository with live Firebase credentials and admin emails | **High** | R1 |
| F-04 | `MIN_DATE` / `MAX_DATE` computed at module evaluation time, not render time | **High** | R2 |
| F-05 | Footer Cornwall link points to `/locations/cornwall` — 404; should be `/locations/cornwall-on` | **High** | R2 |
| F-06 | `booking.status.completed` and `booking.status.cancelled` i18n keys missing in both locale files | **High** | R2 |
| F-07 | `QuoteCalculator` uses `animate` instead of `whileInView` — animation fires while offscreen | **Medium** | R2 |
| F-08 | `CURRENT_YEAR` in `Footer.tsx` is module-level — semantically stale until page reload | **Low** | R2 |
| F-09 | `scratch_refactor.py`, `update_json.py`, `update_cookie_json.py` committed to repo root | **Low** | R2 |
| F-10 | `onDailyReminderCheck` Cloud Function reads from default DB only — silent asymmetry undocumented | **Medium** | R2 |
| F-11 | No Content-Security-Policy header on production hosting target | **Medium** | R1 |
| F-12 | `AdminPage.tsx` is a 600+ line monolith — auth, data, analytics, and all UI in one component | **Medium** | R3 |
| F-13 | `lib/` directory conflates static data, Firebase side-effects, and pure utilities | **Low** | R3 |
| F-14 | `fadeUp` / `stagger` Framer Motion variants duplicated across 8+ home section components | **Low** | R3 |
| F-15 | `ServicesGrid` uses a `switch` statement for SVG icon rendering — fragile as services grow | **Low** | R3 |
| F-16 | TanStack Query is configured but not used — `AdminPage` manages Firestore subscription manually | **Medium** | R3 |
| F-17 | ESLint flat config missing type-aware rules (`recommendedTypeChecked`) | **Medium** | R4 |
| F-18 | `@tanstack/eslint-plugin-query` installed but not wired into ESLint config | **Low** | R4 |
| F-19 | No Vitest coverage threshold configured | **Low** | R4 |
| F-20 | E2E suite has no booking form coverage — the critical user path is untested | **High** | R4 |
| F-21 | `README.md` is the unmodified Vite scaffold — documents nothing about this project | **Low** | R4 |
| F-22 | Analytics singleton (`analyticsInstance`) never reset between Vitest test cases | **Low** | R4 |

---

## A3. Implementation Order Rationale

Phase R1 must be completed and deployed to production before any other work. F-01 means every booking document in production Firestore is readable and writable without authentication right now. F-02 means the admin allowlist is enforceable only in the browser, not at the database. These two findings compound each other.

Phase R2 contains the bugs that will surface in normal daily operation: a broken footer nav link, missing translation keys that appear as raw key strings in the admin dashboard, a stale date calculation, and an undocumented Cloud Functions asymmetry. These are low-effort, high-reward fixes.

Phase R3 is the structural refactoring that makes the codebase scale. It does not fix user-facing bugs but significantly reduces the effort required to implement future epics from the original plan (particularly E29–E31 in the admin dashboard).

Phase R4 improves confidence and developer experience and should run in parallel with R3 where possible.

---

---

# PART B — Phase R1: Critical Security Hardening

**Done when:** All Firestore collections have rule-enforced access control. Admin authorization is validated server-side. Production credentials are not committed to the repository. A CSP header is deployed.

**Deployment requirement:** Each R1 epic must be deployed to production immediately upon merge. Do not batch.

---

### R01 — Firestore Security Rules (Production)

**Driver:** Ryan (Owner) + all booking clients (data protection)  
**Severity:** Critical — F-01  
**Files changed:** `firestore.rules`, `docs/COMPLIANCE.md`, `docs/decisions/ADR-007-firestore-security-rules.md`, `docs/projects/R01_firestore-rules.md`

**User Story:** As Ryan, I want Firestore security rules that prevent any unauthenticated user from reading or writing booking data, so that client PII is protected at the database layer, not just the UI layer.

**Background:** The current production `firestore.rules` allows `read, write: if true` on all documents. This means anyone with the Firebase project ID (visible in the committed `.env.production`) can read every booking record, including names, addresses, emails, and phone numbers, using the Firebase REST API or any Firestore client SDK. The admin email check in `AdminPage.tsx` is purely cosmetic at the data layer.

**Implementation Specification:**

The new rules establish three access zones:

1. **`bookings` collection** — public write (booking form requires no auth), admin-only read/update.
2. **`admins` collection** — admin self-read only; write disabled (managed via Firebase Console).
3. **All other documents** — deny by default.

Admin identity is verified by checking whether the authenticated user's email exists as a document key in an `admins/{email}` collection, which is populated manually in the Firebase Console and never via the application.

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: check if the authenticated user is in the admin allowlist
    function isAdmin() {
      return request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.token.email));
    }

    // Bookings: public create (booking form), admin read/update only
    match /bookings/{bookingId} {
      allow create: if
        // Required fields must be present
        request.resource.data.keys().hasAll([
          'firstName', 'lastName', 'email', 'phone',
          'serviceType', 'propertyType', 'frequency',
          'preferredDate', 'address', 'language',
          'status', 'createdAt'
        ])
        // Status must be 'pending' on create — no client can self-confirm
        && request.resource.data.status == 'pending'
        // marketingConsent must be a boolean if present
        && (!('marketingConsent' in request.resource.data)
            || request.resource.data.marketingConsent is bool);

      allow read, update: if isAdmin();
      allow delete: if false;
    }

    // Admins allowlist: self-read only
    match /admins/{email} {
      allow read: if request.auth != null
        && request.auth.token.email == email;
      allow write: if false;
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Pre-implementation steps (human action required before deploying rules):**
1. Open Firebase Console → Firestore → project `freshnest-aa51e` → Database `(default)`.
2. Create collection `admins`.
3. Create one document per authorized admin email: document ID = email address, body = `{ "email": "lauren@freshnest.co" }` (and repeat for each address in the current `VITE_ADMIN_EMAILS` list).
4. Confirm documents exist before deploying rules — deploying rules before the `admins` collection exists will lock out all admins.

**Acceptance Criteria:**
- `firebase deploy --only firestore:rules` succeeds with zero errors.
- An unauthenticated `curl` to the Firestore REST API for the `bookings` collection returns a `403 Forbidden`.
- A signed-in admin user can read and update bookings in `AdminPage`.
- A new booking submitted via the booking form writes successfully to Firestore.
- The `create` rule rejects any document where `status != 'pending'`.
- The `create` rule rejects any document missing a required field.
- Security_Auditor subagent confirms rules match `docs/COMPLIANCE.md`.

**Persona Test — All Booking Clients:** A booking submitted via the form writes successfully (the `create` rule permits it). The submitter cannot then read their own booking document back directly (the `read` rule denies unauthenticated access), which is correct — the thank-you page state is passed via React Router state, not a subsequent Firestore read.

**Persona Test — Ryan (Admin):** Ryan signs into `/admin` with Google, and the dashboard loads all bookings. Ryan can update booking status. Ryan cannot delete bookings (the `delete` rule is `false`).

**ADR Required:** `ADR-007 — Firestore Security Rules Architecture` documenting the `admins` collection pattern as the authorization mechanism, and explicitly recording that client-side email checks in `AdminPage.tsx` are UI-layer UX only, not security controls.

---

### R02 — Admin Authorization: Server-Side Enforcement

**Driver:** Ryan (Owner)  
**Severity:** Critical — F-02  
**Files changed:** `src/pages/AdminPage.tsx`, `docs/projects/R02_admin-auth-serverside.md`

**User Story:** As Ryan, I want the admin dashboard's authorization check to be enforced at the Firestore rules layer, not just in the browser, so that even a technically sophisticated user cannot bypass the UI to read booking data.

**Background:** The current `AdminPage.tsx` checks `VITE_ADMIN_EMAILS` (a build-time env variable baked into the JS bundle) to decide whether to render the dashboard. This check is purely cosmetic — it controls which React component renders, but does not restrict data access. Since the Firestore `bookings` collection is world-readable (F-01), any user can query it directly regardless of what the browser renders.

R01 (Firestore rules) closes the data-layer gap. R02 aligns the client-side admin flow to reflect the new server-side reality: the `isAdmin()` check is no longer the source of truth — Firestore rules are.

**Implementation:**

Remove the `VITE_ADMIN_EMAILS` environment variable check from `AdminPage.tsx`. Replace it with a Firestore presence check against the `admins/{email}` collection established in R01. Authorization is confirmed if and only if the Firestore read succeeds (which requires the user's email to exist in the `admins` collection per the security rules).

The `useEffect` that currently checks `allowedEmails.includes(userEmail)` against an env variable is replaced with:

```typescript
// After successful Google sign-in:
const adminDocRef = doc(db, 'admins', currentUser.email!)
const adminSnap = await getDoc(adminDocRef)
const authorized = adminSnap.exists()
setIsAuthorized(authorized)
```

If the Firestore read returns a `permission-denied` error (because the user's email is not in the `admins` collection), `isAuthorized` is set to `false`. This aligns the UI gate with the data gate.

**Acceptance Criteria:**
- `VITE_ADMIN_EMAILS` env var is removed from `AdminPage.tsx`, `.env.production`, and GitHub Secrets documentation.
- An authenticated Google user whose email is NOT in the `admins` Firestore collection sees the "Access Denied" screen.
- An authenticated Google user whose email IS in the `admins` collection sees the dashboard.
- A `permission-denied` Firestore error from the admin check is caught and surfaced as the "Access Denied" state, not an unhandled error.
- `npm run build` passes with zero TypeScript errors.

**Persona Test — Ryan:** Ryan signs in with `rpdouglas@gmail.com`. The admin check reads the `admins/rpdouglas@gmail.com` document successfully (because R01 added it). The dashboard renders. Ryan then signs out and signs in with an unauthorized test account — the "Access Denied" screen renders.

---

### R03 — Remove `.env.production` From Version Control

**Driver:** Ryan (Owner / Security)  
**Severity:** High — F-03  
**Files changed:** `.gitignore`, `.env.production` (removed from tracking), `docs/decisions/ADR-008-secrets-management.md`, `.github/workflows/firebase-deploy.yml` (verify), `.github/workflows/firebase-preview.yml` (verify)

**User Story:** As Ryan, I want production credentials and admin configuration removed from the repository so that rotating a credential or updating the admin list does not require a code change or commit.

**Background:** `.env.production` is currently committed and contains the live Firebase API key, app ID, project ID, and four admin email addresses. The API key itself is not a catastrophic secret (Firebase web API keys are restricted by security rules and authorized domain lists), but the admin email list should not be in the repository — it creates a coupling between "who is an admin" and "what is committed to git."

The CI/CD workflows (`firebase-deploy.yml`, `firebase-preview.yml`) already inject all required Firebase values via GitHub Secrets. The committed `.env.production` is therefore redundant for CI and exists only as a local convenience — one that creates unnecessary risk.

**Implementation:**

1. Add `.env.production` to `.gitignore`.
2. Run `git rm --cached .env.production` to stop tracking the file without deleting it locally.
3. The `VITE_ADMIN_EMAILS` variable in `.env.production` is no longer needed after R02 (authorization moves to Firestore). Remove it from the file and from `AdminPage.tsx`.
4. Verify that both GitHub Actions workflows inject all required `VITE_FIREBASE_*` variables from GitHub Secrets. (They already do — confirm no gap.)
5. Add `VITE_FIREBASE_MEASUREMENT_ID` to the GitHub Secrets and both workflow files if not already present (it is referenced in `firebase.ts` but not injected in the current workflow).
6. Write `ADR-008` documenting that production secrets are managed exclusively via GitHub Secrets and the Firestore `admins` collection.

**Acceptance Criteria:**
- `git log --oneline --all -- .env.production` shows the file is no longer tracked.
- A full production deploy via GitHub Actions (`push` to `main`) succeeds with credentials injected from Secrets only.
- `.env.production` appears in `.gitignore`.
- No `VITE_ADMIN_EMAILS` reference remains anywhere in the codebase.
- `ADR-008` is committed.

**Persona Test — Ryan:** Ryan rotates the Firebase API key. He updates the GitHub Secret, triggers a re-deploy, and the site works. He does not need to make a git commit to rotate the key.

---

### R04 — Content-Security-Policy Header

**Driver:** Ryan (Owner / Security)  
**Severity:** Medium — F-11  
**Files changed:** `firebase.json`, `docs/projects/R04_csp-header.md`

**User Story:** As Ryan, I want a Content-Security-Policy header deployed on the production hosting target so that the booking form and admin dashboard have defense-in-depth against XSS and data injection attacks.

**Background:** The current `firebase.json` sets `X-Frame-Options` and `X-Content-Type-Options` on the production target but no CSP. Given that the site collects PII (booking form), uses Google Analytics, loads Google Fonts externally, and connects to Firebase, a CSP is a meaningful security control.

**Implementation:**

Add a `Content-Security-Policy` header to the `freshnest-prod` hosting target in `firebase.json`. The policy must permit:

- `default-src 'self'` — baseline
- `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com` — Vite bundles inline scripts; GA4 requires GTM
- `connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com` — Firebase SDK connections
- `font-src 'self' https://fonts.gstatic.com` — Google Fonts
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — Tailwind + Google Fonts CSS
- `img-src 'self' data: https://lh3.googleusercontent.com` — Google auth avatars
- `frame-ancestors 'none'` — supersedes `X-Frame-Options`

**Note on `'unsafe-inline'`:** Vite's production build injects inline scripts for module preloading. A stricter nonce-based or hash-based policy would require Vite plugin configuration. The above policy is a significant improvement over no CSP while remaining compatible with the existing build pipeline. Document this trade-off in `docs/projects/R04_csp-header.md`.

**Acceptance Criteria:**
- `firebase deploy --only hosting` succeeds.
- A browser DevTools Network inspection of any production page shows the `Content-Security-Policy` header.
- No CSP violations appear in the browser console on the homepage, booking form, or admin page.
- The dev hosting target (`freshnest-dev`) also receives the CSP header to catch violations during PR preview.

**Persona Test — Ryan (Security):** Ryan opens the browser console on `lilypad-freshnest.web.app` and sees no CSP violation errors. The Firebase Analytics `logEvent` calls succeed normally.

---

---

# PART C — Phase R2: Correctness & Consistency Fixes

**Done when:** All user-facing bugs are resolved. All i18n key gaps are filled. Stale artifacts are removed from the repository. Firestore asymmetry is documented.

---

### R05 — Fix `MIN_DATE` / `MAX_DATE` Module-Level Constants

**Driver:** Travis (P2) — booking date accuracy  
**Severity:** High — F-04  
**Files changed:** `src/components/booking/BookingStep2.tsx`, `docs/projects/R05_mindate-fix.md`

**User Story:** As Travis, I want the booking date picker to always show tomorrow as the earliest available date so that I cannot accidentally submit a booking for a date that has already passed.

**Background:** `MIN_DATE` and `MAX_DATE` in `BookingStep2.tsx` are computed once at module evaluation time using `new Date()`. If the JavaScript module is loaded (or cached in memory) around midnight, the minimum date will be yesterday by the time the component renders. In a long browser session crossing midnight, the minimum date becomes stale without a page reload.

**Implementation:**

Move both date computations inside the `BookingStep2` component function body. They are cheap calculations (two `Date` objects) and React's rendering model correctly invalidates them on each render cycle.

```typescript
export default function BookingStep2() {
  // Compute dates at render time, not module load time
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const MIN_DATE = tomorrow.toISOString().slice(0, 10)

  const maxDay = new Date()
  maxDay.setDate(maxDay.getDate() + 90)
  const MAX_DATE = maxDay.toISOString().slice(0, 10)

  const { t } = useTranslation()
  // ... rest of component unchanged
}
```

**Acceptance Criteria:**
- `MIN_DATE` and `MAX_DATE` are not defined at module scope.
- A Vitest unit test confirms that the minimum date returned is always tomorrow relative to `Date.now()` at the time the component renders.
- `npm run build` passes with zero TypeScript errors.
- The date input renders correctly and rejects past dates.

**Persona Test — Travis:** Travis opens the booking form on his phone. The date picker's minimum selectable date is tomorrow, regardless of when he opened the browser tab.

---

### R06 — Fix Footer Cornwall Location Link

**Driver:** Kahnawà:ke (P4) + Travis (P2) — location navigation  
**Severity:** High — F-05  
**Files changed:** `src/components/layout/Footer.tsx`, `docs/projects/R06_footer-link-fix.md`

**User Story:** As any visitor, I want the Cornwall ON footer link to take me to the correct location page so that I can find service area information without hitting a 404.

**Background:** `Footer.tsx` defines `locationLinks` with `{ to: '/locations/cornwall', ... }`. The React Router configuration in `App.tsx` defines the route as `'/locations/cornwall-on'`. Clicking the Cornwall link in the footer navigates to a path with no matching route, which falls through to the SPA catch-all and renders the homepage rather than a 404 — a subtle failure that is easy to miss in testing.

**Implementation:**

Change the Cornwall entry in the `locationLinks` array in `Footer.tsx`:

```typescript
{ to: '/locations/cornwall-on', label: t('footer.cornwallON') },
```

**Acceptance Criteria:**
- Clicking the Cornwall link in the footer navigates to `/locations/cornwall-on` and renders the `LocationPage` component with the Cornwall config.
- The existing Playwright E2E suite passes.
- The link works at all three breakpoints (375px, 768px, 1280px).

**Persona Test — Kahnawà:ke:** Kahnawà:ke visits the site on mobile. He scrolls to the footer, taps "Cornwall, ON," and arrives at the Cornwall location page — not back at the homepage.

---

### R07 — Add Missing Booking Status i18n Keys

**Driver:** Ryan (Admin — admin dashboard correctness)  
**Severity:** High — F-06  
**Files changed:** `src/i18n/locales/en.json`, `src/i18n/locales/fr.json`, `docs/projects/R07_missing-i18n-keys.md`

**User Story:** As Ryan, I want all booking status labels in the admin dashboard to display human-readable text in both English and French so that completed and cancelled bookings are not shown as raw key strings.

**Background:** `AdminPage.tsx` renders `t('booking.status.completed')` and `t('booking.status.cancelled')` in the status badge and status filter dropdown. Only `pending` and `confirmed` exist in both `en.json` and `fr.json`. The `completed` and `cancelled` keys are missing, causing the i18next fallback to display the raw key string (e.g., `"booking.status.completed"`) in the UI.

**Implementation:**

Add the missing keys to both locale files under the existing `booking.status` object.

In `en.json`:
```json
"status": {
  "pending": "Pending Confirmation",
  "confirmed": "Confirmed Schedule",
  "completed": "Completed",
  "cancelled": "Cancelled"
}
```

In `fr.json`:
```json
"status": {
  "pending": "En attente de confirmation",
  "confirmed": "Horaire confirmé",
  "completed": "Terminé",
  "cancelled": "Annulé"
}
```

**Acceptance Criteria:**
- All four status values render correctly in both EN and FR in the admin dashboard status badge and filter dropdown.
- Linguistic_Auditor subagent confirms no hardcoded status strings in any component.
- `npm run build` passes.

**Persona Test — Ryan:** Ryan signs into the admin dashboard, sets the language to French, and views a booking with status `completed`. The badge displays "Terminé" — not `"booking.status.completed"`.

---

### R08 — Fix `QuoteCalculator` Animation Trigger

**Driver:** Travis (P2) + Sophie (P5) — homepage conversion  
**Severity:** Medium — F-07  
**Files changed:** `src/components/home/QuoteCalculator.tsx`, `docs/projects/R08_calculator-animation-fix.md`

**User Story:** As Travis, I want the Quote Calculator to animate into view when I scroll to it so that the entrance animation creates the same engaging first impression as the rest of the homepage.

**Background:** `QuoteCalculator` uses `initial="hidden" animate="visible"` (Framer Motion), which fires the entrance animation immediately on component mount. Since the calculator is below the fold, the animation completes while the element is invisible. By the time Travis scrolls to it, it is already fully visible with no motion. All other home section components correctly use `whileInView`.

**Implementation:**

Replace the `motion.div` props in `QuoteCalculator`:

```tsx
// Before
<motion.div
  initial="hidden"
  animate="visible"
  variants={fadeUp}
  className="max-w-2xl mx-auto"
>

// After
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-50px' }}
  variants={fadeUp}
  className="max-w-2xl mx-auto"
>
```

**Acceptance Criteria:**
- The calculator section fades up when scrolled into view, matching the behaviour of `Hero`, `TrustBar`, `ServicesGrid`, and all other animated sections.
- The animation fires only once (`once: true`).
- Brand_Auditor confirms no design system violations introduced.

**Persona Test — Travis:** Travis loads the homepage and scrolls down. When the quote calculator enters the viewport, it smoothly fades up — giving it the same visual weight as the other homepage sections.

---

### R09 — Remove Stale Repository Artifacts

**Driver:** Ryan (Owner/Developer)  
**Severity:** Low — F-09  
**Files changed:** `scratch_refactor.py` (deleted), `update_json.py` (deleted), `update_cookie_json.py` (deleted), `README.md` (replaced), `docs/projects/R09_repo-cleanup.md`

**User Story:** As Ryan, I want the repository root to contain only files that serve the current codebase so that the project remains navigable and AI agents are not confused by obsolete scripts.

**Background:** Three Python scripts (`scratch_refactor.py`, `update_json.py`, `update_cookie_json.py`) remain in the repository root from early-development one-off tasks. Their job is done — the code they modified has been committed. They now represent a confusion hazard: an AI agent encountering `scratch_refactor.py` might interpret it as an active refactoring intention. The `README.md` is the unmodified Vite scaffold template and documents nothing about Fresh Nest Co.

**Implementation:**

1. `git rm scratch_refactor.py update_json.py update_cookie_json.py`
2. Replace `README.md` with a project-specific document covering: what the project is, how to run it locally, environment variable setup, the two-database architecture, CI/CD overview, and a link to `CLAUDE.md` for AI agent context.

**Acceptance Criteria:**
- The three Python scripts no longer exist in the repository at any path.
- `README.md` describes Fresh Nest Co., the stack, and how to run the project locally.
- `git log` shows a clean commit removing the files with a clear commit message.
- `npm run build` is unaffected.

**Persona Test — Ryan:** Ryan opens the repository in GitHub. The root directory contains only recognized, purposeful files. A new developer (or AI agent) reading the repository root understands what the project is within 60 seconds.

---

### R10 — Document `onDailyReminderCheck` Database Asymmetry

**Driver:** Ryan (Owner — operational reliability)  
**Severity:** Medium — F-10  
**Files changed:** `functions/src/index.ts`, `docs/firestore-schema.md`, `docs/projects/R10_scheduler-db-doc.md`

**User Story:** As Ryan, I want the `onDailyReminderCheck` Cloud Function's database targeting to be explicitly documented so that I understand which bookings receive SMS reminders and why dev bookings do not.

**Background:** `onDailyReminderCheck` calls `getFirestore()` without a database ID argument, which resolves to the `(default)` production Firestore instance. This is intentional (you do not want to send SMS reminders for test bookings in `freshnest-dev`), but it is completely undocumented. Any developer reading the function without this context would consider it a bug. Additionally, if the function is ever extended to support the dev database in a test mode, the behavior change would be non-obvious.

**Implementation:**

Add an explicit database ID to the Firestore call and a code comment explaining the design decision:

```typescript
// Explicitly targets the production DB — we never send SMS reminders for test bookings
// in freshnest-dev. This is intentional. See docs/firestore-schema.md for DB architecture.
const db = getFirestore(app, '(default)')
```

Add a note to `docs/firestore-schema.md` under the `onDailyReminderCheck` section:

> **Reminder scheduler always targets `(default)` DB.** Dev/preview bookings (written to `freshnest-dev`) will never trigger SMS reminders. This is intentional — test bookings should not result in real SMS messages to real phone numbers.

**Acceptance Criteria:**
- `functions/src/index.ts` uses an explicit `'(default)'` database ID string in the scheduler function.
- A code comment explains why.
- `docs/firestore-schema.md` documents the asymmetry.
- Data_Steward subagent confirms the schema doc is updated.
- `functions` TypeScript build passes (`npm run build` inside `functions/`).

**Persona Test — Ryan (Operational):** Ryan reads `onDailyReminderCheck` cold. He immediately understands which database it targets and why without having to trace the Firebase SDK defaults.

---

---

# PART D — Phase R3: Refactoring & Scalability

**Done when:** `AdminPage.tsx` is decomposed into testable modules. `lib/` is organized into logical sub-directories. Shared animation variants are consolidated. `ServiceIcon` uses a data map. TanStack Query is wired to the Firestore subscription.

**Note:** R3 epics introduce no new features. Every change must be verified with `npm run build && npm run lint` before Phase C close. The admin dashboard functionality must be identical before and after each refactoring epic.

---

### R11 — Decompose `AdminPage.tsx` Into Composed Modules

**Driver:** Ryan (Owner/Developer — maintainability)  
**Severity:** Medium — F-12  
**Files changed:** `src/pages/AdminPage.tsx`, `src/hooks/useAdminAuth.ts` (new), `src/hooks/useBookings.ts` (new), `src/hooks/useAdminAnalytics.ts` (new), `src/components/admin/BookingsTable.tsx` (new), `src/components/admin/BookingDetailPanel.tsx` (new), `src/components/admin/AnalyticsDashboard.tsx` (new), `docs/projects/R11_admin-decompose.md`

**User Story:** As Ryan (developer), I want the admin dashboard to be composed of independently testable modules so that I can modify the booking table without touching the analytics logic, and vice versa.

**Background:** The current `AdminPage.tsx` is approximately 650 lines and contains: Google Auth state machine, real-time Firestore subscription, five filter state variables, analytics KPI computation, Recharts chart rendering, a booking table with collapsible row expansion, and assignment/status update forms. Any change to any part requires reasoning about the entire file. It is effectively untestable in isolation.

**Decomposition Target:**

```
src/
  hooks/
    useAdminAuth.ts          ← Google sign-in, sign-out, onAuthStateChanged, isAuthorized
    useBookings.ts           ← subscribeToBookings, filter state, sort state, search state
    useAdminAnalytics.ts     ← time range filter, KPI computation, chart data derivation
  components/
    admin/
      BookingsTable.tsx      ← table render, row expansion, collapsible panel trigger
      BookingDetailPanel.tsx ← assignment controls, status update controls
      AnalyticsDashboard.tsx ← Recharts Pie + Bar charts, KPI stat cards, channel table
  pages/
    AdminPage.tsx            ← composes the above; handles tab state; renders auth gates
```

**Implementation order within R11:**

1. Extract `useAdminAuth` — auth state only, no data fetching.
2. Extract `useBookings` — Firestore subscription + all filter/sort/search state.
3. Extract `useAdminAnalytics` — analytics derivation from booking data.
4. Extract `BookingDetailPanel` — the collapsible row detail and update controls.
5. Extract `BookingsTable` — the full table using `BookingDetailPanel`.
6. Extract `AnalyticsDashboard` — the complete analytics tab.
7. Reduce `AdminPage.tsx` to a composition of the above with tab state.

**Acceptance Criteria:**
- `AdminPage.tsx` is under 150 lines after decomposition.
- `useAdminAuth`, `useBookings`, and `useAdminAnalytics` are each independently importable.
- All existing admin dashboard functionality is identical before and after (visual regression check).
- `npm run build && npm run lint` pass with zero errors.
- `npm run test` passes (existing tests must not regress).
- TypeScript_Strict_Enforcer subagent confirms no `any` types introduced.

**Persona Test — Ryan (Admin):** After deployment, Ryan signs into the admin dashboard. All booking records load, filters work, assignment and status updates save correctly, and the analytics tab renders the same charts as before.

---

### R12 — Reorganize `lib/` Into Sub-Directories

**Driver:** Ryan (Owner/Developer — navigability)  
**Severity:** Low — F-13  
**Files changed:** All files under `src/lib/` (moved), all imports referencing `@/lib/*` (updated), `docs/projects/R12_lib-reorganize.md`

**User Story:** As Ryan (developer), I want the `lib/` directory to communicate the nature of each module at a glance so that I can find the right file without reading multiple files to understand what they do.

**Background:** `src/lib/` currently contains seven categories of code without sub-organization: Firebase SDK initialization, Firestore side-effect functions, analytics instrumentation, a Zod validation schema, pricing pure functions, SEO schema builders, and static data fixtures. The category is not apparent from the filename alone.

**Target Structure:**

```
src/lib/
  data/
    galleryData.ts      ← static fixture
    locationData.ts     ← static fixture
    reviewsData.ts      ← static fixture
    serviceData.ts      ← static fixture
  firebase/
    firebase.ts         ← SDK init + db + auth exports
    firestore.ts        ← Firestore CRUD + subscription functions
    analytics.ts        ← consent-gated analytics singleton
  utils/
    bookingSchema.ts    ← Zod schema + STEP_FIELDS
    quotePricing.ts     ← pure pricing functions
    seo.ts              ← JSON-LD schema builders
    utils.ts            ← cn() utility
```

**Implementation note:** This is a pure move — no logic changes. The `@/lib/*` path alias means all imports must be updated from e.g. `@/lib/firebase` to `@/lib/firebase/firebase`. Use a global find-and-replace across `src/` and `functions/src/` — do not manually edit each file.

**Acceptance Criteria:**
- All files are in their new locations.
- All imports across `src/` and `functions/src/` are updated.
- `npm run build` passes with zero errors — all imports resolve.
- `npm run lint` passes.
- `CLAUDE.md` is updated to reflect the new `lib/` structure.
- Data_Steward confirms no Firestore schema is affected.

**Persona Test — Ryan (Developer):** Ryan opens `src/lib/` in VS Code and immediately understands the three categories of code without opening any file.

---

### R13 — Consolidate Framer Motion Animation Variants

**Driver:** Ryan (Owner/Developer — maintainability)  
**Severity:** Low — F-14  
**Files changed:** `src/lib/animations.ts` (new), all home section components that define `fadeUp`/`stagger` locally (updated), `docs/projects/R13_animations-consolidate.md`

**User Story:** As Ryan (developer), I want Framer Motion animation variants to be defined in one place so that changing the global homepage animation timing requires editing one file, not eight.

**Background:** The `fadeUp` and `stagger` Framer Motion variant objects are defined independently in `Hero.tsx`, `TrustBar.tsx`, `HowItWorks.tsx`, `MeetTheTeam.tsx`, `RecurringCTA.tsx`, `GalleryPreview.tsx`, `Reviews.tsx`, and `ServicesGrid.tsx`. The values are nearly identical across all eight components. If the animation duration or easing needs to change globally, it requires eight separate edits — a maintenance hazard.

**Implementation:**

Create `src/lib/animations.ts` (or `src/lib/utils/animations.ts` after R12):

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

// Hero uses a slightly longer duration — kept as a named export for override
export const fadeUpHero: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}
```

Remove the local definitions from all eight components and replace with imports.

**Acceptance Criteria:**
- No component defines `fadeUp` or `stagger` locally.
- All animation behaviour is visually identical before and after (manual inspection on homepage).
- `npm run build && npm run lint` pass.
- Brand_Auditor confirms no visual regressions against `docs/design-system.md`.

**Persona Test — Ryan (Developer):** Ryan wants to slow down all homepage scroll animations from 0.45s to 0.6s. He edits one line in `animations.ts` and the change propagates to all sections.

---

### R14 — Replace `ServiceIcon` Switch Statement With a Data Map

**Driver:** Ryan (Owner/Developer — extensibility)  
**Severity:** Low — F-15  
**Files changed:** `src/components/home/ServicesGrid.tsx`, `docs/projects/R14_serviceicon-map.md`

**User Story:** As Ryan (developer), I want service icons to be defined in a data map rather than a switch statement so that adding a new service type does not require modifying control flow logic.

**Background:** `ServicesGrid.tsx` contains a `ServiceIcon` component with a `switch` statement that maps service keys to inline SVG elements. Adding a new service type requires adding a new `case` — a fragile pattern that mixes rendering logic with data concerns.

**Implementation:**

Replace the switch statement with a `Record<ServiceType, JSX.Element>` map defined above the component:

```typescript
const SERVICE_ICONS: Record<ServiceType, React.ReactElement> = {
  standard: <svg ...>...</svg>,
  deep:     <svg ...>...</svg>,
  moveout:  <svg ...>...</svg>,
  postconstruction: <svg ...>...</svg>,
  airbnb:   <svg ...>...</svg>,
  commercial: <svg ...>...</svg>,
}

function ServiceIcon({ serviceKey }: { serviceKey: ServiceType }) {
  return SERVICE_ICONS[serviceKey] ?? null
}
```

**Acceptance Criteria:**
- The `switch` statement in `ServicesGrid.tsx` is eliminated.
- All six service icons render identically before and after.
- TypeScript enforces that every `ServiceType` value has a corresponding entry in the map (exhaustive type check).
- `npm run build && npm run lint` pass.

**Persona Test — Ryan (Developer):** Ryan needs to add a seventh service type. He adds the new SVG element to `SERVICE_ICONS` — TypeScript immediately flags the missing entry if he forgets. No `switch` logic to modify.

---

### R15 — Wire TanStack Query to Firestore Bookings Subscription

**Driver:** Ryan (Owner/Developer — data layer consistency)  
**Severity:** Medium — F-16  
**Files changed:** `src/hooks/useBookings.ts` (modified, after R11), `docs/projects/R15_tanstack-query-firestore.md`

**User Story:** As Ryan (developer), I want the admin dashboard's bookings data to flow through TanStack Query so that loading states, error states, and background refetching are handled consistently with the rest of the application's data layer.

**Background:** The `QueryClient` is configured in `main.tsx` and `@tanstack-query-firebase/react` is installed, but no `useQuery` or `useFirestoreCollection` hooks are used anywhere in the codebase. The admin dashboard manages its Firestore subscription manually via `useState` + `useEffect` + an `unsubscribe` cleanup — the exact pattern the Firebase adapter for TanStack Query is designed to replace.

This epic depends on R11 (the `useBookings` hook must exist as a standalone module before it can be migrated).

**Implementation:**

Replace the manual `subscribeToBookings` subscription in `useBookings.ts` with `useFirestoreCollection` from `@tanstack-query-firebase/react`:

```typescript
import { useFirestoreCollection } from '@tanstack-query-firebase/react'
import { collection, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'

export function useBookings() {
  const bookingsQuery = query(
    collection(db, 'bookings'),
    orderBy('createdAt', 'desc')
  )

  const { data, isLoading, isError } = useFirestoreCollection(bookingsQuery)

  const bookings: Booking[] = data?.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() ?? new Date(),
  } as Booking)) ?? []

  return { bookings, isLoading, isError }
}
```

**Acceptance Criteria:**
- `subscribeToBookings` manual subscription and its `useEffect` cleanup are removed from `useBookings.ts`.
- The admin dashboard renders a loading spinner while bookings are fetching.
- The admin dashboard renders an error state if the Firestore read fails (e.g., due to a rules denial).
- All filtering, sorting, and search functionality works identically with the new data source.
- `npm run build && npm run lint` pass.
- QA_Engineer subagent confirms all existing tests pass.

**Persona Test — Ryan (Admin):** Ryan opens the admin dashboard on a slow connection. He sees a loading spinner while bookings are fetched, then the full table renders. If the network drops, an error message appears rather than an infinite spinner.

---

---

# PART E — Phase R4: Tooling & Developer Experience

**Done when:** ESLint enforces type-aware rules and TanStack Query rules. Vitest has a coverage threshold. The booking form E2E path is covered. `README.md` is accurate. Analytics tests are isolated.

**Note:** R4 epics are parallelizable with R3 and with each other. They have no inter-dependencies except R17, which depends on R11.

---

### R16 — Enable Type-Aware ESLint Rules

**Driver:** Ryan (Owner/Developer — code quality)  
**Severity:** Medium — F-17  
**Files changed:** `eslint.config.js`, `docs/projects/R16_eslint-type-aware.md`

**User Story:** As Ryan (developer), I want ESLint to catch type-level errors at lint time so that issues like unsafe member access on `unknown` and unchecked type assertions are surfaced before they reach the CI build step.

**Background:** `eslint.config.js` uses `tseslint.configs.recommended` but not `recommendedTypeChecked`. The `README.md` (the Vite scaffold template) explicitly documents how to upgrade this. Type-aware rules enable a class of checks that `tsc --noEmit` does not enforce, including rules about safe handling of `any`, floating promises, and unnecessary type assertions.

**Implementation:**

Update `eslint.config.js` to add `parserOptions` and enable type-aware rules:

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,  // ← upgraded from recommended
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

Resolve any new lint errors introduced by the stricter rules. Common patterns to fix: adding explicit `void` to unhandled promise calls (`void somePromise()`), typing `catch (err)` as `unknown`, and replacing `as AnyType` assertions with type guards where possible.

**Acceptance Criteria:**
- `npm run lint` passes with zero errors under `recommendedTypeChecked`.
- `tseslint.configs.recommended` is replaced by `recommendedTypeChecked`.
- `parserOptions.project` points to both `tsconfig.app.json` and `tsconfig.node.json`.
- No `@ts-ignore` or `any` types are introduced to silence lint errors — TypeScript_Strict_Enforcer validates this.

**Persona Test — Ryan (Developer):** Ryan writes `someFirestoreCall().then(result => result.nonExistentField)`. ESLint immediately underlines the problem. He does not discover the issue at runtime.

---

### R17 — Wire `@tanstack/eslint-plugin-query`

**Driver:** Ryan (Owner/Developer — TanStack Query correctness)  
**Severity:** Low — F-18  
**Files changed:** `eslint.config.js`, `docs/projects/R17_eslint-query-plugin.md`

**User Story:** As Ryan (developer), I want TanStack Query-specific ESLint rules enforced so that common query anti-patterns (missing query keys, exhaustive dependency arrays) are caught at lint time before Phase 3 and beyond data fetching work begins.

**Background:** `@tanstack/eslint-plugin-query` is listed in `devDependencies` but is not imported or configured in `eslint.config.js`. This epic depends on R16 (which sets up the expanded ESLint config structure) and is most valuable when done before R15 (which adds the first real TanStack Query usage).

**Implementation:**

Add the plugin to `eslint.config.js`:

```javascript
import queryPlugin from '@tanstack/eslint-plugin-query'

export default defineConfig([
  // ... existing config
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // ... existing extends
      ...queryPlugin.configs['flat/recommended'],
    ],
  },
])
```

**Acceptance Criteria:**
- `npm run lint` passes with the plugin active.
- Any future `useQuery` call missing a `queryKey` triggers a lint error immediately.

---

### R18 — Add Vitest Coverage Threshold

**Driver:** Ryan (Owner/Developer — test confidence)  
**Severity:** Low — F-19  
**Files changed:** `vitest.config.ts`, `docs/projects/R18_coverage-threshold.md`

**User Story:** As Ryan (developer), I want a minimum test coverage threshold enforced in CI so that new code additions cannot silently reduce overall test coverage below an agreed baseline.

**Background:** Vitest is configured but has no coverage threshold. The current test suite covers the cookie banner (`CookieBanner.test.tsx`) and analytics module (`analytics.test.ts`). Coverage is not measured or enforced. As the R3 refactoring adds new hooks and components, coverage can silently decline.

**Implementation:**

Add coverage configuration to `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
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

The initial thresholds (40% line coverage) are deliberately modest — they establish a floor that the current test suite already exceeds, and they will be raised as R3 adds testable hooks.

**Acceptance Criteria:**
- `npm run test -- --coverage` generates a coverage report.
- The CI workflow `firebase-deploy.yml` runs tests with coverage on every `push` to `main`.
- A PR that introduces a new untested hook causes the coverage check to fail if the hook's addition drops overall coverage below the threshold.

---

### R19 — Booking Form E2E Coverage

**Driver:** Travis (P2) + Margaret (P3) + Sophie (P5) — booking confidence  
**Severity:** High — F-20  
**Files changed:** `e2e/booking.spec.ts` (new), `e2e/language.spec.ts` (new), `docs/projects/R19_e2e-booking-coverage.md`

**User Story:** As Ryan (developer), I want Playwright E2E tests covering the full booking form flow so that a regression in the most critical user path is caught before deployment.

**Background:** The single existing E2E spec (`e2e/analytics.spec.ts`) tests the cookie banner and the presence of a `tel:` link. The four-step booking form — which is the primary revenue-generating flow — has zero E2E coverage. A breaking change in any booking step would reach production undetected.

**Implementation:**

Create two new spec files:

**`e2e/booking.spec.ts`** — covers the complete booking flow for Travis's use case:

```typescript
import { test, expect } from '@playwright/test'

test('Travis can complete a full booking in under 3 minutes', async ({ page }) => {
  await page.goto('/booking')

  // Step 1: Service type + property details
  await page.getByRole('radio', { name: /standard cleaning/i }).click()
  await page.getByRole('radio', { name: /3.4 bedroom/i }).click()
  await page.getByRole('button', { name: /increase bedrooms/i }).click() // 1 → 2
  await page.getByRole('button', { name: /next/i }).click()

  // Step 2: Schedule
  await page.getByRole('radio', { name: /biweekly/i }).click()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  await page.locator('#preferredDate').fill(tomorrow.toISOString().slice(0, 10))
  await page.getByRole('button', { name: /next/i }).click()

  // Step 3: Contact details
  await page.locator('#firstName').fill('Travis')
  await page.locator('#lastName').fill('McLeod')
  await page.locator('#email').fill('travis@test.com')
  await page.locator('#phone').fill('6135550001')
  await page.locator('#address').fill('123 Main St, Long Sault ON')
  await page.getByRole('button', { name: /next/i }).click()

  // Step 4: Review + submit
  await expect(page.getByText('Standard Cleaning')).toBeVisible()
  await expect(page.getByText('Every two weeks')).toBeVisible()
  // Intercept Firestore write — use a network mock or emulator
  await page.getByRole('button', { name: /confirm booking/i }).click()

  // Thank you page
  await expect(page).toHaveURL('/thank-you')
  await expect(page.getByText(/booking is confirmed/i)).toBeVisible()
})

test('Back button returns to previous step', async ({ page }) => {
  await page.goto('/booking')
  await page.getByRole('radio', { name: /standard cleaning/i }).click()
  await page.getByRole('button', { name: /next/i }).click()
  await page.getByRole('button', { name: /back/i }).click()
  await expect(page.getByRole('heading', { name: /what type of cleaning/i })).toBeVisible()
})

test('Required field validation shows errors on empty next', async ({ page }) => {
  await page.goto('/booking')
  await page.getByRole('button', { name: /next/i }).click()
  await expect(page.getByRole('alert').first()).toBeVisible()
})
```

**`e2e/language.spec.ts`** — covers language toggle:

```typescript
import { test, expect } from '@playwright/test'

test('Language toggle switches all nav strings to French', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /switch to french/i }).click()
  await expect(page.getByRole('link', { name: /réservez maintenant/i })).toBeVisible()
  await expect(page.getByRole('navigation').getByText('Services')).toHaveText('Services')
})

test('French booking page has French field labels', async ({ page }) => {
  await page.goto('/?lang=fr')
  await page.goto('/booking')
  await expect(page.getByText(/quel type de nettoyage/i)).toBeVisible()
})
```

**Playwright configuration:** Update `playwright.config.ts` to add a Firefox project alongside Chromium (bilingual UX bugs sometimes manifest in different rendering engines).

**Acceptance Criteria:**
- `npm run test:e2e` passes against the local dev server.
- The booking flow spec completes without error.
- The language toggle spec confirms French strings render.
- The validation spec confirms error messages appear on empty `next`.
- CI `firebase-deploy.yml` runs E2E tests on push to `main`.

**Persona Test — Travis:** The Travis booking flow spec runs in under 3 minutes of wall-clock time. Its passage in CI is a standing automated guarantee that Travis's persona test is met.

**Persona Test — Sophie:** The French language spec confirms that French strings are present in the booking form without requiring a manual QA pass.

---

### R20 — Fix Analytics Singleton Test Isolation

**Driver:** Ryan (Developer — test reliability)  
**Severity:** Low — F-22  
**Files changed:** `src/lib/analytics.ts` (or `src/lib/firebase/analytics.ts` after R12), `src/lib/analytics.test.ts` (updated), `docs/projects/R20_analytics-test-isolation.md`

**User Story:** As Ryan (developer), I want analytics unit tests to be isolated from each other so that test results do not depend on execution order.

**Background:** `analytics.ts` maintains a module-level singleton `let analyticsInstance: Analytics | null = null`. Vitest shares module state across tests in a file by default. The `beforeEach` in `analytics.test.ts` calls `vi.clearAllMocks()` but does not reset `analyticsInstance` — meaning if `initializeAnalytics()` is called in test 1, `analyticsInstance` is set for all subsequent tests whether they call `initializeAnalytics()` or not. This is noted in a comment in the test file itself (`"the internal instance for testing logic isn't easily reachable"`).

**Implementation:**

Export a `resetAnalyticsForTesting` function from `analytics.ts` that is only callable in test environments:

```typescript
// analytics.ts addition
export const _resetForTesting = () => {
  if (import.meta.env.MODE === 'test') {
    analyticsInstance = null
  }
}
```

In `analytics.test.ts`:
```typescript
import { _resetForTesting } from './analytics'

beforeEach(() => {
  vi.clearAllMocks()
  _resetForTesting()
})
```

**Acceptance Criteria:**
- Each test in `analytics.test.ts` starts with `analyticsInstance === null`.
- Test order can be shuffled without affecting results (`vitest run --reporter=verbose --sequence.shuffle`).
- `_resetForTesting` is not exported from the production bundle (verify via `npm run build` output that it is tree-shaken or guarded by `MODE === 'test'`).

---

---

# PART F — Reference

---

## F1. Complete Epic Map

| Epic | Name | Severity | Phase | Findings Addressed |
|---|---|---|---|---|
| R01 | Firestore Security Rules (Production) | Critical | R1 | F-01 |
| R02 | Admin Authorization: Server-Side Enforcement | Critical | R1 | F-02 |
| R03 | Remove `.env.production` From Version Control | High | R1 | F-03 |
| R04 | Content-Security-Policy Header | Medium | R1 | F-11 |
| R05 | Fix `MIN_DATE` / `MAX_DATE` Module-Level Constants | High | R2 | F-04 |
| R06 | Fix Footer Cornwall Location Link | High | R2 | F-05 |
| R07 | Add Missing Booking Status i18n Keys | High | R2 | F-06 |
| R08 | Fix `QuoteCalculator` Animation Trigger | Medium | R2 | F-07 |
| R09 | Remove Stale Repository Artifacts + Update README | Low | R2 | F-08, F-09, F-21 |
| R10 | Document `onDailyReminderCheck` DB Asymmetry | Medium | R2 | F-10 |
| R11 | Decompose `AdminPage.tsx` Into Composed Modules | Medium | R3 | F-12 |
| R12 | Reorganize `lib/` Into Sub-Directories | Low | R3 | F-13 |
| R13 | Consolidate Framer Motion Animation Variants | Low | R3 | F-14 |
| R14 | Replace `ServiceIcon` Switch Statement With Data Map | Low | R3 | F-15 |
| R15 | Wire TanStack Query to Firestore Bookings Subscription | Medium | R3 | F-16 |
| R16 | Enable Type-Aware ESLint Rules | Medium | R4 | F-17 |
| R17 | Wire `@tanstack/eslint-plugin-query` | Low | R4 | F-18 |
| R18 | Add Vitest Coverage Threshold | Low | R4 | F-19 |
| R19 | Booking Form E2E Coverage | High | R4 | F-20 |
| R20 | Fix Analytics Singleton Test Isolation | Low | R4 | F-22 |

---

## F2. Dependency Graph

```
R01 (Firestore Rules)
  └──► R02 (Admin Auth)
         └──► R03 (Remove .env.production)

R04 (CSP Header) — independent

R05–R10 — independent of each other and of R1

R11 (AdminPage decompose)
  └──► R15 (TanStack Query)

R12 (lib/ reorganize) — must run before R13, R14 if they touch lib/ paths
R13 (animations) — independent
R14 (ServiceIcon) — independent

R16 (type-aware ESLint)
  └──► R17 (query plugin)

R18 (coverage threshold) — independent
R19 (E2E) — independent
R20 (analytics test) — independent
```

**Critical path:** R01 → R02 → R03 → deploy to production.  
All other phases can proceed in parallel after R1 is deployed.

---

## F3. ADR Index for This Plan

| ADR | Decision | Status |
|---|---|---|
| ADR-007 | Firestore security rules architecture — `admins` collection as authorization source | Required before R01 |
| ADR-008 | Secrets management — production credentials via GitHub Secrets only, not committed files | Required before R03 |

Both ADRs must be written in `docs/decisions/` and reviewed by Ryan before the corresponding epics enter Phase B.

---

## F4. Docs-as-Code Updates Required Per Epic

| Epic | `ACTIVE_CYCLE.md` | `firestore-schema.md` | `COMPLIANCE.md` | `decisions/` | `user-guide/` |
|---|---|---|---|---|---|
| R01 | ✅ on close | ✅ add `admins` collection | ✅ update data access section | ADR-007 | No |
| R02 | ✅ on close | No | No | No | `admin-guide.md` (admin setup) |
| R03 | ✅ on close | No | No | ADR-008 | No |
| R04 | ✅ on close | No | ✅ add CSP notes | No | No |
| R05–R10 | ✅ on close | R10 only | No | No | Varies |
| R11 | ✅ on close | No | No | No | `admin-guide.md` |
| R12 | ✅ on close | No | No | No | No (but update `CLAUDE.md`) |
| R13–R15 | ✅ on close | No | No | No | No |
| R16–R20 | ✅ on close | No | No | No | No |

---

## F5. Go/No-Go Checklist Before Phase R1 Deploy

```
[ ] R01: firestore.rules deployed — unauthenticated read of bookings returns 403
[ ] R01: `admins` collection exists in (default) Firestore DB with all authorized emails
[ ] R01: New booking form write succeeds end-to-end
[ ] R01: Admin dashboard loads all bookings when signed in as authorized user
[ ] R02: Client-side email allowlist check removed from AdminPage.tsx
[ ] R02: Firestore presence check in useAdminAuth returns correct isAuthorized state
[ ] R03: .env.production removed from git tracking
[ ] R03: Production CI deploy succeeds using GitHub Secrets only
[ ] R04: CSP header visible on lilypad-freshnest.web.app — no console violations
[ ] ADR-007 committed
[ ] ADR-008 committed
[ ] CLAUDE.md updated to reference ADR-007 and ADR-008
[ ] Security_Auditor subagent sign-off on firestore.rules vs COMPLIANCE.md
[ ] npm run build passes — zero TypeScript errors
[ ] Existing tests pass — npm run test
```
