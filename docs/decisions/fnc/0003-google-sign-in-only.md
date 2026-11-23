# 0003. Google sign-in is the only way in

- Date: 2026-10-11
- Decided by: Owner
- Status: In force

## Decision

Every route but the health check needs a Google sign-in by someone on the editors list. The 4-digit access code is retired. Everyone who can view can also edit.

## Why

The owner's choice, following the app review (`docs/app-review-reporting-analytics-gaps.md`), which found that one shared code protected client and staff details, could not be withdrawn for one person, and left no record of who did what. The people who view are the same people who edit, so one list is enough.

## Where it lives

`AGENTS.md`; `.claude/rules/camelo-api.md`; `requireEditor` in `functions/src/core.ts`.
