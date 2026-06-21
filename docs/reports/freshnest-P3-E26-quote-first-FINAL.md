# Fresh Nest Co. — Quote-First Booking System
## P3-E26 — Final Project Plan v2.0

**Version:** 2.0 (supersedes v1.0 + gap analysis)
**Date:** June 17, 2026
**Source:** [Product] + [Industry Benchmark] (Jobber, Housecall Pro, ZenMaid, ServiceM8, QuoteIQ)
**Phase:** 3 — Band C (Scale & Grow)
**Complexity:** XL | **Priority:** P2
**Sprint:** Sprint 7 (Weeks 16–22 of Phase 3)

---

## What Changed from v1.0

| # | Change | Reason |
|---|---|---|
| 1 | `generateQuoteContract` Cloud Function removed | Over-engineered; replaced with web-first CSS print approach |
| 2 | Automated follow-up sequence added | Highest-leverage missing feature; industry standard on all FSM platforms |
| 3 | Deposit collection at signing added | Industry standard; no financial commitment without deposit = high no-show rate |
| 4 | Customer "Request Changes" flow added | Standard in Jobber Client Hub; prevents lost contracts at closing stage |
| 5 | Structured decline reason capture added | Required for quote pipeline analytics and pricing tuning |
| 6 | Optional add-on upsells at signing added | Highest-praised Jobber quoting feature; meaningful revenue lever for recurring contracts |
| 7 | Quote pipeline analytics added | Win rate, conversion by service type, decline reason breakdown |
| 8 | `BookingStatus` expanded | 6 quote-specific values (was 4 in v1.0) |
| 9 | `quotes` schema expanded | 12 new fields across deposit, follow-up, change request, decline, and optional add-ons |
| 10 | `settings/intake` schema expanded | Follow-up schedule and default deposit % now configurable by admin |
| 11 | Build sequence reordered | ADR and architecture decisions must precede code; sequence updated accordingly |

---

## Overview

Fresh Nest currently has one intake model: instant booking. A customer picks a service, date, and submits — a booking lands in Firestore immediately. This works for predictable residential cleans where the price is transparent and the property is standard.

It does not work for: large or unusual properties where square footage and condition make a flat rate inaccurate; commercial clients where scope, frequency, and compliance requirements vary significantly; first-time recurring contracts where the business needs to assess before committing to a price; or high-value accounts where a site visit, negotiated contract, and signed agreement are expected as standard practice.

The Quote-First system adds a second intake pathway alongside instant booking. A prospective customer submits a quote request — a shorter form with no date or payment required. Lauren visits the property, assesses scope and condition, and builds a formal contract specifying agreed price, frequency, cleaning duties, and access details. The contract is sent to the customer via a secure signing link. The customer can sign and pay a deposit atomically, request changes, or decline with a structured reason. On signing, the contract converts to a confirmed recurring booking and the first Job document is created automatically through the existing FSM pipeline.

The admin has a single toggle to switch the public intake mode between Instant Booking and Quote Required per service type. Both pathways coexist at all times. The existing instant-booking flow is completely unchanged.

---

## Personas Served

| Persona | Need | How Quote System Serves Them |
|---|---|---|
| P6 Gallagher | Commercial Airbnb/rental; needs formal SLA terms and paper trail for property manager | Signed contract with scope, access details, and HST breakdown; deposit collected at signing |
| P4 Baptiste | Large multi-room house; budget sensitivity; prefers relationship over automation | On-site visit builds trust; price agreed in person before any charge |
| P3 Margaret | Prefers phone; distrusts automated pricing; wants human confirmation | Quote flow confirms a human will call back; no surprise charges; change request lets her negotiate scope |
| P1 Diane | Long-term recurring; wants pricing certainty and preferred cleaner guaranteed | Contract locks in price, frequency, and preferred cleaner by name |
| Business (Lauren) | On-site assessment protects margin on large/complex properties; contract prevents scope creep | Full quote workspace: assessment notes, scope control, access details, audit trail |

---

## How It Fits the Existing Architecture

The quote system extends — does not replace — the existing booking model:

- `bookings` collection gains 6 new `BookingStatus` values; existing instant-booking statuses are unchanged
- New `quotes` collection holds contract content separately from the booking record
- New `settings` collection holds the per-service intake mode configuration
- `BookingPage.tsx` gains a mode-aware gate on Step 1; all other booking steps are unchanged
- All existing Cloud Functions continue operating without modification
- The `onBookingStatusConfirmed` pipeline that creates Job documents fires automatically on quote acceptance — no new job creation code needed

---

## Full Booking Lifecycle (Updated)

```
INSTANT BOOKING path (existing — unchanged):
  [/booking form] → pending → confirmed → completed
                                       ↘ cancelled

QUOTE-FIRST path (new):
  [/quote form] → quote_requested
                       ↓ (Lauren schedules + conducts assessment)
                  quote_sent (contract link sent to customer)
                       ↓ ─────────────────────────────────────────┐
               [customer actions]                                   │
                       │                                            │
              ┌────────┴────────────────┐                          │
              │                         │                          │
        Sign (+ pay deposit)    Request Changes          Decline
              │                         │                    │
        quote_accepted         changes_requested      quote_declined
              │                         │
        confirmed               [Lauren revises]
              │                         │
        completed               quote_sent (loop)
                                        │
                               (customer re-signs)
                                        │
                                quote_accepted → confirmed
```

---

## Firestore Schema — Complete

### 1. Updated BookingStatus type
*File: `packages/shared/src/types/booking.ts`*

```typescript
export type BookingStatus =
  | 'pending'              // instant booking submitted, awaiting admin
  | 'confirmed'            // approved and scheduled
  | 'completed'            // job done
  | 'cancelled'            // cancelled by either party
  | 'quote_requested'      // NEW — customer submitted quote request
  | 'quote_sent'           // NEW — contract link sent to customer
  | 'quote_accepted'       // NEW — customer signed; auto-transitions to confirmed
  | 'quote_declined'       // NEW — customer declined or admin marked declined
  | 'quote_expired'        // NEW — priceValidUntil passed without response
  | 'changes_requested'    // NEW — customer requested scope changes
```

### 2. Additional optional fields on existing bookings documents
*Additive only — no breaking changes to existing records*

```typescript
intakeType?: 'instant' | 'quote'    // which pathway created this booking
quoteId?: string                     // reference to quotes/{quoteId}
```

