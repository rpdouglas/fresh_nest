# 0017. One shared 15-minute grace, Punctuality included; v2 moves start times one tap at a time

- Date: 2026-10-12
- Decided by: Owner
- Status: Decided (not built yet)

## Decision

The grace period is one setting for everyone, 15 minutes to start with, changed from the live board's settings.
The Punctuality report uses the same setting, so it moves from 10 to 15 minutes; that also changes the dashboard's
on-time figure and the trends worked out from it. Settles the open questions in
[0016](0016-live-board.md).

For v2, moving later start times after a late start works by suggestion and one tap: the board suggests a new
start, a person confirms, and the site moves that visit (and its partners' shifts) in Camelo. The booked time is
kept so Punctuality still measures from it. Nothing is moved without a person confirming.

## Why

One grace means everyone sees the same reds and the board agrees with Punctuality. A person confirming each move
stops a missed clock-in from moving shifts that should not move, while about a quarter of visits still have no
timesheet.

## Where it lives

`docs/live-board-mockup.html` (sample data); `docs/roadmap.md`.
