# P3-E38 Plan — Money and Time Conventions + Shared Scheduling Core (W0-4)

**Spec:** [`projects/P3-E38.md`](../projects/P3-E38.md) · **Date:** 2026-10-28 · **Status:** ✅ Strategy 2 approved 2026-10-28 (two PRs); reminder 09:00 local; `PERSONAS.md` wording update authorised

The three strategies share a base (below). They differ in **how much existing data changes now**: none (1), money becomes cents (2), or money becomes cents and jobs gain UTC instants (3).

## Shared base (all strategies)

### ADR-020 — money and time conventions
1. **Business zone.** The business zone is `America/Toronto`. Until W1-2 adds per-site zones, every job uses it.
2. **Calendar dates and times.**
   - Calendar dates (`YYYY-MM-DD`) and wall times (`HH:MM`) are local to that zone.
   - "Today", "tomorrow", "this week" and "this month" are always computed in that zone.
   - Never use `toISOString()` for a calendar date.
3. **Instants.** Instants (`createdAt`, `checkedInAt`, …) stay Firestore Timestamps, which are UTC.
4. **Scheduled Functions** declare `timeZone: 'America/Toronto'` with local cron hours.
5. **Money.**
   - Integer cents in fields named `…Cents`; tax in a separate `taxCents`; currency `CAD`.
   - Round **half up, once**, at the point a decimal result is turned into cents (PRC-S3.2).
   - Display through one formatter (EN `$1,234.50`, FR `1 234,50 $`).
6. **Time handling.** Uses the built-in `Intl` API (full ICU in Node 22 and every target browser). Luxon and rrule arrive with recurrence in W2-5 (SCH-S4.7), unless Strategy 3 is chosen.

### Shared helpers — `packages/shared/src/domain/` (synced to `functions/src/shared/` by `sync-shared.cjs`)
- **`time.ts`:**
  - `BUSINESS_TZ`
  - `todayInZone(now?)`, `addDays(date, n)`, `startOfWeek(date)`, `monthKey(date | instant)`
  - `zonedParts(instant)`, `zonedWallTimeToInstant(date, hhmm)`
  - `minutesBetween(date, start, end)`, which is wall-clock and DST-aware
- **`money.ts`:**
  - `toCents(dollars)`, `centsToDollars`, `roundHalfUp`, `percentOfCents(cents, basisPoints)` for HST
  - `formatCents(cents, lang)`
- **`scheduling.ts`:** `getShiftDurationHours` becomes the single copy. The FSM app's two private copies are removed.
- **Exported** from `@freshnest/shared` for the apps; re-exported in `functions/src/lib/`.

### Clock bugs fixed (all strategies)
| File | Change |
|---|---|
| `apps/customer/src/components/admin/DispatchBoard.tsx` | today, week range, ±day arrows, day-of-week through `time.ts` |
| `apps/customer/src/components/admin/hooks/useOperationsDashboard.ts` | today/week/month/±30-day ranges |
| `apps/customer/src/components/admin/hooks/useBookings.ts` | default date range |
| `apps/customer/src/pages/customer/CustomerUpcomingPage.tsx` | today |
| `apps/customer/src/components/booking/BookingStep2.tsx` | quote-form minimum date (F14, first half) |
| `apps/fsm/src/pages/{MyJobsPage,JobPage,ShiftBoardPage}.tsx` | shared duration and date helpers |
| `functions/src/scheduled/reminders.ts` | `0 9 * * *` Toronto; "tomorrow" in zone |
| `functions/src/scheduled/earnings.ts` + `functions/src/jobs.ts` (rollover) | `0 0 1 * *` Toronto; month key in zone |
| `functions/src/scheduled/renewals.ts`, `reviews.ts` | Toronto zone, zone dates |

### Tests and guards
- **`packages/shared` unit fixtures:**
  - Nov 1 2026 fall-back: 01:30 occurs twice; a 00:00–04:00 span is 5 h of wall-clock-elapsed time but 4 h of wall time.
  - Mar 14 2027 spring-forward.
  - Evening date line: 20:30 local is still "today".
  - Month-end evening: 23:30 on Oct 31 belongs to October.
  - Half-cent HST rounding.
- **Functions tests:** cron options, and the rollover month key at 23:59 and 00:01 local.
- **Guard:** an ESLint `no-restricted-syntax` rule flags `toISOString().split('T')` / `.slice(0, 10)` in `apps/*/src` and `functions/src`.
- **E2E:** the F5 suite stays green.

### Rollout note (Nov 1)
**Nothing breaks on Nov 1:**
- job times are local strings, so no visit moves;
- buffers are wall-clock minutes.

