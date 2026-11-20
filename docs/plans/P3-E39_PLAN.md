# P3-E39 Plan — Client E-Agreements: Click-to-Sign by Private Link

**Spec:** [`projects/P3-E39.md`](../projects/P3-E39.md) · **Date:** 2026-11-20 · **Status:** ✅ Approved & implemented (Strategy 2, 2026-11-20)
**Source:** [E-Agreement Master Project Plan](../projects/P3-E39-source-e-agreement-plan.md) · [FSM master spec Part 4](../projects/FSM_MASTER_SPEC.md) · **ADR:** [ADR-021](../decisions/ADR-021-public-signing-by-private-link.md) (Accepted)

**Primary personas:**
- P3 Margaret (primary signer);
- P1 Diane and P5 Sophie (French);
- P12 Lauren (office);
- P4 Kahnawà:ke, P6 Gallagher and P2 Travis (secondary).

The three strategies share the client flow and the security base below. They differ in **how much of the wave 1 Agreements module is built now**:
1. Standalone, as the source plan describes.
2. Click-to-sign on the module's data model.
3. The module's spec order: tracking and upload first, then click-to-sign.

---

## Shared base (all strategies)

### Client flow
1. **Create.** Admin → Agreements → New. Choose type (residential/commercial) and language, pick a booking to prefill (or type the details), then confirm the terms. Terms are copied from `settings/policy` and frozen. The office callable returns the link **once**.
2. **Open.** The client opens `/agreement/:token`. `getAgreementForSigning` hashes the token, finds the record and checks expiry and status, then returns display data only and sets `viewedAt` on the first view.
3. **Answer.** The client fills in phone, email, entry method, pets, alarm (yes/no), special instructions and valuables. Codes are entered in separate fields that go only to the access record.
4. **Sign.** E-sign consent + "read and agree" + typed name. `signAgreement` does all of the following in one transaction:
   - validates with Zod;
   - stores the evidence and the access record;
   - sets `signed`;
   - clears the token hash.
5. **After commit.** PDF built (pdf-lib), saved to Storage, emailed to the client and `OWNER_EMAIL` (Resend, attachment, client language). The audit entry is written by the P3-E37 trigger.

### Security base
- **Tokens:**
  - `crypto.randomBytes(32)`, base64url; only `sha256(token)` is stored, as `tokenHash`, with a single-field index.
  - Reissue makes a new token and overwrites the hash, so the old link dies.
  - The raw token is never logged.
- **Public callables:**
  - `getAgreementForSigning` and `signAgreement` use `enforceAppCheck: true`.
  - A per-agreement `failedAttempts` counter locks the link after 10 bad submissions.
  - A honeypot field is checked server-side.
  - Responses never include access codes, internal notes or other clients' data.
- **Office callables:** `createAgreement`, `reissueAgreementLink` and `expireAgreement` check `role in ['owner','manager']` through `functions/src/lib/roles.ts`.
- **Firestore rules:**
  - `agreements` and `agreementVersions`: read `isOffice()`, write `false`.
  - The access record: read `isOffice()`, write `false`.

  Needs **human approval**. Merging deploys (ADR-018).
