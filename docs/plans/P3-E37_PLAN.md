# P3-E37 Plan — Audit Everywhere (W0-3)

**Spec:** [`projects/P3-E37.md`](../projects/P3-E37.md) · **Date:** 2026-10-28 · **Status:** Strategy 1 approved 2026-10-28 (Phase B)

The owner decisions (spec §"Owner decisions") fix *what* we build. The three strategies below differ in **how the triggers are organised** and **how it ships**.

## Shared design (all strategies)

### `lastChange` stamp (new field on audited records)
| Field | Type | Rule |
|---|---|---|
| `lastChange.by` | string | App writes: must equal `request.auth.token.email` (lowercased). Server: `system:<function>` or the acting caller's email |
| `lastChange.at` | Timestamp | App writes: must equal `request.time` (`serverTimestamp()`) |
| `lastChange.source` | string | `admin` \| `staff_app` \| `customer` \| `public_form` \| `system`. Rules check it fits the role: office → `admin`; staff → `staff_app`; customer → `customer` |
| `lastChange.reason` | string \| null | Optional, ≤ 500 chars |
| `lastChange.overrideType` | string \| null | Optional; conflict overrides (`travel_conflict_exceeded`, …) |

**Trigger attribution:**
- If `lastChange.at` changed in this write, the actor is `lastChange.by`.
- Otherwise the actor is `system:unknown`. This covers the console, a missed server stamp, or an older app during the tolerant period, which is labelled *"unknown — older app version"* when the write came from a client.
- A later server change therefore can never be credited to the last person who edited by hand.

### `auditLog` entry (schema additions; old fields kept)
- `actor`, `source`, `action` (`create` | `update` | `delete`), `changes: [{ field, before, after }]`, `reason`, `overrideType`, `changedAt` (server time).
- `collection` and `documentId` as today; `recordLabel` (e.g. client name + date) so lists read without extra lookups.
- `field` / `oldValue` / `newValue` become optional; they are kept on old rows.

### Pure diff engine — `packages/shared/src/domain/audit.ts` (synced to `functions/src/shared/`)
- `AUDIT_CONFIG[collection] = { fields: [...watched paths], label: (doc) => string, snapshotOnDelete: true }`.
- `buildAuditEntry(collection, before, after, now)` returns an entry, or `null` when no watched field changed.
- It handles nested paths (`financials.monthlyEarningsLimit`), arrays (blocked windows, checklist tasks: compared as JSON), timestamps (millisecond compare), and `create`/`delete`.
- Values are trimmed: long text is capped at 1 000 chars, and photo arrays are never copied.

### Rules (`firestore.rules`, `firestore.dev.rules`)
- **`auditLog`:** `allow read: if isOffice(); allow create, update, delete: if false;`
- **`validLastChange()`:** a helper used on create/update of bookings, jobs, staff, checklistTemplates, payRates, galleryPairs and reviews.
  - **Tolerant period:** the stamp may be absent; if present, `by`, `at` and `source` must be valid.
  - **Follow-up PR:** the stamp becomes required for app writes, except the public booking create (`source: 'public_form'` allowed without auth).
- Existing `affectedKeys().hasOnly([...])` lists for the staff app (jobs, staff self-edit) gain `'lastChange'`.
- The public booking create allows `lastChange` absent, or present with `source: 'public_form'`.

### Writers to update (~30 save points)
- **Customer app `lib/firebase/firestore.ts`:**
  - `createAdminBooking`, `updateBookingStatus`, `updateBookingAssignment`, `assignCleanerTransaction`;
  - checklist template create/update/archive, `attachJobChecklist`, `setBookingChecklistTemplate`;
  - `createPayRate`, `updateReviewStatus`, `submitReview` (job flag).
  - A `stampChange(source, extras)` helper builds the stamp.
