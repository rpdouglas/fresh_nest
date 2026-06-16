# Fresh Nest Co. — Master Project Plan v2.0

**Compiled:** June 16, 2026  
**Sources:** Codebase audit (`codebase_export_fn_20260615`), External CTO audit (`FreshNest_Deep_CTO_Audit_v2`), cross-validation gap analysis  
**Plan version:** 2.0 — unified, 26-epic master plan across 3 phases  
**Platform:** React 19 · Vite · Firebase · Tailwind CSS v3 · TypeScript strict · npm workspaces monorepo

---

## How to Read This Plan

Each epic follows a uniform structure: **Objective → Background → Personas served → Key tasks → Acceptance criteria → Complexity → Priority → Dependencies.**

Complexity is rated S / M / L / XL (roughly: days / 1 week / 2–3 weeks / 1 month+).  
Priority is rated P0 (legal/security blocker) → P1 (revenue or ops blocker) → P2 (competitive gap) → P3 (growth lever).  
Source tags indicate origin: **[Codebase]** = found in ground-up audit · **[CTO]** = added from CTO audit cross-validation · **[Both]** = confirmed by both.

---

## Sequencing Rationale

Four principles govern the sequence:

1. **Safety before everything.** Secrets in git and a missing privacy policy are legal and security risks that cannot wait for roadmap sequencing. They are the first two epics.
2. **Revenue gate next.** Every booking submitted today is an unpaid request. Payment integration is the highest single-value engineering investment in the plan.
3. **Observe before you scale.** Observability and CI/CD hardening are placed in Phase 1 because they are operational infrastructure, not features. Shipping Stripe without error tracking and alerting is a support risk.
4. **Retain before acquire.** Customer lifecycle closure (portal, notifications, reviews) precedes growth features (referral rewards, blog, GBP). You cannot acquire efficiently without retention.

---

## Prerequisites — Decisions Required Before Work Begins

All decisions below must be recorded as ADRs in `docs/decisions/` before the blocking epic starts.

| # | Decision | Blocks | Recommendation |
|---|---|---|---|
| D1 | Payment processor: Stripe vs. Square | P1-E3 | **Stripe** — superior webhook reliability, Canadian support, best-in-class docs |
| D2 | Customer auth: magic-link vs. email/password | P2-E1 | **Magic-link** — lower friction for occasional users; Google Sign-In as secondary |
| D3 | Blog CMS: Firestore-backed vs. headless | P3-E2 | **Firestore-backed** — no new services; bilingual support natural; admin panel already exists |
| D4 | Bilingual routing: `/fr/` path prefix vs. subdomain | P3-E3 | **Path prefix** — simpler hosting; decide before customer portal ships (portal links, email links, GBP all affected) |
| D5 | HST/tax display: estimate, booking, or invoice only | P1-E3 | **Show as estimated line item at booking confirmation** — 13% ON; QC rate (5% GST + 9.975% QST) TBD |
| D6 | RBAC role taxonomy | P2-E8 | **Four roles**: `admin` · `supervisor` · `staff` · `customer` — document in ADR before Custom Claims migration |
| D7 | Observability vendor: Sentry vs. alternatives | P1-E7 | **Sentry** — generous free tier, React + Cloud Functions SDKs, source map integration |

---

## Phase 1 — Stabilize & Secure

**Goal:** Close all P0 and P1 security, compliance, technical debt, and revenue gaps. At the end of Phase 1 the platform is commercially safe, legally compliant, payment-enabled, observable, and operationally hardened.

**Estimated duration:** 6–8 weeks  
**Epic count:** 8  
**New in v2.0:** P1-E7 (Observability), P1-E8 (CI/CD Hardening)

---

### P1-E1: Secrets & Security Remediation
**Source:** [Codebase] · **Priority:** P0 · **Complexity:** S

**Objective:** Remove `.env.production` from git history and establish proper secrets governance across the entire repository.

**Background:** `.env.production` is committed to the repository containing live Firebase configuration and four admin email addresses. While Firebase API keys are technically client-safe by design, the admin email list is a PIPEDA exposure if the repository is ever made public. The file is explicitly in `.gitignore` — it should never have been committed. This must be resolved before any other work begins, as secrets management underpins both P1-E3 (Stripe keys) and P1-E7 (Sentry DSN).

**Key tasks:**
- Run BFG Repo Cleaner or `git filter-repo` to excise `.env.production` from all commits in git history
- Rotate the Firebase API key as a precaution post-exposure
- Verify all `VITE_*` and Function secret vars live exclusively in GitHub Secrets — zero tracked files
- Confirm `.env.production` and `.env.local` are enforced in `.gitignore`
- Audit `VITE_ADMIN_EMAILS` — confirm display-only; gate is Firestore `/admins` collection (confirmed correct)
- Document secrets management convention: `docs/decisions/ADR-001-secrets-management.md`
- Fix `referrals` collection Firestore rule: change `allow read: if true` to `allow get: if true` — prevents unauthenticated full collection enumeration while preserving promo code single-document lookups

**Acceptance criteria:**
- `git log --all --full-history -- .env.production` returns empty
- All CI/CD pipeline builds pass using GitHub Secrets only
- No credentials, secrets, or PII in any tracked file
- Firestore rules deployed with `get` vs `list` fix on `referrals`

**Dependencies:** None — start immediately

---

### P1-E2: Privacy Policy & PIPEDA Compliance
**Source:** [Codebase] · **Priority:** P0 · **Complexity:** S

**Objective:** Replace the `/privacy` placeholder with a live, bilingual, PIPEDA-compliant privacy policy page.

**Background:** Under PIPEDA (federal) the app must publish an accessible privacy policy before collecting Canadian residents' PII (name, email, phone, address, booking history). The `/privacy` route currently renders `PlaceholderPage`. This is a legal gap, not a backlog item.

**Personas served:** All users (legal requirement); P1 Diane and P5 Sophie require French version.

**Key tasks:**
- Draft Privacy Policy covering: data collected (name, email, phone, address, booking history, analytics cookies), purpose (service delivery + marketing only if consent given), retention period (7 years), deletion/export procedure, contact information
- Implement as a full rendered React page at `/privacy` — remove `PlaceholderPage`
- Add complete French translation to `fr.json`
- Ensure `CookieBanner` "Learn more" link resolves to `/privacy`
- Add explicit CASL marketing consent language: opt-in only, withdrawal path described
- Confirm CASL unsubscribe mechanism is documented (implementation deferred to P3-E6)
- Update `docs/COMPLIANCE.md`

**Acceptance criteria:**
- `/privacy` renders full policy in EN and FR (Linguistic_Auditor verified)
- Page uses semantic HTML (`<article>`, `<section>`, `<h2>`) for screen reader compatibility
- Footer and cookie banner links resolve correctly
- Privacy Policy is accessible without authentication

**Dependencies:** None — can run parallel to P1-E1

---

### P1-E3: Payment Integration (Stripe)
**Source:** [Both] · **Priority:** P0 · **Complexity:** XL

