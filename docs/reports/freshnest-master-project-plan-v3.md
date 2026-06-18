# Fresh Nest Co. — Master Project Plan v3.0

**Compiled:** June 17, 2026
**Previous versions:** v2.0 (June 16, 2026) · v1.1 (June 15, 2026)
**Sources:** Master Plan v2.0 · Deep Technical Analysis (June 17) · Progress & Tooling Analysis (June 17) · Codebase `codebase_export_FN_20260617`
**Platform:** React 19 · Vite · Firebase · Tailwind CSS v3 · TypeScript strict · npm workspaces monorepo

---

## Status of Previous Phases

**Phase 1 — Stabilize & Secure: ✅ COMPLETE (10 of 10 epics)**
P1-E1 Secrets Remediation (script authored, git excision pending execution) · P1-E2 Privacy Policy · P1-E3 Stripe (E2E mock scaffold built; SDK integration pending) · P1-E4 Bug & Index Fixes · P1-E5 Route Code Splitting (not yet done) · P1-E6 Admin Booking Creation (not yet done) · P1-E7 Observability (not yet done) · P1-E8 CI/CD Hardening (not yet done)

> **Note:** P1-E3, P1-E5, P1-E6, P1-E7, and P1-E8 are not yet implemented in the June 17 codebase. These are promoted into Phase 3 as the highest-priority carryover items. Phase 1 and 2 are considered "scope-complete" per the attached plan, but the unimplemented Phase 1 items are the first things to complete in Phase 3.

**Phase 2 — Compete: ✅ COMPLETE (10 of 10 epics)**
P2-E1 Customer Portal · P2-E2 Review Automation · P2-E3 On My Way SMS · P2-E4 Content Pages · P2-E5 Accessibility Pass (not yet done) · P2-E6 Admin Pagination & Analytics · P2-E7 PWA · P2-E8 Custom Claims RBAC · P2-E9 Dispatch Board · P2-E10 Test Coverage

> **Note:** P2-E5 Accessibility Pass has not been implemented. It is carried forward into Phase 3 alongside the Phase 1 carryovers.

---

## How to Read This Plan

Each epic follows a uniform structure: **Objective → Background → Personas served → Key tasks → Acceptance criteria → Complexity → Priority → Dependencies.**

Complexity: S (days) · M (1 week) · L (2–3 weeks) · XL (1 month+)
Priority: P0 (legal/security blocker) · P1 (revenue or ops blocker) · P2 (competitive gap) · P3 (growth lever)
Source tags: **[Codebase]** = ground-up audit · **[CTO]** = CTO audit cross-validation · **[Both]** = confirmed by both · **[Tech]** = deep technical analysis June 17

---

## Sequencing Rationale

Phase 3 is structured in four bands:

1. **Band A — Carryover critical items.** Five epics from Phases 1 and 2 were never implemented. P1-E3 (Stripe) remains the single highest-value item in the entire plan — every booking is still unpaid. These ship first in Phase 3, in their original priority order.
2. **Band B — Code quality & safety.** Critical bugs identified in the June 17 deep technical analysis that are live in production right now: `require()` runtime crash, double-read in analytics, type safety gaps. These are fast fixes that must close before Phase 3 growth work begins.
3. **Band C — Scale & grow.** The original Phase 3 epics (referral loop, bilingual SEO, GBP, calendar, data retention, dynamic pricing, multi-tenancy flag), now enriched with codebase-audit refinements.
4. **Band D — Architecture & future-proofing.** Structural refactors and technology upgrades (shared types, function domain split, Storybook, VitePress, React 19 patterns) that pay dividends across all future development.

---

## Open Decisions Required Before Specific Epics

| # | Decision | Blocks | Recommendation |
|---|---|---|---|
| D3 | Blog CMS: Firestore-backed vs. headless | P3-E9 | **Firestore-backed** — no new services; bilingual natural; admin panel exists |
| D4 | Bilingual routing: `/fr/` path prefix vs. subdomain | P3-E10 | **Path prefix** — simpler hosting; decide before GBP links are locked |
| D8 | Web Worker for pricing engine | P3-E14 | **Yes** — Vite supports natively; implement before dynamic pricing adds async logic |
| D9 | VitePress scope: admin-only vs. public help centre | P3-E17 | **Admin-only first** (`docs.freshnest.co`); expand to customer help in Phase 4 |
| D10 | Storybook: single monorepo instance vs. per-app | P3-E18 | **Single monorepo instance** at root; stories for `packages/ui` primitives only |

---

## Phase 3 — Stabilize Carryovers, Scale & Harden

**Goal:** Close all unimplemented Phase 1/2 items, eliminate live production bugs, build the growth infrastructure that drives customer lifetime value and organic acquisition, and establish the architectural foundations that make Phase 4 safe to build.

**Estimated duration:** 20–28 weeks
**Epic count:** 22
**Carryovers from Phase 1:** 5 (P1-E3, P1-E5, P1-E6, P1-E7, P1-E8)
**Carryovers from Phase 2:** 1 (P2-E5)
**Original Phase 3 items from v2.0:** 8
**New items from June 17 deep technical analysis:** 8

---

## Band A — Carryover Critical Items
*(Must ship before Band C or D work begins)*

---

### P3-E1: Stripe Payment Integration *(Carried from P1-E3)*
**Source:** [Both] · **Priority:** P0 · **Complexity:** XL

**Objective:** Capture a payment hold at booking submission. Every booking submitted today is an unpaid request — the single largest revenue gap in the entire platform.

**Background:** No Stripe SDK exists in `package.json`. The booking form collects full service and contact details but submits to Firestore with zero financial commitment. A checkout E2E mock scaffold exists in `checkout.spec.ts` (with `window.__MOCK_SUBMIT__` and `window.__MOCK_CREATE_PAYMENT_INTENT__`), which proves the test infrastructure is ready — the actual Stripe integration is what's missing. Competitors (Launch27, Housecall Pro, Handy) all collect payment at booking. The `require()` bug in `onBookingCancelled` (see P3-E7) must be fixed in the same sprint since Stripe and cancellation are coupled.

**Personas served:** P2 Travis (fast, mobile, transparent), P6 Gallagher (Airbnb turnover, no friction)