The only Nov 1 effect is that the 13:00 UTC reminder arrives at 8 am instead of 9 am. A tiny first PR can fix only that cron before Sunday, if wanted.

---

## Strategy 1 — Conventions, helpers and clock fixes now; money stays in dollars until pricing (W2-6)

**What:** the shared base only. Money gets helpers and exact rounding, but stored fields stay in dollars.
- `estimateShiftPay` and the earnings sum round to whole cents via `roundHalfUp`, so there is no float drift in Carla's total.
- New money code (the W2-6 pricing core) must use cents. The existing fields are converted in W2-6.

**Files:**
- **New:**
  - `packages/shared/src/domain/time.ts`, `money.ts`, and their tests
  - `docs/decisions/ADR-020-money-and-time-conventions.md`
- **Modified:**
  - shared: `packages/shared/src/domain/scheduling.ts`, `packages/shared/src/index.ts`, `functions/src/shared/*` (synced)
  - functions: `functions/src/lib/eligibility.ts`, `functions/src/jobs.ts`, `functions/src/scheduled/{reminders,earnings,renewals,reviews}.ts`
  - customer app: the 5 files in the clock-bug table
  - FSM app: `apps/fsm/src/pages/{MyJobsPage,JobPage,ShiftBoardPage}.tsx`
  - lint: `eslint.config.js` (customer, fsm, functions)
  - tests: `functions/test/*` (cron and rollover)
  - docs: `docs/firestore-schema.md` §15 (zone note), `ACTIVE_CYCLE`, report

**Persona impact:**
- **P7 / P13:** correct month boundary, exact sums.
- **P14:** 09:00 local reminder.
- **P12:** the right "today".
- **P2:** the right earliest date.
- **P8 / P15:** unchanged; buffers stay local.

**Risks:**
- Dollar fields remain, so W2-6 still has to migrate them, by then possibly with real data. The "integer cents everywhere" exit criterion (R5) is **not** met until W2-6.
- Lowest change risk: no schema, no rules, no persona text.

**Schema audit:** no new fields. Doc-only note on zones in `firestore-schema.md`.
**Tailwind audit:** no UI classes added; screens only change which date they show.
**Size:** M — 1 PR.

---

## Strategy 2 — Strategy 1 + convert stored money to integer cents now (recommended)

**What:** the shared base, plus every stored money field moves to a `…Cents` integer field while production holds only test data.

| Today (dollars) | New (cents) |
|---|---|
| `bookings.estimatedPrice` | `estimatedPriceCents` |
| `payRates.amount` | `amountCents` |
| `jobs.payRateSnapshot.amount` | `payRateSnapshot.amountCents` |
| `staff.financials.monthlyEarningsLimit` / `currentMonthEarnings` / `earningsHistory[].total` | `monthlyEarningsLimitCents` / `currentMonthEarningsCents` / `earningsHistory[].totalCents` |
| `settings/policy.defaultOdspMonthlyLimit` / `earningsCautionThreshold` / `lateCancellationFeeDollars` / `lockoutFeeDollars` | `defaultOdspMonthlyLimitCents` / `earningsCautionThresholdCents` / `lateCancellationFeeCents` / `lockoutFeeCents` |

- **Forms:** admin forms still take dollars (`22.50`) and save cents. Screens show `formatCents`.
- **Stripe:** `createPaymentIntent` takes cents, with HST from `percentOfCents(…, 1300)`.
- **Audit:** `AUDIT_CONFIG` watches the new names.

**Migration:** `functions/scripts/migrate-money-to-cents.cjs` (dry run, then `--apply`; human-run):
- writes the `…Cents` fields;
- leaves the old fields in place for one release, so an older open app still reads something;
- a later PR removes the old fields.

Readers prefer `…Cents` and fall back to the old field × 100 until the clean-up PR.

**Files:**
- everything in Strategy 1, plus about 35 money files:
  - **admin:** `PayRatesManager`, `usePayRates`, `RegisterStaffModal`, `SettingsTab`, `OperationsDashboard` / `useOperationsDashboard`, `BookingDetailPanel`, `ExportRecordModal`, `DispatchBoard`, `firestore.ts` (`computeBookingEstimatedPrice`, `createAdminBooking`)
  - **FSM:** `ShiftBoardPage` (Safe-to-Earn bar), `MyJobsPage`, `JobPage`, `ProfilePage`
  - **functions:** `jobs.ts`, `lib/openShifts.ts`, `callable/payments.ts`, `callable/settings.ts`, `callable/staff.ts`
  - **shared types:** `packages/shared/src/types/*`, `domain/policy.ts`, `domain/audit.ts`
  - **seeds:** `e2e/harness/seed.cjs`, `e2e-admin/seed.cjs`