**Objective:** Capture a payment hold at booking submission. Every booking submitted today is an unpaid request — the single largest revenue gap in the platform.

**Background:** There is zero payment infrastructure anywhere in the codebase. The booking form collects full service and contact details but writes to Firestore without any financial commitment from the customer. Every competitor (Launch27, Housecall Pro, Handy) collects payment at booking. Decision D1 (Stripe) and D5 (HST display) must be made before this epic starts.

**Personas served:** P2 Travis (fast, mobile, transparent), P6 Gallagher (Airbnb turnover, no friction)

**Key tasks:**
- Install `@stripe/stripe-js` and `@stripe/react-stripe-js` in `apps/customer`; `stripe` in `functions/`
- Add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` as Firebase Function secrets
- Cloud Function `createPaymentIntent`: accepts booking data, returns `PaymentIntent` client secret
- Extend `BookingStep4` with Stripe `PaymentElement` for card capture
- Submission flow: `createPaymentIntent` → confirm payment → write booking to Firestore (only on success)
- Cloud Function trigger on `status → confirmed`: capture the PaymentIntent
- Cloud Function trigger on `status → cancelled`: release the hold
- Add `stripePaymentIntentId`, `stripeChargeId`, `stripeChargeStatus` fields to booking schema
- Update Firestore security rules to allow new optional payment fields on create
- Update `docs/firestore-schema.md` with payment fields
- Stripe webhook handler Cloud Function for async payment confirmation events
- Display estimated HST as a line item on Step 4 review summary (13% ON; QC TBD per D5)
- Update booking Playwright E2E test to include card entry step (use Stripe test card)

**Acceptance criteria:**
- Travis completes a booking with card payment in under 4 minutes (Playwright E2E passes)
- Admin sees `hold / captured / released` payment status in `BookingDetailPanel`
- Cancellation releases hold without charging the customer
- Stripe webhook handles async capture confirmation correctly
- Payment failure surfaces `role="alert"` error in booking form — no silent failures
- Stripe test mode verified in staging; production keys isolated from dev database

**Dependencies:** P1-E1 (clean secrets environment)

---

### P1-E4: Critical Bug & Index Fixes
**Source:** [Codebase] · **Priority:** P1 · **Complexity:** M

**Objective:** Eliminate the N+1 pattern in the recurring renewal Cloud Function, declare all missing Firestore composite indexes, and fix the dynamic `html lang` attribute.

**Background:** `onDailyRecurringRenewal` fires an individual Firestore `existingQuery` per recurring booking to check for duplicates — a classic N+1 that will exceed the 9-minute Cloud Function execution timeout as booking volume grows. Several multi-field queries rely on auto-generated indexes not declared in `firestore.indexes.json`. The `html[lang]` attribute is hardcoded `en` and never updates on language toggle, breaking screen reader language detection.

**Key tasks:**
- Refactor `onDailyRecurringRenewal`: query `bookings` by `preferredDate == nextDateStr` once across all renewal dates, then filter duplicates in-memory
- Add missing composite indexes to `firestore.indexes.json`:
  - `bookings`: `email ASC + preferredDate ASC + status ASC`
  - `bookings`: `status ASC + frequency ASC`
  - `bookings`: `preferredDate ASC + status ASC` (explicit, currently auto-generated)
- Deploy updated indexes: `firebase deploy --only firestore:indexes`
- Fix `html lang` attribute: set `document.documentElement.lang = i18n.language` in i18n initialization and on every language change event
- Resolve `ignoreDeprecations: "6.0"` in `tsconfig.app.json` — address TypeScript 6.0 deprecated API usages at source rather than suppressing
- Resolve `legacy-peer-deps=true` in `.npmrc` — identify conflicting packages and pin/upgrade rather than suppress

**Acceptance criteria:**
- `onDailyRecurringRenewal` reads Firestore in O(dates) queries regardless of booking volume
- All Cloud Function queries have explicit indexes in `firestore.indexes.json`
- `html[lang]` switches to `fr` when user toggles language (verified via Playwright assertion)
- TypeScript compiles without `ignoreDeprecations` flag
- `npm install` runs without `--legacy-peer-deps`

**Dependencies:** None

---

### P1-E5: Route Code Splitting
**Source:** [Codebase] · **Priority:** P1 · **Complexity:** M

**Objective:** Implement route-level lazy loading to reduce the initial JS bundle. All 15+ pages are currently eager-loaded — including the admin bundle (Recharts, DND Kit) which is served to every visitor.

**Key tasks:**
- Wrap all page-level imports in `App.tsx` with `React.lazy()`
- Add `<Suspense fallback={<PageLoader />}>` around `RouterProvider`
- Create `PageLoader` component: brand-consistent spinner using `slate-brand` on `warm-white`
- Ensure admin route chunk is isolated from the public marketing chunk
- Install `rollup-plugin-visualizer` (devDependency) and document chunk sizes before/after
- Verify no regression in Playwright E2E suite

**Acceptance criteria:**
- Initial JS payload reduced by ≥ 40% (verified with Lighthouse or bundle visualiser)
- All routes load correctly in EN and FR
- Admin panel loads on first navigation without chunk error
- All existing Playwright E2E tests pass

**Dependencies:** None — can run parallel to P1-E3

---

### P1-E6: Admin Booking Creation
**Source:** [Codebase] · **Priority:** P1 · **Complexity:** L

**Objective:** Allow admin to create bookings on behalf of customers directly from the dashboard, handling phone-in, walk-in, and referred bookings that arrive outside the public booking form.

**Background:** A full codebase review confirms there is no admin-side booking creation anywhere in the platform. The six admin tabs (Bookings, Analytics, Staff, Templates, Pay Rates, Audit Logs) have no "New Booking" action. Every booking must enter Firestore through the public four-step customer form. Lauren cannot log a phone call from Margaret (P3), record a walk-in enquiry from a Gallagher (P6), or create a booking for a corporate client without directing them to the website. This is a significant operational gap.

**Personas served:** P3 Margaret (prefers phone), P6 Gallagher (B2B, negotiates directly), P4 Kahnawà:ke Baptiste (community referral, calls rather than books online)

**Key tasks:**
- Add "New Booking" button to the `BookingsTable` header
- Create `AdminBookingModal`: single-page modal (not multi-step — admin needs speed, not guided UX) containing all required and optional booking fields
- All required fields: serviceType, propertyType, bedrooms, bathrooms, pets, frequency, preferredDate, addOns, firstName, lastName, email, phone, address
- All optional fields: preferredCleaner, notes, squareFootage, isAirbnb, photoConfirmation
- Admin-only fields: language (EN/FR select), leadSource (expanded to include `'phone'` and `'walk-in'`), assignedTo (staff select), initial status (`pending` or `confirmed`), marketingConsent checkbox (off by default)
- Extend `submitBooking` in `firestore.ts` with an `adminCreate` variant that: accepts `status: 'pending' | 'confirmed'`, accepts non-null `assignedTo`, writes `createdBy: adminEmail` for audit trail
- Extend `leadSource` enum in Firestore rules and `bookingSchema.ts` to add `'phone'` and `'walk-in'`
- Add `createdBy` optional field to booking schema and `docs/firestore-schema.md`
- Split Firestore security rules: public creates still hard-block `status: 'confirmed'`, non-null `assignedTo`, and `createdBy`; admin creates (gated by `isAdmin()`) permit all three
- Admin booking creation bypasses Stripe payment — payment handled separately (cash, e-transfer, or future invoice)
- On creation, `onBookingCreated` Cloud Function fires automatically (email + SMS to client in selected language) — no new notification code needed
- If created with `status: 'confirmed'`, `onBookingStatusConfirmed` also fires and creates the Job document — test this path explicitly
- Add i18n keys for all modal strings in EN + FR

**Acceptance criteria:**
- Lauren creates a booking for a phone-in customer in under 2 minutes without leaving the admin dashboard
- Admin-created bookings appear in the Bookings table immediately with correct status
- `leadSource: 'phone'` and `'walk-in'` appear correctly in the Analytics lead source chart
- Booking confirmation email and SMS send to the client in their selected language (same as public flow)
- When created with `status: 'confirmed'`, Job document is correctly generated and staff SMS fires
- `createdBy` is populated with admin email on all admin-created records
- Firestore rules correctly gate: public creates cannot set `status: 'confirmed'`, non-null `assignedTo`, or `createdBy`
- Linguistic_Auditor: all new UI strings use `t()` — no hardcoded text
- Brand_Auditor: modal uses correct design tokens and `min-h-[48px]` touch targets

**Dependencies:** None — can be built in parallel with P1-E3

---

### P1-E7: Observability & Error Tracking
**Source:** [CTO] · **Priority:** P1 · **Complexity:** M

**Objective:** Establish a production observability stack so that Cloud Function failures, client-side errors, and platform downtime surface immediately rather than being discovered by customers.

**Background:** GA4 / Firebase Analytics is present and consent-gated, but there is no error tracking, no structured server-side logging, no uptime monitoring, and no alerting for Cloud Function failures beyond `console.error()`. A failing `onBookingCreated` function means a customer receives no confirmation. A failing `onDailyRecurringRenewal` means renewals silently stop. A failing Stripe webhook means payment captures are lost. None of these are currently detectable without manually querying Cloud Logging. Every production FSM platform — Jobber, Housecall Pro, ServiceTitan — treats observability as table stakes.

**Key tasks:**
- Install and configure Sentry for `apps/customer`: `@sentry/react` with `BrowserTracing` and `Replay` integrations; scope to production environment only via `VITE_SENTRY_DSN` GitHub Secret
- Install and configure Sentry for `apps/fsm`: `@sentry/react`; same DSN or separate project (separate project recommended for alert routing)
- Install `@sentry/node` in Cloud Functions; wrap all top-level function handlers in `Sentry.wrapHttpFunction` / `Sentry.wrapEventFunction`
- Add Sentry `sourceMap` upload step to `firebase-deploy.yml` (runs after build, before deploy) so production stack traces resolve to source lines
- Enable Firebase Performance Monitoring: already in SDK — call `getPerformance(app)` in `apps/customer/src/main.tsx`; configure Core Web Vitals traces
- Replace all `console.error()` calls in Cloud Functions with structured Google Cloud Logging entries using severity levels (`ERROR`, `WARNING`, `INFO`)
- Create Google Cloud Monitoring alert policy: any Cloud Function execution error rate > 2 in 5 minutes → send email + SMS alert to operator
- Configure UptimeRobot (free tier) or Firebase Hosting health check on `https://freshnest.ca` — alert within 2 minutes of downtime
- Store all new secrets (`SENTRY_DSN`, `SENTRY_AUTH_TOKEN`) via GitHub Secrets and Firebase Function secrets respectively

