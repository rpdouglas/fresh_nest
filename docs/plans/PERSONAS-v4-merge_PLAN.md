# PERSONAS v4 Merge Plan
**Created:** 2026-06-18  
**Status:** APPROVED — grill-me interview complete  
**Scope:** Merge docs/reports/freshnest-staff-personas.md into docs/PERSONAS.md

---

## Decisions (from grill-me interview)

| Question | Decision |
|---|---|
| Owner name | **Lauren Arsenault** — SP1 is canonical; P12 "Sarah" retired |
| P7 Carla / P9 Mike / P10 Ahmed | **Retained as full personas** — constraints are qualitatively distinct |
| Numbering convention | **P7–P12 preserved**; new personas are P13, P14, P15 |

---

## Resulting Persona Set

### Customer (unchanged — P1–P6)
No changes. P1 Diane through P6 Gallagher are immutable.

### Staff (P7–P15)

| ID | Name | Source | Action |
|---|---|---|---|
| P7 | Carla | PERSONAS.md P7 only | Keep as-is — no SP equivalent |
| P8 | Jasmine Beausoleil | P8 + SP2 | **Merge** — SP2 human profile + P8 hard constraints |
| P9 | Mike | PERSONAS.md P9 only | Keep as-is — no SP equivalent |
| P10 | Ahmed | PERSONAS.md P10 only | Keep as-is — no SP equivalent |
| P11 | Brenda Côté | P11 + SP3 | **Merge** — SP3 human profile (French-dominant lead) + P11 photo constraints |
| P12 | Lauren Arsenault | P12 + SP1 | **Merge + rename** — SP1 admin/operations profile + P12 compliance constraints; rename from "Sarah" |
| P13 | Marcus Oakes | SP4 only | **Add** — new; part-time student / OSAP earnings cap |
| P14 | Sylvie Pilon | SP5 only | **Add** — new; primary caregiver returning to work |
| P15 | Daniel Swamp | SP6 only | **Add** — new; Akwesasne community member as employee |

---

## Execution Steps

### Step 1 — Upgrade P8 (Jasmine)
- Add SP2's human profile block (grew up in Cornwall, first service job, Android phone, retail background, mobile-only)
- Retain all P8 Firestore fields, conflict engine spec, and acceptance test
- Merge persona quotes (keep both or select strongest)
- Add SP2 persona test alongside P8 acceptance test

### Step 2 — Upgrade P11 (Brenda Côté)
- Add SP3's human profile (Snye QC, 8 years experience, French-primary, commutes from Snye)
- Retain all P11 photo requirements (requiresPhoto, metadata, storage, dispute review)
- Add French-language requirement to P11 feature requirements table
- Merge acceptance tests

### Step 3 — Rename + upgrade P12 (Lauren Arsenault, formerly Sarah)
- Replace all instances of "Sarah" with "Lauren Arsenault" within the P12 section
- Add SP1's human profile (founder, handles everything alone, 10-minute admin windows, community values)
- Retain all P12 compliance requirements (payRateSnapshot, audit log, terms tracking, export)
- Add SP1 operational requirements (staff registration < 3 min, dispatch board, onboarding checklist UI, magic link trigger)
- Merge acceptance tests

### Step 4 — Add P13 Marcus Oakes
- Full SP4 profile as written, renumbered to P13
- Feature requirements: blocked window self-management, earnings safety bar (OSAP), shift board, SMS notifications, mobile check-in

### Step 5 — Add P14 Sylvie Pilon
- Full SP5 profile as written, renumbered to P14
- Feature requirements: day-before SMS reminder, visual step-by-step checklist, plain-language error states, positive completion screen, availability flag

### Step 6 — Add P15 Daniel Swamp
- Full SP6 profile as written, renumbered to P15
- Feature requirements: Cornwall Island transit buffer, earnings export, role/career display, Kanien'kéha prohibition (reinforced)

### Step 7 — Update Persona Index table
- Add P13–P15 rows to the Staff-Side Personas index table

### Step 8 — Update Cross-Persona Requirements Matrix
- Add P13 Marcus, P14 Sylvie, P15 Daniel columns to the staff matrix
- Update P11 Brenda row to reflect French requirement
- Update P12 Lauren row (was Sarah)

### Step 9 — Update Conflict Resolution Rules
- Add note that P13–P15 share the same hard-constraint hierarchy as P7–P12
- No new rules needed — existing priority order covers the new personas

### Step 10 — Update CLAUDE.md persona table
- Add P13 Marcus, P14 Sylvie, P15 Daniel rows
- Rename "Sarah" → "Lauren Arsenault" in P12 row
- Bump version reference in "What Changed" header

### Step 11 — Bump version to 4.0
- Header: Version 4.0, Updated 2026-06-18
- "What Changed in v4" section: documents the merge and P13–P15 additions

---

## Files Changed
1. `docs/PERSONAS.md` — primary output (upgrade-and-extend)
2. `CLAUDE.md` — persona table update only (P13–P15 added, P12 renamed)

## Files NOT changed
- `docs/reports/freshnest-staff-personas.md` — source material; retained as-is in reports/
- Any ADR files
- Any epic spec files

---

## Constraints
- PERSONAS.md is marked "Human-defined — AI agents READ ONLY." Human has explicitly authorized this merge.
- No AI-generated Kanien'kéha content anywhere in the merged file (P15 Daniel constraint).
- All UI strings referenced in persona feature requirements must still map to existing t() keys — no new i18n keys are being added here, this is documentation only.
