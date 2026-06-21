# Fresh Nest Co. — Master Project Plan v4.0

**Compiled:** 2026-06-21
**Previous versions:** v3.0 (2026-06-17) · v2.0 (2026-06-16) · v1.1 (2026-06-15)
**Sources:** Master Plan v3.0 · Auto-Scheduling Revised Final Plan (2026-06-17) · Employee Onboarding Project Plan (2026-06-17) · Phase 3 execution close reports (2026-06-18 – 2026-06-21)
**Platform:** React 19 · Vite · Firebase · Tailwind CSS v3 · TypeScript strict · npm workspaces monorepo

---

## What Changed in V4

| Change | Detail |
|---|---|
| Progress update | 11 of 26 epics completed since V3 — all Band A and Band B, plus P3-E18 and P3-E20 from Band D |
| New epic P3-E27 | Employee Onboarding System — full plan integrated; P0 sub-epics close live PIPEDA violations |
| New epic P3-E28 | Cleaner Suggestion & Auto-Assignment Engine v2 — replaces the V3 backlog item "AI scheduling (24-month horizon)" with a grounded rule-based approach suitable for current team size |
| Persona fix | Both new plans used `SP1–SP6` for staff personas; V4 standardises on the authoritative `P7–P15` numbering from CLAUDE.md throughout |
| Persona coverage gaps closed | P7 Carla, P9 Mike, P10 Ahmed, P14 Sylvie, P15 Daniel added to E27 and E28 persona lists |
| Open Decisions table fixed | V3 table had stale V2 epic IDs; corrected to V3/V4 numbers |
| Sprint plan updated | Sprints 1–4 reflect completed work; Sprints 5–10 cover the 17 remaining epics |
| Backlog updated | Auto-scheduling moved from backlog to P3-E28 |

---

## Status of Previous Phases

**Phase 1 — Stabilize & Secure: ✅ COMPLETE (10 of 10 epics as of 2026-06-16)**
**Phase 2 — Compete: ✅ COMPLETE (10 of 10 epics + HOTFIX-01 as of 2026-06-18)**

> Unimplemented Phase 1 and 2 items (P1-E3, P1-E5, P1-E6, P1-E7, P1-E8, P2-E5) were promoted to Phase 3 as P3-E1 through P3-E6. All six are now complete.

---

## Phase 3 Progress Snapshot (as of 2026-06-21)

| Band | Epics | Completed | Remaining |
|---|---|---|---|
| A — Carryover critical | 6 | 6 ✅ | 0 |
| B — Live production bug fixes | 3 | 3 ✅ | 0 |
| C — Scale & grow | 11 (9 from V3 + E27 + E28) | 0 | 11 |
| D — Architecture & upgrades | 8 | 2 ✅ (E18, E20) | 6 |
| **Total** | **28** | **11** | **17** |

---

## How to Read This Plan

Each epic follows: **Objective → Background → Personas served → Key tasks → Acceptance criteria → Complexity → Priority → Dependencies.**

Completed epics are marked ✅ with completion date and close report reference; task detail is abbreviated since they're done.

**Complexity:** S (days) · M (1 week) · L (2–3 weeks) · XL (1 month+)
**Priority:** P0 (legal/security blocker) · P1 (revenue or ops blocker) · P2 (competitive gap) · P3 (growth lever)
**Source tags:** [Codebase] · [CTO] · [Tech] · [Product] · [Both]

**Persona quick reference:**

| ID | Name | Type |
|---|---|---|
| P1 | Diane Lafleur | Customer — bilingual, loyalty |
| P2 | Travis McLeod | Customer — mobile, price-transparent |
| P3 | Margaret Storey | Customer — accessible, phone-first |
| P4 | Kahnawà:ke Baptiste | Customer — Akwesasne trust |
| P5 | Sophie Tremblay-Gagnon | Customer — Snye QC, eco, FR |
| P6 | Gallagher | Customer — Airbnb host, turnover |
| P7 | Carla | Staff — ODSP earnings protection |
| P8 | Jasmine Beausoleil | Staff — new, mobile, transit |
| P9 | Mike | Staff — recovery commitments, blocked windows |
| P10 | Ahmed | Staff — ESL, icon-first, Arabic |
| P11 | Brenda Côté | Staff — lead cleaner, French-primary |
| P12 | Lauren Arsenault | Staff / Admin — operations, compliance |
| P13 | Marcus Oakes | Staff — OSAP cap, part-time |
| P14 | Sylvie Pilon | Staff — caregiver, 2:30pm limit |
| P15 | Daniel Swamp | Staff — Akwesasne, bridge commute |

---

## Sequencing Rationale

Phase 3 is structured in four bands:

1. **Band A — Carryover critical items.** All six Phase 1/2 carryovers. ✅ All complete.
2. **Band B — Live production bug fixes.** Critical production bugs. ✅ All complete.
3. **Band C — Scale & grow.** Customer-facing growth epics plus new staff operations system (P3-E27) and scheduling engine (P3-E28). **Active focus.**
4. **Band D — Architecture & upgrades.** Structural refactors that accelerate future development. P3-E18 ✅ and P3-E20 ✅ are complete; six remain.

---

## Open Decisions Required Before Specific Epics

| # | Decision | Blocks | Recommendation |
|---|---|---|---|
| D3 | Blog CMS: Firestore-backed vs. headless | **P3-E11** | **Firestore-backed** — no new services; bilingual natural; admin panel exists |
| D4 | Bilingual routing: `/fr/` path prefix vs. subdomain | **P3-E12** | **Path prefix** — simpler hosting; decide before GBP links are locked |
| D8 | Web Worker for pricing engine | **P3-E16** | **Yes** — Vite supports natively; implement before dynamic pricing adds async logic |
| D9 | VitePress scope: admin-only vs. public help centre | **P3-E24** | **Admin-only first** (`docs.freshnest.co`); expand to customer help in Phase 4 |
| D10 | Storybook: single monorepo instance vs. per-app | **P3-E25** | **Single monorepo instance** at root; stories for `packages/ui` primitives only |
| D11 | Quote-first ADR: web-first PDF approach, deposit model, token design | **P3-E26** | Write ADR before any code — see epic detail |
| D12 | Auto-scheduling: per-scenario autonomy table format and storage | **P3-E28** | Store as Firestore `schedulingConfig` document, admin-configurable — see epic detail |

---

## Band A — Carryover Critical Items ✅ ALL COMPLETE

### P3-E1: Stripe Payment Integration ✅ Completed 2026-06-21
**Priority:** P0 · **Complexity:** XL · **Close report:** `docs/reports/P3-E1-close-2026-06-21.md`

Pre-auth hold model. Card authorized at booking submission; captured on admin confirm; released on cancel. `@stripe/stripe-js`, `@stripe/react-stripe-js` installed. `createPaymentIntent` Cloud Function, `stripeWebhookHandler`, `forwardRef`/`useImperativeHandle` pattern in `BookingStep4`. HST 13% ON applied at launch.

