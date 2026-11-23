---
epic: P3-E41
title: One Master Solution — move FNC Landing into Fresh Nest (apps/ops) — Plan
strategy: pending
---

# P3-E41 PLAN — Move FNC Landing into Fresh Nest

**Phase A written:** 2026-11-23 · **Status:** 🔄 Awaiting human approval of one strategy
**Spec:** [`../projects/P3-E41.md`](../projects/P3-E41.md) · **ADR:** [`../decisions/ADR-022-merge-fnc-landing-into-fresh-nest.md`](../decisions/ADR-022-merge-fnc-landing-into-fresh-nest.md)
**Option B (one repo, one project, Camelo phased out) is approved.** These three strategies are ways to do its Phase 1.

## Personas
| Persona | Impact |
|---|---|
| **P12 Lauren (primary)** | One sign-in, one office list; payroll and invoices unchanged to the cent; ops data under backups and audit |
| **P16 Ryan (primary)** | Manager role works in the ops hub too; no separate allow-list |
| **P7 Carla / P13 Marcus** | Hours they are paid on unchanged (pay gate) |
| **Cleaners (P8, P11, P14, P15)** | My week, clock-in and photos keep working after one sign-in on the new address |
| **P3 Margaret** | Existing ops a11y and tests keep passing |

## Common to all three strategies
- **Source:** `rpdouglas/blurb` at the commit tagged `live` (what fnc-reports serves). Record the commit SHA in the close report.
- **Freeze `blurb` first:** fixes only; add decision `0047-merged-into-fresh-nest.md` there; it reverses 0046.
- **Same `CAMELO_TOKEN`** in `freshnest-aa51e` Secret Manager (human step). Session and stored-token keys are derived from it (HKDF, `functions/src/who.ts`, `functions/src/routes/clock.ts`), so `scheduleCleanerTokens` stays decryptable. Cleaners still sign in once, because browser sessions are kept per address.
- **Data copy script** `scripts/ops-migration/copy-schedule-collections.cjs`: reads `lilypad-strategy-design/(default)` `schedule*`, writes `freshnest-aa51e/(default)` (or `freshnest-dev`), `--dry-run` default, prints per-collection counts before/after, idempotent (doc IDs preserved). Photo bucket copy with `gcloud storage cp -r` plus a count check, written into the runbook. Human runs `--apply` (agent sessions have no production credentials, `HANDOFF.md`).
- **Rules:** `schedule*` and photo records are server-only: `allow read, write: if false` (the function uses the Admin SDK). Storage rules deny the new photo bucket to clients. Rules changes need explicit human sign-off in the PR (ADR-018).
- **Parallel run:** one full pay period, Camelo writes from the new site only after switch day; the old site is set read-only (`CAMELO_WRITES` off in `blurb`) on switch day.
- **Pay gate evidence:** a comparison sheet (per cleaner payroll hours, per client invoice totals) for the period, attached to the close report.
- **Runbook:** `docs/runbooks/ops-migration.md`: secrets, domain, bucket, copy, switch day, rollback (point users back to fnc-reports, which keeps working until the gate).

### Schema audit (all strategies)
No new fields are invented. The `schedule*` collections and the photo records are **existing FNC Landing collections** whose shapes are defined in `blurb/functions/src/firestore.ts` and `stores.ts`. They are **not yet in `docs/firestore-schema.md`**, so a new section 17 "Ops collections (from FNC Landing)" documents them **as they are** before any code here writes them. Strategy 3 changes their shapes (money in cents, ADR-020) and so needs a full schema review. **Blocker:** none of them may be written in `freshnest-aa51e` until section 17 is merged.