### 3. New 'quotes' collection — complete schema

```
quotes/{quoteId}

  // ── Relationship ─────────────────────────────────────────────
  bookingId: string                  // parent bookings/{bookingId}
  version: number                    // incremented on each revision (starts at 1)
  status:
    | 'draft'
    | 'sent'
    | 'accepted'
    | 'declined'
    | 'expired'
    | 'changes_requested'            // NEW — customer requested changes

  // ── Property Assessment (admin fills after on-site visit) ─────
  assessedSquareFootage: number | null
  assessedCondition: 'excellent' | 'good' | 'fair' | 'poor' | null
  assessedNotes: string              // internal only — never shown to customer
  visitDate: string | null           // YYYY-MM-DD of assessment visit

  // ── Contract Terms ────────────────────────────────────────────
  serviceType: ServiceType
  frequency: Frequency
  agreedPricePerVisit: number        // CAD; auto-updated when optional add-ons selected
  currency: 'CAD'
  startDate: string                  // YYYY-MM-DD — first clean date
  noticePeriodDays: number           // default: 14
  priceValidUntil: string            // YYYY-MM-DD — quote expiry date
  hstIncluded: boolean
  hstRate: number                    // 0.13 for ON; 0.14975 for QC
  hstAmount: number                  // computed: agreedPricePerVisit * hstRate

  // ── Cleaning Scope ────────────────────────────────────────────
  includedRooms: string[]
  excludedRooms: string[]
  includedTasks: string[]            // plain text; bilingual in contract rendering
  excludedTasks: string[]
  addOns: string[]                   // add-ons included at the agreed price
  specialInstructions: string

  // ── Optional Add-Ons (customer selects at signing) ───── [NEW]
  optionalAddOns: Array<{
    id: string
    label_en: string
    label_fr: string
    pricePerVisit: number            // additional CAD per visit if selected
    selected: boolean                // customer toggles at signing
    selectedAt: Date | null
  }>

  // ── Access Details ────────────────────────────────────────────
  accessMethod:
    | 'key_provided'
    | 'lockbox'
    | 'garage_code'
    | 'doorbell'
    | 'other'
  accessCode?: string                // encrypted at rest; admin-only Firestore rule
  accessInstructions: string         // customer-facing (no codes)
  keyReturnPolicy: string

  // ── Deposit ──────────────────────────────────────── [NEW]
  depositRequired: boolean
  depositType: 'fixed' | 'percent'
  depositAmount: number              // CAD (absolute); computed if 'percent'
  depositStatus: 'none' | 'required' | 'collected' | 'refunded'
  depositCollectedAt: Date | null
  stripeDepositPaymentIntentId: string | null
  stripeDepositChargeId: string | null

  // ── Follow-Up Schedule ─────────────────────────── [NEW]
  quoteFollowUpSchedule: Array<{
    dayOffset: number                // days after sentAt to fire
    channel: 'sms' | 'email'
    sent: boolean
    sentAt: Date | null
  }>
  // Default schedule (set on quote send, overridable in settings/intake):
  //   Day 1  → SMS
  //   Day 3  → Email
  //   Day 6  → SMS (day before default expiry)

  // ── Change Request ─────────────────────────────── [NEW]
  changeRequest: {
    text: string
    requestedAt: Date
  } | null

  // ── Decline Reason ─────────────────────────────── [NEW]
  declineReason: {
    category:
      | 'price_too_high'
      | 'not_proceeding'
      | 'going_with_competitor'
      | 'timing_doesnt_work'
      | 'want_to_discuss_changes'
      | 'other'
    detail: string | null            // free text for 'other' or additional context
  } | null

  // ── Digital Signing ───────────────────────────────────────────
  signingToken: string               // UUID; single-use; invalidated on acceptance
  signingTokenUsed: boolean
  contractSignedByName: string | null
  contractSignedAt: Date | null

  // ── Communication ─────────────────────────────────────────────
  language: 'en' | 'fr'
  sentAt: Date | null
  acceptedAt: Date | null
  declinedAt: Date | null

  // ── Metadata ──────────────────────────────────────────────────
  createdAt: Date
  createdBy: string                  // admin email
  updatedAt: Date
```

### 4. New 'settings' collection — complete schema

```
settings/intake
  instantBookingServices: string[]   // service types on instant-book path
  quoteRequiredServices: string[]    // service types requiring a quote
  quoteExpiryDays: number            // default: 7
  quoteNoticePeriodDays: number      // default: 14
  defaultDepositPercent: number      // default: 25 (25% of first visit price)  [NEW]
  followUpSchedule: Array<{          // admin-configurable follow-up timing      [NEW]
    dayOffset: number
    channel: 'sms' | 'email'
  }>
  // Default followUpSchedule:
  //   [{ dayOffset: 1, channel: 'sms' }, { dayOffset: 3, channel: 'email' }, { dayOffset: 6, channel: 'sms' }]
  updatedAt: Date
  updatedBy: string
```

---

## Feature 1 — Admin Intake Mode Toggle

**Where:** New "Settings" tab in `AdminPage.tsx`
**Source:** [Product]

The admin controls which services require a quote visit and which allow instant booking. This is a live Firestore read — changes take effect on the public booking form within 60 seconds with no code deploy.

**UI:**
```
Settings → Intake Mode
──────────────────────────────────────────────────────
Service Type           Intake Mode
──────────────────────────────────────────────────────
Standard Cleaning      [●──] Instant Booking
Deep Clean             [●──] Instant Booking
Move-Out Cleaning      [●──] Instant Booking
Post-Construction      [──●] Quote Required
Airbnb Turnover        [●──] Instant Booking
Commercial Cleaning    [──●] Quote Required

Quote expiry:      [7 ] days
Notice period:     [14] days
Default deposit:   [25] % of first visit price

Follow-up schedule (days after quote sent):
  Day [1] → [SMS ▾]
  Day [3] → [Email ▾]
  Day [6] → [SMS ▾]
  [+ Add follow-up]
──────────────────────────────────────────────────────
```

**Key tasks:**
- New `IntakeModeSettings` component in `apps/customer/src/components/admin/`
- New "Settings" tab added to `AdminPage.tsx` tab bar
- Reads and writes `settings/intake` document via TanStack Query
- Toggle rows for each service type; editable number fields for expiry, notice period, deposit
- Follow-up schedule builder: add/remove rows, set day offset and channel per row
- On any change: write to `settings/intake` and log audit entry via `onSettingsUpdated` Cloud Function
- `BookingPage.tsx` subscribes to `settings/intake` on mount (TanStack Query, `staleTime: 60s`)

