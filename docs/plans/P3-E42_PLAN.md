# P3-E42 Plan — Won Lead to Camelo Bridge (Clients, Job Sites & Notes)

**Epic:** [`docs/projects/P3-E42.md`](../projects/P3-E42.md)
**Date:** 2026-11-25 · **Phase:** A (Awaiting Human Strategy Approval)
**Primary Personas:** P12 Lauren Arsenault (Owner), P16 Ryan (Manager)
**Secondary Personas:** P3 Margaret (a11y floor), P4 Kahnawà:ke & P5 Sophie (rural geocoding + EN/FR), P11 Brenda / P14 Sylvie / P8 Jasmine / P15 Daniel (cleaner-visible `jobSite.note`), P1 Diane (EN/FR parity, no public pricing)

---

## Schema Audit (`docs/firestore-schema.md`)

New optional server-written field on **`bookings/{bookingId}`**:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `camelo` | `map` | ❌ | P3-E42: Camelo sync link written only by server callables (`pushLeadToCamelo`, `updateCameloJobSiteNote`, `addCameloClientNote`): `{ clientId: string, clientName: string, clientCreated: boolean, jobSiteId: string, jobSiteName: string, jobSiteAddress: string, jobSiteNote: string \| null, scheduleId: string, scheduleName: string \| null, geoLat: number, geoLong: number, geoSource: 'nominatim' \| 'manual' \| 'fallback', initialCommentId: string \| null, syncedAt: Timestamp, syncedBy: string, lastNoteSyncAt?: Timestamp \| null, lastNoteSyncBy?: string \| null }`. Watched by `auditBookings` (P3-E37). |

