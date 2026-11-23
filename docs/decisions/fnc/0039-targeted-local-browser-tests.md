# 0039. Targeted local browser tests: fast feedback during development

- Date: 2026-10-14
- Decided by: Owner
- Status: In force

## Decision

1. **Targeted local execution.** During development and feature work, coding agents and developers run the quick checks (`npm run check`, ~10 seconds) plus the targeted browser test spec covering the feature touched (e.g. `npm run check:e2e -- export`, ~15 seconds), or `npm run check:e2e:changed`.
2. **Argument passthrough.** `scripts/check-e2e.sh` forwards trailing arguments cleanly to Playwright. Invoked with no arguments, it runs the full 52-test browser suite.
4. **Parallelization implemented.** As planned, with Phase 2 Live Board coverage, Playwright runs with 4 parallel workers by isolating in-memory test state per worker using the `x-test-worker` header.

## Why

Sized for one developer ([0020](0020-checks-sized-for-one-developer.md)). Running 52 serial browser tests locally on every edit takes nearly 5 minutes, stalling quick iteration and feedback loops. Narrowing local execution to the relevant test file delivers feedback in 15 seconds while CI reliably protects against wider regressions.

## Where it lives

`scripts/check-e2e.sh`; `package.json`; `AGENTS.md`; `docs/project-plan.md`.
