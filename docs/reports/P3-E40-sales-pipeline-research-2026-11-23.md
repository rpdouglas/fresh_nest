# Fresh Nest — Sales Pipeline Review & Implementation Report

**Date:** 2026-11-23 · **Epic:** [P3-E40](../projects/P3-E40.md) · **Plan:** [P3-E40_PLAN.md](../plans/P3-E40_PLAN.md)
**Live version (with diagrams, comments):** Claude Doc — https://claude.ai/artifact/PED2qvf1UkDGA22YXxP3fH
*This file is the repo copy of that report. If the two differ, the plan and spec in `docs/` are authoritative for the build.*

## Summary

Fresh Nest has no sales pipeline today: a quote request is a `pending` booking with no owner, no follow-up date and no won/lost record. The recommendation is to add a lightweight pipeline to the existing booking record, modelled on Jobber and Housecall Pro rather than a full CRM.

- **One owner per lead.** Lauren by default, reassignable to Ryan, a cleaner, supervisor or contractor, with an alert to the new owner and every change in the audit log.
- **Six stages:** New → Contacted → Site visit (optional) → Quote sent → Won or Lost, plus a next follow-up date on every open lead.
- **Speed and visibility:** overdue flags (2 h cleaning request / 1 h in-person quote), a daily follow-up digest, and alerts routed to the owner instead of a single phone.
- **Learn why we lose:** a required lost reason and a Pipeline card showing response time and conversion by source and owner.
- **Build in three phases;** Phase 1 (ownership + stages) delivers most of the value and needs a schema and rules change you approve.

## Current state: there is no pipeline yet

Today a quote request is just a `bookings` document with `status: 'pending'`. Nobody owns it, nothing records whether a quote was sent, and there is no way to see a lead go stale.

| Area | What exists today | Gap for a sales pipeline |
| --- | --- | --- |
| Intake | Public form writes a `pending` booking; `leadSource` captured (organic, google, referral, facebook, direct, phone, walk-in) | Good base. No distinction between a lead and a scheduled job |
| Statuses | `pending → confirmed → completed`, or `cancelled` (`bookings.status`) | Four job statuses, no sales stages: contacted, quote sent, follow-up, won, lost |
| Assignment | `assignedTo` holds the *cleaner's name* (string) | No field for the person who owns the lead. Reusing `assignedTo` would collide with dispatch |
| Alerts | `onBookingCreated` emails and SMSes the single `OWNER_EMAIL` / `OWNER_PHONE` | Ryan never gets notified; no alert to whoever a lead is assigned to |
| Admin UI | Bookings tab: table filtered by preferred date, status, service, language; detail panel to change status and cleaner | Sorted by service date, not by age of request. No "my leads" view, no board, no next-action date |
| Quote data | `estimatedPriceCents` on office-created bookings only | No quoted amount, sent date, accepted date (open item F11 in `ACTIVE_CYCLE.md`) |
| History | `auditLog` + `lastChange` record every field change and who made it | Strong foundation: a lead timeline can be built on it with no new audit plumbing |
| Roles | `admins` collection: Owner and Manager roles (P3-E35) | Lauren and Ryan already exist as office users |
| Analytics | Lead-source counts and revenue in Analytics tab | No conversion rate, response time, or win/loss reasons |

The planned epic **P3-E26 Quote-First Booking System** (not started, XL) covers quote documents, signing and deposits. The pipeline work is the missing front half of P3-E26 and can ship before it.

## How comparable apps run the pipeline

Field-service tools for small cleaning and trades businesses converge on the same model: a short fixed list of stages, one named owner per lead, a freshness signal, and automated follow-up. Full CRMs add lost reasons and conversion reports.