**Acceptance criteria:**
- Lauren can toggle any service type between modes in under 30 seconds
- Change propagates to `/booking` form within 60 seconds (verified via Playwright)
- Every settings change writes an audit log entry with `adminEmail` and `timestamp`
- Follow-up schedule changes are reflected in the next quote sent after the change

---

## Feature 2 — Public Quote Request Form

**Route:** `/quote` (new, distinct from `/booking`)
**Source:** [Product]

A 2-step form for prospective customers. Shorter and simpler than the booking form: no date picker, no price shown, no payment. The goal is getting enough information for Lauren to schedule an assessment visit.

**Step 1 — Property & Service:**
- Service type (same radio card UI as `BookingStep1`)
- Property type selector
- Bedrooms / bathrooms (required for scheduling estimate)
- Square footage (optional — helpful for commercial)
- Pets toggle
- Preferred frequency (weekly / biweekly / monthly / one-time assessment)
- Special considerations textarea (condition concerns, specific areas, etc.)

**Step 2 — Contact & Visit Preferences:**
- First name, last name, email, phone, full address
- Preferred visit window: Morning (8am–12pm) / Afternoon (12pm–5pm) / Evening (5pm–7pm)
- Preferred visit days: multi-select checkbox (Mon–Sun)
- Notes / additional context
- Language preference (EN/FR)
- Marketing consent checkbox (off by default, CASL-compliant)

**On submit:**
- Create `bookings` document: `status: 'quote_requested'`, `intakeType: 'quote'`, `preferredDate: ''` (empty string, not null — passes Firestore rule)
- Create `quotes` document: `status: 'draft'`, linked via `bookingId`
- Fire `onQuoteRequested` Cloud Function: send owner notification email + customer acknowledgement email/SMS
- Navigate to `/quote-thank-you`

**Booking form mode gate:**
- `BookingPage.tsx` reads `settings/intake` via TanStack Query on mount
- If the selected `serviceType` is in `quoteRequiredServices`, the "Next" button on Step 1 is replaced with "Request a Free Quote →"
- Clicking navigates to `/quote?service={type}&property={type}` with pre-population

**Key tasks:**
- `QuoteRequestPage` component — 2-step form with `useForm` + Zod schema (`quoteRequestSchema`)
- `QuoteThankYouPage` component
- Add routes `/quote` and `/quote-thank-you` to `App.tsx`
- `quoteRequestSchema.ts`: all required fields, `preferredDate` field absent, `visitWindow` and `visitDays` fields added
- `submitQuoteRequest()` function in `firestore.ts` — creates both `bookings` and `quotes` documents in a single Firestore transaction
- `BookingPage.tsx` mode-gate: reads `settings/intake`, conditionally renders "Request a Quote" on Step 1
- All strings in `en.json` and `fr.json` — Linguistic_Auditor sign-off required

---

## Feature 3 — Admin Quote Workspace

**Where:** New "Quotes" sub-tab within admin Bookings panel
**Source:** [Product]

The Quote Workspace is the admin's primary tool for managing the full quote lifecycle after a customer submits a request. It has two parts: a Queue view and a WorkspaceModal.

### Quote Request Queue

A filtered view of bookings with `status: 'quote_requested'` or `status: 'changes_requested'`.

Columns: customer name, address, service type, submitted date, preferred visit window, preferred visit days, current status badge.

Action buttons per row:
- **Schedule Visit** — opens `QuoteWorkspaceModal` (new quote)
- **Open Workspace** — opens `QuoteWorkspaceModal` (existing draft)

Status badges:
- `quote_requested` → "Assessment Needed" (amber)
- `changes_requested` → "Changes Requested" (blue — customer has responded)
- `quote_sent` → "Awaiting Signature" (slate-brand)
- `quote_accepted` → "Signed" (green)
- `quote_declined` → "Declined" (red)
- `quote_expired` → "Expired" (grey)

### QuoteWorkspaceModal (5 tabs)

*Note: v1.0 had 4 tabs. Tab 3 (Cleaning Scope) gains the optional add-ons section from Gap 6.*

