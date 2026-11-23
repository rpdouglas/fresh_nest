# 0033. A client's price has a start date; QuickBooks invoices are per client per day

- Date: 2026-10-13
- Decided by: Owner
- Status: In force

## Decision

Four choices that decision 0024 left open, and one about the order of work:

1. **A price has a start date.** Each price set for a client says the day it starts. A visit is billed at the
   price in force on its day: the latest one that starts on or before it, and $75 an hour (decision 0006) when
   there is none. Prices are never deleted; to go back to the default, set $75 an hour from a date. A price set
   for the same start day replaces the one there.
2. **In the QuickBooks file, one invoice is one client on one day**, matching the rows and ticks on Invoicing.
3. **Invoice numbers are typed at export**: the first number, counting up from it, with the last one used
   offered the next time.
4. **A flat-price visit under 15 minutes is billed and flagged.** Invoicing shows a warning on the row so someone
   checks it is real before it is invoiced. It is not dropped: a lock-out may be chargeable, a stray clock-in is not,
   and the site cannot tell them apart.
5. **Sprint 1.4 is done before Sprint 1.3.** Sprint 1.3 changes nothing anyone sees and nothing in 1.4 waits on it.

## Why

A price that simply replaced the old one would also change every past week not yet invoiced, and Client hours
for old weeks, with nothing to show it had happened. With a start date a price rise next month leaves last
week's figures alone, the trend weeks already saved stay right (`SNAPSHOT_VERSION` is not bumped), and the list
of past prices, with who set each and when, is its own record.

## What it costs

- One more field when setting a price.
- A price given a start date in the past does change what those days bill. A row already ticked as invoiced
  keeps what was invoiced and is flagged "changed since invoiced".
- A trend week more than 14 days old is kept as saved, so a price back-dated further than that does not reach it.

## Where it lives

The rule: `web/src/lib/billing.ts` (`priceFor`, `visitAmount`), applied in `web/src/lib/clientHours.ts`. The
store: `handleClientRates` in `functions/src/core.ts`, Firestore `scheduleClientRates`. The plan:
`docs/project-plan.md`, Sprint 1.4. Choices 2 and 3 are built in items 1.4.3 and 1.4.4.
