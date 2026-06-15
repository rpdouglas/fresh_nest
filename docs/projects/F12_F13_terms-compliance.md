# F12/F13 — Terms Consent & Exports
**Epic:** F12 / F13 | **Phase:** Phase 4 (Operations & Compliance) | **Date:** June 15, 2026  
**Primary Personas:** Sarah (P12 - Owner / Compliance), Diane (P1 - French trust), Sophie (P5 - French trust)
**Dependencies:** F01a, F01b, F01c, F02

---

## 1. Context & User Stories

### A. Business Owner & Compliance Persona (Sarah - P12)
*   **Terms Version Control:** As a business owner, I want to ensure every active staff member has accepted the current Terms of Service and Workplace Guidelines. When I update these terms, I want the system to prompt all staff members to review and accept them before they can claim shifts or view jobs.
*   **Immutable Consent History:** I want to track each staff member's terms acceptance history permanently, including the accepted version, timestamp, and IP address.
*   **Employment Record Export:** I want to be able to export a complete compliance and payroll record for any staff member on demand as a structured JSON or CSV. This export must include their profile constraints, full terms acceptance history, job history (with pay rate snapshots), and audit log trail.
*   **Immutable Audit Log:** Any modifications to compliance fields must be recorded in an immutable audit log database.

### B. Staff Personas (Diane - P1, Sophie - P5)
*   **Bilingual Consent:** As a francophone cleaner, I want to read the workplace terms and consent agreement in French so that I fully understand my rights and obligations.

---

## 2. Technical Architecture & Database Schema

### A. Environment Config
*   Add `VITE_CURRENT_TERMS_VERSION=2.1` to environment configurations.

### B. Firestore Collections Schema Updates
*   **`/staff/{staffId}` (compliance sub-object):**
    ```typescript
    interface TermsAcceptance {
      version: string
      acceptedAt: Timestamp
      ipAddress?: string
    }
    
    interface Staff {
      // ... existing fields
      compliance: {
        acceptedTermsVersion: string // e.g. "2.1"
        termsHistory: TermsAcceptance[]
      }
    }
    ```
*   **`/auditLog/{logId}`:**
    ```typescript
    interface AuditEntry {
      collection: 'staff' | 'jobs' | 'bookings'
      documentId: string
      field: string
      oldValue: unknown
      newValue: unknown
      changedBy: string // email or UID
      changedAt: Timestamp
      reason: string | null
      overrideType: string | null
    }
    ```

---

## 3. Implementation Steps

### Step 1: Locales & Translations (EN / FR)
*   Add `fsm.compliance.terms` translation keys to `en.json` and `fr.json`:
    *   `title`: Terms of Service & Guidelines
    *   `subtitle`: Please review and accept the latest guidelines before continuing.
    *   `checkbox`: I have read, understood, and agree to these guidelines.
    *   `acceptBtn`: Accept & Continue
    *   `accepting`: Accepting...
    *   `ipLabel`: IP Address
    *   `body`: Localized multi-paragraph guidelines explaining safety, check-in accuracy, and photo verification.

### Step 2: Update Firestore Rules (Proposal)
*   Allow staff members to update their own `compliance` object (specifically `acceptedTermsVersion` and `termsHistory` array):
    ```firestore
    match /staff/{staffId} {
      allow update: if isAdmin()
        || (request.auth != null
            && request.auth.uid == staffId
            && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['constraints', 'preferences', 'financials', 'compliance'])
            && (!request.resource.data.financials.diff(resource.data.financials).affectedKeys().hasAny(['currentMonthEarnings', 'earningsHistory']))
           );
    }
    ```

### Step 3: Implement `onStaffUpdate` Audit Logging Cloud Function
*   In `functions/src/index.ts`, add a Firestore `onUpdate` trigger for the `staff` collection:
    *   Detects if `compliance.acceptedTermsVersion` has changed.
    *   Writes a new log entry to `/auditLog` recording the version change, document reference, timestamps, and initiator.

### Step 4: Build FSM Terms Consent Overlay
*   Create `apps/fsm/src/components/auth/TermsConsentOverlay.tsx`:
    *   Checks if `staffProfile` is loaded and `staffProfile.compliance.acceptedTermsVersion !== import.meta.env.VITE_CURRENT_TERMS_VERSION`.
    *   Renders a blocking overlay (`fixed inset-0 z-50 bg-charcoal/80 p-4 backdrop-blur-sm`).
    *   Loads localized terms content and checkbox.
    *   Fetches client IP address on mount from `https://api.ipify.org?format=json` (falls back to `'offline'` if offline/blocked).
    *   Enforces 48px touch targets for the checkbox and accept button.
    *   On acceptance, updates the `/staff/{uid}` document.
*   Integrate `<TermsConsentOverlay />` at the bottom of `apps/fsm/src/components/layout/FsmLayout.tsx`.

### Step 5: Build Admin Employment Record Exporter UI
*   Add an "Actions" column to the `StaffTable.tsx` component in the Customer/Admin app.
    *   Add an "Export" action button for each staff row.
    *   On click, displays a modal offering two choices:
        1.  **Download Payroll CSV:** Exports all completed jobs, dates, hours worked, pay rates, and calculated payouts in a selected date range.
        2.  **Download Compliance File (JSON):** Downloads a complete structured audit file containing staff profile details, full terms acceptance history, job history, and audit log entries matching this staff member.
    *   Implement CSV and JSON string builders client-side, generating `Blob` downloads for Sarah.

---

## 4. Persona Acceptance Tests

*   **P12 Sarah (Terms Rollout & Consent):**
    *   Sarah updates the current terms version in the config from `2.0` to `2.1`.
    *   Cleaner Ahmed logs in. He is immediately blocked by a full-page trilingual overlay showing the new terms.
    *   He cannot navigate away, claim shifts, or view jobs.
    *   He checks the checkbox and clicks "Accept & Continue".
    *   The overlay disappears. His profile document is updated with `acceptedTermsVersion: '2.1'` and a new entry is appended to `termsHistory` with his timestamp and IP.
    *   An entry is automatically written to `/auditLog` indicating the terms version change.

*   **P1 Diane / P5 Sophie (Bilingual Consent):**
    *   Diane lands on the FSM portal with French locale.
    *   The Terms Consent overlay is fully rendered in French. All instructions and action buttons are translated.

*   **P12 Sarah (Employment Exporter):**
    *   Sarah clicks "Export" on cleaner Brenda's profile.
    *   She selects "Download Payroll CSV" for "Last Month". A CSV is generated containing all of Brenda's completed jobs, durations, pay snapshots, and earnings.
    *   She selects "Download Compliance File (JSON)". A JSON file is generated with Brenda's profile, full terms history, job log, and audit logs.
