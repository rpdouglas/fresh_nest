# Runbook — Firestore Backups, Restore Drills & Cost Guardrails (W0-5)

**Project:** `freshnest-aa51e` (Project # `521227407391`) · **Updated:** 2026-11-21
**Owner Persona:** P12 Lauren Arsenault (Compliance & Business Continuity)

---

## 1. Backup Architecture (Defense in Depth)

Production Firestore (`(default)`, region `nam5`) is protected by **three independent safeguards**:

| Layer | Resource | Schedule / Retention | Purpose |
|---|---|---|---|
| **Delete Protection** | `(default)` database | `DELETE_PROTECTION_ENABLED` | Prevents accidental database deletion |
| **Native Firestore Backups** | `backupSchedules/65a2ddfd-6cf0-44d0-9aa4-72472187ece2` (daily)<br>`backupSchedules/6c6c2053-3c8c-4617-815a-c56c9763a56f` (weekly Sunday) | Daily kept **7 days**<br>Weekly kept **14 weeks** | Instant Google-managed point-in-day restore into a new `nam5` database |
| **Scheduled GCS Exports** | Cloud Function `onDailyFirestoreExport` (`functions/src/scheduled/backup.ts`) → `gs://freshnest-aa51e-firestore-backups/daily/YYYY-MM-DD` | Daily at **03:00 `America/Toronto`** (ADR-020)<br>Standard 30d → Nearline → Delete at **90 days** | Portable exports for `freshnest-dev` restore drills, partial collection restores, and external retention |

### Storage Buckets & Security
- **`gs://freshnest-aa51e-firestore-backups`** (`US` multi-region, matches `(default)` `nam5`):
  - Uniform bucket-level access: **enabled**
  - Public access prevention: **enforced**
  - Lifecycle: Nearline at 30 days, Delete at 90 days
  - IAM: `roles/storage.objectAdmin` granted to `521227407391-compute@developer.gserviceaccount.com` and `service-521227407391@gcp-sa-firestore.iam.gserviceaccount.com`
- **`gs://freshnest-aa51e-firestore-restore-ca`** (`NORTHAMERICA-NORTHEAST1`, matches `freshnest-dev`):
  - Uniform bucket-level access: **enabled**, public access prevention: **enforced**
  - Lifecycle: auto-delete after **7 days** (temporary cross-region restore staging only)

---

## 2. Rehearsed Restore Drill (`(default)` → `freshnest-dev`)

Run this drill **quarterly** (and before any major schema migration) with Application Default Credentials (`gcloud auth application-default login`).

```bash
# Full drill: exports (default), copies to CA staging bucket, imports into freshnest-dev, verifies counts
node functions/scripts/firestore-restore-drill.cjs

# Or restore a specific daily backup into freshnest-dev:
node functions/scripts/firestore-restore-drill.cjs \
  --source=gs://freshnest-aa51e-firestore-backups/daily/YYYY-MM-DD
```

**Built-in safety:**
- The script defaults to `--target=freshnest-dev`.
- Targeting `(default)` is **refused** unless `--i-understand-this-overwrites-prod` is explicitly passed.
- After importing, the script compares document counts across `admins`, `agreements`, `agreementTemplates`, `auditLog`, `bookings`, `checklistTemplates`, `galleryPairs`, `jobs`, `payRates`, `reviews`, `settings`, and `staff` and exits non-zero if any collection is short.

---

## 3. Emergency Production Recovery

### Option A — Full database restore from a Google-managed backup (safest, non-destructive)
Restores a daily/weekly backup into a **brand-new** Firestore database in `nam5` so you can inspect it before cutting over:

```bash
# 1. List available backups
gcloud firestore backups list --location=nam5 --project=freshnest-aa51e

# 2. Restore into a new verification database (does NOT touch (default))
gcloud firestore databases restore \
  --source-backup="projects/freshnest-aa51e/locations/nam5/backups/<BACKUP_ID>" \
  --destination-database="freshnest-recovery" \
  --project=freshnest-aa51e
```

### Option B — Import a GCS export (full or specific collections) into `(default)`
Use when specific documents/collections were accidentally corrupted and need to be overwritten from a known-good daily export:

> **Warning:** `importDocuments` overwrites existing documents with matching IDs and does **not** delete documents created after the export. Always rehearse into `freshnest-dev` first!

```bash
# Restore a single collection (e.g. agreements) from a daily export:
gcloud firestore import gs://freshnest-aa51e-firestore-backups/daily/YYYY-MM-DD \
  --database="(default)" \
  --collection-ids="agreements" \
  --project=freshnest-aa51e

# Or full import via script (requires explicit prod confirmation flag):
node functions/scripts/firestore-restore-drill.cjs \
  --source=gs://freshnest-aa51e-firestore-backups/daily/YYYY-MM-DD \
  --target='(default)' \
  --i-understand-this-overwrites-prod
```

---

## 4. Cost Guardrails & Billing Budgets (`MP-S5.11`)

Billing account: `billingAccounts/019113-2E5146-7A98B1` (currency: **CAD**), scoped to `freshnest-aa51e` (`projects/521227407391`), notifying Billing Admins & Project Owners:

| Budget Name | Monthly Cap (CAD) | Scope | Alert Thresholds |
|---|---|---|---|
| `Firebase Project freshnest-aa51e` | **$25** | Entire project | 50%, 90%, 100% actual |
| `Fresh Nest — Storage & Backups` | **$10** | Cloud Storage (`services/95FF-2EF5-5EA1`) | 50%, 80%, 100% actual + 100% forecasted |
| `Fresh Nest — Maps & Routes` | **$15** | Geocoding, Places, Directions, Distance Matrix APIs | 50%, 80%, 100% actual + 100% forecasted |
| `Fresh Nest — Firestore & Functions` | **$15** | Cloud Firestore + Cloud Run / Gen 2 Functions | 50%, 80%, 100% actual + 100% forecasted |

### External Service Cost Guards (Outside GCP)
- **Twilio SMS:** Billed directly in Twilio Console (not GCP). In **Twilio Console → Billing → Triggers & Usage**, ensure a monthly usage trigger (e.g. **$25 CAD/mo** email alert) and disable unlimited auto-recharge (or set a low cap) to guard against SMS pumping.
- **Resend Email:** Free tier covers 3,000 emails/month (100/day); monitor in **Resend Dashboard → Usage**.
- **App Check:** Enabled with reCAPTCHA Enterprise (10,000 free assessments/month) and enforced on public agreement callables (`getAgreementForSigning`, `signAgreement`).
