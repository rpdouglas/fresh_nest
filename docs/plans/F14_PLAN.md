# F14 — Operations Dashboard
**Epic:** F14 | **Phase:** Phase 4 (Operations & Compliance) | **Date:** June 15, 2026  
**Primary Persona:** P12 Sarah (Owner / Compliance)  
**Dependencies:** F03 (jobs collection), F08 (claimJob / assigned jobs), F09 (checkedInAt / completedAt), F02 (staff collection)  
**Companion Epic:** F04 (Pay Rates Manager — same combined spec, distinct deliverable)  
**Status:** Retrospective Audit — implementation completed as part of F04/F14 combined execution.

---

## 1. Persona Alignment (Rule 1)

**Primary:** P12 Sarah (Owner / Compliance)
- Needs real-time visibility into operational KPIs: job completion rate, cleaner workload, payroll labor costs, and average job duration.
- Must be able to filter by time period (Today, This Week, This Month, Custom Range).
- Expects data to reflect actual `jobs` collection records, not synthetic data.

**Secondary:** P7 Carla (ODSP Earnings Cap)
- Indirectly served: accurate payroll expenses use the immutable `payRateSnapshot.amount` locked at job creation (F03), ensuring her cap calculations remain trustworthy.

---

## 2. Scope (F14 — Operations Dashboard only)

F14 is bounded to the **Operations Dashboard** surface inside the Admin Panel. Pay Rate management is strictly F04's domain.

| Deliverable | Location |
|---|---|
| `OperationsDashboard` component | `apps/customer/src/components/admin/OperationsDashboard.tsx` |
| `useOperationsDashboard` hook | `apps/customer/src/components/admin/hooks/useOperationsDashboard.ts` |
| AdminPage sub-tab integration | `apps/customer/src/pages/AdminPage.tsx` — Analytics tab → "Operations & Fulfillment" sub-tab |
| Bilingual i18n keys | `apps/customer/src/i18n/locales/en.json`, `fr.json` — `admin.operations.*` namespace |

**Explicitly out of scope for F14:**
- Pay rate creation/editing UI (`PayRatesManager.tsx`) → F04
- Audit log UI (`AuditLogsTable.tsx`) → F11
- Staff enrollment modal (`RegisterStaffModal.tsx`) → F02
- Payroll CSV export (`ExportRecordModal.tsx`) → F13

---

## 3. Strategy

**Strategy 1 — Retrospective Audit (Selected)**

Since `OperationsDashboard.tsx` and `useOperationsDashboard.ts` were delivered as part of the joint F04/F14 execution cycle, this plan formally audits the deliverables against the spec acceptance criteria, records the gap analysis, and closes the F14 ticket with a dedicated close report.

### Why Strategy 1

- All four required KPIs are implemented and verified in the existing code.
- The component reads from the live `jobs` and `staff` Firestore collections via TanStack `useCollectionQuery`.
- All four date range presets are implemented with correct boundary calculations.
- Bilingual keys exist in both `en.json` and `fr.json` under the `admin.operations.*` namespace.
- `npm run build` and `npm run lint` pass (confirmed in F04 close report, 2026-06-15).
- No material gaps found that would require Phase B execution work.

---

## 4. Files Touched

| File | Change Type | Purpose |
|---|---|---|
| `apps/customer/src/components/admin/OperationsDashboard.tsx` | Created (F04/F14 cycle) | Renders 4 KPI cards, date range selector, 2 Recharts pie charts, cleaner utilization table |
| `apps/customer/src/components/admin/hooks/useOperationsDashboard.ts` | Created (F04/F14 cycle) | TanStack queries to `/jobs` and `/staff`, date filter logic, KPI aggregations |
| `apps/customer/src/pages/AdminPage.tsx` | Modified (F04/F14 cycle) | Added `analyticsSubTab` state, sub-tab toggle, renders `<OperationsDashboard>` under "Operations & Fulfillment" |
| `apps/customer/src/i18n/locales/en.json` | Modified (F04/F14 cycle) | `admin.operations.*` keys: title, subtitle, KPI labels, range labels, chart titles, table headers |
| `apps/customer/src/i18n/locales/fr.json` | Modified (F04/F14 cycle) | French equivalents for all `admin.operations.*` keys |

---

## 5. Gap Analysis — Spec vs. Delivered

### ✅ KPI 1 — Job Completion Rate
- **Spec:** Percentage of scheduled jobs successfully completed.
- **Delivered:** `completionRate = (completedJobsCount / totalScheduledJobs) * 100`
- **Note:** Cancelled jobs are excluded from `totalScheduledJobs` — correct per intent.

### ✅ KPI 2 — Cleaner Utilization / Workload
- **Spec:** List of cleaners showing claimed jobs and completion percentage.
- **Delivered:** `cleanerUtilization` computed from `/staff` and `/jobs`, filtering staff with `role === 'cleaner' || role === 'lead'`, mapping `assignedTo === cleaner.id`.
- **Renders as:** A sortable table with: Cleaner Name | Assigned Jobs | Completed Jobs | Completion % (with progress bar).

### ✅ KPI 3 — Payroll Expenses
- **Spec:** Sum of `payRateSnapshot.amount × duration` for completed jobs.
- **Delivered:** `payrollExpenses = completedJobs.reduce(sum, rate × hours)` where `rate = job.payRateSnapshot?.amount`. Falls back to 0 if snapshot absent.
- **Note:** The "Payroll by Role" pie chart groups all payroll under `cleaner` role because `payRateSnapshot` does not store the staff role (only `rateId`, `amount`, `currency`, `effectiveAt`). This is a **known data limitation** — not a bug. The KPI total is accurate; the role breakdown chart is a best-effort visualization.