**Key tasks:**
- Install `@stripe/stripe-js` and `@stripe/react-stripe-js` in `apps/customer`; `stripe` in `functions/`
- Add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` as Firebase Function secrets (via `defineSecret()`, never `process.env`)
- Cloud Function `createPaymentIntent`: accepts booking data, returns `PaymentIntent` client secret
- Extend `BookingStep4` with Stripe `PaymentElement` for card capture — remove `window.__MOCK_CREATE_PAYMENT_INTENT__` escape hatch from production code
- Submission flow: `createPaymentIntent` → confirm payment → write to Firestore (success only)
- Cloud Function trigger on `status → confirmed`: capture the PaymentIntent
- Cloud Function trigger on `status → cancelled`: release the hold (fix `require()` bug simultaneously — see P3-E7)
- Add `stripePaymentIntentId`, `stripeChargeId`, `stripeChargeStatus` to booking schema
- Update Firestore security rules for new optional payment fields
- Update `docs/firestore-schema.md`
- Stripe webhook handler Cloud Function for async payment confirmation
- Display estimated HST as a line item on Step 4 review (13% ON; QC 14.975% TBD)
- Update booking Playwright E2E to use real Stripe test card (`4242 4242 4242 4242`) rather than window mocks
- Remove `window.__MOCK_SUBMIT__` check from `firestore.ts` — test mocking belongs at the network layer (Playwright `page.route()`), not in production code

**Acceptance criteria:**
- Travis completes a booking with card payment in under 4 minutes (Playwright E2E passes with real Stripe test mode)
- Admin sees `hold / captured / released` payment status in `BookingDetailPanel`
- Cancellation releases hold without charging the customer
- Stripe webhook handles async capture correctly
- Payment failure surfaces `role="alert"` — no silent failures
- `window.__MOCK_SUBMIT__` removed from `firestore.ts`
- No `require()` in `functions/src/index.ts`

**Complexity:** XL
**Dependencies:** P1-E1 complete (clean secrets), P3-E7 (fix `require()` bugs simultaneously)

---

### P3-E2: Route Code Splitting *(Carried from P1-E5)*
**Source:** [Codebase] · **Priority:** P1 · **Complexity:** M

**Objective:** Implement route-level lazy loading. All 25+ pages are currently eager-loaded, including the heavy admin bundle (Recharts, DND Kit, DispatchBoard), which is served on every visitor's initial page load.

**Key tasks:**
- Wrap all page-level imports in `App.tsx` with `React.lazy()`
- Add `<Suspense fallback={<PageLoader />}>` around `RouterProvider`
- Create `PageLoader` component: brand spinner using `slate-brand` on `warm-white`
- Isolate admin chunk from public marketing chunk
- Install `rollup-plugin-visualizer` (devDependency); document chunk sizes before/after
- Pair with `useSuspenseQuery` migration (P3-E19) — Suspense boundary added here enables it

**Acceptance criteria:**
- Initial JS payload reduced ≥ 40% (Lighthouse or bundle visualiser)
- All routes load correctly in EN and FR
- Admin panel loads on first navigation without chunk error
- All existing Playwright E2E tests pass

**Complexity:** M
**Dependencies:** None

---

### P3-E3: Admin Booking Creation *(Carried from P1-E6)*
**Source:** [Codebase] · **Priority:** P1 · **Complexity:** L

**Objective:** Allow admin to create bookings from the dashboard for phone-in, walk-in, and referred bookings that arrive outside the public form.

**Background:** No admin-side booking creation exists anywhere in the codebase. The six admin tabs have no "New Booking" action. Lauren cannot log a Margaret phone call (P3), a Gallagher walk-in (P6), or a Baptiste community referral (P4) without directing the customer to the website.

**Personas served:** P3 Margaret (phone), P6 Gallagher (B2B), P4 Kahnawà:ke Baptiste (community referral)

**Key tasks:**
- Add "New Booking" button to `BookingsTable` header
- Create `AdminBookingModal`: single-page modal (not multi-step), all required and optional booking fields
- Required: serviceType, propertyType, bedrooms, bathrooms, pets, frequency, preferredDate, addOns, firstName, lastName, email, phone, address
- Optional: preferredCleaner, notes, squareFootage, isAirbnb, photoConfirmation
- Admin-only: language (EN/FR), leadSource (add `'phone'` and `'walk-in'` to enum), assignedTo (staff select), initial status (`pending` or `confirmed`), marketingConsent (off by default)
- Extend `submitBooking` with `adminCreate` variant: accepts `status: 'pending' | 'confirmed'`, non-null `assignedTo`, writes `createdBy: adminEmail`
- Split Firestore rules: public creates still block `status: 'confirmed'`, non-null `assignedTo`, `createdBy`; admin creates (via `isAdmin()`) permit all three
- Admin booking bypasses Stripe — payment via cash/e-transfer/future invoice
- `onBookingCreated` Cloud Function fires automatically on Firestore write
- If `status: 'confirmed'` at creation, `onBookingStatusConfirmed` fires and creates Job document
- Add all modal strings to `en.json` / `fr.json`

**Acceptance criteria:**
- Lauren creates a phone-in booking in under 2 minutes
- `leadSource: 'phone'` and `'walk-in'` appear in Analytics lead source chart
- Confirmation email/SMS sends in client's selected language
- Confirmed creation generates Job document and fires staff SMS
- `createdBy` populated on all admin-created records
- Firestore rules correctly gate public vs admin paths
- Linguistic_Auditor and Brand_Auditor sign off

**Complexity:** L
**Dependencies:** None

---

### P3-E4: Observability & Error Tracking *(Carried from P1-E7)*
**Source:** [CTO] · **Priority:** P1 · **Complexity:** M

**Objective:** Establish production observability. Cloud Function failures are currently completely silent — no alerting, no error tracking, no uptime monitoring.

**Background:** With the customer portal live (real authenticated users), "on my way" SMS firing on job status changes, Custom Claims being set on user creation, and Stripe about to be added, silent Cloud Function failures have direct customer-facing consequences. `onUserCreated`, `setUserRole`, `onJobUpdatedTrigger`, and `onDailyRecurringRenewal` all have `try/catch` blocks that log to `console.error` and return silently.

**Key tasks:**
- Install `@sentry/react` in `apps/customer` and `apps/fsm`; `@sentry/node` in `functions/`
- Configure Sentry with `BrowserTracing` + `Replay` — production only, gated by `VITE_SENTRY_DSN` GitHub Secret
- Wrap all Cloud Function handlers in Sentry error capture
- Add Sentry `sourceMap` upload step to `firebase-deploy.yml`
- Enable Firebase Performance Monitoring (`getPerformance(app)`) in `apps/customer/src/main.tsx`
- Replace all `console.error()` in Cloud Functions with structured Google Cloud Logging entries
- Create Google Cloud Monitoring alert policy: Function error rate > 2 in 5 minutes → email + SMS to operator
- Configure UptimeRobot on `https://freshnest.ca`
- Store `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` as GitHub Secrets

**Acceptance criteria:**
- Client-side errors appear in Sentry within 60 seconds
- Cloud Function errors surface in Sentry with source-mapped stack traces
- Operator alerted by email/SMS when any Function fails > 2 times in 5 minutes
- UptimeRobot monitoring active
- No `console.error()` remaining in Cloud Functions source

**Complexity:** M
**Dependencies:** P1-E1 complete (clean secrets)

---

### P3-E5: CI/CD Pipeline Hardening *(Carried from P1-E8)*
**Source:** [CTO] · **Priority:** P1 · **Complexity:** S

**Objective:** Add security scanning, dependency governance, and performance regression detection to the GitHub Actions pipeline.

