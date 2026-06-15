# F04/F14 — Pay Rates & Operations Dashboard
**Epic:** F04 / F14 | **Phase:** Phase 4 (Operations & Compliance) | **Date:** June 15, 2026  
**Primary Personas:** Sarah (P12 - Owner / Compliance), Carla (P7 - ODSP Cap), all staff via payroll accuracy
**Dependencies:** F01a, F01b, F01c, F02, F03, F08, F09  

---

## 1. Context & User Stories

### A. Business Owner & Compliance Persona (Sarah - P12)
*   **Pay Rate Management:** As a business owner, I want to manage pay rates per employee role (`cleaner`, `lead`, `supervisor`) so that payroll is calculated accurately based on active rates. I want to see the full rate history timeline.
*   **Immutability:** As a compliance-focused owner, I want rate changes to be history-tracked. Any booking/job already completed must retain the pay rate that was active when the job was confirmed (F03), and I must never be able to retroactively edit historical rate definitions.
*   **Operations Intelligence Dashboard:** As a business owner, I want an operations dashboard where I can track key performance indicators (KPIs) in real-time. I want to filter these metrics by date ranges (Today, This Week, This Month, Custom Range) to evaluate business health, specifically:
    1.  **Job Completion Rate:** The percentage of scheduled jobs successfully completed.
    2.  **Cleaner Utilization / Workload:** A list of cleaners showing their total claimed jobs and completion percentage.
    3.  **Payroll Expenses:** The actual cost of payroll, calculated by summing up the `amount` fields of `payRateSnapshot` on completed jobs.
    4.  **Average Job Duration:** The average time elapsed between check-in and check-out to verify efficiency and workload estimates.

### B. Staff Personas (Carla - P7)
*   **Payroll Accuracy:** As a cleaner, I want my job earnings to be calculated using the exact rate in effect when my job was scheduled, ensuring my monthly earnings limits are calculated accurately.

---

## 2. Technical Architecture & Database Schema

### A. Collection: `payRates`
*   `role`: `'cleaner' | 'lead' | 'supervisor'`
*   `amount`: `number` (hourly rate in CAD)
*   `currency`: `'CAD'`
*   `effectiveFrom`: `Timestamp`
*   `effectiveTo`: `Timestamp | null`
*   `createdBy`: `string` (Admin email)
*   `createdAt`: `Timestamp` (Server timestamp)

### B. Immutability & Query Resolution
*   Firestore security rules prohibit updating or deleting documents in `payRates` (`allow update, delete: if false`).
*   To resolve the active rate for a given role at a specific timestamp:
    *   Query all rates for that role, sorted by `effectiveFrom` descending.
    *   Find the latest rate where `effectiveFrom <= targetTimestamp`.

---

## 3. Implementation Steps

### Step 1: Types & i18n Translation Keys
*   Add `PayRate` to `apps/customer/src/types/index.ts`.
*   Add translations in `apps/customer/src/i18n/locales/` (`en.json`, `fr.json`) for:
    *   **Pay Rates Tab:** "Pay Rates", role rate labels, "Create New Rate" form, historical timeline view.
    *   **Operations Dashboard:** KPI titles (Completion Rate, Total Payroll, Avg Duration), charts, date range dropdown labels, and cleaner utilization table headers.

### Step 2: Implement Firestore Rules & Helpers
*   Update `firestore.rules` and `firestore.dev.rules` to permit admins to read and create `payRates` documents, while explicitly blocking update and delete.
*   Add `subscribeToPayRates` and `createPayRate` functions to `apps/customer/src/lib/firebase/firestore.ts`.

### Step 3: Build Pay Rates Management UI
*   Create `apps/customer/src/components/admin/hooks/usePayRates.ts`:
    *   TanStack collection query hook for `/payRates`.
    *   Calculates the active rate for each role.
    *   Provides a function to add a new rate.
*   Create `apps/customer/src/components/admin/PayRatesManager.tsx`:
    *   **Create Rate Form:** Inputs for role, amount, and custom effective date (defaulting to immediately).
    *   **Current Active Rates Cards:** Displays the active hourly rate for each role with a green badge.
    *   **Historical Timeline:** Renders a visual timeline of all rates sorted by `effectiveFrom` descending.
*   Update `apps/customer/src/pages/AdminPage.tsx` to add a new "Pay Rates" tab and render `<PayRatesManager />`.

### Step 4: Build Operations Dashboard UI
*   Create `apps/customer/src/components/admin/hooks/useOperationsDashboard.ts`:
    *   Combines `useBookings`, `useStaff`, and new job queries.
    *   Processes metrics based on date range selection (Today, This Week, This Month, Custom).
    *   Calculates Job Completion Rate, Cleaner Utilization, Payroll Expenses, and Average Job Duration.
*   Create `apps/customer/src/components/admin/OperationsDashboard.tsx`:
    *   **Date Range Selector:** A dropdown with predefined selections and a custom date-range picker.
    *   **KPI Scorecards:** Renders the 4 metrics with clean Tailwind styling (48px targets, high-contrast values).
    *   **Utilization Table:** A clean list of staff showing claimed/completed job stats.
    *   **Payroll & Completion Trends:** Bar and pie charts showing payroll by role and job completion breakdowns.
*   Update `apps/customer/src/pages/AdminPage.tsx` to display or integrate the Operations Dashboard. Wait, the existing `AnalyticsDashboard.tsx` is located under the "Analytics" tab. We will replace or extend it to support both customer booking analytics and operations/job analytics, or add a dedicated sub-panel/tabs inside "Analytics". Let's place it cleanly inside a unified dashboard or a sub-navigation toggle.

---

## 4. Persona Acceptance Tests

*   **P12 Sarah (Active Rate Resolution):**
    *   Sarah opens the Pay Rates tab and sees the active rates: Cleaner ($25.00/hr), Lead ($30.00/hr), Supervisor ($35.00/hr).
    *   She adds a new Cleaner rate of $28.00/hr effective immediately.
    *   The Cleaner card immediately updates to show $28.00/hr as the active rate, and the previous $25.00/hr rate moves down in the history timeline.
*   **P12 Sarah (Future-Scheduled Rate):**
    *   Sarah schedules a Supervisor rate of $40.00/hr to take effect next Monday.
    *   The active Supervisor card still displays the old active rate ($35.00/hr), while the $40.00/hr rate appears in the history timeline as "Pending/Scheduled".
*   **P12 Sarah (Operations Dashboard):**
    *   Sarah selects "This Week" from the date range filter.
    *   The KPI cards display: Job Completion Rate (e.g. 94%), Total Payroll Spent (e.g. $1,450.00), Average Job Duration (e.g. 2.5 hours).
    *   The Cleaner Utilization table displays a list of active cleaners, their claimed shifts, and completed shifts count.