---

### P3-E2: Route Code Splitting ✅ Completed 2026-06-21
**Priority:** P1 · **Complexity:** M · **Close report:** `docs/reports/P3-E2-close-2026-06-21.md`

All 25+ pages lazy-loaded with `React.lazy()`. `<Suspense>` boundary at `RouterProvider`. `PageLoader` spinner component. Admin chunk isolated.

---

### P3-E3: Admin Booking Creation ✅ Completed 2026-06-21
**Priority:** P1 · **Complexity:** L · **Close report:** `docs/reports/P3-E3-close-2026-06-21.md`

`AdminBookingModal` with all required/optional fields. `leadSource: 'phone'` and `'walk-in'` added. Admin bypass of Stripe. Firestore rules split public vs. admin create paths.

---

### P3-E4: Observability & Error Tracking ✅ Completed 2026-06-18
**Priority:** P1 · **Complexity:** M · **Close report:** `docs/reports/P3-E4-close-2026-06-18.md`

Sentry integrated in `apps/customer`, `apps/fsm`, and `functions/`. Cloud Function errors captured. UptimeRobot and Google Cloud Monitoring alert policy active.

---

### P3-E5: CI/CD Pipeline Hardening ✅ Completed 2026-06-18
**Priority:** P1 · **Complexity:** S · **Close report:** `docs/reports/P3-E5-close-2026-06-18.md`

`npm audit`, Dependabot, Lighthouse CI, CodeQL, rollback ADR all in place.

---

### P3-E6: Accessibility Pass (WCAG 2.1 AA) ✅ Completed 2026-06-21
**Priority:** P2 · **Complexity:** M · **Close report:** `docs/reports/P3-E6-close-2026-06-21.md`

`@axe-core/playwright` E2E suite. `aria-live` on `StepIndicator`. All 12 admin components uplifted from `text-sm` → `text-base`. Margaret keyboard-only booking flow test passing.

---

## Band B — Live Production Bug Fixes ✅ ALL COMPLETE

### P3-E7: Cloud Functions Critical Bug Fixes ✅ Completed 2026-06-18
**Priority:** P0 · **Complexity:** S · **Close report:** `docs/reports/P3-E7-close-2026-06-18.md`

`require()` runtime crash in `onBookingCancelled` fixed. `getAnalyticsKPIs` double-read fixed. `as any` query type fixed.

---

### P3-E8: `useBookings` Server-Side Filtering Fix ✅ Completed 2026-06-21
**Priority:** P1 · **Complexity:** M · **Close report:** `docs/reports/P3-E8-close-2026-06-21.md`

Status, service type, and language filters pushed to Firestore query layer. Composite indexes deployed. UI state separated from data-fetching hook.

---

### P3-E9: Remove `window.__MOCK_*` from Production ✅ Completed 2026-06-18
**Priority:** P1 · **Complexity:** S · **Close report:** `docs/reports/P3-E9-close-2026-06-18.md`

All `window.__MOCK_*` guards removed from `firestore.ts` and `functions/`. E2E tests use `page.route()` network interception.

---

## Band C — Scale & Grow

---

### P3-E10: Loyalty & Referral Reward Loop ⬜
**Source:** [Codebase] · **Priority:** P2 · **Complexity:** L

**Objective:** Convert the existing referral code infrastructure into a functional two-sided reward system.

**Personas served:** P1 Diane (active referrer), P2 Travis (price-sensitive, responds to discounts)

**Key tasks:**
- Define reward amounts (recommend $25/$25); store as configurable `referralConfig` Firestore document
- Cloud Function trigger: when referred booking transitions `status → confirmed` and `referredBy` is set, credit referrer's account with $25 in a `credits` sub-collection
- Credit applied as Stripe coupon on referrer's next booking
- Referral code and credit balance visible in customer portal
- Admin credit management view: credits issued/redeemed per customer; admin can adjust manually

**Acceptance criteria:**
- Referred booking triggers referrer credit within 60 seconds of `status → confirmed`
- Credit balance visible in customer portal
- Credit correctly reduces next booking's Stripe `PaymentIntent` amount
- Admin can manually adjust or revoke credits

**Complexity:** L · **Dependencies:** P3-E1 ✅ (Stripe), P2-E1 complete (customer portal)

---

### P3-E11: CMS-Backed Blog ⬜
**Source:** [Codebase] · **Priority:** P3 · **Complexity:** L

**Objective:** Replace static `blogData.ts` with Firestore-backed blog posts editable by admin.

**Personas served:** P2 Travis (pricing content), P5 Sophie (French content), P1 Diane (bilingual content)

**Key tasks:**
- Build "Blog" admin tab: create, edit, publish/draft, delete with EN + FR content fields
- Post schema: `slug`, `title_en`, `title_fr`, `content_en`, `content_fr`, `excerpt_en`, `excerpt_fr`, `publishedAt`, `status`, `author`, `coverImageUrl`
- Migrate `blogData.ts` articles to Firestore as seed data; update `/blog` and `/blog/:slug` routes
- Cloud Function generates RSS feed at `/rss.xml` on publish
- Decision D3 (Firestore-backed vs. headless CMS) ADR'd before start

**Acceptance criteria:**
- Lauren publishes a bilingual blog post without developer involvement
- Post appears within 30 seconds of publishing
- RSS feed validates at W3C Feed Validator

**Complexity:** L · **Dependencies:** ADR for D3 required

---

### P3-E12: Bilingual SEO — Path-Based Language Routing ⬜
**Source:** [Codebase] · **Priority:** P2 · **Complexity:** XL

**Objective:** Migrate from `?lang=fr` query params to `/fr/` path-based routing so French-language pages rank in Google for P1 Diane and P5 Sophie.

**Personas served:** P1 Diane (FR discoverability), P5 Sophie (Snye QC FR search)

**Key tasks:**
- ADR: path prefix (`/fr/*`) vs. subdomain — recommend path prefix (D4)
- Duplicate all routes under `/fr/` prefix in `App.tsx`; update `SEO` component
- Redirect `?lang=fr` → `/fr/` for backward compatibility
- Update all internal links, customer portal links, confirmation email links, GBP links
- Submit updated XML sitemap to Google Search Console
- Update Firebase Hosting rewrites for `/fr/*` paths
- All Playwright E2E tests updated for new route structure

**Acceptance criteria:**
- `/fr/` pages rank for French-language cleaning queries in target geography within 90 days
- Lighthouse SEO ≥ 95 on both `/` and `/fr/`
- No duplicate content warnings in Google Search Console

**Complexity:** XL · **Dependencies:** Phase 1 + 2 complete ✅; D4 ADR approved; ship after P3-E11

---

### P3-E13: Google Business Profile Booking Integration ⬜
**Source:** [Codebase] · **Priority:** P3 · **Complexity:** M

**Objective:** Enable "Book on Google" from the Fresh Nest Co. Google Business Profile.

