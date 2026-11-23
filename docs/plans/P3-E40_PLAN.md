---
epic: P3-E40
title: Sales Pipeline — Lead Ownership, Lifecycle & Follow-up — Plan
strategy: pending
---

# P3-E40 PLAN — Sales Pipeline

**Phase A written:** 2026-11-23 · **Status:** 🔄 Awaiting human approval
**Spec:** [`../projects/P3-E40.md`](../projects/P3-E40.md)

## Personas
| Persona | Impact |
|---|---|
| **P12 Lauren (primary)** | Default owner of every lead; reassigns in 2 clicks; full audit of hand-offs, stages, outcomes |
| **P16 Ryan (primary)** | "My leads" view; email + SMS when a lead is assigned to him; his changes credited to him |
| **P2 Travis** | Overdue flag at 2 h (cleaning) / 1 h (in-person quote) protects fast follow-up |
| **P3 Margaret** | 16 px text, 48 px targets, keyboard-operable stage control on every new screen |
| **P1 Diane / P5 Sophie** | Lead shows `language`; all new strings EN + FR |
| **P11 Brenda / P14 Sylvie** | Any FSM lead screen and alert fully French (only in strategies that touch the staff app) |
| **P6 Gallagher** | Airbnb leads filterable to the top |

## Common to all three strategies
- **Stages:** `new → contacted → site_visit (optional) → quoted → won | lost`. Won sets `status: 'confirmed'` (existing Dispatch flow). Lost sets `status: 'cancelled'` and requires a reason.
- **Lost reasons (fixed list):** `no_response`, `price`, `chose_competitor`, `date_unavailable`, `outside_area`, `duplicate_or_spam`, `other` (+ note ≤ 500 chars).
- **Default owner:** Lauren, from a new `settings/policy` key so it changes without a release (Owner-only, via `updatePolicySettings`).
- **Targets:** `leadFirstContactTargetMinutes = 120`, `leadSiteVisitFirstContactTargetMinutes = 60` in `settings/policy` (Q3 to confirm).
- **Alerts:** `onBookingCreated` alerts the assigned owner (email + SMS in their language) instead of only `OWNER_EMAIL`/`OWNER_PHONE`; the old alert stays as a fallback while the lead is unassigned or the owner has no phone.
- **Lost guard:** `onBookingCancelled` skips the "cancelled by the customer" SMS when the cancellation came from marking a lead Lost.
- **Audit:** every write carries `lastChange` (P3-E37); `pipeline` is added to `AUDIT_CONFIG` watched fields, which gives the lead timeline for free.
- **Back-fill script:** `pending → new` (owner Lauren), `confirmed`/`completed → won`, `cancelled → lost` (reason `other`, note "legacy"). Dry run on `freshnest-dev`, `--apply` on `(default)` with human approval.
- **Rules:** every strategy changes `firestore.rules` → explicit human sign-off in the PR (ADR-018 emulator tests gate the deploy).

### Proposed schema additions (shared by all strategies unless noted)
**None of these exist in `docs/firestore-schema.md` today.** They are proposals for approval, not invented fields in use; on approval they are added to the schema doc in Phase B before any code reads them.

