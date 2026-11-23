# 0047. Merged into Fresh Nest (`rpdouglas/fresh_nest`); this repo is frozen

- Date: 2026-11-23
- Decided by: Owner
- Status: In force (reverses [0046](0046-a-freshnestco-address.md))

## Decision

1. **Decision 0046 is reversed.** FNC Landing moves into `rpdouglas/fresh_nest` (Firebase project `freshnest-aa51e`) as `apps/ops` and `functions-ops`, served at `https://ops.freshnestco.ca` (Option B + P3-E41 Strategy 2; recorded in `rpdouglas/fresh_nest` as **ADR-022**).
2. **This repository (`rpdouglas/blurb`) is frozen to fixes only.** No new Camelo-bound or product features are built here. The clean snapshot imported into `fresh_nest` is pinned to the `live` tag commit `f881f49a5f6e41617054e48502b94f4d56c9afda` (PR #146).
3. **One sales pipeline:** `docs/lead-tracking-spec.md` (in `rpdouglas/blurb`) is permanently retired. Fresh Nest's **P3-E40 Sales Pipeline** is the single lead pipeline.
4. **Cutover freeze mode (`OPS_READ_ONLY=true`):** On Switch Friday (immediately before the final Firestore + photo bucket copy into `freshnest-aa51e`), this function is switched to `OPS_READ_ONLY=true`. Every Camelo and Firestore write route returns HTTP `503` (`reason: "read_only"`), `/api/health` advertises `readOnly: true`, and the site displays a top banner directing office and cleaners to `https://ops.freshnestco.ca`. Read routes remain available through the one-pay-period parallel verification.
5. **Sunset after the pay gate:** Once Payroll hours and Invoicing totals on `ops.freshnestco.ca` match `fnc-reports.web.app` to the cent for one full pay period, `scheduleApi` in `lilypad-strategy-design` is shut down immediately, `fnc-reports.web.app` serves a lightweight service-worker-unregistering redirect page to `https://ops.freshnestco.ca` for 8 weeks, and then `fnc-reports.web.app` is switched off and this repository is archived as read-only history.

## Why

Running two separate apps duplicated leads, clock-in/photos, client prices, office allowlists, and cleaner identities, while pulling against Fresh Nest's plan to replace Camelo step by step. Moving FNC Landing into `fresh_nest` keeps its proven payroll and invoicing calculations intact (verified to the cent across a full pay period) while unifying office sign-in (Owner/Manager claims), backups, and future Camelo cutover in one repo and one Firebase project.

## Where it lives

- `rpdouglas/fresh_nest`: `docs/projects/P3-E41.md`, `docs/plans/P3-E41_PLAN.md`, `docs/decisions/ADR-022-merge-fnc-landing-into-fresh-nest.md`
- This repo: read-only freeze toggle in `functions/src/core.ts`, `functions/src/index.ts`, `web/src/Root.tsx`, and `docs/operations.md`
