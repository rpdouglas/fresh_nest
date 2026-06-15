# F11/F15 Planning — Audit Logs & SMS Alerts / Staff Notifications
**Epic:** F11 & F15 | **Phase:** Phase 4 (Operations & Compliance) | **Date:** June 15, 2026  
**Primary Personas:** Sarah (P12 — Compliance / Owner), Travis (P2 — Mobile fast notifications), Jasmine (P8 — Transit connectivity alerts), Ahmed (P10 — ESL in-app visibility)

---

## 1. Persona Analysis & Acceptance Gate

This combined epic introduces administrative compliance auditing (F11) and real-time staff scheduling alerts (F15).

- **Sarah (P12):** Needs a clear, read-only log of all security/business overrides (such as cap violations, travel conflicts, and blocked window bypasses) to trace operational deviations. The logs must detail who did what, when, and the reason provided.
- **Travis (P2) & Jasmine (P8):** Require immediate notification when shifts are assigned or changed. Since Jasmine has transit gaps, in-app notifications must be cached locally in the FSM PWA, while SMS notifications (via Twilio) serve as immediate push alerts.
- **Ahmed (P10):** Needs a visual and accessible way to view new unassigned shifts or shift updates in the FSM app without hunting through menus. A prominent header notification bell with an unread badge resolves this.
- **Compliance Rules:** All notifications and SMS messages must respect the cleaner's preferred language (`en`/`fr`), ensuring total bilingual compliance. (Arabic is out of scope for this iteration per user feedback).

---

## 2. Decisions Captured

Based on persona requirements and system constraints:

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| **Audit Log Perms** | Allow admin write (`allow create: if isAdmin()`) in `firestore.rules`. | Resolves the current rule mismatch preventing `assignCleanerTransaction` from recording overrides. |
| **Audit UI Location** | Main tab ("Audit Logs") in Customer Admin Panel. | Consolidated admin tools pattern; uses Google OAuth auth checks. |
| **Notification Center** | Header bell dropdown next to language selector in `FsmLayout.tsx`. | Clean, accessible mobile layout; does not clutter navigation. |
| **Triggers** | Server-side Cloud Functions `onJobCreated` and `onJobUpdated`. | Centralized and secure. Triggers SMS (Twilio) and writes to `notifications/{staffId}/messages/{msgId}`. |
| **General Postings** | Trigger in-app alerts to all active cleaners when an unassigned job is created. | Alert cleaners of new available shifts without spamming SMS. |
| **SMS Language** | Read language preference from `staff/{uid}.preferences.language` (`en` or `fr`). | Bilingual compliance. |

---

## 3. 3-Strategy Plan

### Strategy 1: Real-Time Cloud Function Triggers + Admin Audit Tab + Header Bell Notification Dropdown (Recommended)

Implements server-side Firestore triggers to monitor job creation/updates. Triggers send localized SMS alerts (Twilio) and create documents in the in-app notification subcollection. Updates `firestore.rules` to permit admin-created audit entries. Creates a dedicated "Audit Logs" tab in the admin dashboard and a responsive bell dropdown notification menu in the FSM Portal.

**Files Created/Modified:**

*Firestore Rules & Schema:*
- `firestore.rules` & `firestore.dev.rules` — modify: allow `create` on `/auditLog` if `isAdmin()`
- `docs/firestore-schema.md` — modify: document `/notifications` subcollection schema

*Customer App (Audit UI):*
- `apps/customer/src/pages/AdminPage.tsx` — modify: add `auditLogs` to activeTab enum, render `AuditLogsTable`
- `apps/customer/src/components/admin/AuditLogsTable.tsx` — new: table displaying all audit records with collection, type, changer, date, and comparison values, plus search/filter controls
- `apps/customer/src/components/admin/hooks/useAuditLogs.ts` — new: TanStack Query hook subscribing to `/auditLog`

*FSM App (Notifications UI):*
- `apps/fsm/src/types/index.ts` — modify: add `Notification` type definition
- `apps/fsm/src/components/layout/FsmLayout.tsx` — modify: implement notifications bell dropdown with unread badge count
- `apps/fsm/src/hooks/useNotifications.ts` — new: TanStack Query hook subscribing to `/notifications/{staffId}/messages` and batch-marking messages as read
- `apps/fsm/src/i18n/locales/en.json` & `fr.json` — modify: add translation strings for notifications and audit UI

*Cloud Functions:*
- `functions/src/notifications.ts` — new: localized message templates and SMS/in-app dispatch helpers
- `functions/src/index.ts` — modify: export `onJobCreatedTrigger` and `onJobUpdatedTrigger` Firestore trigger functions, attaching the twilio/resend secrets

**Persona Impact:**
- *Sarah (P12):* Seamless compliance visibility. All overrides (blocked windows, travel buffers, earnings caps) appear in a search-friendly table.
- *Jasmine (P8):* In-app notifications are stored in Firestore cache, meaning she can review her notification inbox offline.
- *Travis (P2) & Ahmed (P10):* Fast, automated SMS push alerts. Ahmed sees a clear red counter badge when new shifts are available.

