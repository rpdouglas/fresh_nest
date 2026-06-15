# F12/F13 Planning — Terms Consent & Exports
**Epic:** F12 / F13 | **Phase:** Phase 4 (Operations & Compliance) | **Date:** June 15, 2026  
**Primary Personas:** Sarah (P12 - Owner / Compliance), Diane (P1 - French trust), Sophie (P5 - French trust)
**Dependencies:** F01a, F01b, F01c, F02 (Staff Profile & Settings)

---

## 1. Persona Analysis & Acceptance Gate

This epic implements:
1. A mandatory **Terms Consent Gate** for the Staff Portal. When the business owner rolls out a new version of the Workplace Guidelines, staff are blocked from performing any actions (viewing shifts, jobs) until they review and accept.
2. An **Employment Record Exporter** in the Admin panel, allowing the business owner to download payroll logs and compliance histories on demand.

*   **Sarah (P12):** Needs legal certainty that terms consent is recorded immutably, and that full compliance and payroll logs can be exported as CSV/JSON for labor inspections.
    *   **Audit Trail:** Terms acceptance updates must log version details, timestamps, and IP addresses, generating an automatic entry in `/auditLog`.
    *   **Staff Exporter:** A simple action button on the Staff Table to download CSV (payroll detail matching a date range) and JSON (full profile, terms, jobs, and audit trail).
*   **Diane (P1) & Sophie (P5):** Require the terms and consent gate to be fully translated into French, signaling a professional, respectful, and legally compliant bilingual workspace.

