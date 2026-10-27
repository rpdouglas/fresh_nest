# ADR-014 — CI Gates Scoped to What Changed; Audit and E2E Off the Critical Path
**Status:** Accepted
**Date:** 2026-10-27
**Deciders:** Project Lead (options chosen 2026-10-27: audit option (b), weekly E2E)

## Context
This amends parts of ADR-013. ADR-013 stays in force wherever this ADR doesn't change it.

A review of CI on 2026-10-27 found three kinds of problem.

**Too slow**
- **E2E on every PR:** the non-blocking Playwright suite ran on every customer or FSM PR. It took about 9 minutes, while every other check finished in about 2. It is set to `continue-on-error`, so it always showed green, gave no usable signal and could never block.

**Running when nothing relevant changed**
- **Any workflow edit ran everything:** the `ci` filter matched all of `.github/workflows/**`. Editing `codeql.yml` or `docs-check.yml` rebuilt both apps on the PR and redeployed functions and both sites to production on merge.
- **Docs Check ran twice per push** on PR branches (push and pull_request).
- **CodeQL scanned docs-only PRs.**

**Deploy audit blocked unrelated fixes**
- **Deploy-time `npm audit`:** an advisory published after a PR passed blocked the production deploy of HOTFIX-03 and HOTFIX-04 (runs 117 and 118). Neither change touched dependencies.

**Gaps**
- **Rules tests never ran in CI.** `firestore.rules`, which guards client PII, had a passing emulator suite (21 tests) that no workflow ran.
- **Lint never ran in CI.**
- **`firebase.json` missed the functions filter,** even though it holds the functions deploy config.
- **Docs Check skipped `user-guide/`.**

## Decision
1. **Security audit (option b):**
   - `firebase-deploy.yml` no longer runs `npm audit`.
   - PRs still audit the areas they change (`npm audit --omit=dev --audit-level=high`).
   - New `security-audit.yml` audits root and `functions/` daily and on demand. On failure it opens a single "Production dependency audit failing" issue, or comments on the one already open, and the run shows red.
2. **E2E weekly:** Playwright moves from the PR workflow to `e2e.yml`, which runs Mondays at 09:17 UTC and on manual dispatch. `continue-on-error` is removed, so a red run means real failures. It gates nothing. Making it a PR gate again still needs a new ADR, once the suite is repaired.
3. **Each workflow's `ci` filter matches only its own file:** `firebase-preview.yml` matches `firebase-preview.yml`, and `firebase-deploy.yml` matches `firebase-deploy.yml`. A change to the deploy workflow still deploys everything. The area paths stay in sync between the two files.
4. **`firebase.json` is added to the `functions` filter** in both workflows.
5. **New `rules` PR job:**
   - Runs only when `firestore.rules`, `firestore.indexes.json`, `apps/customer/test/**`, `apps/customer/vitest.rules.config.ts` or the preview workflow change.
   - Runs the Firestore emulator suite with Java 21 and `firebase-tools@15`, and it blocks the PR.
   - Rules are still never deployed by CI (COMPLIANCE.md §4).
6. **Lint** runs in the customer and FSM PR jobs (`npm --workspace=… run lint`). Errors fail; warnings don't.
7. **Docs Check:** the `push` trigger is limited to `main`, and `user-guide/**` is triggered and link-checked.
8. **CodeQL** skips PRs that change only `docs/**`, `user-guide/**` or `**/*.md`. Pushes to `main` and the weekly scan are unchanged.

**Unchanged from ADR-013:**
- Path-filtered areas.
- Deploy order: functions, then hosting.
- Concurrency.
- Lighthouse, informational only.
- Unit tests at deploy time (about 10 s each).
- Dependabot.

## Rationale
- **Fast feedback:** PR feedback now ends when the useful checks end, about 2 minutes rather than 9.
- **Unrelated advisories can't hold back fixes:** the daily audit still reports every advisory, and PRs still can't add a vulnerable production dependency without failing.
- **Checks match risk:** rules tests run only when rules change, but block when they do, because that is where a mistake exposes PII. Lint is cheap.
- **One workflow's edit no longer triggers another workflow's full run.**

## Consequences
**Positive:**
- Faster PRs.
- Deploys can't be held hostage by unrelated advisories.
- Rules and lint are now covered.
- Fewer duplicate runs.

**Negative:**
- **Vulnerable code can deploy between advisory and fix:** if an advisory lands after a PR's audit passed, that code can reach production. The daily issue is the backstop, and fixing it is a lockfile-only PR.
- **E2E regressions surface weekly, not per PR.**
- **Per-workflow `ci` filters are a third thing to keep in sync,** alongside the area paths in both files.
- **The rules job depends on `firebase-tools@15` and Java 21** being installable on the runner.

**Neutral:**
- The daily audit comments once per day while it stays red.
- If branch protection later requires CodeQL, docs-only PRs need a summary job, because CodeQL is skipped on them.

## Alternatives Considered
- **Keep the deploy-time audit (option a):** rejected by the project lead. It blocked two unrelated hotfixes on 2026-10-27.
- **E2E only on a `run-e2e` label:** rejected in favour of a regular weekly signal that doesn't depend on someone remembering the label.
- **Delete E2E:** rejected for the same reason as in ADR-013. The suite encodes persona acceptance flows.
