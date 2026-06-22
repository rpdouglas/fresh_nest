# P3-E19 — 3-Strategy Plan
**Epic:** Cloud Functions Domain Split
**Date:** 2026-06-22
**Author:** Antigravity (AGY Phase A)

---

## Strategy Comparison

| Dimension | Strategy 1 (Recommended) ⭐ | Strategy 2 | Strategy 3 |
|---|---|---|---|
| Split structure | Domain subfolders + triggers/callable/scheduled split | Domain subfolders but keep Job triggers in single file | Flat `handlers/` directory (one file per function) |
| Line limit compliance | ✅ Strictly < 200 lines per file (Job triggers split) | ❌ `triggers/job.ts` exceeds 200 lines (~220+ lines) | ✅ All files < 200 lines |
| Domain cohesion | ✅ High (grouped by domain & type) | ✅ High | ❌ Low (cluttered flat folder with 19+ files) |
| Maintainability for E27/E28 | ✅ Strong (E27 staff functions slot into `staff.ts`) | Medium | Low |
| Code surface | Medium | Medium | High (creates 20+ files) |

---

## Strategy 1 (Recommended) — Categorized Domain Split with `lib/shared.ts`

### Summary
Split `index.ts` into three categorization directories: `triggers/`, `callable/`, and `scheduled/`. Centralize shared bootstrap tasks (e.g., `initializeApp()`, `Sentry.init()`, secrets definitions, database/auth instances, error logging) in a single `lib/shared.ts` helper file. Split job triggers into `job.created.ts` and `job.updated.ts` to strictly maintain a maximum of 200 lines per file.

### Files Changed

| File | Change |
|---|---|
| `functions/src/lib/shared.ts` | **New**. Initialize Firebase, Sentry, define secrets, and export services. |
| `functions/src/triggers/booking.ts` | **New**. Contains `onBookingCreated`, `onBookingStatusConfirmed`, `onBookingCancelled`. |
| `functions/src/triggers/job.created.ts` | **New**. Contains `onJobCreatedTrigger`. |
| `functions/src/triggers/job.updated.ts` | **New**. Contains `onJobUpdatedTrigger`, `onJobStatusCompleted`. |
| `functions/src/triggers/staff.ts` | **New**. Contains `onStaffUpdatedTrigger`. |
| `functions/src/triggers/auth.ts` | **New**. Contains `onUserCreated` (v1 Auth trigger). |
| `functions/src/callable/auth.ts` | **New**. Contains `setUserRole`. |
| `functions/src/callable/payments.ts` | **New**. Contains `createPaymentIntent`, `stripeWebhookHandler`. |
| `functions/src/callable/job.ts` | **New**. Contains `claimJob`. |
| `functions/src/callable/analytics.ts` | **New**. Contains `getAnalyticsKPIs`. |
| `functions/src/callable/staff.ts` | **New**. Contains `onStaffRegistered`, `migrateComplianceRecords`. |
| `functions/src/scheduled/reminders.ts` | **New**. Contains `onDailyReminderCheck`. |
| `functions/src/scheduled/renewals.ts` | **New**. Contains `onDailyRecurringRenewal`. |
| `functions/src/scheduled/earnings.ts` | **New**. Contains `onMonthlyEarningsRollover`. |
| `functions/src/scheduled/reviews.ts` | **New**. Contains `onReviewEmailScheduler`. |
| `functions/src/index.ts` | **Refactor**. Pure re-exports of all functions (e.g., `export * from './triggers/booking'`). |

### Persona Impact
- **P12 Lauren (Admin)**: System stability and deployment velocity. Restructuring allows for cleaner audit logs and faster development of the upcoming onboarding epic.
- **P8 Jasmine / P11 Brenda**: Booking triggers and job notifications function identically with zero disruption or latency.

### Schema Audit
- None. No collections, documents, or fields are added or modified.

### Risks
- Circular dependency or import resolution errors across modules.
- Ensure Sentry captures errors in the correct scope.
- Sentry initializing multiple times if imported in different modules.

### Mitigation
- Enforce strict TypeScript compilation via `npm run build`.
- Centralize `Sentry.init` inside `lib/shared.ts` so it is executed exactly once when the first Cloud Function is initialized.

---

## Strategy 2 — Flat Domain Folders (Keep Job Triggers Unified)

### Summary
Similar to Strategy 1, but keeps all Firestore job triggers inside a single file `functions/src/triggers/job.ts`. This simplifies the trigger file structure (only one job trigger file instead of splitting into `.created` and `.updated`).

### Difference from Strategy 1
- `functions/src/triggers/job.ts` contains both `onJobCreatedTrigger` and `onJobUpdatedTrigger` / `onJobStatusCompleted`.
- Total lines for `triggers/job.ts` will reach ~220 lines of code, exceeding the 200-line strict limit.

### Assessment
While it groups all job triggers in one file, it explicitly violates the 200-line maximum file length guideline. As future scheduling/dispatch functions (P3-E28) are added, this file will grow even larger and more difficult to maintain.

---

## Strategy 3 — Flat Handler Module Split

### Summary
Split all 19 functions into individual standalone files under a single flat directory `functions/src/handlers/` without subdirectories (e.g., `handlers/onBookingCreated.ts`, `handlers/onDailyReminderCheck.ts`, etc.). 

### Assessment
This results in 19 separate files in a single directory. While it complies with the line limit, it destroys logical structure and cohesion. Small scheduled crons (15 lines of code) get their own files, leading to directory clutter and making logical discovery of related booking/job behavior difficult.

---

## Recommended Strategy: **Strategy 1**

### Execution Plan (Phase B)
1. **Initialize Directory Structure**: Create `triggers/`, `callable/`, `scheduled/`, and `lib/` folders.
2. **Create `lib/shared.ts`**: Move initialization code, secrets definitions, Sentry, and helpers.
3. **Split and Migrate**: Move the 19 functions from `index.ts` to their mapped destination files.
4. **Re-export**: Rewrite `index.ts` to only re-export from the domain files.
5. **Verify Imports**: Adjust imports for `sendEmail.ts`, `sendSms.ts`, `jobs.ts`, and `notifications.ts`.
6. **Linguistic, Brand, and Data Audits**:
   - `Linguistic_Auditor`: Confirm no raw user-facing strings are introduced.
   - `Data_Steward`: Verify no custom DB fields or unexpected schema modifications are introduced.
7. **Compile & Lint**: Run `npm run build` and `npm run lint` in the `functions/` folder.
8. **Deployment Validation**: Deploy functions to the Firebase emulator or test environment.

---

## HALT — Awaiting Human Approval
Please approve Strategy 1 to proceed to Phase B execution.