### Tailwind audit (all strategies)
`apps/ops` arrives with **Tailwind v4** and its own CSS-variable tokens (`--surface`, `--ink`, `--nest-teal`… from FNC decision 0023, which are the Fresh Nest design system's colours). `CLAUDE.md` says "Tailwind v3, not v4", so S1 and S2 need ADR-022 to grant a scoped exception for `apps/ops` only. No v4 syntax (`@import "tailwindcss"`, `@theme`) may appear in `apps/customer` or `apps/fsm`; Brand_Auditor checks that. S3 converts to v3 and the token names in `design-system.md`.

---

## Strategy 1 — Lift and shift (no behaviour change)

Move the code as it is, with its own function codebase, its own Google allow-list, and the same collection names. Only the project and address change.

**Files changed**
- `apps/ops/**` (new) — `blurb/web` unchanged except Firebase config → `freshnest-aa51e`, app name/links
- `functions-ops/**` (new) — `blurb/functions` unchanged; codebase `ops`, function `scheduleApi`, `PHOTO_BUCKET` → new bucket name
- `apps/ops/e2e/**` (new) — `blurb/e2e` (pretend Camelo)
- `firebase.json` — functions codebase `ops`; hosting target `freshnest-ops` with `/api/*` rewrites and FNC's security headers
- `.firebaserc` — target `freshnest-ops` → site `freshnest-ops`
- `package.json` (root) — `apps/ops` workspace scripts (`dev:ops`, `build:ops`, `test:ops`); exclude `functions-ops` from workspaces if its TypeScript 7 / Zod pins clash
- `.github/workflows/firebase-deploy.yml` — build and test ops; deploy ops **only by manual dispatch**
- `firestore.rules`, `firestore.dev.rules`, `storage.rules` — deny `schedule*` and the photo bucket to clients
- `apps/customer/test/firestore-rules.test.ts` — `schedule*` denied tests
- `scripts/ops-migration/copy-schedule-collections.cjs` (new)
- Docs: `docs/firestore-schema.md` §17, `docs/COMPLIANCE.md`, `docs/runbooks/ops-migration.md` (new), `user-guide/admin-guide.md`, `user-guide/staff-guide.md`, `docs/HANDOFF.md`, `docs/decisions/fnc/` (FNC decisions copied as read-only history)

**Persona impact:** lowest risk to P7/P13 pay. P12/P16 still use a separate Google allow-list (`SCHEDULE_EDITORS`), so the "one sign-in" goal is not met.

**Risks:** two office lists remain until a follow-up; a second functions package and Tailwind v4 make the monorepo heavier; dependency clashes (TypeScript 7, Vite 8 in ops vs the root versions) need per-workspace pins.

**Size:** M (about 1 sprint plus the pay period).

---

## Strategy 2 — Lift and shift, with one office identity ★ recommended

Strategy 1, plus the ops function trusts **Fresh Nest Firebase Auth**: office access means an Owner or Manager custom claim (ADR-017), and the Google allow-list goes. Cleaners keep the Camelo-code session (`c1.` tokens) for this phase. Payroll, billing and Camelo code are untouched.

**Files changed** (in addition to Strategy 1's list)
- `functions-ops/src/who.ts` — `requireOffice`: verify the Firebase ID token issued by `freshnest-aa51e` and accept `role in ['owner','manager']`; `requireStaff` unchanged for `c1.` cleaner sessions; `SCHEDULE_EDITORS` removed
- `functions-ops/src/core.ts`, `functions-ops/src/dev.ts` — dev sign-in emulates an Owner claim
- `functions-ops/src/*.test.ts` — office-claim tests (owner ✓, manager ✓, supervisor/staff/customer ✗, no token 401)
- `apps/ops/src/api.ts`, `apps/ops/src/Root.tsx` (or its sign-in component) — Firebase Auth sign-in of `freshnest-aa51e` (Google provider enabled, plus email link already used by the admin portal) instead of Google Identity Services
- `apps/ops/e2e/**` — sign-in fixtures as Owner / Manager
- `apps/customer/src/components/admin/AdminSectionNav.tsx` (and `en.json` / `fr.json`) — "Operations" link to the ops hub; ops hub header links back
- Console (human, runbook): enable the Google provider in `freshnest-aa51e` Auth; add `ops.freshnestco.ca` to authorised domains
- `docs/decisions/ADR-022-…md` — Accepted with this strategy; `docs/firestore-schema.md` §5 notes `admins` now also gates the ops hub

**Persona impact:** P12 and P16 sign in once with the role they already have, and the Team & roles tab controls both apps (Owner-only grants, P3-E35). No change to pay figures.

**Risks:** a sign-in change in the function that guards payroll, mitigated by the claim tests, by the browser tests, and by checking the 401/403 matrix live. Accounts must exist in `freshnest-aa51e` for the office (Lauren's does; Ryan's must be granted Manager first). Also Strategy 1's dependency and Tailwind risks.

**Size:** M–L (about 1.5 sprints plus the pay period).

---

## Strategy 3 — Re-platform onto the Fresh Nest stack during the move

Move and convert in one go: Tailwind v3 and `design-system.md` tokens, routes rewritten as callables in `functions/`, react-i18next with EN/FR on every screen, shared `packages/shared` types, money in integer cents (ADR-020), `schedule*` renamed `ops*`.

**Files changed:** everything in Strategy 2, but `functions-ops/` is folded into `functions/src/ops/**` (callables), `apps/ops/src/**` is rewritten for v3 classes and `t()` strings (`apps/ops/src/i18n/locales/en.json`, `fr.json`), the payroll and billing modules (`web/src/lib/billing.ts`, `invoicing.ts`, payroll) are ported to cents, the copy script converts shapes, `packages/shared/src/domain/*` gains ops types, and `firestore-schema.md` gets new `ops*` definitions.

**Persona impact:** best end state for P11/P14 (French) and for the team (one stack).

**Risks:** high. The pay and invoice code is rewritten in the same step it is moved, so a mismatch at the pay gate is hard to trace to a cause. Much larger review surface; most of this work would be redone anyway when Camelo is replaced (phase 3).

**Size:** XL (3+ sprints plus the pay period).

---

## Comparison
| | S1 Lift and shift | S2 + one office identity ★ | S3 Re-platform |
|---|---|---|---|
| One sign-in for the office | No | **Yes** | Yes |
| Pay/billing code changed | No | No | **Yes** |
| Tailwind v4 exception needed | Yes | Yes | No |
| French on ops screens | No | No | Yes |
| Size | M | M–L | XL |

## Recommendation
**Strategy 2.** It meets the spec's "one sign-in" goal without touching the code that computes pay and invoices. Stack conversion (Tailwind v3, French office screens, cents) is cheaper later, when each report is rewritten anyway to read Fresh Nest data instead of Camelo (phase 3).

## Execution order (for the approved strategy)
1. Freeze `blurb` (decision 0047) · 2. ADR-022 Accepted · 3. Schema §17 + rules + rules tests (PR 1, human rules sign-off) · 4. Code import + hosting + function + CI (PR 2) · 5. Identity change (PR 3, S2) · 6. Human: secrets, Google provider, domain, bucket · 7. Copy to `freshnest-dev`, verify; then `(default)` · 8. Deploy, live 401/403 checks · 9. Switch day + parallel pay period · 10. Pay gate comparison → Phase C close.

**HALT — awaiting human approval of one strategy.**