**Key tasks:**
- Verify Fresh Nest Co. business on GBP; configure booking link with `utm_source=google`
- Confirm `detectLeadSource` maps `utm_source=google` to `leadSource: 'google'`
- Verify GBP bookings appear under "Google" in admin Analytics

**Acceptance criteria:**
- "Book" button visible on Google Maps listing
- GBP bookings show `leadSource: 'google'` in admin analytics

**Complexity:** M · **Dependencies:** P3-E1 ✅ (Google requires payment-enabled services)

---

### P3-E14: Admin Calendar View ⬜
**Source:** [Both] · **Priority:** P3 · **Complexity:** L

**Objective:** Give P12 Lauren a visual week/month calendar view of bookings and job assignments.

**Personas served:** P12 Lauren (dispatch oversight), P14 Sylvie (schedule predictability — can see her upcoming shifts at a glance)

**Key tasks:**
- Add "Calendar" toggle to admin Bookings panel
- Build lightweight custom week-grid component (not `react-big-calendar` — design token control)
- Events: bookings on `preferredDate`; jobs on `scheduledDate` with cleaner name
- Click event opens existing `BookingDetailPanel`
- Draw from paginated bookings (P2-E6 complete) — no re-load of all bookings
- Share the same data layer as the DispatchBoard (P2-E9 complete)

**Acceptance criteria:**
- Admin views all bookings for a given week without scrolling a table
- Calendar renders correctly at 1280px
- No additional Firestore reads beyond what pagination provides

**Complexity:** L · **Dependencies:** P2-E6 complete, P2-E9 complete

---

### P3-E15: Data Retention & PIPEDA Right-to-Erasure ⬜
**Source:** [Both] · **Priority:** P2 · **Complexity:** M

**Objective:** Implement the 7-year retention schedule and PII deletion mechanism committed to in the Privacy Policy.

**Personas served:** All customers (data rights), P12 Lauren (compliance)

**Key tasks:**
- Scheduled Cloud Function (annually, Jan 1): archive bookings older than 7 years to Cloud Storage; delete from Firestore after confirmed export
- Admin "Export data" action: complete JSON export for any email within 60 seconds
- Admin "Delete customer data" action: anonymise PII fields to `[deleted]`; preserve booking record; write to `auditLog`
- Customer self-service deletion request via customer portal; admin must confirm
- CASL unsubscribe mechanism in all marketing emails

**Acceptance criteria:**
- Data export completes for any email within 60 seconds
- Deletion anonymises all PII without removing booking records
- Deletion event logged in `auditLog`
- All marketing emails contain a working unsubscribe link

**Complexity:** M · **Dependencies:** P1-E2 complete, P2-E1 complete

---

### P3-E16: Dynamic Pricing Engine & Conversion Optimisation ⬜
**Source:** [CTO] · **Priority:** P3 · **Complexity:** L

**Objective:** Enable admin-managed promotional pricing, first-booking discounts, and booking funnel analytics.

**Personas served:** P2 Travis (responds to discounts), P1 Diane (loyalty pricing), P12 Lauren (margin control)

