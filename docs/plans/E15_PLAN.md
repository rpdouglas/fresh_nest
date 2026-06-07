# E15 — Multi-Step Booking Form · Phase A Plan
**Date:** 2026-06-07 | **Epic:** E15 | **Phase:** 2 → 3 transition

---

## Persona Attribution

**Primary:** Travis McLeod (P2) · Sophie Tremblay-Gagnon (P5) · Margaret Storey (P3)
**Secondary:** Diane Lafleur (P1) · Kahnawà:ke Baptiste (P4) · Gallagher (P6)

| Persona | Core Requirement | Hard Gate |
| :--- | :--- | :--- |
| **Travis (P2)** | Mobile booking < 3 min, no account, pre-populated from calc | Persona Test: 4-bed + biweekly → submit in < 3 min on 375px |
| **Sophie (P5)** | All labels/errors in French, Quebec Law 25 explicit consent | Persona Test: Full French booking + FR confirmation |
| **Margaret (P3)** | 48px targets, 16px text, 768px iPad, no state loss | Persona Test: iPad booking with no horizontal scroll |
| **Diane (P1)** | `language: 'fr'` captured in form data → drives FR email | CASL opt-in unchecked by default, FR consent text |
| **Kahnawà:ke (P4)** | Notes field has island-specific placeholder | `notes` field placeholder: "Island address / bridge access..." |
| **Gallagher (P6)** | `isAirbnb: true` when `serviceType === 'airbnb'` auto-derived | `photoConfirmation` defaults true for Airbnb bookings |

---

## Scope Boundary

**E15 builds:** complete form UI, RHF + Zod validation, pre-population from URL params, all bilingual i18n keys, CASL consent checkbox.

**E15 does NOT build:** Firestore write (E16), email notification (E17), SMS confirmation (E18). On submit, the handler navigates to `/thank-you` (placeholder) after validation passes.

---

## Pre-Population URL Contract

Existing components link to `/booking` with these query params (must be respected):

| Source component | URL params produced | Booking form field |
| :--- | :--- | :--- |
| QuoteCalculator | `?size=apartment\|1-2bed\|3-4bed\|5plus\|commercial&service=...&freq=...` | propertyType, serviceType, frequency |
| ServicesGrid | `?serviceType=standard\|deep\|...` | serviceType |
| LocationPage chips | `?serviceType=standard\|deep\|...` | serviceType |
| RecurringCTA | `?freq=weekly\|biweekly\|monthly` | frequency |
| QuoteCalculator (commercial) | `?commercial=1` | serviceType='commercial', propertyType='commercial' |

**Critical mapping:** QuoteCalculator uses `QuotePropertySize` where `'5plus'` ≠ Firestore schema `'5+bed'`. The form must map `size=5plus` → `propertyType: '5+bed'`.

---

## Schema Audit

All fields collected by the form map to `docs/firestore-schema.md` exactly. No invented fields.

**Auto-derived fields (not shown to user, set in submit handler):**
- `isAirbnb`: `serviceType === 'airbnb'`
- `photoConfirmation`: `serviceType === 'airbnb'` (default true for Airbnb)
- `status`: always `'pending'` on creation
- `assignedTo`: always `null` on creation
- `language`: from `i18n.language` at submit time
- `leadSource`: stubbed `'organic'` in E15; E16 refines with referrer detection

**CASL fields — not in current `docs/firestore-schema.md`:**
- `marketingConsent: boolean` — required by COMPLIANCE.md
- `consentTimestamp: Timestamp` — required only when `marketingConsent === true`
- `consentMethod: 'booking-form-v2'` — required when consent given

**Action required:** These three fields must be added to `docs/firestore-schema.md` during E16 Phase C. Flagged here for the Data_Steward.

---

## COMPLIANCE Audit

