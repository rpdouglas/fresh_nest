---
epic: P3-E34
title: Task Lists on Scheduled Jobs — Plan
strategy: 2
approved: 2026-10-27
---

# P3-E34 PLAN — Task Lists on Scheduled Jobs

**Phase A written:** 2026-10-27 · **Status:** ✅ Strategy 2 approved 2026-10-27 — Phase B next
**Spec:** [`../projects/P3-E34.md`](../projects/P3-E34.md)

## Personas
| Persona | Impact |
|---|---|
| **P12 Lauren (primary)** | Picks or builds the right task list for each job, from the Dispatch Board or the booking panel. |
| **P6 Gallagher** | Turnover-specific lists per property, with photo proof. |
| **P11 Brenda** | Sees the exact list in French; mandatory photo tasks are kept. |
| **P10 Ahmed** | Every task keeps its icon. |
| **P1 Diane** | A recurring client keeps the same list on every visit. |

## Schema audit (all strategies)
- **No `firestore.rules` change:**
  - admins can already create and update `jobs`, `bookings` and `checklistTemplates`;
  - cleaners' writable job keys stay `status, checkedInAt, checkedInGeo, completedAt, checklistCompletions, photos`.
- **Existing fields reused:**
  - `jobs.checklistTemplate`: template ID;
  - `checklistTemplates.{name, serviceType, tasks, active}`.
- **New fields** are listed per strategy below. All are optional, so older documents stay valid. They are documented in `firestore-schema.md` in Phase C.
- **Doc drift fix:** §8 task shape → `{ id, labelEn, labelFr, icon, requiresPhoto, photoPhase }`, matching the code.

---

