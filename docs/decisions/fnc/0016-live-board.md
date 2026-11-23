# 0016. Live board: 15-minute grace you can change, phone first, cleaners first

- Date: 2026-10-12
- Decided by: Owner
- Status: Decided (not built yet)

## Decision

The live board (who is late, who is on site, who is at risk for their next visit) has a 15-minute grace
period by default, and someone using the board can change it. It is designed for a phone first, always.
It opens on cleaners, one card each with that cleaner's whole day listed, with clients inside each card;
a view by client is secondary. Moving later start times after a late start is to be looked at as v2.

## Why

Owner's choice after the first mockup. Phones are what the office uses on the go; the full day per cleaner shows
what a late start does to the rest of their visits.

## Where it lives

`docs/live-board-mockup.html` (sample data); `docs/roadmap.md`. Still open: whether the grace is one setting for
everyone or each person's own, and whether the Punctuality report (10 minutes now) follows it.