**Acceptance criteria:**
- Unhandled client-side errors in `apps/customer` appear in Sentry dashboard within 60 seconds
- Cloud Function errors appear in Sentry with full stack trace resolving to source lines
- Operator receives email/SMS alert when any Cloud Function fails > 2 times in 5 minutes
- UptimeRobot confirms uptime monitoring active on production domain
- Firebase Performance Monitoring shows Core Web Vitals baseline in Firebase console
- No `console.error()` calls remain in Cloud Function source — all replaced with structured logging

**Dependencies:** P1-E1 (Sentry DSN stored as GitHub Secret)

---

### P1-E8: CI/CD Pipeline Hardening
**Source:** [CTO] · **Priority:** P1 · **Complexity:** S

**Objective:** Add security scanning, dependency governance, and performance regression detection to the existing GitHub Actions pipeline with minimal configuration overhead.

**Background:** The current GitHub Actions pipeline deploys preview channels on PR and production on push to main. It has no dependency vulnerability scanning, no static security analysis, no performance regression detection, and no documented rollback procedure. With Stripe being added in P1-E3 (introducing payment-related dependencies) and customer PII in Firestore, supply-chain security and dependency hygiene become significantly more important.

**Key tasks:**
- Add `npm audit --audit-level=high` step to `firebase-deploy.yml` — fail build on high-severity CVEs in any workspace
- Add Dependabot configuration at `/.github/dependabot.yml`: weekly dependency PRs for `apps/customer`, `apps/fsm`, `functions/`, and root `package.json`; auto-assign to project owner; group minor/patch updates
- Add Lighthouse CI step to `firebase-preview.yml` (preview channel deploys): run Lighthouse against the preview URL, post scores as PR comment; warn but do not block on regression
- Add GitHub CodeQL analysis workflow (`.github/workflows/codeql.yml`): runs on PR and push to main; scans JS/TS for XSS, injection, unsafe eval patterns — free for all repositories
- Document rollback procedure in `docs/decisions/ADR-002-rollback-procedure.md`: Firebase Hosting supports instant rollback to any previous release via `firebase hosting:clone`; this should be a known, practiced procedure

**Acceptance criteria:**
- `npm audit` runs on every deploy; PR blocked if high-severity CVE detected
- Dependabot PRs begin appearing within 7 days of configuration
- Lighthouse scores posted as PR comment on every preview channel deploy
- CodeQL scan runs on every PR with results surfaced in the GitHub Security tab
- Rollback procedure documented and manually tested against staging

**Dependencies:** P1-E1 (clean secrets baseline)

---

## Phase 2 — Compete

**Goal:** Close the product gaps that differentiate Fresh Nest from direct competitors. By end of Phase 2, the platform has a complete customer lifecycle — first booking through recurring relationship, payment, post-job communication, review automation, and a hardened security and quality baseline.

**Estimated duration:** 10–14 weeks  
**Epic count:** 10  
**New in v2.0:** P2-E8 (Custom Claims RBAC), P2-E9 (FSM Dispatch Board), P2-E10 (Test Coverage)

---

### P2-E1: Customer Account Portal
**Source:** [Both] · **Priority:** P1 · **Complexity:** XL

**Objective:** Allow customers to create an account, view booking history, manage recurring subscription frequency, rebook a past service, and cancel an upcoming appointment without calling.

