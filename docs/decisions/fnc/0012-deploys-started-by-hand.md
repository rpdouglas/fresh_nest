# 0012. Deploys from CI are started by hand

- Date: 2026-10-12
- Decided by: Proposed by the agent, accepted by the owner on approving the plan for the guardrails work
- Status: In force

## Decision

The CI deploy job runs only when someone starts it from the Actions tab. It never runs on a merge. A deploy from a
developer's machine stays possible, with the same scope.

## Why

The repository is to be private (0011) and the account is on GitHub's free plan. There, a deploy cannot be made to
wait for an approval: required reviewers on an environment are only offered for public repositories on the Free, Pro
and Team plans (GitHub's documentation, read 2026-10-12). Deploying on every merge with no approval would put
changes live that nobody had chosen to release. Starting the run by hand is the approval.

## Where it lives

`.github/workflows/ci.yml` (the `deploy` job's `if`); `docs/operations.md`, Deploying from GitHub;
`.claude/hooks/guard-bash.mjs` for deploys run by Claude Code.
