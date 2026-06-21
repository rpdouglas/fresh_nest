# Fresh Nest Co. — Employee Onboarding System
## P3-E27: Full Project Plan v1.0

**Version:** 1.0
**Date:** June 17, 2026
**Source:** [Gap Analysis] + [Industry Benchmark] (ZenMaid, Janitorial Manager, Housecall Pro, HR Cloud, Vetty, Valamis)
**Phase:** 3 — Band A (Critical carryover — legal compliance items)
**Overall Complexity:** XL | **Priority:** P1
**Epic ID in Master Plan:** P3-E27 (after P3-E26 Quote-First System)

---

## How to Read This Plan

This epic is large enough to warrant its own internal phase structure. It is organised into four sub-phases that build sequentially:

- **Sub-Phase A — Emergency fixes** (ship immediately, before any hire uses this system)
- **Sub-Phase B — Pre-boarding** (automated invitation and consent pipeline)
- **Sub-Phase C — Employee self-service** (first-login screens, training, profile completion)
- **Sub-Phase D — Admin operations** (checklist UI, probation tracking, structured offboarding)

Each sub-phase is broken into epics. Each epic follows the standard format: Objective → Background → Personas served → Key tasks → Acceptance criteria → Complexity → Priority → Dependencies.

Complexity: S (days) · M (1 week) · L (2–3 weeks) · XL (1 month+)
Priority: P0 (legal/security blocker) · P1 (ops blocker) · P2 (quality gap) · P3 (growth/retention)

---

## Staff Personas

The existing six customer personas (P1 Diane through P6 Gallagher) drive all customer-facing features. The onboarding epic introduces **staff-side personas** that drive all FSM and admin features. These are referenced throughout this plan and should be added to `docs/PERSONAS.md`.

---

### SP1 — Lauren Arsenault (Business Owner / Admin)
**Role:** Owner, administrator, scheduler
**Location:** Cornwall, ON
**Primary need:** Register new employees quickly, track their onboarding status at a glance, and be confident that all legal compliance steps are complete before assigning them to client homes.
**Key pain points with current system:**
- Must contact new employees out of band (phone/text) to tell them the FSM app exists
- Has no visibility into which employees have cleared background checks
- Cannot update the onboarding checklist because there is no UI for it
- The `backgroundCheck: false` flag cannot be changed without a direct Firestore edit
**Persona test:** Lauren registers a new cleaner in under 3 minutes. The employee receives a welcome email with a magic link within 60 seconds. Lauren can see the onboarding checklist progress from the admin Staff panel without writing any code.

---

### SP2 — Jasmine Beausoleil (New Cleaner — English, On Transit)
**Role:** Cleaner (entry-level)
**Location:** Cornwall, ON — uses public transit to reach client homes
**Primary need:** A clear, guided first-login experience that tells her exactly what she needs to do before her first shift. She is not particularly tech-savvy and has never used a field service app before.
**Key pain points with current system:**
- No welcome email arrives — she doesn't know the FSM app exists until Lauren calls
- If she clicks the magic link before the `onUserCreated` Cloud Function completes, she gets a generic error and is signed out with no explanation
- No step-by-step guidance exists for her first login
**Persona test:** Jasmine receives a welcome email, clicks the magic link, completes the 4-screen consent sequence (employment agreement, background check consent, platform terms, emergency contact), and views her assigned jobs — all in under 10 minutes, on mobile, without calling Lauren.

---

### SP3 — Brenda Côté (Experienced Lead Cleaner — French)
**Role:** Lead cleaner / supervisor-in-training
**Location:** Snye QC (commutes into Cornwall)
**Primary need:** All onboarding communication in French. Wants to understand her role clearly and have access to training materials she can reference later, not just click through.
**Key pain points with current system:**
- The `TermsConsentOverlay` is bilingual and works — but the welcome process around it is English-only and manual
- No French-language training materials exist in the platform
**Persona test:** Brenda receives welcome email in French, completes all consent screens in French, and accesses training modules in French — with zero English strings displayed at any point. Linguistic_Auditor confirms zero hardcoded strings.

---

### SP4 — Marcus Oakes (Seasonal / Part-Time Cleaner)
**Role:** Cleaner, part-time, limited hours
**Location:** Cornwall area
**Primary need:** Onboards quickly, understands exactly what his monthly earnings limit means, and can manage his availability (blocked windows) without calling Lauren.
**Persona test:** Marcus logs in, accepts terms, sets his blocked windows for school pickup (Tuesday/Thursday 3–5pm), and sees his earnings safety bar in the FSM app — all without admin involvement.

---

## Current State (What the Code Actually Does)

For full detail, see `freshnest-employee-onboarding-gap-analysis.md`. Summary:

1. Lauren fills `RegisterStaffModal` → Firestore document created with auto-generated ID
2. **Nothing else happens.** No email, no Auth account, no invitation.
3. Lauren manually contacts the employee to tell them the FSM app URL
4. Employee navigates to FSM, enters email for magic link
5. Firebase Auth account created → `onUserCreated` assigns role (race condition possible)
6. `StaffAuthProvider` detects UID mismatch → runs silent document migration (fragile)
7. `TermsConsentOverlay` shows (works correctly)
8. Employee accesses FSM app
9. `onboardingChecklist: { backgroundCheck: false, trainingCompleted: false }` — never updated

**Critical compliance bugs:**
- `compliance.acceptedTermsVersion: '1.0'` written by admin at creation — employee has not seen or accepted anything
- No background check consent collection (PIPEDA violation)
- No employment contract collection (Ontario ESA gap)
- No WHMIS chemical safety training (legally required in Ontario)

---

## Sub-Phase A — Emergency Fixes
*(Ship immediately — do not wait for Sub-Phase B. These are live compliance bugs.)*

---

### P3-E27-A1: Fix Terms Pre-Acceptance Compliance Bug
**Priority:** P0 | **Complexity:** S | **Personas:** SP1 Lauren (legal accountability), SP2 Jasmine, SP3 Brenda

