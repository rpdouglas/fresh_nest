# Fresh Nest FSM: Master Specification and Gap-Analysis Baseline

Version 1.1 · October 27, 2026 · Owner: Ryan Douglas, Fresh Nest Co., Cornwall, Ontario

This single file consolidates every plan produced for the Fresh Nest field service management (FSM) app. Copy it into the FSM repo (suggested path: `docs/projects/FSM_MASTER_SPEC.md`), then run the gap analysis in Part 0 to learn what the current app already does and what remains.

Target stack: React 19, TypeScript (strict), Vite, Tailwind v3, Firebase (Auth, Firestore, Cloud Functions, Storage, Hosting), TanStack Query. Wave remains the system for invoices, HST and books.

## Contents

| Part | ID prefix | Title | Covers |
| --- | --- | --- | --- |
| 0 | n/a | Gap-analysis protocol | How to compare the repo with this spec |
| 1 | MP | Master Project Plan | Product map, waves, decisions, Camelo cutover gate, risks, compliance register. |
| 2 | SCH | Scheduling Module Plan | Jobs, assignments, recurrence, drive-time validation, Fit it for me, multi-cleaner changes. |
| 3 | CE | Clients and Employees Modules Plan | Clients, contacts, payers, sites, attachments, employee profiles, roles, onboarding. |
| 4 | AGR | Agreements (Contracts) Module Plan | Client and team agreements, templates, signing, alerts, retention. |
| 5 | AVL | Employee Availability, Time Off and Job Swaps Plan | Preferences, time-off requests, hand-offs and trades, notifications, Ontario notes. |
| 6 | CRW | Crew Job Execution Plan | Installable crew app, visit lifecycle, check-in/out, task lists, photos, incidents, offline. |
| 7 | PRC | Visit Pricing and Billing Rules | Averaged-hours rule at $37.50, pricing methods, Wave invoice bridge, test cases. |
| 8 | REV | Module Review and Gap Analysis (market review and decisions) | Market comparison, ranked gaps, Q&A decisions of Oct 26 2026. |

Source of truth: where two parts disagree, **Part 7 (Visit Pricing and Billing Rules)** wins on money, **Part 2 (Scheduling)** wins on scheduling behaviour, and **Part 1 (Master Plan)** wins on sequencing and decisions. Open-question lists (unticked `[ ]` items) are undecided, not requirements.

---

## Part 0. Gap-analysis protocol

**Purpose.** Compare the existing FSM repo with this specification and produce a prioritised list of what is Done, Partial, Missing or Different.

### 0.1 Requirement IDs

Every requirement is identified as `<PREFIX>-S<section>[.<n>]`, where PREFIX is the part's ID prefix from the contents table and the section number comes from that part's numbered `##` headings (these appear as `###` in this file because headings are demoted one level). Example: `SCH-S6` is Scheduling, section 6 "Drive-time validation". Within a section, number each distinct rule, table row or "must" statement in reading order (`SCH-S6.1`, `SCH-S6.2`, ...). Validator codes, data-model records, screens, Cloud Functions, security rules, tests and build stages each count as separate requirements.

### 0.2 Status values

| Status | Meaning |
| --- | --- |
| Done | Implemented and reachable in the app; behaviour matches the spec; evidence cited |
| Partial | Some of it exists; say exactly what is missing |
| Different | Implemented, but behaves differently from the spec; say how |
| Missing | No implementation found after searching routes, components, hooks, functions and rules |
| N/A | Deliberately out of scope for the current wave (cite the wave in Part 1) |
| Unclear | Cannot be decided from the code; say what question would settle it |

### 0.3 Evidence rules

1. Every Done, Partial or Different row cites at least one file path with a line range or symbol name (route, component, hook, Cloud Function, Firestore rule, test).
2. Do not mark Done from a file name alone. Open the code and confirm behaviour, including the server-side check where the spec requires one (for example schedule writes going through Cloud Functions, not direct client writes).
3. Check four layers for each feature: data model and types, security rules and functions, UI, tests.
4. Search under other names before declaring Missing (the spec says "job", the repo may say "appointment" or "visit"; "agreement" may be "contract").
5. Money, minutes and time zones are high-risk. Verify integer cents, integer minutes, UTC plus site IANA zone, and the rounding rule in PRC-S3 against real code, and run or write the six worked cases in PRC-S4.
6. Never edit application code during the analysis. The deliverable is a report.

### 0.4 Output

Write `docs/gap-analysis/GAP_ANALYSIS_<date>.md` containing:

1. **Summary**: counts by status per part, and the five largest gaps.
2. **Matrix**: one table per part with columns `ID | Requirement (short) | Status | Evidence | Gap / notes | Wave | Size (S/M/L)`.
3. **Divergences**: places where the repo made a better or different choice than the spec, for the owner to decide.
4. **Risks**: anything in the repo that conflicts with a decision (for example client-side schedule writes, decimal-dollar money, local-time storage).
5. **Proposed backlog**: ordered by wave (Part 1), each item referencing requirement IDs, with dependencies and exit criteria taken from the spec's build tables.
6. **Questions for the owner**: unresolved items from the spec's open-question lists that block work.

### 0.5 Suggested prompt for Claude Code

> Read `docs/projects/FSM_MASTER_SPEC.md`, starting with Part 0. Then audit this repository against Parts 1 to 8 following the protocol exactly. Work one part at a time. For each part, list the routes, components, hooks, types, Firestore collections, security rules, Cloud Functions and tests you inspected. Produce `docs/gap-analysis/GAP_ANALYSIS_<today>.md` in the format in section 0.4. Do not change application code. Where the spec and the repo disagree, record both and let me decide. End with the proposed backlog grouped by wave and a list of questions for me.

Run it in this order for best results: Part 1 (to learn the waves), Part 3 (data foundations), Part 2, Part 4, Part 5, Part 6, Part 7, Part 8.

### 0.6 Decisions that are settled (do not re-litigate during the audit)

| Topic | Decision |
| --- | --- |
| Camelo | Run alongside, then replace; cutover gate at end of wave 3 |
| Invoicing | Wave stays the system for invoices, HST and books; the app calculates and pushes per-visit invoices |
| Rate | $37.50 per cleaner-hour; billing from the average of cleaners' on-site minutes, rounded once to the nearest 15 minutes |
| Crew app | Installable web app (PWA), one build for iPhone and Android |
| Location | Captured at check-in and check-out only |
| Booking | Website request form that the office prices and confirms; no instant online pricing |
| Launch order | Recurring home cleaning, then move in/out, then rentals/commercial, then senior downsizing |
| Job titles | Set per assignment, defaulting from the employee profile |
| Multi-cleaner changes | Always ask "Everyone on this job" or "Only these people" |
| Owner snapshot | Thin one-page dashboard in wave 3 (MP owner snapshot); full reports stay in wave 4 |
| AI | Drafting only (messages, draft quotes, visit summaries) in wave 4, always approved by a person; no AI scheduling, pricing or invoicing |
| Client portal | Stays in wave 5 (reviewed again Oct 27 and left there) |

---

## Part 1. Master Project Plan

*ID prefix: `MP`*

### 1. Summary

Fresh Nest Co. will replace Camelo with its own field service app, built on Firebase and delivered in five waves. Each wave leaves the business with something usable, and the Camelo cutover happens at the end of wave 3, once a normal week runs end to end in the new app.

**What the app is.** A scheduling-centred system for a bilingual residential cleaning and organizing business in Cornwall, Akwesasne and Snye: clients with several sites each, titled crews on every job, recurring and one-time work, drive-time checks between jobs, a crew phone app for check-in and checklists, time capture that feeds weekly pay, agreements and renewals, and per-visit invoicing through Wave.

**What makes it worth building rather than buying.** The leading cleaning apps cover booking, invoices and checklists, but handle drive-time validation, travel-time pay, French operation, photo evidence of found or damaged items, and territory and cross-border routes poorly. Those are the parts we build ourselves; payments, accounting and messaging are integrated, not rebuilt.

**The plan in one table**

| Wave | What ships | What it unlocks |
| --- | --- | --- |
| 0 | Platform and delivery foundations | Safe environments, roles, audit, backups, shared design system |
| 1 | Employees, Clients and sites, Agreements tracking, availability and time off | People, places and terms live in the app |
| 2 | Scheduling core, Camelo import, swaps | Jobs, titled crews, task lists, drive-time checks, Fit it for me, recurring series, parallel run |
| 3 | Crew job execution, time and payroll link, client communications | A full week without Camelo; owner snapshot page; cutover gate |
| 4 | Wave billing bridge, quotes and leads, AI drafting, quality and incidents, reports, compliance records | Invoicing from the app; new-client intake; insight |
| 5 | Project and downsizing tools, client portal, fleet and supplies, reviews and marketing, rental turnover | Growth and convenience |

**Where this document fits.** This is the single master plan. Six detailed documents sit beneath it (listed in the appendix); this document holds the decisions, the order of work and the rules every module shares. Where the two differ, this plan wins and the detail plan should be updated.

### 2. Goals, users and success measures

**Goals**

1. Replace Camelo with an app that runs a normal week end to end.
2. Protect margin by checking drive time before a job is booked, and by capturing real drive time afterwards.
3. Pay people accurately from recorded hours, with a switch for paid drive time later.
4. Keep clients and staff informed in English and French.
5. Prove the work: checklists, notes, and photos of damage and found items.
6. Make recurring work reliable and one-time work easy to fit around it.
7. Leave room for the service lines you want to add: move in or out, rentals, commercial, and senior downsizing last.

**Users**

| User | What they need from the app |
| --- | --- |
| Owner | Every record, policy settings, approval of hours and visits, overrides, reports |
| Manager or scheduler | Book, move and staff jobs; approve time off and swaps; review visits |
| Crew (Lead, Cleaner, Trainee) | Today's jobs, check-in, checklist, photos, requests, a clear schedule |
| Payroll person | Approved weekly hours only |
| Clients | Reminders and messages now; a portal later |

**Success measures** (targets are proposals; set baselines during the parallel run)

| Measure | How it is measured | Proposed target |
| --- | --- | --- |
| Schedule parity with Camelo | Nightly comparison report | Two consecutive weeks with no unexplained differences |
| Hours accuracy | Pay-week totals against a manual count | Within one minute per visit |
| Review speed | Time from finished to reviewed | Within one business day |
| Invoice lag | Time from approved to invoiced in Wave | Within one business day |
| Drive-time problems caught | Shortfalls flagged before save, and late arrivals blamed on drive time | Late arrivals fall against the Camelo baseline |
| Missed agreement deadlines | Notice deadlines passed without action | Zero |
| Crew adoption | Active crew checking in through the app | All active crew within two weeks of the pilot |
| Office time on scheduling | Hours a week, self-reported | Lower than today |

### 3. Decisions register

Everything you have decided so far, in one place. Items marked proposed are defaults I suggested that you have not yet confirmed.

**Decided**

| Area | Decision |
| --- | --- |
| Camelo | Run alongside, then replace. Camelo handles scheduling plus payroll and time today, not invoicing |
| Job mix | Recurring and one-time work are both first-class |
| Drive-time shortfall | Warn; a manager may override with a reason; the app offers to shift the job and any later jobs to make it fit |
| Job titles | Chosen per assignment, defaulting from the employee's profile |
| Pay | Weekly; drive time unpaid now, with a data-driven switch for paid drive time later |
| Crew app | Installable web app, one build for iPhone and Android |
| Location | Recorded at check-in and check-out only |
| Photos | Required for damage and found items; before-and-after supported where a service or client turns it on; other photos optional |
| Client contact | Reminders and messages first; client portal later |
| Booking | Website request form that you price and confirm; no instant online pricing |
| Launch order | Recurring home cleaning, then move in or out, then rentals or commercial, then senior downsizing |
| Invoicing | Per visit, in Wave, which stays the system for invoices, HST and books |
| Payments | Interac e-Transfer and cash or cheque, marked paid by hand; no card processor early |
| Tax and accounts | HST-registered; paid Wave account |
| Naming | Agreements for contracts; job swap and hand-off for what other tools call shift swaps |
| Data you will not keep in the app | SIN, banking details, medical details, licence numbers; alarm and key codes only in a restricted record |
| Task lists | Saved lists and one-off lists can be attached to a job, a recurring series, a site or a service, and new lists can be built while scheduling and saved to the library |
| Changing a multi-person job | When a visit has several cleaners, any change that could differ by person asks whether it applies to everyone or only selected people; recurring visits also ask which visits |
| Visit pricing | $37.50 per cleaner-hour on actual time: each cleaner's minutes are added and divided by the number of cleaners, the average is rounded to the nearest 15 minutes and multiplied back, no minimum charge, plus 13% HST. Each client's agreement picks hourly actual, flat price plus extras, or hourly with an estimate cap |

**Proposed defaults awaiting your confirmation**

| Setting | Proposed value |
| --- | --- |
| Base buffer between jobs | 10 minutes, plus service and site adjustments |
| Fit it for me move cap | About six jobs moved before suggesting another fix |
| Undo window for applied changes | 15 minutes |
| Recurring jobs generated ahead | Eight weeks; the next seven days frozen against silent series changes |
| Vacation notice | 14 days |
| Staff off on one day | At most 2 |
| Swap minimum notice | 12 hours; monthly swap limit to be set |
| Agreement alerts | 60, 30 and 7 days before the notice deadline |
| Check-in flagged if farther than | 250 metres from the site |
| Routine photo retention | 90 days |
| Client agreement retention | 7 years after the agreement ends |

### 4. Product map

The schedule is the hub. People and places feed it, the field and money modules grow out of it, and insight sits on top. Each box shows the delivery wave it ships in.

> *Diagram in the original document (not included in this Markdown): product map · 17 modules by wave and status.*

Six modules have full plans, four are outlined in this document, and seven are described only as later work.

| Module | Wave | Detail document | Purpose |
| --- | --- | --- | --- |
| Platform and delivery | 0 | Outlined here (section 5) | Environments, roles, audit, notifications shell, backups, migration, design system |
| Employees | 1 | Clients and Employees Modules Plan | Profiles, titles, skills, driver eligibility, accounts and roles |
| Clients and sites | 1 | Clients and Employees Modules Plan | Clients, contacts, payers, sites, attachments, preferences |
| Agreements | 1 | Contracts Module Plan | Service and team agreements, renewal alerts, templates, signing |
| Scheduling | 2 | Scheduling Module Plan | Jobs, titled crews, recurring series, drive-time validation, Fit it for me |
| Employee self-service | 2 | Availability, Time Off and Shift Swaps Plan | Preferred hours, time off, job swaps and hand-offs |
| Crew job execution | 3 | Crew Job Execution Plan | Check-in, checklists, photos, incidents, office review |
| Time and payroll link | 3 | Crew Job Execution Plan, section 7 | Hours from visit events into the timesheet portal and weekly export |
| Communications | 3 | Outlined here (section 6) | Client reminders and messages, staff alerts, one notify function |
| Wave billing | 4 | Outlined here (section 6) | Per-visit invoices pushed to Wave; unpaid tracking |
| Quotes and leads | 4 | Not yet planned | Website request form, price book, quote approval |
| Quality and incidents | 4 | Crew Job Execution Plan, section 6, then a Quality plan | Scored inspections, complaints, claims |
| Reports | 4 | Not yet planned | Revenue, retention, job profitability, drive-time cost |
| Compliance records | 4 | Not yet planned | Insurance certificates, WSIB status, background checks, training |
| Project work | 5 | Not yet planned | Multi-day downsizing and organizing projects |
| Client portal | 5 | Not yet planned | View visits, rebook, pay, sign |
| Fleet and supplies | 5 | Not yet planned | Vehicle sign-out, supplies stock |

### 5. Shared architecture and rules

Every module follows the same stack and the same rules, so a developer or Claude Code session working on one module can rely on how the others behave.

**Stack**

| Layer | Choice |
| --- | --- |
| Front end | React 19, TypeScript strict, Vite, Tailwind CSS v3, TanStack Query |
| Back end | Firebase: Authentication with role claims, Firestore, Cloud Functions, Cloud Storage, Hosting, scheduled functions |
| Repository | One monorepo with npm workspaces: an office app, an installable crew app, and shared packages for scheduling logic, data schemas, translations and design system (proposed layout) |
| Maps | Google geocoding and routes, called only from server functions |
| Messaging | One provider for text and email behind a single notify function |
| Accounting | Wave through its API, behind an invoice-provider interface |
| Build tool | Claude Code, driven by the spec documents described in section 11 |

**Rules every module follows**

1. **Server-checked writes.** Anything that changes a booking, a price, hours or pay goes through a Cloud Function that runs the shared validator. Direct client writes are limited to low-risk fields.
2. **One scheduling-core package.** Recurrence, drive-time checks, availability resolution and Fit it for me live in one pure TypeScript package used by the web apps for instant feedback and by functions for the final check.
3. **Time.** Instants are stored in UTC with the site's time zone (America/Toronto). Recurrence and buffers use local wall time, so the clock change on November 1 never moves a 9:00 visit.
4. **Facts are append-only.** Time events, incidents, audit entries and agreement versions are added, never edited in place. Corrections create a new record that keeps the original and the reason.
5. **Archive, do not delete.** Records with history are archived. Retention jobs flag records for review; they never delete time or pay records.
6. **One notify function.** Staff alerts and client messages share one engine with templates, language, quiet hours, consent and a delivery log.
7. **Bilingual by design.** Interface text lives in translation files; content staff or clients read (checklist items, templates, messages) is stored in English and French.
8. **Restricted data in its own place.** Access codes, pay terms and private employee details live in restricted records with narrower rules than the main document.
9. **Camelo IDs on everything imported**, so imports are repeatable and never duplicate.
10. **Money is integer cents** with the tax amount stored beside it.
11. **Cost guards.** Budgets and alerts on maps, text messages and storage from the first day.
12. **Everything audited.** Who changed what and when, with before and after values for fields that matter.

**How the data connects**

| From | To | Relationship |
| --- | --- | --- |
| Client | Sites | One client, many sites |
| Site | Attachments, checklist overlay | Many attachments; one overlay |
| Client or employee | Agreements | Many versions per agreement |
| Agreement (recurring) | Series | Activating creates the series |
| Series | Jobs | Generates dated jobs about eight weeks ahead |
| Job | Assignments | One per employee, each with a title |
| Job | Time events, checklist, incidents, photos, adjustments | Append-only execution record |
| Job | Wave invoice | One invoice per approved visit |
| Employee | Availability, time off, swaps, agreement versions | Self-service and pay terms |

### 6. Module plans in brief

Each entry gives what the module does, its key rules and its exit test. The detail documents hold the screens, fields and tests; the three outlined modules (Platform, Communications, Wave billing) are specified more fully here because they have no separate document yet.

#### Platform and delivery (wave 0, outlined)

- Three Firebase environments (development, staging, production), emulator-based tests in continuous integration, building on your existing Codespaces and pipeline setup.
- Authentication with role claims (Owner, Manager, Employee, Payroll), a single settings record with versioned history, an audit log, and archive-not-delete everywhere.
- Design system components in the Fresh Nest tokens: tables, forms, drawers, status chips, bilingual strings.
- Scheduled Firestore exports, a rehearsed restore, error monitoring, budgets and alerts on maps, texts and storage.
- Feature flags so a pilot crew can use a module before everyone does.
- Migration scripts and the cutover runbook (section 8).
- Exit test: two users with different roles see different data, every change is audited, and a backup is restored into a clean environment.

#### Employees (wave 1)

- Profiles, titles and skills admin, driver eligibility from the vehicle use agreement (approval flag, signing date, licence expiry; no licence number), onboarding checklist, invitation to one shared login with the timesheet portal.
- Pay and private details are owner-only.
- Exit test: add an employee, set availability, approve time off, and confirm a manager cannot see pay fields.

#### Clients and sites (wave 1)

- Clients with contacts, a separate payer, preferences (preferred and excluded staff, language, fixed times), and many sites each.
- A site needs coordinates before it can be booked, because drive-time checks depend on them. Attachments carry visibility (office or assigned crew) and expiry; access codes sit in a restricted record.
- Duplicate detection and merge; archive not delete; an import review screen for Camelo data.
- Exit test: a client with three sites and attachments, where crew cannot see office-only items.

#### Agreements (wave 1)

- Client service agreements and team agreements with versioned structured terms; the real deadline is the notice deadline, with alerts at 60, 30 and 7 days.
- Bilingual templates; signing starts as upload of a signed copy, then click-to-sign for standard residential agreements.
- Activating a recurring agreement creates the series in scheduling; ending it ends the series. Pay terms are versioned so past weeks never change.
- Exit test: a pay change takes effect on its date, and an ended agreement ends its series.

#### Scheduling (wave 2)

- One job record for one-time and recurring work; one assignment per employee, each with its own title. Recurring series generate about eight weeks of dated jobs; edits can apply to this visit, this and following, or all future.
- Drive time is checked per employee per day using, in order, a manual override table, cached road times, Google route lookups, and a flagged fallback estimate. A shortfall is a warning; a manager can override with a reason; Fit it for me previews a ripple that moves the job and any later jobs.
- Needs attention queue, board with drive legs shown as blocks, atomic apply with undo, Camelo import and parallel run. When a visit has several cleaners, any change asks whether it applies to everyone or only selected people: a one-person time change becomes a personal start or end, and a one-person date change splits the visit into a linked one.
- Exit test: the worked example (job ends 10:30, next starts 10:45, drive 18 minutes, buffer 10) reproduces a 13 minute shortfall and a correct ripple.

#### Employee self-service (wave 2)

- Preferred days and hours in four states, with approval needed only when availability is removed; time-off requests with Ontario-aware types and no medical detail; job swaps and hand-offs that are rule-checked before anyone is asked.
- Clean swaps can auto-approve; approving time off over booked jobs creates Needs attention items.
- Exit test: a hand-off that fails a drive-time check is never offered.

#### Crew job execution (wave 3)

- Installable web app with offline use: Today, job card, check-in and check-out, bilingual checklists, photos, incidents, running late, emergency alert.
- Office side: live view, exceptions queue, review with one-tap approval of clean visits, ready-to-invoice queue.
- Exit test: a week of visits produces hours within a minute per visit of a manual count, and 30 queued photos upload after reconnecting.

#### Task lists (waves 2 and 3, part of scheduling and crew execution)

- Reusable task lists in a library, attachable to one visit, a recurring series, a site or a service; several lists per visit appear as sections on the crew's checklist.
- Lists can be built on the fly in the job drawer by typing or pasting tasks, and saved to the library with one switch. Attaching copies the list, so later edits never change booked visits, and series lists update future visits only after confirmation.
- Tasks carry required, photo and minutes settings and English and French text; the scheduler warns when estimated task time exceeds the booked duration. A Lead can add a task on site if you allow it.
- Exit test: attach a saved list and a new on-the-fly list to a visit and to a series, save the new list to the library, and confirm an edit to the library list leaves the booked visit unchanged.

#### Time and payroll link (wave 3)

- Pay hours are arrived to finished per person; drive legs are stored with a paid flag; the app pre-fills the timesheet portal, you approve, and the payroll person sees the approved week.
- Corrections keep the original value and a reason; breaks, short-visit pay and weekly overtime are flagged for the payroll check.
- Exit test: two pay weeks match Camelo.

#### Communications (wave 3, outlined)

- One notify function sends push for staff, email, and text for client reminders and safety alerts, with bilingual templates, per-client channel and language settings, quiet hours, and a delivery log with failures visible.
- Client messages: appointment reminder, on-my-way, running late, reschedule and cancel confirmations. Replies to texts land in an office inbox attached to the client.
- Staff messages: new assignment, schedule change, swap requests, emergency alert (push and text).
- Consent and opt-out are recorded. Canada's anti-spam law treats commercial messages differently from service messages to existing clients, so confirm your wording and consent approach with an advisor before marketing messages are ever added.
- Exit test: a client receives a reminder in their language, their reply appears in the inbox, and a failed send is visible.

#### Owner snapshot (wave 3, added Oct 27)

A single page, not the full reports module. It uses data the earlier waves already capture, so it costs little and lets you judge the pilot weeks before cutover.

- Billed hours against booked hours, and billed hours against paid hours, per week.
- Drive minutes per cleaner-day, and drive time as a share of paid time.
- Revenue per paid cleaner-hour.
- Visits flagged for review, late arrivals, and visits not yet invoiced.
- Active recurring clients with no signed agreement.
- Exit test: each figure matches a hand calculation from one pilot week.

#### AI drafting (wave 4, added Oct 27)

AI is used only to draft text for a person to approve. It does not schedule, price, invoice or pay anyone; those stay with the tested rules.

- Client messages in English and French, drafted from the visit or request and sent only after approval.
- A draft quote created from a website request, using the price book, for you to edit and send.
- A short summary of a visit's notes, incidents and photos for the office review screen.
- Every draft shows that it is a draft, keeps the approver in the audit log, and works with the service switched off.
- Exit test: ten sample requests produce usable drafts, none is sent without a person approving it.

#### Wave billing (wave 4, outlined)

- Connect Wave once with the owner's login and store tokens on the server only. Confirm access with a test call, since you have a paid Wave account and Wave exposes a GraphQL API for customers, invoices and payments.
- Map clients to Wave customers (stored ID on the client), services to Wave products, and HST to the right tax setting.
- When a visit is approved, the app builds the invoice from the calculated visit amount (see the Visit Pricing and Billing Rules document), recorded add-ons and tax, with the visit ID as the reference, pushes it, and stores the Wave invoice ID. A repeated push never creates a second invoice.
- Failed pushes go to a retry queue with the reason visible; a manual export remains as a fallback.
- Payments received by e-Transfer or cash are marked paid in the app and recorded in Wave. An unpaid list shows visits invoiced but not paid, by client and age.
- A daily reconciliation lists visits approved but not invoiced and totals that differ between the app and Wave.
- Open check: whether Wave can send invoices in French. If not, French-speaking clients need an app-generated French invoice or cover note.
- Exit test: ten test visits create correct invoices, a retry does not duplicate, and totals reconcile.

#### Later modules (waves 4 and 5)

| Module | Starts when | Core idea |
| --- | --- | --- |
| Quotes and leads | Wave 3 is stable | Website request form you price by hand, a price book of services and add-ons, quote approval, conversion to a series or job |
| Quality and incidents | Crew execution is in use | Scored inspections, complaints, damage claims, corrective actions |
| Reports | Several months of data | Full reports: revenue, retention, job profitability including unpaid drive time, crew productivity (a thin owner snapshot ships earlier, in wave 3) |
| Compliance records | Employees and Agreements are live | Insurance certificates, WSIB status, background checks, training dates with expiry alerts |
| Project work | Senior downsizing is about to launch | Multi-day projects with phases, estimates, a donation and haul-away log, a family approver |
| Client portal | Communications and billing are stable | View visits, request changes, pay, sign agreements |
| Fleet and supplies | Crew execution is in use | Vehicle sign-out, odometer, fuel, damage, supplies stock |
| Reviews and marketing, rental turnover, integrations | On demand | Post-visit ratings, guest-calendar turnover, further integrations |

