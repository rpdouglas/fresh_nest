# 0013. The local dev server does not change Camelo

- Date: 2026-10-12
- Decided by: Proposed by the agent, accepted by the owner
- Status: In force

## Decision

The local dev server refuses the requests that change something in Camelo (approve, reject, edit times, add an
entry, add a note) unless it is started with `CAMELO_WRITES=on`. Reading is unaffected. The deployed function is
unaffected.

## Why

Development uses the real Camelo token, and the owner confirmed on 2026-10-12 that Camelo offers no read-only
token. An approval cannot be undone in Camelo. Without this, a person or an agent trying something locally could
change a real timesheet by accident. The browser tests do not need the switch: they run against a pretend Camelo.

## Where it lives

`changesCamelo` in `functions/src/core.ts`; the check in `functions/src/dev.ts`; `AGENTS.md`.
