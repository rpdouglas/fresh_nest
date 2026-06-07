# E16 — Firestore Booking Integration · Phase A Plan
**Date:** 2026-06-07
**Primary Personas:** All (data reliability gate) — specifically Diane P1 + Sophie P5 (`language` field → E17 bilingual email), Travis P2 (SMS confirmation chain → E18)
**Approved Strategy:** _awaiting human selection_

---

## Context

E15 delivered the full 4-step booking wizard with per-step validation. Its `onSubmit` is currently a stub that calls `navigate('/thank-you')`. E16 replaces that stub with a real `addDoc` write to the Firestore `bookings` collection, mapping `BookingFormData` → the `bookings` schema, and adds loading + error UI to the form.

---

## Schema Gap (must resolve before any Firestore write)

`COMPLIANCE.md` requires three fields on booking documents when marketing consent is given:
```ts
marketingConsent: true,
consentTimestamp: Timestamp.now(),
consentMethod: 'booking-form-v2',
```
These fields are **not in `docs/firestore-schema.md`**. The `Data_Steward` check would fail if they were written without being in the schema, and the COMPLIANCE.md says they are required. E16 must update `docs/firestore-schema.md` to add all three fields before any strategy is executed.

---

## Form → Schema Mapping

| `BookingFormData` field | Firestore `bookings` field | Source / Rule |
| :--- | :--- | :--- |
| `serviceType` | `serviceType` | Direct |
| `propertyType` | `propertyType` | Direct |
| `bedrooms` | `bedrooms` | Direct |
| `bathrooms` | `bathrooms` | Direct |
| `pets` | `pets` | Direct |
| `frequency` | `frequency` | Direct |
| `preferredDate` | `preferredDate` | Direct |
| `addOns` | `addOns` | Direct |
| `squareFootage` | `squareFootage` | Direct (optional) |
| `firstName` | `firstName` | Direct |
| `lastName` | `lastName` | Direct |
| `email` | `email` | Direct |
| `phone` | `phone` | Direct |
| `address` | `address` | Direct |
| `preferredCleaner` | `preferredCleaner` | Direct (nullable) |
| `notes` | `notes` | Direct (optional) |
| `marketingConsent` | `marketingConsent` / `consentTimestamp` / `consentMethod` | If `true`: write all 3 fields. If `false`: omit all 3. |
| _(not in form)_ | `language` | `i18next.language` normalized to `'en' \| 'fr'` |
| _(not in form)_ | `leadSource` | URL param (`?ref=`, `?utm_source=`) → mapped to schema enum; fallback `'organic'` |
| _(not in form)_ | `status` | Always `'pending'` |
| _(not in form)_ | `assignedTo` | Always `null` |
| _(not in form)_ | `isAirbnb` | `serviceType === 'airbnb'` |
| _(not in form)_ | `photoConfirmation` | `serviceType === 'airbnb' \|\| serviceType === 'commercial'` |
| _(not in form)_ | `fsmAppointmentId` | `null` (Phase 6) |
| _(not in form)_ | `createdAt` | `serverTimestamp()` |

---

## Strategy 1 — Service Function in `src/lib/firestore.ts` (Recommended)

### Summary
Create a typed service function `submitBooking()` in `src/lib/firestore.ts`. `BookingPage.tsx` calls it with `useState` for loading/error. Clean separation — service function is testable and reusable by E17/E18.

### Files Changed

| File | Action |
| :--- | :--- |
| `docs/firestore-schema.md` | **Modify** — add `marketingConsent`, `consentTimestamp`, `consentMethod` fields |
| `src/lib/firestore.ts` | **Create** — `submitBooking(data, lang, source)` → `addDoc` → returns `docId` |
| `src/pages/BookingPage.tsx` | **Modify** — replace stub onSubmit; add `{loading, error}` state; pass `source` from URL params |

### `src/lib/firestore.ts` shape

```ts
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { BookingFormData } from '@/lib/bookingSchema'
import type { Language } from '@/types'

export type LeadSource = 'organic' | 'google' | 'referral' | 'facebook' | 'direct'

function detectLeadSource(params: URLSearchParams): LeadSource {
  const ref = params.get('ref') ?? params.get('utm_source') ?? ''
  const map: Record<string, LeadSource> = {
    google: 'google', facebook: 'facebook', referral: 'referral', direct: 'direct',
  }
  return map[ref.toLowerCase()] ?? 'organic'
}

export async function submitBooking(
  data: BookingFormData,
  language: Language,
  source: LeadSource,
): Promise<string> {
  const { marketingConsent, ...rest } = data
  const doc = {
    ...rest,
    language,
    leadSource:        source,
    status:            'pending' as const,
    assignedTo:        null,
    isAirbnb:          data.serviceType === 'airbnb',
    photoConfirmation: data.serviceType === 'airbnb' || data.serviceType === 'commercial',
    fsmAppointmentId:  null,
    createdAt:         serverTimestamp(),
    ...(marketingConsent && {
      marketingConsent: true,
      consentTimestamp: Timestamp.now(),
      consentMethod:    'booking-form-v2' as const,
    }),
  }
  const ref = await addDoc(collection(db, 'bookings'), doc)
  return ref.id
}
```

