# F03 Planning — Booking-to-Job Pipeline
**Epic:** F03 | **Phase:** Phase 3 (Job Lifecycle) | **Date:** June 14, 2026  
**Primary Personas:** Sarah (P12 — Compliance / Admin), Brenda (P11 — Photo Verification), all staff via job creation foundation

---

## 1. Persona Analysis & Acceptance Gate

F03 establishes the bridge between a confirmed booking and an actionable job record. Without this pipeline, no FSM scheduling, claiming, or execution (F08, F09) is possible.

- **Sarah (P12):** Every confirmed booking must produce an immutable job record with a frozen `payRateSnapshot` captured at the moment of confirmation. If a pay rate changes tomorrow, previously created jobs must still show the rate in effect today.
- **Brenda (P11):** Job documents must include a `checklistTemplate` reference so that photo requirements are baked into the job at creation — not left as an afterthought at execution time.
- **All staff (P7–P10):** The job document's structure must be schema-complete for F08 (shift claiming) to perform constraint validation without any backfilling.

---

## 2. Decisions Captured

| Decision | Choice |
| :--- | :--- |
| Trigger strategy | `onDocumentUpdated` on `bookings/{docId}` — fires when admin sets status → `'confirmed'` |
| Duplicate guard | Yes — query for existing job with `bookingId` before creating |
| Pay rate snapshot | Query `payRates` for active `cleaner` role rate; fall back to `null`/zero placeholder |
| Checklist template | Query `checklistTemplates` for matching `serviceType`; fall back to first active template |
| Template admin UI | Full Checklist Template Manager — new "Templates" tab in Customer App admin panel |
| Template editor UX | Drag-and-drop task list with EN/FR labels, icon selector, requiresPhoto, photoPhase |
| Booking backlink | Write `jobId` back to `booking.jobId` after job creation |
| Job visibility in admin | Read-only job status badge inline in the Bookings table |
| Firestore rules | Update `firestore.rules` and `firestore.dev.rules` for `jobs` and `checklistTemplates` |

---

## 3. 3-Strategy Plan

### Strategy 1: Transactional Trigger + Full Template Manager (Recommended)

Implements `onBookingStatusConfirmed` as an `onDocumentUpdated` Cloud Function. Uses a Firestore transaction to atomically create the job and write the `jobId` back to the booking. Adds a full "Templates" tab to the Customer App admin panel with a drag-and-drop task editor.

**Files Created/Modified:**

*Cloud Functions:*
- `functions/src/jobs.ts` — new: job creation logic, pay rate resolution, checklist resolution
- `functions/src/index.ts` — add `onBookingStatusConfirmed` export

*Firestore Rules:*
- `firestore.rules` — add `jobs` and `checklistTemplates` rules
- `firestore.dev.rules` — mirror same additions

*Customer App — Checklist Template Manager:*
- `apps/customer/src/components/admin/ChecklistTemplateManager.tsx` — new CRUD component with drag-and-drop task editor
- `apps/customer/src/components/admin/hooks/useChecklistTemplates.ts` — Firestore CRUD hook
- `apps/customer/src/pages/AdminPage.tsx` — add "Templates" tab (4th tab)

*Customer App — Bookings Table:*
- `apps/customer/src/components/admin/BookingsTable.tsx` — add job status badge column

*Types & Firestore:*
- `apps/customer/src/types/index.ts` — add `Job`, `ChecklistTemplate`, `ChecklistTask`, `PayRateSnapshot` types
- `apps/customer/src/lib/firebase/firestore.ts` — add `subscribeToJobs()`, template CRUD functions

*i18n:*
- `apps/customer/src/i18n/locales/en.json` — add `admin.templates.*` keys
- `apps/customer/src/i18n/locales/fr.json` — add `admin.templates.*` French keys

**Persona Impact:**
- *Sarah (P12):* `payRateSnapshot` frozen at job creation. Booking table shows job status badge for operational overview.
- *Brenda (P11):* `checklistTemplate` with `requiresPhoto` and `photoPhase` fields baked in at job creation.
- *All staff:* Schema-complete job documents ready for F08 constraint validation.

**Risks & Mitigation:**
- *Risk:* `onDocumentUpdated` fires for every field change on a booking — could create duplicate jobs.
  - *Mitigation:* Guard with `before.status !== 'confirmed' && after.status === 'confirmed'` plus a `bookingId` existence query.
- *Risk:* Transaction write-back to booking could contend with admin dashboard updates.
  - *Mitigation:* Use `db.runTransaction()` for atomic write.
- *Risk:* Drag-and-drop requires `@dnd-kit` — new dependency.
  - *Mitigation:* `@dnd-kit/core` + `@dnd-kit/sortable` are lightweight and well-maintained.

