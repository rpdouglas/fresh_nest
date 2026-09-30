# ADR-013 — Path-Filtered CI and Development-Stage Gates
**Status:** Accepted  
**Date:** 2026-09-30  
**Deciders:** Project Lead

## Context

The repository is a monorepo: the customer site (`apps/customer`), the FSM staff app (`apps/fsm`), a shared package (`packages/shared`) and Cloud Functions (`functions/`). All of it deploys to one Firebase project.

Before this decision, CI treated every change as touching everything:

- **PR previews (ADR-004):** every PR ran the npm audit, all unit tests and a 12-minute Playwright suite, then built both apps and deployed two previews plus Lighthouse. The E2E suite has been failing since at least June 2026 (15 of 31 tests), and it ran *before* the build and deploy steps. As a result, **no PR preview has deployed since June**.
- **Production:** every push to `main` rebuilt and redeployed functions and both sites, whatever changed.
- **Audit gate:** `npm audit --audit-level=high` covered dev tooling too. Advisories in test and build tools blocked every production deploy from July to September 2026.
- **Dependabot:** weekly updates across five directories, two of them redundant npm workspace folders. Nine PRs sat open and unmerged.

The project is still in development and has a single maintainer. Priorities are fast feedback and working previews, especially for the customer site. The FSM app is paused, and it may later become a separate product.

## Decision

1. **Path filtering.** Both workflows start with a `changes` job (`dorny/paths-filter`) that decides which areas a change touches:

   | Area | Paths |
   |---|---|
   | customer | `apps/customer/**` |
   | fsm | `apps/fsm/**` |
   | functions | `functions/**` |
   | both apps | `packages/shared/**`, root `package.json` / `package-lock.json`, `firebase.json` |
   | everything | `.github/workflows/**` |

   Each area has its own job for tests, build, preview deploy and production deploy, and runs only when its area changed.
2. **Production deploy order.** When functions and a site change in the same push, the functions deploy runs first, and a failed functions deploy skips the hosting deploy. A manual `workflow_dispatch` run deploys everything.
3. **E2E is non-blocking.** Playwright runs on customer or FSM changes and reports failures as a warning annotation. It never blocks a PR, and it never delays a preview deploy. Once the suite is fixed, it should be made blocking again in a new ADR.
4. **Lighthouse is informational only.**
5. **The audit gate covers production dependencies only:** `npm audit --omit=dev --audit-level=high`, per area, now including `functions/`, which previously had no audit.
6. **Dependabot:**
   - **Folders:** root npm (all workspaces), `functions/` and GitHub Actions.
   - **Schedule:** monthly.
   - **Grouping:** minor and patch bumps combined into one PR per folder.
   - **Majors:** ignored, and taken deliberately when chosen.
7. **Unchanged:**
   - CodeQL.
   - The docs link check.
   - Firestore rules and indexes are still never deployed by CI (COMPLIANCE.md §4).
   - Functions are still never deployed from PRs.

This amends how ADR-004's preview channels are produced. It does not change the decision to use preview channels.

## Rationale

- **Customer-site feedback matters most right now.** A customer-only PR now runs customer tests, the customer build and a customer preview in about 3–4 minutes, instead of about 15 minutes ending red with no preview.
- **Deploys match what changed.** A customer-only merge no longer redeploys the paused FSM app or the Cloud Functions.
- **A broken test suite shouldn't hide working previews.** Keeping E2E visible but non-blocking keeps the signal without it acting as a gate nobody can pass.
- **Only shipped code can block a release.** Dev-tool advisories don't reach users. Production-dependency advisories do, so those stay blocking.

## Consequences
**Positive:**
- Faster PRs, working previews and smaller deploys.
- The FSM stays in the repo but costs nothing when untouched.
- Functions now have a production dependency audit.
- Less Dependabot noise.

**Negative:**
- **Two copies of the filters.** `firebase-preview.yml` and `firebase-deploy.yml` each hold the filter list, and they must be kept in sync.
- **Misfiled paths can skip checks.** A file outside the filtered paths that affects an app (for example, a new root config file) skips that app's checks until it's added to a filter.
- **E2E regressions no longer block merges.** They show only as warnings until the suite is repaired.
- **Major dependency upgrades are silent.** They have to be picked up manually.

**Neutral:** skipped jobs show as "skipped" in PR checks. Branch protection, if added later, should require the always-running `changes` job, or use a summary job.

## Alternatives Considered
- **Keep one job and add `paths:` triggers per workflow.** Rejected: workflow-level path triggers can't skip one area while running another in the same workflow, and they make required checks awkward.
- **Split the FSM into its own repository now.** Deferred. It's the likely long-term direction if FSM becomes a separate product, but it's a larger migration: a shared Firebase project, a shared rules file, and the booking-to-job pipeline.
- **Delete the E2E tests.** Rejected: they encode real persona acceptance flows (P2 Travis under 3 minutes, P3 Margaret keyboard-only) and should be repaired, not dropped.
- **Remove the audit gate.** Rejected: production dependency advisories should still block a release.
