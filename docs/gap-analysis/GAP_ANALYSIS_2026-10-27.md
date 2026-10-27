# FSM Gap Analysis — Repo vs FSM Master Specification

**Date:** 2026-10-27 · **Spec:** [`docs/projects/FSM_MASTER_SPEC.md`](../projects/FSM_MASTER_SPEC.md) v1.1 (Oct 27 2026) · **Repo:** `main` at `9104cb1` (after PR #36)
**Method:** Part 0 protocol. I read each part, then the code across four layers (types and data model, rules and functions, UI, tests). No application code was changed.

**Granularity.** The protocol asks for one row per rule. Many sections are entirely absent from the repo (Agreements, for example), so I give one row per **section or table** when every item in it has the same status. I split rows wherever the status differs inside a section. A row such as "SCH-S8 validator codes" is broken into one line per code because the codes differ.

**Search aliases used before marking Missing.**
- **job / visit / shift / booking.** The repo uses `jobs`, generated from `bookings`. Crew screens call them "shifts".
- **employee / staff.** The repo uses `staff`.
- **client / customer / booking.** There is no client record. Client data lives on each `booking`, and `customers` is the customer-portal login profile.
- **agreement / contract / terms.** Only staff terms acceptance exists.
- **availability / blocked windows.**
- **title / role.**
- **task list / checklist template.**
- **time event / check-in.**

---

## 1. Summary

### Counts by status (rows in the matrices below)

| Part | Done | Partial | Different | Missing | N/A | Unclear | Rows |
|---|---|---|---|---|---|---|---|
| 1 MP — Master plan | 4 | 16 | 11 | 10 | 4 | 1 | 46 |
| 3 CE — Clients and employees | 1 | 13 | 5 | 18 | 0 | 0 | 37 |
| 2 SCH — Scheduling | 0 | 13 | 11 | 31 | 0 | 0 | 55 |
| 4 AGR — Agreements | 0 | 1 | 0 | 15 | 0 | 0 | 16 |
| 5 AVL — Availability, time off, swaps | 0 | 5 | 2 | 15 | 0 | 0 | 22 |
| 6 CRW — Crew job execution | 10 | 20 | 2 | 32 | 1 | 1 | 66 |
| 7 PRC — Pricing and billing | 0 | 0 | 3 | 14 | 2 | 0 | 19 |
| 8 REV — Market coverage | 1 | 6 | 1 | 4 | 0 | 0 | 12 |
| **Total** | **16** | **74** | **35** | **139** | **7** | **2** | **273** |

**Overall.** The repo is a bilingual **booking-centred** website plus admin panel, with a working crew PWA built for single-cleaner jobs.
- It covers most of the spec's *crew checklist* path, the *task list library and attach* feature (P3-E34), and the *website request form*.
- It has early versions of several wave 4–5 items the spec defers: post-visit reviews, referrals, a customer portal, an analytics dashboard and a Stripe hook.
- It has **none** of the wave 0–1 data foundations the spec's critical path depends on: clients, sites with coordinates, titles, time off, agreements and settings.
- Its scheduling model is **one booking → one job → one cleaner at a fixed 09:00–11:00 placeholder time**, with no way to edit the time in the UI.

### The five largest gaps

1. **No client and site model (CE-S2, SCH-S3).** Client details are copied onto every booking. There is no site record, so there are no coordinates, time zone, allowed windows or access data. Everything in drive time, Fit it for me, Camelo import and agreements needs this first.
2. **Scheduling core is missing (SCH-S3–S8, S11).** The gaps:
   - no editable job times (all jobs are 09:00–11:00);
   - one assignee per job, with no titles;
   - no recurring series (renewals create the next booking 14 days ahead, with "monthly" as +30 days);
   - no drive-time engine (a fixed 30/60-minute buffer, waived within the same postal area);
   - no Fit it for me, and no server-side validator or `rev` checks.
3. **Time capture is not payroll-grade (CRW-S7, MP-S5.4).**
   - Check-in and check-out overwrite fields on the job (`checkedInAt`, `completedAt`). There are no append-only time events.
   - Check-out captures no location, and there are no per-person times, no correction trail and no weekly export.
   - The spec makes this cutover-critical.
4. **Agreements, availability and time off are absent (AGR all, AVL-S3–S5).** Only staff terms acceptance and self-managed blocked windows exist. There are no time-off requests, no swap or hand-off flow (only the self-claim Shift Board), and no notice-deadline alerts.
5. **Visit pricing and the Wave bridge are absent, and money is decimal dollars (PRC all, MP-S5.10).**
   - There is no billing function, rate card, review queue or Wave integration.
   - Prices and pay rates are stored as decimal dollars.
   - The six worked cases in PRC-S4 can't be run because no calculation exists. They are listed as the first tests to write in the backlog.

**Also urgent (live defect found during the audit):**
- Crew checklist photos upload to `jobs/{jobId}/photos/…`, but `storage.rules` denies every path except `gallery/`.
- Required-photo uploads from the crew app therefore fail in production and stay in the device queue.
- See Risks R1. Fixing this needs a human-approved Storage rules change.

---

## 2. Matrix

Columns: `ID | Requirement (short) | Status | Evidence | Gap / notes | Wave | Size`. Wave and size are the spec's, where it gives them.

### Part 1 — MP (Master Project Plan)

Inspected: `firebase.json`, `.github/workflows/*` (ci, codeql, docs-check, e2e, firebase-deploy, firebase-preview, security-audit), `firestore.rules`, `storage.rules`, `functions/src/index.ts`, `functions/src/callable/{auth,payments}.ts`, `apps/*/src/main.tsx` (Sentry), `packages/shared`, `tailwind.config.js`, `docs/decisions/ADR-*`.

| ID | Requirement (short) | Status | Evidence | Gap / notes | Wave | Size |
|---|---|---|---|---|---|---|
| MP-S1 | Five-wave delivery, Camelo cutover at end of wave 3 | N/A | — | Narrative. The repo has its own phase plan (`docs/ACTIVE_CYCLE.md` Phase 3, P3-E*) that does not map onto these waves yet | — | — |
| MP-S2.1 | Users: Owner, Manager, Crew (Lead/Cleaner/Trainee), Payroll, Clients | Partial | `functions/src/callable/auth.ts:28-31` (roles admin, supervisor, staff, customer); `firestore.rules:7-15` | No Manager-specific permissions (supervisor = staff in rules), no Payroll role, no Trainee title | 0 | S |
| MP-S2.2 | Success measures (parity, hours accuracy, review speed…) | Missing | — | No parity report, review timestamps or measurement | 2–3 | M |
| MP-S3.1 | Camelo: run alongside, then replace | Missing | No Camelo code | See MP-S8 | 1–3 | L |
| MP-S3.2 | Recurring and one-time both first-class | Different | `functions/src/scheduled/renewals.ts:30-93` | Recurring = next pending booking created 14 days ahead; no series | 2 | L |
| MP-S3.3 | Drive-time shortfall: warn, override with reason, offer to shift | Partial | `apps/customer/src/lib/utils/scheduling.ts:75+`, `OverrideModal.tsx`, `assignCleanerTransaction` audit (`firestore.ts:148-227`) | Warn + override + audit exist, using a fixed buffer, not drive time; no "shift to fit" | 2 | L |
| MP-S3.4 | Job titles per assignment, default from profile | Missing | `Staff.role` only (`packages/shared/src/types/staff.ts:3`) | One assignee per job, no per-assignment title | 2 | M |
| MP-S3.5 | Pay weekly, drive unpaid with switch | Different | `functions/src/scheduled/earnings.ts` (monthly rollover); `ExportRecordModal.tsx:16-17` (monthly CSV) | Earnings are tracked monthly for ODSP/OSAP caps; no weekly pay, no drive legs | 3 | M |
| MP-S3.6 | Crew app = installable PWA | Done | `apps/fsm/vite.config.ts:3,9` (VitePWA); hosting target `freshnest-fsm` | — | 3 | — |
| MP-S3.7 | Location only at check-in and check-out | Different | `JobPage.tsx:162` (check-in geo); `OfflineUploadProvider.tsx:154-168` (photo geo) | Check-out records no location; every photo is geotagged, which is a third capture point the decision excludes | 3 | S |
| MP-S3.8 | Photos required for damage and found items; before/after where enabled | Partial | `ChecklistTask.requiresPhoto/photoPhase` (`common.ts:4-12`) | Per-task photo rules exist; no incidents, so no damage or found-item photos | 3 | M |
| MP-S3.9 | Reminders and messages first; portal later | Different | `scheduled/reminders.ts`; `pages/customer/*` | Reminders exist, and a customer portal already exists (wave 5 in the spec) | 3/5 | — |
| MP-S3.10 | Website request form priced by office; no instant pricing | Done | `submitBooking` (`firestore.ts` "P3-E29" comment); `noPricing.test.ts` | — | — | — |
| MP-S3.11 | Invoicing per visit in Wave | Missing | — | No Wave code | 4 | M |
| MP-S3.12 | Payments: e-Transfer/cash marked paid by hand; no card processor early | Different | `functions/src/callable/payments.ts:7-31` (`createPaymentIntent`, Stripe), exported in `index.ts:10` | Stripe functions are deployed but unused by the UI; no "mark paid" | 4 | S |
| MP-S3.13 | Do not keep SIN, banking, medical, licence numbers; access codes restricted | Partial | `Staff` type has none of the forbidden fields | Access codes have no restricted record. They go in free-text booking `notes`, copied to `jobs.clientNotes` (`jobs.ts` `clientNotes: booking.notes`) and shown to crew | 1 | S |
| MP-S3.14 | Task lists attach to job, series, site or service; built while scheduling; saved to library | Partial | P3-E34: `checklist/ChecklistDialog.tsx`, `functions/src/lib/checklist.ts`, `bookings.checklistTemplateId` | Job ✅; series ≈ booking choice carried by renewals ✅; service ✅ (auto by serviceType); **site ✗** (no sites); **several lists per visit ✗** | 2 | M |
| MP-S3.15 | Multi-cleaner change prompt "Everyone / Only these people" | Missing | — | Jobs have one `assignedTo` | 2 | L |
| MP-S3.16 | Visit pricing $37.50/cleaner-hour, averaged, rounded to 15 min, +13% HST | Missing | — | See Part 7 | 2–4 | M |
| MP-S3.17 | Proposed defaults (buffer 10, undo 15 min, 8 weeks…) | Missing | — | No settings record; constants in code (`resolveBufferMinutes` 30/60) | 0 | S |
| MP-S4 | Product map: 17 modules | Partial | — | Present, partly: Employees (staff registry), Scheduling (dispatch), Crew execution (FSM), Communications (SMS/email/in-app). Present ahead of plan: Reviews, Referrals, Client portal. Missing: the rest | — | — |
| MP-S5.1 | Server-checked writes for bookings, prices, hours, pay | Different | `assignCleanerTransaction` (`firestore.ts:148`), `attachJobChecklist`, `updateBookingStatus` are client writes; `claimJob` (`callable/job.ts`) is server-checked | Admin schedule changes and all crew check-in/out are direct client writes under rules | 0–2 | L |
| MP-S5.2 | One pure scheduling-core package | Different | `functions/src/lib/eligibility.ts` and a **duplicate** `apps/customer/src/lib/utils/scheduling.ts` | The logic is copied in two places, not shared | 2 | M |
| MP-S5.3 | UTC instants + site IANA zone; recurrence in local wall time | Different | `Job.scheduledDate/StartTime/EndTime` are strings (`job.ts:44-46`); `reminders.ts:13-14` cron in UTC | Local strings with no zone. Safe across Nov 1 by accident, but not convertible to instants | 2 | M |
| MP-S5.4 | Facts append-only (time events, incidents, audit, versions) | Partial | `auditLog` rule `update, delete: false` (`firestore.rules:203-207`) | Audit is append-only. Time facts are overwritten fields on the job | 3 | M |
| MP-S5.5 | Archive, never delete | Partial | `allow delete: if false` on bookings, staff, jobs, reviews | Templates soft-delete (`deleteChecklistTemplate`); no archive flags or retention jobs | 0 | S |
| MP-S5.6 | One notify function (templates, language, quiet hours, consent, delivery log) | Partial | `functions/src/notifications.ts:65-177`, `sendSms.ts`, `sendEmail.ts` | Several senders, no quiet hours, consent or delivery log | 3 | M |
| MP-S5.7 | Bilingual by design; staff/client content stored EN+FR | Done | `en.json`/`fr.json` both apps; `ChecklistTask.labelEn/labelFr`; `i18n.test.ts` | — | — | — |
| MP-S5.8 | Restricted data in its own place | Missing | — | No restricted sub-documents (access codes, pay terms, private details) | 1 | M |
| MP-S5.9 | Camelo IDs on everything imported | Missing | — | — | 1 | S |
| MP-S5.10 | Money is integer cents with tax beside it | Different | `bookings.estimatedPrice` (decimal, `firestore.ts` `computeBookingEstimatedPrice`); `PayRate.amount` (`common.ts:25`); `payments.ts:20` `Math.round(estimatedPrice*1.13*100)` | Decimal dollars throughout; cents only at the Stripe boundary | 2 | M |
| MP-S5.11 | Cost guards (budgets, alerts) | Unclear | — | Not in the repo. Could be set in the GCP console. Question: are billing budgets set on freshnest-aa51e? | 0 | S |
| MP-S5.12 | Everything audited with before/after | Partial | `auditLog` writes only on assignment overrides (`firestore.ts:206-221`) | Status, checklist, staff and template changes are not audited | 0 | M |
| MP-S6.P1 | Three environments | Different | One project `freshnest-aa51e`, two DBs `(default)` and `freshnest-dev` (ADR-002); preview channels (ADR-004) | No separate staging project | 0 | M |
| MP-S6.P2 | Emulator tests in CI | Done | `.github/workflows/ci.yml` rules job; `apps/customer/test/firestore-rules.test.ts` | — | 0 | — |
| MP-S6.P3 | Role claims, settings record with history, audit log | Partial | ADR-011, `setUserRole` | No settings record | 0 | M |
| MP-S6.P4 | Scheduled exports, rehearsed restore, error monitoring, budgets | Partial | Sentry in `apps/customer/src/main.tsx`, `apps/fsm/src/main.tsx`, `functions/src/lib/shared.ts`; ADR-012 rollback | No scheduled Firestore export or restore drill | 0 | S |
| MP-S6.P5 | Feature flags for pilot crews | Partial | `apps/customer/src/lib/sectionFlags` (`SHOW_GALLERY`…) | Build-time flags for public sections only; none per user or crew | 0 | S |
| MP-S6.Comms | Client reminder, on-my-way, running late, inbox; staff alerts | Partial | `sendSmsReminder` (`sendSms.ts:41`), `sendOnMyWaySms` (`:58`) fired at check-in (`job.updated.ts` §3); `notifyStaffMember` (assign, unassign, cancel) | No running-late, reschedule confirmations, two-way inbox or push | 3 | M |
| MP-S6.Snapshot | Owner snapshot page (billed vs booked, drive share…) | Partial | `callable/analytics.ts:205-232`, `AnalyticsDashboard.tsx`, `OperationsDashboard.tsx` | Has bookings, revenue estimate, lead sources and an ops view. None of the spec's figures, which need time capture and billing | 3 | S |
| MP-S6.AI | AI drafting | N/A | — | Wave 4 | 4 | — |
| MP-S6.Wave | Wave billing bridge | N/A | — | Wave 4 (see PRC-S8) | 4 | M |
| MP-S8 | Camelo extract, import, shadow, parity, pilot, cutover, rollback | Missing | — | No import scripts or parity report | 1–3 | L |
| MP-S9 | Compliance register | Partial | `docs/COMPLIANCE.md`; staff `compliance.termsHistory` with IP (`staff.ts` TermsAcceptance); booking `marketingConsent` + `consentTimestamp` (`firestore.ts:127-131`) | CASL consent captured. Missing: monitoring statement, 44-hour overtime, three-hour rule, retention jobs | 0–3 | M |
| MP-S11 | Repo layout: apps/office, apps/crew, packages/scheduling-core, schemas, i18n, ui | Different | `apps/customer` (public site **and** office admin at `/admin`), `apps/fsm` (crew), `packages/shared` (types and converters only) | No office app, scheduling-core, shared i18n or ui package | 0 | M |
| MP-S12 | Appendix | N/A | — | — | — | — |

### Part 3 — CE (Clients and Employees)

Inspected: `packages/shared/src/types/{booking,staff,common}.ts`, `docs/firestore-schema.md` §1, §4, §11, `firestore.rules:18-135,172-183,228-231`, `functions/src/callable/staff.ts`, `components/admin/{StaffTable,RegisterStaffModal,BookingsTable}.tsx`, `apps/fsm/src/pages/ProfilePage.tsx`, `pages/customer/*`.

| ID | Requirement (short) | Status | Evidence | Gap / notes | Wave | Size |
|---|---|---|---|---|---|---|
| CE-S2.1 | Client record (name, type, status, language, contacts, source, tags) | Missing | Client fields live on each `booking` (`booking.ts`); `customers/{uid}` is a portal profile | Same client re-entered per booking; renewals copy fields | 1 | M |
| CE-S2.2 | Contact record (role, channel, can-approve) | Missing | — | — | 1 | S |
| CE-S2.3 | Payer separate from client | Missing | — | — | 1 | S |
| CE-S2.4 | Site record (address, coordinates, place ID, tz, size, defaults, windows, status) | Missing | `booking.address` string; `propertyType/bedrooms/bathrooms/squareFootage` on booking | No coordinates, so no drive time; no windows or status | 1 | M |
| CE-S2.5 | Site attachments with visibility and expiry | Missing | Free-text `booking.notes` → `jobs.clientNotes` | All notes reach crew; no office-only items | 1 | M |
| CE-S2.6 | Preferences (preferred/excluded staff, language, fixed times, pets) | Partial | `booking.preferredCleaner`, `booking.language`, `booking.pets` | No excluded staff, fixed or flexible times, or products to avoid | 1 | S |
| CE-S2.7 | Referral source | Partial | `booking.leadSource` (organic, google, referral, facebook, direct, phone, walk-in); `referrals` collection (ADR-009) | No realtor or community-program list | 1 | S |
| CE-S2.8 | Client types and status (Lead/Active/Paused/Former) | Missing | `serviceType`, `isAirbnb` only | — | 1 | S |
| CE-S2.9 | Alarm and key codes in a restricted sub-document | Missing | — | Risk R7 | 1 | S |
| CE-S3.1 | Client list (search by name, phone, address, tag; filters) | Partial | `BookingsTable.tsx` search and filters (`useBookings`) | A list of bookings, not clients | 1 | M |
| CE-S3.2 | Client detail, add-client wizard, site detail | Missing | Closest: `BookingDetailPanel.tsx`, `AdminBookingModal.tsx` | — | 1 | M |
| CE-S3.3 | Attachment manager, duplicates and merge, import review | Missing | — | — | 1 | M |
| CE-S3.4 | Site without coordinates cannot be booked | Missing | — | — | 1 | S |
| CE-S3.5 | Pause and resume client or site, with upcoming visits handled | Missing | — | — | 1 | S |
| CE-S3.6 | Notes with attribution; office-only notes never reach crew | Missing | — | — | 1 | S |
| CE-S3.7 | Crew see masked phone and address in lists | Partial | HOTFIX-02 `listOpenShifts` returns a PII-minimised projection (`functions/src/lib/openShifts.ts:18-37`, municipality only) | Assigned crew see the full job (correct per spec); there is no list view for crew | 1 | S |
| CE-S4.1 | Employee profile (photo, status, start date, default title, languages, skills, start location) | Partial | `Staff` type (`staff.ts:24-49`): name, email, phone, role, status, `preferences.language`, `constraints.transportMode` | No photo, start date, skills or start location | 1 | M |
| CE-S4.2 | Titles as a managed list | Different | `StaffRole = 'cleaner' \| 'lead' \| 'supervisor'` (`staff.ts:3`) | A hard-coded enum, and it is a role, not a per-job title | 1 | S |
| CE-S4.3 | Skills and certifications with expiry | Missing | `onboardingChecklist.backgroundCheck` boolean only | — | 1 | S |
| CE-S4.4 | Availability record (weekly pattern, max hours per day and week) | Different | `constraints.blockedWindows[]` (`staff.ts:7-15`) | Unavailable blocks only; no maximum hours | 1 | M |
| CE-S4.5 | Time-off record | Missing | — | — | 1 | M |
| CE-S4.6 | Driver eligibility (approved flag, licence expiry, VUA signed) | Missing | `transportMode` (`personal_vehicle`, transit…) | — | 1 | S |
| CE-S4.7 | Private details owner-only | Partial | Staff doc readable by self and admin (`firestore.rules:173`) | Pay data (`financials`) sits in the main doc, not a restricted one | 1 | S |
| CE-S4.8 | Status controls booking (Active only; On leave blocked; Former archived) | Partial | `StaffStatus` onboarding, active, inactive; dispatch lists active staff | No "on leave"; booking rules don't check status server-side | 1 | S |
| CE-S4.9 | Don't store SIN, banking, health | Done | `Staff` type has no such fields | — | — | — |
| CE-S5.1 | Roles Owner, Manager, Employee, Payroll as claims, checked in rules | Partial | `setUserRole` (`callable/auth.ts`), `isAdmin`/`isStaff` (`firestore.rules:7-15`) | Supervisor has no manager rights; no payroll | 0 | M |
| CE-S5.2 | Invite creates account and links profile; disable on Former | Partial | `onStaffRegistered` (`callable/staff.ts:9`), welcome email `sendWelcomeEmail`, `resendWelcomeEmail` | No login disable on status change | 1 | S |
| CE-S5.3 | Employee list with expiry badges; profile with documents | Partial | `StaffTable.tsx` (Staff Registry) | No expiry badges or documents | 1 | S |
| CE-S5.4 | Availability editor, time-off calendar, titles admin | Partial | FSM `ProfilePage.tsx:20-30` (self-edit blocked windows and earnings limit) | No office editor, time-off calendar or titles admin | 1 | M |
| CE-S5.5 | Onboarding checklist template | Partial | `staff.onboardingChecklist` map, `compliance.acceptedTermsVersion` | Not a repeatable template; no VUA, driver or shadow items | 1 | S |
| CE-S5.6 | Time off over jobs → Needs attention | Missing | — | — | 1–2 | S |
| CE-S6.1 | Writes that affect bookings go through functions | Different | Staff create via CF (P3-E27-A2) ✅; booking status, assignment and checklist are client writes | See MP-S5.1 | 0 | M |
| CE-S6.2 | Audit log with before/after for key fields | Partial | See MP-S5.12 | — | 0 | M |
| CE-S6.3 | Search tokens across clients, sites, contacts, employees | Missing | Client-side filtering only | — | 1 | S |
| CE-S6.4 | Geocoding in a function | Missing | — | — | 1 | S |
| CE-S6.5 | Uploads with per-attachment visibility, signed URLs | Different | `getDownloadURL` long-lived URLs (`OfflineUploadProvider.tsx:56`); gallery URLs public by design (ADR-015) | No short-lived signed links | 1 | S |
| CE-S6.6 | Design system: nest teal, clay, Fraunces, Jost | Different | `docs/design-system.md` tokens `slate-brand`, `cream`, `sand`… (ADR-001) | Different brand tokens; the repo's are authoritative per CLAUDE.md | 0 | — |

### Part 2 — SCH (Scheduling)

Inspected: `functions/src/jobs.ts`, `functions/src/callable/{job,shifts}.ts`, `functions/src/lib/{eligibility,openShifts}.ts`, `functions/src/scheduled/renewals.ts`, `functions/src/triggers/{booking,job.updated}.ts`, `apps/customer/src/components/admin/{DispatchBoard,BookingDetailPanel,OverrideModal}.tsx`, `apps/customer/src/lib/utils/scheduling.ts`, `firestore.indexes.json`, `functions/test/openShifts.test.ts`.

| ID | Requirement (short) | Status | Evidence | Gap / notes | Wave | Size |
|---|---|---|---|---|---|---|
| SCH-S1.1 | Create a job for a client on any day and time | Different | `createJobFromBooking` (`jobs.ts`) sets `scheduledStartTime '09:00'`, `scheduledEndTime '11:00'` with the comment "F08 will assign real times" | **No UI or function changes job times.** The date comes from `booking.preferredDate` | 2 | M |
| SCH-S1.2 | One or many employees, each with a title | Missing | `Job.assignedTo: string \| null` | — | 2 | L |
| SCH-S1.3 | Clients have many sites, sites have attachments | Missing | — | See CE-S2 | 1 | M |
| SCH-S1.4 | Validate drive time between jobs | Different | `hasTravelConflict` (`eligibility.ts:36-72`) | Fixed buffer, see SCH-S6 | 2 | L |
| SCH-S3.1 | Collections: clients, sites, siteAttachments, services, titles | Missing | — | — | 1–2 | M |
| SCH-S3.2 | employees with defaultTitleId, skills, start location, availability | Partial | `staff` | See CE-S4 | 1 | M |
| SCH-S3.3 | timeOff | Missing | — | — | 1 | M |
| SCH-S3.4 | jobSeries (rule, local start, duration, crew template) | Missing | — | Renewals are a different mechanism | 2 | L |
| SCH-S3.5 | jobs (clientId, siteId, seriesId, startAt/endAt, localDate, status, assigneeIds, rev, pinned, override log) | Partial | `Job` (`packages/shared/src/types/job.ts:35-63`) | Has `bookingId`, `scheduledDate`, times, status, `assignedTo`. Missing: ids, instants, `assigneeIds[]`, `rev`, `pinned` | 2 | L |
| SCH-S3.6 | jobs/{id}/assignments subcollection | Missing | — | — | 2 | M |
| SCH-S3.7 | driveLegs, driveOverrides | Missing | — | — | 2 | M |
| SCH-S3.8 | schedulePolicy settings doc | Missing | Constants in code | — | 2 | S |
| SCH-S3.9 | scheduleChanges audit and undo log | Partial | `auditLog` override entries | No batch, before/after or undo | 2 | M |
| SCH-S3.10 | Job status draft → scheduled → confirmed → in progress → completed, + cancelled/skipped | Different | `JobStatus` unassigned, assigned, acknowledged, in_progress, completed, cancelled, disputed (`job.ts:3-5`); confirmation lives on the booking | — | 2 | S |
| SCH-S3.11 | Denormalized name snapshot on job | Partial | `jobs.clientName`, `clientAddress`, `clientPhone` copied | No `localDate` or `assigneeIds` | 2 | S |
| SCH-S4.1 | Cadences: weekly, every 2, every 4, monthly by weekday, custom, seasonal pause | Different | `renewals.ts:36-38` +7, +14, +30 days | "monthly" is +30 days, so it drifts (Risk R9); no every-4-weeks, by-weekday, custom or pause | 2 | L |
| SCH-S4.2 | Rolling 8-week generation | Different | 14-day lookahead, one occurrence at a time, as a **pending booking** | Each renewal must be confirmed by hand | 2 | M |
| SCH-S4.3 | Edit scopes (this, this and following, all future, skip) | Missing | — | — | 2 | L |
| SCH-S4.4 | Idempotent IDs (series + original date) | Different | Dedupe by email + date query (`renewals.ts:45-60`) | Race-prone; changing the email duplicates | 2 | S |
| SCH-S4.5 | 7-day freeze; hand-edited jobs never overwritten | Missing | — | — | 2 | S |
| SCH-S4.6 | Generated jobs validated; failures → Needs attention | Missing | — | — | 2 | M |
| SCH-S4.7 | rrule + Luxon with Nov 1 fixtures | Missing | — | — | 2 | S |
| SCH-S4.8 | Crew template copied onto each job | Partial | Renewal copies `assignedTo` (`renewals.ts:83`) | Single person, name string | 2 | S |
| SCH-S5.1 | Assignment record (employeeId, titleId, personal start/end) | Missing | — | — | 2 | M |
| SCH-S5.2 | Overlap = error | Different | Server: `claimJob` rejects overlap (via `findTravelConflict`). Admin: **overlap is an overridable warning** (`DispatchBoard.tsx` ~l.492 `admin.override.overlapWarning`) | Spec: never overridable (Risk R6) | 2 | S |
| SCH-S5.3 | Time off / availability = warning | Partial | Blocked windows: warning on dispatch, hidden on Shift Board (`eligibility.ts:119`) | No time off | 2 | S |
| SCH-S5.4 | Required titles, excluded employee, preferred badge, overtime | Missing | — | Earnings-cap check exists instead (Divergence D1) | 2 | M |
| SCH-S5.5 | Suggested crew ranking | Missing | — | — | 2 | M |
| SCH-S5.6 | Multi-cleaner change prompt, personal times, split visits | Missing | — | — | 2 | L |
| SCH-S6.1 | Per-employee, per-day gap ≥ drive × traffic + buffer | Different | `hasTravelConflict`: gap ≥ `resolveBufferMinutes` (30, or 60 for transit, or the staff setting) unless the same postal FSA (`eligibility.ts:149-156`) | No drive time at all | 2 | L |
| SCH-S6.2 | Worked example reproduces a 13-minute shortfall | Missing | — | Cannot reproduce: no drive or buffer model | 2 | S |
| SCH-S6.3 | Drive sources: override table → cache → Google Routes → flagged estimate | Missing | — | Akwesasne, Snye and Cornwall Island override table needed | 2 | L |
| SCH-S6.4 | Instant client check and authoritative server check from the same code | Different | Two copies of the logic (`scheduling.ts` and `eligibility.ts`) | See MP-S5.2 | 2 | M |
| SCH-S6.5 | Override with reason, logged (who, when, why, shortfall) | Partial | `OverrideModal.tsx` + `auditLog` `overrideType: travel_conflict_exceeded` (`AuditLogsTable.tsx:213-217`) | No shortfall minutes or warning badge on the job | 2 | S |
| SCH-S6.6 | Planned drive legs stored with paid flag | Missing | — | — | 2 | S |
| SCH-S7 | Fit it for me: ripple, options, ranking, atomic apply, undo | Missing | — | — | 2 | L |
| SCH-S8.1 | OVERLAP_EMPLOYEE error | Different | See SCH-S5.2 | — | 2 | S |
| SCH-S8.2 | SITE_INACTIVE, EXCLUDED_EMPLOYEE | Missing | — | — | 2 | S |
| SCH-S8.3 | DRIVE_SHORT | Different | `travel_conflict_exceeded` | Buffer-based | 2 | — |
| SCH-S8.4 | MIN_GAP, OUTSIDE_WORKDAY, CLIENT_WINDOW, STAFFING_SHORT, SITE_DOUBLE_BOOK, BORDER_LEG, DRIVE_ESTIMATED, TITLE_GAP | Missing | — | — | 2 | M |
| SCH-S8.5 | TIME_OFF | Partial | `blocked_window_overlap` | — | 2 | — |
| SCH-S8.6 | OVERTIME_RISK (44 h) | Missing | `earnings_cap_exceeded` instead (`scheduling.ts`, `eligibility.ts:108`) | D1 | 2 | S |
| SCH-S8.7 | One validator returning coded issues with fixes | Missing | Ad-hoc warning strings (`DispatchBoard.tsx`, `scheduling.ts:65-75`) | — | 2 | M |
| SCH-S9.1 | Schedule board (day and week, employees as rows, drive blocks, drag move and resize, Unassigned and Needs attention lanes) | Partial | `DispatchBoard.tsx`: day view, staff columns, unassigned sidebar, drag to assign | Columns not rows; no week view, time move or resize, drive blocks or Needs attention | 2 | L |
| SCH-S9.2 | Job drawer (client → site → service → time → repeat → crew → task lists, live validation) | Partial | `AdminBookingModal.tsx` (service, date, contact, assign, status, checklist P3-E34) | No time, repeat rule, multiple crew or live validation | 2 | M |
| SCH-S9.3 | Fit-it preview, client page, site page, series manager | Missing | — | — | 2 | L |
| SCH-S9.4 | Staff availability (office) | Missing | Staff Registry shows no availability | — | 2 | S |
| SCH-S9.5 | My day (crew, ordered, drive time, nav links, offline) | Partial | FSM `MyJobsPage.tsx` (upcoming jobs; template prefetch for offline) | No drive time between jobs and no navigation link | 3 | S |
| SCH-S10.1 | Camelo import and parity run | Missing | — | — | 2 | M |
| SCH-S10.2 | Timesheet, maps, ICS feed, vehicles | Missing | — | — | 2–3 | M |
| SCH-S10.3 | Bilingual reminders, moved-job notices | Partial | `sendSmsReminder` day-before, confirmed only (HOTFIX-04) | No moved-job notice | 3 | S |
| SCH-S11.1 | Browser never writes schedule fields; validateSchedule, proposeFit, applyScheduleChange, materializeSeries, computeDriveLegs | Missing | Only `claimJob` is server-checked | Risk R3 | 2 | L |
| SCH-S11.2 | Indexes: jobs by assigneeIds+startAt, localDate+status, siteId+startAt, seriesId+date | Missing | `firestore.indexes.json` has bookings, payRates, checklistTemplates only | — | 2 | S |
| SCH-S11.3 | rev counter, stale-edit rejection | Missing | — | — | 2 | S |
| SCH-S12 | Phases 0–8 | Partial | Phase 2 partly (board, single assignment, blocked-window check); phase 7 partly (FSM, blocked windows); phase 8 partly (reminders) | Phases 0, 1, 3, 4, 5, 6 missing | 2 | — |

### Part 4 — AGR (Agreements)

Inspected: searched `agreement|contract|terms|sign` across `apps/`, `functions/`, `packages/`, `firestore.rules`, `storage.rules`.

| ID | Requirement (short) | Status | Evidence | Gap / notes | Wave | Size |
|---|---|---|---|---|---|---|
| AGR-S1 | Agreements module attached to client (and site) or employee | Missing | — | — | 1 | M |
| AGR-S3.1 | Client agreement types and structured terms (parties, dates, service, price, rules, access) | Missing | — | — | 1 | M |
| AGR-S3.2 | Status lifecycle Draft → … → Ended; versioned amendments | Missing | — | — | 1 | M |
| AGR-S3.3 | Scheduling uses terms (cancellation window fee, lockout, CLIENT_WINDOW) | Missing | — | — | 3 | M |
| AGR-S4.1 | Team agreement types (offer, contractor, VUA, overtime averaging, confidentiality) | Missing | — | — | 1 | M |
| AGR-S4.2 | Policy acknowledgement with re-sign | Partial | `staff.compliance.acceptedTermsVersion` + `termsHistory[{version, acceptedAt, ipAddress}]` (`staff.ts:17-21,42-45`); `migrateComplianceRecords` | One generic terms acceptance; no document, types or re-sign date | 1 | S |
| AGR-S4.3 | Versioned pay terms by effective date | Missing | `payRates` by role with `effectiveFrom/To` (`common.ts:22-30`) is close for **rates**, but not per-employee agreement versions | — | 3 | M |
| AGR-S4.4 | Onboarding link, vehicle eligibility gating, employees see their own | Missing | — | — | 3 | S |
| AGR-S5.1 | Bilingual templates with merge fields, PDF generation | Missing | — | — | 3 | M |
| AGR-S5.2 | Upload signed copy (option 1) | Missing | — | — | 1 | S |
| AGR-S5.3 | Click-to-sign with consent, hash and audit page | Missing | — | — | 3 | M |
| AGR-S5.4 | Immutable signed files, SHA-256, private storage | Missing | — | — | 1 | S |
| AGR-S6.1 | Notice deadline = end − notice; alerts 60, 30 and 7 days | Missing | — | — | 1 | M |
| AGR-S6.2 | Agreements dashboard (needs action, clients without agreement…) | Missing | — | — | 1 | M |
| AGR-S7 | Access matrix, retention dates, view logging | Missing | — | — | 1 | S |
| AGR-S8 | Stages G1–G8 and tests | Missing | — | — | 1–4 | — |

### Part 5 — AVL (Availability, Time Off, Swaps)

Inspected: `packages/shared/src/types/staff.ts` (BlockedWindow), `apps/fsm/src/pages/{ProfilePage,ShiftBoardPage}.tsx`, `functions/src/callable/{job,shifts}.ts`, `functions/src/lib/{eligibility,openShifts}.ts`, `functions/src/notifications.ts`, `firestore.rules:172-183`.

| ID | Requirement (short) | Status | Evidence | Gap / notes | Wave | Size |
|---|---|---|---|---|---|---|
| AVL-S3.1 | Four states (Preferred, Available, Prefer not, Unavailable) | Different | `BlockedWindow` = Unavailable only (recurring weekly or dated) | — | 1 | M |
| AVL-S3.2 | Max hours per day and week; start area; temporary pattern; client preferences | Missing | `financials.monthlyEarningsLimit` (D1) | — | 1 | S |
| AVL-S3.3 | Approval when availability is reduced | Different | Staff self-edit `constraints` instantly (`firestore.rules:176-180`) | P9 Mike self-managed by design; no manager approval path | 1 | S |
| AVL-S3.4 | One resolution function (time off → temporary → standing → Available) | Missing | — | — | 1 | S |
| AVL-S4.1 | Time-off request types (vacation, sick with no note, personal, protected, recurring) | Missing | — | — | 1 | M |
| AVL-S4.2 | Flow: notice, blackout, daily cap, affected jobs, approve or decline with reason | Missing | — | — | 1 | M |
| AVL-S4.3 | Policy settings (14-day notice, max 2 off…) | Missing | — | — | 1 | S |
| AVL-S4.4 | Same-day sick button | Missing | — | — | 1 | S |
| AVL-S4.5 | Balances, archive 3 years | Missing | — | — | 1 | S |
| AVL-S5.1 | Hand-off to a named colleague | Missing | — | — | 2 | L |
| AVL-S5.2 | Open pool (eligible staff claim; first wins) | Partial | Shift Board: `listOpenShifts` (`callable/shifts.ts:15`) + `claimJob` (`callable/job.ts:6`) with server checks (overlap and buffer, blocked window, earnings cap), hidden not greyed (`openShifts.test.ts`) | The pool is every unassigned job, not hand-offs; no expiry, monthly limit or manager approval | 2 | M |
| AVL-S5.3 | Trades | Missing | — | — | 2 | M |
| AVL-S5.4 | Eligibility checks (title, drive, exclusion, vehicle, notice) | Partial | Overlap, buffer, blocked windows, earnings cap (`eligibility.ts`) | No title, exclusion, vehicle or notice checks | 2 | M |
| AVL-S5.5 | Approval modes and guardrails (limits, expiry, report) | Missing | — | — | 2 | M |
| AVL-S5.6 | Concurrent claim keeps the first | Partial | `claimJob` transaction (`jobs.ts` `executeClaimJob`) | No test of the double-claim case found | 2 | S |
| AVL-S6.1 | Validator codes UNAVAILABLE … SWAP_PENDING | Missing | Only blocked-window and earnings flags | — | 2 | S |
| AVL-S6.2 | Event effects (time off → Needs attention; leave → reassign) | Missing | — | — | 2 | M |
| AVL-S6.3 | Functions submit/decide availability, time off, swaps | Missing | — | — | 1–2 | M |
| AVL-S7.1 | My availability, Request time off, My requests, Open jobs (crew) | Partial | FSM Profile (blocked windows); Shift Board (open jobs) | — | 1–2 | M |
| AVL-S7.2 | Requests inbox, team calendar, policies (office) | Missing | — | — | 1 | M |
| AVL-S7.3 | Notifications per event, EN/FR, quiet hours | Partial | `notifyStaffMember` in-app + SMS for assign, unassign, cancel (`notifications.ts:137`) | No request events; no quiet hours | 2 | S |
| AVL-S8 | Fairness rules, accommodation route, privacy | Missing | — | — | 1–2 | S |

### Part 6 — CRW (Crew Job Execution)

Inspected: `apps/fsm/src/{App.tsx,pages/*,hooks/*,context/OfflineUploadProvider.tsx,lib/utils/indexedDb.ts}`, `apps/fsm/vite.config.ts`, `functions/src/triggers/job.updated.ts`, `firestore.rules:185-195`, `storage.rules`, FSM tests (`JobPage.test.tsx`, `MyJobsPage.test.tsx`, `ShiftBoardPage.test.tsx`, `ProfilePage.test.tsx`).

| ID | Requirement (short) | Status | Evidence | Gap / notes | Wave | Size |
|---|---|---|---|---|---|---|
| CRW-S1 | Decisions: PWA, location at check-in/out, EN/FR | Partial | See MP-S3.6, S3.7 | Photo geotags (D/R) | 3 | — |
| CRW-S3.1 | Nine-status lifecycle (Scheduled, On the way, Arrived, In progress, Finished, Review, Ready to invoice, Invoiced, Paid) | Partial | assigned → acknowledged → in_progress → completed | No on-the-way, review, invoice or paid states | 3 | M |
| CRW-S3.2 | Side events: running late, no access, damage/found, SOS | Missing | — | — | 3 | M |
| CRW-S4.1 | Today list (time, client first name, area, teammates, drive time, status) | Partial | `MyJobsPage.tsx` | No teammates or drive time | 3 | S |
| CRW-S4.2 | Job card (navigate, access, notes, pets, supplies, progress) | Partial | `JobPage.tsx` (address, client notes, checklist) | No Navigate button or separate access section | 3 | S |
| CRW-S4.3 | Check-in: time + location; location off → reason | Partial | `JobPage.tsx:145-167` (`serverTimestamp`, geo); check-in proceeds when geo fails (comment l.39 of the handler) | No reason prompt or accuracy stored | 3 | S |
| CRW-S4.4 | Check-out: time + location + finish checks | Partial | `JobPage.tsx:275-291` time only; Check Out gated until tasks complete (`JobPage.test.tsx` "gates the Check Out button") | No location; no "finish anyway with reason" | 3 | S |
| CRW-S4.5 | Checklist UI: rooms, required items, per-item photo, progress | Partial | `JobPage.tsx` task list, expand, photo enforcement (`JobPage.test.tsx` "enforces photo uploads") | Flat list, no rooms or sections; every task implicitly required | 3 | M |
| CRW-S4.6 | Report a problem | Missing | — | — | 3 | M |
| CRW-S4.7 | Running late and emergency | Missing | — | — | 3 | S |
| CRW-S4.8 | Teammates confirm presence; per-person times | Missing | Single assignee | — | 3 | M |
| CRW-S4.9 | Lead vs Trainee controls | Missing | — | — | 3 | S |
| CRW-S4.10 | Language follows the person; items in both languages | Done | `JobPage.tsx:510` `i18n.language === 'fr' ? labelFr : labelEn`; FSM `fr.json`; `JobPage.test.tsx` FR test (P3-E34) | — | 3 | — |
| CRW-S4.11 | State saved per tap; interruptions lose nothing | Partial | Each completion writes to Firestore with offline persistence (`initializeFirestore` + `persistentLocalCache`) | Not verified under a killed app | 3 | S |
| CRW-S5.1 | Service templates (Standard, Deep, Move, Post-con, Rental, Organizing) | Done | `checklistTemplates` by `serviceType` (`ChecklistTemplateManager.tsx`; `jobs.ts` `resolveChecklist`) | Organizing is not a service type | 2 | — |
| CRW-S5.2 | Rooms generated from site size | Missing | — | — | 3 | M |
| CRW-S5.3 | Site and client overlay (extras, skips, cautions) | Missing | — | — | 3 | M |
| CRW-S5.4 | Rotation items | Missing | — | — | 3 | S |
| CRW-S5.5 | Snapshot on the visit | Done | `jobs.checklistTasks` (P3-E34, `functions/src/lib/checklist.ts`, `checklistSnapshot.test.ts`) | — | 2 | — |
| CRW-S5.6 | Item settings: EN/FR text, required, photo, frequency, minutes, applies-to | Partial | `labelEn/labelFr`, `requiresPhoto`, `photoPhase` | No required flag (all required), frequency or minutes | 3 | S |
| CRW-S5.7 | Item states Done, Skipped (reason), N/A | Missing | Completion only | — | 3 | S |
| CRW-S5.8 | Template editor (copy, drag, required, both languages) | Done | `ChecklistTemplateManager.tsx` + `checklist/ChecklistTaskEditor.tsx` (dnd-kit) | No "copy template" button; required flag missing (S5.6) | 2 | — |
| CRW-S5.TL1 | Task list library | Done | Checklist Templates tab | No tags, usage count or search | 2 | — |
| CRW-S5.TL2 | Attach to visit | Done | `ChecklistDialog.tsx` → `attachJobChecklist` | — | 2 | — |
| CRW-S5.TL3 | Attach to series | Partial | `bookings.checklistTemplateId` + `renewals.ts` carry-over | No real series; no every-Nth | 2 | S |
| CRW-S5.TL4 | Attach to site | Missing | — | Needs sites | 2 | S |
| CRW-S5.TL5 | Attach to service (default) | Done | `resolveChecklist` by `serviceType` | — | 2 | — |
| CRW-S5.TL6 | Several lists per visit as sections | Missing | One list per job | — | 2 | M |
| CRW-S5.TL7 | Build on the fly; save to library | Done | Custom list + "Save as a new saved list" (`ChecklistDialog.tsx`) | No "paste one per line" | 2 | — |
| CRW-S5.TL8 | Copy on attach | Done | `attachJobChecklist` copies `orderedTasks(...)` | — | 2 | — |
| CRW-S5.TL9 | Series list changes confirm; 7-day freeze | Missing | — | — | 2 | S |
| CRW-S5.TL10 | Required tasks count toward finish | Done | Check Out gated on all tasks | All tasks treated as required | 3 | — |
| CRW-S5.TL11 | Time check vs booked duration | Missing | No task minutes | — | 2 | S |
| CRW-S5.TL12 | Draft translation offered | Missing | Both labels required (`hasMissingLabels`) | Arguably stricter (Divergence D8) | 2 | S |
| CRW-S5.TL13 | Lead adds task on site (if allowed) | N/A | Human decision 2026-10-27: admins only this release (P3-E34 plan) | — | 3 | — |
| CRW-S5.TL14 | Library audited, archived not deleted | Partial | Soft deactivate (`deleteChecklistTemplate`) | Not audited | 2 | S |
| CRW-S5.TL15 | Reporting (completion rate, most-skipped, time vs estimate) | Missing | — | — | 4 | S |
| CRW-S6.1 | In-app camera capture | Partial | `<input accept="image/*" capture="environment">` (`JobPage.tsx:327-328`) | `capture` is a hint; the gallery may still be offered on some phones | 3 | S |
| CRW-S6.2 | Shrink on phone, upload one at a time with retry, per-visit cap | Partial | Sequential queue with retry on reconnect (`OfflineUploadProvider.tsx:40-110`); pending count shown | No compression or cap; **uploads currently denied by Storage rules (R1)** | 3 | S |
| CRW-S6.3 | Strip embedded EXIF location | Unclear | No EXIF handling found in the FSM app | Raw camera blobs are uploaded. Question: does the browser strip GPS from `capture` images on your crews' phones? | 3 | S |
| CRW-S6.4 | Visibility: office + assigned crew; never other crews | Different | Long-lived download URLs stored on the job (`getDownloadURL`) | Anyone with the URL can view | 3 | S |
| CRW-S6.5 | Routine photo retention (90 days) and cleanup function | Missing | — | — | 3 | S |
| CRW-S6.6 | Incidents (types, status, owner, history); found-item log | Missing | — | — | 3 | M |
| CRW-S7.1 | Time events departed, arrived, finished (append-only, server + device time, accuracy) | Different | `jobs.checkedInAt`, `checkedInGeo`, `completedAt` fields (`job.ts`); rule allows crew to rewrite them (`firestore.rules:188-193`) | Overwritable; no device time or accuracy; no departed event | 3 | M |
| CRW-S7.2 | Derived on-site time, actual drive, planned vs actual, late/early | Missing | — | — | 3 | M |
| CRW-S7.3 | Payroll link: pre-fill timesheet, approve, payroll sees approved week | Missing | `ExportRecordModal.tsx` `csv_payroll` (monthly range) | Export only; no approval flow | 3 | M |
| CRW-S7.4 | Rules: forgot to finish, location far (250 m), breaks, short-visit three-hour flag, weekly 44 h | Missing | — | — | 3 | M |
| CRW-S7.5 | Learned drive times | Missing | — | — | 3 | M |
| CRW-S7.6 | Weekly export (employee, date, visit, in, out, hours, drive, adjustments) | Partial | `csv_payroll` export | Monthly, no drive or adjustments | 3 | S |
| CRW-S8.1 | Install to home screen + install guide | Partial | VitePWA manifest | No install guide | 3 | S |
| CRW-S8.2 | Offline: cache today + 2 days; actions saved locally; visible waiting count | Partial | Firestore persistent cache; IndexedDB photo queue (`indexedDb.ts`); pending count (`useOfflineUploads`) | No explicit 3-day window | 3 | S |
| CRW-S8.3 | Push notifications (iOS 16.4+) | Missing | In-app list (`useNotifications.ts`) + SMS | No web push | 3 | M |
| CRW-S8.4 | Access codes cleared after visit; remote sign-out; clock-error flag | Missing | — | — | 3 | S |
| CRW-S8.5 | Update prompt at a safe moment | Missing | VitePWA default registration | No "new version ready" UI found | 3 | S |
| CRW-S9.1 | Today live (office) | Partial | Dispatch Board shows job status chips per day | No arrival or late flags | 3 | M |
| CRW-S9.2 | Exceptions queue | Missing | — | — | 3 | M |
| CRW-S9.3 | Visit review (planned vs actual, photos, approve) | Missing | — | — | 3 | M |
| CRW-S9.4 | Ready to invoice, Unpaid | Missing | — | — | 3–4 | M |
| CRW-S9.5 | Clean-visit rule, batch approve | Missing | — | — | 3 | S |
| CRW-S9.6 | Emergency alerts by push and text with escalation | Missing | — | — | 3 | S |
| CRW-S10.1 | Job subcollections (timeEvents, checklist, incidents, photos, notes, adjustments); alerts; foundItems | Missing | Arrays on the job (`photos[]`, `checklistCompletions[]`) | Array growth limits; no append-only | 3 | M |
| CRW-S10.2 | Crew access: assigned visits in a date window; append-only adds | Partial | Read rule assigned-only (`firestore.rules:186`) | No date window; crew can set **any** `status` value (R4) | 3 | S |
| CRW-S10.3 | Functions checkIn, checkOut, reportIncident, sendEmergency, approveVisit, exportTimesheet, cleanupPhotos | Missing | Client writes from `JobPage.tsx` | — | 3 | M |
| CRW-S10.4 | Indexes: visits by status and date, time events, incidents, alerts | Missing | — | — | 3 | S |
| CRW-S11 | Stages C1–C7 and the 10 tests | Partial | C1 ≈ done (except install guide and a full offline test); C3 partly; C4 photos partly | C2, C5, C6, C7 missing | 3 | — |
| CRW-S11.T | Tests written first (10 listed) | Partial | Tests 5 (partly: blocked without reason) and 9 (rules assigned-only) are close to existing tests | The rest are absent | 3 | M |

### Part 7 — PRC (Visit Pricing and Billing Rules)

Inspected: `apps/customer/src/lib/utils/quotePricing.ts`, `apps/customer/src/lib/firebase/firestore.ts` (`computeBookingEstimatedPrice`), `functions/src/callable/{payments,analytics}.ts`, `packages/shared/src/types/common.ts` (PayRate), `functions/src/lib/eligibility.ts` (`estimateShiftPay`).

**Worked cases A–F (PRC-S4).** No billing calculation exists, so the six cases cannot be run against code. I re-computed them with a throwaway script (integer cents, round half up), and it reproduced all six totals:
- A $254.25, B $233.06, C $317.81;
- D $233.06, E $381.38, F $293.80.

They should be the first test file in backlog item W2-6.

| ID | Requirement (short) | Status | Evidence | Gap / notes | Wave | Size |
|---|---|---|---|---|---|---|
| PRC-S1 | Average-and-round rule at $37.50 + 13% HST | Missing | — | — | 2 | S |
| PRC-S2 | Decided and proposed defaults (early arrival clamp, breaks, trainees…) | Missing | — | — | 2 | S |
| PRC-S3.1 | One pure `calculateVisitBilling` shared by browser and server | Missing | — | — | 2 | S |
| PRC-S3.2 | Integer minutes and cents; round half up once | Different | Estimates and rates are decimal dollars (`firestore.ts` `computeBookingEstimatedPrice` returns e.g. `(min+max)/2`; `PayRate.amount`) | Risk R5 | 2 | S |
| PRC-S3.3 | Store all inputs with the visit | Missing | — | — | 2 | S |
| PRC-S4 | Six worked cases as tests | Missing | — | Ready to write; spec arithmetic checked | 2 | S |
| PRC-S5.1 | Methods: hourly actual, flat + extras, hourly capped, project | Missing | — | — | 2 | M |
| PRC-S5.2 | Precedence visit → agreement → client → site → service → global | Missing | — | — | 2 | S |
| PRC-S5.3 | Rate card by service, title, effective date | Different | `payRates` is **pay** by role with `effectiveFrom/To` (`common.ts:22-30`) | Pay-side table only; no billing rate card | 2 | S |
| PRC-S5.4 | Price book add-ons (EN/FR, cents, tax flag) | Missing | `booking.addOns` keys only | — | 2 | S |
| PRC-S6 | Edge-case rules (lockout, late cancel, unbooked cleaner…) | Missing | — | — | 3 | M |
| PRC-S7.1 | Estimate at booking (crew × hours × rate + HST) | Different | `estimatedPrice` from a size × service × frequency table (`quotePricing.ts`), internal only per P3-E29 | Different basis | 2 | S |
| PRC-S7.2 | Visit review screen | Missing | — | — | 3 | M |
| PRC-S7.3 | Invoice content (cleaners × hours, no names) | N/A | — | Wave 4 | 4 | — |
| PRC-S7.4 | Reports (billed vs booked, rounding effect…) | Missing | Analytics uses estimates | — | 4 | S |
| PRC-S8 | Wave push, read-back, 2-cent tolerance, idempotent reference | N/A | — | Wave 4 | 4 | M |
| PRC-S9.1 | Data model rateCard, pricingTerms, priceBookItem, visitBilling, billingAdjustment | Missing | — | — | 2–4 | M |
| PRC-S9.2 | Functions calculate, approve, adjust, pushInvoice | Missing | — | — | 2–4 | M |
| PRC-S9.3 | Build stages B0–B4 | Missing | B0 and B1 are wave 2 and not started | — | 2–4 | — |

### Part 8 — REV (Market coverage, re-checked against the repo)

| ID | Standard group | Status in repo | Evidence | Notes |
|---|---|---|---|---|
| REV-S3.1 | Lead capture and booking | Done | Website request form (`BookingPage.tsx`, `submitBooking`), owner SMS and email alert (HOTFIX-03), `leadSource` | Matches the "no instant pricing" decision |
| REV-S3.2 | Quotes and estimates | Missing | Internal `estimatedPrice` only | — |
| REV-S3.3 | Scheduling, dispatch, routing | Partial | Dispatch Board, Shift Board | No times, routing or recurrence engine |
| REV-S3.4 | Client records and portal | Different | No client records; **customer portal exists** (`pages/customer/*`: bookings, upcoming, profile, cancel per `firestore.rules:124-130`) | Portal ahead of plan (wave 5) |
| REV-S3.5 | Invoicing and payments | Missing | Stripe intent unused | — |
| REV-S3.6 | Crew mobile app | Partial | FSM PWA | See Part 6 |
| REV-S3.7 | Automated messages | Partial | Confirmations, day-before reminder, on-my-way at check-in, review request email | No two-way inbox |
| REV-S3.8 | Time tracking and payroll | Partial | Check-in and out fields, monthly earnings, CSV export | Not payroll-grade |
| REV-S3.9 | Reviews, referrals, marketing | Partial | `onReviewEmailScheduler`, `LeaveReviewPage`, moderation tab, `referrals` | Ahead of plan |
| REV-S3.10 | Quality, supplies | Missing | — | — |
| REV-S3.11 | Reports | Partial | `getAnalyticsKPIs`, Analytics tab | Marketing-centred |
| REV-S3.12 | Integrations | Missing | Twilio, Resend, Sentry, Stripe present; no accounting, maps or calendar | — |

---

## 3. Divergences (repo made a different choice — owner to decide)

| # | Area | Spec | Repo | Recommendation |
|---|---|---|---|---|
| D1 | Persona constraints | Overtime 44 h, max hours | **Earnings caps** for ODSP and OSAP (P7 Carla, P13 Marcus): `monthlyEarningsLimit`, Safe-to-Earn meter, `earnings_cap_exceeded` check, monthly rollover | Keep. These come from PERSONAS.md, which the spec doesn't mention. Add the spec's 44-hour check beside them, not instead of them |
| D2 | Travel rule | Drive time from maps, per site pair | Per-person buffer by transport mode (transit 60, else 30), waived within the same postal FSA (P8 Jasmine, P15 Daniel) | The spec's engine should **subsume** this: transport mode becomes a buffer adjustment, and FSA waiving becomes the "same building" min-gap case |
| D3 | Blocked windows | Availability "Unavailable" = warning, manager may override | P9 Mike: blocked windows **hidden, not greyed** on the Shift Board; labels never shown in override warnings | Keep as a privacy rule. Map to AVL "Unavailable" + private reason |
| D4 | Self-claim Shift Board | Swaps and hand-offs; pool is for hand-offs | Every unassigned job is offered to eligible staff (HOTFIX-02, server-checked) | Decide whether the open-claim model stays alongside office assignment |
| D5 | Data model root | Client → Site → Job | Booking → Job (one per booking), client data copied per booking | Migration needed: derive clients and sites from bookings (dedupe by email and address), keep `bookingId` as the request record |
| D6 | Early wave 4–5 features | Reviews, referrals, portal in waves 4–5 | Already live | Keep. Note they depend on the booking model and must be re-pointed at clients and visits later |
| D7 | Brand tokens and layout | Nest teal, clay, Fraunces, Jost; `apps/office` + `apps/crew` | `slate-brand`/`cream`/`sand` (ADR-001, design-system.md); admin inside `apps/customer` | The repo's tokens are authoritative per CLAUDE.md. Treat the spec's names as illustrative. Splitting the office app out is an ADR decision |
| D8 | Task list language | Draft translation offered | Both EN and FR labels required to save (P3-E34) | The repo is stricter (P11 Brenda reads FR). Optionally add a draft-translate button later |
| D9 | On-my-way text | Sent from an optional "On the way" tap before departure | Sent automatically at **check-in** (`job.updated.ts` §3) | Move it to a departure tap; the current one tells the client the cleaner is on the way when they have already arrived |
| D10 | Roles | Owner, Manager, Employee, Payroll | admin, supervisor, staff, customer (ADR-011) | Map admin → Owner, supervisor → Manager (needs real permissions), add payroll. Customer stays |
| D11 | Environments | Three Firebase projects | One project with two databases + preview channels (ADR-002, ADR-004) | Keep, unless the staging restore drill needs a separate project |
| D12 | Lead edits on site | Allowed by setting | Admins only this release (human decision 2026-10-27) | Settled |

---

## 4. Risks (repo conflicts with a decision, or live defects found)

| # | Severity | Risk | Evidence | Suggested action |
|---|---|---|---|---|
| R1 | ✅ **Fixed 2026-10-27 (HOTFIX-06)** — was High, live | Crew photo uploads were denied. The FSM uploads to `jobs/{jobId}/photos/{id}`, but `storage.rules` allows only `gallery/**` and denies everything else | `OfflineUploadProvider.tsx:53-56`; `storage.rules:10-23` | Human-approved Storage rule: assigned staff write `jobs/{jobId}/photos/*` (JPEG, size cap); admin and assigned staff read. Needs a `firestore.get()` on the job. Then verify on a phone |
| R2 | ✅ Fixed (HOTFIX-07) — was Medium, live | Crew "mark all as read" was denied, because `notifications/{uid}/messages` has `allow update: if false` | `useNotifications.ts:73-90`; `firestore.rules:221-225` | Rule change (owner may update `read` only), or a callable |
| R3 | High | Schedule, assignment and checklist changes are **client writes**, contrary to MP-S5.1 and SCH-S11 | `assignCleanerTransaction`, `attachJobChecklist`, `updateBookingStatus` in `firestore.ts` | Introduce `applyScheduleChange` before building recurrence, so validation is authoritative |
| R4 | Medium | Crew may write any `status` string and any `checkedInAt` / `completedAt` value on their job; no transition or time validation | `firestore.rules:188-193` | Move check-in and check-out to callables (CRW-S10.3), or constrain values in rules (`request.time`, allowed transitions) |
| R5 | Medium | Money in decimal dollars (`estimatedPrice`, `PayRate.amount`); HST computed only at the Stripe boundary | `firestore.ts` `computeBookingEstimatedPrice`; `common.ts:25`; `payments.ts:20` | Adopt integer cents before any billing code (PRC-S3.2) |
| R6 | ✅ Fixed (HOTFIX-08) — was Medium | Admins could override an **overlap** (one person in two places), which the spec says is never overridable | `DispatchBoard.tsx` ~l.492 (`overlapWarning` added to warnings) | Make overlap a blocking error in the dispatch flow |
| R7 | Medium | Access codes and private notes have no restricted home; free-text `notes` go to every assigned crew member and into exports | `jobs.ts` `clientNotes: booking.notes`; `ExportRecordModal.tsx` | Add a restricted access record with the sites work; warn in the New Booking notes field meanwhile |
| R8 | Medium | Every job is 09:00–11:00 and no screen can change it. Buffer, overlap and earnings checks all run on those placeholder times | `jobs.ts` `scheduledStartTime = '09:00'` | Add job time editing (job drawer) as the first scheduling slice |
| R9 | Low | "monthly" recurrence = +30 days, so visits drift by weekday and date | `renewals.ts:38` | Replace with a real series (SCH-S4); interim: same day-of-month or the nth weekday |
| R10 | ✅ Fixed (HOTFIX-09) — was Low | `createPaymentIntent` was a public callable with no auth check, contrary to "no card processor early" | `payments.ts:7-31` | Remove or disable it, or require auth (needs a decision, D/MP-S3.12) |
| R11 | Low | Photo URLs are long-lived download URLs readable by anyone holding them | `OfflineUploadProvider.tsx:56` | Store paths; serve through rules-checked reads or signed URLs |
| R12 | Low | Photos carry capture GPS, beyond the check-in/out-only decision | `OfflineUploadProvider.tsx:154-168` | Confirm with the owner; drop photo geo, or record it as part of the check-in policy |
| R13 | Low | Scheduling logic is duplicated (client and server copies), so the two can disagree | `apps/customer/src/lib/utils/scheduling.ts` vs `functions/src/lib/eligibility.ts` | Move it into one shared package (MP-S5.2) |

---

## 5. Proposed backlog (ordered by spec wave)

Each item lists its requirement IDs, dependencies and exit criteria (from the spec's build tables). Items marked **Now** are fixes for live defects, outside the wave plan.

### Now — live defects (before any wave work)
| # | Item | IDs | Depends on | Exit criteria |
|---|---|---|---|---|
| N-1 | Storage rule for crew job photos (human approval) — ✅ **done 2026-10-27 (HOTFIX-06, PR #37; deployed and phone-tested)** | R1, CRW-S6.2 | — | A required-photo task uploads from an iPhone and an Android; photo visible in admin |
| N-2 | Notifications mark-read rule or callable — ✅ **done 2026-10-27 (HOTFIX-07, PR #38; rules deployed, badge check passed)** | R2 | — | Unread badge clears after opening |
| N-3 | Block overlap overrides on dispatch — ✅ **done (HOTFIX-08, PR #38)** | R6, SCH-S5.2 | — | Overlap assignment cannot be saved |
| N-4 | Decide on the Stripe callables (remove, or require auth) — ✅ **done: sign-in required + signed webhooks only (HOTFIX-09, PR #38)** | R10, MP-S3.12 | Owner decision | No unauthenticated payment-intent creation |

### Wave 0 — Platform and delivery
| # | Item | IDs | Depends on | Exit criteria |
|---|---|---|---|---|
| W0-1 | Role model: Owner, Manager (supervisor with real permissions), Employee, Payroll; rules tests per role — 🔄 **P3-E35 code complete** (Owner/Manager; supervisor stays field; Payroll in wave 3) | MP-S2.1, CE-S5.1, D10 | ADR (amends ADR-011) | Two roles see different data (spec P1 exit) |
| W0-2 | Settings and policy record with versioned history (buffer, notice, caps…) | MP-S3.17, SCH-S3.8 | W0-1 | A setting changes behaviour without a release |
| W0-3 | Audit everywhere (status, assignment, checklist, staff, templates) with before/after | MP-S5.12, CE-S6.2 | — | Every listed change writes an audit entry |
| W0-4 | Integer-cents and time-zone conventions (ADR) + shared `scheduling-core` package; de-duplicate eligibility logic | MP-S5.2/3/10, R5, R13 | ADR | One package imported by `apps/customer` and `functions`; tests green including Nov 1 fixtures |
| W0-5 | Scheduled Firestore export + restore drill; budgets on Maps, SMS, Storage | MP-S6.P4, MP-S5.11 | — | Backup restored into `freshnest-dev` (spec P2 exit) |
| W0-6 | Server-checked write path (`applyScheduleChange` skeleton with `rev`) | MP-S5.1, SCH-S11, R3 | W0-4 | Direct client writes to schedule fields denied in rules |

### Wave 1 — People, places, terms
| # | Item | IDs | Depends on | Exit criteria |
|---|---|---|---|---|
| W1-1 | Clients, contacts, payer (derive from bookings; keep `bookingId` as the request) | CE-S2.1–3, CE-S3.1–2, D5 | W0 | Create a client with two contacts and preferences in under 2 minutes |
| W1-2 | Sites with geocoding (function), tz, windows, status; restricted access record; attachments with visibility | CE-S2.4–5, S2.9, CE-S6.4, R7 | W1-1 | A site without coordinates can't be booked; crew can't see office-only items |
| W1-3 | Employees: titles list, skills, driver eligibility, start location, status incl. on leave | CE-S4.1–8 | W0-1 | Add an employee; a manager can't see pay fields |
| W1-4 | Availability (four states, keeping D3 privacy) + time off with Ontario types, policy, inbox | AVL-S3, AVL-S4, CE-S4.4–5 | W1-3 | Adding availability applies at once; removing waits; approval blocks the dates |
| W1-5 | Agreements G1–G2: records, upload signed copy, hash, notice-deadline alerts, dashboard | AGR-S1, S3, S4, S5.2, S5.4, S6 | W1-1, W1-3 | Test agreement fires the 60, 30 and 7-day alerts |
| W1-6 | Camelo import (people and places) with review screen | MP-S8, CE-S7 E | W1-1–3 | Re-running the import creates no duplicates |

### Wave 2 — Scheduling core
| # | Item | IDs | Depends on | Exit criteria |
|---|---|---|---|---|
| W2-1 | Job drawer with editable date and time; jobs keyed to client and site; instants + tz | SCH-S1.1, S3.5, S9.2, R8 | W1-2 | Book a job at 13:30 on any day |
| W2-2 | Assignments subcollection with per-assignment titles; multi-cleaner jobs; required-titles check | SCH-S1.2, S5.1, S5.4 | W2-1, W1-3 | Book a 3-person job; overlap blocked; title saved per person |
| W2-3 | Validator with codes (OVERLAP, SITE_INACTIVE, EXCLUDED, TIME_OFF, CLIENT_WINDOW…) + EARNINGS_CAP (D1) | SCH-S8, AVL-S6.1 | W2-2 | Each code has a unit test |
| W2-4 | Drive-time engine (override table for Akwesasne, Snye and Cornwall Island; cache; Routes; estimate) absorbing D2 | SCH-S6 | W1-2 | Worked example: 13-minute shortfall |
| W2-5 | Fit it for me + undo; recurring series (8 weeks, edit scopes, Needs attention) replacing renewals | SCH-S4, S7, R9 | W2-3, W2-4 | 8 weeks generate with no duplicates; undo restores |
| W2-6 | Pricing core B0 (cents, six worked cases) + B1 terms and price book | PRC-S1–S5 | W0-4 | Cases A–F reproduce to the cent |
| W2-7 | Task lists: attach to site and series, several lists per visit, task minutes and time check | CRW-S5.TL3/4/6/11 | W1-2, W2-5 | Saved + on-the-fly list on a visit and a series; library edit leaves the booked visit unchanged |
| W2-8 | Swaps: hand-off and trades on top of the Shift Board (D4) | AVL-S5 | W2-3 | A hand-off failing drive time is never offered |
| W2-9 | Camelo shifts import + nightly parity report | SCH-S10.1, MP-S8 | W2-5 | Re-running changes nothing; parity report running |

### Wave 3 — Crew execution, time, communications (cutover gate)
| # | Item | IDs | Depends on | Exit criteria |
|---|---|---|---|---|
| W3-1 | Check-in and check-out callables writing append-only `timeEvents` (server + device time, location + accuracy, both ends) | CRW-S7.1, S10.3, R4, MP-S3.7 | W0-6 | Check-in outside the assignment window is rejected server-side |
| W3-2 | Per-person times for multi-cleaner jobs; Lead vs Trainee controls | CRW-S4.8–9 | W2-2, W3-1 | Two crew each record their own arrival and finish |
| W3-3 | Checklist upgrades: rooms and sections, required vs optional, skip with reason, finish-with-reason | CRW-S4.5, S5.6–7 | W2-7 | Finish blocked on a required item, allowed with a reason |
| W3-4 | Photos: compression, cap, EXIF strip, private paths, retention cleanup; incidents + found items | CRW-S6, R11, R12 | N-1 | 30 queued photos upload after reconnecting |
| W3-5 | Office review: today live, exceptions, visit review, clean-visit batch approve, ready to invoice | CRW-S9 | W3-1 | A day of clean visits approved in one tap |
| W3-6 | Running late, on-the-way tap (D9), emergency alert with escalation, web push | CRW-S4.7, S8.3, S9.6 | W3-1 | Emergency test reaches the office in under a minute |
| W3-7 | Time and payroll link: weekly export with drive legs and 44 h / three-hour flags; timesheet pre-fill | CRW-S7.2–6 | W3-1 | Two pay weeks match Camelo |
| W3-8 | Communications: one notify function, quiet hours, consent, delivery log, two-way inbox | MP-S5.6, MP-S6.Comms | — | Reminder in the client's language; failed send visible |
| W3-9 | Pricing B2 review screen + owner snapshot figures | PRC-S7.2, MP-S6.Snapshot | W2-6, W3-1 | Snapshot figures match a hand check |
| W3-10 | Agreements G3–G6 (pay terms, templates, click-to-sign, series activation) | AGR-S4.3, S5.1, S5.3, S3.3 | W1-5, W2-5 | Signing a bi-weekly agreement creates 8 weeks of visits |

### Wave 4 and later
- **Wave billing bridge (W4-1).** PRC-S8, MP-S6.Wave. It needs W3-9 and an answer to the Wave API question.
- **Quotes and leads.** These extend the existing request form.
- **Quality.** It builds on W3-4 incidents.
- **Reports.**
- **Compliance records.**
- **Re-point existing features (D6).** Move reviews, referrals and the customer portal from bookings to clients and visits.

---

## 6. Questions for the owner (blocking work)

Taken from the spec's open-question lists, plus decisions the audit raised.

**Raised by this audit**
1. **R1:** approve a Storage rule for crew job photos? This is a production defect today.
2. **D5:** OK to derive clients and sites from existing bookings (dedupe by email and address), with bookings kept as the request record?
3. **D1–D3:** confirm the persona rules stay alongside the spec's 44-hour overtime and availability states: earnings caps, transport-mode buffers, and hidden blocked windows.
4. **D4:** keep the self-claim Shift Board as the open pool, or move to office-assigned jobs plus hand-offs only?
5. **R10:** remove the unused Stripe callables, or keep them behind auth for later?
6. **D10:** who gets the Manager role, and what may they do (move confirmed jobs, override warnings, see client phones)? (Spec CE-S8, SCH-S13.)
7. **MP-S5.11:** are GCP billing budgets and alerts already set on `freshnest-aa51e`?

**From the spec (needed before wave 1–2 work)**

8. Camelo: what the API and export allow, your contract end date, and how many clients, sites and employees are in it now (MP-S10, CE-S8).
9. Confirm the proposed defaults (MP-S3): 10-minute base buffer, 8-week window, 7-day freeze, 15-minute undo, 14-day vacation notice, max 2 off, 12-hour swap notice, 250 m check-in flag, 90-day photo retention, 7-year agreement retention.
10. Travel times for Cornwall Island, Akwesasne and Snye for the override table (SCH-S13).
11. Do crews travel together (drive checked per vehicle) or separately (per person)? (SCH-S13.)
12. Client time windows vs fixed times; normal workday window; maximum hours per day (SCH-S13).
13. Separate payer: needed now, for family members or community programs? (CE-S8.)
14. Are any cleaners contractors rather than employees? (AGR-S9, a lawyer question.)
15. Do recurring clients sign anything today? Your cancellation window and late fee? (AGR-S9.)
16. Pricing: rates for deep, move-out, post-construction and organizing; the Lead and Trainee billing; whether breaks and early minutes are unbilled (PRC-S10).
17. Wave: can a line carry a decimal quantity, how does it round a half cent, are credit notes available, and can it send invoices in French? (PRC-S8, MP-S10.)
18. Who receives emergency alerts, and who is the second contact? (CRW-S11.)

---

## 7. Owner answers (2026-10-27)

Recorded from the walkthrough of section 6. These settle the questions for planning. Items marked **open** still need an answer.

| # | Question | Answer | Effect on the backlog |
|---|---|---|---|
| 1 | Storage rule for crew job photos (R1) | **Yes, write the fix** | N-1: draft the rule and rules tests in a PR. Human approval before deploy |
| 2 | Derive clients and sites from bookings (D5)? | **No — clean slate.** Nothing in production is real; it is all test data | No migration from bookings. W1-1/W1-2 start with empty collections. Test data can be cleared (with approval) before go-live. The P3-E34 checklist backfill is not needed on production |
| 3 | Persona rules alongside the spec (D1–D3) | **Keep all; add the spec's** | Earnings caps stay; transport-mode buffers become drive-time adjustments; blocked windows stay private; add the 44 h OVERTIME_RISK check |
| 4 | Shift Board model (D4) | **Keep both** | The office assigns; released jobs go to the Shift Board for eligible staff to claim; hand-offs and trades are added on top (W2-8) |
| 5 | Stripe callables (R10) | **Keep, require sign-in** | N-4: add an auth check to `createPaymentIntent` (and keep the webhook signature check) |
| 6 | Manager role (D10) | ~~Schedule, no pay~~ → **Superseded 2026-10-27:** Manager has the same access as Owner (including pay); only Owners grant/revoke Owner and Manager. `admin` renamed `owner`; several Owners allowed. See [P3-E35](../projects/P3-E35.md) | W0-1: managers handle clients, sites, scheduling, overrides with reason and time off; no pay fields, policies or roles |
| 7 | GCP budgets set? | **No / not sure** | W0-5: add budgets and alerts for Maps, SMS and Storage to the platform checklist |
| 8 | Camelo data | **Enter by hand** | Drop the Camelo importer and nightly parity report (MP-S8, SCH-S10.1, W1-6, W2-9). The cutover gate's "two weeks of parity" becomes a manual side-by-side check |
| 9 | Proposed defaults (MP-S3) | **Accept all** | Seed the settings record (W0-2) with: 10-min buffer, 8 weeks, 7-day freeze, 15-min undo, 14-day vacation notice, max 2 off, 12 h swap notice, 250 m, 90 days, 7 years |
| 10 | Island and border travel times | **Owner will provide later** | Build the override table (W2-4) with an admin editor; routes start empty and are flagged until filled |
| 11 | Crews travel together or separately? | **Mix of both** | Per-job "travels together" setting: drive checked per vehicle when set, else per person |
| 12a | Client times | **Mostly windows** | Client windows are the norm (CLIENT_WINDOW); fixed times are the pinned exception. Fit it for me may shift within a window |
| 12b | Workday window and max hours | **No fixed workday** (some evening and night contracts); **max 10 h per person per day** | No global OUTSIDE_WORKDAY rule; MAX_HOURS_DAY = 10 h as a setting; windows come from the client or site and the person's availability |
| 13 | Separate payer | **Yes, from the start** | W1-1 includes the payer record and billing contact |
| 14 | Contractors? | **All employees** | Agreements need employment types only; no contractor template |
| 15 | Agreements and fees today | **Verbal, with fees.** **Open:** the cancellation window, late-cancellation fee and lockout fee amounts | Agreements catch-up (G7) covers every recurring client; fee amounts become settings once given |
| 16 | Billing rules | **Billing starts at clock-in, even if early** (overrides the spec's proposal to clamp to the booked start). **Timesheets need approval when above or below a set threshold of minutes.** **Open:** rates for deep, move-out, post-construction and organizing; Lead and Trainee billing; whether breaks are billed | PRC-S3 per-person interval = check-in → check-out (no clamp); worked case D changes (8:50 arrival is billed). Add a timesheet variance threshold setting that holds a visit for approval (CRW-S7, PRC-S6 flags) |
| 17 | Wave checks | **Later, at wave 4** | Not blocking |
| 18 | Emergency alerts | **Owner first, then a named backup** (set in settings) | CRW-S9.6 escalation to a backup contact from settings |

**Still open:** fee amounts (15); service and title rates, and break billing (16); the backup emergency contact's name (18); the island travel times (10).
