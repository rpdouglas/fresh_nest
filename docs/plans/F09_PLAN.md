# F09 Planning — Job Execution & Offline PWA
**Epic:** F09 | **Phase:** Phase 3 (Job Lifecycle & Pipeline) | **Date:** June 15, 2026  
**Primary Personas:** Ahmed (P10 - ESL / RTL support / Icon-first checklist), Brenda (P11 - Photo verification / Geotagging), Jasmine (P8 - Transit commuter / Offline support), Sarah (P12 - Compliance / Audit trail)

---

## 1. Persona Analysis & Acceptance Gate

F09 establishes the core execution page for cleaners when they perform a job. It integrates offline check-in/out, checklist tracking, geolocation tagging, and background photo uploads.

- **Ahmed (P10):** Needs a highly visual, icon-first task checklist. A two-tap sequence (tap to expand, tap to confirm) prevents accidental completions. The entire interface, navigation, and settings must fully support Arabic and RTL layout. A language selection modal must be displayed on first login if no preference is configured.
- **Brenda (P11):** Requires photo verification for designated task types (e.g., Stove, Fridge, Entry). The complete button remains disabled until a photo is captured. Photos must be tagged with accurate timestamps, geolocation coordinates (or flagged as non-geotagged if permissions are denied), and her staff ID.
- **Jasmine (P8):** Operates in transit dead-zones and client basements with poor connectivity. The PWA shell must load offline, and check-in/out and checklist updates must save to Firestore's local cache. Photos captured offline must queue securely in IndexedDB and sync automatically when internet is restored.
- **Sarah (P12):** Requires immutable audit records. Jobs must freeze accurate timestamps for check-in, check-out, and checklist task completion. Geolocation coordinates must be stored securely to prove cleaner presence.

---

## 2. Decisions Captured

Based on persona requirements and system design constraints:

| Decision | Choice |
| :--- | :--- |
| **Primary Scope** | Full F09 Job Execution Page, Offline Sync Manager, first-login language overlay, and Arabic translations. |
| **Task Completion UX** | Two-tap sequence: tap the task card to expand and reveal its details, then tap a large "Confirm Done" button. |
| **Offline Photo Queue** | Queue photo blobs and metadata in a native IndexedDB instance. Automatically upload queued photos in the background on network restoration. |
| **Sync Visibility** | Display a global sticky header banner showing sync status ("Syncing... 3 photos pending") and display a small "Offline" badge on the photo preview until uploaded. |
| **Arabic Support** | Add `ar` to i18n locales, translate all FSM UI keys, and configure global `dir="rtl"` layout toggles when `ar` is active. |
| **First-Login Gate** | Render a fullscreen language selection overlay on first portal login if `staffProfile.preferences.language` is unset, updating Firestore. |

---

## 3. 3-Strategy Plan

### Strategy 1: Offline PWA Job Page + Native IndexedDB Queue + Geolocation + Arabic RTL (Recommended)

Build `JobPage.tsx` at `/jobs/:id` with complete offline capability. Design a custom hook `useJob.ts` to manage real-time subscriptions with Firestore's offline cache. Create a custom native IndexedDB utility to queue photo blobs offline. Set up a React Context `OfflineUploadProvider` to manage connection listeners and background uploads. Implement the first-login language selection modal.

**Files Created/Modified:**

*FSM App:*
- `apps/fsm/src/lib/utils/indexedDb.ts` — new: native IndexedDB operations (`openDB`, `addQueuedPhoto`, `getQueuedPhotos`, `deleteQueuedPhoto`)
- `apps/fsm/src/context/OfflineUploadContext.tsx` — new: tracks connectivity, queues uploads, and triggers Firebase Storage uploads on reconnect
- `apps/fsm/src/hooks/useJob.ts` — new: subscribes to a single job document in Firestore with cache support
- `apps/fsm/src/components/ui/TaskIcon.tsx` — new: SVG dictionary mapping task names to standard icons (mop, toilet, bed, etc.)
- `apps/fsm/src/components/auth/LanguageSelectionOverlay.tsx` — new: fullscreen modal for first-time language selection
- `apps/fsm/src/pages/JobPage.tsx` — new: job execution card list, check-in, check-out, checklist, photo capture, and sync banners
- `apps/fsm/src/pages/JobPage.test.tsx` — new: vitest suite for check-in/out, checklist completion, and photo gating
- `apps/fsm/src/App.tsx` — route `/jobs/:id` maps to `JobPage`
- `apps/fsm/src/components/layout/FsmLayout.tsx` — extend language toggle to support English, French, and Arabic; check layout direction
- `apps/fsm/src/pages/LoginPage.tsx` — add Arabic to the language toggle
- `apps/fsm/src/i18n/locales/en.json`, `fr.json`, `ar.json` — add translations for F09 job execution, checklists, and sync status

