# ADR-016 — Manual "Deploy Security Rules" workflow
**Status:** Accepted (2026-10-27, by the human project lead)
**Date:** 2026-10-27
**Deciders:** Owner (Ryan); drafted by Claude Code at the owner's request

## Context
- COMPLIANCE.md §4 requires a human to deploy security rules. CI never deploys them: `firebase-deploy.yml` ships only functions and hosting.
- Until now, a human deploy meant running `firebase deploy --only …` from a signed-in machine.
- Claude Code cloud sessions have no Firebase credentials, so a rule fix written in a session (for example HOTFIX-06, the crew photos Storage rule) waits until the owner reaches a computer that's signed in.

## Decision
Add `.github/workflows/deploy-rules.yml`, a **manual-only** (`workflow_dispatch`) workflow.
- **Targets:** `storage`, `firestore-rules`, `firestore-indexes` or `all`.
- **Runs only from `main`, and only when the person types `DEPLOY`** in a confirm box. Otherwise a visible "refused" job fails.
- **Runs the Firestore and Storage rules emulator tests first,** and deploys only if they pass.
- **Uses the existing `FIREBASE_SERVICE_ACCOUNT` secret,** the same one the production deploy uses. No new credential.
- **Shares the `deploy-production` concurrency group,** so a rules deploy never overlaps an app deploy.
- **Writes a run summary:** target, who started it, commit and result.

Rules still never deploy on push or merge. Starting the workflow is the human step that §4 requires.

## Rationale
- It keeps the §4 guarantee: a person decides each deploy, and it can't happen by accident or automatically.
- It records the decision: the Actions history shows who deployed what, from which commit.
- It adds a safety gate the manual command lacked: the rules tests must pass first.
- The owner can deploy from a phone, using the GitHub app or website.

## Consequences
**Positive:**
- Faster, audited rules deploys.
- Tests gate every rules deploy.
- No signed-in machine is needed.

**Negative:**
- Anyone with permission to run Actions on the repo can start a rules deploy. Today that is the owner only. Revisit if collaborators are added (a protected GitHub environment with required reviewers would add a second gate).

**Neutral:**
- `firestore-rules` deploys every database configured in `firebase.json`, the same as the existing manual command. That includes `freshnest-dev` with `firestore.dev.rules`. The command behaves the same as before.

## Alternatives Considered
- **Deploy rules automatically on merge:** rejected. It breaks COMPLIANCE.md §4.
- **Give Claude Code sessions a service-account key:** rejected. Every session would get standing production deploy rights.
- **Keep deploying only from the owner's machine:** works, but slow, unaudited and untested before deploy.
