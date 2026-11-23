# 0004. On Call appears only on Daily teams

- Date: 2026-10-12
- Decided by: Owner
- Status: In force

## Decision

An On Call shift only says who is on call that day. Daily teams lists it. No other report shows or counts it, and a timesheet logged as On Call is hidden everywhere, so it is not paid.

## Why

Nobody clocks in for On Call and it has no client or address; it exists so the scheduler shows who is on call.

## Where it lives

`AGENTS.md`; `notOnCall` in `web/src/lib/schedule.ts`; `withoutOnCall` in `web/src/api.ts`.