**Key tasks:**
- Admin-managed pricing rules in `pricingRules` Firestore collection (time-bounded discount rules)
- First-booking discount: configurable %, detected server-side in `createPaymentIntent`
- Promo code expansion: `BookingStep4` accepts admin-created promo codes
- Funnel analytics: GA4 events per booking step; funnel chart in admin Analytics
- Firebase Remote Config A/B test infrastructure
- Extend Zod booking schema: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` for `preferredDate`

**Acceptance criteria:**
- Admin creates a time-bounded discount rule and it applies in the quote calculator
- First-booking discount applies for new customer emails
- Promo code reduces Stripe `PaymentIntent` amount
- Funnel drop-off rates by step visible in admin Analytics

**Complexity:** L · **Dependencies:** P3-E1 ✅ (Stripe), P2-E6 complete, P3-E22 (Web Worker — should precede)

---

### P3-E17: Multi-Tenancy Schema Flag & ADR ⬜
**Source:** [CTO] · **Priority:** P3 · **Complexity:** S

**Objective:** Add `locationId` field awareness to booking, job, and staff schema — preserving the franchise option without a costly retrofit later.

**Key tasks:**
- Add optional `locationId: string` to `bookings`, `jobs`, and `staff` schema; default `'cornwall-on'`
- Update `docs/firestore-schema.md` with multi-tenancy intent note
- Write `docs/decisions/ADR-004-multi-tenancy-schema-flag.md`

**Acceptance criteria:** `locationId` present in all new documents; ADR committed.

**Complexity:** S · **Dependencies:** None

---

### P3-E26: Quote-First Booking System ⬜
**Source:** [Product] · **Priority:** P2 · **Complexity:** XL

**Objective:** Add a second intake pathway alongside instant booking. Customers submit a quote request; Lauren conducts an on-site assessment, builds a formal contract, and sends a secure signing link. The customer signs, selects optional add-ons, and pays a deposit atomically.

**Personas served:** P6 Gallagher (signed SLA + paper trail), P4 Baptiste (on-site visit builds trust), P3 Margaret (human confirmation + change-request negotiation), P1 Diane (price certainty + preferred cleaner in contract), P12 Lauren (margin protection on complex properties)

**Key tasks:**
- Write ADR (D11) before any code: web-first PDF approach, deposit-at-signing model, token design
- `settings/intake` Firestore document + admin Settings tab; `IntakeModeSettings` toggle
- `BookingPage.tsx` mode-awareness gate: reads `settings/intake`; replaces "Next" with "Request a Free Quote →" for quote-required services
- 6 new `BookingStatus` values in `packages/shared`: `quote_requested`, `quote_sent`, `quote_accepted`, `quote_declined`, `quote_expired`, `changes_requested`
- New `quotes` Firestore collection (full schema: property assessment, contract terms, cleaning scope, optional add-ons, access details, deposit, follow-up schedule, digital signing fields)
- `/quote` route + `QuoteRequestPage`; `/quote-thank-you`; `/sign-contract/:token` + `ContractSigningPage` with Stripe `PaymentElement` for deposit
- `QuoteWorkspaceModal` (5-tab admin tool: Property Assessment · Quote Terms + Deposit · Cleaning Scope + Add-Ons · Access Details · Preview & Send)
- CSS `@media print` stylesheet on signing page — no server-side PDF generation
- 9 Cloud Functions: `onQuoteRequested`, `onQuoteSent`, `onQuoteFollowUpCheck` (scheduled), `onQuoteExpiryCheck` (scheduled), `validateSigningToken`, `onQuoteAccepted` (atomic), `onQuoteChangeRequested`, `onQuoteDeclined`, `onSettingsUpdated`
- 10 email/SMS templates (16 language variants — all EN+FR)
- `QuoteAnalyticsDashboard` sub-tab; customer portal integration (sign-agreement banner, agreement download)
- Cleaner suggestion engine fires automatically at quote acceptance (see P3-E28 Change 6)

**Acceptance criteria:**
- Lauren toggles any service type in under 30 seconds; change propagates within 60 seconds
- Customer completes `/quote` in under 3 minutes; owner notified within 60 seconds
- Admin fills all 5 QuoteWorkspace tabs and sends a contract in under 5 minutes
- "Sign & Pay Deposit" captures payment and signature atomically; Stripe failure leaves quote in `quote_sent` — no partial acceptance state
- On signing: `bookings.status → quote_accepted` within 30 seconds; Job document created; confirmation email (EN/FR) within 60 seconds
- All 4 new public routes pass Linguistic_Auditor; all 10 templates pass Linguistic_Auditor

**Complexity:** XL · **Dependencies:** P3-E1 ✅, P3-E3 ✅, P3-E18 ✅, P3-E19

---

### P3-E27: Employee Onboarding System ⬜
**Source:** [Product] · **Priority:** P1 · **Complexity:** XL · **Band:** C

**Objective:** Replace the current broken, non-compliant manual onboarding process with a complete, legally sound, automated system — from staff registration through 90-day probation completion.

**Background:** The current system has live compliance violations: `compliance.acceptedTermsVersion: '1.0'` is written by the admin at registration before the employee has seen or agreed to anything (PIPEDA violation). No background check consent is collected (PIPEDA). No employment agreement is signed (Ontario ESA gap). No WHMIS training is delivered (legally required in Ontario). The welcome process is entirely manual — Lauren must call the employee to tell them the FSM app URL. Sub-epics A1 and A2 are P0 bugs in production right now and should ship before any other Band C work.

**Detailed plan:** `docs/reports/freshnest-employee-onboarding-project-plan.md`

**Personas served:**
- **P12 Lauren** — registers new cleaners quickly; sees full onboarding status without touching Firestore directly
- **P8 Jasmine** — guided mobile first-login; no race condition failures; completes onboarding in under 10 minutes
- **P11 Brenda** — entire onboarding flow in French; zero English strings (Linguistic_Auditor verified)
- **P13 Marcus** — self-manages blocked windows and understands earnings limit from day one
- **P7 Carla** — ODSP earnings cap explained in onboarding; earnings safety bar visible on first login
- **P10 Ahmed** — ESL-accessible consent screens: icon-first UI with short bilingual captions; Arabic language option surfaces for consent screens if `preferences.language === 'ar'`
- **P9 Mike** — background check process communicated sensitively; blocked-window UI explained in onboarding so recovery commitments are protected from day one
- **P14 Sylvie** — 2:30pm hard limit and caregiver schedule captured in the availability section of the first-login sequence, not as an afterthought
- **P15 Daniel** — bridge commute buffer (Cornwall Island → Cornwall ON) captured during profile setup; written in plain, clear language

**Sub-Phase structure:**

| Sub-Phase | Epic | Priority | Complexity | Legal Gate | Key Persona |
|---|---|---|---|---|---|
| A — Emergency (ship immediately) | **A1:** Fix Terms Pre-Acceptance Compliance Bug | P0 | S | ✅ PIPEDA | P12 Lauren |
| A — Emergency (ship immediately) | **A2:** Fix UID Linking Race Condition | P0 | M | — | P8 Jasmine |
| B — Pre-boarding | **B1:** Automated Welcome Email with Magic Link | P1 | M | — | P11 Brenda (FR) |
| B — Pre-boarding | **B2:** Background Check Consent Collection | P0 | M | ✅ PIPEDA | P8 Jasmine |
| C — First-login sequence | **C1:** First-Login 4-Screen Consent Sequence | P1 | L | ✅ ESA + PIPEDA | P8 Jasmine / P11 Brenda |
| C — First-login sequence | **C2:** Employee Self-Service Profile Completion | P2 | M | — | P13 Marcus / P14 Sylvie / P15 Daniel |
| C — First-login sequence | **C3:** Platform Training Modules (incl. WHMIS) | P1 | L | ✅ WHMIS | P11 Brenda / P10 Ahmed |
| D — Admin operations | **D1:** Staff Detail Panel & Onboarding Checklist UI | P1 | L | — | P12 Lauren |
| D — Admin operations | **D2:** 30/60/90-Day Probation Tracking | P2 | M | — | P12 Lauren |
| D — Admin operations | **D3:** Structured Offboarding | P2 | M | — | P12 Lauren |

**Key sub-epic details:**

**A1 — Fix Terms Pre-Acceptance Bug (P0, ship now):**
Remove `compliance.acceptedTermsVersion: '1.0'` written by `useStaff.registerStaff()` before employee has seen anything. Replace with `compliance: { acceptedTermsVersion: null, termsHistory: [] }`. Update `TermsConsentOverlay` show condition to include `null` check. Update Firestore rules and `docs/firestore-schema.md`.

**A2 — Fix UID Linking Race Condition (P0, ship now):**
Create `onStaffRegistered` Cloud Function (admin-callable): creates Firebase Auth account, sets Custom Claims, writes `staff/{uid}` document with UID as document ID. Removes the silent email-based document migration from `StaffAuthProvider`. Eliminates the `isLinking` race condition.

**B1 — Welcome Email + Magic Link:**
Extends `onStaffRegistered` to generate a magic link (`admin.auth().generateSignInWithEmailLink(...)`) and send a bilingual branded welcome email via Resend. `staffWelcomeEn` and `staffWelcomeFr` templates. `welcomeEmailSentAt` field added to `staff` schema. Admin "Resend welcome email" action in Staff panel.

**B2 — Background Check Consent:**
Background check consent collected as Screen 2 of first-login sequence. Replaces the existing boolean flag with a structured `backgroundCheck` object (consentGiven, consentGivenAt, consentIpAddress, status, completedAt, provider, notes). Admin can update status (pending/cleared/flagged). Dispatch board blocks assignment of uncleared employees with admin override + auditLog.

**C1 — First-Login 4-Screen Consent Sequence:**
Replaces the current abrupt `TermsConsentOverlay` with a guided sequence: Screen 1 Employment Agreement (typed-name signature), Screen 2 Background Check Consent, Screen 3 Platform Terms (existing overlay), Screen 4 Emergency Contact. `OnboardingSequenceGuard` wraps `ProtectedRoute`. Each screen saves independently — sequence is resumable. All four screens render in the employee's preferred language. P10 Ahmed's screens use icon-first layout with short bilingual captions.

**C2 — Employee Self-Service Profile:**
Expands `ProfilePage.tsx`: My Details (read-only with correction flag), Contact (phone editable), Emergency Contact (pre-filled from Screen 4), Availability (existing, including hard time limits for P14 Sylvie's 2:30pm limit and P15 Daniel's bridge commute buffer), Earnings (read-only, P7 Carla's ODSP safety bar visible).

**C3 — Training Modules (incl. WHMIS):**
6-module training library in FSM at `/training`. Modules: 1-Welcome, 2-App Usage, 3-Cleaning Techniques, 4-Chemical Safety/WHMIS (legal gate), 5-Client Standards, 6-Emergency Procedures. Each module has a 3-question comprehension check. `onboardingChecklist` expanded from 2 booleans to 15-field typed object. P10 Ahmed's modules: icon-heavy layout, short sentences, Arabic translation option. P11 Brenda's modules: all content in French.

**D1 — Staff Detail Panel & Onboarding Checklist UI:**
Expandable row in `StaffTable` (consistent with `BookingDetailPanel` pattern). Sections: Onboarding Checklist (admin-toggleable items with timestamps), Status Management ("Activate Employee" gated until all checklist items complete), Compliance Overview (agreement version, consent dates, IPs), Training Progress (per-module completion dates), Quick Actions (resend email, export record).

**D2 — 30/60/90-Day Probation Tracking:**
`onStaffStatusActivated` Cloud Function generates Day-5, Day-30, Day-90 check-in entries. `onProbationCheckInDue` scheduled daily sends Lauren SMS + email reminders. Admin completes check-ins with notes and 5-star rating. Probation outcomes: Passed / Extended (adds 90 days) / Terminated (sets inactive, triggers offboarding).

**D3 — Structured Offboarding:**
`onStaffDeactivated` Cloud Function: disables Firebase Auth account, revokes Custom Claims, writes `offboarding.deactivatedAt`, notifies Lauren. Offboarding checklist in Staff Detail Panel. "Reactivate" reverses all of the above. Deactivated employees see a helpful message instead of a generic error.

**New Cloud Functions:** `onStaffRegistered` (callable), `onStaffStatusActivated` (trigger), `onStaffDeactivated` (trigger), `onProbationCheckInDue` (scheduled daily 9am)

**Schema changes:** Extensive `staff/{uid}` expansion — see `docs/reports/freshnest-employee-onboarding-project-plan.md` for the full schema reference. Key additions: `compliance.acceptedTermsVersion` changed to `string | null`; `employmentAgreement` (new); `backgroundCheck` (replaces boolean); `personalDetails` (new); `onboardingChecklist` (expanded from 2 to 15 fields); `welcomeEmailSentAt` (new); `probation` (new); `offboarding` (new).

**Acceptance criteria (full epic):**
- **P12 Lauren:** Registers cleaner in under 3 minutes; welcome email arrives within 60 seconds; full onboarding checklist visible in admin; activates employee without touching Firestore directly
- **P8 Jasmine:** Clicks magic link; completes 4 consent screens on mobile in under 10 minutes; completes 6 training modules (including WHMIS) within 45 minutes; first login succeeds with no race condition
- **P11 Brenda:** Zero English strings at any point in the onboarding flow — welcome email, all 4 consent screens, all 6 training modules in French (Linguistic_Auditor verified)
- **P13 Marcus:** Updates blocked windows for school pickup and sees earnings safety bar — all without calling Lauren
- **P7 Carla:** Sees ODSP earnings explanation during onboarding; earnings bar visible on first FSM login
- **P10 Ahmed:** All consent screens render with icon-first layout and short bilingual captions; Arabic language option available
- PIPEDA compliance: `termsHistory`, `employmentAgreement`, `backgroundCheck.consentGivenAt` all populated with employee's own timestamp and IP — no admin-generated consent records
- WHMIS gate: employee cannot be assigned to a job while `module4Whmis == false`
- Auth revocation: deactivated employee cannot log in within 60 seconds of deactivation

**Complexity:** XL · **Dependencies:** P3-E4 ✅ (Sentry — onboarding failures must surface), P3-E18 ✅ (Staff type expansion), P3-E19 (Cloud Functions Domain Split — new staff functions slot into `triggers/staff.ts`), P3-E26 (share first-login consent pattern)

---

### P3-E28: Cleaner Suggestion & Auto-Assignment Engine v2 ⬜
**Source:** [Product] · **Priority:** P2 · **Complexity:** L + M + S + M (4 stages) · **Band:** C

**Objective:** Build a rule-based cleaner suggestion and auto-assignment engine that helps P12 Lauren match the right cleaner to every job — at quote acceptance, admin booking creation, and on the dispatch board — with worker-facing transparency and a disruption-handling flow.

**Background:** V3 listed "AI scheduling / predictive staffing" as a 24-month horizon backlog item. The revised plan (v2) is grounded in industry benchmarks: at 1–10 technicians (Fresh Nest's current size), the industry consensus is rule-based suggestion, not ML. V2 corrects ten gaps in the draft feasibility study — most critically: no explicit hard/soft constraint architecture, no disruption-handling design, and no worker-facing transparency for the people being scheduled by the algorithm. The existing `checkCleanerSchedulingConflicts()` in `scheduling.ts` is the foundation; nothing is replaced.

**Detailed plan:** `docs/reports/freshnest-auto-scheduling-revised-final-plan.md`

**Personas served:**
- **P12 Lauren** — primary beneficiary; suggestion list at every intake point; disruption resolved in ≤ 3 clicks
- **P8 Jasmine** — matched only to jobs within her transit range; "why you" explanation removes ambiguity about why a job appeared on her list
- **P11 Brenda** — preferred-cleaner status protects her recurring relationships; "why you" explanation in French
- **P13 Marcus** — earnings cap is a hard constraint that can never be violated; OSAP-safe
- **P14 Sylvie** — 2:30pm hard limit respected as a hard constraint; not a soft penalty
- **P15 Daniel** — bridge commute buffer included in travel-time scoring; island jobs correctly weighted
- **P7 Carla** — ODSP earnings cap is the anchor hard constraint example; her cap can never be violated or even blurred into a scoring penalty
- **P9 Mike** — blocked windows respected as hard constraints; the worker-facing "why you" explanation uses "hidden" (not "greyed") unavailability display, consistent with P9's persona requirement
- **P10 Ahmed** — "why you" explanation uses icon-first layout; short bilingual captions suitable for ESL
- **P1 Diane** — preferred-cleaner continuity explicitly protected; the safest auto-assign case (recurring + same preferred cleaner available + zero hard violations)

**Core architecture (Change 1 — replaces single penalty score):**

```typescript
interface HardConstraintResult {
  passes: boolean
  violations: Array<{
    type: 'earnings_cap' | 'blocked_window' | 'double_booked'
         | 'background_check_not_cleared' | 'whmis_not_complete'
    detail: string
  }>
}