| Field | Type | Notes |
|---|---|---|
| `bookings.pipeline.stage` | `'new' \| 'contacted' \| 'site_visit' \| 'quoted' \| 'won' \| 'lost'` | |
| `bookings.pipeline.ownerEmail` | `string \| null` | lowercased; office email (`admins` doc id) or `staff.email` |
| `bookings.pipeline.ownerRole` | `'owner' \| 'manager' \| 'cleaner' \| 'supervisor' \| 'contractor' \| null` | display + routing |
| `bookings.pipeline.ownerAssignedAt` / `ownerAssignedBy` | `Timestamp` / `string` | |
| `bookings.pipeline.needsSiteVisit` | `boolean` | default true for `commercial` / `postconstruction` (Q4) |
| `bookings.pipeline.nextFollowUpDate` | `string` `YYYY-MM-DD` Toronto (ADR-020) | |
| `bookings.pipeline.firstContactAt` | `Timestamp \| null` | response-time metric |
| `bookings.pipeline.quotedPriceCents` / `quoteSentAt` | `int` / `Timestamp` | internal only (P3-E29); closes F11 |
| `bookings.pipeline.closedAt` | `Timestamp \| null` | |
| `bookings.pipeline.lostReason` / `lostNote` | `string` / `string ≤ 500` | |
| `bookings/{id}/leadNotes/{noteId}` | `{ kind: 'call'\|'sms'\|'email'\|'note', body ≤ 2000, by, at }` | append-only |
| `admins/{email}.phone`, `admins/{email}.language` | `string`, `'en'\|'fr'` | written by `setUserRole` only (Ryan's SMS alerts) |
| `settings/policy.defaultLeadOwnerEmail`, `leadFirstContactTargetMinutes`, `leadSiteVisitFirstContactTargetMinutes` | `string`, `int`, `int` | via `updatePolicySettings` |
| `staff.role` add `'contractor'` | enum value | **only if Q1 = contractor signs in** (strategies 2, 3) |

---

## Strategy 1 — Office-worked pipeline; non-office owners are notified only

The pipeline lives on `bookings` and is worked only in the admin portal. Cleaners, supervisors and contractors can be named as owner; they receive an SMS/email with the client's first name, area and the office's request to call, but they **cannot open the lead**. The office records outcomes on their behalf.

**Files changed**
- `packages/shared/src/types/booking.ts` — `Pipeline` type
- `packages/shared/src/firebase/converters.ts` — read/write `pipeline`
- `packages/shared/src/domain/pipeline.ts` (new) + `pipeline.test.ts` — stages, transitions, overdue calc, lost reasons
- `packages/shared/src/domain/audit.ts` — watch `pipeline`
- `packages/shared/src/domain/policy.ts` — 3 new policy keys + defaults
- `apps/customer/src/components/admin/adminTabs.ts` — new `pipeline` tab
- `apps/customer/src/components/admin/PipelineTab.tsx` (new) — My leads / Unassigned / All list, sorted by age
- `apps/customer/src/components/admin/LeadDetailPanel.tsx` (new) — owner, stage, follow-up date, quote, lost reason, contact log
- `apps/customer/src/components/admin/hooks/usePipeline.ts` (new) + test
- `apps/customer/src/components/admin/hooks/useAssignableOwners.ts` (new) — `admins` + active `staff`
- `apps/customer/src/components/admin/AnalyticsDashboard.tsx` — Pipeline card
- `apps/customer/src/components/admin/SettingsTab.tsx` — default owner + targets
- `apps/customer/src/components/admin/TeamRolesTab.tsx` — phone/language on office entries
- `apps/customer/src/lib/firebase/firestore.ts` — `updateLeadPipeline`, `addLeadNote`
- `apps/customer/src/i18n/locales/en.json`, `fr.json`
- `functions/src/triggers/booking.ts` — default owner on create, owner alert, Lost guard
- `functions/src/triggers/pipeline.ts` (new) — alert on reassignment
- `functions/src/callable/auth.ts` — `setUserRole` accepts phone/language
- `functions/src/callable/settings.ts` — new policy keys
- `functions/src/callable/analytics.ts` — pipeline KPIs
- `functions/src/emailTemplates.ts`, `functions/src/smsTemplates.ts` — assignment alert EN/FR
- `functions/src/scheduled/leadDigest.ts` (new) + `functions/src/index.ts` — 08:00 Toronto digest of due/overdue leads per owner
- `functions/scripts/backfill-booking-pipeline.cjs` (new)
- `firestore.rules`, `firestore.dev.rules`, `firestore.indexes.json` (`pipeline.ownerEmail` + `createdAt`, `pipeline.stage` + `createdAt`)
- `apps/customer/test/firestore-rules.test.ts`, `functions/test/*` new tests, `apps/customer/e2e-admin/admin.spec.ts`
- Docs: `docs/firestore-schema.md`, `user-guide/admin-guide.md`

**Persona impact:** P12/P16 fully served. Non-office owners get a heads-up but depend on the office — weak for the "assign to a cleaner" decision. No FSM change, so no P11/P14 FR surface added beyond SMS/email templates.

**Risks:** "Owner" on a cleaner is a label only, which may not match what you meant by assigning to cleaners. Lowest privacy risk: client data stays office-only (no COMPLIANCE.md change). Rules change limited to office paths.

**Size:** M.

---

## Strategy 2 — Separate `leads` collection; staff app gets "My leads" via rules

Quote requests go to a new `leads/{leadId}` collection. On Won, a Cloud Function creates the `bookings` document. Non-office owners read and update **only their own leads** directly through Firestore rules (`resource.data.ownerEmail == request.auth.token.email`, field whitelist), and the FSM staff app gets a "My leads" page.

**Files changed** (in addition to most of Strategy 1's admin and functions files, re-pointed at `leads`)
- `packages/shared/src/types/lead.ts` (new), converters, `domain/pipeline.ts`
- `apps/customer/src/pages/BookingPage.tsx`, `apps/customer/src/components/booking/BookingStep4.tsx`, `apps/customer/src/lib/firebase/firestore.ts` — public form writes `leads`
- `functions/src/triggers/lead.ts` (new) — create alerts (moved from `onBookingCreated`), Won → create booking
- `functions/src/triggers/booking.ts` — remove quote-request branch; keep admin/renewal paths
- `apps/fsm/src/pages/MyLeadsPage.tsx` (new) + `LeadPage.tsx` (new) + tests; `apps/fsm/src/App.tsx` route; `apps/fsm/src/components/layout/*` nav item; `apps/fsm/src/i18n/locales/en.json`, `fr.json`
- `functions/src/callable/staff.ts`, `packages/shared/src/types/staff.ts` — `contractor` role (if Q1 = signs in)
- `firestore.rules` — new `leads` block incl. **public create** path and staff-scoped read/update
- Customer analytics and existing quote-flow E2E tests (`e2e/booking.spec.ts`, `phase4.spec.ts`) rewritten
- Migration script moving existing `pending` bookings to `leads`
- Docs: `firestore-schema.md` (new collection), `COMPLIANCE.md` (staff access to lead PII), `user-guide/admin-guide.md`, `user-guide/staff-guide.md`

**Persona impact:** cleanest separation — bookings stay "real jobs", staff see only their leads. Serves P11/P14 with a full-FR staff screen.

**Risks:** highest. Rewrites the live public quote path (P2 Travis's < 3 min flow, P1 FR confirmation) and moves notification triggers; a regression loses quote requests. New public-create rules block (F13-type risk). Data migration of live requests. Staff get direct rule-level read of client PII. Overlaps heavily with P3-E26's design (D11 ADR) — likely needs an ADR first.

**Size:** XL.

---

## Strategy 3 — Pipeline on `bookings`; non-office owners work leads through server callables ★ recommended

Same data model as Strategy 1 (no change to the public quote path). Non-office owners (cleaner, supervisor, contractor) get a **"My leads"** page in the staff app that reads and writes through three callables — `listMyLeads`, `updateMyLead`, `addMyLeadNote` — the same pattern as `listOpenShifts`. The callables check the caller is the lead's owner, return only the fields needed to make contact (name, phone, area, service, language, notes), and allow only stage/follow-up/note/quote changes. `bookings` rules stay office-only.

**Files changed**
- Everything in Strategy 1, plus:
- `functions/src/callable/leads.ts` (new) — `listMyLeads`, `updateMyLead`, `addMyLeadNote` (Zod-validated, `lastChange` stamped with the caller's email, `source: 'staff_app'`)
- `functions/src/index.ts` — export callables
- `functions/test/leads.test.ts` (new)
- `apps/fsm/src/pages/MyLeadsPage.tsx` (new) + `MyLeadsPage.test.tsx`; `apps/fsm/src/pages/LeadPage.tsx` (new) + test
- `apps/fsm/src/App.tsx` — routes; `apps/fsm/src/components/layout/*` — nav item shown only when the person has open leads
- `apps/fsm/src/lib/firebase/*` — callable wrappers
- `apps/fsm/src/i18n/locales/en.json`, `fr.json` — full FR (FSM rule 6), icon-first actions (FSM rule 5)
- `functions/src/notifications.ts` — in-app notification type `lead_assigned`
- `packages/shared/src/types/staff.ts`, `functions/src/callable/staff.ts`, `apps/customer/src/components/admin/RegisterStaffModal.tsx` — `contractor` role (only if Q1 = signs in)
- Docs: `firestore-schema.md` (incl. `notifications.type` value `lead_assigned`), `COMPLIANCE.md` (callable-scoped staff access to assigned-lead contact data — needs owner approval, Q6), `user-guide/admin-guide.md`, `user-guide/staff-guide.md`

**Persona impact:** P12/P16 as Strategy 1; non-office owners can actually work a lead (meets decision 2); P11/P14 get a full-FR, icon-first staff screen; public flow for P1/P2/P3 untouched.

**Risks:** staff see client contact data for assigned leads (minimised, server-filtered, audited) → COMPLIANCE.md change needs your approval. More code than Strategy 1 (FSM pages + 3 callables). `contractor` role touches staff registration and may need onboarding/pay exclusions (Q1). Rules change still office-only for `bookings`, plus `leadNotes` subcollection and `admins` fields.

**Size:** L. Can ship in two PRs: (1) Strategy 1 scope — office pipeline, alerts, back-fill; (2) staff "My leads" callables + FSM pages + contractor role.

---

## Comparison
| | Strategy 1 | Strategy 2 | Strategy 3 ★ |
|---|---|---|---|
| Non-office owners can work the lead | No (alert only) | Yes (rules) | Yes (callables) |
| Touches public quote path | No | **Yes, rewritten** | No |
| Client PII to staff | No | Direct rule read | Minimal, server-filtered |
| Rules change | Office paths | New collection + public create | Office paths |
| Size | M | XL | L (2 PRs) |

## Schema audit
All `pipeline.*`, `leadNotes`, `admins.phone/language`, the three `settings/policy` keys, `notifications.type: 'lead_assigned'` (S3) and `staff.role: 'contractor'` (S2/S3, Q1) are **new and not in `docs/firestore-schema.md`**. They are listed here for approval; no code uses them until `firestore-schema.md` is updated in Phase B. Strategy 2 additionally adds the `leads` collection. **Blocker until approved:** none of these may be written without your sign-off on this plan.

## Tailwind audit
No new CSS classes beyond those already used in the admin and FSM apps: `font-body`, `font-display`, `text-base`, `text-charcoal`, `text-text-muted`, `bg-warm-white`, `bg-cream`, `border-sand`, `bg-slate-brand`, `text-slate-dark`, `rounded`, `min-h-[48px]`. Stage and overdue badges reuse the existing status-badge pattern in `BookingsTable.tsx` (`bg-yellow-50 text-yellow-800`, `bg-green-50…`, `bg-red-50…`), which are Tailwind defaults, not design-system tokens — **Brand_Auditor to confirm** (or add status tokens to `design-system.md`). Overdue is always shown with a text label and icon, never colour alone (WCAG 1.4.1).

## Open questions (from the spec)
Q1 contractor = staff role with sign-in, or alert-only outsider? · Q2 does `lead` count as cleaner? · Q3 2 h / 1 h targets, business or clock hours? · Q4 which requests need a site visit? · Q5 Ryan's mobile number · Q6 approve staff access to assigned-lead contact data (COMPLIANCE.md).

**HALT — awaiting human approval of one strategy.**