**Change request banner** *(shown when `status: 'changes_requested'`)*:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚡ Customer requested changes                                │
│ "[customer's change request text]"                          │
│ Requested: [date] | [Dismiss after revision]                │
└─────────────────────────────────────────────────────────────┘
```

**Tab 1: Property Assessment**
- Square footage input
- Condition rating: Excellent / Good / Fair / Poor
- Assessment notes (internal — never shown to customer)
- Visit date picker
- Photo upload (optional, stored in Firebase Storage `assessments/{quoteId}/`)

**Tab 2: Quote Terms**
- Service type (pre-populated from quote request, editable)
- Frequency (pre-populated, editable)
- Agreed price per visit (CAD number input — clear label: "Base price, excluding optional add-ons")
- HST province selector (Ontario 13% / Quebec 14.975% / Other)
- HST included toggle
- Computed HST display: "HST: $X.XX → Total per visit: $XX.XX"
- Price valid until (date picker; defaults to today + `settings/intake.quoteExpiryDays`)
- Notice period (number input; defaults to `settings/intake.quoteNoticePeriodDays`)
- Start date (first clean date)
- **Deposit section** *(new from Gap 2)*:
  - "Require deposit at signing" toggle
  - Deposit type: Fixed ($) / Percentage (%)
  - Deposit amount / percentage input
  - Computed display: "Customer pays $X.XX at signing"
  - Override of `settings/intake.defaultDepositPercent`

**Tab 3: Cleaning Scope**
- Included rooms (multi-select chips: Kitchen, Living Room, Bedrooms, Bathrooms, Office, Common Areas, etc.)
- Excluded rooms (multi-select chips: Basement, Garage, Server Room, etc.)
- Included tasks (text input + preset chip library: Vacuuming & Mopping, Countertops, etc.)
- Excluded tasks (text input + presets)
- Add-ons included at base price (multi-select from `bookingSchema` add-on list)
- Special instructions (textarea — appears verbatim in the contract)
- **Optional add-ons section** *(new from Gap 6)*:
  - "Add optional upgrades for customer to select at signing"
  - Each optional add-on: EN label, FR label, additional price per visit
  - [+ Add Optional Add-On] button
  - Preview of how optional add-ons will appear to the customer

**Tab 4: Access Details**
- Access method: Key Provided / Lockbox / Garage Code / Doorbell / Other
- Access code (masked input; encrypted in Firestore; admin-only Firestore rule)
- Customer-facing access instructions (shown to customer in contract; does NOT include the code)
- Key return policy (default: "Key held securely by Fresh Nest Co.")

**Tab 5: Preview & Send**
*(Replaces the removed PDF generation; now renders the contract directly in the modal)*
- Full contract preview rendered from Firestore data (same layout as `/sign-contract/:token`)
- "Print Preview" button: `window.print()` with `@media print` CSS
- "Download PDF" button: `react-to-print` → browser-native PDF
- Contract checklist (all required sections filled indicator)
- "Save Draft" button
- "Send Contract" button — disabled until all required tabs are complete

**Additional admin actions on existing quote bookings (in `BookingDetailPanel`):**
- **Reschedule Assessment** — updates `visitDate` on the quote
- **Revise Quote** — increments `version`, generates new `signingToken`, clears `signingTokenUsed`, returns to `status: 'draft'`; previous token is invalidated
- **Mark Declined** — admin-initiated decline with reason (logged to `auditLog`)
- **Convert to Booking** — bypasses signing; sets `status: 'confirmed'` directly with `createdBy` audit trail; useful when customer verbally confirms
- **Extend Quote** — extends `priceValidUntil` by 7 days and re-sends the contract link
- **View Signing Page** — opens `/sign-contract/{token}` in a new tab (admin preview)

---

## Feature 4 — Contract Signing Page (Web-First)

**Route:** `/sign-contract/:token` (new public route, no auth required)
**Source:** [Product] + Gap 3 (PDF architecture), Gap 4 (change requests), Gap 5 (decline capture), Gap 6 (optional add-ons)

**This is the legally binding signing experience.** The Firestore record (with `contractSignedByName`, `contractSignedAt`, `signingToken`, and `signingTokenUsed: true`) is the authoritative record of acceptance. The `/sign-contract/:token` page is also the printable contract — no server-side PDF required.

### Token validation (on page load)

The page calls a Cloud Function `validateSigningToken` on load:
- Reads the `quotes` document where `signingToken == token`
- Returns: valid (with contract data) | expired | already_used | not_found

If expired: show expiry message with phone and email contact.
If already used: show "This agreement has already been signed" message.
If not found: show generic error with contact details.

### Page sections (in order)

**1. Header**
```
Fresh Nest Co. — Service Agreement
─────────────────────────────────────────────────────
Prepared for: [firstName] [lastName]
Address: [address]
Agreement version: [version]  |  Valid until: [priceValidUntil]
```

**2. Service Summary**
- Service type, frequency, start date
- Agreed price per visit (base price)
- Notice period
- HST breakdown

**3. Cleaning Scope**
- Included rooms (bulleted list)
- Excluded rooms (bulleted list)
- Included tasks
- Excluded tasks
- Special instructions
- Base add-ons (included in agreed price)

**4. Optional Add-Ons** *(new from Gap 6)*
```
Enhance Your Service (Optional)
──────────────────────────────────────────────────
□  Inside Oven Cleaning      + $12.00 per visit
□  Inside Fridge Cleaning    + $10.00 per visit
□  Laundry (wash + fold)     + $25.00 per visit

Select any to add to your agreement. Your price
per visit will be updated automatically below.
──────────────────────────────────────────────────
```
When checkboxes change, the "Agreed Price Per Visit" display updates in real time (client-side calculation — no Firestore write until submission).

**5. Access Details**
- Access method
- Customer-facing access instructions (NO access code displayed)
- Key return policy

**6. Contract Terms**
- Notice period
- Payment terms (deposit amount if `depositRequired`)
- PIPEDA acknowledgement
- Jurisdiction (Ontario / Quebec as applicable)
- Cancellation policy

**7. Deposit Section** *(shown when `depositRequired == true`, new from Gap 2)*
```
Deposit Required to Confirm
────────────────────────────────
A deposit of $[depositAmount] is required to confirm
your service agreement. Your deposit will be applied
to your first invoice.

[Stripe PaymentElement renders here]
────────────────────────────────
```

**8. Signature Block**
```
By signing below, you agree to the Fresh Nest Co.
Service Agreement as described above.

Full name (type to sign): [__________________________]

☐  I have read and agree to the terms of this
   service agreement.

