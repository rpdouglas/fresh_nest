# 0010. Trends are saved by the dashboard, not on a timer

- Date: 2026-10-12
- Decided by: Proposed by the agent, accepted by the owner on merging PR #31
- Status: In force

## Decision

Each finished pay period's figures are worked out in the browser with the reports' own rules and saved through the server, when someone opens the dashboard. There is no scheduled function.

## Why

The scoring rules live in the website's code; a scheduled function would need a copy kept in step, plus a second function and a scheduler job in a shared project. The cost is that figures are saved only when the dashboard is opened.

## Where it lives

`.claude/rules/dashboard.md`; `web/src/lib/trends.ts`; `docs/roadmap.md`.
