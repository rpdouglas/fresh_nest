# FNC Landing Decisions (Read-Only History)

> **Archived from `rpdouglas/blurb` (ADR-022 / P3-E41, 2026-11-23; snapshot SHA `f881f49a5f6e41617054e48502b94f4d56c9afda` + decision 0047).**
> Kept as read-only history. These decisions remain in force for `apps/ops` and `functions-ops` until a Fresh Nest ADR in `docs/decisions/` replaces one.

One short file per decision that shapes how the site behaves or how the work is done.
Add a file when the owner decides something new; do not rewrite an old one, add a new one that replaces it.

| # | Decision | Date | Status |
| --- | --- | --- | --- |
| 0001 | [Plan with three approaches](0001-planning-three-approaches.md) | 2026-10-10 | In force |
| 0002 | [Timesheets cannot be deleted from the site](0002-no-delete-from-the-site.md) | by 2026-10-10 | In force |
| 0003 | [Google sign-in is the only way in](0003-google-sign-in-only.md) | 2026-10-11 | In force; two sentences replaced by 0037 once that is built |
| 0004 | [On Call appears only on Daily teams](0004-on-call-only-on-daily-teams.md) | 2026-10-12 | In force; My week tells a cleaner their own on-call days (0038) |
| 0005 | [Payroll hours is the pay record](0005-payroll-hours-is-the-pay-record.md) | 2026-10-12 | In force |
| 0006 | [Billing is $75 an hour per visit](0006-billing-per-visit.md) | 2026-10-12 | In force |
| 0007 | [Dashboard targets](0007-dashboard-targets.md) | 2026-10-12 | In force |
| 0008 | [Schedule check: teams of two, no position, today](0008-schedule-check-rules.md) | 2026-10-12 | In force |
| 0009 | [Job-site addresses may be sent to OpenStreetMap](0009-addresses-to-openstreetmap.md) | 2026-10-12 | In force |
| 0010 | [Trends are saved by the dashboard, not on a timer](0010-trends-saved-by-the-dashboard.md) | 2026-10-12 | In force |
| 0011 | [The repository is private](0011-repository-private.md) | 2026-10-12 | In force |
| 0012 | [Deploys from CI are started by hand](0012-deploys-started-by-hand.md) | 2026-10-12 | In force |
| 0013 | [The local dev server does not change Camelo](0013-local-dev-does-not-change-camelo.md) | 2026-10-12 | In force |
| 0014 | [Paid time is time worked, not the length of the day](0014-paid-time-is-time-worked.md) | 2026-10-12 | In force |
| 0015 | [Docs are updated with every change, and that is checked](0015-docs-updated-with-every-change.md) | 2026-10-12 | In force in part (see 0020) |
| 0016 | [Live board: 15-minute grace you can change, phone first, cleaners first](0016-live-board.md) | 2026-10-12 | Decided; levels and strip added by 0029 |
| 0017 | [One shared 15-minute grace, Punctuality included; v2 moves start times one tap at a time](0017-shared-grace-and-moving-starts.md) | 2026-10-12 | Decided |
| 0018 | [The project plan: prove, strengthen, then build; sprints without dates](0018-project-plan-shape.md) | 2026-10-12 | In force |
| 0019 | [Setting up deploys from CI is deferred](0019-ci-deploy-deferred.md) | 2026-10-12 | In force |
| 0020 | [Checks and ceremony sized for one developer](0020-checks-sized-for-one-developer.md) | 2026-10-12 | In force; second look narrowed by 0028 |
| 0021 | [Dual-agent setup: Claude Code and Antigravity (agy)](0021-dual-agent-setup-claude-and-agy.md) | 2026-10-12 | In force |
| 0022 | [Brand identity: FNC Landing](0022-brand-identity-fnc-landing.md) | 2026-10-12 | In force |
| 0023 | [Fresh Nest Co. design system adoption](0023-fresh-nest-design-system.md) | 2026-10-12 | In force |
| 0024 | [Client pricing rules and accounting export](0024-client-pricing-and-accounting-export.md) | 2026-10-12 | In force |
| 0025 | [Field intelligence and checklists](0025-field-intelligence-and-checklists.md) | 2026-10-12 | In force |
| 0026 | [Client consistency and churn signals](0026-client-consistency-and-churn-signals.md) | 2026-10-12 | In force |
| 0027 | [Browser errors go to our own log, and a failed report shows a message](0027-browser-errors-to-our-own-log.md) | 2026-10-13 | In force |
| 0028 | [The second look is narrowed, and checks run once](0028-second-look-narrowed.md) | 2026-10-13 | In force |
| 0029 | [Live board: three levels, red only when someone must act, and a "Next 30 minutes" strip](0029-live-board-levels-and-next-30-minutes.md) | 2026-10-13 | Decided |
| 0030 | [An AI morning brief on the dashboard](0030-ai-morning-brief.md) | 2026-10-13 | Parked (owner, 2026-10-14; 0041) |
| 0031 | [Names may be sent to the AI for campaign drafts, for now](0031-names-to-the-ai-for-campaigns.md) | 2026-10-13 | In force |
| 0032 | [The function keeps Camelo reads for a minute](0032-a-minute-cache-for-camelo-reads.md) | 2026-10-13 | In force |
| 0033 | [A client's price has a start date; QuickBooks invoices are per client per day](0033-client-prices-have-a-start-date.md) | 2026-10-13 | In force |
| 0034 | [Zod checks what new routes are sent; the old routes keep their own checks](0034-zod-for-new-routes.md) | 2026-10-13 | In force |
| 0035 | [React Compiler: on hold](0035-react-compiler-on-hold.md) | 2026-10-13 | In force |
| 0036 | [The record starts with the pay period of Friday 2026-10-09](0036-the-record-starts-2026-10-09.md) | 2026-10-13 | In force |
| 0037 | [Cleaners get their own, narrower way in; the office keeps everything](0037-staff-accounts-and-roles.md) | 2026-10-13 | Built, not switched on; the emailed link not built |
| 0038 | [My week: on call, hours as logged, released shifts only](0038-my-week-on-call-and-what-a-cleaner-sees.md) | 2026-10-13 | Decided, not switched on |
| 0039 | [Targeted local browser tests: fast feedback during development](0039-targeted-local-browser-tests.md) | 2026-10-14 | In force |
| 0040 | [Client patterns and routes: a street map with images from OpenStreetMap](0040-route-map-images-from-openstreetmap.md) | 2026-10-16 | In force |
| 0041 | [Live board parameters: 5-minute refresh, handled cascade; AI brief parked](0041-live-board-parameters-and-ai-brief.md) | 2026-10-14 | Decided |
| 0042 | [Five hubs and nine pages in place of fifteen reports](0042-five-hubs-nine-pages.md) | 2026-10-17 | Decided, not built |
| 0043 | [A mobile-first app, installed on the phone, with one look throughout](0043-a-mobile-first-installable-app.md) | 2026-10-17 | Decided, not built |
| 0044 | [Cleaners clock in and out in the app, with photos](0044-clock-in-and-out-with-photos.md) | 2026-10-17 | Decided; home photos built, clock-in proved on the test workspace |
| 0045 | [Cleaners without Google sign in with Camelo's 6-digit emailed code](0045-cleaner-sign-in-by-camelo-code.md) | 2026-10-17 | Active |
| 0046 | [The site gets a freshnestco.ca address; it stays a separate app](0046-a-freshnestco-address.md) | 2026-10-27 | Reversed by 0047 (2026-11-23) |
| 0047 | [Merged into Fresh Nest (`rpdouglas/fresh_nest`); this repo is frozen](0047-merged-into-fresh-nest.md) | 2026-11-23 | In force |

## Open

- None. (From what date invoicing in the app counts was answered by 0036: 2026-10-09. The dashboard's "approved, not yet invoiced" counts from that day: `RECORD_START` in `web/src/lib/targets.ts`.)