### `BookingPage.tsx` onSubmit change

```tsx
const [searchParams] = useSearchParams()
const source = detectLeadSource(searchParams)       // computed once
const [submitError, setSubmitError] = useState<string | null>(null)

const onSubmit = async (data: BookingFormData) => {
  try {
    await submitBooking(data, i18n.language === 'fr' ? 'fr' : 'en', source)
    navigate('/thank-you')
  } catch {
    setSubmitError(t('booking.errors.submit'))
  }
}
```

Wait — `onSubmit` must now receive `data: BookingFormData`. Previously it was `() => {}` (no params) after the E15 lint fix. It needs to be changed back to receive the form data. The eslint `no-unused-vars` rule will no longer fire because `data` IS used.

### Error UI

A non-blocking error banner above the submit button on Step 4 only:
```tsx
{submitError && (
  <div role="alert" className="bg-red-50 border border-red-300 rounded p-4 font-body text-base text-red-700">
    {submitError}{' '}
    <a href="tel:+16139353555" className="underline text-red-700">(613) 935-3555</a>
  </div>
)}
```
Phone number in error message: Margaret P3 gate — if something goes wrong, she can call.

### Persona Impact

| Persona | Impact |
| :--- | :--- |
| All | Booking data reliably written to Firestore — the foundational prerequisite for E17/E18 |
| Diane P1 | `language: 'fr'` written correctly → E17 sends FR email |
| Sophie P5 | Same — FR language field written |
| Travis P2 | `phone` + `language` fields enable E18 SMS within 30 seconds |
| Kahnawà:ke P4 | `notes` field (with island/bridge text) stored without truncation |
| Gallagher P6 | `isAirbnb: true` and `photoConfirmation: true` set correctly on Airbnb bookings |

### Schema Audit
All written fields exist in `docs/firestore-schema.md` (after schema update). `marketingConsent` boolean from `BookingFormData` is NOT written directly to Firestore — the CASL mapping writes the three consent fields instead (or omits them if false). No invented fields.

### COMPLIANCE Audit
- `marketingConsent` checkbox unchecked by default (E15 — already done) ✅
- When `marketingConsent === true`: `consentTimestamp` and `consentMethod` written ✅
- When `marketingConsent === false`: all consent fields omitted (not `null`) ✅
- No PII in localStorage/sessionStorage — only in Firestore ✅
- `createdAt: serverTimestamp()` — server-authoritative timestamp (cannot be spoofed) ✅

### Risks
- Firestore SDK import (`addDoc`, `serverTimestamp`, `Timestamp`) — already in `package.json` via `firebase`. No new dependency.
- TypeScript: `serverTimestamp()` returns `FieldValue`, not `Timestamp`. Firestore accepts it for writes. The `Booking` interface has `createdAt: Date` — the write type and the read type differ (this is normal in Firestore). No type conflict because `submitBooking` builds a plain object literal, not typed as `Booking`.
- `onSubmit` signature change: from `() => void` back to `(data: BookingFormData) => Promise<void>`. `handleSubmit(onSubmit)` accepts `SubmitHandler<BookingFormData>` which is exactly `(data) => void | Promise<void>`. The previous `() => {}` worked because TypeScript allows fewer parameters — reverting to `(data)` is safe and removes the need for the parameter-dropping workaround.

---

## Strategy 2 — Inline Logic in BookingPage (Minimal Files)

### Summary
Skip the service function. Write the `addDoc` logic directly inside `BookingPage.tsx`. Fewer files, lower abstraction overhead.

### Files Changed

| File | Action |
| :--- | :--- |
| `docs/firestore-schema.md` | **Modify** — same schema update as Strategy 1 |
| `src/pages/BookingPage.tsx` | **Modify** — inline `addDoc` logic + loading/error state |

### Trade-offs vs Strategy 1

| | Strategy 1 | Strategy 2 |
| :--- | :--- | :--- |
| Files created | 1 new (`firestore.ts`) | 0 new |
| Reusability | `submitBooking()` callable by E17/E22 | Logic trapped in component |
| Testability | Pure function, easily unit-tested | Requires component mount to test |
| Separation | Form UI ↔ DB write cleanly separated | Coupled together |
| Complexity | Slightly more total code | Everything in one place |

Acceptable for a small codebase. Less maintainable as E17/E22 grow the write surface.

