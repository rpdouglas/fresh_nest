# 0028. The second look is narrowed, and checks run once

- Date: 2026-10-13
- Decided by: Owner
- Status: In force. Replaces the second-look part of 0020.

## Decision

1. A second look is needed only where a mistake costs money or cannot be undone: pay or billing figures, and
   anything that writes to Camelo. Not for sign-in, new read-only routes, the deploy guard or CI.
2. When one is needed it is small: the diff and two or three named questions, not an open audit.
3. The local checks are run once, when a change is finished. CI is the second run.

## Why

On 2026-10-13 two second looks ran, on the deploy guard and on the browser-error route. Each found something real,
but each took well over 100,000 tokens and many minutes, on top of checks that had already been run several times.
That is too heavy for one developer iterating quickly. The tests and CI cover the areas dropped here.

## Where it lives

`AGENTS.md` (How we work); `docs/project-plan.md` (How every item is done); `.claude/skills/code-review/SKILL.md`.