**Objective:** Remove the fabricated terms acceptance record that is written by the admin at employee creation time, before the employee has ever seen or agreed to anything.

**Background:** `useStaff.registerStaff()` writes `compliance.acceptedTermsVersion: '1.0'` and a `termsHistory` entry timestamped to the moment Lauren fills the `RegisterStaffModal`. The current terms version is `2.1`. The employee has not seen, read, or consented to anything. The `TermsConsentOverlay` correctly detects the mismatch (`'1.0' !== '2.1'`) and forces re-acceptance — but this still leaves a fabricated `'1.0'` acceptance in the audit trail that the employee never made. Under PIPEDA, consent must be informed and voluntary. A pre-accepted record is neither. This is a five-minute fix that must ship before any employee is onboarded.

**Key tasks:**
- In `useStaff.registerStaff()` — remove the `compliance` block entirely from the `addDoc` write:
  ```typescript
  // Remove this block:
  compliance: {
    acceptedTermsVersion: '1.0',
    termsHistory: [{ version: '1.0', acceptedAt: new Date() }],
  }
  // Replace with:
  compliance: {
    acceptedTermsVersion: null,
    termsHistory: [],
  }
  ```
- Update `TermsConsentOverlay.tsx` show condition: `acceptedTermsVersion === null || acceptedTermsVersion !== CURRENT_TERMS_VERSION`
- Update `docs/firestore-schema.md` — `acceptedTermsVersion` is `string | null` (null = not yet accepted)
- Update the Firestore rules for the `staff` collection to permit `null` on `compliance.acceptedTermsVersion`
- Run Firestore rules emulator test: confirm `null` value passes, confirm existing staff with real acceptance record unaffected

**Acceptance criteria:**
- No new staff document is created with a terms acceptance record before the employee has logged in
- `TermsConsentOverlay` shows for all new employees on first login (null check confirmed)
- Existing employees with real `acceptedTermsVersion: '2.1'` records are unaffected
- `docs/firestore-schema.md` reflects the `null` default

**Dependencies:** None — fix immediately

---

### P3-E27-A2: Fix UID Linking Race Condition
**Priority:** P0 | **Complexity:** M | **Personas:** SP2 Jasmine (first login failure), SP3 Brenda (French error message on failure)

**Objective:** Eliminate the fragile email-based document migration that runs on every new employee's first login, replacing it with server-side Firebase Auth account creation that makes the UID known from the start.