[Sign & Pay Deposit]  or  [Sign & Confirm]  (button text is conditional)
```

**9. Action Buttons**
- Primary: "Sign & Pay Deposit" (if deposit required) or "Sign & Confirm" (if no deposit)
- Secondary: "Request Changes" → reveals change request textarea
- Tertiary: "Decline this Quote" → reveals structured decline form
- Footer: "Download for your records" (print-to-PDF via `@media print`)

### On "Sign & Confirm" (no deposit path)

1. Validate: name field non-empty, consent checkbox checked
2. Call `onQuoteAccepted` Cloud Function with `{ quoteId, signedByName, selectedAddOns }`
3. Cloud Function atomically:
   - Updates `quotes`: `status → 'accepted'`, `acceptedAt`, `signingTokenUsed: true`, `contractSignedByName`, `optionalAddOns[].selected`, recalculates `agreedPricePerVisit`
   - Updates `bookings`: `status → 'quote_accepted'`, `contractSignedAt`
   - Triggers `onBookingStatusConfirmed` (existing pipeline) → creates Job document
   - Sends confirmation email + owner SMS
   - Generates referral code if not already present
4. Customer lands on `/quote-confirmed` page

### On "Sign & Pay Deposit" (deposit path — requires P3-E1 complete)

1. Validate: name field non-empty, consent checkbox checked, Stripe `PaymentElement` is complete
2. Stripe `confirmPayment()` → on success:
3. Call `onQuoteAccepted` Cloud Function with `{ quoteId, signedByName, selectedAddOns, stripePaymentIntentId }`
4. Same Cloud Function flow as above, plus: `depositStatus → 'collected'`, `depositCollectedAt`, `stripeDepositPaymentIntentId`
5. **If Stripe fails**: no Firestore writes, no status transition — error surfaces as `role="alert"` on the signing page

### On "Request Changes" (Gap 4)

1. Reveal textarea: "Describe the changes you'd like to make to this agreement"
2. Submit writes `changeRequest: { text, requestedAt }` to `quotes` document
3. Sets `status → 'changes_requested'`; all follow-up messages pause automatically
4. Fires `onQuoteChangeRequested`: admin email + SMS with request text and direct link to `QuoteWorkspaceModal`
5. Page confirms: "Your request has been sent. Lauren will be in touch within 1 business day."
6. Signing token is NOT invalidated — it can still be used once the revised quote is sent

### On "Decline this Quote" (Gap 5)

1. Reveal structured form:
```
Why are you declining?
○ Price is too high
○ I've decided not to proceed with cleaning services
○ Going with another provider
○ The timing doesn't work for me
○ I'd like to discuss changes first → [redirects to Request Changes]
○ Other: [text input]
```
2. Submit writes `declineReason: { category, detail }` to `quotes` document
3. Sets `status → 'declined'`; updates `bookings.status → 'quote_declined'`; sets `declinedAt`
4. All follow-up messages stop immediately
5. Fires `onQuoteDeclined`: admin email notification (no SMS — would feel like badgering)
6. Page shows: "Thank you for letting us know. We appreciate you considering Fresh Nest Co."

### CSS Print Stylesheet

A `@media print` block makes the signing page print beautifully as a PDF. Print styles:
- Remove navigation, action buttons, Stripe element
- Show full company letterhead (Fresh Nest Co. name, address, phone, email)
- Show signature block with typed name and signed date
- Show contract reference number (`quoteId`) and version number
- All sections render in print order without scroll

---

## Feature 5 — Automated Follow-Up Sequence

**Source:** Gap 1 (Critical — industry standard on all FSM platforms)

When a contract is sent (`status → 'quote_sent'`), follow-up messages fire automatically at configured intervals if the quote has not been responded to. This is the highest-leverage feature for quote close rates.

### Follow-up schedule (default — admin-configurable in `settings/intake`)

| Day offset | Channel | Template | Stop condition |
|---|---|---|---|
| Day 1 | SMS | `quoteFollowUpSms` | Any status change |
| Day 3 | Email | `quoteFollowUpEmail` | Any status change |
| Day 6 | SMS | `quoteFollowUpSms` | Any status change |

Follow-ups stop automatically the moment `status` changes from `quote_sent` to any other value: `accepted`, `declined`, `changes_requested`, `expired`.

### Cloud Function: `onQuoteFollowUpCheck` (scheduled, every 2 hours)

```
1. Query quotes where:
     status == 'quote_sent'
     AND signingTokenUsed == false
     AND priceValidUntil > today

2. For each quote, iterate quoteFollowUpSchedule:
     For each entry where:
       sent == false
       AND sentAt == null
       AND (sentAt_of_quote + dayOffset * 86400s) <= now
     → Send communication on specified channel
     → Write sentAt: Timestamp.now(), sent: true to that entry

3. If any follow-up fires: log to structured Cloud Logging
```

### Follow-Up Templates

**`quoteFollowUpSms`** (EN):
```
Hi [firstName], just checking in — your Fresh Nest Co. service agreement is still
waiting for your signature. Review and sign here: [signingPageUrl]
Questions? Call us: (613) 935-3555
```

**`quoteFollowUpSms`** (FR):
```
Bonjour [firstName], votre entente de service Fresh Nest Co. attend toujours votre
signature : [signingPageUrl]
Questions? Appelez-nous : (613) 935-3555
```

**`quoteFollowUpEmail`** (EN/FR): Branded email with:
- "Your service agreement is waiting" subject
- Summary of agreed service, price, and start date
- Prominent "Review & Sign Agreement" CTA button → signing page URL
- Expiry date reminder
- Phone number and direct email contact
- CASL-compliant unsubscribe link

### Anti-spam protection

- Maximum 3 follow-up messages total (matches the default schedule; configurable up to 5)
- The 3rd follow-up on Day 6 is the last automated contact before expiry on Day 7
- No follow-up fires after `priceValidUntil` — expired quotes do not receive follow-up messages
- Industry best practice: switch to a phone call for high-value commercial quotes — note this in admin guidance

---

## Feature 6 — Quote Expiry & Decline Automation

**Source:** [Product] + Gap 5 (structured decline capture)

### Cloud Function: `onQuoteExpiryCheck` (scheduled, daily at 7am UTC)

```
1. Query quotes where:
     status == 'quote_sent' OR status == 'changes_requested'
     AND priceValidUntil < today

2. For each expired quote:
     Set quotes.status → 'expired'
     Set bookings.status → 'quote_expired'
     Send quoteExpired email to customer (EN/FR)
     Log to auditLog

3. Stop all follow-up messages for expired quotes
   (onQuoteFollowUpCheck already checks priceValidUntil)
```

### Cloud Function: `onQuoteDeclined` (Firestore trigger — quotes status → 'declined')

```
1. Send admin email notification:
   "Quote declined: [customerName] — [serviceType]
    Reason: [declineReason.category]
    Detail: [declineReason.detail]
    Quote link: [admin QuoteWorkspaceModal URL]"

2. Update bookings.status → 'quote_declined'

3. Log to auditLog with declineReason

