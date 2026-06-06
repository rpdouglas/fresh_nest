# ADR-004 — Firebase Preview Channels over Permanent Staging Branch
**Status:** Accepted  
**Date:** 2026-06-06  
**Deciders:** Project Lead, CI/CD Architecture

## Context

Feature branches need to be reviewable in a deployed environment before merging to `main`. The alternatives are:
1. A permanent staging branch + permanently deployed staging site
2. Ephemeral preview environments generated per pull request
3. Local development only, with no deployed preview

A permanent staging site requires ongoing maintenance, can drift from `main`, and adds a second Firebase Hosting target to monitor indefinitely. For a solo developer, this maintenance overhead is a recurring tax on every sprint.

## Decision

Every pull request triggers an **ephemeral Firebase Preview Channel** with a unique URL (7-day expiry). Preview channels:
- Are automatically created by the GitHub Actions CI workflow on PR open/update
- Point to the `freshnest-dev` Firestore database (via `VITE_FIRESTORE_DB_ID=freshnest-dev`)
- Have their URL auto-commented on the PR by the Firebase GitHub App bot
- Expire automatically after 7 days — no manual cleanup required
- Are destroyed when the PR is merged or closed (via `expires` setting in `firebase.json`)

## Rationale

- No permanent staging server to provision, monitor, or maintain
- Each PR gets a unique, isolated preview URL — reviewers can open the exact state of the branch
- GitHub bot comment means the preview URL is always findable without digging through CI logs
- 7-day expiry is acceptable because PRs in this workflow should merge faster than that
- Maps cleanly to a solo developer workflow — no ops burden
- `freshnest-dev` DB isolation means preview form submissions never touch production data (see ADR-002)

## Consequences

**Positive:**
- Zero staging server maintenance burden
- Automatic PR URL comments make review handoff trivial
- Fresh, isolated environment per PR — no state bleed between branches
- Dev DB isolation ensures all preview interactions are safe

**Negative:**
- Preview URLs expire after 7 days — long-running PRs lose their preview link and require a new CI trigger
- Preview channels consume Firebase Hosting storage quota (negligible in practice)

**Neutral:**
- Preview channels are a Firebase Hosting feature — no additional services required

## Alternatives Considered

- **Permanent staging branch + site** — Rejected. Maintenance overhead for a solo developer. Staging can drift from `main` if not kept in sync. Requires a second environment to monitor indefinitely. No meaningful benefit over ephemeral previews for this project size.
- **Vercel preview deployments** — Rejected. Project is committed to Firebase Hosting (ADR decision). Introducing Vercel would create a split hosting model with separate deployments, separate environment configurations, and a second platform to manage. Firebase Preview Channels provide equivalent functionality within the existing stack.