| Rule | How E15 satisfies it |
| :--- | :--- |
| CASL: marketing opt-in unchecked by default | `marketingConsent` field: `defaultChecked={false}` |
| CASL: consent language explicit | i18n key `booking.fields.marketingConsent.label` — not bundled with T&C |
| PIPEDA: no PII in sessionStorage/localStorage | All form state in React `useForm()` memory only — never serialised to storage |
| Quebec Law 25: explicit consent for QC clients | Sophie's booking is in French; consent text in French; form captures `language: 'fr'` |
| WCAG 2.1 AA: visible labels | Every field has `<label htmlFor>` — no placeholder-only labels |
| WCAG 2.1 AA: 48px touch targets | All inputs `min-h-[48px]`, all buttons `min-h-[48px]` |
| WCAG 2.1 AA: 16px minimum text | All copy `font-body text-base` — no `text-sm` on instructions |
| WCAG 2.1 AA: focus indicators | `focus:ring-2 focus:ring-slate-brand` on all interactive elements |
| Required field indicators | `aria-required="true"` + asterisk `*` with `aria-hidden="true"` on required labels |

---

## i18n Keys (booking.* block — both en.json and fr.json)

```
booking.pageTitle          booking.metaDesc
booking.step1Title         booking.step2Title         booking.step3Title         booking.step4Title
booking.step1Subhead       booking.step2Subhead       booking.step3Subhead       booking.step4Subhead
booking.progress           (e.g., "Step {{current}} of {{total}}")
booking.next               booking.back               booking.submit             booking.submitting

booking.fields.serviceType.label
booking.fields.serviceType.options.standard
booking.fields.serviceType.options.deep
booking.fields.serviceType.options.moveout
booking.fields.serviceType.options.postconstruction
booking.fields.serviceType.options.airbnb
booking.fields.serviceType.options.commercial

booking.fields.propertyType.label
booking.fields.propertyType.options.apartment
booking.fields.propertyType.options.1-2bed
booking.fields.propertyType.options.3-4bed
booking.fields.propertyType.options.5+bed
booking.fields.propertyType.options.commercial

booking.fields.bedrooms.label
booking.fields.bathrooms.label
booking.fields.pets.label            booking.fields.pets.hint

booking.fields.frequency.label
booking.fields.frequency.options.one-time
booking.fields.frequency.options.weekly     booking.fields.frequency.discounts.weekly
booking.fields.frequency.options.biweekly   booking.fields.frequency.discounts.biweekly
booking.fields.frequency.options.monthly    booking.fields.frequency.discounts.monthly

booking.fields.preferredDate.label   booking.fields.preferredDate.hint
booking.fields.addOns.label
booking.fields.addOns.options.oven   booking.fields.addOns.options.fridge
booking.fields.addOns.options.windows booking.fields.addOns.options.laundry
booking.fields.addOns.options.petHair booking.fields.addOns.options.basement

booking.fields.firstName.label       booking.fields.firstName.placeholder
booking.fields.lastName.label        booking.fields.lastName.placeholder
booking.fields.email.label           booking.fields.email.placeholder
booking.fields.phone.label           booking.fields.phone.placeholder
booking.fields.address.label         booking.fields.address.placeholder
booking.fields.address.hint          (island/cross-border note)
booking.fields.preferredCleaner.label booking.fields.preferredCleaner.placeholder
booking.fields.notes.label           booking.fields.notes.placeholder
booking.fields.marketingConsent.label (CASL opt-in — unchecked by default)

booking.errors.required              booking.errors.email
booking.errors.phone                 booking.errors.date
booking.errors.minLength

booking.review.heading               booking.review.service
booking.review.property              booking.review.frequency
booking.review.date                  booking.review.contact
booking.review.addOns                booking.review.notes
booking.review.edit

booking.airbnbNote    (inline note when serviceType=airbnb: photo confirmation + 11am–3pm window)
```

**Approximate count:** ~75 keys × 2 languages = 150 string entries.

---

## Zod Schema (src/lib/bookingSchema.ts)

