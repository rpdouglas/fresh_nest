# ADR-008 — Secrets and Security Governance
**Status:** Accepted  
**Date:** 2026-06-16  
**Deciders:** Project Lead, AI Agent Workflow Design

## Context

During a codebase audit, it was discovered that `.env.production` had been committed to the git repository containing live Firebase configuration settings and admin email addresses. Although Firebase API keys are client-safe by design, committing admin email addresses exposes potential PII under PIPEDA. Additionally, future integrations (such as Stripe in P1-E3 and Sentry DSNs in P1-E7) require strict credential isolation. 

We need a policy and enforcement mechanism to ensure that secrets are never committed to the git repository, that historical exposures are purged, and that secrets are managed securely at build and runtime.

## Decision

1. **Excision of Exposed Secrets**: Excise `.env.production` from all git history using a history cleaning script.
2. **Git Tracking Rules**: Enforce git ignore rules by keeping `.env.production` and `.env.local` in `.gitignore`.
3. **Build-Time Secrets**: All build-time frontend variables (`VITE_*`) must be injected via GitHub Actions Secrets during the CI/CD build step, and never stored in files committed to git.
4. **Runtime Secrets**: Cloud Functions runtime secrets (like the Stripe API key or external service webhooks) must be managed using Firebase Cloud Functions' native Secret Manager integration (`runWith({ secrets: [...] })`) rather than environmental strings.
5. **No PII in Environment Files**: Environmental configurations must never contain real user emails, phone numbers, or passwords.

## Rationale

- Purging the git history ensures that if the repository is ever made public or audited by third parties, there is no leakage of sensitive data or PII (complying with PIPEDA regulations).
- Injecting variables at build time and runtime via platform-native secrets (GitHub Secrets & Google Cloud Secret Manager) is the industry standard for secure deployment.
- Having a cleanup script ensures the history purge can be executed locally by developers, mitigating the fact that autonomous agents cannot execute git history rewrites on remote repositories directly.

## Consequences

**Positive:**
- Complete compliance with PIPEDA regarding credential exposure.
- Standardized, repeatable process for configuring local environments and remote deployments.
- Ready infrastructure for adding Stripe keys (P1-E3).

**Negative:**
- Requires all developers to re-clone the repository or perform a hard reset on local branches after history is rewritten.

**Neutral:**
- Developers must maintain their own local `.env.local` files, which are excluded from git.

## Alternatives Considered

- **Keep history and rotate credentials only** — Rejected. While rotating credentials invalidates the old API keys, the admin emails (PII) would remain permanently exposed in the repository's git history.
- **Store secrets in encrypted files within the repository** — Rejected. Adds unnecessary decryption steps in build pipelines and increases the complexity of local developer setup.
