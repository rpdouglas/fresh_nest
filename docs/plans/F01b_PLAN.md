# F01b Planning — FSM Hosting Target & Firestore Rules Setup
**Epic:** F01b | **Phase:** Phase 1 (Infrastructure) | **Date:** June 13, 2026  
**Primary Personas:** Owner (Sarah / P12), Dev Team (Ryan)

---

## 1. Persona Analysis & Acceptance Gate

This epic establishes FSM-specific Firestore security rules, Firebase hosting targets, local environment files, and CI/CD deploy pipelines.

- **Sarah (Owner / P12):** Requires secure, audit-compliant access controls. Only authenticated staff can access their own data, and only admins can touch administrative configuration collections (`payRates`, `checklistTemplates`, `auditLog`, etc.).
- **Brenda (Visual Verification / P11):** Must be able to upload job photos without being blocked by security rules. (Resolved in grilling to include `photos` in the cleaner update permission list).
- **Ryan (Dev Team):** Requires standard dev/prod parity in database routing, and deployment pipelines that build and deploy both Customer and FSM applications correctly on push/pull request.
- **Customer Personas (Diane / P1, Sophie / P5, Margaret / P3):** Client-side promo/referral verification reads the `referrals` collection; rules must be aligned to prevent breaking their booking experience in production.

---

## 2. 3-Strategy Plan

### Strategy 1: Direct File Configuration & Target Separation (Recommended)
This strategy directly modifies target configurations, adds FSM collections to both development and production Firestore security rules, builds both apps, and configures GitHub Actions workflows to deploy both targets.

- **Files Changed:**
  - `.firebaserc` (Register `freshnest-fsm` site target under `hosting`)
  - `firebase.json` (Add FSM hosting target block with a dedicated CSP; reference `apps/fsm/dist` as the build output)
  - `firestore.rules` (Deploy FSM security rules + align `referrals` collection rules to match dev rules)
  - `firestore.dev.rules` (Deploy FSM security rules)
  - `apps/fsm/.env.local` (Create with firebase credentials of the dev project matching `apps/customer/.env.local`, setting `VITE_FIRESTORE_DB_ID=freshnest-dev`)
  - `.github/workflows/firebase-deploy.yml` (Update steps to build both apps and deploy both `freshnest-prod` and `freshnest-fsm`)
  - `.github/workflows/firebase-preview.yml` (Update steps to build both apps and deploy previews for both `freshnest-dev` and `freshnest-fsm`)

- **Persona Impact:**
  - *Sarah (P12):* Security is fully enforced at the Firestore level; audit trail logs and pay rates are write-blocked for non-admins.
  - *Brenda (P11):* Able to complete checklist items and upload verification photos since `photos` is added to the list of fields allowed for cleaner updates.
  - *Ryan (Dev):* Complete parity in local testing and CI/CD. Customer booking referrals work seamlessly.

- **Risks & Mitigation:**
  - *Risk:* Deploying rules with syntax or logic errors could lock out users or staff.
  - *Mitigation:* Validate the modified rule sets locally using the Firebase Firestore emulator before any deployment.
  - *Risk:* CSP is too strict and blocks the FSM application from accessing Firebase Storage or Auth.
  - *Mitigation:* Ensure FSM CSP allows `https://firebasestorage.googleapis.com` and `blob:` sources.

- **Schema Audit:**
  - Ensures the keys allowed for update in the `jobs` security rules match exactly the fields in `docs/firestore-schema.md` (adding `photos` to `status`, `checkedInAt`, `checkedInGeo`, `completedAt`, `checklistCompletions`).
  - Verifies that new FSM collections (`staff`, `jobs`, `payRates`, `checklistTemplates`, `auditLog`, and `notifications`) follow the strict schemas specified.

---

### Strategy 2: Phased Implementation (Rules First, Hosting Second)
This strategy decouples database security from hosting. The Firestore rules are updated and verified first, followed by the hosting configuration and deployment pipelines in a subsequent step.

- **Files Changed:** Same target files as Strategy 1, split across two phases.
- **Methodology:**
  - Phase 1: Update `firestore.rules` and `firestore.dev.rules`. Deploy rules to the dev project and run all security tests.
  - Phase 2: Update `.firebaserc`, `firebase.json`, `apps/fsm/.env.local`, and the GitHub deployment workflows.
- **Persona Impact:** Identical to Strategy 1 once fully completed.
- **Risks & Mitigation:**
  - *Risk:* The FSM application code might attempt database writes that are blocked by the old rules if the order of deployments is mismanaged.
  - *Mitigation:* Keep the FSM client development paused until rules are successfully verified on the emulator.
- **Schema Audit:** Same schema verification steps as Strategy 1.

---

### Strategy 3: Unified Single-Hosting Target for Dev/Preview Previews (Alternative)
This strategy hosts FSM on a subdirectory rewrite under the customer dev site (`lilypad-freshnest-dev/fsm`) for previews, rather than setting up separate preview channels under the FSM site target.

- **Files Changed:**
  - `.firebaserc`, `firestore.rules`, `firestore.dev.rules`, `apps/fsm/.env.local`
  - `firebase.json` (Configure rewrite rules under `freshnest-dev` target to route `/fsm/**` to `apps/fsm/dist`)
  - `.github/workflows/firebase-preview.yml` (Build both but only deploy `freshnest-dev`)
- **Persona Impact:**
  - *Ryan (Dev):* High complexity in testing and preview routing. CSP header configurations in `firebase.json` must cover both customer and FSM needs on the same hosting target, weakening overall security.
  - *Sarah (Owner):* Violates clean environment separation guidelines.
- **Risks & Mitigation:**
  - *Risk:* Routing collisions and asset path resolution issues (Vite assets might load incorrectly).
  - *Mitigation:* Setup base path configuration on Vite builds.
- **Schema Audit:** Same as Strategy 1.

---

## 3. Recommended Choice & Rationale

**Strategy 1 (Direct File Configuration & Target Separation)** is recommended.
The workspace grilling aligned on deploying separate FSM preview channels alongside customer previews, ensuring clean site separation. Additionally, updating both Firestore rules files directly aligns with the monorepo's design and keeps security configurations in sync.

---

## 4. Implementation Checklist & Verification Gate

1. [ ] Update `.firebaserc` with `freshnest-fsm` hosting target.
2. [ ] Update `firebase.json` with FSM hosting target block and dedicated CSP.
3. [ ] Update `firestore.rules` (production) and `firestore.dev.rules` (development) with:
    - FSM Collection Rules (Staff, Jobs, PayRates, AuditLog, ChecklistTemplates, Notifications).
    - Align `referrals` collection in production rules (`firestore.rules`).
    - Add `photos` to the list of fields allowed for cleaner updates in `jobs` rules.
4. [ ] Create `apps/fsm/.env.local` with dev project Firebase credentials.
5. [ ] Update `.github/workflows/firebase-deploy.yml` to build both workspaces and deploy both production targets.
6. [ ] Update `.github/workflows/firebase-preview.yml` to build both workspaces and deploy preview channels for both targets.
7. [ ] Run `npm run build` locally to verify successful compile of both apps.
8. [ ] Run `npm run lint` to confirm clean static analysis.
9. [ ] Run local emulator firestore rules checks to ensure the security updates do not block legitimate requests.
