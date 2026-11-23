# 0038. My week: a cleaner is told when they are on call, sees their hours as logged, and sees only released shifts

- Date: 2026-10-13
- Decided by: Owner (the first two); the third follows Camelo's own app and is the owner's to change
- Status: Decided, not switched on (see [0037](0037-staff-accounts-and-roles.md))

## Decision

Three rules for the page a cleaner sees, added to decision 0037.

1. **On call.** My week says "You are on call" on each day the cleaner is, and nothing else about it: no times,
   no client, no hours. This adds one place to [0004](0004-on-call-only-on-daily-teams.md), which said On Call
   appears only on Daily teams. The rest of 0004 stands: On Call is in no report's figures, and time logged as
   On Call is dropped and not paid.
2. **Hours.** A cleaner sees their own hours for the pay period as they were logged, marked approved or still
   waiting, added up with Payroll hours' own sums and rounding. What they see is what the office sees for them.
3. **Released shifts only.** A cleaner is not shown a shift the office has not released (Camelo's `DRAFT` and
   `READY`), an open shift nobody holds (`OPENING`), or one they turned down (`REJECTED`).

## Why

1. A cleaner needs to know they are on call. 0004 exists to keep On Call out of the figures and out of pay, and
   telling one person about their own day does neither.
2. So that a missing clock-in can be raised before payroll, not after. Offered against approved hours only, or no
   hours at all; the owner chose logged, marked.
3. On 2026-10-13 a quarter of the shifts for the days ahead were drafts (20 of 83 in the days looked at, counts
   only). A draft is the office still planning. Camelo's own app does not show a cleaner their drafts, and this
   page should not tell them something Camelo has not.

## What it costs

A cleaner may ask about a shift they have heard of and cannot see, because it is still a draft. Releasing it in
Camelo shows it here within a minute.

## Where it lives

`functions/src/routes/my-week.ts` (`NOT_THEIRS_YET`, `isOnCall`); `.claude/rules/my-week.md`; `AGENTS.md`.