**Background:** There is no customer-facing authenticated experience. Every interaction requires either the public booking form or a call to Lauren. Jobber and Housecall Pro both offer self-service customer portals as a standard feature. Margaret (P3) prefers self-service; Diane (P1) wants to rebook without re-entering her information. Decision D2 (magic-link vs email/password) must be made before this epic begins.

**Personas served:** P1 Diane (recurring, consistency), P3 Margaret (self-service preference)

**Key tasks:**
- Firebase Auth for customers: magic-link (passwordless email) as primary; Google Sign-In as secondary
- Post-booking-confirmation email includes account setup invitation link
- Customer portal routes: `/account/bookings`, `/account/upcoming`, `/account/profile`
- Recurring subscription management: customer can view, modify frequency, and pause their recurring plan — currently only visible to admin via booking records (CTO audit gap)
- Rebook action: clones a past booking as a new pending booking and routes through Stripe payment
- Cancel action: cancels an upcoming booking and releases Stripe `PaymentIntent` hold; sends admin SMS notification
- Update Firestore rules: customers can read their own bookings (`email == request.auth.token.email`); write only via the cancellation endpoint
- Add `customerId` field to booking schema (populated when customer creates account and links email)
- Update `docs/firestore-schema.md`

**Acceptance criteria:**
- Margaret logs in and views her upcoming clean without calling
- Diane rebooks her preferred cleaner from the portal without re-entering address details
- Customer can view and change their recurring plan frequency (weekly / biweekly / monthly)
- Cancellation triggers Stripe hold release and admin SMS notification within 60 seconds
- Customer cannot read another customer's bookings (Firestore rules test required)

**Dependencies:** P1-E3 (Stripe), P2-E8 (Custom Claims — customer role gates portal routes)

---

### P2-E2: Post-Job Review Automation
**Source:** [Both] · **Priority:** P1 · **Complexity:** L

**Objective:** Automatically request Google reviews 24 hours after job completion; build a live `/reviews` page from admin-approved review content.

**Personas served:** Business (Google ranking); P2 Travis and P3 Margaret (social proof at decision point)

**Key tasks:**
- Cloud Function trigger on `jobs/{jobId}` update: when `status` transitions to `completed`, write `reviewRequestScheduledFor: Timestamp.now() + 24h` on the job document
- Scheduled Cloud Function (runs every hour): query jobs where `reviewRequestScheduledFor <= now` and `reviewEmailSent != true`; send review request email; mark `reviewEmailSent: true`
- Email template: branded EN/FR, direct link to Google Business Profile review URL; passes Linguistic_Auditor
- Admin "Reviews" sub-tab in admin dashboard: incoming review requests listed; admin can type review text and approve; `approved: true` flag on `reviews` Firestore document
- Build `/reviews` page: remove `PlaceholderPage`; render all `approved == true` reviews from Firestore with star rating, name, and date

**Acceptance criteria:**
- Review request email sends in the booking's language 24 hours after `completedAt`
- Admin can approve a review and it appears on `/reviews` within 60 seconds
- Email passes Linguistic_Auditor (all strings via `t()`)
- `/reviews` page passes Brand_Auditor (design token compliance)
- No review request sent if job is cancelled

**Dependencies:** FSM job completion flow (already built and operational)

---

### P2-E3: "On My Way" Customer Notification
**Source:** [Both] · **Priority:** P1 · **Complexity:** M

**Objective:** Send the customer an SMS when their cleaner checks into a job — matching a standard UX expectation set by Housecall Pro and Handy that directly reduces customer anxiety.

**Personas served:** P6 Gallagher (time-sensitive Airbnb turnover window), P2 Travis (transparency)

**Key tasks:**
- Extend `onJobUpdatedTrigger` in Cloud Functions: when `status` transitions `acknowledged → in_progress` and `checkedInAt` is set, look up the booking by `bookingId` and send SMS to the customer's phone number
- Add EN/FR "on my way" SMS template to `smsTemplates.ts` including cleaner first name and scheduled start time
- Confirm `clientPhone` is stored on the Job document (it is — confirmed in FSM type definition)
- Ensure no SMS sends if job is cancelled before check-in

**Acceptance criteria:**
- Gallagher receives SMS in English when cleaner checks in
- Diane receives SMS in French
- SMS includes cleaner first name and scheduled start window
- No SMS sent if job is cancelled before check-in

**Dependencies:** FSM `JobPage` check-in flow (already built)

---

### P2-E4: Content Pages — About, Reviews & Careers
**Source:** [Codebase] · **Priority:** P2 · **Complexity:** M

**Objective:** Replace all remaining `PlaceholderPage` instances with real content. Four routes currently show placeholders to live users and search engine crawlers; two are handled in other epics (`/privacy` in P1-E2; `/reviews` in P2-E2).

**Personas served:** P1 Diane (trust), P3 Margaret (trust), P4 Kahnawà:ke Baptiste (community recognition)

**Key tasks:**
- Build `/about` page: company story, mission statement, team section (reuse `MeetTheTeam` component), community commitment section explicitly naming Cornwall Island / Akwesasne / Snye QC, eco-friendly practices for P5 Sophie
- Build `/careers` page: "We're hiring" with role description and contact email, OR remove the footer link if not actively hiring — `PlaceholderPage` is not acceptable either way
- All new content bilingual via `t()` — EN + FR translations in `en.json` / `fr.json`
- Verify `/reviews` (P2-E2) and `/privacy` (P1-E2) are already resolved before marking this epic complete

**Acceptance criteria:**
- No `PlaceholderPage` rendered on any route in production
- `/about` explicitly states service area including Cornwall Island / Akwesasne (P4 test)
- All new strings pass Linguistic_Auditor
- Brand_Auditor confirms design token compliance on all new pages
- Lighthouse SEO score ≥ 95 on `/about`

**Dependencies:** None

---

### P2-E5: Accessibility Pass (WCAG 2.1 AA)
**Source:** [Codebase] · **Priority:** P2 · **Complexity:** M

**Objective:** Bring the customer app to WCAG 2.1 AA compliance across all core user flows, with particular focus on the booking form and admin dashboard.

**Personas served:** P3 Margaret (primary accessibility persona); legally important for all Canadian public-facing services

**Key tasks:**
- Add skip navigation link in `Layout.tsx`: `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>`
- Add `aria-expanded` and `aria-controls` on the mobile nav hamburger toggle in `Navbar.tsx`
- Implement focus management in multi-step booking form: on step change, `focus()` the first interactive element of the new step
- Audit all `font-body text-sm` (14px) instances in admin tables and secondary labels: uplift to `text-base` (16px) or confirm decorative-only usage
- Add `aria-live="polite"` regions for: admin filter result count updates, booking step progress indicator
- Run axe-core audit on `/booking`, `/`, and `/admin`; resolve all Critical and Serious violations
- Verify `html[lang]` switches dynamically (covered in P1-E4 — confirm here)

