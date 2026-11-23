# 0014. Paid time is time worked, not the length of the day

- Date: 2026-10-12
- Decided by: Owner
- Status: In force

## Decision

Cleaners are paid for the time they work, taken from their timesheets, as Payroll hours shows it. The time between
one visit and the next is not worked and not paid.

So no figure in the site is worked out from a first start to a last finish. A day's or a week's hours are always
the shifts or the timesheets added up one by one, with breaks taken off.

Every shift that is not On Call is working time: ordinary visits, `Confirm` shifts, `Office` shifts, and shifts
with no client or site. On Call is never working time (0004).

The schedule check's "Long day" warning follows from this: it fires when a cleaner's scheduled working time in a
day adds up to more than 10 hours.

## Why

The dashboard warned that a cleaner had a 12.5-hour day. She had a few visits spread from morning to evening. The
warning measured from her first start to her last finish, which says nothing about how much she works or is paid.

Asked what cleaners are paid on, the owner chose clocked time as Payroll hours shows it today, over scheduled
hours and over clocked time capped at scheduled. A read-only look at two weeks of real data agreed with that:
cleaners clock in visit by visit, and on none of 21 days with a gap between visits did the clocked time cover the gap.

## Where it lives

`scheduledMinutes` in `web/src/lib/review.ts` (the working time of one shift); the long day and over-44 checks in
`web/src/lib/scheduleCheck.ts`; `web/src/lib/overtime.ts`; `AGENTS.md`. Payroll hours and billing were already
worked out entry by entry and visit by visit, and did not change.

## Known limit

When a cleaner is booked on two shifts that overlap, both are added in full. Double-booking has its own warning.
