# AGY Phase A — Planning Gate

**Epic:** $ARGUMENTS

You are entering Phase A of the AGY 3-Phase Gate for the Fresh Nest Co. project.

## Steps (execute in order — do not skip)

1. Read `docs/projects/$ARGUMENTS.md` for scope and acceptance criteria.
2. Read `docs/PERSONAS.md` — identify the primary persona(s) this epic serves. Name them explicitly. If you cannot name one, halt and ask the human before proceeding.
3. Read `docs/design-system.md`, `docs/firestore-schema.md`, and `docs/COMPLIANCE.md`.
4. Read `docs/ACTIVE_CYCLE.md` to understand current project state.

## Deliverable

Generate exactly **3 implementation strategies** and write them to `docs/plans/$ARGUMENTS_PLAN.md`.

Each strategy must include:
- **Name** — short label
- **Files changed** — explicit list of every file that would be created or modified
- **Persona impact** — how it serves each named persona
- **Risks** — what could go wrong
- **Schema audit** — does it require any new Firestore fields? If yes, list them and confirm they exist in `docs/firestore-schema.md`. Flag any invented fields as blockers.
- **Tailwind audit** — list any new CSS classes and confirm they use design-system tokens only

## Gate

After writing the plan file, output a short summary of the 3 strategies and their key trade-offs.

**HALT. Do not write any implementation code. Wait for human approval of one strategy before proceeding.**