**Acceptance criteria:**
- Lighthouse a11y score ≥ 90 on `/booking` and `/` (homepage)
- A keyboard-only user completes the full booking flow without a mouse (Playwright keyboard-nav test)
- No axe-core Critical or Serious violations on any audited route
- All `min-h-[48px]` touch targets maintained (Margaret requirement)

**Dependencies:** P1-E4 (dynamic `html lang` attribute fix)

---

### P2-E6: Admin Pagination & Server-Side Analytics
**Source:** [Both] · **Priority:** P2 · **Complexity:** L

**Objective:** Replace unbounded `onSnapshot` full-collection listeners with paginated queries; move analytics aggregation server-side; migrate admin hooks to TanStack Query.

**Background:** The admin dashboard subscribes to all bookings and all jobs with no date range or limit. Analytics KPIs (lead source breakdown, monthly revenue, channel performance) are computed entirely in the browser from the full snapshot. At 500+ bookings this becomes a Firestore cost and latency issue. TanStack Query v5 and `@tanstack-query-firebase/react` are both installed but unused in admin hooks.

**Key tasks:**
- Refactor `subscribeToBookings` to paginate: default last 90 days, cursor-based "Load more" — limit 50 documents per page
- Add date-range filter inputs to `BookingsTable` filter bar
- Implement Cloud Function HTTPS callable `getAnalyticsKPIs`: uses Firestore `count()` and `sum()` aggregation queries for total bookings, revenue, and lead source breakdown
- Cache analytics results in `reports/{rangeKey}` Firestore document with 1-hour TTL
- Update `useAdminAnalytics` hook to call `getAnalyticsKPIs` Cloud Function instead of aggregating client-side
- Migrate all admin hooks from raw `useEffect`/`onSnapshot` to TanStack Query wrappers using `@tanstack-query-firebase/react` (installed but unused)

**Acceptance criteria:**
- Admin Bookings tab loads with ≤ 50 booking documents on initial render
- Analytics KPIs load in under 2 seconds for a 12-month window
- TanStack Query DevTools shows cache hits on repeat analytics tab visits
- Existing admin Playwright E2E tests pass without modification

**Dependencies:** None

---

### P2-E7: PWA Configuration
**Source:** [Both] · **Priority:** P2 · **Complexity:** M

**Objective:** Enable the customer app as an installable Progressive Web App with a service worker and offline shell. The manifest and complete icon set are fully authored — only the service worker is missing.

**Background:** `vite-plugin-pwa` is installed in `devDependencies` but not referenced in `apps/customer/vite.config.ts`. The `site.webmanifest` is correctly authored with 7 icon sizes including maskable variants. The app is not currently installable. The FSM app already uses `persistentLocalCache` for offline Firestore reads — the service worker will extend this.

**Personas served:** P2 Travis (mobile-first repeat visitor), FSM staff (offline job access in transit)

**Key tasks:**
- Configure `vite-plugin-pwa` in `apps/customer/vite.config.ts` with `GenerateSW` strategy
- Set `CacheFirst` for static assets (`js`, `css`, `woff2`, images); `NetworkFirst` for Firestore API calls
- Add install prompt UI triggered after second visit (using `beforeinstallprompt` event)
- Verify FSM offline job detail view works with service worker active alongside `persistentLocalCache`
- Test install flow on iOS Safari and Android Chrome

**Acceptance criteria:**
- App passes Lighthouse PWA audit (installable, offline shell, service worker)
- Travis can view the booking form shell offline
- FSM job detail page remains accessible offline
- iOS Add to Home Screen produces correct icon and app name
- No regression in any existing E2E tests

**Dependencies:** P1-E5 (code splitting — optimal cache chunk granularity requires split bundles)

---

### P2-E8: Firebase Custom Claims RBAC
**Source:** [CTO] · **Priority:** P2 · **Complexity:** L

**Objective:** Migrate from the email-allowlist admin pattern to Firebase Custom Claims, enabling multi-role access control and eliminating a Firestore read on every security rule evaluation.

**Background:** The current `isAdmin()` Firestore rule performs `exists(/databases/$(database)/documents/admins/$(request.auth.token.email))` — a Firestore document lookup on every security rule evaluation across the entire platform. This pattern cannot support multiple permission levels (admin vs supervisor vs read-only). As the business grows to add supervisors or regional managers, the flat allowlist is a hard architectural ceiling. Firebase Custom Claims attach role data directly to the auth token — no Firestore read required in rules. Decision D6 (role taxonomy) must be made before this epic begins.

**Key tasks:**
- Define role taxonomy: `admin` (full access) · `supervisor` (read bookings, manage staff) · `staff` (FSM app only) · `customer` (own bookings only)
- Cloud Function `setUserRole`: callable by existing admins; sets Custom Claims via `auth.setCustomUserClaims(uid, { role })`
- Refactor `isAdmin()` in `firestore.rules` to check `request.auth.token.role == 'admin'` — eliminates Firestore document read on every rule evaluation
- Add `isSupervisor()` function to rules for future read-only admin access
- Add router-level `ProtectedRoute` wrapping `/admin` in `apps/customer/src/App.tsx` (currently component-level auth only)
- Migrate FSM app `ProtectedRoute` to validate `role == 'staff' || role == 'admin'` via Claims
- Fix `referrals` collection rule (if not already done in P1-E1): `allow get: if true` only
- Document role taxonomy in `docs/decisions/ADR-003-rbac-custom-claims.md`

**Acceptance criteria:**
- Admin, supervisor, staff, and customer roles are enforced at both the router and Firestore rules levels
- Firestore rules no longer perform document lookups during rule evaluation
- Existing admin functionality is fully preserved under the new Claims model
- A staff user cannot access admin routes or read other staff's private data
- A customer user cannot read another customer's bookings
- All auth flow E2E tests pass (added in P2-E10)

**Dependencies:** P1-E1 (clean secrets), P2-E1 (customer auth establishes the auth infrastructure Claims build on)

---

### P2-E9: FSM Dispatch Board & Scheduling Intelligence
**Source:** [CTO] · **Priority:** P2 · **Complexity:** XL

**Objective:** Replace the current text-dropdown assignment model with a visual dispatch board that shows cleaner availability, flags conflicts, and supports drag-and-drop job assignment.

**Background:** The CTO audit identifies FSM operational depth as the most significant competitive gap versus Jobber and Housecall Pro. Currently, admin assigns cleaners via a text input in `BookingDetailPanel` with no visibility into that cleaner's existing job load, blocked windows, or earnings cap. As the business adds cleaners, this creates a manual coordination burden that does not scale. Jobber's dispatch calendar and Housecall Pro's drag-and-drop scheduling board are industry standard.

