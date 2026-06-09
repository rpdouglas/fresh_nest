# E22 — Thank You Page · Phase A Plan

**Epic:** E22
**Route:** `/thank-you`
**Primary Personas:** P2 Travis McLeod · P1 Diane Lafleur
**Priority:** P0
**Phase:** 3 — Booking Engine
**Dependencies:** E16 Firestore ✅, E15 Booking Form ✅
**Plan Date:** 2026-06-09
**Status:** AWAITING HUMAN APPROVAL

---

## Persona Context

**P2 Travis** — Wants immediate confirmation he can reference on the job site.
- Needs his name, service, date, and a booking reference visible at a glance
- Quote: *"If I can't see a price and book it in three minutes, I'm moving on."* — same low-friction expectation applies to the confirmation

**P1 Diane** — Needs the entire confirmation experience in French.
- A French-language thank-you page is the final step in her fully bilingual booking journey
- Her confirmation email (E17) is already bilingual — the page must match

### P2 / P1 Acceptance Tests (Phase C Gate)
1. After booking submission, `/thank-you` loads with the client's first name in the heading
2. Service type and preferred date are visible in a booking summary card
3. A booking reference number is displayed
4. "Confirmation sent to [email]" message is visible
5. Three "what happens next" steps are shown
6. All copy appears in French when language is set to FR (P1 gate)
7. If the page is refreshed, a generic confirmation is shown — no crash or broken layout

---

## Approved Strategy — Router State Summary (Strategy B)

**Why not Strategy A (generic, no state)?**
Travis needs to see his booking details. A generic page fails his acceptance test.

**Why not Strategy C (Firestore fetch by ID)?**
Would require Firestore security rules to allow unauthenticated reads of booking docs — a security surface we haven't opened. Router state is simpler and sufficient.

**Why Strategy B (React Router state)?**
- All data is in-memory only — compliant with COMPLIANCE.md (no PII in localStorage)
- `submitBooking()` already returns the Firestore doc ID — we just capture it
- One-line change to `BookingPage.tsx` to pass state
- Degrades gracefully on refresh: `useLocation().state` returns `null` → generic confirmation shown

---

## Files Changed

| File | Action | Notes |
|---|---|---|
| `src/pages/ThankYouPage.tsx` | CREATE | New confirmation page |
| `src/pages/BookingPage.tsx` | EDIT | Capture `bookingId`; pass state to `navigate('/thank-you', { state })` |
| `src/App.tsx` | EDIT | Replace PlaceholderPage at `/thank-you` with `<ThankYouPage />` |
| `src/i18n/locales/en.json` | EDIT | Add `thankYou.*` namespace |
| `src/i18n/locales/fr.json` | EDIT | Add `thankYou.*` namespace (FR) |

**No schema changes.** Firestore schema is unchanged.

---

## BookingPage.tsx Change

```ts
// Before (line ~104):
await submitBooking(data, lang, source)
navigate('/thank-you')

// After:
const bookingId = await submitBooking(data, lang, source)
navigate('/thank-you', {
  state: {
    firstName:     data.firstName,
    email:         data.email,
    serviceType:   data.serviceType,
    preferredDate: data.preferredDate,
    frequency:     data.frequency,
    bookingId,
  },
})
```

---

## ThankYouPage.tsx — Section Architecture

```
/thank-you
│
├── 1. Confirmation Banner  (bg-slate-brand)
│     ├── ✓ SVG checkmark icon (animated fadeIn)
│     ├── H1: t('thankYou.heading', { name })  — or t('thankYou.genericHeading') on refresh
│     └── Subhead: t('thankYou.subhead', { email })  — or t('thankYou.genericSubhead') on refresh
│
├── 2. Booking Summary Card  [shown only when state is present]
│     ├── Reference: #{{first 8 chars of bookingId}}
│     ├── t('thankYou.serviceLabel'): t(`services.${serviceType}.title`)
│     ├── t('thankYou.dateLabel'):    preferredDate
│     └── t('thankYou.frequencyLabel'): t(`quote.frequency.${frequency}`)
│
├── 3. What Happens Next (3 steps — always shown)
│     ├── Step 1: t('thankYou.step1Title') + t('thankYou.step1Desc')
│     ├── Step 2: t('thankYou.step2Title') + t('thankYou.step2Desc')
│     └── Step 3: t('thankYou.step3Title') + t('thankYou.step3Desc')
│
└── 4. CTA Row (always shown)
      ├── Primary: t('thankYou.ctaServices') → /services
      └── Secondary: t('thankYou.ctaHome') → /
```

