---
epic: P3-E4
title: Observability & Error Tracking — Plan
strategy: 1
approved: 2026-06-18
---

# P3-E4 PLAN — Observability & Error Tracking

## Strategy 1 (Approved): Scaffold Sentry (DSN-gated) + Replay with masking + structured Cloud Logging + Firebase Performance

**Approved decisions (grill-me 2026-06-18):**
- Q1 → B: Scaffold with `VITE_SENTRY_DSN` placeholder; CI source-map step skips gracefully when token absent
- Q2 → A: Replay enabled with `maskAllInputs: true` + network body blocking (PIPEDA-compliant)

**Files changed:**
- `apps/customer/package.json` — add `@sentry/react`
- `apps/fsm/package.json` — add `@sentry/react`
- `functions/package.json` — add `@sentry/node`
- `apps/customer/src/main.tsx` — Sentry init (DSN-gated) + `getPerformance(app)`
- `apps/fsm/src/main.tsx` — Sentry init (DSN-gated)
- `apps/customer/src/vite-env.d.ts` — add `VITE_SENTRY_DSN?: string`
- `apps/fsm/src/vite-env.d.ts` — add `VITE_SENTRY_DSN?: string`
- `functions/src/index.ts` — `Sentry.captureException()` on all handlers + structured `console.error()` → structured JSON
- `.github/workflows/firebase-deploy.yml` — Sentry source-map upload step

**Manual steps (documented, not automated):**
- GitHub Secrets: `VITE_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
- GCP Monitoring: alert policy for Function error rate > 2 / 5 min
- UptimeRobot: monitor on `https://freshnest.ca`

**Persona impact:** Operator alerted on Cloud Function failures. Client-side booking errors captured with source-mapped stack traces.

**Risks:** Replay adds ~50 KB gzipped — scope to errors-only via `replaysSessionSampleRate: 0.1` / `replaysOnErrorSampleRate: 1.0`. Source maps uploaded to Sentry must not contain `VITE_SENTRY_DSN`.

**Schema audit:** No Firestore schema change.

## Strategies considered but not chosen

### Strategy 2: Sentry only — no GCP Monitoring, no UptimeRobot
- Rejected: leaves operator-alerting gap before Stripe ships

### Strategy 3: Firebase Performance + GCP Logging only — no Sentry
- Rejected: no client-side error visibility; no source-mapped stack traces