**Key tasks:**
- Add `npm audit --audit-level=high` to `firebase-deploy.yml` — fail build on high-severity CVEs
- Add Dependabot config at `/.github/dependabot.yml` — weekly PRs for all workspaces
- Add Lighthouse CI step to `firebase-preview.yml` — post scores as PR comment (warn, don't block)
- Add GitHub CodeQL workflow — runs on PR and push to main; JS/TS security scanning
- Document rollback procedure in `docs/decisions/ADR-002-rollback-procedure.md`
- Add `rollup-plugin-visualizer` bundle analysis output to CI (confirms P3-E2 payload targets are maintained)

**Acceptance criteria:**
- `npm audit` runs on every deploy; high CVEs block the build
- Dependabot PRs appear within 7 days
- Lighthouse scores posted on every PR
- CodeQL results visible in GitHub Security tab
- Rollback procedure documented and manually tested

**Complexity:** S
**Dependencies:** P1-E1 complete

---

### P3-E6: Accessibility Pass (WCAG 2.1 AA) *(Carried from P2-E5)*
**Source:** [Codebase] · **Priority:** P2 · **Complexity:** M

**Objective:** Bring the customer app to WCAG 2.1 AA compliance across all core user flows.

**Personas served:** P3 Margaret (primary); legally important for all Canadian public-facing services

**Key tasks:**
- Add skip navigation link in `Layout.tsx`: `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>`
- Add `aria-expanded` and `aria-controls` on mobile nav hamburger in `Navbar.tsx`
- Implement focus management in booking form: on step change, `focus()` first interactive element
- Audit all `font-body text-sm` (14px) instances in admin tables; uplift to `text-base` or confirm decorative-only
- Add `aria-live="polite"` regions for admin filter count updates and booking step progress
- Run axe-core audit on `/booking`, `/`, and `/admin`; resolve all Critical and Serious violations
- Confirm `html[lang]` switches dynamically (implemented in June 17 codebase)

**Acceptance criteria:**
- Lighthouse a11y score ≥ 90 on `/booking` and `/`
- Keyboard-only user completes full booking flow (Playwright keyboard-nav test)
- No axe-core Critical or Serious violations on audited routes
- All `min-h-[48px]` touch targets maintained

**Complexity:** M
**Dependencies:** P1-E4 complete (html lang fix — confirmed done in June 17 codebase)

---

## Band B — Live Production Bug Fixes
*(Fast fixes. Complete within first 2 weeks of Phase 3, in parallel with Band A carryovers.)*

---

### P3-E7: Cloud Functions Critical Bug Fixes
**Source:** [Tech] · **Priority:** P0 · **Complexity:** S

**Objective:** Fix three live production bugs in Cloud Functions that cause runtime crashes, type safety failures, and wasted Firestore reads.

**Background:**

**Bug 1 — `require()` in ESM context (runtime crash):** `onBookingCancelled` uses `const Stripe = require('stripe')` and `const twilio = require('twilio')`. The functions are compiled as ESM (`"module": "ESNext"` in `functions/tsconfig.json`). `require` does not exist at runtime in Node 20 ESM context — this throws `ReferenceError: require is not defined` the moment any booking is cancelled. No Stripe hold release, no job cancellation, no admin SMS. This is silently broken right now.

**Bug 2 — `as any` in `getAnalyticsKPIs` (type safety gap):** `bookingsQuery = bookingsQuery.where(...) as any` casts the chained query to `any`, bypassing TypeScript for all subsequent `.aggregate()` and `.select()` calls. The correct fix is `let bookingsQuery: Query | CollectionReference = db.collection('bookings')`.

**Bug 3 — Double Firestore read in `getAnalyticsKPIs` (wasted cost):** The function runs an `AggregateField.count()` + `AggregateField.sum()` aggregation query and then immediately discards those results, re-computing the same values by iterating all documents with a `.select()` query. The aggregation result (`totalRevenueAgg`, `aggData.count`) is logged but the payload uses `snapshot.size` and a manually-summed `totalRevenue` instead. Every analytics request performs two full collection reads.

**Key tasks:**
- Replace `require('stripe')` with `import Stripe from 'stripe'` at module scope with `defineSecret('STRIPE_SECRET_KEY')`
- Replace `require('twilio')` with `import twilio from 'twilio'` at module scope
- Fix `bookingsQuery` type: `let bookingsQuery: Query | CollectionReference = db.collection('bookings')`
- Refactor `getAnalyticsKPIs`: use aggregation for `totalBookings` and `totalRevenue`; use `.select()` only for breakdown fields (leadSource, createdAt, referredBy); remove redundant manual sum loop
- Fix `any[]` type on `auditLogs` in `onStaffUpdatedTrigger` — replace with typed `AuditLogEntry[]` interface

**Acceptance criteria:**
- `onBookingCancelled` runs without error when a customer cancels a booking
- Stripe hold releases correctly on cancellation
- `getAnalyticsKPIs` makes one aggregation query + one select query (not two full reads)
- TypeScript strict mode passes on `functions/` with zero `any` suppressions
- No `require()` in any Cloud Function source file

**Complexity:** S
**Dependencies:** None — fix immediately

---

### P3-E8: `useBookings` Server-Side Filtering Fix
**Source:** [Tech] · **Priority:** P1 · **Complexity:** M

**Objective:** Push status, service type, and language filters to the Firestore query layer rather than applying them client-side on a paginated result set.

**Background:** `useBookings` uses `useInfiniteQuery` with pagination (50 docs per page) but then applies all filter dropdowns as client-side `useMemo` over the already-loaded page. If Lauren loads page 1 (50 bookings) and filters by `status: confirmed`, she sees only confirmed bookings from those 50 — not from the 150+ bookings on pages 2–4. The admin can see "0 confirmed bookings" while there are actually 150. This is a correctness bug that will worsen as booking volume grows.

**Key tasks:**
- Add `statusFilter`, `serviceFilter`, `languageFilter` to the `queryKey` array in `useInfiniteQuery`
- Add conditional `where()` clauses inside the `queryFn` for each active filter (non-'all' values only)
- Declare required composite indexes in `firestore.indexes.json`: `preferredDate + status`, `preferredDate + serviceType`, `preferredDate + language`
- Free-text search (name/email/phone) must remain client-side — document clearly as "searches within loaded pages only"
- Separate UI state (`expandedRowId`, `customCleanerNames`, `showCustomInput`) from `useBookings` into `BookingsTable.tsx` local state — these have no business in a data-fetching hook

**Acceptance criteria:**
- Filtering by status returns results from all pages, not just the currently loaded page
- Filter change triggers a fresh TanStack Query fetch with the new `queryKey`
- All new composite indexes declared in `firestore.indexes.json`
- `useBookings` returns ≤ 15 values (down from 23)
- BookingsTable manages its own UI toggle state locally

**Complexity:** M
**Dependencies:** P2-E6 complete (pagination already in place)

---

### P3-E9: Remove `window.__MOCK_SUBMIT__` from Production Code
**Source:** [Tech] · **Priority:** P1 · **Complexity:** S

**Objective:** Remove test infrastructure that leaked into the production data layer.

**Background:** `firestore.ts` contains `if (typeof window !== 'undefined' && window.__MOCK_SUBMIT__) { return window.__MOCK_SUBMIT__(...) }` — a check that runs on every real booking submission in production. This is a dead branch in production, but it pollutes the production data layer with test concerns, confuses agents reading the file, and creates a security surface (any script setting `window.__MOCK_SUBMIT__` could intercept booking submissions). The correct pattern — already used in `fsm.spec.ts` — is Playwright `page.route()` to intercept the Firestore REST call at the network layer.

**Key tasks:**
- Remove `window.__MOCK_SUBMIT__` guard from `firestore.ts::submitBooking`
- Update `checkout.spec.ts`: replace `window.__MOCK_SUBMIT__` with `page.route()` intercepting the Firestore write endpoint, consistent with `fsm.spec.ts` network interception pattern
- Add `window.__MOCK_CREATE_PAYMENT_INTENT__` to the same cleanup when P3-E1 ships (Stripe mock also lives in production code)
- Add a lint rule or comment guard documenting that `window.*` mocks are forbidden in `lib/firebase/`

**Acceptance criteria:**
- `firestore.ts` contains no `window.__MOCK_*` checks
- `checkout.spec.ts` tests pass using `page.route()` network interception
- No `window` test escape hatches in any production `lib/` file

**Complexity:** S
**Dependencies:** P3-E1 (Stripe) — do both together so Stripe mock is also cleaned up in the same pass

---

## Band C — Scale & Grow
*(Original Phase 3 epics from v2.0, now with enriched task lists from the June 17 analysis)*

---

### P3-E10: Loyalty & Referral Reward Loop *(was P3-E1 in v2.0)*
**Source:** [Codebase] · **Priority:** P2 · **Complexity:** L

**Objective:** Convert the existing referral code infrastructure into a functional two-sided reward system. Codes are already generated and stored in `referrals` — the reward mechanism and customer visibility do not exist.

**Personas served:** P1 Diane (active referrer), P2 Travis (price-sensitive, responds to discounts)

**Key tasks:**
- Define reward amounts (recommend $25/$25); store as configurable `referralConfig` Firestore document
- Cloud Function trigger: when referred booking transitions `status → confirmed` and `referredBy` is set, credit referrer's account with `$25` in a `credits` sub-collection
- Credit applied as Stripe coupon on referrer's next booking
- Referral code and credit balance visible in customer portal
- Admin credit management view: credits issued/redeemed per customer; admin can adjust manually
- Add `Firebase App Check` (see P3-E20) before this ships — paid referral credits will attract fraud

**Acceptance criteria:**
- Referred booking triggers referrer credit within 60 seconds of `status → confirmed`
- Credit balance visible in customer portal
- Credit correctly reduces next booking's Stripe `PaymentIntent` amount
- Admin can manually adjust or revoke credits

**Complexity:** L
**Dependencies:** P2-E1 complete (customer portal), P3-E1 complete (Stripe)

---

### P3-E11: CMS-Backed Blog *(was P3-E2 in v2.0)*
**Source:** [Codebase] · **Priority:** P3 · **Complexity:** L

**Objective:** Replace static `blogData.ts` with Firestore-backed blog posts editable by admin without developer involvement.

**Personas served:** Business (SEO), P2 Travis (pricing content), P5 Sophie (French content)

**Key tasks:**
- Build "Blog" admin tab: create, edit, publish/draft, delete with EN + FR content fields
- Post schema: `slug`, `title_en`, `title_fr`, `content_en`, `content_fr`, `excerpt_en`, `excerpt_fr`, `publishedAt`, `status: 'draft' | 'published'`, `author`, `coverImageUrl`
- Migrate existing `blogData.ts` articles to Firestore `blog_posts` as seed data
- Update `/blog` and `/blog/:slug` to read from Firestore
- Cloud Function generates RSS feed at `/rss.xml` on publish
- Cover image upload via Firebase Storage
- Decision D3 (Firestore-backed vs. headless CMS) must be ADR'd before this starts

**Acceptance criteria:**
- Lauren publishes a bilingual blog post without developer involvement
- Post appears on `/blog` and `/blog/:slug` within 30 seconds of publishing
- Google Search Console indexes new posts within 7 days
- RSS feed validates at W3C Feed Validator

**Complexity:** L
**Dependencies:** None

---

### P3-E12: Bilingual SEO — Path-Based Language Routing *(was P3-E3 in v2.0)*
**Source:** [Codebase] · **Priority:** P2 · **Complexity:** XL

**Objective:** Migrate from `?lang=fr` query params to `/fr/` path-based routing so French-language pages can be independently indexed by Google.

**Background:** French-speaking searchers in Cornwall, Akwesasne, and Snye QC cannot find Fresh Nest via French organic search. This is a breaking URL change affecting customer portal links, confirmation email links, GBP links, and all internal navigation. Decision D4 must be ADR'd before work begins.

**Personas served:** P1 Diane (FR discoverability), P5 Sophie (Snye QC FR search)

**Key tasks:**
- ADR: path prefix (`/fr/*`) vs. subdomain — recommend path prefix
- Duplicate all routes under `/fr/` prefix in `App.tsx`
- Update `SEO` component: canonical and hreflang use full path URLs
- Redirect `?lang=fr` → `/fr/` for backward compatibility
- Update all internal links when `i18n.language === 'fr'`
- Submit updated XML sitemap (EN + FR) to Google Search Console
- Update Firebase Hosting rewrites for `/fr/*` paths
- Update customer portal, email confirmation links, and GBP links

**Acceptance criteria:**
- `/fr/` pages rank for French-language cleaning queries in target geography within 90 days
- Lighthouse SEO ≥ 95 on both `/` (EN) and `/fr/` (FR) homepage
- No duplicate content warnings in Google Search Console
- All Playwright E2E tests updated and passing with new route structure

**Complexity:** XL
**Dependencies:** Phase 1 + 2 fully complete; ADR approved; D4 locked; ship after P3-E11 (blog routes also need FR paths)

---

### P3-E13: Google Business Profile Booking Integration *(was P3-E4 in v2.0)*
**Source:** [Codebase] · **Priority:** P3 · **Complexity:** M

**Objective:** Enable "Book on Google" from the Fresh Nest Co. Google Business Profile.

**Key tasks:**
- Verify Fresh Nest Co. business on Google Business Profile
- Configure GBP booking link: `https://freshnest.ca/booking?utm_source=google`
- Confirm `detectLeadSource` maps `utm_source=google` to `leadSource: 'google'`
- Verify GBP bookings appear under "Google" in admin Analytics
- Explore Reserve with Google API for deeper integration

**Acceptance criteria:**
- "Book" button visible on Google Maps listing
- GBP bookings show `leadSource: 'google'` in admin analytics
- UTM parameters pass through to Firestore booking record

**Complexity:** M
**Dependencies:** P3-E1 complete (Stripe — Google requires payment-enabled services)

---

### P3-E14: Admin Calendar View *(was P3-E5 in v2.0)*
**Source:** [Both] · **Priority:** P3 · **Complexity:** L

**Objective:** Give admin a visual week/month calendar view of bookings and job assignments.

**Key tasks:**
- Add "Calendar" toggle to admin Bookings panel
- Build lightweight custom week-grid component (not `react-big-calendar` — design token control required)
- Events: bookings on `preferredDate`; jobs on `scheduledDate` with cleaner name if assigned
- Click event opens existing `BookingDetailPanel` — no new detail UI
- Month view for overview; week view for scheduling
- Draw from paginated bookings (P2-E6 complete) — do not re-load all bookings
- Share the same data layer as the DispatchBoard (P2-E9 complete)
- Add `@tanstack/virtual` row virtualisation if filtered list exceeds 100 rows

**Acceptance criteria:**
- Admin views all bookings for a given week without scrolling a table
- Clicking a booking opens the detail panel
- Calendar renders correctly at 1280px desktop width
- No additional Firestore reads beyond what pagination already provides

**Complexity:** L
**Dependencies:** P2-E6 complete, P2-E9 complete

---

### P3-E15: Data Retention & PIPEDA Right-to-Erasure *(was P3-E6 in v2.0)*
**Source:** [Both] · **Priority:** P2 · **Complexity:** M

**Objective:** Implement the 7-year retention schedule and PII deletion mechanism committed to in the Privacy Policy.

**Key tasks:**
- Scheduled Cloud Function (annually, January 1): archive bookings older than 7 years to Cloud Storage as JSON export; delete from Firestore after confirmed export
- Admin "Customer Data" action: "Export data" — complete JSON export for any email within 60 seconds
- Admin "Delete customer data" action: anonymise PII fields (`firstName`, `lastName`, `email`, `phone`, `address`) to `[deleted]`; preserve booking record for audit; write deletion event to `auditLog`
- Customer self-service deletion request via customer portal; admin must confirm
- Update Privacy Policy text with specific 7-year retention and deletion workflow
- Add `CASL unsubscribe mechanism` to all marketing emails (documented in P1-E2; now implemented)

**Acceptance criteria:**
- Data export completes for any email within 60 seconds
- Deletion anonymises all PII without removing booking records
- Deletion event logged in `auditLog` with `adminEmail`, `timestamp`, and `reason`
- Annual archival function runs successfully in staging
- All marketing emails contain a working unsubscribe link

**Complexity:** M
**Dependencies:** P1-E2 complete (Privacy Policy), P2-E1 complete (customer portal)

---

### P3-E16: Dynamic Pricing Engine & Conversion Optimisation *(was P3-E7 in v2.0)*
**Source:** [CTO] · **Priority:** P3 · **Complexity:** L

**Objective:** Enable admin-managed promotional pricing, first-booking discounts, and booking funnel analytics.

**Background:** `quotePricing.ts` is entirely static. Competitors support seasonal pricing, new-customer discounts, and promo codes. The booking funnel has no step-level drop-off tracking. Before this epic ships, the pricing engine should be moved to a Web Worker (see P3-E22) so async pricing rule evaluation doesn't block the main thread.

**Key tasks:**
- Admin-managed pricing rules in `pricingRules` Firestore collection: time-bounded discount rules (e.g., "20% off Deep Cleans in January")
- First-booking discount: configurable percentage off for new customer emails, detected server-side in `createPaymentIntent`
- Promo code expansion: `BookingStep4` accepts admin-created promo codes from `pricingRules`; display discount in Step 4 review
- Funnel analytics: instrument each booking step with GA4 events (`booking_step_N_completed`, `booking_step_N_abandoned`); surface as funnel chart in admin Analytics
- Firebase Remote Config A/B test infrastructure: variant flags without code deploys
- Extend Zod booking schema: use `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` for `preferredDate` (currently `z.string().min(1)` — format not validated client-side)

**Acceptance criteria:**
- Admin creates a time-bounded discount rule and it applies correctly in the quote calculator
- First-booking discount applies for new customer emails
- Promo code reduces Stripe `PaymentIntent` amount and shows in Step 4 review
- Funnel drop-off rates by step visible in admin Analytics
- Remote Config variant flag toggles without a code deploy

**Complexity:** L
**Dependencies:** P3-E1 complete (Stripe), P2-E6 complete (analytics infrastructure), P3-E22 (Web Worker — should precede this epic)

---

### P3-E17: Multi-Tenancy Schema Flag & ADR *(was P3-E8 in v2.0)*
**Source:** [CTO] · **Priority:** P3 · **Complexity:** S

**Objective:** Add `locationId` field awareness to booking, job, and staff schema now, preserving the franchise/multi-location option without a costly retrofit later.

**Key tasks:**
- Add optional `locationId: string` to `bookings`, `jobs`, and `staff` schema; default `'cornwall-on'`
- Add `locationId` to `docs/firestore-schema.md` with multi-tenancy intent note
- Write `docs/decisions/ADR-004-multi-tenancy-schema-flag.md`
- Note in `isAdmin()` Firestore rule that future scoping will add `locationId` check
- No functional change — schema annotation and forward-planning only

**Acceptance criteria:**
- `locationId` field present in all new documents after this epic
- `docs/firestore-schema.md` updated
- ADR approved and committed

**Complexity:** S
**Dependencies:** None

---

## Band D — Architecture & Technology Upgrades
*(Structural refactors and technology improvements that accelerate all future development)*

---

### P3-E18: Shared Types Package (`packages/shared/src/types/`)
**Source:** [Tech] · **Priority:** P1 · **Complexity:** M

**Objective:** Eliminate type drift between `apps/customer` and `apps/fsm` by promoting shared types to `packages/shared`.

**Background:** Both apps define `StaffLanguage`, `TransportMode`, `StaffRole`, `StaffStatus`, `BlockedWindow`, `TermsAcceptance`, `Staff`, `ChecklistTask`, `ChecklistTemplate`, `Job`, `JobStatus`, `PayRate`, `AuditEntry`. Subtle divergences already exist: `Job.id` is required in FSM but optional in customer; `JobPhoto` has different geolocation field names in each app; `ChecklistTask` uses `labelKey` (i18n key) in FSM but `labelEn`/`labelFr` (explicit bilingual) in customer. The `jobToMockBooking` adapter in `DispatchBoard.tsx` exists purely to bridge this type mismatch. This is an active bug surface.

**Key tasks:**
- Create `packages/shared/src/types/` directory
- Extract to `booking.ts`: `Booking`, `BookingStatus`, `Frequency`, `ServiceType`, `Language`, `LeadSource`
- Extract to `staff.ts`: `Staff`, `StaffRole`, `StaffStatus`, `StaffLanguage`, `TransportMode`, `BlockedWindow`, `TermsAcceptance`
- Extract to `job.ts`: `Job`, `JobStatus`, `JobPhoto`, `ChecklistCompletion`, `PayRateSnapshot`
- Extract to `common.ts`: `AuditEntry`, `PayRate`, `ChecklistTask`, `ChecklistTemplate`
- Export all from `packages/shared/src/index.ts`
- Resolve `ChecklistTask` divergence: standardise on `labelEn`/`labelFr` (explicit bilingual, consistent with how all other EN/FR strings are handled in the codebase)
- Resolve `JobPhoto` divergence: standardise on `lat?/lng?` optional fields
- Resolve `Job.id` divergence: `id?: string` — optional at creation, always present after Firestore write
- Both apps import from `@freshnest/shared` — app-specific extensions stay local
- Remove `jobToMockBooking` adapter from `DispatchBoard.tsx` once types align

**Acceptance criteria:**
- Zero `Staff`, `Job`, `Booking`, or `AuditEntry` type definitions in either app's `types/index.ts`
- `TypeScript_Strict_Enforcer` confirms both apps compile cleanly after migration
- `jobToMockBooking` deleted from `DispatchBoard.tsx`
- `scheduling.ts` `checkCleanerSchedulingConflicts` accepts narrower `SchedulingContext` interface instead of full `Booking`

**Complexity:** M
**Dependencies:** None — but do before any new features add more cross-app type usage

---

### P3-E19: Cloud Functions Domain Split
**Source:** [Tech] · **Priority:** P2 · **Complexity:** M

**Objective:** Split `functions/src/index.ts` (currently 1,125+ lines, 14 exported functions) into domain-scoped modules. Each module is independently reviewable, testable, and deployable.

**Key tasks:**
- Create `functions/src/triggers/booking.ts`: `onBookingCreated`, `onBookingStatusConfirmed`, `onBookingCancelled`
- Create `functions/src/triggers/job.ts`: `onJobUpdatedTrigger`, `onJobStatusCompleted`
- Create `functions/src/triggers/staff.ts`: `onStaffUpdatedTrigger`, `onUserCreated`
- Create `functions/src/scheduled/reminders.ts`: `onDailyReminderCheck`
- Create `functions/src/scheduled/renewals.ts`: `onDailyRecurringRenewal`
- Create `functions/src/scheduled/reviews.ts`: `onReviewEmailScheduler`
- Create `functions/src/scheduled/earnings.ts`: `rollOverAllStaffEarnings` (monthly)
- Create `functions/src/callable/auth.ts`: `setUserRole`
- Create `functions/src/callable/analytics.ts`: `getAnalyticsKPIs`
- `functions/src/index.ts` becomes pure re-exports only — no business logic
- Move `calculateEstimatedPriceFallback` out of `index.ts` into `callable/analytics.ts` or a shared util

**Acceptance criteria:**
- `functions/src/index.ts` contains only `export * from './...'` statements
- Each domain file is under 200 lines
- All existing function exports unchanged (Firebase deploy targets unchanged)
- `TypeScript_Strict_Enforcer` confirms functions compile cleanly

**Complexity:** M
**Dependencies:** P3-E7 (critical bug fixes — clean up the functions before splitting them)

---

### P3-E20: Firebase App Check
**Source:** [Tech] · **Priority:** P1 · **Complexity:** S

**Objective:** Add bot and fraud protection to the booking form and Firestore before Stripe goes live.

**Background:** Once real payment is collected, the booking form becomes a fraud target. App Check verifies that requests to Firestore and Cloud Functions originate from the actual web app — not bots, scrapers, or scripts — without changing any business logic.

**Key tasks:**
- Add `VITE_RECAPTCHA_SITE_KEY` to GitHub Secrets and `ImportMetaEnv` declaration
- In `apps/customer/src/lib/firebase/firebase.ts`, add: `import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'` and call `initializeAppCheck(app, { provider: new ReCaptchaV3Provider(...), isTokenAutoRefreshEnabled: true })`
- Enable App Check enforcement in Firebase console on Firestore and Cloud Functions
- Configure debug token for local development (Firebase provides this)
- Add App Check to `apps/fsm` for the FSM portal

**Acceptance criteria:**
- App Check token required on all Firestore and Cloud Function requests from production
- Booking form rejects requests that lack a valid App Check token
- Local development works with the debug token
- No regression in E2E tests (Playwright runs with debug token)

**Complexity:** S
**Dependencies:** Implement before P3-E1 (Stripe) — fraud protection must precede payment collection

---

### P3-E21: Firestore `withConverter()` Adoption
**Source:** [Tech] · **Priority:** P2 · **Complexity:** M

**Objective:** Replace manual Timestamp casting patterns throughout the codebase with typed Firestore converters.

**Background:** Every hook and subscription manually casts Timestamp fields:
```typescript
createdAt: data['createdAt'] instanceof Timestamp ? data['createdAt'].toDate() : new Date()
```
This pattern appears 20+ times across `firestore.ts`, `useBookings.ts`, `useStaff.ts`, and `useOperationsDashboard.ts`. Firestore's `withConverter()` API handles this automatically and adds type safety at the collection reference level.

**Key tasks:**
- Create `lib/firebase/converters.ts` with converters for `bookings`, `jobs`, `staff`, `reviews`, `payRates`, `checklistTemplates`
- Each converter implements `toFirestore()` and `fromFirestore()` with explicit Timestamp-to-Date conversion
- Replace all manual Timestamp casts in hooks and `firestore.ts` subscriptions with `collection(db, 'X').withConverter(xConverter)`
- All collection references in `firestore.ts` use typed converters
- After migration, delete all `instanceof Timestamp ? .toDate() : new Date()` patterns

**Acceptance criteria:**
- Zero manual Timestamp casts in any `lib/firebase/` or `hooks/` file
- All collection references typed via `withConverter()`
- `TypeScript_Strict_Enforcer` confirms no `as Booking`, `as Job`, etc. escape casts remain
- All existing tests pass

**Complexity:** M
**Dependencies:** P3-E18 (shared types — converters should reference the canonical shared types)

---

### P3-E22: Pricing Web Worker
**Source:** [Tech] · **Priority:** P2 · **Complexity:** M

**Objective:** Move the pricing calculation engine to a Web Worker before dynamic pricing (P3-E16) adds async Firestore rule evaluation that would block the main thread.

**Background:** `quotePricing.ts` is currently synchronous and fast. But P3-E16 (Dynamic Pricing) will require async lookups from the `pricingRules` Firestore collection during quote calculation. Running this on the main thread while the user interacts with the booking form will cause UI jank. Vite natively supports `new Worker(new URL(...))` with zero configuration — this is the right time to structure the pricing engine correctly before complexity is added.

**Key tasks:**
- Create `lib/workers/pricing.worker.ts`: receives `{ size, service, frequency, rules }`, runs `calculateQuote()`, posts result
- Refactor `QuoteCalculator.tsx` to initialise the worker with `new Worker(new URL('../workers/pricing.worker.ts', import.meta.url), { type: 'module' })`
- Create `useQuoteCalculator` hook that manages worker lifecycle, sends messages, and receives results
- The existing `calculateQuote()` function in `quotePricing.ts` remains as-is — worker calls it synchronously inside the worker context
- Worker is terminated on component unmount

**Acceptance criteria:**
- Quote calculator UI remains responsive while calculation runs
- Worker correctly handles all service/property/frequency combinations
- `quotePricing.test.ts` tests still pass (the underlying function is unchanged)
- Lighthouse Performance score is not degraded by worker initialisation

**Complexity:** M
**Dependencies:** Implement before P3-E16 (Dynamic Pricing)

---

### P3-E23: React 19 `useSuspenseQuery` & Suspense Boundaries
**Source:** [Tech] · **Priority:** P3 · **Complexity:** M

**Objective:** Replace `isLoading` branching patterns in portal and admin pages with `useSuspenseQuery` + Suspense boundaries, using React 19 and TanStack Query v5 natively.

**Background:** React 19 and TanStack Query v5 (both already installed) support `useSuspenseQuery` — a hook that suspends the component until data is ready, eliminating `if (isLoading) return <Spinner />` branching. The Suspense boundary added in P3-E2 (code splitting) is the enabling infrastructure.

**Key tasks:**
- Migrate customer portal pages (`CustomerBookingsPage`, `CustomerUpcomingPage`, `CustomerProfilePage`) from `useQuery` to `useSuspenseQuery`
- Migrate admin analytics from `isLoading` branch to `useSuspenseQuery` + `<Suspense fallback={<AnalyticsSkeleton />}>`
- Create skeleton loading components for admin table and analytics (brand-consistent)
- Use TanStack Query v5 `queryOptions()` factory to centralise query definitions:
  ```typescript
  // lib/queries/bookings.ts
  export const bookingsQueryOptions = (start: string, end: string) =>
    queryOptions({ queryKey: ['bookings', start, end], queryFn: ... })
  ```
- Replace all inline `queryKey`/`queryFn` definitions in hooks with imported `queryOptions`

**Acceptance criteria:**
- No `if (isLoading) return <Spinner />` patterns in portal or admin pages
- Suspense boundaries catch loading states with appropriate skeleton UI
- `queryOptions()` factory pattern adopted for all admin and portal queries
- `TypeScript_Strict_Enforcer` confirms no type regressions

**Complexity:** M
**Dependencies:** P3-E2 complete (Suspense boundary infrastructure from code splitting)

---

### P3-E24: VitePress Documentation Site
**Source:** [Tech] · **Priority:** P3 · **Complexity:** M

**Objective:** Deploy a navigable documentation site at `docs.freshnest.co` for the admin guide, user guide, and design system — replacing the current flat markdown files in `user-guide/` that are only accessible via GitHub.

**Background:** With the dispatch board, customer portal, RBAC, and dynamic pricing live, the admin guide and user guides have outgrown flat markdown. Lauren needs operational documentation she can navigate on her phone without pulling up GitHub. The monorepo already has the markdown governance infrastructure — VitePress publishes it as a searchable, mobile-friendly site.

**Key tasks:**
- Create `apps/docs/` workspace in the monorepo
- Install VitePress in `apps/docs/`
- Configure sidebar navigation: Admin Guide · Booking Guide · Design System · FSM Staff Guide · API/Schema Reference
- Migrate `user-guide/admin-guide.md` and `user-guide/booking-guide.md` into VitePress structure
- Write FSM Staff Guide (how to use the job app, check in, upload photos, view shifts)
- Add design system page: colour tokens, typography, component patterns (pulls from `tailwind.config.js`)
- Add fourth Firebase Hosting target `freshnest-docs` and deploy via GitHub Actions
- Decision D9 (scope: admin-only vs. public help centre) must be made before building

**Acceptance criteria:**
- VitePress site live at `docs.freshnest.co` (or subpath)
- Full-text search works on all docs pages
- Admin guide and booking guide accessible on mobile without GitHub login
- FSM staff guide covers: login, job list, check-in, checklist, photo upload, profile

**Complexity:** M
**Dependencies:** P3-E5 complete (CI/CD hardening — docs deploy uses the same pipeline)

---

### P3-E25: Storybook for `packages/ui` Primitives
**Source:** [Tech] · **Priority:** P3 · **Complexity:** M

**Objective:** Extract shared UI primitives into `packages/ui` and document them in Storybook, enabling visual Brand_Auditor checks and preventing token drift across both apps.

**Background:** The same `Button`, `Modal`, and form-field patterns are built inline across 40+ components. P3-E3 (Admin Booking Modal) will be the fourth time an admin modal is constructed from scratch. After that point, extraction to shared primitives is clearly warranted. Storybook then has something real to catalogue — not theoretical components.

**Key tasks:**
- Create `packages/ui/` workspace after P3-E3 (AdminBookingModal) ships
- Extract primitives: `Button`, `Modal`, `FormField` (label + input + error), `Badge`, `StatusPill`, `Spinner`, `SkeletonRow`
- Each primitive accepts design token class props (not hardcoded colours), `min-h-[48px]` on all interactive elements, bilingual `aria-label` support
- Install Storybook v8 at the monorepo root with the Vite builder
- Write stories for each primitive: default, variants, error states, loading states
- Both `apps/customer` and `apps/fsm` import from `@freshnest/ui`
- `DispatchBoard` extracted sub-components (`DraggableJobCard`, `DroppableStaffColumn`, `DispatchWeekNav`) moved to `apps/customer/src/components/admin/dispatch/` directory

**Acceptance criteria:**
- Storybook runs at `http://localhost:6006` with all primitives documented
- Brand_Auditor can verify all token usage visually in Storybook without reading source
- Both apps compile with zero regressions after primitive migration
- `DispatchBoard.tsx` is under 300 lines after sub-component extraction

**Complexity:** M
**Dependencies:** P3-E3 complete (AdminBookingModal — natural extraction point), P3-E18 complete (shared types — primitives reference shared types)

---

## Master Epic Summary Table

| Phase | ID | Epic Name | Source | Complexity | Priority | Band | Key Dependency |
|---|---|---|---|---|---|---|---|
| 3 | P3-E1 | Stripe Payment Integration | Both | XL | P0 | A | P3-E7 (simultaneous) |
| 3 | P3-E2 | Route Code Splitting | Codebase | M | P1 | A | None |
| 3 | P3-E3 | Admin Booking Creation | Codebase | L | P1 | A | None |
| 3 | P3-E4 | Observability & Error Tracking | CTO | M | P1 | A | P1-E1 done |
| 3 | P3-E5 | CI/CD Pipeline Hardening | CTO | S | P1 | A | P1-E1 done |
| 3 | P3-E6 | Accessibility Pass (WCAG 2.1 AA) | Codebase | M | P2 | A | P1-E4 done |
| 3 | P3-E7 | Cloud Functions Bug Fixes | Tech | S | P0 | B | None — fix immediately |
| 3 | P3-E8 | `useBookings` Server-Side Filtering | Tech | M | P1 | B | P2-E6 done |
| 3 | P3-E9 | Remove `window.__MOCK_*` from Production | Tech | S | P1 | B | P3-E1 (Stripe) |
| 3 | P3-E10 | Loyalty & Referral Reward Loop | Codebase | L | P2 | C | P2-E1, P3-E1 done |
| 3 | P3-E11 | CMS-Backed Blog | Codebase | L | P3 | C | None |
| 3 | P3-E12 | Bilingual SEO — Path-Based Routing | Codebase | XL | P2 | C | Phase 1+2 done; ADR |
| 3 | P3-E13 | Google Business Profile Integration | Codebase | M | P3 | C | P3-E1 done |
| 3 | P3-E14 | Admin Calendar View | Both | L | P3 | C | P2-E6, P2-E9 done |
| 3 | P3-E15 | Data Retention & PIPEDA Erasure | Both | M | P2 | C | P1-E2, P2-E1 done |
| 3 | P3-E16 | Dynamic Pricing & Conversion Optimisation | CTO | L | P3 | C | P3-E1, P2-E6, P3-E22 |
| 3 | P3-E17 | Multi-Tenancy Schema Flag & ADR | CTO | S | P3 | C | None |
| 3 | P3-E18 | Shared Types Package | Tech | M | P1 | D | None — do first |
| 3 | P3-E19 | Cloud Functions Domain Split | Tech | M | P2 | D | P3-E7 done |
| 3 | P3-E20 | Firebase App Check | Tech | S | P1 | D | Before P3-E1 |
| 3 | P3-E21 | Firestore `withConverter()` Adoption | Tech | M | P2 | D | P3-E18 done |
| 3 | P3-E22 | Pricing Web Worker | Tech | M | P2 | D | Before P3-E16 |
| 3 | P3-E23 | React 19 `useSuspenseQuery` & Suspense | Tech | M | P3 | D | P3-E2 done |
| 3 | P3-E24 | VitePress Documentation Site | Tech | M | P3 | D | P3-E5 done |
| 3 | P3-E25 | Storybook for `packages/ui` Primitives | Tech | M | P3 | D | P3-E3, P3-E18 done |

**Totals by complexity:** S×5 · M×14 · L×5 · XL×2
**Totals by priority:** P0×2 · P1×9 · P2×8 · P3×7
**Totals by source:** Codebase×8 · CTO×5 · Both×3 · Tech×9
**Totals by band:** A×6 · B×3 · C×8 · D×8

---

## Recommended Sprint Sequencing

### Sprint 1 (Week 1–2): Immediate fixes + foundations
- P3-E7 Cloud Functions Bug Fixes (P0 — `require()` crash is live in production)
- P3-E18 Shared Types Package (do before any new features add more type usage)
- P3-E20 Firebase App Check (must precede Stripe)
- P3-E5 CI/CD Hardening (S-complexity — fast win)

### Sprint 2 (Week 2–5): Revenue gate
- P3-E1 Stripe Payment Integration (XL — highest value epic in the plan)
- P3-E9 Remove `window.__MOCK_*` (S — do in the same pass as Stripe)
- P3-E4 Observability (M — before real payments ship)

### Sprint 3 (Week 5–7): Admin operations
- P3-E3 Admin Booking Creation (L)
- P3-E8 `useBookings` Server-Side Filtering (M)
- P3-E2 Route Code Splitting (M)

### Sprint 4 (Week 7–9): Quality & compliance
- P3-E6 Accessibility Pass (M)
- P3-E15 Data Retention & PIPEDA Erasure (M)
- P3-E17 Multi-Tenancy Schema Flag (S)

### Sprint 5 (Week 9–12): Architecture hardening
- P3-E19 Cloud Functions Domain Split (M)
- P3-E21 Firestore `withConverter()` (M)
- P3-E22 Pricing Web Worker (M)

### Sprint 6 (Week 12–16): Growth — customer-facing
- P3-E10 Referral Reward Loop (L)
- P3-E12 Bilingual SEO Routing (XL — longest epic in Phase 3)
- P3-E13 GBP Integration (M)

### Sprint 7 (Week 16–20): Growth — content & admin
- P3-E11 CMS-Backed Blog (L)
- P3-E14 Admin Calendar View (L)
- P3-E16 Dynamic Pricing (L)

### Sprint 8 (Week 20–24): Developer experience
- P3-E23 React 19 `useSuspenseQuery` (M)
- P3-E24 VitePress Documentation Site (M)
- P3-E25 Storybook for `packages/ui` (M)

---

## Dependency Map

```
Immediate (no dependencies):
P3-E7  ──► P3-E19 (split functions after bugs fixed)
P3-E18 ──► P3-E21 (converters use shared types)
       └──► P3-E25 (Storybook uses shared types)
P3-E20 ──► P3-E1  (App Check before Stripe)

P3-E1  ──► P3-E9  (remove mocks in same pass)
       ├──► P3-E10 (referral rewards need Stripe)
       ├──► P3-E13 (GBP needs payment-enabled)
       └──► P3-E16 (dynamic pricing needs Stripe)

P3-E2  ──► P3-E23 (Suspense boundaries enable useSuspenseQuery)

P3-E3  ──► P3-E25 (Storybook after AdminBookingModal = extraction point)

P3-E5  ──► P3-E24 (VitePress deploys via same CI pipeline)

P3-E11 ──► P3-E12 (blog routes need FR paths too)

P3-E22 ──► P3-E16 (pricing worker before dynamic pricing logic)

Phase 1+2 complete + ADR ──► P3-E12 (bilingual SEO)
P2-E6 complete ──► P3-E14 (calendar draws from paginated bookings)
P2-E9 complete ──► P3-E14 (calendar shares dispatch data layer)
```

---

## Backlog (Out of Phase 3 Scope)

| Item | Reason Deferred |
|---|---|
| AI scheduling / predictive staffing | 24-month horizon per CTO audit |
| Franchise / multi-tenant enforcement | Schema flag in P3-E17; full enforcement is Phase 4 |
| Native push notifications for FSM staff | PWA push (P2-E7) covers core use case; native app is a separate decision |
| QuickBooks / accounting integration | Requires invoice workflow; Phase 4 |
| Slot-based booking with availability calendar | Requires dispatch board stabilisation; Phase 4 |
| `@tanstack/virtual` row virtualisation | Add when BookingsTable exceeds 200 DOM rows |
| MSW (Mock Service Worker) test architecture | Add when Playwright suite exceeds ~15 specs; currently 6 |
| Turborepo build caching | Add when CI build time consistently exceeds 8 minutes |
| Biome (ESLint + Prettier replacement) | Phase 4 DX improvement; TanStack Query plugin compatibility check needed first |
| Customer help centre (VitePress Phase 2) | Expand from admin-only docs after Phase 3 VitePress ships |
| AGENTS.md consolidation | `CLAUDE.md` / `GEMINI.md` identical — low-risk maintenance item; anytime |

