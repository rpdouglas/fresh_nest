# 0032. The function keeps Camelo reads for a minute

- Date: 2026-10-13
- Decided by: Owner, by merging the pull request that carries this file (closing it instead drops the idea)
- Status: In force

## Decision

The function keeps its answers to the three Camelo reads (a week of shifts, a week of timesheets, a pay period
for review) for one minute, in memory. A second request for the same week or period inside that minute is
answered from what is held. Any change made through the site empties it, before and after the change. Only good
answers are kept, and the sign-in is checked before anything is answered.

## Why

Camelo's request limit is the main risk on the live site. The browser already keeps what it has loaded for five
minutes (Sprint 1.2), but that does not help a page that is reloaded, or a second person opening the same period.
Measured against the pretend Camelo: a reload of the dashboard cost 46 requests without this and none with it; a
fresh load of Payroll hours cost 8 and then none.

## What it costs

- A change made in Camelo itself, not through this site, can take up to a minute longer to show.
- It is per instance and the function can run two, so it helps without being a guarantee: a change emptied on one
  instance is still held on the other for up to a minute. The person who made the change is covered by the rule in
  `web/src/lib/changes.ts`; someone else may see the old state for that minute.

## Where it lives

`ReadCache` and `read` in `functions/src/core.ts`; created in `functions/src/index.ts`. To drop it later, stop
passing `readCache` there: without one, every read goes to Camelo.
