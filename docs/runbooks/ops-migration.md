# Ops Hub Migration Runbook (`P3-E41` / `ADR-022`)

**Scope:** Move FNC Landing (`rpdouglas/blurb`, `lilypad-strategy-design`, `fnc-reports.web.app`) into `rpdouglas/fresh_nest` (`freshnest-aa51e`, `ops.freshnestco.ca`) with zero payroll or invoicing drift.
**Strategy:** Strategy 2 — lift & shift + unified Fresh Nest office auth (`owner`/`manager` via Firebase Auth + live `admins/{email}` check); Camelo & payroll/invoicing logic untouched.
**Snapshot SHA:** `f881f49a5f6e41617054e48502b94f4d56c9afda` (`rpdouglas/blurb` `live` tag).

> [!IMPORTANT]
> Agent sessions have no production credentials (`docs/HANDOFF.md`). Every command below touching `freshnest-aa51e` or `lilypad-strategy-design` is executed by a human operator with authenticated `gcloud` / `firebase` CLI access.

---

## 1. One-Time Console & IAM Setup (`freshnest-aa51e`)

### 1.1 Hosting site & custom domain
1. In Firebase Console (`freshnest-aa51e`) → **Hosting** → **Add another site**: create site ID **`freshnest-ops`**.
2. Once created, set GitHub repository variable **`OPS_HOSTING_READY=true`** (*Settings → Secrets and variables → Actions → Variables*) so PR previews in `firebase-preview.yml` deploy to `freshnest-ops`.
3. Add custom domain **`ops.freshnestco.ca`** to site `freshnest-ops` and add the DNS records at Canspace.
4. In Firebase Console (`freshnest-aa51e`) → **Authentication → Settings → Authorized domains**: add **`ops.freshnestco.ca`** (Google Sign-In provider is already enabled for the admin portal).

### 1.2 Office access (Strategy 2 — before PR 3 live testing)
1. Confirm Lauren (`freshnestcompany2023@gmail.com`) is listed as **Owner** in Admin → Team & Roles.
2. Grant Ryan (**Manager**) in Admin → Team & Roles so he can sign in to `ops.freshnestco.ca` on day one.
3. Tidy any legacy UID-keyed entry in `admins/` via Team & Roles (`docs/HANDOFF.md` §1).

### 1.3 Secret Manager (`freshnest-aa51e`)
Set the two secrets required by `functions-ops` (`SCHEDULE_EDITORS` is retired in PR 3):

```bash
# CRITICAL: Use the EXACT SAME CAMELO_TOKEN value as lilypad-strategy-design.
# Cleaner session tokens (who.ts) and encrypted scheduleCleanerTokens (routes/clock.ts)
# derive their AES/HMAC keys from CAMELO_TOKEN via HKDF.
firebase functions:secrets:set CAMELO_TOKEN --project freshnest-aa51e
firebase functions:secrets:set SCHEDULE_STAFF --project freshnest-aa51e
```

### 1.4 Private visit-photo GCS bucket + 1-year lifecycle rule
```bash
gcloud storage buckets create gs://freshnest-aa51e-schedule-photos \
  --project=freshnest-aa51e \
  --location=us-central1 \
  --uniform-bucket-level-access \
  --public-access-prevention

cat <<'EOF' > /tmp/ops-photo-lifecycle.json
{"rule":[{"action":{"type":"Delete"},"condition":{"age":365}}]}
EOF

gcloud storage buckets update gs://freshnest-aa51e-schedule-photos \
  --lifecycle-file=/tmp/ops-photo-lifecycle.json
rm -f /tmp/ops-photo-lifecycle.json
```

### 1.5 Firestore TTL policies (3 collection groups)
Enable automatic deletion on `expireAt` in `freshnest-aa51e` `(default)` (matches FNC Landing):

```bash
gcloud firestore fields ttls update expireAt \
  --collection-group=scheduleChangeLog --enable-ttl --project=freshnest-aa51e
gcloud firestore fields ttls update expireAt \
  --collection-group=scheduleVisitPhotos --enable-ttl --project=freshnest-aa51e
gcloud firestore fields ttls update expireAt \
  --collection-group=scheduleCleanerTokens --enable-ttl --project=freshnest-aa51e
```

---

## 2. Staging Dry Run (`freshnest-dev`)

Authenticate Application Default Credentials with read access to `lilypad-strategy-design` and write access to `freshnest-aa51e`:

```bash
gcloud auth application-default login
npm --prefix functions-ops ci

# 1. Dry run (reads counts only — writes nothing)
node scripts/ops-migration/copy-schedule-collections.cjs --dry-run

# 2. Copy into freshnest-dev and verify 100% count match
node scripts/ops-migration/copy-schedule-collections.cjs --apply --target-db=freshnest-dev
```

---

## 3. Manual Production Deploy & Live Security Matrix

After PR 3 (Strategy 2 unified office auth) is merged to `main`:

1. In GitHub → **Actions → Deploy Ops (Manual — Phase 1)** → **Run workflow**:
   - `target`: **`both`**
   - `health_url`: **`https://ops.freshnestco.ca/api/health`** (or `https://freshnest-ops.web.app/api/health` if DNS isn't cut over yet)
2. The workflow automatically verifies `/api/health` returns `200`, `"ok":true`, and the exact deployed commit SHA.
3. Verify the live **401 / 403 matrix**:
   - Unauthenticated `POST https://ops.freshnestco.ca/api/shifts` → **`401`**
   - Non-office account (`customer` / `staff` / `supervisor`) → **`403`**
   - Lauren (`owner`) & Ryan (`manager`) → **`200`** on every hub (Home, Schedule, Hours & pay, Billing, Clients).

---

## 4. Switch Friday Cutover (Zero Split-Brain Freeze)

Run on the **first Friday** after staging & live 401/403 checks pass (at a pay-period boundary):

1. **Freeze the old site (`rpdouglas/blurb` / `fnc-reports.web.app`):**
   - Set `OPS_READ_ONLY=true` on `scheduleApi` in `lilypad-strategy-design` and redeploy `functions:schedule` (and optionally build `hosting:schedule` with `VITE_READ_ONLY=true` so the banner also appears on the sign-in screen).
   - Confirm `curl -sf https://fnc-reports.web.app/api/health` returns `{"ok":true,...,"readOnly":true}`.
   - From this moment, zero Camelo or Firestore writes can occur on the old site.
2. **Final Firestore data copy into `freshnest-aa51e/(default)`:**
   ```bash
   node scripts/ops-migration/copy-schedule-collections.cjs --dry-run --target-db='(default)'
   node scripts/ops-migration/copy-schedule-collections.cjs --apply --target-db='(default)'
   ```
   Confirm every one of the 11 collections reports `OK` (exit code `0`).
3. **Copy visit photos to `gs://freshnest-aa51e-schedule-photos` and verify object count:**
   ```bash
   gcloud storage cp -r gs://lilypad-strategy-design-schedule-photos/* gs://freshnest-aa51e-schedule-photos/
   SRC_COUNT=$(gcloud storage ls -r gs://lilypad-strategy-design-schedule-photos/** | grep -v '/$' | wc -l)
   DST_COUNT=$(gcloud storage ls -r gs://freshnest-aa51e-schedule-photos/** | grep -v '/$' | wc -l)
   echo "Source photos: $SRC_COUNT | Target photos: $DST_COUNT"
   test "$SRC_COUNT" -eq "$DST_COUNT"
   ```
4. **Spot-check 3 sample clients:** confirm client prices, invoice ticks, and feedback display identically on `ops.freshnestco.ca` vs `fnc-reports.web.app`.
5. **Announce cutover:** notify office and cleaners to use `https://ops.freshnestco.ca` (cleaners sign in once with their 6-digit Camelo code and re-pin the home-screen app).

---

## 5. Parallel Pay-Period Verification (Pay Gate)

Run both sites for **one full pay period** (all writes on `ops.freshnestco.ca` only; `fnc-reports.web.app` read-only). At pay-period close:

1. Export **Payroll hours** and **Invoicing totals** from both `fnc-reports.web.app` and `ops.freshnestco.ca`.
2. Run the automated parity diff script:
   ```bash
   node scripts/ops-migration/compare-pay-period.cjs \
     --period=YYYY-MM-DD \
     --old-payroll=/tmp/old-payroll.csv --new-payroll=/tmp/new-payroll.csv \
     --old-invoices=/tmp/old-invoices.csv --new-invoices=/tmp/new-invoices.csv \
     --out=/tmp/pay-gate-report.md
   ```
3. Gate passes only when exit code is `0` (`PASS — exact $0.00 / 0.00 h parity` across every cleaner and client, or any intentional mid-period rate edit is explicitly accounted for). Attach `/tmp/pay-gate-report.md` to the P3-E41 Phase C close report.

---

## 6. Rollback Procedure

If a blocking issue occurs during the parallel run:
1. Unset `OPS_READ_ONLY` (set to `false`) on `scheduleApi` in `lilypad-strategy-design` and redeploy `functions:schedule`.
2. Verify `https://fnc-reports.web.app/api/health` no longer returns `readOnly: true`.
3. Direct office and cleaners back to `https://fnc-reports.web.app` (Camelo holds all live shift/timesheet writes made on the new site).

---

## 7. Post-Gate Sunset (8-Week Redirect Window)

Once the pay gate passes:
1. **Shut down `blurb`'s backend immediately:** delete `scheduleApi` in `lilypad-strategy-design` (`firebase functions:delete scheduleApi --region us-central1 --project lilypad-strategy-design`) so Camelo API calls and compute charges stop immediately.
2. **Deploy the service-worker-unregistering redirect stub** to `fnc-reports.web.app` for **8 weeks** (prevents installed cleaner PWAs from getting stuck on a cached service worker):
   ```html
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width,initial-scale=1" />
       <title>Fresh Nest Ops has moved</title>
       <script>
         (async () => {
           if ('serviceWorker' in navigator) {
             const regs = await navigator.serviceWorker.getRegistrations();
             await Promise.all(regs.map((r) => r.unregister()));
           }
           if ('caches' in window) {
             const keys = await caches.keys();
             await Promise.all(keys.map((k) => caches.delete(k)));
           }
           window.location.replace('https://ops.freshnestco.ca' + window.location.pathname + window.location.search);
         })();
       </script>
     </head>
     <body style="font-family:system-ui,sans-serif;padding:2rem;text-align:center">
       <h1>Fresh Nest Ops has moved</h1>
       <p>Please update your bookmark and home-screen app to <a href="https://ops.freshnestco.ca">ops.freshnestco.ca</a>.</p>
     </body>
   </html>
   ```
3. **After 8 weeks:** disable the `fnc-reports` Hosting site in `lilypad-strategy-design`, archive `rpdouglas/blurb` on GitHub as read-only history, and transition `apps/ops` / `functions-ops` from manual `deploy-ops.yml` to auto-deploy on merge to `main`.