```ts
import { z } from 'zod'

export const bookingFormSchema = z.object({
  // Step 1 — Service
  serviceType: z.enum(['standard','deep','moveout','postconstruction','airbnb','commercial']),
  propertyType: z.enum(['apartment','1-2bed','3-4bed','5+bed','commercial']),
  bedrooms:     z.number().int().min(0).max(20),
  bathrooms:    z.number().int().min(0).max(10),
  pets:         z.boolean(),

  // Step 2 — Schedule
  frequency:       z.enum(['one-time','weekly','biweekly','monthly']),
  preferredDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Required — YYYY-MM-DD'),
  addOns:          z.array(z.enum(['oven','fridge','windows','laundry','petHair','basement'])).default([]),
  squareFootage:   z.number().int().min(100).max(50000).optional(),

  // Step 3 — Contact
  firstName:        z.string().min(1).max(100),
  lastName:         z.string().min(1).max(100),
  email:            z.string().email(),
  phone:            z.string().min(10).max(20),
  address:          z.string().min(5).max(500),
  preferredCleaner: z.string().nullable().optional(),
  notes:            z.string().max(1000).optional(),

  // Step 4 — Consent (derived: language, leadSource, isAirbnb, etc.)
  marketingConsent: z.boolean().default(false),
})

export type BookingFormData = z.infer<typeof bookingFormSchema>
```

`isAirbnb`, `photoConfirmation`, `status`, `assignedTo`, `language`, `leadSource`, `createdAt` are NOT in the form schema — they are computed in the E16 submit handler from form data + runtime context.

---

## Strategy 1 — Single Long-Form Page

**Primary persona alignment:** Margaret (P3) — PERSONAS.md requirement: "Single-page option — no multi-step wizard that loses state."

### Files changed

| File | Action |
| :--- | :--- |
| `src/pages/BookingPage.tsx` | Create — single `<form>` with 4 visual card sections, one submit button |
| `src/lib/bookingSchema.ts` | Create — Zod schema (full) |
| `src/App.tsx` | Modify — import BookingPage, replace PlaceholderPage at `path: 'booking'` |
| `src/i18n/locales/en.json` | Modify — add `booking.*` block |
| `src/i18n/locales/fr.json` | Modify — add `booking.*` block |

### Structure

```
BookingPage.tsx
├── React 19 <title> / <meta>
├── bg-warm-white hero: H1 "Book a Cleaning"
└── bg-cream form section: max-w-2xl mx-auto
    ├── Card 1 — bg-white border border-sand rounded shadow-sm: Service details
    ├── Card 2 — Schedule
    ├── Card 3 — Contact info
    ├── Card 4 — Review summary (read-only) + CASL
    └── Submit button
```

### Persona impact

| Persona | Rating | Notes |
| :--- | :--- | :--- |
| Margaret (P3) | ✅ Strong | Zero state loss; no wizard; 48px targets throughout; reads every field carefully |
| Travis (P2) | ⚠️ Weak | Very long form on mobile; no progress indicator; all fields visible simultaneously creates cognitive load |
| Sophie (P5) | ✅ Strong | Long form is fine on desktop/tablet; French labels throughout |
| Diane (P1) | ✅ OK | French labels; single page suits deliberate reader |

### Risks

- **Travis persona test failure risk: HIGH.** A single-page form with 20+ fields is very unlikely to meet the < 3 minute mobile booking requirement. Travis must scroll to find and fill each section.
- Doesn't match master plan 4-step spec (E15 master plan section specifies "Multi-step flow (4 steps)")
- No per-step validation — all errors surface at once on submit, which is confusing on long forms

---

## Strategy 2 — 4-Step Wizard with RHF FormProvider ✅ Recommended

**Primary persona alignment:** Travis (P2) — guided mobile UX, pre-populated from calc, clear progress. Also satisfies Sophie (P5) and addresses Margaret (P3) with an important tension resolution (see below).

**Margaret tension resolution:** PERSONAS.md says "no multi-step wizard that loses state." RHF `FormProvider` pattern means all state lives in a single `useForm()` instance at the parent — it is **never lost** when navigating steps (no browser navigation, only in-form Prev/Next buttons). The concern in PERSONAS.md is about losing work on browser back or page reload — not about a step flow per se. We mitigate this by: (a) disabling browser-back in-wizard navigation, (b) keeping `currentStep` in `useState` (not in URL), and (c) a visible `beforeunload` warning if the form has been touched.