- **No new Firestore collections required.** Geocoding reuses the existing server-only `schedulePlaces/{sha256(address)}` cache (`firestore-schema.md` §17.10) when reading/writing on `(default)`.
- **Security rules audit (`firestore.rules` & `firestore.dev.rules`, requires human sign-off in PR):**
  - Add `&& !('camelo' in request.resource.data)` to the public `bookings` create rule so signed-out quote submissions cannot forge Camelo sync links (mirrors P3-E40's `!('pipeline' in request.resource.data)` guard).
  - Admin SDK callables bypass client rules when stamping `bookings/{id}.camelo` and `lastChange`.
- **Compliance audit (`docs/COMPLIANCE.md` §2):**
  - `agreements/{id}/private/access` is **never** read or transmitted to Camelo.
  - Nominatim geocoding sends **only** the street address (never client name, email, or phone), matching FNC decision 0009.
  - `databaseId === 'freshnest-dev'` blocks live mutations against production Camelo so staging/preview tests cannot pollute production Camelo data.

---

## Three Strategies

### Strategy 1 — Minimal One-Click Callable in `functions/` (No Post-Sync Edits, No Client Matcher)
**Approach:** Add a single `pushLeadToCamelo` callable in `functions/src/callable/camelo.ts` that always creates a new Camelo Client + Job Site + optional comment using Nominatim geocoding (falling back silently to Cornwall coordinates), triggered from a simple button on `LeadDetailPanel`.

- **Files changed (~12 files):**
  - `packages/shared/src/types/booking.ts`, `packages/shared/src/domain/audit.ts`
  - `functions/src/lib/cameloClient.ts`, `functions/src/callable/camelo.ts`, `functions/src/index.ts`
  - `apps/customer/src/lib/firebase/camelo.ts`, `apps/customer/src/components/admin/LeadDetailPanel.tsx`, `apps/customer/src/i18n/locales/{en,fr}.json`
  - `firestore.rules`, `firestore.dev.rules`
- **Persona impact:** Fast for first-time clients, but **fails** returning-client deduplication (creates duplicate Camelo clients for P12 Lauren/P16 Ryan), offers no review/edit before writing cleaner-visible `jobSite.note`, gives no rural-address fallback control for P4/P5, and provides no post-sync note updates.
- **Risks:** High risk of duplicate clients in Camelo and unreviewed notes landing directly on cleaners' **My week** screens.
- **Verdict:** Too thin — misses decisions #1, #2, #3, #4, and #5 from `/grill-me`.

---

### Strategy 2 — Dedicated Office Callables in `functions/` + Full Review Modal & Post-Sync Controls in `apps/customer` ★ *(Recommended)*
**Approach:** Implement the Camelo bridge cleanly inside the main Fresh Nest backend (`functions/` default codebase) and Admin Portal (`apps/customer`), sharing `packages/shared/src/domain/cameloBridge.ts` (auto-synced to `functions/src/shared/` via `sync-shared.cjs`) and Secret Manager's existing `CAMELO_TOKEN` secret. Keep `functions-ops` untouched during its P3-E41 Phase 1 pay-parity window, while extending `apps/ops/e2e/fake-camelo.ts` so the pretend-Camelo harness stays aligned with the new mutations.

- **Architecture:**
  1. **Shared domain (`packages/shared/src/domain/cameloBridge.ts` + unit tests):**
     - `BookingCameloSync` types, callable request/response DTOs
     - `matchCameloClients(booking, cameloClients)` — ranked matching by exact email, normalized 10-digit phone, and case-insensitive name
     - `buildDefaultJobSiteNote(booking)` — cleaner-visible summary (`booking.notes`, pets, Airbnb, property/bed/bath) with zero access to `agreements/{id}/private/access`
     - `buildDefaultClientComment(booking, selectedLeadNotes)` — office-visible summary (service, frequency, date, language, lead source, internal quoted price, selected P3-E40 `leadNotes`)
     - `FALLBACK_CORNWALL_COORDS` (`45.0213, -74.7303`) & `DEFAULT_CAMELO_SCHEDULE_NAME = 'Clients'`
  2. **Shared types & audit (`packages/shared`):**
     - Add `camelo?: BookingCameloSync` to `Booking` (`types/booking.ts`)
     - Add `'camelo'` to `AUDIT_CONFIG.bookings.fields` (`domain/audit.ts`) so `auditBookings` records every Camelo sync and note update automatically
  3. **Backend (`functions/`):**
     - `functions/src/lib/cameloClient.ts` — lightweight Camelo GraphQL client (never retries `mutation`, retries read 429/5xx with `Retry-After`, injectable `fetchImpl` & `CAMELO_ENDPOINT` for pretend-Camelo testing) + typed wrappers for `listCameloClients`, `listCameloSchedules`, `createCameloClient`, `createCameloJobSite`, `updateCameloJobSiteNote`, `createCameloComment`
     - `functions/src/lib/geocode.ts` — address-only Nominatim lookup with `schedulePlaces` Firestore cache reuse (mirrors `functions-ops/src/routes/schedule-check.ts` & FNC 0009; never sends client PII)
     - `functions/src/callable/camelo.ts` — 4 office-only (`requireOffice`), Zod-validated, App-Check-aware, `databaseId`-scoped callables using `defineSecret('CAMELO_TOKEN')`:
       - `prepareLeadForCamelo` (reads booking + `leadNotes`, fetches Camelo clients + schedules, runs ranked matcher, geocodes address, returns pre-filled defaults & `isDevDryRun` flag)
       - `pushLeadToCamelo` (blocks live writes on `freshnest-dev` returning a dry-run notice; enforces idempotency if already synced; creates or links Client → creates Job Site with `clientIds`, `scheduleIds`, `geoLat`, `geoLong`, `note` → optionally creates `CLIENT` comment attributed to `actorEmail`; stamps `bookings/{id}.camelo` + `lastChange`)
       - `addCameloClientNote` (appends follow-up `CLIENT` comment to synced booking's `camelo.clientId`, stamps `lastChange`, blocked on `freshnest-dev`)
       - `updateCameloJobSiteNote` (updates `jobSite.note` via `updateJobSite`, updates `bookings/{id}.camelo.jobSiteNote` + `lastChange`, blocked on `freshnest-dev`)
     - `functions/src/index.ts` — export the 4 callables
     - `functions/test/camelo.test.ts` — full unit test suite against a pretend-Camelo fetch stub covering auth/RBAC, duplicate-client linking, new client + job site + comment, rural geocode miss/fallback, idempotency, `freshnest-dev` dry-run guard, and post-sync note updates
  4. **Admin Portal UI (`apps/customer`):**
     - `apps/customer/src/lib/firebase/camelo.ts` — typed `httpsCallable` wrappers (always passing `databaseId`)
     - `apps/customer/src/components/admin/CameloSyncModal.tsx` — WCAG 2.1 AA modal (`min-h-[48px]`, `text-base`, visible `<label>`s, Tailwind v3 tokens, `rounded`, Escape-to-close):
       - Highlighted existing Camelo client matches + Create New vs Link Existing picker
       - Editable Client fields (`name`, `email`, `phoneNumber`, `billingAddress`, optional `clientNumber`)
       - Editable Job Site fields (`name`, `address`, Schedule dropdown defaulting to `"Clients"`, geocode status + rural miss warning with re-geocode, manual `lat`/`lon`, or one-click Cornwall fallback pin)
       - Editable **Job Site Note** textarea (cleaner-visible) + editable **Client Comment** textarea with P3-E40 `leadNotes` checkboxes (office-visible)
       - Explicit staging/dry-run banner when targeting `freshnest-dev`
     - `apps/customer/src/components/admin/LeadDetailPanel.tsx` — Won-save prompt banner + **"Send to Camelo"** button for unsynced Won leads; **"Synced to Camelo"** status box + inline **"Add Camelo client note"** and **"Update Camelo job site note"** forms for synced leads
     - `apps/customer/src/components/admin/CameloSyncModal.test.tsx` + updated `LeadDetailPanel` tests
     - Full EN + FR copy in `apps/customer/src/i18n/locales/en.json` and `fr.json`
  5. **Rules, Pretend Camelo & Cleanup:**
     - `firestore.rules` & `firestore.dev.rules` — add `!('camelo' in request.resource.data)` to public `bookings` create rule + rules test in `apps/customer/test/firestore-rules.test.ts`
     - `apps/ops/e2e/fake-camelo.ts` — add `schedules`, `createClient`, `updateClient`, `destroyClient`, `createJobSite`, `updateJobSite`, `destroyJobSite`, and `CLIENT` comment support so pretend-Camelo stays consistent across the monorepo
     - Delete temporary `scripts/probe-camelo-clients.mjs`

- **Persona impact:** Satisfies **every** persona and `/grill-me` decision cleanly — zero double-entry for P12/P16, safe returning-client matching, rural Akwesasne/Snye QC fallback for P4/P5, accessible 48px/16px modal for P3, complete EN/FR copy for P1, cleaner-ready `jobSite.note` for P11/P14/P8/P15, and zero risk to `functions-ops` during P3-E41 Phase 1.
- **Risks & Mitigations:**
  - *Partial failure (Client created, then `createJobSite` fails):* If `createClient` succeeds and `createJobSite` fails, return the created `clientId` in the error payload and persist partial link or pre-select that client on retry so Lauren/Ryan never creates a duplicate Client on retry!
  - *Secret Manager access:* `functions/` needs `CAMELO_TOKEN` in `freshnest-aa51e` Secret Manager (already created for P3-E41; Firebase deploy grants access automatically when declared via `defineSecret('CAMELO_TOKEN')`).
  - *Firestore rules:* Requires human approval in the PR before merge (`ADR-018` auto-deploys rules on merge after emulator tests pass).

---

### Strategy 3 — Route Through `functions-ops` (`scheduleApi`) + Cross-Origin Bridge + Ops UI Tab
**Approach:** Add new HTTP routes (`/api/camelo-clients`, `/api/camelo-job-sites`) to `functions-ops` (`scheduleApi`), expose CORS from `ops.freshnestco.ca` to `www.freshnestco.ca`, call those HTTP endpoints from `apps/customer`, and also build a standalone Clients CRUD tab in `apps/ops`.

- **Files changed (~30+ files across `apps/customer`, `apps/ops`, `functions-ops`, `firebase.json`):**
  - Modifies `functions-ops/src/core.ts`, `functions-ops/src/routes/*`, `firebase.json` rewrites, CORS headers, and `apps/ops` UI while P3-E41 Phase 1 is in its pay-period parity freeze.
- **Persona impact:** Adds extra UI in `apps/ops` (English-only Tailwind v4 stack), but slows down delivery and couples `apps/customer` to `functions-ops`'s manual deploy workflow (`deploy-ops.yml`).
- **Risks:**
  - Directly conflicts with **P3-E41 / ADR-022** Phase 1 isolation (keeps `functions-ops` untouched during pay-parity verification and deploys `functions:ops` manually instead of automatically with `apps/customer`).
  - Cross-origin auth/CORS complexity between `www.freshnestco.ca` and `ops.freshnestco.ca`.
  - Builds Camelo-only CRUD screens in `apps/ops` that ADR-022 explicitly plans to retire in Phase 3.

---

## Comparison Matrix

| Criterion | Strategy 1 (Minimal) | Strategy 2 (Callables in `functions/` + Full Modal) ★ | Strategy 3 (Via `functions-ops` + Ops Tab) |
| :--- | :--- | :--- | :--- |
| Matches all 6 `/grill-me` decisions | ❌ No | ✅ Yes | ✅ Yes (plus extra scope) |
| Duplicate client prevention | ❌ No | ✅ Auto-match + picker + partial-retry safety | ✅ Yes |
| Respects P3-E41 Phase 1 `functions-ops` isolation | ✅ Yes | ✅ Yes | ❌ Violates Phase 1 freeze |
| Auto-deploys with `apps/customer` on merge | ✅ Yes | ✅ Yes | ❌ Manual `deploy-ops.yml` lockstep |
| Full EN/FR + WCAG 2.1 AA (Tailwind v3) | ⚠️ Partial | ✅ Complete | ❌ `apps/ops` is EN-only Tailwind v4 |
| Complexity / Risk | Low / High data risk | Medium / Low risk | High / High coordination risk |

---

## Recommendation

**Approve Strategy 2.** It delivers every requirement from `/grill-me`, keeps `functions-ops` untouched during P3-E41's pay-parity gate, uses native Firebase Auth + App Check + P3-E37 audit logging + EN/FR Tailwind v3 UI in `apps/customer`, protects `freshnest-dev` from polluting production Camelo, and extends `apps/ops/e2e/fake-camelo.ts` for test parity.

**Next step:** Human approval of Strategy 2 (plus confirmation of the 1-line `firestore.rules` / `firestore.dev.rules` guard `!('camelo' in request.resource.data)` on public `bookings` create) to proceed into Phase B execution.
