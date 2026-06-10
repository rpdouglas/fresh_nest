# Epic 28: Firebase Auth + Protected /admin Route
**Goal:** Implement a secure, bilingual Google Sign-In authentication gate for the `/admin` route. Verify authorization using a client-side allowlist environment variable, and render a high-quality dashboard shell for authenticated admins.

**Primary Persona(s) Served:**
- **Lauren S. (Owner/Admin):** Needs a seamless, secure, and user-friendly login experience to access administrative tools.
- **Dev/QA Team:** Needs clear access controls and staging options.

---

## Strategy 1: Client-Side Allowlist with Single Route (Recommended)
**Description:** Implement Firebase Google Sign-In directly on the `/admin` route. When unauthenticated, render a beautiful card-based login screen. Upon successful authentication, check the email against a comma-separated allowlist in `VITE_ADMIN_EMAILS`. If allowed, render the admin dashboard placeholder (with Lauren's avatar and E29 next-steps note); if denied, display an "Access Denied" error with a sign-out button.

**Files Changed:**
1. `src/pages/AdminPage.tsx` (New): Handles auth state changes via `onAuthStateChanged`, allowlist checks, login view, access denied view, and dashboard dashboard placeholder view.
2. `src/App.tsx`: Import `AdminPage` and swap it in place of the `/admin` `PlaceholderPage`.
3. `src/i18n/locales/en.json` & `src/i18n/locales/fr.json`:
   - Add labels, headings, error messages, and descriptions for the admin login screen, access denied screen, and dashboard headers in English and French.
4. `.env.production` & `.env.local`: Add the key `VITE_ADMIN_EMAILS` with default admin addresses.

**Persona Impact:**
- Zero friction for Lauren (Google Sign-In is a single click).
- Fully accessible for Margaret (accessible button sizes, high contrast text).
- Secure: protects sensitive booking metadata from standard users without Firestore query overhead.

**Risks:**
- Google sign-in popups can be blocked by aggressive browser settings (handled gracefully by providing redirect fallback or clear feedback).

**Schema Audit:**
- No database schema changes. No Firestore checks are required for this strategy.

---

## Strategy 2: Firestore Role-Based Access Check
**Description:** Store authorized admin UIDs or email addresses in a Firestore collection (`admins`). On sign-in, query this collection.
**Files Changed:** `src/pages/AdminPage.tsx`, `docs/firestore-schema.md`.
**Risks:**
- Introduces database read queries on every authentication state refresh, increasing Firestore usage.
- Risk of locking out admins if Firestore security rules or database connections fail.

---

## Strategy 3: React Router Route Guards with Redirects
**Description:** Separate the login state into `/admin/login` and `/admin`, using a custom React Router guard/loader to perform redirect loops.
**Files Changed:** `src/App.tsx`, `src/pages/AdminLoginPage.tsx` (New), `src/pages/AdminDashboardPage.tsx` (New).
**Risks:**
- More complex routing configuration.
- Potential redirect loop glitches during async authentication loading states.

---

## Recommendation & Next Steps
We recommend **Strategy 1** based on the results of our `/grill-me` session. We will:
1. Create a beautiful, brand-aligned login card directly on the `/admin` page.
2. Set up Google Auth Provider with Firebase.
3. Configure translation files and testing parameters.

**Awaiting your explicit human approval to execute Strategy 1!**