### Files changed

| File | Action |
| :--- | :--- |
| `src/pages/BookingPage.tsx` | Create — FormProvider wrapper, step router, pre-population logic |
| `src/lib/bookingSchema.ts` | Create — Zod schema + per-step field lists for `trigger()` |
| `src/components/booking/StepIndicator.tsx` | Create — progress bar: 4 dots + step labels |
| `src/components/booking/BookingStep1.tsx` | Create — serviceType, propertyType, bedrooms, bathrooms, pets |
| `src/components/booking/BookingStep2.tsx` | Create — frequency (with discount badges), preferredDate, addOns, squareFootage |
| `src/components/booking/BookingStep3.tsx` | Create — firstName, lastName, email, phone, address, preferredCleaner, notes |
| `src/components/booking/BookingStep4.tsx` | Create — review summary + marketingConsent checkbox + submit |
| `src/App.tsx` | Modify — import BookingPage, replace PlaceholderPage at `path: 'booking'` |
| `src/i18n/locales/en.json` | Modify — add `booking.*` block (~75 keys) |
| `src/i18n/locales/fr.json` | Modify — add `booking.*` block (French, ~75 keys) |

### Architecture

```tsx
// BookingPage.tsx
const methods = useForm<BookingFormData>({
  resolver: zodResolver(bookingFormSchema),
  defaultValues: buildDefaults(searchParams), // maps URL params → form defaults
  mode: 'onTouched',
})

return (
  <FormProvider {...methods}>
    <StepIndicator current={step} total={4} />
    {step === 0 && <BookingStep1 onNext={handleNext} />}
    {step === 1 && <BookingStep2 onNext={handleNext} onBack={handleBack} />}
    {step === 2 && <BookingStep3 onNext={handleNext} onBack={handleBack} />}
    {step === 3 && <BookingStep4 onBack={handleBack} onSubmit={handleSubmit(onSubmit)} />}
  </FormProvider>
)

// Per-step validation before advancing
const handleNext = async () => {
  const valid = await methods.trigger(STEP_FIELDS[step])
  if (valid) setStep(s => s + 1)
}
```

```ts
// Per-step field lists for trigger()
const STEP_FIELDS: Record<number, (keyof BookingFormData)[]> = {
  0: ['serviceType', 'propertyType', 'bedrooms', 'bathrooms', 'pets'],
  1: ['frequency', 'preferredDate'],
  2: ['firstName', 'lastName', 'email', 'phone', 'address'],
  3: ['marketingConsent'],
}
```

### `buildDefaults()` URL param mapper

```ts
function buildDefaults(params: URLSearchParams): Partial<BookingFormData> {
  const defaults: Partial<BookingFormData> = {}

  // QuoteCalculator: ?size=5plus&service=deep&freq=biweekly
  const size = params.get('size')
  if (size) defaults.propertyType = size === '5plus' ? '5+bed' : size as BookingFormData['propertyType']

  const service = params.get('service')
  if (service) defaults.serviceType = service as BookingFormData['serviceType']

  // ServicesGrid / LocationPage: ?serviceType=deep
  const serviceType = params.get('serviceType')
  if (serviceType) defaults.serviceType = serviceType as BookingFormData['serviceType']

  const freq = params.get('freq')
  if (freq) defaults.frequency = freq as BookingFormData['frequency']

  // QuoteCalculator commercial path: ?commercial=1
  if (params.get('commercial') === '1') {
    defaults.serviceType = 'commercial'
    defaults.propertyType = 'commercial'
  }

  return defaults
}
```

### Step 1 — Service Details

- Radio cards for `serviceType` (6 options — icon + label, reuses ServicesGrid icon pattern)
- Radio cards for `propertyType` (5 options)
- Stepper inputs for `bedrooms` (0–10) and `bathrooms` (0–6) — `+ / −` buttons with `min-h-[48px]`
- Toggle for `pets` — visually prominent, mentions eco products if `true`
- When `serviceType === 'airbnb'`: inline callout `bg-slate-pale` showing photo confirmation + 11am–3pm window (`t('booking.airbnbNote')`)

