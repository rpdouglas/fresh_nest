# ADR-012 — Production Rollback Procedure
**Status:** Accepted
**Date:** 2026-06-18
**Deciders:** Dev Team, Ryan (Owner)

## Context
As CI/CD pipeline hardening (P3-E5) introduces automated deploy gates, a documented and tested rollback procedure is required so that any broken production deploy can be reversed within minutes. The procedure must cover both the Firebase Hosting deploy and the Cloud Functions deploy, and must be executable by a developer with repo access without requiring a full new build cycle.

## Decision

### Rollback steps — Firebase Hosting

1. Identify the last known-good deploy in the Firebase Console:
   `Firebase Console → Hosting → freshnest-prod → Release History`
2. Click the known-good release → **Rollback** button.
   Firebase Hosting rollback is instant — no redeploy needed.

### Rollback steps — Cloud Functions

Cloud Functions do not have a one-click rollback in the Firebase Console. Use git:

```bash
# 1. Find the last known-good commit SHA
git log --oneline -10

# 2. Check out the good commit into a temporary branch
git checkout -b hotfix/rollback <SHA>

# 3. Deploy functions only from the good commit
npx firebase deploy --only functions --project freshnest-aa51e

# 4. Open a PR from hotfix/rollback → main with the revert or fix
```

### Rollback steps — Firestore Rules / Indexes

```bash
# Deploy previous rules from your local checkout of the known-good commit
git checkout <SHA> -- firestore.rules firestore.indexes.json
npx firebase deploy --only firestore:rules,firestore:indexes --project freshnest-aa51e
# Restore your working branch
git checkout HEAD -- firestore.rules firestore.indexes.json
```

### Emergency contacts
- Firebase Console: https://console.firebase.google.com/project/freshnest-aa51e
- GitHub Actions: check the failed workflow run for the exact step that failed before escalating

## Rationale
Firebase Hosting's built-in rollback handles the most common case (bad static deploy) with zero code. Cloud Functions require a git-based rollback because Firebase does not retain previous function builds. Documenting both paths ensures any team member can execute a rollback without tribal knowledge.

## Consequences
**Positive:** Any broken production deploy can be reversed in < 5 minutes for Hosting; < 15 minutes for Functions.
**Negative:** Functions rollback requires a git checkout and redeploy — cannot be done from the Firebase Console alone.
**Neutral:** This procedure should be tested manually on the dev environment once per quarter.

## Alternatives Considered
- **Blue/green deploy with two Firebase projects** — rejected; doubles Firebase costs and adds infrastructure complexity not warranted at current scale.
- **GitHub release tags as rollback targets** — good practice; recommend tagging production releases with `v<date>` going forward to make step 1 easier.
