# 0015. Docs are updated with every change, and that is checked

- Date: 2026-10-12
- Decided by: Owner
- Status: In force in part. Replaced in part by [0020](0020-checks-sized-for-one-developer.md): the roadmap line, the Stop hook and the pull request after every deploy were dropped

## Decision

Every change comes with the documentation updates it needs, in the same pull request. A change to the site or the
function adds a line to the roadmap under "Merged, not yet live", and every deploy is followed by a docs-only pull
request that records it. This is enforced, not left to memory:

- a "Docs updated" check on every pull request fails when code or setup changed and no docs did;
- Claude Code is stopped once before ending work on a branch in that state;
- the way out, when nothing needs to change, is a stated reason in the pull request description.

## Why

The roadmap fell behind twice in one day: it said "not deployed" after three deploys, and it listed seven merged
Dependabot pull requests as open. A written rule to keep docs current was already in place and was not enough. The
owner asked for the roadmap to be brought up to date and for the updates to be an automated part of the process.
Of three ways offered (a check in CI plus a hook, the hook alone, a stronger written rule), the owner chose the first.

## Where it lives

`scripts/check-docs-updated.mjs` and its tests; `.github/workflows/docs-updated.yml`; `.claude/hooks/docs-updated.sh`
and `.claude/settings.json`; `.claude/skills/deploy/SKILL.md`; `AGENTS.md`, How we work.

## Known limits

The check sees that the docs changed, not that they are right. It cannot tell whether a deploy has happened: the
record of a deploy still depends on whoever deploys opening the pull request, which the deploy skill does for
Claude Code. On a private repository on the free plan the check cannot be made a required one (0011), so a red
check has to be respected, not relied on to block.
