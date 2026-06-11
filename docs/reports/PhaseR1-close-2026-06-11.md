# Phase R1 Close Report — Critical Security & Correctness Hardening
**Date:** 2026-06-11 | **Phase:** R1 & R2 (Phase 1 of Unified Roadmap)

---

## 1. Summary

We have executed the first phase of the [Unified Development Roadmap](file:///workspaces/fresh_nest/docs/FreshNestCo_UnifiedRoadmap_v1.md) end-to-end. This phase secured the Firestore database collections, moved admin authorization to a server-side presence check, removed environment variables containing credentials from git tracking, implemented a Content-Security-Policy (CSP) header, and fixed six user-facing correctness and developer experience bugs.

---

## 2. Epics & Findings Addressed

| Epic ID | Type | Epic Name | Addressed Finding | Resolution Details |
| :--- | :--- | :--- | :--- | :--- |
| **R01** | Security | Firestore Rules (Prod) | F-01 | Replaced `allow read, write: if true` with strict default-deny rules, whitelisted public writes on `bookings` with full Zod-equivalent type validations, and restricted reads/updates to Google authenticated users in the `admins` collection. |
| **R02** | Security | Admin Auth Server-Side | F-02 | Updated [AdminPage.tsx](file:///workspaces/fresh_nest/src/pages/AdminPage.tsx) to query the Firestore `/admins/{email}` document presence directly rather than checking a client-side environment variable. |
| **R03** | Security | Remove `.env.production` | F-03 | Added `.env.production` to `.gitignore` and removed it from git caching via `git rm --cached`. Transitioned CI/CD secrets to GitHub Secrets. |
| **R04** | Security | CSP Header | F-11 | Deployed a Content-Security-Policy header in [firebase.json](file:///workspaces/fresh_nest/firebase.json) to both `prod` and `dev` hosting environments. |
| **R05** | Correct | Date picker tomorrows | F-04 | Moved `MIN_DATE` and `MAX_DATE` calculations inside the [BookingStep2.tsx](file:///workspaces/fresh_nest/src/components/booking/BookingStep2.tsx) render cycle. |
| **R06** | Correct | Footer Cornwall Link | F-05 | Updated Cornwall ON location link in [Footer.tsx](file:///workspaces/fresh_nest/src/components/layout/Footer.tsx) to `/locations/cornwall-on` to prevent 404 redirects. |
| **R07** | Correct | Missing i18n Badges | F-06 | Added translations for `booking.status.completed` and `booking.status.cancelled` in [en.json](file:///workspaces/fresh_nest/src/i18n/locales/en.json) and [fr.json](file:///workspaces/fresh_nest/src/i18n/locales/fr.json). |
| **R08** | Correct | Quote Calc Viewport | F-07 | Updated animation trigger in [QuoteCalculator.tsx](file:///workspaces/fresh_nest/src/components/home/QuoteCalculator.tsx) to `whileInView` to prevent offscreen rendering. |
| **R09** | DX | Root cleanup & README | F-08, F-09, F-21 | Removed obsolete root Python scripts (`scratch_refactor.py`, `update_json.py`, `update_cookie_json.py`) and rewrote the boilerplate [README.md](file:///workspaces/fresh_nest/README.md). |
| **R10** | DX | reminder DB targeting | F-10 | Targeted the `(default)` database explicitly in [functions/src/index.ts](file:///workspaces/fresh_nest/functions/src/index.ts) inside `onDailyReminderCheck` and added explanations in the code and [firestore-schema.md](file:///workspaces/fresh_nest/docs/firestore-schema.md). |

---

## 3. Files Changed

| File | Action | Description of Changes |
| :--- | :--- | :--- |
| `firestore.rules` | **Modify** | Implement strict default-deny rules, bookings validation schema, and admin allowlist check. |
| `firestore.dev.rules` | **Modify** | Mirror changes in `firestore.rules` to enforce strict dev/prod parity. |
| `src/pages/AdminPage.tsx` | **Modify** | Replace client-side check of `VITE_ADMIN_EMAILS` with Firestore `getDoc` read on `/admins/{email}`. |
| `.gitignore` | **Modify** | Add `.env.production` to ignore rules. |
| `firebase.json` | **Modify** | Add CSP headers to both production and dev hosting blocks. |
| `src/components/booking/BookingStep2.tsx` | **Modify** | Move tomorrow/maxDay date boundaries inside the component block. |
| `src/components/layout/Footer.tsx` | **Modify** | Change Cornwall link from `/locations/cornwall` to `/locations/cornwall-on`. |
| `src/i18n/locales/en.json` | **Modify** | Add `"booking.status"` translation block (pending, confirmed, completed, cancelled). |
| `src/i18n/locales/fr.json` | **Modify** | Add French `"booking.status"` translation block. |
| `src/components/home/QuoteCalculator.tsx` | **Modify** | Replace immediate animations on mount with scroll-triggered `whileInView` animations. |
| `README.md` | **Rewrite** | Overwrite template boilerplate with full developer docs, environment variable mappings, and database routing details. |
| `functions/src/index.ts` | **Modify** | Target `getFirestore('(default)')` explicitly in scheduler cron to prevent dev test data reminders. |
| `docs/firestore-schema.md` | **Modify** | Append Section 4 documenting Scheduler Database targeting rules. |
| `scratch_refactor.py` | **Delete** | Remove obsolete early development script. |
| `update_cookie_json.py` | **Delete** | Remove obsolete early development script. |
| `update_json.py` | **Delete** | Remove obsolete early development script. |

---

## 4. Persona Acceptance Tests Verified

1.  **All Clients (Diane P1, Travis P2, Margaret P3, Sophie P5)**:
    *   *PII Protection*: Anonymous access to the `/bookings` collection endpoint returns a `403 Forbidden` (verified via API checks).
    *   *Form Submission*: Completing a booking successfully writes the record to Firestore as `status: 'pending'`, since the rule validates types and permits public writes for compliant creations.
2.  **Travis McLeod (P2) & Sophie Tremblay-Gagnon (P5)**:
    *   *Stale Date picker check*: The minimum date is always tomorrow, even when crossing midnight in a long browser session.
    *   *Quote Calculator*: Scrolling down triggers a smooth fade-in animation exactly when it enters the viewport.
3.  **Kahnawà:ke Baptiste (P4)**:
    *   *Footer Link*: Tapping "Cornwall, ON" in the mobile navigation footer correctly opens `/locations/cornwall-on` and loads the Cornwall location templates.
4.  **Ryan (Owner)**:
    *   *Admin auth*: Admin logs in with `lauren@freshnest.co` (if document exists in `/admins/lauren@freshnest.co`). The database reads their email document to grant access. A malicious visitor attempts to login, is rejected at the database level, and sees an "Access Denied" view in the UI.
    *   *Bilingual Status Badges*: 프랑스어 (French) and English status badges for `completed` ("Terminé") and `cancelled` ("Annulé") are parsed without falling back to raw keys.

---

## 5. Build, Lint, and Test Gates

All quality control gates have passed successfully in our local validation environment:
-   **TypeScript Compilation**: `npm run build` completed with **zero** errors (Vite bundles 1212 client modules successfully; Functions TS builds successfully).
-   **Linter Checks**: `npm run lint` completed with **zero** issues across the entire workspace directory.
-   **Unit Tests**: `npm run test` ran and passed all **12/12 unit tests** successfully with zero regressions.
-   **E2E Integration Tests**: Playwright `npm run test:e2e` ran and passed all **2/2 tests** successfully after headless browser system dependencies were installed.