### Acceptance Criteria (P12 Sarah & P1 Diane / P5 Sophie)
1. Sarah increments the current terms version in the FSM environment settings to `2.1`.
2. Upon login (or dashboard access), cleaner Ahmed is intercepted by a full-screen, blocking terms consent overlay.
3. The terms text and action buttons are fully localized (English or French matching the user's preferred language).
4. Ahmed cannot close the modal, navigate to other pages, or claim shifts until he checks the checkbox (min 48px tap target) and clicks "Accept & Continue" (min 48px tap target).
5. Upon acceptance, the `/staff/{uid}` document is updated:
    *   `compliance.acceptedTermsVersion` set to `'2.1'`
    *   `compliance.termsHistory` appends the acceptance snapshot with version, timestamp, and IP address.
6. A backend trigger writes the change transactionally to `/auditLog` under `overrideType: null`.
7. In the Admin App, Sarah clicks "Export" on cleaner Brenda's profile:
    *   **Payroll CSV Exporter:** Generates a CSV containing Brenda's completed jobs, date range, duration (checked-in to checked-out), pay rate snapshots, and total gross pay.
    *   **Compliance JSON Exporter:** Generates a JSON file with Brenda's profile data, full terms history, job log, and audit log overrides.

---

## 2. 3-Strategy Plan

### Strategy 1: Client-Side Consent Gate with Backend Audit Triggers (Recommended)
This strategy implements the Terms Consent Gate on the FSM client, allowing direct writes to the `compliance` field of the staff's document. To guarantee a secure, tamper-proof audit trail (satisfying Sarah P12), a Firestore trigger Cloud Function (`onStaffUpdate`) handles writing the audit log entries automatically on the backend whenever a compliance change is detected.

*   **Files Changed/Created:**
    *   `firestore.rules` & `firestore.dev.rules` (Modify: Add `'compliance'` to allowed update keys for authenticated staff on `/staff/{staffId}`).
    *   `functions/src/index.ts` (Modify: Export `onStaffUpdate` Firestore trigger).
    *   `apps/fsm/src/components/auth/TermsConsentOverlay.tsx` (Create: Full-screen blocking modal overlay with checkbox and fetch helper for client IP).
    *   `apps/fsm/src/components/layout/FsmLayout.tsx` (Modify: Render `TermsConsentOverlay` at layout level).
    *   `apps/fsm/src/i18n/locales/en.json` & `fr.json` (Modify: Add multi-paragraph terms and guidelines text).
    *   `apps/customer/src/components/admin/StaffTable.tsx` (Modify: Add Actions column, Export button, and Export modal).
    *   `apps/customer/src/components/admin/ExportRecordModal.tsx` (Create: Exporter selection panel with date ranges).
*   **Persona Impact:**
    *   *Sarah:* Secure, tamper-proof logs generated automatically. Dual export formats (CSV and JSON) cover payroll and regulatory audits.
    *   *Diane/Sophie:* Fully translated French guidelines and checkouts.
*   **Risks & Mitigation:**
    *   *Risk:* Client IP fetch service (`api.ipify.org`) is blocked or offline.
    *   *Mitigation:* Catch fetch exceptions and default to `'offline'` or `undefined` so offline users can still accept terms and sync later via local cache.
*   **Schema Audit:**
    *   Complies with `/staff` compliance schemas (`acceptedTermsVersion`, `termsHistory`).
    *   Writes directly to `/auditLog` via a trusted backend function.

---

### Strategy 2: HTTPS Callable Backend Functions for Consent & Exporter
Under this strategy, terms acceptance and record exporting are moved entirely to HTTPS Callable Cloud Functions. The client triggers backend functions to write terms acceptance, update the database, and log overrides in one server-side transaction.

*   **Files Changed/Created:**
    *   `functions/src/index.ts` (Create `acceptTerms` and `exportStaffRecord` callable functions).
    *   `apps/fsm/src/components/auth/TermsConsentOverlay.tsx` (Trigger backend callable on accept).
    *   `apps/customer/src/components/admin/ExportRecordModal.tsx` (Trigger backend export function).
*   **Persona Impact:** Same.
*   **Risks & Mitigation:**
    *   *Risk:* Breaking the offline support model. Since Jasmine (P8) and Brenda (P11) may be offline when launching the app or loading cached screens, a callable HTTPS function will fail instantly and block login. Standard Firestore local caching doesn't apply to HTTPS calls.
    *   *Mitigation:* Complex client-side queuing, which adds significant code bloat.

---

### Strategy 3: Hybrid Client-Side Logging (Relaxed Write Rules)
Allows the client FSM app to write terms acceptance to `/staff` and write the log record to `/auditLog` directly in a multi-write batch.

*   **Files Changed/Created:**
    *   `firestore.rules` (Modify: Allow authenticated staff to write directly to `/auditLog` for entries related to their own UIDs).
    *   `apps/fsm/src/components/auth/TermsConsentOverlay.tsx` (Batch writes staff profile and audit log).
*   **Persona Impact:** Same.
*   **Risks & Mitigation:**
    *   *Risk:* Violates Sarah's security constraints. Relaxing write rules for the `/auditLog` collection allows standard staff clients to potentially forge or alter audit logs, degrading compliance.

---

## 3. Detailed Implementation Steps (Strategy 1)

### Step 1: Translations and Localization
1. Edit `apps/fsm/src/i18n/locales/en.json` and `fr.json` to define `fsm.compliance.terms` blocks containing:
    *   `title`: Terms of Service & Guidelines / Conditions d'utilisation
    *   `subtitle`: Please review and accept the latest guidelines / Veuillez accepter les lignes directrices
    *   `checkbox`: I have read, understood, and agree... / J'ai lu, compris et accepté...
    *   `acceptBtn`: Accept & Continue / Accepter et continuer
    *   `body`: Multi-paragraph text containing workplace guidelines (arrival check-in, photo requirements, ODSP earnings caps, travel buffers).

### Step 2: Firestore Update Rules
1. Extend `firestore.rules` (and dev rules) to allow staff self-updates on `compliance` fields:
    ```firestore
    match /staff/{staffId} {
      allow update: if request.auth != null && request.auth.uid == staffId
        && request.resource.data.diff(resource.data).affectedKeys()
             .hasOnly(['constraints', 'preferences', 'financials', 'compliance']);
    }
    ```

### Step 3: Backend Trigger (`onStaffUpdate`)
1. Create a Firestore `onUpdate` Cloud Function in `functions/src/index.ts`:
    *   Detects if `before.data().compliance.acceptedTermsVersion !== after.data().compliance.acceptedTermsVersion`.
    *   Writes a new log entry to `/auditLog` with `collection: 'staff'`, `documentId: staffId`, `field: 'compliance.acceptedTermsVersion'`, `oldValue`, `newValue`, `changedBy: staffId`, `changedAt: new Date()`, `reason: 'Terms accepted'`.

### Step 4: Terms Consent Overlay Component
1. Create `apps/fsm/src/components/auth/TermsConsentOverlay.tsx`.
2. Add a `useEffect` to fetch the client's public IP from `https://api.ipify.org?format=json` with a timeout/try-catch fallback to `'offline'`.
3. Render a full-screen blurred modal blocking interaction until the checkbox and accept button are tapped (minimum 48px height, compliant with P3/Margaret touch target rules).
4. Integrate the overlay in `FsmLayout.tsx`.

### Step 5: Export Records Panel (CSV/JSON)
1. Add an Action column in `apps/customer/src/components/admin/StaffTable.tsx`.
2. Create `apps/customer/src/components/admin/ExportRecordModal.tsx`:
    *   Prompts Sarah for the format (Payroll CSV or Full JSON).
    *   If CSV, lets her select a date range.
    *   Queries completed jobs for the selected cleaner, calculating durations (`completedAt - checkedInAt`) and total pay.
    *   Formats the logs into a CSV or JSON string and initiates a browser-level Blob download.
