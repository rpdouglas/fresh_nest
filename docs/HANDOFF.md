# Handoff — where things stand

**Updated:** 2026-10-27 (end of a Claude Code session) · **`main`:** `2a66941` (after PR #41)
**For:** whoever picks up next, a person or an AI agent (Claude Code, Antigravity / Gemini CLI). `GEMINI.md` is a link to `CLAUDE.md`, so both agents read the same rules.

Read in this order: `CLAUDE.md` → this file → [`ACTIVE_CYCLE.md`](ACTIVE_CYCLE.md) → [`gap-analysis/GAP_ANALYSIS_2026-10-27.md`](gap-analysis/GAP_ANALYSIS_2026-10-27.md) (sections 5–7) → the spec and plan for the epic you pick up.

---

## 1. In flight

### PR #42 — P3-E35 cleanup: stop accepting the legacy `admin` role
- **Branch:** `ccr-89860093-vidd5x`. Local checks were green when it was opened: rules 49/49, functions 63/63, customer 130/130, FSM 57/57, builds and lint OK. CI was running at handoff, so check it before merging.
- **Before merging (human):**
  - The project lead's own account most likely still carries the old `admin` claim (it was created before P3-E35).
  - In `/admin` → **Team & roles**, Lauren clicks **Make Manager**, then **Make Owner** on that row. It takes two steps because the row already reads "Owner".
  - Then that person signs out, signs back in, and checks that `/admin` still works.
  - If this is missed, nothing is lost: an Owner can do the same two clicks after the merge.
- **After merging (human):** run Actions → **Deploy Security Rules**, target `all`, type `DEPLOY`.
- **Then close P3-E35:** mark it ✅ in `ACTIVE_CYCLE.md` and in the gap analysis (W0-1), and note PR #42 and the rules run number in [`reports/P3-E35-close-2026-10-27.md`](reports/P3-E35-close-2026-10-27.md).

### Office roles, as now in production (P3-E35, ADR-017 accepted)
- **Roles:**
  - **Owner:** everything, plus granting or revoking Owner and Manager.
  - **Manager:** everything else, including pay.
  - `supervisor` and `staff`: staff app only.
  - `customer`: customer portal.
- **People:** Lauren (`freshnestcompany2023@gmail.com`) owns the company and was added as Owner on 2026-10-27.
- **Granting access:** Team & roles can pre-approve an email that has never signed in; the role is applied on that person's first sign-in.
- **Old entry:** a hand-made office-list entry keyed by account ID (`EPbLg8…`) exists. Since PR #41 the tab shows its email. Changing or removing that person tidies the entry away.
- **Migration script:** `functions/scripts/migrate-admin-to-owner.cjs` was **not run** (no credentials in agent sessions). Team & roles does the same job one account at a time.

---

## 2. Waiting on the human

| # | What | Where it's tracked |
|---|---|---|
| H1 | PR #42: the pre-merge role step, then merge, then Deploy Security Rules `all` | Above |
| H2 | Business email (Zoho / Resend / DNS). **All app emails still fail.** The owner SMS alert covers new quote requests in the meantime | ACTIVE_CYCLE F1, P3-E30 |
| H3 | Confirm `OWNER_PHONE` for Cloud Functions | F2 |
| H4 | Run the backfills: `backfill-lowercase-booking-emails.cjs` (HOTFIX-05) and `backfill-job-checklists.cjs` (P3-E34). Dry run first, then `--apply` | F3, P3-E34 row |
| H5 | Gallery: phone test, accept ADR-015, then flip `SHOW_GALLERY` once real photos are in | P3-E32 row |
| H6 | Owner answers still open: cancellation, late and lockout **fee amounts**; **rates** for deep, move-out, post-construction and organizing; Lead/Trainee billing; whether breaks are billed; the **backup emergency contact**; **island travel times** | Gap analysis §7 |
| H7 | Optional: a dedicated service account so agent sessions can run admin scripts (roles: Firebase Authentication Admin + Cloud Datastore User; key stored as env var `FRESHNEST_SA_JSON` in the cloud environment settings). Rules deploys stay on the workflow either way | F16 |
| H8 | Re-sync `firestore.dev.rules` with production. The dev rules still let the office create staff docs from the app; production blocked that in P3-E27-A2. Needs human approval (rules) | F15 |

---

## 3. What to build next (owner-approved order)

All four "Now" defects (N-1 to N-4) are fixed and deployed. Wave 0 comes next, per gap analysis §5:

1. **W0-2 Settings and policy record** with versioned history (buffer, notice, caps…). Depends on W0-1, which is done. A setting must change behaviour without a release.
2. **W0-3 Audit everywhere:** status, assignment, checklist, staff and template changes, each with before/after values. Role changes are already audited (`overrideType: 'role_change'`).
3. **W0-4** ADR for integer cents and time zones, plus a shared `scheduling-core` package.
4. **W0-5** Scheduled Firestore export and a restore drill; budget alerts.
5. **W0-6** Server-checked schedule write path (`applyScheduleChange` with `rev`). Depends on W0-4.

Smaller AI-owned follow-ups are in `ACTIVE_CYCLE.md` → Open Follow-Ups: F5 (repair Playwright), F6 (pre-render), F7 (review-email links), F14 (quote-form date and `Ref #`).

**Owner decisions that override the spec** (gap analysis §7):
- clean slate: production holds only test data;
- keep both shift models;
- Managers see pay;
- billing starts at clock-in;
- all staff are employees;
- mostly time windows, 10 h/day maximum, no fixed workday;
- EN/FR only;
- no public prices.

---

## 4. How work flows here

- **Gates:** every epic goes Phase A (spec plus a 3-strategy plan, then **halt for approval**) → B (execute) → C (close report, `ACTIVE_CYCLE`, user guide). See `CLAUDE.md`.
- **Deploys:**
  - Merging to `main` auto-deploys functions and hosting (`firebase-deploy.yml`).
  - **Rules and indexes never auto-deploy:** the human runs **Deploy Security Rules** (ADR-016). It shares a queue with the production deploy, so it waits for that deploy to finish.
- **Agent limits:**
  - No production credentials. Admin scripts and rules deploys are human steps.
  - Pushes go only to the session's assigned branch. Force-push is blocked: after a merge, restart the branch from `origin/main` and push a fast-forward.
- **Checks to run before pushing:**
  - `apps/customer`: `npx vitest run`, `npm run lint` (0 errors; 2 warnings are expected), `npm run build`
  - `apps/fsm`: `npx vitest run`, `npm run build`
  - `functions`: `npm run build`, `npx vitest run`
  - Rules (needs Java), from `apps/customer`:
    `npx -y firebase-tools@15 emulators:exec --only firestore,storage --project freshnest-aa51e "npx vitest run --config vitest.rules.config.ts"`
  - Admin screenshots (needs Java and `npm ci` in `functions/`): `npm run test:admin-visual` in `apps/customer`. Desktop baselines are in `e2e-admin/__screenshots__/desktop/`.
- **CI:** `firebase-preview.yml` runs path-filtered jobs (customer, fsm, functions, rules) plus CodeQL and the markdown link check, and posts preview URLs on the PR.
- **Never edit:**
  - accepted ADRs (ADR-016 and ADR-017 were accepted 2026-10-27);
  - `PERSONAS.md`;
  - secrets;
  - `firestore.rules` without human approval.
- **Human-maintained:** `COMPLIANCE.md` (v2.1 was updated on the human's instruction).

---

## 5. Where things are

| Need | File |
|---|---|
| Epic status and follow-ups | [`ACTIVE_CYCLE.md`](ACTIVE_CYCLE.md) |
| FSM spec vs. app: gaps, backlog, owner answers | [`gap-analysis/GAP_ANALYSIS_2026-10-27.md`](gap-analysis/GAP_ANALYSIS_2026-10-27.md) |
| Specs and plans | `projects/` and `plans/` |
| Close reports | `reports/` (latest: P3-E35, P3-E34, P3-E33, HOTFIX-06 to 09) |
| Decisions | `decisions/` (ADR-016 rules workflow, ADR-017 office roles) |
| Data model | [`firestore-schema.md`](firestore-schema.md) |
| Admin how-to (Team & roles, checklists, dispatch) | `../user-guide/admin-guide.md` |
| Role logic | `functions/src/lib/roles.ts` (server), `packages/shared/src/roles.ts` (apps) |
