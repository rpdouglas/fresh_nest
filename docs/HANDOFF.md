# Handoff — where things stand

**Updated:** 2026-10-28 · **`main`:** `d95d430` (after PR #51)
**For:** whoever picks up next, a person or an AI agent (Claude Code, Antigravity / Gemini CLI). `GEMINI.md` is a link to `CLAUDE.md`, so both agents read the same rules.

Read in this order: `CLAUDE.md` → this file → [`ACTIVE_CYCLE.md`](ACTIVE_CYCLE.md) → [`gap-analysis/GAP_ANALYSIS_2026-10-27.md`](gap-analysis/GAP_ANALYSIS_2026-10-27.md) (sections 5–7) → the spec and plan for the epic you pick up.

---

## 1. Completed in this cycle

| Item | What | PRs |
|---|---|---|
| P3-E35 + HOTFIX-10 | Owner/Manager roles; legacy `admin` retired; sign-in waits for the role and self-heals via `syncMyRole` | #40–#42, #47 |
| P3-E36 (W0-2) | Settings & Policies tab: 24 settings in `settings/policy` with version history; Owner edits, Managers read; buffers, ODSP limit and caution threshold wired live | #49 |
| ADR-018 | Security rules and indexes deploy on merge after the emulator tests pass | #48 |
| P3-E32 | Public before/after gallery live (`SHOW_GALLERY = true`, real photos); CSP allows Storage images | #50, #51 |
| Architecture | Customer bundle chunking, smaller PWA precache; shared scheduling/eligibility code in `packages/shared/src/domain/` synced into `functions/src/shared/` (`functions/scripts/sync-shared.cjs`) | #46 |
| Customer policies | Late fee, lockout and 24 h complaint wording in the FAQ and touchpoints (no amounts shown — P3-E29) | #44 |

### P3-E35 & HOTFIX-10 — Office roles (`owner`, `manager`) & self-healing role sync
- **PRs #40, #41, #42, #47:** Merged and deployed to production; security rules (`all`) deployed.
- **Self-healing on sign-in (`syncMyRole`):** Any pre-approved Owner/Manager, staff member, or legacy `admin` account automatically reconciles its custom claim to `owner` / `manager` / `supervisor` / `staff` on sign-in via `waitForRoleClaim` + `syncMyRole`. Lauren (`freshnestcompany2023@gmail.com`) verified sign-in as Owner on 2026-10-27.

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
| H2 | Business email (Zoho / Resend / DNS). **All app emails still fail.** The owner SMS alert covers new quote requests in the meantime | ACTIVE_CYCLE F1, P3-E30 |
| H3 | Confirm `OWNER_PHONE` for Cloud Functions | F2 |
| H4 | Run the backfills: `backfill-lowercase-booking-emails.cjs` (HOTFIX-05) and `backfill-job-checklists.cjs` (P3-E34). Dry run first, then `--apply` | F3, P3-E34 row |
| H6 | Owner answers still open: **rates** for deep, move-out, post-construction and organizing; Lead/Trainee billing; whether breaks are billed; **island travel times**. Late-cancellation and lockout **fee amounts** and the **backup emergency contact** can now be entered by an Owner in Admin → Settings & Policies (fees default to $0) | Gap analysis §7, P3-E36 |
| H7 | Optional: a dedicated service account so agent sessions can run admin scripts (roles: Firebase Authentication Admin + Cloud Datastore User; key stored as env var `FRESHNEST_SA_JSON` in the cloud environment settings). Rules deploy through CI on merge either way (ADR-018) | F16 |
| H8 | Re-sync `firestore.dev.rules` with production. The dev rules still let the office create staff docs from the app; production blocked that in P3-E27-A2. Needs human approval (rules) | F15 |

---

## 3. What to build next (owner-approved order)

All four "Now" defects (N-1 to N-4) are fixed and deployed; W0-1 (roles) and W0-2 (settings) are done. Remaining wave 0, per gap analysis §5:

1. **W0-3 Audit everywhere** (next; Phase A being discussed 2026-10-28): status, assignment, checklist, staff and template changes, each with before/after values. Role and policy changes are already audited (`role_change`, `policy_change`).
2. **W0-5** Scheduled Firestore export and a restore drill; budget alerts. Do before real data replaces the test data.
3. **W0-4** (partly done in #46: shared scheduling module): still needs the ADR for integer cents and time zones, and the Nov 1 DST fixtures. Note the new fee settings are whole dollars (`lateCancellationFeeDollars`) — reconcile with the cents decision.
4. **W0-6** Server-checked schedule write path (`applyScheduleChange` with `rev`). Depends on W0-4.

Then wave 1 (clients, sites, employees, availability, agreements, Camelo import). The older Phase 3 backlog (P3-E27 onboarding B2/C/D, P3-E10, P3-E15…) still sits in `ACTIVE_CYCLE.md`; suggestion pending owner decision: fold P3-E27's remaining parts into W1-3.

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
  - **Rules and indexes also deploy on merge** (ADR-018, superseding ADR-016): the `rules` job runs the emulator rules tests and deploys only if they pass. Merging a PR that touches `firestore.rules` is therefore the human approval — say so clearly in the PR. `deploy-rules.yml` remains for manual re-deploys.
- **Agent limits:**
  - No production credentials. Admin scripts (backfills, migrations) are human steps.
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
  - accepted ADRs (ADR-016, ADR-017 and ADR-018 are accepted; ADR-018 supersedes ADR-016);
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
| Close reports | `reports/` (latest: P3-E36, P3-E35, HOTFIX-10, P3-E32) |
| Decisions | `decisions/` (ADR-017 office roles, ADR-018 rules deploy on merge) |
| Data model | [`firestore-schema.md`](firestore-schema.md) |
| Admin how-to (Team & roles, checklists, dispatch) | `../user-guide/admin-guide.md` |
| Role logic | `functions/src/lib/roles.ts` (server), `packages/shared/src/roles.ts` (apps) |
