# 0036. The record starts with the pay period of Friday 2026-10-09

- Date: 2026-10-13
- Decided by: Owner
- Status: In force

## Decision

The pay period that starts on Friday 2026-10-09 is the first one in which every timesheet and all the billing go
through this system. Figures from it onwards are the record. Figures from before it are kept, and shown, but are
not to be relied on and are not to be investigated.

Invoicing in the app counts from the same day: nothing dated before 2026-10-09 is "not yet invoiced".

## Why

The owner, 2026-10-13: "we really haven't been using Camelo correctly until now, this will really be the first
week I do all the timesheets and the billing through our system."

That explains what the real data had shown and nobody could account for: about a quarter of finished visits with
no timesheet, logged hours a third under scheduled, two weeks with $0 billed although people clocked in, two weeks
with hours two to three times over schedule. They are how Camelo was being used, not faults in the site and not
facts about the business.

## What follows

- **The odd weeks are not looked into.** Plan item 0.1.15 is dropped. No real Camelo requests are spent on them.
- **The trends are not a baseline yet.** The dashboard shows the last 13 finished pay periods, and until the
  period of 2026-10-09 has finished every one of them is from before the start. They leave the charts by themselves, one
  a week; the last is gone once the period of 2027-01-01 has finished, in the second week of January 2027. Until then a trend line says more about how the
  system was used than about the work. Plan item 3.1.2 becomes a note on the charts saying so, not a cap.
- **The dashboard's red figures are judged from this period on.** If visits with no timesheet, or hours under
  scheduled, are still there once everything is logged, that is worth a look; before, it is not.
- **"Approved, not yet invoiced" can look back to 2026-10-09 and no further.** This answers the open question
  behind plan item 0.1.14. It is a billing figure, so that change gets a second look.
- **Nothing old is corrected or deleted.** Payroll for earlier periods was settled outside this system.

## Where it lives

`docs/roadmap.md` ("What the real data has shown"); plan items 0.1.14, 0.1.15 and 3.1.2 in `docs/project-plan.md`.
Nothing in the code reads this date yet: item 0.1.14 will be the first, and should name it in one place.
