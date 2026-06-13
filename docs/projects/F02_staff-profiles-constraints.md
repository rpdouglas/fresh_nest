# F02 — Staff Profile & Schedule Constraints
**Epic:** F02 | **Phase:** Phase 2 (Staff Foundation) | **Date:** June 13, 2026  
**Primary Personas:** Carla (P7 - Earnings Cap), Jasmine (P8 - Transit Buffers), Mike (P9 - Blocked Windows), Sarah (P12 - Admin)
**Dependencies:** F01a, F01b, F01c  

---

## 1. Context & User Stories

### A. Staff Personas
*   **Carla (P7 - ODSP Recipient):** As a cleaner on ODSP, I want to record my monthly earnings limit and track my current month earnings so that I do not accidentally exceed the allowable clawback threshold and lose my benefits.
*   **Jasmine (P8 - Transit Commuter):** As a transit-riding cleaner, I want to set my transit buffer and commute preferences so that the system blocks me from claiming shifts that are geographically or timing-wise impossible to reach.
*   **Mike (P9 - Recovery Commitment):** As a staff member in recovery, I want to block out recurring weekly calendar slots for support group meetings so that those shifts are completely hidden from my marketplace view.

### B. Admin Persona
*   **Sarah (P12 - Owner):** As the business owner, I want to register new staff members in the admin console so that they are enrolled with correct roles, statuses, and default configurations, enabling them to log in to the FSM portal.

---

## 2. Technical Architecture & Database Schema

The staff profile uses the `/staff` collection. The document ID matches the authenticated staff member's Firebase Auth `uid`.

### A. Schema Fields (Aligned with `firestore-schema.md`)
*   `firstName`: `string`
*   `lastName`: `string`
*   `email`: `string`
*   `phone`: `string`
*   `role`: `'cleaner' | 'lead' | 'supervisor'`
*   `status`: `'onboarding' | 'active' | 'inactive'`
*   `preferences`: `{ language: 'en' | 'fr' }`
*   `constraints`:
    *   `transportMode`: `'personal_vehicle' | 'transit' | 'rideshare' | 'walk'`
    *   `transitBufferMinutes`: `number`
    *   `blockedWindows`: `Array<{ dayOfWeek: number, startTime: string, endTime: string, recurring: boolean }>`
*   `financials`:
    *   `monthlyEarningsLimit`: `number | null`
    *   `currentMonthEarnings`: `number`
    *   `earningsHistory`: `Array<{ month: string, total: number }>`
*   `compliance`:
    *   `acceptedTermsVersion`: `string`
    *   `termsHistory`: `Array<{ version: string, acceptedAt: Timestamp }>`
*   `onboardingChecklist`: `Record<string, boolean>`
*   `createdAt`: `Timestamp`

---

## 3. Implementation Steps

### Step 1: Localized i18n Translation Keys
*   Add FSM translations in `apps/fsm/src/i18n/locales/` (`en.json`, `fr.json`) for:
    *   Profile headers, fields, and transport modes (`transit`, `personal_vehicle`, etc.).
    *   Blocked window day labels (Sunday-Saturday).
    *   ODSP Earnings Cap visual elements ("Safe to Earn", limit input, warning messages).
*   Add Admin dashboard translations in `apps/customer/src/i18n/locales/` (`en.json`, `fr.json`) for:
    *   Staff list headers, role tags, status tags.
    *   "Register Staff" button, modal inputs, validation messages, and submit actions.

### Step 2: Build Admin Staff Management in Customer App
*   Modify [apps/customer/src/pages/AdminPage.tsx](file:///workspaces/fresh_nest/apps/customer/src/pages/AdminPage.tsx) to add a new **Staff** tab.
*   Create `apps/customer/src/components/admin/StaffTable.tsx`:
    *   Renders list of staff fetched from `/staff` collection.
    *   Includes a search/filter by status and role.
*   Create `apps/customer/src/components/admin/RegisterStaffModal.tsx`:
    *   A form modal to register a new staff member.
    *   On submit, writes a new document directly to the `/staff` collection. (The ID of the document will map to the user's future authentication registration; for passwordless logins, the admin registers their email first to permit access).

### Step 3: Implement FSM Staff Profile Page
*   Create `apps/fsm/src/pages/ProfilePage.tsx`:
    *   **Profile Info Card:** Read-only name, email, phone, and role.
    *   **Transit & Buffer Controls:** Select dropdown for `transportMode` and input for `transitBufferMinutes` (minimum touch target 48px).
    *   **Weekly Blocked Windows Calendar Picker:** Add, list, and delete recurring weekly blocked windows. Each blocked window requires:
        *   `dayOfWeek`: dropdown (0 = Sunday, 1 = Monday, etc.).
        *   `startTime` & `endTime`: time picker inputs (`HH:MM` format).
    *   **"Safe to Earn" ODSP Meter:**
        *   Input to configure `monthlyEarningsLimit`.
        *   Visual gauge/meter showing `currentMonthEarnings` out of the limit, color-coded based on percentage (Green < 75%, Orange 75%-90%, Red > 90% or exceeded).
    *   **Action Buttons:** A minimum 48px height "Save Settings" button that updates the `/staff/{uid}` document.

### Step 4: Configure Routing & Navigation in FSM App
*   Update `apps/fsm/src/App.tsx` to mount the `<ProfilePage />` at route `/profile`.
*   Ensure Navbar contains a visible link/button to `/profile` with minimum 48px touch targets and text at least 16px.

---

## 4. Persona Acceptance Tests

*   **P12 Sarah (Admin Registration):**
    *   Sarah logs into the Customer App Admin Panel.
    *   She clicks the new "Staff" tab and selects "Register Staff".
    *   She fills out the form for a new cleaner, clicks "Register", and the employee appears in the staff list.
*   **P7 Carla (ODSP Earnings Cap):**
    *   Carla logs into the FSM portal. She goes to the Profile Page.
    *   She enters `$1,000` as her monthly limit and clicks "Save".
    *   Her profile displays a gauge showing `$750 / $1000` (75%) filled with a warm warning highlight.
*   **P8 Jasmine (Transit Buffers):**
    *   Jasmine goes to her Profile Page.
    *   She selects `Transit` as her transport mode, inputs `60` minutes travel buffer, and clicks "Save".
    *   Her profile successfully persists the updated transit constraints.
*   **P9 Mike (Blocked Windows):**
    *   Mike goes to his Profile Page.
    *   He adds a recurring blocked window: `Tuesday`, `19:00` to `20:30`.
    *   The list displays "Tuesday 7:00 PM - 8:30 PM (Weekly)".
    *   He deletes a previously configured window, and it is removed immediately.
