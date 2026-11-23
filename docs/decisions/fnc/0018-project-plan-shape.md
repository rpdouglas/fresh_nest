# 0018. The project plan: prove, strengthen, then build; sprints without dates

- Date: 2026-10-12
- Decided by: Owner
- Status: In force

## Decision

The work is ordered in one plan, `docs/project-plan.md`:

- **Order.** First close out what is already live (the signed-in checks, the housekeeping, a deploy from CI). Then
  the engineering foundations from the tech stack review. Then the live board, then trends per cleaner and client,
  then cost, margin and budgets.
- **Sprints** are sized by how many pull requests the owner can read, merge and check on the live site: about four
  to six. A sprint has a goal and exit checks and ends when they pass. There are no dates.
- **Tracking** is the Markdown plan in the repository. The roadmap stays the status page. GitHub issues are not used.
- **In scope:** the live board's version 1; trends per cleaner and per client; cost, margin and budgets.
  **Parked:** the live board's version 2, which would move visits in Camelo (0017).

## Why

Three reviews, a designed live board and a roadmap with 33 open boxes had no single order. For the order, the owner
chose "prove, strengthen, then build" over "two tracks every sprint" and "features first": each feature then lands
on firmer ground, the pile of unverified work stops growing, and the large change to how data is loaded is not made
underneath a feature being built. For sizing, the agents work fast and the owner's attention is the limit, so a
calendar would only slip. For tracking, a file in the repository is read directly by any agent, changes through
pull requests, and is covered by the docs checks.

## Where it lives

`docs/project-plan.md`; `docs/roadmap.md`, Next to build; `AGENTS.md`, Layout.
