# E20 — /services/airbnb-turnover · Phase A Plan

**Epic:** E20  
**Route:** `/services/airbnb-turnover`  
**Primary Persona:** P6 — Patricia & Dean Gallagher (Airbnb host, South Glengarry)  
**Priority:** P0  
**Phase:** 3 — Booking Engine  
**Dependencies:** All satisfied ✅ (E07 ✅, E15 ✅, E16 ✅)  
**Plan Date:** 2026-06-08  
**Status:** AWAITING HUMAN APPROVAL

---

## Persona Context

P6 Gallagher manages a waterfront Airbnb on the St. Lawrence. Their core fears:
- Services that cannot commit to same-day availability
- No photo documentation (liability exposure)
- Last-minute cancellations
- Being treated like a residential client

Their quote: *"I don't need the cheapest. I need the most reliable."*

### P6 Acceptance Test (Pass/Fail Gate for Phase C)
1. `/services/airbnb-turnover` page exists and loads without error
2. Page uses Airbnb host language throughout (not residential cleaning copy)
3. The **11am–3pm turnover window** is explicitly stated
4. **Linen changeover** is listed as an included service item
5. **Damage photo documentation** is listed as an included deliverable
6. A **commercial inquiry form** is present and distinct from the standard residential booking form
7. **Priority scheduling** or commercial account option is mentioned

---

## Decisions Log (from /grill-me interview, 2026-06-08)

| # | Decision | Chosen |
|---|---|---|
| D1 | Dependency gate | E07 already ✅ — build now |
| D2 | Form type | Dedicated commercial inquiry form on-page (not a redirect to /booking) |
| D3 | Firestore storage | Reuse existing `bookings` collection — `isAirbnb: true`, `serviceType: 'airbnb'`, `photoConfirmation: true`, commercial fields packed into `notes` |
| D4 | Bilingual scope | Fully bilingual EN/FR at launch — all strings in `en.json` + `fr.json` |
| D5 | Page sections | Hero → What's Included → How It Works (3 steps) → Why Hosts Choose Us → Pricing Teaser → Commercial Inquiry Form |
| D6 | Pricing detail | Static teaser only — "Starting from $X" via `calculateQuote()`, links to /pricing |
| D7 | Hero image | AI-generated professional Airbnb-ready waterfront bedroom, brand aesthetic |
| D8 | Form validation | React Hook Form + Zod, consistent with BookingPage pattern |
| D9 | File structure | Single `AirbnbTurnoverPage.tsx` — extract only if >300 lines |
| D10 | Firestore write | Yes — reuse `submitBooking()` from `src/lib/firestore.ts` |
| D11 | Success state | Inline success state replaces the form — no redirect |
| D12 | Animations | Framer Motion `fadeUp` on scroll per section — matches site convention |
| D13 | Form fields | name, email, phone, propertyName, estimatedMonthlyTurnovers, preferredWindow (pre-selected 11am–3pm), notes + CASL checkbox |
| D14 | Trust signals | 3 signals: 40+ turnovers/yr, 11am–3pm guaranteed window, damage photo documentation |
| D15 | Breadcrumb | Simple "← Back to Services" link to /services |

---

## Strategy 1 — Single Strategy (All decisions resolved in interview)

### Files Changed

| File | Action | Notes |
|---|---|---|
| `src/pages/AirbnbTurnoverPage.tsx` | **CREATE** | New page component |
| `src/App.tsx` | **EDIT** | Replace PlaceholderPage at `services/airbnb-turnover` with `<AirbnbTurnoverPage />` |
| `src/i18n/locales/en.json` | **EDIT** | Add `airbnbPage.*` namespace |
| `src/i18n/locales/fr.json` | **EDIT** | Add `airbnbPage.*` namespace (FR) |
| `public/images/airbnb-hero.jpg` | **CREATE** | AI-generated hero image |

### No Schema Changes
The existing `bookings` collection schema is sufficient. `isAirbnb`, `serviceType`, `photoConfirmation`, `notes`, and all required fields already exist in `firestore-schema.md`. No schema update required.

---

## Page Architecture

### Section Map