**Key tasks:**
- Admin dispatch board: visual view of active staff as columns; jobs as cards draggable into staff columns by date — replaces text-dropdown assignment in `BookingDetailPanel`
- Cleaner availability engine: read `blockedWindows` and `constraints.transitBufferMinutes` from each staff record; surface scheduling conflicts on the dispatch board before assignment (visual warning — admin can override with reason logged to `auditLog`)
- Conflict detection integrated into admin booking creation (P1-E6): when assigning a cleaner at creation, check for same-date job conflicts and surface an inline warning
- Job load view per cleaner: weekly hours assigned vs `financials.monthlyEarningsLimit` — admin sees at a glance who is near capacity
- Address lat/lng storage: add optional `clientLatLng` field to booking/job schema to enable future travel-time estimation; populate via Geocoding API or manual admin entry — flag field for Phase 3 travel-time display
- FSM `ShiftBoardPage` enhancement: show jobs ordered by `scheduledStartTime`; display estimated gap between previous job location and next (requires `clientLatLng` population)
- Drag-and-drop implementation via `@dnd-kit` (already installed — DND Kit is in the bundle)

**Acceptance criteria:**
- Admin can drag a job card from "Unassigned" to a cleaner column to assign
- Dispatch board shows a visual conflict indicator when a cleaner has overlapping jobs
- Conflict override writes a reason to `auditLog`
- Job load bar shows hours assigned vs earnings cap for each cleaner on the current week
- Admin booking creation (P1-E6) warns on same-date conflict before saving

**Dependencies:** P1-E6 (admin booking creation), P2-E6 (paginated bookings — do not load all bookings into dispatch board)

---

### P2-E10: Test Coverage Expansion
**Source:** [CTO] · **Priority:** P2 · **Complexity:** L

**Objective:** Raise test coverage to levels appropriate for a payment-handling, PIPEDA-regulated platform; add Firestore rules emulator tests; extend Playwright E2E to cover FSM workflows, admin booking creation, and the Stripe payment flow.

**Background:** Current Vitest coverage thresholds are 40% lines / 35% branches — appropriate for a marketing site, not for a platform handling Stripe transactions, customer PII, and regulated data. The CTO audit specifically identifies authorization testing, localization regression, and operational workflow coverage as expansion targets. Firestore security rules — the actual security gate for all data — have zero automated test coverage.

**Key tasks:**
- Firestore rules emulator tests using `@firebase/rules-unit-testing`:
  - Public booking create: valid payload, each invalid/missing field, attempts to set `status: 'confirmed'` / non-null `assignedTo` / `createdBy`
  - Admin create: all of the above but with admin Claims — should succeed
  - Staff self-update: allowed fields pass, disallowed fields (earnings) blocked
  - Job update: assigned cleaner can update status/checklist, non-assigned cleaner blocked
  - Default deny-all: explicit test for unlisted collection write attempts
- Raise Vitest thresholds to 60% lines / 55% branches in `apps/customer/vitest.config.ts`
- Add unit tests for: `useAdminAuth` (sign-in, sign-out, unauthorized user), `quotePricing.ts` (all service/property/frequency matrix combinations), `bookingSchema.ts` Zod validation (valid payload + each invalid field), `analytics.ts` (all custom event functions)
- Add Playwright E2E tests for: FSM login flow, FSM job check-in and completion flow, admin booking creation via `AdminBookingModal` (P1-E6), admin status change + Cloud Function email trigger verification, language persistence across page navigations, Stripe payment flow (using Stripe test card `4242 4242 4242 4242`)
- FSM `JobPage` E2E: navigate to job, complete checklist task, attempt photo upload (mock Firebase Storage)

**Acceptance criteria:**
- All Firestore rules emulator tests pass; coverage for every rule in `firestore.rules`
- Vitest coverage meets 60% lines / 55% branches across `apps/customer`
- Playwright suite covers admin booking creation, Stripe checkout, and FSM job completion
- CI pipeline runs all test suites on every PR (added in P1-E8 Lighthouse CI step — extend to include Playwright)

**Dependencies:** P1-E3 (Stripe — payment E2E requires Stripe test mode), P1-E6 (admin booking creation — new modal needs E2E coverage), P2-E8 (Custom Claims — auth tests require role-based token setup)

---

## Phase 3 — Scale

**Goal:** Build the feedback loops, growth infrastructure, and architectural foundations that drive long-term customer lifetime value, organic acquisition, and operational scale.

**Estimated duration:** 12–20 weeks  
**Epic count:** 8  
**New in v2.0:** P3-E7 (Dynamic Pricing), P3-E8 (Multi-Tenancy Schema)

---

### P3-E1: Loyalty & Referral Reward Loop
**Source:** [Codebase] · **Priority:** P2 · **Complexity:** L

**Objective:** Convert the existing referral code infrastructure into a functional two-sided reward system. Referral codes are already generated and stored in the `referrals` collection — the reward mechanism and customer visibility do not exist.

**Personas served:** P1 Diane (active referrer in her network), P2 Travis (price-sensitive, responds to discounts)

**Key tasks:**
- Define reward amounts: recommend $25 off next booking for referrer + $25 off first booking for referred customer; store as configurable `referralConfig` Firestore document
- Cloud Function trigger: when a referred booking transitions `status → confirmed` and `referredBy` is set, credit referrer's account with `$25` in a `credits` sub-collection on their customer account
- Credit applied as Stripe coupon on referrer's next booking (requires P1-E3 Stripe infrastructure)
- Referral code and credit balance visible in customer portal (P2-E1)
- Admin credit management view: credits issued and redeemed per customer; admin can manually adjust

**Acceptance criteria:**
- Referred booking triggers referrer credit within 60 seconds of `status → confirmed`
- Credit balance visible in customer portal
- Credit correctly reduces next booking's Stripe `PaymentIntent` amount
- Admin can manually adjust or revoke credits

**Dependencies:** P2-E1 (customer account portal), P1-E3 (Stripe)

---

### P3-E2: CMS-Backed Blog
**Source:** [Codebase] · **Priority:** P3 · **Complexity:** L

**Objective:** Replace the static `blogData.ts` file with Firestore-backed blog posts editable by admin without developer involvement.

**Personas served:** Business (SEO content velocity), P2 Travis (pricing and tips content), P5 Sophie (French content)

**Key tasks:**
- Build "Blog" admin tab: create, edit, publish/draft, delete posts with EN and FR content fields
- Post schema: `slug`, `title_en`, `title_fr`, `content_en`, `content_fr`, `excerpt_en`, `excerpt_fr`, `publishedAt`, `status: 'draft' | 'published'`, `author`, `coverImageUrl`
- Migrate existing `blogData.ts` articles to Firestore `blog_posts` collection as seed data
- Update `/blog` and `/blog/:slug` to read from Firestore
- Cloud Function generates RSS feed at `/rss.xml` on publish
- Cover image upload via Firebase Storage

**Acceptance criteria:**
- Lauren publishes a bilingual blog post without developer involvement
- Post appears on `/blog` and `/blog/:slug` within 30 seconds of publishing
- Google Search Console shows new posts indexed within 7 days
- RSS feed validates at W3C Feed Validator

**Dependencies:** None (builds on existing admin panel infrastructure)

---

### P3-E3: Bilingual SEO — Path-Based Language Routing
**Source:** [Codebase] · **Priority:** P2 · **Complexity:** XL

**Objective:** Migrate from `?lang=fr` query-parameter language selection to `/fr/` path-based routing so French-language pages can be independently indexed by Google.