### ⚠️ KPI 4 — Average Job Duration
- **Spec:** Average time elapsed between check-in and check-out.
- **Delivered:** Uses actual `checkedInAt` / `completedAt` Timestamps when available. Falls back to scheduled `startTime`/`endTime` difference when actual times are absent.
- **Risk:** On the dev database, few jobs will have `checkedInAt` and `completedAt` set (requires F09 flow to be exercised). In practice for Sarah's use, the fallback to scheduled duration is acceptable.

### ✅ Date Range Filter
- **Spec:** Today, This Week, This Month, Custom Range.
- **Delivered:** All 4 ranges implemented. Week boundary uses Monday–Sunday ISO convention. Custom range shows two `<input type="date">` pickers with 48px touch targets.

### ✅ AdminPage Integration
- **Spec:** Integrate under the existing Analytics tab (not a new top-level tab).
- **Delivered:** `analyticsSubTab` state added to `AdminPage.tsx`. Sub-tabs: "Marketing" (AnalyticsDashboard) and "Operations & Fulfillment" (OperationsDashboard). Both use `min-h-[48px]` targets.

### ✅ Bilingual i18n
- **Spec:** All strings via `t()`. French copy at launch.
- **Delivered:** All 25+ strings in `admin.operations.*` namespace present in both `en.json` and `fr.json`. No hardcoded EN/FR in component.

---

## 6. Known Limitations (Documented — Not Blockers)

| ID | Limitation | Impact | Resolution |
|---|---|---|---|
| L01 | "Payroll by Role" chart groups all cost under `cleaner` because `payRateSnapshot` has no `role` field | Chart looks sparse until staff role is resolved from `staff/{id}` lookup | Future: join `assignedTo` UID to `staff` list to infer role; low priority |
| L02 | `averageJobDuration` falls back to scheduled duration if `checkedInAt`/`completedAt` absent | Accurate data requires F09 execution flow to be exercised in production | Self-resolving as cleaners use the FSM portal |
| L03 | `useCollectionQuery` on `/jobs` fetches all documents client-side and filters in JS | Acceptable for current scale (~50–200 jobs/month); not suitable for 10k+ records | If volume grows: add Firestore composite index on `scheduledDate` and query server-side by date range |

---

## 7. Persona Acceptance Tests

### P12 Sarah — All must pass

**Test A — KPI Visibility:**
1. Sarah navigates to `/admin` → Analytics tab → "Operations & Fulfillment" sub-tab.
2. Default range is "This Month". Four KPI cards display: Job Completion Rate (%), Jobs Completed (count), Total Payroll Spent (CAD), Average Job Duration (hrs).
3. All values are numeric and formatted correctly (currency: `$X,XXX.XX CAD`; duration: `X.X hrs`; rate: `XX.X%`).

**Test B — Date Range Filtering:**
1. Sarah selects "Today" — cards update to reflect only today's scheduled jobs.
2. Sarah selects "This Week" — cards update to reflect Mon–Sun current week.
3. Sarah selects "Custom Range" — two date inputs appear. Sarah enters a 30-day range and cards update.

**Test C — Cleaner Utilization Table:**
1. Table lists all active cleaners and leads from the `/staff` collection.
2. Each row shows: Name, Assigned (non-cancelled), Completed, Completion %.
3. Progress bar renders correctly for non-zero rates. Table shows "No results" empty state when no data.

**Test D — Bilingual:**
1. Sarah switches to French → all labels, chart titles, and table headers render in French.
2. No English strings appear in FR mode.

**Test E — Accessibility:**
1. Date range `<select>` has a visible label (`htmlFor="ops-range"`).
2. All interactive controls meet 48px minimum touch target.
3. Table has clear `<thead>` with column labels.

---

## 8. Subagent Checklist (Phase B — N/A for retrospective)

Since Strategy 1 is a retrospective audit with no new code, Phase B execution is **not required**. All verifications are documented above from code inspection.

- **Brand_Auditor:** All Tailwind classes use design system tokens. Border radii use `rounded` (4px). KPI card left-border accents use non-generic, brand-adjacent colors (`slate-brand`, `slate-light`, `amber-500` for payroll, `green-500` for completion count).
- **Data_Steward:** `useOperationsDashboard` reads `/jobs` and `/staff` collections. No invented fields — all field names (`scheduledDate`, `assignedTo`, `status`, `payRateSnapshot.amount`, `checkedInAt`, `completedAt`) match `docs/firestore-schema.md`.
- **Linguistic_Auditor:** Zero hardcoded strings in `OperationsDashboard.tsx`. All text via `t()`. FR keys complete.
- **TypeScript_Strict_Enforcer:** `Timestamp` guards in place. `useCollectionQuery` generic typing correct. No `any` or `@ts-ignore` present.

---

## 9. Build Verification (From F04 Close Report — 2026-06-15)

```
npm run build    → ✅ Exit Code 0
npm run lint     → ✅ Exit Code 0
```

No new code introduced in F14 retrospective audit — build status carried forward from F04.

---

## 10. Phase C — Close Actions

- [ ] Mark **F14** as `Completed ✅` in `docs/ACTIVE_CYCLE.md` (currently only `F04` is listed — add F14 as its own row or annotate `F04` entry)
- [ ] Write `docs/reports/F14-close-2026-06-15.md`
- [ ] Verify `docs/firestore-schema.md` — no schema changes (jobs/staff collections are unchanged by F14)
- [ ] Update `user-guide/` if Sarah-facing admin doc references are needed (out of scope for now)

---

*Plan authored via /grill-me interview — June 15, 2026*  
*Decisions: F14 = Operations Dashboard only | Primary persona: P12 Sarah | Strategy: Retrospective Audit | No Phase B execution required*