```
/services/airbnb-turnover
│
├── 1. Hero
│     ├── H1: "Airbnb Turnover Cleaning"
│     ├── Subhead: "Reliable same-day turnovers in the 11am–3pm window."
│     ├── Primary CTA: "Request a Commercial Account" (anchor to form)
│     ├── Secondary link: "← Back to Services" → /services
│     └── Hero image: AI-generated waterfront Airbnb property
│
├── 2. What's Included (checklist)
│     ├── Full property clean (all rooms)
│     ├── Linen and towel changeover
│     ├── Toiletry restocking check
│     ├── Timestamped damage photo documentation
│     ├── Guest-ready staging
│     └── Completed within the 11am–3pm window
│
├── 3. How It Works (3 steps)
│     ├── Step 1: Book Your Window
│     ├── Step 2: We Clean & Document (photos sent same day)
│     └── Step 3: Guests Arrive Ready
│
├── 4. Why Hosts Choose Us (trust signals)
│     ├── Signal A: 40+ turnovers completed annually
│     ├── Signal B: 11am–3pm guaranteed window
│     └── Signal C: 100% photo documentation on every clean
│
├── 5. Pricing Teaser
│     ├── "Starting from $[calculateQuote('1-2bed','airbnb','one-time').min]"
│     ├── "Volume pricing available for 4+ turnovers/month"
│     └── CTA: "See Full Pricing" → /pricing
│
└── 6. Commercial Inquiry Form  (id="inquiry-form")
      ├── firstName, lastName
      ├── email, phone
      ├── propertyName
      ├── estimatedMonthlyTurnovers (number)
      ├── preferredWindow (select, default: "11am-3pm")
      ├── notes (textarea)
      ├── marketingConsent (CASL checkbox, optional)
      ├── Submit → submitBooking() with isAirbnb:true, serviceType:'airbnb',
      │           photoConfirmation:true, notes: structured commercial string
      └── Success state: form replaced with "Thank you, {{name}}. We'll be in touch within 24 hours."
```

---

## Zod Schema

```ts
const airbnbInquirySchema = z.object({
  firstName:                 z.string().min(1),
  lastName:                  z.string().min(1),
  email:                     z.string().email(),
  phone:                     z.string().min(10),
  propertyName:              z.string().min(1),
  estimatedMonthlyTurnovers: z.number().int().min(1).max(100),
  preferredWindow:           z.enum(['11am-3pm', 'flexible', 'morning', 'afternoon']),
  notes:                     z.string().optional(),
  marketingConsent:          z.boolean().optional(),
})
```

---

## Firestore Write Mapping

```ts
// submitBooking() called with:
{
  firstName, lastName, email, phone,
  language: i18n.language,          // 'en' | 'fr'
  propertyType: 'commercial',
  bedrooms: 0,
  bathrooms: 0,
  frequency: 'one-time',
  pets: false,
  address: '',
  serviceType: 'airbnb',
  preferredDate: '',
  isAirbnb: true,
  photoConfirmation: true,
  leadSource: 'organic',
  status: 'pending',
  assignedTo: null,
  notes: `[Commercial Inquiry] Property: ${propertyName} | Turnovers/month: ${estimatedMonthlyTurnovers} | Window: ${preferredWindow} | Notes: ${notes ?? ''}`,
  // marketingConsent: omit field entirely when false (CASL rule — match E16 pattern)
  ...(marketingConsent ? { marketingConsent: true, consentMethod: 'booking-form-v2' } : {}),
}
```

---

## i18n Key Spec — `airbnbPage` namespace

### `en.json`

