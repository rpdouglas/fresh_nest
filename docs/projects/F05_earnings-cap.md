# F05 — Earnings Cap (P7 Carla)
**Epic:** F05 | **Phase:** Phase 3 (Job Lifecycle & Pipeline) | **Date:** June 15, 2026  
**Primary Personas:** Carla (P7 - ODSP Cap), Sarah (P12 - Admin)  
**Dependencies:** F02 (Staff Profiles & Constraints)

---

## 1. Context & User Stories

### A. Staff Persona
*   **Carla (P7 - ODSP Recipient):** As a transit-commuting cleaner on ODSP, I want the system to check my monthly earnings limit before I claim a shift so that I am blocked from taking any job that would push me over my allowable limit, preventing a benefit clawback that could destabilize my housing.

### B. Admin Persona
*   **Sarah (P12 - Operations Manager):** As the operations manager, I want to override the earnings cap when assigning a shift manually to a cleaner, provided I input a mandatory reason that is stored in a permanent audit trail.

---

## 2. Technical Architecture & Database Schema

Enforcement happens on both the client (FSM Shift Board UI) and server (callable `claimJob` Cloud Function and Admin Panel write triggers).

### A. Firestore Rules Refinements (`/staff/{staffId}`)
Modify the rules block in `firestore.rules` and `firestore.dev.rules`:
*   Allow reads by owner staff or admin.
*   Allow updates by admin.
*   Allow updates by owner staff *only* on: `['constraints', 'preferences', 'financials.monthlyEarningsLimit']`.
*   Staff members *cannot* update `financials.currentMonthEarnings`, `financials.earningsHistory`, `role`, `status`, or `compliance`.

### B. Audit Log Schema
Entries written to `/auditLog/{logId}` when Sarah overrides the limit:
*   `collection`: `'jobs'`
*   `documentId`: `string` (job ID)
*   `field`: `'assignedTo'`
*   `oldValue`: `null`
*   `newValue`: `string` (cleaner's UID)
*   `changedBy`: `string` (Sarah's admin email)
*   `changedAt`: `Timestamp` (server timestamp)
*   `reason`: `string` (entered explanation)
*   `overrideType`: `'earnings_cap_exceeded'`

---

## 3. Implementation Steps

### Step 1: Refine Firestore Rules
*   Update `firestore.rules` and `firestore.dev.rules` to enforce the granular self-update rule for staff profile documents.

### Step 2: Add translation keys (EN/FR)
*   FSM locales (`apps/fsm/src/i18n/locales/`):
    *   `fsm.shifts.title`, `fsm.shifts.estimatedPay`, `fsm.shifts.claimBtn`, `fsm.shifts.claimingBtn`
    *   `fsm.shifts.disabledOverage`: `"Exceeds monthly limit by {{overage}}"`
    *   `fsm.shifts.claimingSuccess`
*   Admin locales (`apps/customer/src/i18n/locales/`):
    *   `admin.override.modalTitle`, `admin.override.modalMessage`, `admin.override.reasonLabel`, `admin.override.reasonRequired`
    *   `admin.override.confirm`, `admin.override.cancel`

### Step 3: Implement Scheduled Monthly Rollover Cloud Function
*   Create `onMonthlyEarningsRollover` scheduled Cloud Function (runs monthly at 12:00 AM UTC on the 1st).
*   For every staff member:
    1. Append `{ month: lastMonthStr, total: currentMonthEarnings }` to `financials.earningsHistory`.
    2. Reset `currentMonthEarnings` to `0`.

### Step 4: Implement `claimJob` Cloud Function
*   Create callable Cloud Function `claimJob({ jobId })`.
*   Runs inside a transaction:
    1. Read job document: verify `status === 'unassigned'` and `assignedTo === null`.
    2. Calculate estimated pay: `payRateSnapshot.amount * durationHours`.
    3. Read claiming staff member's `/staff/{uid}` profile.
    4. Validate earnings cap: if `monthlyEarningsLimit !== null`, check `currentMonthEarnings + estimatedPay <= monthlyEarningsLimit`. If false, abort.
    5. Update staff document: `financials.currentMonthEarnings += estimatedPay`.
    6. Update job document: `status = 'assigned'` and `assignedTo = uid`.

### Step 5: Scaffold Shift Board UI in FSM App
*   Build `/shifts` page (`apps/fsm/src/pages/ShiftBoardPage.tsx`) listing unassigned jobs.
*   For each job, render client-side verification:
    *   Calculate shift pay and add to Carla's current monthly total.
    *   If total exceeds monthly limit, disable the "Claim" button and render the text message: `Exceeds monthly limit by $X`.
*   Tapping active "Claim" triggers `claimJob({ jobId })`.

### Step 6: Integrate Admin Panel Override Intercept
*   Update `BookingDetailPanel.tsx` assignment dropdown.
*   If selected cleaner exceeds their limit with this shift:
    1. Open `OverrideModal.tsx` requiring a reason.
    2. On confirm, assign the cleaner and write an audit log entry.

---

## 4. Persona Acceptance Tests

*   **P7 Carla (ODSP Earnings Cap):**
    *   Carla logs into the FSM portal. She has `monthlyEarningsLimit` of $800 and `currentMonthEarnings` at $750.
    *   A shift worth $75 is displayed on the Shift Board. The Claim button is disabled and reads: "Exceeds monthly limit by $25".
    *   A shift worth $45 is displayed. The Claim button is active.
    *   She claims the $45 shift. Her `currentMonthEarnings` updates to $795. Her profile gauge turns red.
*   **P12 Sarah (Admin Override):**
    *   Sarah manually assigns Carla to a job that pushes Carla over the limit.
    *   The system intercepts the assignment and prompts for an override reason.
    *   Sarah inputs "Urgent replacement client request", confirms, and the assignment completes.
    *   The audit log records the entry with the input reason.