| Product | Lead stages (as named in the product) | Who owns a lead | Follow-up | Reporting |
| --- | --- | --- | --- | --- |
| [Jobber Sales pipeline](https://help.getjobber.com/en/articles/sales-pipeline/) | New Request → Assessment Unscheduled / Scheduled / Completed → Quote Draft → Awaiting response → Changes requested → Won or Lost | One optional *Salesperson* per card, or Unassigned | Up to 5 open tasks per lead with owner and due date; overdue shows red. Age chip: green < 1 h, red > 24 h | Sales Outcomes report: close rate, won/lost count and value |
| [Jobber Requests](https://help.getjobber.com/en/articles/request-basics/) | New, Unscheduled, Overdue, Assessment complete, Converted, Archived | Assessment assigned to a team member | Notification on every new request; activity history logs assignment | Requests report; 30-day request conversion rate |
| [Housecall Pro Pipeline](https://help.housecallpro.com/en/articles/6185127-getting-started-with-pipeline) | New Lead (Unassigned / Assigned) → First Contact → Second Contact → Third Contact → Won or Lost | Assigned employee | Automations: after X days in a contact stage, send SMS/email and advance; after Third Contact, auto-mark Lost. Quiet hours hold texts | Separate estimate board with 3 follow-ups before decline |
| [Pipedrive](https://support.pipedrive.com/en/article/lost-reasons) | Custom stages per pipeline | Deal owner | Activities with due dates | Lost reason (free text or predefined list) reported in Insights |
| HubSpot (from memory, approximate) | Lead status: New, Attempting to contact, Connected, Qualified, Unqualified | Contact owner; round-robin workflow | Tasks and sequences | Funnel and response-time reports |

**Why speed matters.** [The Short Life of Online Sales Leads](https://hbr.org/2011/03/the-short-life-of-online-sales-leads) (Oldroyd et al., HBR, 2011) found most firms answer web leads far too slowly. Its widely quoted figure (much higher odds of reaching a lead called within 5 minutes than within 30) comes from secondary summaries and is approximate.

## What to copy, and what to skip, for a small office

| Pattern | Seen in | Adopt? | Why |
| --- | --- | --- | --- |
| One owner per lead, plus "Unassigned" | Jobber, Housecall Pro, HubSpot | Yes | Ends the "I thought you called them" problem |
| Default owner on arrival | HubSpot round-robin | Yes (Lauren) | A setting, changeable without code |
| Short fixed stage list | All | Yes | ~6 stages map to how a cleaning quote actually goes |
| Next follow-up date on each lead | Jobber tasks, Pipedrive activities | Yes, one date | One date + note beats a task list for a small team |
| Age / overdue indicator | Jobber | Yes | Cheapest way to protect response time |
| Auto SMS cadence and auto-Lost | Housecall Pro | Later | Must respect CASL and `language`; start with reminders to staff, not clients |
| Required lost reason from a list | Pipedrive | Yes | Feeds the report that changes behaviour: why we lose |
| Kanban board | Jobber, Housecall Pro | Yes, as a view | Needs a keyboard-accessible fallback |
| Custom pipelines, lead scoring, sequences | HubSpot, Pipedrive | No | Over-built at current volume |

## Recommended design

Keep the quote request as the existing `bookings` document and add a `pipeline` map with its own stage, separate from `status`. One record from first click to completed clean means no sync code, and the existing audit trigger gives a full timeline.

### Lifecycle

```
New ──► Contacted ──► Site visit (optional) ──► Quote sent ──► Won  (booking confirmed → Dispatch)
  │          │   └────── no visit needed ──────────►│
  └──────────┴──────────────┴───────────────────────┴──► Lost (reason from a fixed list)
```

"Follow up" is not a stage: every open lead carries a **next follow-up date**; a past date shows overdue.

### Assignment
- `pipeline.ownerEmail`: one person or empty, kept apart from `assignedTo` (the cleaner).
- Can own a lead: owner, manager, cleaner, supervisor, contractor (decided 2026-11-23).
- Default on arrival: Lauren (decided 2026-11-23), stored in `settings/policy`.
- Reassign: one dropdown; the new owner gets email + SMS; every change audited (`lastChange` + `auditLog`).
- Views: My leads (default), Unassigned, All.

### Alerts and service levels
- New lead: email + SMS to the owner, replacing the single `OWNER_EMAIL` / `OWNER_PHONE` alert.
- Overdue when nobody has made contact within **2 hours** (cleaning request) or **1 hour** (in-person quote) — decided 2026-11-23.
- Daily 08:00 digest per owner of due and overdue leads.
- Marking Lost must not fire the "cancelled by the customer" SMS.

### Reports
Open leads by stage, median time to first contact, conversion by lead source and owner, lost reasons, quoted value won per month.

Proposed fields and the three implementation strategies are in [`P3-E40_PLAN.md`](../plans/P3-E40_PLAN.md).

## Compliance and risks
- **CASL:** replying to a quote request is allowed (implied relationship). Automated client cadences need sender ID, unsubscribe and a stop rule — deferred.
- **Privacy:** non-office owners seeing client contact data changes `COMPLIANCE.md` §2 — needs owner approval (Q6 in the spec).
- **Rules:** `firestore.rules` change needs human sign-off in the PR (ADR-018).

## Rollout
1. **Own and track** — owner, stages, reassign, lost reasons, alerts to the owner, back-fill.
2. **Never miss a follow-up** — follow-up dates, overdue flags, daily digest, Pipeline analytics, board view. *Gate: 2 weeks of lead data.*
3. **Automate and extend** — client follow-up SMS in EN/FR, site visits assigned to staff, quote docs + e-sign (P3-E26). *Gate: CASL wording approved.*

## Decisions log (2026-11-23)
- Default owner: Lauren.
- Lead owners: owner, manager, cleaner, supervisor, contractor (replaces the earlier "office users only").
- First-contact targets: 2 h cleaning request, 1 h in-person quote.
- P16 Ryan, Office Manager, added to `PERSONAS.md` (v4.4).
- Epic P3-E40 opened; Phase A plan awaiting strategy choice. Open questions Q1–Q6 are in the spec.
