# 0029. Live board: three levels, red only when someone must act, and a "Next 30 minutes" strip

- Date: 2026-10-13
- Decided by: Owner
- Status: Decided (not built yet)

## Decision

Adds to [0016](0016-live-board.md) and [0017](0017-shared-grace-and-moving-starts.md) for the live board's version 1.

1. **Three levels.** Every visit's status falls into one of three levels, and the board's colours, counts and order
   follow the level first:
   - **Grey, waiting:** Not started, Due, On site, Done. Nothing to do.
   - **Yellow, watch:** Late (past the grace, not clocked in), At risk for the next visit, Running over, Wrong place,
     Partner late, and a No-show earlier in the day.
   - **Red, act now:** Late past the grace **and** either still not in at twice the grace (30 minutes with the
     15-minute grace) or the next visit already at risk because of it, **and** not marked Handled.
2. **Handled.** A red visit has a Handled button (for example once the client has been called). It turns the visit
   yellow for the rest of the day and records who and when. It is saved in the site's own Firestore
   (`scheduleLiveHandled`), never in Camelo.
3. **Next 30 minutes.** A strip at the top of the board lists what needs attention soon: visits starting in the next
   30 minutes whose cleaner is not expected to be there within the grace, and visits booked to end in the next
   30 minutes that are running over. Grey visits are not listed. It uses the same rules as the cards.

The thresholds (twice the grace, 30 minutes ahead) are a starting point, to be tuned after the owner has used the
board on a real morning.

## Why

About a quarter of visits have no timesheet, so a board that turns every late start red would be mostly red and
people would stop looking at it. Red has to mean that a person needs to act. The strip shows what is about to go
wrong, not only what already has. From an outside review of the board's design (2026-10-13), adopted by the owner.

## Where it lives

`docs/live-board-plan.md` (PR 2); `docs/project-plan.md` (sprint 2.1).