### Step 2 — Schedule

- Frequency selector: 4 radio cards with discount badge on weekly/biweekly/monthly (`bg-slate-pale text-slate-brand`)
- `preferredDate`: `<input type="date">` — `min` set to tomorrow, `max` set to 90 days out
- Add-ons: checkbox grid (6 items), `min-h-[48px]` per row
- `squareFootage`: optional text input — visually de-emphasised with `(optional)` label

### Step 3 — Contact

- First/last name inline on desktop, stacked on mobile
- Email, phone (type="tel"), full address (textarea, 3 rows)
- `preferredCleaner`: optional text input with `t('booking.fields.preferredCleaner.placeholder')`
- `notes` textarea with Kahnawà:ke island placeholder: `t('booking.fields.notes.placeholder')` = "Special instructions, island address / bridge crossing notes, entry codes..."
- All inputs: `min-h-[48px] border border-sand rounded px-4 focus:ring-2 focus:ring-slate-brand`

### Step 4 — Review + Submit

- Read-only summary table of all selected values
- Edit links (`t('booking.review.edit')`) that `setStep(targetStep)` without re-rendering
- CASL checkbox: `defaultChecked={false}`, full consent text via `t('booking.fields.marketingConsent.label')`
- Submit button: `bg-slate-brand hover:bg-slate-dark rounded px-8 min-h-[48px]`
- On submit: validate full schema → navigate('/thank-you') (E16 replaces with Firestore write)

### Persona impact

| Persona | Rating | Notes |
| :--- | :--- | :--- |
| Travis (P2) | ✅ Excellent | 4 short steps × mobile-first; calc pre-populates step 1; progress bar keeps him oriented; < 3 min achievable |
| Margaret (P3) | ✅ Strong | In-form Prev/Next = no browser navigation risk; step state in React memory, never lost; 48px targets; 16px text |
| Sophie (P5) | ✅ Excellent | All labels in FR; consent in FR; `language: 'fr'` captured; Quebec Law 25 explicit consent on step 4 |
| Diane (P1) | ✅ Strong | Same FR UX as Sophie; `preferredCleaner` field prominent in step 3 |
| Kahnawà:ke (P4) | ✅ Strong | `notes` field placeholder calls out island/bridge; address field captures Cornwall Island format |
| Gallagher (P6) | ✅ OK | `serviceType: 'airbnb'` auto-sets `isAirbnb: true`; Airbnb note on step 1 surface the 11am–3pm window |

### Risks

- **Complexity:** 8 files to create (compared to 2 in S1). Mitigated by clean component boundaries.
- **`useFormContext` coupling:** Step components must be children of `FormProvider`. If the router ever moves a step outside the Provider, it breaks. Mitigated by co-locating all step components in `src/components/booking/`.
- **Travis < 3 min gate:** Depends heavily on pre-population. If URL params are wrong, Travis starts from scratch. `buildDefaults()` must be thorough — covered above.

---

## Strategy 3 — 2-Section Condensed Form

**Primary persona alignment:** Compromise between S1 (Margaret) and S2 (Travis).

### Files changed

| File | Action |
| :--- | :--- |
| `src/pages/BookingPage.tsx` | Create — 2-step form: service/schedule on screen 1, contact/consent on screen 2 |
| `src/lib/bookingSchema.ts` | Create |
| `src/App.tsx` | Modify |
| `src/i18n/locales/en.json` | Modify |
| `src/i18n/locales/fr.json` | Modify |

No separate step component files — both sections are rendered within `BookingPage.tsx`.

### Structure

```
Section 1: Service + Schedule (all service/scheduling fields on one screen)
Section 2: Contact + Consent (all contact fields + CASL + review summary + submit)
```

### Persona impact

