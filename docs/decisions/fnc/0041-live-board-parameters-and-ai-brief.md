# 0041. Live board parameters: 5-minute refresh, handled cascade; AI brief parked

- Date: 2026-10-14
- Decided by: Owner
- Status: Decided (not built yet)

## Decision

Adds operational parameters to [0016](0016-live-board.md), [0017](0017-shared-grace-and-moving-starts.md),
and [0029](0029-live-board-levels-and-next-30-minutes.md) for Phase 2:

1. **Build sequencing.** Sprint 1.5 (Field intelligence and checklists: lockbox, alarm, gate codes, pet precautions,
   and checklist assignments) is built before the Live Board so visit cards have property context from day one.
   In parallel, Camelo live timesheets (`to: null`) are verified read-only during active working hours (Step 0).
2. **Snapshot recalculation under 15-minute grace.** When the shared grace setting moves from 10 to 15 minutes,
   re-computing snapshots is restricted to the official record start date of 2026-10-09 onward
   ([0036](0036-the-record-starts-2026-10-09.md)). Pre-record historical snapshots are left untouched to prevent
   bursts of 429 rate-limit errors from Camelo.
3. **Polling and refresh cadence.** The board auto-refreshes every 5 minutes while the browser tab is visible,
   pausing immediately when backgrounded. A manual "Refresh now" button bypasses the 60-second server cache,
   rate-limited to at most once every 3 minutes.
4. **Red alerts, actions, and knock-on cascade.**
   - A visit turns Red when late past grace (>15m) and either overdue >30m or causing downstream arrival at risk,
     unless marked Handled.
   - Red cards provide a 1-tap "Mark Handled" button (turns Red to Yellow, saved to `scheduleLiveHandled` with who
     and when), plus native tap-to-call and tap-to-SMS links for the cleaner's phone number.
   - Marking a visit Handled applies only to that specific visit. Downstream visits keep their delayed arrival
     warning in Yellow, turning Red only if their own start time arrives and exceeds 30 minutes overdue.
5. **Views.** Version 1 ships with the Cleaners view as the primary screen (day timeline progress bar and visit
   list). The secondary Clients view follows in a fast follow-up.
6. **AI Morning Brief parked.** Parked as too complicated for right now (owner, 2026-10-14; [0030](0030-ai-morning-brief.md)).
   The parameters explored (Google Gemini Flash on Cloud Functions, first names only, deterministic rule guardrails)
   are preserved in the plan's Parked list for when the Live Board has been in daily use and a morning summary is wanted.

## Why

- Rate limits: Camelo rejects bursts of requests. A 5-minute poll with a 3-minute manual refresh limit and
  recalculating snapshots only from October 9 protects the shared API quota.
- Noise reduction: Cascade handling keeps downstream visits in Yellow so the office is warned of arrival delays
  without triggering multiple Red alarms for one late start.
- Focus: Parking the AI brief avoids third-party complexity, prompt tuning, and extra error paths until the core
  live tracking board is proven and in daily operational use.

## Where it lives

`docs/live-board-plan.md`; `docs/project-plan.md` (Sprints 1.5, 2.1, Parked); `docs/decisions/`.