```json
"airbnbPage": {
  "meta": {
    "title": "Airbnb Turnover Cleaning — Fresh Nest Co.",
    "description": "Same-day Airbnb turnover cleaning in the 11am–3pm window. Linen changeover, damage documentation, and guest-ready staging for St. Lawrence region hosts."
  },
  "hero": {
    "heading":  "Airbnb Turnover Cleaning",
    "subhead":  "Reliable same-day turnovers in the 11am–3pm window. Damage-documented. Guest-ready, every time.",
    "cta":      "Request a Commercial Account",
    "backLink": "← Back to Services"
  },
  "included": {
    "heading": "What's Included in Every Turnover",
    "fullClean":    "Full property clean — all rooms",
    "linen":        "Linen and towel changeover",
    "toiletries":   "Toiletry restocking check",
    "photos":       "Timestamped damage photo documentation",
    "staging":      "Guest-ready staging",
    "window":       "Completed within the 11am–3pm window"
  },
  "howItWorks": {
    "heading": "How It Works",
    "step1Title": "Book Your Window",
    "step1Desc":  "Select your turnover date. We confirm same-day availability within 2 hours.",
    "step2Title": "We Clean & Document",
    "step2Desc":  "Your property is cleaned, staged, and photographed. Photos sent to you same day.",
    "step3Title": "Guests Arrive Ready",
    "step3Desc":  "Check-in happens on schedule. No last-minute scrambles."
  },
  "trust": {
    "heading":    "Why Hosts Choose Fresh Nest",
    "stat1":      "40+",
    "label1":     "Turnovers completed annually",
    "stat2":      "11am–3pm",
    "label2":     "Guaranteed turnover window",
    "stat3":      "100%",
    "label3":     "Damage photo documentation on every clean"
  },
  "pricing": {
    "heading":  "Transparent Turnover Pricing",
    "starting": "Starting from ${{min}} per turnover",
    "volume":   "Volume pricing available for 4+ turnovers per month",
    "cta":      "See Full Pricing"
  },
  "form": {
    "heading":          "Request a Commercial Account",
    "subhead":          "Set up priority scheduling, volume pricing, and documented turnovers for your property.",
    "firstName":        "First Name",
    "lastName":         "Last Name",
    "email":            "Email Address",
    "phone":            "Phone Number",
    "propertyName":     "Property Name or Address",
    "monthlyTurnovers": "Estimated Monthly Turnovers",
    "preferredWindow":  "Preferred Cleaning Window",
    "window11am3pm":    "11am–3pm (standard turnover)",
    "windowFlexible":   "Flexible",
    "windowMorning":    "Morning (before 12pm)",
    "windowAfternoon":  "Afternoon (12pm–5pm)",
    "notes":            "Additional Notes",
    "notesPlaceholder": "Property address, gate codes, linen storage location, or special instructions",
    "consent":          "I agree to receive service updates from Fresh Nest Co. (optional)",
    "submit":           "Submit Inquiry",
    "submitting":       "Submitting…",
    "successHeading":   "Thank you, {{name}}.",
    "successBody":      "We'll review your inquiry and contact you within 24 hours to set up your commercial account."
  }
}
```

*(French `fr.json` keys — same structure, translated in Phase B)*

---

## Persona Impact Analysis

| Persona | Impact | Detail |
|---|---|---|
| **P6 Gallagher** | ✅ Primary | All 7 acceptance criteria addressed |
| P2 Travis | 🟡 Minor | New route visible via Services grid |
| P1 Diane | 🟡 Minor | FR translation at launch |
| P3 Margaret | 🟡 Minor | 48px touch targets, 16px text, WCAG AA enforced |
| P4 Baptiste | — | Not applicable |
| P5 Sophie | — | Not applicable |

---

## Risk Register

| Risk | Mitigation |
|---|---|
| `submitBooking()` type mismatch for commercial defaults | Audit `bookingSchema.ts` before calling; provide all required fields with defaults |
| CASL: `marketingConsent` must be omitted (not `false`) when unchecked | Match the E16 pattern in `BookingStep4.tsx` exactly |
| FR copy quality for commercial Airbnb host language | Linguistic_Auditor subagent review in Phase B |
| Hero image tone mismatch with brand | Generate with explicit brand palette prompt; `warm-white` bg, aspirational waterfront aesthetic |

---

## Phase B Execution Order

1. Generate AI hero image
2. Create `src/pages/AirbnbTurnoverPage.tsx`
3. Add `airbnbPage.*` keys to `en.json` and `fr.json`
4. Update `src/App.tsx` — replace PlaceholderPage
5. Invoke Brand_Auditor
6. Invoke Linguistic_Auditor
7. Run `npm run build && npm run lint` — both must pass
8. Phase C close

---

*Halt. Awaiting human approval before Phase B execution.*