| Persona | Rating | Notes |
| :--- | :--- | :--- |
| Travis (P2) | ⚠️ OK | Section 1 is still long on mobile (serviceType + propertyType + bedrooms + bathrooms + pets + frequency + addOns + date = 8 field groups). Better than single-page but not ideal. |
| Margaret (P3) | ⚠️ OK | 2 screens is better than 4, but Section 1 is still a long scroll. |
| Sophie (P5) | ✅ OK | Bilingual throughout. |

### Risks

- Section 1 is as long as a full page form for mobile. Travis's < 3 min test is uncertain.
- Doesn't match master plan 4-step spec.
- Minimal benefit over S1 while still carrying the state-management complexity of a multi-step form.

---

## Recommendation: Strategy 2

**Rationale:**
1. Only strategy that achieves Travis's < 3 minute mobile gate — short, focused steps with pre-population from the calc
2. Matches the master plan 4-step specification exactly
3. Margaret's "loses state" concern is fully addressed: state lives in React memory (`useForm`), in-form navigation never triggers browser history events
4. The `FormProvider` + `useFormContext` pattern is RHF canonical multi-step — zero risk of library incompatibility
5. 8 new files are all small, single-purpose components — total implementation is manageable

---

## Subagent Pre-checks (Phase B)

- **Brand_Auditor:** Radio cards `bg-white border border-sand rounded shadow-sm`; selected state `border-slate-brand bg-slate-pale`; inputs `border border-sand rounded min-h-[48px] focus:ring-2 focus:ring-slate-brand`; buttons `bg-slate-brand hover:bg-slate-dark rounded px-8 min-h-[48px]`; labels `font-body text-base text-charcoal`; no `rounded-lg`; Airbnb callout `bg-slate-pale border border-sand rounded`
- **Data_Steward:** All form fields map to `docs/firestore-schema.md`; no invented fields; `isAirbnb` / `photoConfirmation` / `status` / `assignedTo` / `language` / `leadSource` / `createdAt` are E16 submit-handler concerns, NOT in the form schema
- **Linguistic_Auditor:** All 75+ UI strings via `t()`; CASL consent text via i18n key (not hardcoded EN/FR); FR consent: "J'accepte de recevoir des courriels promotionnels de Fresh Nest Co. Je peux me désabonner à tout moment."; no hardcoded service names or option labels
- **Security (note):** No client PII written to browser storage — form state lives in RHF `useForm()` React memory only. Verified against COMPLIANCE.md §2 (PIPEDA).

---

## Build Verification Plan (Phase B)

1. `npm run build` — zero TypeScript errors
2. `npm run lint` — zero ESLint errors
3. **Persona Test — Travis:** iPhone (375px) → `?size=3-4bed&service=standard&freq=biweekly` pre-populates step 1; complete steps 2–4 → click Submit → navigate to `/thank-you`; total time < 3 minutes
4. **Persona Test — Margaret:** iPad (768px) → all tap targets ≥ 48px; all text ≥ 16px; no horizontal scroll; in-form Prev navigation never loses step 1 data
5. **Persona Test — Sophie:** Browser locale `fr-CA` → all 4 steps in French; consent text in French; `language` field derived as `'fr'`
6. **URL param coverage:** Test all 5 param patterns (size+service+freq, serviceType, freq-only, commercial, no params)
7. **CASL:** `marketingConsent` checkbox renders unchecked; checking it and submitting includes `marketingConsent: true` in form data; leaving it unchecked submits `marketingConsent: false`

---

## Phase C Checklist

- [ ] `docs/ACTIVE_CYCLE.md` — add E15 to Phase 3 table + Epic Log
- [ ] `docs/firestore-schema.md` — no schema changes in E15 (E16 adds `marketingConsent`, `consentTimestamp`, `consentMethod`)
- [ ] `docs/reports/E15-close-2026-06-07.md` — written
- [ ] All 6 persona tests named and passed
- [ ] `user-guide/booking-guide.md` — create: step-by-step booking instructions (EN + FR)

---

*Phase A complete. Awaiting human approval of strategy before Phase B execution.*