**Schema Audit:**
- `jobs`: all required fields from schema mapped (`bookingId`, `clientName`, `clientAddress`, `clientPhone`, `clientNotes`, `serviceType`, `scheduledDate`, `scheduledStartTime`, `scheduledEndTime`, `status: 'unassigned'`, `assignedTo: null`, `checkedInAt: null`, `checkedInGeo: null`, `completedAt: null`, `payRateSnapshot`, `checklistTemplate`, `checklistCompletions: []`, `photos: []`, `createdAt`).
- `checklistTemplates`: `name`, `serviceType`, `tasks[]`, `active`.
- `bookings` backlink: `jobId` added.

---

### Strategy 2: Trigger Only, No Template Manager

Cloud Function only. Template CRUD deferred — templates seeded via Firebase Console.

- *Persona Impact:* No admin control over templates. Sarah must use Firebase Console to seed data.
- *Risks:* Blocks F08/F09 until manually seeded. Incomplete deliverable per F03 spec.

---

### Strategy 3: Client-Side Job Creation (No Cloud Function)

A client-side hook polls confirmed bookings and creates jobs from the browser.

- *Persona Impact:* Jobs only created when admin panel is open — unacceptable for production.
- *Risks:* No atomicity, silent failures, violates server-side business logic principle.

---

## 4. Recommended Choice & Rationale

**Strategy 1** is recommended.

The Firestore transaction guarantees atomicity and idempotency. The duplicate guard prevents re-fires. The Template Manager gives Sarah operational control. Drag-and-drop task ordering respects Brenda's photo requirement fields as first-class schema elements — not optional bolt-ons.

---

## 5. Implementation Checklist

### Cloud Function
1. [ ] Create `functions/src/jobs.ts` with `createJobFromBooking()` helper
2. [ ] Add `onBookingStatusConfirmed` to `functions/src/index.ts`
3. [ ] Guard: `before.status !== 'confirmed' && after.status === 'confirmed'`
4. [ ] Guard: query `jobs` for existing `bookingId` — skip if found
5. [ ] Resolve `payRateSnapshot`: query `payRates` for active `cleaner` rate; fall back gracefully
6. [ ] Resolve `checklistTemplate`: query `checklistTemplates` for matching `serviceType`; fall back to first active
7. [ ] Use `db.runTransaction()`: create job + write `jobId` back to booking atomically

### Firestore Rules
8. [ ] `firestore.rules`: `jobs` — staff can read assigned jobs; admins read/write all
9. [ ] `firestore.rules`: `checklistTemplates` — admin write, authenticated staff read
10. [ ] Mirror both in `firestore.dev.rules`

### Customer App — Types
11. [ ] Add `Job`, `ChecklistTemplate`, `ChecklistTask`, `PayRateSnapshot` to `apps/customer/src/types/index.ts`

### Customer App — Firestore Hooks
12. [ ] Add `subscribeToJobs()` to `firestore.ts`
13. [ ] Add `subscribeToChecklistTemplates()`, `createChecklistTemplate()`, `updateChecklistTemplate()`, `deleteChecklistTemplate()` to `firestore.ts`

### Customer App — Template Manager UI
14. [ ] Create `useChecklistTemplates.ts` hook
15. [ ] Install `@dnd-kit/core` and `@dnd-kit/sortable`
16. [ ] Create `ChecklistTemplateManager.tsx` with drag-and-drop task editor (EN/FR labels, icon, requiresPhoto, photoPhase)
17. [ ] Add "Templates" tab to `AdminPage.tsx`
18. [ ] Add `admin.templates.*` keys to `en.json` and `fr.json`

### Customer App — Bookings Table
19. [ ] Add `jobId`/job status badge to `BookingsTable.tsx`

### Verification
20. [ ] Audit styles — `Brand_Auditor`
21. [ ] Audit Firestore ops — `Data_Steward`
22. [ ] Audit translation hooks — `Linguistic_Auditor`
23. [ ] `npm run build` — zero TypeScript errors
24. [ ] `npm run lint` — zero ESLint warnings
25. [ ] Unit tests for `onBookingStatusConfirmed`: duplicate guard, payRate fallback, template fallback

---

## 6. Persona Acceptance Tests (Phase C Gate)

| Persona | Test | Pass Condition |
| :--- | :--- | :--- |
| **Sarah (P12)** | Admin confirms a booking → job appears in Bookings table with "Unassigned" badge | Job doc exists in `/jobs` with correct `bookingId`, `payRateSnapshot`, and `checklistTemplate` |
| **Sarah (P12)** | Admin confirms booking when no `payRates` exist | `payRateSnapshot` falls back gracefully — no Cloud Function crash |
| **Sarah (P12)** | Admin creates a checklist template with 3 tasks (one requiring a before-photo) | Template saved to `checklistTemplates` with correct `tasks[]` array |
| **Sarah (P12)** | Admin confirms the same booking twice (status re-saved) | Only ONE job document exists for that `bookingId` |
| **Brenda (P11)** | Job's `checklistTemplate` references a document with `requiresPhoto: true` tasks | Confirmed by reading the job document post-creation |