**Background:** The SEO component generates `hreflang` alternates using query params (`?lang=en` / `?lang=fr`). Google strongly prefers separate URLs for bilingual content. French-speaking searchers in Cornwall, Akwesasne, and Snye QC cannot currently find Fresh Nest via French-language organic search. Decision D4 (routing structure) must be ADR'd before this epic begins. This is a breaking URL change — customer portal links, confirmation email links, and GBP booking links are all affected.

**Personas served:** P1 Diane (FR discoverability), P5 Sophie (Snye QC FR search)

**Key tasks:**
- ADR: path prefix (`/fr/*`) vs subdomain (`fr.freshnest.ca`) — recommend path prefix
- Duplicate all routes under `/fr/` prefix in `App.tsx`
- Update `SEO` component: canonical and hreflang use full path URLs
- Redirect `?lang=fr` → `/fr/` for backward compatibility
- Update all internal links and navigation to use localised paths when `i18n.language === 'fr'`
- Submit updated XML sitemap (EN + FR URLs) to Google Search Console
- Update Firebase Hosting rewrites for `/fr/*` paths
- Update customer portal, confirmation email, and GBP links to use path-based URLs

**Acceptance criteria:**
- `/fr/` pages rank for French-language cleaning queries in target geography within 90 days
- Lighthouse SEO score ≥ 95 on both `/` (EN) and `/fr/` (FR) homepage
- No duplicate content warnings in Google Search Console
- All existing Playwright E2E tests updated and passing with new route structure

**Dependencies:** Phase 1 and 2 fully complete; ADR approved; D4 decision locked

---

### P3-E4: Google Business Profile Booking Integration
**Source:** [Codebase] · **Priority:** P3 · **Complexity:** M

**Objective:** Enable "Book on Google" from the Fresh Nest Co. Google Business Profile to capture high-intent local search traffic.

**Key tasks:**
- Verify Fresh Nest Co. business on Google Business Profile (if not already verified)
- Configure GBP booking link: `https://freshnest.ca/booking?utm_source=google`
- Confirm `detectLeadSource` in `firestore.ts` maps `utm_source=google` to `leadSource: 'google'`
- Verify bookings from GBP appear under "Google" in admin Analytics lead source chart
- Explore Reserve with Google API for deeper integration (requires Google approval)

**Acceptance criteria:**
- "Book" button visible on Google Maps listing
- Bookings from GBP show `leadSource: 'google'` in admin analytics
- UTM parameters pass through to Firestore booking record

**Dependencies:** P1-E3 (Stripe — Google requires bookable services to accept payment)

---

### P3-E5: Admin Calendar View
**Source:** [Both] · **Priority:** P3 · **Complexity:** L

**Objective:** Give admin a visual week/month calendar view of bookings and job assignments, reducing the cognitive overhead of the table-only view as booking volume grows.

**Key tasks:**
- Add "Calendar" toggle to admin Bookings panel (tab or view switcher)
- Build lightweight custom week-grid component (preferred over `react-big-calendar` for design token control)
- Events: bookings on `preferredDate`; jobs on `scheduledDate` with cleaner name if assigned
- Click event opens existing `BookingDetailPanel` — no new detail UI
- Month view for overview; week view for day-level scheduling
- Draw events from paginated bookings (P2-E6) — do not load all bookings into calendar

**Acceptance criteria:**
- Admin views all bookings for a given week without scrolling a table
- Clicking a booking event opens the detail panel
- Calendar renders correctly at 1280px desktop width

**Dependencies:** P2-E6 (paginated bookings), P2-E9 (dispatch board — calendar and dispatch board should share the same data layer)

---

### P3-E6: Data Retention & PIPEDA Right-to-Erasure
**Source:** [Both] · **Priority:** P2 · **Complexity:** M

**Objective:** Implement the 7-year data retention schedule and customer PII deletion mechanism committed to in the Privacy Policy (P1-E2).

**Background:** PII is currently stored indefinitely with no archival or deletion mechanism. The Privacy Policy drafted in P1-E2 will commit to a 7-year retention period — this epic enforces it.

**Key tasks:**
- Scheduled Cloud Function (runs annually, January 1): archive booking documents older than 7 years to Cloud Storage as JSON export; delete from Firestore after confirmed export
- Admin "Customer Data" action in dashboard: "Export data" — Cloud Function generates complete JSON export for a given email (bookings, referrals, account data) within 60 seconds
- Admin "Delete customer data" action: replaces PII fields (`firstName`, `lastName`, `email`, `phone`, `address`) with `[deleted]` across all records for that email; does not delete booking records (audit trail); writes deletion event to `auditLog` with `adminEmail`, `timestamp`, and `reason`
- Customer self-service deletion request via customer portal (P2-E1): submits deletion request to admin; admin must confirm before execution
- Update Privacy Policy text with specific 7-year retention and deletion process

**Acceptance criteria:**
- Data export completes for any email within 60 seconds
- Deletion anonymises all PII without removing booking records
- Deletion event logged in `auditLog` with required fields
- Annual archival function runs successfully in staging environment

**Dependencies:** P1-E2 (Privacy Policy text references this process), P2-E1 (customer portal for self-service deletion requests)

---

### P3-E7: Dynamic Pricing Engine & Conversion Optimisation
**Source:** [CTO] · **Priority:** P3 · **Complexity:** L

**Objective:** Enable admin-managed promotional pricing rules, first-booking discounts, and booking funnel analytics to improve both revenue flexibility and conversion rates.

**Background:** The CTO audit identifies dynamic pricing as a booking domain gap. `quotePricing.ts` is entirely static — a flat rate matrix with fixed multipliers. Competitors (Launch27, Housecall Pro) support seasonal pricing, new-customer discounts, and promo codes. Additionally, there is no visibility into where users exit the 4-step booking form — funnel drop-off data is a critical conversion lever.

**Key tasks:**
- Admin-managed pricing rules: admin creates time-bounded discount rules (e.g., "20% off Deep Cleans in January") stored in `pricingRules` Firestore collection; applied at quote calculation time in `quotePricing.ts`
- First-booking discount: configurable percentage off for customers whose email has no prior completed bookings — detected server-side in `createPaymentIntent` Cloud Function
- Promo code expansion: extend `BookingStep4` referral/promo input to also accept admin-created promo codes from `pricingRules`; display confirmed discount in Step 4 review summary
- Funnel analytics: instrument each booking step with GA4 custom events — `booking_step_1_completed`, `booking_step_2_abandoned`, etc.; surface in admin Analytics marketing sub-tab as a funnel visualisation
- Firebase Remote Config A/B test infrastructure: serve variant flags (e.g., "show price estimate on Step 1 vs Step 2") and compare booking completion rates between variants

**Acceptance criteria:**
- Admin creates a time-bounded discount rule and it applies correctly in the quote calculator
- First-booking discount applies automatically for new customer emails
- Admin promo code reduces the Stripe `PaymentIntent` amount and displays in Step 4 review
- Funnel drop-off rates by step visible in admin Analytics dashboard
- Remote Config variant flag can be toggled without a code deploy

