# P3-E3 — Admin Booking Creation: Phase A Plan
**Created:** 2026-06-18 · **Revised:** 2026-06-18 (post-codebase research)
**Status:** AWAITING HUMAN APPROVAL
**Complexity:** L · **Priority:** P1 · **Band:** A (Carryover from P1-E6)

---

## Personas

| ID | Name | Role in this epic |
|---|---|---|
| **P12** | Lauren Arsenault | Primary actor — creates the booking from the admin dashboard |
| **P3** | Margaret Storey | Calls in; Lauren enters the booking live during the call |
| **P6** | Gallagher | B2B walk-in; Lauren confirms immediately at creation |
| **P4** | Kahnawà:ke Baptiste | Community referral; entered with `leadSource: 'phone'` or `'walk-in'` |

**Acceptance gate:** Lauren creates a phone-in booking in under 2 minutes.

---

## Codebase Findings (verified in this session)

| Finding | File | Notes |
|---|---|---|
| Existing modal pattern | `apps/customer/src/components/admin/RegisterStaffModal.tsx` | `useForm` + `zodResolver`, `isOpen`/`onClose`, `submitError`, `submitting`, `reset()` on close — follow exactly |
| Booking Zod schema | `apps/customer/src/lib/schemas/bookingSchema.ts` | Extend with `adminBookingSchema`; add admin-only fields |
| Firestore submit function | `apps/customer/src/lib/firebase/firestore.ts` lines 57–90 | New `createAdminBooking()` lives here; public `submitBooking()` unchanged |
| `isAdmin()` rule helper | `firestore.rules` line 7 | Already exists — no new helper needed |
| `LeadSource` type | `packages/shared/src/types/booking.ts` line 7 | **Already includes `'phone'` and `'walk-in'`** — no type file change needed |
| `createdBy` field | `packages/shared/src/types/booking.ts` | In `Booking` interface but never set. This epic sets it. |
| `createdBy` in schema doc | `docs/firestore-schema.md` | **Not documented** — must add in Phase C |
| Firestore rules allowlist | `firestore.rules` lines 42–44 | `leadSource` allowlist is `['organic', 'google', 'referral', 'facebook', 'direct']` — admin path adds `'phone'`, `'walk-in'` |
| `onBookingStatusConfirmed` | `functions/src/index.ts` lines 239–262 | Fires when status transitions TO 'confirmed' — also fires if admin creates with `status: 'confirmed'` directly |

---

## Strategy 1 — Recommended: New `createAdminBooking()` + Split Firestore Rule

**One-line:** New admin service function, new `AdminBookingModal` component following the existing `RegisterStaffModal` pattern, and a second `allow create` branch in `firestore.rules` gated by `isAdmin()`.

### Files changed

| File | Change |
|---|---|
| `apps/customer/src/lib/schemas/bookingSchema.ts` | Add `adminBookingSchema` — all required booking fields + admin-only: `language`, `leadSource`, `assignedTo`, `status`, `marketingConsent`, `createdBy` |
| `apps/customer/src/lib/firebase/firestore.ts` | Add `createAdminBooking(data: AdminBookingFormData, adminEmail: string): Promise<string>` — sets `createdBy`, permits `status: 'pending'\|'confirmed'` and non-null `assignedTo`, no Stripe call |
| `apps/customer/src/components/admin/AdminBookingModal.tsx` | **New.** Single-page scrollable modal, three sections: Service & Property · Schedule & Contact · Admin Controls. Follows `RegisterStaffModal` pattern. |
| `apps/customer/src/components/admin/BookingsTable.tsx` | Add "New Booking" button to table header; wire `AdminBookingModal` open/close state |
| `apps/customer/src/components/admin/hooks/useBookings.ts` | Add `handleAdminCreate()` handler; `isCreating` boolean state |
| `apps/customer/src/i18n/locales/en.json` | New keys: modal title, section headers, all field labels, submit/cancel, success/error messages |
| `apps/customer/src/i18n/locales/fr.json` | French equivalents for all new keys |
| `firestore.rules` | Add second `allow create` branch gated by `isAdmin()`: permits `status in ['pending','confirmed']`, non-null `assignedTo`, `createdBy` string, `leadSource` extended to include `'phone'` and `'walk-in'` — **requires human review before `firebase deploy --only firestore:rules`** |
| `docs/firestore-schema.md` | Add `createdBy?: string` field doc (Phase C) |

### What does NOT change
- `packages/shared/src/types/booking.ts` — `LeadSource` already has `'phone'` and `'walk-in'`; `createdBy` already typed
- `functions/src/index.ts` — `onBookingCreated` and `onBookingStatusConfirmed` fire automatically via Firestore triggers; no changes needed

### Persona impact
- **Lauren (P12):** Opens modal from "New Booking" button, all fields visible at once (no multi-step navigation), staff dropdown pre-loaded from existing `useStaff` hook, status toggle lets her confirm walk-ins immediately. Target: < 2 minutes.
- **Margaret (P3):** Her phone booking lands in Firestore; `onBookingCreated` fires; confirmation email/SMS sends in her selected language (EN).
- **Gallagher (P6):** Walk-in confirmed immediately; Job document created automatically via `onBookingStatusConfirmed`.
- **Baptiste (P4):** `leadSource: 'walk-in'`, notes field available for community referral context.

