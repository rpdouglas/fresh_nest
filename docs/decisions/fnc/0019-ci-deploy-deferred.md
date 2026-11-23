# 0019. Setting up deploys from CI is deferred

- Date: 2026-10-12
- Decided by: Owner
- Status: In force

## Decision

The one-time setup that would let GitHub Actions deploy is not being done for now. Deploys stay as they are: the
owner merges, then asks for a deploy, and Claude Code deploys `main` from the development machine, checks the live
site, and records the deploy in the roadmap.

The CI deploy job stays in the workflow, skipped while its two repository variables are unset, and the steps stay
in `docs/operations.md`.

## Why

The current way has worked for every release, the owner is the only person releasing, and each deploy is
deliberate. Claude Code is held to the deploy rules by a hook (scope, branch, CI passed). The CI job has never run
and its first run would likely need its permissions adjusting.

What CI would add is a way to deploy with no Codespace running, a clean build, and a record in GitHub. It would
only reduce the access held on the development machine if the Firebase login there were removed as well; setting
up CI and leaving that login in place adds a second way to deploy without taking the first away.

## When to revisit

- Another tool than Claude Code is used here for more than docs: nothing holds it to the deploy rules.
- Someone other than the owner needs to release.
- A deploy is wanted when no Codespace is running.

When it is done, remove the Firebase login from the development machine in the same piece of work.

## Where it lives

`docs/project-plan.md` (Sprint 0.1 and Parked); `docs/roadmap.md`, Housekeeping; `docs/operations.md`, Deploying
from GitHub. This changes the exit check of Sprint 0.1 set in 0018: a deploy from CI is no longer part of it.

## Known limit

The development machine keeps the owner's full Firebase login for a project shared with other apps. The hook
restrains Claude Code only.