4. Do NOT send admin SMS — email is sufficient for a decline
```

---

## Feature 7 — Quote Pipeline Analytics

**Source:** Gap 7 (Significant — required for system tuning)

### `getAnalyticsKPIs` extension

Add `quoteMetrics` to the Cloud Function payload (cached with same 1-hour TTL as existing analytics):

```typescript
quoteMetrics: {
  totalQuoteRequests: number         // all quote_requested bookings
  totalQuotesSent: number            // quotes where sentAt != null
  totalQuotesAccepted: number        // quotes where status == 'accepted'
  totalQuotesDeclined: number        // quotes where status == 'declined'
  totalQuotesExpired: number         // quotes where status == 'expired'
  totalChangeRequests: number        // quotes that had changes_requested at any point
  winRate: number                    // accepted / sent (percentage)
  avgDaysToAcceptance: number        // avg (acceptedAt - sentAt) in days
  avgDaysToDecline: number           // avg (declinedAt - sentAt) in days
  followUpImpact: {
    acceptedWithNoFollowUp: number   // accepted before day-1 follow-up
    acceptedAfterFollowUp: number    // accepted after at least one follow-up
  }
  declineReasonBreakdown: Array<{
    category: string
    count: number
    percentage: number
  }>
  conversionByServiceType: Array<{
    serviceType: string
    sent: number
    accepted: number
    declined: number
    expired: number
    winRate: number
  }>
}
```

### Admin Analytics — "Quotes" sub-tab

New sub-tab in the admin Analytics panel, alongside the existing "Marketing" and "Operations" tabs:

**Section 1: Pipeline KPIs** (4 stat cards)
- Quotes Sent | Win Rate | Avg Days to Sign | Total Revenue (accepted quotes × agreedPricePerVisit × 12)

**Section 2: Conversion Funnel** (horizontal bar chart via Recharts)
- Requested → Sent → Accepted → (Declined / Expired)

**Section 3: Conversion by Service Type** (table)
- Service type | Sent | Accepted | Win rate — sortable

**Section 4: Decline Reason Breakdown** (pie chart via Recharts)
- Decline categories with counts and percentages

**Section 5: Follow-Up Impact** (two-stat card)
- "Accepted without follow-up: X | Accepted after follow-up: Y"
- Demonstrates ROI of the automated follow-up sequence

---

## Feature 8 — Customer Portal Integration

**Source:** [Product]

### CustomerBookingsPage / CustomerUpcomingPage

**When `intakeType === 'quote'` and `status === 'quote_sent'` or `status === 'changes_requested'`:**
```
┌──────────────────────────────────────────────────────────────┐
│ ✍  Your service agreement is ready to review                 │
│ Sign by [priceValidUntil date] · [serviceType] · [frequency] │
│ Agreed price: $[agreedPricePerVisit] + HST per visit         │
│                                                              │
│         [Review & Sign Agreement →]                          │
└──────────────────────────────────────────────────────────────┘
```
If `status === 'changes_requested'`: banner text changes to "Your change request was received. Lauren will be in touch within 1 business day."

**When `intakeType === 'quote'` and `status === 'quote_accepted'` or `'confirmed'`:**
- "Service Agreement" collapsible section in the booking detail card
- Shows: agreed price, frequency, start date, notice period, optional add-ons selected
- "Download Agreement" button → opens `/sign-contract/{token}` in a new tab (the print-ready version)
- "Print" button → triggers `window.print()` on the signing page

**When `intakeType === 'quote'` and `status === 'quote_expired'` or `'quote_declined'`:**
- Muted card: "This quote is no longer active."
- "Request a New Assessment" button → links to `/quote?service={serviceType}`

---

## All Cloud Functions

| Function | Trigger | Purpose | Priority |
|---|---|---|---|
| `onQuoteRequested` | `onDocumentCreated` on `bookings` where `intakeType == 'quote'` | Owner notification + customer acknowledgement email/SMS | Ship |
| `onQuoteSent` | `onDocumentUpdated` on `quotes` where `status → 'sent'` | Build follow-up schedule from `settings/intake`; set `quoteFollowUpSchedule` on the quotes document | Ship |
| `onQuoteFollowUpCheck` | Scheduled — every 2 hours | Fire follow-up SMS/email for unanswered quotes per schedule | Ship |
| `onQuoteExpiryCheck` | Scheduled — daily 7am UTC | Expire overdue quotes; notify customers; update booking status | Ship |
| `validateSigningToken` | `onCall` (public) | Validate token on signing page load; return contract data or error | Ship |
| `onQuoteAccepted` | `onCall` (signing page) | Atomic: update quotes + bookings, create Job, send confirmation, generate referral code | Ship |
| `onQuoteChangeRequested` | `onDocumentUpdated` on `quotes` where `changeRequest` is set | Notify admin via email + SMS with change request text | Ship |
| `onQuoteDeclined` | `onDocumentUpdated` on `quotes` where `status → 'declined'` | Notify admin via email; update booking; stop follow-ups | Ship |
| `onSettingsUpdated` | `onDocumentUpdated` on `settings/intake` | Write audit log entry | Ship |
| ~~`generateQuoteContract`~~ | ~~`onCall` (admin)~~ | ~~Server-side PDF generation~~ | **Removed — replaced by CSS print** |

**Total: 9 Cloud Functions** (was 6 in v1.0; `generateQuoteContract` removed)

---

## All Email & SMS Templates

| Template | Languages | Trigger | Content |
|---|---|---|---|
| `quoteRequestedOwner` | EN | `onQuoteRequested` | Customer details, service type, preferred visit window, address |
| `quoteRequestedClient` | EN + FR | `onQuoteRequested` | "Received your request; we'll call within 1 business day" |
| `quoteContractSent` | EN + FR | `onQuoteSent` | Signing CTA button (prominent), agreed price summary, expiry date, phone contact |
| `quoteFollowUpSms` | EN + FR | `onQuoteFollowUpCheck` | Short: "Your agreement is waiting to be signed. [URL]" |
| `quoteFollowUpEmail` | EN + FR | `onQuoteFollowUpCheck` | Branded: agreed price, service summary, CTA button, expiry date, contact |
| `quoteAccepted` | EN + FR | `onQuoteAccepted` | "Signed. First clean: [date]. Price: $X/visit. Deposit: $X collected." + signing page link for records |
| `quoteChangeRequested` | EN (admin only) | `onQuoteChangeRequested` | Customer name, change request text, direct link to QuoteWorkspaceModal |
| `quoteDeclinedAdmin` | EN (admin only) | `onQuoteDeclined` | Customer name, decline reason, service type, link to QuoteWorkspaceModal |
| `quoteExpired` | EN + FR | `onQuoteExpiryCheck` | "Quote expired. Contact us for a new assessment." + phone and email |
| `quoteRevised` | EN + FR | Admin action "Revise Quote" | "We've updated your quote. Review the new terms." + new signing link |

**Total: 10 templates** (16 language variants) — was 6 in v1.0

---

## Firestore Security Rules (Complete)

```javascript
// ── New: quotes collection ────────────────────────────────────────────────
match /quotes/{quoteId} {
  // Admin: full read/write
  allow read, write: if isAdmin();

  // Public signing page: read allowed with valid unexpired token
  allow read: if
    resource.data.signingToken == request.query.token
    && resource.data.signingTokenUsed == false
    && resource.data.status == 'sent';

  // Customer portal: read own quote (authenticated customer)
  allow read: if
    request.auth != null
    && request.auth.token.email != null
    && get(/databases/$(database)/documents/bookings/
       $(resource.data.bookingId)).data.email == request.auth.token.email;

  // Note: All writes to quotes from the signing page go through
  // the onQuoteAccepted, onQuoteChangeRequested, onQuoteDeclined
  // Cloud Functions (server-side, bypasses rules).
  // Direct client writes to quotes are admin-only.
}