**Background:** When an employee first logs in, `StaffAuthProvider` finds no document at `staff/{uid}` (the document was created with `addDoc`, not `uid` as the ID). The provider silently migrates the document: query by email → copy to `staff/{uid}` → delete old document. If this migration fails (network error, Firestore rules issue, or the `onUserCreated` Cloud Function race condition hasn't settled), the employee is signed out with a generic error — on their very first login attempt, at the highest-stakes moment of the employment relationship.

The correct architectural fix is to create the Firebase Auth account server-side when Lauren registers the employee, so the UID is known before the Firestore document is written. This also unlocks the welcome email with embedded magic link (P3-E27-B1).

**Key tasks:**
- Create Cloud Function `onStaffRegistered` (callable, admin-only):
  1. Receive `RegisterStaffInput` from admin modal
  2. Call `admin.auth().createUser({ email, emailVerified: false })` → get `uid`
  3. Call `admin.auth().setCustomUserClaims(uid, { role: staffRoleToClaimRole(role) })` — Claims set before first login, eliminating the race condition
  4. Write `staff/{uid}` document with `uid` field — document ID is the Firebase Auth UID from the start
  5. Return `{ success: true, uid }` to the admin modal
- Update `RegisterStaffModal` / `useStaff.registerStaff()` to call the Cloud Function instead of calling `addDoc` directly
- Remove the UID linking migration code from `StaffAuthProvider` (`isLinking` flag and `setDoc`/`deleteDoc` logic) — it becomes unreachable once all documents are created with UID as ID
- Add retry logic (max 3 attempts with 1s backoff) to the `onSnapshot` listener in `StaffAuthProvider` before displaying an error to the user
- Update Firestore security rules: staff create rule now checked server-side in Cloud Function (admin SDK bypasses rules); update comments accordingly
- Update `docs/firestore-schema.md`: `staff/{uid}` — document ID is Firebase Auth UID

**Acceptance criteria:**
- New employee's Firestore document is always at `staff/{uid}` — no migration ever needed
- New employee's Firebase Auth account is created and Claims are set before the welcome email is sent
- The `isLinking` code path in `StaffAuthProvider` is deleted — `git grep isLinking` returns empty
- A newly registered employee can log in on the first attempt without any race condition
- If `onStaffRegistered` fails, the admin modal shows a clear error — no partial state (no Auth account without a Firestore document, or vice versa) — use a transaction or compensating delete

**Dependencies:** P3-E27-A1 (clean compliance block) | Must ship before P3-E27-B1

---

## Sub-Phase B — Pre-Boarding
*(Triggered by admin creating a staff record — everything before the employee's first login)*

---

### P3-E27-B1: Automated Welcome Email with Magic Link
**Priority:** P1 | **Complexity:** M | **Personas:** SP1 Lauren (no more manual contact), SP2 Jasmine (clear first step), SP3 Brenda (French email)

**Objective:** Send a branded bilingual welcome email to the new employee the moment Lauren registers them, with an embedded magic link that signs them in on the first click — no URL to remember, no password to set.

**Background:** Currently, Lauren must contact the employee by phone or text after registration. There is zero automated communication. The industry standard (ZenMaid, Housecall Pro, Jobber) is a system-generated invitation email that delivers the app link and first-login credentials. This is the single most impactful change to the onboarding experience — a professional first-contact email sets the tone for the employment relationship.

**Key tasks:**
- Extend `onStaffRegistered` Cloud Function (from P3-E27-A2):
  - After creating Auth account and Firestore document, generate a magic link: `admin.auth().generateSignInWithEmailLink(email, actionCodeSettings)`
  - `actionCodeSettings.url` = `${FSM_APP_URL}/login?onboarding=true` — the `onboarding=true` param triggers the first-login consent sequence (P3-E27-C1)
  - Call `sendEmail()` with the `staffWelcome` template (EN or FR based on `input.language`)
- Create email templates `staffWelcomeEn` and `staffWelcomeFr`:
  - Subject: "Welcome to Fresh Nest Co. — Your account is ready" / "Bienvenue chez Fresh Nest Co. — Votre compte est prêt"
  - Body:
    - "Hi [firstName], welcome to the Fresh Nest Co. team!" (personalised)
    - What to expect in the first few days
    - "Sign in to get started" CTA button → magic link URL (expires in 24h)
    - Lauren's contact details (phone + email) for questions
    - Fresh Nest brand footer
  - Bilingual: all strings via i18n keys in `emailTemplates.ts`
- Store `FSM_APP_URL` as a Firebase Function secret (not hardcoded)
- Add `welcomeEmailSentAt: Date | null` field to `staff` schema (set by Cloud Function on send)
- Admin panel shows "Welcome email sent [timestamp]" or "Resend welcome email" button per staff row

**Acceptance criteria:**
- SP2 Jasmine receives a welcome email within 60 seconds of Lauren clicking "Register Staff"
- SP3 Brenda receives the email entirely in French (Linguistic_Auditor verified — zero hardcoded strings)
- Magic link in the email signs Brenda in on the first click without entering a password
- Admin can see "Welcome email sent [date]" in the staff row and can resend if needed
- Email fails gracefully: if Resend API call fails, error is logged to Sentry (P3-E4) and admin is shown an error toast — no silent failure

**Dependencies:** P3-E27-A2 (server-side Auth account creation — magic link requires an existing Auth account)

---

### P3-E27-B2: Background Check Consent Collection
**Priority:** P0 | **Complexity:** M | **Personas:** SP1 Lauren (legal gate), SP2 Jasmine (consent must be informed), SP3 Brenda (FR consent)

**Objective:** Collect explicit, timestamped, PIPEDA-compliant background check consent from the employee before any background check can be initiated.

**Background:** Under PIPEDA, background checks require explicit written consent before initiation. Currently there is no consent collection anywhere in the system — not in the registration modal, not on first login, not anywhere. `onboardingChecklist.backgroundCheck: false` exists as a boolean but there is no consent event, no timestamp, no IP record, and no mechanism to change it. Lauren cannot legally initiate a background check on any employee registered through this system without explicit prior consent.

**Key tasks:**
- Add `backgroundCheck` structured object to `staff` schema (replaces the existing boolean):
  ```typescript
  backgroundCheck: {
    consentGiven: boolean           // employee actively consented
    consentGivenAt: Date | null     // timestamp of consent
    consentIpAddress: string | null // IP at time of consent
    status: 'not_started' | 'pending' | 'cleared' | 'flagged'
    completedAt: Date | null        // when result was received
    provider: string | null         // e.g. 'Certn', 'Sterling', 'manual'
    notes: string | null            // admin-only internal note
  }
  ```
- Background check consent is collected on the employee's first login as Screen 2 of the consent sequence (see P3-E27-C1), before the platform Terms of Service
- Consent screen content (bilingual):
  - "Fresh Nest Co. requires a background check as a condition of employment. This check will be conducted by [provider] and the results will be used solely to assess your suitability for working in client homes."
  - "You have the right to a copy of the results. Results will be kept confidential."
  - Explicit consent checkbox: "I consent to a background check being conducted on my behalf"
  - Decline option: "I do not consent" — directs employee to contact Lauren; cannot proceed to FSM app without consent
- On consent: update `staff/{uid}.backgroundCheck.consentGiven = true`, `consentGivenAt`, `consentIpAddress` (fetched from `api.ipify.org` as in existing `TermsConsentOverlay`)
- Firestore security rules: `backgroundCheck.status` can only be updated by admin; employee can update consent fields only
- Admin panel: background check status badge per employee (not_started / pending / cleared / flagged); admin can update status + provider + notes; admin can download/upload evidence document to Firebase Storage `backgroundChecks/{uid}/`
- Dispatch board guard: employee cannot be assigned to jobs while `backgroundCheck.status !== 'cleared'` — visual indicator on dispatch board if attempted; admin override permitted with reason logged to `auditLog`

**Acceptance criteria:**
- Background check consent screen appears as Screen 2 of the first-login sequence
- SP2 Jasmine cannot proceed to the FSM app without explicitly checking the consent checkbox
- Consent is recorded with timestamp and IP address
- Lauren can see `backgroundCheck.status` in the admin Staff panel and update it
- Dispatch board shows a visual warning if an uncleared employee is assigned to a job
- SP3 Brenda sees the consent screen entirely in French (Linguistic_Auditor)

**Dependencies:** P3-E27-A2 (server-side account creation) | P3-E27-C1 (first-login sequence)

---

## Sub-Phase C — Employee First-Login Sequence
*(The guided first-login experience replacing the current abrupt entry into the FSM app)*

---

### P3-E27-C1: First-Login Consent Sequence
**Priority:** P1 | **Complexity:** L | **Personas:** SP2 Jasmine (guided, mobile), SP3 Brenda (all French), SP4 Marcus (fast, no friction)

**Objective:** Replace the current abrupt post-login experience (TermsConsentOverlay appearing immediately after login with no context) with a structured 4-screen consent and setup sequence that collects all legally required information in a friendly, guided flow.

**Background:** Currently, a new employee who logs in successfully sees the `TermsConsentOverlay` immediately — no welcome, no context, no explanation of what Fresh Nest Co. expects. The overlay is the only screen between login and the FSM app. After completing the gap analysis, four distinct consent and setup steps are required before a new employee can be considered onboarded: employment agreement, background check consent, platform terms, and emergency contact. These must happen in order, on first login, in the employee's preferred language.

**Sequence design:**

```
[Magic link click] → [Login complete]
        ↓
Screen 1: Employment Agreement
  "Before you get started, please review and sign the Fresh Nest Co. Employment Agreement."
  [Scrollable agreement text]
  [Type your full name to sign]
  [I have read and agree] checkbox
  [Continue →]
        ↓
Screen 2: Background Check Consent (P3-E27-B2)
  [Consent text]
  [I consent to a background check] checkbox
  [Continue →]
        ↓
Screen 3: Platform Terms of Service (existing TermsConsentOverlay — unchanged)
        ↓
Screen 4: Emergency Contact
  "Please provide an emergency contact before your first shift."
  [Contact name] [Relationship] [Phone number]
  [Save and continue →]
        ↓
[FSM app — My Jobs page]
```

The `onboarding=true` URL param (set in the welcome email magic link from P3-E27-B1) triggers this full sequence. Returning employees who log in normally bypass screens 1, 2, and 4 (already completed) and only see Screen 3 if their terms version has changed.

**Key tasks:**
- Create `OnboardingSequenceGuard` component that wraps the FSM `ProtectedRoute`
  - Reads `staffProfile.employmentAgreement.acceptedAt` and `staffProfile.backgroundCheck.consentGiven` and `staffProfile.emergencyContact.name`
  - Renders the appropriate next screen in the sequence if any step is incomplete
  - Once all screens complete, renders the FSM app normally
- Screen 1: `EmploymentAgreementScreen` component
  - Scrollable employment agreement text (bilingual, from `t()` keys — never hardcoded)
  - "Type your full name to sign" text input
  - `I have read and agree` checkbox
  - On acceptance: write `staffProfile.employmentAgreement: { version: '1.0', acceptedAt, signedByName, ipAddress }` to Firestore
- Screen 2: `BackgroundCheckConsentScreen` (implements P3-E27-B2 requirements)
- Screen 3: Existing `TermsConsentOverlay` (no changes)
- Screen 4: `EmergencyContactScreen`
  - Fields: `emergencyContactName`, `emergencyContactPhone`, `emergencyContactRelationship`
  - On save: write to `staffProfile.personalDetails.emergencyContact` (admin-readable; not shown on FSM profile page for privacy)
- Progress indicator: "Step 2 of 4" at top of each screen
- "Save & Continue" button — each screen saves to Firestore before advancing; progress is preserved if the employee closes the app mid-sequence
- Language: all four screens render in `staffProfile.preferences.language` — switches before any text renders

**Acceptance criteria:**
- SP2 Jasmine completes all 4 screens in under 10 minutes on mobile
- SP3 Brenda sees all 4 screens in French (Linguistic_Auditor verified)
- Each screen is independently resumable — if Jasmine closes the app after Screen 2 and returns, she starts at Screen 3, not Screen 1
- Employment agreement acceptance includes the typed name and IP address in the Firestore record
- Background check consent is recorded per P3-E27-B2 acceptance criteria
- Emergency contact is stored with correct field names per `docs/firestore-schema.md`
- The FSM app (`My Jobs`) is not accessible until all 4 screens are complete

**Dependencies:** P3-E27-A2 (stable login), P3-E27-B2 (background check consent spec)

---

### P3-E27-C2: Employee Self-Service Profile Completion
**Priority:** P2 | **Complexity:** M | **Personas:** SP4 Marcus (availability management), SP2 Jasmine (schedule blocks)

**Objective:** Expand the FSM Profile page to collect all information the system and the business need from the employee, beyond the scheduling fields already present.

**Background:** The current `ProfilePage.tsx` allows employees to update transport mode, transit buffer, monthly earnings limit, and blocked windows. This is correct for scheduling. What is missing: any personal details beyond what Lauren typed at registration. The employee cannot update their phone number if it changes, cannot see their role or status, and cannot verify that Lauren typed their name correctly.

**Key tasks:**
- Expand `ProfilePage.tsx` with new sections:

  **"My Details" (read-only from admin data, employee can flag corrections):**
  - Name (read-only — admin corrects via admin panel)
  - Email (read-only)
  - Role badge (Cleaner / Lead / Supervisor)
  - Status badge (Onboarding / Active / Inactive)
  - Language preference (editable — updates `preferences.language`)

  **"Contact" (employee-editable):**
  - Phone number (editable — triggers `onStaffUpdatedTrigger` if changed)
  - "Flag a correction" — text input to notify Lauren of any detail error; writes to `staff/{uid}.corrections` array

  **"Emergency Contact" (employee-editable, pre-filled from Screen 4):**
  - Name, phone, relationship — all editable

  **"Availability" (existing — unchanged):**
  - Transport mode, transit buffer, blocked windows — already implemented

  **"Earnings" (read-only, employee-facing view):**
  - Monthly earnings limit (read-only — admin sets)
  - Current month earnings (read-only)
  - Earnings safety bar (existing component)

- All new fields write to `staff/{uid}` via `updateDoc` in the existing `handleSaveProfile` pattern
- Firestore security rules: confirm employees can update `personalDetails.emergencyContact`, `personalDetails.phone`, `preferences.language` — block updates to `role`, `status`, `financials.monthlyEarningsLimit`

**Acceptance criteria:**
- SP4 Marcus can update his phone number without calling Lauren
- SP4 Marcus can add a blocked window for his Tuesday/Thursday school pickup without admin involvement
- SP2 Jasmine's emergency contact is pre-filled from Screen 4 and editable
- Read-only fields (name, email, role, status, earnings limit) cannot be changed by the employee (Firestore rules emulator test)
- All new strings use `t()` — Linguistic_Auditor verified

**Dependencies:** P3-E27-C1 (emergency contact collected in Screen 4)

---

### P3-E27-C3: Platform Training Modules
**Priority:** P1 | **Complexity:** L | **Personas:** SP2 Jasmine (new to field service apps), SP3 Brenda (French training), SP4 Marcus (quick reference)

**Objective:** Build a structured training module system in the FSM app that guides new employees through six essential knowledge areas before they are cleared for independent job assignment.

**Background:** `onboardingChecklist.trainingCompleted: false` exists as a boolean in Firestore but there is no training content, no training module, and no mechanism for it to become `true`. New employees are expected to figure out the FSM app independently. In Ontario, WHMIS (Workplace Hazardous Materials Information System) training is legally required before any worker handles controlled products — cleaning chemicals qualify. This is not optional.

**Six modules:**

| # | Module | Legal requirement |
|---|---|---|
| 1 | Welcome to Fresh Nest Co. | — |
| 2 | Using the Fresh Nest App (jobs, check-in, checklist, photos) | — |
| 3 | Cleaning Techniques by Surface | — |
| 4 | Chemical Safety — WHMIS | ✅ Ontario WHMIS required |
| 5 | Client Home Standards (conduct, communication, access codes) | — |
| 6 | When Things Go Wrong (dispute, breakage, injury, emergency) | — |

**Key tasks:**
- Create `TrainingPage` in `apps/fsm` (new route `/training`)
- Add "Training" link to `FsmLayout` navigation — visible until `onboardingChecklist.whmisCompleted == true` then moves to "Resources" section
- Each module is a scrollable content screen with:
  - Module title and progress ("Module 4 of 6")
  - Section-by-section content (text + optional inline icon or illustration)
  - At the end: a short 3-question comprehension check (radio button answers)
  - "I've completed this module" confirmation button — only enabled when all questions answered correctly
- Module completion writes to `staff/{uid}` — expand `onboardingChecklist` from 2 booleans to a typed object:
  ```typescript
  onboardingChecklist: {
    backgroundCheckConsent: boolean       // SP3-E27-B2
    backgroundCheckCleared: boolean       // admin marks
    idVerified: boolean                   // admin marks
    contractSigned: boolean               // SP3-E27-C1 Screen 1
    emergencyContactCollected: boolean    // SP3-E27-C1 Screen 4
    module1Welcome: boolean               // employee self-completes
    module2AppTraining: boolean
    module3CleaningTechniques: boolean
    module4Whmis: boolean                 // WHMIS — legal gate
    module5ClientStandards: boolean
    module6EmergencyProcedures: boolean
    platformTrainingCompleted: boolean    // true when all 6 modules done
    supervisedShiftCompleted: boolean     // admin marks
    uniformIssued: boolean                // admin marks
    directDepositOnFile: boolean          // admin marks
  }
  ```
- `platformTrainingCompleted` is set to `true` automatically when all 6 module booleans are `true`
- Firestore rule update: employee cannot be assigned jobs when `onboardingChecklist.module4Whmis == false` OR `onboardingChecklist.backgroundCheckCleared == false` — admin override permitted with `auditLog` entry
- Training content is authored in `en.json` / `fr.json` — all strings via `t()` — Brenda receives all training in French
- Admin can see module completion per employee in the Staff Detail Panel (P3-E27-D1)

**Acceptance criteria:**
- SP2 Jasmine completes all 6 modules within 45 minutes on mobile
- SP3 Brenda completes all training in French — zero English strings (Linguistic_Auditor)
- WHMIS module (Module 4) must be completed before Jasmine can be assigned to a job (dispatch board shows warning if admin attempts early assignment)
- `onboardingChecklist.platformTrainingCompleted` is `true` in Firestore after all 6 modules
- Admin sees each module's completion status in the Staff Detail Panel

**Dependencies:** P3-E27-C1 (first-login sequence complete before training) | P3-E27-D1 (admin visibility)

---

## Sub-Phase D — Admin Operations
*(Admin-side visibility, compliance management, and structured follow-up)*

---

### P3-E27-D1: Staff Detail Panel & Onboarding Checklist UI
**Priority:** P1 | **Complexity:** L | **Personas:** SP1 Lauren (full visibility, admin actions)

**Objective:** Give Lauren a complete, real-time view of every employee's onboarding status and the ability to take all required admin-side compliance actions from the admin panel — without writing Firestore directly.

**Background:** The current `StaffTable` shows name, email/phone, role, status, transport mode, and an "Export" button. There is no way to view or update the onboarding checklist, change an employee's status from onboarding to active, mark a background check as cleared, or see training completion progress. All of these require direct Firestore edits today.

**Key tasks:**
- Add expandable **Staff Detail Panel** to each row in `StaffTable` (click row to expand — consistent with existing `BookingDetailPanel` pattern)
- Panel sections:

  **Onboarding Checklist (admin-toggleable items):**
  ```
  ✅ Employment Agreement Signed       [signed by "Jasmine Beausoleil" on Jun 15, 2026]
  ✅ Background Check Consent          [consented on Jun 15, 2026]
  ⏳ Background Check Cleared         [Status: Pending | Provider: Certn]  [Update Status ▾]
  ☐  ID Verified                       [Mark complete]
  ✅ WHMIS Training Complete           [completed Jun 16, 2026]
  ✅ Platform Training Complete        [all 6 modules — Jun 16, 2026]
  ☐  Supervised Shift Completed       [Mark complete]
  ☐  Uniform Issued                   [Mark complete]
  ☐  Direct Deposit on File           [Mark complete]
  ```
  - Admin toggles for: background check status (pending/cleared/flagged + provider + notes), ID verified, supervised shift, uniform issued, direct deposit on file
  - Employee-completed items show as read-only with the completion timestamp
  - Toggles write to `staff/{uid}.onboardingChecklist` via `updateDoc`
  - All changes logged to `auditLog` with `adminEmail`, `field`, `oldValue`, `newValue`, `timestamp`

  **Status Management:**
  - "Activate Employee" button — changes `status: 'onboarding' → 'active'`
  - Gated: button is disabled (with tooltip) until: `backgroundCheckCleared`, `idVerified`, `contractSigned`, `platformTrainingCompleted` are all `true`
  - On activation: writes `probation.startDate` (today) and `probation.endDate` (today + 90 days), generates 3 check-in entries (Day 30, Day 60, Day 90)

  **Compliance Overview:**
  - Employment agreement: version signed, date, name typed
  - Background check consent: date, IP address
  - Terms of Service: version accepted, date, IP address
  - Emergency contact: name and phone (read-only display)

  **Training Progress:**
  - Module completion bar (6 of 6 complete / x of 6 complete)
  - Per-module completion date

  **Quick Actions:**
  - "Resend Welcome Email" (calls Cloud Function; logs to auditLog)
  - "Export Staff Record" (existing ExportRecordModal — unchanged)

- Add `personalDetails` section with admin-writable fields:
  - `directDepositOnFile` toggle
  - `sin` masked field (admin-only entry; never logged to Cloud Logging; encrypted at rest note)

**Acceptance criteria:**
- SP1 Lauren can view the complete onboarding status of every employee without leaving the admin panel
- Lauren can mark background check cleared and the dispatch board immediately removes the assignment warning for that employee
- The "Activate Employee" button is disabled with a tooltip until all required checklist items are complete
- All admin checklist toggles write to `auditLog`
- Bilingual: all new admin UI strings use `t()` (Linguistic_Auditor)
- Brand_Auditor confirms design token compliance

**Dependencies:** P3-E27-B2 (background check schema), P3-E27-C3 (training module schema)

---

### P3-E27-D2: 30/60/90 Day Probation Tracking
**Priority:** P2 | **Complexity:** M | **Personas:** SP1 Lauren (structured follow-up), SP2 Jasmine (feeling supported), SP3 Brenda (FR notifications)

**Objective:** Automatically schedule and track three probation check-ins for every newly activated employee, with Lauren alerted by SMS and email when a check-in is due.

**Background:** Industry guidance for cleaning businesses is explicit: structured follow-up for at least the first five shifts, with daily end-of-shift check-ins in week one, weekly reviews for month one, and monthly reviews through 90 days. The first 90 days determine whether the employee integrates. Without any check-in mechanism, Fresh Nest has no early warning system for employees who are struggling, and no documented evidence of managerial engagement if a dispute arises.

**Key tasks:**
- Add `probation` block to `staff` schema:
  ```typescript
  probation: {
    startDate: string                    // YYYY-MM-DD — set on status → 'active'
    endDate: string                      // YYYY-MM-DD — startDate + 90 days
    checkIns: Array<{
      id: string
      scheduledDate: string              // Day 30, Day 60, Day 90
      label: string                      // '30-Day Review' etc.
      completedDate: string | null
      notes: string | null
      rating: 1 | 2 | 3 | 4 | 5 | null
      completedBy: string | null         // admin email
    }>
    probationOutcome: 'pending' | 'passed' | 'extended' | 'terminated' | null
  }
  ```
- Cloud Function `onStaffStatusActivated` (Firestore trigger — `status` transitions to `'active'`):
  - Write `probation.startDate`, `probation.endDate`
  - Generate 3 check-in entries: Day 5 (first check-in after ~first five shifts), Day 30, Day 90
  - Send congratulations email to employee (EN/FR): "Your account is now active. Welcome to the team!"
- Scheduled Cloud Function `onProbationCheckInDue` (runs daily at 9am):
  - Query staff where `probation.checkIns[].scheduledDate == today` and `completedDate == null`
  - Send Lauren email + SMS: "Probation check-in due for [firstName] [lastName] — [scheduledDate]. Log in to admin to complete."
  - Reuses existing `sendEmail` and `sendSms` infrastructure
- Admin **Probation** section in Staff Detail Panel:
  - Timeline: three check-in cards (Day 5 / Day 30 / Day 90)
  - Each card: scheduled date, status (upcoming/due/overdue/complete), "Complete check-in" button
  - "Complete check-in" reveals: date picker (defaults today), notes textarea, 5-star rating, "Save" button
  - Probation outcome selector (once all 3 are complete): Passed / Extended / Terminated
  - "Extended" adds 90 more days; "Terminated" sets `status: 'inactive'` and triggers offboarding checklist

**Acceptance criteria:**
- On SP2 Jasmine's account being activated, 3 check-in entries are auto-generated within 60 seconds
- Lauren receives an SMS + email reminder on each check-in due date
- Lauren can complete a check-in with notes and rating from the Staff Detail Panel
- All check-in completions are logged to `auditLog`
- Probation outcome flows correctly: "Passed" requires no further action; "Extended" generates 3 new check-ins; "Terminated" sets inactive status
- Reminder emails / SMS send in the admin's language (EN default)

**Dependencies:** P3-E27-D1 (Staff Detail Panel), P3-E27-A2 (stable staff schema)

---

### P3-E27-D3: Structured Offboarding
**Priority:** P2 | **Complexity:** M | **Personas:** SP1 Lauren (security and compliance), All staff (data privacy)

**Objective:** When an employee's status changes to `inactive`, automatically revoke their FSM access, generate an offboarding checklist, and archive their record — closing the security gap where former employees retain valid Firebase Auth sessions.

**Background:** Currently, if Lauren changes `staff.status` to `'inactive'` (which can only be done via a direct Firestore edit — there is no UI for it), the employee's Firebase Auth account remains active and their Custom Claims remain valid. They can continue logging into the FSM app indefinitely. This is a security risk: former employees with valid sessions can view client addresses, job schedules, and booking details. The `setUserRole` callable already exists for Claims management — offboarding just needs to call it.

**Key tasks:**
- Cloud Function `onStaffDeactivated` (Firestore trigger — `status` transitions to `'inactive'`):
  1. Call `admin.auth().updateUser(uid, { disabled: true })` — blocks all future logins immediately
  2. Call `admin.auth().setCustomUserClaims(uid, { role: 'inactive' })` — Custom Claims no longer grant FSM access
  3. Write `offboarding.deactivatedAt: Timestamp` to staff document
  4. Send Lauren email: "Staff account deactivated: [firstName] [lastName]. Pending offboarding checklist."
  5. Log to `auditLog`: `{ action: 'staff_deactivated', staffId: uid, deactivatedBy, timestamp }`
- Add `offboarding` block to `staff` schema:
  ```typescript
  offboarding: {
    deactivatedAt: Date | null
    checklist: {
      authRevoked: boolean           // set automatically by Cloud Function
      keysReturned: boolean          // admin marks
      accessCodesChanged: boolean    // admin marks
      finalPayCalculated: boolean    // admin marks
      recordArchived: boolean        // set automatically by annual archival
    }
    finalNotes: string | null        // admin records reason for departure
    departureReason: 'voluntary' | 'performance' | 'seasonal' | 'other' | null
  }
  ```
- Admin **Offboarding** section in Staff Detail Panel (visible only when `status == 'inactive'`):
  - Offboarding checklist: keys returned, access codes changed, final pay calculated
  - Admin toggles for each item
  - "Departure reason" selector
  - "Final notes" textarea
  - Auth revocation shown as auto-completed with timestamp
- "Reactivate" button — calls Cloud Function to reverse: `auth.updateUser(uid, { disabled: false })`, restore Claims, clear `offboarding.deactivatedAt`
- Update `StaffAuthProvider`: on `auth.disabled == true`, show "Your account has been deactivated. Contact Fresh Nest Co." instead of generic error

**Acceptance criteria:**
- When Lauren deactivates SP2 Jasmine, Jasmine cannot log into the FSM app within 60 seconds
- Lauren receives an email confirming the deactivation and the pending offboarding checklist
- Offboarding checklist visible in Staff Detail Panel for deactivated employees
- Reactivation fully restores FSM access
- Auth revocation is logged to `auditLog`
- Deactivated employees see a helpful message (not a generic error) if they attempt to log in

**Dependencies:** P3-E27-D1 (Staff Detail Panel), P3-E27-A2 (uid-based document structure)

---

## Schema Changes — Complete Reference

### Updated `staff/{uid}` document

```typescript
{
  // ── Existing fields (unchanged) ─────────────────────────────
  uid: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: 'cleaner' | 'lead' | 'supervisor'
  status: 'onboarding' | 'active' | 'inactive'
  preferences: { language: 'en' | 'fr' }
  constraints: { transportMode, transitBufferMinutes, blockedWindows }
  financials: { monthlyEarningsLimit, currentMonthEarnings, earningsHistory }
  createdAt: Date

  // ── Compliance (UPDATED — null defaults, no admin pre-acceptance) ──
  compliance: {
    acceptedTermsVersion: string | null       // null until employee accepts
    termsHistory: TermsAcceptance[]
  }

  // ── Employment Agreement (NEW — Screen 1 of first-login sequence) ──
  employmentAgreement: {
    version: string | null
    acceptedAt: Date | null
    signedByName: string | null
    ipAddress: string | null
  }

  // ── Background Check (NEW — replaces boolean flag) ─────────────
  backgroundCheck: {
    consentGiven: boolean
    consentGivenAt: Date | null
    consentIpAddress: string | null
    status: 'not_started' | 'pending' | 'cleared' | 'flagged'
    completedAt: Date | null
    provider: string | null
    notes: string | null
  }

  // ── Personal Details (NEW — admin-writable + employee-writable) ──
  personalDetails: {
    emergencyContact: {
      name: string | null
      phone: string | null
      relationship: string | null
    }
    corrections: Array<{ text: string, submittedAt: Date }>
    directDepositOnFile: boolean
    sin: string | null                        // encrypted at rest, admin-only
  }

  // ── Onboarding Checklist (EXPANDED from 2 booleans) ───────────
  onboardingChecklist: {
    backgroundCheckConsent: boolean
    backgroundCheckCleared: boolean
    idVerified: boolean
    contractSigned: boolean
    emergencyContactCollected: boolean
    module1Welcome: boolean
    module2AppTraining: boolean
    module3CleaningTechniques: boolean
    module4Whmis: boolean
    module5ClientStandards: boolean
    module6EmergencyProcedures: boolean
    platformTrainingCompleted: boolean
    supervisedShiftCompleted: boolean
    uniformIssued: boolean
    directDepositOnFile: boolean
  }

  // ── Pre-boarding (NEW) ────────────────────────────────────────
  welcomeEmailSentAt: Date | null

  // ── Probation (NEW — P3-E27-D2) ──────────────────────────────
  probation: {
    startDate: string | null
    endDate: string | null
    checkIns: Array<{
      id: string
      scheduledDate: string
      label: string
      completedDate: string | null
      notes: string | null
      rating: 1 | 2 | 3 | 4 | 5 | null
      completedBy: string | null
    }>
    probationOutcome: 'pending' | 'passed' | 'extended' | 'terminated' | null
  }

  // ── Offboarding (NEW — P3-E27-D3) ────────────────────────────
  offboarding: {
    deactivatedAt: Date | null
    checklist: {
      authRevoked: boolean
      keysReturned: boolean
      accessCodesChanged: boolean
      finalPayCalculated: boolean
      recordArchived: boolean
    }
    finalNotes: string | null
    departureReason: 'voluntary' | 'performance' | 'seasonal' | 'other' | null
  }
}
```

---

## New Cloud Functions

| Function | Trigger | Purpose |
|---|---|---|
| `onStaffRegistered` | `onCall` (admin) | Create Firebase Auth account + set Claims + write `staff/{uid}` + send welcome email with magic link |
| `onStaffStatusActivated` | `onDocumentUpdated` — `status → 'active'` | Write probation schedule, send employee congratulations email |
| `onStaffDeactivated` | `onDocumentUpdated` — `status → 'inactive'` | Disable Auth account, revoke Claims, notify Lauren |
| `onProbationCheckInDue` | Scheduled — daily 9am | Alert Lauren by SMS + email when a probation check-in is due |

---

## New Email Templates

| Template | Languages | Trigger | Content |
|---|---|---|---|
| `staffWelcome` | EN + FR | `onStaffRegistered` | Welcome, role, magic link CTA, Lauren's contact |
| `staffActivated` | EN + FR | `onStaffStatusActivated` | "Your account is now active. Welcome to the team!" |
| `staffDeactivated` | EN | `onStaffDeactivated` | Admin notification: deactivated + offboarding checklist |
| `probationCheckInDue` | EN | `onProbationCheckInDue` | Admin reminder: employee name, check-in label, due date |

---

## New Routes (apps/fsm)

| Route | Component | Purpose |
|---|---|---|
| `/onboarding` | `OnboardingSequencePage` | Hosts the 4-screen first-login sequence |
| `/training` | `TrainingPage` | 6-module training library |
| `/training/:moduleId` | `TrainingModulePage` | Individual module content + comprehension check |

---

## Updated Ideal Onboarding Journey

```
Lauren fills RegisterStaffModal
        ↓ onStaffRegistered Cloud Function
Firebase Auth account created + Claims set + staff/{uid} written
        ↓
Bilingual welcome email sent to employee (< 60 seconds)
        ↓
Employee clicks magic link → logged in immediately
        ↓
Screen 1: Employment Agreement → signs
Screen 2: Background Check Consent → consents
Screen 3: Platform Terms → accepts
Screen 4: Emergency Contact → fills in
        ↓
[FSM app — My Jobs page]
        ↓
Employee completes 6 training modules (including WHMIS)
        ↓
Lauren reviews onboarding checklist in admin:
  - Marks background check cleared (when received from provider)
  - Marks ID verified (in person)
  - Marks supervised shift completed (after first accompanied clean)
        ↓
Lauren clicks "Activate Employee" (all required checklist items met)
        ↓
Probation period begins (Day 5 / Day 30 / Day 90 check-ins scheduled)
Employee receives "You're active!" email
        ↓
Employee assigned to independent jobs
        ↓
[90-Day Probation conclusion]
Lauren marks outcome: Passed / Extended / Terminated
```

---

## Acceptance Criteria — Full Epic (P3-E27)

**Persona tests (required for Phase C close):**

- **SP1 Lauren:** Registers a new cleaner from the admin panel. A welcome email arrives in the employee's inbox within 60 seconds. The admin Staff panel shows the employee's full onboarding checklist. Lauren can mark background check cleared and activate the employee — all without writing a Firestore document directly.
- **SP2 Jasmine:** Clicks the magic link in her welcome email. Completes all 4 consent screens on her phone in under 10 minutes. Completes all 6 training modules (including WHMIS) within 45 minutes. Her onboarding checklist in the admin panel shows all self-completed items as done.
- **SP3 Brenda:** Sees zero English strings at any point in the onboarding flow — welcome email, all 4 consent screens, and all 6 training modules are in French. Linguistic_Auditor verifies.
- **SP4 Marcus:** Updates his blocked windows for school pickup and sees his earnings safety bar — all without calling Lauren.

**System tests:**
- Background check cleared gate: employee cannot be assigned to a job in the dispatch board while `backgroundCheck.status !== 'cleared'` — admin override available with reason logged
- WHMIS gate: employee cannot be assigned to a job while `module4Whmis == false` — same override mechanic
- Auth revocation: deactivated employee cannot log in within 60 seconds of deactivation
- Race condition: new employee can log in successfully on the first attempt (no UID migration needed)
- Compliance audit trail: `termsHistory`, `employmentAgreement`, and `backgroundCheck.consentGivenAt` all populated with employee's own timestamp and IP — no admin-generated records

---

## Epic Summary Table

| Sub-Phase | Epic | Priority | Complexity | Legal Gate | Key Persona |
|---|---|---|---|---|---|
| A — Emergency | P3-E27-A1: Fix Terms Pre-Acceptance Bug | P0 | S | ✅ PIPEDA | SP1 Lauren |
| A — Emergency | P3-E27-A2: Fix UID Linking Race Condition | P0 | M | — | SP2 Jasmine |
| B — Pre-boarding | P3-E27-B1: Welcome Email + Magic Link | P1 | M | — | SP3 Brenda (FR) |
| B — Pre-boarding | P3-E27-B2: Background Check Consent | P0 | M | ✅ PIPEDA | SP2 Jasmine |
| C — First Login | P3-E27-C1: First-Login Consent Sequence | P1 | L | ✅ ESA + PIPEDA | SP2 Jasmine |
| C — First Login | P3-E27-C2: Profile Completion | P2 | M | — | SP4 Marcus |
| C — First Login | P3-E27-C3: Training Modules | P1 | L | ✅ WHMIS | SP3 Brenda |
| D — Admin | P3-E27-D1: Staff Detail Panel + Checklist | P1 | L | — | SP1 Lauren |
| D — Admin | P3-E27-D2: Probation Tracking | P2 | M | — | SP1 Lauren |
| D — Admin | P3-E27-D3: Structured Offboarding | P2 | M | — | SP1 Lauren |

**Legal gates summary:** 4 of 10 epics close legally required gaps (PIPEDA consent, Ontario ESA employment agreement, WHMIS training, emergency contact under OHSA).

---

## Dependencies (External to This Epic)

| Dependency | Why |
|---|---|
| P3-E4 Observability (Sentry) | `onStaffRegistered` failures must surface in Sentry — a silent failure leaves an employee without a welcome email and Lauren without visibility |
| P3-E19 Cloud Functions Domain Split | New staff Cloud Functions slot into `functions/src/triggers/staff.ts` cleanly |
| P3-E18 Shared Types | `Staff` type expanded significantly — must update `packages/shared/src/types/staff.ts` |
| P3-E26 Quote-First System | Shares the first-login consent pattern (signing page, typed name, IP logging) — build P3-E26 first to establish the pattern |

---

## Phase 4 Backlog

| Item | Trigger |
|---|---|
| Mobile on-site training delivery (FSM video player) | After training module content is validated and stable |
| Background check API integration (Certn or Sterling) | After manual process is operationalised and volume justifies automation |
| Supervised shadow shift as dispatch board job type | After dispatch board (P2-E9) is stable and shadow shift volume grows |
| Win-back re-engagement for offboarded seasonal employees | After offboarding flow is stable and seasonal hiring patterns emerge |
| Reference check workflow | After direct employment contract compliance is closed |