- **Storage rules:** `agreements/{agreementId}/{file}`: read by office only, write `false` (Functions write with the Admin SDK). Office downloads go through the client SDK under these rules.
- **Database routing:** the callables use the same database the calling app uses. Phase B confirms the mechanism, since today's callables mostly use `getFirestore()`, which is `(default)`. Previews must not write signed records into production. Tests cover both databases.
- **Evidence:** typed name, `signedAt` (server time), IP (`x-forwarded-for` first hop), user agent, language, `versionId`, `documentHash` (SHA-256 of the exact rendered text, with the client's details merged in).
- **Money:** rates and fees are integer cents (ADR-020) and displayed with `formatCents`. HST is shown per the agreement wording.
- **No-prices exception:** rates come from the record, not `en.json`/`fr.json`, so `noPricing.test.ts` stays green. The exception itself is an owner decision (spec decision 2) and a `COMPLIANCE.md`/CLAUDE.md note.

### UI base
- **Signing page:** `apps/customer/src/pages/AgreementPage.tsx` with child components:
  - `AgreementDetails`, `AgreementTerms` (renders the version's Markdown-lite blocks);
  - `AgreementAnswersForm`, `AgreementSignBlock`;
  - `AgreementStatusPanel` for invalid, expired and signed links.
- **Form:** React Hook Form + Zod, `noindex`, no Navbar booking CTA, office phone visible in the header.
- **Admin:** `apps/customer/src/components/admin/agreements/`:
  - `AgreementsTab` (list with status chips and filters);
  - `NewAgreementModal` (prefill from booking);
  - `AgreementDetailPanel` (copy link, reissue, expire, download PDF, history).

  `adminTabs.ts` gains `agreements` (Owner and Manager).
- **i18n:** new `agreement.*` and `admin.agreements.*` keys in both locale files. Agreement legal text is **not** in the locale files.

### Tests (all strategies)
- **Functions (vitest):**
  - token hash and lookup;
  - expiry, reuse, replay and double submit;
  - honeypot;
  - attempt lock;
  - the evidence fields;
  - access codes absent from every response and from the PDF text;
  - PDF builds in FR with accents;
  - email payloads per language.
- **Rules (emulator):** a signed-out user, a customer, staff and a supervisor cannot read or write `agreements`, `agreementVersions`, the access record or `agreements/` storage. The office can read; nobody can write from the client.
- **Customer app (vitest + RTL):** the three consent controls are required; the invalid-link panel; FR rendering; no hardcoded strings (Linguistic_Auditor).
- **E2E (emulators, ADR-019):**
  - Margaret at 768px, Travis at 390px, Diane in FR: open, answer, sign, thank-you;
  - Lauren: create, reissue, then the old link fails;
  - axe a11y on the signing page.

### Effort ranges
These are for one person with Claude Code, excluding Phase 0 content and the pilot, and are not commitments.

---

## Strategy 1 — Standalone click-to-sign (the source plan, hardened)

**What:** the source plan's model with the review fixes (hashed token, access record, document hash, e-sign consent). There is one flat `agreements` document per client agreement and a flat `agreementVersions` collection. Wave 1 later migrates these records into the Agreements module.

**Data (new):**
- **`agreements/{id}`:**
  - `type`, `language`, `versionId`, `prefill{name, address, services, frequency, startDate, rateCents}`, `answers{phone, email, entryMethod, pets, alarm, instructions, valuables}`
  - `status` (`draft|sent|viewed|signed|expired`), `tokenHash`, `expiresAt`, `signedName`, `signedAt`, `ip`, `userAgent`, `documentHash`, `pdfPath`
  - `createdBy`, `createdAt`, `lastChange`
- **`agreements/{id}/private/access`:** `doorCode`, `alarmCode`, `keyLocation`, `accessNotes`
- **`agreementVersions/{versionId}`:** `type`, `version`, `bodyEn`, `bodyFr`, `publishedAt`, `publishedBy`

**Files:**
- **New:**
  - `functions/src/callable/agreements.ts`
  - `functions/src/lib/agreementToken.ts`
  - `functions/src/lib/agreementPdf.ts`
  - `functions/src/agreementEmailTemplates.ts`
  - `functions/test/agreements.test.ts`
  - `functions/scripts/seed-agreement-version.cjs`
  - `apps/customer/src/pages/AgreementPage.tsx` (+ `components/agreement/*.tsx`, tests)
  - `apps/customer/src/components/admin/agreements/{AgreementsTab,NewAgreementModal,AgreementDetailPanel}.tsx`
  - `apps/customer/src/lib/firebase/agreements.ts`
  - `apps/customer/e2e/agreement.spec.ts`
  - `docs/reports/P3-E39-close-YYYY-MM-DD.md`
- **Modified:**
  - functions: `functions/src/index.ts`, `functions/src/sendEmail.ts` (attachment helper), `functions/src/triggers/audit.ts` (`auditAgreements`), `functions/package.json` (pdf-lib)
  - customer app: `apps/customer/src/App.tsx` (route), `apps/customer/src/components/admin/adminTabs.ts`, `apps/customer/src/pages/AdminPage.tsx`, `apps/customer/src/i18n/locales/{en,fr}.json`, `apps/customer/src/types/index.ts`
  - rules and indexes: `firestore.rules`, `firestore.dev.rules`, `storage.rules`, `firestore.indexes.json`, `apps/customer/test/firestore-rules.test.ts`, `apps/customer/test/storage-rules.test.ts`
  - docs and content: `docs/firestore-schema.md`, `docs/COMPLIANCE.md` (human), privacy policy copy, `user-guide/admin-guide.md`, `docs/decisions/ADR-021-…` (Accepted), `docs/ACTIVE_CYCLE.md`

**Persona impact:**
- Every persona gets the full client flow.
- P12 Lauren gets the simplest admin screen.
- Nothing is lost for any persona now. The cost falls on wave 1: a migration while Lauren's records are live.

**Risks:**
- **Rework.** Wave 1 Agreements (G1–G8) needs a party reference, structured terms, lifecycle statuses (Active, Paused, Ended) and append-only versions. A flat record then means a data migration of real, legally relevant records.
- **Status model.** `viewed` and `expired` as statuses clash with the spec's lifecycle.
- **Evidence.** A signature written as fields on the agreement is not append-only (FSM spec rule 4, "facts are append-only").

**Schema audit:**
- All fields above are **new** and none exist in `firestore-schema.md` today.
- They must be added to the schema doc as part of approval. They are not invented beyond this plan.
- `lastChange` reuses the P3-E37 stamp.

**Tailwind audit:**
- **No new CSS classes.** Uses existing tokens only: `bg-warm-white`, `bg-cream`, `text-charcoal`, `text-text-muted`, `bg-slate-brand`/`hover:bg-slate-dark`, `border-sand`, `font-display`/`font-body`, `rounded`.
- 48px controls are `min-h-[48px]`, the pattern already used by the booking form.
- Status chips reuse the admin status-chip classes.

**Effort:** about 8–10 build days.

---

## Strategy 2 — Click-to-sign as the first slice of the Agreements module (recommended)

**What:** the same client flow and screens as Strategy 1, but stored the way FSM spec Part 4 defines an agreement, so wave 1 **extends** it instead of migrating it.
- **Signatures and versions are append-only.**
- **Status follows the lifecycle:** `draft → sent → signed`, with `expired`/`cancelled` and room for `active|paused|ending|ended`. Viewing is a timestamp, not a status.
- **The party reference points at a booking now** and is repointed to `clients/{id}`/`sites/{id}` in wave 1.
- **Upload of a signed paper copy** (spec option 1) is **not** built here. That is G1 in wave 1.

**Data (new):**
- **`agreements/{id}`:**
  - `family: 'client'`, `type` (`residential|commercial`), `language`
  - `party{kind:'booking', bookingId, name, email, phone, address}`
  - `terms{serviceType, frequency, startDate, rateType, rateCents, cancelWindowHours, lateCancellationFeeCents, lockoutFeeCents, latePaymentBasisPoints, noticePeriodDays}`
  - `templateId`, `versionId`, `status`, `tokenHash`, `tokenExpiresAt`, `sentAt`, `viewedAt`, `failedAttempts`
  - `currentSignatureId`, `pdfPath`, `documentHash`, `createdBy`, `createdAt`, `lastChange`
- **`agreements/{id}/signatures/{sigId}`** (create-once): `signedName`, `consentESign`, `consentTerms`, `signedAt`, `ip`, `userAgent`, `language`, `versionId`, `documentHash`, `answers{phone, email, entryMethod, pets, alarm, instructions, valuables}`
- **`agreements/{id}/private/access`:** `entryMethod`, `doorCode`, `alarmCode`, `keyLocation`, `accessNotes`, `updatedAt`
- **`agreementTemplates/{templateId}`:** `family`, `type`, `nameEn`, `nameFr`, `currentVersionId`
- **`agreementTemplates/{templateId}/versions/{versionId}`** (immutable once `published`): `version`, `status` (`draft|published|retired`), `bodyEn`, `bodyFr`, `bodyHashEn`, `bodyHashFr`, `publishedAt`, `publishedBy`

**Files:**
- Everything in Strategy 1, plus:
  - `functions/src/lib/agreementTerms.ts` (builds terms from `settings/policy` + the form; the pure part goes to `packages/shared/src/domain/agreements.ts`, synced);
  - `packages/shared/src/domain/agreements.ts` (+ tests: statuses, allowed transitions, terms schema);
  - `packages/shared/src/index.ts`.
- **Replaced:** the seed script becomes `functions/scripts/seed-agreement-template.cjs` (creates the residential and commercial templates with a placeholder v1 in EN/FR).

**Persona impact:**
- **Clients (P1, P2, P3, P4, P5, P6):** same as Strategy 1.
- **P12 Lauren:** history keeps every signature and version, and wave 1 adds clients, sites and alerts without a data migration of signed records.
- **P5 Sophie:** append-only evidence gives a cleaner Law 25 answer to "what did I consent to, and when".

**Risks:**
- **More up front:** about 2–3 days more than Strategy 1, plus a shared domain module.
- **Unbuilt fields:** some fields (for example `noticePeriodDays`) exist before anything uses them. Their defaults are documented.
- **Wave 1 assumptions:** the party reference must be repointed when `clients` exist. A small backfill sets `party.kind:'client'`, a far smaller change than a full migration.

**Schema audit:**
- All fields above are **new**. None exist in `firestore-schema.md`; they are added with approval.
- They are taken from FSM spec Part 4 §3 ("Structured terms captured on every agreement") and §5 ("Document handling rules"), not invented.
- Reused: `lastChange` (P3-E37); the `…Cents` and `…BasisPoints` naming (ADR-020); the `settings/policy` fee keys.

**Tailwind audit:** as Strategy 1. No new classes.

**Effort:** about 10–13 build days.

---

## Strategy 3 — Spec order: agreement tracking and upload first, click-to-sign second

**What:** follows FSM spec Part 4's recommendation literally, in two PRs.
- **PR 1 (G1–G2):** the Strategy 2 data model, an Admin → Agreements register, upload of a signed copy (PDF to `agreements/`, SHA-256 stored) with key dates entered by hand, and notice-deadline alerts at 60/30/7 days (new scheduled Function, Toronto time per ADR-020).
- **PR 2:** the click-to-sign link, signing page, PDF and email (the shared base).

**Files:**
- Everything in Strategy 2, plus:
  - `functions/src/scheduled/agreementAlerts.ts` (+ test);
  - `apps/customer/src/components/admin/agreements/UploadSignedCopyModal.tsx`;
  - `storage.rules` office **write** for uploads (PDF, <10 MB);
  - `settings/policy` keys for alert intervals: `agreementAlertDays`, a **new** settings field, needing the `updatePolicySettings` validator and `SettingsTab` changes.

**Persona impact:**
- **P12 Lauren:** gets value first. The existing paper V2 clients are on file with dates and alerts before any link is sent.
- **Clients (P1–P6):** wait one more PR for the signing link.

**Risks:**
- **Longest path** to the owner's stated goal (clients signing online).
- **Alerts are thin today:** the agreements still have no end date or notice period, so alerts have little to fire on until wave 1 terms exist.
- **Larger rules change:** office Storage write is a new write path.

**Schema audit:** all Strategy 2 fields plus `uploadedAt`, `uploadedBy`, `source` (`upload|click`) on signatures, and `settings/policy.agreementAlertDays`. All **new** and from FSM spec Part 4 §5–§6; added to the schema doc with approval.

**Tailwind audit:** as Strategy 1. The upload modal reuses `GalleryPhotoPicker`/dialog patterns (P3-E33). No new classes.

**Effort:** about 15–18 build days.

---

## Comparison

| | Strategy 1 | Strategy 2 (recommended) | Strategy 3 |
|---|---|---|---|
| Time to first signed agreement | Shortest | +2–3 days | Longest |
| Rework in wave 1 | Migration of signed records | Small backfill of `party` | Small backfill |
| Append-only evidence | No | Yes | Yes |
| Paper V2 clients on file | No | No (G1 in wave 1) | Yes |
| Rules surface | Read-only office | Read-only office | Adds office Storage write |

## Phase B delivery order (Strategy 2)
1. **PR 1 — data, rules and Functions:**
   - shared domain module;
   - callables;
   - token, PDF and email;
   - seed script;
   - rules and storage rules with emulator tests;
   - ADR-021.

   **Needs explicit human rules sign-off** in the PR.
2. **PR 2 — screens:**
   - signing page;
   - Admin → Agreements;
   - i18n EN/FR;
   - E2E persona flows.
3. **Pilot (spec Phase 5):** 3 real clients after D1 (legal and French), D2 (backups) and D3 (Reply-To) are done.

## Gate
**HALT.** No implementation code until the owner approves a strategy and answers the spec's owner decisions 2–8.
