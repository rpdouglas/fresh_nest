# 0020. Checks and ceremony sized for one developer

- Date: 2026-10-12
- Decided by: Owner
- Status: In force

## Decision

The project keeps the checks that have caught real faults or guard something that cannot be undone, and drops the
ceremony around them.

Kept:

- unit tests, typecheck and build for the site and the function;
- the browser tests against a pretend Camelo;
- the deploy guard for Claude Code (scope, no `--force`, no Firestore, from `main`, CI passed);
- the live check after a deploy;
- the check that every path named in the docs exists;
- the check that a pull request changing code also changes docs, with a stated reason as the way out.

Cut:

- markdown lint;
- the rule that a change to the site must add a line to the roadmap, and the pull request after every deploy. A
  git tag, `live`, moved at each deploy, records what is live instead;
- the second Claude Code hook, which repeated the docs check;
- a review by a second session on every pull request. It is now for risky changes only: pay or billing rules,
  sign-in and access, anything that writes to Camelo, the deploy guard or CI;
- the five-box pull request checklist: the description keeps "What changes", "Checked" and "Not checked";
- weekly Dependabot: it is monthly;
- separate CI lines for the Python script, the docs and the never-run deploy job. CI shows two checks on a pull
  request, `checks` and `e2e`, and the deploy job has its own workflow, started by hand;
- a decision file for process tweaks. Decision files are for the owner's business rules and for choices that
  change what the site does or who can do what.

## Why

In two days the project gained six CI jobs and a second workflow, two hooks, a checklist, a required roadmap line,
a pull request after every deploy, a review on every pull request (never once carried out) and nineteen decision
files. The owner is a solo developer and asked what is essential. Looking at what each check had actually caught:
the unit and browser tests and the docs-path check had caught real problems; markdown lint had only ever found
cosmetic ones; the rest had produced work without catching anything.

Offered as one pull request, as two, or as only the safest cuts; the owner chose one pull request.

## What this replaces

- The enforcement described in 0015: the roadmap line, the Stop hook and the deploy-record pull request are gone.
  Its core stays: docs change with the code, and CI checks it.
- The six-step definition of done written with 0018: it is five steps, and the review step is by risk.

## Not a check in the repository, and the one that matters most

Knowing when the site is down or erroring: an uptime check and an error alert in Google Cloud
(`docs/operations.md`). When this was written they were believed missing. They were not: both had been in place
since 2026-10-11, as a read of the project showed later the same day. The roadmap had never been updated to say so.

## Where it lives

`.github/workflows/ci.yml` and `.github/workflows/deploy.yml`; `scripts/check-docs-updated.mjs`;
`.claude/settings.json` and `.claude/hooks/guard-bash.mjs`; `.claude/skills/deploy/SKILL.md`;
`.github/pull_request_template.md`; `.github/dependabot.yml`; `AGENTS.md`, How we work; `docs/project-plan.md`,
How every item is done.