interface SoftConstraintScore {
  travelEfficiencyScore: number       // 0–100 (real distance once clientLatLng available)
  loadBalanceScore: number            // 0–100 (inverse of weekly hours booked)
  preferredCleanerBonus: number       // large fixed bonus — not just another score
  serviceTypeProficiencyScore: number // see Stage 1 Change 4
  revenueAlignmentScore: number       // see Stage 1 Change 5
}
```

Candidates that fail any hard constraint are **never eligible** and are shown in a separate "not eligible" section with the specific violation named — never silently hidden, never blended into a single sortable score.

**Per-scenario autonomy table (Change 7 — stored in `schedulingConfig` Firestore document):**

| Scenario | Default | Rationale |
|---|---|---|
| Recurring booking, same `preferredCleaner` available, zero hard violations | **Auto-assign + notify Lauren** | Lowest-risk case — pure repetition |
| Recurring booking, preferred cleaner unavailable | **Suggest top 3, require click** | Real decision — keep human in loop |
| New/first-time customer booking | **Suggest top 3, require click** | Highest-value relationship-forming moment |
| Commercial / quote-first booking | **Suggest top 3 with proficiency-aware ranking, require click** | Higher stakes |
| Disruption / reassignment | **Suggest top 3, require click, ≤ 3-click resolution target** | Time-pressured but consequential |

**Stage 1 — Rule-based suggestion engine:**
1. Build `autoAssign.ts` with `HardConstraintResult` / `SoftConstraintScore` split — reuses `checkCleanerSchedulingConflicts()` (M)
2. Add `serviceProficiencies: string[]` to `Staff` schema; wire into constraint logic — defaults all residential types; admin explicitly adds `'post_construction'` / `'commercial'` (S)
3. Suggestion UI at: quote acceptance (P3-E26), admin booking creation (P3-E3 ✅), and dispatch board — fires automatically, not just on manual click (M)
4. Add `suggestionMetadata: { wasSuggested, suggestedRank, acceptedTopSuggestion }` to assignment transaction — instrumentation only (S)
5. Unit + emulator tests including hard-constraint-failure cases (S)

**Stage 2 — Real travel-time data (prerequisite for safe automation):**
6. Add `clientLatLng` to `Booking` / `Job`; geocode on creation via Cloud Function (M)
7. Replace postal-prefix heuristic with real distance/drive-time; feeds `travelEfficiencyScore` (M)

**Stage 3 — Worker-facing transparency + AI explanation layer:**
8. Build "why you" explanation screen in FSM job detail (plain-language, 2–3 lines, icon-first, bilingual) — for P10 Ahmed and P11 Brenda specifically (S)
9. LLM call (Claude via existing Anthropic API) generates natural-language explanation from structured constraint objects — LLM describes only, never decides (S)

**Stage 4 — Disruption handling + tuned per-scenario autonomy:**
10. "Can't make it" → real-time re-solve → three-click resolution flow (M)
11. Implement per-scenario autonomy table (Change 7) — auto-assign only the recurring/preferred-cleaner-available case; all others remain suggest-and-confirm (M)
12. Optional: free-text availability parsing for blocked windows via LLM, always confirmation-gated (S)

**Acceptance criteria:**

*Stage 1:*
- Every suggestion list visibly separates "eligible" (ranked by soft score) from "not eligible" (named hard violation)
- Diane's `preferredCleaner` always appears first with an explicit "preferred cleaner" label regardless of score
- Suggestion list fires automatically at quote acceptance and admin booking creation, not only on manual dispatch-board click
- P7 Carla's earnings cap and P14 Sylvie's 2:30pm hard limit are listed as `HardConstraintResult` violations when applicable — never as soft penalties

*Stage 3:*
- Every FSM job assigned via suggestion shows a 2–3 line plain-language "why you" explanation generated from the same structured data shown to Lauren
- P10 Ahmed's explanation uses icon-first layout
- P11 Brenda's explanation renders in French (Linguistic_Auditor verified)
- P9 Mike's unavailability is "hidden" from the eligible list, not greyed out

*Stage 4:*
- "Can't make it" → resolved reassignment in ≤ 3 clicks for Lauren
- Recurring bookings with available preferred cleaner and zero hard violations are auto-assigned with a notification — no click required
- Per-scenario table stored as Firestore `schedulingConfig` document, not hardcoded

**Complexity:** L (Stage 1) + M (Stage 2) + S (Stage 3) + M (Stage 4)
**Dependencies:** P3-E3 ✅ (Admin Booking Creation), P3-E18 ✅ (Shared Types), P3-E26 (Quote-First — suggestion fires at quote acceptance), P3-E27-C2 (staff `serviceProficiencies` captured in profile), P3-E19 (Cloud Functions Domain Split — scheduling functions slot into `triggers/scheduling.ts`)

---

## Band D — Architecture & Technology Upgrades

### P3-E18: Shared Types Package ✅ Completed 2026-06-18
**Priority:** P1 · **Complexity:** M · **Close report:** `docs/reports/P3-E18-close-2026-06-18.md`

`packages/shared/src/types/` with `booking.ts`, `staff.ts`, `job.ts`, `common.ts`. Both apps import from `@freshnest/shared`. `jobToMockBooking` adapter deleted.

---

### P3-E19: Cloud Functions Domain Split ⬜
**Source:** [Tech] · **Priority:** P2 · **Complexity:** M

**Objective:** Split `functions/src/index.ts` (1,125+ lines, 14+ exported functions) into domain-scoped modules.

**Key tasks:**
- `triggers/booking.ts`, `triggers/job.ts`, `triggers/staff.ts` (expands significantly with P3-E27 new functions)
- `scheduled/reminders.ts`, `scheduled/renewals.ts`, `scheduled/reviews.ts`, `scheduled/earnings.ts`
- `callable/auth.ts`, `callable/analytics.ts`
- `index.ts` becomes pure re-exports only
- P3-E27's new staff Cloud Functions (`onStaffRegistered`, `onStaffStatusActivated`, `onStaffDeactivated`, `onProbationCheckInDue`) slot cleanly into `triggers/staff.ts` and `scheduled/staff.ts`
- P3-E28's scheduling functions slot into `triggers/scheduling.ts`

**Acceptance criteria:** `index.ts` contains only re-exports; each domain file under 200 lines; all existing exports unchanged.

**Complexity:** M · **Dependencies:** P3-E7 ✅ (clean up before splitting)

---

### P3-E20: Firebase App Check ✅ Completed 2026-06-18
**Priority:** P1 · **Complexity:** S · **Close report:** `docs/reports/P3-E20-close-2026-06-18.md`

ReCaptchaV3Provider added to `apps/customer` and `apps/fsm`. App Check enforcement enabled in Firebase console on Firestore and Cloud Functions.

---

### P3-E21: Firestore `withConverter()` Adoption ⬜
**Source:** [Tech] · **Priority:** P2 · **Complexity:** M

**Objective:** Replace 20+ manual Timestamp casting patterns with typed Firestore converters.

**Key tasks:**
- Create `lib/firebase/converters.ts` with converters for `bookings`, `jobs`, `staff`, `reviews`, `payRates`, `checklistTemplates`
- Replace all manual `instanceof Timestamp ? .toDate() : new Date()` patterns
- All collection references use typed converters

**Acceptance criteria:** Zero manual Timestamp casts in any `lib/firebase/` or `hooks/` file.

**Complexity:** M · **Dependencies:** P3-E18 ✅ (converters reference canonical shared types)

---

### P3-E22: Pricing Web Worker ⬜
**Source:** [Tech] · **Priority:** P2 · **Complexity:** M

**Objective:** Move the pricing calculation engine to a Web Worker before P3-E16 adds async Firestore rule evaluation that would block the main thread.

**Key tasks:**
- `lib/workers/pricing.worker.ts`: receives `{ size, service, frequency, rules }`, posts result
- `useQuoteCalculator` hook manages worker lifecycle
- Existing `calculateQuote()` function unchanged; worker calls it internally

**Acceptance criteria:** Quote calculator UI remains responsive while calculation runs; existing `quotePricing.test.ts` still passes.

**Complexity:** M · **Dependencies:** Implement before P3-E16

---

### P3-E23: React 19 `useSuspenseQuery` & Suspense Boundaries ⬜
**Source:** [Tech] · **Priority:** P3 · **Complexity:** M

**Objective:** Replace `isLoading` branching in portal and admin pages with `useSuspenseQuery` + Suspense boundaries.

**Key tasks:**
- Migrate customer portal pages from `useQuery` to `useSuspenseQuery`
- Migrate admin analytics from `isLoading` branch to `useSuspenseQuery` + `<Suspense fallback={...}>`
- TanStack Query v5 `queryOptions()` factory pattern for all query definitions

**Acceptance criteria:** No `if (isLoading) return <Spinner />` patterns in portal or admin pages.

**Complexity:** M · **Dependencies:** P3-E2 ✅ (Suspense boundary from code splitting)

---

### P3-E24: VitePress Documentation Site ⬜
**Source:** [Tech] · **Priority:** P3 · **Complexity:** M

**Objective:** Deploy a navigable documentation site at `docs.freshnest.co` for the admin guide, user guide, FSM staff guide, and design system.

**Key tasks:**
- Create `apps/docs/` workspace; install VitePress
- Sidebar navigation: Admin Guide · Booking Guide · Design System · FSM Staff Guide · API/Schema Reference
- Migrate `user-guide/admin-guide.md` and `user-guide/booking-guide.md`
- Write FSM Staff Guide (covers P3-E27 first-login, training, job flow)
- Add fourth Firebase Hosting target `freshnest-docs`; deploy via GitHub Actions
- Decision D9 (scope) must be ADR'd before building

**Acceptance criteria:** Live at `docs.freshnest.co`; full-text search; accessible on mobile.

**Complexity:** M · **Dependencies:** P3-E5 ✅ (CI/CD pipeline), D9 ADR

---

### P3-E25: Storybook for `packages/ui` Primitives ⬜
**Source:** [Tech] · **Priority:** P3 · **Complexity:** M

**Objective:** Extract shared UI primitives into `packages/ui` and document them in Storybook.

**Key tasks:**
- Create `packages/ui/` workspace after P3-E3 ✅
- Extract: `Button`, `Modal`, `FormField`, `Badge`, `StatusPill`, `Spinner`, `SkeletonRow`
- Each primitive: design token class props, `min-h-[48px]` on interactive elements, bilingual `aria-label`
- Install Storybook v8 at monorepo root
- Stories for each primitive: default, variants, error states, loading states

**Acceptance criteria:** Storybook at `http://localhost:6006`; both apps compile with zero regressions.