**Dependencies:** P1-E3 (Stripe — discounts reduce `PaymentIntent` amount), P2-E6 (analytics infrastructure for funnel visualisation)

---

### P3-E8: Multi-Tenancy Schema Flag & ADR
**Source:** [CTO] · **Priority:** P3 · **Complexity:** S

**Objective:** Add `locationId` / `tenantId` field awareness to the Firestore schema now, preserving the option to support multiple service locations or franchise partners without a costly retrofit later.

**Background:** ServiceTitan, Jobber, and Housecall Pro all support multi-location or franchise models. Fresh Nest's current schema has no location or tenant scoping — the `isAdmin()` function is global, and booking/job/staff documents have no `locationId` field. Retrofitting tenancy onto an un-tenanted schema after 500+ documents exist is expensive. Adding the field now, even always set to `'cornwall-on'`, costs nothing and preserves the option.

**Key tasks:**
- Add optional `locationId: string` field to `bookings`, `jobs`, and `staff` Firestore schema definitions; default value `'cornwall-on'`
- Add `locationId` to `docs/firestore-schema.md` with a note explaining the multi-tenancy intent
- Write ADR: `docs/decisions/ADR-004-multi-tenancy-schema-flag.md` documenting the decision, the current single-location context, and the expansion path
- Update `isAdmin()` Firestore rule comment to note that future scoping will add `locationId` check
- No functional change required — this is a schema annotation and forward-planning exercise

**Acceptance criteria:**
- `locationId` field present in all new booking, job, and staff documents written after this epic
- `docs/firestore-schema.md` updated with field definition and multi-tenancy note
- ADR approved and committed to `docs/decisions/`

**Dependencies:** None

---

## Master Epic Summary

| Phase | ID | Epic Name | Source | Complexity | Priority | Key Dependency |
|---|---|---|---|---|---|---|
| 1 — Stabilize | P1-E1 | Secrets & Security Remediation | Codebase | S | P0 | None |
| 1 — Stabilize | P1-E2 | Privacy Policy & PIPEDA Compliance | Codebase | S | P0 | None |
| 1 — Stabilize | P1-E3 | Stripe Payment Integration | Both | XL | P0 | P1-E1 |
| 1 — Stabilize | P1-E4 | Critical Bug & Index Fixes | Codebase | M | P1 | None |
| 1 — Stabilize | P1-E5 | Route Code Splitting | Codebase | M | P1 | None |
| 1 — Stabilize | P1-E6 | Admin Booking Creation | Codebase | L | P1 | None |
| 1 — Stabilize | P1-E7 | Observability & Error Tracking | CTO | M | P1 | P1-E1 |
| 1 — Stabilize | P1-E8 | CI/CD Pipeline Hardening | CTO | S | P1 | P1-E1 |
| 2 — Compete | P2-E1 | Customer Account Portal | Both | XL | P1 | P1-E3, P2-E8 |
| 2 — Compete | P2-E2 | Post-Job Review Automation | Both | L | P1 | — |
| 2 — Compete | P2-E3 | "On My Way" Notification | Both | M | P1 | — |
| 2 — Compete | P2-E4 | Content Pages (About, Careers) | Codebase | M | P2 | None |
| 2 — Compete | P2-E5 | Accessibility Pass (WCAG 2.1 AA) | Codebase | M | P2 | P1-E4 |
| 2 — Compete | P2-E6 | Admin Pagination & Server Analytics | Both | L | P2 | None |
| 2 — Compete | P2-E7 | PWA Configuration | Both | M | P2 | P1-E5 |
| 2 — Compete | P2-E8 | Firebase Custom Claims RBAC | CTO | L | P2 | P1-E1, P2-E1 |
| 2 — Compete | P2-E9 | FSM Dispatch Board & Scheduling | CTO | XL | P2 | P1-E6, P2-E6 |
| 2 — Compete | P2-E10 | Test Coverage Expansion | CTO | L | P2 | P1-E3, P1-E6, P2-E8 |
| 3 — Scale | P3-E1 | Loyalty & Referral Reward Loop | Codebase | L | P2 | P2-E1, P1-E3 |
| 3 — Scale | P3-E2 | CMS-Backed Blog | Codebase | L | P3 | None |
| 3 — Scale | P3-E3 | Bilingual SEO Path-Based Routing | Codebase | XL | P2 | Phase 1+2 done |
| 3 — Scale | P3-E4 | Google Business Profile Integration | Codebase | M | P3 | P1-E3 |
| 3 — Scale | P3-E5 | Admin Calendar View | Both | L | P3 | P2-E6, P2-E9 |
| 3 — Scale | P3-E6 | Data Retention & PIPEDA Erasure | Both | M | P2 | P1-E2, P2-E1 |
| 3 — Scale | P3-E7 | Dynamic Pricing & Conversion Optimisation | CTO | L | P3 | P1-E3, P2-E6 |
| 3 — Scale | P3-E8 | Multi-Tenancy Schema Flag & ADR | CTO | S | P3 | None |

**Totals by complexity:** S×4 · M×8 · L×10 · XL×4  
**Totals by priority:** P0×3 · P1×8 · P2×10 · P3×5  
**Totals by source:** Codebase×13 · CTO×7 · Both×6

---

## Dependency Map

```
P1-E1 ──► P1-E3 ──► P2-E1 ──► P3-E1
     │         │         │
     │         │         └──► P3-E6
     │         └──► P3-E4
     │
     ├──► P1-E7
     │
     └──► P1-E8

P1-E4 ──► P2-E5

P1-E5 ──► P2-E7

P1-E6 ──► P2-E9
     │
     └──► P2-E10

P2-E1 ──► P2-E8 ──► P2-E10
     │
     └──► P3-E6

P2-E6 ──► P2-E9
     │
     ├──► P3-E5
     │
     └──► P3-E7

P1-E3 ──► P2-E10
P1-E3 ──► P3-E7

Phase 1+2 complete ──► P3-E3
```

---

## Backlog (Out of Current Plan Scope)

The following items are valid but deferred — either too speculative for solo-developer capacity in the current window, or blocked on strategic decisions not yet made:

| Item | Reason Deferred |
|---|---|
| Merge `CLAUDE.md` / `GEMINI.md` into single `AGENTS.md` | Maintenance housekeeping; low risk at current cadence |
| Slot-based booking with cleaner availability calendar | Requires dispatch board (P2-E9) to stabilise first |
| AI scheduling / predictive staffing | 24-month horizon per CTO audit |
| Franchise / multi-tenant enforcement | Schema flag added in P3-E8; full enforcement is Phase 4 |
| Push notifications (native) for FSM staff | PWA push notifications (P2-E7) cover the core use case; native app is a separate decision |
| QuickBooks / accounting integration | Requires invoice workflow to exist first |
| CASL marketing email unsubscribe mechanism | Documented in Privacy Policy (P1-E2); implementation deferred to post-Phase 2 |
| HST/tax remittance reporting | Out of scope for the platform; handled via external accounting |

