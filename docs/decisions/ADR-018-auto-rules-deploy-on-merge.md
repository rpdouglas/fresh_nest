# ADR-018 — Automatic Security Rules Deployment on Merge to `main` (Supersedes ADR-016)
**Status:** Accepted (2026-10-27)
**Date:** 2026-10-27
**Deciders:** Owner (Ryan)

## Context
- Under [ADR-016](ADR-016-manual-rules-deploy-workflow.md), deploying changes to `firestore.rules`, `firestore.dev.rules`, `firestore.indexes.json`, or `storage.rules` required a separate manual `workflow_dispatch` step in the GitHub Actions UI after merging a PR.
- In our Codespaces + PR workflow, every rules change is already human-approved when the PR is merged to `main` and verified against the Firestore and Storage emulator test suite in `firebase-preview.yml`.
- Requiring a second manual GitHub Actions UI step after PR merge created unnecessary friction and risked leaving production rules out of sync with newly deployed Functions and Hosting code.

## Decision
1. Add a path-filtered `rules` job to `.github/workflows/firebase-deploy.yml` that triggers on `main` whenever `firestore.rules`, `firestore.dev.rules`, `firestore.indexes.json`, `storage.rules`, or `firebase.json` changes (or on `workflow_dispatch`).
2. Before deploying, the `rules` job runs the full Firestore and Storage emulator test suite (`vitest.rules.config.ts`) and only deploys `storage,firestore:rules,firestore:indexes` to `freshnest-aa51e` if every test passes.
3. Grant `actions: write` and `workflows: write` repository permissions in `.devcontainer/devcontainer.json` so Codespaces sessions can also trigger manual workflows (`deploy-rules.yml`, `e2e.yml`, `security-audit.yml`) directly via `gh workflow run`.
4. Retain `.github/workflows/deploy-rules.yml` as a manual on-demand tool when re-deploying rules without a commit.

## Consequences
- **Positive:** Zero-friction, atomic production deployments — rules, indexes, functions, and hosting stay in lockstep on merge to `main`, gated by emulator tests.
- **Neutral:** Supersedes the manual-only requirement of ADR-016; human approval is recorded via the PR review/merge audit trail and GitHub Actions run history.