## Strategy 1 — Pick by ID (smallest)
- **Admin:**
  - a **Checklist** select on the Dispatch Board job card and in `BookingDetailPanel` (for the booking's job);
  - it writes `jobs.checklistTemplate = <templateId>`.
- **"New list on the fly":** opens the existing template editor in an `AdminDialog`. It saves a new `checklistTemplates` document with **`adHoc: true`** (new field), which is hidden from the saved-list library and the auto-match, and attaches its ID.
- **FSM:** no change, since it already reads the template by ID.
- **Recurring:** not covered. Renewals still auto-match by service type.

**Files:**
- `DispatchBoard.tsx`, `BookingDetailPanel.tsx`, `ChecklistTemplateManager.tsx` (extract the editor);
- a new `ChecklistPicker.tsx`, `firestore.ts`, `jobs.ts` (skip `adHoc` in auto-match);
- `en.json` / `fr.json`.

**Pros:** small; no FSM change.

**Cons:**
- **Gap 3 stays:** editing a saved list still rewrites past and current jobs, so photo proof can mismatch (P12 audit-trail risk).
- One-off lists pile up as hidden templates.
- No recurring support.

**Risk:** low code risk; ongoing data-integrity risk.

---

## Strategy 2 — Snapshot tasks onto the job (recommended)
**New optional fields:**
- `jobs.checklistTasks: ChecklistTask[]`: the tasks copied onto the job;
- `jobs.checklistName: string`;
- `jobs.checklistSource: 'auto' | 'template' | 'custom'`;
- `bookings.checklistTemplateId: string | null`: per-booking choice for recurring work.

**Behaviour:**
- **Job creation** (`functions/src/jobs.ts`):
  - resolve the template from `booking.checklistTemplateId` if set, else by service type as today;
  - **copy its tasks** into `checklistTasks` with `checklistSource: 'auto'` or `'template'`;
  - keep writing `checklistTemplate` (ID) for traceability.
- **Admin "Checklist" control** on the Dispatch Board job card and `BookingDetailPanel` opens a `ChecklistDialog` (on P3-E33's `AdminDialog`; full screen on phones, sticky Save):
  - **Saved list:** choose a list, preview its tasks, attach. This copies the tasks.
  - **Custom:** start blank or "start from saved list", then add, remove or reorder tasks (reuses the template editor's task row) and attach as `checklistSource: 'custom'`.
  - **"Save as a new saved list"** checkbox, plus a name. It creates a normal `checklistTemplates` document, so it's reusable later.
  - **"Use this list for future visits"** (bookings with a recurring `frequency`) sets `bookings.checklistTemplateId`.
  - **Disabled** when the job is `in_progress`, `completed` or `cancelled`, with the reason shown.
- **Renewals:** `renewals.ts` copies `checklistTemplateId` to the new booking, so the next job inherits the choice.
- **FSM** `JobPage.tsx`:
  - use `job.checklistTasks` when present (no template subscription);
  - fall back to the live template for older jobs.
- **Optional backfill script** (dry-run by default, like the email backfill): copy the current template tasks onto open jobs that have no snapshot.

**Files:**
- **New:** `ChecklistDialog.tsx`, `ChecklistTaskEditor.tsx` (extracted from `ChecklistTemplateManager`), `functions/scripts/backfill-job-checklists.cjs`.
- **Changed:** `DispatchBoard.tsx`, `BookingDetailPanel.tsx`, `ChecklistTemplateManager.tsx` (uses the extracted editor; no visual change), `firestore.ts`, `types` (customer, FSM, shared), `functions/src/jobs.ts`, `scheduled/renewals.ts`, `apps/fsm/src/pages/JobPage.tsx`, `en.json` / `fr.json` (customer + FSM if needed), `firestore-schema.md`, admin guide, FSM guide.
- **Tests:**
  - unit tests for the dialog, the snapshot and the guardrail;
  - functions tests for job creation with or without `checklistTemplateId` and for the renewal carry-over;
  - an FSM test for the snapshot-first render;
  - phone and desktop checks in the `e2e-admin` harness.

**Pros:**
- Closes all 5 gaps.
- The job's checklist is immutable once attached, matching P12's immutable rate snapshots.
- No hidden one-off templates.
- Recurring clients keep their list.

**Cons:**
- Touches Functions, so a deploy is needed.
- Adds 4 optional fields.
- Needs the FSM fallback path.

**Risk:** medium. Completions are keyed by `taskId`, so swapping a list after completions exist would orphan them. The guardrail blocks swaps once the job has started.

---

## Strategy 3 — Composable lists (base + add-on lists + per-job extras)
- Everything in Strategy 2, plus saved lists of type **base** or **add-on**:
  - e.g. base "Standard Clean", plus add-ons "Pets", "Fridge interior" and "Airbnb restock".
  - A job's list is the base plus any add-ons plus one-off extra tasks, merged and de-duplicated by task ID.
- Auto-attach add-ons from booking `addOns[]` (e.g. inside-fridge add-on → "Fridge interior" list).
- **New fields:** `checklistTemplates.kind: 'base' | 'addon'`, `checklistTemplates.addOnKey`, `jobs.checklistParts[]`.

**Pros:** the least list duplication; add-ons booked by the client become tasks automatically.

**Cons:**
- The largest change: merge rules, ordering and conflicts.
- More admin UI.
- The add-on mapping needs your input on which add-on maps to which tasks.

**Risk:** medium–high. It can be layered on Strategy 2 later without rework.

---

## Recommendation
**Strategy 2.**
- It does exactly what was asked (saved lists plus on-the-fly lists, attached to scheduled jobs).
- It fixes the "editing a template rewrites past jobs" integrity bug.
- It covers recurring clients.

Strategy 3's add-on composition can follow as its own epic.

## Decisions for the human
1. **Strategy:** 1, 2 (recommended) or 3?
2. **What "scheduled jobs" covers:** individual dispatched jobs **and** the recurring choice per booking? Recommended: both.
3. **Where to attach:** Dispatch Board job card **and** booking detail panel? Recommended: both. Should the New Booking dialog (phone-ins) also get a checklist choice? Recommended: yes, as an optional field.
4. **Lead cleaner edits:** should a lead (P11) be able to add a task on site? Recommended: **no** for this release. It needs a rules change and human approval.
5. **Backfill:** snapshot tasks onto existing open jobs (dry-run first)? Recommended: yes, scheduled jobs only.

## Human decisions (2026-10-27)
1. **Strategy 2.**
2. **Scope:** the chosen list goes on the job, plus an optional "Use this list for future visits" (`bookings.checklistTemplateId`, carried by renewals).
3. **Placement:** Dispatch Board job card, booking detail panel and the New Booking dialog.
4. **Lead cleaner edits:** no. Admins only; no rules change.
5. **Backfill:** yes, open jobs only (not `completed` or `cancelled`). Dry run by default.

## Phase B checklist (once approved)
1. Extract the task editor from `ChecklistTemplateManager`. Run the P3-E33 desktop screenshot guard; it must be unchanged.
2. Implement the strategy: Functions → admin UI → FSM fallback.
3. Run Brand_Auditor, Data_Steward (new optional fields only) and Linguistic_Auditor.
4. Run `npm run build && npm run lint` for customer, FSM and functions; unit, functions and rules tests; `test:admin-visual`.
5. Deploy Functions per CLAUDE.md Phase B step 6. No rules or index change is expected; confirm that no composite index is needed.
6. Phase C: schema doc, admin and FSM guides, close report, `ACTIVE_CYCLE.md`.
