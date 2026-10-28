# ADR-020 — Money and Time Conventions: Integer Cents, Toronto Calendar Dates, Shared Helpers
**Status:** Accepted (2026-10-28 — owner approved P3-E38 Strategy 2)
**Date:** 2026-10-28
**Deciders:** Owner

## Context
The FSM master spec makes three rules apply to every module ("Rules every module follows" 2, 3, 10):
- one shared scheduling core;
- instants in UTC with the site zone, and dates, buffers and recurrence in local wall time, so that **November 1, 2026** never moves a 9:00 visit;
- money in integer cents with tax stored beside it.

The code broke all three in small ways (P3-E38 spec, "Current state"):
- **UTC dates.** "Today" was derived from `toISOString()` (the UTC date) on the Dispatch Board, the dashboards, the bookings filter, the customer portal and the quote form. All of them jump a day after about 8 pm in Ontario.
- **UTC schedules.** Every scheduled Function ran on UTC. Two effects:
  - the monthly earnings rollover ran on the **last evening** of the month, so those shifts counted toward the next month's ODSP/OSAP limit (P7, P13);
  - the day-before reminder would drift from 09:00 to 08:00 on Nov 1 (P14).
- **Duplicated logic.** Shift-duration logic had six private copies besides the shared one.
- **Decimal money.** Money was stored as decimal dollars and summed as floating-point numbers.

## Decision
1. **Business zone.** It is `America/Toronto` (`BUSINESS_TZ`). Until sites carry their own zone (W1-2), every job uses it.
2. **Calendar dates and wall times are local to that zone.** `YYYY-MM-DD` dates, `HH:MM` times and `YYYY-MM` months mean Toronto time.
   - "Today", "tomorrow", week and month bounds are computed with the shared helpers.
   - **Never use `toISOString()` for a calendar date.** An ESLint rule (`apps/customer`, `apps/fsm`) and a unit test (`functions`) enforce this.
3. **Instants** are Firestore Timestamps / `Date` values (UTC). Converting a local date and time to an instant uses `zonedWallTimeToInstant`:
   - **Clock going back** (01:30 happens twice): the first, daylight-time occurrence is used.
   - **Clock going forward** (a time that doesn't exist): it moves forward by the gap.
4. **Scheduled Functions** declare `timeZone: BUSINESS_TZ` with local hours:
   - reminders at 09:00 (owner decision 2026-10-28);
   - the earnings rollover at 00:00 on the 1st;
   - renewals at 02:00.
5. **Money:**
   - **Storage:** integer cents in fields named `…Cents`; tax in a separate `taxCents`, from a rate in basis points (HST `1300`); currency CAD.
   - **Rounding:** a decimal result is turned into cents **once**, rounding half up (away from zero), as PRC-S3.2 requires.
   - **Display:** through `formatCents(cents, lang)` (EN `$1,234.50`, FR `1 234,50 $`).
   - **Forms:** they may take dollars and convert with `toCents`.
6. **One shared module.** These helpers live in `packages/shared/src/domain/` (`time.ts`, `money.ts`, next to `scheduling.ts`), are exported from `@freshnest/shared`, and are synced into `functions/src/shared/` by `functions/scripts/sync-shared.cjs` (#46).
7. **No date library yet.** The helpers use the built-in `Intl` API (full ICU in Node 22 and every supported browser). Luxon and rrule arrive with recurrence (W2-5, SCH-S4.7), behind the same helper names.
8. **Rollout** (P3-E38 Strategy 2):
   - **PR 1:** the helpers, the clock fixes and the scheduled-Function zones.
   - **PR 2:** existing dollar fields become `…Cents` fields while production holds only test data. A later clean-up removes the dollar fields.

## Rationale
- **Local calendar dates match the business.** Visits, reminders and earnings months are Ontario concepts. Storing them as Toronto dates, and deriving "today" in Toronto, is what Lauren and the crew expect. It also keeps 9:00 at 9:00 across clock changes.
- **Cents remove a class of errors.** Floating-point sums can't drift past an ODSP limit, and W2-6's "cases A–F to the cent" becomes checkable.
- **One module, fixtures in one place.** Two weeks of fixes don't fork into seven copies again.

## Consequences
**Positive:**
- **Right dates in the evening.** The Dispatch Board, dashboards, portal and quote form show the right day after 8 pm.
- **Earnings months are Ontario months.** Shifts on a month's last evening count toward that month.
- **Reminders stay at 09:00** before and after Nov 1.
- **Guarded.** A lint rule and a test stop the UTC-date pattern from coming back.

**Negative:**
- **Code in other zones.** Anything that must run in a different zone (a future site outside Ontario) has to pass that zone explicitly; the helpers take a `timeZone` argument.
- **A migration.** Money fields need one, done in PR 2, with old fields read as a fallback for one release.

**Neutral:**
- **Same moment in UTC, new local time.** Scheduled Function times are now local, so their UTC execution moments shift by an hour twice a year.

## Alternatives Considered
- **Store everything as UTC instants now (P3-E38 Strategy 3).** Deferred to W0-6/W2-1, where one server-checked write path can keep instants and local strings consistent.
- **Luxon now.** Not needed for these helpers; it adds bundle weight before recurrence needs it.
- **Keep dollars until the pricing work (Strategy 1).** Rejected: it migrates money later, possibly with real data, and leaves earnings sums in floating point.