Framer Motion: `fadeUp` variant (same as AirbnbTurnoverPage — opacity 0→1, y 20→0, 0.45s stagger).

---

## Router State Shape

```typescript
interface ThankYouState {
  firstName:     string
  email:         string
  serviceType:   string
  preferredDate: string
  frequency:     string
  bookingId:     string
}
```

Accessed via `useLocation().state as ThankYouState | null`. When `null` (page refresh), render generic heading/subhead and hide the summary card.

---

## i18n Key Spec — `thankYou` namespace

### `en.json`
```json
"thankYou": {
  "meta": {
    "title": "Booking Confirmed — Fresh Nest Co.",
    "description": "Your Fresh Nest Co. cleaning booking is confirmed. Check your email for details."
  },
  "heading":        "You're booked, {{name}}!",
  "subhead":        "Your booking is confirmed. A confirmation email is on its way to {{email}}.",
  "genericHeading": "Your booking is confirmed!",
  "genericSubhead": "Check your inbox for your booking confirmation details.",
  "referenceLabel": "Booking reference",
  "summaryHeading": "Booking Summary",
  "serviceLabel":   "Service",
  "dateLabel":      "Preferred date",
  "frequencyLabel": "Frequency",
  "step1Title": "Confirmation email sent",
  "step1Desc":  "Check your inbox — your booking details are on their way.",
  "step2Title": "We confirm your cleaner",
  "step2Desc":  "We'll assign your cleaner and confirm the details within 24 hours.",
  "step3Title": "Your cleaner arrives",
  "step3Desc":  "On the day of your booking, your cleaner arrives on time, ready to work.",
  "ctaServices": "Explore Our Services",
  "ctaHome":     "Return Home"
}
```

### `fr.json` — same structure, fully translated

---

## Persona Impact Analysis

| Persona | Impact | Detail |
|---|---|---|
| **P2 Travis** | ✅ Primary | Sees name, service, date, reference number — confirmation in < 1 screen |
| **P1 Diane** | ✅ Primary | All confirmation copy in French via t() |
| P3 Margaret | 🟡 Minor | 48px CTAs, 16px text enforced |
| P4–P6 | — | Not applicable |

---

## Risk Register

| Risk | Mitigation |
|---|---|
| User refreshes page — state lost | Guard with `state !== null` check; show generic confirmation gracefully |
| `serviceType` key not matching `services.*.title` namespace | The same `serviceType` enum values are keys in `services.*` — confirmed in en.json |
| `frequency` key not matching `quote.frequency.*` namespace | Confirmed: `quote.frequency.one-time`, `.weekly`, `.biweekly`, `.monthly` all exist |
| ThankYouState not type-safe | Define interface in ThankYouPage; cast with `as ThankYouState \| null`; validate at read time |

---

## Phase B Execution Order

1. Create `src/pages/ThankYouPage.tsx`
2. Add `thankYou.*` keys to `en.json` and `fr.json`
3. Edit `src/pages/BookingPage.tsx` — capture `bookingId`, pass state
4. Edit `src/App.tsx` — replace PlaceholderPage at `/thank-you`
5. Invoke Brand_Auditor
6. Invoke Linguistic_Auditor
7. Run `npm run build && npm run lint` — both must pass
8. Phase C close

---

*Halt. Awaiting human approval before Phase B execution.*