- **`firestore.rules` and `firestore.dev.rules`:** line 147 `estimatedPrice is number` → `estimatedPriceCents is int`; line 212 protected keys → `currentMonthEarningsCents` and `earningsHistory`. This needs **human approval in the PR (ADR-018)**.
- **Rules tests** in `apps/customer/test/`.
- **New:** `functions/scripts/migrate-money-to-cents.cjs`.
- **`docs/PERSONAS.md`:** P12 acceptance text `payRateSnapshot.amount: 18` → `amountCents: 1800`, and P7 `monthlyEarningsLimit` → `monthlyEarningsLimitCents`. **Only with explicit owner permission.**

**Persona impact:**
- all of Strategy 1;
- **P12:** snapshots, exports and fees are exact cents she can reconcile with Wave/payroll;
- **P7 / P13:** limit and total are integers, so the comparison is exact.

**Risks:**
- A broad change across admin, FSM and functions. Mitigation: dual-read fallback, the migration's dry run, the F5 E2E plus the rules tests.
- **A ×100 slip:** an amount shown 100× too big or small. Mitigation: one formatter, plus a unit test per form for the round trip `22.50` → `2250` → `$22.50`.
- **Rules change** → explicit approval when merging.
- **Two releases:** convert now, remove the old fields later.

**Schema audit:** the **11 new fields above** are not in `firestore-schema.md` today. They are a deliberate schema change and are documented there in this PR, not invented. The old fields are marked *deprecated (remove after <date>)*.
**Tailwind audit:** no new classes; amounts render in existing elements.
**Size:** L — 2 PRs:
1. conventions and clock fixes (could ship before Nov 1);
2. the money migration, then a small clean-up PR.

---

## Strategy 3 — Strategy 2 + jobs gain UTC instants now (`scheduledStartAt`, `scheduledEndAt`, `timeZone`), with Luxon

**What:** Strategy 2, plus jobs store real instants next to the local strings, as the spec's MP-S5.3 asks.
- `createJobFromBooking`, admin job edits and the Dispatch Board dual-write:
  - `scheduledStartAt` and `scheduledEndAt` (Timestamp, via `zonedWallTimeToInstant`);
  - `timeZone: 'America/Toronto'`.
- Readers keep using the strings. Instants are for later (W0-6, W2-1, drive legs).
- **Luxon** replaces the `Intl` helpers in `time.ts`, ready for rrule in W2-5.

**Files:**
- all of Strategy 2, plus:
  - `functions/src/jobs.ts` (create), admin job editors (`BookingDetailPanel`, `DispatchBoard`, `AdminBookingModal`), `packages/shared/src/types/job.ts`
  - `luxon` and `@types/luxon` in `package.json`, `functions/package.json` and `packages/shared`
  - a jobs backfill script
  - rules: the job update `hasOnly` list for staff is unchanged (instants are office-written only)
- **Schema:** `jobs.scheduledStartAt`, `scheduledEndAt`, `timeZone` (new).

**Persona impact:** as in Strategy 2. Nobody sees a difference yet; it prepares W0-6 and W2-1.

**Risks:**
- **Two sources of truth for a job's time** (strings and instants) until W2-1 retires the strings. Every write path must keep them in sync, which is precisely what W0-6's server-checked write path is for. Doing it before W0-6 multiplies write paths.
- **Bundle size:** Luxon adds about 20 KB gzipped, in the admin chunk only (P3-E2 split).
- **Overlap with W2-1**, which redesigns jobs around clients and sites anyway.

**Schema audit:** Strategy 2's 11 fields plus 3 job fields, all new, documented in this PR.
**Tailwind audit:** none.
**Size:** L+ — 3 PRs.

---

## Recommendation
**Strategy 2, shipped as two PRs.**
1. **PR 1 (before Sunday Nov 1):** the shared base — ADR-020, `time.ts` and `money.ts`, every clock fix, the cron zones, the FSM de-duplication. That takes Sylvie's reminder and Carla's month boundary off UTC before the clock changes.
2. **PR 2:** the money migration to cents, while production holds only test data. That makes W2-6's "cases A–F to the cent" a pure pricing task.

Strategy 1 leaves R5 open and pushes a data migration into a time when real data exists. Strategy 3's job instants belong with W0-6/W2-1, where one server write path can keep them consistent.

## Questions for the owner
1. Strategy 1, 2 or 3 (recommended: 2 in two PRs)?
2. If Strategy 2 or 3: may I update `PERSONAS.md` P12 (and the P7 field name) to the `…Cents` names? It's wording only; the persona's intent is unchanged.
3. Reminder time after the fix: **09:00 local** (today's time, recommended), or another hour?