### Risk
`BookingPage.tsx` already has `buildDefaults()`, form setup, step state, `handleNext`, `handleBack` — adding 30+ lines of Firestore mapping inline makes it a large component. Not a blocker but worth noting.

---

## Strategy 3 — TanStack Query `useMutation`

### Summary
Use `useMutation` from `@tanstack/react-query` (already installed). The mutation function is the same `addDoc` logic as Strategy 1, but wrapped in TanStack's `useMutation`, which provides `isPending`, `isError`, and `error` state out of the box.

### Files Changed

| File | Action |
| :--- | :--- |
| `docs/firestore-schema.md` | **Modify** — same schema update |
| `src/lib/firestore.ts` | **Create** — same `submitBooking()` function as Strategy 1 |
| `src/pages/BookingPage.tsx` | **Modify** — `useMutation({ mutationFn: submitBooking })` |

### Code shape

```tsx
const submitMutation = useMutation({
  mutationFn: ({ data, lang, source }: { data: BookingFormData; lang: Language; source: LeadSource }) =>
    submitBooking(data, lang, source),
  onSuccess: () => navigate('/thank-you'),
})

const onSubmit = (data: BookingFormData) => {
  const lang = i18n.language === 'fr' ? 'fr' : 'en'
  submitMutation.mutate({ data, lang, source })
}
```

### Trade-offs vs Strategy 1

| | Strategy 1 | Strategy 3 |
| :--- | :--- | :--- |
| State management | Manual `useState` for loading/error | TanStack handles loading/error/success |
| Consistency with stack | Diverges (manual state for writes) | Consistent with project's data layer |
| Overhead | Simple | TanStack import; slightly more setup |
| Value for this use case | Adequate | TanStack's caching/background refetch adds no value for one-shot writes |

TanStack Query is most valuable for reads (caching, background refetch, devtools). For a write that navigates away on success, the extra abstraction adds complexity without meaningful benefit. Strategy 1 is simpler for the same outcome.

---

## Subagent Pre-checks (all strategies)

- **Brand_Auditor:** Error banner uses `bg-red-50 border border-red-300 text-red-700` — these are Tailwind v3 stock colours (not brand tokens), acceptable for error state (not a brand element). `font-body text-base` on error message ✅. `rounded` on error banner ✅.
- **Data_Steward:** `submitBooking()` writes exactly the fields in `docs/firestore-schema.md` (after update). `marketingConsent` bool from form is never written directly — it's mapped to the three CASL fields. `serverTimestamp()` is the correct Firestore server timestamp import.
- **Linguistic_Auditor:** `booking.errors.submit` key must be added to `en.json` and `fr.json` (phone fallback in error uses a hardcoded tel: href — this is a phone number constant, not UI copy, same pattern as Navbar). Submit button text already uses `t('booking.submit')`.

### New i18n keys required

**en.json** — add to `booking.errors`:
```json
"submit": "Something went wrong saving your booking. Please try again or call us at "
```

**fr.json** — add to `booking.errors`:
```json
"submit": "Une erreur s'est produite lors de l'enregistrement. Veuillez réessayer ou nous appeler au "
```

---

## Schema Update Required (all strategies)

Add to `docs/firestore-schema.md` under `bookings` collection:

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `marketingConsent` | `boolean` | ❌ | CASL: `true` if client opted in to marketing emails. Omitted (not `null`) when false. |
| `consentTimestamp` | `Timestamp` | ❌ | CASL: Timestamp of marketing consent. Present only when `marketingConsent === true`. |
| `consentMethod` | `string` | ❌ | CASL: `'booking-form-v2'`. Present only when `marketingConsent === true`. |

---

## Persona Tests

| Persona | Test | Pass Condition |
| :--- | :--- | :--- |
| **All** | Submit booking → Firestore doc created | Document appears in `bookings` collection with correct `status: 'pending'` |
| **Diane P1** | Language set to FR → submit | `language: 'fr'` on Firestore document |
| **Sophie P5** | Same as Diane | Same condition |
| **Travis P2** | Submit from mobile | `phone` field present; `language: 'en'`; write completes in < 2 seconds |
| **Gallagher P6** | Submit `serviceType: 'airbnb'` | `isAirbnb: true` and `photoConfirmation: true` on document |
| **All** | Firestore write fails | Error banner shows with phone number; form data preserved in memory |
| **CASL** | Submit with consent checked | `marketingConsent: true`, `consentTimestamp`, `consentMethod: 'booking-form-v2'` all present |
| **CASL** | Submit without consent | `marketingConsent`, `consentTimestamp`, `consentMethod` all absent from document |

---

## Out of Scope (deferred)

- E17: Cloud Function trigger → owner email + client confirmation
- E18: SMS via Twilio/Firebase Extension
- E22: Thank You page content (currently a PlaceholderPage)
- `firestore.rules` production hardening (Phase 5, requires human approval)