**Risks & Mitigation:**
- *Risk:* Infinite loop of notifications if a function trigger updates the same job document.
  - *Mitigation:* The triggers do NOT write back to the job document; they only write to the independent `/notifications` collection and execute Twilio calls.
- *Risk:* Twilio charges incurred by automated dev tests.
  - *Mitigation:* Triggers verify database ID; if `database !== '(default)'`, they skip Twilio API calls and log a console warning.

---

### Strategy 2: SMS Only (Deconstruct In-App Notification Center)

Only build the server-side Cloud Function SMS dispatcher and the Admin Audit Log UI. Do not create the in-app bell notification system.

- **Persona Impact:** Jasmine will miss alerts if she is underground or in a signal dead-zone since SMS requires active cell reception. Ahmed has no visual in-app log of shift offers.
- **Risks:** Fails the offline-first notification requirement. Leaves the `/notifications` subcollection rule in `firestore.rules` unused.

---

### Strategy 3: Client-Side Notification Dispatch (Exposing Credentials)

Perform SMS dispatch and in-app writes directly from the web client inside transactions (e.g. inside `assignCleanerTransaction` or FSM claiming hooks).

- **Persona Impact:** High security risk for Sarah. Twilio SID and Auth Token secrets would be exposed in the client build, violating security policies.
- **Risks:** Hard reject by Security Auditor. Fails the server-side isolation contract.

---

## 4. Recommended Choice & Rationale

**Strategy 1** is recommended.  
It solves the database rules write block immediately, provides Sarah with robust audit oversight, delivers offline-cached notification feeds to Jasmine, and ensures immediate, bilingual SMS alerts to Travis and Ahmed without exposing Twilio credentials to client-side bundles.

---

## 5. Implementation Checklist

### Step 1: Database & Rules Hardening
1. [ ] Update `firestore.rules` and `firestore.dev.rules` to allow `create` on `auditLog` collection if `isAdmin()`.
2. [ ] Add `/notifications` subcollection schema details to `docs/firestore-schema.md`.

### Step 2: Admin App — Audit Logs UI (F11)
3. [ ] Create `apps/customer/src/components/admin/hooks/useAuditLogs.ts` to subscribe to `/auditLog` ordered by `changedAt: desc`.
4. [ ] Create `apps/customer/src/components/admin/AuditLogsTable.tsx` featuring filtering by override type (earnings, travel, blocked) and collection, with a text search.
5. [ ] Integrate `AuditLogsTable` inside `apps/customer/src/pages/AdminPage.tsx` under a new main tab. Add localized tabs in English/French translation files.

### Step 3: Cloud Functions Triggers (F15)
6. [ ] Create `functions/src/notifications.ts` containing SMS/in-app dispatch helpers and localized EN/FR templates for:
   - Shift assignment: "A new shift on [Date] at [Time] has been assigned/claimed for you."
   - Shift unassignment: "You have been unassigned from your shift on [Date] at [Time]."
   - Shift cancellation: "Your shift on [Date] at [Time] has been cancelled."
   - General Posting: "A new shift is available on the Shift Board for [Date]."
7. [ ] Export `onJobCreatedTrigger` in `functions/src/index.ts` to notify all active staff when an unassigned job is created.
8. [ ] Export `onJobUpdatedTrigger` in `functions/src/index.ts` to notify cleaners on `assignedTo` updates (handles both admin assignments and cleaner claims) or when a status changes to `'cancelled'`.

### Step 4: FSM Portal — Notification Center UI (F15)
9. [ ] Define `Notification` interface in `apps/fsm/src/types/index.ts`.
10. [ ] Create `apps/fsm/src/hooks/useNotifications.ts` to subscribe to `notifications/{uid}/messages` (real-time, cached) and handle bulk-read updates.
11. [ ] Add Bell Icon dropdown inside `apps/fsm/src/components/layout/FsmLayout.tsx` next to the language toggle. Support EN/FR strings.
12. [ ] Verify that tapping notifications navigates staff members directly to the corresponding `/jobs/:id` details.

### Step 5: QA & Compliance
13. [ ] Write Vitest unit tests in `apps/customer` and `apps/fsm` to verify audit logs subscribe cleanly and notifications update properly.
14. [ ] Verify `npm run build && npm run lint` pass successfully.

---

## 6. Persona Acceptance Tests (Phase C Gate)

| Persona | Test Scenario | Pass Condition |
| :--- | :--- | :--- |
| **Sarah (P12)** | Assigns cleaner violating blocked window constraint | Sarah is prompted with override warning, enters reason, completes assignment. Audit Logs tab displays log entry with her email, override type, and explanation. |
| **Travis (P2)** | Admin assigns Travis to a shift | Travis immediately receives SMS alert in his preferred language (EN or FR) with scheduled date and time. |
| **Ahmed (P10)** | Logs into FSM Portal after new shift is posted | Red badge indicator shows `1` next to bell icon. Tapping dropdown displays shift notice in English (or French if preferred). Tapping notice redirects to Shift Board to claim. |
| **Jasmine (P8)** | Taps "Mark all as read" while offline | In-app notifications immediately update client-side to read state. On signal restoration, changes sync to Firestore. |
