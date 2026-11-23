# Fresh Nest + FNC Landing — One Master Solution

**Date:** 2026-11-23 · **Status:** Exploration — awaiting owner decision (no epic opened yet)
**Live version (with diagrams):** Claude Doc — https://claude.ai/artifact/4chPe1DT8815FbZ4DwMTtD
**Repos reviewed:** `rpdouglas/fresh_nest` (this repo) and `rpdouglas/blurb` (FNC Landing, https://fnc-reports.web.app)

## Summary

Merge the two into **one repo, one Firebase project, one sign-in**. Keep FNC Landing's working payroll and invoicing logic, and replace Camelo underneath it step by step. Today the business runs on two apps that duplicate leads, clock-in, client prices and staff identities. The Fresh Nest plan to replace Camelo and FNC Landing's dependence on Camelo pull in opposite directions.

- **Fresh Nest wins the client; FNC Landing runs the week.** They meet at one point: a won quote becomes recurring visits, timesheets and invoices.
- **Move FNC Landing into `fresh_nest` as `apps/ops`**, out of the shared `lilypad-strategy-design` project and into `freshnest-aa51e`. Owner / Manager roles become the one office list.
- **Stop building twice now:** one sales pipeline (P3-E40), one client price record, one cleaner app path.
- **Camelo stays the source for schedule and time until the cutover gate.** The ops app is then where its data is swapped out, report by report, matched against Camelo before each switch.
- **This reverses FNC decision 0046** ("stays a separate app", 2026-10-27); it needs owner sign-off.

## What each system does today

| | Fresh Nest (website + admin + staff app) | FNC Landing (fnc-reports) |
| --- | --- | --- |
| Job it does | Win the client: public site (EN/FR), quote requests, bookings, e-agreements, reviews, gallery | Run the week: dashboard, live board, schedule views, timesheet approval, payroll hours, invoicing + QuickBooks export, client prices, feedback |
| Source of truth | Its own Firestore (`bookings`, `jobs`, `staff`, `agreements`…) | **Camelo** for people, shifts and timesheets; Firestore only for prices, invoice ticks, feedback, photos, snapshots |
| Real data? | Bookings and agreements live; staff/jobs hold test data (clean-slate decision) | Yes: all timesheets and billing since the pay period of 2026-10-09 (FNC 0036) |
| Firebase project | `freshnest-aa51e` (own project, 2 databases) | `lilypad-strategy-design`, shared with other apps |
| Server style | Firestore rules + callable / triggered / scheduled Functions | One HTTP function `scheduleApi`, ~17 routes; no browser Firestore reads |
| Office sign-in | Firebase Auth; Owner / Manager custom claims (ADR-017) | Google sign-in against `SCHEDULE_EDITORS` |
| Cleaner sign-in | Firebase Auth magic link | Camelo's 6-digit emailed code; 30-day session (FNC 0045) |
| Cleaner app | `apps/fsm` (test data) | My week: visits, clock in/out with door photo, before/after photos (real) |
| Front end | React 19, Tailwind v3, react-i18next EN/FR | React 19, Tailwind v4, English only, installable |
| Size | ~34,600 lines TypeScript | ~18,800 lines TypeScript |
| Planning | AGY gate, ADR-001…021, FSM master spec (replace Camelo in 5 waves) | Decisions 0001–0046, `project-plan.md` |

## Where they overlap and conflict

| Area | Fresh Nest | FNC Landing | Problem |
| --- | --- | --- | --- |
| Sales pipeline | P3-E40 (plan written 2026-11-23) | `lead-tracking-spec.md`, parked since 2026-10-13 | Two designs for one pipeline |
| Clock in/out + photos | Staff app check-in, job photos, checklists (test data) | Clock in/out with photos, entry-code and pet badges (real) | Cleaners would have two apps |
| Client prices | Agreements default hourly $75 (PR #75) | `scheduleClientRates`, default $75/h, flat rates | Two price records; invoices and agreements can disagree |
| Clients and sites | Booking fields; client/site records planned in wave 1 | Camelo clients, read only | No single client record from quote to invoice |
| Office roles | Owner / Manager claims | `SCHEDULE_EDITORS` list | Two lists for the same 2–3 people |
| Cleaner identity | `staff` + Firebase Auth | Camelo person + code | Same people, two identities |
| Audit and backups | P3-E37 audit, W0-5 backups + restore drill | Change log; backups optional | Payroll and invoice records are the least protected |
| Design and language | Tailwind v3, EN + FR | Tailwind v4, English only | French-primary staff get English-only screens |

Conflicting decisions: FNC 0046 (stay separate) · FSM master spec (replace Camelo; FNC Landing is built on it) · "all staff are employees" vs the contractor lead owner in P3-E40.

## Three ways to merge

| | A. Link, don't merge | B. One repo, one project, Camelo phased out ★ | C. Rebuild FNC Landing inside Fresh Nest |
| --- | --- | --- | --- |
| What it is | Keep two apps; shared menu, links, `reports.freshnestco.ca` | Move `blurb` in as `apps/ops` + its function; data and secrets into `freshnest-aa51e`; swap Camelo reads for own data report by report | Freeze FNC Landing; rebuild its reports as FSM waves land; retire at cutover |
| One sign-in / roles | No | Yes | At the end |
| Duplicate features stop | No | Yes, from the move | After the rebuild |
| Risk to payroll/invoicing | Grows with each Camelo-bound feature | Medium during the move, controlled by side-by-side checks | High: rewritten while in use |
| Effort | Days | 2–3 sprints, then part of FSM waves | Months of duplicated build |

**Why B over C:** FNC Landing already holds the hard-won parts (payroll hours as the pay record, the QuickBooks export, approval rules, overtime warnings, tests against a pretend Camelo). B changes where its data comes from, not what it computes.

## Recommended target

One Firebase project (`freshnest-aa51e`) and one repo hold four apps — Website, Admin portal (`apps/customer`), Ops hub (`apps/ops`, FNC Landing's five hubs), Staff app (`apps/fsm`, the only cleaner app, EN/FR) — over one sign-in, shared code and design, and Cloud Functions including the ops API. Data domains, each with one home: leads & bookings · clients & prices · schedule & visits · time, pay & invoices. Camelo feeds schedule and time until the cutover gate.

## Migration roadmap

| Phase | Content | Size | Gate to pass before the next |
| --- | --- | --- | --- |
| 0. Decide and freeze | Approve B; record reversal of FNC 0046; freeze new Camelo-bound FNC features; P3-E40 is the one pipeline | Days | Owner signs off B and the decisions below |
| 1. Move FNC Landing in | `apps/ops` + API into `fresh_nest`; data, photos, secrets copied; Owner/Manager sign-in; `ops.freshnestco.ca`; one pay period side by side | 2–3 sprints | Payroll hours and invoices match the old site to the cent |
| 2. One client, one cleaner app | Client/site records with Camelo IDs; prices onto them; My week + clock-in into staff app EN/FR; won lead → client | FSM wave 1 | Every cleaner on the staff app; fnc-reports switched off |
| 3. Replace Camelo | Schedule then time from own data, report by report; nightly parity | FSM waves 2–3 | Two pay weeks match Camelo (cutover gate); Camelo retired |

Phase 1 would be its own epic (AGY gate) with an ADR for the ops app's stack (Tailwind v4, HTTP API) inside the monorepo. W0-6 and P3-E40 can proceed in parallel.

## Decisions needed

- [ ] Approve option B (reverses FNC decision 0046)
- [ ] One sales pipeline: P3-E40; retire FNC `lead-tracking-spec.md`
- [ ] Freeze new Camelo-dependent FNC features until the move is done
- [ ] Cleaners keep FNC My week until cutover; the staff app takes it over
- [ ] One price record per client in Fresh Nest; `scheduleClientRates` moves into it
- [ ] Tailwind v4 in `apps/ops`: recorded exception, or convert to v3
- [ ] French: office screens may stay English; cleaner screens need French
- [ ] Contractors vs "all staff are employees"

## Risks

| Risk | Mitigation |
| --- | --- |
| Payroll or invoicing breaks | Move at a pay-period boundary; run both for a full period; must match to the cent |
| Cleaners locked out | Encrypted Camelo tokens can't be copied without the key: plan one re-sign-in; keep fnc-reports running meanwhile |
| Photos lost | Copy bucket + records, check counts, keep the 1-year rule |
| Deploy habits clash | Keep a manual deploy gate for the ops function at first |
| Two rule sets | One `CLAUDE.md` / AGY gate; FNC decisions kept as read-only history in `docs/decisions/fnc/` |
| Camelo request limits | Only one app reads Camelo after the move; keep the 60-second cache |
| Real data in a test-data project | Agreed in advance; backups (W0-5) and audit (P3-E37) cover it from day one |
