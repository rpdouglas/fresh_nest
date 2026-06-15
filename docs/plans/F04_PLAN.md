# F04 Planning — Pay Rates & Operations Dashboard
**Epic:** F04 / F14 | **Phase:** Phase 4 (Operations & Compliance) | **Date:** June 15, 2026  
**Primary Personas:** Sarah (P12 - Owner / Compliance), Carla (P7 - ODSP Cap), all staff via payroll accuracy
**Dependencies:** F01a, F01b, F01c, F02, F03, F08, F09  

---

## 1. Persona Analysis & Acceptance Gate

This epic introduces secure financial rate tracking and high-level operations monitoring to support business scale and cleaner retention.

*   **Sarah (P12):** Needs legal accountability and visual overview. She requires a historical audit trail for all role-based pay rates. Additionally, she needs a real-time dashboard to monitor operations, cleaner workloads, and payroll expenses across flexible date ranges.
*   **Carla (P7):** Needs exact calculations. By capturing a snapshot of the active rate at job confirmation (F03) and referencing the exact historical rates in the dashboard, we protect her monthly earnings limit check from retroactive adjustments.

---

## 2. Decisions Captured

| Decision | Choice |
| :--- | :--- |
| **UI Placement** | A standalone "Pay Rates" tab in the Admin panel. Sub-tabs under "Analytics" to segment Booking Analytics from Operations Analytics. |
| **Rate Resolution** | Purely query-based: Retrieve all rate documents for a role, sort by `effectiveFrom` descending, and treat the latest rate <= target date as the active rate. |
| **Effective Dates** | Default to immediate effect (current time), but allow admins to configure a custom future date/time for scheduled rate changes. |
| **Operations Metrics** | Implement Job Completion Rate, Cleaner Utilization / Workload, Payroll Expenses (sum of snapshots), and Average Job Duration. |
| **Date Filtering** | Flexible dropdown containing Today, This Week, This Month, and Custom Date Range. |
| **Firestore rules** | Allow admin read/create on `/payRates`, block update/delete to enforce immutability. |

---

## 3. 3-Strategy Plan

### Strategy 1: Standalone Pay Rates Tab & Tabbed Operations Dashboard (Recommended)

Adds a "Pay Rates" tab to the Customer Admin Page. Inside the "Analytics" tab, introduces sub-tabs: "Marketing & Sales" (existing booking charts) and "Operations" (new job/utilization metrics).

**Files Created/Modified:**

*Firestore Rules:*
*   `firestore.rules` & `firestore.dev.rules` — Add read/create access for admins to `/payRates`, block updates/deletes.

*Customer App — Types:*
*   `apps/customer/src/types/index.ts` — Add `PayRate` interface.

*Customer App — Firestore:*
*   `apps/customer/src/lib/firebase/firestore.ts` — Add `subscribeToPayRates` and `createPayRate` helpers.

*Customer App — Hooks:*
*   `apps/customer/src/components/admin/hooks/usePayRates.ts` — TanStack hook for rate subscription and creation.
*   `apps/customer/src/components/admin/hooks/useOperationsDashboard.ts` — Calculates completion, utilization, payroll, and duration metrics with date range filtering.

*Customer App — UI Components:*
*   `apps/customer/src/components/admin/PayRatesManager.tsx` — Current rates overview, create rate form, and chronological rate history list.
*   `apps/customer/src/components/admin/OperationsDashboard.tsx` — KPI widgets, date picker, cleaner workload table, and Recharts operational trend visualizations.
*   `apps/customer/src/pages/AdminPage.tsx` — Register "Pay Rates" tab, wire state, and render sub-dashboard inside "Analytics".

*i18n:*
*   `apps/customer/src/i18n/locales/en.json` & `fr.json` — Add F04 and F14 bilingual UI text keys.

**Persona Impact:**
*   *Sarah (P12):* Clean visual history timeline of rates. Highly segmentable operations metrics to track business health without clutter.
*   *Carla (P7):* Payroll calculations remain bulletproof.

**Risks & Mitigation:**
*   *Risk:* Future-scheduled rates could conflict if multiple rates are set for the same time.
*   *Mitigation:* Form validation prevents registering overlapping exact starting times.
*   *Risk:* Large collections of completed jobs could slow down client-side aggregation.
*   *Mitigation:* Memoize calculations on date-range changes and utilize TanStack Query caching.

**Schema Audit:**
*   Includes all `/payRates` fields: `role`, `amount`, `currency: 'CAD'`, `effectiveFrom`, `effectiveTo: null`, `createdBy`, `createdAt`.

---

### Strategy 2: Nested Sidebar Rate Editor & Single-Page Dashboard

Merges the Pay Rate Manager as a slide-out drawer inside the "Staff" tab. Merges booking and operations metrics onto the main "Analytics" page, creating a single scrollable panel without sub-tabs.

*   **Persona Impact:** Sarah has fewer top-level tabs, but the Analytics dashboard becomes very long and harder to parse, reducing usability for busy business owners.
*   **Risks:** UI overcrowding and confusion between marketing metrics (booking value) and fulfillment metrics (job completion rates).

---

### Strategy 3: Static Config-based Pay Rates

Bypasses the Firestore `/payRates` collection entirely. Hardcodes pay rates in a local configuration file.

*   **Persona Impact:** Sarah cannot change rates from the Admin dashboard, and historical jobs are calculated using current rates, violating compliance/audit policies.
*   **Risks:** Fails epic requirements and breaks payroll audit trails.

---

## 4. Recommended Choice & Rationale

**Strategy 1** is recommended.
It provides clean segmentation of business-critical data (booking sales vs shift operations) and guarantees complete historical tracking of pay rates. The UI elements align with the existing admin design standards (buttons, tables, and colors).

---

## 5. Implementation Checklist & Verification Gate

### Rules & Types
1.  [ ] Update `firestore.rules` and `firestore.dev.rules` for `/payRates`.
2.  [ ] Add `PayRate` interface to `apps/customer/src/types/index.ts`.
3.  [ ] Register `subscribeToPayRates` and `createPayRate` in `apps/customer/src/lib/firebase/firestore.ts`.

### Translation
4.  [ ] Add translations for `admin.payRates.*` and `admin.operations.*` in `en.json`.
5.  [ ] Add translations for `admin.payRates.*` and `admin.operations.*` in `fr.json`.

### Pay Rate Management
6.  [ ] Create `usePayRates.ts` hook.
7.  [ ] Create `PayRatesManager.tsx` component.
8.  [ ] Wire `PayRatesManager` to the new "Pay Rates" tab in `AdminPage.tsx`.

### Operations Dashboard
9.  [ ] Create `useOperationsDashboard.ts` hook.
10. [ ] Create `OperationsDashboard.tsx` component.
11. [ ] Wire `OperationsDashboard` as a toggleable sub-section under "Analytics" in `AdminPage.tsx`.

### Verification Gate
12. [ ] Validate Tailwind tokens and A11y using `Brand_Auditor`.
13. [ ] Verify Firestore schema using `Data_Steward`.
14. [ ] Verify bilingual hooks using `Linguistic_Auditor`.
15. [ ] Run `npm run build` to confirm zero compilation errors.
16. [ ] Run `npm run lint` to confirm zero warnings.