### 7. Delivery roadmap

Work runs in six waves with a gate between each. Waves are ordered by dependency, not dated; sizes below are relative (S, M, L) because the build pace depends on how many Claude Code sessions you run in parallel.

> *Diagram in the original document (not included in this Markdown): roadmap · 6 waves, 5 gates.*

The highlighted wave and diamond are the Camelo cutover: nothing is switched off until the gate criteria pass.

**Stages by wave** (codes refer to the detail documents)

| Wave | Stage | Delivers | Size | Exit criteria |
| --- | --- | --- | --- | --- |
| 0 | P1 Environments and access | Three environments, continuous integration, roles and claims, audit log, archive rules, settings record, design system basics | M | Two roles see different data and every change is audited |
| 0 | P2 Safety net | Backups and a rehearsed restore, error monitoring, cost budgets, feature flags | S | A backup is restored into a clean environment |
| 1 | Employees (stage B) | Profiles, titles, skills, availability record, driver eligibility, invites, onboarding | M | Add an employee; a manager cannot see pay fields |
| 1 | Clients and sites (stages C, D) | Clients, contacts, payers, sites with coordinates, attachments, preferences, duplicates | M | Client with three sites; crew cannot see office-only items |
| 1 | Agreements tracking (G1, G2) | Agreement records, upload of signed copies, notice-deadline alerts | M | Test agreement fires 60, 30 and 7 day alerts |
| 1 | Availability and time off (E1, E2) | Four-state availability, time-off requests, policy settings, team calendar | M | Adding availability applies at once; removing waits for approval |
| 2 | Scheduling core (phases 0 to 3) | Jobs, titled assignments, task list library and attach, board, overlap checks, drive-time engine, override logging | L | Worked drive-time example reproduces |
| 2 | Fit it for me (phase 4) and recurrence (phase 5) | Ripple proposals, atomic apply, undo, series, edit scopes, Needs attention | L | Eight weeks generate with no duplicates; undo restores |
| 2 | Camelo import and parallel run (Clients and Employees E, scheduling phase 6) | Repeatable import, review screen, nightly parity report | M | Re-running changes nothing; parity report running |
| 2 | Scheduler integration and swaps (E3 to E5) | Validator additions, hand-offs, pool, trades | M | Failing hand-off never offered |
| 3 | Crew job execution (C1 to C6) | Installable app, check-in and out, checklists, photos, incidents, office review, emergency alert | L | A day of clean visits approved in one tap |
| 3 | Time and payroll link (C2, C7) | Pre-filled timesheets, weekly export, learned drive times, owner snapshot page | M | Two pay weeks match Camelo; snapshot figures match a hand check |
| 3 | Communications (M1 to M3) | Notify function, client reminders, on-my-way, running late, two-way inbox, preferences and consent | M | Reminder arrives in the client's language; failed send visible |
| 3 | Agreements link-ups (G3 to G6) | Pay-term versions, templates, click-to-sign, series activation | M | Signing a bi-weekly agreement creates eight weeks of visits |
| 4 | Wave billing (B1 to B3) | Connect and mapping, per-visit push with retry, payments and unpaid list, reconciliation | M | Ten test visits invoice correctly; retry never duplicates |
| 4 | Quotes and leads, Quality, Reports, Compliance | Request form and price book; scored inspections and claims; business reports; insurance and training records | L | Each module's own exit tests |
| 5 | Project work, client portal, fleet and supplies, reviews, rental turnover | Growth and convenience | L | Planned when wave 4 closes |

**Critical path:** Platform, then Employees and Clients, then the scheduling core (it needs sites with coordinates and employees), then crew execution, then time capture, then communications, then cutover. **Can run alongside:** Agreements tracking and availability during wave 1, Communications M1 and Wave billing B1 (mapping and test call) during wave 2.

### 8. Camelo transition and cutover

The transition is a parallel run that ends in a controlled switch at the start of a pay week. Nothing in Camelo is turned off until the cutover gate has passed, and Camelo stays readable afterwards as the fallback.

**What moves, and when**

| Data | Imported in | Notes |
| --- | --- | --- |
| Employees and titles | Wave 1 | Matched by name and email; accounts invited after review |
| Clients, contacts, sites | Wave 1 | Addresses geocoded on import; sites without coordinates are held in a review list |
| Recurring patterns and shifts | Wave 2 | Free-text recurrences are the hard part; the review screen shows each pattern for confirmation |
| Time and payroll history | Not imported | Camelo remains the record for past pay; the app starts fresh at cutover |
| Documents and agreements | Wave 1 to 3 | Signed copies uploaded with dates entered during the catch-up |

The existing Camelo schedule report project (the Python repository you built to pull a week of shifts by client) is the starting point for extraction, so the first import needs no new Camelo access beyond what it already uses.

**Steps**

1. **Extract.** Read-only export of clients, sites, staff and schedules from Camelo.
2. **Clean and import.** A repeatable script writes to the new collections with Camelo IDs; problems go to a review list instead of being guessed at.
3. **Shadow.** Camelo stays the source of truth. The app mirrors it nightly and a parity report lists jobs, times or crews that differ.
4. **Pilot crew.** One crew uses check-in, checklists and time capture for two pay weeks while Camelo timesheets continue; totals are compared.
5. **Dry run.** The full cutover is rehearsed on a staging copy, including restoring a backup.
6. **Cutover.** At the start of a pay week: freeze Camelo edits, run the final import, turn on client reminders and crew check-in for everyone, and book new work only in the app.
7. **Fallback window.** Camelo stays available read-only for a period you choose (eight weeks is proposed), then a final archive export is taken and the account is cancelled.

**Cutover gate** (all must be true)

- Two consecutive weeks of schedule parity with no unexplained differences.
- Pilot pay weeks match Camelo.
- All active crew can install and use the app; a French quick-reference card exists.
- Client reminders are sending and failures are visible.
- Invoicing is agreed: manual in Wave until the bridge ships.
- A backup restore and a rollback to Camelo have both been rehearsed.

**Rollback.** If the first pay week does not reconcile, or the app is unusable in the field, crew revert to Camelo for that week, the cause is fixed, and the final import is repeated. The Camelo data stays untouched until the fallback window ends.

**Timing guidance.** Cut over at the start of a pay week so no week is split between systems, and avoid the week of a clock change or a public holiday. Give clients one short notice that their reminders will come from a new number or address.

**Things to confirm with Camelo:** what the API and export allow, whether recurring patterns export in a usable form, your contract end date and notice period, and the cost of keeping the account through the fallback window.

### 9. Compliance and privacy register

This register collects the legal and privacy points that shape the design. The sources are legal-information pages found by search, so this is a design guide and not legal advice; the review list at the end is what to put in front of a lawyer or accountant once.

