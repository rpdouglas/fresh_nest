---
epic: P3-E36
title: Operational Settings & Policy Record with Versioned History (W0-2) — Plan
strategy: 2
---

# P3-E36 PLAN — Operational Settings & Policy Record with Versioned History (W0-2)

**Phase A written:** 2026-10-27 · **Status:** 🔄 Awaiting human approval
**Spec:** [`../projects/P3-E36.md`](../projects/P3-E36.md)

## Personas
| Persona | Impact |
|---|---|
| **P12 Lauren (primary)** | Adjusts operational buffers, notice windows, fee amounts, ODSP defaults, and emergency contacts from `/admin` → **Settings** with full version history and audit trail |
| **Future Manager** | Views all active operational settings and version history in `/admin` → **Settings** (read-only) |
| **P8 Jasmine & P15 Daniel** | Travel buffer defaults (`defaultVehicleBufferMinutes`, `defaultTransitBufferMinutes`) drive Dispatch and Shift Board conflict checks dynamically |
| **P7 Carla & P13 Marcus** | Default ODSP cap (`defaultOdspMonthlyLimit`) and caution threshold (`earningsCautionThreshold`) drive staff onboarding defaults and the Safe-to-Earn gauge |
| **P3 Margaret** | All controls meet the 16px text (`text-base`) and 48px touch target (`min-h-[48px]`) floor |

---

## Strategy 1 — Single-document settings with inline history array
- Store both the active policy values and a `history: PolicyHistoryEntry[]` array inside a single `settings/policy` document; allow Owners to update it directly from the client via Firestore rules (`allow write: if isOwner()`).
- **Pros:** Simplest data model (one document).
- **Cons:**
  - Every staff member reading `settings/policy` downloads the entire historical array on every read.
  - Client-side writes can't enforce monotonic version numbering or guaranteed before/after diff calculation as reliably as a server transaction.
- **Risk:** Medium — unbounded document growth and weaker audit guarantees.

## Strategy 2 — `settings/policy` current doc + `settings/policy/history/{version}` subcollection via `updatePolicySettings` callable (Recommended)
- **Data model:**
  - `settings/policy` holds the current active `PolicySettings` (plus `version: number`, `updatedAt`, `updatedBy`, `lastChangeReason`), falling back to `DEFAULT_POLICY_SETTINGS` in `@freshnest/shared` whenever the doc does not exist yet.
  - `settings/policy/history/{version}` (append-only subcollection) stores each version's immutable snapshot, `version`, `changedAt`, `changedBy`, `reason`, and `changes: Array<{ field, oldValue, newValue }>`.
  - `auditLog` also receives a summary entry (`collection: 'settings'`, `documentId: 'policy'`, `overrideType: 'policy_change'`) so policy updates appear in the central **Audit Logs** tab too.
- **Server callable (`updatePolicySettings` in `functions/src/callable/settings.ts`):**
  - Verifies the caller is an **Owner** (`requireOwner` / `resolveOfficeRole === 'owner'`).
  - Parses the input with `PolicySettingsInputSchema` (shared Zod schema in `@freshnest/shared`).
  - Runs a Firestore transaction that reads `settings/policy`, computes the field-by-field diff against the previous state (or `DEFAULT_POLICY_SETTINGS` on v1), increments `version`, writes `settings/policy`, creates `settings/policy/history/{version}`, and adds the `auditLog` entry.
- **Live wiring (proving "a setting changes behaviour without a release"):**
  - `resolveBufferMinutes(staff, policy?)` in `packages/shared/src/domain/scheduling.ts` accepts optional `{ defaultVehicleBufferMinutes, defaultTransitBufferMinutes }` (defaulting to `30` / `60`).
  - Cloud Functions `claimJob` and `listOpenShifts` read `settings/policy` (falling back to `DEFAULT_POLICY_SETTINGS`) and pass the policy buffers into `checkCleanerEligibility`.
  - Admin `DispatchBoard` and `BookingDetailPanel` read `usePolicySettings()` and pass the active buffers into `checkCleanerEligibility`.
  - Admin `RegisterStaffModal` uses `policy.defaultOdspMonthlyLimit` as the initial ODSP monthly limit when registering an ODSP staff member, and FSM `ProfilePage` uses `policy.earningsCautionThreshold` for the caution band.
- **Admin UI (`apps/customer/src/components/admin/SettingsTab.tsx`):**
  - New `settings` tab in `ADMIN_TABS` (visible to both Owners and Managers; editable by Owners, read-only for Managers).
  - 4 clean card sections (Scheduling & Buffers, Staff Earnings & Time, Client Policies & Fees, Compliance & Emergency Contacts) + an expandable/scrollable **Version History** card showing version number, timestamp, author, reason, and changed fields (`old → new`).
- **Pros:** Fast reads on `settings/policy`, immutable server-enforced version history, zero client write surface in `firestore.rules`, and immediate live impact across Dispatch, Shift Board, and Staff Portal.
- **Cons:** Adds one callable function (`updatePolicySettings`).
- **Risk:** Low.

## Strategy 3 — Separate document per policy domain (`settings/scheduling`, `settings/fees`, `settings/compliance`)
- Split settings across 4 documents in `settings/{domain}` with separate callables and history subcollections per domain.
- **Pros:** Granular document reads.
- **Cons:** 4x the Firestore reads on load, fragmented version numbers across domains, and more complex Admin UI state.
- **Risk:** Medium — unnecessary fragmentation for ~22 scalar fields (~1 KB total).

---

## Schema Audit (`docs/firestore-schema.md`)
- New collection `settings` with singleton document `settings/policy` and subcollection `settings/policy/history/{version}`.
- No existing collection schemas are altered.

## Files to Create / Modify in Phase B
1. `packages/shared/src/types/settings.ts` & `packages/shared/src/schemas/settings.ts` — `PolicySettings`, `PolicyHistoryEntry`, `DEFAULT_POLICY_SETTINGS`, `PolicySettingsInputSchema`, and Firestore converters.
2. `packages/shared/src/domain/scheduling.ts` — optional `BufferPolicyConfig` parameter on `resolveBufferMinutes` and `checkCleanerEligibility` (synced to `functions/src/shared/scheduling.ts`).
3. `functions/src/callable/settings.ts` & `functions/src/index.ts` — `updatePolicySettings` callable + pure `computePolicyUpdate` helper.
4. `functions/src/callable/job.ts` & `functions/src/callable/shifts.ts` — pass `settings/policy` buffers into eligibility checks.
5. `firestore.rules` & `firestore.dev.rules` — `match /settings/policy` (`allow read: if isStaff(); allow write: if false;`) and `match /settings/policy/history/{versionId}` (`allow read: if isOffice(); allow write: if false;`).
6. `apps/customer/src/hooks/usePolicySettings.ts` & `apps/customer/src/components/admin/SettingsTab.tsx` — real-time settings hook + Admin Settings & Version History UI (wired into `adminTabs.ts` and `AdminPage.tsx`, plus `DispatchBoard.tsx`, `BookingDetailPanel.tsx`, and `RegisterStaffModal.tsx`).
7. `apps/fsm/src/pages/ProfilePage.tsx` — read `earningsCautionThreshold` from `settings/policy` (with `100` fallback).
8. `apps/customer/src/i18n/locales/{en,fr}.json` & `docs/firestore-schema.md`.
9. Tests: `functions/test/settings.test.ts`, `apps/customer/src/components/admin/SettingsTab.test.tsx`, and rules tests in `apps/customer/test/firestore-rules.test.ts`.