**Persona Impact:**
- *Ahmed:* Beautiful Arabic RTL view, visual task cards with icons, language modal on first login, simple two-tap completion.
- *Brenda:* Hard photo gating for before/after tasks, timestamp and geotag capture, immutable staff metadata.
- *Jasmine:* Smooth offline page load, offline check-in/out, background photo queueing with zero data loss.
- *Sarah:* Audit-grade, tamper-proof timestamps and location tags for billing and payroll verification.

**Risks & Mitigation:**
- *Risk:* A cleaner opens a job page for the first time while offline, but the corresponding `checklistTemplate` document is not in the Firestore local cache.
- *Mitigation:* Pre-fetch the `checklistTemplate` documents in `MyJobsPage` or `ShiftBoardPage` while the user is still online, ensuring they are populated in Firestore's IndexedDB cache before going offline.

---

### Strategy 2: Online-Only Photo Upload (IndexedDB Deferred)

Do not implement IndexedDB queueing. If the cleaner is offline, disable photo capture and display a warning banner. Firestore checklist status can still be updated offline, but tasks requiring photos (Stove, Fridge, Entry) cannot be completed until the device returns online.

- *Persona Impact:* Jasmine and Brenda will be blocked from completing deep-clean checkouts if they are working in basements or remote zones with no signal.
- *Risks:* Violates the core offline PWA requirements in the FSM roadmap.

---

### Strategy 3: Basic Checkboxes (No Gating, Check-in/out, or Photo Enforcement)

Render a flat checklist of checkboxes. Remove check-in/out, location capturing, and photo requirements. Cleaners just check off items on screen.

- *Persona Impact:* Fails P11 Brenda's need for dispute protection, P12 Sarah's compliance auditing, and P10 Ahmed's visual interface.
- *Risks:* Non-compliant with Master Plan and ADRs.

---

## 4. Recommended Choice & Rationale

**Strategy 1** is recommended.  
It fully addresses the offline requirements for Jasmine, satisfies the visual, ESL, and language requirements for Ahmed, enforces the dispute-protection photo logs for Brenda, and generates compliance-grade audit records for Sarah. Doing this without third-party dependencies keeps the bundle size slim and compile cycles fast.

---

## 5. Implementation Checklist

### Database & Helpers
1. Create `apps/fsm/src/lib/utils/indexedDb.ts` to manage the photo upload queue.
2. Create `apps/fsm/src/components/ui/TaskIcon.tsx` to serve custom SVGs for `mop`, `toilet`, `trash`, `key`, `bed`, `oven`, `fridge`, `window`, `photo`, `check`, `vacuum`, `sink`.
3. Create `apps/fsm/src/hooks/useJob.ts` to fetch and subscribe to single job documents.

### Context & Sync
4. Create `apps/fsm/src/context/OfflineUploadContext.tsx`. Track `navigator.onLine` and coordinate uploads of pending IndexedDB blobs. On successful upload, replace local placeholder URLs with real Firebase Storage URLs in Firestore.
5. Register `OfflineUploadProvider` in `apps/fsm/src/App.tsx`.

### UI Pages & Layouts
6. Create `apps/fsm/src/components/auth/LanguageSelectionOverlay.tsx` to prompt for language on first login if unset.
7. Update `FsmLayout.tsx` and `LoginPage.tsx` with Arabic (`ar`) language selectors and dynamic layout direction toggling (`dir="rtl"`).
8. Create `apps/fsm/src/pages/JobPage.tsx` with:
   - Check-in button with geotag trigger.
   - Global Sync Banner ("Syncing X photos...").
   - Chronological task list with icons.
   - Two-tap completion: tap task to expand, tap "Confirm Done" button.
   - Photo capture gating using `<input type="file" accept="image/*" capture="environment">`.
   - Check-out button (active when all tasks are complete).
9. Map `/jobs/:id` to `JobPage` in `App.tsx`.

### Translations & Testing
10. Update translation locale files (`en.json`, `fr.json`, `ar.json`) with F09 keys.
11. Write Vitest unit tests in `apps/fsm/src/pages/JobPage.test.tsx`.
12. Verify all test suites and compile production bundles cleanly.

---

## 6. Persona Acceptance Tests (Phase C Gate)

| Persona | Test Scenario | Pass Condition |
| :--- | :--- | :--- |
| **Ahmed (P10)** | First login to portal | Fullscreen overlay appears prompting for English, French, or Arabic. Selecting Arabic sets the app layout to RTL and translates all strings. Task cards show clear, descriptive icons. |
| **Brenda (P11)** | Completes deep clean Stove task | Stove task shows a camera icon. Tapping the task expands it, but the "Confirm Done" button is disabled until she snaps and uploads a photo. |
| **Jasmine (P8)** | Executes job in basement (offline) | She checks in, ticks off tasks, captures photos, and checks out. Everything saves in local cache, and pending photos are queued in IndexedDB. Once she reaches street level (online), all data syncs and photos upload. |
| **Sarah (P12)** | Audits completed job in dashboard | The job document has accurate, immutable `checkedInAt`, `checkedInGeo`, `completedAt`, and `photos` metadata. |