| Topic | Point | Design effect | Basis |
| --- | --- | --- | --- |
| Employee records | Most records are kept three years after employment ends; agreements on excess hours or overtime averaging three years after the last day worked; payroll and tax records six years plus the current year | Time events, edits and agreements are never deleted by cleanup jobs; retention dates and review tasks on ended records | [Ontario guide](https://www.ontario.ca/document/your-guide-employment-standards-act/record-keeping), [HR Insider](https://hrinsider.ca/forums/topic/record-retention-requirements-and-privacy-legislation/) |
| Written employment information | Employers with 25 or more employees must give new hires written terms (pay period, pay day, expected hours); smaller employers are not bound but benefit from the same terms in an offer letter | Offer letter template with those fields | [Peninsula](https://www.peninsulacanada.ca/resource-hub/legislative-updates/mandatory-written-employment-statements-in-ontario-an-employer-s-guide/) |
| Electronic monitoring | Employers with 25 or more employees need a written policy, and GPS tracking counts. Smaller employers should still state what is recorded and why | A short statement in onboarding: location at check-in and check-out only, for time and attendance and safety | [Mathews Dinsdale](https://www.mondaq.com/canada/employee-rights-labour-relations/1218236/ontario-ministry-of-labour-updates-guidance-on-electronic-monitoring-policies) |
| Sick days | Three unpaid, job-protected days a year for most employees; no medical note may be required for them since October 28, 2024 | No note or diagnosis field; first three days never auto-declined | [St. Lawyers](https://stlawyers.ca/labour-employment-law-employees/sick-note-ontario/) |
| Long illness leave | Up to 27 weeks in 52 for eligible employees since June 19, 2025 | An owner-handled leave type with no medical detail in the app | [St. Lawyers](https://stlawyers.ca/blog-news/paid-sick-leave-in-ontario/) |
| Vacation | The employer decides timing; one or two week blocks unless the employee asks in writing for shorter periods; to be taken within 10 months of the entitlement year's end | Written request recorded for shorter periods; balances show the deadline | [Littler](https://littler.com/node/575571), [Global Workplace Insider](https://www.globalworkplaceinsider.com/2021/02/how-to-manage-vacation-when-there-is-nowhere-to-go/) |
| Overtime | Threshold is 44 hours a week | Weekly hours warnings and payroll export use 44 | [CUPE Ontario checklist](https://cupe.on.ca/wp-content/uploads/2018/03/Bill-148-Employment-Standards-Act-Check-List-.pdf) |
| Three-hour rule | An employee who regularly works more than three hours a day, reports for work and works under three is paid for three hours | Visits shorter than three hours, such as a client not home, are flagged for the pay check | [Achkar Law](https://achkarlaw.com/insights/ontario/three-hour-rule-minimum-call-in-pay/) |
| Schedule notice | One law firm notes the Act has no advance-notice rule for schedules or changes | Notice minimums are your own policy settings | [Levitt LLP](https://www.levittllp.com/?p=4293) |
| Reprisal | Employers may not penalize employees for exercising employment-standards rights | Decisions need reasons and are logged | [St. Lawyers](https://stlawyers.ca/blog-news/paid-sick-leave-in-ontario/) |
| Electronic signatures | Ontario's Electronic Commerce Act accepts them for most agreements, with exceptions such as wills and powers of attorney; parties must consent | Click-to-sign with a consent step and an audit page | [Siskinds](https://www.siskinds.com/?p=19329) |
| HST | Wave tracks sales tax on invoices and gives a sales tax report; filing remains yours | HST shown on every locked visit price; reconciliation against Wave | [Wealth North](https://wealthnorth.ca/taxes/self-employed/wave-accounting-review-canada/) |
| Client personal information | Treat the federal privacy principles as the baseline: purpose, limited collection, safeguards, access on request | Restricted access records, masked contact details for crew, no health details, audit of views | General practice; confirm |
| Photos in homes | Clients should know photos of finished work and incidents may be taken | Agreement clause; in-app camera only; retention job | General practice; confirm |
| Client messages | Canada's anti-spam law distinguishes commercial messages from service messages to existing clients | Consent and opt-out recorded; no marketing messages until reviewed | General knowledge; not researched here, confirm |
| Accommodation | Availability limits tied to religion, disability or family responsibilities may be accommodation matters | Time-off and availability screens route these to the owner, no reasons demanded | General knowledge; confirm |
| Employee or contractor | The classification has legal consequences | Team agreement types for each; lawyer reviews the templates | [Always Do Better](https://alwaysdobetterllc.com/house-cleaning-contract-template/) |

**Review list for a lawyer or accountant, once**

1. English and French client service agreement templates, including cancellation fee, liability cap and the photo clause.
2. Employment, contractor and policy templates, and whether any cleaner should be an employee rather than a contractor.
3. Click-to-sign consent wording and when a wet signature is still wise.
4. The monitoring statement, break and meal rules, sick-day counting for part days, and vacation policy.
5. HST and invoice content requirements, and the approach to client texts and email.
6. Retention periods for client agreements, photos and incident records.

### 10. Risks, open items and decisions needed

**Top risks**

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Trying to build everything at once | Stalled project, nothing usable | Six waves with gates; scheduling core and time capture are the only cutover-critical pieces |
| Pay errors after cutover | Staff trust and legal exposure | Two pilot pay weeks against Camelo, correction trail, owner approval stays in the timesheet portal |
| Map drive times wrong near bridges, the border, or in winter | False passes or false warnings | Manual override table for Cornwall Island, Akwesasne and Snye; learn real drive legs from check-ins |
| Camelo data is messy or hard to export | Slow or wrong migration | Review screen, parity report, parallel run, fallback window |
| Installed web app limits on iPhones (push, background sync, storage) | Missed alerts, unsynced photos | Visible send queue, daily-window caching, SMS for emergencies, store-app wrapper as a fallback |
| Crew adoption | Data gaps, double entry | Short onboarding, French quick card, pilot crew first, one tap per step |
| Ripple moves annoy clients | Complaints | Pinned times and client windows, notice list for confirmed jobs, least-disruptive option first |
| Wave API limits or no French invoices | Billing bridge slips | Test call and French check now; manual export fallback; invoice-provider interface |
| Privacy incident (photos, access codes) | Client trust and legal exposure | Restricted records, in-app camera, retention jobs, audit of views, assigned-crew-only access |
| Legal templates not reviewed | Unenforceable terms | One lawyer review before templates go live (section 9) |
| Running costs creep (maps, texts, storage) | Surprise bills | Budgets and alerts from day one; caching and daily-window offline sync |
| Recurrence and clock-change bugs | Wrong visit times | Shared tested module with November 1 fixtures; generation window of eight weeks |
| Loss of data or a bad deploy | Operational stop | Scheduled exports, rehearsed restore, three environments, feature flags |

**Decisions and checks that block work** (the full question lists remain in each detail document)

| Item | Who or what | Needed before |
| --- | --- | --- |
| Test call to Wave's API, and whether Wave can send French invoices | You, in Wave | Wave billing (start of wave 4); mapping work can begin in wave 2 |
| What Camelo's API and export allow, contract end date and notice period | You, with Camelo | Wave 1 import |
| Confirm the proposed defaults in section 3 | You | Wave 2 for scheduling values; each other setting before its module |
| Your standard, deep and move in or out task lists, and your service list with durations | You | Wave 2, for the task list library and the scheduler |
| Cornwall Island, Akwesasne and Snye travel times for the override table | You | Wave 2 |
| Whether any cleaners are contractors rather than employees | You, with a lawyer | Agreements templates in wave 1 |
| Who receives emergency alerts, and the second contact | You | Wave 3 |
| How many crew, which phones, and which crew pilots first | You | Wave 3 |
| Break handling and the vacation year start | You, with your payroll advisor | Waves 1 and 3 |
| Lawyer and accountant review of the list in section 9 | You | Before templates and client messages go live |

### 11. How to build it with Claude Code

This plan is written to be turned into specifications your Claude Code workflow can consume, following the docs-as-code pattern you use on other projects. Your earlier Fresh Nest planning already defined epics and a monorepo, so the first step is a mapping from these waves and stages onto those epics, so the two never drift apart.

**Proposed repository layout** (adjust to the existing monorepo)

| Path | Contents |
| --- | --- |
| apps/office | Office web app: board, clients, employees, agreements, review |
| apps/crew | Installable crew web app |
| packages/scheduling-core | Pure TypeScript: recurrence, availability resolution, drive-time validator, Fit it for me ripple, task list merge |
| packages/schemas | Shared types and validation for every collection |
| packages/i18n | English and French strings and checklist translation helpers |
| packages/ui | Design system components in the Fresh Nest tokens |
| functions | Cloud Functions: validators, apply-change, notify, Wave bridge, scheduled jobs |
| docs | ROADMAP, BACKLOG, ACTIVE\_CYCLE, decisions, policies, runbooks, and one spec per module under docs/projects |

**From plan to spec.** Each stage in section 7 becomes one spec file with the same headings: purpose, user stories, data model, rules, screens, functions, security rules, tests to write first, exit criteria, out of scope. The detail documents already hold most of that content. The decisions register (section 3) becomes docs/decisions, and the proposed defaults become a policies file that the app reads as settings.

**Working cycle for each stage**

1. Read the spec and the decisions register; list any gap as a question rather than guessing.
2. Write the tests first: validator and recurrence fixtures, security-rule tests for every role, offline and sync tests where relevant.
3. Build in vertical slices (data, function, screen), running emulator tests after each.
4. Run a review pass focused on security rules, bilingual strings and audit entries.
5. Update the spec, the backlog and the decisions register, then check the exit criteria.

**Good work to hand to parallel sessions** (each with its own files so they do not collide): the pure scheduling-core functions and their fixtures; security-rule tests; the Camelo import and parity report; translation files and checklist content; the design-system components.

**Definition of done for any stage**

- Unit, security-rule and critical end-to-end tests pass, including the clock-change fixtures.
- English and French strings exist for everything a person reads.
- Every change that matters writes an audit entry; archive rules are respected.
- Settings come from the policies file, not constants in code.
- The stage's exit criteria in section 7 are demonstrated to you on staging.
- Behind a feature flag until its gate passes; migrations and the runbook updated if data changed.

**First ten Claude Code sessions**

1. Monorepo scaffold, environments, continuous integration, emulator setup.
2. Authentication, role claims, base security rules, audit log.
3. Settings and policies store, translations framework, design system basics.
4. Employees, titles and skills, invitations.
5. Clients, contacts, preferences and the duplicate check.
6. Sites with geocoding, attachments and restricted access records.
7. Agreements records, structured terms and notice-deadline alerts.
8. Availability and time-off requests with the resolution function.
9. Scheduling-core: recurrence, drive-time validator, and their fixtures, with no screens.
10. Jobs, assignments with titles, task list library and attach, and the first board.

### 12. Appendix: detailed plans and sources

**Detail documents**

| Document | Covers | Notes |
| --- | --- | --- |
| [Fresh Nest FSM: Scheduling Module Plan](https://claude.ai/artifact/J2YprRay5z4oBtrBydegnU) | Jobs, assignments, recurrence, drive-time validation, Fit it for me, board, Camelo parallel run | Source of the scheduling phases 0 to 8; task lists added to the job drawer |
| [Fresh Nest FSM: Clients and Employees Modules Plan](https://claude.ai/artifact/7SVtk1U5mWLWf1k1mGfvYr) | Clients, sites, attachments, employees, roles, shared foundations | Stages A to F |
| [Fresh Nest FSM: Contracts Module Plan](https://claude.ai/artifact/RqjH6ihLgjeRPYxEFbADwW) | Agreements, templates, signing, renewals, retention | Stages G1 to G8 |
| [Fresh Nest FSM: Employee Availability, Time Off and Shift Swaps Plan](https://claude.ai/artifact/NTSFD2UhnUSXmALoZ7kyyP) | Preferences, time-off requests, job swaps | Stages E1 to E7 |
| [Fresh Nest FSM: Crew Job Execution Plan](https://claude.ai/artifact/KhLrzPuHvxB8TvwdKrhQZG) | Crew app, visit lifecycle, checklists and task lists, photos, incidents, time capture, office review | Stages C1 to C7; also holds the time and payroll link |
| [Fresh Nest FSM: Module Review and Gap Analysis](https://claude.ai/artifact/NspyxtwgyKAgYjwn9wFcmw) | Market review, gaps, decisions from your answers | Its build waves are superseded by section 7 here |
| Fresh Nest FSM: Visit Pricing and Billing Rules | Multi-cleaner hourly pricing, rounding, pricing methods per client, edge cases, Wave invoice rules | Stages B0 to B4. https://claude.ai/artifact/YSneTG4dpFY32MKdCLTLcJ |

**How the detail documents map to waves**

| Detail stages | Wave |
| --- | --- |
| Clients and Employees stage A; Platform P1 and P2 | 0 |
| Clients and Employees stages B to D; Agreements G1 and G2; Self-service E1 and E2 | 1 |
| Scheduling phases 0 to 6 (including task list library and attach); Clients and Employees stage E; Self-service E3 to E5 | 2 |
| Crew C1 to C7; Communications M1 to M3; Agreements G3 to G6; Scheduling phases 7 and 8; Self-service E6 | 3 |
| Wave billing B1 to B3; quotes, quality, reports, compliance; Self-service E7; Agreements G7 | 4 |
| Later modules | 5 |
| Visit pricing B0 and B1; B2; B3 and B4 | 2; 3; 4 |

**Where this plan overrides a detail document.** Billing is a bridge to Wave and not a built invoicing module; the client portal and project work are later; instant online pricing is dropped; time capture is cutover-critical. Wherever a detail document says otherwise, section 3 here is the authority.

**Sources.** External sources are cited beside the claims they support in this document and in the detail documents, mostly vendor pages, legal-information pages and help articles found by search. They describe practice and are not legal advice.

---

## Part 2. Scheduling Module Plan

*ID prefix: `SCH`*

### 1. Goals and decisions

The module lets a scheduler book any client at any site on any day and time, put a titled crew on the job, and guarantee realistic drive time between each person's jobs.

| # | Your requirement | How this plan meets it |
| --- | --- | --- |
| 1 | Create a job for a client on any day and time | One job record serves one-time and recurring work; created from a board or drawer (sections 3, 4, 9) |
| 2 | Assign one or many employees, each with a job title | One assignment per employee per job; title defaults from the profile, overridable per job (section 5) |
| 3 | Clients have many sites; each site has more attached | Client → Sites → Attachments (section 3) |
| 4 | Validate drive time and enforce time between jobs | Per-employee check using cached road times plus buffers, with logged overrides (section 6) |

**Decisions already made**

| Topic | Decision |
| --- | --- |
| Camelo | Run alongside, then replace (section 10) |
| Job mix | Recurring and one-time are both first-class |
| Drive-time shortfall | Warn; a manager can override; the app also offers to shift the job and any later jobs to make it fit (sections 6, 7) |
| Job titles | Set per assignment, defaulting from the employee profile |

**Stack:** React, TypeScript, Firebase, as in your other builds. All scheduling logic lives in one shared TypeScript package used by both the web app (instant preview) and Cloud Functions (authoritative check).

**Assumption to confirm:** "more attached" to a site means attachments (access notes, photos, checklists, pets), not sub-locations such as units. See section 13.

### 2. How residential cleaning scheduling works

Residential cleaning schedules are a recurring backbone with one-time jobs fitted around it, and profit depends on how little time crews spend driving. These patterns come from vendor material and field-service guides (see Sources), so treat the figures as directional.

| Pattern in the industry | What it means for Fresh Nest |
| --- | --- |
| Recurring work is the core. One vendor claims about 75% of cleaning revenue is recurring contracts. | Model recurring series first; one-time jobs are the same record without a rule |
| Clients expect the same crew, day and time each visit, and tools that treat each visit as independent lose that consistency. | A series carries a crew template that copies onto every visit |
| Best practice is to lock recurring slots, then build one-time and deep-clean jobs around them. | The board shows recurring visits as anchored; new bookings search the gaps |
| Visits auto-generate from a cadence (weekly, bi-weekly, monthly). | Generate a rolling window of dated jobs, not infinite copies |
| Drive time is the main margin lever. Vendors claim 30–40% less driving from grouping jobs by area. | Check drive time at booking, and later suggest geographic groupings |
| Good field scheduling checks for overlaps, buffers and travel realism before a booking is confirmed. | Validate on every save, not as a nightly report |
| Buffers should vary by job type, not be one flat number. | Buffer = base + service + site adjustments |
| Reminders cut no-shows. | Phase 8: bilingual client and crew reminders |

Scale check: one guide describes a three-crew residential company as running roughly 45 to 70 appointments a week. That is tiny for Firestore, so the hard problem is correctness and usability, not performance.

**Design principles**

1. One source of truth per job; recurring visits are real documents, so edits, skips and swaps are simple.
2. Every schedule change goes through one validator, whether made by a person, a recurrence run or an import.
3. Warn and explain rather than silently block, except for true impossibilities such as one person in two places.
4. Always show how to fix a problem, not just that one exists.

### 3. Core data model

The model is a client → site → job chain, with assignments hanging off each job and drive legs computed between jobs. Times are stored as UTC instants plus the site's time zone (America/Toronto), so daylight saving changes (clocks go back Sunday, November 1, 2026) never shift a 9:00 visit.

| Collection | Purpose | Key fields |
| --- | --- | --- |
| clients | The paying customer | name, contact, billing, preferred language (EN/FR), status, preferred and excluded employees |
| sites | A service address; many per client | clientId, address, lat/lng and place ID, access instructions, default duration, time windows, parking/entry buffer, status |
| siteAttachments | Anything attached to a site | siteId, type (file, photo, note, checklist, access code, pet), visibility (office only or assigned crew), expiry |
| services | What is being done | name, default duration, default buffer, required titles (for example 1 Lead + 1 Cleaner), colour |
| titles | Job titles | Lead, Cleaner, Trainee, Organizer, Driver; managed list |
| employees | Staff profile | defaultTitleId, languages, skills, home or start location, weekly availability |
| timeOff | Unavailability | employeeId, date range, reason, approved flag |
| jobSeries | Recurrence rule and template | clientId, siteId, serviceId, rule, local start time, duration, crew template, effective from/to, status |
| jobs | One dated visit (the schedule) | clientId, siteId, seriesId?, startAt, endAt, localDate, status, assigneeIds\[\], rev, pinned flag, override log |
| jobs/{id}/assignments | Who does what | employeeId, titleId, optional personal start/end offset |
| driveLegs | Cached road time between two sites | fromSiteId, toSiteId, daypart, seconds, meters, source, computedAt |
| driveOverrides | Manual travel time for known pairs or zones | fromZone, toZone, minutes, note |
| schedulePolicy | One settings document | base buffer, traffic multipliers, workday window, who may override |
| scheduleChanges | Audit and undo log | batch ID, who, when, before/after, reason |

**Job status:** draft → scheduled → confirmed (client notified) → in progress → completed, with cancelled and skipped as exits. Only scheduled and confirmed jobs can move.

**Design notes**

- Denormalize for speed: jobs keep assigneeIds, localDate and a client/site name snapshot so the board loads with one query.
- Sensitive site data (alarm codes, key locations) lives in a restricted sub-document, shown only to office roles and to crew assigned that day.
- Every record keeps an externalIds.camelo field so imported data can be matched and re-imported safely.

### 4. Recurring schedules

A series stores the rule; a nightly job turns it into real dated job documents about eight weeks ahead. Each generated job remembers its series and its original date, so skips, moves and one-off edits stay traceable.

**Cadences supported**

| Cadence | Rule | Note |
| --- | --- | --- |
| Weekly, every 2 weeks, every 4 weeks | Fixed interval from an anchor date | Anchoring prevents drift; "every 4 weeks" differs from "monthly" |
| Monthly by weekday | For example, first Tuesday | Covers clients who book "first of the month" |
| Custom | Specific weekdays and interval | For example, Mon and Thu weekly |
| Seasonal pause | Pause between two dates | Cottage and snowbird clients |
| One-time | No rule | Same job record, no series |

**Editing scopes** (asked on every edit of a recurring visit)

| Choice | What happens |
| --- | --- |
| This visit only | Edits that job; the series is untouched |
| This and following | Splits the series at that date into two linked series |
| All future | Updates the series and every unlocked future job |
| Skip / cancel this visit | Marks it skipped with a reason; the series continues |

**Rules that keep it safe**

- Generation is idempotent: the job ID is the series ID plus the original date, so a re-run never duplicates.
- Jobs inside the next 7 days are frozen; series-level changes show a preview and need confirmation rather than rewriting them silently.
- Hand-edited jobs are flagged as exceptions and are never overwritten by a series change.
- Each generated job runs through the same validator as a manual one. A failure does not block generation; the job lands in a **Needs attention** queue (new drive-time conflict, employee on leave, site paused).
- Recurrence is computed in local wall-clock time using a tested library (rrule plus Luxon), with fixtures for the November 1 clock change and month-end edge cases.
- Crew template: the series' default assignments copy onto each new job, so the same crew keeps the same slot unless someone changes it.

### 5. Assigning employees and job titles

Each job has one assignment per employee, and each assignment carries its own job title. Adding a person pre-fills their profile title; the scheduler can change it for that job only, for example a Cleaner acting as Lead, or a Trainee shadowing.

**Assignment record:** employeeId, titleId, and an optional personal start or end offset (a trainee arriving 30 minutes later). Titles are a managed list, so adding "Organizer" or "Driver" needs no code change.

**Checks run when someone is added**

| Check | Result |
| --- | --- |
| Already on an overlapping job | Error: cannot save |
| On approved time off or outside weekly availability | Warning, overridable |
| Crew does not meet the service's required titles (for example no Lead) | Warning with the missing titles named |
| Client excluded this employee | Error; only the owner can override |
| Client prefers this employee or language (French) | Info badge, used to rank suggestions |
| Weekly hours approaching overtime | Info, then warning (Ontario's overtime threshold is 44 hours a week; confirm for your payroll) |

**Suggested crew:** when a job is created without staff, the app ranks available employees by same-client history, language, skill, spare capacity and lowest added drive time. The scheduler accepts or edits; nothing is auto-assigned without a click.

**Link to the timesheet portal:** assignments define scheduled hours. Later, clock-in and clock-out compare against them, giving scheduled-versus-actual variance for weekly pay.

#### Changing a job that has several cleaners

When a visit has two or more people, any change that could apply to one person or to all of them asks first, so nobody's day shifts by accident.

**The prompt.** It appears only when two or more people are assigned and the change can differ by person. It asks "Who does this change apply to?" with two choices: **Everyone on this job** (the default) or **Only these people**, with their names to pick. Underneath, a live preview lists each affected person, what changes for them, and any new warnings (drive time, overlaps, time off). For a recurring visit the same dialog also asks which visits: this visit only, this and following, or all future (section 4). A one-line summary confirms the choice, for example "Move Anna's start to 10:30, this visit only".

**What "only these people" means for each change**

| Change | Everyone | Only selected people |
| --- | --- | --- |
| Start or end time | The job window moves for all | A personal start or end for those people; the job window and everyone else are unchanged |
| Duration | The job length changes for all | The selected person leaves earlier or stays later |
| Date | The job moves to the new date | Those people are split off into a linked visit on the new date, with the same client, site, service and task lists; the original job keeps the others |
| Crew | Not applicable | Adding or removing a person is always per person; no prompt, except the series question for recurring visits |
| Title | Not applicable | Always per person |
| Cancel or skip | Cancels the visit for everyone | Removes only those people from the job and warns if staffing becomes short |
| Site, service, price, notes, access, task lists | Job-level, so applied to everyone with no prompt | Not available per person |

**Split visits.** A split visit is linked to its original and both show a split badge. By default the split visit is part of the original, with no separate price or invoice; the dialog lets you give it its own price instead. It copies the same task lists, which you can edit. Payroll and time capture work normally for each person. A split can be rejoined if the people are moved back to the same date.

**Checks and notices**

- The validator runs for each affected person using their effective times, so overlaps, drive time, availability and time off are checked per person.
- Fit it for me gains an option when one person has the shortfall: only that person arrives later, leaving the job time unchanged for everyone else (section 7).
- If the job requires a Lead or other title, the validator warns when nobody with that title is present for part of the visit because of personal start or end times.
- Notifications go only to the affected people and the manager. Others see "Anna arrives 10:30" on the job card.
- The client is told only when the first arrival or the finish moves beyond a set tolerance, or when their regular cleaner changes on a confirmed job.
- Pay always comes from recorded arrival and finish events; personal times are the plan they are compared with.

**On the board.** Each job bar contains a sub-bar per person. Dragging the job bar moves everyone; dragging a person's sub-bar or its end handle changes only that person, with no prompt because the intent is explicit.

**Camelo import.** A Camelo shift with several people imports as one job with personal times where they differ, so the parity report matches.

**Audit and undo.** The scope chosen (everyone or named people, and the series scope) is stored with the change and its undo restores each person's previous state.

**Data model changes**

| Record | Added |
| --- | --- |
| assignment | personalStart and personalEnd (empty by default), source of the change (manual, swap, ripple, import) |
| job | splitFromJobId, splitReason, priceHandling (included or separate) |
| scheduleChange | scope (everyone or a list of people) and seriesScope |

**Tests to write first:** a time change for everyone moves all personal windows consistently; a personal start for one person leaves others unchanged and validates only that person's drive time; a date change for one of three people creates a linked visit with no second invoice by default; removing the only Lead warns; a prompt does not appear for a one-person job; undo restores a personal start.

### 6. Drive-time validation

Validation runs per employee, per day: sort that person's jobs by start time and, for each consecutive pair, check that the gap covers the drive plus a buffer.

```latex
required = drive(A\to B,\ departure) \times traffic + buffer(A,B)
```

```latex
slack = start_B - end_A - required
```

Slack below zero is a shortfall. Buffer is the base minutes from the policy, plus the service adjustment (a deep clean needs longer to pack up), plus the site adjustment (parking, stairs, key pickup).

**Worked example**

| Item | Value |
| --- | --- |
| Job A ends | 10:30, Site X |
| Job B starts | 10:45, Site Y |
| Drive X → Y (cached, mid-morning) | 18 min |
| Traffic multiplier (off-peak) | ×1.0 |
| Buffer (base 10 min, no adjustments) | 10 min |
| Required gap | 28 min |
| Available gap | 15 min |
| Result | Shortfall of 13 min: warning, with fixes offered (section 7) |

**Where drive times come from** (first match wins)

| Priority | Source | Notes |
| --- | --- | --- |
| 1 | Manual override table | Zone or pair times you set by hand. Use this for Cornwall Island, Akwesasne and Snye, where bridge and border crossings make map estimates unreliable |
| 2 | Cached road time | Stored per site pair and time of day (peak or off-peak) after the first lookup |
| 3 | Google Routes, Compute Route Matrix | Traffic-aware times for many pairs in one call; Google documents up to 625 route elements per request and bills per element, so check the current price list. Called when a site is saved, then cached |
| 4 | Fallback estimate | Straight-line distance × 1.3 ÷ an average speed, flagged "estimated" so nobody trusts it blindly |

**Which legs are checked:** job to job on the same day for the same employee is mandatory. The first leg from the shop or home and the last leg back are optional, controlled by a policy switch.

**Where it runs:** the shared TypeScript package computes the check instantly in the browser from cached legs as the scheduler fills in the form. The same code runs again in a Cloud Function on save, and that result is the one that counts.

**Override:** a manager can save despite a drive-time warning by giving a reason. The job keeps a visible warning badge, and the override (who, when, why, shortfall minutes) is logged. Overlap of one person in two places is never overridable.

**Paid drive time later:** drive is currently unpaid, but you plan to pay it later. Each planned leg is therefore stored as its own record (employee, date, from, to, minutes, paid flag), so turning payment on is a policy change and not a data migration.

### 7. Fit it for me: auto-adjusting the schedule

When a save produces a drive-time shortfall, the dialog shows the problem and a **Fit it for me** button that previews exactly which jobs would move, including every later job the move pushes.

**Options the dialog offers**

| Option | What it does | When it is offered |
| --- | --- | --- |
| Shift this job later (ripple) | Moves this job to the earliest start that fits, then checks the next job for each assigned person and pushes it too, repeating down the day | If the client's latest allowed start is not exceeded |
| Move the earlier job earlier | Pulls the previous job's start forward by the shortfall | If that job is not pinned, confirmed or in progress |
| Swap in another employee | Lists free, compatible staff whose own drive time works | Always checked |
| Move to another day | Finds the next open slot for this crew | For one-time jobs and single visits |
| Save anyway (override) | Saves with a logged reason | Managers only |
| Only one person arrives later | Sets a later personal start for the person with the shortfall and leaves the job time unchanged for everyone else | When the job can start without them and any required title is still present |

**How the ripple works**

```text
queue = [job that violates]
while queue not empty and moves < MAX_MOVES:
    job = queue.pop()
    newStart = max over each assignee of (previousJob.end + required(prev -> job))
    if newStart > job.latestAllowedStart or newStart + duration > assignee.shiftEnd:
        fail this option (reason: which limit was hit)
    record move(job, oldStart, newStart)
    for each assignee of job:
        next = that person's next job today
        if next.start < newEnd + required(job -> next):
            queue.push(next)      # a later job gets pushed too
```

Because a job has several assignees, moving it can touch other people's days. The loop therefore follows every assignee, not just one.

**Hard limits the ripple respects**

- Client time windows and pinned (fixed-time) jobs never move without a manual decision.
- Jobs in progress or completed are immutable.
- Confirmed jobs can move, but the preview marks them "client must be told" and adds them to a notification list.
- The employee's workday end and approved time off.
- A cap of about six moved jobs; beyond that the app suggests swapping staff or changing the day instead.

**Ranking:** options are scored by jobs moved, total minutes shifted, confirmed jobs touched, overtime created and added drive time. The least disruptive appears first, labelled with its cost, for example "moves 2 jobs, 35 minutes total, 1 client to notify".

**Applying it:** one callable Cloud Function applies the whole proposal in a single transaction, checking each job's revision number so two schedulers cannot overwrite each other. The change is stored as one batch in the change log, giving a one-click **Undo** for the next 15 minutes.

### 8. Validation rules and the save flow

One validator returns a list of issues, each with a code, severity, the people and jobs involved, and a plain-language fix. Errors block the save; warnings need a decision; info is shown but never stops anyone.

| Code | Rule | Severity | Who can override |
| --- | --- | --- | --- |
| OVERLAP\_EMPLOYEE | Person is on two overlapping jobs | Error | No one |
| SITE\_INACTIVE | Site or client is paused or archived | Error | Owner |
| EXCLUDED\_EMPLOYEE | Client excluded this person | Error | Owner |
| DRIVE\_SHORT | Gap is less than drive plus buffer | Warning | Manager, with reason; Fit it for me offered |
| MIN\_GAP | Gap is less than the minimum between any two jobs | Warning | Manager |
| TIME\_OFF | Assigned during time off or outside availability | Warning | Manager |
| OUTSIDE\_WORKDAY | Job runs outside the policy workday | Warning | Manager |
| CLIENT\_WINDOW | Outside the client's allowed days or times | Warning | Manager, and flag to tell the client |
| STAFFING\_SHORT | Required titles missing (for example no Lead) | Warning | Manager |
| SITE\_DOUBLE\_BOOK | Two jobs at one site overlap | Warning | Manager |
| BORDER\_LEG | Route touches Cornwall Island or crosses the border | Warning | Manager |
| OVERTIME\_RISK | Weekly hours near the overtime threshold | Info, then warning | Manager |
| DRIVE\_ESTIMATED | Drive time is a fallback estimate, not a road lookup | Info | Not needed |
| TITLE\_GAP | A required title (for example Lead) is not present for part of the visit because of personal start or end times | Warning | Manager |

**Save flow:** the diagram below shows what happens when someone presses Save.

> *Diagram in the original document (not included in this Markdown): save flow · 2 decisions, 3 outcomes.*

Only errors stop a save outright. A drive-time warning opens a dialog where the scheduler can shift jobs with Fit it for me or override with a reason.

### 9. Screens and UX

The office side centres on a drag-and-drop board; the crew side is a simple, phone-first "My day". Both use the Fresh Nest design system (nest teal, clay accents, Fraunces and Jost).

| Screen | For | What it does |
| --- | --- | --- |
| Schedule board | Office | Day and week view with employees as rows and time across. Jobs are coloured by service. Hatched blocks show drive legs between jobs, turning amber or red when slack is short. Drag to move, drag the edge to resize. Side lanes: **Unassigned** and **Needs attention** |
| Job drawer | Office | Client, then Site (add a new site inline), Service, date and time (end time auto-fills from default duration), repeat, crew with titles, and task lists (attach saved lists or build one on the spot; see the Crew Job Execution Plan). A live validation panel updates as fields change and offers fixes |
| Fit-it preview | Office | Before and after list of every job a proposal moves, with clients to notify marked, and Apply or Cancel |
| Client page | Office | Contact, preferences, list of sites, series and history |
| Site page | Office | Address, access notes, attachments, default duration and buffer, visit history |
| Series manager | Office | All recurring schedules; pause, end, change crew, edit this and following |
| Staff availability | Office | Weekly availability and time off per employee |
| My day | Crew | Ordered jobs for today with the drive time between them, navigation links, access notes, checklist; works offline using Firestore's local cache |

**UX rules that matter**

- Validation feedback appears in the form, not after saving; the Save button explains what is blocking it.
- Every warning states the shortfall in minutes and a one-click fix.
- Dragging a job on the board shows a live ghost with green or red slack before you drop it.
- Overrides need a one-line reason, with quick picks such as "client agreed to wait".
- Everything on the board is also a keyboard-reachable list, for accessibility and for speed.

### 10. Integrations and the Camelo transition

The safest route off Camelo is a parallel run with a nightly comparison, ending in a cutover only when the two schedules match.

**Camelo: run alongside, then replace**

1. **Extract.** Reuse the Camelo API access from your schedule-report project to export clients, sites, shifts and recurring patterns as JSON.
2. **Import.** A re-runnable script maps them into the new collections, storing the Camelo ID on every record so a re-import updates instead of duplicating.
3. **Parallel run.** Camelo stays the source of truth while the FSM app mirrors it nightly. A parity report lists jobs, times or crews that differ.
4. **Flip.** Once two consecutive weeks show no unexplained differences, new bookings are made only in the FSM app and Camelo is set read-only.
5. **Retire.** Final import, archive the export, cancel Camelo.

Expect the import to surface messy data: missing site addresses, free-text recurrences, duplicate clients. Build an import review screen rather than fixing it by hand.

**Other connections**

| Integration | Plan | When |
| --- | --- | --- |
| Timesheet portal | Assignments become scheduled hours; clock-in compares to schedule; planned drive legs feed paid drive time when switched on | Phase 8 |
| Maps | Geocoding and address autocomplete on site entry; turn-by-turn link on My day | Phase 3 |
| Calendar feed | Read-only calendar (ICS) link per employee | Phase 7 |
| Reminders | Bilingual (English and French) SMS or email to clients and crew; notices when a confirmed job moves | Phase 8 |
| Vehicles | Optional vehicle on a job, tied to your vehicle sign-out sheet | Later |

### 11. Firebase architecture and security

The rule that keeps the schedule trustworthy is that the browser never writes schedule fields directly; every change goes through a Cloud Function that runs the validator.

| Piece | Role |
| --- | --- |
| scheduling-core (shared TypeScript package in the monorepo) | Pure functions: recurrence expansion, drive-time check, ripple proposals, ranking. No Firebase imports, so it is fast to unit test |
| Web app (React, TanStack Query) | Board, drawer, live preview using cached legs |
| validateSchedule (callable) | Authoritative check on save |
| proposeFit (callable) | Builds ranked fix options |
| applyScheduleChange (callable) | One transaction: re-validates, checks revision numbers, writes jobs, assignments and the change log |
| materializeSeries (scheduled nightly, also on series write) | Creates the next eight weeks of jobs |
| computeDriveLegs (on site create or move) | Geocodes, calls the route matrix, caches results |
| importCamelo (admin script) | Re-runnable import and parity report |

**Firestore indexes to plan from day one**

- jobs by assigneeIds (array-contains) and startAt, for My day and per-person checks
- jobs by localDate and status, for the board
- jobs by siteId and startAt, for site history and double-book checks
- jobs by seriesId and original date, for idempotent generation

**Security rules**

| Role | Access |
| --- | --- |
| Owner | Everything, including overriding any warning and editing policy |
| Scheduler / manager | Read and write through functions; override warnings; no policy or pay changes |
| Employee | Read own assigned jobs only; access codes only for jobs assigned today; no direct writes |
| Payroll | Read approved hours; no schedule or client access |

**Other notes**

- Direct client writes to startAt, endAt, assignments and status are denied in rules; the functions use the admin SDK.
- Each job has a rev counter; every write states the revision it was based on, so stale edits are rejected with a clear message.
- Time zone is stored per site. All checks convert to local wall time before comparing buffers or workday limits.
- Geocoding and route calls happen in functions only, so the API key never reaches the browser.

### 12. Phased build plan

Build order puts correctness first: a board with overlap checks, then drive time, then fixes, and only then recurrence at volume. Each phase is a spec-driven epic you can hand to Claude Code with its exit criteria.

| Phase | Delivers | Size | Exit criteria |
| --- | --- | --- | --- |
| 0. Foundations | scheduling-core package, collections, roles and rules, titles and services seed, time-zone handling | S | Unit tests green, including the November 1 clock change |
| 1. Clients, sites, attachments | Client and site screens, address autocomplete, attachments with visibility, restricted access data | M | Create a client with 3 sites and attachments; crew cannot see office-only items |
| 2. Jobs, assignments and board | Job drawer, one-to-many assignments with titles, day and week board, overlap and time-off checks | L | Book a 3-person job; overlap blocked; title per assignment saved |
| 3. Drive-time engine | Geocoding, route matrix and cache, override table, validation panel, override logging | L | The worked example in section 6 reproduces; stale and estimated legs flagged |
| 4. Fit it for me | Ripple proposals, ranked options, atomic apply, undo, notification list | L | A shortfall that pushes 2 later jobs previews and applies correctly; undo restores |
| 5. Recurring series | Cadences, nightly generation, edit scopes, series split, Needs attention queue | L | 8 weeks generate with no duplicates; "this and following" works across the clock change |
| 6. Camelo import and parallel run | Import, mapping review, nightly parity report | M | Two consecutive weeks with no unexplained differences, then cutover |
| 7. Crew experience | My day (offline), availability and time off, calendar feed | M | A crew member sees only own jobs and today's access codes |
| 8. Messaging and pay links | Bilingual reminders, moved-job notices, timesheet comparison, paid drive time switch | M | A confirmed job that moves sends one correct notice; paid drive flag changes pay totals |

**Test scenarios to write before the code**

1. Two jobs back to back in the same building: only the minimum gap applies.
2. Job ends 10:30, next starts 10:45, drive is 18 minutes: shortfall of 13 with buffer 10.
3. A 3-person job where one person has a later job that the ripple must also push.
4. Weekly series crossing November 1; the 9:00 visit stays at 9:00 local.
5. Every 4 weeks versus first Tuesday monthly for the same start date.
6. Edit "this and following", then skip one visit, then undo.
7. Two schedulers editing the same job: second save is rejected cleanly.
8. A route to Akwesasne with a manual override beats the map estimate.
9. Camelo import run twice creates no duplicates.

In your existing FSM master plan this should become one epic with phases 0 to 8 as stories; map them onto your numbering when you move it into docs/projects.

### 13. Risks and open questions

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Map drive times are wrong near bridges, the border or in winter | False passes or false warnings | Manual override table; later, compare planned legs with real clock-in gaps to tune |
| Ripple shifts annoy clients | Complaints, lost trust | Pinned times and client windows; confirmed jobs flagged for notice; least-disruptive option first |
| Recurrence bugs around clock changes and month ends | Wrong visit times | Pure tested module, fixture-based tests, rolling eight-week window |
| Camelo data is messy | Slow or wrong migration | Import review screen, parity report, parallel run |
| Routing API cost grows | Surprise bill | Cache by site pair and daypart; compute on site save only; budget alert |
| Building too much at once | Stalled project | Phased plan; Phase 3 and 4 are the first real value |

**Questions for you**

- [ ] "Each site should be able to have more attached": did you mean attachments (access codes, photos, checklists, pets), or sub-locations such as units or a cottage plus guest house? I assumed attachments.
- [ ] Do crews travel together in one vehicle or separately? This decides whether drive time is checked per person or per vehicle.
- [ ] Is a base buffer of 10 minutes between jobs right, and should the first leg from the shop or home and the last leg back count?
- [ ] Do clients have time windows ("anytime Tuesday") or fixed times ("9:00 sharp")? Fixed times become pinned jobs.
- [ ] Are job durations fixed per service and site, or estimated from size and then tuned from actuals?
- [ ] What is the normal workday window and the maximum hours per day per person?
- [ ] Besides you, who may override warnings or move confirmed jobs?
- [ ] When paid drive time arrives, will it apply to every leg or only to legs over a threshold?
- [ ] Which languages and channels for client reminders: English and French by SMS, email or both?
- [ ] Will you ever schedule work on the US side of Akwesasne, which needs the border flag and extra insurance checks?

**Sources** (vendor and guide pages found by search; figures are vendor claims, not independently verified)

- [SchedulingKit: cleaning services](https://schedulingkit.com/industries/cleaners) for recurring revenue share and route grouping
- [SchedulingKit: crews and routing](https://www.schedulingkit.com/automation/cleaning-services) for same crew, day and time expectations
- [Agiled: best scheduling software for cleaning](https://agiled.app/blog/best-scheduling-software-for-cleaning-business) for weekly appointment volume and drive-time cost
- [Fieldproxy: conflict detection](https://www.fieldproxy.ai/blog/how-to-eliminate-double-booking-and-scheduling-conflicts-in-field-serv-d1-14) for buffers and pre-confirmation checks
- [Google Routes: Compute Route Matrix](https://developers.google.com/maps/documentation/routes/compute-route-matrix-over) for element limits and traffic-aware times
- [Jobber community: recurring and new customers](https://community.getjobber.com/discussions/job-details-scheduling/scheduling-with-recurring-customers-and-new-customers-/2963) for how a company with about 215 recurring clients frames the problem

---

## Part 3. Clients and Employees Modules Plan

*ID prefix: `CE`*

### 1. Purpose and scope

These two modules hold the people and places the scheduler depends on, so they ship first: scheduling cannot book a job without a client, a site and an employee. They also own the data the scheduling plan already assumes (sites with coordinates and buffers, employees with titles and availability).

| Scheduling needs | Provided by |
| --- | --- |
| Client and site to book against, with address and coordinates for drive time | Clients module: sites |
| Site access notes, pets, checklists, time windows, default duration and buffer | Clients module: site attachments and settings |
| Client preferences: preferred or excluded staff, language, fixed times | Clients module: preferences |
| Employees with a default title, skills, languages, weekly availability, time off | Employees module |
| Who may create, move and override jobs | Shared roles and security |
| Matching records from Camelo | Shared import layer with Camelo IDs |

**In scope:** records, screens, permissions, search, import and audit for clients, sites, attachments and employees.

**Out of scope here:** invoicing and payment, quoting, payroll calculation (the timesheet portal owns hours and pay), and client-facing booking pages. Each leaves a hook, such as a bill-to field or a payroll link, so adding it later needs no rebuild.

### 2. Clients module: data model

The model separates three things that one person often plays at once: the client (who we deal with), the payer (who is billed) and the site (where we work). This keeps cases like a daughter paying for a parent's home, a realtor ordering a move-out clean, or a community program funding a visit from tangling the records.

| Record | Purpose | Key fields |
| --- | --- | --- |
| Client | The relationship | display name, type, status, preferred language (EN/FR), contacts, source, notes, tags |
| Contact | A person tied to a client or site | name, role (owner, family, tenant, property manager), phone, email, preferred channel, can-approve-changes flag |
| Payer | Who is billed | client reference or separate party, billing contact, terms; a placeholder for invoicing later |
| Site | A service address | address, coordinates and place ID, time zone, size (bedrooms, bathrooms, square feet), default duration and buffer, allowed days and times, parking and entry notes, status |
| Site attachment | Anything attached to a site | type, title, file or text, visibility (office only or assigned crew), expiry date |
| Preference | Rules the scheduler should respect | preferred employees, excluded employees, language, fixed or flexible times, products to avoid, pets |
| Referral source | Where the client came from | realtor, community program, past client, web; free text plus a list |

**Client types** (a dropdown that drives defaults and reporting): Residential recurring, Senior and downsizing, Move in or out, Short-term rental host, Realtor or property manager, Commercial, Community-funded. These mirror the service lines in your expansion report.

**Client status:** Lead, Active, Paused (seasonal), Former. A paused client or site cannot be booked, matching the SITE\_INACTIVE rule in the scheduling plan.

**Attachment types:** access instructions (key, lockbox, alarm), photo, document, checklist, note, pet, fragile or special-care item. Alarm codes and key locations go in a restricted sub-document shown to office roles and to crew assigned that day.

**Fields the scheduler reads directly:** site.latitude and longitude, site.timeZone, site.defaultDurationMin, site.bufferMin, site.allowedWindows, client.excludedEmployeeIds, client.language.

### 3. Clients module: screens, workflows and privacy

| Screen | What it does |
| --- | --- |
| Client list | Search by name, phone, address or tag; filters for type, status and language; quick add |
| Client detail | Contacts, preferences, sites, recurring series and visit history (read from scheduling once it exists), notes, activity log |
| Add client wizard | Name and type, then first contact, then first site with address autocomplete, then preferences. Saves a usable record after step 2 |
| Site detail | Address and map pin, size and defaults, allowed windows, attachments, visit history |
| Attachment manager | Upload photo or file, add note or checklist, set visibility and expiry; shows which items the crew will see |
| Duplicates and merge | Flags likely duplicate clients or sites (same phone or address) and merges records safely |
| Import review | Imported Camelo clients with problems flagged: missing address, no coordinates, duplicate |

**Key workflows**

1. **Address entry.** Autocomplete returns a place ID and coordinates, which are saved on the site. Without them, scheduling cannot compute drive time, so a site without coordinates shows an amber badge and cannot be booked.
2. **Pause and resume.** Pausing a client or site (for example, a snowbird away for winter) records dates and asks what to do with upcoming visits: skip, keep or cancel.
3. **Archive, not delete.** Clients with visit history are archived only, so history and audit records stay intact.
4. **Notes with attribution.** Every note shows who wrote it and when, and office-only notes never reach crew screens.

**Privacy and safety (Ontario)**

- Collect only what the work needs. Client data is personal information, so treat the Personal Information Protection and Electronic Documents Act (PIPEDA) principles as the baseline: purpose, limited collection, safeguards, access on request. Have the policy reviewed before launch.
- Alarm codes, key locations and lockbox codes are the highest-risk fields: restricted sub-document, shown only to office roles and to crew assigned that day, never in lists or exports.
- Add an expiry or review date on access items so stale codes are cleared.
- No health details. Record practical needs (stairs, mobility aids, pets, fragile items) rather than medical conditions.
- Phone numbers and addresses are masked in the list view for crew roles.

### 4. Employees module: data model

The employee record is split by sensitivity so the scheduler can see what it needs without exposing pay or personal details.

| Record | Visible to | Key fields |
| --- | --- | --- |
| Employee profile | Owner, managers; basics to crew | display name, photo, status (active, on leave, former), start date, default title, languages, skills, phone, work email, home area or start location (for drive legs) |
| Titles | Managed list | Lead, Cleaner, Trainee, Organizer, Driver; a title can carry a default pay rate and required-title rules |
| Skills and certifications | Owner, managers | organizing, deep clean, move-out, WHMIS or similar training dates, background check status and expiry (useful for senior clients), first aid |
| Availability | Owner, managers, the employee | weekly pattern (days, earliest start, latest end), maximum hours per day and per week |
| Time off | Owner, managers, the employee | date range, reason category, status (requested, approved, declined), who decided |
| Driver eligibility | Owner, managers | approved driver flag, licence expiry date, date the vehicle use agreement was signed, restrictions |
| Private details | Owner only | emergency contact, home address, pay rate overrides |

**Driver eligibility** comes from your Company Vehicle Use Agreement, which requires a valid, unrestricted licence and management approval before anyone drives. Storing the approval, the signing date and the licence expiry lets the scheduler warn when someone who is not an approved driver is the only person assigned to a job that needs a vehicle, and lets you see expiries coming. Do not store the licence number in this app; keep it on the signed agreement.

**Do not store:** SIN, banking details or health information. Payroll holds those elsewhere.

**Fields the scheduler reads directly:** defaultTitleId, languages, skills, weekly availability, time off, maxHoursPerWeek, approvedDriver, start location, status.

**Employee status** controls booking: only Active employees can be assigned. On leave employees keep their history but are blocked from new jobs, and Former employees are archived with all past assignments intact.

### 5. Employees module: accounts, screens and onboarding

Each employee has one login, shared with the timesheet portal, so hours entry, schedule view and time-off requests all sit behind a single sign-in.

**Accounts and roles**

| Role | Can do |
| --- | --- |
| Owner | Everything, including pay fields, policy and role changes |
| Manager (scheduler) | Manage clients and sites; schedule and override warnings; approve time off; no pay fields |
| Employee | See own schedule, access info for today's jobs, own availability and time-off requests; enter own hours |
| Payroll | Read approved hours and pay-period totals only |

Roles are stored as Firebase custom claims and checked again in security rules. An invite email creates the account and links it to the employee profile; a former employee's login is disabled the day their status changes.

**Screens**

| Screen | What it does |
| --- | --- |
| Employee list | Active, on leave and former; filter by title, skill or language; expiry badges |
| Employee profile | Details, titles, skills and certifications, driver eligibility, documents, activity log |
| Availability editor | Weekly grid with maximum hours; shows the effect on bookable capacity |
| Time-off calendar | Requests to approve, with a team view showing who else is off and which scheduled jobs would be affected |
| Titles and skills admin | Add or retire titles and skills without code changes |
| My profile (employee) | Update phone, availability preferences and time-off requests; cannot see other staff details |

**Time-off rule with scheduling:** approving time off over days that already hold jobs lists the affected jobs and opens them in the Needs attention queue, so approval never silently breaks the schedule.

**Onboarding checklist** (a template that repeats for each hire): invite sent, vehicle use agreement signed, driver approval decided, training dates recorded, availability entered, first-day shadow booked as a Trainee assignment.

### 6. Shared foundations

Build these once so both modules, and scheduling after them, behave the same way.

| Foundation | Design |
| --- | --- |
| Roles and security rules | Custom claims set by a callable function; rules grant read by role; sensitive sub-documents (access codes, pay, private details) in their own restricted paths |
| Writes through functions | Simple edits (a phone number) may write directly under rules; anything that affects bookings (status, availability, time off, site pause) goes through a function that can check upcoming jobs |
| Audit log | Append-only record of who changed what and when, with before and after values for the fields that matter (status, address, access info, title, availability) |
| Soft delete | Archive flag everywhere; hard delete only by owner, and only when no history exists |
| Search | One search box across clients, sites, contacts and employees using stored lowercase search tokens (Firestore has no built-in text search); revisit only if volume demands it |
| Camelo IDs | Every imported record keeps externalIds.camelo so re-imports update instead of duplicate |
| Geocoding | Address autocomplete and geocode in a Cloud Function so the key stays server-side; coordinates saved on the site |
| Uploads | Cloud Storage with per-attachment visibility; files served by short-lived signed URLs |
| Shared package | Types, validation schemas and permission helpers live in the monorepo's shared package and are reused by the web app and functions |
| Design system | Fresh Nest tokens (nest teal, clay, Fraunces and Jost) with one table, form and drawer pattern reused by every screen |

**Camelo import for these modules:** clients, contacts, sites and employees import first, before shifts, so recurring schedules in the scheduling plan can link to real records. The import is re-runnable, produces a review list of problems, and never overwrites a field someone has edited in the new app.

### 7. Build order and exit criteria

These stages replace and sharpen scheduling Phases 0 and 1 and prepare Phase 2. Build them in this order so each stage is usable on its own.

| Stage | Delivers | Size | Exit criteria |
| --- | --- | --- | --- |
| A. Foundations | Auth, roles and claims, rules, audit log, soft delete, search tokens, shared package, design-system components | M | A manager and an employee sign in and see different data; every change is audited |
| B. Employees | Profiles, titles and skills admin, availability, time off, driver eligibility, invites, onboarding checklist | M | Add an employee, set availability, approve time off; pay fields hidden from managers |
| C. Clients and contacts | Client list and detail, wizard, contacts, preferences, duplicates and merge | M | Create a client with two contacts and preferences in under two minutes |
| D. Sites and attachments | Site detail, geocoding, defaults and windows, attachments with visibility, restricted access data | M | Site without coordinates cannot be booked; crew cannot see office-only items |
| E. Camelo import (people and places) | Import of clients, contacts, sites, employees with review screen | M | Re-running the import creates no duplicates and keeps manual edits |
| F. Hand-off to scheduling | Read APIs and types the scheduler uses; fixtures for tests | S | Scheduling Phase 2 can book a job using real clients, sites and employees |

**Tests to write first**

1. A crew account cannot read office-only attachments or another employee's profile.
2. A manager cannot read pay fields.
3. Pausing a site flags its future jobs once scheduling exists.
4. Approving time off over existing jobs lists the affected jobs.
5. Importing the same Camelo export twice changes nothing the second time.
6. A client with visit history can be archived but not deleted.

### 8. Open questions

- [ ] Should a client be able to have a separate payer (for example a family member or a community program), or is the client always the payer for now?
- [ ] Which client types do you want on day one, and should Community-funded be its own type or a tag?
- [ ] Do you want client contacts to receive messages (reminders, running-late notices) in this phase, or only be stored?
- [ ] Is a site's size (bedrooms, bathrooms, square feet) used to estimate job duration, or just recorded?
- [ ] Which certifications and checks do you want tracked, and should expiry reminders go to you by email?
- [ ] Where should an employee's start location come from: home address, the shop, or either per person?
- [ ] Who besides you should have the Manager role at launch, and should they see client phone numbers and addresses in full?
- [ ] Should employee time-off requests come from the app, or will you enter them for staff at first?
- [ ] Do you want one login for the timesheet portal and the schedule, as proposed here?
- [ ] How many clients, sites and employees are in Camelo now? This sizes the import and the review screen.

---

## Part 4. Agreements (Contracts) Module Plan

*ID prefix: `AGR`*

### 1. Where contracts fit

Contracts belong in their own module, called **Agreements**, that sits beside Clients and Employees and attaches to either one. A contract is a document with dates and obligations that outlives any single job, so it should not be a field on a client or an employee.

| Question | Answer |
| --- | --- |
| What is it called? | **Agreements** in the app. Two families: **Client agreements** (service agreements) and **Team agreements** (employment, contractor, policy and vehicle agreements) |
| What does it attach to? | A client (and optionally a site) or an employee, through one shared party reference |
| Who sees what? | Owner sees everything; managers see client agreements; employees see only their own team agreements; pay terms stay owner-only |
| What does it feed? | Scheduling (agreed frequency, day, price), timesheets (pay terms, drive-time rule), billing later, and an expiry and renewal dashboard |

**How it connects to the other plans**

- **Clients module:** a recurring client agreement defines the visit pattern. Signing one can create the recurring series in the scheduling plan (section 4 there), and ending it ends the series.
- **Employees module:** the Employees plan already tracks the vehicle use agreement signing date and licence expiry. Those become Team agreements records, with the same renewal alerts as everything else.
- **Scheduling module:** the agreement carries the cancellation window, lockout fee and access terms the scheduler needs when a visit is cancelled or a client is not home.
- **Timesheet portal:** pay period, rate and the drive-time pay rule live on the employee agreement, so turning on paid drive time later is a new agreement version rather than a code change.

### 2. How others do it

Cleaning companies keep client agreements short and focused on a handful of dispute-prone terms, and small employers track dates, not documents, to avoid missed renewals. Findings below come from template and guide pages found by search, so treat them as practice, not legal advice.

**What people call it**

| Side | Common names | Our label |
| --- | --- | --- |
| Residential cleaning | Cleaning services agreement, housekeeping agreement, maid service contract, residential service agreement, recurring service agreement | Service agreement (client) |
| Commercial cleaning | Janitorial contract, master service agreement, maintenance contract | Service agreement, type Commercial |
| Employees | Employment agreement, offer letter, written employment statement (Ontario), contractor agreement | Employment agreement; Contractor agreement |
| Company rules | Policy acknowledgement, vehicle use agreement | Acknowledgement; Vehicle use agreement |
| Contract tracking in general | Contract lifecycle management (CLM), contract renewal management | Agreements module |

**Client agreements: what cleaning companies put in them**

| Practice | Detail found | Source |
| --- | --- | --- |
| Length | One or two readable pages; a signed agreement is most valuable for recurring clients, while a written quote may be enough for one-off jobs | [Always Do Better](https://alwaysdobetterllc.com/house-cleaning-contract-template/) |
| Core clauses | Scope, schedule, price and payment, cancellation and lockout, supplies, access, liability, termination | [Always Do Better](https://alwaysdobetterllc.com/maid-service-contract-template/) |
| Scope | A room-by-room checklist defining what "clean" means | [Agiled](https://agiled.app/contract-templates/housekeeping) |
| Cancellation | A 24 to 48 hour visit cancellation window; one guide suggests 14 to 30 days' notice to end a recurring service | [Agiled](https://agiled.app/contract-templates/housekeeping), [Business-in-a-Box](https://www.business-in-a-box.com/template/residential-service-agreement-D14047/) |
| Late fees | Late cancellations often carry a fee of 50% to 100% of the visit price | [ZenMaid](https://get.zenmaid.com/tools/cleaning-service-contract) |
| Access | Key, lockbox, smart lock or owner present; alarm and security system terms; what happens if access fails | [Agiled](https://agiled.app/contract-templates/housekeeping) |
| Damage | Report existing damage before the visit; disclose valuable items; cap liability per occurrence | [Business-in-a-Box](https://www.business-in-a-box.com/template/residential-service-agreement-D14047/) |
| Recurring commitment | Discounts tied to a minimum number of visits, with a recapture fee if the client cancels early; some agreements auto-renew every 30 days | [Desimo sample](https://docs.google.com/document/d/1-ZWHENMgB2RJ9FH_i0Rh8ywPJrI2JVsY/export?format=pdf) |
| Lawyer review | Not needed for a standard one-pager, but worth it for commercial contracts, anything with employees, or unusual liability | [Always Do Better](https://alwaysdobetterllc.com/house-cleaning-contract-template/) |

**Employee agreements in Ontario**

- Since July 1, 2025, employers with 25 or more employees must give new hires written information (pay period, pay day, expected hours and similar) before they start. Smaller employers are not bound by it, but putting the same terms in an offer letter is cheap protection ([Peninsula](https://www.peninsulacanada.ca/resource-hub/legislative-updates/mandatory-written-employment-statements-in-ontario-an-employer-s-guide/)).
- An employment agreement is only enforceable if it is clear and does not breach the Employment Standards Act, or it can be struck down and leave the employer exposed. This is the main reason to have a lawyer draft the template once ([HR Insider](https://hrinsider.ca/why-you-need-a-written-employment-agreement-2/)).
- Records: most employee records must be kept for three years after employment ends, and agreements to work excess hours or average overtime for three years after the last day worked under them ([Ontario guide](https://www.ontario.ca/document/your-guide-employment-standards-act/record-keeping)). Payroll and tax records follow Canada Revenue Agency rules of six years plus the current year ([HR Insider forum](https://hrinsider.ca/forums/topic/record-retention-requirements-and-privacy-legislation/)).

**Contract tracking practice**

- The real deadline is the notice deadline (end date minus notice period), not the end date; most contracts need 30, 60 or 90 days' notice ([Vaquill](https://www.vaquill.ai/blog/contract-renewal-tracking)).
- Minimum tracking fields: contract name, counterparty, start and end dates, renewal window, notice period, owner and value ([Expiration Reminder](https://www.expirationreminder.com/blog/how-smes-can-improve-contract-lifecycle-management)).
- Alerts at 30, 60 and 90 days before the date, with an audit trail of every action ([HyperStart](https://www.hyperstart.com/blog/contract-renewal-management-software/)).

**E-signatures:** Ontario's Electronic Commerce Act, 2000 treats electronic signatures as satisfying a signing requirement, with exceptions such as wills and powers of attorney, and parties must consent to using them ([Siskinds](https://www.siskinds.com/?p=19329), [OneSpan](https://www.onespan.com/sites/default/files/2018-11/OneSpan-WhitePaper-LT-Electronic-Signatures-in-Canadian-Law.pdf)).

### 3. Client agreements

A client agreement is a versioned record with structured terms the app can act on, plus the signed document it came from. Structured terms are what let scheduling and alerts use the contract instead of just storing it.

**Agreement types**

| Type | Used for | Typical term |
| --- | --- | --- |
| Recurring service agreement | Weekly, bi-weekly or every-4-weeks home cleaning | Open-ended with a notice period, or a fixed term that renews |
| One-time service agreement or written quote acceptance | Deep clean, move-out, post-construction | Single job |
| Senior and downsizing project agreement | Multi-day sorting, packing, clear-out, with a family member or other approver | Project, with a scope and flat or hourly price |
| Short-term rental turnover agreement | Host turnovers, linen, restocking | Seasonal or open-ended |
| Commercial or janitorial agreement | Offices, units, building turnovers | Fixed term with monthly price and renewal |
| Access and key authorization | Right of entry, keys, codes, alarm | Tied to a site; reviewed yearly |

**Structured terms captured on every agreement**

| Group | Fields |
| --- | --- |
| Parties | client, payer, site(s), signer (name, role, authority to sign) |
| Dates | effective date, end date, renewal type (auto-renew, evergreen, manual), notice period in days, notice deadline (calculated), next review date |
| Service | service type, frequency, preferred day and time window, default crew or preferred staff, scope checklist reference |
| Price | rate type (per visit, hourly, monthly, project), amount, taxes, price-change terms, payment method and timing, recurring-commitment discount and recapture fee if used |
| Rules | visit cancellation window and fee, lockout fee, termination notice, early-end fee, damage reporting window, liability cap, insurance reference |
| Access | method (key, lockbox, owner present, smart lock), alarm yes or no, what to do if access fails; secret values stored in the restricted access record, not in the agreement text |
| Status | Draft, Sent, Signed, Active, Paused, Ending, Ended, Cancelled |

**Lifecycle**

1. Draft from a template, filling terms from the client and site.
2. Send for signature by email or in person; record who signed, when and how.
3. Activate: the app offers to create the recurring series in scheduling from the frequency, day and crew.
4. Amend: changes (new price, new frequency) create a new version; the earlier one is kept as read-only history and the series updates from the effective date.
5. Renew or end: alerts fire before the notice deadline; ending sets the final visit date and ends the series.

**What scheduling does with it:** a missed visit cancelled inside the cancellation window is flagged as fee-eligible; a client with an ended or paused agreement cannot be booked without a warning; a visit outside the agreed day or window shows the CLIENT\_WINDOW warning from the scheduling plan.

### 4. Employee (team) agreements

Team agreements use the same record and lifecycle as client agreements, with different types and tighter access. The design question that matters most is not storing the document but keeping its dates and pay terms usable.

**Agreement types**

| Type | Purpose | Typical dates |
| --- | --- | --- |
| Offer letter or employment agreement | Role, start date, pay, hours, probation, termination terms | Start date; probation end; review date |
| Contractor agreement | Independent contractor terms, if you use any | Start and end; renewal |
| Policy acknowledgement | Handbook, privacy and client-confidentiality, key and access handling, health and safety | Signed date; annual re-sign date |
| Vehicle use agreement | Your existing Company Vehicle Use Agreement | Signed date; licence expiry; annual review |
| Excess-hours or overtime-averaging agreement | If ever used; Ontario requires keeping a copy for three years after the last day worked under it | Start and end |
| Confidentiality and non-solicitation | Client lists, access codes, client contact | Signed date |

A lawyer should review the employment and contractor templates before they are used, particularly because the choice between employee and contractor has legal consequences.

**Structured terms (owner-only fields marked)**

| Group | Fields |
| --- | --- |
| Parties | employee, employer entity, signer |
| Dates | effective, probation end, review date, end date, renewal or re-sign date, notice deadline where it applies |
| Role | title, reports to, work location or area, expected hours (general description), employment type (full-time, part-time, casual) |
| Pay (owner only) | rate by title, pay period (weekly) and pay day, overtime handling, paid drive-time rule (currently unpaid) |
| Conditions | vehicle eligibility, probation terms, termination terms reference, confidentiality |
| Status | Draft, Sent, Signed, Active, Superseded, Ended |

**Rules that make it useful**

- **Versioned pay terms.** A raise or the switch to paid drive time is a new agreement version with an effective date. The timesheet portal reads the version in force on the day worked, so past weeks never change.
- **Onboarding link.** The onboarding checklist from the Employees plan shows each required agreement and whether it is signed.
- **Eligibility gating.** An employee without a signed vehicle use agreement and approved driver status is flagged when assigned to a job that needs a vehicle.
- **Employees see their own.** Staff can open and download their own signed documents but never anyone else's.
- **Retention.** Ended agreements stay for the retention period (section 7), then are flagged for review rather than silently deleted.

### 5. Templates, documents and e-signature

Start by tracking signed documents you already have, then add templates and signing in stages, so the module is useful in its first release.

**Templates**

- A template is a document with merge fields such as client name, site address, frequency, price and cancellation window. Each template exists in English and French, matching your bilingual service.
- Templates are versioned. An agreement records which template version generated it, so you can tell later what wording a client signed.
- Generating an agreement fills the fields from the client, site and chosen terms, then renders a PDF in a Cloud Function using your existing document toolchain.
- Lawyer-reviewed wording lives in the template, not in the app code, so you can update it without a release.

**Signing options**

| Option | How it works | Good for | Watch for |
| --- | --- | --- | --- |
| 1. Upload signed copy | Sign on paper or with any tool, upload the PDF, enter the key dates | Day one; existing Camelo-era clients; employment agreements | Dates must be entered by hand |
| 2. Built-in click-to-sign | Signer opens a private link, reads the document, ticks consent, types their name; the app records time, IP address, browser and a hash of the exact document, then produces a signed PDF with an audit page | Standard residential service agreements | Confirm with a lawyer that this meets your risk level; the signer must consent to electronic signing |
| 3. Third-party e-signature service | Send the generated PDF through an e-signature provider by API; the signed file and certificate come back automatically | Employment, commercial and higher-value agreements | Per-document cost; extra integration |

**Recommendation:** ship option 1 first, add option 2 for residential client agreements, and use option 3 only where a lawyer asks for it. Ontario's Electronic Commerce Act accepts electronic signatures for most agreements, with exceptions such as wills and powers of attorney, so none of your agreement types should be affected.

**Document handling rules**

- Signed files are immutable. Any change creates a new version, never an overwrite.
- Each file stores a SHA-256 hash so you can show it has not changed.
- Files live in Cloud Storage with per-role access and short-lived signed download links.
- Include a counterparts and electronic signature clause in every template.
- Keep the original upload even when the structured terms are edited later.

### 6. Renewals, alerts and links to other modules

Every agreement gets one calculated date that drives alerts: the **notice deadline**, which is the end date minus the notice period. Tracking only the end date is the most common cause of missed renewals.

**Alert rules**

| Alert | Fires | Goes to |
| --- | --- | --- |
| Client agreement notice deadline | 60, 30 and 7 days before | Owner and the client's manager |
| Client agreement ending or auto-renewing | 30 days before | Owner |
| Draft or sent but unsigned | 3 and 7 days after sending | The sender |
| Employment probation end or review date | 14 days before | Owner |
| Policy re-sign due | 30 days before | Owner; the employee gets a prompt |
| Licence expiry (vehicle eligibility) | 60 and 14 days before | Owner; the employee |
| Price review due | On the review date | Owner |
| Retention period reached | At the date | Owner, as a review task, never an auto-delete |

Alerts appear in a dashboard widget and by email. The intervals are policy settings, not code.

**The Agreements dashboard**

| Panel | Shows |
| --- | --- |
| Needs action | Unsigned agreements, upcoming notice deadlines, expiring licences |
| Clients without an agreement | Active recurring clients with no signed agreement, so gaps are visible |
| Ending soon | Agreements ending in 90 days, with value |
| Value by type | Monthly recurring value under agreement, by client type |

**Connections to other modules**

| Module | What the agreement provides or receives |
| --- | --- |
| Scheduling | Frequency, day and window; cancellation and lockout terms; series created on activation and ended on termination |
| Clients | Agreement list on the client and site pages; "no agreement" badge on recurring clients |
| Employees | Agreements tab on the profile; onboarding checklist items; vehicle eligibility |
| Timesheet portal | Pay terms version by date; paid drive-time rule; pay period |
| Billing (later) | Price, payment terms and invoice schedule for each active agreement |

**Price changes:** a price increase is an amendment with an effective date and a notice period for the client, so the app can warn if the notice would be too short.

### 7. Security, privacy and Ontario notes

Agreements hold the most sensitive records in the system, so access is narrower than for clients or employees. This section is a design guide, not legal advice; have a lawyer confirm the points that affect you.

**Access**

| Record | Owner | Manager | Employee | Payroll |
| --- | --- | --- | --- | --- |
| Client agreements | Full | Read and draft; send and sign per policy | None | None |
| Employment agreements and pay terms | Full | Dates and status only | Own agreements only | Current pay terms for approved hours |
| Policy acknowledgements | Full | Status only | Own | None |
| Access and key authorizations | Full | Read | Only for jobs assigned today | None |

**Retention**

| Record | Minimum | Source |
| --- | --- | --- |
| Most employee records | 3 years after employment ends | [Ontario guide](https://www.ontario.ca/document/your-guide-employment-standards-act/record-keeping) |
| Excess-hours and overtime-averaging agreements | 3 years after the last day worked under them | [Ontario guide](https://www.ontario.ca/document/your-guide-employment-standards-act/record-keeping) |
| Payroll and tax records | 6 years plus the current year (Canada Revenue Agency) | [HR Insider forum](https://hrinsider.ca/forums/topic/record-retention-requirements-and-privacy-legislation/) |
| Client agreements | Set by you; suggest 7 years after the agreement ends to cover disputes and tax questions | Your decision with an advisor |

The app stores a retention date on every ended agreement and creates a review task when it passes. It never deletes anything automatically.

**Privacy**

- Collect only what the agreement needs: no health information, no identification numbers, no licence numbers (keep those on the signed paper agreement).
- Show a privacy notice on the client signing page and the employee profile explaining what is kept and for how long.
- Log every view, download and change of an agreement in the audit log.
- Never put alarm or key codes into an agreement document. The agreement says which access method applies; the code lives in the restricted access record.
- Do not email agreements as attachments by default; send a private link that expires.

**Questions for a lawyer, once:** review the English and French client template, the employment and contractor templates, the consent wording for click-to-sign, your liability cap and cancellation fee wording, and whether any of your cleaners should be classed as employees or contractors.

### 8. Build plan and exit criteria

The Agreements module depends on Clients and Employees, so it follows their stages B to D. It can ship in two usable slices: tracking first, generating and signing second.

| Stage | Delivers | Size | Exit criteria |
| --- | --- | --- | --- |
| G1. Agreement records and storage | Shared agreement record, versions, party links, status, structured terms for both families, upload of signed PDFs, hashing, restricted access | M | Upload a signed service agreement and an offer letter; each shows only to the right roles |
| G2. Dates and alerts | Notice-deadline calculation, alert rules, dashboard panels, "clients without an agreement" list | M | A test agreement fires the 60, 30 and 7 day alerts on schedule |
| G3. Employee link-ups | Onboarding checklist items, vehicle eligibility from the vehicle use agreement, pay-terms versions read by the timesheet portal | M | A pay change takes effect on its date; past weeks do not change |
| G4. Templates and generation | English and French templates with merge fields, generate PDF, version tracking | M | Generate a bilingual residential agreement from a client and site in under a minute |
| G5. Click-to-sign | Signing link, consent, audit page, signed PDF, reminder emails | M | A client signs on a phone; the signed file hash matches |
| G6. Scheduling link | Activate creates the series; amend updates it; end closes it; cancellation fee flags | L | Signing a bi-weekly agreement creates 8 weeks of visits with no duplicates |
| G7. Camelo and paper catch-up | Bulk list of existing clients needing agreements, scan-and-enter workflow | S | Every active recurring client is either under agreement or on a marked exception list |
| G8. Third-party e-sign and billing hooks | Only if needed | M | Decided after G5 |

**Order against the other plans:** Clients and Employees stages A to D, then G1 and G2, then scheduling Phases 0 to 3. G3 to G6 fit between scheduling Phases 2 and 5, because G6 needs the recurrence engine.

**Tests to write first**

1. An employee cannot read another employee's agreement or any client agreement.
2. Notice deadline equals end date minus notice period, including across the November 1 clock change.
3. Amending a price creates version 2 and leaves version 1 unchanged and readable.
4. A manager cannot read pay terms.
5. A signed file whose hash does not match is flagged.
6. Ending an agreement ends its recurring series from the final visit date.

### 9. Open questions and sources

- [ ] Do your recurring clients sign anything today, or is it a verbal arrangement plus Camelo bookings? This sizes the catch-up in stage G7.
- [ ] What cancellation window and late fee do you use or want (for example 24 or 48 hours)? These become default policy values.
- [ ] Do you use a minimum-visit commitment or discount for recurring clients, or month-to-month only?
- [ ] Are any cleaners independent contractors, or are all staff employees? This decides which Team agreement types you need on day one.
- [ ] Do you already have written offer letters or employment agreements, and have they been lawyer-reviewed?
- [ ] Should agreements be bilingual (English and French) from the first template, or English first?
- [ ] Which of the three signing options do you want first: upload only, click-to-sign, or a third-party service?
- [ ] Who besides you may send client agreements for signature?
- [ ] For senior and downsizing work, who signs: the client, a family member with authority, or both? Do you need a record of that authority?
- [ ] Do funded clients (for example through a community program) need a separate agreement or a funding reference on the client agreement?
- [ ] Commercial clients: do you want a master agreement with schedules per site, or one agreement per site?
- [ ] What retention period do you want for ended client agreements (7 years is suggested)?

**Sources** (pages found by search; practices vary, and none of these replaces legal advice)

- [Always Do Better: house cleaning contract](https://alwaysdobetterllc.com/house-cleaning-contract-template/) and [maid service contract](https://alwaysdobetterllc.com/maid-service-contract-template/)
- [Agiled: housekeeping agreement](https://agiled.app/contract-templates/housekeeping) and [cleaning services agreement](https://agiled.app/contract-templates/cleaning-services)
- [Business-in-a-Box: residential service agreement](https://www.business-in-a-box.com/template/residential-service-agreement-D14047/)
- [ZenMaid: cleaning service contract](https://get.zenmaid.com/tools/cleaning-service-contract)
- [Housecall Pro: cleaning service contract](https://www.housecallpro.com/resources/cleaning-service-contract-template-sample/)
- [Desimo Enterprises sample agreement](https://docs.google.com/document/d/1-ZWHENMgB2RJ9FH_i0Rh8ywPJrI2JVsY/export?format=pdf)
- [Peninsula: Ontario written employment statements](https://www.peninsulacanada.ca/resource-hub/legislative-updates/mandatory-written-employment-statements-in-ontario-an-employer-s-guide/)
- [HR Insider: why you need a written employment agreement](https://hrinsider.ca/why-you-need-a-written-employment-agreement-2/)
- [Ontario: employment standards record keeping](https://www.ontario.ca/document/your-guide-employment-standards-act/record-keeping)
- [HR Insider forum: record retention and privacy](https://hrinsider.ca/forums/topic/record-retention-requirements-and-privacy-legislation/)
- [Vaquill: contract renewal tracking](https://www.vaquill.ai/blog/contract-renewal-tracking)
- [Expiration Reminder: SME contract lifecycle management](https://www.expirationreminder.com/blog/how-smes-can-improve-contract-lifecycle-management)
- [HyperStart: renewal management software](https://www.hyperstart.com/blog/contract-renewal-management-software/)
- [Siskinds: electronic signatures in Ontario](https://www.siskinds.com/?p=19329)
- [OneSpan: electronic signatures in Canadian law](https://www.onespan.com/sites/default/files/2018-11/OneSpan-WhitePaper-LT-Electronic-Signatures-in-Canadian-Law.pdf)

---

## Part 5. Employee Availability, Time Off and Job Swaps Plan

*ID prefix: `AVL`*

### 1. Scope

Three self-service functions give employees a voice in the schedule while keeping the scheduler in control: **availability** (preferred days and hours), **time off** (requests) and **job swaps** (trading or handing off a visit). They extend the Availability, Time-off and Employees pieces already in the Employees and Scheduling plans, and each one feeds the same validator.

| Function | Employee does | Manager does | System does |
| --- | --- | --- | --- |
| Availability | Sets preferred days and hours, marks times they cannot work, adds temporary changes | Approves changes that reduce availability; sets minimum coverage rules | Warns when a job falls outside availability; ranks suggested crews by preference |
| Time off | Requests vacation, sick, personal or unpaid days with dates and an optional note | Approves or declines with a reason; sees which jobs are affected | Blocks booking on approved days; lists affected jobs; tracks balances |
| Job swaps | Offers a job to a named colleague or to eligible staff, or proposes a trade | Approves, or lets clean swaps auto-approve under rules | Checks title, drive time, overlaps, client exclusions, hours; updates assignments |

**Wording.** Cleaning work is booked as visits, not shifts, so the app says **job swap** and **hand-off**, not shift swap. A swap changes one person's assignment on a job. It never changes the job's time, client or site.

**Principles**

1. Availability is a preference that informs scheduling; time off is a formal request that blocks it. Keep them as separate screens and records.
2. Employees see only their own data and the minimum needed about colleagues in a swap.
3. Every request has a status, a decision, a reason, and an audit entry.
4. The scheduler can always override, and overrides are logged, matching the scheduling plan.

### 2. How others do it

Scheduling tools split availability from time off, require approval selectively, and put eligibility checks in front of every swap so managers review exceptions, not every request. Findings come from vendor help pages and guides found by search.

| Topic | Common practice | Source |
| --- | --- | --- |
| Availability vs time off | Kept as separate workflows: availability is recurring or preferred working time, time off is for specific dates | [7shifts](https://kb.7shifts.com/hc/en-us/articles/33770703246099), [Workforce.com](https://help.workforce.com/en/articles/12811227-availability) |
| One-off absences | Requested as time off, not by editing availability | [Rota and Time Clock](https://help.timetastic.co.uk/en/articles/15265354-sending-my-availability-in-the-mobile-app) |
| Recurring and temporary availability | Recurring availability stays until changed; temporary availability overrides it for set dates, then reverts | [7shifts](https://kb.7shifts.com/hc/en-us/articles/33770703246099) |
| Approval of availability | Optional setting; some tools approve only changes that reduce availability, applying others instantly | [7shifts](https://kb.7shifts.com/hc/en-us/articles/33770703246099), [Skytab](https://intercom.help/skytabworkforce/en/articles/8829680-manage-employee-availability-mobile) |
| Preference levels | Colour-coded states such as available, preferred, prefers off, not available | [Kronos job aid](https://tech.rochester.edu/wp-content/uploads/View_and_Request_Availability_Changes.pdf) |
| Time-off rules | Notice requirements (for example 14 days), approval or auto-approval, recurring time off, team view of who else is off | [Breakroom](https://www.breakroomapp.com/features/scheduling/time-off-and-availability), [Time To Pet](https://www.timetopet.com/staff-management/time-off) |
| Swap types | Peer swap to a named person, open swap pool anyone eligible can claim, and manager override | [Teambridge](https://www.teambridge.com/workflows/shift-swap-approval) |
| Swap checks | Role, qualifications, availability, overtime and conflicts checked before the request reaches a manager | [Teambridge](https://www.teambridge.com/workflows/shift-swap-approval), [RosterElf](https://www.rosterelf.com/uk/features/rostering-software/auto-shift-swaps) |
| Approval load | Approval can be employee, manager or both; sending every swap to a manager creates a bottleneck, so clean swaps auto-approve and exceptions escalate | [WorkEasy](https://help.workeasysoftware.com/docs/configure-shift-swap-and-drop), [MangoApps](https://www.mangoapps.com/glossary/shift-swap-workflow), [HiveDesk](https://www.hivedesk.com/glossary/shift-swap) |
| Policy | Clear written rules on who can swap, how often and by when, plus swap frequency reports to catch abuse | [OnPay](https://onpay.com/insights/shift-swapping-explained/), [Shyft](https://www.myshyft.com/blog/shift-swapping-mechanisms/) |
| Phone first | Adoption depends on the workflow working on a phone and respecting overtime rules | [MangoApps](https://www.mangoapps.com/glossary/shift-swap-workflow) |

**What this means for Fresh Nest**

- Build availability and time off as two screens that share one rules engine.
- Let employees edit their own availability instantly when it only adds availability, and require approval when it removes some.
- Swaps need a rules gate in front of the manager: title, drive time, overlaps, client exclusions, language and hours.
- Cleaning adds constraints most shift tools lack: drive time between sites, clients who expect the same cleaner, and access codes that only assigned crew may see.

### 3. Preferred working days and hours

Each employee keeps one standing weekly pattern plus optional temporary patterns, each time block marked with how strongly they want it. The scheduler reads these when suggesting crews and warns when a job falls outside them.

**States for a time block**

| State | Meaning | Scheduling effect |
| --- | --- | --- |
| Preferred | Wants to work then | Ranked first when suggesting crew |
| Available | Can work then | Normal |
| Prefer not | Can work if needed | Allowed with an info badge |
| Unavailable | Cannot work then | Warning, overridable by a manager (consistent with the scheduling plan's TIME\_OFF check) |

Undefined time counts as Available, so employees only enter exceptions and preferences.

**What the employee can set**

| Setting | Detail |
| --- | --- |
| Weekly pattern | For each weekday, one or more blocks with start and end times and a state |
| Maximum hours | Per day and per week; the weekly maximum feeds the overtime warning (Ontario's overtime threshold is 44 hours) |
| Preferred start area | Home or shop, used for the first drive leg |
| Temporary pattern | A date range that overrides the standing pattern, then reverts, for example school holidays |
| Notes | Short reason, visible to managers |
| Preferred clients and sites | Optional; "would like more of" or "would rather not" for managers, never a hard rule |

**Approval rules**

| Change | Approval |
| --- | --- |
| Adds availability or moves a block to Preferred | Applies immediately |
| Reduces availability, or removes days | Manager approval; the old pattern stays active until approved |
| Temporary pattern under 14 days | Applies immediately; manager notified |
| Change affecting days with scheduled jobs | Always manager approval, with the affected jobs listed |

The approval and notice thresholds are policy settings, not code. Pending changes show as Requested, the way other scheduling tools mark them.

**Data model**

| Record | Fields |
| --- | --- |
| availabilityProfile | employeeId, version, status (active, requested, declined), effectiveFrom, weekly blocks, maxHoursDay, maxHoursWeek |
| availabilityOverride | employeeId, dateFrom, dateTo, blocks, reason, status |
| availabilityPreference | employeeId, targetType (client or site), targetId, direction (more or less), note |

**Resolution order for any date and time:** approved time off, then temporary pattern, then standing pattern, then default Available. One function in the shared scheduling package returns the state, so the board, the validator and crew suggestions never disagree.

### 4. Time-off requests

A time-off request carries dates, a type and an optional note, goes through checks that show the manager the impact before they decide, and, once approved, blocks booking and flags any jobs already scheduled.

**Request types**

| Type | Notes |
| --- | --- |
| Vacation | Employer decides timing; Ontario vacation is normally taken in one or two week blocks unless the employee asks for shorter periods in writing and the employer agrees, and must be taken within 10 months of the end of the vacation year. The form therefore has a "request in days" confirmation that records the written request |
| Sick | Ontario gives most employees 3 unpaid, job-protected sick days a year, and an employer cannot require a medical note for them. The form asks for no diagnosis and no note |
| Personal or unpaid | Other days off; manager discretion |
| Other protected leave | Longer or statutory leaves (for example long-term illness or family leaves) are started here but handled by the owner outside the app, with no medical details entered |
| Recurring time off | A weekly day or block off for a period, such as a class on Monday mornings |

**Request flow**

1. Employee picks type, dates (whole or part days) and adds an optional note. The form shows notice given, balance, and who else is already off.
2. System checks: minimum notice, blackout dates, maximum people off at once, and the jobs the employee is booked on during those dates.
3. Manager sees the request with the impact list, then approves, declines with a reason, or proposes different dates.
4. On approval the dates become blocked in scheduling, balances update, and the employee is notified.
5. The employee may cancel before the first day; cancelling after approval notifies the manager and frees the dates.

**Policy settings (owner-editable)**

| Setting | Example default |
| --- | --- |
| Minimum notice for vacation | 14 days |
| Minimum notice for sick | None |
| Blackout dates | Owner-defined busy periods |
| Maximum employees off on a day | 2 |
| Auto-approve | Off at first; later: short requests with no affected jobs and enough balance |
| Vacation year | Starts on hire date or a company-wide date |

**Same-day sick button.** A one-tap "I can't work today" sends an urgent notice to the manager, lists today's jobs for that employee, and offers hand-off options (section 5). It records one sick day without asking why.

**Effect on scheduled jobs.** Approving time off over dates with assigned jobs creates a **Needs attention** item per job. The scheduler then reassigns, or the employee offers a hand-off. Approval is never blocked by jobs, but the manager sees the list first.

**Data model**

| Record | Fields |
| --- | --- |
| timeOffRequest | employeeId, type, dateFrom, dateTo, partial-day times, status (requested, approved, declined, cancelled), note, decidedBy, decidedAt, decisionReason, affectedJobIds |
| leaveBalance | employeeId, type, period, entitled, taken, pending |
| timeOffPolicy | notice rules, blackout dates, daily cap, vacation-year rule |

**Records:** Ontario requires leave-related notices and correspondence to be kept for three years, so ended requests are archived, not deleted.

### 5. Job swaps and hand-offs

A swap changes who is assigned to a job, never the job itself. The rules check runs before anyone sees the request, so a colleague is only asked about swaps that could actually be approved.

**Request types**

| Type | What happens |
| --- | --- |
| Hand-off to a named colleague | Employee offers one job to one person, who accepts or declines |
| Hand-off to the open pool | Job is offered to all eligible staff; the first to claim it gets it, within manager-set rules |
| Trade | A gives job X to B and B gives job Y to A; both must accept and both sides are checked |
| Manager cover request | Created by the scheduler (for example after a sick call) and offered to the pool |

**Flow**

1. Employee opens one of their upcoming jobs and taps Hand off or Trade, adds a reason, and chooses a person or the pool.
2. The app lists only eligible colleagues, with the reason shown next to anyone excluded.
3. The colleague or first claimant accepts on their phone.
4. The system re-runs every check on the final arrangement.
5. If everything passes and policy allows, it auto-approves; otherwise it goes to the manager with the problem highlighted.
6. On approval the assignments change in one transaction, both people and the manager are notified, and the change is logged and undoable.

**Eligibility checks** (a hard stop means the person is not offered the job)

| Check | Result |
| --- | --- |
| Receiving person already on an overlapping job | Hard stop |
| Drive time from their previous or to their next job is too short | Hard stop for peers; manager may override, with the scheduling plan's Fit it for me options |
| Client has excluded this person | Hard stop |
| Does not hold the title or skill the job needs (for example Lead) | Hard stop unless the manager assigns a different title |
| Approved time off, or marked Unavailable | Hard stop |
| Marked Prefer not | Info; they can still choose to accept |
| Would take weekly hours past their maximum or toward overtime | Warning; manager approval needed |
| Job needs a vehicle and no approved driver remains | Hard stop |
| Client prefers their regular cleaner or the other language | Warning; manager decides whether to tell the client |
| Job starts within the minimum swap notice (for example 12 hours) | Manager approval needed |
| Job is pinned (fixed time), confirmed with the client, in progress or complete | Manager approval, or not swappable |

**Approval modes (policy)**

| Mode | When used |
| --- | --- |
| Auto-approve | One-for-one, same title, all checks passed, job at least the minimum notice away, and the client's regular cleaner is not changing |
| Manager approves | Any warning, client's regular cleaner changing, or trade where one side fails a soft check |
| Manager override | Allowed with a reason, logged, for any soft or drive-time issue; never for overlaps |

**Guardrails against abuse**

- A monthly limit on swaps per person, set by policy.
- A swap and hand-off report by employee, which tools elsewhere use to catch abuse, so patterns are visible.
- Requests expire if nobody accepts by a set time before the job; the manager is then notified.
- Access codes and client contact details stay hidden from the receiving person until the swap is approved.

**Edge cases handled**

- The receiving person books time off or another job while the request is pending: re-check at approval; fail with a clear message.
- A trade where one side fails: neither side applies.
- Two people claim the pool job at once: the transaction keeps the first, tells the second.
- A person who swapped away later falls sick: the job is theirs no longer, so no action.

**Data model**

| Record | Fields |
| --- | --- |
| swapRequest | type, requesterId, jobId and assignmentId, offeredToId or pool flag, counterJobId (trade), reason, status (requested, offered, accepted, pending approval, approved, applied, declined, expired, cancelled), expiresAt, checkResults snapshot, decidedBy and reason, appliedAt, rev |
| swapPolicy | minimum notice, monthly limit, auto-approve rules, pool rules |

### 6. How these plug into scheduling

All three functions read and write through the same shared scheduling package and the same Cloud Function that applies changes, so a swap, a time-off approval and a manual edit obey identical rules.

**Validator additions** (extending the catalogue in the scheduling plan)

| Code | Rule | Severity |
| --- | --- | --- |
| UNAVAILABLE | Assigned in a block marked Unavailable (replaces the availability part of TIME\_OFF) | Warning, manager override |
| TIME\_OFF\_APPROVED | Assigned during approved time off | Warning, manager override with reason; never offered in suggestions or swaps |
| PREFER\_NOT | Assigned in a Prefer not block | Info |
| OUTSIDE\_PREFERRED | Job outside the person's preferred hours when others are available | Info, lowers suggestion rank |
| MAX\_HOURS\_DAY | Daily hours would pass the person's own maximum | Warning |
| MAX\_HOURS\_WEEK | Weekly hours would pass their maximum or 44 | Warning |
| SWAP\_PENDING | Job has an open swap request | Info badge |

**What each event triggers**

| Event | Effect in scheduling |
| --- | --- |
| Availability change approved | New pattern applies from its effective date; future jobs outside it get Needs attention items |
| Time off approved | Dates blocked; every assigned job on those dates listed in Needs attention; recurring series that use the employee are flagged, not silently reassigned |
| Same-day sick | Today's jobs flagged urgent; hand-off options and a manager cover request created |
| Swap approved | Assignment changes in one transaction; client notice list updated if the regular cleaner changed |
| Time off cancelled | Dates freed; affected items cleared; jobs previously reassigned stay as they are |
| Employee ends or goes on leave | All future assignments listed for reassignment |

**Suggested crew ranking** uses these signals in order: not hard-blocked, then Preferred over Available over Prefer not, then client's usual cleaner, then language match, then lowest added drive time, then weekly hours balance.

**Recurring series.** Nightly generation checks each new job against availability and approved time off. A failure creates the job in Needs attention rather than skipping it, matching the rule in the scheduling plan.

**On the board.** Approved time off appears as a labelled bar on that person's row, Unavailable time as light shading, Preferred time as a subtle highlight, and pending swaps as a small badge on the job.

**Cloud Functions**

| Function | Purpose |
| --- | --- |
| submitAvailability, decideAvailability | Create and approve availability changes |
| submitTimeOff, decideTimeOff, cancelTimeOff | Time-off lifecycle with impact list |
| requestSwap, respondSwap, decideSwap | Swap lifecycle with eligibility checks |
| applyScheduleChange (existing) | Applies the resulting assignment changes in one transaction with revision checks and undo |
| notify | Sends push, email or SMS from one place |

### 7. Employee screens and notifications

Employees use these on a phone, so each screen is one task and one thumb-reach away from the My day home screen.

| Screen | For | What it does |
| --- | --- | --- |
| My availability | Employee | Weekly grid with four states, tap to paint blocks; temporary changes with a date range; weekly maximum; shows which changes need approval and their status |
| Request time off | Employee | Type, dates, optional note; shows notice, balance, who else is off, and the policy in one line |
| My requests | Employee | All availability, time-off and swap requests with status, decision and reason; cancel while pending |
| Job detail with Hand off | Employee | From any upcoming job: Hand off, Trade, or I can't make it; lists eligible people with reasons for excluded ones |
| Open jobs | Employee | The pool of jobs offered to eligible staff, with time, area, client first name only, title needed and drive time from the person's previous job |
| Requests inbox | Manager | One queue for availability changes, time off and swaps; each card shows the check results and affected jobs; approve, decline or propose changes in one tap |
| Team calendar | Manager | Who is off or unavailable by day, with coverage warnings |
| Policies | Owner | Notice rules, blackout dates, daily cap, swap rules, auto-approve settings |

**Notifications** (push first, email as backup; SMS only if you choose it later)

| Event | Goes to | Timing |
| --- | --- | --- |
| Request submitted | Manager | Immediately |
| Request decided | Employee | Immediately, with the reason |
| Hand-off offered to you | Colleague | Immediately; reminder before expiry |
| New open job in pool | Eligible staff | Immediately, quiet hours respected |
| Swap approved or applied | Both people and manager | Immediately |
| Same-day sick | Manager | Immediately, high priority |
| Request pending too long | Manager | After a policy-set number of hours |
| Upcoming approved time off | Employee | A day before |

**Language:** screens and messages in English and French, following the employee's language setting.

**Accessibility and privacy on the screens:** large tap targets, plain wording, no medical fields, and colleagues' details limited to name, title and availability for the swap at hand.

### 8. Fairness, Ontario notes and privacy

The app should make fair handling the easy path and keep a record that decisions followed the policy. This is a design guide drawn from legal-information pages found by search, not legal advice; have a lawyer confirm the points that affect you.

**Ontario points that shape the design**

| Topic | Point | Design effect | Source |
| --- | --- | --- | --- |
| Vacation timing | The employer decides when vacation is taken and may refuse a request for business reasons, but must ensure it is taken, normally within 10 months of the end of the vacation year | Approval reasons recorded; vacation balances show the deadline | [St. Lawyers](https://stlawyers.ca/?p=70719), [Global Workplace Insider](https://www.globalworkplaceinsider.com/2021/02/how-to-manage-vacation-when-there-is-nowhere-to-go/) |
| Vacation blocks | One or two week blocks unless the employee asks in writing for shorter periods and the employer agrees | "Request in days" confirmation stored with the request | [Littler](https://littler.com/node/575571), [HR Reporter](https://www.hrreporter.com/focus-areas/payroll/timing-is-everything-when-it-comes-to-vacations/306494) |
| Sick days | Three unpaid, job-protected days a year for most employees; no medical note may be required for them since October 28, 2024; no penalty for using them | No note or diagnosis field; the first three sick days are never declined or penalized by the app | [St. Lawyers](https://stlawyers.ca/labour-employment-law-employees/sick-note-ontario/), [Ontario guide](https://www.ontario.ca/document/your-guide-employment-standards-act-0/sick-leave) |
| Longer illness | Up to 27 weeks of unpaid, job-protected leave in 52 weeks for eligible employees since June 19, 2025 | "Other protected leave" type handled by the owner, without medical details | [St. Lawyers](https://stlawyers.ca/blog-news/paid-sick-leave-in-ontario/) |
| Reprisal | Employers may not penalize employees for exercising employment-standards rights | Declines need a reason; the decision log is kept; no automatic penalties for requests | [St. Lawyers](https://stlawyers.ca/blog-news/paid-sick-leave-in-ontario/) |
| Overtime | Threshold is 44 hours a week | Weekly hours warnings use 44 as a ceiling | [CUPE Ontario checklist](https://cupe.on.ca/wp-content/uploads/2018/03/Bill-148-Employment-Standards-Act-Check-List-.pdf) |
| Three-hour rule | An employee who regularly works more than three hours a day, reports for work, and works less than three is paid for three hours | A client cancelling at the door or a lockout may trigger it, so record those events with the visit | [Achkar Law](https://achkarlaw.com/insights/ontario/three-hour-rule-minimum-call-in-pay/), [Levitt LLP](https://www.levittllp.com/?p=4293) |
| Schedule notice | One law firm notes the Act does not require advance notice of schedules or schedule changes (earlier proposals for 48-hour cancellation pay were repealed in 2018) | Notice minimums in the app are your policy, not a legal setting; confirm with a lawyer | [Levitt LLP](https://www.levittllp.com/?p=4293), [Bennett Jones](https://www.bennettjones.com/Insights/Blogs/2018/12/Bill-47-Implements-Significant-Changes-to-Ontario-Employment-Standards-Legislation) |

**Fairness rules built in**

- One written policy, shown in the app, covering notice, blackout dates, caps and swap limits, applied the same way to everyone.
- Decisions show their reason, and the app records who decided and when.
- Open jobs go to everyone eligible at the same moment, not to a favoured few.
- A monthly report shows hours by person against stated preference, so a pattern of someone always getting the less wanted times is visible.
- Availability that reflects religion, disability or family responsibilities can be an accommodation matter; the request screen offers "talk to the owner" rather than asking for the reason, and accommodation is handled outside the app.

**Privacy**

- Notes are optional and the form tells staff not to include medical details.
- Employees see only their own requests; managers see requests but not reasons marked private; the owner sees all.
- Colleagues see another person's name, title and availability only at the moment of a specific swap.
- Leave and swap records are archived, retained at least three years, and every view and change is logged.

### 9. Build plan and exit criteria

Availability and time off need only the Employees module and can ship before scheduling exists. Swaps need real jobs and the apply-change function, so they follow scheduling Phases 2 to 4.

| Stage | Delivers | Needs first | Size | Exit criteria |
| --- | --- | --- | --- | --- |
| E1. Availability | Four-state weekly grid, temporary patterns, maximum hours, approval rules, one resolution function in the shared package | Employees stage B | M | An employee sets a pattern; adding availability applies at once, removing some waits for approval |
| E2. Time off | Request form, types, policy settings, balances, team calendar, manager inbox, same-day sick button | E1 | M | A request shows notice, balance and who else is off; approval blocks the dates |
| E3. Scheduler integration | New validator codes, board overlays, crew ranking, Needs attention items for affected jobs | Scheduling Phases 2 and 3 | M | Approving time over booked jobs lists those jobs; suggestions skip unavailable staff |
| E4. Hand-off and eligibility | Hand-off to a named colleague, eligibility checks, manager approval, apply in one transaction, undo | Scheduling Phase 4 | L | A hand-off that fails a drive-time check is never offered; an approved one changes the assignment and notifies both |
| E5. Open pool and trades | Pool offers, first-claim, trades, auto-approve rules, expiry, monthly limits | E4 | M | Two people claiming at once leaves one winner; a failed trade applies neither side |
| E6. Notifications and language | Push and email, quiet hours, English and French, reminder and expiry notices | E2 | M | Every event in section 7 produces the right message in the right language |
| E7. Reports and policy admin | Hours versus preference, swap frequency, pending-too-long list, policy editor | E5 | S | The owner changes a notice rule without a release |

**Tests to write first**

1. Resolution order: approved time off beats a temporary pattern, which beats the standing pattern.
2. An availability change that removes days keeps the old pattern active until approved.
3. Vacation request under the minimum notice shows a warning but can still be sent.
4. A sick request needs no note and cannot hold a medical field.
5. Approving time off over three booked jobs creates three Needs attention items.
6. A swap to someone with a client exclusion is never offered.
7. An auto-approved swap changes only the assignment, not the job time.
8. Simultaneous claims on a pool job: one succeeds, one gets a clear message.
9. A trade where one leg breaches a drive-time rule applies neither leg.
10. An undo restores the previous assignees and notifies them.

### 10. Open questions and sources

- [ ] How many employees do you have now, and how many do you expect in a year? This decides whether auto-approval and the open pool are worth building early.
- [ ] Do employees work fixed days each week, or do hours change a lot week to week?
- [ ] Should changes that reduce availability always need your approval, or only when they affect booked jobs?
- [ ] What minimum notice do you want for vacation (14 days is proposed) and are there blackout periods, such as move-out season or December?
- [ ] What is the most staff you can have off on one day?
- [ ] When does your vacation year start: each person's hire date or one company date?
- [ ] Should a sick call count one day even if it is a partial day? Please confirm the rule with a lawyer.
- [ ] Should staff be able to hand off to the open pool, or only to a named colleague at first?
- [ ] Is it acceptable for a swap to auto-approve when every check passes, or do you want to approve every swap at first?
- [ ] What is the shortest notice you would accept for a swap (12 hours is proposed)?
- [ ] Do clients get told when their regular cleaner changes, and by whom?
- [ ] Should staff see open jobs with the client's first name and area, or only time and title?
- [ ] Push notifications first, or do you want SMS from the start?
- [ ] Should preferred days and hours influence pay or hours guarantees in any way, or purely scheduling?

**Sources** (pages found by search; vendor practices and legal summaries, not legal advice)

- [7shifts: availability settings](https://kb.7shifts.com/hc/en-us/articles/33770703246099) and [availability guide](https://kb.7shifts.com/hc/en-us/articles/4417513664659)
- [Workforce.com: availability](https://help.workforce.com/en/articles/12811227-availability)
- [Rota and Time Clock: sending availability](https://help.timetastic.co.uk/en/articles/15265354-sending-my-availability-in-the-mobile-app)
- [Skytab: manage availability](https://intercom.help/skytabworkforce/en/articles/8829680-manage-employee-availability-mobile)
- [Kronos job aid: availability changes](https://tech.rochester.edu/wp-content/uploads/View_and_Request_Availability_Changes.pdf)
- [Breakroom: time off and availability](https://www.breakroomapp.com/features/scheduling/time-off-and-availability)
- [Time To Pet: time off](https://www.timetopet.com/staff-management/time-off)
- [Teambridge: shift swap approval](https://www.teambridge.com/workflows/shift-swap-approval)
- [RosterElf: shift swaps](https://www.rosterelf.com/uk/features/rostering-software/auto-shift-swaps)
- [WorkEasy: configure swap and drop](https://help.workeasysoftware.com/docs/configure-shift-swap-and-drop)
- [MangoApps: shift swap workflow](https://www.mangoapps.com/glossary/shift-swap-workflow)
- [HiveDesk: shift swap](https://www.hivedesk.com/glossary/shift-swap)
- [OnPay: shift swapping](https://onpay.com/insights/shift-swapping-explained/)
- [Shyft: shift swapping mechanisms](https://www.myshyft.com/blog/shift-swapping-mechanisms/)
- [Littler: Ontario vacation requests](https://littler.com/node/575571)
- [St. Lawyers: Ontario vacation](https://stlawyers.ca/?p=70719)
- [HR Reporter: vacation timing](https://www.hrreporter.com/focus-areas/payroll/timing-is-everything-when-it-comes-to-vacations/306494)
- [Global Workplace Insider: vacation deadline](https://www.globalworkplaceinsider.com/2021/02/how-to-manage-vacation-when-there-is-nowhere-to-go/)
- [Ontario: sick leave guide](https://www.ontario.ca/document/your-guide-employment-standards-act-0/sick-leave)
- [St. Lawyers: sick notes](https://stlawyers.ca/labour-employment-law-employees/sick-note-ontario/) and [paid sick leave](https://stlawyers.ca/blog-news/paid-sick-leave-in-ontario/)
- [Achkar Law: three-hour rule](https://achkarlaw.com/insights/ontario/three-hour-rule-minimum-call-in-pay/)
- [Levitt LLP: scheduling and the three-hour rule](https://www.levittllp.com/?p=4293)
- [Bennett Jones: Bill 47 scheduling changes](https://www.bennettjones.com/Insights/Blogs/2018/12/Bill-47-Implements-Significant-Changes-to-Ontario-Employment-Standards-Legislation)
- [Ontario: employment standards record keeping](https://www.ontario.ca/document/your-guide-employment-standards-act/record-keeping)

---

## Part 6. Crew Job Execution Plan

*ID prefix: `CRW`*

### 1. Scope and decisions

Crew job execution is everything a cleaner does on a phone between leaving for a job and finishing it: check in, work the checklist, record notes and photos, flag problems, and check out. It is also the source of the real arrival, departure and drive times that payroll, quality and reports depend on.

**Decisions already made**

| Topic | Decision |
| --- | --- |
| App type | Installable web app, one build for iPhone and Android |
| Location | Recorded at check-in and check-out only, never continuously |
| Photos | Required for damage and found items; before-and-after supported where a service or client turns it on; any other photo optional |
| Payroll | Camelo handles time and payroll today, so job-level time capture is a cutover requirement |
| Invoicing | Per visit, in Wave; completed visits feed a ready-to-invoice queue |
| Languages | English and French screens, following each employee's language setting |
| Client communications | Reminders and messages first, client portal later |

**What this plan covers:** the visit lifecycle, crew screens, checklists, photos and incidents, time and location capture, offline behaviour, the office review queue, data and security, build stages.

**What it hands to other plans:** client-facing messages (Communications plan), pay calculation and export (Time and payroll plan), invoice creation (Billing bridge to Wave), scored inspections (Quality plan).

**Principles**

1. One tap per step. A cleaner in a client's home, hands full, should finish any step in a few seconds.
2. Works with a weak signal. Rural stretches and basements are normal.
3. Capture facts, not surveillance. Location and time only at defined moments.
4. Never lose work. Anything entered is saved on the phone first and sent when possible.

### 2. How other cleaning apps handle the crew side

Crew apps converge on the same few moves: see the day, navigate, check in, work a checklist, add notes and photos, flag a problem, finish. The differences are in how strictly they enforce the steps. Findings come from vendor pages and app listings found by search.

| Practice | What others do | Design effect | Source |
| --- | --- | --- | --- |
| Daily view | Calendar and daily route map; open the address in Google Maps, Waze or Apple Maps | My day shows ordered jobs with drive time and a navigate button | [ZenMaid](https://answers.zenmaid.com/en/articles/6968490-app-overview-for-cleaners) |
| Clock in and out | One tap per appointment, feeding timesheets | Check-in and check-out are the time and location events | [ZenMaid](https://get.zenmaid.com/cleaning-business-app), [Zstar Cleaner](https://mwm.ai/apps/zstar-cleaner/6748201223) |
| Checklists | Per-appointment work items; one tool can block job closure until all items are done and photos are attached | Checklists per service with optional required items | [Fieldproxy](https://www.fieldproxy.ai/blog/9-ways-cleaning-companies-improve-quality-control-with-field-service-s-d1-40) |
| Notes and photos | Notes for the office and photos attached to the appointment; some apps stamp photos with time | Notes and photos stored on the visit, time-stamped | [ZenMaid](https://www.zenmaid.com/magazine/zenmaid-mobile-app-guide/), [Resort Cleaning](https://www.resortcleaning.com/feature/mobile-app-hk) |
| Access reminders | Custom fields show access and customer info set by the office | Access instructions appear on the job card, restricted to assigned crew | [ZenMaid](https://answers.zenmaid.com/en/articles/6968490-app-overview-for-cleaners) |
| Safety | A discreet SOS button alerts the office; the vendor says it does not replace emergency services | Silent alert to the office with a clear "call 911" reminder | [ZenMaid](https://zenmaid.com/answers/en/articles/6968490-zenmaid-mobile-app-overview-for-cleaners) |
| Proof of attendance | Some apps use scannable tags at the site for check-in | An optional later way to verify arrival without GPS | [CleanManager](https://apps.apple.com/app/id960244923) |
| Issue reporting | Crew report maintenance issues and mark the job in progress, then complete | Found, damaged and maintenance items as one report type | [ProhostAI](https://www.prohost.ai/learn/cleanings/guide/cleaner-collaboration) |
| Weak points reported | One reviewer lists no photo upload for found or damaged items and no required checklist before clock-out as gaps; a host app's reviewers report crashes when uploading around 20 photos | Compress photos on the phone, upload one at a time, retry quietly | [Secret reviews](https://www.joinsecret.com/zenmaid/reviews), [Properly](https://apple.co/3cpJDrS) |

**Ontario note on location.** Ontario requires employers with 25 or more employees to have a written electronic monitoring policy, and GPS tracking counts as monitoring. If you are under that size the rule does not apply to you, but a short written statement of what the app records and why is still wise. The federal privacy commissioner has said GPS use should be defined and communicated beforehand, and that judging workers from GPS data alone is intrusive ([Mathews Dinsdale](https://www.mondaq.com/canada/employee-rights-labour-relations/1218236/ontario-ministry-of-labour-updates-guidance-on-electronic-monitoring-policies), [Privacy Commissioner](https://www.canada.ca/en/news/archive/2006/11/privacy-commissioner-urges-caution-before-installing-gps-company-vehicles.html)). Recording location only at check-in and check-out, as you chose, keeps this simple.

**What a custom build can do better:** capture real drive time between jobs for comparison with the planned estimate, tie photos to a specific checklist item or incident, work in French, and feed per-visit invoicing directly.

### 3. Visit lifecycle

A visit moves through nine statuses, and only two of them need a decision by a person in the office: Review and Ready to invoice. Time and location are recorded at Arrived and Finished and nowhere else.

> *Diagram in the original document (not included in this Markdown): visit lifecycle · 9 statuses, 3 side events.*

The amber boxes can happen at the step they sit above; the highlighted box is the handoff to invoicing.

| Status | Set by | What is recorded |
| --- | --- | --- |
| Scheduled | Scheduling | Crew, time, price, checklist template |
| On the way | Crew tap, optional | Triggers the on-my-way text from the Communications plan; records departure time |
| Arrived | Crew check-in | Time and location; compares with planned start and planned drive time |
| In progress | Automatic after check-in | Checklist progress, notes, photos, incidents |
| Finished | Crew check-out | Time and location; blocked if a required checklist item or photo is missing, unless the crew gives a reason |
| Review | Office | Office sees exceptions, notes and photos; may adjust time, add extra charges or send back |
| Ready to invoice | Office approval | Locks the price, add-ons and HST for the invoice |
| Invoiced in Wave | Billing bridge | Wave invoice ID stored on the visit |
| Paid | Office, by hand | Date, method (e-Transfer or cash), amount |

**Side events:** Running late sends the office and, if enabled, the client a message with a new arrival time. No access records the attempt, notes, photos if any, and flags the visit as a possible fee or three-hour-pay event for the office to decide. Damage or found item opens an incident (section 6). An SOS alert can be sent at any point.

### 4. Crew screens

Crew see six screens, each built for one thumb and one task. The home screen is today's list; everything else opens from a job.

| Screen | What the crew member sees and does |
| --- | --- |
| Today | Ordered jobs for the day, each showing time, client first name and area, assigned teammates and titles, drive time from the previous job, and a status chip. Tomorrow and the week are one swipe away. Pending requests (swaps, time off) show as a small badge |
| Job card | Address with a Navigate button (opens the phone's maps), access instructions (visible only to assigned crew on the day), client notes and preferences, pets and special care, supplies to bring, checklist progress, photos and notes so far |
| Check-in and out | One large button. Check-in records time and location and starts the visit; check-out records them again and runs the finish checks. If location is off, the app records the time and asks the crew member to confirm in a sentence why |
| Checklist | Rooms as collapsible sections, items to tick, optional required items marked, per-item note or photo, progress bar. Large tap targets, no typing needed for the normal path |
| Report a problem | Choose Damage, Found item, Access problem, Safety concern, or Other; add photos and a note; the office is alerted for the first three |
| Running late and emergency | Running late sends a new arrival time to the office and optionally the client. The emergency button silently alerts the office with the crew member's last location and prompts them to call 911 if in danger |

**Behaviour details**

- **On the way.** An optional button before departure sends the client an on-my-way text and records the departure time, which gives the real drive time to compare with the plan.
- **Teammates.** On a multi-person job, anyone assigned can check in; the app records who did and asks for the others to be confirmed present, so each person's time is recorded. If the office has set a personal start or end time for someone, the job card shows each teammate's expected arrival and departure, and a split visit shows as its own job linked to the original.
- **Titles.** The Lead sees completion and review controls; Trainees see the checklist but cannot finish the visit.
- **Language.** Every label, checklist item and message follows the person's language setting, with checklist items stored in both languages.
- **Interruptions.** A phone call or lock screen never loses progress; the visit state is saved after each tap.
- **Finish checks.** Check-out is blocked until required checklist items and required photos are done. A reason field lets the crew finish anyway, and the visit is flagged for office review.
- **After the visit.** A short "anything else the office should know?" prompt, with quick answers such as pet escaped, key issue, client asked for extra.

### 5. Checklists and service templates

A checklist is built from a service template, adjusted for the home, and frozen into a copy when the visit is created. Published cleaning checklists share one structure: rooms, then tasks, with different task sets for standard, deep and move-in or move-out cleans, so the same structure fits Fresh Nest.

**How a visit's checklist is built**

1. **Service template.** One per service: Standard, Deep, Move in or out, Post-construction, Rental turnover, Organizing session. Each has rooms and items.
2. **Rooms from the site.** The site's bedrooms, bathrooms and extra spaces (laundry, basement, garage) generate the room sections automatically.
3. **Site and client overlay.** Office-set extras ("wipe the glass table"), skips ("do not enter the office") and cautions ("unscented products only", "pets"), kept on the site.
4. **Rotation items.** Tasks that happen every few visits, such as baseboards every fourth clean, are added when due, using the date each was last done.
5. **Snapshot.** The visit stores its own copy, so later template changes never rewrite past records.

**Item settings**

| Setting | Options |
| --- | --- |
| Text | English and French |
| Required | No, yes, or required only on move-out |
| Photo | None, optional, or required (move-out walkthroughs often call for a photo of each finished room as proof) |
| Frequency | Every visit, every N visits, or on request |
| Time estimate | Minutes, used later to suggest better job durations |
| Applies to | Which services it appears in |

**Item states during a visit:** Done, Skipped (with a reason: blocked, client request, ran out of time), or Not applicable. A skipped item is flagged for the office but never blocks finishing, unless it is a required item.

**Authoring.** The office edits templates in a simple list editor: copy a standard template, drag to reorder, mark required items, enter both languages. Changes apply to future visits only. Start from the Standard, Deep and Move in or out lists you already use; I would not import generic web checklists wholesale.

**Scale note.** A published guide puts a standard two-bedroom apartment move-out at 4 to 8 hours ([1-800-GOT-JUNK](https://1800gotjunk.com/ca_en/blog/moving/move-out-cleaning-checklist)), so move-out checklists can run to dozens of items and need collapsible rooms and a progress bar.

#### Task lists: saved lists and lists built on the spot

Task lists are the reusable building block of the checklist described above. Saved lists live in a library, any list can be attached to a job, a series, a site or a service, and a new list can be built while scheduling and saved if it proves useful. The office sees "task lists"; the crew sees them as the checklist on their visit. The service templates, site overlays and rotation items above are all just task lists attached in different places.

**Where a list can be attached**

| Attach to | Effect |
| --- | --- |
| This visit only | One job, for a one-off request such as "clean the garage fridge" |
| A recurring series | Every future visit, or every Nth visit for rotation tasks |
| A site | Every visit at that site, for the client's standing extras and cautions |
| A service | The default for every visit of that service, such as the Standard clean list |

Several lists can be attached to one visit. They appear as separate sections on the crew's checklist, in the order the office sets, for example "Standard clean", "Pet care" and "Extra: oven and fridge".

**Building a list on the fly** (in the job drawer)

1. Choose Add task list.
2. Pick one or more saved lists; each shows its task count and estimated minutes. Or choose New list.
3. Type or paste tasks, one per line; every line becomes a task. Set required, photo and minutes on any task in one tap.
4. Switch on Save to library and name it if the list should be reusable.
5. Attach it to this visit, the series, the site or the service.

**Rules**

| Rule | Behaviour |
| --- | --- |
| Copy on attach | Attaching copies the list at that moment. Later edits to a saved list never change visits it is already on |
| Series lists | Changing a list attached to a series updates future visits after a confirmation; the next seven days stay frozen, as in the scheduling plan |
| Finish checks | Required tasks from every attached list count toward the finish check |
| Time check | The scheduler compares the total estimated minutes with the booked duration and shows an information notice if the tasks exceed it |
| Language | Each task has English and French text. A list typed in one language shows the crew's language when available, and the app offers a draft translation for the office to accept; nothing is translated silently |
| Added on site | If you allow it in settings, a Lead can add a task to today's visit for a client request. It is marked "added on site" and flagged for review. Cleaners and Trainees cannot add tasks |
| Library access | Office roles create and edit saved lists; managers can build lists while scheduling; every library edit is audited; lists are archived, not deleted |
| Reporting | Completion rate by list, most-skipped tasks, and time per list against its estimate |

**Screens:** a Task list library (search, tags, duplicate, archive, usage count), a list editor with sections, quick paste and drag to reorder, the attach picker in the job drawer with a preview and total minutes, and a Save as list prompt.

**Data model**

| Record | Fields |
| --- | --- |
| taskList | name, tags, status, version, section structure |
| taskListItem | listId, section, text in English and French, required, photo rule, minutes, order |
| taskListAttachment | target (job, series, site or service), targetId, source list and version or an ad hoc copy, every-Nth setting, order, attachedBy |
| visitChecklistItem | extended with sourceListId, addedBy and addedOnSite |

**Build note:** the library, editor and attach picker ship with the scheduling job drawer in wave 2 so lists can be attached when jobs are booked; crew use of the lists is stage C3 in wave 3.

**Data model**

| Record | Fields |
| --- | --- |
| checklistTemplate | service, name, version, rooms with items, status |
| siteChecklistOverride | siteId, extra items, skipped items, cautions, rotation settings |
| visitChecklist | visitId, templateVersion, snapshot of rooms and items |
| visitChecklistItem | state, note, photoIds, completedBy, completedAt, skip reason |

### 6. Photos, incidents and privacy

Photos are evidence, so the app captures them in a controlled way: taken in the app, time-stamped, stored privately, and kept only as long as they are needed.

**Photo rules**

| Photo type | Rule |
| --- | --- |
| Damage or found item | Required to file the report, at least one photo |
| Before and after | Off by default; turned on per service or client. Suggested default on for move in or out, where proof of the finished clean matters |
| Checklist item | Optional, or required on items you mark |
| Arrival condition | Optional photo and note of existing damage or issues on arrival, which gives a record to compare against |
| Anything else | Optional, attached to the visit with a short note |

**Incident types and what happens**

| Type | Photo | Office alert | Follow-up |
| --- | --- | --- | --- |
| Damage | Required | Immediately | Office calls the client within the agreement's damage-reporting window, records the outcome, links to a claim if needed |
| Found item | Required | Immediately | Held and logged: what, where found, photo, who has it, date returned and to whom |
| Access problem | Optional | Immediately | Office decides on a fee, a re-book or a pay adjustment, and the visit is flagged for the three-hour pay check |
| Safety concern | Optional | Immediately, high priority | Office follows up with the crew member the same day |
| Other | Optional | At review | Noted on the visit and client record |

Every incident has a status (open, with client, resolved, closed), an owner, and a history of who did what. Scored inspections and complaints belong to the Quality plan; incidents here are the field report that feeds it.

**Privacy and handling**

- **Capture inside the app.** Photos are taken with the in-app camera, so the time is recorded and personal photo libraries are not touched. Gallery uploads are off by default.
- **Guidance for crew.** Frame the work or the damage; avoid people, children, documents, mail and screens. This appears once in onboarding and as a one-line reminder on the camera screen.
- **Client awareness.** The service agreement should say that photos of finished work and incidents may be taken and kept. This is added to the Agreements templates.
- **Visibility.** Office roles and the crew assigned to that visit; never other clients' crews. Photos are shown to a client only when the office sends them.
- **Location data.** The app stores time and the check-in location, and removes location data embedded in the image file.
- **Retention.** Routine photos are deleted after a period you set (a 90 day default is proposed); incident photos stay until the incident is closed plus a retention period you choose with advice.
- **Phone limits.** Photos are shrunk on the phone before upload, uploaded one at a time with automatic retry, and capped per visit, because another cleaning app's reviewers report crashes when many large photos are uploaded at once ([Properly](https://apple.co/3cpJDrS)).

### 7. Time, location and drive capture

Three tap events per person per visit give everything payroll, scheduling and reports need: departed, arrived and finished. Pay hours come from arrived to finished; drive time is the gap between one job's finish and the next arrival.

**Events recorded**

| Event | Trigger | Stored |
| --- | --- | --- |
| Departed | "On the way" tap, optional | Time |
| Arrived | Check-in | Time, location and accuracy, who tapped for whom |
| Finished | Check-out | Time, location and accuracy |

Times use the server clock when online. Offline taps keep the phone's time, and on sync the app compares the phone clock with the server and flags large differences for review.

**What is derived**

| Value | Calculation | Used for |
| --- | --- | --- |
| On-site time | Finished minus Arrived, per person | Paid hours |
| Actual drive time | Next Arrived minus previous Finished, per person | Drive-time reports; paid drive time when switched on |
| Planned versus actual | Actual minus the scheduling plan's estimate, for start time, duration and drive | Reports; learned drive times |
| Late and early | Arrived against planned start | Reliability report, never automatic discipline |

**Payroll link.** The timesheet portal you already have stays the approval point. The app pre-fills each employee's entries from visit events; the employee confirms or corrects them, you approve, and the payroll person sees the approved weekly totals. Pay terms (rate, paid drive time or not) come from the employee agreement version in force on the date worked, as set out in the Agreements plan.

**Rules to build in**

| Rule | Behaviour |
| --- | --- |
| Drive time | Unpaid today. Each leg is stored with a paid flag, so switching to paid drive time is an agreement version change, not a rebuild |
| Forgot to finish | After a set time past the planned end, the app prompts, then the office can set the finish with a reason; every edit keeps the original value and an audit entry |
| Location off or weak | Time is recorded and the crew member confirms with a short reason; the visit is flagged, not blocked |
| Location far from site | Check-in beyond a policy distance (for example 250 metres) is flagged for review |
| Breaks | A break record per day, since Ontario has rules on eating periods; confirm requirements with your payroll advisor |
| Short visits | A visit shorter than three hours after the crew arrived, such as a client absent, is flagged for the three-hour pay check |
| Weekly overtime | Hours are totalled per person per week against the 44 hour threshold for the payroll export |
| Multi-person jobs | Each person has their own arrive and finish, so a trainee who arrives later is paid correctly |

**Learning drive times.** Actual drive legs between the same two sites at similar times of day are averaged. After enough samples the scheduler can suggest replacing the map estimate, which matters most for Cornwall Island and Akwesasne routes where bridge and border timing makes map estimates unreliable.

**Weekly export.** One file per pay week: employee, date, visit, in, out, hours, drive minutes with paid flag, adjustments and the reason for each. Vehicle odometer and fuel belong to the later Fleet plan.

**Data model**

| Record | Fields |
| --- | --- |
| timeEvent | visitId, employeeId, type, serverTime, deviceTime, latitude, longitude, accuracy, enteredBy, source |
| timeEdit | timeEventId, old value, new value, reason, editedBy, editedAt |
| driveLeg | employeeId, fromVisitId, toVisitId, minutes, paid flag, plannedMinutes |
| timesheetEntry | prefilled from events; status (draft, confirmed, approved), links to the timesheet portal |

### 8. Web app and offline design

An installed web app is a good fit for this crew experience, with known limits on iPhones that the design works around. Browser-based apps on both phone types can be installed to the home screen, cache their screens, and work offline; iPhones add several restrictions.

**What works and what to design around** (from several 2026 guides found by search)

| Capability | Android | iPhone | Design response |
| --- | --- | --- | --- |
| Install to home screen | Install prompt | Only through Safari's Add to Home Screen; no install prompt | A short install guide with pictures for each phone, shown at onboarding |
| Offline screens and data | Strong | Works, with tighter storage limits and cache eviction | Cache only today and the next two days; show how much is saved on the phone |
| Push notifications | Strong | Supported from iOS 16.4, after install and an opt-in | Ask for permission after a first useful moment, not at launch; require a current iOS |
| Background sync | Supported | Not supported | Send queued items when the app opens or regains signal; show a visible "waiting to send" count |
| Camera and location | Browser permission prompts | Same, with stricter prompts | Explain each permission in plain words before asking |

Sources: [MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide), [MobiLoud](https://www.mobiloud.com/blog/progressive-web-apps-ios), [Tech Interview](https://www.techinterview.org/post/3233475175/progressive-web-apps-manifest-install/?format=md), [Slight Future](https://slightfuture.com/webdev/progressive-web-apps-2026/).

**Offline behaviour**

| Piece | Rule |
| --- | --- |
| What is saved on the phone | Today's and the next two days' visits, checklists, notes, access instructions, and the crew member's own requests |
| Where actions go first | Every tap is saved on the phone, then sent; arrive, finish, checklist items, notes and incidents are append-only records, so they never conflict |
| Schedule changes while offline | Office edits to time, crew or notes win; the crew member sees "updated" the next time they open the app |
| Photos | Saved on the phone, shrunk, and uploaded one at a time; a counter shows how many are waiting; the app asks the user to open it on Wi-Fi if the queue grows |
| Access codes | Saved for the day's visits only, cleared when the visit finishes or the person signs out, and the office can sign a device out remotely |
| Lost phone | The office can end a session; staff are asked to use a phone passcode as a condition of use |
| Clock errors | Offline times are stored with the phone clock and compared with the server clock after sync |

**Install and updates.** Staff install from a link or QR code in under two minutes. The app updates itself in the background and shows "new version ready" at a safe moment, never in the middle of a checklist.

**Fallback plan.** If a pilot with real crew shows push or offline reliability on iPhones is not good enough, the same code can be wrapped as a store app later, so the web-first choice does not close that door.

**Testing matrix before launch:** a current iPhone and an older supported one; a mid-range and a low-storage Android; airplane mode through a whole visit; app killed and reopened mid-checklist; 30 photos queued; a phone clock set wrong; a swapped job arriving while offline.

### 9. Office side: live view, exceptions and review

The office should only have to look at visits that went differently from plan. Clean visits are approved in one tap; exceptions are queued with a suggested action.

**Screens**

| Screen | What it does |
| --- | --- |
| Today live | Every visit today by status, with late and at-risk flags, who has arrived, who is on the way, and next jobs for anyone running behind |
| Exceptions | One queue, ordered by urgency, with a suggested action and one-tap responses (call, message client, reassign, acknowledge) |
| Visit review | Planned versus actual times, checklist summary, photos, notes, incidents, extra time or add-ons, and approve, adjust or send back |
| Ready to invoice | Approved visits waiting for invoicing, grouped by client, with locked price, add-ons and HST, plus push to Wave or export |
| Unpaid | Invoiced visits not yet paid, by client and age; mark paid with date and method |

**Exception types**

| Exception | Urgency | Suggested action |
| --- | --- | --- |
| Emergency alert | Highest | Call the crew member now; the alert shows name, visit, last location and phone, and escalates to a second contact if nobody acknowledges within a set time |
| Safety concern | High | Same-day follow-up with the crew member |
| Damage or found item | High | Contact the client; open or link a claim |
| Running late | Medium | Message the client; check the next job and use Fit it for me if needed |
| No access | Medium | Decide fee, re-book or pay adjustment |
| Missed check-in or check-out | Medium | Contact the crew member and correct the time with a reason |
| Required item or photo skipped | Low | Review at completion |
| Check-in far from the site | Low | Review at completion |
| Visit much longer or shorter than planned | Low | Review and note for future duration estimates |

**Clean visit rule (policy).** A visit is clean when it started within a set margin of plan, every required checklist item and photo is done, there are no incidents, and the length is within a set tolerance of the plan. The office can approve all clean visits at once, then work only through the exceptions.

**Emergency alerts** should reach the office by push and by text, since a push on a phone that is not open may be missed. The office also needs a written procedure for what to do when one arrives, and a test button so alerts are rehearsed.

**Adjusting a visit** (extra time, extra rooms, a re-clean) records a reason, the amount, and who approved it. The amount on the invoice comes from the pricing rules in the Visit Pricing and Billing Rules document (actual time for hourly clients, the agreed price for flat clients) plus these recorded adjustments, never a free-typed number.

**Review target.** Visits reviewed within one business day, so invoices go out while the visit is fresh.

### 10. Data model and security

A visit is the scheduling plan's job document; execution adds status values and subcollections beneath it, so there is one record per visit from booking to payment.

**Additions to the job**

| Where | Fields |
| --- | --- |
| jobs/{id} | status extended to the nine statuses in section 3; actualStart and actualEnd summary; reviewState; approvedBy and approvedAt; priceLocked, addOns total, taxAmount; waveInvoiceId; paidAt, paidMethod |
| jobs/{id}/timeEvents | Append-only departed, arrived and finished events (section 7) |
| jobs/{id}/checklist | Snapshot of the checklist, with item states |
| jobs/{id}/incidents | Incident reports with type, status and owner |
| jobs/{id}/photos | Metadata only: type, item or incident link, storage path, taken time |
| jobs/{id}/notes | Crew and office notes with author and visibility |
| jobs/{id}/adjustments | Extra time, add-ons, discounts, each with a reason |
| alerts | Emergency and safety alerts with acknowledgement history |
| foundItems | Found-item log: item, photo, where found, holder, returned date |

**Who can do what**

| Role | Access |
| --- | --- |
| Crew | Read only visits they are assigned to, in a window around the visit date; add time events, checklist progress, notes, incidents and photos to those visits; no edits or deletes of events once created; no pay or price fields beyond what the visit card needs |
| Manager | Read all visits; review, approve, adjust, mark ready to invoice and paid; correct time events with a reason |
| Owner | Everything, including pay-related fields and policy |
| Payroll | Approved weekly hours only |

**Functions** (the trusted server side)

| Function | Purpose |
| --- | --- |
| checkIn, checkOut | Validate assignment and date window, stamp server time, store location, compute flags |
| reportIncident, sendEmergency | Create incident or alert and notify through one notify function |
| approveVisit, adjustVisit | Office review; recompute locked price and tax |
| markReadyToInvoice | Moves approved visits into the invoicing queue |
| exportTimesheet | Builds the weekly file and the timesheet portal entries |
| cleanupPhotos | Scheduled deletion of routine photos after the retention period |

**Storage and indexes**

- Photos in private cloud storage under the visit, with size and file-type limits, read through short-lived links.
- Indexes: visits by status and date, time events by employee and time, incidents by status, alerts by acknowledgement state.

**Retention.** Hours-of-work and pay records follow the Ontario guidance already used in the Agreements plan: most employee records for three years, payroll and tax records for six years plus the current year ([Ontario guide](https://www.ontario.ca/document/your-guide-employment-standards-act/record-keeping)). Time events and edits are therefore never deleted by cleanup jobs.

### 11. Build plan, tests and open questions

This module needs scheduling's job record and the Employees module, so it starts once scheduling Phase 2 exists. Time capture (stage C2) is the cutover-critical piece because payroll runs on Camelo today.

| Stage | Delivers | Size | Exit criteria |
| --- | --- | --- | --- |
| C1. App shell and Today | Installable web app, sign-in, Today and Job card, offline cache, install guide | M | A crew member installs on iPhone and Android and sees tomorrow's jobs in airplane mode |
| C2. Check-in, check-out and time | Time events, location, flags, corrections with reason, timesheet pre-fill, weekly export | M | One week of visits produces hours that match a manual count within a minute per visit |
| C3. Checklists | Template editor, site overlays, rotation items, snapshots, finish checks | M | Finish is blocked on a required item, and allowed with a reason |
| C4. Notes, photos, incidents | In-app camera, compression and queued upload, incident types, found-item log | M | 30 queued photos upload after reconnecting with none lost |
| C5. Office review | Today live, exceptions queue, visit review, approve clean visits, ready to invoice | M | A day of clean visits is approved in one tap; exceptions show the right suggested action |
| C6. Running late and emergency | On-the-way and late messages, emergency alert by push and text, acknowledgement and escalation | S | An emergency test reaches the office in under a minute and escalates if unacknowledged |
| C7. Pilot and tune | One crew for two pay weeks in parallel with Camelo timesheets; learned drive times | M | Pay-week totals match Camelo; crew rate the app usable; drive-time suggestions appear |

**Tests to write first**

1. Check-in outside the assignment window is rejected on the server.
2. A time event cannot be edited or deleted by crew; an office correction keeps the original and the reason.
3. Airplane mode through a whole visit syncs in order, with no duplicate events.
4. Two crew on one job each record their own arrival and finish.
5. A visit with a skipped required item cannot finish without a reason, and is flagged.
6. Drive time between two finished jobs equals next arrival minus previous finish.
7. A visit under three hours with no access is flagged for the three-hour pay check.
8. A phone with the wrong clock is flagged after sync.
9. Photos from another client's visit are unreachable by the crew member.
10. A clean visit approved in a batch locks its price, add-ons and HST.

**Open questions**

- [ ] Who receives emergency alerts, and who is the second contact if they do not respond? Is a text message acceptable for these?
- [ ] Which checklist items must always be required, such as bathrooms and floors, and which only on move-out?
- [ ] Is a 90 day retention for routine photos right for you?
- [ ] Should crew be allowed to upload from their photo library, or in-app camera only?
- [ ] Should the client get an on-my-way text by default, or only when you turn it on per client?
- [ ] What distance from the site should flag a check-in for review (250 metres is proposed)?
- [ ] How are breaks handled today, and do staff take a set meal break on long days?
- [ ] Do staff drive company vehicles, their own, or both? This sets whether mileage matters.
- [ ] Should crew see their own weekly hours in the app?
- [ ] How many crew members and which phones will be in the first pilot?

**Sources**

- [ZenMaid app overview](https://answers.zenmaid.com/en/articles/6968490-app-overview-for-cleaners), [ZenMaid app guide](https://www.zenmaid.com/magazine/zenmaid-mobile-app-guide/), [ZenMaid cleaner app](https://get.zenmaid.com/cleaning-business-app)
- [Resort Cleaning mobile app](https://www.resortcleaning.com/feature/mobile-app-hk), [Zstar Cleaner](https://mwm.ai/apps/zstar-cleaner/6748201223), [CleanManager](https://apps.apple.com/app/id960244923), [ProhostAI](https://www.prohost.ai/learn/cleanings/guide/cleaner-collaboration)
- [Fieldproxy: quality control](https://www.fieldproxy.ai/blog/9-ways-cleaning-companies-improve-quality-control-with-field-service-s-d1-40)
- [Secret: ZenMaid reviews](https://www.joinsecret.com/zenmaid/reviews), [Properly app listing](https://apple.co/3cpJDrS)
- [Mathews Dinsdale: Ontario electronic monitoring](https://www.mondaq.com/canada/employee-rights-labour-relations/1218236/ontario-ministry-of-labour-updates-guidance-on-electronic-monitoring-policies), [Privacy Commissioner on GPS](https://www.canada.ca/en/news/archive/2006/11/privacy-commissioner-urges-caution-before-installing-gps-company-vehicles.html)
- [1-800-GOT-JUNK: move-out checklist](https://1800gotjunk.com/ca_en/blog/moving/move-out-cleaning-checklist)
- [MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide), [MobiLoud](https://www.mobiloud.com/blog/progressive-web-apps-ios), [Tech Interview](https://www.techinterview.org/post/3233475175/progressive-web-apps-manifest-install/?format=md), [Slight Future](https://slightfuture.com/webdev/progressive-web-apps-2026/)
- [Ontario: employment standards record keeping](https://www.ontario.ca/document/your-guide-employment-standards-act/record-keeping)

---

## Part 7. Visit Pricing and Billing Rules

*ID prefix: `PRC`*

### 1. The rule in one page

For an hourly visit, each cleaner's actual time on site is added together and divided by the number of billed cleaners to give the hours each cleaner is charged. That average is rounded once to the nearest 15 minutes, multiplied by the number of cleaners, and billed at $37.50 per cleaner-hour plus 13% HST. The invoice then reads simply as "2 cleaners × 3 hours", and staggered start and finish times of a few minutes never push the bill up by a quarter hour per person.

**The steps**

1. Take each cleaner's check-in and check-out from the visit's time events.
2. Count only on-site time: no drive time, no recorded breaks, and no minutes before the booked start.
3. Add every billed cleaner's minutes into one visit total.
4. Divide by the number of billed cleaners to get the average minutes per cleaner.
5. Round that average to the nearest 15 minutes.
6. Multiply the rounded hours by the number of cleaners and by $37.50, and round to the cent once.
7. Add recorded add-ons and approved adjustments.
8. Calculate HST at 13% on the taxable subtotal and round to the cent once.

**Example.** Two cleaners are booked 9:00 to 12:00. Anna works 9:00 to 12:05 and Ben works 9:07 to 12:10.

| Item | Value |
| --- | --- |
| Anna | 185 minutes |
| Ben | 183 minutes |
| Visit total | 368 minutes |
| Average per cleaner | 184 minutes |
| Rounded to the nearest 15 minutes | 180 minutes (3.0 hours) |
| Billed | 2 cleaners × 3.0 hours = 6.0 cleaner-hours |
| Subtotal at $37.50 an hour | $225.00 |
| HST at 13% | $29.25 |
| Invoice total | $254.25 |
| For comparison, booked time (6 hours) | $225.00 plus HST, the same as billed |

**This is the default method.** You said pricing varies by client, so each client's agreement can instead use a flat visit price with extras billed hourly, or hourly with an estimate cap (section 5). Everything below applies to the hourly actual-time method unless it says otherwise.

### 2. Decisions and proposed defaults

**Decided**

| Topic | Decision |
| --- | --- |
| Rate | $37.50 per cleaner per hour |
| Billing basis for hourly visits | Actual time worked, from each cleaner's check-in and check-out |
| Rounding | Add all billed cleaners' minutes, divide by the number of billed cleaners, round that average to the nearest 15 minutes, then multiply back by the number of cleaners |
| Minimum charge | None |
| Recurring clients | Pricing method varies by client, set on the agreement |
| Tax | 13% HST, calculated by the app and checked against Wave |

**Proposed defaults awaiting your confirmation**

| Topic | Proposal | Why |
| --- | --- | --- |
| Early arrival | Billing starts at the later of actual arrival and booked start | Clients should not pay for time before they expected anyone; the cleaner is still paid from check-in |
| Breaks | Recorded breaks are not billed | The client is not charged for time nobody works |
| Drive and travel | Never billed | Matches the drive-time design; a travel charge can be added later as a flat line |
| Lead rate | Same $37.50 | One rate until you say otherwise |
| Trainees | Not billed by default | They are learning; a rate can be set per client |
| Early finish | Billed on actual time, so a faster visit costs less | Consistent with the actual-time basis |
| Waiting for check-outs | An invoice is not prepared until every cleaner has checked out or the office has corrected the time | Avoids billing part of a visit |
| Flag for review | A billed total more than 15% or 30 minutes of cleaner time away from the booked total | Catches mistakes without reviewing every visit |
| Split visits | Included in the original invoice, with no separate invoice unless chosen | Matches the plan for multi-person changes |
| Invoice detail | Shows the number of cleaners and the hours each (for example 2 cleaners × 3 hours); each cleaner's times stay on the visit summary | Short invoice, with evidence if a client asks |
| Rate changes | Take effect on a date and apply to visits on or after it, with the client's notice period | Matches the Agreements plan |

### 3. How billable time is calculated

The calculation lives in one pure function in the shared scheduling package, so the review screen, the invoice and the tests all use the same numbers.

```latex
person\_minutes = \max(0,\ finish - \max(arrive,\ start)) - break\_minutes
```

```latex
visit\_minutes = \sum person\_minutes + adjustment\_minutes
```

```latex
avg\_minutes = visit\_minutes / N
```

```latex
billed\_each = 15 \times round(avg\_minutes / 15)
```

```latex
subtotal = round(N \times billed\_each \times rate\_cents / 60)
```

Here start is the booked start for that person: the job's start, or the person's personal start if the office set one (see the multi-person change rules in the scheduling plan). N is the number of billed cleaners on the visit. Round means round half up, so an average exactly halfway between two quarter hours rounds up.

| Step | Rule |
| --- | --- |
| Per-person interval | From the later of check-in and that person's booked start, to check-out. A cleaner who arrives late is billed from their actual arrival |
| Breaks | Recorded break minutes are subtracted |
| Billable people | Only people whose title has a rate above zero; trainees count as zero by default |
| Adjustments | Approved minutes added or removed, each with a reason and the person who approved it |
| Visit total | Sum of all billable people's minutes plus adjustments |
| Rounding | The visit total is divided by the number of billed cleaners and the average is rounded to the nearest 15 minutes, once. Event times are used to the whole minute (seconds dropped), and an average exactly halfway between two quarter hours rounds up |
| Rate | $37.50 is stored as 3750 cents per cleaner-hour, taken from the rate card for the service and title on the visit date |
| Different rates on one visit | If people on the same visit have different rates, each rate group is averaged, rounded and priced on its own, then added together |
| Subtotal | Rounded hours per cleaner times the number of cleaners times the rate, rounded to the cent once. A quarter hour per cleaner is $9.375, so an odd number of cleaner-quarter-hours produces a half cent that is rounded at this step |
| Add-ons | Flat amounts from the price book, each with a tax flag |
| Tax | 13% of the taxable subtotal plus taxable add-ons, rounded to the cent once |
| Total | Subtotal plus add-ons plus tax |

**Precision.** All minutes and money are stored as whole numbers (minutes and cents), never decimal dollars, so the same inputs always give the same invoice.

**What is stored with the visit** so the invoice can always be explained: each person's interval and break minutes, the adjustments, the visit total, the number of billed cleaners, the average per cleaner, the rounded hours per cleaner, the rate used, the subtotal, add-ons, tax and the total. The inputs are kept even after the invoice is sent.

### 4. Worked examples

These six cases are also the first billing tests. All use $37.50 per cleaner-hour, averaging the cleaners' minutes and rounding to the nearest 15 minutes, and 13% HST. Every visit is booked 9:00 to 12:00 unless stated.

| Case | Actual times | Visit minutes | Average each | Billed | Subtotal | HST | Invoice total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. Minutes apart (two cleaners) | Anna 9:00 to 12:05, Ben 9:07 to 12:10 | 185 + 183 = 368 | 184 | 2 × 3.0 h | $225.00 | $29.25 | $254.25 |
| B. One cleaner late | Anna arrives 9:20 and leaves 12:00; Ben 9:00 to 12:00 | 160 + 180 = 340 | 170 | 2 × 2.75 h | $206.25 | $26.81 | $233.06 |
| C. Third cleaner joins late | Anna and Ben 9:00 to 12:00; Chloe 10:15 to 12:00 | 180 + 180 + 105 = 465 | 155 | 3 × 2.5 h | $281.25 | $36.56 | $317.81 |
| D. Early arrival and a break | Anna arrives 8:50, takes a 15 minute break, leaves 12:00; Ben 9:00 to 11:50 | 165 + 170 = 335 | 167.5 | 2 × 2.75 h | $206.25 | $26.81 | $233.06 |
| E. Split visit, one invoice | Anna and Ben Tuesday 9:00 to 12:00; Chloe Thursday 9:00 to 12:00 | 180 + 180 + 180 = 540 | 180 | 3 × 3.0 h | $337.50 | $43.88 | $381.38 |
| F. Add-on and goodwill credit | Same times as A, a 15 minute goodwill credit, and an oven clean add-on of $35.00 | 368 − 15 = 353 | 176.5 | 2 × 3.0 h | $225.00 plus $35.00 | $33.80 | $293.80 |

**What each case shows**

- **A:** the two cleaners' average of 184 minutes rounds to 3.0 hours, so the invoice reads exactly as booked even though both ran a few minutes over.
- **B:** a cleaner who arrives 20 minutes late brings the average down to 170 minutes, which rounds to 2.75 hours each.
- **C:** the part-time third cleaner is averaged in, so the invoice reads 3 × 2.5 hours; the visit summary shows who worked what.
- **D:** the 10 minutes before the booked start are not billed, the break is removed, and the average of 167.5 minutes rounds down to 2.75 hours.
- **E:** the visit total spans two days and prints on one invoice, with a line per day, since the split visit is included by default.
- **F:** a goodwill credit of minutes is taken off before averaging, the add-on is added after, and HST applies to the whole taxable amount.

Each rounding step is worth one quarter hour for every billed cleaner: $18.75 for two cleaners and $28.13 for three, so larger crews round in larger steps. A quarter hour per cleaner at $37.50 is $9.375, so a visit with an odd number of cleaner-quarter-hours produces a half cent, rounded once at the subtotal. For example, 3 cleaners × 2.75 hours is $309.375, billed as $309.38.

### 5. Pricing methods per client

Since pricing varies by client, each agreement picks one of three methods, with a fourth reserved for projects later. The visit then follows the method on the agreement, falling back through the client, the service and finally the hourly default.

| Method | How the visit is priced | Faster visit | Slower visit | Best for |
| --- | --- | --- | --- | --- |
| 1. Hourly, actual time (default) | Section 3 on every visit | Costs less | Costs more | One-time work, move-out, deep clean, new clients |
| 2. Flat visit price, extras hourly | The agreed price for an agreed scope and crew; extra time billed at $37.50 per cleaner-hour only when approved | Same price | Same price unless approved extras | Regular recurring clients who like a predictable bill |
| 3. Hourly with an estimate cap | Hourly actual time, but not above the agreed estimate unless the client approves more | Costs less | Capped at the estimate | Clients who want a firm ceiling |
| 4. Project or quote | A fixed price for a defined project | Same | Same | Later, with the quotes module |

**Method 2 in detail.** The agreement stores the flat price, the crew size and the included crew minutes. Extra time is considered only when the visit's actual crew minutes exceed the included minutes by more than a tolerance (15 crew minutes is proposed) and the office records a reason, such as a client request for additional work, and approves the extra. The extra crew minutes are averaged across the cleaners and rounded like any hourly time. For example, a flat $225.00 visit for two cleaners over three hours includes 360 crew minutes; if the crew works 400 minutes because the client asked for the garage fridge, the extra 40 crew minutes are 20 minutes per cleaner, which rounds to 15, so 0.5 cleaner-hours and $18.75 before HST. If the extra is not approved, the price stays $225.00.

**Method 3 in detail.** The agreement stores the cap before tax. If the computed hourly amount is above the cap, the invoice is limited to the cap unless an increase was approved, with who approved it, when and how recorded. The review screen shows estimate, actual and the difference, so you can decide whether to ask the client for approval. For example, an actual amount of $281.25 against a cap of $260.00 bills $260.00 plus HST unless the client agreed to more.

**Precedence.** A visit-level override (office only, with a reason) beats the agreement method, which beats the client default, then the site, then the service default, then the global hourly default.

**The rate card** holds rates by service, title and effective date.

| Service | Title | Rate per hour | Status |
| --- | --- | --- | --- |
| All hourly services | Cleaner | $37.50 | Current rate |
| All hourly services | Lead | $37.50 | Proposed, same as Cleaner |
| All hourly services | Trainee | $0.00 | Proposed, not billed |
| Other services (deep clean, move-out, organizing) | Any | To be set | Same rate until you say otherwise |

A rate change is a new row with an effective date, so past invoices never change, and it follows the notice period in the client's agreement.

**Add-ons** come from a price book of flat items (for example a specific appliance clean), each with a name in both languages, an amount in cents and a tax flag. They can be attached when booking, added by the Lead on site if you allow it, or added by the office at review.

### 6. Edge cases and rules

| Situation | Rule |
| --- | --- |
| Cleaner arrives before the booked start | Billing starts at the booked start; pay still starts at check-in |
| One cleaner works much longer than the other | Each person's own time is added; nothing is averaged |
| Visit runs past the booked end | Method 1 bills it; method 2 needs an approved reason for extras; method 3 stops at the cap unless the client approves |
| Forgot to check in or out | No invoice is prepared; the office corrects the time with a reason; the original value and the correction both stay on record |
| Corrected times | Billing always uses the corrected time; pay uses the same corrected time unless payroll adjusts it separately |
| Unbooked extra cleaner joins | Not billed unless the office marks the time billable, since sending extra people was your decision |
| Cleaner replaced or swapped | Billed exactly as the booked cleaner would have been; the invoice does not show names |
| Cleaner leaves early (sick or emergency) | Billed on actual time; flagged for review, and a replacement's time is added |
| Trainee on the visit | Billed at the trainee rate, zero by default; can be set per client |
| Client not home or no access | No hourly time is billed. A lockout fee from the agreement applies, as a flat line with a tax flag; the visit is also flagged for the staff three-hour pay check |
| Client cancels late | A cancellation fee from the agreement, as a flat line |
| Client asks the crew to stop early | Billed on actual time (method 1) |
| Goodwill credit or dispute | A recorded adjustment in minutes or cents with a reason and an approver; if the invoice is already sent, a credit is made in Wave |
| Percentage discount on the agreement | Applied to the subtotal after rounding, before tax |
| Tips | Not an invoice item; recorded separately and handled by your payroll policy |
| Currency | Canadian dollars only |
| Two visits at one client on one day | Priced and invoiced separately, unless linked as a split visit |

**Review flags.** The review screen raises a flag, and holds one-tap approval, when any of these is true: a billed total more than 15% or 30 cleaner-minutes from the booked total, a time correction, a recorded break over a set length, an unbooked cleaner, a missing check-out, or an adjustment. Clean visits are approved in one tap, as in the crew execution plan.

### 7. Estimates, review and what the client sees

**Estimate at booking.** For hourly and capped clients the booking shows an estimate: crew size times booked hours times $37.50, plus HST. For example, "Estimate $225.00 plus HST, 2 cleaners for 3 hours". For flat clients it shows the agreed price. The estimate is stored on the job, used for the review comparison, and can be included in the client's reminder if you want.

**The visit review screen** shows, in this order:

1. One line per cleaner: check-in, check-out, break, billable minutes, with any correction marked.
2. The visit total, the rounded total, the rate, and the subtotal.
3. Estimate or flat price against actual, with the difference in dollars and minutes.
4. Add-ons and adjustments, each with its reason.
5. Tax and total.
6. Flags (section 6) and the buttons: Approve, Adjust, Send back to crew.

**What the invoice shows.** One cleaning line per visit, for example "Cleaning, \[date\], 2 cleaners × 3 hours" with quantity 6.00 cleaner-hours and a rate of $37.50, then one line per add-on, a line per credit, the tax, and the total. Cleaner names are not shown. Where there are several days in one invoice (a split visit) each day appears as its own line.

**Visit summary for questions.** An internal page, which the office can send, lists each cleaner's arrival and departure for that visit so a question like "why three hours each" has an immediate answer.

**Words for the agreement.** Add one sentence to the English and French service agreement templates, for example "Time is charged from each cleaner's actual arrival to completion, averaged across the cleaners and rounded to the nearest 15 minutes." That sets the expectation once, before any dispute. This is a drafting suggestion to include in the lawyer review.

**Reports this enables**

| Report | What it tells you |
| --- | --- |
| Billed versus booked | Whether visits regularly run over or under what you quote |
| Billed hours versus paid hours | How many paid minutes you do not bill, from early arrivals, breaks, and unbilled trainees |
| Revenue per cleaner-hour paid | The real margin per hour, with and without paid drive time |
| Rounding effect | The monthly total of rounding up and down, expected to be close to zero |
| Visits flagged and why | Where the process or the estimates need work |

### 8. Sending the invoice to Wave

The app calculates the invoice and Wave issues it, so the two must agree to the cent. The risk is rounding: a quarter hour at $37.50 is $9.375, and Wave may round a line differently from the app.

| Decision | Proposal | Reason |
| --- | --- | --- |
| How the cleaning line is sent | Quantity 1, with the exact subtotal in cents as the price, and the hours and rate in the description (for example "2 cleaners × 2.75 hours at $37.50 per cleaner-hour") | The invoice total is then deterministic whatever rounding Wave applies to quantity times rate |
| Test before relying on it | Create an invoice in Wave with quantity 8.25 at $37.50 and see whether it shows $309.38 or $309.37 | If Wave rounds as the app does, the invoice can show quantity and rate as separate fields |
| Tax | Send the line items with Wave's 13% HST tax code, then read back Wave's tax and total | Wave may round tax per line; the app must compare |
| Reconcile | After creation, compare Wave's subtotal, tax and total with the app's | Catches any difference before the invoice is sent to the client |
| Tolerance | A difference of up to 2 cents is accepted and logged, with Wave's figures treated as the invoiced amount; a larger difference holds the invoice for review | Small rounding differences should not stop billing |
| Products | One for hourly cleaning, one for flat-price visits, one per add-on, one each for lockout and cancellation fees | Reports in Wave match your service types |
| Reference | The visit ID and a version number, so a retry never creates a second invoice | Safe retries |
| Corrections before sending | The invoice is rebuilt from the corrected visit | Nothing has gone to the client yet |
| Corrections after sending | A credit in Wave (or a negative line on the next invoice if credits are not supported on your plan), with the reason | The sent invoice is never silently changed |
| Split visits | One invoice with a line per day | Matches the included-by-default rule |

**To confirm in Wave:** whether a line can carry a decimal quantity like 8.25, how it rounds a half cent, and whether credit notes are available on your plan. These checks take a few minutes with a test customer and belong in the first Wave billing stage.

### 9. Data model, build stages and tests

**Data model**

| Record | Fields |
| --- | --- |
| rateCard | serviceId, titleId, rateCents, effectiveFrom, effectiveTo |
| pricingTerms (on the agreement) | method (hourly actual, flat plus extras, hourly capped, project), flatPriceCents, crewSize, includedCrewMinutes, extraToleranceMinutes, capCents, discountPercent, lockoutFeeCents, cancellationFeeCents |
| priceBookItem | name in English and French, amountCents, taxable, active |
| visitBilling (under the job) | method, per-person lines (employee, title, arrival, finish, start used, break minutes, minutes, rate, billable), adjustments, visit minutes, billed cleaner count, average minutes, rounded minutes per cleaner, subtotal, add-ons, taxable amount, tax, total, estimate, flags, status (draft, held, approved, sent, paid), approvedBy and approvedAt, Wave invoice ID and Wave totals, version |
| billingAdjustment | type (minutes or cents), amount, reason, approvedBy, approvedAt |

**Functions.** calculateVisitBilling (the same pure code runs in the browser for previews and on the server for the real result), approveVisitBilling, adjustBilling, pushInvoice (the Wave bridge).

**Build stages**

| Stage | Delivers | Wave | Size | Exit criteria |
| --- | --- | --- | --- | --- |
| B0 Pricing core | Calculation function, rate card, fixtures for cases A to F | 2 | S | All six cases reproduce to the cent |
| B1 Terms and price book | Pricing terms on agreements, add-on price book, estimate at booking | 2 | S | A booking shows the right estimate for each method |
| B2 Review | Per-person review lines, flags, adjustments, approval | 3 | M | A staggered two-person visit reviews and approves correctly |
| B3 Invoice build and Wave test | Product mapping, the 6.25 hour rounding test, push with read-back and tolerance | 4 | M | An invoice matches the app to the cent, and a retry never duplicates |
| B4 Credits and reports | Credits after sending, billed-versus-paid and rounding reports | 4 | S | A credit appears in Wave and in the unpaid view |

**Tests to write first**

1. The six worked cases in section 4.
2. Seconds are dropped from event times before calculation, and an average exactly halfway between quarter hours rounds up.
3. A break longer than the interval gives zero minutes, never negative.
4. A trainee at a zero rate adds no minutes or money and is not counted as a cleaner.
5. Two rate groups on one visit are rounded separately.
6. Method 2: exactly 15 extra crew minutes bills nothing; 16 needs an approved reason.
7. Method 3: below the cap bills the computed amount; above bills the cap; an approved increase bills the computed amount.
8. A corrected check-out recalculates and keeps the original value.
9. An early arrival is clamped to the person's booked start, including a personal start.
10. A rate change on a given date applies only to visits on or after it.
11. A split visit produces one invoice with a line per day and no second invoice.
12. A Wave read-back one cent different is accepted and logged; five cents different holds the invoice.

### 10. Open questions

- [ ] Is it right that billing starts at the later of actual arrival and booked start, so early minutes are not billed?
- [ ] Should recorded breaks stay out of the bill, and how long can a break be before it is flagged?
- [ ] Is the Lead rate the same $37.50, and should trainees be unbilled by default?
- [ ] Should an unbooked extra cleaner be unbilled unless the office marks the time billable?
- [ ] Is a flag at 15% or 30 cleaner-minutes away from the booked total the right threshold?
- [ ] Should clients see an estimate in their reminder, or only on the booking confirmation?
- [ ] For flat-price clients, how are extras handled today, and is a 15 crew-minute tolerance reasonable?
- [ ] Do any clients have a different hourly rate or a percentage discount, and should discounts apply before tax?
- [ ] What are the rates for deep clean, move-out, post-construction and organizing: the same $37.50, or different?
- [ ] Do you charge lockout or late-cancellation fees today, and how much?
- [ ] Should the invoice ever show cleaner names, or stay at totals?
- [ ] Who besides you may approve adjustments and credits?
- [ ] Split visits: invoiced inside the original by default, as proposed, or separately?
- [ ] In Wave: can a line carry a decimal quantity, how does it round a half cent, and are credit notes available on your plan?

---

## Part 8. Module Review and Gap Analysis (market review and decisions)

*ID prefix: `REV`*

### 1. What we have planned so far

Four plan documents now cover five modules, all built around scheduling. Clients, Employees and the self-service functions are the foundation; Scheduling is the core; Agreements ties people and clients to the terms of the work.

| Module | Plan document | What it covers | Depends on |
| --- | --- | --- | --- |
| Scheduling | Scheduling Module Plan | Jobs, one-to-many titled assignments, recurring series, drive-time validation, Fit it for me, board, Camelo parallel run, phases 0 to 8 | Clients, Employees |
| Clients | Clients and Employees Modules Plan | Clients, contacts, payers, sites, attachments, preferences, import, privacy | Shared foundations |
| Employees | Clients and Employees Modules Plan | Profiles, titles, skills, availability record, time off record, driver eligibility, roles, onboarding | Shared foundations |
| Agreements | Contracts Module Plan | Client service agreements, team agreements, templates, signing, renewal alerts, retention | Clients, Employees |
| Employee self-service | Availability, Time Off and Shift Swaps Plan | Preferred days and hours, time-off requests, job swaps and hand-offs, notifications | Employees, Scheduling |

**Shared foundations already assumed across all of them:** Firebase auth with roles and claims, audit log, soft delete, search, Camelo IDs on imported records, one scheduling-core package, bilingual English and French, the Fresh Nest design system, and a link to the existing timesheet portal.

**Decisions locked in so far**

| Topic | Decision |
| --- | --- |
| Camelo | Run alongside, then replace |
| Job mix | Recurring and one-time are both first-class |
| Drive-time shortfall | Warn, manager may override, and the app offers to shift jobs, including later ones |
| Job titles | Per assignment, defaulting from the employee profile |
| Pay | Weekly; drive time unpaid now, a data-driven switch later |

**Not yet planned:** anything that touches money (quotes, invoices, payments), anything the client sees, anything the crew does inside a job, and anything that measures the business. Sections 3 and 4 check that against the market.

### 2. How other cleaning and field service apps are organized

The leading tools share a common shape: they take a job from first enquiry through quote, booking, scheduling, the visit itself, payment and follow-up, with the schedule in the middle. Our plans so far cover the middle and the people on either side of it. Details below come from vendor pages and review sites found by search, so treat them as marketing descriptions.

| Tool | Positioning | Notable features | Reported limits | Source |
| --- | --- | --- | --- | --- |
| Jobber | All-in-one home service tool, used for cleaning | Online booking and request forms that capture size and access info; quotes with signature approval; client hub for approving quotes, viewing visits and paying; invoicing and automatic payments; reusable checklists and custom forms; GPS and route optimization; follow-ups and review requests | One reviewer was unimpressed with the client hub | [Jobber](https://www.getjobber.com/academy/cleaning/best-apps-for-cleaning-business/), [Jobber booking](https://www.getjobber.com/?p=25617), [LawnStarter](https://www.lawnstarter.com/blog/?p=50034) |
| Housecall Pro | Home service platform with a cleaning offering | Booking, dispatch, quotes from a price book, signatures, photos, invoicing, payments, job costing, review and marketing automation, QuickBooks sync | A review notes missing route optimization; some marketing depth costs extra | [Dupple](https://dupple.com/reviews/housecall-pro), [Tech.co](https://tech.co/field-service-management/cleaning-service-software) |
| ZenMaid | Built for maid services | Recurring appointments, instant booking form, invoicing, client tipping by text, cleaner SOS alert, digital checklists, cleaner GPS, availability and paid-time-off tracking, payroll | Reviewers report payroll problems, particularly where travel time is paid, and no photo capture of found or damaged items | [Toolradar](https://toolradar.com/tools/zenmaid), [Secret reviews](https://www.joinsecret.com/zenmaid/reviews), [Invoicing page](https://get.zenmaid.com/invoicing-v2) |
| Launch27 | Online booking for residential cleaning | Booking widget with pricing by bedrooms, bathrooms, hours or postal code; card pre-authorization; recurring bookings; gift cards, discount codes, referrals; client ratings; customer portal; payroll on higher plans | Interface described as dated; pricing scales with volume | [Launch27](https://www.launch27.com/software-features/), [Fitgap](https://us.fitgap.com/products/launch27) |
| BookingKoala | Booking and marketing for cleaners | Coupons, daily discounts for slow days, campaigns, gift cards, leads and prospects, referral and rating system, GPS clock-in, multilingual | Priced higher on premium plans | [BookingKoala](https://www.bookingkoala.com/?p=14), [GetApp](https://www.getapp.com/industries-software/a/bookingkoala) |
| MaidCentral | Growing residential cleaning companies | Online booking and customer portal, sales and marketing automation, employee scheduling and attendance, employee portal, payroll, unified texting and email | Custom pricing | [Software Advice](https://www.softwareadvice.co.uk/compare/15752/80391/zenmaid/vs/maid-central) |
| Connecteam | Hourly workforce tool | GPS time clock, scheduling, team chat, training modules; no client management | Not a full cleaning system | [BigChange](https://www.bigchange.com/blog/cleaning-business-apps) |
| Swept, CleanGuru, Janitorial Manager | Commercial and janitorial | Inspections with scored reports, supplies, issues, bidding, timekeeping, client portal and reports | Fewer residential booking features | [Swept](https://linkedin.com/company/swept), [Jobber on CleanGuru](https://www.getjobber.com/academy/cleaning/clean-guru-app-alternatives/), [Janitorial Manager](https://www.janitorialmanager.com/reviews/) |

**What the market treats as standard** (the module map in section 5 uses these groups)

1. Lead capture and online booking, with instant pricing by home size.
2. Quotes and estimates, with approval or signature.
3. Scheduling, dispatch and routing, with recurring appointments.
4. Client records and a client portal for viewing visits, paying and rebooking.
5. Invoicing and payments: card on file, automatic charge, tips, deposits and pre-authorization.
6. A crew mobile app with job details, checklists, photos, clock-in, GPS and an emergency alert.
7. Automated messages: reminders, on-my-way notices, follow-ups.
8. Time tracking and payroll.
9. Reviews, feedback, referrals, coupons, gift cards and campaigns.
10. Quality control: checklists, photo proof, inspections; plus supplies and inventory.
11. Reports: revenue, retention, job costing, productivity.
12. Integrations: accounting, payment processors, calendars and automation tools.

**What these tools handle poorly, which is where a custom build can beat them:** paid or unpaid travel time in payroll, bilingual operation, drive-time validation between jobs, photo evidence of found or damaged items, and fit for senior downsizing, project and cross-border work.

### 3. Coverage check against the market

Of the 12 standard groups, our plans fully cover 1, partly cover 7 and do not yet cover 4. The scheduling core is strong; the money, client-facing and in-the-field layers are thin.

| # | Standard group | Status | What we have | What is missing |
| --- | --- | --- | --- | --- |
| 1 | Lead capture and online booking | Partly | Client status "Lead", referral source | Request or booking form, instant pricing, lead pipeline and follow-up |
| 2 | Quotes and estimates | Not planned | Price fields on agreements | Quote record, price book, service add-ons, approval and signature, quote-to-job conversion |
| 3 | Scheduling, dispatch, routing | Covered | Full scheduling plan including drive time and auto-fit | Route grouping suggestions, which are a later item |
| 4 | Client records and portal | Partly | Clients, sites, contacts, attachments | Client portal for viewing visits, rebooking, paying, signing |
| 5 | Invoicing and payments | Not planned | Payer record; bill-to hook | Invoices, taxes, card or e-Transfer payment, card on file, deposits, tips, statements |
| 6 | Crew mobile app | Partly | My day, access notes, swaps, time off | Arrive and depart, checklist completion, photos, notes, emergency alert, running late |
| 7 | Automated messages | Partly | Employee notifications; client reminders listed for later | Client reminders, on-my-way, running late, two-way text, follow-ups |
| 8 | Time tracking and payroll | Partly | Separate timesheet portal, linked by assignments and pay terms | Job-level time capture, GPS clock-in, mileage, travel-time pay switch, payroll export |
| 9 | Reviews, feedback, referrals, marketing | Not planned | Nothing | Post-visit rating, review requests, referral credit, coupons, gift cards |
| 10 | Quality control, supplies, equipment | Not planned | "Checklist" attachment type only | Scored inspections, photo proof, issue tracking, supplies and equipment inventory |
| 11 | Reports and analytics | Partly | Agreements dashboard, swap and hours reports | Company-wide revenue, retention, job profitability, productivity |
| 12 | Integrations | Partly | Maps, calendar feed | Accounting, payment processor, email and text provider |

**Needs specific to Fresh Nest** (from your expansion report and plans, which generic tools handle poorly)

| Need | Why it matters | Status |
| --- | --- | --- |
| Senior downsizing and project work | Multi-day jobs with phases, hourly or flat pricing, donation and haul-away tracking, an approver such as a family member | Partly (agreement type exists; no project model) |
| Move-in and move-out, post-construction, junk removal | One-time jobs sold by size or load, often via realtors and contractors | Not planned (no quote or referral-partner tracking) |
| Short-term rental turnover | Schedule driven by guest calendars, linen and restocking, many short visits | Not planned (no calendar import) |
| Commercial janitorial | Per-square-foot or monthly pricing, inspections, supplies, after-hours access | Partly |
| Funded and referred clients (for example Akwesasne community programs) | The payer is a program, not the occupant; referral partner relationships need tracking | Partly (payer record only) |
| Bilingual operation | English and French for staff, clients and documents | Covered in each plan; needs one translation system |
| Cross-border and territory work | Border flag, insurance, route overrides | Partly (route override table and flag) |
| Vehicles and equipment | Vehicle sign-out, odometer, fuel, damage, maintenance | Not planned (only driver eligibility) |
| Insurance and compliance records | Liability insurance certificates, WSIB status, background checks, client proof requests | Not planned |

### 4. Gaps, ranked

Fifteen plans are still missing: five are needed before the app can replace Camelo for daily running, five should follow soon after, and five can wait. Priority is judged by what you need to run a normal week without Camelo, with an assumption flagged where I do not know how you operate today.

| Rank | Missing plan | Why it matters | Priority | Depends on |
| --- | --- | --- | --- | --- |
| 1 | **Crew job execution** (mobile): arrive and depart, checklist completion, photos, notes, found or damaged items, running late, emergency alert | This is how real drive and job times are captured, how quality is proven, and what crew use all day | A. Needed before cutover | Scheduling, Employees |
| 2 | **Time capture and payroll link**: job-level clock in and out, GPS check, mileage, the paid drive-time switch, weekly payroll export | Your timesheet portal exists, but it does not yet connect to jobs, and ZenMaid reviewers show payroll is where tools fail | A. Needed before cutover | Crew job execution, Agreements |
| 3 | **Client communications**: reminders, on-my-way, running late, two-way text and email, bilingual templates, notification engine shared with staff alerts | Cuts no-shows and phone calls, and every other plan already assumes notifications | A. Needed before cutover | Clients, Scheduling |
| 4 | **Billing**: invoices, HST, e-Transfer and card payments, card on file, tips, statements, failed-payment follow-up | Every tool surveyed bundles this; if Camelo or another tool bills today, you need a replacement | B. Soon after: a bridge to Wave (section 7) | Agreements, Clients |
| 5 | **Platform and delivery**: settings and policy admin, environments, backups, monitoring, deployment, test data, offline and app-versus-web decision, data migration and cutover runbook | Each plan assumes these, and no document owns them | A. Needed before cutover | All |
| 6 | **Quotes, pricing and lead intake**: price book, add-ons, quote approval, request or booking form, lead pipeline | Brings in new clients, essential for move-out, post-construction, downsizing and realtor work | B. Soon after | Clients, Agreements |
| 7 | **Quality and incidents**: scored inspections, client feedback, complaints, damage and insurance claims, corrective action | Protects clients and the business; ties to your escalation process | B. Soon after | Crew job execution |
| 8 | **Reports and analytics**: revenue, retention and churn, job profitability including unpaid drive time, productivity per crew | Tells you which clients and areas pay; the drive-time data is a differentiator | B. Soon after | Billing, Time capture |
| 9 | **Project and downsizing management**: multi-day jobs with phases, hourly or flat estimates, donation and haul-away log, family approver | Your highest-priority expansion line, and generic tools handle it poorly | C. Later: senior downsizing launches last | Quotes, Agreements |
| 10 | **Compliance records**: liability insurance certificates, WSIB status, background checks, training | Clients, realtors and funded programs ask for proof | B. Soon after | Employees, Agreements |
| 11 | **Client portal**: view visits, reschedule or skip, pay, sign, message | Reduces calls; every major tool has one | C. Later | Billing, Communications |
| 12 | **Vehicles, equipment and supplies**: sign-out, odometer, fuel, damage, maintenance, supplies stock and reorder | Your vehicle agreement already requires a sign-out sheet | C. Later | Employees, Crew execution |
| 13 | **Reviews, referrals and marketing**: post-visit rating, review requests, referral credit, coupons, gift cards, campaigns | Growth tools that use the data above | C. Later | Communications, Quality |
| 14 | **Short-term rental turnover**: guest calendar import, turnover windows, linen and restock lists | Only when you take on that service line | C. Later | Scheduling |
| 15 | **Integrations**: accounting (for example QuickBooks), payment processor, text provider, calendars | Reduces double entry; best chosen once billing is designed | C. Later, but pick providers early | Billing |

**Assumptions I need confirmed:** whether Camelo handles invoicing and payroll today, whether clients pay by e-Transfer, cash, card or all three, and whether you plan a native phone app or a web app installed from the browser. The answers move gaps 2, 4 and 5 up or down.

### 5. Proposed module map and build order

The map below shows the five planned modules in the centre and the gaps around them, coloured by priority. The schedule is the hub; people and places feed it, field and money modules grow out of it, and insight sits on top.

> *Diagram in the original document (not included in this Markdown): module map · 5 planned, 12 gaps drawn.*

The four amber boxes are what stand between today's plans and a working week without Camelo.

**Build waves** (each wave leaves the app usable)

| Wave | Modules | Outcome | Maps to existing stages |
| --- | --- | --- | --- |
| 0 | Platform and delivery | Auth, roles, audit, environments, notifications shell, backups, design system | Clients and Employees stage A |
| 1 | Employees, Clients and sites, Agreements tracking, availability and time off | People, places and terms are in the app; signed documents tracked with alerts | Clients and Employees stages B to D; Agreements G1 to G2; Self-service E1 to E2 |
| 2 | Scheduling core, Camelo import | Jobs, assignments, drive-time checks, Fit it for me, recurring series, parallel run begins | Scheduling phases 0 to 6; Self-service E3 to E5 |
| 3 | Crew job execution, Time capture and payroll link, Client communications | A normal week runs end to end: crew works from phones, hours reach pay, clients get messages, completed visits are ready to invoice | New plans; Scheduling phases 7 to 8; Agreements G3 to G6 |
| 4 | Wave billing bridge, Quotes and leads, Quality and incidents, Reports, Compliance records | Bring in and protect work; see what pays | New plans |
| 5 | Project work, Client portal, Fleet and supplies, Reviews and marketing, Rental turnover | Growth and convenience | New plans |

**Camelo cutover gate** (end of wave 3): two consecutive weeks of schedule parity; crew using phones for check-in and checklists; weekly pay produced from captured time; client reminders sending; invoicing agreed (manual in Wave until the bridge ships); backup restore and rollback rehearsed.

**Build or integrate**

| Capability | Recommendation | Why |
| --- | --- | --- |
| Scheduling, drive-time checks, Fit it for me, swaps | Build | The differentiator; tools surveyed do not do it |
| Agreements and renewal alerts | Build | Small, and ties to scheduling and pay terms |
| Card payments | Not needed early: clients pay by e-Transfer and cash; Wave Payments or a processor can be added later | Holding card data is a risk to avoid |
| Interac e-Transfer | Track manually at first | Many Canadian clients pay this way; no custom banking integration needed |
| Accounting | Integrate with Wave through its API (customers, invoices, payments), subject to plan access | Do not build a ledger |
| Text and email | Use a messaging provider behind one notify function | Deliverability and consent handling are specialised |
| Maps and geocoding | Integrate Google Maps services | Already planned |
| Payroll | Export approved hours to your payroll provider; keep approvals in the timesheet portal | Tax and remittances are specialised |
| Quotes and price book | Build lightweight | Needs to know your services, sizes and add-ons |

### 6. Next planning steps and open questions

**Recommended order for the next plans**

| Order | Plan | Why first |
| --- | --- | --- |
| 1 | Crew job execution | Produces the real arrival, departure and photo data that time capture, quality and reports all rely on |
| 2 | Time capture and payroll link | Connects jobs to the existing timesheet portal and the weekly pay run, including the unpaid-now, paid-later drive-time switch |
| 3 | Client communications | One notification engine serves staff alerts and client messages; unblocks reminders and on-my-way |
| 4 | Billing | Per-visit invoices go to Wave; needs the Wave API plan check first |
| 5 | Platform and delivery | Written alongside the above so environments, backups, migration and the cutover runbook match the real design |

After those five, a consolidating master plan should map every module and stage into your existing FSM epic structure, so the earlier 15-epic plan and these new plans do not drift apart.

**Questions**

These questions were answered on October 26; the answers and their effects are in section 7.

- [ ] Does Camelo handle invoicing, payments or payroll for you today, or are those done elsewhere?
- [ ] How do clients pay now: Interac e-Transfer, cash, cheque, card, or a mix? Do you want automatic card charges for recurring clients?
- [ ] Are you registered to charge HST, and which accounting software do you use?
- [ ] Should crew use a phone app installed from the browser (one build for iPhone and Android) or do you want store apps? Which phones do staff have?
- [ ] Should the app record staff location only at check-in and check-out, or also during the day?
- [ ] Are photos inside clients' homes acceptable to your clients? If so, which ones are required (damage and found items only, or before and after)?
- [ ] Do you want clients to book online in the first year, or will bookings stay by phone and message?
- [ ] Which service line launches first: senior downsizing, move in or out, post-construction, short-term rentals or commercial? This ranks quotes, project work and rental turnover.
- [ ] Do you want a client portal early, or are reminders and messages enough for now?
- [ ] Which of the 12 standard groups in section 3 do you consider unnecessary for Fresh Nest?

**Sources** (vendor pages and review sites found by search; features and prices change)

- [Jobber: best cleaning apps](https://www.getjobber.com/academy/cleaning/best-apps-for-cleaning-business/), [Jobber booking and forms](https://www.getjobber.com/?p=25617), [Jobber on CleanGuru alternatives](https://www.getjobber.com/academy/cleaning/clean-guru-app-alternatives/)
- [LawnStarter: Jobber review](https://www.lawnstarter.com/blog/?p=50034)
- [Dupple: Housecall Pro review](https://dupple.com/reviews/housecall-pro) and [Tech.co: cleaning service software](https://tech.co/field-service-management/cleaning-service-software)
- [Toolradar: ZenMaid](https://toolradar.com/tools/zenmaid), [ZenMaid reviews](https://www.joinsecret.com/zenmaid/reviews) and [ZenMaid invoicing](https://get.zenmaid.com/invoicing-v2)
- [Launch27 features](https://www.launch27.com/software-features/) and [Fitgap: Launch27](https://us.fitgap.com/products/launch27)
- [BookingKoala features](https://www.bookingkoala.com/?p=14) and [GetApp: BookingKoala](https://www.getapp.com/industries-software/a/bookingkoala)
- [Software Advice: ZenMaid vs MaidCentral](https://www.softwareadvice.co.uk/compare/15752/80391/zenmaid/vs/maid-central)
- [BigChange: cleaning business apps](https://www.bigchange.com/blog/cleaning-business-apps)
- [Swept](https://linkedin.com/company/swept) and [Janitorial Manager](https://www.janitorialmanager.com/reviews/)
- [Fieldproxy: cleaning software features](https://www.fieldproxy.ai/blog/cleaning-business-software-comparison) and [quality control](https://www.fieldproxy.ai/blog/9-ways-cleaning-companies-improve-quality-control-with-field-service-s-d1-40)
- [GoAudits: software for cleaning business](https://goaudits.com/blog/best-software-for-cleaning-business/)

### 7. Decisions from the review (October 26)

| Topic | Decision | Effect |
| --- | --- | --- |
| Camelo today | Handles scheduling plus payroll and time; not invoicing | Time capture and payroll link stays a cutover requirement; billing does not |
| How clients pay | Interac e-Transfer and cash or cheque | No card processor early; payments are marked paid by hand |
| Tax and books | HST-registered, using Wave | Invoices and HST stay in Wave; no invoice or tax engine to build |
| Invoicing rhythm | Per visit | A ready-to-invoice queue and a per-visit push to Wave |
| Crew app | Installable web app | One build for iPhone and Android |
| Location | Check-in and check-out only | No continuous tracking |
| Photos | Required for damage and found items; before-and-after supported where turned on; other photos optional | Photo rules are settings per service and client |
| Booking | Website request form that you price and confirm | No instant online pricing (dropped from scope) |
| Launch order | Recurring home cleaning, then move in or out, then rentals or commercial, then senior downsizing | Project and downsizing tools move to the later list |
| Client portal | Later; reminders and messages first | Communications plan comes before any portal |

**Billing approach**

1. Crew marks a visit complete; it lands in a ready-to-invoice queue with the price locked at booking, add-ons or extra time, and 13% HST.
2. The office reviews and approves the visit.
3. Until Wave's API is confirmed available on your plan, the app exports a customer and invoice file for import. After that, approval creates the invoice in Wave directly.
4. Each client record keeps its Wave customer ID. Payments received by e-Transfer or cash are marked paid in the app and synced to Wave.
5. An unpaid list shows visits invoiced but not paid, by client and age.

**To confirm:** whether Wave's API needs a paid Wave plan (the sources disagree), and whether Wave can send invoices in French.

---