- **Gallery:** `lib/firebase/gallery.ts`. Deletes are stamped first, then deleted, so the delete entry has an actor.
- **Customer portal:** `CustomerUpcomingPage` (cancel), `submitBooking` (public form).
- **Staff app:** `JobPage` (start/complete/checklist), `OfflineUploadProvider`, `ProfilePage`, `TermsConsentOverlay`, `LanguageSelectionOverlay`.
- **Overrides:** `DispatchBoard` and `BookingDetailPanel` stop writing `auditLog` and put `reason` + `overrideType` in `lastChange` instead.
- **Functions:**
  - every server write to an audited collection stamps `lastChange` (renewals, booking triggers creating jobs, `claimJob` with the caller's email, the earnings rollover, `onStaffRegistered`, the compliance remediation…);
  - `onStaffUpdatedTrigger` drops its audit block.

### Screens
- **`RecordHistory` component:** collapsible, EN/FR; `useRecordHistory(collection, id)` queries `auditLog` by `collection` + `documentId`, ordered by `changedAt desc`, limit 50, with "load more". Placed in `BookingDetailPanel`, the Dispatch job card and the staff profile.
- **Audit Logs tab:**
  - renders the new shape and old rows;
  - filters by record type, person, source and date range; search by booking/job ID;
  - keeps the override filter.
- **Index:** `firestore.indexes.json` composite (`collection`, `documentId`, `changedAt desc`).

### Tests
- **Engine unit tests** in `packages/shared`.
- **Trigger wiring tests** in `functions/test`.
- **Rules tests:** audit lock, `lastChange` validation (absent OK, forged denied, wrong time denied, wrong source denied), and the staff-app `hasOnly` lists still passing.
- **Component tests:** RecordHistory and Audit Logs filters.
- **Admin visual harness:** seed audit rows; new History screenshot; existing baselines unchanged except where History appears (collapsed by default).

---

## Strategy 1 — One trigger per collection sharing the engine; ship in two PRs (recommended)
- **Functions:** `auditBookings`, `auditJobs`, `auditStaff`, `auditChecklistTemplates`, `auditPayRates`, `auditGalleryPairs`, `auditReviews`. Each is `onDocumentWritten` on its own collection, and each calls `buildAuditEntry` and writes once.
- **PR 1 — backend and rules:** engine, triggers, `lastChange` stamps in every writer, override migration, staff-trigger clean-up, audit lock, index, schema doc, tests. Writes start being audited the moment it deploys.
- **PR 2 — screens:** RecordHistory, Audit Logs filters/rendering, user guide, harness. It can follow within days; entries already exist by then.
- **PR 3 (~2 weeks later):** make `lastChange` required.
- **Persona impact:** Lauren gets a complete trail from PR 1 (visible in today's Audit Logs table), and the History sections from PR 2.
- **Risks:**
  - Seven new functions (deploy time; cold starts don't matter for triggers).
  - A missed server writer shows up as `system:unknown`; mitigated by grepping every `admin.firestore()` write to these collections plus a test per function.
- **Schema audit:**
  - adds `lastChange` (map) to 7 collections;
  - adds `actor`, `source`, `action`, `changes`, `recordLabel`, `reason` to `auditLog`;
  - `field` / `oldValue` / `newValue` become optional.
  - No fields are removed or renamed.

## Strategy 2 — A single wildcard trigger
- **Design:** one `onDocumentWritten('{collection}/{docId}')` that looks up `AUDIT_CONFIG[collection]` and ignores everything else.
- **Pros:** one function; adding a collection later is just config.
- **Cons:**
  - It fires on **every** top-level write: notifications, customers, referrals, reports, settings… That's extra invocations and cost on hot paths, and a bug there touches everything.
  - Harder to test and to reason about which writes are covered.
  - A wildcard at the database root is legal but unusual.
- **Risks:** cost and noise, plus a single point of failure.
- **Schema audit:** same as Strategy 1.

## Strategy 3 — Phase by collection, end to end
- **Phases:**
  - **PR A:** bookings + jobs complete (engine, triggers, stamps, overrides, History UI, rules).
  - **PR B:** staff, checklists, pay rates.
  - **PR C:** gallery, reviews, deletion snapshots, Audit Logs filters, audit lock.
- **Pros:** the History UI for bookings and jobs lands first; smaller reviews.
- **Cons:**
  - The **audit lock waits until PR C**, because the browser override rows (bookings/jobs) must stay writable until every writer has moved.
  - The rules and `lastChange` helper get edited three times.
  - The spec exit test ("every change audited") only passes at the end.
- **Risks:** a longer partial state; more rules deploys.
- **Schema audit:** same as Strategy 1, added in stages.

---

## Recommendation
**Strategy 1.** It meets the spec's exit test with the first PR, locks the log immediately, keeps each trigger small and testable, and puts the UI work in a separate, easy-to-review PR. The `lastChange` stamp is also what W0-6 (`applyScheduleChange`) will reuse.

## Rollout notes
- **PR 1 changes `firestore.rules`** and auto-deploys on merge (ADR-018) after the emulator tests pass. The PR description will say plainly that merging approves the rules change.
- **Tolerant period:** cached PWAs keep working. Entries from them read "unknown — older app version" until they refresh.
- **No backfill:** history starts at release. Old one-field rows remain.