**Complexity:** M · **Dependencies:** P3-E3 ✅, P3-E18 ✅

---

## Master Epic Summary Table

| Band | ID | Epic Name | Complexity | Priority | Status | Key Dependency |
|---|---|---|---|---|---|---|
| A | P3-E1 | Stripe Payment Integration | XL | P0 | ✅ 2026-06-21 | — |
| A | P3-E2 | Route Code Splitting | M | P1 | ✅ 2026-06-21 | — |
| A | P3-E3 | Admin Booking Creation | L | P1 | ✅ 2026-06-21 | — |
| A | P3-E4 | Observability & Error Tracking | M | P1 | ✅ 2026-06-18 | — |
| A | P3-E5 | CI/CD Pipeline Hardening | S | P1 | ✅ 2026-06-18 | — |
| A | P3-E6 | Accessibility Pass (WCAG 2.1 AA) | M | P2 | ✅ 2026-06-21 | — |
| B | P3-E7 | Cloud Functions Bug Fixes | S | P0 | ✅ 2026-06-18 | — |
| B | P3-E8 | `useBookings` Server-Side Filtering | M | P1 | ✅ 2026-06-21 | — |
| B | P3-E9 | Remove `window.__MOCK_*` | S | P1 | ✅ 2026-06-18 | — |
| C | P3-E10 | Loyalty & Referral Reward Loop | L | P2 | ⬜ | E1 ✅ |
| C | P3-E11 | CMS-Backed Blog | L | P3 | ⬜ | D3 ADR |
| C | P3-E12 | Bilingual SEO Path-Based Routing | XL | P2 | ⬜ | D4 ADR; after E11 |
| C | P3-E13 | Google Business Profile Integration | M | P3 | ⬜ | E1 ✅ |
| C | P3-E14 | Admin Calendar View | L | P3 | ⬜ | P2-E6, P2-E9 done |
| C | P3-E15 | Data Retention & PIPEDA Erasure | M | P2 | ⬜ | P1-E2, P2-E1 done |
| C | P3-E16 | Dynamic Pricing & Conversion | L | P3 | ⬜ | E1 ✅, E22 |
| C | P3-E17 | Multi-Tenancy Schema Flag & ADR | S | P3 | ⬜ | — |
| C | P3-E26 | Quote-First Booking System | XL | P2 | ⬜ | E1 ✅, E3 ✅, E18 ✅, E19 |
| C | P3-E27 | Employee Onboarding System | XL | P1 | ⬜ (A1/A2 P0 — ship now) | E4 ✅, E18 ✅, E19, E26 |
| C | P3-E28 | Cleaner Suggestion & Auto-Assignment | L+M+S+M | P2 | ⬜ | E3 ✅, E18 ✅, E26, E27-C2, E19 |
| D | P3-E18 | Shared Types Package | M | P1 | ✅ 2026-06-18 | — |
| D | P3-E19 | Cloud Functions Domain Split | M | P2 | ⬜ | E7 ✅ |
| D | P3-E20 | Firebase App Check | S | P1 | ✅ 2026-06-18 | — |
| D | P3-E21 | Firestore `withConverter()` Adoption | M | P2 | ⬜ | E18 ✅ |
| D | P3-E22 | Pricing Web Worker | M | P2 | ⬜ | Before E16 |
| D | P3-E23 | React 19 `useSuspenseQuery` | M | P3 | ⬜ | E2 ✅ |
| D | P3-E24 | VitePress Documentation Site | M | P3 | ⬜ | E5 ✅, D9 ADR |
| D | P3-E25 | Storybook for `packages/ui` | M | P3 | ⬜ | E3 ✅, E18 ✅ |

