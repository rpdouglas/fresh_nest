# 0008. Schedule check: teams of two, no position, today

- Date: 2026-10-12
- Decided by: Owner
- Status: In force

## Decision

Cleaning, AirBnB and Deep Clean visits need a team of two. A solo visit is flagged and can be marked OK, one visit at a time, recording who and when. A shift with no position is treated as Cleaning. The check covers today (visits not yet started) and the seven days after.

### Tight gap (2026-10-13)

A gap between two visits in a row is flagged only when the estimated drive is longer than it. Before, it was flagged when shorter than the drive plus 10 minutes, which flagged drives that fit.

## Why

Solo is sometimes fine, hence Mark OK. A missing position is a data-entry gap being worked through, not a different kind of work. An unassigned visit this afternoon is the most urgent kind, hence today. The owner only cares about a drive that does not fit the gap; a near miss on the spare minutes was noise.

## Where it lives

`.claude/rules/dashboard.md`; `web/src/lib/scheduleCheck.ts`.