### Risks

| Risk | Mitigation |
|---|---|
| Firestore rules change is security-sensitive | Explicit halt before `firebase deploy --only firestore:rules` — human approval required |
| `status: 'confirmed'` at creation fires Job creation pipeline | Document in modal: warning label if status = confirmed without assigning staff |
| 15 fields in one page — admin fatigue | Group into three labelled sections with dividers; mark optional fields clearly |
| `onBookingCreated` sends confirmation email — Lauren may not want to notify customer until later | Acceptable for now; future P3-E26 quote flow handles deferred notifications |

### Schema audit

| Field | In `firestore-schema.md` | Action |
|---|---|---|
| `createdBy?: string` | ❌ Not documented | Add in Phase C |
| `leadSource: 'phone'\|'walk-in'` | ✅ Enum listed; Firestore rules allowlist missing them | Update rules allowlist only |
| All other booking fields | ✅ All documented | No change |

**No new fields invented. No schema blocker.**

### Tailwind audit (new classes only)
All new classes use design-system tokens:
- `bg-warm-white`, `border-sand`, `text-charcoal`, `text-text-muted` — form containers, labels
- `bg-slate-brand hover:bg-slate-dark text-white` — primary submit button
- `focus:ring-2 focus:ring-slate-brand` — focus states (matches existing form pattern)
- `text-red-600` — error messages (already used throughout)
- `rounded` (4px) — brand border radius per design-system.md
- `font-body`, `font-sub` — typography tokens only

No Tailwind v4 syntax. No raw hex values.

---

## Strategy 2 — Reuse Existing BookingStep Components

**One-line:** Render `BookingStep1`–`BookingStep4` inside an admin modal, with a fifth admin-only step appended.

### Files changed (additional/different vs Strategy 1)
- `BookingStep1.tsx` through `BookingStep4.tsx` — add `adminMode?: boolean` prop to each
- New `BookingStep5Admin.tsx` — admin-only fields (language, leadSource, assignedTo, status)
- `BookingPage.tsx` — add `adminMode` branch to render as modal

### Trade-off vs Strategy 1
- ✅ Less new UI code; reuses validated step components
- ❌ BookingStep components use `useFormContext()` tightly coupled to the multi-step flow — extracting for single-page use requires refactoring the steps themselves
- ❌ 5-step navigation adds time; violates the < 2 minute acceptance criterion for an experienced operator entering 15+ fields per booking
- ❌ Public and admin booking form logic becomes entangled; any future change to the customer form risks breaking admin

**Verdict:** Fails the persona acceptance criterion. Not recommended.

---

## Strategy 3 — HTTPS Callable Cloud Function (no Firestore rules change)

**One-line:** New HTTPS callable Cloud Function `createAdminBooking`; admin UI calls the function; server validates `role === 'admin'` and writes to Firestore.

### Files changed (different vs Strategy 1)
- `functions/src/index.ts` — new HTTPS callable function
- `firestore.ts` — thin `httpsCallable()` wrapper (instead of direct Firestore write)
- `AdminBookingModal.tsx` — same new component
- `firestore.rules` — **no change needed**

### Trade-off vs Strategy 1
- ✅ Avoids all Firestore rules changes — no human-approval gate on rules
- ✅ Admin role validated server-side only
- ❌ New Cloud Function must be deployed before UI works — extra deploy step
- ❌ HTTPS callable adds ~1–2s cold-start latency
- ❌ P3-E19 (Cloud Functions Domain Split) is pending — this function would need to be moved again. Adds churn.

**Verdict:** Rules-change risk is well-managed by the explicit human approval gate in Strategy 1. Strategy 3's deployment complexity and P3-E19 timing make it less attractive than Strategy 1.

---

## Recommended Strategy: **1**

Strategy 1 isolates admin creation logic cleanly, delivers the < 2 minute acceptance criterion, makes no changes to the public booking form, and explicitly gates the only risky step (Firestore rules) behind human approval. The `LeadSource` type and `createdBy` interface field are already in the shared types package — only the service function, UI, rules, and i18n are new work.

---

## Implementation Order (Strategy 1 — Phase B)

1. Add `adminBookingSchema` to `bookingSchema.ts`
2. Add `createAdminBooking()` to `firestore.ts`
3. Build `AdminBookingModal.tsx` (three sections; RegisterStaffModal pattern)
4. Add "New Booking" button + modal state to `BookingsTable.tsx`
5. Add `handleAdminCreate()` to `useBookings.ts`
6. Add i18n keys to `en.json` / `fr.json`
7. Run Brand_Auditor, Linguistic_Auditor, Data_Steward
8. `npm run build && npm run lint` — must pass clean
9. **HALT — write updated `firestore.rules`, present to human for approval before deploying**
10. After approval: `npx firebase deploy --only firestore:rules`
11. Phase C: add `createdBy` to `firestore-schema.md`, update `ACTIVE_CYCLE.md`, write close report

**AWAITING HUMAN APPROVAL OF STRATEGY 1 BEFORE PROCEEDING TO PHASE B.**