**Total epics:** 28 · **Completed:** 11 · **Remaining:** 17
**Totals (remaining) by complexity:** S×1 · M×8 · L×4 · XL×3 + P3-E28 multi-stage
**Totals (remaining) by priority:** P0×0 (sub-epic P3-E27-A1, A2 are P0) · P1×1 · P2×8 · P3×7

---

## Recommended Sprint Sequencing

### Sprint 1–4 (Weeks 1–9): ✅ COMPLETE
P3-E7, P3-E18, P3-E20, P3-E5, P3-E1, P3-E9, P3-E4, P3-E3, P3-E8, P3-E2, P3-E6, P3-E15, P3-E17

### Sprint 5 (Weeks 9–11): Compliance + Architecture foundations
- **P3-E27-A1** (P0 — ship immediately — live PIPEDA violation)
- **P3-E27-A2** (P0 — ship immediately — race condition on every new hire)
- P3-E19 Cloud Functions Domain Split (M — do before P3-E26 and P3-E27's new functions)
- P3-E21 Firestore `withConverter()` Adoption (M — clean up before new schemas arrive)

### Sprint 6 (Weeks 11–14): Staff onboarding pre-boarding + architecture
- **P3-E27-B1** Welcome Email + Magic Link (M — staff can now be properly onboarded)
- **P3-E27-B2** Background Check Consent (P0 — PIPEDA — closes once A2 ships)
- P3-E22 Pricing Web Worker (M — must precede E16)
- P3-E17 Multi-Tenancy Schema Flag (S — fast win)

### Sprint 7 (Weeks 14–18): Staff onboarding first-login + admin
- **P3-E27-C1** First-Login Consent Sequence (L)
- **P3-E27-C2** Employee Self-Service Profile (M — captures P14 Sylvie's 2:30pm limit, P15 Daniel's bridge commute)
- **P3-E27-D1** Staff Detail Panel & Onboarding Checklist (L — Lauren needs visibility before training ships)

### Sprint 8 (Weeks 18–22): Staff training + growth customer-facing
- **P3-E27-C3** Training Modules incl. WHMIS (L)
- **P3-E27-D2** Probation Tracking (M)
- **P3-E27-D3** Structured Offboarding (M)
- P3-E10 Loyalty & Referral Reward Loop (L — all staff onboarded = growth focus can resume)
- P3-E15 Data Retention & PIPEDA Erasure (M)

### Sprint 9 (Weeks 22–27): Quote system + scheduling
- P3-E26 Quote-First Booking System (XL — also enables P3-E28 suggestion at quote acceptance)
- P3-E28 Stage 1 — Rule-based suggestion engine (L — fires at E26 acceptance point)

### Sprint 10 (Weeks 27–32): Growth + developer experience
- P3-E11 CMS-Backed Blog (L)
- P3-E12 Bilingual SEO (XL)
- P3-E13 GBP Integration (M)
- P3-E14 Admin Calendar View (L)
- P3-E16 Dynamic Pricing (L)
- P3-E28 Stage 2–4 (travel time + worker transparency + disruption handling)
- P3-E23 React 19 `useSuspenseQuery` (M)
- P3-E24 VitePress Documentation Site (M)
- P3-E25 Storybook for `packages/ui` (M)

---

## Dependency Map

```
✅ Complete (no further deps needed):
P3-E7  · P3-E18 · P3-E20 · P3-E5 · P3-E1 · P3-E9
P3-E4  · P3-E3  · P3-E8  · P3-E2 · P3-E6

Immediate (P0 sub-epics — ship before Sprint 5 ends):
P3-E27-A1 ──► P3-E27-A2 ──► P3-E27-B1 / B2

Architecture chain:
P3-E7 ✅  ──► P3-E19 ──► P3-E26 / P3-E27 / P3-E28 (Cloud Function domain split)
P3-E18 ✅ ──► P3-E21 (converters use shared types)
P3-E18 ✅ ──► P3-E25 (Storybook uses shared types)
P3-E22    ──► P3-E16 (pricing worker before dynamic pricing)

Growth chain:
P3-E1 ✅  ──► P3-E10 (referral credits need Stripe)
P3-E1 ✅  ──► P3-E13 (GBP needs payment-enabled)
P3-E1 ✅  ──► P3-E16 (dynamic pricing needs Stripe)
P3-E11    ──► P3-E12 (blog routes need FR paths)
P3-E2 ✅  ──► P3-E23 (Suspense boundaries enable useSuspenseQuery)
P3-E5 ✅  ──► P3-E24 (VitePress uses same CI pipeline)
P3-E3 ✅  ──► P3-E25 (Storybook after AdminBookingModal = extraction point)

Quote + scheduling chain:
P3-E1 ✅ + P3-E3 ✅ + P3-E19 ──► P3-E26 (Quote-First)
P3-E26 ──► P3-E28 Stage 1 (suggestion fires at quote acceptance)
P3-E27-C2 ──► P3-E28 Stage 1 (serviceProficiencies captured in staff profile)
P3-E28 Stages 2–4 ──► after Stage 1 validated in production
```

---

## Backlog (Out of Phase 3 Scope)

| Item | Reason Deferred | Trigger to promote |
|---|---|---|
| Franchise / multi-tenant enforcement | Schema flag in P3-E17; full enforcement is Phase 4 | Second location or franchise agreement signed |
| Native push notifications for FSM staff | PWA push (P2-E7) covers core use case | Native app decision made |
| QuickBooks / accounting integration | Requires invoice workflow; Phase 4 | Invoice workflow live |
| Slot-based booking with availability calendar | Requires dispatch board + scheduling engine stabilisation | P3-E28 Stage 4 complete |
| Background check API integration (Certn/Sterling) | Manual process in P3-E27-D1 first; API after volume justifies | > 20 hires/month |
| Mobile video player for FSM training | After P3-E27-C3 training content is validated and stable | C3 complete + 6-month review |
| Win-back re-engagement for offboarded seasonal staff | After P3-E27-D3 offboarding is stable | First seasonal cycle complete |
| P3-E28 free-text availability parsing (LLM) | Optional; P3-E28 Change 8b — build when appetite exists | P3-E28 Stage 4 shipped |
| `@tanstack/virtual` row virtualisation | Add when BookingsTable exceeds 200 DOM rows | Booking volume warrants |
| MSW (Mock Service Worker) test architecture | Add when Playwright suite exceeds ~15 specs | Currently 7 specs |
| Turborepo build caching | Add when CI build time consistently exceeds 8 minutes | Currently ~7s |
| Biome (ESLint + Prettier replacement) | TanStack Query plugin compatibility check needed first | Phase 4 DX improvement |
| Customer help centre (VitePress Phase 2) | Expand from admin-only after P3-E24 ships | P3-E24 live + customer support volume |
| Reference check workflow | After employment contract compliance is closed via P3-E27 | P3-E27 fully complete |
| Arabic full-translation of customer app | P10 Ahmed's primary need is FSM app (staff-facing) — customer app is English/French | Arabic customer demand emerges |
| AI scheduling Dispatch Pro tier | Rule-based P3-E28 is correct for current team size | > 11 cleaners on roster |
