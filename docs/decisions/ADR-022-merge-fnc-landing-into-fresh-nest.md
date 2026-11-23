# ADR-022 — Merge FNC Landing into Fresh Nest as `apps/ops`
**Status:** Accepted (2026-11-23 — Option B + P3-E41 Strategy 2 approved by owner)
**Date:** 2026-11-23
**Deciders:** Owner

## Context
Fresh Nest runs on two systems. `rpdouglas/fresh_nest` (`freshnest-aa51e`) wins the client: website, quote requests, bookings, agreements. `rpdouglas/blurb`, "FNC Landing" (`lilypad-strategy-design`, https://fnc-reports.web.app), runs the week. It shows schedule, timesheets, payroll hours, invoicing and client prices, read from Camelo. The two duplicate the sales pipeline, clock-in and photos, client prices, office roles and cleaner identities. The FSM master spec plans to replace Camelo, while FNC Landing is built on it. FNC decision 0046 (2026-10-27) kept FNC Landing separate. The full analysis is in `docs/reports/merge-fnc-landing-into-fresh-nest-2026-11-23.md`.

## Decision
1. **One repo, one Firebase project, one sign-in.** FNC Landing moves into this repo via a clean snapshot import pinned to `blurb`'s `live` tag SHA as `apps/ops` and `functions-ops` (`codebase: "ops"`), served from `freshnest-aa51e` at `ops.freshnestco.ca`. Its `schedule*` collections (kept as-is for Phase 1, documented in `firestore-schema.md` §17) and photo bucket move into `freshnest-aa51e`.
2. **Unified office auth with immediate revocation (Strategy 2).** `apps/ops` uses `freshnest-aa51e` Firebase Auth Google Sign-In (`syncMyRole`), and `functions-ops` verifies the Firebase ID token plus the live `admins/{email}` allowlist (`owner` or `manager`, ADR-017). `SCHEDULE_EDITORS` is retired. Cleaners retain Camelo's 6-digit code session until Phase 2 (`apps/fsm`).
3. **FNC decision 0046 is reversed.** `blurb` is frozen (fixes only; decision `0047-merged-into-fresh-nest.md`). At the pay gate, `blurb`'s `scheduleApi` is shut down immediately and `fnc-reports.web.app` serves a service-worker-unregistering redirect to `ops.freshnestco.ca` for 8 weeks before hosting shutdown and repo archival.
4. **Camelo stays the source for schedule and time** until the FSM cutover gate. Afterwards the ops hub's reports are switched, one at a time, to Fresh Nest data, each checked against Camelo first.
5. **One of each from now on:** one sales pipeline (P3-E40; FNC's `lead-tracking-spec.md` is retired), one price record per client (moves onto client records in FSM wave 1), one cleaner app (`apps/fsm` takes over My week and clock-in in FSM wave 1).
6. **Scoped stack exception & hard workspace isolation:** `apps/ops` may keep Tailwind v4, its HTTP API (`scheduleApi`) and its own function codebase until its reports are rewritten for Fresh Nest data. Both `apps/ops` and `functions-ops` stay outside root npm workspace hoisting (`workspaces: ["apps/customer", "apps/fsm", "packages/*"]`, own lockfiles) so Tailwind v4 / TypeScript pins cannot leak into `apps/customer` or `apps/fsm`. The rest of the repo stays Tailwind v3 per `CLAUDE.md`. The exception ends when the last ops report is rewritten (Phase 3).
7. **Deployment isolation during Phase 1:** `firebase-deploy.yml` scopes its existing functions job strictly to `--only functions:default`. During Phase 1, `functions:ops` and `hosting:freshnest-ops` deploy in lockstep via manual `workflow_dispatch` (`deploy-ops.yml`) with a `/api/health` smoke check, transitioning to auto-deploy on merge after the pay gate passes.
8. FNC Landing's decisions 0001–0047 are kept as read-only history in `docs/decisions/fnc/`. They stay in force for `apps/ops` until an ADR here replaces one.

## Rationale
Keeping the apps separate (option A) keeps every duplicate. Rebuilding FNC Landing inside Fresh Nest (option C) would rewrite the only code that computes real pay and invoices while the business depends on it. Moving it in (option B) keeps that code working and removes the duplicates from now on. It also turns the ops hub into the place where Camelo is replaced, and takes FNC Landing out of a Firebase project shared with unrelated apps.

## Consequences
**Positive:** one office role list (Owner/Manager); ops data under the same backups (W0-5) and rules; no further duplicate features; a natural path to the Camelo cutover.
**Negative:** a temporary second stack inside the monorepo (Tailwind v4, HTTP API, TypeScript 7 pins); a migration with a pay-period parallel run; cleaners sign in once on the new address.
**Neutral:** production `freshnest-aa51e` starts holding real operational data (pay, invoices, photos), which ends the "clean slate, test data only" state for those collections.

## Alternatives Considered
- **A. Link, don't merge** (FNC 0046). Rejected: keeps two office lists and duplicate builds, and makes the Camelo cutover harder.
- **C. Rebuild inside Fresh Nest, retire FNC Landing at cutover.** Rejected: high risk to payroll and invoicing, and months of parallel build.
