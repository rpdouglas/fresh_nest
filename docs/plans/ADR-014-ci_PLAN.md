# ADR-014 CI Gates — Plan
**Date:** 2026-10-27
**Author:** Claude Code
**Status:** ✅ Approved by human 2026-10-27 (audit option b, weekly E2E). Executed in the same session.

## Personas
- **Indirect:** P12 Lauren (admin), whose live fixes must reach production without unrelated blocks.
- **All customer personas:** rules tests protect client PII.
- **No user-facing behaviour changes.**

## Options presented
| # | Change | Chosen |
|---|---|---|
| 1 | Deploy audit: (a) keep, or (b) PR + daily scheduled audit with issue | **(b)** |
| 2 | E2E: weekly schedule, or `run-e2e` label | **Weekly** |
| 3 | Per-workflow `ci` filter | Yes |
| 4 | `firebase.json` → functions filter | Yes |
| 5 | Rules emulator job on rules changes | Yes |
| 6 | Lint in PR jobs | Yes |
| 7 | Docs Check: push on main only, include `user-guide/` | Yes |
| 8 | CodeQL skips docs-only PRs | Yes |

## Files
- `.github/workflows/`:
  - `firebase-preview.yml`
  - `firebase-deploy.yml`
  - `codeql.yml`
  - `docs-check.yml`
  - `e2e.yml` (new)
  - `security-audit.yml` (new)
- `docs/decisions/ADR-014-ci-gates-scoped.md`

## Schema audit
- None: no Firestore, rules or index changes.

## Risks
| Risk | Mitigation |
|---|---|
| Rules job fails on the runner (Java or emulator download) | The suite was run locally on the emulator first: 21/21. This PR changes `firebase-preview.yml`, which runs every PR job. |
| `e2e.yml` and `security-audit.yml` don't run on PRs | Run them by hand (`workflow_dispatch`) after merge. |
