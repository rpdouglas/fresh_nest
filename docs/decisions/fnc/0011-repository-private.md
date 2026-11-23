# 0011. The repository is private

- Date: 2026-10-12
- Decided by: Owner
- Status: In force (made private by the owner on 2026-10-12)

## Decision

The repository is private, and stays private. On 2026-10-12 the owner weighed making it public again for the
GitHub features that would bring, and chose to keep it private.

## Why

The docs describe the business: what a week bills, the rate, how often visits go unlogged. See `docs/ai-workflow-review.md`, gap 1. On a free GitHub plan this also means deploy approvals are not available, so deploys stay started by hand.

A mistaken commit of client or staff details would be public at once and could not be recalled. Private makes that
a mistake that can be fixed. What a public repository would add on the free plan (GitHub refusing a merge until CI
passes, an approval before a deploy, secret scanning) is modest for a one-owner project and is covered in other
ways: see 0012 and `.claude/hooks/guard-bash.mjs`.

## Where it lives

GitHub repository settings.