// ── Updated: bookings create rule ─────────────────────────────────────────
// Add to the existing public create rule:
// Status: allow 'quote_requested' on public create (alongside 'pending')
&& request.resource.data.status in ['pending', 'quote_requested']

// intakeType: optional field validation
&& (!('intakeType' in request.resource.data)
    || request.resource.data.intakeType in ['instant', 'quote'])

// preferredDate: required for instant booking, optional for quote intake
&& (request.resource.data.intakeType == 'quote'
    ? true
    : (request.resource.data.preferredDate is string
       && request.resource.data.preferredDate.size() == 10))

// ── New: settings collection ──────────────────────────────────────────────
match /settings/{settingId} {
  allow read: if true;         // booking form reads intake mode publicly
  allow write: if isAdmin();
}
```

---

## New Routes & Components

### Routes
| Route | Component | Auth | Purpose |
|---|---|---|---|
| `/quote` | `QuoteRequestPage` | Public | 2-step quote request form |
| `/quote-thank-you` | `QuoteThankYouPage` | Public | Post-submission acknowledgement |
| `/sign-contract/:token` | `ContractSigningPage` | Public (token-gated via Cloud Function) | Contract review, optional add-ons, signature, deposit |
| `/quote-confirmed` | `QuoteConfirmedPage` | Public | Post-signing confirmation |

### New UI Components
| Component | Path | Description |
|---|---|---|
| `QuoteRequestPage` | `pages/` | 2-step quote request form |
| `QuoteThankYouPage` | `pages/` | Post-submission confirmation |
| `ContractSigningPage` | `pages/` | Full contract, optional add-ons, signature, deposit, change/decline |
| `QuoteConfirmedPage` | `pages/` | Post-signing confirmation |
| `IntakeModeSettings` | `components/admin/` | Per-service toggle + follow-up schedule builder |
| `QuoteWorkspaceModal` | `components/admin/` | 5-tab modal: assessment, terms, scope+add-ons, access, preview+send |
| `QuoteContractPreview` | `components/admin/` | Inline contract preview with `react-to-print` |
| `QuoteStatusBadge` | `components/admin/` | Colour-coded badge for all 6 quote statuses |
| `QuoteRequestQueue` | `components/admin/` | Filtered bookings table view for quote management |
| `QuoteAnalyticsDashboard` | `components/admin/` | Win rate, funnel chart, service type table, decline breakdown |

---

## Key Design Decisions (Retained + Updated)

**Web-first contract, PDF-on-demand** *(updated from v1.0)*
The `/sign-contract/:token` page is the legally binding document — the Firestore record with signature and timestamp is the authoritative proof of acceptance. A CSS `@media print` stylesheet makes the page print as a professional-quality PDF on demand. This eliminates a server-side `pdfkit` pipeline, Firebase Storage lifecycle management, bilingual font embedding, and the sync problem between PDF and Firestore. For commercial clients who need a PDF attachment in the confirmation email, the signed Firestore record is converted to a link rather than an attached binary.

**Deposit + signature as a single atomic action**
Inspired by Jobber's "Approve & Pay Deposit" flow. When deposit is required, the Stripe `PaymentElement` and the signature input are both present on the signing page. The "Sign & Pay Deposit" button confirms both in a single Cloud Function call. If Stripe fails, no Firestore status transition occurs — no partial acceptance state is possible.

**Follow-up schedule stored on the quote document, not just settings**
The `quoteFollowUpSchedule` array is written to each `quotes` document at send time (copied from `settings/intake.followUpSchedule`). This means: (a) if admin changes the settings, in-flight quotes keep their original schedule; (b) the scheduler only needs to read the `quotes` collection (no join with settings); (c) each entry tracks its own `sent` and `sentAt` state.

**Optional add-ons update `agreedPricePerVisit` at signing**
When the customer selects optional add-ons on the signing page, the price display updates client-side instantly. The `onQuoteAccepted` Cloud Function receives the final selection and recalculates `agreedPricePerVisit` server-side before committing to Firestore — ensuring no client-side manipulation can set an arbitrary price.

**Signing token not invalidated on change request**
When a customer requests changes, the existing signing token remains valid. If Lauren revises and re-sends, she increments `version` and generates a new token — the old one is implicitly superseded. This simplifies the state machine and means Lauren controls when a new signing link is issued.

**`changes_requested` lives on the `quotes` document, not `bookings`**
The `bookings.status` enum is kept clean for the FSM pipeline. Change requests are a quote-layer concept — the booking itself is still in `quote_sent` from a scheduling perspective. This avoids complicating the Cloud Function triggers that watch `bookings.status`.

---

## Complexity & Dependencies

**Complexity: XL** (maintained from v1.0; scope redistributed as per gap analysis)

**Dependencies:**
| Dependency | Why |
|---|---|
| P3-E1 Stripe complete | Deposit collection at signing requires Stripe `PaymentElement`; quote system can ship without deposit if Stripe is delayed (toggled off per quote) |
| P3-E3 Admin Booking Creation complete | `QuoteWorkspaceModal` shares UI patterns and the TanStack Query data layer with `AdminBookingModal` |
| P3-E18 Shared Types complete | `BookingStatus` expanded to 10 values; must be updated in `packages/shared/src/types/booking.ts` |
| P3-E19 Cloud Functions Domain Split complete | 9 new Cloud Functions slot into `functions/src/triggers/quote.ts` and `functions/src/scheduled/` cleanly |

**ADR required before build starts:**
- `docs/decisions/ADR-XXX-quote-first-system.md` — documents all decisions above, especially the web-first PDF approach and the deposit-at-signing model

---

## Acceptance Criteria (Complete)

### Admin intake toggle
- Lauren toggles any service type in under 30 seconds
- Change propagates to `/booking` form within 60 seconds (Playwright test: toggle → verify form gate)
- Every settings change writes an audit log entry with `adminEmail` and `timestamp`
- Follow-up schedule changes are reflected in the next quote sent

### Quote request
- Customer completes `/quote` in under 3 minutes (2 steps, no payment, no date)
- Owner notification email arrives within 60 seconds
- Customer acknowledgement email/SMS arrives within 60 seconds
- Quote request appears in admin queue with `status: 'quote_requested'`

### Quote workspace
- Admin fills all 5 tabs and sends a contract in under 5 minutes
- Contract preview renders identically to `/sign-contract/:token` page
- "Send Contract" is disabled until all required fields on all tabs are populated
- Deposit field correctly computes from percentage and updates in real time

### Follow-up sequence
- First follow-up SMS fires within 26 hours of `quote_sent` (24h offset + 2h scheduler window)
- Follow-up sequence stops within 2 hours of any status change from `quote_sent`
- Admin can update follow-up schedule in Settings and the change applies to future quotes only
- No follow-up fires for expired quotes

### Contract signing page
- Page loads in under 3 seconds on mobile (P3 Margaret, P6 Gallagher on-site)
- Token validation fails gracefully for expired or used tokens (correct message shown)
- Optional add-ons update the price display in real time without a page reload
- "Download for your records" renders a clean, letterhead-quality PDF via `@media print`
- Customer types name, checks consent, and completes signing in under 2 minutes

### Deposit (when Stripe is live)
- "Sign & Pay Deposit" button captures payment and signature atomically
- Stripe payment failure keeps quote in `quote_sent` — no partial acceptance
- Deposit amount appears in the contract price summary and in the confirmation email

### Change request
- "Request Changes" sends admin notification within 60 seconds
- Quote status changes to `changes_requested` and follow-up messages pause
- Admin sees change request text as a banner at the top of `QuoteWorkspaceModal`
- Revised quote generates a new signing token; old token does not accept signatures

### Decline
- Customer decline reason form submits and sets `status: 'declined'` within 30 seconds
- Admin receives email notification with decline reason within 60 seconds
- Follow-up sequence stops immediately on decline
- "I'd like to discuss changes first" option redirects to the change request flow

### Quote acceptance → booking
- On signing: `bookings.status` transitions to `quote_accepted` within 30 seconds
- Job document created automatically via existing `onBookingStatusConfirmed` pipeline
- Confirmation email (EN/FR) sends within 60 seconds, includes signing page URL for records
- Owner SMS notification fires within 60 seconds
- `referralCode` generated and emailed (if not already exists)

### Customer portal
- Customer with `status: 'quote_sent'` sees the sign-agreement banner immediately on login
- Customer with accepted contract can open signing page from portal to print/download

### Quote expiry
- Expired quotes notify customer in their preferred language
- Expired quotes show `status: 'quote_expired'` in admin queue
- "Request a New Assessment" link in the portal re-opens the `/quote` form

### Analytics
- "Quotes" sub-tab visible in admin Analytics dashboard
- Win rate, avg days to acceptance, conversion by service type all populate within 1 hour of first quote being sent
- Decline reason breakdown shows after first decline is recorded

### Bilingual
- `/quote`, `/quote-thank-you`, `/sign-contract/:token`, `/quote-confirmed` pass Linguistic_Auditor (all strings in `t()`)
- Print-to-PDF renders in customer's language (`html[lang]` switches before print)
- All 10 email/SMS templates pass Linguistic_Auditor

### Compliance
- Access codes are admin-only (Firestore rules verified by rules emulator test)
- PIPEDA acknowledgement visible on signing page
- Signing event logged to `auditLog` with customer name, timestamp, IP (from Cloud Function context)
- Deposit collected only when Stripe `PaymentIntent` status is `succeeded`

---

## Internal Build Sequence

The epic is built in 12 stages. The first stage is non-negotiable — the ADR must precede all code.

| Stage | Task | Complexity | Prerequisite |
|---|---|---|---|
| 0 | Write and approve ADR — web-first PDF, deposit model, token design | S | None — must be first |
| 1 | `settings` collection + `IntakeModeSettings` admin toggle UI | S | ADR approved |
| 2 | `quoteRequestSchema.ts` + `submitQuoteRequest()` in `firestore.ts` | S | Stage 1 |
| 3 | `QuoteRequestPage` (2-step form) + `/quote-thank-you` + routes in `App.tsx` | M | Stage 2 |
| 4 | `BookingPage.tsx` mode-awareness gate (reads `settings/intake`) | S | Stage 1 |
| 5 | `onQuoteRequested` Cloud Function + `quoteRequestedOwner` + `quoteRequestedClient` templates | S | Stage 3 |
| 6 | `QuoteWorkspaceModal` — all 5 tabs + `QuoteRequestQueue` admin view | L | Stage 1 |
| 7 | `onQuoteSent` Cloud Function + follow-up schedule write + `quoteContractSent` email template | M | Stage 6 |
| 8 | `onQuoteFollowUpCheck` scheduled function + `quoteFollowUpSms` + `quoteFollowUpEmail` templates | M | Stage 7 |
| 9 | `ContractSigningPage` with CSS print stylesheet + `validateSigningToken` Cloud Function | L | Stage 6 |
| 10 | `onQuoteAccepted` Cloud Function (atomic: quotes + bookings + job + referral + confirmation) | M | Stage 9 |
| 11 | Change request, decline capture, and expiry flows on signing page + Cloud Functions | M | Stage 9 |
| 12 | Customer portal integration + `QuoteAnalyticsDashboard` + `getAnalyticsKPIs` extension | M | Stage 10 |
| 13 | Deposit via Stripe `PaymentElement` on signing page | M | Stage 10 + P3-E1 |
| 14 | Firestore rules update + rules emulator tests for all new collections and status transitions | M | Stage 13 |

---

## Phase 4 Backlog (Out of P3-E26 Scope)

| Item | Description | Trigger |
|---|---|---|
| Assessment visit in Dispatch Board | `assessments/{id}` Firestore collection; assessment visits appear as distinct cards in the DispatchBoard | After 10+ assessments are being conducted monthly |
| Mobile on-site quote builder | `QuoteBuilderPage` in `apps/fsm` — Tabs 1 and 2 of QuoteWorkspaceModal, mobile-optimised, auto-saves draft | After the desktop quote flow is stable for 2+ months |
| Re-engagement automation | `quoteWinBack` email 90 days after a decline (unless customer has since become active) | After Gap 1 follow-up infrastructure is confirmed working |
| Quote template library | `quoteTemplates` collection; admin saves any quote as a named template; "Load Template" in QuoteWorkspaceModal | After 3–5 commercial contracts are signed and patterns emerge |

