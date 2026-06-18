# P3-E4: Observability & Error Tracking — Phase A Strategy Plan

**Epic:** P3-E4 · **Priority:** P1 · **Complexity:** M
**Prepared:** 2026-06-18
**Persona gate:** Operator alerted within 5 minutes of any Cloud Function failure. Client-side errors in Sentry within 60 seconds.

---

## Pre-conditions
- Obtain Sentry DSN and auth token for a Fresh Nest Co. project in Sentry.io
- Store `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` as GitHub repository secrets before Phase B begins

---

## Strategy 1 — Sentry + Firebase Performance + GCP Monitoring + UptimeRobot (Recommended)

**What:** Install Sentry in all three apps and functions for error capture with source maps. Enable Firebase Performance Monitoring for client-side metrics. Create a GCP Monitoring alert policy for Function errors. Configure UptimeRobot for uptime pinging.

**Files changed:**
- `apps/customer/package.json` + `apps/fsm/package.json` — add `@sentry/react`
- `functions/package.json` — add `@sentry/node`
- `apps/customer/src/main.tsx` + `apps/fsm/src/main.tsx` — initialise Sentry (`BrowserTracing`, `Replay`); initialise `getPerformance(app)`
- `functions/src/index.ts` — wrap all function handlers in `Sentry.captureException`; replace all `console.error()` with `logger.error()` (Google Cloud Logging structured format)
- `.github/workflows/firebase-deploy.yml` — add Sentry source map upload step (`@sentry/cli`)
- `.env.local` (example only, not committed) — `VITE_SENTRY_DSN`
- GCP Console — create Monitoring alert policy (manual step; document in close report)
- UptimeRobot — configure monitor on `https://freshnest.ca` (manual step; document in close report)

**Persona impact:** Operator (Lauren) receives email/SMS alert within 5 minutes when any booking, job, or SMS Cloud Function fails. No more silent failures on `onBookingCancelled` or `onDailyRecurringRenewal`. Client-side errors (booking form exceptions, portal errors) captured with full stack trace and user context.

**Risks:**
- Sentry `Replay` adds ~50KB gzipped — confirm Lighthouse Performance score is not degraded; scope replay to errors-only (`replaysOnErrorSampleRate: 1.0`, `replaysSessionSampleRate: 0`)
- GCP Monitoring alert policy is a manual console step — document exactly in close report so it can be reproduced
- Source maps uploaded to Sentry must not include the `VITE_SENTRY_DSN` value in the map itself

**Schema audit:** No Firestore changes. No `docs/firestore-schema.md` update required.

---

## Strategy 2 — Sentry Only (No GCP Monitoring, No UptimeRobot)

**What:** Install Sentry in all apps and functions. Skip Google Cloud Monitoring alert policy and UptimeRobot setup.

**Files changed:** Subset of Strategy 1 — no GCP Monitoring config, no UptimeRobot.

**Persona impact:** Client-side errors captured. Cloud Function errors captured in Sentry. However, operator is NOT proactively alerted — must check Sentry dashboard manually or configure Sentry's own alerting (requires Sentry Team plan or higher). No uptime check on the production URL.

**Risks:** Sentry's alerting on the free tier is limited. This leaves a gap between "errors are recorded" and "operator is notified in time to act." For Stripe integration (Sprint 2), silent Cloud Function failures on `onBookingStatusConfirmed` mean missed payment captures — unacceptable.

**Schema audit:** None.

---

## Strategy 3 — Firebase Performance + GCP Monitoring Only (No Sentry)

**What:** Enable Firebase Performance Monitoring for client-side metrics and create GCP Monitoring alert for Cloud Function error rate. No third-party SaaS (no Sentry). Use GCP Log-based alerts on `console.error` patterns.

**Files changed:**
- `apps/customer/src/main.tsx` — add `getPerformance(app)`
- GCP Console — log-based alert on `textPayload =~ "ERROR"` in Functions logs
- `functions/src/index.ts` — replace `console.error()` with structured `logger.error()`

**Persona impact:** Operator alerted by GCP. No source-mapped stack traces — Cloud Function error messages appear as raw log lines without the original TypeScript context. No client-side error capture — booking form exceptions are invisible.

**Risks:** GCP log-based alerts require more configuration than Sentry and produce noisier alerts without deduplication or grouping. No client-side error visibility is a significant gap, especially for the Stripe `PaymentElement` integration shipping in Sprint 2.

**Schema audit:** None.

---

## Recommended Strategy: **Strategy 1**

The full-stack observability approach is the v3 plan requirement and is operationally necessary before Stripe goes live. Strategy 2 is acceptable if Sentry plan tier includes alerting. Strategy 3 leaves a critical blind spot on client-side errors. **Pre-condition: Sentry account with DSN must be in hand before Phase B starts.**

**Awaiting human approval to proceed to Phase B.**
